/**
 * bookingFlow.js
 * ==============
 * Moves bookings from the older, longer flow onto the short one:
 *   pending → quoted → in_progress → work_completed → completed
 *
 * - agreed / materials_delivered / materials_confirmed → in_progress
 *   (the materials steps and "start work" are gone; accepting the quote starts the work)
 * - labor_paid → work_completed (the client confirms and rates from there)
 *
 * Safe to run on every startup: it only touches bookings still in an old status.
 */

const Booking = require('../models/Booking');

const migrateBookingFlow = async () => {
  const toWork = await Booking.updateMany(
    { status: { $in: ['agreed', 'materials_delivered', 'materials_confirmed'] } },
    [{
      $set: {
        status: 'in_progress',
        startedAt: { $ifNull: ['$startedAt', { $ifNull: ['$quotation.acceptedAt', '$updatedAt'] }] },
      },
    }],
    { updatePipeline: true }
  );
  const toConfirm = await Booking.updateMany(
    { status: 'labor_paid' },
    { $set: { status: 'work_completed' } }
  );
  const moved = toWork.modifiedCount + toConfirm.modifiedCount;
  if (moved) console.log(`📋 Moved ${moved} booking(s) onto the short booking flow`);
};

module.exports = { migrateBookingFlow };
