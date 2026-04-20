/**
 * Subscription Plans Configuration
 * Defines visibility radius for each plan
 */

const subscriptionPlans = {
  trial: {
    name: 'Trial',
    visibilityRadius: 50, // 50km for trial
    price: 0,
    durationDays: 30,
    features: ['Basic visibility', 'Profile listing', 'Up to 50km radius']
  },
  free: {
    name: 'Free',
    visibilityRadius: 10, // 10km for free plan
    price: 0,
    durationDays: null,
    features: ['Basic visibility', 'Profile listing', 'Up to 10km radius']
  },
  basic: {
    name: 'Basic',
    visibilityRadius: 30, // 30km for basic plan
    price: 500, // KES 500 per month
    durationDays: 30,
    features: ['Enhanced visibility', 'Profile listing', 'Up to 30km radius', 'Priority support']
  },
  premium: {
    name: 'Premium',
    visibilityRadius: 50, // 50km for premium plan
    price: 1000, // KES 1000 per month
    durationDays: 30,
    features: ['High visibility', 'Profile listing', 'Up to 50km radius', 'Priority support', 'Featured listing']
  },
  business: {
    name: 'Business',
    visibilityRadius: 200, // 200km for business plan
    price: 2000, // KES 2000 per month
    durationDays: 30,
    features: ['Regional visibility', 'Profile listing', 'Up to 200km radius', 'Priority support', 'Featured listing', 'Analytics']
  },
  enterprise: {
    name: 'Enterprise',
    visibilityRadius: 500, // 500km for enterprise plan
    price: 3000, // KES 3000 per month
    durationDays: 30,
    features: ['National visibility', 'Profile listing', 'Up to 500km radius', 'Priority support', 'Featured listing', 'Analytics', 'Verified badge']
  },
  unlimited: {
    name: 'Unlimited',
    visibilityRadius: 1000, // 1000km for unlimited plan
    price: 5000, // KES 5000 per month
    durationDays: 30,
    features: ['Global visibility', 'Profile listing', 'Up to 1000km radius', 'Priority support', 'Featured listing', 'Analytics', 'Verified badge', 'API access']
  }
};

module.exports = { subscriptionPlans };