/**
 * Subscription Controller for Technicians
 * Handles subscription upgrades, trial activation, and Paystack payment integration
 * 
 * IMPORTANT: This controller now uses Paystack for real payments.
 * - upgradeSubscription initializes a Paystack transaction and returns a checkout URL.
 * - paystackWebhook handles the 'charge.success' event and updates the technician's subscription.
 * - The webhook route must be public (no authentication) and use raw body parser.
 */

const Technician = require('../models/Technician');
const User = require('../models/User');
const { subscriptionPlans, plansList, isPlanActive } = require('../utils/subscriptionPlans');

// Initialize Paystack with secret key from environment
const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);

/**
 * Get all available subscription plans
 * @route GET /api/subscription/plans
 */
exports.getPlans = async (req, res) => {
  try {
    // Filter out 'free' and 'trial' – they are not paid upgrade options
    const paidPlans = plansList.filter(p => p.id !== 'free' && p.id !== 'trial');
    res.json({
      success: true,
      data: paidPlans.map(plan => ({
        ...plan,
        features: subscriptionPlans[plan.id]?.features || []
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get current technician's subscription
 * @route GET /api/subscription/current
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    // Default subscription if none exists
    const subscription = technician.subscription || {
      plan: 'free',
      isActive: true,
      visibilityRadius: 10
    };

    // Use the shared isPlanActive helper from subscriptionPlans.js
    const isActive = isPlanActive(
      technician.subscription?.plan,
      technician.subscription?.endDate,
      technician.subscription?.trialEndDate
    );

    // Compute days remaining
    let daysRemaining = 0;
    if (technician.subscription) {
      const end = technician.subscription.isTrial
        ? technician.subscription.trialEndDate
        : technician.subscription.endDate;
      if (end) {
        daysRemaining = Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) daysRemaining = 0;
      }
    }

    res.json({
      success: true,
      data: {
        ...subscription,
        isActive,
        daysRemaining,
        visibilityRadius: getVisibilityRadius(technician),
        canUpgrade: true,
        canActivateTrial: !technician.subscription?.isTrial && !technician.subscription?.endDate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Activate free trial
 * @route POST /api/subscription/trial
 */
exports.activateTrial = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    // Check if already used trial
    if (technician.subscription?.isTrial && technician.subscription?.trialEndDate) {
      const trialEnd = new Date(technician.subscription.trialEndDate);
      if (trialEnd > new Date()) {
        return res.status(400).json({ success: false, message: 'Trial already active' });
      }
      if (trialEnd <= new Date()) {
        return res.status(400).json({ success: false, message: 'Trial already expired' });
      }
    }

    // Check if already has paid subscription
    if (technician.subscription?.plan !== 'free' && technician.subscription?.endDate > new Date()) {
      return res.status(400).json({ success: false, message: 'Already on a paid subscription' });
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial

    technician.subscription = {
      plan: 'trial',
      planDetails: subscriptionPlans.trial,
      startDate: new Date(),
      trialEndDate: trialEndDate,
      isTrial: true,
      autoRenew: false
    };

    technician.serviceRadius = subscriptionPlans.trial.visibilityRadius;
    await technician.save();

    res.json({
      success: true,
      message: 'Free trial activated for 30 days',
      data: {
        trialEndDate,
        visibilityRadius: subscriptionPlans.trial.visibilityRadius,
        daysRemaining: 30
      }
    });
  } catch (error) {
    console.error('Error activating trial:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Initiate Paystack payment for subscription upgrade
 * @route POST /api/subscription/upgrade
 * 
 * Accepts 'paymentMethod' from frontend: 'card', 'mpesa', or 'both' (default).
 * Currency is always KES – M-Pesa only works with KES.
 */
exports.upgradeSubscription = async (req, res) => {
  try {
    const { planId, autoRenew = false, paymentMethod = 'both' } = req.body;
    
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    const plan = subscriptionPlans[planId];
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    // 🔒 Prevent upgrading to free or trial plans (price = 0)
    if (plan.price === 0) {
      return res.status(400).json({
        success: false,
        message: 'This plan is free and cannot be purchased. Please select a paid plan.'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Map paymentMethod to channels
    let channels = ['card', 'mpesa'];
    if (paymentMethod === 'card') channels = ['card'];
    else if (paymentMethod === 'mpesa') channels = ['mpesa'];

    const metadata = {
      technicianId: technician._id.toString(),
      planId: planId,
      userId: req.user.userId,
      autoRenew: autoRenew
    };

    const amountInKobo = plan.price * 100; // KES → kobo

    const response = await Paystack.transaction.initialize({
      amount: amountInKobo,
      email: user.email,
      currency: 'KES',
      channels: channels,
      metadata: metadata,
      callback_url: `${process.env.FRONTEND_URL}/payment-callback`
    });

    technician.paymentPending = {
      reference: response.data.reference,
      planId: planId,
      amount: plan.price,
      autoRenew: autoRenew,
      initiatedAt: new Date()
    };
    await technician.save();

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        authorization_url: response.data.authorization_url,
        reference: response.data.reference
      }
    });
  } catch (error) {
    console.error('Paystack initialization error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Paystack Webhook Handler
 * @route POST /api/subscription/webhook
 * 
 * This endpoint is called by Paystack when a transaction status changes.
 * It must be public (no auth) and use raw body parser for signature verification.
 * 
 * Security: Verifies the X-Paystack-Signature header to confirm the request is from Paystack.
 */
exports.paystackWebhook = async (req, res) => {
  const crypto = require('crypto');

  // 1. Extract the raw request body (Buffer) and convert to string
  const rawBody = req.body.toString('utf8');

  // 2. Verify the webhook signature using the raw body string
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.error('❌ Webhook signature mismatch – possible spoofed request');
    return res.status(401).send('Unauthorized');
  }

  // 3. Parse the JSON body
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('❌ Failed to parse webhook JSON:', err.message);
    return res.status(400).send('Invalid JSON payload');
  }

  console.log(`📩 Webhook received: ${event.event} (reference: ${event.data?.reference || 'unknown'})`);

  // 4. Process only 'charge.success' events
  if (event.event === 'charge.success') {
    const transaction = event.data;
    const metadata = transaction.metadata || {};

    if (!metadata.technicianId || !metadata.planId) {
      console.error('❌ Missing metadata in webhook:', metadata);
      return res.status(400).send('Missing metadata');
    }

    const { technicianId, planId } = metadata;
    const autoRenew = metadata.autoRenew === 'true' || metadata.autoRenew === true;

    try {
      const Technician = require('../models/Technician');
      const technician = await Technician.findById(technicianId);

      if (!technician) {
        console.error(`❌ Technician not found: ${technicianId}`);
        return res.status(404).send('Technician not found');
      }

      // Idempotency check – avoid double processing
      const alreadyProcessed = technician.subscription?.paymentHistory?.some(
        p => p.transactionId === transaction.reference
      );
      if (alreadyProcessed) {
        console.log(`⏭️ Transaction ${transaction.reference} already processed, skipping.`);
        return res.sendStatus(200);
      }

      const { subscriptionPlans } = require('../utils/subscriptionPlans');
      const plan = subscriptionPlans[planId];
      if (!plan) {
        console.error(`❌ Invalid plan ID from webhook: ${planId}`);
        return res.status(400).send('Invalid plan');
      }

      // Calculate subscription end date (durationDays from plan)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

      // Update the technician's subscription document
      technician.subscription = {
        plan: planId,
        planDetails: {
          name: plan.name,
          visibilityRadius: plan.visibilityRadius,
          price: plan.price,
          features: plan.features
        },
        startDate: new Date(),
        endDate: endDate,
        isTrial: false,
        autoRenew: autoRenew,
        paymentMethod: transaction.channel || 'paystack',
        lastPaymentDate: new Date(),
        nextPaymentDate: endDate,
        paymentHistory: [
          ...(technician.subscription?.paymentHistory || []),
          {
            amount: transaction.amount / 100,
            date: new Date(),
            transactionId: transaction.reference,
            status: 'success',
            plan: planId
          }
        ]
      };

      technician.serviceRadius = plan.visibilityRadius;
      technician.paymentPending = undefined;

      await technician.save();
      console.log(`✅ Subscription upgraded successfully for technician ${technicianId} to ${planId}`);

      // TODO: Send notification

    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    console.log(`ℹ️ Ignoring webhook event: ${event.event}`);
  }

  res.sendStatus(200);
};

/**
 * Verify Payment (optional)
 * @route GET /api/subscription/verify?reference=...
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference required' });
    }

    const response = await Paystack.transaction.verify(reference);
    if (response.data.status === 'success') {
      return res.json({ success: true, data: response.data });
    } else {
      return res.json({ success: false, message: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cancel auto-renewal
 * @route PUT /api/subscription/cancel-auto-renew
 */
exports.cancelAutoRenew = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    if (!technician.subscription) {
      return res.status(400).json({ success: false, message: 'No active subscription' });
    }

    technician.subscription.autoRenew = false;
    await technician.save();

    res.json({
      success: true,
      message: 'Auto-renewal cancelled. Your subscription will end on the expiry date.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get subscription history/invoices
 * @route GET /api/subscription/history
 */
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('subscriptionHistory payments');

    res.json({
      success: true,
      data: {
        current: technician?.subscription,
        history: technician?.subscriptionHistory || [],
        payments: technician?.payments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// HELPER FUNCTION (kept only for visibility radius)
// ============================================================

function getVisibilityRadius(technician) {
  const plan = technician.subscription?.plan || 'free';
  if (technician.subscription?.isTrial) return subscriptionPlans.trial.visibilityRadius;
  return subscriptionPlans[plan]?.visibilityRadius || 10;
}