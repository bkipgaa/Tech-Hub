/**
 * listingAdminController.js
 * =========================
 * Admin review of Stays & Spaces listings. New listings start as "pending"
 * and only appear in search once approved (and free or paid up).
 * Mounted at /api/admin/listings.
 *
 *   GET   /            ?status=pending|active|rejected|hidden|paused|all &q= &page= &limit=
 *   GET   /stats       counts per status
 *   PATCH /:id/approve
 *   PATCH /:id/reject  { reason }
 *   PATCH /:id/hide    { reason? }   take a live listing down
 *   PATCH /:id/unhide
 */

const mongoose = require('mongoose');
const Listing = require('../../models/Listing');
const notify = require('../../services/notificationService');
const listingPlan = require('../../utils/listingPlan');

const STATUSES = ['pending', 'active', 'paused', 'rejected', 'hidden'];

const handleError = (res, error, message, status = 500, code = 'SERVER_ERROR') => {
  if (status >= 500) console.error('[listingAdminController]', message, error);
  return res.status(status).json({ success: false, code, message });
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findListing = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    handleError(res, null, 'Listing not found.', 404, 'NOT_FOUND');
    return null;
  }
  const listing = await Listing.findById(req.params.id).populate('owner', 'firstName lastName email phone listingPlan');
  if (!listing) handleError(res, null, 'Listing not found.', 404, 'NOT_FOUND');
  return listing;
};

const ownerName = (o) => `${o?.firstName || ''} ${o?.lastName || ''}`.trim() || 'there';

/** GET /api/admin/listings */
exports.list = async (req, res) => {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : req.query.status === 'all' ? null : 'pending';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filter = status ? { status } : {};
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(escapeRegex(req.query.q.trim()), 'i');
      filter.$or = [{ title: rx }, { town: rx }, { estate: rx }, { county: rx }];
    }
    // Oldest waiting first for the review queue; newest first otherwise
    const sort = status === 'pending' ? { 'review.submittedAt': 1, createdAt: 1 } : { updatedAt: -1 };
    const [items, total] = await Promise.all([
      Listing.find(filter).sort(sort).skip((page - 1) * limit).limit(limit)
        .populate('owner', 'firstName lastName email phone')
        .select('-reminders')
        .lean(),
      Listing.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
  } catch (error) {
    handleError(res, error, 'Failed to load listings.');
  }
};

/** GET /api/admin/listings/stats */
exports.stats = async (req, res) => {
  try {
    const rows = await Listing.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    rows.forEach((r) => { if (r._id in counts) counts[r._id] = r.count; });
    res.json({ success: true, data: counts });
  } catch (error) {
    handleError(res, error, 'Failed to load listing stats.');
  }
};

/** PATCH /api/admin/listings/:id/approve */
exports.approve = async (req, res) => {
  try {
    const listing = await findListing(req, res);
    if (!listing) return;
    if (listing.status !== 'pending') {
      return handleError(res, null, `This listing is ${listing.status}, not waiting for review.`, 400, 'NOT_PENDING');
    }
    listing.status = 'active';
    listing.review = { ...listing.review?.toObject?.(), reviewedAt: new Date(), reviewedBy: req.admin?._id, rejectionReason: undefined };
    await listing.save({ validateModifiedOnly: true });

    const billing = listingPlan.listingBilling(listing, listing.owner);
    notify.listingApproved({
      email: listing.owner?.email,
      name: ownerName(listing.owner),
      title: listing.title,
      listingId: String(listing._id),
      live: billing.covered,
      price: listingPlan.PRICE_PER_LISTING,
    }).catch(() => {});

    res.json({
      success: true,
      message: billing.covered ? 'Approved. The listing is now live.' : 'Approved. It goes live once the lister pays for it.',
      data: { _id: listing._id, status: listing.status, live: billing.covered },
    });
  } catch (error) {
    handleError(res, error, 'Failed to approve listing.');
  }
};

/** PATCH /api/admin/listings/:id/reject  { reason } */
exports.reject = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim().slice(0, 500);
    if (!reason) return handleError(res, null, 'Please give the lister a reason, so they know what to fix.', 400, 'REASON_REQUIRED');
    const listing = await findListing(req, res);
    if (!listing) return;
    if (listing.status !== 'pending') {
      return handleError(res, null, `This listing is ${listing.status}, not waiting for review.`, 400, 'NOT_PENDING');
    }
    listing.status = 'rejected';
    listing.freeSlot = false; // gives the free slot back to the lister
    listing.activeUntil = listingPlan.listingActiveUntil(listing, listing.owner);
    listing.review = { ...listing.review?.toObject?.(), reviewedAt: new Date(), reviewedBy: req.admin?._id, rejectionReason: reason };
    await listing.save({ validateModifiedOnly: true });

    notify.listingRejected({
      email: listing.owner?.email,
      name: ownerName(listing.owner),
      title: listing.title,
      listingId: String(listing._id),
      reason,
    }).catch(() => {});

    res.json({ success: true, message: 'Rejected. The lister has been told why.', data: { _id: listing._id, status: listing.status } });
  } catch (error) {
    handleError(res, error, 'Failed to reject listing.');
  }
};

/** PATCH /api/admin/listings/:id/hide  { reason? } — take an approved listing down */
exports.hide = async (req, res) => {
  try {
    const listing = await findListing(req, res);
    if (!listing) return;
    if (!['active', 'paused'].includes(listing.status)) {
      return handleError(res, null, 'Only approved listings can be hidden.', 400, 'NOT_APPROVED');
    }
    listing.status = 'hidden';
    listing.review = { ...listing.review?.toObject?.(), reviewedAt: new Date(), reviewedBy: req.admin?._id,
      rejectionReason: String(req.body?.reason || '').trim().slice(0, 500) || undefined };
    await listing.save({ validateModifiedOnly: true });
    res.json({ success: true, message: 'Listing hidden from search.', data: { _id: listing._id, status: listing.status } });
  } catch (error) {
    handleError(res, error, 'Failed to hide listing.');
  }
};

/** PATCH /api/admin/listings/:id/unhide */
exports.unhide = async (req, res) => {
  try {
    const listing = await findListing(req, res);
    if (!listing) return;
    if (listing.status !== 'hidden') return handleError(res, null, 'This listing is not hidden.', 400, 'NOT_HIDDEN');
    listing.status = 'active';
    await listing.save({ validateModifiedOnly: true });
    res.json({ success: true, message: 'Listing restored.', data: { _id: listing._id, status: listing.status } });
  } catch (error) {
    handleError(res, error, 'Failed to restore listing.');
  }
};
