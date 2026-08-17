const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');

// ============================================================
// PUBLIC ROUTES (no authentication required)
// ============================================================

/**
 * Paystack Webhook
 * @route POST /api/subscription/webhook
 * 
 * IMPORTANT: This route must be public and use raw body parser.
 * The raw body is required for signature verification.
 * 
 * The webhook is called by Paystack to notify your server about
 * successful payments, so it cannot be behind authentication.
 */
router.post('/webhook', subscriptionController.paystackWebhook);

// ============================================================
// PROTECTED ROUTES (require authentication)
// ============================================================

// All routes below this line require a valid JWT token
router.use(auth);

/**
 * Get all available subscription plans
 * @route GET /api/subscription/plans
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * Get current technician's subscription details
 * @route GET /api/subscription/current
 */
router.get('/current', subscriptionController.getCurrentSubscription);

/**
 * Activate free trial
 * @route POST /api/subscription/trial
 */
router.post('/trial', subscriptionController.activateTrial);

/**
 * Initiate Paystack payment for subscription upgrade
 * @route POST /api/subscription/upgrade
 */
router.post('/upgrade', subscriptionController.upgradeSubscription);

/**
 * Cancel auto-renewal
 * @route PUT /api/subscription/cancel-auto-renew
 */
router.put('/cancel-auto-renew', subscriptionController.cancelAutoRenew);

/**
 * Get subscription history and invoices
 * @route GET /api/subscription/history
 */
router.get('/history', subscriptionController.getSubscriptionHistory);

/**
 * Verify a payment after callback (optional)
 * @route GET /api/subscription/verify?reference=xxx
 * 
 * Called by the frontend after the user returns from Paystack.
 * This is a fallback – the webhook is the primary source of truth.
 */
router.get('/verify', subscriptionController.verifyPayment);

module.exports = router;