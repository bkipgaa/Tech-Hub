/**
 * Public Controller for Technician Profiles
 * ==========================================
 * Handles public-facing technician profile requests
 * No authentication required - for clients viewing technician profiles
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
        category: technician.category,
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
      category, 
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
    
    // Apply optional filters
    if (category) {
      filter.category = category;
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
      .lean(); // Use lean() for better performance with read-only data
    
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
        category: tech.category,
        serviceCategories: tech.serviceCategories,
        pricing: tech.pricing,
        yearsOfExperience: tech.yearsOfExperience,
        portfolio: tech.portfolio?.slice(0, 3), // Only first 3 portfolio items
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
 * Get technicians by category
 * @route   GET /api/technician/public/category/:category
 * @access  Public
 */
exports.getTechniciansByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;
    
    const technicians = await Technician.find({
      category: decodeURIComponent(category),
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
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.average' },
          avgHourlyRate: { $avg: '$pricing.hourlyRate' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const totalTechnicians = await Technician.countDocuments({
      isActive: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    });
    
    res.json({
      success: true,
      totalTechnicians,
      categories: stats,
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