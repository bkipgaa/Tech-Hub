// Import the Technician model to interact with the technician collection
const Technician = require('../../models/Technician');

/**
 * Get availability settings for the technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with availability data
 */
exports.getAvailability = async (req, res) => {
  try {
    // Find technician and select availability-related fields
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('availability emergencyAvailable remoteServiceAvailable weekendAvailable isAvailable');
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with availability data
    res.json({
      success: true,
      availability: {
        schedule: technician.availability,
        emergencyAvailable: technician.emergencyAvailable,
        remoteServiceAvailable: technician.remoteServiceAvailable,
        weekendAvailable: technician.weekendAvailable,
        isAvailable: technician.isAvailable
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get availability error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update weekly schedule
 * @param {Object} req - Express request object with availability schedule
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated schedule
 */
exports.updateSchedule = async (req, res) => {
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
    
    // Update the entire availability object with provided data
    // This includes all days of the week with their enabled status and hours
    technician.availability = req.body.availability || technician.availability;
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated schedule
    res.json({
      success: true,
      message: 'Schedule updated successfully',
      availability: technician.availability
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update schedule error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update a specific day's availability
 * @param {Object} req - Express request object with day and schedule data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated day schedule
 */
exports.updateDaySchedule = async (req, res) => {
  try {
    // Extract day from request parameters (monday, tuesday, etc.)
    const { day } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Validate that the day exists in the availability object
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day specified'
      });
    }
    
    // Update the specific day's availability
    // enabled: whether technician works this day
    // hours: array of time slots [{ start: '09:00', end: '17:00' }]
    technician.availability[day] = {
      enabled: req.body.enabled || false,
      hours: req.body.hours || []
    };
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated day schedule
    res.json({
      success: true,
      message: `${day} schedule updated successfully`,
      day: {
        [day]: technician.availability[day]
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update day schedule error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add a time slot to a specific day
 * @param {Object} req - Express request object with day and time slot
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated hours
 */
exports.addTimeSlot = async (req, res) => {
  try {
    // Extract day from request parameters
    const { day } = req.params;
    // Extract start and end times from request body
    const { start, end } = req.body;
    
    // Validate that start and end times were provided
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end times are required'
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
    
    // Validate that the day exists
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day specified'
      });
    }
    
    // Make sure the day is enabled before adding time slots
    if (!technician.availability[day].enabled) {
      technician.availability[day].enabled = true;
    }
    
    // Initialize hours array if it doesn't exist
    if (!technician.availability[day].hours) {
      technician.availability[day].hours = [];
    }
    
    // Add the new time slot
    technician.availability[day].hours.push({ start, end });
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated hours
    res.status(201).json({
      success: true,
      message: 'Time slot added successfully',
      hours: technician.availability[day].hours
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add time slot error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove a time slot from a specific day
 * @param {Object} req - Express request object with day and slot index
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated hours
 */
exports.removeTimeSlot = async (req, res) => {
  try {
    // Extract day and slotIndex from request parameters
    const { day, slotIndex } = req.params;
    
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Validate that the day exists
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day specified'
      });
    }
    
    // Check if the day has hours array and the index is valid
    if (!technician.availability[day].hours || slotIndex < 0 || slotIndex >= technician.availability[day].hours.length) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }
    
    // Remove the time slot at the specified index
    technician.availability[day].hours.splice(slotIndex, 1);
    
    // If no hours left, optionally disable the day
    if (technician.availability[day].hours.length === 0) {
      technician.availability[day].enabled = false;
    }
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated hours
    res.json({
      success: true,
      message: 'Time slot removed successfully',
      hours: technician.availability[day].hours
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove time slot error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update availability toggles (emergency, remote, weekend)
 * @param {Object} req - Express request object with toggle values
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated toggles
 */
exports.updateAvailabilityToggles = async (req, res) => {
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
    
    // Update availability toggle fields if provided
    if (req.body.emergencyAvailable !== undefined) {
      technician.emergencyAvailable = req.body.emergencyAvailable;
    }
    
    if (req.body.remoteServiceAvailable !== undefined) {
      technician.remoteServiceAvailable = req.body.remoteServiceAvailable;
    }
    
    if (req.body.weekendAvailable !== undefined) {
      technician.weekendAvailable = req.body.weekendAvailable;
    }
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated toggles
    res.json({
      success: true,
      message: 'Availability toggles updated successfully',
      toggles: {
        emergencyAvailable: technician.emergencyAvailable,
        remoteServiceAvailable: technician.remoteServiceAvailable,
        weekendAvailable: technician.weekendAvailable
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update availability toggles error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Toggle overall availability status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated availability status
 */
exports.toggleAvailability = async (req, res) => {
  try {
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician profile not found' 
      });
    }
    
    // Toggle the isAvailable boolean (true becomes false, false becomes true)
    technician.isAvailable = !technician.isAvailable;
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with new availability status
    res.json({
      success: true,
      message: `You are now ${technician.isAvailable ? 'available' : 'unavailable'} for new jobs`,
      isAvailable: technician.isAvailable
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Toggle availability error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Check if technician is available at a specific date and time
 * @param {Object} req - Express request object with date and time
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with availability check result
 */
exports.checkAvailability = async (req, res) => {
  try {
    // Extract date and time from query parameters
    const { date, time } = req.query;
    
    // Validate that date and time were provided
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
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
    
    // Check if technician is overall available
    if (!technician.isAvailable) {
      return res.json({
        success: true,
        isAvailable: false,
        message: 'You are currently marked as unavailable'
      });
    }
    
    // Parse the date to get day of week
    const dateObj = new Date(date);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[dateObj.getDay()]; // Get day name from date
    
    // Get the schedule for that day
    const daySchedule = technician.availability[dayOfWeek];
    
    // Check if the day is enabled
    if (!daySchedule || !daySchedule.enabled) {
      return res.json({
        success: true,
        isAvailable: false,
        message: `You are not available on ${dayOfWeek}s`
      });
    }
    
    // Check if the time falls within any time slot
    const timeString = time; // Format: "HH:MM"
    let isTimeAvailable = false;
    
    for (const slot of daySchedule.hours) {
      // Compare times as strings (works with HH:MM format)
      if (timeString >= slot.start && timeString <= slot.end) {
        isTimeAvailable = true;
        break;
      }
    }
    
    // Return the result
    res.json({
      success: true,
      isAvailable: isTimeAvailable,
      day: dayOfWeek,
      message: isTimeAvailable ? 'You are available at this time' : 'You are not available at this time'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Check availability error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};