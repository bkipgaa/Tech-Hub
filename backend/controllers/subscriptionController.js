/**
 * Subscription Controller for Technicians
 * Now supports Paystack (card only) and M-Pesa Daraja (STK Push)
 */

const Technician = require('../models/Technician');
const User = require('../models/User');
const { subscriptionPlans, plansList, isPlanActive } = require('../utils/subscriptionPlans');
const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const mpesaService = require('../services/mpesaService');

// ─── GET PLANS ────────────────────────────────────────────────────────────────
exports.getPlans = async (req, res) => {
  try {
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

// ─── GET CURRENT SUBSCRIPTION ───────────────────────────────────────────────
exports.getCurrentSubscription = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    // ✅ Check and downgrade if the paid plan has expired
    await downgradeExpiredSubscription(technician);

    const subscription = technician.subscription || {
      plan: 'free',
      isActive: true,
      visibilityRadius: 10
    };

    const isActive = isPlanActive(
      technician.subscription?.plan,
      technician.subscription?.endDate,
      technician.subscription?.trialEndDate
    );

    let daysRemaining = 0;
    if (technician.subscription && (technician.subscription.plan !== 'free' && technician.subscription.plan !== 'trial')) {
      const end = technician.subscription.endDate;
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

// ─── ACTIVATE TRIAL ──────────────────────────────────────────────────────────
exports.activateTrial = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    if (technician.subscription?.isTrial && technician.subscription?.trialEndDate) {
      const trialEnd = new Date(technician.subscription.trialEndDate);
      if (trialEnd > new Date()) {
        return res.status(400).json({ success: false, message: 'Trial already active' });
      }
      if (trialEnd <= new Date()) {
        return res.status(400).json({ success: false, message: 'Trial already expired' });
      }
    }

    if (technician.subscription?.plan !== 'free' && technician.subscription?.endDate > new Date()) {
      return res.status(400).json({ success: false, message: 'Already on a paid subscription' });
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

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

// ─── UPGRADE SUBSCRIPTION ────────────────────────────────────────────────────
exports.upgradeSubscription = async (req, res) => {
  try {
    const { planId, autoRenew = false, paymentMethod, phoneNumber } = req.body;

    // Validate payment method
    if (!paymentMethod || (paymentMethod !== 'card' && paymentMethod !== 'mpesa')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Choose "card" or "mpesa".'
      });
    }

    // Validate plan
    const plan = subscriptionPlans[planId];
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }
    if (plan.price === 0) {
      return res.status(400).json({
        success: false,
        message: 'This plan is free and cannot be purchased. Please select a paid plan.'
      });
    }

    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ─── CARD (Paystack) ──────────────────────────────────────────────────
    if (paymentMethod === 'card') {
      const metadata = {
        technicianId: technician._id.toString(),
        planId,
        userId: req.user.userId,
        autoRenew
      };
      const amountInKobo = plan.price * 100;

      const response = await Paystack.transaction.initialize({
        amount: amountInKobo,
        email: user.email,
        currency: 'KES',
        channels: ['card'], // only card
        metadata,
        callback_url: `${process.env.FRONTEND_URL}/payment-callback`
      });

      technician.paymentPending = {
        reference: response.data.reference,
        planId,
        amount: plan.price,
        autoRenew,
        initiatedAt: new Date(),
        method: 'paystack'
      };
      await technician.save();

      return res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          authorization_url: response.data.authorization_url,
          reference: response.data.reference,
          paymentMethod: 'card'
        }
      });
    }

    // ─── M-PESA (Daraja STK Push) ────────────────────────────────────────
    if (paymentMethod === 'mpesa') {
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for M-Pesa payment.'
        });
      }

      // Clean and validate phone (2547XXXXXXXX)
      let cleaned = phoneNumber.replace(/\s/g, '');
      if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1);
      else if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
      if (!/^254[17]\d{8}$/.test(cleaned)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Use 2547XXXXXXXX.'
        });
      }

      const accountRef = `SUB-${Date.now()}`;
      const stkResponse = await mpesaService.stkPush(
        cleaned,
        plan.price,
        accountRef,
        `${plan.name} subscription`
      );

      technician.paymentPending = {
        checkoutRequestID: stkResponse.CheckoutRequestID,
        merchantRequestID: stkResponse.MerchantRequestID,
        planId,
        amount: plan.price,
        autoRenew,
        initiatedAt: new Date(),
        method: 'mpesa',
        phoneNumber: cleaned
      };
      await technician.save();

      return res.json({
        success: true,
        message: 'M-Pesa STK Push sent. Please check your phone to complete payment.',
        data: {
          checkoutRequestID: stkResponse.CheckoutRequestID,
          merchantRequestID: stkResponse.MerchantRequestID,
          paymentMethod: 'mpesa'
        }
      });
    }

    // Should never reach here
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PAYSTACK WEBHOOK (unchanged) ──────────────────────────────────────────
exports.paystackWebhook = async (req, res) => {
  const crypto = require('crypto');
  const rawBody = req.body.toString('utf8');
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.error('❌ Webhook signature mismatch');
    return res.status(401).send('Unauthorized');
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('❌ Failed to parse webhook JSON:', err.message);
    return res.status(400).send('Invalid JSON payload');
  }

  console.log(`📩 Webhook received: ${event.event} (reference: ${event.data?.reference || 'unknown'})`);

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

      // Idempotency
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

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

      technician.subscription = {
        plan: planId,
        planDetails: {
          name: plan.name,
          visibilityRadius: plan.visibilityRadius,
          price: plan.price,
          features: plan.features
        },
        startDate: new Date(),
        endDate,
        isTrial: false,
        autoRenew,
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
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return res.status(500).send('Internal Server Error');
    }
  } else {
    console.log(`ℹ️ Ignoring webhook event: ${event.event}`);
  }

  res.sendStatus(200);
};

// ─── VERIFY PAYMENT (Paystack) ──────────────────────────────────────────────
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

// ─── M-PESA CALLBACK (public) ───────────────────────────────────────────────
exports.mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      console.warn('Invalid M-Pesa callback payload:', req.body);
      return res.status(400).send('Invalid payload');
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      MerchantRequestID,
      CallbackMetadata
    } = Body.stkCallback;

    console.log(`M-Pesa callback: ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

    const technician = await Technician.findOne({
      'paymentPending.checkoutRequestID': CheckoutRequestID,
      'paymentPending.method': 'mpesa'
    });

    if (!technician) {
      console.error(`No pending transaction for CheckoutRequestID: ${CheckoutRequestID}`);
      return res.status(404).send('Transaction not found');
    }

    // Idempotency
    const alreadyProcessed = technician.subscription?.paymentHistory?.some(
      (p) => p.transactionId === CheckoutRequestID
    );
    if (alreadyProcessed) {
      console.log(`Transaction ${CheckoutRequestID} already processed.`);
      return res.sendStatus(200);
    }

    if (ResultCode === 0) {
      let amount = 0;
      if (CallbackMetadata && CallbackMetadata.Item) {
        const amountItem = CallbackMetadata.Item.find((item) => item.Name === 'Amount');
        if (amountItem) amount = amountItem.Value;
      }

      const { planId } = technician.paymentPending;
      const plan = subscriptionPlans[planId];
      if (!plan) {
        console.error(`Invalid plan ID: ${planId}`);
        return res.status(400).send('Invalid plan');
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan.durationDays || 30));

      technician.subscription = {
        plan: planId,
        planDetails: {
          name: plan.name,
          visibilityRadius: plan.visibilityRadius,
          price: plan.price,
          features: plan.features
        },
        startDate: new Date(),
        endDate,
        isTrial: false,
        autoRenew: technician.paymentPending.autoRenew || false,
        paymentMethod: 'mpesa',
        lastPaymentDate: new Date(),
        nextPaymentDate: endDate,
        paymentHistory: [
          ...(technician.subscription?.paymentHistory || []),
          {
            amount: amount || plan.price,
            date: new Date(),
            transactionId: CheckoutRequestID,
            status: 'success',
            plan: planId
          }
        ]
      };

      technician.serviceRadius = plan.visibilityRadius;
      technician.paymentPending = undefined;
      await technician.save();

      console.log(`✅ M-Pesa subscription upgraded for ${technician._id} to ${planId}`);
    } else {
      technician.paymentPending = {
        ...technician.paymentPending,
        failureReason: ResultDesc,
        failureCode: ResultCode
      };
      await technician.save();
      console.warn(`M-Pesa payment failed: ${ResultDesc} (${ResultCode})`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    res.sendStatus(500);
  }
};

// ─── M-PESA STATUS POLL (authenticated) ─────────────────────────────────────
exports.mpesaStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.query;
    if (!checkoutRequestID) {
      return res.status(400).json({ success: false, message: 'checkoutRequestID required' });
    }

    const technician = await Technician.findOne({
      'paymentPending.checkoutRequestID': checkoutRequestID,
      'paymentPending.method': 'mpesa',
      userId: req.user.userId
    });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or already completed'
      });
    }

    const statusData = await mpesaService.queryStatus(checkoutRequestID);
    const resultCode = statusData.ResultCode;

    let status = 'pending';
    let message = 'Payment still being processed';

    if (resultCode === '0') {
      status = 'success';
      message = 'Payment successful';
    } else if (resultCode === '1032') {
      status = 'failed';
      message = 'Transaction cancelled by user';
    } else if (resultCode === '1037') {
      status = 'failed';
      message = 'Transaction timed out';
    } else if (resultCode) {
      status = 'failed';
      message = statusData.ResultDesc || 'Payment failed';
    }

    return res.json({
      success: true,
      data: { status, message, resultCode }
    });
  } catch (error) {
    console.error('Error checking M-Pesa status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CANCEL AUTO-RENEW ──────────────────────────────────────────────────────
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

// ─── GET SUBSCRIPTION HISTORY ──────────────────────────────────────────────
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

// ─── HELPER ──────────────────────────────────────────────────────────────────
function getVisibilityRadius(technician) {
  const plan = technician.subscription?.plan || 'free';
  if (technician.subscription?.isTrial) return subscriptionPlans.trial.visibilityRadius;
  return subscriptionPlans[plan]?.visibilityRadius || 10;
}

/**
 * Downgrade an expired paid subscription to the free plan.
 * Called whenever the technician's subscription is fetched.
 * 
 * @param {Object} technician - The Technician document
 * @returns {Object} - The updated technician document
 */
const downgradeExpiredSubscription = async (technician) => {
  if (!technician.subscription) return technician;

  const { plan, endDate } = technician.subscription;
  const isPaidPlan = plan && plan !== 'free' && plan !== 'trial';

  // If it's a paid plan and the endDate is in the past, downgrade to free
  if (isPaidPlan && endDate && new Date(endDate) < new Date()) {
    console.log(`🔄 Downgrading technician ${technician._id} from ${plan} to free plan due to expiry.`);

    technician.subscription = {
      plan: 'free',
      planDetails: subscriptionPlans.free,
      startDate: new Date(),
      endDate: null,              // no expiry
      isTrial: false,
      autoRenew: false,
      // Keep payment history for records
      paymentHistory: technician.subscription.paymentHistory || []
    };

    technician.serviceRadius = subscriptionPlans.free.visibilityRadius; // 10 km
    await technician.save();
  }

  return technician;
};