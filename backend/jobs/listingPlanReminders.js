/**
 * listingPlanReminders.js
 * =======================
 * Daily emails for Stays & Spaces listings whose free months or paid months
 * are ending: 7, 3 and 1 day(s) before, and once when a listing becomes
 * hidden. Approved, live (not paused) listings only. A lister gets one email
 * a day covering all their affected listings.
 *
 * Each listing gets each reminder once per end date (recorded on
 * listing.reminders), so a restart or a second run the same day never sends
 * twice. If the job misses a day it sends the most urgent reminder still due,
 * and a failed email is retried on the next run.
 *
 * Run via node-cron in server.js.
 */

const Listing = require('../models/Listing');
const notify = require('../services/notificationService');
const { PRICE_PER_LISTING, freeUntil } = require('../utils/listingPlan');

const DAY_MS = 24 * 60 * 60 * 1000;
const STAGES = [1, 3, 7];   // days before the end
const ENDED_GRACE_DAYS = 3; // still send the "hidden" notice if the job was down for a day or two

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Which reminder (if any) is due for this end date.
 * daysLeft 7..4 → 'd7', 3..2 → 'd3', 1 → 'd1', ended → 'ended'.
 */
const dueStage = (until, now) => {
  const msLeft = until - now;
  if (msLeft <= 0) return msLeft > -ENDED_GRACE_DAYS * DAY_MS ? 'ended' : null;
  const daysLeft = Math.ceil(msLeft / DAY_MS);
  const stage = STAGES.find((s) => daysLeft <= s);
  return stage ? `d${stage}` : null;
};

const sendListingPlanReminders = async (now = new Date()) => {
  let sent = 0;
  try {
    console.log('⏰ [cron] Checking listings that are about to expire...');
    const from = new Date(now.getTime() - ENDED_GRACE_DAYS * DAY_MS);
    const to = new Date(now.getTime() + Math.max(...STAGES) * DAY_MS);

    const listings = await Listing.find({ status: 'active', activeUntil: { $gt: from, $lte: to } })
      .select('title owner activeUntil paidUntil freeSlot reminders')
      .populate('owner', 'email firstName lastName listingPlan');

    // Group what's due by owner
    const byOwner = new Map();
    for (const l of listings) {
      if (!l.owner?.email) continue;
      const until = new Date(l.activeUntil);
      const stage = dueStage(until, now);
      if (!stage) continue;
      const sameEnd = l.reminders?.until && +new Date(l.reminders.until) === +until;
      const already = sameEnd ? l.reminders.sent || [] : [];
      if (already.includes(stage)) continue;

      const free = l.freeSlot && freeUntil(l.owner) && +freeUntil(l.owner) === +until;
      const key = String(l.owner._id);
      if (!byOwner.has(key)) byOwner.set(key, { owner: l.owner, entries: [] });
      byOwner.get(key).entries.push({ listing: l, until, stage, already, free });
    }

    for (const { owner, entries } of byOwner.values()) {
      const result = await notify.listingPlanReminder({
        email: owner.email,
        name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'there',
        price: PRICE_PER_LISTING,
        items: entries.map((e) => ({
          title: e.listing.title,
          endDate: formatDate(e.until),
          daysLeft: Math.max(1, Math.ceil((e.until - now) / DAY_MS)),
          ended: e.stage === 'ended',
          free: !!e.free,
        })),
      });
      if (!result?.success) continue; // try again on the next run

      await Promise.all(
        entries.map((e) =>
          Listing.updateOne({ _id: e.listing._id }, { $set: { reminders: { until: e.until, sent: [...e.already, e.stage] } } })
        )
      );
      sent++;
    }
    console.log(`⏰ [cron] Sent ${sent} listing reminder email(s)`);
  } catch (err) {
    console.error('⏰ [cron] Listing reminders FAILED:', err);
  }
  return sent;
};

module.exports = { sendListingPlanReminders, dueStage };
