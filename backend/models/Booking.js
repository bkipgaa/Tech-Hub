const mongoose = require('mongoose');

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
  location: { address: { type: String, required: true } },

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
      enum: ['pending', 'invoiced', 'paid'],
      default: 'pending'
    },
    invoicedAt: Date,
    paidAt: Date,
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
  if (this.preferredDate && this.preferredDate < new Date()) {
    throw new Error('Preferred date cannot be in the past');
  }
});

module.exports = mongoose.model('Booking', bookingSchema);