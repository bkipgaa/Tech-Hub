// Import the Technician model to interact with the technician collection
const Technician = require('../../models/Technician');

/**
 * Get all settings for the technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with settings data
 */
exports.getSettings = async (req, res) => {
  try {
    // Find technician and select only the settings field
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('settings');  // Only retrieve settings from database
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with settings
    res.json({
      success: true,
      settings: technician.settings
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get settings error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update privacy settings (showEmail, showPhone)
 * @param {Object} req - Express request object with privacy settings
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated privacy settings
 */
exports.updatePrivacySettings = async (req, res) => {
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
    
    // Update showEmail if provided
    if (req.body.showEmail !== undefined) {
      technician.settings.showEmail = req.body.showEmail;
    }
    
    // Update showPhone if provided
    if (req.body.showPhone !== undefined) {
      technician.settings.showPhone = req.body.showPhone;
    }
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated privacy settings
    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      settings: {
        showEmail: technician.settings.showEmail,
        showPhone: technician.settings.showPhone
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update privacy settings error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update booking settings (instantBooking, requiresApproval, autoAcceptJobs)
 * @param {Object} req - Express request object with booking settings
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated booking settings
 */
exports.updateBookingSettings = async (req, res) => {
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
    
    // Update instantBooking if provided
    if (req.body.instantBooking !== undefined) {
      technician.settings.instantBooking = req.body.instantBooking;
    }
    
    // Update requiresApproval if provided
    if (req.body.requiresApproval !== undefined) {
      technician.settings.requiresApproval = req.body.requiresApproval;
    }
    
    // Update autoAcceptJobs if provided
    if (req.body.autoAcceptJobs !== undefined) {
      technician.settings.autoAcceptJobs = req.body.autoAcceptJobs;
    }
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated booking settings
    res.json({
      success: true,
      message: 'Booking settings updated successfully',
      settings: {
        instantBooking: technician.settings.instantBooking,
        requiresApproval: technician.settings.requiresApproval,
        autoAcceptJobs: technician.settings.autoAcceptJobs
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update booking settings error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update notification settings
 * @param {Object} req - Express request object with notification settings
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated notification settings
 */
exports.updateNotificationSettings = async (req, res) => {
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
    
    // Update email notification if provided
    if (req.body.email !== undefined) {
      technician.settings.notifications.email = req.body.email;
    }
    
    // Update SMS notification if provided
    if (req.body.sms !== undefined) {
      technician.settings.notifications.sms = req.body.sms;
    }
    
    // Update push notification if provided
    if (req.body.push !== undefined) {
      technician.settings.notifications.push = req.body.push;
    }
    
    // Update jobReminders if provided
    if (req.body.jobReminders !== undefined) {
      technician.settings.jobReminders = req.body.jobReminders;
    }
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated notification settings
    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: {
        notifications: technician.settings.notifications,
        jobReminders: technician.settings.jobReminders
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update notification settings error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update all settings at once
 * @param {Object} req - Express request object with all settings
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated settings
 */
exports.updateAllSettings = async (req, res) => {
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
    
    // Update settings by merging with existing data
    technician.settings = {
      ...technician.settings,  // Keep existing settings
      ...req.body               // Override with new values
    };
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated settings
    res.json({
      success: true,
      message: 'All settings updated successfully',
      settings: technician.settings
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update all settings error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Reset settings to default values
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with reset settings
 */
exports.resetSettings = async (req, res) => {
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
    
    // Reset settings to default values
    technician.settings = {
      showEmail: false,
      showPhone: true,
      instantBooking: true,
      requiresApproval: false,
      autoAcceptJobs: false,
      jobReminders: true,
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    };
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with reset settings
    res.json({
      success: true,
      message: 'Settings reset to default successfully',
      settings: technician.settings
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Reset settings error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};