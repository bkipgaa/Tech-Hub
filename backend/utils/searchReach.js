/**
 * searchReach.js
 * ==============
 * Decides which experts a client's search shows, and in what order.
 *
 * - An expert's plan radius is what they are promised: inside it (and inside
 *   the client's search radius) they are always a candidate.
 * - When fewer than MIN_NEARBY_RESULTS experts qualify, the nearest experts
 *   further away fill the gap, on any plan. They are flagged extendedReach so
 *   the results can say they are further than usual.
 * - By default, paid experts are listed above Free ones, and further-away
 *   experts come last, nearest first.
 */

const { getEffectivePlan } = require('./subscriptionPlans');

/** Fewer results than this and experts further away are added */
const MIN_NEARBY_RESULTS = 5;
/** The furthest an expert is ever shown from a client: the largest plan's reach */
const MAX_EXTENDED_REACH_KM = 5000;

const isPaidPlan = (tech, now) => getEffectivePlan(tech?.subscription, now).paid;

const byDistance = (a, b) => a.distance - b.distance;

/**
 * @param {Object[]} candidates - Experts with a distance in km (null when unknown)
 * @param {number} searchRadius - The client's search radius in km
 * @returns {Object[]} The experts to show
 */
function withinReach(candidates, searchRadius, now) {
  const within = [];
  const beyond = [];

  candidates.forEach((tech) => {
    const limit = Math.min(getEffectivePlan(tech.subscription, now).visibilityRadius, searchRadius);
    if (tech.distance === null || tech.distance === undefined || tech.distance <= limit) within.push(tech);
    else if (tech.distance <= MAX_EXTENDED_REACH_KM) beyond.push(tech);
  });

  const extras = beyond
    .sort(byDistance)
    .slice(0, Math.max(0, MIN_NEARBY_RESULTS - within.length))
    .map((tech) => ({ ...tech, extendedReach: true }));

  return [...within, ...extras];
}

/**
 * Default order, keeping the existing order within each group: paid experts,
 * then Free experts, then further-away experts nearest first.
 * Sorts in place and returns the list.
 */
function rankByPlan(techs, now) {
  const group = (tech) => {
    if (tech.extendedReach) return 2;
    return isPaidPlan(tech, now) ? 0 : 1;
  };
  return techs.sort((a, b) => group(a) - group(b)
    || (a.extendedReach && b.extendedReach ? byDistance(a, b) : 0));
}

module.exports = { MIN_NEARBY_RESULTS, MAX_EXTENDED_REACH_KM, isPaidPlan, withinReach, rankByPlan };
