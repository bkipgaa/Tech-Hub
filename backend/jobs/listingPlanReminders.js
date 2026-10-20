/**
 * listingPlanReminders.js
 * =======================
 * Daily emails for Stays & Spaces listers whose plan (free months or a paid
 * month) is ending: 7, 3 and 1 day(s) before, and once when their listings
 * become hidden. Only listers with at least one live (not paused) listing.
 *
 * Each lister gets each reminder once per end date (recorded on
 * user.listingPlan.reminders), so a restart or a second run the same day
 * never sends twice. If the job misses a day it sends the most urgent
 * reminder that is still due rather than skipping it.
 *
 * Run via node-cron in server.js.
 */

const User = require('../models/User');
const Listing = require('../models/Listing');
const notify = require('../services/notificationService');
const { activeUntil, MONTHLY_PRICE } = require('../utils/listingPlan');

const DAY_MS = 24 * 60 * 60 * 1000;
const STAGES = [1, 3, 7];            // days before the end
const ENDED_GRACE_DAYS = 3;          // still send the "hidden" notice if the job was down for a day or two

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
    console.log('⏰ [cron] Checking listing plans that are about to end...');
    const from = new Date(now.getTime() - ENDED_GRACE_DAYS * DAY_MS);
    const to = new Date(now.getTime() + Math.max(...STAGES) * DAY_MS);

    const users = await User.find({
      $or: [
        { 'listingPlan.freeUntil': { $gt: from, $lte: to } },
        { 'listingPlan.paidUntil': { $gt: from, $lte: to } },
      ],
    }).select('email firstName lastName listingPlan');

    for (const user of users) {
      const until = activeUntil(user);
      if (!until) continue;
      const stage = dueStage(until, now);
      if (!stage) continue;

      // A later end date (e.g. they paid) starts a fresh set of reminders
      const record = user.listingPlan.reminders || {};
      const sameEnd = record.until && +new Date(record.until) === +until;
      const already = sameEnd ? record.sent || [] : [];
      if (already.includes(stage)) continue;

      const listings = await Listing.countDocuments({ owner: user._id, status: 'active' });
      if (!listings) continue;

      const { paidUntil } = user.listingPlan;
      const onFree = !paidUntil || +new Date(paidUntil) < +until;
      const result = await notify.listingPlanReminder({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'there',
        phase: stage === 'ended' ? 'ended' : onFree ? 'free' : 'paid',
        daysLeft: stage === 'ended' ? 0 : Math.ceil((until - now) / DAY_MS),
        endDate: formatDate(until),
        listings,
        price: MONTHLY_PRICE,
      });
      if (!result?.success) continue; // try again on the next run

      user.listingPlan.reminders = { until, sent: [...already, stage] };
      await user.save({ validateModifiedOnly: true });
      sent++;
    }
    console.log(`⏰ [cron] Sent ${sent} listing plan reminder(s)`);
  } catch (err) {
    console.error('⏰ [cron] Listing plan reminders FAILED:', err);
  }
  return sent;
};

module.exports = { sendListingPlanReminders, dueStage };
