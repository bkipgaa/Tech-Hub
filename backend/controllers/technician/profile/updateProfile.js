/**
 * updateProfile.js
 * =================
 * Update technician profile (generic update)
 * Updated for three-level service hierarchy
 * 
 * @version 2.0.0
 */

const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateProfile = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    // UPDATED: Handle serviceCategories with validation
    if (req.body.serviceCategories !== undefined) {
      // Validate each service category has sub-services
      if (req.body.serviceCategories.length > 0) {
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
      }
    }

    // UPDATED: Handle mainCategory rename
    if (req.body.mainCategory !== undefined) {
      technician.mainCategory = req.body.mainCategory;
      delete req.body.category; // Remove old field if present
    }
    if (req.body.category !== undefined) {
      // Migrate old category field to mainCategory
      technician.mainCategory = req.body.category;
      delete req.body.category;
    }

    // Merge the incoming data with existing profile
    Object.assign(technician, req.body);
    technician.lastActive = new Date();

    await updateCompletionStats(technician);
    await technician.save();
    await technician.populate('userId', 'email firstName lastName phone profileImage');

    res.json({ 
      success: true, 
      message: 'Profile updated successfully', 
      technician 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
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
      message: 'Server error', 
      error: error.message 
    });
  }
};