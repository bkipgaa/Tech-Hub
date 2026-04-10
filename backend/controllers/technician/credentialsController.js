// Import the Technician model to interact with the technician collection
const Technician = require('../../models/Technician');

/**
 * ====================================
 * EDUCATION ENDPOINTS
 * ====================================
 */

/**
 * Get all education entries for the technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with education array
 */
exports.getEducation = async (req, res) => {
  try {
    // Find technician and select only the education field
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('education');  // Only retrieve education array from database
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with education entries
    res.json({
      success: true,
      education: technician.education
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get education error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add a new education entry
 * @param {Object} req - Express request object with education data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with added education entry
 */
exports.addEducation = async (req, res) => {
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
    
    // Construct new education object from request body
    const educationItem = {
      institution: req.body.institution,        // School/university name
      degree: req.body.degree,                  // Degree/certificate obtained
      fieldOfStudy: req.body.fieldOfStudy,      // Major/specialization
      startDate: req.body.startDate,            // When education started
      endDate: req.body.endDate,                // When education ended (if not current)
      isCurrent: req.body.isCurrent || false,   // Whether currently studying
      description: req.body.description,        // Additional details about education
      grade: req.body.grade                      // Grades achieved (if applicable)
    };
    
    // Validate required fields
    if (!educationItem.institution || !educationItem.degree) {
      return res.status(400).json({
        success: false,
        message: 'Institution and degree are required'
      });
    }
    
    // Add the new education entry to the education array
    technician.education.push(educationItem);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with the newly added education entry
    res.status(201).json({
      success: true,
      message: 'Education added successfully',
      // Get the last item in the array (the one we just added)
      education: technician.education[technician.education.length - 1]
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add education error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update an existing education entry
 * @param {Object} req - Express request object with eduId and updated data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated education entry
 */
exports.updateEducation = async (req, res) => {
  try {
    // Extract education ID from request parameters
    const { eduId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific education entry by its ID in the array
    // The .id() method is provided by Mongoose for subdocument arrays
    const education = technician.education.id(eduId);
    // If education entry not found, return 404 error
    if (!education) {
      return res.status(404).json({ 
        success: false,
        message: 'Education entry not found' 
      });
    }
    
    // Define which fields can be updated through this endpoint
    const updateableFields = ['institution', 'degree', 'fieldOfStudy', 
                             'startDate', 'endDate', 'isCurrent', 
                             'description', 'grade'];
    
    // Loop through each updateable field
    updateableFields.forEach(field => {
      // If the field is provided in the request body, update it
      if (req.body[field] !== undefined) {
        education[field] = req.body[field];
      }
    });
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated education entry
    res.json({
      success: true,
      message: 'Education updated successfully',
      education
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update education error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove an education entry
 * @param {Object} req - Express request object with eduId
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 */
exports.removeEducation = async (req, res) => {
  try {
    // Extract education ID from request parameters
    const { eduId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific education entry by its ID
    const education = technician.education.id(eduId);
    // If education entry not found, return 404 error
    if (!education) {
      return res.status(404).json({ 
        success: false,
        message: 'Education entry not found' 
      });
    }
    
    // Remove the education entry from the array
    // The .remove() method is provided by Mongoose for subdocuments
    education.remove();
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response
    res.json({
      success: true,
      message: 'Education removed successfully'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove education error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * ====================================
 * CERTIFICATIONS ENDPOINTS
 * ====================================
 */

/**
 * Get all certifications for the technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with certifications array
 */
exports.getCertifications = async (req, res) => {
  try {
    // Find technician and select only the certifications field
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('certifications');  // Only retrieve certifications array from database
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with certifications
    res.json({
      success: true,
      certifications: technician.certifications
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get certifications error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add a new certification
 * @param {Object} req - Express request object with certification data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with added certification
 */
exports.addCertification = async (req, res) => {
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
    
    // Construct new certification object from request body
    const certification = {
      name: req.body.name,                          // Certification name
      issuingOrganization: req.body.issuingOrganization, // Organization that issued it
      issueDate: req.body.issueDate,                 // Date issued
      expiryDate: req.body.expiryDate,                // Expiration date (if applicable)
      credentialId: req.body.credentialId,            // Certificate ID number
      credentialUrl: req.body.credentialUrl,          // URL to verify certificate
      doesNotExpire: req.body.doesNotExpire || false  // Whether it never expires
    };
    
    // Validate required fields
    if (!certification.name || !certification.issuingOrganization) {
      return res.status(400).json({
        success: false,
        message: 'Name and issuing organization are required'
      });
    }
    
    // Add the new certification to the certifications array
    technician.certifications.push(certification);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with the newly added certification
    res.status(201).json({
      success: true,
      message: 'Certification added successfully',
      // Get the last item in the array (the one we just added)
      certification: technician.certifications[technician.certifications.length - 1]
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add certification error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update an existing certification
 * @param {Object} req - Express request object with certId and updated data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated certification
 */
exports.updateCertification = async (req, res) => {
  try {
    // Extract certification ID from request parameters
    const { certId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific certification by its ID in the array
    const certification = technician.certifications.id(certId);
    // If certification not found, return 404 error
    if (!certification) {
      return res.status(404).json({ 
        success: false,
        message: 'Certification not found' 
      });
    }
    
    // Define which fields can be updated
    const updateableFields = ['name', 'issuingOrganization', 'issueDate', 
                             'expiryDate', 'credentialId', 'credentialUrl', 
                             'doesNotExpire'];
    
    // Loop through each updateable field
    updateableFields.forEach(field => {
      // If the field is provided in the request body, update it
      if (req.body[field] !== undefined) {
        certification[field] = req.body[field];
      }
    });
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated certification
    res.json({
      success: true,
      message: 'Certification updated successfully',
      certification
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update certification error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove a certification
 * @param {Object} req - Express request object with certId
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 */
exports.removeCertification = async (req, res) => {
  try {
    // Extract certification ID from request parameters
    const { certId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific certification by its ID
    const certification = technician.certifications.id(certId);
    // If certification not found, return 404 error
    if (!certification) {
      return res.status(404).json({ 
        success: false,
        message: 'Certification not found' 
      });
    }
    
    // Remove the certification from the array
    certification.remove();
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response
    res.json({
      success: true,
      message: 'Certification removed successfully'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove certification error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * ====================================
 * WORK EXPERIENCE ENDPOINTS
 * ====================================
 */

/**
 * Get all work experience entries for the technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with experience array
 */
exports.getExperience = async (req, res) => {
  try {
    // Find technician and select only the experience field
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('experience');  // Only retrieve experience array from database
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with experience entries
    res.json({
      success: true,
      experience: technician.experience
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get experience error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add a new work experience entry
 * @param {Object} req - Express request object with experience data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with added experience entry
 */
exports.addExperience = async (req, res) => {
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
    
    // Construct new experience object from request body
    const experienceItem = {
      title: req.body.title,              // Job title/position
      company: req.body.company,           // Company/employer name
      location: req.body.location,         // Work location
      startDate: req.body.startDate,       // When job started
      endDate: req.body.endDate,           // When job ended (if not current)
      isCurrent: req.body.isCurrent || false, // Whether currently working here
      description: req.body.description,    // Job description/responsibilities
      achievements: req.body.achievements || [] // Array of achievements
    };
    
    // Validate required fields
    if (!experienceItem.title || !experienceItem.company) {
      return res.status(400).json({
        success: false,
        message: 'Title and company are required'
      });
    }
    
    // Add the new experience to the experience array
    technician.experience.push(experienceItem);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with the newly added experience
    res.status(201).json({
      success: true,
      message: 'Experience added successfully',
      experience: technician.experience[technician.experience.length - 1]
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add experience error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update an existing work experience entry
 * @param {Object} req - Express request object with expId and updated data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated experience entry
 */
exports.updateExperience = async (req, res) => {
  try {
    // Extract experience ID from request parameters
    const { expId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific experience entry by its ID
    const experience = technician.experience.id(expId);
    // If experience not found, return 404 error
    if (!experience) {
      return res.status(404).json({ 
        success: false,
        message: 'Experience entry not found' 
      });
    }
    
    // Define which fields can be updated
    const updateableFields = ['title', 'company', 'location', 'startDate', 
                             'endDate', 'isCurrent', 'description', 'achievements'];
    
    // Loop through each updateable field
    updateableFields.forEach(field => {
      // If the field is provided in the request body, update it
      if (req.body[field] !== undefined) {
        experience[field] = req.body[field];
      }
    });
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated experience
    res.json({
      success: true,
      message: 'Experience updated successfully',
      experience
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update experience error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove a work experience entry
 * @param {Object} req - Express request object with expId
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 */
exports.removeExperience = async (req, res) => {
  try {
    // Extract experience ID from request parameters
    const { expId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific experience entry by its ID
    const experience = technician.experience.id(expId);
    // If experience not found, return 404 error
    if (!experience) {
      return res.status(404).json({ 
        success: false,
        message: 'Experience entry not found' 
      });
    }
    
    // Remove the experience entry from the array
    experience.remove();
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response
    res.json({
      success: true,
      message: 'Experience removed successfully'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove experience error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add an achievement to a work experience entry
 * @param {Object} req - Express request object with expId and achievement
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated achievements
 */
exports.addAchievement = async (req, res) => {
  try {
    // Extract experience ID from request parameters
    const { expId } = req.params;
    // Extract achievement text from request body
    const { achievement } = req.body;
    
    // Validate that achievement was provided
    if (!achievement) {
      return res.status(400).json({
        success: false,
        message: 'Achievement text is required'
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
    
    // Find the specific experience entry by its ID
    const experience = technician.experience.id(expId);
    // If experience not found, return 404 error
    if (!experience) {
      return res.status(404).json({ 
        success: false,
        message: 'Experience entry not found' 
      });
    }
    
    // Initialize achievements array if it doesn't exist
    if (!experience.achievements) {
      experience.achievements = [];
    }
    
    // Add the new achievement
    experience.achievements.push(achievement);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated achievements
    res.status(201).json({
      success: true,
      message: 'Achievement added successfully',
      achievements: experience.achievements
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add achievement error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove an achievement from a work experience entry
 * @param {Object} req - Express request object with expId and achievement index
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated achievements
 */
exports.removeAchievement = async (req, res) => {
  try {
    // Extract experience ID and achievement index from request parameters
    const { expId, achievementIndex } = req.params;
    
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific experience entry by its ID
    const experience = technician.experience.id(expId);
    // If experience not found, return 404 error
    if (!experience) {
      return res.status(404).json({ 
        success: false,
        message: 'Experience entry not found' 
      });
    }
    
    // Validate that achievements array exists and index is valid
    if (!experience.achievements || achievementIndex < 0 || achievementIndex >= experience.achievements.length) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }
    
    // Remove the achievement at the specified index
    experience.achievements.splice(achievementIndex, 1);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated achievements
    res.json({
      success: true,
      message: 'Achievement removed successfully',
      achievements: experience.achievements
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove achievement error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update years of experience
 * @param {Object} req - Express request object with yearsOfExperience
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated years
 */
exports.updateYearsOfExperience = async (req, res) => {
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
    
    // Update years of experience
    technician.yearsOfExperience = req.body.yearsOfExperience || 0;
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response
    res.json({
      success: true,
      message: 'Years of experience updated successfully',
      yearsOfExperience: technician.yearsOfExperience
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update years of experience error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};