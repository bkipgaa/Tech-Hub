/**
 * commissionDue.js
 * ================
 * Commission deadlines and what happens when they're missed.
 *
 *   work done (labor payment confirmed)
 *     → commission due 30 days later
 *     → overdue: technician can't receive new bookings
 *     → still unpaid 60 days after the due date: hidden from search
 *
 * Status is computed from bookings on every check, so paying (or an admin
 * waiving) lifts the restrictions immediately — no flags to keep in sync.
 */

const Booking = require('../models/Booking');

const DAY_MS = 24 * 60 * 60 * 1000;
const COMMISSION_DUE_DAYS = 30;
const HIDE_AFTER_OVERDUE_DAYS = 60;
const UNPAID_STATUSES = ['pending', 'invoiced'];

/** Due date for one booking's commission (older bookings have no dueAt). */
const dueDateFor = (booking) => {
  if (booking.commission?.dueAt) return new Date(booking.commission.dueAt);
  const confirmedAt = booking.laborPayment?.confirmedAt;
  return confirmedAt ? new Date(new Date(confirmedAt).getTime() + COMMISSION_DUE_DAYS * DAY_MS) : null;
};

/** Mongo filter: unpaid commissions whose due date is before `date`. */
const dueBeforeFilter = (date) => ({
  'commission.status': { $in: UNPAID_STATUSES },
  'commission.amount': { $gt: 0 },
  $or: [
    { 'commission.dueAt': { $lt: date } },
    {
      'commission.dueAt': null,
      'laborPayment.confirmedAt': { $lt: new Date(date.getTime() - COMMISSION_DUE_DAYS * DAY_MS) },
    },
  ],
});

const hideCutoff = (now = new Date()) => new Date(now.getTime() - HIDE_AFTER_OVERDUE_DAYS * DAY_MS);

/** True when the technician has an overdue commission (blocks new bookings). */
const hasOverdueCommission = async (technicianId, now = new Date()) =>
  !!(await Booking.exists({ technicianId, ...dueBeforeFilter(now) }));

/** IDs of technicians with any overdue commission. */
const overdueTechnicianIds = async (now = new Date()) =>
  Booking.distinct('technicianId', dueBeforeFilter(now));

/** IDs of technicians overdue for longer than the grace period (hidden from search). */
const hiddenTechnicianIds = async (now = new Date()) =>
  Booking.distinct('technicianId', dueBeforeFilter(hideCutoff(now)));

module.exports = {
  DAY_MS,
  COMMISSION_DUE_DAYS,
  HIDE_AFTER_OVERDUE_DAYS,
  UNPAID_STATUSES,
  dueDateFor,
  dueBeforeFilter,
  hasOverdueCommission,
  overdueTechnicianIds,
  hiddenTechnicianIds,
};
