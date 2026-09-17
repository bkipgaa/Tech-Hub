/**
 * subscriptionReminders.js
 * ========================
 * Daily scan for expiring subscriptions.
 * Sends reminder emails at 7 days and 1 day before expiry.
 * 
 * Run via node-cron in server.js.
 */

const Technician = require('../models/Technician');
const User = require('../models/User');
const notify = require('../services/notificationService');
const { subscriptionPlans } = require('../utils/subscriptionPlans');

const sendExpiryReminders = async () => {
  try {
    console.log('⏰ [cron] Checking expiring subscriptions...');

    const now = new Date();
    const days7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const days1 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Find paid subscriptions expiring in exactly 7 days (window)
    const expiring7 = await Technician.find({
      'subscription.plan': { $nin: ['free', 'trial'] },
      'subscription.endDate': { $gte: now, $lte: days7 },
    }).populate('userId', 'email firstName lastName');

    // Find expiring in 1 day
    const expiring1 = await Technician.find({
      'subscription.plan': { $nin: ['free', 'trial'] },
      'subscription.endDate': { $gte: now, $lte: days1 },
    }).populate('userId', 'email firstName lastName');

    let count7 = 0;
    let count1 = 0;

    for (const tech of expiring7) {
      if (!tech.userId?.email) continue;

      const endDate = new Date(tech.subscription.endDate);
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Only send on day 7 (avoid duplicate daily sends)
      if (daysLeft !== 7) continue;

      const plan = subscriptionPlans[tech.subscription.plan];
      await notify.technicianSubscriptionExpiring({
        technicianEmail: tech.userId.email,
        technicianName: `${tech.userId.firstName} ${tech.userId.lastName}`.trim(),
        planName: plan?.name || tech.subscription.plan,
        endDate: endDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysLeft: 7,
        currentRadius: plan?.visibilityRadius || 10,
      });
      count7++;
    }

    for (const tech of expiring1) {
      if (!tech.userId?.email) continue;

      const endDate = new Date(tech.subscription.endDate);
      const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      if (daysLeft !== 1) continue;

      const plan = subscriptionPlans[tech.subscription.plan];
      await notify.technicianSubscriptionExpiring({
        technicianEmail: tech.userId.email,
        technicianName: `${tech.userId.firstName} ${tech.userId.lastName}`.trim(),
        planName: plan?.name || tech.subscription.plan,
        endDate: endDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }),
        daysLeft: 1,
        currentRadius: plan?.visibilityRadius || 10,
      });
      count1++;
    }

    console.log(`⏰ [cron] Sent ${count7} 7-day reminders, ${count1} 1-day reminders`);
  } catch (err) {
    console.error('⏰ [cron] Expiry reminders FAILED:', err);
  }
};

module.exports = { sendExpiryReminders };