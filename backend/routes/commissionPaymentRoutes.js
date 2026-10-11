// routes/commissionPaymentRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/commissionPaymentController');

// Public — Safaricom posts here directly, so it must sit before auth.
// The handler re-confirms every result with Safaricom before acting on it.
router.post('/mpesa-callback', ctrl.mpesaCallback);

router.use(auth);
router.post('/commissions/initialize', ctrl.initializeCommissionPayment);
router.get('/commissions/verify', ctrl.verifyCommissionPayment);
router.get('/commissions/mpesa-status', ctrl.mpesaStatus);

module.exports = router;
