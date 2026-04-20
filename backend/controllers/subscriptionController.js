/**
 * Subscription Controller
 * Manages technician subscription plans
 */

const Technician = require('../models/Technician');
const { subscriptionPlans } = require('../utils/subscriptionPlans');

// Get available plans
exports.getPlans = async (req, res) => {
  try {
    const plans = Object.entries(subscriptionPlans).map(([key, value]) => ({
      id: key,
      name: value.name,
      visibilityRadius: value.visibilityRadius,
      price: value.price,
      features: value.features
    }));
    
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upgrade technician's subscription
exports.upgradeSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }
    
    const plan = subscriptionPlans[planId];
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }
    
    // Calculate end date
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
      endDate: planId !== 'free' ? endDate : null,
      isTrial: false,
      autoRenew: false
    };
    
    // Update service radius to match plan visibility
    technician.serviceRadius = plan.visibilityRadius;
    
    await technician.save();
    
    res.json({
      success: true,
      message: `Upgraded to ${plan.name} plan`,
      data: technician.subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current subscription
exports.getCurrentSubscription = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('subscription serviceRadius');
    
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }
    
    res.json({ success: true, data: technician.subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};