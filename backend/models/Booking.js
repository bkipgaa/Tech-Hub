/**
 * Booking Model
 * =============
 * 
 * Represents service bookings made by clients with technicians
 * Tracks booking status, payment, and scheduling information
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Reference to the client who made the booking
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  
  // Reference to the technician providing the service
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Technician',
    required: [true, 'Technician ID is required']
  },
  
  // Service details
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
  
  // Pricing information
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
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
  
  // Scheduling
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required']
  },
  
  preferredTime: {
    type: String,
    required: [true, 'Preferred time is required']
  },
  
  duration: {
    type: Number, // in hours
    default: 1
  },
  
  // Location information
  location: {
    address: {
      type: String,
      required: true
    }
  },
  
  // Booking status tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  
  // Payment status
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
    type: String, // M-Pesa transaction ID or payment gateway reference
    default: ''
  },
  
  // Additional notes
  clientNotes: {
    type: String,
    maxlength: 500
  },
  
  technicianNotes: {
    type: String,
    maxlength: 500
  },
  
  // Admin notes (internal)
  adminNotes: {
    type: String,
    maxlength: 500
  },
  
  // Timestamps for status changes
  confirmedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['client', 'technician', 'admin', 'system']
  },
  cancellationReason: String,
  
  // Ratings and reviews (after completion)
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
  
  // Notification tracking
  notifications: {
    clientNotified: { type: Boolean, default: false },
    technicianNotified: { type: Boolean, default: false },
    lastNotificationSent: Date
  },
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for better query performance
bookingSchema.index({ clientId: 1, createdAt: -1 });
bookingSchema.index({ technicianId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ preferredDate: 1 });
bookingSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual property to check if booking is cancellable
bookingSchema.virtual('isCancellable').get(function() {
  const cancellableStatuses = ['pending', 'confirmed'];
  return cancellableStatuses.includes(this.status);
});

// Virtual property to get booking duration in minutes
bookingSchema.virtual('durationMinutes').get(function() {
  return this.duration * 60;
});

// Method to confirm booking
bookingSchema.methods.confirm = async function() {
  this.status = 'confirmed';
  this.confirmedAt = new Date();
  await this.save();
  return this;
};

// Method to start booking (technician begins service)
bookingSchema.methods.start = async function() {
  this.status = 'in-progress';
  this.startedAt = new Date();
  await this.save();
  return this;
};

// Method to complete booking
bookingSchema.methods.complete = async function(rating, review) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (rating) this.clientRating = rating;
  if (review) this.clientReview = review;
  await this.save();
  return this;
};

// Method to cancel booking
bookingSchema.methods.cancel = async function(reason, cancelledBy = 'client') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  await this.save();
  return this;
};

// Method to mark payment as complete
bookingSchema.methods.markPaymentComplete = async function(reference) {
  this.paymentStatus = 'paid';
  if (reference) this.paymentReference = reference;
  await this.save();
  return this;
};

// Static method to get technician's upcoming bookings
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

// Static method to get client's booking history
bookingSchema.statics.getHistoryForClient = async function(clientId, limit = 20) {
  return this.find({ clientId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('technicianId', 'businessName');
};

// Middleware: Calculate total amount before saving
bookingSchema.pre('save', function(next) {
  if (this.isModified('hourlyRate') || this.isModified('estimatedHours')) {
    this.totalAmount = this.hourlyRate * this.estimatedHours;
  }
  next();
});

// Middleware: Validate dates
bookingSchema.pre('save', function(next) {
  if (this.preferredDate && this.preferredDate < new Date()) {
    const error = new Error('Preferred date cannot be in the past');
    next(error);
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);