// Import the Technician model to interact with the technician collection in MongoDB
const Technician = require('../../models/Technician');
// Import the User model to interact with the user collection in MongoDB
const User = require('../../models/User');

/**
 * Helper function to calculate profile completion percentage
 * @param {Object} technician - The technician document from MongoDB
 * @returns {number} - Percentage of profile completion (0-100)
 */
const calculateProfileCompletion = (technician) => {
  // Initialize counter for completed fields
  let completed = 0;
  // Total number of major sections that contribute to profile completion
  const totalFields = 15;
  
  // Check each field and increment counter if it exists and has content
  // Check if aboutMe has any text content
  if (technician.aboutMe) completed++;
  // Check if profileHeadline has any text content
  if (technician.profileHeadline) completed++;
  // Check if skills array exists and has at least one item
  if (technician.skills?.length > 0) completed++;
  // Check if serviceCategories array exists and has at least one item
  if (technician.serviceCategories?.length > 0) completed++;
  // Check if hourlyRate is greater than 0 (meaning pricing is set)
  if (technician.pricing?.hourlyRate > 0) completed++;
  // Check if education array exists and has at least one item
  if (technician.education?.length > 0) completed++;
  // Check if certifications array exists and has at least one item
  if (technician.certifications?.length > 0) completed++;
  // Check if yearsOfExperience is greater than 0
  if (technician.yearsOfExperience > 0) completed++;
  // Check if experience array exists and has at least one item
  if (technician.experience?.length > 0) completed++;
  // Check if portfolio array exists and has at least one item
  if (technician.portfolio?.length > 0) completed++;
  // Check if city field in address has a value
  if (technician.address?.city) completed++;
  // Check if languages array exists and has at least one item
  if (technician.languages?.length > 0) completed++;
  // Check if businessName has a value
  if (technician.businessName) completed++;
  // Check if availability object exists (has any value)
  if (technician.availability) completed++;
  
  // Calculate percentage: (completed fields / total fields) * 100, rounded to nearest integer
  return Math.round((completed / totalFields) * 100);
};

/**
 * Create a new technician profile
 * @param {Object} req - Express request object containing user data and profile info
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success status and created profile
 */
exports.createProfile = async (req, res) => {
  try {
    // Log the user ID for debugging purposes
    console.log('Creating technician profile for user:', req.user.userId);
    
    // Find the user in database using the userId from the authenticated request
    const user = await User.findById(req.user.userId);
    // If user doesn't exist, return 404 error
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Check if the user has the 'technician' role
    if (user.role !== 'technician') {
      return res.status(403).json({ 
        success: false,
        message: 'Please become a technician first' 
      });
    }
    
    // Check if a profile already exists for this user
    const existingProfile = await Technician.findOne({ userId: req.user.userId });
    // If profile exists, return 400 error
    if (existingProfile) {
      return res.status(400).json({ 
        success: false,
        message: 'Profile already exists' 
      });
    }
    
    // Prepare the technician data object with all fields from the request body
    const technicianData = {
      // Link to the user document
      userId: req.user.userId,
      
      // Basic Info - use empty string as default if not provided
      aboutMe: req.body.aboutMe || '',
      profileHeadline: req.body.profileHeadline || '',
      
      // Skills - use empty array as default
      skills: req.body.skills || [],
      
      // Services - category is required, will be validated later
      category: req.body.category,
      serviceCategories: req.body.serviceCategories || [],
      
      // Pricing - set defaults for all pricing fields
      pricing: {
        hourlyRate: req.body.pricing?.hourlyRate || 0,  // Optional chaining to safely access nested properties
        fixedPrice: req.body.pricing?.fixedPrice || 0,
        consultationFee: req.body.pricing?.consultationFee || 0,
        currency: req.body.pricing?.currency || 'KES',  // Default currency is Kenyan Shilling
        paymentMethods: req.body.pricing?.paymentMethods || ['Cash', 'M-Pesa']  // Default payment methods
      },
      
      // Education - use empty array as default
      education: req.body.education || [],
      
      // Certifications - use empty array as default
      certifications: req.body.certifications || [],
      
      // Experience - set years and experience array
      yearsOfExperience: req.body.yearsOfExperience || 0,
      experience: req.body.experience || [],
      
      // Portfolio - use empty array as default
      portfolio: req.body.portfolio || [],
      
      // Location - build address object with defaults
      address: {
        street: req.body.address?.street || '',
        city: req.body.address?.city || '',
        state: req.body.address?.state || '',
        zipCode: req.body.address?.zipCode || '',
        country: req.body.address?.country || 'Kenya'  // Default country
      },
      // GeoJSON location for spatial queries
      location: {
        type: 'Point',  // GeoJSON type
        coordinates: req.body.location?.coordinates || [0, 0],  // [longitude, latitude]
        formattedAddress: req.body.location?.formattedAddress || '',
        placeId: req.body.location?.placeId || ''
      },
      // Service radius in kilometers
      serviceRadius: req.body.serviceRadius || 10,
      
      // Languages - default to English fluent if not provided
      languages: req.body.languages || [{ name: 'English', proficiency: 'Fluent' }],
      
      // Availability - set default weekly schedule
      availability: req.body.availability || {
        monday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        tuesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        wednesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        thursday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        friday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
        saturday: { enabled: false, hours: [] },
        sunday: { enabled: false, hours: [] }
      },
      // Service availability flags
      emergencyAvailable: req.body.emergencyAvailable || false,
      remoteServiceAvailable: req.body.remoteServiceAvailable || false,
      weekendAvailable: req.body.weekendAvailable || false,
      
      // Business Info
      businessName: req.body.businessName || '',
      businessRegistrationNumber: req.body.businessRegistrationNumber || '',
      
      // Social Links - use empty object as default
      socialLinks: req.body.socialLinks || {},
      
      // Settings - user preferences with sensible defaults
      settings: {
        showEmail: req.body.settings?.showEmail || false,  // Whether to show email on profile
        showPhone: req.body.settings?.showPhone !== undefined ? req.body.settings.showPhone : true,  // Default to showing phone
        instantBooking: req.body.settings?.instantBooking !== undefined ? req.body.settings.instantBooking : true,
        requiresApproval: req.body.settings?.requiresApproval || false,
        autoAcceptJobs: req.body.settings?.autoAcceptJobs || false,
        jobReminders: req.body.settings?.jobReminders !== undefined ? req.body.settings.jobReminders : true,
        // Notification preferences
        notifications: {
          email: req.body.settings?.notifications?.email !== undefined ? req.body.settings.notifications.email : true,
          sms: req.body.settings?.notifications?.sms !== undefined ? req.body.settings.notifications.sms : true,
          push: req.body.settings?.notifications?.push !== undefined ? req.body.settings.notifications.push : true
        }
      },
      
      // Status
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true,  // Default to available
      lastActive: new Date()  // Set current time as last active
    };
    
    // Validate required fields
    // Check if category was provided
    if (!technicianData.category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }
    
    // Check if city and state were provided
    if (!technicianData.address.city || !technicianData.address.state) {
      return res.status(400).json({
        success: false,
        message: 'City and state are required'
      });
    }
    
    // Create new Technician document with the prepared data
    const technician = new Technician(technicianData);
    // Save to database
    await technician.save();
    
    // Calculate profile completion percentage using helper function
    technician.profileCompletionPercentage = calculateProfileCompletion(technician);
    // Mark profile as complete if completion is 70% or higher
    technician.completedProfile = technician.profileCompletionPercentage >= 70;
    // Save the updated completion stats
    await technician.save();
    
    // Populate the userId field with actual user data (excluding sensitive info)
    await technician.populate('userId', 'email firstName lastName phone profileImage');
    
    // Return success response with created profile
    res.status(201).json({
      success: true,
      message: 'Technician profile created successfully',
      technician
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Create profile error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error during profile creation',
      error: error.message 
    });
  }
};

/**
 * Get the technician profile for the authenticated user
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with technician profile
 */
exports.getProfile = async (req, res) => {
  try {
    // Find technician by userId and populate user data
    const technician = await Technician.findOne({ userId: req.user.userId })
      .populate('userId', 'email firstName lastName phone profileImage');  // Only select specific fields
    
    // If no profile found, return 404
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with profile
    res.json({
      success: true,
      technician
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get profile error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

/**
 * Update basic profile information (aboutMe, profileHeadline, category)
 * @param {Object} req - Express request object with updated fields
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with update status
 */
exports.updateBasicInfo = async (req, res) => {
  try {
    // Find technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Define fields that can be updated through this endpoint
    const basicFields = ['aboutMe', 'profileHeadline', 'category'];
    // Loop through each field and update if provided in request body
    basicFields.forEach(field => {
      if (req.body[field] !== undefined) {
        technician[field] = req.body[field];  // Update the field
      }
    });
    
    // Update last active timestamp
    technician.lastActive = new Date();
    
    // Recalculate profile completion percentage
    technician.profileCompletionPercentage = calculateProfileCompletion(technician);
    // Update completed profile flag
    technician.completedProfile = technician.profileCompletionPercentage >= 70;
    
    // Save changes to database
    await technician.save();
    
    // Return success response with updated fields
    res.json({
      success: true,
      message: 'Basic information updated successfully',
      technician: {
        aboutMe: technician.aboutMe,
        profileHeadline: technician.profileHeadline,
        category: technician.category,
        profileCompletionPercentage: technician.profileCompletionPercentage
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update basic info error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error during update',
      error: error.message 
    });
  }
};

/**
 * Update skills array
 * @param {Object} req - Express request object with skills array
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated skills
 */
exports.updateSkills = async (req, res) => {
  try {
    // Find technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Update skills array with provided data (default to empty array)
    technician.skills = req.body.skills || [];
    // Update last active timestamp
    technician.lastActive = new Date();
    
    // Recalculate profile completion percentage
    technician.profileCompletionPercentage = calculateProfileCompletion(technician);
    // Update completed profile flag
    technician.completedProfile = technician.profileCompletionPercentage >= 70;
    
    // Save changes to database
    await technician.save();
    
    // Return success response with updated skills
    res.json({
      success: true,
      message: 'Skills updated successfully',
      skills: technician.skills
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update skills error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error during update',
      error: error.message 
    });
  }
};

/**
 * Update languages array with proficiency levels
 * @param {Object} req - Express request object with languages array
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated languages
 */
exports.updateLanguages = async (req, res) => {
  try {
    // Find technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Update languages array with provided data (default to empty array)
    technician.languages = req.body.languages || [];
    // Update last active timestamp
    technician.lastActive = new Date();
    
    // Recalculate profile completion percentage
    technician.profileCompletionPercentage = calculateProfileCompletion(technician);
    // Update completed profile flag
    technician.completedProfile = technician.profileCompletionPercentage >= 70;
    
    // Save changes to database
    await technician.save();
    
    // Return success response with updated languages
    res.json({
      success: true,
      message: 'Languages updated successfully',
      languages: technician.languages
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update languages error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error during update',
      error: error.message 
    });
  }
};

/**
 * Update location information (address, coordinates, service radius)
 * @param {Object} req - Express request object with location data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated location
 */
exports.updateLocation = async (req, res) => {
  try {
    // Find technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Update address fields if provided
    if (req.body.address) {
      // Merge existing address with new data (spread operator)
      technician.address = {
        ...technician.address,  // Keep existing fields
        ...req.body.address     // Override with new values
      };
    }
    
    // Update location coordinates if provided
    if (req.body.location) {
      // Merge existing location with new data
      technician.location = {
        ...technician.location,
        ...req.body.location
      };
    }
    
    // Update service radius if provided
    if (req.body.serviceRadius !== undefined) {
      technician.serviceRadius = req.body.serviceRadius;
    }
    
    // Update last active timestamp
    technician.lastActive = new Date();
    
    // Recalculate profile completion percentage
    technician.profileCompletionPercentage = calculateProfileCompletion(technician);
    // Update completed profile flag
    technician.completedProfile = technician.profileCompletionPercentage >= 70;
    
    // Save changes to database
    await technician.save();
    
    // Return success response with updated location data
    res.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        address: technician.address,
        coordinates: technician.location.coordinates,
        serviceRadius: technician.serviceRadius
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update location error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error during update',
      error: error.message 
    });
  }
};