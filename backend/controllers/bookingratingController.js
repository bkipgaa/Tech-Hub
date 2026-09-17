/**
 * bookingController.js
 * ====================
 * Handles the full booking lifecycle:
 * - Create, read, cancel (basic CRUD)
 * - 12‑step advanced flow: quotation → materials → work → labor payment → rating
 * - Commission (5%) calculation and storage
 * - Technician statistics (completed jobs count)
 * 
 * @author Weba-Hub Team
 * @version 3.0.0 – Complete 12‑step flow with commission
 */

const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const mongoose = require('mongoose');

// ============================================================
// HELPERS
// ============================================================

/**
 * Centralised error handler – logs to console (Render) and returns JSON.
 */
const handleControllerError = (res, error, fallbackMessage, status = 500, endpoint = 'booking') => {
  console.error(`[${endpoint}] Error:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    status,
    timestamp: new Date().toISOString(),
  });

  const response = {
    success: false,
    message: fallbackMessage,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack,
    }),
  };

  // Specific error types
  if (error.name === 'CastError') {
    response.message = 'Invalid ID format.';
    status = 400;
  } else if (error.name === 'ValidationError') {
    response.message = 'Validation error: ' + error.message;
    status = 400;
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    response.message = 'Database error. Please try again later.';
    response.databaseError = true;
    status = 500;
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    response.message = 'Database connection failed. Please try again later.';
    status = 503;
  }

  res.status(status).json(response);
};

/**
 * Fetch the Technician document ID for a given User ID.
 * Throws if the technician profile is not found.
 */
const getTechnicianId = async (userId) => {
  const technician = await Technician.findOne({ userId }).select('_id');
  if (!technician) {
    throw new Error('Technician profile not found');
  }
  return technician._id;
};

// ============================================================
// BASIC CRUD OPERATIONS (unchanged)
// ============================================================

/**
 * Create a new booking (client only).
 * POST /api/bookings
 */
exports.createBooking = async (req, res) => {
  try {
    const clientId = req.user.userId || req.user.id || req.user._id;
    if (!clientId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to create a booking.',
        401,
        'createBooking'
      );
    }

    const {
      technicianId,
      serviceCategory,
      subService,
      serviceDescription,
      hourlyRate,
      estimatedHours,
      preferredDate,
      preferredTime,
      duration,
      location,
      clientNotes,
      paymentMethod,
    } = req.body;

    // Validate required fields
    if (!technicianId || !serviceCategory || !subService || !serviceDescription ||
        !estimatedHours || estimatedHours <= 0 ||
        !preferredDate || !preferredTime || !location?.address) {
      return handleControllerError(
        res,
        new Error('Missing required fields'),
        'Please provide all required booking details (hourly rate is optional).',
        400,
        'createBooking'
      );
    }

    // Validate hourlyRate
    if (hourlyRate !== undefined && hourlyRate !== null && (isNaN(hourlyRate) || hourlyRate < 0)) {
      return handleControllerError(
        res,
        new Error('Invalid hourly rate'),
        'Hourly rate must be a non-negative number.',
        400,
        'createBooking'
      );
    }

    // Validate date
    const selectedDate = new Date(preferredDate);
    if (isNaN(selectedDate.getTime())) {
      return handleControllerError(
        res,
        new Error('Invalid date format'),
        'Please provide a valid preferred date.',
        400,
        'createBooking'
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return handleControllerError(
        res,
        new Error('Date in the past'),
        'Preferred date must be today or a future date.',
        400,
        'createBooking'
      );
    }

    // Validate time
    if (!preferredTime || preferredTime.trim() === '') {
      return handleControllerError(
        res,
        new Error('Invalid time'),
        'Please provide a valid preferred time.',
        400,
        'createBooking'
      );
    }

    // Verify technician
    const technician = await Technician.findById(technicianId);
    if (!technician || !technician.isActive) {
      return handleControllerError(
        res,
        new Error('Technician not found or inactive'),
        'Technician not available.',
        404,
        'createBooking'
      );
    }

    // Calculate total
    const rate = (hourlyRate && hourlyRate > 0) ? hourlyRate : 0;
    const totalAmount = rate * estimatedHours;

    // Create booking
    const booking = new Booking({
      clientId,
      technicianId,
      serviceCategory,
      subService,
      serviceDescription,
      hourlyRate: rate,
      estimatedHours,
      totalAmount,
      preferredDate: selectedDate,
      preferredTime: preferredTime.trim(),
      duration: duration || estimatedHours,
      location,
      clientNotes,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      paymentStatus: 'pending',
    });

    await booking.save();
    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');
    await technician.populate('userId', 'email firstName lastName');

    // ─── Send notification to technician (non-blocking) ───
try {
  const techUser = technician.userId || {};
  await notify.technicianNewBooking({
    technicianEmail: techUser.email,
    technicianName: `${techUser.firstName} ${techUser.lastName}`.trim() || 'Technician',
    clientName: `${user.firstName} ${user.lastName}`.trim() || 'A client',
    serviceCategory,
    subService,
    preferredDate: new Date(preferredDate).toLocaleDateString('en-KE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    preferredTime,
    address: location?.address,
  });
} catch (notifyErr) {
  console.error('Booking notification failed:', notifyErr.message);
}

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: booking,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return handleControllerError(
        res,
        error,
        `Validation error: ${messages.join(', ')}`,
        400,
        'createBooking'
      );
    }
    handleControllerError(res, error, 'Failed to create booking.', 500, 'createBooking');
  }
};

/**
 * Get all bookings for the logged‑in user.
 * GET /api/bookings
 */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to view bookings.',
        401,
        'getMyBookings'
      );
    }

    const isTechnician = req.user.role === 'technician';
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    let filter = {};

    if (isTechnician) {
      try {
        const technicianId = await getTechnicianId(userId);
        filter.technicianId = technicianId;
      } catch (err) {
        return handleControllerError(
          res,
          err,
          'You do not have a technician profile. Please complete your registration.',
          404,
          'getMyBookings'
        );
      }
    } else {
      filter.clientId = userId;
    }

    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit) || 20;

    const bookings = await Booking.find(filter)
      .populate('clientId', 'firstName lastName email phone')
      .populate('technicianId', 'businessName mainCategory')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Booking.countDocuments(filter);

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
    handleControllerError(res, error, 'Failed to fetch bookings.', 500, 'getMyBookings');
  }
};

/**
 * Fetch a single booking by ID, with permission checks.
 * GET /api/bookings/:bookingId
 */
exports.getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to view this booking.',
        401,
        'getBooking'
      );
    }

    const isTechnician = req.user.role === 'technician';

    const booking = await Booking.findById(bookingId)
      .populate('clientId', 'firstName lastName email phone')
      .populate('technicianId', 'businessName mainCategory')
      .lean();

    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found'),
        'Booking not found.',
        404,
        'getBooking'
      );
    }

    // Permission checks
    if (isTechnician) {
      let technicianId;
      try {
        technicianId = await getTechnicianId(userId);
      } catch (err) {
        return handleControllerError(
          res,
          err,
          'Technician profile not found.',
          404,
          'getBooking'
        );
      }
      if (booking.technicianId._id.toString() !== technicianId.toString()) {
        return handleControllerError(
          res,
          new Error('Unauthorized'),
          'You do not have permission to view this booking.',
          403,
          'getBooking'
        );
      }
    } else {
      if (booking.clientId._id.toString() !== userId.toString()) {
        return handleControllerError(
          res,
          new Error('Unauthorized'),
          'You do not have permission to view this booking.',
          403,
          'getBooking'
        );
      }
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch booking.', 500, 'getBooking');
  }
};

/**
 * Cancel a booking – client or technician can cancel.
 * Only pending or quoted bookings can be cancelled.
 * POST /api/bookings/:bookingId/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to cancel a booking.',
        401,
        'cancelBooking'
      );
    }

    const isTechnician = req.user.role === 'technician';

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found'),
        'Booking not found.',
        404,
        'cancelBooking'
      );
    }

    // Permission
    if (isTechnician) {
      let technicianId;
      try {
        technicianId = await getTechnicianId(userId);
      } catch (err) {
        return handleControllerError(
          res,
          err,
          'Technician profile not found.',
          404,
          'cancelBooking'
        );
      }
      if (booking.technicianId.toString() !== technicianId.toString()) {
        return handleControllerError(
          res,
          new Error('Unauthorized'),
          'You are not the technician for this booking.',
          403,
          'cancelBooking'
        );
      }
    } else {
      if (booking.clientId.toString() !== userId.toString()) {
        return handleControllerError(
          res,
          new Error('Unauthorized'),
          'You are not the client for this booking.',
          403,
          'cancelBooking'
        );
      }
    }

    // Only pending or quoted can be cancelled (extended from original)
    if (!['pending', 'quoted'].includes(booking.status)) {
      return handleControllerError(
        res,
        new Error('Cannot cancel'),
        'Only pending or quoted bookings can be cancelled.',
        400,
        'cancelBooking'
      );
    }

    await booking.cancel(reason || 'Cancelled', isTechnician ? 'technician' : 'client');

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to cancel booking.', 500, 'cancelBooking');
  }
};

// ============================================================
// 12‑STEP ADVANCED BOOKING FLOW
// ============================================================

/**
 * 1. Technician sends a quotation.
 * POST /api/bookings/:bookingId/quotation
 */
exports.sendQuotation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { totalCost, laborCost, materialsCost } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    // Validate inputs
    if (!totalCost || totalCost <= 0) {
      return handleControllerError(
        res,
        new Error('Total cost required'),
        'Total cost must be > 0',
        400,
        'sendQuotation'
      );
    }
    if (laborCost === undefined || laborCost < 0) {
      return handleControllerError(
        res,
        new Error('Labor cost required'),
        'Labor cost is required (can be 0)',
        400,
        'sendQuotation'
      );
    }
    if (materialsCost === undefined || materialsCost < 0) {
      return handleControllerError(
        res,
        new Error('Materials cost required'),
        'Materials cost is required (can be 0)',
        400,
        'sendQuotation'
      );
    }

    // Auth & permission
    const technicianId = await getTechnicianId(userId);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'sendQuotation');
    }
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'sendQuotation');
    }
    if (booking.status !== 'pending') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Booking already progressed',
        400,
        'sendQuotation'
      );
    }

    booking.quotation = {
      totalCost,
      laborCost,
      materialsCost,
      sentAt: new Date(),
    };
    booking.status = 'quoted';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({ success: true, message: 'Quotation sent', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to send quotation', 500, 'sendQuotation');
  }
};

/**
 * 2. Client accepts quotation.
 * POST /api/bookings/:bookingId/accept-quotation
 */
exports.acceptQuotation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'acceptQuotation');
    }
    if (booking.clientId.toString() !== userId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'acceptQuotation');
    }
    if (booking.status !== 'quoted') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'No quotation to accept',
        400,
        'acceptQuotation'
      );
    }

    booking.quotation.acceptedAt = new Date();
    booking.status = 'agreed';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({ success: true, message: 'Quotation accepted', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to accept quotation', 500, 'acceptQuotation');
  }
};

/**
 * 3. Client rejects quotation (cancels booking).
 * POST /api/bookings/:bookingId/reject-quotation
 */
exports.rejectQuotation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'rejectQuotation');
    }
    if (booking.clientId.toString() !== userId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'rejectQuotation');
    }
    if (booking.status !== 'quoted') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'No quotation to reject',
        400,
        'rejectQuotation'
      );
    }

    booking.quotation.rejectedAt = new Date();
    booking.quotation.rejectionReason = reason || 'Client rejected quotation';
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'client';
    booking.cancellationReason = reason || 'Client rejected quotation';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({ success: true, message: 'Quotation rejected', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to reject quotation', 500, 'rejectQuotation');
  }
};

/**
 * 4. Technician sets material source.
 * POST /api/bookings/:bookingId/material-source
 */
exports.setMaterialSource = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { providedByClient } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    if (typeof providedByClient !== 'boolean') {
      return handleControllerError(
        res,
        new Error('Invalid value'),
        'providedByClient must be boolean',
        400,
        'setMaterialSource'
      );
    }

    const technicianId = await getTechnicianId(userId);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'setMaterialSource');
    }
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'setMaterialSource');
    }
    if (booking.status !== 'agreed') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Booking must be in "agreed" state',
        400,
        'setMaterialSource'
      );
    }

    booking.materials.providedByClient = providedByClient;
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({ success: true, message: 'Material source set', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to set material source', 500, 'setMaterialSource');
  }
};

/**
 * 5. Technician confirms money received for materials (only if tech buys).
 * POST /api/bookings/:bookingId/materials-money-received
 */
exports.confirmMaterialsMoneyReceived = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    const technicianId = await getTechnicianId(userId);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'confirmMaterialsMoneyReceived');
    }
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'confirmMaterialsMoneyReceived');
    }
    if (booking.status !== 'agreed') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Booking must be in "agreed" state',
        400,
        'confirmMaterialsMoneyReceived'
      );
    }
    if (booking.materials.providedByClient) {
      return handleControllerError(
        res,
        new Error('Invalid action'),
        'Client provides materials, no payment needed',
        400,
        'confirmMaterialsMoneyReceived'
      );
    }
    if (booking.materials.moneyReceivedAt) {
      return handleControllerError(
        res,
        new Error('Already confirmed'),
        'Money already received',
        400,
        'confirmMaterialsMoneyReceived'
      );
    }

    booking.materials.moneyReceivedAt = new Date();
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({ success: true, message: 'Materials money receipt confirmed', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to confirm money receipt', 500, 'confirmMaterialsMoneyReceived');
  }
};

/**
 * 6. Technician confirms materials delivered.
 * POST /api/bookings/:bookingId/materials-delivered
 */
exports.confirmMaterialsDelivered = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    const technicianId = await getTechnicianId(userId);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'confirmMaterialsDelivered');
    }
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'confirmMaterialsDelivered');
    }
    if (booking.status !== 'agreed') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Booking must be in "agreed" state',
        400,
        'confirmMaterialsDelivered'
      );
    }
    // If tech buys, money must be received first
    if (!booking.materials.providedByClient && !booking.materials.moneyReceivedAt) {
      return handleControllerError(
        res,
        new Error('Payment required'),
        'Please confirm money received for materials first',
        400,
        'confirmMaterialsDelivered'
      );
    }
    if (booking.materials.deliveredAt) {
      return handleControllerError(
        res,
        new Error('Already delivered'),
        'Materials already confirmed delivered',
        400,
        'confirmMaterialsDelivered'
      );
    }

    booking.materials.deliveredAt = new Date();
    booking.status = 'materials_delivered';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({ success: true, message: 'Materials delivered', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to confirm delivery', 500, 'confirmMaterialsDelivered');
  }
};

/**
 * 7. Client confirms materials received.
 * POST /api/bookings/:bookingId/materials-received
 */
exports.confirmMaterialsReceived = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'confirmMaterialsReceived');
    }
    if (booking.clientId.toString() !== userId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'confirmMaterialsReceived');
    }
    if (booking.status !== 'materials_delivered') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Materials not delivered yet',
        400,
        'confirmMaterialsReceived'
      );
    }
    if (booking.materials.confirmedByClientAt) {
      return handleControllerError(
        res,
        new Error('Already confirmed'),
        'Materials already confirmed by client',
        400,
        'confirmMaterialsReceived'
      );
    }

    booking.materials.confirmedByClientAt = new Date();
    booking.status = 'materials_confirmed';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({ success: true, message: 'Materials receipt confirmed by client', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to confirm receipt', 500, 'confirmMaterialsReceived');
  }
};

/**
 * 8. Technician starts work (only after materials confirmed).
 * POST /api/bookings/:bookingId/start
 */
exports.startBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    let technicianId;
    try {
      technicianId = await getTechnicianId(userId);
    } catch (err) {
      return handleControllerError(
        res,
        err,
        'Technician profile not found.',
        404,
        'startBooking'
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found'),
        'Booking not found.',
        404,
        'startBooking'
      );
    }

    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(
        res,
        new Error('Unauthorized'),
        'You are not the technician for this booking.',
        403,
        'startBooking'
      );
    }

    // ✅ Allow only after materials confirmed
    if (booking.status !== 'materials_confirmed') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Cannot start work. Materials must be confirmed first.',
        400,
        'startBooking'
      );
    }

    await booking.start(); // sets status to 'in_progress', startedAt

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({
      success: true,
      message: 'Work started successfully.',
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to start booking.', 500, 'startBooking');
  }
};

/**
 * 9. Technician marks work as completed.
 * POST /api/bookings/:bookingId/complete-work
 */
exports.completeWork = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    const technicianId = await getTechnicianId(userId);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'completeWork');
    }
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'completeWork');
    }
    if (booking.status !== 'in_progress') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Work not started',
        400,
        'completeWork'
      );
    }
    if (booking.workCompletedAt) {
      return handleControllerError(
        res,
        new Error('Already completed'),
        'Work already marked completed',
        400,
        'completeWork'
      );
    }

    booking.workCompletedAt = new Date();
    booking.status = 'work_completed';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({ success: true, message: 'Work marked as completed', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to complete work', 500, 'completeWork');
  }
};

/**
 * 10. Technician confirms labor payment received – calculates 5% commission.
 * POST /api/bookings/:bookingId/confirm-labor-payment
 */
exports.confirmLaborPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, note } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    if (!amount || amount <= 0) {
      return handleControllerError(
        res,
        new Error('Invalid amount'),
        'Valid positive amount required',
        400,
        'confirmLaborPayment'
      );
    }

    const technicianId = await getTechnicianId(userId);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'confirmLaborPayment');
    }
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'confirmLaborPayment');
    }
    if (booking.status !== 'work_completed') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Work must be completed first',
        400,
        'confirmLaborPayment'
      );
    }
    if (booking.laborPayment.confirmedAt) {
      return handleControllerError(
        res,
        new Error('Already confirmed'),
        'Labor payment already confirmed',
        400,
        'confirmLaborPayment'
      );
    }

    // Calculate 5% commission on labor cost
    const laborCost = booking.quotation.laborCost || 0;
    const commissionAmount = laborCost * 0.05;

    booking.laborPayment = {
      confirmedAt: new Date(),
      amount: amount,
      notes: note || '',
    };
    booking.commission = {
      amount: commissionAmount,
      status: 'pending',
    };
    booking.status = 'labor_paid';

    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({
      success: true,
      message: `Labor payment confirmed. Commission of 5% (KES ${commissionAmount.toFixed(2)}) recorded.`,
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to confirm labor payment', 500, 'confirmLaborPayment');
  }
};

/**
 * 11. Client rates technician (only after labor paid).
 * POST /api/bookings/:bookingId/rate
 * 
 * Sends a notification email to the technician after rating.
 */
exports.rateTechnician = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const clientId = req.user.userId || req.user.id || req.user._id;
    if (!clientId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to rate a technician.',
        401,
        'rateTechnician'
      );
    }

    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return handleControllerError(
        res,
        new Error('Invalid rating'),
        'Rating must be between 1 and 5.',
        400,
        'rateTechnician'
      );
    }

    // Find booking where clientId matches and status is 'labor_paid'
    const booking = await Booking.findOne({
      _id: bookingId,
      clientId: clientId,
      status: 'labor_paid',
    });
    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found or not ready for rating'),
        'You can only rate after labor payment is confirmed.',
        404,
        'rateTechnician'
      );
    }

    if (booking.clientRating) {
      return handleControllerError(
        res,
        new Error('Already rated'),
        'You have already rated this booking.',
        400,
        'rateTechnician'
      );
    }

    const technician = await Technician.findById(booking.technicianId);
    if (!technician) {
      return handleControllerError(
        res,
        new Error('Technician not found'),
        'Technician not found.',
        404,
        'rateTechnician'
      );
    }

    // Update technician's overall rating
    await technician.updateRating(rating);

    // Save client rating and mark booking as completed
    booking.clientRating = rating;
    if (review) booking.clientReview = review.trim();
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    // Add review to technician's reviews array
    technician.reviews.push({
      clientId: clientId,
      bookingId: booking._id,
      rating: rating,
      comment: review || '',
      createdAt: new Date(),
    });
    await technician.save();

    // Increment completed jobs for the technician (portfolio)
    technician.statistics = technician.statistics || {};
    technician.statistics.completedJobs = (technician.statistics.completedJobs || 0) + 1;
    technician.statistics.totalJobs = (technician.statistics.totalJobs || 0) + 1;
    await technician.save();

    // ────────────────────────────────────────────────────────
    // Send notification email to technician (non-blocking)
    // ────────────────────────────────────────────────────────
    try {
      const techUser = await User.findById(technician.userId).select('email firstName lastName');
      const clientUser = await User.findById(clientId).select('firstName lastName');

      if (techUser?.email) {
        await notify.technicianClientRated({
          technicianEmail: techUser.email,
          technicianName: `${techUser.firstName} ${techUser.lastName}`.trim(),
          clientName: `${clientUser?.firstName || 'A client'} ${clientUser?.lastName || ''}`.trim(),
          rating,
          review: review || '',
        });
        console.log(`📧 Rating notification sent to ${techUser.email}`);
      }
    } catch (notifyErr) {
      console.error('Rating notification failed:', notifyErr.message);
    }

    res.json({
      success: true,
      message: 'Rating submitted successfully. Job marked as completed.',
      data: {
        bookingId: booking._id,
        rating,
        review: booking.clientReview,
        technicianRating: {
          average: technician.rating.average,
          count: technician.rating.count,
          distribution: technician.rating.distribution,
        },
      },
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to submit rating.', 500, 'rateTechnician');
  }
};
/**
 * Get pending commissions (optionally filtered by month).
 * GET /api/bookings/commissions?month=YYYY-MM
 */
exports.getTechnicianCommissions = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in.',
        401,
        'getTechnicianCommissions'
      );
    }

    if (req.user.role !== 'technician') {
      return handleControllerError(
        res,
        new Error('Forbidden'),
        'Only technicians can view commissions.',
        403,
        'getTechnicianCommissions'
      );
    }

    const { month } = req.query; // e.g., '2026-09'

    const technicianId = await getTechnicianId(userId);

    // Build filter
    let filter = {
      technicianId: technicianId,
      'commission.status': 'pending',
    };

    if (month) {
      const start = new Date(month + '-01T00:00:00.000Z');
      const end = new Date(month + '-01T23:59:59.999Z');
      end.setMonth(end.getMonth() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const bookings = await Booking.find(filter)
      .select('_id serviceCategory subService quotation.laborCost commission.amount commission.status createdAt')
      .lean();

    const totalPending = bookings.reduce((sum, b) => sum + (b.commission?.amount || 0), 0);

    // Group by month for dashboard summary
    const byMonth = {};
    bookings.forEach(b => {
      const m = new Date(b.createdAt).toISOString().slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { count: 0, total: 0 };
      byMonth[m].count += 1;
      byMonth[m].total += b.commission?.amount || 0;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalPending,
          count: bookings.length,
          byMonth,
        },
        commissions: bookings.map(b => ({
          bookingId: b._id,
          service: b.serviceCategory,
          subService: b.subService,
          laborCost: b.quotation?.laborCost || 0,
          commissionAmount: b.commission?.amount || 0,
          createdAt: b.createdAt,
        })),
      },
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch commissions.', 500, 'getTechnicianCommissions');
  }
};

/**
 * Submit pending commissions for invoicing (technician).
 * POST /api/bookings/commissions/submit
 * Body: { month: 'YYYY-MM' } optional – if omitted, all pending are submitted.
 */
exports.submitCommissionInvoices = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in.',
        401,
        'submitCommissionInvoices'
      );
    }

    if (req.user.role !== 'technician') {
      return handleControllerError(
        res,
        new Error('Forbidden'),
        'Only technicians can submit commissions.',
        403,
        'submitCommissionInvoices'
      );
    }

    const { month } = req.body || {}; // optional: 'YYYY-MM'

    const technicianId = await getTechnicianId(userId);

    let filter = {
      technicianId: technicianId,
      'commission.status': 'pending',
    };

    if (month) {
      const start = new Date(month + '-01T00:00:00.000Z');
      const end = new Date(month + '-01T23:59:59.999Z');
      end.setMonth(end.getMonth() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    // Check if there are any pending
    const count = await Booking.countDocuments(filter);
    if (count === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending commissions to submit.',
      });
    }

    // Update status from 'pending' to 'invoiced'
    const result = await Booking.updateMany(
      filter,
      {
        $set: {
          'commission.status': 'invoiced',
          'commission.invoicedAt': new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} commission(s) submitted for invoicing.`,
      data: {
        submittedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to submit commissions.', 500, 'submitCommissionInvoices');
  }
};

/**
 * Get commission history (invoiced & paid) with pagination.
 * GET /api/bookings/commissions/history?status=invoiced,paid&page=1&limit=20
 */
exports.getCommissionHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in.',
        401,
        'getCommissionHistory'
      );
    }

    if (req.user.role !== 'technician') {
      return handleControllerError(
        res,
        new Error('Forbidden'),
        'Only technicians can view their commission history.',
        403,
        'getCommissionHistory'
      );
    }

    const { status, page = 1, limit = 20 } = req.query;
    const technicianId = await getTechnicianId(userId);

    let filter = { technicianId };
    // Commission status filter: default to invoiced and paid
    const statuses = status ? status.split(',') : ['invoiced', 'paid'];
    filter['commission.status'] = { $in: statuses };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit) || 20;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .select('_id serviceCategory subService quotation.laborCost commission.amount commission.status commission.invoicedAt commission.paidAt createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    const summary = bookings.reduce(
      (acc, b) => {
        const status = b.commission?.status;
        if (status === 'invoiced') acc.invoicedCount += 1;
        if (status === 'paid') acc.paidCount += 1;
        acc.totalAmount += b.commission?.amount || 0;
        return acc;
      },
      { invoicedCount: 0, paidCount: 0, totalAmount: 0 }
    );

    res.json({
      success: true,
      data: {
        history: bookings.map(b => ({
          bookingId: b._id,
          service: b.serviceCategory,
          subService: b.subService,
          laborCost: b.quotation?.laborCost || 0,
          commissionAmount: b.commission?.amount || 0,
          status: b.commission?.status,
          invoicedAt: b.commission?.invoicedAt,
          paidAt: b.commission?.paidAt,
          createdAt: b.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        summary,
      },
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch commission history.', 500, 'getCommissionHistory');
  }
};

/**
 * (Optional) Admin endpoint to mark invoiced commissions as paid.
 * PATCH /api/bookings/commissions/:commissionId/pay
 * This can be added later if needed.
 */