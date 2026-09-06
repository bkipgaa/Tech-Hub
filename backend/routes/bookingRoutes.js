const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // your auth middleware
const bookingController = require('../controllers/bookingController');

// ──────────────────────────────────────────────────────────────
// All booking routes require authentication
// ──────────────────────────────────────────────────────────────
router.use(auth);

// ──────────────────────────────────────────────────────────────
// BASIC CRUD OPERATIONS (unchanged)
// ──────────────────────────────────────────────────────────────

// Create a new booking (client only)
router.post('/', bookingController.createBooking);

// Get logged‑in user's bookings (client or technician)
router.get('/my-bookings', bookingController.getMyBookings);

// Get a single booking by ID (with permission checks)
router.get('/:bookingId', bookingController.getBooking);

// Cancel a booking (client or technician – only if pending or quoted)
router.post('/:bookingId/cancel', bookingController.cancelBooking);

// ──────────────────────────────────────────────────────────────
// 12‑STEP ADVANCED BOOKING FLOW
// ──────────────────────────────────────────────────────────────

// 1. Technician sends a quotation
router.post('/:bookingId/quotation', bookingController.sendQuotation);

// 2. Client accepts quotation
router.post('/:bookingId/accept-quotation', bookingController.acceptQuotation);

// 3. Client rejects quotation (cancels booking)
router.post('/:bookingId/reject-quotation', bookingController.rejectQuotation);

// 4. Technician sets material source (client provides OR technician buys)
router.post('/:bookingId/material-source', bookingController.setMaterialSource);

// 5. Technician confirms money received for materials (if technician buys)
router.post('/:bookingId/materials-money-received', bookingController.confirmMaterialsMoneyReceived);

// 6. Technician confirms materials delivered
router.post('/:bookingId/materials-delivered', bookingController.confirmMaterialsDelivered);

// 7. Client confirms materials received
router.post('/:bookingId/materials-received', bookingController.confirmMaterialsReceived);

// 8. Technician starts work (only after materials confirmed)
router.post('/:bookingId/start', bookingController.startBooking);

// 9. Technician marks work as completed
router.post('/:bookingId/complete-work', bookingController.completeWork);

// 10. Technician confirms labour payment received (calculates 5% commission)
router.post('/:bookingId/confirm-labor-payment', bookingController.confirmLaborPayment);

// 11. Client rates technician (only after labour payment confirmed)
router.post('/:bookingId/rate', bookingController.rateTechnician);

// ──────────────────────────────────────────────────────────────
// DEPRECATED / REMOVED ENDPOINTS
// ──────────────────────────────────────────────────────────────
// The following endpoints are no longer used in the new flow:
// - PATCH /:bookingId/status        (replaced by step‑specific endpoints)
// - POST /:bookingId/confirm        (replaced by accept/reject quotation)
// - POST /:bookingId/complete       (replaced by complete-work + confirm-labor-payment + rate)
// - POST /:bookingId/confirm-payment (replaced by confirm-labor-payment)
// They have been removed to avoid confusion and accidental calls.

module.exports = router;