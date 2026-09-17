/**
 * verificationAdminController.js
 * ==============================
 * Admin endpoints for technician verification workflow.
 * 
 * Endpoints:
 *   GET   /api/admin/verifications                    → list verification requests
 *   GET   /api/admin/verifications/stats              → counts by status
 *   GET   /api/admin/verifications/:id                → single verification detail
 *   PATCH /api/admin/verifications/:id/approve        → approve entire verification
 *   PATCH /api/admin/verifications/:id/reject         → reject with reason
 *   PATCH /api/admin/verifications/:id/request-more   → request additional docs
 *   PATCH /api/admin/verifications/:id/documents/:docId → approve/reject a single doc
 * 
 * @version 1.1.0 – Added email notifications on approve/reject
 */

const Technician = require('../../models/Technician');
const User = require('../../models/User');
const notify = require('../../services/notificationService');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const handleError = (res, error, message, status = 500, code = 'SERVER_ERROR') => {
  console.error('[verificationAdminController]', message, error);
  res.status(status).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
};

const decorateVerification = (tech) => {
  if (!tech) return tech;

  const docs = tech.verifiedDocuments || [];
  const totalDocs = docs.length;
  const pendingDocs = docs.filter((d) => d.status === 'pending').length;
  const verifiedDocs = docs.filter((d) => d.status === 'verified').length;
  const rejectedDocs = docs.filter((d) => d.status === 'rejected').length;

  const missingBasics = [];
  if (!tech.address?.city) missingBasics.push('Address');
  if (!tech.profileHeadline) missingBasics.push('Profile headline');
  if (!tech.aboutMe) missingBasics.push('About me');
  if (!tech.mainCategory) missingBasics.push('Main category');

  return {
    ...tech,
    verificationSummary: {
      overallStatus: tech.verificationStatus,
      totalDocs,
      pendingDocs,
      verifiedDocs,
      rejectedDocs,
      missingBasics,
      hasDocuments: totalDocs > 0,
      isComplete: missingBasics.length === 0 && totalDocs > 0,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────────────────────
exports.listVerifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'pending',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const limitNum = Math.min(100, parseInt(limit) || 20);

    const filter = {};

    if (status && status !== 'all') {
      filter.verificationStatus = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const userIds = await User.find({
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
      }).distinct('_id');

      filter.$or = [
        { businessName: regex },
        { userId: { $in: userIds } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [techs, total] = await Promise.all([
      Technician.find(filter)
        .populate('userId', 'firstName lastName email phone profileImage createdAt')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Technician.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: techs.map(decorateVerification),
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch verifications.');
  }
};

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [pending, verified, rejected, total] = await Promise.all([
      Technician.countDocuments({ verificationStatus: 'pending' }),
      Technician.countDocuments({ verificationStatus: 'verified' }),
      Technician.countDocuments({ verificationStatus: 'rejected' }),
      Technician.countDocuments(),
    ]);

    const pendingWithDocs = await Technician.countDocuments({
      verificationStatus: 'pending',
      'verifiedDocuments.0': { $exists: true },
    });

    res.json({
      success: true,
      data: {
        total,
        pending,
        verified,
        rejected,
        pendingWithDocs,
        pendingWithoutDocs: pending - pendingWithDocs,
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to load verification stats.');
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────
exports.getVerification = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone profileImage createdAt')
      .lean();

    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    res.json({
      success: true,
      data: decorateVerification(tech),
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch verification.');
  }
};

// ─────────────────────────────────────────────────────────────
// APPROVE (entire verification)  ← WITH NOTIFICATION
// ─────────────────────────────────────────────────────────────
exports.approveVerification = async (req, res) => {
  try {
    const { notes } = req.body;

    const tech = await Technician.findById(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    if (tech.verificationStatus === 'verified') {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_VERIFIED',
        message: 'Technician is already verified.',
      });
    }

    tech.verificationStatus = 'verified';

    if (tech.verifiedDocuments?.length) {
      tech.verifiedDocuments.forEach((doc) => {
        if (doc.status === 'pending' || doc.status === 'rejected') {
          doc.status = 'verified';
          doc.verifiedAt = new Date();
          if (notes) doc.remarks = notes;
        }
      });
    }

    await tech.save();

    // ─── Send approval email (non-blocking) ────────────────
    try {
      const techUser = await User.findById(tech.userId).select('email firstName lastName');
      if (techUser?.email) {
        await notify.technicianVerificationApproved({
          technicianEmail: techUser.email,
          technicianName: `${techUser.firstName} ${techUser.lastName}`.trim(),
          notes: notes || '',
        });
        console.log(`📧 Verification approval email sent to ${techUser.email}`);
      }
    } catch (notifyErr) {
      console.error('Verification approval notification failed:', notifyErr.message);
    }

    res.json({
      success: true,
      message: 'Technician verified successfully.',
      data: {
        verificationStatus: tech.verificationStatus,
        verifiedAt: new Date(),
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to approve verification.');
  }
};

// ─────────────────────────────────────────────────────────────
// REJECT  ← WITH NOTIFICATION
// ─────────────────────────────────────────────────────────────
exports.rejectVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REASON',
        message: 'A rejection reason is required.',
      });
    }

    const tech = await Technician.findById(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    tech.verificationStatus = 'rejected';

    if (tech.verifiedDocuments?.length) {
      tech.verifiedDocuments.forEach((doc) => {
        if (doc.status === 'pending') {
          doc.status = 'rejected';
          doc.remarks = reason.trim();
        }
      });
    }

    await tech.save();

    // ─── Send rejection email (non-blocking) ───────────────
    try {
      const techUser = await User.findById(tech.userId).select('email firstName lastName');
      if (techUser?.email) {
        await notify.technicianVerificationRejected({
          technicianEmail: techUser.email,
          technicianName: `${techUser.firstName} ${techUser.lastName}`.trim(),
          reason: reason.trim(),
        });
        console.log(`📧 Verification rejection email sent to ${techUser.email}`);
      }
    } catch (notifyErr) {
      console.error('Verification rejection notification failed:', notifyErr.message);
    }

    res.json({
      success: true,
      message: 'Verification rejected.',
      data: { verificationStatus: tech.verificationStatus },
    });
  } catch (error) {
    handleError(res, error, 'Failed to reject verification.');
  }
};

// ─────────────────────────────────────────────────────────────
// REQUEST MORE INFO
// ─────────────────────────────────────────────────────────────
exports.requestMoreInfo = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_MESSAGE',
        message: 'A message is required to request more information.',
      });
    }

    const tech = await Technician.findById(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    tech.adminNotes = `[${new Date().toISOString()}] ${message.trim()}`;
    await tech.save();

    res.json({
      success: true,
      message: 'Information request sent to technician.',
      data: { adminNotes: tech.adminNotes },
    });
  } catch (error) {
    handleError(res, error, 'Failed to request more info.');
  }
};

// ─────────────────────────────────────────────────────────────
// APPROVE / REJECT A SINGLE DOCUMENT
// ─────────────────────────────────────────────────────────────
exports.updateDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const { status, remarks } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: 'Status must be "verified" or "rejected".',
      });
    }

    const tech = await Technician.findById(id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    const doc = tech.verifiedDocuments?.id(docId);
    if (!doc) {
      return res.status(404).json({ success: false, code: 'DOC_NOT_FOUND', message: 'Document not found.' });
    }

    doc.status = status;
    if (status === 'verified') {
      doc.verifiedAt = new Date();
    } else {
      doc.remarks = remarks || 'Rejected by admin';
    }

    await tech.save();

    res.json({
      success: true,
      message: `Document ${status}.`,
      data: { documentId: docId, status },
    });
  } catch (error) {
    handleError(res, error, 'Failed to update document.');
  }
};