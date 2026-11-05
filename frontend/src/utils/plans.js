/**
 * plans.js
 * ========
 * Subscription plan helpers shared by the home page and the subscription page.
 * Plan facts match backend/utils/subscriptionPlans.js.
 */

// The KES 10 "test" plan exists to try the payment flow. Technicians don't
// see it unless VITE_SHOW_TEST_PLAN=true (e.g. on staging).
const SHOW_TEST_PLAN = import.meta.env.VITE_SHOW_TEST_PLAN === 'true';

export const isVisiblePlan = (plan) => plan?.id !== 'test' || SHOW_TEST_PLAN;

export const visiblePlans = (plans = []) => plans.filter(isVisiblePlan);

/** KES owed on each job an expert gets while on the Free plan */
export const COMMISSION_PER_JOB = 500;
export const FREE_RADIUS_KM = 1000;

/** Every plan experts can be on, smallest first (Free, then the paid plans) */
export const PLAN_TIERS = [
  { id: 'free', name: 'Free', radius: 1000, price: 0, reach: 'all of Kenya' },
  { id: 'basic', name: 'Basic', radius: 100, price: 1000, reach: 'your town and nearby towns' },
  { id: 'basicPlus', name: 'Basic Plus', radius: 250, price: 2000, reach: 'several counties' },
  { id: 'business', name: 'Business', radius: 500, price: 4000, reach: 'most of Kenya' },
  { id: 'enterprise', name: 'Enterprise', radius: 1000, price: 5000, reach: 'all of Kenya' },
  { id: 'unlimited', name: 'Platinum', radius: 5000, price: 8000, reach: 'Kenya and East Africa' },
];

export const formatKes = (n) => `KES ${Number(n || 0).toLocaleString()}`;
export const formatKm = (n) => `${Number(n || 0).toLocaleString()} km`;
