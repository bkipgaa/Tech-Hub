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
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.paystackWebhook
);

/**
 * M-Pesa Callback from Safaricom
 * @route POST /api/subscription/mpesa-callback
 * 
 * This endpoint is called by Safaricom after an STK Push transaction.
 * It must be public and expects JSON payload from Safaricom.
 */
router.post(
  '/mpesa-callback',
  express.json({ type: 'application/json' }),
  subscriptionController.mpesaCallback
);

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
 * Initiate payment for subscription upgrade
 * @route POST /api/subscription/upgrade
 * 
 * Accepts: { planId, paymentMethod: 'card' | 'mpesa', phoneNumber?, autoRenew? }
 * - Card → Paystack (returns authorization_url)
 * - M-Pesa → Daraja STK Push (returns checkoutRequestID)
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
 * Verify a Paystack payment after callback (fallback)
 * @route GET /api/subscription/verify?reference=xxx
 */
router.get('/verify', subscriptionController.verifyPayment);

/**
 * Poll M-Pesa transaction status
 * @route GET /api/subscription/mpesa-status?checkoutRequestID=xxx
 * 
 * Frontend polls this endpoint to confirm STK Push success/failure.
 */
router.get('/mpesa-status', subscriptionController.mpesaStatus);

module.exports = router;