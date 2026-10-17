const Technician = require('../../../models/Technician');
const { updateCompletionStats } = require('./helpers'); // optional

/**
 * Add a new service category to the technician's profile
 * POST /technician/profile/service-category
 */
exports.addServiceCategory = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician profile not found'
      });
    }

    const { mainCategory, categoryName, subServices } = req.body;

    // Validate required fields
    if (!mainCategory || typeof mainCategory !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Main category is required'
      });
    }
    if (!categoryName || !subServices || !Array.isArray(subServices) || subServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category name and at least one sub-service are required'
      });
    }

    // Optional: validate that the mainCategory exists in the technician's mainCategories list
    // if (technician.mainCategories && !technician.mainCategories.includes(mainCategory)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Main category not found in your profile. Please add it in the Profile tab first.'
    //   });
    // }

    // Check for duplicate category under the same main category
    const exists = technician.serviceCategories.some(
      cat => cat.categoryName === categoryName && cat.mainCategory === mainCategory
    );
    if (exists) {
      return res.status(400).json({
        success: false,
        message: `Service category "${categoryName}" already exists under "${mainCategory}"`
      });
    }

    // Add new category
    technician.serviceCategories.push({
      mainCategory,
      categoryName,
      subServices,
      description: `${categoryName} services`,
      basePrice: 0,
      estimatedDuration: '2-4 hours',
      isActive: true,
      displayOrder: technician.serviceCategories.length
    });

    // Offering services in a category makes it one of the expert's categories
    if (!(technician.mainCategories || []).includes(mainCategory)) {
      technician.mainCategories = [...(technician.mainCategories || []), mainCategory];
    }
    if (!technician.mainCategory) technician.mainCategory = mainCategory;

    await technician.save();

    // Optionally update completion stats
    // await updateCompletionStats(technician);

    res.status(201).json({
      success: true,
      data: technician
    });
  } catch (error) {
    console.error('Add service category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding service category'
    });
  }
};



/**
 * Remove a service category from the technician's profile
 * DELETE /technician/profile/service-category/:categoryName?mainCategory=...
 */
exports.removeServiceCategory = async (req, res) => {
  try {
    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician profile not found'
      });
    }

    const { categoryName } = req.params;
    const { mainCategory } = req.query; // optional query param

    // Find the category index
    let categoryIndex = -1;
    if (mainCategory) {
      categoryIndex = technician.serviceCategories.findIndex(
        cat => cat.categoryName === categoryName && cat.mainCategory === mainCategory
      );
    } else {
      // Fallback: remove the first matching category (backward compatibility)
      categoryIndex = technician.serviceCategories.findIndex(
        cat => cat.categoryName === categoryName
      );
    }

    if (categoryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Service category not found'
      });
    }

    // Remove category
    technician.serviceCategories.splice(categoryIndex, 1);

    await technician.save();

    res.json({
      success: true,
      data: technician
    });
  } catch (error) {
    console.error('Remove service category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing service category'
    });
  }
};

/**
 * Replace the sub-services of one of the expert's service categories in a
 * single save (the dashboard used to remove and re-add the whole category).
 * PUT /api/technician/profile/service-category
 * Body: { mainCategory, categoryName, subServices: [String] }
 */
exports.updateServiceCategory = async (req, res) => {
  try {
    const { mainCategory, categoryName, subServices } = req.body;
    if (!mainCategory || !categoryName) {
      return res.status(400).json({ success: false, message: 'Main category and service category are required' });
    }
    const cleaned = Array.isArray(subServices)
      ? [...new Set(subServices.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()))]
      : [];
    if (cleaned.length === 0) {
      return res.status(400).json({ success: false, message: 'Keep at least one service, or remove the whole category' });
    }

    const technician = await Technician.findOne({ userId: req.user.userId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }
    const category = technician.serviceCategories.find(
      (c) => c.categoryName === categoryName && c.mainCategory === mainCategory
    );
    if (!category) {
      return res.status(404).json({ success: false, message: `"${categoryName}" is not in your services` });
    }

    category.subServices = cleaned;
    await technician.save();
    res.json({ success: true, data: technician });
  } catch (error) {
    console.error('Update service category error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating service category' });
  }
};
