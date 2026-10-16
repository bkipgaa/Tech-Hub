/**
 * subscriptionReminders.js
 * ========================
 * Daily scan for plans that are about to end — paid plans (endDate) and the
 * free trial (trialEndDate). Sends a reminder 7, 3 and 1 day(s) before.
 * When a plan ends the expert stays visible on the Free plan (10 km).
 *
 * Run via node-cron in server.js.
 */

const Technician = require('../models/Technician');
const notify = require('../services/notificationService');
const { subscriptionPlans } = require('../utils/subscriptionPlans');

const REMINDER_DAYS = [7, 3, 1];
const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (d) =>
  d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

const sendExpiryReminders = async () => {
  try {
    console.log('⏰ [cron] Checking plans that are about to end...');

    const now = new Date();
    const windowEnd = new Date(now.getTime() + Math.max(...REMINDER_DAYS) * DAY_MS);

    const technicians = await Technician.find({
      $or: [
        // Paid plans
        { 'subscription.plan': { $nin: ['free', 'trial'] }, 'subscription.endDate': { $gt: now, $lte: windowEnd } },
        // Free trial
        { 'subscription.plan': 'trial', 'subscription.trialEndDate': { $gt: now, $lte: windowEnd } },
      ],
    }).populate('userId', 'email firstName lastName');

    let sent = 0;
    for (const tech of technicians) {
      if (!tech.userId?.email) continue;

      const isTrial = tech.subscription.plan === 'trial';
      const endDate = new Date(isTrial ? tech.subscription.trialEndDate : tech.subscription.endDate);
      // ceil: sends once per reminder day when the job runs daily
      const daysLeft = Math.ceil((endDate - now) / DAY_MS);
      if (!REMINDER_DAYS.includes(daysLeft)) continue;

      const plan = subscriptionPlans[tech.subscription.plan];
      await notify.technicianSubscriptionExpiring({
        technicianEmail: tech.userId.email,
        technicianName: `${tech.userId.firstName} ${tech.userId.lastName}`.trim(),
        planName: plan?.name || tech.subscription.plan,
        endDate: formatDate(endDate),
        daysLeft,
        isTrial,
        isFreeMonth: !!tech.subscription.isFreeMonth,
        currentRadius: plan?.visibilityRadius || 10,
      });
      sent++;
    }

    console.log(`⏰ [cron] Sent ${sent} plan reminder(s)`);
  } catch (err) {
    console.error('⏰ [cron] Plan reminders FAILED:', err);
  }
};

module.exports = { sendExpiryReminders, REMINDER_DAYS };
