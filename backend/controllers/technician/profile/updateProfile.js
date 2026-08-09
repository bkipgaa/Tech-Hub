const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers');
const { deleteFromCloudinary } = require('../../../utils/cloudinaryHelpers');

exports.updateProfile = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // 1. MAIN CATEGORIES
    if (req.body.mainCategories !== undefined) {
      let categories = req.body.mainCategories;
      if (!Array.isArray(categories)) categories = [categories];
      technician.mainCategories = [...new Set(categories.filter(cat => cat && cat.trim() !== ''))];
      delete req.body.mainCategories;
    }

    // 2. SINGLE MAIN CATEGORY
    if (req.body.mainCategory !== undefined) {
      technician.mainCategory = req.body.mainCategory;
      delete req.body.mainCategory;
    }
    if (req.body.category !== undefined) {
      technician.mainCategory = req.body.category;
      delete req.body.category;
    }

    // 3. SERVICE CATEGORIES
    if (req.body.serviceCategories !== undefined) {
      const serviceCategories = req.body.serviceCategories;
      if (serviceCategories.length > 0) {
        for (const category of serviceCategories) {
          if (!category.categoryName) {
            return res.status(400).json({ success: false, message: 'Each service category must have a categoryName' });
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
      technician.serviceCategories = serviceCategories.map(cat => ({
        ...cat,
        mainCategory: cat.mainCategory || primaryMainCategory
      }));
      delete req.body.serviceCategories;
    }

    // 4. CLOUDINARY CLEANUP — delete removed portfolio items
    if (req.body.portfolio !== undefined) {
      const oldPortfolio = technician.portfolio || [];
      const newPortfolio = req.body.portfolio || [];

      const removedItems = oldPortfolio.filter(oldItem => 
        !newPortfolio.some(newItem => 
          (newItem.publicId && newItem.publicId === oldItem.publicId) ||
          (newItem.mediaUrl === oldItem.mediaUrl)
        )
      );

      for (const item of removedItems) {
        if (item.publicId) await deleteFromCloudinary(item.publicId);
      }

      // Keep gallery array in sync
      req.body.gallery = newPortfolio.map(p => p.mediaUrl);
    }

    // 5. MERGE & SAVE
    Object.assign(technician, req.body);
    technician.lastActive = new Date();

    await updateCompletionStats(technician);
    await technician.save();
    await technician.populate('userId', 'email firstName lastName phone profileImage');

    res.json({ success: true, message: 'Profile updated successfully', technician });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};