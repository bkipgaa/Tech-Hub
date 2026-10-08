/**
 * subscriptionPlans.js
 * ====================
 * Subscription Plans Configuration for Technician Visibility
 *
 * VISIBILITY RULES:
 * - Test:         20km  radius  (KES 10/month)   – for testing payment flow
 * - Trial / Free: 10km  radius  (FREE for 30 days)
 * - Basic:        20km  radius  (KES 1,000/month)
 * - Basic Plus:   50km  radius  (KES 2,000/month)
 * - Premium:      100km radius  (KES 3,000/month)
 * - Business:     250km radius  (KES 4,000/month)
 * - Enterprise:   500km radius  (KES 5,000/month)
 * - Platinum:     1000km radius (KES 8,000/month)
 *
 * IMPORTANT: Technicians with expired subscriptions are NOT visible in search.
 *
 * @version 2.0.0 – Repriced tiers + Platinum rename
 */

const subscriptionPlans = {
  // ─────────────────────────────────────────────────────────
  // TRIAL
  // ─────────────────────────────────────────────────────────
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
      'Email support',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // FREE (legacy — kept for backward compatibility)
  // ─────────────────────────────────────────────────────────
  free: {
    name: 'Free',
    visibilityRadius: 10,
    price: 0,
    durationDays: 30,
    features: [
      '10km visibility radius',
      'Basic profile listing',
      'Service listing (up to 5 services)',
      'Basic support',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // TEST (for QA / payment integration)
  // ─────────────────────────────────────────────────────────
  test: {
    name: 'Test Plan',
    visibilityRadius: 20,
    price: 10,
    durationDays: 30,
    features: [
      '20km visibility radius',
      'Test payment gateway',
      'Ideal for testing the system',
      'All basic features included',
      'Email support',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // BASIC — KES 1,000 / 20km
  // ─────────────────────────────────────────────────────────
  basic: {
    name: 'Basic',
    visibilityRadius: 20,
    price: 1000,
    durationDays: 30,
    features: [
      '20km visibility radius',
      'Standard profile listing',
      'Priority email support',
      'Basic analytics dashboard',
      'Service listing (up to 10 services)',
      'Email & SMS notifications',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // BASIC PLUS — KES 2,000 / 50km
  // ─────────────────────────────────────────────────────────
  basicPlus: {
    name: 'Basic Plus',
    visibilityRadius: 50,
    price: 2000,
    durationDays: 30,
    features: [
      '50km visibility radius',
      'Enhanced profile listing with badge',
      'Priority support (24hr response)',
      'Advanced analytics with insights',
      '10% search visibility boost',
      'Service listing (up to 20 services)',
      'Email, SMS & push notifications',
      'Basic SEO optimization',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // PREMIUM — KES 3,000 / 100km
  // ─────────────────────────────────────────────────────────
  premium: {
    name: 'Premium',
    visibilityRadius: 100,
    price: 3000,
    durationDays: 30,
    features: [
      '100km visibility radius (regional coverage)',
      'Premium profile with priority placement',
      'Priority support (12hr response)',
      'Advanced analytics with competitor insights',
      '25% search visibility boost',
      'Verified badge for increased trust',
      'Unlimited service listings',
      'All notification channels',
      'Full SEO optimization',
      'Customer review insights',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // BUSINESS — KES 4,000 / 250km
  // ─────────────────────────────────────────────────────────
  business: {
    name: 'Business',
    visibilityRadius: 250,
    price: 4000,
    durationDays: 30,
    features: [
      '250km visibility radius (provincial coverage)',
      'Business profile with premium placement',
      '24/7 priority support (6hr response)',
      'Enterprise analytics with forecasting',
      '40% search visibility boost',
      'Verified badge with business verification',
      'Homepage marketing exposure',
      'Unlimited service listings',
      'All notification channels with priority',
      'Full SEO optimization with keywords',
      'Customer review management',
      'Booking management system',
      'Calendar integration',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // ENTERPRISE — KES 5,000 / 500km
  // ─────────────────────────────────────────────────────────
  enterprise: {
    name: 'Enterprise',
    visibilityRadius: 500,
    price: 5000,
    durationDays: 30,
    features: [
      '500km visibility radius (national coverage)',
      'Enterprise profile with maximum placement',
      '24/7 dedicated support (2hr response)',
      'Enterprise analytics with custom reports',
      '60% search visibility boost',
      'Enhanced verification badge',
      'Premium marketing exposure on all pages',
      'API access for integration',
      'Multiple staff accounts (up to 5)',
      'Advanced booking management',
      'CRM integration',
      'Custom reporting dashboard',
    ],
  },

  // ─────────────────────────────────────────────────────────
  // PLATINUM — KES 8,000 / 1000km  (internal id: 'unlimited')
  // ─────────────────────────────────────────────────────────
  unlimited: {
    name: 'Platinum',
    visibilityRadius: 1000,
    price: 8000,
    durationDays: 30,
    features: [
      '1000km visibility radius (nationwide coverage)',
      'Top placement on every listing',
      '24/7 VIP support (1hr response)',
      'Unlimited analytics with AI insights',
      '80% search visibility boost',
      'Premium verification badge',
      'Premium marketing + social media promotion',
      'Full API access with webhooks',
      'Unlimited staff accounts',
      'Automated booking management',
      'Full CRM integration',
      'Custom branded reports',
      'Early access to new features',
      'Dedicated account manager',
    ],
  },
};

// ═══════════════════════════════════════════════════════════
// Plans List — used in dropdowns and API responses
// ═══════════════════════════════════════════════════════════
const plansList = [
  { id: 'trial',      name: 'Free Trial',  visibilityRadius: 10,   price: 0,    duration: '30 days', description: 'Perfect for getting started' },
  { id: 'free',       name: 'Free',        visibilityRadius: 10,   price: 0,    duration: '30 days', description: 'Basic visibility' },
  { id: 'test',       name: 'Test Plan',   visibilityRadius: 20,   price: 10,   duration: '30 days', description: 'Test payment flow (KES 10)' },
  { id: 'basic',      name: 'Basic',       visibilityRadius: 20,   price: 1000, duration: '30 days', description: 'Local coverage (20km)' },
  { id: 'basicPlus',  name: 'Basic Plus',  visibilityRadius: 50,   price: 2000, duration: '30 days', description: 'Extended local coverage (50km)' },
  { id: 'premium',    name: 'Premium',     visibilityRadius: 100,  price: 3000, duration: '30 days', description: 'Regional coverage (100km)' },
  { id: 'business',   name: 'Business',    visibilityRadius: 250,  price: 4000, duration: '30 days', description: 'Provincial coverage (250km)' },
  { id: 'enterprise', name: 'Enterprise',  visibilityRadius: 500,  price: 5000, duration: '30 days', description: 'National coverage (500km)' },
  { id: 'unlimited',  name: 'Platinum',    visibilityRadius: 1000, price: 8000, duration: '30 days', description: 'Nationwide coverage (1000km)' },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Return the smallest/cheapest plan that covers a given radius.
 */
function getPlanByRadius(radius) {
  const radiusThresholds = [
    { maxRadius: 10,   plan: 'trial' },
    { maxRadius: 20,   plan: 'basic' },
    { maxRadius: 50,   plan: 'basicPlus' },
    { maxRadius: 100,  plan: 'premium' },
    { maxRadius: 250,  plan: 'business' },
    { maxRadius: 500,  plan: 'enterprise' },
    { maxRadius: 1000, plan: 'unlimited' },
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

  const r = plan.visibilityRadius;
  let context = '';
  if (r <= 10)        context = ' (Local)';
  else if (r <= 20)   context = ' (Extended Local)';
  else if (r <= 50)   context = ' (Extended Local Plus)';
  else if (r <= 100)  context = ' (Regional)';
  else if (r <= 250)  context = ' (Provincial)';
  else if (r <= 500)  context = ' (National)';
  else                context = ' (Nationwide)';

  return `${r}km visibility radius${context}`;
}

/**
 * Determine if a subscription plan is active.
 *   - free and trial: ALWAYS active (never expire)
 *   - paid plans: active only if endDate is in the future
 */
function isPlanActive(plan, endDate, trialEndDate) {
  const now = new Date();

  if (plan === 'free' || plan === 'trial') {
    return true;
  }

  if (endDate) {
    return now < new Date(endDate);
  }

  return false;
}

function getUpgradePath(currentPlanId) {
  const upgradeOrder = [
    'trial',
    'free',
    'test',
    'basic',
    'basicPlus',
    'premium',
    'business',
    'enterprise',
    'unlimited',
  ];
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

  return {
    monthlyPrice,
    months,
    regularTotal,
    discountedTotal,
    savings,
    savingsPercentage: discount * 100,
  };
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
      suggestedPlan: getPlanByRadius(serviceRadius),
    };
  }
  return { valid: true, message: 'Service radius is compatible with subscription plan', maxAllowedRadius };
}

function getFeaturesComparison() {
  const allFeatures = new Set();
  Object.values(subscriptionPlans).forEach((plan) => {
    plan.features.forEach((feature) => allFeatures.add(feature));
  });

  const comparison = {};
  Object.entries(subscriptionPlans).forEach(([planId, plan]) => {
    comparison[planId] = {
      name: plan.name,
      price: plan.price,
      visibilityRadius: plan.visibilityRadius,
      features: {},
    };
    allFeatures.forEach((feature) => {
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
  getFeaturesComparison,
};