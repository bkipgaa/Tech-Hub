/**
 * bookingAdminController.js
 * =========================
 * Admin endpoints for managing the full booking lifecycle.
 * 
 * Endpoints:
 *   GET   /api/admin/bookings                → paginated list with filters
 *   GET   /api/admin/bookings/stats          → aggregate stats
 *   GET   /api/admin/bookings/:id            → single booking detail
 *   PATCH /api/admin/bookings/:id/cancel     → admin force-cancel
 *   PATCH /api/admin/bookings/:id/notes      → update admin notes
 *   PATCH /api/admin/bookings/:id/status     → force status change (override)
 *   GET   /api/admin/bookings/export         → CSV export
 * 
 * @version 1.0.0
 */

const Booking = require('../../models/Booking');
const Technician = require('../../models/Technician');
const User = require('../../models/User');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const handleError = (res, error, message, status = 500, code = 'SERVER_ERROR') => {
  console.error('[bookingAdminController]', message, error);
  res.status(status).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
};

const ACTIVE_STATUSES = [
  'pending', 'quoted', 'agreed', 'materials_delivered',
  'materials_confirmed', 'in_progress', 'work_completed', 'labor_paid',
];

const ALL_STATUSES = [
  'pending', 'quoted', 'agreed', 'materials_delivered',
  'materials_confirmed', 'in_progress', 'work_completed',
  'labor_paid', 'completed', 'cancelled', 'no-show',
];

// ─────────────────────────────────────────────────────────────
// LIST
// ─────────────────────────────────────────────────────────────
exports.listBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      search,
      from,
      to,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const limitNum = Math.min(100, parseInt(limit) || 20);

    const filter = {};

    // Status
    if (status && status !== 'all') {
      if (status === 'active') {
        filter.status = { $in: ACTIVE_STATUSES };
      } else {
        filter.status = status;
      }
    }

    // Payment status
    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }

    // Date range
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // Search across client/technician names and category
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');

      const [clientIds, technicianIds] = await Promise.all([
        User.find({
          $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
        }).distinct('_id'),
        Technician.find({ businessName: regex }).distinct('_id'),
      ]);

      filter.$or = [
        { serviceCategory: regex },
        { subService: regex },
        { clientId: { $in: clientIds } },
        { technicianId: { $in: technicianIds } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('clientId', 'firstName lastName email phone profileImage')
        .populate({
          path: 'technicianId',
          select: 'businessName mainCategory userId',
          populate: { path: 'userId', select: 'firstName lastName email phone profileImage' },
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch bookings.');
  }
};

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      total,
      thisMonth,
      pending,
      inProgress,
      completed,
      cancelled,
      totalRevenue,
      pendingCommission,
      invoicedCommission,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Booking.countDocuments({ status: { $in: ['pending', 'quoted'] } }),
      Booking.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$laborPayment.amount' } } },
      ]),
      Booking.aggregate([
        { $match: { 'commission.status': 'pending' } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } },
      ]),
      Booking.aggregate([
        { $match: { 'commission.status': 'invoiced' } },
        { $group: { _id: null, total: { $sum: '$commission.amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total,
        thisMonth,
        pending,
        inProgress,
        completed,
        cancelled,
        totalLaborPaid: totalRevenue[0]?.total || 0,
        commission: {
          pending: pendingCommission[0]?.total || 0,
          invoiced: invoicedCommission[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    handleError(res, error, 'Failed to load booking stats.');
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('clientId', 'firstName lastName email phone profileImage createdAt')
      .populate({
        path: 'technicianId',
        select: 'businessName mainCategory address rating userId',
        populate: { path: 'userId', select: 'firstName lastName email phone profileImage' },
      })
      .lean();

    if (!booking) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking not found.' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    handleError(res, error, 'Failed to fetch booking.');
  }
};

// ─────────────────────────────────────────────────────────────
// CANCEL (admin override)
// ─────────────────────────────────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_REASON',
        message: 'A cancellation reason is required.',
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking not found.' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATE',
        message: `Cannot cancel a booking that is already ${booking.status}.`,
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'admin';
    booking.cancellationReason = reason.trim();
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate({
      path: 'technicianId',
      select: 'businessName mainCategory',
      populate: { path: 'userId', select: 'firstName lastName email' },
    });

    res.json({
      success: true,
      message: 'Booking cancelled by admin.',
      data: booking,
    });
  } catch (error) {
    handleError(res, error, 'Failed to cancel booking.');
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE ADMIN NOTES
// ─────────────────────────────────────────────────────────────
exports.updateAdminNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { adminNotes: notes || '' } },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking not found.' });
    }

    res.json({
      success: true,
      message: 'Admin notes updated.',
      data: { adminNotes: booking.adminNotes },
    });
  } catch (error) {
    handleError(res, error, 'Failed to update notes.');
  }
};

// ─────────────────────────────────────────────────────────────
// FORCE STATUS CHANGE (admin override)
// ─────────────────────────────────────────────────────────────
exports.forceStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!ALL_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${ALL_STATUSES.join(', ')}`,
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking not found.' });
    }

    booking.status = status;

    // Set appropriate timestamp
    const timestamps = {
      in_progress: 'startedAt',
      work_completed: 'workCompletedAt',
      completed: 'completedAt',
      cancelled: 'cancelledAt',
    };
    if (timestamps[status]) {
      booking[timestamps[status]] = new Date();
    }

    if (status === 'cancelled') {
      booking.cancelledBy = 'admin';
      booking.cancellationReason = reason || 'Force-cancelled by admin';
    }

    await booking.save();

    res.json({
      success: true,
      message: `Booking status changed to ${status}.`,
      data: { status: booking.status },
    });
  } catch (error) {
    handleError(res, error, 'Failed to update status.');
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORT CSV
// ─────────────────────────────────────────────────────────────
exports.exportBookings = async (req, res) => {
  try {
    const { status, from, to } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const bookings = await Booking.find(filter)
      .populate('clientId', 'firstName lastName email phone')
      .populate({
        path: 'technicianId',
        select: 'businessName userId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const header = [
      'Booking ID',
      'Created',
      'Status',
      'Payment Status',
      'Client Name',
      'Client Email',
      'Technician Name',
      'Technician Business',
      'Category',
      'Sub-Service',
      'Preferred Date',
      'Preferred Time',
      'Labor Cost',
      'Materials Cost',
      'Total Quotation',
      'Labor Paid',
      'Commission',
      'Commission Status',
      'Client Rating',
    ];

    const rows = bookings.map((b) => {
      const client = b.clientId || {};
      const tech = b.technicianId || {};
      const techUser = tech.userId || {};
      return [
        b._id,
        b.createdAt ? new Date(b.createdAt).toISOString() : '',
        b.status,
        b.paymentStatus,
        `${client.firstName || ''} ${client.lastName || ''}`.trim(),
        client.email || '',
        `${techUser.firstName || ''} ${techUser.lastName || ''}`.trim(),
        tech.businessName || '',
        b.serviceCategory,
        b.subService,
        b.preferredDate ? new Date(b.preferredDate).toISOString().slice(0, 10) : '',
        b.preferredTime || '',
        b.quotation?.laborCost || 0,
        b.quotation?.materialsCost || 0,
        b.quotation?.totalCost || 0,
        b.laborPayment?.amount || 0,
        b.commission?.amount || 0,
        b.commission?.status || '',
        b.clientRating || '',
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    handleError(res, error, 'Failed to export bookings.');
  }
};