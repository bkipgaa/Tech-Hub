/**
 * Subscription Controller for Technicians
 * Now supports Paystack (card only) and M-Pesa Daraja (STK Push)
 * 
 * @version 2.1.0 – Fixed mpesaStatus 404 after successful payment
 */

const Technician = require('../models/Technician');
const User = require('../models/User');
const { subscriptionPlans, plansList, isPlanActive, getEffectivePlan } = require('../utils/subscriptionPlans');
const Paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const mpesaService = require('../services/mpesaService');
const notify = require('../services/notificationService');

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
      planDetails: subscriptionPlans.free,
      isActive: true
    };
    const effective = getEffectivePlan(technician.subscription);

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
        visibilityRadius: effective.visibilityRadius,
        // KES owed per job while on Free (0 on a paid plan or free month)
        commissionPerJob: effective.commissionPerJob,
        canUpgrade: true,
        // The old 10 km trial is gone: Free is 1000 km forever
        canActivateTrial: false,
        // Free first month on a paid plan — once per expert, ever
        freeMonthAvailable: !technician.trialHistory?.paidPlanTrialUsedAt,
        freeMonthUsedOn: technician.trialHistory?.paidPlanTrialPlan || null,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ACTIVATE TRIAL (retired) ───────────────────────────────────────────────
// The 10 km Free Trial was replaced by the Free plan (1000 km, forever). The
// one-month trial now means the free first month on a paid plan (/free-month).
exports.activateTrial = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Every expert is already on the Free plan (1000 km, forever). To try a paid plan, start your free month on it.',
  });
};

// ─── UPGRADE SUBSCRIPTION ────────────────────────────────────────────────────
exports.upgradeSubscription = async (req, res) => {
  try {
    const { planId, autoRenew = false, paymentMethod, phoneNumber } = req.body;

    if (!paymentMethod || (paymentMethod !== 'card' && paymentMethod !== 'mpesa')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Choose "card" or "mpesa".'
      });
    }

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
        channels: ['card'],
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

      let cleaned = phoneNumber.replace(/\s/g, '');
      if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1);
      else if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
      if (!/^254[17]\d{8}$/.test(cleaned)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Use 2547XXXXXXXX.'
        });
      }

      const accountRef = `SUB-${Date.now()}`.slice(0, 12); // ← max 12 chars
      const stkResponse = await mpesaService.stkPush(
        cleaned,
        plan.price,
        accountRef,
        `${plan.name}`.slice(0, 13),  // ← max 13 chars
        '/api/subscription/mpesa-callback'
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

    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PAYSTACK WEBHOOK ───────────────────────────────────────────────────────
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

    // ── Commission on a Free-plan job ──────────────────────
    if (metadata.type === 'commission') {
      try {
        const { applyPaystackTransaction } = require('./commissionController');
        await applyPaystackTransaction(transaction);
      } catch (err) {
        console.error('❌ Commission webhook error:', err);
        return res.status(500).send('Internal Server Error');
      }
      return res.sendStatus(200);
    }

    // ── Stays & Spaces listing plan ────────────────────────
    if (metadata.type === 'listing_plan') {
      try {
        const { applyPaystackTransaction } = require('./listingPlanController');
        await applyPaystackTransaction(transaction);
      } catch (err) {
        console.error('❌ Listing plan webhook error:', err);
        return res.status(500).send('Internal Server Error');
      }
      return res.sendStatus(200);
    }

    if (!metadata.technicianId || !metadata.planId) {
      console.error('❌ Missing metadata in webhook:', metadata);
      return res.status(400).send('Missing metadata');
    }

    const { technicianId, planId } = metadata;
    const autoRenew = metadata.autoRenew === 'true' || metadata.autoRenew === true;

    try {
      const technician = await Technician.findById(technicianId);
      if (!technician) {
        console.error(`❌ Technician not found: ${technicianId}`);
        return res.status(404).send('Technician not found');
      }

      const alreadyProcessed = technician.subscription?.paymentHistory?.some(
        p => p.transactionId === transaction.reference
      );
      if (alreadyProcessed) {
        console.log(`⏭️ Transaction ${transaction.reference} already processed, skipping.`);
        return res.sendStatus(200);
      }

      const plan = subscriptionPlans[planId];
      if (!plan) {
        console.error(`❌ Invalid plan ID from webhook: ${planId}`);
        return res.status(400).send('Invalid plan');
      }

      const endDate = paidPlanEndDate(technician, plan);

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

      try {
        const techUser = await User.findById(technician.userId).select('email firstName lastName');
        if (techUser?.email) {
          await notify.technicianSubscriptionRenewed({
            technicianEmail: techUser.email,
            technicianName: `${techUser.firstName} ${techUser.lastName}`.trim(),
            planName: plan.name,
            amount: transaction.amount / 100,
            endDate: endDate.toLocaleDateString('en-KE', {
              day: 'numeric', month: 'long', year: 'numeric',
            }),
            visibilityRadius: plan.visibilityRadius,
          });
          console.log(`📧 Renewal email sent to ${techUser.email}`);
        }
      } catch (notifyErr) {
        console.error('Renewal notification failed:', notifyErr.message);
      }
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
      ResultCode: callbackResultCode,
      CallbackMetadata
    } = Body.stkCallback;

    // Must be a plain string — an object here would be a query operator
    if (typeof CheckoutRequestID !== 'string' || !CheckoutRequestID) {
      return res.status(400).send('Invalid payload');
    }

    console.log(`M-Pesa callback: ${CheckoutRequestID}, ResultCode: ${callbackResultCode}`);

    const technician = await Technician.findOne({
      'paymentPending.checkoutRequestID': CheckoutRequestID,
      'paymentPending.method': 'mpesa'
    });

    if (!technician) {
      console.error(`No pending transaction for CheckoutRequestID: ${CheckoutRequestID}`);
      return res.status(404).send('Transaction not found');
    }

    const alreadyProcessed = technician.subscription?.paymentHistory?.some(
      (p) => p.transactionId === CheckoutRequestID
    );
    if (alreadyProcessed) {
      console.log(`Transaction ${CheckoutRequestID} already processed.`);
      return res.sendStatus(200);
    }

    // The callback is an unauthenticated POST — confirm the result with Safaricom
    const confirmation = await mpesaService.confirmPayment(CheckoutRequestID);
    if (!confirmation.confirmed) {
      // Leave it pending; the authenticated status poll will retry the query.
      console.warn(`Could not confirm M-Pesa result for ${CheckoutRequestID} with Safaricom`);
      return res.sendStatus(200);
    }
    const ResultCode = confirmation.resultCode;
    const ResultDesc = confirmation.resultDesc;

    if (String(callbackResultCode) !== ResultCode) {
      console.warn(
        `M-Pesa callback ResultCode ${callbackResultCode} does not match Safaricom (${ResultCode}) for ${CheckoutRequestID}`
      );
    }

    if (ResultCode === '0') {
      const { planId } = technician.paymentPending;
      const plan = subscriptionPlans[planId];
      if (!plan) {
        console.error(`Invalid plan ID: ${planId}`);
        return res.status(400).send('Invalid plan');
      }

      let amount = null;
      if (CallbackMetadata && Array.isArray(CallbackMetadata.Item)) {
        const amountItem = CallbackMetadata.Item.find((item) => item.Name === 'Amount');
        if (amountItem) amount = Number(amountItem.Value);
      }

      // Amount check (allow small rounding tolerance)
      const expected = technician.paymentPending.amount || plan.price;
      if (!Number.isFinite(amount) || amount < plan.price || Math.abs(amount - expected) > 1) {
        console.error(
          `⚠️ Amount mismatch for ${CheckoutRequestID}: paid ${amount}, expected ${expected}`
        );
        // Do not upgrade — log for manual review
        return res.sendStatus(200);
      }

      const endDate = paidPlanEndDate(technician, plan);

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
            amount,
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

      try {
        const techUser = await User.findById(technician.userId).select('email firstName lastName');
        if (techUser?.email) {
          await notify.technicianSubscriptionRenewed({
            technicianEmail: techUser.email,
            technicianName: `${techUser.firstName} ${techUser.lastName}`.trim(),
            planName: plan.name,
            amount,
            endDate: endDate.toLocaleDateString('en-KE', {
              day: 'numeric', month: 'long', year: 'numeric',
            }),
            visibilityRadius: plan.visibilityRadius,
          });
          console.log(`📧 Renewal email sent to ${techUser.email}`);
        }
      } catch (notifyErr) {
        console.error('Renewal notification failed:', notifyErr.message);
      }

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

// ─── M-PESA STATUS POLL (authenticated) — FIXED ─────────────────────────────
// ─── M-PESA STATUS POLL (authenticated) — FIXED WITH FALLBACK ─────────
exports.mpesaStatus = async (req, res) => {
  try {
    const { checkoutRequestID } = req.query;
    if (!checkoutRequestID) {
      return res.status(400).json({ success: false, message: 'checkoutRequestID required' });
    }

    const userId = req.user.userId || req.user.id || req.user._id;

    // ─────────────────────────────────────────────────────────
    // 1. CHECK IF PAYMENT ALREADY SUCCEEDED (via callback)
    // ─────────────────────────────────────────────────────────
    const completedTech = await Technician.findOne({
      userId,
      'subscription.paymentHistory.transactionId': checkoutRequestID,
    });

    if (completedTech) {
      return res.json({
        success: true,
        data: { status: 'success', message: 'Payment successful' },
      });
    }

    // ─────────────────────────────────────────────────────────
    // 2. CHECK IF PAYMENT FAILED (via callback)
    // ─────────────────────────────────────────────────────────
    const failedTech = await Technician.findOne({
      userId,
      'paymentPending.checkoutRequestID': checkoutRequestID,
      'paymentPending.method': 'mpesa',
      'paymentPending.failureCode': { $exists: true },
    });

    if (failedTech) {
      return res.json({
        success: true,
        data: {
          status: 'failed',
          message: failedTech.paymentPending.failureReason || 'Payment failed',
        },
      });
    }

    // ─────────────────────────────────────────────────────────
    // 3. LOOK UP THE PENDING TRANSACTION
    // ─────────────────────────────────────────────────────────
    const technician = await Technician.findOne({
      userId,
      'paymentPending.checkoutRequestID': checkoutRequestID,
      'paymentPending.method': 'mpesa',
    });

    if (!technician) {
      // Nothing pending, nothing in history — return pending
      return res.json({
        success: true,
        data: { status: 'pending', message: 'Awaiting confirmation...' },
      });
    }

    // ─────────────────────────────────────────────────────────
    // 4. ASK SAFARICOM DIRECTLY (FALLBACK WHEN CALLBACK FAILS)
    // ─────────────────────────────────────────────────────────
    try {
      const statusData = await mpesaService.queryStatus(checkoutRequestID);
      const resultCode = String(statusData.ResultCode || '');

      // ═══ SUCCESS: update the DB right here ═══
      if (resultCode === '0') {
        console.log(`✅ mpesaStatus: Safaricom confirms SUCCESS for ${checkoutRequestID}. Updating DB...`);

        const { planId, autoRenew } = technician.paymentPending;
        const plan = subscriptionPlans[planId];

        if (!plan) {
          console.error(`Invalid plan ID: ${planId}`);
          return res.json({
            success: true,
            data: { status: 'failed', message: 'Invalid plan' },
          });
        }

        // Idempotency — don't double-process
        const alreadyProcessed = technician.subscription?.paymentHistory?.some(
          (p) => p.transactionId === checkoutRequestID
        );

        if (!alreadyProcessed) {
          const endDate = paidPlanEndDate(technician, plan);

          technician.subscription = {
            plan: planId,
            planDetails: {
              name: plan.name,
              visibilityRadius: plan.visibilityRadius,
              price: plan.price,
              features: plan.features,
            },
            startDate: new Date(),
            endDate,
            isTrial: false,
            autoRenew: autoRenew || false,
            paymentMethod: 'mpesa',
            lastPaymentDate: new Date(),
            nextPaymentDate: endDate,
            paymentHistory: [
              ...(technician.subscription?.paymentHistory || []),
              {
                amount: technician.paymentPending.amount || plan.price,
                date: new Date(),
                transactionId: checkoutRequestID,
                status: 'success',
                plan: planId,
              },
            ],
          };

          technician.serviceRadius = plan.visibilityRadius;
          technician.paymentPending = undefined;
          await technician.save();

          console.log(`✅ mpesaStatus fallback: subscription upgraded to ${planId}`);

          // Send renewal notification (non-blocking)
          try {
            const techUser = await User.findById(technician.userId).select('email firstName lastName');
            if (techUser?.email) {
              await notify.technicianSubscriptionRenewed({
                technicianEmail: techUser.email,
                technicianName: `${techUser.firstName} ${techUser.lastName}`.trim(),
                planName: plan.name,
                amount: technician.subscription.paymentHistory.slice(-1)[0].amount,
                endDate: endDate.toLocaleDateString('en-KE', {
                  day: 'numeric', month: 'long', year: 'numeric',
                }),
                visibilityRadius: plan.visibilityRadius,
              });
              console.log(`📧 Renewal email sent to ${techUser.email}`);
            }
          } catch (notifyErr) {
            console.error('Renewal notification failed:', notifyErr.message);
          }
        }

        return res.json({
          success: true,
          data: { status: 'success', message: 'Payment successful' },
        });
      }

      // ═══ FAILED ═══
      if (resultCode === '1032') {
        return res.json({
          success: true,
          data: { status: 'failed', message: 'Transaction cancelled by user' },
        });
      }
      if (resultCode === '1037') {
        return res.json({
          success: true,
          data: { status: 'failed', message: 'Transaction timed out' },
        });
      }

      // ═══ STILL PENDING ═══
      return res.json({
        success: true,
        data: {
          status: 'pending',
          message: statusData.ResultDesc || 'Awaiting confirmation...',
        },
      });
    } catch (safErr) {
      console.warn('mpesaStatus: Safaricom query failed:', safErr.message);
      return res.json({
        success: true,
        data: { status: 'pending', message: 'Awaiting confirmation...' },
      });
    }
  } catch (error) {
    console.error('Error checking M-Pesa status:', error);
    return res.json({
      success: true,
      data: { status: 'pending', message: 'Checking...' },
    });
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

// ─── FREE FIRST MONTH ON A PAID PLAN ────────────────────────────────────────
/**
 * Give an expert one month of a paid plan for free. No payment details:
 * when the month ends they return to Free (1000 km) unless they subscribe.
 * Only once per expert, whichever plan they choose.
 */
exports.startFreeMonth = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = subscriptionPlans[planId];
    if (!plan || ['free', 'trial', 'test'].includes(planId)) {
      return res.status(400).json({ success: false, message: 'Please choose a paid plan.' });
    }

    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    if (technician.trialHistory?.paidPlanTrialUsedAt) {
      const usedOn = subscriptionPlans[technician.trialHistory.paidPlanTrialPlan]?.name || 'a plan';
      return res.status(400).json({
        success: false,
        message: `You have already used your free month (on ${usedOn}). It can only be used once.`,
      });
    }

    if (getEffectivePlan(technician.subscription).paid) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active paid plan. You can use the free month once it ends.',
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    technician.subscription = {
      plan: planId,
      planDetails: {
        name: plan.name,
        visibilityRadius: plan.visibilityRadius,
        price: plan.price,
        features: plan.features,
      },
      startDate,
      endDate,
      // Kept so the 30-day Free Trial can't be re-activated afterwards
      trialEndDate: technician.subscription?.trialEndDate || undefined,
      isTrial: false,
      isFreeMonth: true,
      autoRenew: false,
      paymentHistory: technician.subscription?.paymentHistory || [],
    };
    technician.serviceRadius = plan.visibilityRadius;
    technician.set('trialHistory.paidPlanTrialUsedAt', startDate);
    technician.set('trialHistory.paidPlanTrialPlan', planId);
    await technician.save();

    res.json({
      success: true,
      message: `Your free month of ${plan.name} has started. You're now visible within ${plan.visibilityRadius} km until ${endDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long' })}.`,
      data: { plan: planId, endDate, visibilityRadius: plan.visibilityRadius },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── HELPER ──────────────────────────────────────────────────────────────────
/**
 * End of a newly paid plan: the plan's length (30 days) added to whatever time
 * the technician still has (paid plan, free month or free trial), so paying
 * early never loses days. Must run before technician.subscription is replaced.
 */
function paidPlanEndDate(technician, plan) {
  const now = new Date();
  const current = technician.subscription;
  // The free trial keeps its end in trialEndDate; other plans use endDate
  const currentEndValue = current?.isTrial || current?.plan === 'trial' ? current?.trialEndDate : current?.endDate;
  const currentEnd = currentEndValue ? new Date(currentEndValue) : null;
  const endDate = currentEnd && currentEnd > now ? new Date(currentEnd) : now;
  endDate.setDate(endDate.getDate() + (plan.durationDays || 30));
  return endDate;
}

/**
 * Downgrade an expired paid subscription to the free plan.
 */
const downgradeExpiredSubscription = async (technician) => {
  if (!technician.subscription) return technician;

  const { plan } = technician.subscription;

  // Lapsed paid plan or ended trial → Free (1000 km), which never expires
  if (plan !== 'free' && getEffectivePlan(technician.subscription).plan === 'free') {
    console.log(`🔄 Downgrading technician ${technician._id} from ${plan} to free plan due to expiry.`);

    technician.subscription = {
      plan: 'free',
      planDetails: subscriptionPlans.free,
      startDate: new Date(),
      endDate: null,
      // Kept so the free trial can't be activated a second time
      trialEndDate: technician.subscription.trialEndDate || undefined,
      isTrial: false,
      autoRenew: false,
      paymentHistory: technician.subscription.paymentHistory || []
    };

    technician.serviceRadius = subscriptionPlans.free.visibilityRadius;
    await technician.save();
  }

  return technician;
};