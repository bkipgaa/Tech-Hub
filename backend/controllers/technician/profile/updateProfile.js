/**
 * updateProfile.js
 * =================
 * Update technician profile (generic update)
 * Updated for three-level service hierarchy, multiple main categories,
 * AND Cloudinary media cleanup on profile/portfolio changes
 * 
 * @version 3.2.0
 */

const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');
const { deleteFromCloudinary } = require('../../../utils/cloudinaryHelpers');

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
      let categories = req.body.mainCategories;
      if (!Array.isArray(categories)) {
        categories = [categories];
      }
      technician.mainCategories = [...new Set(categories.filter(cat => cat && cat.trim() !== ''))];
  // Set primary category to first one
  technician.mainCategory = technician.mainCategories[0] || '';
  delete req.body.mainCategories;
}

    // ============================================================
    // 2. HANDLE SINGLE MAIN CATEGORY (backward compatibility)
    // ============================================================
    if (req.body.mainCategory !== undefined) {
      technician.mainCategory = req.body.mainCategory;
      delete req.body.mainCategory;
    }
    if (req.body.category !== undefined) {
      technician.mainCategory = req.body.category;
      delete req.body.category;
    }

    // ============================================================
    // 3. VALIDATE & HANDLE SERVICE CATEGORIES
    // ============================================================
    if (req.body.serviceCategories !== undefined) {
      const serviceCategories = req.body.serviceCategories;
      
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

      const primaryMainCategory = technician.mainCategory || (technician.mainCategories && technician.mainCategories[0]) || '';
      
      const updatedServiceCategories = serviceCategories.map(cat => ({
        ...cat,
        mainCategory: cat.mainCategory || primaryMainCategory
      }));

      technician.serviceCategories = updatedServiceCategories;
      delete req.body.serviceCategories;
    }

    // ============================================================
    // 4. CLOUDINARY CLEANUP — Profile Image
    // ============================================================
    if (req.body.profileImage !== undefined && technician.profileImage) {
      // If a new image URL is provided and it's different from the old one
      const oldImage = technician.profileImage;
      const newImage = req.body.profileImage;
      
      if (oldImage !== newImage && oldImage.includes('cloudinary.com')) {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v1234567890/folder/public_id.jpg
        const publicIdMatch = oldImage.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
        if (publicIdMatch) {
          await deleteFromCloudinary(publicIdMatch[1]);
        }
      }
    }

    // ============================================================
    // 5. CLOUDINARY CLEANUP — Portfolio Items
    // ============================================================
    if (req.body.portfolio !== undefined) {
      const oldPortfolio = technician.portfolio || [];
      const newPortfolio = req.body.portfolio || [];

      // Find items that were removed (exist in old but not in new)
      const removedItems = oldPortfolio.filter(oldItem => 
        !newPortfolio.some(newItem => 
          (newItem.publicId && newItem.publicId === oldItem.publicId) ||
          (newItem.mediaUrl === oldItem.mediaUrl)
        )
      );

      // Delete removed items from Cloudinary
      for (const item of removedItems) {
        if (item.publicId) {
          await deleteFromCloudinary(item.publicId);
        } else if (item.mediaUrl && item.mediaUrl.includes('cloudinary.com')) {
          // Fallback: extract public_id from URL if publicId field is missing
          const publicIdMatch = item.mediaUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
          if (publicIdMatch) {
            await deleteFromCloudinary(publicIdMatch[1]);
          }
        }
      }

      // Keep gallery array in sync with portfolio media URLs
      req.body.gallery = newPortfolio.map(p => p.mediaUrl).filter(Boolean);
    }

    // ============================================================
    // 6. MERGE REMAINING FIELDS
    // ============================================================
    Object.assign(technician, req.body);
    technician.lastActive = new Date();

    // ============================================================
    // 7. UPDATE COMPLETION STATS & SAVE
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