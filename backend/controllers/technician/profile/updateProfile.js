/**
 * updateProfile.js
 * =================
 * Update technician profile (generic update)
 * Updated for three-level service hierarchy and multiple main categories
 * 
 * @version 3.1.0
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

    // ============================================================
    // 1. HANDLE MAIN CATEGORIES (array)
    // ============================================================
    if (req.body.mainCategories !== undefined) {
      // Ensure it's an array and clean
      let categories = req.body.mainCategories;
      if (!Array.isArray(categories)) {
        categories = [categories];
      }
      // Remove duplicates and empty strings
      technician.mainCategories = [...new Set(categories.filter(cat => cat && cat.trim() !== ''))];
      // The pre‑save hook will set mainCategory = mainCategories[0] automatically
      delete req.body.mainCategories; // remove to avoid double-assign
    }

    // ============================================================
    // 2. HANDLE SINGLE MAIN CATEGORY (backward compatibility)
    // ============================================================
    if (req.body.mainCategory !== undefined) {
      technician.mainCategory = req.body.mainCategory;
      delete req.body.mainCategory;
    }
    // Migrate old 'category' field to mainCategory
    if (req.body.category !== undefined) {
      technician.mainCategory = req.body.category;
      delete req.body.category;
    }

    // ============================================================
    // 3. VALIDATE & HANDLE SERVICE CATEGORIES
    // ============================================================
    if (req.body.serviceCategories !== undefined) {
      const serviceCategories = req.body.serviceCategories;
      
      // Validate each category
      if (serviceCategories.length > 0) {
        for (const category of serviceCategories) {
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

      // Ensure each service category has a mainCategory set
      // If missing, use the technician's primary mainCategory (or first in array)
      const primaryMainCategory = technician.mainCategory || (technician.mainCategories && technician.mainCategories[0]) || '';
      
      const updatedServiceCategories = serviceCategories.map(cat => ({
        ...cat,
        // If mainCategory is missing, set it to the primary one
        mainCategory: cat.mainCategory || primaryMainCategory
      }));

      // Optional: Validate that each mainCategory exists in technician.mainCategories
      // (but we don't want to block updates if the mainCategories list is being updated simultaneously)
      // We'll just assign them
      technician.serviceCategories = updatedServiceCategories;
      
      // Remove from req.body to avoid Object.assign double-write
      delete req.body.serviceCategories;
    }

    // ============================================================
    // 4. MERGE REMAINING FIELDS
    // ============================================================
    // Now merge the rest of the fields (excluding those already handled)
    Object.assign(technician, req.body);
    technician.lastActive = new Date();

    // ============================================================
    // 5. UPDATE COMPLETION STATS & SAVE
    // ============================================================
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