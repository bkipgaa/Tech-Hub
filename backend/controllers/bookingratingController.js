/**
 * bookingController.js
 * ====================
 * Handles the full booking lifecycle:
 * - Create, read, cancel (basic CRUD)
 * - Booking flow: booked → quoted → accepted (work starts) → expert marks done
 *   with a photo and confirms full payment → client confirms and rates
 * - Technician statistics (completed jobs count)
 * - Email notifications for key events
 *
 * @author Weba-Hub Team
 * @version 4.0.0
 */

const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const User = require('../models/User');
const notify = require('../services/notificationService');
const mongoose = require('mongoose');
const jobEvidence = require('../utils/jobEvidence');
const { checkNewRating, applyRatingToTechnician } = require('../utils/ratingChecks');
const { uploadQuotationToCloudinary } = require('../config/cloudinary');

// Technician business name plus the person's name (no contact details)
const TECHNICIAN_WITH_NAME = {
  path: 'technicianId',
  select: 'businessName mainCategory userId',
  populate: { path: 'userId', select: 'firstName lastName' },
};

// ============================================================
// HELPERS
// ============================================================

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

const getTechnicianId = async (userId) => {
  const technician = await Technician.findOne({ userId }).select('_id');
  if (!technician) {
    throw new Error('Technician profile not found');
  }
  return technician._id;
};

/**
 * The user's part in a booking: 'client' (they booked it), 'technician'
 * (it was booked with them) or null. Based on the booking itself, not the
 * account role — technicians can also book other technicians as clients.
 * Works whether clientId/technicianId are populated or plain ids.
 */
const getBookingRole = async (booking, userId) => {
  const clientId = String(booking.clientId?._id || booking.clientId);
  if (clientId === String(userId)) return 'client';
  const technician = await Technician.findOne({ userId }).select('_id').lean();
  const technicianId = String(booking.technicianId?._id || booking.technicianId);
  if (technician && String(technician._id) === technicianId) return 'technician';
  return null;
};

// ============================================================
// CREATE BOOKING
// ============================================================

/**
 * Create a new booking (client only).
 * POST /api/bookings
 * 
 * Sends a notification email to the technician.
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

    // Technicians can book other technicians, but not themselves
    if (String(technician.userId) === String(clientId)) {
      return handleControllerError(
        res,
        new Error('Self booking'),
        'You cannot book yourself.',
        400,
        'createBooking'
      );
    }

    // Fetch the client user (for notification)
    const clientUser = await User.findById(clientId).select('firstName lastName email');

    // Calculate total
    const rate = (hourlyRate && hourlyRate > 0) ? hourlyRate : 0;
    const totalAmount = rate * estimatedHours;

    // Optional pin from the client's device; evidence photo GPS is checked against it
    const lat = Number(location.coordinates?.lat);
    const lng = Number(location.coordinates?.lng);
    const accuracy = Number(location.accuracy);
    const bookingLocation = { address: String(location.address).trim() };
    if (jobEvidence.isValidLatLng(lat, lng)) {
      bookingLocation.coordinates = { lat, lng };
      if (Number.isFinite(accuracy)) bookingLocation.accuracy = Math.round(accuracy);
      bookingLocation.pinnedAt = new Date();
    }

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
      location: bookingLocation,
      clientNotes,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      paymentStatus: 'pending',
    });

    await booking.save();
    await booking.populate('clientId', 'firstName lastName');
    await booking.populate(TECHNICIAN_WITH_NAME);

    // ─── Send notification to technician (non-blocking) ───
    try {
      console.log(`🔔 Attempting to notify technician for booking ${booking._id}`);

      const techUser = await User.findById(technician.userId).select('email phone firstName lastName');

      if (!techUser) {
        console.warn(`⚠️ No User found for technician userId=${technician.userId}`);
      } else if (!techUser.email && !techUser.phone) {
        console.warn(`⚠️ Technician ${techUser._id} has no email or phone`);
      } else {
        await notify.technicianNewBooking({
          technicianEmail: techUser.email,
          technicianPhone: techUser.phone,
          technicianName: `${techUser.firstName} ${techUser.lastName}`.trim() || 'Technician',
          clientName: clientUser
            ? `${clientUser.firstName} ${clientUser.lastName}`.trim()
            : 'A client',
          serviceCategory,
          subService,
          preferredDate: selectedDate.toLocaleDateString('en-KE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          preferredTime,
          address: location?.address,
        });

        console.log(`📧 Booking notification sent to ${techUser.email || techUser.phone}`);
      }
    } catch (notifyErr) {
      console.error('❌ Booking notification failed:', notifyErr.message);
      console.error(notifyErr.stack);
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

// ============================================================
// GET MY BOOKINGS
// ============================================================

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

    const { status, page = 1, limit = 20, sort = '-createdAt', as } = req.query;

    // as=client → bookings this user made (technicians can book other technicians too);
    // as=technician → bookings made with them. Default follows the account role.
    const viewAs = as === 'client' || as === 'technician'
      ? as
      : req.user.role === 'technician' ? 'technician' : 'client';

    let filter = {};

    if (viewAs === 'technician') {
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
      .populate('clientId', 'firstName lastName')
      .populate(TECHNICIAN_WITH_NAME)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings.map(jobEvidence.participantView),
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

    const booking = await Booking.findById(bookingId)
      .populate('clientId', 'firstName lastName')
      .populate(TECHNICIAN_WITH_NAME)
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

    const viewerRole = await getBookingRole(booking, userId);
    if (!viewerRole) {
      return handleControllerError(res, new Error('Unauthorized'), 'You do not have permission to view this booking.', 403, 'getBooking');
    }

    // viewerRole tells the page which actions to show (a technician can be the client here)
    res.json({
      success: true,
      data: {
        ...jobEvidence.participantView(booking),
        viewerRole,
        // What proof this job accepts (the page shows the link option only for digital jobs)
        evidenceRules: {
          linkAllowed: jobEvidence.isDigitalCategory(booking.serviceCategory),
          maxPhotos: jobEvidence.MAX_PHOTOS,
        },
      },
    });
  } catch (error) {
    handleControllerError(res, error, 'Failed to fetch booking.', 500, 'getBooking');
  }
};

// ============================================================
// CANCEL BOOKING
// ============================================================

/**
 * Cancel a booking – client or technician can cancel.
 * POST /api/bookings/:bookingId/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      return handleControllerError(res, new Error('Authentication required'), 'You must be logged in to cancel a booking.', 401, 'cancelBooking');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Booking not found'), 'Booking not found.', 404, 'cancelBooking');
    }

    const bookingRole = await getBookingRole(booking, userId);
    if (!bookingRole) {
      return handleControllerError(res, new Error('Unauthorized'), 'You are not part of this booking.', 403, 'cancelBooking');
    }

    if (!['pending', 'quoted'].includes(booking.status)) {
      return handleControllerError(res, new Error('Cannot cancel'), 'Only pending or quoted bookings can be cancelled.', 400, 'cancelBooking');
    }

    await booking.cancel(reason || 'Cancelled', bookingRole);

    await booking.populate('clientId', 'firstName lastName');
    await booking.populate(TECHNICIAN_WITH_NAME);

    res.json({ success: true, message: 'Booking cancelled successfully.', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to cancel booking.', 500, 'cancelBooking');
  }
};

// ============================================================
// BOOKING FLOW
// ============================================================

/**
 * 1. Technician sends a quotation.
 * POST /api/bookings/:bookingId/quotation
 */
exports.sendQuotation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    // JSON or multipart (when a quotation photo/PDF is attached), so read numbers explicitly
    const toAmount = (v) => (v === undefined || v === null || v === '' ? NaN : Number(v));
    const totalCost = toAmount(req.body.totalCost);
    const userId = req.user.userId || req.user.id || req.user._id;

    if (!Number.isFinite(totalCost) || totalCost <= 0) {
      return handleControllerError(res, new Error('Total cost required'), 'Total cost must be > 0', 400, 'sendQuotation');
    }

    const technicianId = await getTechnicianId(userId);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'sendQuotation');
    }
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'sendQuotation');
    }
    if (booking.status !== 'pending') {
      return handleControllerError(res, new Error('Invalid status'), 'Booking already progressed', 400, 'sendQuotation');
    }

    // Optional photo/PDF of the written quotation
    const attachments = [];
    for (const file of req.files || []) {
      const result = await uploadQuotationToCloudinary(file.buffer, file.mimetype);
      attachments.push({
        url: result.secure_url,
        publicId: result.public_id,
        fileType: file.mimetype === 'application/pdf' ? 'pdf' : 'image',
        name: String(file.originalname || '').slice(0, 120),
        uploadedAt: new Date(),
      });
    }

    // One price for the whole job (no separate labor/materials)
    booking.quotation = {
      totalCost,
      sentAt: new Date(),
      attachments,
    };
    // The quoted total is the booking's amount from now on (lists, exports, admin)
    booking.totalAmount = totalCost;
    booking.status = 'quoted';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName');
    await booking.populate(TECHNICIAN_WITH_NAME);

    res.json({ success: true, message: 'Quotation sent', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to send quotation', 500, 'sendQuotation');
  }
};

/**
 * 2. Client accepts quotation — the work starts straight away.
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
      return handleControllerError(res, new Error('Invalid status'), 'No quotation to accept', 400, 'acceptQuotation');
    }

    const now = new Date();
    booking.quotation.acceptedAt = now;
    booking.status = 'in_progress';
    booking.startedAt = now;
    await booking.save();

    await booking.populate('clientId', 'firstName lastName');
    await booking.populate(TECHNICIAN_WITH_NAME);

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
      return handleControllerError(res, new Error('Invalid status'), 'No quotation to reject', 400, 'rejectQuotation');
    }

    booking.quotation.rejectedAt = new Date();
    booking.quotation.rejectionReason = reason || 'Client rejected quotation';
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'client';
    booking.cancellationReason = reason || 'Client rejected quotation';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName');
    await booking.populate(TECHNICIAN_WITH_NAME);

    res.json({ success: true, message: 'Quotation rejected', data: booking });
  } catch (error) {
    handleControllerError(res, error, 'Failed to reject quotation', 500, 'rejectQuotation');
  }
};

/**
 * 4. Technician marks work as completed: needs proof, and confirms they were
 *    paid the full amount.
 * POST /api/bookings/:bookingId/complete-work
 * Body: { amountPaid, paidInFull: true, note? }
 */
exports.completeWork = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paidInFull, note } = req.body;
    const amountPaid = Number(req.body.amountPaid);
    const userId = req.user.userId || req.user.id || req.user._id;

    if (paidInFull !== true) {
      return handleControllerError(res, new Error('Payment not confirmed'), 'Confirm that the client has paid you in full before marking the work completed.', 400, 'completeWork');
    }
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      return handleControllerError(res, new Error('Invalid amount'), 'Enter the amount the client paid you.', 400, 'completeWork');
    }

    const technicianId = await getTechnicianId(userId);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return handleControllerError(res, new Error('Not found'), 'Booking not found', 404, 'completeWork');
    }
    if (booking.technicianId.toString() !== technicianId.toString()) {
      return handleControllerError(res, new Error('Unauthorized'), 'Not your booking', 403, 'completeWork');
    }
    if (booking.status !== 'in_progress') {
      return handleControllerError(res, new Error('Invalid status'), 'Work not started', 400, 'completeWork');
    }
    if (booking.workCompletedAt) {
      return handleControllerError(res, new Error('Already completed'), 'Work already marked completed', 400, 'completeWork');
    }

    // Proof first: a camera photo, or a live link for digital jobs
    const evidence = booking.completionEvidence;
    const hasPhoto = evidence?.photos?.length > 0;
    const hasLink = !!evidence?.link?.url && jobEvidence.isDigitalCategory(booking.serviceCategory);
    if (!hasPhoto && !hasLink) {
      return handleControllerError(
        res,
        new Error('Evidence required'),
        jobEvidence.isDigitalCategory(booking.serviceCategory)
          ? 'Add a photo of the finished work or a live link before marking it completed.'
          : 'Take at least one photo of the finished work before marking it completed.',
        400,
        'completeWork'
      );
    }

    const now = new Date();
    const startOfBookingDay = new Date(booking.preferredDate);
    startOfBookingDay.setHours(0, 0, 0, 0);
    jobEvidence.addBookingFlag(booking, 'too_fast',
      !!booking.startedAt && now - booking.startedAt < jobEvidence.MIN_WORK_MINUTES * 60 * 1000);
    jobEvidence.addBookingFlag(booking, 'before_booking_date', now < startOfBookingDay);
    jobEvidence.addBookingFlag(booking, 'no_job_pin', hasPhoto && !jobEvidence.jobPin(booking));
    evidence.submittedAt = now;
    jobEvidence.recomputeEvidenceFlags(booking);
    jobEvidence.refreshReviewStatus(booking);

    booking.workCompletedAt = now;
    booking.laborPayment = {
      confirmedAt: now,
      amount: amountPaid,
      notes: String(note || '').trim().slice(0, 500),
    };
    booking.paymentStatus = 'paid';
    booking.status = 'work_completed';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName email');
    await booking.populate(TECHNICIAN_WITH_NAME);

    // Ask the client to check the proof and confirm (non-blocking)
    try {
      if (booking.clientId?.email) {
        const techUser = booking.technicianId?.userId;
        await notify.clientWorkCompleted({
          clientEmail: booking.clientId.email,
          clientName: `${booking.clientId.firstName || ''} ${booking.clientId.lastName || ''}`.trim() || 'there',
          technicianName: `${techUser?.firstName || ''} ${techUser?.lastName || ''}`.trim() || 'Your expert',
          bookingId: booking._id,
        });
      }
    } catch (notifyErr) {
      console.error('Work completed notification failed:', notifyErr.message);
    }

    res.json({ success: true, message: 'Work marked as completed', data: jobEvidence.participantView(booking) });
  } catch (error) {
    handleControllerError(res, error, 'Failed to complete work', 500, 'completeWork');
  }
};

/**
 * Technician records the payment on a booking finished before payment was
 * part of completing the work (new bookings record it in complete-work).
 * POST /api/bookings/:bookingId/confirm-labor-payment
 */
exports.confirmLaborPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, note } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return handleControllerError(res, new Error('Invalid amount'), 'Valid positive amount required', 400, 'confirmLaborPayment');
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
      return handleControllerError(res, new Error('Invalid status'), 'Work must be completed first', 400, 'confirmLaborPayment');
    }
    if (booking.laborPayment?.confirmedAt) {
      return handleControllerError(res, new Error('Already confirmed'), 'Payment already confirmed', 400, 'confirmLaborPayment');
    }

    booking.laborPayment = {
      confirmedAt: new Date(),
      amount: Number(amount),
      notes: note || '',
    };
    booking.paymentStatus = 'paid';
    await booking.save();

    await booking.populate('clientId', 'firstName lastName');
    await booking.populate(TECHNICIAN_WITH_NAME);

    res.json({ success: true, message: 'Payment confirmed.', data: jobEvidence.participantView(booking) });
  } catch (error) {
    handleControllerError(res, error, 'Failed to confirm payment', 500, 'confirmLaborPayment');
  }
};

/**
 * 5. Client confirms the work is done and rates the technician — this
 *    finishes the booking.
 * POST /api/bookings/:bookingId/rate
 * 
 * Sends a notification email to the technician after rating.
 */
exports.rateTechnician = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const clientId = req.user.userId || req.user.id || req.user._id;
    if (!clientId) {
      return handleControllerError(res, new Error('Authentication required'), 'You must be logged in to rate a technician.', 401, 'rateTechnician');
    }

    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return handleControllerError(res, new Error('Invalid rating'), 'Rating must be between 1 and 5.', 400, 'rateTechnician');
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      clientId: clientId,
      status: 'work_completed',
    });
    if (!booking) {
      return handleControllerError(res, new Error('Booking not found or not ready for rating'), 'You can rate once the expert has marked the work as completed.', 404, 'rateTechnician');
    }

    if (booking.clientRating) {
      return handleControllerError(res, new Error('Already rated'), 'You have already rated this booking.', 400, 'rateTechnician');
    }

    if (booking.completionEvidence?.reviewStatus === 'admin_rejected') {
      return handleControllerError(res, new Error('Evidence rejected'), 'This job cannot be rated because its proof of work was rejected.', 400, 'rateTechnician');
    }

    const technician = await Technician.findById(booking.technicianId);
    if (!technician) {
      return handleControllerError(res, new Error('Technician not found'), 'Technician not found.', 404, 'rateTechnician');
    }

    // Timing checks: too many ratings in a day are held for the admin; close
    // together is flagged. Both are stored with the rating's timestamp.
    const ratedAt = new Date();
    const ratingCheck = await checkNewRating(booking.technicianId, booking._id, ratedAt);

    // Claim the booking in one conditional update so two requests at once can't both count
    const update = {
      clientRating: rating,
      status: 'completed',
      completedAt: ratedAt,
      ratingCheck,
      // Rating is the client's confirmation that the work was done
      'clientWorkConfirmation.confirmedAt': booking.clientWorkConfirmation?.confirmedAt || ratedAt,
    };
    if (review) update.clientReview = review.trim();
    const claimed = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'work_completed', clientRating: null },
      { $set: update },
      { returnDocument: 'after', runValidators: true }
    );
    if (!claimed) {
      return handleControllerError(res, new Error('Already rated'), 'You have already rated this booking.', 400, 'rateTechnician');
    }

    const held = ratingCheck.status === 'held';
    if (held) {
      const techUser = await User.findById(technician.userId).select('firstName lastName').lean();
      const expertName = `${techUser?.firstName || ''} ${techUser?.lastName || ''}`.trim() || technician.businessName || 'the expert';
      return res.json({
        success: true,
        message: `Thanks! Your rating is saved and will appear on ${expertName}'s profile after a quick check by our team.`,
        data: { bookingId: booking._id, rating, review: claimed.clientReview, held: true },
      });
    }

    await applyRatingToTechnician(technician, claimed);

    // ─── Send notification email to technician (non-blocking) ───
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
        review: claimed.clientReview,
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
