// routes/commissionPaymentRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/commissionPaymentController');

router.use(auth);
router.post('/commissions/initialize', ctrl.initializeCommissionPayment);
router.get('/commissions/verify', ctrl.verifyCommissionPayment);

module.exports = router;