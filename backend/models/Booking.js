const mongoose = require('mongoose');

const EVIDENCE_FLAGS = [
  'no_job_pin',            // client never pinned the job location
  'no_gps',
  'low_accuracy',
  'far_from_job',
  'stale_capture',         // photo sent long after it was taken, or clocks disagree
  'near_duplicate_photo',  // looks like a photo used on another booking
  'exif_old',              // camera says the photo was taken earlier (fallback capture only)
  'exif_far',              // camera GPS far from the job (fallback capture only)
  'link_unreachable',
  'too_fast',              // work marked done very soon after starting
  'before_booking_date',
  'client_disputed',
];

const evidencePhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: String,
  width: Number,
  height: Number,
  sha256: String,
  phash: String,                // Cloudinary perceptual hash (hex)
  captureMethod: { type: String, enum: ['camera', 'capture_input'], default: 'camera' },
  capturedAt: Date,             // device clock
  receivedAt: Date,             // server clock
  gps: {
    lat: Number,
    lng: Number,
    accuracy: Number,
    at: Date,
  },
  distanceFromJobM: Number,
  exif: {
    make: String,
    model: String,
    takenAt: Date,
    lat: Number,
    lng: Number,
  },
  flags: [{ type: String, enum: EVIDENCE_FLAGS }],
  ip: String,
  userAgent: String,
});

const bookingSchema = new mongoose.Schema({
  // ── References ──
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    required: [true, 'Technician ID is required']
  },

  // ── Service details ──
  serviceCategory: { type: String, required: true },
  subService: { type: String, required: true },
  serviceDescription: { type: String, required: true },

  // ── Pricing (optional) ──
  hourlyRate: { type: Number, min: 0, default: 0 },
  estimatedHours: { type: Number, default: 1, min: 0.5 },
  totalAmount: { type: Number, required: true, min: 0 },

  // ── Scheduling ──
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true },
  duration: { type: Number, default: 1 },

  // ── Location ──
  location: {
    address: { type: String, required: true },
    // Pinned by the client from their device ("use my location"); the expert's
    // evidence photo GPS is checked against it
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    accuracy: Number,             // metres, as reported by the client's device
    pinnedAt: Date,
  },

  // ── Status & Payment ──
  status: {
    type: String,
    enum: [
      'pending',              // initial
      'quoted',               // technician sent quotation
      'agreed',               // client accepted
      'materials_delivered',  // technician delivered materials
      'materials_confirmed',  // client confirmed materials
      'in_progress',          // work started
      'work_completed',       // technician finished work
      'labor_paid',           // technician received labor payment
      'completed',            // client rated – final
      'cancelled',
      'no-show'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'card', 'bank-transfer'],
    default: 'cash'
  },
  paymentReference: { type: String, default: '' },

  // ── Notes ──
  clientNotes: { type: String, maxlength: 500 },
  technicianNotes: { type: String, maxlength: 500 },
  adminNotes: { type: String, maxlength: 500 },

  // ── Timestamps for status changes ──
  confirmedAt: Date,
  startedAt: Date,
  workCompletedAt: Date,        // NEW: technician says job done
  completedAt: Date,            // final (after rating)
  cancelledAt: Date,
  cancelledBy: { type: String, enum: ['client', 'technician', 'admin', 'system'] },
  cancellationReason: String,

  // ── Ratings ──
  clientRating: { type: Number, min: 1, max: 5 },
  clientReview: { type: String, maxlength: 500 },
  technicianRating: { type: Number, min: 1, max: 5 },
  technicianReview: { type: String, maxlength: 500 },

  // ── Rating checks (set when the client rates) ──
  // An expert gets at most a few counted ratings a day; extra ones are held for
  // the admin. Ratings close together are flagged.
  ratingCheck: {
    ratedAt: Date,
    status: { type: String, enum: ['counted', 'held', 'approved', 'rejected'] },
    flags: [{ type: String, enum: ['daily_limit', 'short_gap'] }],
    minutesSincePreviousRating: Number,   // this expert's previous rating, any client
    ratingsInPrevious24h: Number,         // counted ratings in the 24 hours before this one
    reviewedAt: Date,
    reviewNote: { type: String, maxlength: 500 },
  },

  // ── Quotation ──────────────────────────────────────────────────
  quotation: {
    totalCost: { type: Number, min: 0, default: 0 },
    laborCost: { type: Number, min: 0, default: 0 },
    materialsCost: { type: Number, min: 0, default: 0 },
    sentAt: Date,
    acceptedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
  },

  // ── Materials ──────────────────────────────────────────────────
  materials: {
    providedByClient: { type: Boolean, default: false },
    sourceSetAt: Date,            // technician chose who provides materials
    moneyReceivedAt: Date,        // technician acknowledges client paid for materials
    deliveredAt: Date,            // technician confirms materials delivered
    confirmedByClientAt: Date,    // client confirms materials received
    notes: String,
  },

  // ── Labor Payment ─────────────────────────────────────────────
  laborPayment: {
    confirmedAt: Date,
    amount: { type: Number, min: 0, default: 0 },
    notes: String,
  },

  // ── Commission (5% of labor) ─────────────────────────────────
  commission: {
    amount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'invoiced', 'paid', 'waived'],
      default: 'pending'
    },
    createdAt: Date,
    dueAt: Date,                        // 30 days after labor payment confirmed
    invoicedAt: Date,
    paidAt: Date,
    reference: String,                  // set by admin "mark paid"
    waivedAt: Date,
    waivedReason: String,

    // Labor amounts the commission is based on
    reportedLabor: Number,              // what the technician says they received
    quotedLabor: Number,                // labor cost from the accepted quotation
    clientConfirmedLabor: Boolean,      // client's answer when rating
    clientReportedLabor: Number,        // what the client says they paid, if different
    flagged: { type: Boolean, default: false },
    flagReasons: [{ type: String, enum: ['below_quote', 'client_disputes_amount'] }],

    paymentMethod: { type: String, enum: ['card', 'mpesa'] },
    paymentReference: String,           // Paystack reference

    // M-Pesa STK push (stamped at initiation, looked up by callback / status poll)
    mpesaCheckoutRequestID: { type: String, index: true },
    mpesaPhone: String,
    mpesaAmount: Number,                // KES amount requested in the STK push
    mpesaInitiatedAt: Date,
    mpesaReceiptNumber: String,
    mpesaFailureReason: String,
    mpesaFailureCode: String,
    mpesaFailedAt: Date,
  },

  // ── Proof of finished work (technician, before work_completed) ──
  // Photos come from the device camera with live GPS; a live link is accepted for
  // digital jobs. Checks only raise flags for the admin, apart from exact photo reuse.
  completionEvidence: {
    photos: [evidencePhotoSchema],
    link: {
      url: String,
      submittedAt: Date,
      checkedAt: Date,
      reachable: Boolean,
      httpStatus: Number,
      finalUrl: String,
      error: String,
    },
    submittedAt: Date,            // set when the technician marks the work completed
    flags: [{ type: String, enum: EVIDENCE_FLAGS }],
    reviewStatus: {
      type: String,
      enum: ['none', 'auto_ok', 'flagged', 'admin_ok', 'admin_rejected'],
      default: 'none',
    },
    reviewedAt: Date,
    reviewNote: { type: String, maxlength: 500 },
  },

  // ── Client confirms the work is done (or disputes it) ──
  clientWorkConfirmation: {
    confirmedAt: Date,
    autoConfirmedAt: Date,        // client didn't answer within the waiting period
    disputedAt: Date,
    disputeReason: { type: String, maxlength: 500 },
  },

  // ── Payment confirmation (for simplified flow, kept for compatibility) ──
  paymentConfirmed: { type: Boolean, default: false },
  paymentConfirmedAt: Date,
  paymentConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentAmountReceived: { type: Number, min: 0, default: null },
  paymentConfirmationNote: { type: String, maxlength: 200 },

  // ── Notifications ──
  notifications: {
    clientNotified: { type: Boolean, default: false },
    technicianNotified: { type: Boolean, default: false },
    lastNotificationSent: Date
  },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────
bookingSchema.index({ clientId: 1, createdAt: -1 });
bookingSchema.index({ technicianId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ preferredDate: 1 });
bookingSchema.index({ technicianId: 1, completedAt: -1 });   // recent ratings per expert

// ─── Virtuals ──────────────────────────────────────────────────
bookingSchema.virtual('isCancellable').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});
bookingSchema.virtual('durationMinutes').get(function() {
  return this.duration * 60;
});

// ─── Methods ──────────────────────────────────────────────────
bookingSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  return this.save();
};

bookingSchema.methods.start = async function() {
  this.status = 'in_progress';
  this.startedAt = new Date();
  return this.save();
};

bookingSchema.methods.complete = async function(rating, review) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (rating) this.clientRating = rating;
  if (review) this.clientReview = review;
  return this.save();
};

bookingSchema.methods.cancel = async function(reason, cancelledBy = 'client') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  return this.save();
};

bookingSchema.methods.markPaymentComplete = async function(reference) {
  this.paymentStatus = 'paid';
  if (reference) this.paymentReference = reference;
  return this.save();
};

// ─── Statics ──────────────────────────────────────────────────
bookingSchema.statics.getUpcomingForTechnician = async function(technicianId, limit = 10) {
  return this.find({
    technicianId,
    status: { $in: ['pending', 'confirmed'] },
    preferredDate: { $gte: new Date() }
  })
  .sort({ preferredDate: 1 })
  .limit(limit)
  .populate('clientId', 'firstName lastName email phone');
};

bookingSchema.statics.getHistoryForClient = async function(clientId, limit = 20) {
  return this.find({ clientId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('technicianId', 'businessName');
};

// ─── Pre‑save hooks ──────────────────────────────────────────
bookingSchema.pre('save', async function() {
  if (this.isModified('hourlyRate') || this.isModified('estimatedHours')) {
    this.totalAmount = this.hourlyRate * this.estimatedHours;
  }
});

bookingSchema.pre('save', async function() {
  // Only when the date is being set — later status updates happen after it has passed
  if (!this.isNew && !this.isModified('preferredDate')) return;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (this.preferredDate && this.preferredDate < startOfToday) {
    throw new Error('Preferred date cannot be in the past');
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.EVIDENCE_FLAGS = EVIDENCE_FLAGS;