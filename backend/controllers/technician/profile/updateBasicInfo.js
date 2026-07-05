/**
 * updateBasicInfo.js
 * ==================
 * Update technician basic information
 * Updated for three-level service hierarchy
 * 
 * @version 2.0.0
 */

const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');

exports.updateBasicInfo = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    // UPDATED: Replace 'category' with 'mainCategory'
    const fields = ['aboutMe', 'profileHeadline', 'mainCategory'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        technician[field] = req.body[field];
      }
    });

    // UPDATED: Also allow updating serviceCategories if provided
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
      technician.serviceCategories = req.body.serviceCategories;
    }

    await updateCompletionStats(technician);
    
    res.json({
      success: true,
      message: 'Basic information updated successfully',
      data: {
        aboutMe: technician.aboutMe,
        profileHeadline: technician.profileHeadline,
        mainCategory: technician.mainCategory,
        serviceCategories: technician.serviceCategories
      }
    });
  } catch (error) {
    console.error('Update basic info error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};