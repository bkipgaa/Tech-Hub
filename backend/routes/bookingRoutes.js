const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // your auth middleware
const bookingController = require('../controllers/bookingratingController');

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

// ─── COMMISSION MANAGEMENT (fixed paths) ────────────────────

// Get pending commissions (optionally filter by month)
router.get('/commissions', bookingController.getTechnicianCommissions);

// Submit pending commissions for invoicing (technician)
router.post('/commissions/submit', bookingController.submitCommissionInvoices);

// Get commission history (invoiced & paid) with pagination
router.get('/commissions/history', bookingController.getCommissionHistory);

// ──────────────────────────────────────────────────────────────
// PARAMETERISED ROUTES (with :bookingId)
// ──────────────────────────────────────────────────────────────

// Get a single booking by ID (with permission checks)
router.get('/:bookingId', bookingController.getBooking);

// Cancel a booking (client or technician – only if pending or quoted)
router.post('/:bookingId/cancel', bookingController.cancelBooking);

// 12‑STEP ADVANCED BOOKING FLOW
router.post('/:bookingId/quotation', bookingController.sendQuotation);
router.post('/:bookingId/accept-quotation', bookingController.acceptQuotation);
router.post('/:bookingId/reject-quotation', bookingController.rejectQuotation);
router.post('/:bookingId/material-source', bookingController.setMaterialSource);
router.post('/:bookingId/materials-money-received', bookingController.confirmMaterialsMoneyReceived);
router.post('/:bookingId/materials-delivered', bookingController.confirmMaterialsDelivered);
router.post('/:bookingId/materials-received', bookingController.confirmMaterialsReceived);
router.post('/:bookingId/start', bookingController.startBooking);
router.post('/:bookingId/complete-work', bookingController.completeWork);
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