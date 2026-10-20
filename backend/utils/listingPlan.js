/**
 * listingPlan.js
 * ==============
 * Stays & Spaces listing plan.
 *
 *   first listing → free for FREE_MONTHS months
 *   after that    → KES MONTHLY_PRICE a month covers all of the user's listings
 *   lapsed        → listings stay saved but are hidden from search until paid
 *
 * Each listing carries a copy of the owner's end date (ownerActiveUntil) so
 * search can filter on it directly.
 */

const Listing = require('../models/Listing');

const FREE_MONTHS = 6;
const MONTHLY_PRICE = 1500;

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

/** When the user's listings stop showing (free or paid, whichever is later), or null. */
const activeUntil = (user) => {
  const { freeUntil, paidUntil } = user?.listingPlan || {};
  const dates = [freeUntil, paidUntil].filter(Boolean).map((d) => new Date(d).getTime());
  return dates.length ? new Date(Math.max(...dates)) : null;
};

/** Plan summary for the lister's dashboard. */
const planSummary = (user, now = new Date()) => {
  const until = activeUntil(user);
  const plan = user?.listingPlan || {};
  const inFree = !!plan.freeUntil && new Date(plan.freeUntil) > now && !(plan.paidUntil && new Date(plan.paidUntil) > new Date(plan.freeUntil));
  return {
    started: !!plan.freeUntil,
    activeUntil: until,
    isActive: !!until && until > now,
    phase: !until ? 'not_started' : until <= now ? 'lapsed' : inFree ? 'free' : 'paid',
    daysLeft: until ? Math.max(0, Math.ceil((until - now) / 86400000)) : null,
    freeMonths: FREE_MONTHS,
    monthlyPrice: MONTHLY_PRICE,
    currency: 'KES',
  };
};

/** Start the free months on the user's first listing. Returns true if it changed the user. */
const startFreePeriodIfNeeded = (user, now = new Date()) => {
  if (!user.listingPlan) user.listingPlan = {};
  if (user.listingPlan.freeUntil) return false;
  user.listingPlan.freeUntil = addMonths(now, FREE_MONTHS);
  return true;
};

/** Copy the owner's end date onto all their listings. */
const syncOwnerListings = (user) =>
  Listing.updateMany({ owner: user._id }, { $set: { ownerActiveUntil: activeUntil(user) } });

/**
 * Record a payment of `months` months (idempotent per reference) and extend
 * the paid period from today or from the current end date, whichever is later.
 * Returns false if this reference was already applied.
 */
const applyPayment = async (user, { amount, months = 1, method, reference, checkoutRequestID }, now = new Date()) => {
  const plan = user.listingPlan || (user.listingPlan = {});
  plan.payments = plan.payments || [];
  const key = reference || checkoutRequestID;
  if (key && plan.payments.some((p) => p.reference === key || p.checkoutRequestID === key)) return false;

  const current = activeUntil(user);
  const from = current && current > now ? current : now;
  plan.paidUntil = addMonths(from, months);
  plan.payments.push({ amount, months, method, reference, checkoutRequestID, paidAt: now });
  plan.pending = undefined;
  await user.save({ validateModifiedOnly: true });
  await syncOwnerListings(user);
  return true;
};

/**
 * One-off upgrade for listings created before towns and the listing plan
 * existed. Safe to run on every start: it only touches listings that still
 * need it.
 *   - copies the old single "area" field into "town"
 *   - starts each such owner's free months from their first listing's date
 *     and copies the end date onto their listings
 */
const migrateListings = async () => {
  const User = require('../models/User');
  const moved = await Listing.updateMany(
    { $or: [{ town: { $exists: false } }, { town: '' }, { town: null }], area: { $nin: [null, ''] } },
    [{ $set: { town: '$area' } }],
    { updatePipeline: true }
  );

  const owners = await Listing.aggregate([
    { $match: { ownerActiveUntil: null } },
    { $group: { _id: '$owner', first: { $min: '$createdAt' } } },
  ]);
  for (const o of owners) {
    const user = await User.findById(o._id);
    if (!user) continue;
    if (!user.listingPlan?.freeUntil) {
      user.listingPlan = user.listingPlan || {};
      user.listingPlan.freeUntil = addMonths(o.first || new Date(), FREE_MONTHS);
      await user.save({ validateModifiedOnly: true });
    }
    await syncOwnerListings(user);
  }
  if (moved.modifiedCount || owners.length) {
    console.log(`🏠 Listings upgraded: ${moved.modifiedCount} town(s) set, ${owners.length} owner plan(s) started`);
  }
};

module.exports = {
  migrateListings,
  FREE_MONTHS,
  MONTHLY_PRICE,
  addMonths,
  activeUntil,
  planSummary,
  startFreePeriodIfNeeded,
  syncOwnerListings,
  applyPayment,
};
