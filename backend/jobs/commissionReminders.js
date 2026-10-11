/**
 * commissionReminders.js
 * ======================
 * Daily scan of unpaid booking commissions. Emails each technician once at:
 *   - 7 days and 1 day before their earliest commission is due
 *   - the day it becomes overdue (new bookings paused)
 *   - 7 days before they're hidden from search
 *
 * Run via node-cron in server.js.
 */

const Booking = require('../models/Booking');
const Technician = require('../models/Technician');
const notify = require('../services/notificationService');
const {
  DAY_MS,
  HIDE_AFTER_OVERDUE_DAYS,
  UNPAID_STATUSES,
  dueDateFor,
} = require('../utils/commissionDue');

const formatDate = (d) =>
  d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });

// Days until the due date (negative once overdue) → which reminder to send
const stageFor = (daysUntilDue) => {
  if (daysUntilDue === 7) return 'due_7';
  if (daysUntilDue === 1) return 'due_1';
  if (daysUntilDue === 0) return 'overdue';
  if (daysUntilDue === -(HIDE_AFTER_OVERDUE_DAYS - 7)) return 'hide_7';
  return null;
};

const sendCommissionReminders = async () => {
  try {
    console.log('⏰ [cron] Checking unpaid commissions...');
    const now = new Date();

    const bookings = await Booking.find({
      'commission.status': { $in: UNPAID_STATUSES },
      'commission.amount': { $gt: 0 },
    })
      .select('technicianId laborPayment.confirmedAt commission.amount commission.dueAt')
      .lean();

    // Per technician: total owed and earliest due date
    const byTech = new Map();
    for (const b of bookings) {
      const due = dueDateFor(b);
      if (!due) continue;
      const key = String(b.technicianId);
      const entry = byTech.get(key) || { amount: 0, earliestDue: due };
      entry.amount += b.commission.amount;
      if (due < entry.earliestDue) entry.earliestDue = due;
      byTech.set(key, entry);
    }

    let sent = 0;
    for (const [technicianId, { amount, earliestDue }] of byTech) {
      const daysUntilDue = Math.ceil((earliestDue - now) / DAY_MS);
      const stage = stageFor(daysUntilDue);
      if (!stage) continue;

      const tech = await Technician.findById(technicianId).populate('userId', 'email firstName lastName');
      if (!tech?.userId?.email) continue;

      await notify.technicianCommissionReminder({
        stage,
        technicianEmail: tech.userId.email,
        technicianName: `${tech.userId.firstName} ${tech.userId.lastName}`.trim(),
        amount: amount.toLocaleString('en-KE'),
        dueDate: formatDate(earliestDue),
        hideDate: formatDate(new Date(earliestDue.getTime() + HIDE_AFTER_OVERDUE_DAYS * DAY_MS)),
      });
      sent++;
    }

    console.log(`⏰ [cron] Sent ${sent} commission reminder(s)`);
  } catch (err) {
    console.error('⏰ [cron] Commission reminders FAILED:', err);
  }
};

module.exports = { sendCommissionReminders, stageFor };
