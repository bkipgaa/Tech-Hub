/**
 * subscriptionPlans.js
 * ====================
 * Subscription Plans Configuration for Technician Visibility
 *
 * VISIBILITY RULES:
 * - Free:        50km   radius  (KES 0, forever)  – KES 500 commission per job
 * - Basic:       100km  radius  (KES 1,000/month) – no commission
 * - Basic Plus:  250km  radius  (KES 2,000/month) – no commission
 * - Business:    500km  radius  (KES 4,000/month) – no commission
 * - Enterprise:  1000km radius  (KES 5,000/month) – no commission
 * - Platinum:    5000km radius  (KES 8,000/month) – no commission
 * - Test:        100km  radius  (KES 10/month)    – for testing payment flow
 *
 * Every expert is always visible. A paid plan that is not renewed falls back
 * to Free (50km). The first month on any paid plan can be taken free, once.
 *
 * Commission: a booking made while the expert is on Free owes KES 500 once the
 * work is done. Until it is paid, the client's rating and the completed job
 * are saved but don't show on the expert's profile.
 *
 * Legacy ids: 'trial' (the old 10km free trial) now means Free; 'premium'
 * is no longer sold but kept so existing subscribers keep it until it ends.
 *
 * @version 3.0.0 – Free 50km with commission; paid plans 100km–5000km
 */

/** KES owed on each job an expert gets while on the Free plan */
const COMMISSION_PER_JOB = 500;

const FREE_FEATURES = [
  'Free forever — no monthly fee',
  'Clients within 50km can find you',
  `KES ${COMMISSION_PER_JOB} commission on each job you get through a booking`,
  'Ratings and completed jobs show on your profile once the commission is paid',
];

/** Features every paid plan shares, after its own radius line */
const paidFeatures = (radiusLine) => [
  radiusLine,
  'No commission on jobs',
  'Ratings and completed jobs show on your profile immediately',
  'Pay monthly by M-Pesa or card — never charged automatically',
  'First month free (once per expert)',
];

const subscriptionPlans = {
  // ─────────────────────────────────────────────────────────
  // FREE — 50km, forever, KES 500 commission per job
  // ─────────────────────────────────────────────────────────
  free: {
    name: 'Free',
    visibilityRadius: 50,
    price: 0,
    durationDays: null,
    commissionPerJob: COMMISSION_PER_JOB,
    features: FREE_FEATURES,
  },

  // ─────────────────────────────────────────────────────────
  // TRIAL (legacy — the old 10km trial; now the same as Free)
  // ─────────────────────────────────────────────────────────
  trial: {
    name: 'Free',
    visibilityRadius: 50,
    price: 0,
    durationDays: null,
    commissionPerJob: COMMISSION_PER_JOB,
    features: FREE_FEATURES,
  },

  // ─────────────────────────────────────────────────────────
  // TEST (for QA / payment integration)
  // ─────────────────────────────────────────────────────────
  test: {
    name: 'Test Plan',
    visibilityRadius: 100,
    price: 10,
    durationDays: 30,
    commissionPerJob: 0,
    features: paidFeatures('100km visibility radius (test payments only)'),
  },

  // ─────────────────────────────────────────────────────────
  // BASIC — KES 1,000 / 100km
  // ─────────────────────────────────────────────────────────
  basic: {
    name: 'Basic',
    visibilityRadius: 100,
    price: 1000,
    durationDays: 30,
    commissionPerJob: 0,
    features: paidFeatures('Clients within 100km can find you (your town and nearby towns)'),
  },

  // ─────────────────────────────────────────────────────────
  // BASIC PLUS — KES 2,000 / 250km
  // ─────────────────────────────────────────────────────────
  basicPlus: {
    name: 'Basic Plus',
    visibilityRadius: 250,
    price: 2000,
    durationDays: 30,
    commissionPerJob: 0,
    features: paidFeatures('Clients within 250km can find you (several counties)'),
  },

  // ─────────────────────────────────────────────────────────
  // PREMIUM (legacy — no longer sold)
  // ─────────────────────────────────────────────────────────
  premium: {
    name: 'Premium',
    visibilityRadius: 250,
    price: 3000,
    durationDays: 30,
    commissionPerJob: 0,
    legacy: true,
    features: paidFeatures('Clients within 250km can find you (several counties)'),
  },

  // ─────────────────────────────────────────────────────────
  // BUSINESS — KES 4,000 / 500km
  // ─────────────────────────────────────────────────────────
  business: {
    name: 'Business',
    visibilityRadius: 500,
    price: 4000,
    durationDays: 30,
    commissionPerJob: 0,
    features: paidFeatures('Clients within 500km can find you (most of Kenya)'),
  },

  // ─────────────────────────────────────────────────────────
  // ENTERPRISE — KES 5,000 / 1000km
  // ─────────────────────────────────────────────────────────
  enterprise: {
    name: 'Enterprise',
    visibilityRadius: 1000,
    price: 5000,
    durationDays: 30,
    commissionPerJob: 0,
    features: paidFeatures('Clients within 1,000km can find you (all of Kenya)'),
  },

  // ─────────────────────────────────────────────────────────
  // PLATINUM — KES 8,000 / 5000km  (internal id: 'unlimited')
  // ─────────────────────────────────────────────────────────
  unlimited: {
    name: 'Platinum',
    visibilityRadius: 5000,
    price: 8000,
    durationDays: 30,
    commissionPerJob: 0,
    features: paidFeatures('Clients within 5,000km can find you (Kenya and East Africa)'),
  },
};

// ═══════════════════════════════════════════════════════════
// Plans List — used in dropdowns and API responses
// ═══════════════════════════════════════════════════════════
const plansList = [
  { id: 'free',       name: 'Free',        visibilityRadius: 50,   price: 0,    commissionPerJob: COMMISSION_PER_JOB, duration: 'Forever', description: `Local coverage (50km) — KES ${COMMISSION_PER_JOB} commission per job` },
  { id: 'test',       name: 'Test Plan',   visibilityRadius: 100,  price: 10,   commissionPerJob: 0, duration: '30 days', description: 'Test payment flow (KES 10)' },
  { id: 'basic',      name: 'Basic',       visibilityRadius: 100,  price: 1000, commissionPerJob: 0, duration: '30 days', description: 'Town and nearby towns (100km)' },
  { id: 'basicPlus',  name: 'Basic Plus',  visibilityRadius: 250,  price: 2000, commissionPerJob: 0, duration: '30 days', description: 'Several counties (250km)' },
  { id: 'business',   name: 'Business',    visibilityRadius: 500,  price: 4000, commissionPerJob: 0, duration: '30 days', description: 'Most of Kenya (500km)' },
  { id: 'enterprise', name: 'Enterprise',  visibilityRadius: 1000, price: 5000, commissionPerJob: 0, duration: '30 days', description: 'All of Kenya (1,000km)' },
  { id: 'unlimited',  name: 'Platinum',    visibilityRadius: 5000, price: 8000, commissionPerJob: 0, duration: '30 days', description: 'Kenya and East Africa (5,000km)' },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Return the smallest/cheapest plan that covers a given radius.
 */
function getPlanByRadius(radius) {
  const radiusThresholds = [
    { maxRadius: 50,   plan: 'free' },
    { maxRadius: 100,  plan: 'basic' },
    { maxRadius: 250,  plan: 'basicPlus' },
    { maxRadius: 500,  plan: 'business' },
    { maxRadius: 1000, plan: 'enterprise' },
    { maxRadius: 5000, plan: 'unlimited' },
  ];
  for (const threshold of radiusThresholds) {
    if (radius <= threshold.maxRadius) {
      return threshold.plan;
    }
  }
  return 'unlimited';
}

function getVisibilityDescription(planId) {
  const plan = subscriptionPlans[planId] || subscriptionPlans.free;

  const r = plan.visibilityRadius;
  let context = '';
  if (r <= 50)        context = ' (Local)';
  else if (r <= 100)  context = ' (Town and nearby towns)';
  else if (r <= 250)  context = ' (Several counties)';
  else if (r <= 500)  context = ' (Most of Kenya)';
  else if (r <= 1000) context = ' (All of Kenya)';
  else                context = ' (Kenya and East Africa)';

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
    'free',
    'test',
    'basic',
    'basicPlus',
    'business',
    'enterprise',
    'unlimited',
  ];
  const currentIndex = upgradeOrder.indexOf(currentPlanId === 'trial' ? 'free' : currentPlanId);
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
  if (!plan) return { valid: false, message: 'Invalid subscription plan', maxAllowedRadius: subscriptionPlans.free.visibilityRadius };

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

// ═══════════════════════════════════════════════════════════
// EFFECTIVE PLAN — what an expert actually gets right now
// ═══════════════════════════════════════════════════════════
// Every expert stays visible: a paid plan (or free month) counts until its
// endDate; the old trial, a lapsed paid plan or the Free plan all mean Free
// (50 km, commission per job), forever.
const FREE_PLANS = ['free', 'trial'];

function getEffectivePlan(subscription, now = new Date()) {
  const plan = subscription?.plan || 'free';
  const free = {
    plan: 'free',
    visibilityRadius: subscriptionPlans.free.visibilityRadius,
    commissionPerJob: COMMISSION_PER_JOB,
    paid: false,
  };

  if (FREE_PLANS.includes(plan) || subscription?.isTrial || !subscriptionPlans[plan]) return free;

  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  if (!endDate || endDate <= now) return free;

  return { plan, visibilityRadius: subscriptionPlans[plan].visibilityRadius, commissionPerJob: 0, paid: true };
}

module.exports = {
  COMMISSION_PER_JOB,
  subscriptionPlans,
  plansList,
  getEffectivePlan,
  getPlanByRadius,
  getVisibilityDescription,
  isPlanActive,
  getUpgradePath,
  calculatePlanSavings,
  validatePlanCompatibility,
  getFeaturesComparison,
};
