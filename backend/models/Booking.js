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
  serviceCategory: {
    type: String,
    required: [true, 'Service category is required']
  },
  subService: {
    type: String,
    required: [true, 'Sub-service is required']
  },
  serviceDescription: {
    type: String,
    required: [true, 'Service description is required']
  },

  // ── Pricing (hourlyRate is now optional, defaults to 0) ──
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0,
    required: false   // explicitly set to false (or omit)
  },
  estimatedHours: {
    type: Number,
    default: 1,
    min: 0.5
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // ── Scheduling ──
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required']
  },
  preferredTime: {
    type: String,
    required: [true, 'Preferred time is required']
  },
  duration: {
    type: Number,
    default: 1
  },

  // ── Location ──
  location: {
    address: {
      type: String,
      required: true
    }
  },

  // ── Status & Payment ──
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
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
  paymentReference: {
    type: String,
    default: ''
  },

  // ── Notes ──
  clientNotes: {
    type: String,
    maxlength: 500
  },
  technicianNotes: {
    type: String,
    maxlength: 500
  },
  adminNotes: {
    type: String,
    maxlength: 500
  },

  // ── Timestamps for status changes ──
  confirmedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['client', 'technician', 'admin', 'system']
  },
  cancellationReason: String,

  // ── Ratings ──
  clientRating: {
    type: Number,
    min: 1,
    max: 5
  },
  clientReview: {
    type: String,
    maxlength: 500
  },
  technicianRating: {
    type: Number,
    min: 1,
    max: 5
  },
  technicianReview: {
    type: String,
    maxlength: 500
  },

  // ── Notifications ──
  notifications: {
    clientNotified: { type: Boolean, default: false },
    technicianNotified: { type: Boolean, default: false },
    lastNotificationSent: Date
  },

  // In models/Booking.js – add these fields inside the schema definition

paymentConfirmed: {
  type: Boolean,
  default: false
},
paymentConfirmedAt: Date,
paymentConfirmedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},
paymentAmountReceived: {
  type: Number,
  min: 0,
  default: null
},
paymentConfirmationNote: {
  type: String,
  maxlength: 200
},

  // ── System ──
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ============================================================
// INDEXES
// ============================================================
bookingSchema.index({ clientId: 1, createdAt: -1 });
bookingSchema.index({ technicianId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ preferredDate: 1 });

// ============================================================
// VIRTUALS
// ============================================================
bookingSchema.virtual('isCancellable').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});
bookingSchema.virtual('durationMinutes').get(function() {
  return this.duration * 60;
});

// ============================================================
// METHODS
// ============================================================
bookingSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  return this.save();
};

bookingSchema.methods.start = async function() {
  this.status = 'in-progress';
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

// ============================================================
// STATICS
// ============================================================
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

// ============================================================
// PRE‑SAVE HOOKS – FIXED (async, no next)
// ============================================================
bookingSchema.pre('save', async function() {
  // Calculate totalAmount if hourlyRate or estimatedHours changed
  if (this.isModified('hourlyRate') || this.isModified('estimatedHours')) {
    this.totalAmount = this.hourlyRate * this.estimatedHours;
  }
});

bookingSchema.pre('save', async function() {
  // Validate that preferredDate is not in the past
  if (this.preferredDate && this.preferredDate < new Date()) {
    throw new Error('Preferred date cannot be in the past');
  }
});

module.exports = mongoose.model('Booking', bookingSchema);