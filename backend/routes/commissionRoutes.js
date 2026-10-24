// routes/commissionRoutes.js — commission on Free-plan jobs (mounted at /api/commissions)
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/commissionController');

router.post('/mpesa-callback', ctrl.mpesaCallback); // Safaricom, public
router.get('/', auth, ctrl.list);
router.post('/pay', auth, ctrl.pay);
router.get('/verify', auth, ctrl.verify);
router.get('/mpesa-status', auth, ctrl.mpesaStatus);

module.exports = router;
