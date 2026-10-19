/**
 * ratingChecks.js
 * ===============
 * Timing checks on client ratings. A real job usually takes half a day or more,
 * so an expert collecting many ratings in a short time is suspicious (for
 * example fake client accounts rating them one after another).
 *
 * - More than MAX_COUNTED_PER_DAY ratings in 24 hours: the extra rating is saved
 *   but held — it doesn't count toward the expert's score until an admin approves it.
 * - A rating within SHORT_GAP_HOURS of the expert's previous one is flagged.
 *
 * A rated booking's completedAt is the moment it was rated (rating is what
 * completes a booking), so older ratings without ratingCheck still count here.
 */

const Booking = require('../models/Booking');

const MAX_COUNTED_PER_DAY = 2;
const SHORT_GAP_HOURS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

const NOT_COUNTED = ['held', 'rejected'];

/**
 * Decide how a new rating for this expert is treated.
 * Returns the ratingCheck object to store on the booking.
 */
const checkNewRating = async (technicianId, bookingId, now = new Date()) => {
  const others = { technicianId, _id: { $ne: bookingId }, clientRating: { $ne: null }, completedAt: { $ne: null } };

  const [recent, previous] = await Promise.all([
    Booking.find({ ...others, completedAt: { $gte: new Date(now.getTime() - DAY_MS) } })
      .select('ratingCheck.status')
      .lean(),
    Booking.findOne(others).sort({ completedAt: -1 }).select('completedAt').lean(),
  ]);

  const ratingsInPrevious24h = recent.filter((b) => !NOT_COUNTED.includes(b.ratingCheck?.status)).length;
  const minutesSincePreviousRating = previous?.completedAt
    ? Math.max(0, Math.round((now.getTime() - new Date(previous.completedAt).getTime()) / 60000))
    : undefined;

  const flags = [];
  if (ratingsInPrevious24h >= MAX_COUNTED_PER_DAY) flags.push('daily_limit');
  if (minutesSincePreviousRating !== undefined && minutesSincePreviousRating < SHORT_GAP_HOURS * 60) flags.push('short_gap');

  return {
    ratedAt: now,
    status: flags.includes('daily_limit') ? 'held' : 'counted',
    flags,
    minutesSincePreviousRating,
    ratingsInPrevious24h,
  };
};

/** Counts a rating toward the expert's score, reviews and completed jobs. */
const applyRatingToTechnician = async (technician, booking) => {
  await technician.updateRating(booking.clientRating);
  technician.reviews.push({
    clientId: booking.clientId,
    bookingId: booking._id,
    rating: booking.clientRating,
    comment: booking.clientReview || '',
    createdAt: booking.ratingCheck?.ratedAt || booking.completedAt || new Date(),
  });
  technician.statistics = technician.statistics || {};
  technician.statistics.completedJobs = (technician.statistics.completedJobs || 0) + 1;
  technician.statistics.totalJobs = (technician.statistics.totalJobs || 0) + 1;
  await technician.save();
};

module.exports = {
  MAX_COUNTED_PER_DAY,
  SHORT_GAP_HOURS,
  checkNewRating,
  applyRatingToTechnician,
};
