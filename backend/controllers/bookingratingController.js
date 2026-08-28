/**
 * bookingController.js
 * ====================
 * Handles booking lifecycle: create, read, update status, complete, rate.
 * 
 * @author Weba-Hub Team
 */

const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const mongoose = require('mongoose');

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
    const clientId = req.user.id;
    const {
      technicianId,
      serviceCategory,
      subService,
      serviceDescription,
      hourlyRate,        // optional – may be undefined, null, or 0
      estimatedHours,
      preferredDate,
      preferredTime,
      duration,
      location,
      clientNotes,
      paymentMethod,
    } = req.body;

    // ── Validate required fields (hourlyRate is NOT required) ──
    // Required: technicianId, serviceCategory, subService, serviceDescription,
    // estimatedHours (> 0), preferredDate, preferredTime, location.address
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

    // ── Validate hourlyRate if provided ──
    // If hourlyRate is present, it must be a number >= 0
    if (hourlyRate !== undefined && hourlyRate !== null && (isNaN(hourlyRate) || hourlyRate < 0)) {
      return handleControllerError(
        res,
        new Error('Invalid hourly rate'),
        'Hourly rate must be a non-negative number.',
        400,
        'createBooking'
      );
    }

    // ── Verify technician exists and is active ──
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

    // ── Calculate total amount (0 if no hourly rate) ──
    const rate = (hourlyRate && hourlyRate > 0) ? hourlyRate : 0;
    const totalAmount = rate * estimatedHours;

    // ── Create booking ──
    const booking = new Booking({
      clientId,
      technicianId,
      serviceCategory,
      subService,
      serviceDescription,
      hourlyRate: rate,           // store 0 if not provided
      estimatedHours,
      totalAmount,
      preferredDate: new Date(preferredDate),
      preferredTime,
      duration: duration || estimatedHours,
      location,
      clientNotes,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      paymentStatus: 'pending',
    });

    await booking.save();

    // Populate for response
    await booking.populate('clientId', 'firstName lastName email phone');
    await booking.populate('technicianId', 'businessName mainCategory');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully.',
      data: booking,
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to create booking.', 500, 'createBooking');
  }
};

// ============================================================
// GET MY BOOKINGS (client or technician)
// ============================================================

/**
 * Get all bookings for the logged‑in user (client or technician).
 * Query parameters: status, limit, page, sort
 * GET /api/bookings/my-bookings
 */
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const isTechnician = req.user.role === 'technician'; // adjust role field if needed
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = isTechnician ? { technicianId: userId } : { clientId: userId };
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
 * Get booking by ID (only if user is client or technician).
 * GET /api/bookings/:bookingId
 */
exports.getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
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

    // Permission check
    if (booking.clientId._id.toString() !== userId && booking.technicianId._id.toString() !== userId) {
      return handleControllerError(
        res,
        new Error('Unauthorized'),
        'You do not have permission to view this booking.',
        403,
        'getBooking'
      );
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
 * PATCH /api/bookings/:bookingId/status
 * Body: { status, note }
 * 
 * Allowed transitions:
 * pending → accepted, cancelled
 * accepted → in-progress, cancelled
 * in-progress → completed, cancelled
 * completed → (no further changes)
 * cancelled → (no further changes)
 * 
 * Clients can only cancel; technicians can accept, start, complete, cancel.
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, note } = req.body;
    const userId = req.user.id;
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
      if (booking.technicianId.toString() !== userId) {
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
      if (booking.clientId.toString() !== userId) {
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

    // Update status
    booking.status = status;

    // Set timestamps based on new status
    if (status === 'confirmed') booking.confirmedAt = new Date();
    if (status === 'in-progress') booking.startedAt = new Date();
    if (status === 'completed') booking.completedAt = new Date();
    if (status === 'cancelled') {
      booking.cancelledAt = new Date();
      booking.cancelledBy = isTechnician ? 'technician' : 'client';
      booking.cancellationReason = note || 'Cancelled by user';
    }

    // Add to status history (optional – you can add a statusHistory array)
    // if you have that field; if not, you can skip or add.
    // We'll just save.

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
 * POST /api/bookings/:bookingId/confirm
 */
exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const technicianId = req.user.id;

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

    if (booking.technicianId.toString() !== technicianId) {
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

    await booking.confirm(); // uses model method

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
 * POST /api/bookings/:bookingId/start
 */
exports.startBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const technicianId = req.user.id;

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

    if (booking.technicianId.toString() !== technicianId) {
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

    await booking.start(); // model method

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
// COMPLETE BOOKING + RATING (optional)
// ============================================================

/**
 * Complete a booking and optionally provide rating/review for the technician.
 * POST /api/bookings/:bookingId/complete
 * Body: { rating, review } – rating is for the technician (1-5)
 * 
 * This will update the technician's overall rating.
 * Only the client can complete and rate? Actually technician can complete too.
 * We'll allow the technician to mark as completed, but rating only by client.
 * So we separate completion and rating.
 * 
 * We'll implement two endpoints: one for completion (technician) and one for rating (client).
 * But for simplicity, we'll allow either to complete, and rating endpoint separate.
 * We'll create a dedicated rating endpoint.
 */

// We'll use the generic updateStatus for completion, or a dedicated endpoint.
// Let's add a dedicated complete endpoint for better control.

/**
 * Mark booking as completed (technician or client can trigger).
 * POST /api/bookings/:bookingId/complete
 */
exports.completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
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
    if (booking.clientId.toString() !== userId && booking.technicianId.toString() !== userId) {
      return handleControllerError(
        res,
        new Error('Unauthorized'),
        'You are not part of this booking.',
        403,
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

    await booking.complete(); // model method (no rating yet)

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
 * Rate the technician for a completed booking.
 * POST /api/bookings/:bookingId/rate
 * Body: { rating, review } (rating 1-5, review optional)
 * 
 * This updates the technician's overall rating and stores the review
 * in the booking's clientRating/clientReview fields.
 * 
 * Only the client who made the booking can rate, and only if status is 'completed'.
 */
exports.rateTechnician = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const clientId = req.user.id;
    const { rating, review } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return handleControllerError(
        res,
        new Error('Invalid rating'),
        'Rating must be between 1 and 5.',
        400,
        'rateTechnician'
      );
    }

    // Find booking and ensure it belongs to client and is completed
    const booking = await Booking.findOne({ _id: bookingId, clientId, status: 'completed' });
    if (!booking) {
      return handleControllerError(
        res,
        new Error('Booking not found or not completed'),
        'You can only rate after the booking is completed.',
        404,
        'rateTechnician'
      );
    }

    // Check if already rated
    if (booking.clientRating) {
      return handleControllerError(
        res,
        new Error('Already rated'),
        'You have already rated this booking.',
        400,
        'rateTechnician'
      );
    }

    // Get technician
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

    // Update technician's overall rating using the model's method
    await technician.updateRating(rating);

    // Store rating and review in the booking
    booking.clientRating = rating;
    if (review) booking.clientReview = review.trim();
    await booking.save();

    // Also, you might want to add the review to the technician's reviews array if you have one.
    // We'll add it to the technician's reviews array as well (the model supports it).
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
// CANCEL BOOKING (convenience – uses updateStatus)
// ============================================================

/**
 * Cancel booking – client or technician can cancel.
 * POST /api/bookings/:bookingId/cancel
 * Body: { reason }
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
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
    if (booking.clientId.toString() !== userId && booking.technicianId.toString() !== userId) {
      return handleControllerError(
        res,
        new Error('Unauthorized'),
        'You are not part of this booking.',
        403,
        'cancelBooking'
      );
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