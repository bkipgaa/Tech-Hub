/**
 * plans.js
 * ========
 * Subscription plan helpers shared by the home page and the subscription page.
 */

// The KES 10 "test" plan exists to try the payment flow. Technicians don't
// see it unless VITE_SHOW_TEST_PLAN=true (e.g. on staging).
const SHOW_TEST_PLAN = import.meta.env.VITE_SHOW_TEST_PLAN === 'true';

export const isVisiblePlan = (plan) => plan?.id !== 'test' || SHOW_TEST_PLAN;

export const visiblePlans = (plans = []) => plans.filter(isVisiblePlan);
