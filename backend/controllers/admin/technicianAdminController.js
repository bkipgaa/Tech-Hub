/**
 * technicianAdminController.js
 * ============================
 * Admin endpoints for managing technician profiles.
 * 
 * Endpoints:
 *   GET    /api/admin/technicians                  → paginated list with filters
 *   GET    /api/admin/technicians/stats            → aggregate stats for header
 *   GET    /api/admin/technicians/:id              → single technician (full profile)
 *   PATCH  /api/admin/technicians/:id              → update basic fields
 *   PATCH  /api/admin/technicians/:id/verify       → mark as verified
 *   PATCH  /api/admin/technicians/:id/reject       → reject verification
 *   PATCH  /api/admin/technicians/:id/suspend      → suspend (isActive = false)
 *   PATCH  /api/admin/technicians/:id/activate     → reactivate
 *   DELETE /api/admin/technicians/:id              → delete profile
 * 
 * @version 1.0.0
 */

const Technician = require('../../models/Technician');
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const { isPlanActive } = require('../../utils/subscriptionPlans');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const handleError = (res, error, message, status = 500, code = 'SERVER_ERROR') => {
  console.error('[technicianAdminController]', message, error);
  res.status(status).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
};

/**
 * Build a filter from query params.
 */
const buildFilter = (query) => {
  const { search, plan, verificationStatus, isActive, isAvailable } = query;
  const filter = {};

  if (plan && plan !== 'all') filter['subscription.plan'] = plan;
  if (verificationStatus && verificationStatus !== 'all') filter.verificationStatus = verificationStatus;
  if (isActive === 'true')  filter.isActive = true;
  if (isActive === 'false') filter.isActive = false;
  if (isAvailable === 'true')  filter.isAvailable = true;
  if (isAvailable === 'false') filter.isAvailable = false;

  return filter;
};

/**
 * Attach computed fields for display.
 */
const decorateTechnician = (tech, now = Date.now()) => {
  if (!tech) return tech;

  const plan = tech.subscription?.plan || 'free';
  const endDate = tech.subscription?.endDate;
  const trialEndDate = tech.subscription?.trialEndDate;

  const active = isPlanActive(plan, endDate, trialEndDate);

  let daysRemaining = null;
  if (plan !== 'free' && plan !== 'trial' && endDate) {
    daysRemaining = Math.max(0, Math.ceil((new Date(endDate).getTime() - now) / (1000 * 60 * 60 * 24)));
  }

  return {
    ...tech,
    subscriptionStatus: {
      plan,
      isActive: active,
      endDate: endDate || null,
      daysRemaining,
      autoRenew: tech.subscription?.autoRenew || false,
      visibilityRadius: tech.subscription?.planDetails?.visibilityRadius || 10,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────────────────────
exports.listTechnicians = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const limitNum = Math.min(100, parseInt(limit) || 20);

    const filter = buildFilter(req.query);

    // Search across business name and populated user fields
    const { search } = req.query;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      // Find matching user IDs first
      const userIds = await User.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { phone: regex },
        ],
      }).distinct('_id');

      filter.$or = [
        { businessName: regex },
        { mainCategory: regex },
        { userId: { $in: userIds } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [technicians, total] = await Promise.all([
      Technician.find(filter)
        .populate('userId', 'firstName lastName email phone profileImage status isVerified')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Technician.countDocuments(filter),
    ]);

    const now = Date.now();
    const data = technicians.map(t => {
      const decorated = decorateTechnician(t, now);
      return {
        _id: t._id,
        user: t.userId,
        businessName: t.businessName,
        mainCategory: t.mainCategory,
        serviceCategoriesCount: t.serviceCategories?.length || 0,
        profileCompletionPercentage: t.profileCompletionPercentage || 0,
        rating: t.rating,
        statistics: {
          completedJobs: t.statistics?.completedJobs || 0,
          totalJobs: t.statistics?.totalJobs || 0,
        },
        verificationStatus: t.verificationStatus,
        isActive: t.isActive,
        isAvailable: t.isAvailable,
        serviceRadius: t.serviceRadius,
        subscriptionStatus: decorated.subscriptionStatus,
        createdAt: t.createdAt,
        lastActive: t.lastActive,
      };
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch technicians.');
  }
};

// ─────────────────────────────────────────────────────────────
// STATS (for header cards)
// ─────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const nowMs = now.getTime();

    const allTechs = await Technician.find()
      .select('subscription verificationStatus isActive isAvailable isFeatured')
      .lean();

    const total = allTechs.length;
    const active = allTechs.filter(t => t.isActive).length;
    const suspended = allTechs.filter(t => !t.isActive).length;
    const available = allTechs.filter(t => t.isAvailable && t.isActive).length;
    const featured = allTechs.filter(t => t.isFeatured).length;

    const pendingVerification = allTechs.filter(t => t.verificationStatus === 'pending').length;
    const verified = allTechs.filter(t => t.verificationStatus === 'verified').length;
    const rejected = allTechs.filter(t => t.verificationStatus === 'rejected').length;

    const paidSubs = allTechs.filter(t =>
      t.subscription?.plan &&
      !['free', 'trial'].includes(t.subscription.plan) &&
      t.subscription?.endDate &&
      new Date(t.subscription.endDate).getTime() > nowMs
    ).length;

    const expiringSoon = allTechs.filter(t => {
      const end = t.subscription?.endDate;
      if (!end) return false;
      const days = (new Date(end).getTime() - nowMs) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 7 && !['free', 'trial'].includes(t.subscription?.plan);
    }).length;

    res.json({
      success: true,
      data: {
        total,
        active,
        suspended,
        available,
        featured,
        verification: { pending: pendingVerification, verified, rejected },
        subscriptions: { paid: paidSubs, expiringSoon },
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to load technician stats.');
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────
exports.getTechnician = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone profileImage status isVerified createdAt')
      .lean();

    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    // Recent bookings count
    const recentBookings = await Booking.find({ technicianId: tech._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('serviceCategory subService status totalAmount createdAt')
      .lean();

    res.json({
      success: true,
      data: {
        ...decorateTechnician(tech),
        recentBookings,
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch technician.');
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE (limited safe fields)
// ─────────────────────────────────────────────────────────────
exports.updateTechnician = async (req, res) => {
  try {
    const ALLOWED = [
      'businessName', 'aboutMe', 'profileHeadline', 'mainCategory',
      'serviceRadius', 'isFeatured', 'isAvailable',
    ];

    const updates = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        code: 'NO_UPDATES',
        message: 'No valid fields provided for update.',
      });
    }

    const tech = await Technician.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone profileImage');

    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    res.json({
      success: true,
      message: 'Technician updated successfully.',
      data: tech,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: Object.values(error.errors).map(e => e.message).join(', '),
      });
    }
    handleError(res, error, 'Failed to update technician.');
  }
};

// ─────────────────────────────────────────────────────────────
// VERIFY
// ─────────────────────────────────────────────────────────────
exports.verifyTechnician = async (req, res) => {
  try {
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
    // Mark all pending documents as verified
    if (tech.verifiedDocuments?.length) {
      tech.verifiedDocuments.forEach(doc => {
        if (doc.status === 'pending') {
          doc.status = 'verified';
          doc.verifiedAt = new Date();
        }
      });
    }
    await tech.save();

    res.json({
      success: true,
      message: 'Technician verified successfully.',
      data: { verificationStatus: tech.verificationStatus },
    });
  } catch (error) {
    handleError(res, error, 'Failed to verify technician.');
  }
};

// ─────────────────────────────────────────────────────────────
// REJECT VERIFICATION
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
      tech.verifiedDocuments.forEach(doc => {
        if (doc.status === 'pending') {
          doc.status = 'rejected';
          doc.remarks = reason;
        }
      });
    }
    await tech.save();

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
// SUSPEND / ACTIVATE
// ─────────────────────────────────────────────────────────────
exports.suspendTechnician = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    tech.isActive = false;
    tech.isAvailable = false;
    await tech.save();

    res.json({
      success: true,
      message: 'Technician suspended. They will no longer appear in search results.',
      data: { isActive: tech.isActive },
    });
  } catch (error) {
    handleError(res, error, 'Failed to suspend technician.');
  }
};

exports.activateTechnician = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    tech.isActive = true;
    await tech.save();

    res.json({
      success: true,
      message: 'Technician reactivated.',
      data: { isActive: tech.isActive },
    });
  } catch (error) {
    handleError(res, error, 'Failed to activate technician.');
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
exports.deleteTechnician = async (req, res) => {
  try {
    const tech = await Technician.findById(req.params.id);
    if (!tech) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Technician not found.' });
    }

    // Safety: don't delete if they have completed bookings on record (keeps history intact)
    const bookingCount = await Booking.countDocuments({ technicianId: tech._id });
    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        code: 'HAS_BOOKINGS',
        message: `This technician has ${bookingCount} booking(s) on record. Suspend instead of deleting.`,
      });
    }

    await Technician.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Technician profile deleted.' });
  } catch (error) {
    handleError(res, error, 'Failed to delete technician.');
  }
};