/**
 * commissionPaymentRoutes.js
 * ==========================
 * Commission payment routes (card via Paystack + M-Pesa via Daraja).
 * Mounted at /api/payments
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/commissionPaymentController');

// ─── Public (Safaricom callback) ───────────────────────────
// ⚠️ No auth — Safaricom hits this directly
// ⚠️ Must be placed BEFORE the auth middleware
router.post('/mpesa-callback', ctrl.mpesaCallback);

// ─── Protected (require login) ─────────────────────────────
router.use(auth);

router.post('/commissions/initialize', ctrl.initializeCommissionPayment);
router.get('/commissions/verify', ctrl.verifyCommissionPayment);
router.get('/commissions/mpesa-status', ctrl.mpesaStatus);

module.exports = router;