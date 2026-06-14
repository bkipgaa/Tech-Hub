/**
 * JobApplication Model
 * ====================
 * 
 * Represents technician applications submitted for job postings.
 * Tracks the application lifecycle from submission to acceptance/rejection.
 * 
 * This model integrates with:
 * - User model (technician applicants)
 * - Job model (the job being applied for)
 * - Booking model (creates a booking when application is accepted)
 * - ServiceCatalog (for skill validation)
 */

const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  // ===========================================
  // RELATIONSHIPS
  // ===========================================
  
  /** Reference to the job being applied for */
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required'],
    index: true
  },
  
  /** Reference to the technician applying (from User model with role='technician') */
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Technician ID is required'],
    index: true
  },
  
  /** Reference to the resulting booking (if application is accepted) */
  resultingBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  
  // ===========================================
  // APPLICATION DETAILS
  // ===========================================
  
  /** Cover message explaining why the technician is suitable */
  coverMessage: {
    type: String,
    required: [true, 'Cover message is required'],
    maxlength: [2000, 'Cover message cannot exceed 2000 characters'],
    trim: true
  },
  
  /** Proposed price for the job (can be different from job budget) */
  proposedPrice: {
    type: Number,
    min: [0, 'Proposed price cannot be negative'],
    validate: {
      validator: function(value) {
        // If provided, must be a positive number
        return value === undefined || value >= 0;
      },
      message: 'Proposed price must be a positive number'
    }
  },
  
  /** Estimated days to complete the job */
  estimatedDays: {
    type: Number,
    min: [0.5, 'Estimated days must be at least 0.5'],
    max: [365, 'Estimated days cannot exceed 365'],
    default: null
  },
  
  /** Estimated hours (alternative to days for smaller jobs) */
  estimatedHours: {
    type: Number,
    min: [0.5, 'Estimated hours must be at least 0.5'],
    max: [168, 'Estimated hours cannot exceed 168 (7 days)'],
    default: null
  },
  
  /** Technician's availability start date */
  availableFrom: {
    type: Date,
    validate: {
      validator: function(date) {
        return date >= new Date();
      },
      message: 'Available from date cannot be in the past'
    }
  },
  
  /** Technician's availability end date */
  availableUntil: {
    type: Date,
    validate: {
      validator: function(date) {
        return !this.availableFrom || date > this.availableFrom;
      },
      message: 'Available until date must be after available from date'
    }
  },
  
  // ===========================================
  // TECHNICIAN INFORMATION (Denormalized for quick access)
  // ===========================================
  
  /** Technician's name (denormalized from User model) */
  technicianName: {
    type: String,
    required: true,
    trim: true
  },
  
  /** Technician's email (denormalized) */
  technicianEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  /** Technician's phone number (denormalized) */
  technicianPhone: {
    type: String,
    required: true
  },
  
  /** Technician's profile image URL (denormalized) */
  technicianProfileImage: {
    type: String,
    default: ''
  },
  
  /** Technician's average rating (for client reference) */
  technicianRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  /** Number of completed jobs by technician (for client reference) */
  technicianCompletedJobs: {
    type: Number,
    default: 0
  },
  
  // ===========================================
  // SKILLS & QUALIFICATIONS (From technician profile)
  // ===========================================
  
  /** Relevant skills for this job (from technician's profile) */
  relevantSkills: [{
    type: String,
    trim: true
  }],
  
  /** Years of experience in this service category */
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  
  /** Certifications relevant to the job */
  certifications: [{
    name: String,
    issuer: String,
    yearObtained: Number,
    verificationUrl: String
  }],
  
  /** Portfolio images relevant to similar jobs */
  portfolioImages: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // ===========================================
  // APPLICATION STATUS & WORKFLOW
  // ===========================================
  
  /** Current status of the application */
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'expired', 'countered'],
    default: 'pending',
    index: true
  },
  
  /** If rejected, the reason for rejection */
  rejectionReason: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  /** If countered, the client's counter-offer details */
  counterOffer: {
    price: { type: Number, min: 0 },
    estimatedDays: { type: Number, min: 0.5 },
    message: { type: String, maxlength: 500 },
    offeredAt: { type: Date },
    expiresAt: { type: Date }
  },
  
  /** Technician's response to counter-offer */
  counterResponse: {
    accepted: { type: Boolean, default: false },
    respondedAt: Date,
    message: String
  },
  
  // ===========================================
  // TIMESTAMPS
  // ===========================================
  
  /** When the application was submitted */
  appliedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  /** When the client reviewed the application */
  reviewedAt: Date,
  
  /** When the application was accepted/rejected */
  respondedAt: Date,
  
  /** When the technician withdrew the application */
  withdrawnAt: Date,
  
  /** When the application expires (auto-expire after 7 days if no response) */
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: true
  },
  
  // ===========================================
  // COMMUNICATION
  // ===========================================
  
  /** Chat/messages exchanged between client and technician */
  messages: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    senderRole: { type: String, enum: ['client', 'technician', 'admin'] },
    message: { type: String, required: true },
    attachments: [String],
    sentAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    readAt: Date
  }],
  
  /** Last message timestamp (for sorting) */
  lastMessageAt: Date,
  
  /** Unread message count for client */
  clientUnreadCount: { type: Number, default: 0 },
  
  /** Unread message count for technician */
  technicianUnreadCount: { type: Number, default: 0 },
  
  // ===========================================
  // NOTIFICATIONS
  // ===========================================
  
  /** Notification tracking */
  notifications: {
    clientNotified: { type: Boolean, default: false },
    technicianNotified: { type: Boolean, default: false },
    lastClientNotification: Date,
    lastTechnicianNotification: Date
  },
  
  // ===========================================
  // SYSTEM FIELDS
  // ===========================================
  
  /** Whether the application is active */
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  /** Admin notes (for disputes or review) */
  adminNotes: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  
  /** Priority score for matching algorithms */
  priorityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  
  /** Source of application (direct, suggested, etc.) */
  source: {
    type: String,
    enum: ['direct', 'suggested', 'invited', 'search'],
    default: 'direct'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// INDEXES FOR OPTIMAL QUERY PERFORMANCE
// ===========================================

// Core indexes
jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ technicianId: 1, status: 1 });
jobApplicationSchema.index({ jobId: 1, technicianId: 1 }, { unique: true }); // Prevent duplicate applications
jobApplicationSchema.index({ status: 1, appliedAt: -1 });
jobApplicationSchema.index({ expiresAt: 1, status: 1 });

// Compound indexes for common queries
jobApplicationSchema.index({ jobId: 1, status: 1, appliedAt: -1 });
jobApplicationSchema.index({ technicianId: 1, appliedAt: -1 });
jobApplicationSchema.index({ status: 1, priorityScore: -1 });

// Index for auto-expiry queries
jobApplicationSchema.index({ expiresAt: 1, status: 'pending' });

// Text search index
jobApplicationSchema.index({ 
  coverMessage: 'text',
  technicianName: 'text',
  rejectionReason: 'text'
});

// ===========================================
// VIRTUAL PROPERTIES
// ===========================================

/** Whether the application is still pending */
jobApplicationSchema.virtual('isPending').get(function() {
  return this.status === 'pending' && this.expiresAt > new Date();
});

/** Whether the application has expired */
jobApplicationSchema.virtual('hasExpired').get(function() {
  return this.expiresAt < new Date();
});

/** Whether the application can be withdrawn */
jobApplicationSchema.virtual('canWithdraw').get(function() {
  return ['pending', 'countered'].includes(this.status);
});

/** Time remaining before expiration (in hours) */
jobApplicationSchema.virtual('hoursUntilExpiry').get(function() {
  const remaining = this.expiresAt - new Date();
  return Math.max(0, Math.floor(remaining / (1000 * 60 * 60)));
});

/** Full technician name (alias) */
jobApplicationSchema.virtual('technicianFullName').get(function() {
  return this.technicianName;
});

// ===========================================
// INSTANCE METHODS
// ===========================================

/**
 * Accept the application and create a booking
 * @param {Object} bookingData - Optional booking data overrides
 * @returns {Promise<Object>} - The created booking
 */
jobApplicationSchema.methods.accept = async function(bookingData = {}) {
  const Job = mongoose.model('Job');
  const Booking = mongoose.model('Booking');
  
  // Update application status
  this.status = 'accepted';
  this.respondedAt = new Date();
  await this.save();
  
  // Get the job
  const job = await Job.findById(this.jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  
  // Create booking from the application
  const booking = new Booking({
    clientId: job.clientId,
    technicianId: this.technicianId,
    serviceCategory: job.serviceCategory,
    subService: job.subService,
    serviceDescription: job.description,
    hourlyRate: this.proposedPrice ? this.proposedPrice / (this.estimatedHours || 1) : job.hourlyRate,
    estimatedHours: this.estimatedHours || (this.estimatedDays ? this.estimatedDays * 8 : 1),
    totalAmount: this.proposedPrice || job.budget,
    preferredDate: this.availableFrom || job.preferredStartDate || new Date(),
    preferredTime: '09:00', // Default time, can be customized
    location: {
      address: job.address
    },
    clientNotes: `Booking created from application for job: ${job.title}`,
    ...bookingData
  });
  
  await booking.save();
  
  // Link booking to job and application
  this.resultingBookingId = booking._id;
  await this.save();
  
  // Mark job as filled
  await job.markAsFilled(this.technicianId, booking._id);
  
  // Update technician's statistics (increment application success)
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.technicianId, {
    $inc: { 'statistics.acceptedApplications': 1 }
  });
  
  return booking;
};

/**
 * Reject the application
 * @param {string} reason - Reason for rejection
 * @returns {Promise<Object>} - The updated application
 */
jobApplicationSchema.methods.reject = async function(reason = '') {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.respondedAt = new Date();
  await this.save();
  
  // Update technician's statistics
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(this.technicianId, {
    $inc: { 'statistics.rejectedApplications': 1 }
  });
  
  return this;
};

/**
 * Withdraw the application (technician action)
 * @param {string} reason - Reason for withdrawal
 * @returns {Promise<Object>} - The updated application
 */
jobApplicationSchema.methods.withdraw = async function(reason = '') {
  if (!this.canWithdraw) {
    throw new Error('Application cannot be withdrawn at this stage');
  }
  
  this.status = 'withdrawn';
  this.withdrawnAt = new Date();
  this.rejectionReason = reason;
  await this.save();
  
  return this;
};

/**
 * Make a counter-offer (client action)
 * @param {Object} offer - Counter-offer details
 * @returns {Promise<Object>} - The updated application
 */
jobApplicationSchema.methods.makeCounterOffer = async function(offer) {
  if (this.status !== 'pending') {
    throw new Error('Counter-offer can only be made on pending applications');
  }
  
  this.status = 'countered';
  this.counterOffer = {
    price: offer.price,
    estimatedDays: offer.estimatedDays,
    message: offer.message,
    offeredAt: new Date(),
    expiresAt: offer.expiresAt || new Date(+new Date() + 2 * 24 * 60 * 60 * 1000) // 2 days default
  };
  await this.save();
  
  return this;
};

/**
 * Respond to counter-offer (technician action)
 * @param {boolean} accept - Whether to accept the counter-offer
 * @param {string} message - Response message
 * @returns {Promise<Object>} - The updated application
 */
jobApplicationSchema.methods.respondToCounterOffer = async function(accept, message = '') {
  if (this.status !== 'countered') {
    throw new Error('No counter-offer to respond to');
  }
  
  if (this.counterOffer.expiresAt < new Date()) {
    this.status = 'expired';
    await this.save();
    throw new Error('Counter-offer has expired');
  }
  
  this.counterResponse = {
    accepted: accept,
    respondedAt: new Date(),
    message
  };
  
  if (accept) {
    // Accept the counter-offer and create booking with new terms
    this.proposedPrice = this.counterOffer.price;
    this.estimatedDays = this.counterOffer.estimatedDays;
    await this.accept();
  } else {
    this.status = 'pending'; // Back to pending
  }
  
  await this.save();
  return this;
};

/**
 * Send a message on this application
 * @param {ObjectId} senderId - ID of the sender
 * @param {string} senderRole - Role of sender (client/technician/admin)
 * @param {string} message - Message content
 * @param {Array} attachments - Optional file attachments
 * @returns {Promise<Object>} - The updated application
 */
jobApplicationSchema.methods.sendMessage = async function(senderId, senderRole, message, attachments = []) {
  const messageObj = {
    senderId,
    senderRole,
    message,
    attachments,
    sentAt: new Date()
  };
  
  this.messages.push(messageObj);
  this.lastMessageAt = new Date();
  
  // Update unread counts
  if (senderRole === 'client') {
    this.technicianUnreadCount += 1;
  } else if (senderRole === 'technician') {
    this.clientUnreadCount += 1;
  }
  
  await this.save();
  return messageObj;
};

/**
 * Mark messages as read for a specific user role
 * @param {string} role - Role to mark messages for (client/technician)
 * @returns {Promise<Object>} - The updated application
 */
jobApplicationSchema.methods.markMessagesAsRead = async function(role) {
  if (role === 'client') {
    this.clientUnreadCount = 0;
  } else if (role === 'technician') {
    this.technicianUnreadCount = 0;
  }
  
  // Mark individual messages as read
  this.messages.forEach(msg => {
    if (!msg.isRead && (
      (role === 'client' && msg.senderRole === 'technician') ||
      (role === 'technician' && msg.senderRole === 'client')
    )) {
      msg.isRead = true;
      msg.readAt = new Date();
    }
  });
  
  await this.save();
  return this;
};

/**
 * Auto-expire application if past expiry date
 * @returns {Promise<boolean>} - Whether the application was expired
 */
jobApplicationSchema.methods.autoExpire = async function() {
  if (this.status === 'pending' && this.expiresAt < new Date()) {
    this.status = 'expired';
    await this.save();
    return true;
  }
  return false;
};

// ===========================================
// STATIC METHODS
// ===========================================

/**
 * Get all applications for a specific job
 * @param {ObjectId} jobId - Job ID
 * @param {Object} filters - Optional filters (status, etc.)
 * @returns {Promise<Array>} - List of applications
 */
jobApplicationSchema.statics.getByJob = async function(jobId, filters = {}) {
  const query = { jobId, isActive: true };
  if (filters.status) query.status = filters.status;
  
  return this.find(query)
    .sort({ priorityScore: -1, appliedAt: 1 })
    .populate('technicianId', 'firstName lastName email phone profileImage rating');
};

/**
 * Get all applications by a specific technician
 * @param {ObjectId} technicianId - Technician user ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - List of applications
 */
jobApplicationSchema.statics.getByTechnician = async function(technicianId, filters = {}) {
  const query = { technicianId, isActive: true };
  if (filters.status) query.status = filters.status;
  
  return this.find(query)
    .sort({ appliedAt: -1 })
    .populate('jobId', 'title budget location mainCategory serviceCategory subService status');
};

/**
 * Get pending applications for a client's jobs
 * @param {ObjectId} clientId - Client user ID
 * @returns {Promise<Array>} - List of pending applications
 */
jobApplicationSchema.statics.getPendingForClient = async function(clientId) {
  const Job = mongoose.model('Job');
  
  // Get all jobs posted by this client
  const clientJobs = await Job.find({ clientId, status: 'approved' }).select('_id');
  const jobIds = clientJobs.map(job => job._id);
  
  return this.find({
    jobId: { $in: jobIds },
    status: 'pending',
    expiresAt: { $gt: new Date() },
    isActive: true
  })
    .sort({ priorityScore: -1, appliedAt: 1 })
    .populate('technicianId', 'firstName lastName email phone profileImage rating');
};

/**
 * Get applications that need attention (urgent)
 * @param {number} hoursThreshold - Hours threshold for expiration
 * @returns {Promise<Array>} - List of applications about to expire
 */
jobApplicationSchema.statics.getExpiringApplications = async function(hoursThreshold = 24) {
  const expiryThreshold = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000);
  
  return this.find({
    status: 'pending',
    expiresAt: { $lte: expiryThreshold, $gt: new Date() },
    isActive: true
  })
    .populate('jobId', 'title clientId')
    .populate('technicianId', 'firstName lastName email');
};

/**
 * Auto-expire all stale applications
 * @returns {Promise<number>} - Number of applications expired
 */
jobApplicationSchema.statics.autoExpireStaleApplications = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() },
      isActive: true
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

/**
 * Get application statistics for a technician
 * @param {ObjectId} technicianId - Technician user ID
 * @returns {Promise<Object>} - Statistics object
 */
jobApplicationSchema.statics.getTechnicianStats = async function(technicianId) {
  const stats = await this.aggregate([
    { $match: { technicianId, isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    expired: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  // Calculate acceptance rate
  const totalDecisions = result.accepted + result.rejected;
  result.acceptanceRate = totalDecisions > 0 
    ? (result.accepted / totalDecisions) * 100 
    : 0;
  
  return result;
};

/**
 * Get application statistics for a job
 * @param {ObjectId} jobId - Job ID
 * @returns {Promise<Object>} - Statistics object
 */
jobApplicationSchema.statics.getJobStats = async function(jobId) {
  const stats = await this.aggregate([
    { $match: { jobId, isActive: true } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProposedPrice: { $avg: '$proposedPrice' },
        avgEstimatedDays: { $avg: '$estimatedDays' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
    avgProposedPrice: 0,
    avgEstimatedDays: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    if (stat._id === 'pending') {
      result.avgProposedPrice = stat.avgProposedPrice || 0;
      result.avgEstimatedDays = stat.avgEstimatedDays || 0;
    }
  });
  
  return result;
};

/**
 * Find the best matching technicians for a job (for suggestions)
 * @param {ObjectId} jobId - Job ID
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - List of technician applications
 */
jobApplicationSchema.statics.findBestMatches = async function(jobId, limit = 5) {
  const Job = mongoose.model('Job');
  const job = await Job.findById(jobId);
  
  if (!job) return [];
  
  return this.find({
    jobId,
    status: 'pending',
    isActive: true
  })
    .sort({ 
      priorityScore: -1,
      technicianRating: -1,
      technicianCompletedJobs: -1
    })
    .limit(limit)
    .populate('technicianId', 'firstName lastName email phone profileImage rating');
};

// ===========================================
// MIDDLEWARE (Hooks)
// ===========================================

/**
 * Pre-save middleware: Validate and set defaults
 */
jobApplicationSchema.pre('save', function(next) {
  // Ensure proposed price doesn't exceed job budget significantly (optional validation)
  if (this.proposedPrice && this.jobId) {
    // This would require populating job, so skip for now
    // Can be implemented in pre-validate instead
  }
  
  // Set technician denormalized fields if not set
  if (this.technicianId && (!this.technicianName || !this.technicianEmail)) {
    // This should be handled in pre-validate with population
  }
  
  next();
});

/**
 * Pre-validate middleware: Populate technician information
 */
jobApplicationSchema.pre('validate', async function(next) {
  if (this.technicianId && (!this.technicianName || !this.technicianEmail)) {
    try {
      const User = mongoose.model('User');
      const technician = await User.findById(this.technicianId);
      
      if (technician) {
        this.technicianName = `${technician.firstName} ${technician.lastName}`;
        this.technicianEmail = technician.email;
        this.technicianPhone = technician.phone;
        this.technicianProfileImage = technician.profileImage || '';
        this.technicianRating = technician.rating || 0;
      }
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

/**
 * Post-save middleware: Update job application count
 */
jobApplicationSchema.post('save', async function(doc) {
  const Job = mongoose.model('Job');
  await Job.findByIdAndUpdate(doc.jobId, {
    $inc: { applicationCount: 1 }
  });
});

/**
 * Post-remove middleware: Decrement job application count
 */
jobApplicationSchema.post('remove', async function(doc) {
  const Job = mongoose.model('Job');
  await Job.findByIdAndUpdate(doc.jobId, {
    $inc: { applicationCount: -1 }
  });
});

// ===========================================
// EXPORT MODEL
// ===========================================

module.exports = mongoose.model('JobApplication', jobApplicationSchema);