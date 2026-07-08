// backend/models/Technician.js
const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // ✅ Only mainCategory - removed category field
  mainCategory: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  aboutMe: {
    type: String,
    maxlength: 2000
  },
  profileHeadline: {
    type: String,
    maxlength: 200
  },
  skills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  // ✅ Three-level hierarchy
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
    basePrice: {
      type: Number,
      default: 0
    },
    estimatedDuration: String,
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  }],
  pricing: {
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0
    },
    fixedPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'KES'
    },
    paymentMethods: [{
      type: String,
      enum: ['Cash', 'M-Pesa', 'Bank Transfer', 'Credit Card', 'Debit Card', 'PayPal']
    }]
  },
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean,
    description: String,
    grade: String
  }],
  certifications: [{
    name: String,
    issuingOrganization: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String,
    doesNotExpire: Boolean
  }],
  yearsOfExperience: {
    type: Number,
    default: 0,
    min: 0
  },
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean,
    description: String,
    achievements: [String]
  }],
  portfolio: [{
    title: String,
    description: String,
    category: String,
    mediaType: {
      type: String,
      enum: ['image', 'video', 'document'],
      default: 'image'
    },
    mediaUrl: String,
    thumbnailUrl: String,
    clientName: String,
    completionDate: Date,
    tags: [String],
    isFeatured: Boolean
  }],
  address: {
    street: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: String,
    country: {
      type: String,
      default: 'Kenya'
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
      index: '2dsphere'
    },
    formattedAddress: String,
    placeId: String
  },
  serviceRadius: {
    type: Number,
    default: 10,
    min: 0
  },
  languages: [{
    name: String,
    proficiency: {
      type: String,
      enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
      default: 'Fluent'
    }
  }],
  availability: {
    monday: { enabled: Boolean, hours: [{ start: String, end: String }] },
    tuesday: { enabled: Boolean, hours: [{ start: String, end: String }] },
    wednesday: { enabled: Boolean, hours: [{ start: String, end: String }] },
    thursday: { enabled: Boolean, hours: [{ start: String, end: String }] },
    friday: { enabled: Boolean, hours: [{ start: String, end: String }] },
    saturday: { enabled: Boolean, hours: [{ start: String, end: String }] },
    sunday: { enabled: Boolean, hours: [{ start: String, end: String }] }
  },
  emergencyAvailable: {
    type: Boolean,
    default: false
  },
  remoteServiceAvailable: {
    type: Boolean,
    default: false
  },
  weekendAvailable: {
    type: Boolean,
    default: false
  },
  businessName: String,
  businessRegistrationNumber: String,
  socialLinks: {
    website: String,
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    youtube: String,
    tiktok: String
  },
  settings: {
    showEmail: Boolean,
    showPhone: Boolean,
    instantBooking: Boolean,
    requiresApproval: Boolean,
    autoAcceptJobs: Boolean,
    jobReminders: Boolean,
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  profileCompletionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'not_submitted'],
    default: 'not_submitted'
  },
  verificationRemarks: String,
  verifiedAt: Date,
  lastActive: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ✅ Index for mainCategory
technicianSchema.index({ mainCategory: 1 });

// ✅ Index for location queries
technicianSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Technician', technicianSchema);