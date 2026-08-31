/**
 * bookingController.js
 * ====================
 * Handles the full booking lifecycle:
 * - Create, read, update status, complete, rate, cancel.
 * 
 * @author Weba-Hub Team
 * @version 2.0.0 – Fixed technician ID mismatches & enhanced logging
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
// CREATE BOOKING
// ============================================================

/**
 * Create a new booking (client only).
 * POST /api/bookings
 * 
 * Note: hourlyRate is optional (in Kenya, technicians often quote fixed prices).
 * If hourlyRate is not provided or is 0, totalAmount will be 0 and the client
 * and technician will agree on price directly.
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

    // ── LOG THE RECEIVED DATA ──
    console.log('📝 Booking request body:', {
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
    });

    // ── Validate required fields ──
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

    // ── Validate hourlyRate ──
    if (hourlyRate !== undefined && hourlyRate !== null && (isNaN(hourlyRate) || hourlyRate < 0)) {
      return handleControllerError(
        res,
        new Error('Invalid hourly rate'),
        'Hourly rate must be a non-negative number.',
        400,
        'createBooking'
      );
    }

    // ── Validate date ──
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

    // ── Validate time ──
    if (!preferredTime || preferredTime.trim() === '') {
      return handleControllerError(
        res,
        new Error('Invalid time'),
        'Please provide a valid preferred time.',
        400,
        'createBooking'
      );
    }

    // ── Verify technician ──
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

    // ── Calculate total ──
    const rate = (hourlyRate && hourlyRate > 0) ? hourlyRate : 0;
    const totalAmount = rate * estimatedHours;

    // ── Create booking ──
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

    console.log('💾 About to save booking:', booking);

    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: booking,
    });
  } catch (error) {
    console.error('❌ createBooking caught error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

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

// ============================================================
// GET MY BOOKINGS (client or technician)
// ============================================================

/**
 * Get all bookings for the logged‑in user.
 * - Clients: filter by clientId (User _id)
 * - Technicians: filter by technicianId (Technician _id)
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
      // ✅ FIX: Get the Technician document _id for this user
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

// ============================================================
// GET SINGLE BOOKING
// ============================================================

/**
 * Fetch a single booking by ID, with permission checks.
 * Both client and technician can view if they are part of the booking.
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

    // For technicians, compare against the Technician _id
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
      // Client: compare against clientId (User _id)
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

// ============================================================
// UPDATE BOOKING STATUS (generic)
// ============================================================

/**
 * Update booking status with transition validation.
 * Clients can only cancel; technicians can confirm, start, complete, or cancel.
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, note } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to update booking status.',
        401,
        'updateBookingStatus'
      );
    }

    const isTechnician = req.user.role === 'technician';

    if (!status) {
      return handleControllerError(
        res,
        new Error('Status required'),
        'Please provide a status.',
        400,
        'updateBookingStatus'
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found'),
        'Booking not found.',
        404,
        'updateBookingStatus'
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
          'updateBookingStatus'
        );
      }
      if (booking.technicianId.toString() !== technicianId.toString()) {
        return handleControllerError(
          res,
          new Error('Unauthorized'),
          'You are not the technician for this booking.',
          403,
          'updateBookingStatus'
        );
      }
    } else {
      // Client: only allow cancellation
      if (booking.clientId.toString() !== userId.toString()) {
        return handleControllerError(
          res,
          new Error('Unauthorized'),
          'You are not the client for this booking.',
          403,
          'updateBookingStatus'
        );
      }
      if (status !== 'cancelled') {
        return handleControllerError(
          res,
          new Error('Invalid action'),
          'Clients can only cancel bookings.',
          403,
          'updateBookingStatus'
        );
      }
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      'no-show': [],
    };
    if (!validTransitions[booking.status].includes(status)) {
      return handleControllerError(
        res,
        new Error(`Invalid transition from ${booking.status} to ${status}`),
        `Cannot change status from ${booking.status} to ${status}.`,
        400,
        'updateBookingStatus'
      );
    }

    booking.status = status;

    if (status === 'confirmed') booking.confirmedAt = new Date();
    if (status === 'in-progress') booking.startedAt = new Date();
    if (status === 'completed') booking.completedAt = new Date();
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = isTechnician ? 'technician' : 'client';
      booking.cancellationReason = note || 'Cancelled by user';
    }

    await booking.save();
    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({
      success: true,
      message: `Booking status updated to ${status}.`,
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to update booking status.', 500, 'updateBookingStatus');
  }
};

// ============================================================
// CONFIRM BOOKING (technician only)
// ============================================================

/**
 * Confirm a pending booking (technician only).
 */
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to confirm a booking.',
        401,
        'confirmBooking'
      );
    }

    // ✅ FIX: Get the Technician _id for this user
    let technicianId;
    try {
      technicianId = await getTechnicianId(userId);
    } catch (err) {
      return handleControllerError(
        res,
        err,
        'Technician profile not found.',
        404,
        'confirmBooking'
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found'),
        'Booking not found.',
        404,
        'confirmBooking'
      );
    }

    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(
        res,
        new Error('Unauthorized'),
        'You are not the technician for this booking.',
        403,
        'confirmBooking'
      );
    }

    if (booking.status !== 'pending') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Only pending bookings can be confirmed.',
        400,
        'confirmBooking'
      );
    }

    await booking.confirm();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({
      success: true,
      message: 'Booking confirmed successfully.',
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to confirm booking.', 500, 'confirmBooking');
  }
};

// ============================================================
// START BOOKING (technician only)
// ============================================================

/**
 * Start a confirmed booking (technician only).
 */
exports.startBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to start a booking.',
        401,
        'startBooking'
      );
    }

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

    if (booking.status !== 'confirmed') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Only confirmed bookings can be started.',
        400,
        'startBooking'
      );
    }

    await booking.start();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({
      success: true,
      message: 'Booking started successfully.',
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to start booking.', 500, 'startBooking');
  }
};

// ============================================================
// COMPLETE BOOKING
// ============================================================

/**
 * Mark a booking as completed (technician or client can trigger).
 * The client can also rate later via /rate endpoint.
 */
exports.completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to complete a booking.',
        401,
        'completeBooking'
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
        'completeBooking'
      );
    }

    // Permission: either client or technician can mark complete
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
          'completeBooking'
        );
      }
      if (booking.technicianId.toString() !== technicianId.toString()) {
        return handleControllerError(
          res,
          new Error('Unauthorized'),
          'You are not the technician for this booking.',
          403,
          'completeBooking'
        );
      }
    } else {
      // Client
      if (booking.clientId.toString() !== userId.toString()) {
        return handleControllerError(
          res,
          new Error('Unauthorized'),
          'You are not the client for this booking.',
          403,
          'completeBooking'
        );
      }
    }

    // ✅ NEW: Ensure payment is confirmed before allowing completion
    if (!booking.paymentConfirmed) {
      return handleControllerError(
        res,
        new Error('Payment not confirmed'),
        'Please confirm payment before completing the booking.',
        400,
        'completeBooking'
      );
    }

    if (booking.status !== 'in-progress') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Only in-progress bookings can be completed.',
        400,
        'completeBooking'
      );
    }

    await booking.complete();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({
      success: true,
      message: 'Booking completed successfully. You can now rate the technician.',
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to complete booking.', 500, 'completeBooking');
  }
};

// ============================================================
// RATE TECHNICIAN (client only, after completion)
// ============================================================

/**
 * Rate a technician for a completed booking.
 * Updates the technician's overall rating and stores the review.
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

    const booking = await Booking.findOne({ _id: bookingId, clientId: clientId, status: 'completed' });
    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found or not completed'),
        'You can only rate after the booking is completed.',
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

    await technician.updateRating(rating);

    booking.clientRating = rating;
    if (review) booking.clientReview = review.trim();
    await booking.save();

    technician.reviews.push({
      clientId: clientId,
      bookingId: booking._id,
      rating: rating,
      comment: review || '',
      createdAt: new Date(),
    });
    await technician.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully.',
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

// ============================================================
// CANCEL BOOKING
// ============================================================

/**
 * Cancel a booking – client or technician can cancel.
 * Only pending or confirmed bookings can be cancelled.
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

    // Only pending/confirmed can be cancelled
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return handleControllerError(
        res,
        new Error('Cannot cancel'),
        'Only pending or confirmed bookings can be cancelled.',
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


/**
 * Confirm payment for a booking (technician only).
 * Sets paymentConfirmed = true, records timestamp and optional amount.
 * Only allowed when booking status is 'in-progress'.
 */
/**
 * Confirm payment for a booking (technician only).
 * Sets paymentConfirmed = true, paymentStatus = 'paid',
 * records timestamp and optional amount.
 * Only allowed when booking status is 'in-progress'.
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amountReceived, note } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    if (!userId) {
      return handleControllerError(
        res,
        new Error('Authentication required'),
        'You must be logged in to confirm payment.',
        401,
        'confirmPayment'
      );
    }

    // Must be a technician
    if (req.user.role !== 'technician') {
      return handleControllerError(
        res,
        new Error('Unauthorized'),
        'Only technicians can confirm payment.',
        403,
        'confirmPayment'
      );
    }

    // Get the technician's _id
    let technicianId;
    try {
      technicianId = await getTechnicianId(userId);
    } catch (err) {
      return handleControllerError(
        res,
        err,
        'Technician profile not found.',
        404,
        'confirmPayment'
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found'),
        'Booking not found.',
        404,
        'confirmPayment'
      );
    }

    // Verify this technician owns the booking
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(
        res,
        new Error('Unauthorized'),
        'You are not the technician for this booking.',
        403,
        'confirmPayment'
      );
    }

    // Only allow if status is 'in-progress'
    if (booking.status !== 'in-progress') {
      return handleControllerError(
        res,
        new Error('Invalid status'),
        'Payment can only be confirmed when the job is in progress.',
        400,
        'confirmPayment'
      );
    }

    // Prevent double confirmation
    if (booking.paymentConfirmed) {
      return handleControllerError(
        res,
        new Error('Already confirmed'),
        'Payment has already been confirmed for this booking.',
        400,
        'confirmPayment'
      );
    }

    // ─── UPDATE BOOKING ──────────────────────────────────────
    booking.paymentConfirmed = true;
    booking.paymentConfirmedAt = new Date();
    booking.paymentConfirmedBy = userId;

    // ✅ Set payment status to 'paid'
    booking.paymentStatus = 'paid';

    // Store optional amount
    if (amountReceived !== undefined && amountReceived !== null) {
      const parsed = parseFloat(amountReceived);
      if (!isNaN(parsed) && parsed >= 0) {
        booking.paymentAmountReceived = parsed;
      }
    }

    if (note) booking.paymentConfirmationNote = note.trim();

    await booking.save();

    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.json({
      success: true,
      message: 'Payment confirmed successfully.',
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to confirm payment.', 500, 'confirmPayment');
  }
};