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