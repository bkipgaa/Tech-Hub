/**
 * Job Model
 * =========
 * 
 * Represents service requests posted by clients that need to be fulfilled by technicians.
 * Jobs go through an approval workflow before being visible to technicians.
 * 
 * This model is designed to work seamlessly with:
 * - User model (for client references)
 * - ServiceCatalog model (for category/sub-category/sub-service validation)
 * - Booking model (jobs can lead to bookings)
 * - JobApplication model (technician applications)
 */

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // ===========================================
  // CLIENT INFORMATION (from User model)
  // ===========================================
  
  /** Reference to the User who posted this job */
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required'],
    index: true
  },
  
  /** Client's full name (denormalized for quick display) */
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  
  /** Company name if applicable */
  companyName: {
    type: String,
    default: '',
    trim: true
  },
  
  /** Client email (denormalized from User model) */
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  
  /** Client phone number (denormalized from User model) */
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number']
  },
  
  // ===========================================
  // JOB DETAILS
  // ===========================================
  
  /** Short, descriptive title for the job */
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    index: true
  },
  
  /** Detailed description of the work required */
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  // ===========================================
  // SERVICE CATALOG INTEGRATION
  // These fields should match entries in ServiceCatalog
  // ===========================================
  
  /** Main service category (must match ServiceCatalog.mainCategory enum) */
  mainCategory: {
    type: String,
    required: [true, 'Main category is required'],
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
    ],
    index: true
  },
  
  /** Service category name (from ServiceCatalog.serviceCategories[].name) */
  serviceCategory: {
    type: String,
    required: [true, 'Service category is required'],
    trim: true,
    index: true
  },
  
  /** Specific sub-service (from ServiceCatalog.serviceCategories[].subServices[].name) */
  subService: {
    type: String,
    required: [true, 'Sub-service is required'],
    trim: true,
    index: true
  },
  
  /** Additional details about required expertise level */
  expertiseLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  
  /** Equipment needed flag (from ServiceCatalog) */
  equipmentNeeded: {
    type: Boolean,
    default: false
  },
  
  /** List of specific equipment required */
  requiredEquipment: [{
    type: String,
    trim: true
  }],
  
  // ===========================================
  // SCHEDULING & LOCATION
  // ===========================================
  
  /** Street address where work will be performed */
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  
  /** City/Area for searching/filtering */
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    index: true
  },
  
  /** Geo-coordinates for map-based search (future enhancement) */
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  
  /** Client's preferred start date */
  preferredStartDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return date >= new Date(); // Cannot be in the past
      },
      message: 'Preferred start date cannot be in the past'
    }
  },
  
  /** Estimated duration from ServiceCatalog or client input */
  estimatedDuration: {
    value: { type: Number, default: 1 },
    unit: { 
      type: String, 
      enum: ['minutes', 'hours', 'days'], 
      default: 'hours' 
    }
  },
  
  /** Flexible scheduling flag */
  scheduleFlexible: {
    type: Boolean,
    default: true
  },
  
  // ===========================================
  // BUDGET & PRICING
  // ===========================================
  
  /** Client's budget for the job */
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget cannot be negative'],
    index: true
  },
  
  /** Currency (default: KES for Kenyan Shillings) */
  currency: {
    type: String,
    default: 'KES',
    uppercase: true,
    enum: ['KES', 'USD', 'EUR', 'GBP']
  },
  
  /** Suggested price range from ServiceCatalog (for validation) */
  suggestedPriceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  
  /** Pricing type */
  pricingType: {
    type: String,
    enum: ['fixed', 'hourly', 'negotiable'],
    default: 'fixed'
  },
  
  /** Hourly rate if pricingType is 'hourly' */
  hourlyRate: {
    type: Number,
    min: 0
  },
  
  // ===========================================
  // WORKFLOW & STATUS
  // ===========================================
  
  /** Current job status */
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'filled', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  /** Reason for rejection (if status is 'rejected') */
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  
  /** Admin notes for internal use */
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  
  /** Reference to the technician who was hired (if filled) */
  hiredTechnicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  /** Reference to the resulting booking (when job is filled) */
  resultingBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // ===========================================
  // ADDITIONAL DETAILS
  // ===========================================
  
  /** Specific requirements for this job */
  requirements: [{
    type: String,
    trim: true
  }],
  
  /** Questions for technicians to answer when applying */
  questionsForTechnicians: [{
    question: String,
    type: { 
      type: String, 
      enum: ['text', 'number', 'boolean', 'multiple_choice'] 
    },
    options: [String],
    required: { type: Boolean, default: false }
  }],
  
  /** URLs to reference images (e.g., problem areas, site photos) */
  referenceImages: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  /** Whether the job is urgent */
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  /** Urgency fee if applicable */
  urgencyFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // ===========================================
  // TIMESTAMPS & TRACKING
  // ===========================================
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  /** When admin approved the job */
  approvedAt: Date,
  
  /** When the job was filled (technician hired) */
  filledAt: Date,
  
  /** When the job was cancelled */
  cancelledAt: Date,
  
  /** Job expiration date (auto-expire after 30 days by default) */
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: true
  },
  
  /** Last notification sent to technicians about this job */
  lastNotificationSent: Date,
  
  // ===========================================
  // STATISTICS
  // ===========================================
  
  /** Number of times this job has been viewed */
  viewCount: {
    type: Number,
    default: 0
  },
  
  /** Number of applications received */
  applicationCount: {
    type: Number,
    default: 0
  },
  
  /** Whether this job is featured (paid promotion) */
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  /** Featured expiry date */
  featuredUntil: Date
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES FOR OPTIMAL QUERY PERFORMANCE
// ===========================================

// Core search indexes
jobSchema.index({ mainCategory: 1, serviceCategory: 1, subService: 1 });
jobSchema.index({ location: 1, status: 1 });
jobSchema.index({ budget: 1, status: 1 });
jobSchema.index({ createdAt: -1, status: 1 });

// Compound indexes for common queries
jobSchema.index({ clientId: 1, createdAt: -1 });
jobSchema.index({ status: 1, expiresAt: 1 });
jobSchema.index({ hiredTechnicianId: 1, status: 1 });

// Text search index for job title and description
jobSchema.index({ 
  title: 'text', 
  description: 'text',
  requirements: 'text'
});

// Geo-spatial index for location-based search (future)
jobSchema.index({ coordinates: '2dsphere' });

// ===========================================
// VIRTUAL PROPERTIES
// ===========================================

/** Total cost including urgency fee */
jobSchema.virtual('totalCost').get(function() {
  return this.budget + (this.urgencyFee || 0);
});

/** Whether the job is still open for applications */
jobSchema.virtual('isOpen').get(function() {
  return this.status === 'approved' && this.expiresAt > new Date();
});

/** Whether the job is urgent and needs quick matching */
jobSchema.virtual('isHighPriority').get(function() {
  return this.isUrgent || this.status === 'pending' && 
         (new Date() - this.createdAt) < 24 * 60 * 60 * 1000; // Less than 24 hours old
});

/** Time remaining before expiration (in days) */
jobSchema.virtual('daysUntilExpiry').get(function() {
  const remaining = this.expiresAt - new Date();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
});

// ===========================================
// INSTANCE METHODS
// ===========================================

/**
 * Approve the job (admin action)
 * @param {string} adminNotes - Optional notes from admin
 */
jobSchema.methods.approve = async function(adminNotes = '') {
  this.status = 'approved';
  this.approvedAt = new Date();
  if (adminNotes) this.adminNotes = adminNotes;
  await this.save();
  return this;
};

/**
 * Reject the job (admin action)
 * @param {string} reason - Reason for rejection
 * @param {string} adminNotes - Additional admin notes
 */
jobSchema.methods.reject = async function(reason, adminNotes = '') {
  this.status = 'rejected';
  this.rejectionReason = reason;
  if (adminNotes) this.adminNotes = adminNotes;
  await this.save();
  return this;
};

/**
 * Mark job as filled (when a technician is hired)
 * @param {ObjectId} technicianId - ID of hired technician
 * @param {ObjectId} bookingId - ID of created booking
 */
jobSchema.methods.markAsFilled = async function(technicianId, bookingId = null) {
  this.status = 'filled';
  this.filledAt = new Date();
  this.hiredTechnicianId = technicianId;
  if (bookingId) this.resultingBookingId = bookingId;
  await this.save();
  return this;
};

/**
 * Cancel the job (client action)
 * @param {string} reason - Cancellation reason
 */
jobSchema.methods.cancel = async function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.adminNotes = reason;
  await this.save();
  return this;
};

/**
 * Increment view count (for analytics)
 */
jobSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save();
  return this;
};

/**
 * Increment application count
 */
jobSchema.methods.incrementApplications = async function() {
  this.applicationCount += 1;
  await this.save();
  return this;
};

/**
 * Check if job is still valid for applications
 */
jobSchema.methods.isValidForApplications = function() {
  return this.status === 'approved' && this.expiresAt > new Date();
};

/**
 * Extend job expiry date
 * @param {number} days - Number of days to extend
 */
jobSchema.methods.extendExpiry = async function(days = 7) {
  this.expiresAt = new Date(this.expiresAt.getTime() + (days * 24 * 60 * 60 * 1000));
  await this.save();
  return this;
};

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Get all available jobs (approved & not expired)
 * @param {Object} filters - Search filters
 * @param {number} limit - Results limit
 * @param {number} skip - Pagination offset
 */
jobSchema.statics.getAvailableJobs = async function(filters = {}, limit = 20, skip = 0) {
  const query = {
    status: 'approved',
    expiresAt: { $gt: new Date() }
  };
  
  // Apply filters
  if (filters.mainCategory) query.mainCategory = filters.mainCategory;
  if (filters.serviceCategory) query.serviceCategory = filters.serviceCategory;
  if (filters.subService) query.subService = filters.subService;
  if (filters.location) query.location = { $regex: filters.location, $options: 'i' };
  if (filters.minBudget) query.budget = { $gte: filters.minBudget };
  if (filters.maxBudget) query.budget = { ...query.budget, $lte: filters.maxBudget };
  if (filters.isUrgent) query.isUrgent = true;
  
  const jobs = await this.find(query)
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('clientId', 'firstName lastName email phone profileImage');
  
  const total = await this.countDocuments(query);
  
  return { jobs, total };
};

/**
 * Get jobs posted by a specific client
 * @param {ObjectId} clientId - Client user ID
 * @param {Object} filters - Status filters
 */
jobSchema.statics.getClientJobs = async function(clientId, filters = {}) {
  const query = { clientId };
  if (filters.status) query.status = filters.status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('hiredTechnicianId', 'firstName lastName email phone');
};

/**
 * Search jobs by text (title, description)
 * @param {string} searchTerm - Search query
 * @param {Object} filters - Additional filters
 */
jobSchema.statics.searchJobs = async function(searchTerm, filters = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'approved',
    expiresAt: { $gt: new Date() }
  };
  
  if (filters.mainCategory) query.mainCategory = filters.mainCategory;
  if (filters.location) query.location = { $regex: filters.location, $options: 'i' };
  
  return this.find(query)
    .sort({ score: { $meta: 'textScore' } })
    .limit(30);
};

/**
 * Get jobs that are about to expire (for notifications)
 * @param {number} hours - Hours before expiry
 */
jobSchema.statics.getExpiringJobs = async function(hours = 24) {
  const expiryThreshold = new Date(Date.now() + hours * 60 * 60 * 1000);
  
  return this.find({
    status: 'approved',
    expiresAt: { $lte: expiryThreshold, $gt: new Date() }
  }).populate('clientId', 'email firstName lastName');
};

/**
 * Auto-expire old jobs
 */
jobSchema.statics.autoExpireJobs = async function() {
  const result = await this.updateMany(
    {
      status: 'approved',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

/**
 * Get job statistics for dashboard
 * @param {Object} dateRange - Start and end dates
 */
jobSchema.statics.getStatistics = async function(dateRange = {}) {
  const match = {};
  if (dateRange.startDate) match.createdAt = { $gte: dateRange.startDate };
  if (dateRange.endDate) match.createdAt = { ...match.createdAt, $lte: dateRange.endDate };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' },
        avgBudget: { $avg: '$budget' }
      }
    }
  ]);
  
  return stats;
};

/**
 * Validate that service category exists in ServiceCatalog
 * @param {string} mainCategory - Main category
 * @param {string} serviceCategory - Service category
 * @param {string} subService - Sub-service
 */
jobSchema.statics.validateServiceExists = async function(mainCategory, serviceCategory, subService) {
  const ServiceCatalog = mongoose.model('ServiceCatalog');
  const catalog = await ServiceCatalog.findOne({ mainCategory, isActive: true });
  
  if (!catalog) return false;
  
  const category = catalog.serviceCategories.find(c => c.name === serviceCategory && c.isActive);
  if (!category) return false;
  
  const service = category.subServices.find(s => s.name === subService && s.isActive);
  return !!service;
};

// ===========================================
// MIDDLEWARE (Hooks)
// ===========================================

/**
 * Pre-save middleware: Update the updatedAt timestamp
 */
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Pre-save middleware: Validate category/sub-service against ServiceCatalog
 * This ensures data consistency with the ServiceCatalog model
 */
jobSchema.pre('save', async function(next) {
  // Skip validation if status is draft or if we're not changing categories
  if (this.status === 'draft' || !this.isModified('mainCategory') && 
      !this.isModified('serviceCategory') && !this.isModified('subService')) {
    return next();
  }
  
  try {
    const ServiceCatalog = mongoose.model('ServiceCatalog');
    const catalog = await ServiceCatalog.findOne({ 
      mainCategory: this.mainCategory, 
      isActive: true 
    });
    
    if (!catalog) {
      return next(new Error(`Main category '${this.mainCategory}' not found or inactive`));
    }
    
    const category = catalog.serviceCategories.find(c => 
      c.name === this.serviceCategory && c.isActive
    );
    
    if (!category) {
      return next(new Error(`Service category '${this.serviceCategory}' not found in ${this.mainCategory}`));
    }
    
    const subService = category.subServices.find(s => 
      s.name === this.subService && s.isActive
    );
    
    if (!subService) {
      return next(new Error(`Sub-service '${this.subService}' not found in ${this.mainCategory} > ${this.serviceCategory}`));
    }
    
    // Auto-populate suggested price range if available
    if (subService.suggestedPriceRange) {
      this.suggestedPriceRange = subService.suggestedPriceRange;
    }
    
    // Auto-populate equipment needed flag
    if (subService.equipmentNeeded !== undefined) {
      this.equipmentNeeded = subService.equipmentNeeded;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Pre-validate middleware: Ensure email/phone match User record if clientId exists
 */
jobSchema.pre('validate', async function(next) {
  if (!this.clientId) return next();
  
  try {
    const User = mongoose.model('User');
    const user = await User.findById(this.clientId);
    
    if (user) {
      // Auto-populate from User if not manually set
      if (!this.clientName && user.firstName && user.lastName) {
        this.clientName = `${user.firstName} ${user.lastName}`;
      }
      if (!this.email && user.email) this.email = user.email;
      if (!this.phone && user.phone) this.phone = user.phone;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// ===========================================
// EXPORT MODEL
// ===========================================

module.exports = mongoose.model('Job', jobSchema);