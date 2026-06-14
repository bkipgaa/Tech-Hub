/**
 * Subscription Controller for Technicians
 * Handles subscription upgrades, trial activation, and payment integration
 */

const Technician = require('../models/Technician');
const { subscriptionPlans, plansList } = require('../utils/subscriptionPlans');

/**
 * Get all available subscription plans
 * @route GET /api/subscription/plans
 */
exports.getPlans = async (req, res) => {
  try {
    res.json({
      success: true,
      data: plansList.map(plan => ({
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

    const subscription = technician.subscription || {
      plan: 'free',
      isActive: true,
      visibilityRadius: 10
    };

    const isActive = checkSubscriptionActive(technician);
    const daysRemaining = getDaysRemaining(technician);

    res.json({
      success: true,
      data: {
        ...subscription,
        isActive,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
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
 * Upgrade subscription (payment integration placeholder)
 * @route POST /api/subscription/upgrade
 */
exports.upgradeSubscription = async (req, res) => {
  try {
    const { planId, paymentMethodId, autoRenew = false } = req.body;
    
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    const plan = subscriptionPlans[planId];
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    // TODO: Integrate with payment gateway (Stripe, M-Pesa, etc.)
    // For now, we'll simulate successful payment
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

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
      paymentMethod: paymentMethodId ? 'card' : 'manual',
      lastPaymentDate: new Date(),
      nextPaymentDate: endDate
    };

    technician.serviceRadius = plan.visibilityRadius;
    await technician.save();

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name} plan`,
      data: {
        plan: technician.subscription,
        visibilityRadius: plan.visibilityRadius,
        endDate,
        autoRenew
      }
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
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

// Helper functions
function checkSubscriptionActive(technician) {
  if (!technician.subscription) return true; // Free plan is active
  if (technician.subscription.plan === 'free') return true;
  if (technician.subscription.isTrial && technician.subscription.trialEndDate) {
    return new Date() < new Date(technician.subscription.trialEndDate);
  }
  if (technician.subscription.endDate) {
    return new Date() < new Date(technician.subscription.endDate);
  }
  return false;
}

function getDaysRemaining(technician) {
  if (!technician.subscription) return -1;
  if (technician.subscription.plan === 'free') return -1;
  
  const endDate = technician.subscription.isTrial 
    ? technician.subscription.trialEndDate 
    : technician.subscription.endDate;
    
  if (!endDate) return 0;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
}

function getVisibilityRadius(technician) {
  const plan = technician.subscription?.plan || 'free';
  if (technician.subscription?.isTrial) return subscriptionPlans.trial.visibilityRadius;
  return subscriptionPlans[plan]?.visibilityRadius || 10;
}