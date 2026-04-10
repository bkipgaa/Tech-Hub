// controllers/serviceCatalogController.js
const ServiceCatalog = require('../models/ServiceCatalog');
const Technician = require('../models/Technician');

// @desc    Get all main categories
// @route   GET /api/service-catalog/main-categories
// @access  Public
exports.getMainCategories = async (req, res) => {
  try {
    // Get enum values from Technician model
    const categories = Technician.schema.path('category').enumValues;
    
    // Get active catalogs to see which categories have services
    const activeCatalogs = await ServiceCatalog.find({ isActive: true }).distinct('mainCategory');
    
    const categoriesWithStatus = categories.map(cat => ({
      name: cat,
      hasServices: activeCatalogs.includes(cat)
    }));
    
    res.json({
      success: true,
      count: categoriesWithStatus.length,
      data: categoriesWithStatus
    });
  } catch (error) {
    console.error('Error in getMainCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all service categories for a main category
// @route   GET /api/service-catalog/:mainCategory/service-categories
// @access  Public
exports.getServiceCategoriesByMain = async (req, res) => {
  try {
    const { mainCategory } = req.params;
    
    const catalog = await ServiceCatalog.findOne({ 
      mainCategory, 
      isActive: true 
    });
    
    if (!catalog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found or no services available' 
      });
    }
    
    // Return only active service categories
    const activeCategories = catalog.serviceCategories
      .filter(c => c.isActive)
      .map(c => ({
        id: c._id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        image: c.image,
        displayOrder: c.displayOrder,
        tags: c.tags,
        subServiceCount: c.subServices.filter(s => s.isActive).length,
        // Include a few sample sub-services
        sampleSubServices: c.subServices
          .filter(s => s.isActive)
          .slice(0, 3)
          .map(s => ({
            name: s.name,
            description: s.description
          }))
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
    res.json({ 
      success: true, 
      count: activeCategories.length,
      data: activeCategories
    });
  } catch (error) {
    console.error('Error in getServiceCategoriesByMain:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all sub-services for a service category
// @route   GET /api/service-catalog/:mainCategory/:serviceCategory/sub-services
// @access  Public
exports.getSubServices = async (req, res) => {
  try {
    const { mainCategory, serviceCategory } = req.params;
    
    const catalog = await ServiceCatalog.findOne({ 
      mainCategory, 
      isActive: true 
    });
    
    if (!catalog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Main category not found' 
      });
    }
    
    const category = catalog.serviceCategories.find(
      c => c.name === serviceCategory && c.isActive
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service category not found' 
      });
    }
    
    // Return only active sub-services
    const activeSubServices = category.subServices
      .filter(s => s.isActive)
      .map(s => ({
        id: s._id,
        name: s.name,
        description: s.description,
        suggestedPriceRange: s.suggestedPriceRange,
        typicalDuration: s.typicalDuration,
        commonRequirements: s.commonRequirements,
        requiredSkills: s.requiredSkills,
        commonQuestions: s.commonQuestions,
        expertiseLevel: s.expertiseLevel,
        equipmentNeeded: s.equipmentNeeded,
        commonEquipment: s.commonEquipment,
        images: s.images,
        displayOrder: s.displayOrder,
        popularity: s.popularity
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
    res.json({ 
      success: true, 
      count: activeSubServices.length,
      data: {
        categoryName: category.name,
        categoryDescription: category.description,
        categoryIcon: category.icon,
        subServices: activeSubServices
      }
    });
  } catch (error) {
    console.error('Error in getSubServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get complete catalog for a main category
// @route   GET /api/service-catalog/:mainCategory/full
// @access  Public
exports.getFullCatalog = async (req, res) => {
  try {
    const { mainCategory } = req.params;
    
    const catalog = await ServiceCatalog.findOne({ 
      mainCategory, 
      isActive: true 
    });
    
    if (!catalog) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    // Filter active items
    const activeCatalog = {
      mainCategory: catalog.mainCategory,
      serviceCategories: catalog.serviceCategories
        .filter(c => c.isActive)
        .map(c => ({
          name: c.name,
          description: c.description,
          icon: c.icon,
          displayOrder: c.displayOrder,
          subServices: c.subServices
            .filter(s => s.isActive)
            .map(s => ({
              name: s.name,
              description: s.description,
              suggestedPriceRange: s.suggestedPriceRange,
              typicalDuration: s.typicalDuration,
              expertiseLevel: s.expertiseLevel
            }))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder)
    };
    
    res.json({ 
      success: true, 
      data: activeCatalog 
    });
  } catch (error) {
    console.error('Error in getFullCatalog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search services across all categories
// @route   GET /api/service-catalog/search
// @access  Public
exports.searchServices = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ 
        success: true, 
        count: 0,
        data: [] 
      });
    }
    
    const results = await ServiceCatalog.searchServices(q);
    
    // Increment search counts for matching services
    for (const result of results) {
      await ServiceCatalog.incrementSearchCount(
        result.mainCategory,
        result.serviceCategory,
        result.subService
      );
    }
    
    res.json({ 
      success: true, 
      count: results.length,
      data: results 
    });
  } catch (error) {
    console.error('Error in searchServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get popular services
// @route   GET /api/service-catalog/popular
// @access  Public
exports.getPopularServices = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popular = await ServiceCatalog.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$serviceCategories' },
      { $match: { 'serviceCategories.isActive': true } },
      { $unwind: '$serviceCategories.subServices' },
      { $match: { 'serviceCategories.subServices.isActive': true } },
      {
        $project: {
          mainCategory: 1,
          serviceCategory: '$serviceCategories.name',
          subService: '$serviceCategories.subServices.name',
          subServiceDescription: '$serviceCategories.subServices.description',
          searchCount: '$serviceCategories.subServices.popularity.searchCount',
          bookingCount: '$serviceCategories.subServices.popularity.bookingCount',
          suggestedPriceRange: '$serviceCategories.subServices.suggestedPriceRange',
          typicalDuration: '$serviceCategories.subServices.typicalDuration'
        }
      },
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: ['$searchCount', 1] },
              { $multiply: ['$bookingCount', 3] }
            ]
          }
        }
      },
      { $sort: { popularityScore: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json({
      success: true,
      count: popular.length,
      data: popular
    });
  } catch (error) {
    console.error('Error in getPopularServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get service categories with sub-services count
// @route   GET /api/service-catalog/categories-with-counts
// @access  Public
exports.getCategoriesWithCounts = async (req, res) => {
  try {
    const catalogs = await ServiceCatalog.find({ isActive: true });
    
    const result = catalogs.map(catalog => ({
      mainCategory: catalog.mainCategory,
      serviceCategories: catalog.serviceCategories
        .filter(c => c.isActive)
        .map(c => ({
          name: c.name,
          description: c.description,
          icon: c.icon,
          subServiceCount: c.subServices.filter(s => s.isActive).length,
          displayOrder: c.displayOrder
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder)
    }));
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getCategoriesWithCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Validate if a sub-service exists
// @route   POST /api/service-catalog/validate
// @access  Public (used by technician registration)
exports.validateServices = async (req, res) => {
  try {
    const { services } = req.body;
    
    const validationResults = [];
    
    for (const service of services) {
      const { mainCategory, categoryName, subServices } = service;
      
      const catalog = await ServiceCatalog.findOne({ 
        mainCategory, 
        isActive: true 
      });
      
      if (!catalog) {
        validationResults.push({
          mainCategory,
          categoryName,
          valid: false,
          message: 'Main category not found'
        });
        continue;
      }
      
      const category = catalog.serviceCategories.find(
        c => c.name === categoryName && c.isActive
      );
      
      if (!category) {
        validationResults.push({
          mainCategory,
          categoryName,
          valid: false,
          message: 'Service category not found'
        });
        continue;
      }
      
      const validSubServices = [];
      const invalidSubServices = [];
      
      for (const subName of subServices) {
        const subExists = category.subServices.some(
          s => s.name === subName && s.isActive
        );
        
        if (subExists) {
          validSubServices.push(subName);
        } else {
          invalidSubServices.push(subName);
        }
      }
      
      validationResults.push({
        mainCategory,
        categoryName,
        valid: validSubServices.length > 0,
        validSubServices,
        invalidSubServices,
        message: invalidSubServices.length > 0 
          ? `Invalid sub-services: ${invalidSubServices.join(', ')}`
          : 'All services valid'
      });
    }
    
    const allValid = validationResults.every(r => r.valid);
    
    res.json({
      success: true,
      allValid,
      results: validationResults
    });
  } catch (error) {
    console.error('Error in validateServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};