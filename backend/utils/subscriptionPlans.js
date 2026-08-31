/**
 * subscriptionPlans.js
 * ====================
 * Subscription Plans Configuration for Technician Visibility
 * 
 * This module defines all subscription plans available to technicians,
 * their visibility radii, pricing, and helper functions for plan management.
 * 
 * VISIBILITY RULES:
 * - Test: 20km radius (KES 10/month) – for testing payment flow
 * - Trial/Free: 10km radius (FREE for 30 days)
 * - Basic: 10km radius (KES 500/month)
 * - Basic-Plus: 50km radius (KES 1000/month)
 * - Premium: 100km radius (KES 1500/month)
 * - Business: 300km radius (KES 2000/month)
 * - Enterprise: 600km radius (KES 3000/month)
 * - Unlimited: 1000km radius (KES 5000/month)
 * 
 * IMPORTANT: Technicians with expired subscriptions are NOT visible in search results
 */

const subscriptionPlans = {
  /**
   * TRIAL PLAN
   * For new technicians to test the platform
   * - Free for 30 days
   * - Limited to 10km visibility
   * - Automatically expires after trial period
   */
  trial: {
    name: 'Free Trial',
    visibilityRadius: 10,
    price: 0,
    durationDays: 30,
    features: [
      '30-day free trial',
      '10km visibility radius',
      'Basic profile listing',
      'Service listing (up to 3 services)',
      'Email support'
    ]
  },

  /**
   * FREE PLAN (Legacy/Backward Compatibility)
   * For technicians who haven't subscribed yet
   * - Same as trial but without expiration
   * - Maintained for backward compatibility with existing data
   */
  free: {
    name: 'Free',
    visibilityRadius: 10,
    price: 0,
    durationDays: 30,
    features: [
      '10km visibility radius',
      'Basic profile listing',
      'Service listing (up to 5 services)',
      'Basic support'
    ]
  },

  /**
   * TEST PLAN
   * For testing payment integration (Paystack, M-Pesa, cards)
   * - Very low cost (KES 10) and decent radius (20km)
   * - Useful for QA, demos, and validating the payment flow
   */
  test: {
    name: 'Test Plan',
    visibilityRadius: 20,      // 20 kilometers visibility radius
    price: 10,                 // KES 10 (for testing)
    durationDays: 30,          // 30 days subscription
    features: [
      '20km visibility radius',
      'Test payment gateway',
      'Ideal for testing the system',
      'All basic features included',
      'Email support'
    ]
  },

  /**
   * BASIC PLAN
   * Entry-level paid plan
   * - Affordable monthly subscription
   * - Same visibility as trial but with more features
   */
  basic: {
    name: 'Basic',
    visibilityRadius: 10,
    price: 500,
    durationDays: 30,
    features: [
      '10km visibility radius',
      'Enhanced profile listing',
      'Priority support',
      'Basic analytics dashboard',
      'Service listing (up to 10 services)',
      'Email & SMS notifications'
    ]
  },

  /**
   * BASIC-PLUS PLAN
   * Mid-tier plan with extended visibility
   * - 5x visibility radius compared to Basic
   * - Good for technicians serving larger areas
   */
  basicPlus: {
    name: 'Basic-Plus',
    visibilityRadius: 50,
    price: 1000,
    durationDays: 30,
    features: [
      '50km visibility radius (5x increase)',
      'Enhanced profile listing with badge',
      'Priority support with 24hr response',
      'Advanced analytics with insights',
      'Featured in search results (10% boost)',
      'Service listing (up to 20 services)',
      'Email, SMS & push notifications',
      'Basic SEO optimization'
    ]
  },

  /**
   * PREMIUM PLAN
   * High-visibility plan for established technicians
   * - 100km regional coverage
   * - Includes verified badge for trust
   */
  premium: {
    name: 'Premium',
    visibilityRadius: 100,
    price: 1500,
    durationDays: 30,
    features: [
      '100km visibility radius (regional coverage)',
      'Premium profile listing with priority placement',
      'Priority support with 12hr response',
      'Advanced analytics with competitor insights',
      'Featured in search results (25% boost)',
      'Verified badge for increased trust',
      'Service listing (unlimited)',
      'All notification channels',
      'Full SEO optimization',
      'Customer review insights'
    ]
  },

  /**
   * BUSINESS PLAN
   * For professional technicians and small businesses
   * - 300km provincial/regional coverage
   * - Dedicated support and marketing exposure
   */
  business: {
    name: 'Business',
    visibilityRadius: 300,
    price: 2000,
    durationDays: 30,
    features: [
      '300km visibility radius (provincial coverage)',
      'Business profile listing with premium placement',
      '24/7 Priority support with 6hr response',
      'Enterprise analytics with forecasting',
      'Featured in search results (40% boost)',
      'Verified badge with business verification',
      'Marketing exposure on homepage',
      'Service listing (unlimited)',
      'All notification channels with priority',
      'Full SEO optimization with keywords',
      'Customer review management',
      'Booking management system',
      'Calendar integration'
    ]
  },

  /**
   * ENTERPRISE PLAN
   * For large service providers and companies
   * - 600km national coverage
   * - API access for integration
   */
  enterprise: {
    name: 'Enterprise',
    visibilityRadius: 600,
    price: 3000,
    durationDays: 30,
    features: [
      '600km visibility radius (national coverage)',
      'Enterprise profile listing with maximum placement',
      '24/7 Dedicated support with 2hr response',
      'Enterprise analytics with custom reports',
      'Featured in search results (60% boost)',
      'Verified badge with enhanced verification',
      'Premium marketing exposure on all pages',
      'API access for integration',
      'Multiple staff accounts (up to 5)',
      'Advanced booking management',
      'CRM integration',
      'Custom reporting dashboard',
      'White-label options available'
    ]
  },

  /**
   * UNLIMITED PLAN
   * Maximum visibility across the entire country
   * - 1000km (essentially nationwide in Kenya)
   * - All features included
   */
  unlimited: {
    name: 'Unlimited',
    visibilityRadius: 1000,
    price: 5000,
    durationDays: 30,
    features: [
      '1000km visibility radius (nationwide coverage)',
      'Unlimited profile listing with top placement',
      '24/7 VIP support with 1hr response',
      'Unlimited analytics with AI insights',
      'Featured in search results (80% boost)',
      'Verified badge with premium verification',
      'Premium marketing exposure + social media promotion',
      'Full API access with webhooks',
      'Unlimited staff accounts',
      'Advanced booking management with automation',
      'Full CRM integration',
      'Custom branded reports',
      'Early access to new features',
      'Beta program access',
      'Account manager assigned'
    ]
  }
};

/**
 * Plans List Array
 * Used for dropdown menus, UI components, and API responses.
 */
const plansList = [
  {
    id: 'trial',
    name: 'Free Trial',
    visibilityRadius: 10,
    price: 0,
    duration: '30 days',
    description: 'Perfect for getting started'
  },
  {
    id: 'free',
    name: 'Free',
    visibilityRadius: 10,
    price: 0,
    duration: '30 days',
    description: 'Basic visibility'
  },
  {
    id: 'test',
    name: 'Test Plan',
    visibilityRadius: 20,
    price: 10,
    duration: '30 days',
    description: 'Test payment flow (KES 10)'
  },
  {
    id: 'basic',
    name: 'Basic',
    visibilityRadius: 10,
    price: 500,
    duration: '30 days',
    description: 'Entry-level paid plan'
  },
  {
    id: 'basicPlus',
    name: 'Basic-Plus',
    visibilityRadius: 50,
    price: 1000,
    duration: '30 days',
    description: 'Extended local coverage'
  },
  {
    id: 'premium',
    name: 'Premium',
    visibilityRadius: 100,
    price: 1500,
    duration: '30 days',
    description: 'Regional coverage'
  },
  {
    id: 'business',
    name: 'Business',
    visibilityRadius: 300,
    price: 2000,
    duration: '30 days',
    description: 'Professional service provider'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    visibilityRadius: 600,
    price: 3000,
    duration: '30 days',
    description: 'Large service company'
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    visibilityRadius: 1000,
    price: 5000,
    duration: '30 days',
    description: 'Maximum nationwide coverage'
  }
];

// ============================================================
// HELPER FUNCTIONS (unchanged, but they now include the test plan)
// ============================================================

function getPlanByRadius(radius) {
  const radiusThresholds = [
    { maxRadius: 10, plan: 'trial' },      // 0-10km: Trial/Free/Basic
    { maxRadius: 50, plan: 'basicPlus' },
    { maxRadius: 100, plan: 'premium' },
    { maxRadius: 300, plan: 'business' },
    { maxRadius: 600, plan: 'enterprise' },
    { maxRadius: 1000, plan: 'unlimited' }
  ];
  for (const threshold of radiusThresholds) {
    if (radius <= threshold.maxRadius) {
      return threshold.plan;
    }
  }
  return 'unlimited';
}

function getVisibilityDescription(planId) {
  const plan = subscriptionPlans[planId];
  if (!plan) return '10km visibility radius (Default)';
  if (planId === 'unlimited') return `${plan.visibilityRadius}km visibility radius (Nationwide)`;
  let context = '';
  if (plan.visibilityRadius <= 10) context = ' (Local)';
  else if (plan.visibilityRadius <= 50) context = ' (Extended Local)';
  else if (plan.visibilityRadius <= 100) context = ' (Regional)';
  else if (plan.visibilityRadius <= 300) context = ' (Provincial)';
  else if (plan.visibilityRadius <= 600) context = ' (National)';
  else context = ' (Nationwide)';
  return `${plan.visibilityRadius}km visibility radius${context}`;
}

function isPlanActive(plan, endDate, trialEndDate) {
  const now = new Date();

  // Trial: active only if trialEndDate exists and is in the future
  if (plan === 'trial') {
    if (trialEndDate) {
      return now < new Date(trialEndDate);
    }
    return false; // no trial end date = inactive
  }

  // Free: never active (it's a fallback/dormant state)
  if (plan === 'free') {
    return false;
  }

  // Paid plans: active if endDate exists and is in the future
  if (endDate) {
    return now < new Date(endDate);
  }

  // Any other case: inactive
  return false;
}

function getUpgradePath(currentPlanId) {
  const upgradeOrder = ['trial', 'free', 'test', 'basic', 'basicPlus', 'premium', 'business', 'enterprise', 'unlimited'];
  const currentIndex = upgradeOrder.indexOf(currentPlanId);
  if (currentIndex === -1) return upgradeOrder;
  return upgradeOrder.slice(currentIndex + 1);
}

function calculatePlanSavings(planId, months = 1) {
  const plan = subscriptionPlans[planId];
  if (!plan) return { monthlyPrice: 0, totalPrice: 0, savings: 0, savingsPercentage: 0 };
  const monthlyPrice = plan.price;
  const regularTotal = monthlyPrice * months;
  let discount = 0;
  if (months >= 12) discount = 0.20;
  else if (months >= 6) discount = 0.10;
  else if (months >= 3) discount = 0.05;
  const discountedTotal = regularTotal * (1 - discount);
  const savings = regularTotal - discountedTotal;
  return { monthlyPrice, months, regularTotal, discountedTotal, savings, savingsPercentage: discount * 100 };
}

function validatePlanCompatibility(planId, serviceRadius) {
  const plan = subscriptionPlans[planId];
  if (!plan) return { valid: false, message: 'Invalid subscription plan', maxAllowedRadius: 10 };
  const maxAllowedRadius = plan.visibilityRadius;
  if (serviceRadius > maxAllowedRadius) {
    return {
      valid: false,
      message: `Service radius (${serviceRadius}km) exceeds plan's visibility radius (${maxAllowedRadius}km). Please upgrade to a higher plan.`,
      maxAllowedRadius,
      suggestedPlan: getPlanByRadius(serviceRadius)
    };
  }
  return { valid: true, message: 'Service radius is compatible with subscription plan', maxAllowedRadius };
}

function getFeaturesComparison() {
  const allFeatures = new Set();
  const comparison = {};
  Object.entries(subscriptionPlans).forEach(([planId, plan]) => {
    plan.features.forEach(feature => allFeatures.add(feature));
  });
  Object.entries(subscriptionPlans).forEach(([planId, plan]) => {
    comparison[planId] = {
      name: plan.name,
      price: plan.price,
      visibilityRadius: plan.visibilityRadius,
      features: {}
    };
    allFeatures.forEach(feature => {
      comparison[planId].features[feature] = plan.features.includes(feature);
    });
  });
  return comparison;
}

module.exports = {
  subscriptionPlans,
  plansList,
  getPlanByRadius,
  getVisibilityDescription,
  isPlanActive,
  getUpgradePath,
  calculatePlanSavings,
  validatePlanCompatibility,
  getFeaturesComparison
};