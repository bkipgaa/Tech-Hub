const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // your auth middleware
const bookingController = require('../controllers/bookingratingController');
const evidenceController = require('../controllers/bookingEvidenceController');
const { evidenceUpload, quotationUpload } = require('../config/cloudinary');

// Optional quotation photo/PDF files (multipart); plain JSON requests pass straight through
const quotationFiles = (req, res, next) => {
  quotationUpload.array('attachments', 3)(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Each file must be under 10 MB.'
      : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? 'You can attach up to 3 files.'
      : err.message;
    res.status(400).json({ success: false, message });
  });
};

// Multer errors (wrong type, too big) as a 400 instead of the generic 500
const evidencePhotoUpload = (req, res, next) => {
  evidenceUpload.single('photo')(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Photo is too large (max 10 MB).' : err.message;
    res.status(400).json({ success: false, message });
  });
};

// ──────────────────────────────────────────────────────────────
// All booking routes require authentication
// ──────────────────────────────────────────────────────────────
router.use(auth);

// ──────────────────────────────────────────────────────────────
// FIXED‑PATH ROUTES (must come before any /:bookingId routes)
// ──────────────────────────────────────────────────────────────

// Create a new booking (client only)
router.post('/', bookingController.createBooking);

// Get logged‑in user's bookings (client or technician)
router.get('/my-bookings', bookingController.getMyBookings);

// ──────────────────────────────────────────────────────────────
// PARAMETERISED ROUTES (with :bookingId)
// ──────────────────────────────────────────────────────────────

// Get a single booking by ID (with permission checks)
router.get('/:bookingId', bookingController.getBooking);

// Cancel a booking (client or technician – only if pending or quoted)
router.post('/:bookingId/cancel', bookingController.cancelBooking);

// Client pins the job location from their device (checked against evidence photo GPS)
router.post('/:bookingId/location-pin', evidenceController.pinLocation);

// 12‑STEP ADVANCED BOOKING FLOW
router.post('/:bookingId/quotation', quotationFiles, bookingController.sendQuotation);
router.post('/:bookingId/accept-quotation', bookingController.acceptQuotation);
router.post('/:bookingId/reject-quotation', bookingController.rejectQuotation);
router.post('/:bookingId/material-source', bookingController.setMaterialSource);
router.post('/:bookingId/materials-money-received', bookingController.confirmMaterialsMoneyReceived);
router.post('/:bookingId/materials-delivered', bookingController.confirmMaterialsDelivered);
router.post('/:bookingId/materials-received', bookingController.confirmMaterialsReceived);
router.post('/:bookingId/start', bookingController.startBooking);
router.post('/:bookingId/evidence/photo', evidencePhotoUpload, evidenceController.addEvidencePhoto);
router.post('/:bookingId/evidence/link', evidenceController.setEvidenceLink);
router.post('/:bookingId/complete-work', bookingController.completeWork);   // needs evidence
router.post('/:bookingId/confirm-work', evidenceController.confirmWork);    // client confirms or disputes
router.post('/:bookingId/confirm-labor-payment', bookingController.confirmLaborPayment);
router.post('/:bookingId/rate', bookingController.rateTechnician);

// ──────────────────────────────────────────────────────────────
// DEPRECATED / REMOVED ENDPOINTS
// ──────────────────────────────────────────────────────────────
// - PATCH /:bookingId/status        (replaced by step‑specific endpoints)
// - POST /:bookingId/confirm        (replaced by accept/reject quotation)
// - POST /:bookingId/complete       (replaced by complete-work + confirm-labor-payment + rate)
// - POST /:bookingId/confirm-payment (replaced by confirm-labor-payment)

module.exports = router;