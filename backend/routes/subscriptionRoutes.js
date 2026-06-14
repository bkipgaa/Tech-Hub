const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.get('/plans', subscriptionController.getPlans);
router.get('/current', subscriptionController.getCurrentSubscription);
router.post('/trial', subscriptionController.activateTrial);
router.post('/upgrade', subscriptionController.upgradeSubscription);
router.put('/cancel-auto-renew', subscriptionController.cancelAutoRenew);
router.get('/history', subscriptionController.getSubscriptionHistory);

module.exports = router;