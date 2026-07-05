/**
 * Public Controller for Technician Profiles
 * ==========================================
 * Handles public-facing technician profile requests
 * No authentication required - for clients viewing technician profiles
 * Updated for three-level service hierarchy
 * 
 * @version 2.0.0
 * @author Weba-Hub Team
 */

const Technician = require('../../models/Technician');

/**
 * Get public technician profile by ID
 * @route   GET /api/technician/public/:id
 * @access  Public
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID format
    if (!id || id.length !== 24) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid technician ID format' 
      });
    }
    
    // Find technician by ID and populate user data
    const technician = await Technician.findById(id)
      .populate('userId', 'firstName lastName email phone profileImage');
    
    // Check if technician exists
    if (!technician) {
      return res.status(404).json({ 
        success: false, 
        message: 'Technician not found' 
      });
    }
    
    // Return public profile (exclude sensitive data)
    res.json({
      success: true,
      data: {
        _id: technician._id,
        userId: technician.userId,
        aboutMe: technician.aboutMe,
        profileHeadline: technician.profileHeadline,
        skills: technician.skills,
        // UPDATED: Use mainCategory instead of category
        mainCategory: technician.mainCategory,
        // UPDATED: Full service categories with sub-services
        serviceCategories: technician.serviceCategories,
        pricing: technician.pricing,
        education: technician.education,
        certifications: technician.certifications,
        yearsOfExperience: technician.yearsOfExperience,
        experience: technician.experience,
        portfolio: technician.portfolio,
        address: technician.address,
        location: technician.location,
        serviceRadius: technician.serviceRadius,
        languages: technician.languages,
        availability: technician.availability,
        emergencyAvailable: technician.emergencyAvailable,
        remoteServiceAvailable: technician.remoteServiceAvailable,
        weekendAvailable: technician.weekendAvailable,
        rating: technician.rating,
        socialLinks: technician.socialLinks,
        businessName: technician.businessName,
        settings: technician.settings,
        isAvailable: technician.isAvailable,
        verificationStatus: technician.verificationStatus,
        profileCompletionPercentage: technician.profileCompletionPercentage,
        createdAt: technician.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error in getPublicProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * Get all public technician profiles (with optional filters)
 * @route   GET /api/technician/public
 * @route   GET /api/technician/public/all
 * @access  Public
 */
exports.getAllPublicProfiles = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { 
      mainCategory,      // UPDATED: Changed from category to mainCategory
      serviceCategory,   // NEW: Filter by service category
      subService,        // NEW: Filter by sub-service
      isAvailable, 
      minRating,
      maxHourlyRate,
      verificationStatus,
      limit = 50,
      page = 1
    } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Only show active and appropriately verified technicians
    filter.isActive = true;
    filter.verificationStatus = { $in: ['verified', 'pending'] };
    
    // Apply optional filters - UPDATED for three-level hierarchy
    if (mainCategory) {
      filter.mainCategory = mainCategory;
    }
    
    // Filter by service category (Level 2)
    if (serviceCategory) {
      filter['serviceCategories.categoryName'] = serviceCategory;
    }
    
    // Filter by sub-service (Level 3)
    if (subService) {
      filter['serviceCategories.subServices'] = subService;
    }
    
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }
    
    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }
    
    if (minRating) {
      filter['rating.average'] = { $gte: parseFloat(minRating) };
    }
    
    if (maxHourlyRate) {
      filter['pricing.hourlyRate'] = { $lte: parseFloat(maxHourlyRate) };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Get technicians with pagination
    const technicians = await Technician.find(filter)
      .populate('userId', 'firstName lastName email phone profileImage')
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Get total count for pagination
    const total = await Technician.countDocuments(filter);
    
    // Remove sensitive data from each technician
    const sanitizedTechnicians = technicians.map(tech => {
      // Remove any sensitive internal fields
      delete tech.__v;
      
      return {
        _id: tech._id,
        userId: tech.userId,
        aboutMe: tech.aboutMe,
        profileHeadline: tech.profileHeadline,
        skills: tech.skills,
        // UPDATED: Use mainCategory
        mainCategory: tech.mainCategory,
        // UPDATED: Full service categories
        serviceCategories: tech.serviceCategories,
        pricing: tech.pricing,
        yearsOfExperience: tech.yearsOfExperience,
        portfolio: tech.portfolio?.slice(0, 3),
        location: tech.location,
        serviceRadius: tech.serviceRadius,
        languages: tech.languages,
        availability: tech.availability,
        emergencyAvailable: tech.emergencyAvailable,
        remoteServiceAvailable: tech.remoteServiceAvailable,
        weekendAvailable: tech.weekendAvailable,
        rating: tech.rating,
        businessName: tech.businessName,
        isAvailable: tech.isAvailable,
        verificationStatus: tech.verificationStatus,
        createdAt: tech.createdAt
      };
    });
    
    res.json({
      success: true,
      count: sanitizedTechnicians.length,
      total: total,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        limit: limitNum,
        hasNextPage: skip + limitNum < total,
        hasPrevPage: parseInt(page) > 1
      },
      // UPDATED: Include filter info in response
      filters: {
        mainCategory: mainCategory || null,
        serviceCategory: serviceCategory || null,
        subService: subService || null
      },
      data: sanitizedTechnicians
    });
    
  } catch (error) {
    console.error('Error in getAllPublicProfiles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

/**
 * Get technicians by main category (Level 1)
 * @route   GET /api/technician/public/category/:mainCategory
 * @access  Public
 */
exports.getTechniciansByCategory = async (req, res) => {
  try {
    const { mainCategory } = req.params; // UPDATED: Changed from category to mainCategory
    const { limit = 20 } = req.query;
    
    const technicians = await Technician.find({
      mainCategory: decodeURIComponent(mainCategory), // UPDATED: Use mainCategory
      isActive: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    })
      .populate('userId', 'firstName lastName profileImage')
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1 }); // Sort by highest rated first
    
    res.json({
      success: true,
      count: technicians.length,
      data: technicians
    });
    
  } catch (error) {
    console.error('Error in getTechniciansByCategory:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Get technicians by service category (Level 2)
 * @route   GET /api/technician/public/service-category/:serviceCategory
 * @access  Public
 */
exports.getTechniciansByServiceCategory = async (req, res) => {
  try {
    const { serviceCategory } = req.params;
    const { limit = 20 } = req.query;
    
    const technicians = await Technician.find({
      'serviceCategories.categoryName': decodeURIComponent(serviceCategory),
      isActive: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    })
      .populate('userId', 'firstName lastName profileImage')
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1 });
    
    res.json({
      success: true,
      count: technicians.length,
      data: technicians
    });
    
  } catch (error) {
    console.error('Error in getTechniciansByServiceCategory:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Get technicians by sub-service (Level 3)
 * @route   GET /api/technician/public/sub-service/:subService
 * @access  Public
 */
exports.getTechniciansBySubService = async (req, res) => {
  try {
    const { subService } = req.params;
    const { limit = 20 } = req.query;
    
    const technicians = await Technician.find({
      'serviceCategories.subServices': decodeURIComponent(subService),
      isActive: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    })
      .populate('userId', 'firstName lastName profileImage')
      .limit(parseInt(limit))
      .sort({ 'rating.average': -1 });
    
    res.json({
      success: true,
      count: technicians.length,
      data: technicians
    });
    
  } catch (error) {
    console.error('Error in getTechniciansBySubService:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Get technician statistics summary
 * @route   GET /api/technician/public/stats/summary
 * @access  Public
 */
exports.getTechnicianStats = async (req, res) => {
  try {
    const stats = await Technician.aggregate([
      {
        $match: {
          isActive: true,
          verificationStatus: { $in: ['verified', 'pending'] }
        }
      },
      {
        $group: {
          _id: '$mainCategory', // UPDATED: Use mainCategory instead of category
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.average' },
          avgHourlyRate: { $avg: '$pricing.hourlyRate' },
          // UPDATED: Get unique service categories
          serviceCategories: { $addToSet: '$serviceCategories.categoryName' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get total count of active technicians
    const totalTechnicians = await Technician.countDocuments({
      isActive: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    });
    
    // Get unique service categories across all technicians
    const allServiceCategories = await Technician.distinct('serviceCategories.categoryName', {
      isActive: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    });
    
    // Get unique sub-services across all technicians
    const allSubServices = await Technician.aggregate([
      {
        $match: {
          isActive: true,
          verificationStatus: { $in: ['verified', 'pending'] }
        }
      },
      {
        $unwind: '$serviceCategories'
      },
      {
        $unwind: '$serviceCategories.subServices'
      },
      {
        $group: {
          _id: '$serviceCategories.subServices'
        }
      }
    ]).then(results => results.map(r => r._id));
    
    res.json({
      success: true,
      totalTechnicians,
      // UPDATED: Include more statistics
      categories: stats.map(stat => ({
        mainCategory: stat._id,
        count: stat.count,
        avgRating: Math.round(stat.avgRating * 10) / 10 || 0,
        avgHourlyRate: Math.round(stat.avgHourlyRate) || 0,
        serviceCategories: stat.serviceCategories || []
      })),
      serviceCategories: allServiceCategories,
      subServices: allSubServices,
      lastUpdated: new Date()
    });
    
  } catch (error) {
    console.error('Error in getTechnicianStats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};