/**
 * createProfile.js
 * =================
 * Create Technician Profile Controller
 * Updated to support three-level service hierarchy:
 * Level 1: mainCategory
 * Level 2: serviceCategories (with categoryName)
 * Level 3: subServices
 * 
 * @version 2.0.0
 * @author Weba-Hub Team
 */

const User = require('../../../models/User');
const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

/**
 * Create a new technician profile
 * @route   POST /api/technician/profile
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with created technician profile
 */
exports.createProfile = async (req, res) => {
  try {
    // ============================================
    // 1. VALIDATE USER
    // ============================================
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user.role !== 'technician') {
      return res.status(403).json({ 
        success: false, 
        message: 'Please become a technician first' 
      });
    }

    // ============================================
    // 2. CHECK FOR EXISTING PROFILE
    // ============================================
    const existing = await Technician.findOne({ userId: req.user.userId });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Profile already exists' 
      });
    }

    // ============================================
    // 3. VALIDATE REQUIRED FIELDS
    // ============================================
    // Level 1: Main Category is required
    if (!req.body.mainCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Main category is required' 
      });
    }

    // Level 2 & 3: Service Categories with Sub-Services
    if (!req.body.serviceCategories || req.body.serviceCategories.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one service category is required' 
      });
    }

    // Validate each service category has sub-services
    for (const category of req.body.serviceCategories) {
      if (!category.categoryName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Each service category must have a categoryName' 
        });
      }
      if (!category.subServices || category.subServices.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Category "${category.categoryName}" must have at least one sub-service` 
        });
      }
    }

    // Location validation
    if (!req.body.address?.city) {
      return res.status(400).json({ 
        success: false, 
        message: 'City is required' 
      });
    }
    if (!req.body.address?.state) {
      return res.status(400).json({ 
        success: false, 
        message: 'State is required' 
      });
    }

    // ============================================
    // 4. BUILD TECHNICIAN DATA
    // ============================================
    const technicianData = {
      // ===== BASIC INFO =====
      userId: req.user.userId,
      aboutMe: req.body.aboutMe || '',
      profileHeadline: req.body.profileHeadline || '',

      // ===== SKILLS =====
      skills: req.body.skills || [],

      // ===== THREE-LEVEL SERVICE HIERARCHY =====
      // Level 1: Main Category
      mainCategory: req.body.mainCategory,

      // Level 2 & 3: Service Categories with Sub-Services
      serviceCategories: req.body.serviceCategories.map(category => ({
        categoryName: category.categoryName,
        subServices: category.subServices || [],
        description: category.description || '',
        basePrice: category.basePrice || 0,
        estimatedDuration: category.estimatedDuration || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        displayOrder: category.displayOrder || 0
      })),

      // ===== PRICING =====
      pricing: {
        hourlyRate: req.body.pricing?.hourlyRate || 0,
        fixedPrice: req.body.pricing?.fixedPrice || 0,
        consultationFee: req.body.pricing?.consultationFee || 0,
        currency: req.body.pricing?.currency || 'KES',
        paymentMethods: req.body.pricing?.paymentMethods || ['Cash', 'M-Pesa']
      },

      // ===== EDUCATION =====
      education: req.body.education || [],

      // ===== CERTIFICATIONS =====
      certifications: req.body.certifications || [],

      // ===== YEARS OF EXPERIENCE =====
      yearsOfExperience: req.body.yearsOfExperience || 0,

      // ===== EXPERIENCE =====
      experience: req.body.experience || [],

      // ===== PORTFOLIO =====
      portfolio: req.body.portfolio || [],

      // ===== LOCATION =====
      address: {
        street: req.body.address?.street || '',
        city: req.body.address?.city || '',
        state: req.body.address?.state || '',
        zipCode: req.body.address?.zipCode || '',
        country: req.body.address?.country || 'Kenya'
      },
      location: {
        type: 'Point',
        coordinates: req.body.location?.coordinates || [0, 0],
        formattedAddress: req.body.location?.formattedAddress || '',
        placeId: req.body.location?.placeId || ''
      },
      serviceRadius: req.body.serviceRadius || 10,

      // ===== LANGUAGES =====
      languages: req.body.languages || [{ name: 'English', proficiency: 'Fluent' }],

      // ===== AVAILABILITY =====
      availability: req.body.availability || {
        monday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        tuesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        thursday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        friday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        saturday: { enabled: false, hours: [] },
        sunday: { enabled: false, hours: [] }
      },
      emergencyAvailable: req.body.emergencyAvailable || false,
      remoteServiceAvailable: req.body.remoteServiceAvailable || false,
      weekendAvailable: req.body.weekendAvailable || false,

      // ===== BUSINESS INFO =====
      businessName: req.body.businessName || '',
      businessRegistrationNumber: req.body.businessRegistrationNumber || '',

      // ===== SOCIAL LINKS =====
      socialLinks: req.body.socialLinks || {},

      // ===== SETTINGS =====
      settings: {
        showEmail: req.body.settings?.showEmail || false,
        showPhone: req.body.settings?.showPhone !== undefined ? req.body.settings.showPhone : true,
        instantBooking: req.body.settings?.instantBooking !== undefined ? req.body.settings.instantBooking : true,
        requiresApproval: req.body.settings?.requiresApproval || false,
        autoAcceptJobs: req.body.settings?.autoAcceptJobs || false,
        jobReminders: req.body.settings?.jobReminders !== undefined ? req.body.settings.jobReminders : true,
        notifications: {
          email: req.body.settings?.notifications?.email !== undefined ? req.body.settings.notifications.email : true,
          sms: req.body.settings?.notifications?.sms !== undefined ? req.body.settings.notifications.sms : true,
          push: req.body.settings?.notifications?.push !== undefined ? req.body.settings.notifications.push : true
        }
      },

      // ===== SUBSCRIPTION (Default: Free Trial) =====
      subscription: {
        plan: 'trial',
        startDate: new Date(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isTrial: true,
        autoRenew: false
      },

      // ===== STATUS =====
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,
      isActive: true,
      lastActive: new Date(),

      // ===== VERIFICATION =====
      verificationStatus: 'pending'
    };

    // ============================================
    // 5. CREATE AND SAVE TECHNICIAN
    // ============================================
    const technician = new Technician(technicianData);
    await technician.save();

    // ============================================
    // 6. UPDATE COMPLETION STATS
    // ============================================
    await updateCompletionStats(technician);

    // ============================================
    // 7. POPULATE USER DATA FOR RESPONSE
    // ============================================
    await technician.populate('userId', 'email firstName lastName phone profileImage');

    // ============================================
    // 8. SEND SUCCESS RESPONSE
    // ============================================
    res.status(201).json({
      success: true,
      message: 'Technician profile created successfully',
      technician: {
        _id: technician._id,
        userId: technician.userId,
        mainCategory: technician.mainCategory,
        serviceCategories: technician.serviceCategories,
        aboutMe: technician.aboutMe,
        profileHeadline: technician.profileHeadline,
        skills: technician.skills,
        pricing: technician.pricing,
        yearsOfExperience: technician.yearsOfExperience,
        address: technician.address,
        location: technician.location,
        businessName: technician.businessName,
        verificationStatus: technician.verificationStatus,
        isAvailable: technician.isAvailable,
        profileCompletionPercentage: technician.profileCompletionPercentage,
        createdAt: technician.createdAt
      }
    });

  } catch (error) {
    console.error('Create profile error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Profile already exists for this user'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during profile creation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};