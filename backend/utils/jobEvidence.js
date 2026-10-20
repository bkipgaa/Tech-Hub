/**
 * jobEvidence.js
 * ==============
 * Checks for the proof a technician gives when finishing a job: camera photos
 * with live GPS, or a live link for digital work.
 *
 * Everything the browser sends (GPS, capture time, "taken with the camera") is
 * a claim, not proof — a determined user can fake it. So apart from exact photo
 * reuse, these checks only raise flags for the admin; they don't block the job.
 */

const dns = require('dns').promises;
const net = require('net');
const catalog = require('../data/catalogExpansion');

const MAX_PHOTOS = 6;
const FAR_FROM_JOB_M = 300;            // photo GPS further than this (plus accuracy slack) → flag
const ACCURACY_SLACK_MAX_M = 200;
const LOW_ACCURACY_M = 200;
const STALE_CAPTURE_MS = 10 * 60 * 1000;
const CLOCK_SKEW_MS = 2 * 60 * 1000;
const NEAR_DUPLICATE_BITS = 6;         // max differing bits (of 64) for "same photo"
const MIN_WORK_MINUTES = 10;
const LINK_TIMEOUT_MS = 8000;
const LINK_MAX_REDIRECTS = 3;

// Flags that belong to the booking rather than to one photo or the link
const BOOKING_LEVEL_FLAGS = ['too_fast', 'before_booking_date', 'client_disputed', 'no_job_pin'];

// Service categories where the result can be a website or app link instead of a photo
const DIGITAL_MAIN_CATEGORIES = ['Programming & AI', 'Digital Marketing & Design'];
const DIGITAL_SERVICE_CATEGORIES = new Set([
  ...DIGITAL_MAIN_CATEGORIES.flatMap((main) => Object.keys(catalog[main] || {})),
  'Photo & Video Editing',
]);

const isDigitalCategory = (serviceCategory) => DIGITAL_SERVICE_CATEGORIES.has(serviceCategory);

// ─── Geography ──────────────────────────────────────────────

const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
  !(lat === 0 && lng === 0);

/** Great-circle distance in metres. */
const distanceMeters = (a, b) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
};

const jobPin = (booking) => {
  const c = booking.location?.coordinates;
  return c && isValidLatLng(c.lat, c.lng) ? { lat: c.lat, lng: c.lng } : null;
};

/**
 * Location flags for one photo against the booking's pinned job location.
 * Returns { flags, distanceFromJobM }.
 */
const photoLocationFlags = (booking, gps, exif) => {
  const flags = [];
  let distanceFromJobM;
  const pin = jobPin(booking);

  if (!gps || !isValidLatLng(gps.lat, gps.lng)) {
    flags.push('no_gps');
  } else {
    if (Number.isFinite(gps.accuracy) && gps.accuracy > LOW_ACCURACY_M) flags.push('low_accuracy');
    if (pin) {
      distanceFromJobM = distanceMeters(gps, pin);
      const slack = Math.min(Number.isFinite(gps.accuracy) ? gps.accuracy : 0, ACCURACY_SLACK_MAX_M);
      if (distanceFromJobM > FAR_FROM_JOB_M + slack) flags.push('far_from_job');
    }
  }

  if (pin && exif && isValidLatLng(exif.lat, exif.lng) &&
      distanceMeters({ lat: exif.lat, lng: exif.lng }, pin) > FAR_FROM_JOB_M + ACCURACY_SLACK_MAX_M) {
    flags.push('exif_far');
  }

  return { flags, distanceFromJobM };
};

/** Timing flags for one photo (device clock vs server clock, EXIF time). */
const photoTimeFlags = ({ capturedAt, gpsAt, receivedAt, exif }) => {
  const flags = [];
  const now = receivedAt.getTime();
  const stale = (d) => !d || now - d.getTime() > STALE_CAPTURE_MS || d.getTime() - now > CLOCK_SKEW_MS;
  if (stale(capturedAt) || (gpsAt && stale(gpsAt))) flags.push('stale_capture');
  if (exif?.takenAt) {
    // EXIF has no time zone, so allow a day either way before calling it old
    const diff = Math.abs(now - exif.takenAt.getTime());
    if (diff > 24 * 60 * 60 * 1000 + STALE_CAPTURE_MS) flags.push('exif_old');
  }
  return flags;
};

// ─── Perceptual hash ────────────────────────────────────────

const isPhash = (h) => typeof h === 'string' && /^[0-9a-f]{16}$/i.test(h);

const phashBands = (h) =>
  isPhash(h) ? Array.from({ length: 8 }, (_, i) => `${i}:${h.slice(i * 2, i * 2 + 2).toLowerCase()}`) : [];

const hammingDistance = (a, b) => {
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (x) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
};

// ─── EXIF (only present on the file-input fallback; canvas captures have none) ──

const readExif = async (buffer) => {
  try {
    const exifr = require('exifr');
    const data = await exifr.parse(buffer, { tiff: true, exif: true, gps: true });
    if (!data) return null;
    const takenAt = data.DateTimeOriginal instanceof Date ? data.DateTimeOriginal : undefined;
    const exif = {
      make: data.Make,
      model: data.Model,
      takenAt: takenAt && !isNaN(takenAt) ? takenAt : undefined,
      lat: Number.isFinite(data.latitude) ? data.latitude : undefined,
      lng: Number.isFinite(data.longitude) ? data.longitude : undefined,
    };
    return Object.values(exif).some((v) => v !== undefined) ? exif : null;
  } catch {
    return null;
  }
};

// ─── Live link check ────────────────────────────────────────

const isPrivateAddress = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168);
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
};

const parsePublicUrl = (value) => {
  let url;
  try {
    url = new URL(String(value).trim());
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
  return url;
};

/**
 * Fetch the link from the server (following up to 3 redirects) and report
 * whether it answers. Refuses private/internal addresses so the check can't be
 * pointed at our own network.
 */
const checkLink = async (rawUrl) => {
  let url = parsePublicUrl(rawUrl);
  if (!url) return { reachable: false, error: 'Invalid URL' };

  for (let hop = 0; hop <= LINK_MAX_REDIRECTS; hop++) {
    try {
      const host = url.hostname.replace(/^\[|\]$/g, '');
      const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
      if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
        return { reachable: false, finalUrl: url.href, error: 'Address not allowed' };
      }

      const res = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
        headers: { 'User-Agent': 'WebafixLinkCheck/1.0' },
      });
      res.body?.cancel().catch(() => {});

      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        const next = parsePublicUrl(new URL(res.headers.get('location'), url).href);
        if (!next) return { reachable: false, httpStatus: res.status, finalUrl: url.href, error: 'Bad redirect' };
        url = next;
        continue;
      }
      return { reachable: res.status < 400, httpStatus: res.status, finalUrl: url.href };
    } catch (err) {
      return { reachable: false, finalUrl: url.href, error: err.name === 'TimeoutError' ? 'Timed out' : (err.code || err.message) };
    }
  }
  return { reachable: false, finalUrl: url.href, error: 'Too many redirects' };
};

// ─── Booking-level bookkeeping ──────────────────────────────

/** Rebuild the booking's flag list from its photos, link and booking-level flags. */
const recomputeEvidenceFlags = (booking) => {
  const ev = booking.completionEvidence;
  const flags = new Set((ev.flags || []).filter((f) => BOOKING_LEVEL_FLAGS.includes(f)));
  (ev.photos || []).forEach((p) => (p.flags || []).forEach((f) => flags.add(f)));
  if (ev.link?.url && ev.link.reachable === false) flags.add('link_unreachable');
  ev.flags = [...flags];
};

const addBookingFlag = (booking, flag, on = true) => {
  const ev = booking.completionEvidence;
  const rest = (ev.flags || []).filter((f) => f !== flag);
  ev.flags = on ? [...rest, flag] : rest;
};

/** auto_ok / flagged, unless an admin has already decided. */
const refreshReviewStatus = (booking) => {
  const ev = booking.completionEvidence;
  if (!ev.submittedAt || ['admin_ok', 'admin_rejected'].includes(ev.reviewStatus)) return;
  ev.reviewStatus = ev.flags?.length ? 'flagged' : 'auto_ok';
};

/**
 * What the client and technician get to see: no IPs, hashes, raw EXIF or
 * fraud flags (those are for the admin), for proof of work and ratings.
 */
const participantView = (booking) => {
  const obj = typeof booking?.toObject === 'function' ? booking.toObject() : { ...booking };
  const ev = obj.completionEvidence;
  if (ev) {
    obj.completionEvidence = {
      ...ev,
      photos: (ev.photos || []).map(({ ip, userAgent, sha256, phash, exif, flags, ...photo }) => photo),
      flags: undefined,
      reviewStatus: ['admin_ok', 'admin_rejected'].includes(ev.reviewStatus) ? ev.reviewStatus : undefined,
      reviewNote: ev.reviewStatus === 'admin_rejected' ? ev.reviewNote : undefined,
    };
  }
  // Rating timing checks are for the admin; people only see when it was rated
  // and whether it is still waiting for a check
  if (obj.ratingCheck) {
    obj.ratingCheck = {
      ratedAt: obj.ratingCheck.ratedAt,
      pending: obj.ratingCheck.status === 'held',
    };
  }
  return obj;
};

module.exports = {
  MAX_PHOTOS,
  NEAR_DUPLICATE_BITS,
  MIN_WORK_MINUTES,
  isDigitalCategory,
  isValidLatLng,
  distanceMeters,
  jobPin,
  photoLocationFlags,
  photoTimeFlags,
  isPhash,
  phashBands,
  hammingDistance,
  readExif,
  parsePublicUrl,
  checkLink,
  recomputeEvidenceFlags,
  addBookingFlag,
  refreshReviewStatus,
  participantView,
};
