const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TechnicianSchema = new Schema({
  // ========== BASIC INFO (from User) ==========
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // ========== ABOUT ME ==========
  aboutMe: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  profileHeadline: {
    type: String,
    maxlength: 200,
    default: ''
  },

  // ========== SKILLS ==========
  skills: [{
    name: { type: String, required: true },
    level: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    },
    yearsOfExperience: { type: Number, min: 0, default: 0 }
  }],

  // ========== SERVICES OFFERED ==========
  category: { 
    type: String, 
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
    required: true
  },

  serviceCategories: [{
    categoryName: { 
      type: String,
      required: true
    },
    subServices: [{
      type: String,
      required: true
    }],
    description: String,
    basePrice: Number,
    estimatedDuration: String
  }],

  // ========== PRICING ==========
  pricing: {
    hourlyRate: { type: Number, min: 0, default: 0 },
    fixedPrice: { type: Number, min: 0, default: 0 },
    consultationFee: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'KES' },
    paymentMethods: [{
      type: String,
      enum: ['Cash', 'M-Pesa', 'Bank Transfer', 'Card', 'PayPal']
    }]
  },

  // ========== EDUCATION ==========
  education: [{
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
    description: String,
    grade: String
  }],

  // ========== CERTIFICATIONS ==========
  certifications: [{
    name: { type: String, required: true },
    issuingOrganization: { type: String, required: true },
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String,
    doesNotExpire: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }
  }],

  // ========== YEARS OF EXPERIENCE ==========
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0,
    required: true
  },
  
  experience: [{
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    isCurrent: { type: Boolean, default: false },
    description: String,
    achievements: [String]
  }],

  // ========== PORTFOLIO ==========
  portfolio: [{
    title: { type: String, required: true },
    description: String,
    category: String,
    mediaType: { 
      type: String, 
      enum: ['image', 'video', 'document'],
      required: true 
    },
    mediaUrl: { type: String, required: true },
    thumbnailUrl: String,
    clientName: String,
    completionDate: Date,
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 }
  }],

  // ========== LOCATION ==========
  address: {
    street: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: String,
    country: { type: String, default: 'Kenya' }
  },
  
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    formattedAddress: String,
    placeId: String
  },
  
  serviceRadius: {
    type: Number, // in kilometers
    default: 10,
    min: 1,
    max: 100
  },

  // ========== LANGUAGES ==========
  languages: [{
    name: { type: String, required: true },
    proficiency: { 
      type: String, 
      enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
      default: 'Fluent'
    }
  }],

  // ========== AVAILABILITY ==========
  availability: {
    monday: { 
      enabled: { type: Boolean, default: true }, 
      hours: [{ start: String, end: String }] 
    },
    tuesday: { 
      enabled: { type: Boolean, default: true }, 
      hours: [{ start: String, end: String }] 
    },
    wednesday: { 
      enabled: { type: Boolean, default: true }, 
      hours: [{ start: String, end: String }] 
    },
    thursday: { 
      enabled: { type: Boolean, default: true }, 
      hours: [{ start: String, end: String }] 
    },
    friday: { 
      enabled: { type: Boolean, default: true }, 
      hours: [{ start: String, end: String }] 
    },
    saturday: { 
      enabled: { type: Boolean, default: false }, 
      hours: [{ start: String, end: String }] 
    },
    sunday: { 
      enabled: { type: Boolean, default: false }, 
      hours: [{ start: String, end: String }] 
    }
  },
  
  emergencyAvailable: { type: Boolean, default: false },
  remoteServiceAvailable: { type: Boolean, default: false },
  weekendAvailable: { type: Boolean, default: false },

  // ========== RATINGS & REVIEWS ==========
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  
  reviews: [{
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    comment: { type: String, required: true },
    images: [String],
    response: {
      comment: String,
      respondedAt: Date
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date
  }],

  // ========== STATISTICS ==========
  statistics: {
    totalJobs: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    cancelledJobs: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 }, // in hours
    completionRate: { type: Number, default: 0 }, // percentage
    repeatClients: { type: Number, default: 0 },
    earnings: {
      total: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      lastMonth: { type: Number, default: 0 }
    }
  },

  // ========== VERIFICATION ==========
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  
  verifiedDocuments: [{
    type: { 
      type: String, 
      enum: ['id', 'certificate', 'license', 'insurance', 'business_registration'] 
    },
    documentUrl: String,
    documentNumber: String,
    verifiedAt: Date,
    expiresAt: Date,
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    remarks: String
  }],

  // ========== SOCIAL LINKS ==========
  socialLinks: {
    website: String,
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    youtube: String,
    tiktok: String
  },

  // ========== BUSINESS INFO ==========
  businessName: String,
  businessRegistrationNumber: String,
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    expiryDate: Date
  },

  // ========== SETTINGS ==========
  settings: {
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: true },
    instantBooking: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    autoAcceptJobs: { type: Boolean, default: false },
    jobReminders: { type: Boolean, default: true }
  },

  // ========== SUBSCRIPTION ==========
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: { type: Boolean, default: true },
    features: [String],
    paymentHistory: [{
      amount: Number,
      date: Date,
      transactionId: String,
      status: String
    }]
  },

  // ========== STATUS ==========
  isActive: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  completedProfile: { type: Boolean, default: false },
  profileCompletionPercentage: { type: Number, default: 0, min: 0, max: 100 },

  // ========== METADATA ==========
  views: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  searchAppearances: { type: Number, default: 0 }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========== INDEXES ==========
TechnicianSchema.index({ location: "2dsphere" });
TechnicianSchema.index({ category: 1, 'rating.average': -1 });
TechnicianSchema.index({ 'address.city': 1, category: 1 });
TechnicianSchema.index({ isAvailable: 1, isActive: 1 });
TechnicianSchema.index({ 'skills.name': 1 });
TechnicianSchema.index({ 'rating.average': -1 });
TechnicianSchema.index({ createdAt: -1 });

// Text search index
TechnicianSchema.index({ 
  'aboutMe': 'text',
  'profileHeadline': 'text',
  'skills.name': 'text',
  'businessName': 'text',
  'experience.title': 'text',
  'experience.company': 'text',
  'certifications.name': 'text'
});

// ========== VIRTUALS ==========
TechnicianSchema.virtual('fullName').get(function() {
  return this.userId ? `${this.userId.firstName} ${this.userId.lastName}` : '';
});

TechnicianSchema.virtual('profilePicture').get(function() {
  return this.userId ? this.userId.profileImage : '';
});

TechnicianSchema.virtual('contactEmail').get(function() {
  return this.settings.showEmail && this.userId ? this.userId.email : null;
});

TechnicianSchema.virtual('contactPhone').get(function() {
  return this.settings.showPhone && this.userId ? this.userId.phone : null;
});

TechnicianSchema.virtual('featuredPortfolio').get(function() {
  return this.portfolio.filter(item => item.isFeatured);
});

// ========== METHODS ==========
TechnicianSchema.methods.updateRating = function(newRating) {
  const total = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = total / this.rating.count;
  
  const star = Math.floor(newRating);
  this.rating.distribution[star] = (this.rating.distribution[star] || 0) + 1;
  
  return this.save();
};

TechnicianSchema.methods.calculateProfileCompletion = function() {
  let completed = 0;
  const totalFields = 15; // Number of major sections
  
  if (this.aboutMe) completed++;
  if (this.profileHeadline) completed++;
  if (this.skills && this.skills.length > 0) completed++;
  if (this.serviceCategories && this.serviceCategories.length > 0) completed++;
  if (this.pricing.hourlyRate > 0) completed++;
  if (this.education && this.education.length > 0) completed++;
  if (this.certifications && this.certifications.length > 0) completed++;
  if (this.yearsOfExperience > 0) completed++;
  if (this.experience && this.experience.length > 0) completed++;
  if (this.portfolio && this.portfolio.length > 0) completed++;
  if (this.address.city) completed++;
  if (this.languages && this.languages.length > 0) completed++;
  if (this.businessName) completed++;
  if (this.availability) completed++;
  if (this.socialLinks && Object.keys(this.socialLinks).length > 0) completed++;
  
  this.profileCompletionPercentage = Math.round((completed / totalFields) * 100);
  this.completedProfile = this.profileCompletionPercentage >= 70;
  
  return this.save();
};

TechnicianSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

TechnicianSchema.methods.isWithinServiceRadius = function(clientCoordinates) {
  if (!this.location.coordinates || !clientCoordinates) return false;
  
  const [lng1, lat1] = this.location.coordinates;
  const [lng2, lat2] = clientCoordinates;
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= this.serviceRadius;
};

// ========== STATICS ==========
TechnicianSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    isAvailable: true
  }).populate('userId', 'firstName lastName profileImage');
};

TechnicianSchema.statics.findByCategory = function(category, limit = 20) {
  return this.find({ category, isActive: true })
    .sort({ 'rating.average': -1, isFeatured: -1 })
    .limit(limit)
    .populate('userId', 'firstName lastName profileImage');
};

TechnicianSchema.statics.search = function(query, options = {}) {
  const {
    category,
    city,
    minRating,
    maxPrice,
    skills,
    lat,
    lng,
    radius,
    limit = 20,
    skip = 0
  } = options;
  
  let filter = { isActive: true };
  
  if (query) {
    filter.$text = { $search: query };
  }
  
  if (category) filter.category = category;
  if (city) filter['address.city'] = { $regex: city, $options: 'i' };
  if (minRating) filter['rating.average'] = { $gte: minRating };
  if (skills) filter['skills.name'] = { $in: Array.isArray(skills) ? skills : [skills] };
  
  if (lat && lng && radius) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius * 1000
      }
    };
  }
  
  return this.find(filter)
    .populate('userId', 'firstName lastName profileImage')
    .skip(skip)
    .limit(limit)
    .sort({ 'rating.average': -1, isFeatured: -1 });
};

module.exports = mongoose.model('Technician', TechnicianSchema);