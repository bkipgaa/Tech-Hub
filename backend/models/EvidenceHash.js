const mongoose = require('mongoose');

/**
 * One row per job-evidence photo, kept even if the booking changes, so a photo
 * reused on another booking (by any technician) can be found quickly.
 *
 * phashBands splits the 64-bit perceptual hash into 8 one-byte bands
 * ("0:ab", "1:3f", ...). Two hashes within 7 bits of each other always share
 * at least one band, so an indexed $in on the bands finds every candidate.
 */
const evidenceHashSchema = new mongoose.Schema({
  sha256: { type: String, required: true, index: true },
  phash: String,
  phashBands: { type: [String], index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  url: String,
}, { timestamps: true });

module.exports = mongoose.model('EvidenceHash', evidenceHashSchema);
