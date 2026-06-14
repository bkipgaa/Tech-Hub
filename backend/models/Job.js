/**
 * Job Model - NO NEXT() VERSION
 */

const mongoose = require('mongoose');

// Define the schema
const jobSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  mainCategory: {
    type: String,
    required: true,
    enum: [
      'IT & Networking',
      'Electrical Services',
      'Mechanical Services',
      'Plumbing',
      'Programming & AI',
      'Hairdressing & Beauty',
      'Carpentry & Furniture',
      'Laundry & Dry Cleaning',
      'Cleaning Services',
      'Painting & Decorating',
      'Welding & Fabrication',
      'Automotive Repair',
      'Tutoring & Training',
      'Photography & Videography',
      'Event Planning',
      'Construction & Renovation',
      'HVAC Services',
      'Appliance Repair',
      'Moving & Logistics',
      'Gardening & Landscaping'
    ]
  },
  serviceCategory: {
    type: String,
    required: true,
    trim: true
  },
  subService: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES',
    uppercase: true
  },
  pricingType: {
    type: String,
    enum: ['fixed', 'hourly', 'negotiable'],
    default: 'fixed'
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0
  },
  preferredStartDate: {
    type: Date,
    default: null
  },
  estimatedDuration: {
    value: { type: Number, default: 1 },
    unit: { type: String, enum: ['minutes', 'hours', 'days'], default: 'hours' }
  },
  
  equipmentNeeded: {
    type: Boolean,
    default: false
  },
  requiredEquipment: [{
    type: String,
    trim: true
  }],
  suggestedPriceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'filled', 'expired', 'cancelled'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  hiredTechnicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resultingBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  requirements: [{
    type: String,
    trim: true
  }],
  
  referenceImages: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  isUrgent: {
    type: Boolean,
    default: false
  },
  urgencyFee: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date,
    default: null
  },
  filledAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000)
  },
  lastNotificationSent: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual properties
jobSchema.virtual('totalCost').get(function() {
  return this.budget + (this.urgencyFee || 0);
});

jobSchema.virtual('isOpen').get(function() {
  return this.status === 'approved' && this.expiresAt > new Date();
});

// Instance methods (no next required)
jobSchema.methods.approve = async function(adminNotes = '') {
  this.status = 'approved';
  this.approvedAt = new Date();
  if (adminNotes) this.adminNotes = adminNotes;
  await this.save();
  return this;
};

jobSchema.methods.reject = async function(reason, adminNotes = '') {
  this.status = 'rejected';
  this.rejectionReason = reason;
  if (adminNotes) this.adminNotes = adminNotes;
  await this.save();
  return this;
};

jobSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save();
  return this;
};

jobSchema.methods.incrementApplications = async function() {
  this.applicationCount += 1;
  await this.save();
  return this;
};

// SIMPLE PRE-SAVE HOOK - Using function() without parameters
// This automatically updates updatedAt without needing next()
jobSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// NO PRE-VALIDATE MIDDLEWARE - Let Mongoose handle validation automatically

// IMPORTANT: This is the fix for "Job is not a constructor" error
// Check if model already exists to avoid overwriting
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

module.exports = Job;