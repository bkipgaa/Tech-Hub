/**
 * bookingEvidenceController.js
 * ============================
 * Proof of finished work and the client's answer to it:
 * - Client pins the job location from their device
 * - Technician adds camera photos (with live GPS) or a live link (digital jobs)
 * - Client confirms the work is done, or disputes it
 *
 * The status changes themselves (complete-work, confirm-labor-payment, rate)
 * stay in bookingratingController and check what is recorded here.
 */

const crypto = require('crypto');
const Booking = require('../models/Booking');
const EvidenceHash = require('../models/EvidenceHash');
const Technician = require('../models/Technician');
const { uploadEvidenceToCloudinary } = require('../config/cloudinary');
const ev = require('../utils/jobEvidence');

const TECHNICIAN_WITH_NAME = {
  path: 'technicianId',
  select: 'businessName mainCategory userId',
  populate: { path: 'userId', select: 'firstName lastName' },
};

// Client can (re)pin the job location until the work is marked completed
const PIN_STATUSES = ['pending', 'quoted', 'agreed', 'materials_delivered', 'materials_confirmed', 'in_progress'];

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const currentUserId = (req) => req.user.userId || req.user.id || req.user._id;

const respondWithBooking = async (res, booking, message, extra = {}) => {
  await booking.populate('clientId', 'firstName lastName');
  await booking.populate(TECHNICIAN_WITH_NAME);
  res.json({ success: true, message, data: ev.participantView(booking), ...extra });
};

const logError = (where, error) => console.error(`[${where}] Error:`, error.message, error.stack);

/** The booking, if the logged-in user is its technician. */
const loadTechnicianBooking = async (req, res) => {
  const technician = await Technician.findOne({ userId: currentUserId(req) }).select('_id').lean();
  if (!technician) {
    fail(res, 404, 'Technician profile not found.');
    return null;
  }
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    fail(res, 404, 'Booking not found.');
    return null;
  }
  if (String(booking.technicianId) !== String(technician._id)) {
    fail(res, 403, 'Not your booking.');
    return null;
  }
  return booking;
};

/** The booking, if the logged-in user is its client. */
const loadClientBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    fail(res, 404, 'Booking not found.');
    return null;
  }
  if (String(booking.clientId) !== String(currentUserId(req))) {
    fail(res, 403, 'Not your booking.');
    return null;
  }
  return booking;
};

/**
 * Evidence can be added while working, or after the client disputes the
 * finished work (to show more proof).
 */
const canAddEvidence = (booking) =>
  booking.status === 'in_progress' ||
  (booking.status === 'work_completed' &&
    booking.clientWorkConfirmation?.disputedAt &&
    !booking.clientWorkConfirmation?.confirmedAt);

const toNumber = (v) => (v === undefined || v === null || v === '' ? NaN : Number(v));

const toDate = (v) => {
  if (!v) return undefined;
  const d = new Date(Number.isFinite(Number(v)) ? Number(v) : v);
  return isNaN(d.getTime()) ? undefined : d;
};

// ============================================================
// CLIENT: PIN JOB LOCATION
// ============================================================

/**
 * POST /api/bookings/:bookingId/location-pin
 * Body: { lat, lng, accuracy }
 */
exports.pinLocation = async (req, res) => {
  try {
    const lat = toNumber(req.body.lat);
    const lng = toNumber(req.body.lng);
    const accuracy = toNumber(req.body.accuracy);
    if (!ev.isValidLatLng(lat, lng)) return fail(res, 400, 'A valid location is required.');

    const booking = await loadClientBooking(req, res);
    if (!booking) return;
    if (!PIN_STATUSES.includes(booking.status)) {
      return fail(res, 400, 'The job location can only be set before the work is completed.');
    }

    booking.location.coordinates = { lat, lng };
    booking.location.accuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : undefined;
    booking.location.pinnedAt = new Date();

    // Photos already taken are re-checked against the new pin
    booking.completionEvidence.photos.forEach((photo) => {
      const timeFlags = (photo.flags || []).filter((f) => ['stale_capture', 'exif_old', 'near_duplicate_photo'].includes(f));
      const { flags, distanceFromJobM } = ev.photoLocationFlags(booking, photo.gps, photo.exif);
      photo.flags = [...timeFlags, ...flags];
      photo.distanceFromJobM = distanceFromJobM;
    });
    ev.addBookingFlag(booking, 'no_job_pin', false);
    ev.recomputeEvidenceFlags(booking);
    ev.refreshReviewStatus(booking);

    await booking.save();
    await respondWithBooking(res, booking, 'Job location saved.');
  } catch (error) {
    logError('pinLocation', error);
    fail(res, 500, 'Failed to save the job location.');
  }
};

// ============================================================
// TECHNICIAN: ADD A CAMERA PHOTO
// ============================================================

/**
 * POST /api/bookings/:bookingId/evidence/photo   (multipart)
 * Fields: photo (file), lat, lng, accuracy, gpsAt, capturedAt, captureMethod
 */
exports.addEvidencePhoto = async (req, res) => {
  try {
    if (!req.file) return fail(res, 400, 'Please take a photo of the finished work.');

    const lat = toNumber(req.body.lat);
    const lng = toNumber(req.body.lng);
    if (!ev.isValidLatLng(lat, lng)) {
      return fail(res, 400, 'Your live location is needed with the photo. Please allow location access and try again.');
    }
    const accuracy = toNumber(req.body.accuracy);
    const gps = {
      lat,
      lng,
      accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : undefined,
      at: toDate(req.body.gpsAt),
    };
    const capturedAt = toDate(req.body.capturedAt);
    const captureMethod = req.body.captureMethod === 'capture_input' ? 'capture_input' : 'camera';

    const booking = await loadTechnicianBooking(req, res);
    if (!booking) return;
    if (!canAddEvidence(booking)) {
      return fail(res, 400, 'Photos can only be added while the work is in progress.');
    }
    if (booking.completionEvidence.photos.length >= ev.MAX_PHOTOS) {
      return fail(res, 400, `You can add up to ${ev.MAX_PHOTOS} photos.`);
    }

    // Exact reuse of a photo is never a mistake, so it is refused outright
    const sha256 = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const exact = await EvidenceHash.findOne({ sha256 }).select('bookingId').lean();
    if (exact) {
      return fail(res, 400, String(exact.bookingId) === String(booking._id)
        ? 'This photo has already been added.'
        : 'This photo was already used for another job. Please take a new photo of this job.');
    }

    const exif = await ev.readExif(req.file.buffer);
    const result = await uploadEvidenceToCloudinary(req.file.buffer);
    const receivedAt = new Date();
    const phash = ev.isPhash(result.phash) ? result.phash.toLowerCase() : undefined;

    const flags = [
      ...ev.photoTimeFlags({ capturedAt, gpsAt: gps.at, receivedAt, exif }),
    ];
    const location = ev.photoLocationFlags(booking, gps, exif);
    flags.push(...location.flags);

    // Near-duplicates on other bookings (any technician)
    if (phash) {
      const candidates = await EvidenceHash.find({
        phashBands: { $in: ev.phashBands(phash) },
        bookingId: { $ne: booking._id },
      }).select('phash').limit(500).lean();
      if (candidates.some((c) => ev.isPhash(c.phash) && ev.hammingDistance(c.phash, phash) <= ev.NEAR_DUPLICATE_BITS)) {
        flags.push('near_duplicate_photo');
      }
    }

    booking.completionEvidence.photos.push({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      sha256,
      phash,
      captureMethod,
      capturedAt,
      receivedAt,
      gps,
      distanceFromJobM: location.distanceFromJobM,
      exif: exif || undefined,
      flags,
      ip: req.ip,
      userAgent: (req.get('user-agent') || '').slice(0, 300),
    });
    ev.recomputeEvidenceFlags(booking);
    ev.refreshReviewStatus(booking);
    await booking.save();

    await EvidenceHash.create({
      sha256,
      phash,
      phashBands: ev.phashBands(phash),
      bookingId: booking._id,
      technicianId: booking.technicianId,
      url: result.secure_url,
    });

    // A gentle hint for honest mistakes (wrong address, weak GPS); fraud flags stay admin-only
    const warnings = [];
    if (flags.includes('far_from_job')) warnings.push('You seem to be far from the job location the client pinned.');
    if (flags.includes('low_accuracy')) warnings.push('Your location was not precise. Moving near a window or outside can help.');

    await respondWithBooking(res, booking, 'Photo added.', { warnings });
  } catch (error) {
    logError('addEvidencePhoto', error);
    fail(res, 500, 'Failed to add the photo. Please try again.');
  }
};

// ============================================================
// TECHNICIAN: LIVE LINK (digital jobs)
// ============================================================

/**
 * POST /api/bookings/:bookingId/evidence/link
 * Body: { url }
 */
exports.setEvidenceLink = async (req, res) => {
  try {
    const url = ev.parsePublicUrl(req.body.url);
    if (!url) return fail(res, 400, 'Please enter a full link starting with http:// or https://');

    const booking = await loadTechnicianBooking(req, res);
    if (!booking) return;
    if (!ev.isDigitalCategory(booking.serviceCategory)) {
      return fail(res, 400, 'A live link is only accepted for website, app and digital jobs. Please add a photo instead.');
    }
    if (!canAddEvidence(booking)) {
      return fail(res, 400, 'The link can only be added while the work is in progress.');
    }

    const check = await ev.checkLink(url.href);
    booking.completionEvidence.link = {
      url: url.href,
      submittedAt: new Date(),
      checkedAt: new Date(),
      reachable: check.reachable,
      httpStatus: check.httpStatus,
      finalUrl: check.finalUrl,
      error: check.error,
    };
    ev.recomputeEvidenceFlags(booking);
    ev.refreshReviewStatus(booking);
    await booking.save();

    const warnings = check.reachable ? [] : ['We could not open this link. Check that it is live and public.'];
    await respondWithBooking(res, booking, 'Link saved.', { warnings });
  } catch (error) {
    logError('setEvidenceLink', error);
    fail(res, 500, 'Failed to save the link.');
  }
};

// ============================================================
// CLIENT: CONFIRM OR DISPUTE THE FINISHED WORK
// ============================================================

/**
 * POST /api/bookings/:bookingId/confirm-work
 * Body: { confirmed: true } or { confirmed: false, reason }
 */
exports.confirmWork = async (req, res) => {
  try {
    const { confirmed, reason } = req.body;
    if (typeof confirmed !== 'boolean') return fail(res, 400, 'confirmed must be true or false.');
    if (!confirmed && (!reason || String(reason).trim().length < 5)) {
      return fail(res, 400, 'Please tell us what is wrong with the work.');
    }

    const booking = await loadClientBooking(req, res);
    if (!booking) return;
    if (booking.status !== 'work_completed') {
      return fail(res, 400, 'The expert has not marked the work as completed yet.');
    }
    if (booking.clientWorkConfirmation?.confirmedAt) {
      return fail(res, 400, 'You have already confirmed this work.');
    }

    if (confirmed) {
      booking.clientWorkConfirmation.confirmedAt = new Date();
    } else {
      booking.clientWorkConfirmation.disputedAt = new Date();
      booking.clientWorkConfirmation.disputeReason = String(reason).trim().slice(0, 500);
      ev.addBookingFlag(booking, 'client_disputed');
      ev.recomputeEvidenceFlags(booking);
      ev.refreshReviewStatus(booking);
    }
    await booking.save();

    await respondWithBooking(res, booking, confirmed
      ? 'Thanks — work confirmed. Pay the expert for the labor; they will record the amount.'
      : 'Your concern has been recorded. The expert can add more proof, and our team will review it.');
  } catch (error) {
    logError('confirmWork', error);
    fail(res, 500, 'Failed to save your answer.');
  }
};
