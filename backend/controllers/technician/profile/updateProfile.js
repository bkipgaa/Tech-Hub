/**
 * updateProfile.js
 * =================
 * Update technician profile (generic update)
 * Updated for three-level service hierarchy and multiple main categories
 * 
 * @version 3.0.0
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
    // 1. VALIDATE & HANDLE SERVICE CATEGORIES
    // ============================================================
    if (req.body.serviceCategories !== undefined) {
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

    // ============================================================
    // 2. HANDLE MAIN CATEGORY – multiple & single (backward compat)
    // ============================================================
    // NEW: mainCategories array (frontend sends this)
    if (req.body.mainCategories !== undefined) {
      // Ensure it's an array and remove duplicates/empty strings
      if (Array.isArray(req.body.mainCategories)) {
        technician.mainCategories = [...new Set(req.body.mainCategories.filter(cat => cat && cat.trim() !== ''))];
      } else {
        // If it's a string, convert to array (fallback)
        technician.mainCategories = [req.body.mainCategories];
      }
      // The pre‑save hook will automatically set mainCategory = mainCategories[0]
      delete req.body.mainCategories; // avoid double-assign via Object.assign
    }

    // OLD: single mainCategory (kept for backward compatibility)
    // If the frontend sends mainCategory, we store it, but the pre‑save hook will
    // override it if mainCategories is also present. To avoid conflict, we let the hook handle it.
    // However, if the frontend sends only mainCategory (old clients), we respect it.
    // We'll store it; the pre‑save hook will later sync if mainCategories exists.
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
    // 3. MERGE OTHER FIELDS
    // ============================================================
    // Remove the fields we already handled to avoid overriding
    delete req.body.serviceCategories; // handled above (but we might want to keep it if we want to merge)
    // Actually, we want to keep serviceCategories because we assign it manually below.
    // Let's NOT delete it, because we want to preserve the existing logic.
    // But we already validated it, so we can let Object.assign handle it.
    // However, we need to ensure that serviceCategories is properly assigned.
    // We'll handle serviceCategories separately below:

    if (req.body.serviceCategories !== undefined) {
      technician.serviceCategories = req.body.serviceCategories;
      delete req.body.serviceCategories;
    }

    // Now merge the rest of the fields
    Object.assign(technician, req.body);
    technician.lastActive = new Date();

    // ============================================================
    // 4. UPDATE COMPLETION STATS & SAVE
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