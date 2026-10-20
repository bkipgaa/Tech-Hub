/**
 * listingPlan.js
 * ==============
 * Stays & Spaces pricing, per listing.
 *
 *   first listing  → starts the lister's FREE_MONTHS free months
 *   free months    → up to FREE_LISTINGS listings are free ("free slots");
 *                    any more cost PRICE_PER_LISTING a month each
 *   after that     → every listing costs PRICE_PER_LISTING a month
 *   unpaid         → the listing stays saved but is hidden from search
 *                    (and can't be edited) until it's paid for
 *
 * Each listing stores activeUntil = the later of its paidUntil and, for a
 * free slot, the end of the free months. Search filters on it directly.
 */

const Listing = require('../models/Listing');

const FREE_MONTHS = 3;
const FREE_LISTINGS = 5;
const PRICE_PER_LISTING = 200; // KES per listing per month
const PAY_MONTHS = [1]; // each payment covers the next month only

// Listings that still count towards the free slots (rejected ones give theirs back)
const COUNTED = { status: { $ne: 'rejected' } };

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const later = (...dates) => {
  const ts = dates.filter(Boolean).map((d) => new Date(d).getTime());
  return ts.length ? new Date(Math.max(...ts)) : null;
};

/** End of the user's free months, or null if they haven't listed yet. */
const freeUntil = (user) => (user?.listingPlan?.freeUntil ? new Date(user.listingPlan.freeUntil) : null);

/** When a listing stops showing, given its owner. */
const listingActiveUntil = (listing, user) =>
  later(listing.paidUntil, listing.freeSlot ? freeUntil(user) : null);

/** Start the free months on the user's first listing. Returns true if it changed the user. */
const startFreePeriodIfNeeded = (user, now = new Date()) => {
  if (!user.listingPlan) user.listingPlan = {};
  if (user.listingPlan.freeUntil) return false;
  user.listingPlan.freeUntil = addMonths(now, FREE_MONTHS);
  return true;
};

/**
 * Decide whether a new listing gets a free slot: only while the free months
 * run and the user has fewer than FREE_LISTINGS free listings.
 * Sets listing.freeSlot and listing.activeUntil (doesn't save).
 */
const assignNewListing = async (listing, user, now = new Date()) => {
  const end = freeUntil(user);
  let freeSlot = false;
  if (end && end > now) {
    const used = await Listing.countDocuments({ owner: user._id, freeSlot: true, ...COUNTED });
    freeSlot = used < FREE_LISTINGS;
  }
  listing.freeSlot = freeSlot;
  listing.activeUntil = listingActiveUntil(listing, user);
  return listing;
};

/** Short state for one listing, for the lister's dashboard. */
const listingBilling = (listing, user, now = new Date()) => {
  const until = listing.activeUntil ? new Date(listing.activeUntil) : listingActiveUntil(listing, user);
  const covered = !!until && until > now;
  const daysLeft = until ? Math.ceil((until - now) / 86400000) : null;
  const onFree = listing.freeSlot && !!freeUntil(user) && (!listing.paidUntil || new Date(listing.paidUntil) <= freeUntil(user));
  return {
    activeUntil: until,
    covered,                       // free or paid up right now
    daysLeft: covered ? daysLeft : 0,
    coveredBy: !covered ? null : onFree ? 'free' : 'paid',
    canPay: ['active', 'paused'].includes(listing.status), // approved listings only
    needsPayment: ['active', 'paused'].includes(listing.status) && !covered,
    expiringSoon: covered && daysLeft <= 7,
  };
};

/** Summary of the free months for the lister's dashboard. */
const planSummary = async (user, now = new Date()) => {
  const end = freeUntil(user);
  const freeUsed = user ? await Listing.countDocuments({ owner: user._id, freeSlot: true, ...COUNTED }) : 0;
  return {
    started: !!end,
    freeUntil: end,
    freeActive: !!end && end > now,
    freeDaysLeft: end && end > now ? Math.ceil((end - now) / 86400000) : 0,
    freeMonths: FREE_MONTHS,
    freeListings: FREE_LISTINGS,
    freeUsed,
    pricePerListing: PRICE_PER_LISTING,
    payMonths: PAY_MONTHS,
    currency: 'KES',
  };
};

/** Recompute and save activeUntil for all of a user's listings (after the free period changes). */
const syncOwnerListings = async (user) => {
  const listings = await Listing.find({ owner: user._id }).select('freeSlot paidUntil activeUntil');
  await Promise.all(
    listings.map((l) => {
      const until = listingActiveUntil(l, user);
      return +until === +l.activeUntil ? null : Listing.updateOne({ _id: l._id }, { $set: { activeUntil: until } });
    })
  );
};

/** Price for paying `count` listings for `months` months. */
const priceFor = (count, months) => PRICE_PER_LISTING * count * months;

/**
 * Record a payment covering `listingIds` for `months` months (idempotent per
 * reference). Each listing is extended from today or from its current end
 * date, whichever is later, so paying early never loses days.
 * Returns false if this reference was already applied.
 */
const applyPayment = async (user, { listingIds, months, amount, method, reference, checkoutRequestID }, now = new Date()) => {
  const plan = user.listingPlan || (user.listingPlan = {});
  plan.payments = plan.payments || [];
  const key = reference || checkoutRequestID;
  if (key && plan.payments.some((p) => p.reference === key || p.checkoutRequestID === key)) return false;

  const listings = await Listing.find({ _id: { $in: listingIds }, owner: user._id });
  for (const l of listings) {
    const current = l.activeUntil && new Date(l.activeUntil) > now ? new Date(l.activeUntil) : now;
    l.paidUntil = addMonths(current, months);
    l.activeUntil = listingActiveUntil(l, user);
    await l.save({ validateModifiedOnly: true });
  }

  plan.payments.push({
    amount, months, method, reference, checkoutRequestID, paidAt: now,
    listingIds: listings.map((l) => l._id),
  });
  plan.pending = undefined;
  await user.save({ validateModifiedOnly: true });

  // Receipt email; never blocks or fails the payment
  require('../services/notificationService')
    .listingPlanPaid({
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'there',
      amount,
      method,
      months,
      items: listings.map((l) => ({
        title: l.title,
        until: new Date(l.activeUntil).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }),
      })),
    })
    .catch(() => {});
  return true;
};

/**
 * Upgrade older data to per-listing pricing. Safe to run on every start: it
 * only touches listings that still need it.
 *   - copies the old single "area" field into "town"
 *   - listings from before reviews existed count as approved (kept as they are)
 *   - each owner's free months run FREE_MONTHS from their first listing
 *     (shortened from the old 6 months if needed)
 *   - their first FREE_LISTINGS listings become free slots; an old account-wide
 *     paid period carries over to every listing
 */
const migrateListings = async () => {
  const User = require('../models/User');
  const raw = Listing.collection;

  const moved = await raw.updateMany(
    { $or: [{ town: { $exists: false } }, { town: '' }, { town: null }], area: { $nin: [null, ''] } },
    [{ $set: { town: '$area' } }]
  );

  // Listings without the per-listing fields yet
  const owners = await Listing.aggregate([
    { $match: { activeUntil: { $exists: false } } },
    { $group: { _id: '$owner' } },
  ]);
  for (const { _id } of owners) {
    const user = await User.findById(_id);
    const mine = await Listing.find({ owner: _id }).sort({ createdAt: 1 });
    if (!user || !mine.length) continue;

    const plan = user.listingPlan || (user.listingPlan = {});
    const first = mine[0].createdAt || new Date();
    const threeMonths = addMonths(first, FREE_MONTHS);
    if (!plan.freeUntil || new Date(plan.freeUntil) > threeMonths) {
      plan.freeUntil = threeMonths;
      await user.save({ validateModifiedOnly: true });
    }

    // Which of them are still old-style (Mongoose fills in defaults, so check the stored documents)
    const old = new Set(
      (await raw.find({ owner: _id, activeUntil: { $exists: false } }).project({ _id: 1 }).toArray()).map((d) => String(d._id))
    );
    let slots = mine.filter((l) => !old.has(String(l._id)) && l.freeSlot && l.status !== 'rejected').length;
    for (const l of mine) {
      if (!old.has(String(l._id))) continue;
      l.freeSlot = l.status !== 'rejected' && slots < FREE_LISTINGS;
      if (l.freeSlot) slots++;
      if (plan.paidUntil && !l.paidUntil) l.paidUntil = plan.paidUntil;
      l.activeUntil = listingActiveUntil(l, user);
      await l.save({ validateModifiedOnly: true });
    }
  }
  await raw.updateMany({ ownerActiveUntil: { $exists: true } }, { $unset: { ownerActiveUntil: '' } });

  if (moved.modifiedCount || owners.length) {
    console.log(`🏠 Listings upgraded: ${moved.modifiedCount} town(s) set, ${owners.length} owner(s) moved to per-listing pricing`);
  }
};

module.exports = {
  FREE_MONTHS,
  FREE_LISTINGS,
  PRICE_PER_LISTING,
  PAY_MONTHS,
  addMonths,
  freeUntil,
  listingActiveUntil,
  startFreePeriodIfNeeded,
  assignNewListing,
  listingBilling,
  planSummary,
  syncOwnerListings,
  priceFor,
  applyPayment,
  migrateListings,
};
