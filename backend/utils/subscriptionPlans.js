/**
 * subscriptionPlans.js
 * ====================
 * Subscription Plans Configuration for Technician Visibility
 * 
 * This module defines all subscription plans available to technicians,
 * their visibility radii, pricing, and helper functions for plan management.
 * 
 * VISIBILITY RULES:
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

/**
 * Subscription Plans Master Object
 * 
 * Each plan has the following properties:
 * - name: Display name for the plan
 * - visibilityRadius: Maximum distance (in km) where technician appears in searches
 * - price: Monthly cost in Kenyan Shillings (KES)
 * - durationDays: Subscription duration in days (typically 30 days = 1 month)
 * - features: Array of features included in the plan
 * 
 * Plan naming convention:
 * - Use camelCase for plan IDs (e.g., 'basicPlus', not 'basic-plus')
 * - This matches the Technician model's subscription.plan enum values
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
    visibilityRadius: 10,      // 10 kilometers visibility radius
    price: 0,                   // Free
    durationDays: 30,          // 30 days trial period
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
    visibilityRadius: 10,      // 10 kilometers visibility radius
    price: 0,                   // Free
    durationDays: 30,          // 30 days duration (renewable)
    features: [
      '10km visibility radius',
      'Basic profile listing',
      'Service listing (up to 5 services)',
      'Basic support'
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
    visibilityRadius: 10,      // 10 kilometers visibility radius
    price: 500,                // KES 500 per month (~$5 USD)
    durationDays: 30,          // 30 days subscription
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
    visibilityRadius: 50,      // 50 kilometers visibility radius
    price: 1000,               // KES 1000 per month (~$10 USD)
    durationDays: 30,          // 30 days subscription
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
    visibilityRadius: 100,     // 100 kilometers visibility radius
    price: 1500,               // KES 1500 per month (~$15 USD)
    durationDays: 30,          // 30 days subscription
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
    visibilityRadius: 300,     // 300 kilometers visibility radius
    price: 2000,               // KES 2000 per month (~$20 USD)
    durationDays: 30,          // 30 days subscription
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
    visibilityRadius: 600,     // 600 kilometers visibility radius
    price: 3000,               // KES 3000 per month (~$30 USD)
    durationDays: 30,          // 30 days subscription
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
    visibilityRadius: 1000,    // 1000 kilometers visibility radius (nationwide)
    price: 5000,               // KES 5000 per month (~$50 USD)
    durationDays: 30,          // 30 days subscription
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
 * 
 * Used for dropdown menus, UI components, and API responses.
 * Provides a simplified view of available plans.
 * 
 * Each item includes:
 * - id: Unique identifier matching subscriptionPlans key
 * - name: Display name
 * - visibilityRadius: Coverage in kilometers
 * - price: Monthly cost in KES
 * - duration: Human-readable duration
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

/**
 * Get Plan by Visibility Radius
 * 
 * Determines the minimum plan required to achieve a given visibility radius.
 * Useful for upgrade recommendations and plan comparisons.
 * 
 * @param {number} radius - Desired visibility radius in kilometers
 * @returns {string} Plan ID that provides at least the requested radius
 * 
 * @example
 * getPlanByRadius(75) // Returns 'premium' (100km radius)
 * getPlanByRadius(25) // Returns 'basicPlus' (50km radius)
 * getPlanByRadius(5)  // Returns 'trial' (10km radius)
 */
function getPlanByRadius(radius) {
  // Define radius thresholds and their corresponding plans
  // Plans are ordered from smallest to largest radius
  const radiusThresholds = [
    { maxRadius: 10, plan: 'trial' },      // 0-10km: Trial/Free/Basic
    { maxRadius: 50, plan: 'basicPlus' },   // 11-50km: Basic-Plus
    { maxRadius: 100, plan: 'premium' },    // 51-100km: Premium
    { maxRadius: 300, plan: 'business' },   // 101-300km: Business
    { maxRadius: 600, plan: 'enterprise' }, // 301-600km: Enterprise
    { maxRadius: 1000, plan: 'unlimited' }  // 601-1000km: Unlimited
  ];
  
  // Find the first plan that meets or exceeds the requested radius
  for (const threshold of radiusThresholds) {
    if (radius <= threshold.maxRadius) {
      return threshold.plan;
    }
  }
  
  // Default to unlimited for radii > 1000km
  return 'unlimited';
}

/**
 * Get Visibility Description
 * 
 * Returns a human-readable description of a plan's visibility coverage.
 * 
 * @param {string} planId - ID of the subscription plan
 * @returns {string} Human-readable visibility description
 * 
 * @example
 * getVisibilityDescription('premium') // Returns '100km visibility radius'
 * getVisibilityDescription('unlimited') // Returns '1000km visibility radius (Nationwide)'
 */
function getVisibilityDescription(planId) {
  const plan = subscriptionPlans[planId];
  
  if (!plan) {
    return '10km visibility radius (Default)';
  }
  
  // Add special description for unlimited plan
  if (planId === 'unlimited') {
    return `${plan.visibilityRadius}km visibility radius (Nationwide)`;
  }
  
  // Add context based on radius
  let context = '';
  if (plan.visibilityRadius <= 10) {
    context = ' (Local)';
  } else if (plan.visibilityRadius <= 50) {
    context = ' (Extended Local)';
  } else if (plan.visibilityRadius <= 100) {
    context = ' (Regional)';
  } else if (plan.visibilityRadius <= 300) {
    context = ' (Provincial)';
  } else if (plan.visibilityRadius <= 600) {
    context = ' (National)';
  } else {
    context = ' (Nationwide)';
  }
  
  return `${plan.visibilityRadius}km visibility radius${context}`;
}

/**
 * Check if Subscription Plan is Active
 * 
 * Determines whether a technician's subscription is currently active
 * based on the plan type and relevant expiration dates.
 * 
 * IMPORTANT: This function is critical for search visibility.
 * Technicians with inactive subscriptions are hidden from search results.
 * 
 * @param {string} plan - Plan ID (e.g., 'premium', 'basic')
 * @param {Date} endDate - End date for paid subscriptions
 * @param {Date} trialEndDate - End date for trial/free subscriptions
 * @returns {boolean} True if subscription is active, false otherwise
 * 
 * @example
 * // Check if premium subscription is active
 * isPlanActive('premium', '2024-12-31', null) // Returns true if current date < Dec 31, 2024
 * 
 * // Check if trial is active
 * isPlanActive('trial', null, '2024-01-15') // Returns true if current date < Jan 15, 2024
 */
function isPlanActive(plan, endDate, trialEndDate) {
  const now = new Date();
  
  // Handle trial or free plans
  if (plan === 'trial' || plan === 'free') {
    // If trial has an end date, check it
    if (trialEndDate) {
      const trialEnd = new Date(trialEndDate);
      const isActive = now < trialEnd;
      
      if (!isActive) {
        console.log(`Trial expired on ${trialEnd.toISOString().split('T')[0]}`);
      }
      
      return isActive;
    }
    
    // If no trial end date specified, assume active
    // This provides backward compatibility with existing data
    console.log('No trial end date specified, assuming trial is active');
    return true;
  }
  
  // Handle paid subscriptions (basic, premium, business, etc.)
  if (endDate) {
    const subscriptionEnd = new Date(endDate);
    const isActive = now < subscriptionEnd;
    
    if (!isActive) {
      console.log(`Subscription expired on ${subscriptionEnd.toISOString().split('T')[0]}`);
    }
    
    return isActive;
  }
  
  // If no relevant dates provided, subscription is inactive
  console.warn(`No end date found for plan: ${plan}`);
  return false;
}

/**
 * Get Plan Upgrade Path
 * 
 * Returns the recommended upgrade sequence from a current plan
 * to help technicians understand their options.
 * 
 * @param {string} currentPlanId - Current subscription plan ID
 * @returns {Array} Array of plan IDs in recommended upgrade order
 * 
 * @example
 * getUpgradePath('basic') // Returns ['basicPlus', 'premium', 'business', 'enterprise', 'unlimited']
 */
function getUpgradePath(currentPlanId) {
  const upgradeOrder = ['trial', 'free', 'basic', 'basicPlus', 'premium', 'business', 'enterprise', 'unlimited'];
  const currentIndex = upgradeOrder.indexOf(currentPlanId);
  
  if (currentIndex === -1) {
    return upgradeOrder;
  }
  
  return upgradeOrder.slice(currentIndex + 1);
}

/**
 * Calculate Plan Savings
 * 
 * Calculates savings when purchasing longer subscription periods.
 * Useful for offering annual plans and discounts.
 * 
 * @param {string} planId - Plan ID
 * @param {number} months - Number of months (1, 3, 6, 12)
 * @returns {Object} Savings calculation
 */
function calculatePlanSavings(planId, months = 1) {
  const plan = subscriptionPlans[planId];
  
  if (!plan) {
    return { monthlyPrice: 0, totalPrice: 0, savings: 0, savingsPercentage: 0 };
  }
  
  const monthlyPrice = plan.price;
  const regularTotal = monthlyPrice * months;
  
  // Define discount tiers (can be customized)
  let discount = 0;
  if (months >= 12) discount = 0.20; // 20% off for annual
  else if (months >= 6) discount = 0.10; // 10% off for 6 months
  else if (months >= 3) discount = 0.05; // 5% off for quarterly
  
  const discountedTotal = regularTotal * (1 - discount);
  const savings = regularTotal - discountedTotal;
  
  return {
    monthlyPrice,
    months,
    regularTotal,
    discountedTotal,
    savings,
    savingsPercentage: discount * 100
  };
}

/**
 * Validate Plan Compatibility
 * 
 * Checks if a technician's service radius is compatible with their subscription plan.
 * Technicians cannot offer service beyond their paid visibility radius.
 * 
 * @param {string} planId - Subscription plan ID
 * @param {number} serviceRadius - Technician's desired service radius in km
 * @returns {Object} Validation result with status and message
 */
function validatePlanCompatibility(planId, serviceRadius) {
  const plan = subscriptionPlans[planId];
  
  if (!plan) {
    return {
      valid: false,
      message: 'Invalid subscription plan',
      maxAllowedRadius: 10
    };
  }
  
  const maxAllowedRadius = plan.visibilityRadius;
  
  if (serviceRadius > maxAllowedRadius) {
    return {
      valid: false,
      message: `Service radius (${serviceRadius}km) exceeds plan's visibility radius (${maxAllowedRadius}km). Please upgrade to a higher plan.`,
      maxAllowedRadius,
      suggestedPlan: getPlanByRadius(serviceRadius)
    };
  }
  
  return {
    valid: true,
    message: 'Service radius is compatible with subscription plan',
    maxAllowedRadius
  };
}

/**
 * Get Plan Features Comparison
 * 
 * Returns a comparison matrix of features across all plans.
 * Useful for displaying feature comparison tables.
 * 
 * @returns {Object} Feature comparison object
 */
function getFeaturesComparison() {
  const allFeatures = new Set();
  const comparison = {};
  
  // Collect all unique features
  Object.entries(subscriptionPlans).forEach(([planId, plan]) => {
    plan.features.forEach(feature => allFeatures.add(feature));
  });
  
  // Build comparison matrix
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

// Export all functions and constants for use in other modules
module.exports = {
  // Main plans configuration
  subscriptionPlans,
  plansList,
  
  // Helper functions
  getPlanByRadius,
  getVisibilityDescription,
  isPlanActive,
  getUpgradePath,
  calculatePlanSavings,
  validatePlanCompatibility,
  getFeaturesComparison
};