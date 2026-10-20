/**
 * jobReviewAdminController.js
 * ===========================
 * Admin review of job posts. Every new job starts as "pending" and only
 * shows in Available Jobs once approved. Mounted at /api/admin/jobs.
 *
 *   GET   /            ?status=pending|approved|rejected|all &q= &page= &limit=
 *   GET   /stats       counts per status
 *   PATCH /:id/approve
 *   PATCH /:id/reject  { reason }   (emailed to the poster)
 *   PATCH /:id/takedown { reason? } (approved → rejected)
 */

const mongoose = require('mongoose');
const Job = require('../../models/Job');
const notify = require('../../services/notificationService');

const STATUSES = ['pending', 'approved', 'rejected', 'filled', 'expired', 'cancelled'];

const fail = (res, status, message, error) => {
  if (error) console.error('[jobReviewAdminController]', message, error);
  return res.status(status).json({ success: false, message });
};
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const posterName = (u) => `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'there';

const findJob = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    fail(res, 404, 'Job not found.');
    return null;
  }
  const job = await Job.findById(req.params.id).populate('clientId', 'firstName lastName email role');
  if (!job) fail(res, 404, 'Job not found.');
  return job;
};

/** GET /api/admin/jobs */
exports.list = async (req, res) => {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : req.query.status === 'all' ? null : 'pending';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filter = status ? { status } : {};
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
      filter.$or = [{ title: rx }, { mainCategory: rx }, { location: rx }];
    }
    const sort = status === 'pending' ? { createdAt: 1 } : { updatedAt: -1 };
    const [items, total] = await Promise.all([
      Job.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)
        .populate('clientId', 'firstName lastName email role phone')
        .lean(),
      Job.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
  } catch (error) {
    fail(res, 500, 'Failed to load jobs.', error);
  }
};

/** GET /api/admin/jobs/stats */
exports.stats = async (req, res) => {
  try {
    const rows = await Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    rows.forEach((r) => { if (r._id in counts) counts[r._id] = r.count; });
    res.json({ success: true, data: counts });
  } catch (error) {
    fail(res, 500, 'Failed to load job stats.', error);
  }
};

/** PATCH /api/admin/jobs/:id/approve */
exports.approve = async (req, res) => {
  try {
    const job = await findJob(req, res);
    if (!job) return;
    if (job.status !== 'pending') return fail(res, 400, `This job is ${job.status}, not waiting for review.`);
    job.status = 'approved';
    job.approvedAt = new Date();
    job.rejectionReason = '';
    // The 30 days a job stays open start when it's approved
    job.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await job.save({ validateModifiedOnly: true });

    notify.jobApproved({
      email: job.clientId?.email, name: posterName(job.clientId), title: job.title, jobId: String(job._id),
    }).catch(() => {});
    res.json({ success: true, message: 'Approved. The job is now in Available Jobs.', data: { _id: job._id, status: job.status } });
  } catch (error) {
    fail(res, 500, 'Failed to approve job.', error);
  }
};

const rejectWith = (allowedFrom, done) => async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim().slice(0, 500);
    if (!reason) return fail(res, 400, 'Please give the poster a reason, so they know what to fix.');
    const job = await findJob(req, res);
    if (!job) return;
    if (job.status !== allowedFrom) return fail(res, 400, `This job is ${job.status}.`);
    job.status = 'rejected';
    job.rejectionReason = reason;
    await job.save({ validateModifiedOnly: true });

    notify.jobRejected({
      email: job.clientId?.email, name: posterName(job.clientId), title: job.title, reason,
    }).catch(() => {});
    res.json({ success: true, message: done, data: { _id: job._id, status: job.status } });
  } catch (error) {
    fail(res, 500, 'Failed to update job.', error);
  }
};

/** PATCH /api/admin/jobs/:id/reject  { reason } */
exports.reject = rejectWith('pending', 'Rejected. The poster has been told why.');

/** PATCH /api/admin/jobs/:id/takedown  { reason } — remove an approved job */
exports.takedown = rejectWith('approved', 'Taken down. The poster has been told why.');
