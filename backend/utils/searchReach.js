/**
 * searchReach.js
 * ==============
 * Decides which experts a client's search shows, and in what order.
 *
 * Technical Services (data/serviceBuckets.js):
 * - An expert's plan radius is what they are promised: inside it (and inside
 *   the client's search radius) they are always a candidate.
 * - When fewer than MIN_NEARBY_RESULTS experts qualify, the nearest experts
 *   further away fill the gap, on any plan. They are flagged extendedReach so
 *   the results can say they are further than usual.
 * - By default, paid experts are listed above Free ones, and further-away
 *   experts come last, nearest first.
 *
 * Every other bucket is free for now: experts reach NON_TECHNICAL_FREE_RADIUS_KM
 * whatever their plan, nobody further away is added, and plans don't change
 * the order.
 */

const { getEffectivePlan } = require('./subscriptionPlans');
const { isTechnicalCategory, NON_TECHNICAL_FREE_RADIUS_KM } = require('../data/serviceBuckets');

/** Fewer results than this and experts further away are added */
const MIN_NEARBY_RESULTS = 5;
/** The furthest an expert is ever shown from a client: the largest plan's reach */
const MAX_EXTENDED_REACH_KM = 5000;

const isPaidPlan = (tech, now) => getEffectivePlan(tech?.subscription, now).paid;

/** Main categories an expert works in */
const expertCategories = (tech) => [
  tech?.mainCategory,
  ...(tech?.mainCategories || []),
  ...(tech?.serviceCategories || []).map((sc) => sc?.mainCategory),
].filter(Boolean);

/**
 * Whether plan rules apply to this expert in this search. With a category
 * searched, it's that category's bucket; otherwise the expert counts as
 * technical if they offer any technical category (or none is recorded).
 */
function usesPlanReach(tech, mainCategory) {
  if (mainCategory) return isTechnicalCategory(mainCategory);
  const categories = expertCategories(tech);
  return !categories.length || categories.some(isTechnicalCategory);
}

/** How far (km) clients can find this expert in this search */
function reachKm(tech, mainCategory, now) {
  return usesPlanReach(tech, mainCategory)
    ? getEffectivePlan(tech?.subscription, now).visibilityRadius
    : NON_TECHNICAL_FREE_RADIUS_KM;
}

const byDistance = (a, b) => a.distance - b.distance;

/**
 * @param {Object[]} candidates - Experts with a distance in km (null when unknown)
 * @param {number} searchRadius - The client's search radius in km
 * @param {Date} [now]
 * @param {string} [mainCategory] - The category searched, when there is one
 * @returns {Object[]} The experts to show. Each has visibilityRadius set to
 *   its reach in this search; non-technical ones are flagged freeReach.
 */
function withinReach(candidates, searchRadius, now, mainCategory) {
  const within = [];
  const beyond = [];

  candidates.forEach((tech) => {
    const planReach = usesPlanReach(tech, mainCategory);
    const reach = reachKm(tech, mainCategory, now);
    const shown = { ...tech, visibilityRadius: reach, ...(planReach ? {} : { freeReach: true }) };
    const limit = Math.min(reach, searchRadius);
    if (tech.distance === null || tech.distance === undefined || tech.distance <= limit) within.push(shown);
    else if (planReach && tech.distance <= MAX_EXTENDED_REACH_KM) beyond.push(shown);
  });

  const extras = beyond
    .sort(byDistance)
    .slice(0, Math.max(0, MIN_NEARBY_RESULTS - within.length))
    .map((tech) => ({ ...tech, extendedReach: true }));

  return [...within, ...extras];
}

/**
 * Default order, keeping the existing order within each group: paid experts,
 * then Free experts, then further-away experts nearest first. Experts shown
 * on free reach (non-technical) are never lifted by a plan.
 * Sorts in place and returns the list.
 */
function rankByPlan(techs, now) {
  const group = (tech) => {
    if (tech.extendedReach) return 2;
    return !tech.freeReach && isPaidPlan(tech, now) ? 0 : 1;
  };
  return techs.sort((a, b) => group(a) - group(b)
    || (a.extendedReach && b.extendedReach ? byDistance(a, b) : 0));
}

module.exports = {
  MIN_NEARBY_RESULTS,
  MAX_EXTENDED_REACH_KM,
  isPaidPlan,
  usesPlanReach,
  reachKm,
  withinReach,
  rankByPlan,
};
