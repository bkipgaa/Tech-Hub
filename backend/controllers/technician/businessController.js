// Import the Technician model to interact with the technician collection
const Technician = require('../../models/Technician');

/**
 * Get business information for the technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with business data
 */
exports.getBusinessInfo = async (req, res) => {
  try {
    // Find technician and select business-related fields
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('businessName businessRegistrationNumber insuranceInfo socialLinks');
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with business information
    res.json({
      success: true,
      business: {
        businessName: technician.businessName,
        businessRegistrationNumber: technician.businessRegistrationNumber,
        insuranceInfo: technician.insuranceInfo,
        socialLinks: technician.socialLinks
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get business info error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update business information
 * @param {Object} req - Express request object with business data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated business info
 */
exports.updateBusinessInfo = async (req, res) => {
  try {
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Update business name if provided
    if (req.body.businessName !== undefined) {
      technician.businessName = req.body.businessName;
    }
    
    // Update business registration number if provided
    if (req.body.businessRegistrationNumber !== undefined) {
      technician.businessRegistrationNumber = req.body.businessRegistrationNumber;
    }
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated business info
    res.json({
      success: true,
      message: 'Business information updated successfully',
      business: {
        businessName: technician.businessName,
        businessRegistrationNumber: technician.businessRegistrationNumber
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update business info error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update insurance information
 * @param {Object} req - Express request object with insurance data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated insurance info
 */
exports.updateInsuranceInfo = async (req, res) => {
  try {
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Update insurance information by merging with existing data
    technician.insuranceInfo = {
      ...technician.insuranceInfo,  // Keep existing fields
      ...req.body                    // Override with new values
    };
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated insurance info
    res.json({
      success: true,
      message: 'Insurance information updated successfully',
      insuranceInfo: technician.insuranceInfo
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update insurance info error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update social media links
 * @param {Object} req - Express request object with social links
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated social links
 */
exports.updateSocialLinks = async (req, res) => {
  try {
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Update social links by merging with existing data
    technician.socialLinks = {
      ...technician.socialLinks,  // Keep existing links
      ...req.body                  // Override with new values
    };
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated social links
    res.json({
      success: true,
      message: 'Social links updated successfully',
      socialLinks: technician.socialLinks
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update social links error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add a specific social media link
 * @param {Object} req - Express request object with platform and url
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated social links
 */
exports.addSocialLink = async (req, res) => {
  try {
    // Extract platform and url from request body
    const { platform, url } = req.body;
    
    // Validate that platform and url were provided
    if (!platform || !url) {
      return res.status(400).json({
        success: false,
        message: 'Platform and URL are required'
      });
    }
    
    // Define valid platforms
    const validPlatforms = ['website', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'];
    
    // Validate platform
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be one of: ' + validPlatforms.join(', ')
      });
    }
    
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Add/update the specific social link
    technician.socialLinks[platform] = url;
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated social links
    res.status(201).json({
      success: true,
      message: `${platform} link added successfully`,
      socialLinks: technician.socialLinks
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add social link error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove a specific social media link
 * @param {Object} req - Express request object with platform
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated social links
 */
exports.removeSocialLink = async (req, res) => {
  try {
    // Extract platform from request parameters
    const { platform } = req.params;
    
    // Define valid platforms
    const validPlatforms = ['website', 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'];
    
    // Validate platform
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }
    
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Remove the social link by setting it to empty string or undefined
    technician.socialLinks[platform] = '';
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated social links
    res.json({
      success: true,
      message: `${platform} link removed successfully`,
      socialLinks: technician.socialLinks
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove social link error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};