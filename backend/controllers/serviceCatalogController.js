/**
 * Service Catalog Controller
 * ==========================
 * 
 * Handles all service catalog operations for the Weba-Hub platform.
 * This controller manages the hierarchical structure of services:
 * Main Categories -> Service Categories -> Sub-Services
 * 
 * Key Features:
 * - Fetch all main service categories
 * - Get service categories under a main category
 * - Get detailed sub-services for specific services
 * - Search across all services
 * - Track popular services based on usage
 * - Validate service existence for job posting and technician registration
 * 
 * Integration Points:
 * - Technician Model: Uses category enum for main categories
 * - ServiceCatalog Model: Stores all service hierarchy data
 * - Job Model: Validates service selections when posting jobs
 * - Booking Model: Tracks popular services for analytics
 * 
 * @module serviceCatalogController
 */

const ServiceCatalog = require('../models/ServiceCatalog');
const Technician = require('../models/Technician');
const searchController = require('./searchController'); // adjust path if needed
const mongoose = require('mongoose');

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get technician category enum values with error fallback
 * This function safely retrieves the category enum from Technician model
 * If the model is not available or enum doesn't exist, returns default categories
 * 
 * @returns {string[]} Array of category names
 */
const getTechnicianCategories = () => {
  try {
    // Try to access the category path from Technician schema
    const schemaPath = Technician.schema.path('category');
    
    // Check if path exists and has enumValues
    if (schemaPath && schemaPath.enumValues && schemaPath.enumValues.length > 0) {
      return schemaPath.enumValues;
    }
  } catch (error) {
    console.error('Error accessing Technician schema categories:', error.message);
  }
  
  // Fallback categories if Technician model is not accessible
  // These match the enum in the Technician model
  return [
    'IT & Networking',
    'Electrical Services',
    'Mechanical Services',
    'Plumbing',
    'Programming & AI',
    'Hairdressing & Beauty',
    'Carpentry & Furniture',
    'Laundry & Dry Cleaning',
    'Cleaning Services',
    'Painting & Decorating',
    'Welding & Fabrication',
    'Automotive Repair',
    'Tutoring & Training',
    'Photography & Videography',
    'Event Planning',
    'Construction & Renovation',
    'HVAC Services',
    'Appliance Repair',
    'Moving & Logistics',
    'Gardening & Landscaping'
  ];
};

/**
 * Check if MongoDB database is connected
 * Returns true if connection state is 'connected' (state 1)
 * 
 * @returns {boolean} True if database is connected
 */
const isDatabaseConnected = () => {
  const state = mongoose.connection.readyState;
  return state === 1; // 1 = connected
};

/**
 * Get connection status message for debugging
 * 
 * @returns {string} Human-readable connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

// ===========================================
// MAIN CATEGORY ENDPOINTS
// ===========================================

/**
 * @desc    Get all main service categories
 * @route   GET /api/service-catalog/main-categories
 * @access  Public
 * 
 * This endpoint returns all available main categories (e.g., "Electrical Services",
 * "Plumbing", "IT & Networking") from the Technician model enum.
 * It also indicates which categories have active services in the catalog.
 * 
 * @returns {Object} Response with categories array and availability status
 */
exports.getMainCategories = async (req, res) => {
  try {
    console.log('[ServiceCatalog] Fetching main categories...');
    console.log(`[ServiceCatalog] Database connection state: ${getConnectionStatus()}`);
    
    // Step 1: Get categories from Technician model enum
    const categories = getTechnicianCategories();
    console.log(`[ServiceCatalog] Found ${categories.length} categories from Technician model`);
    
    // Step 2: Check database connection before querying ServiceCatalog
    if (!isDatabaseConnected()) {
      console.warn('[ServiceCatalog] Database not connected, returning categories without service status');
      
      // Return categories with default status when database is unavailable
      const categoriesWithStatus = categories.map(cat => ({
        name: cat,
        hasServices: true, // Assume true to allow job posting
        description: `${cat} services available`,
        message: 'Database connecting - service availability may be limited'
      }));
      
      return res.json({
        success: true,
        count: categoriesWithStatus.length,
        data: categoriesWithStatus,
        warning: 'Database connection is being established. Service availability may update shortly.'
      });
    }
    
    // Step 3: Get active catalogs from ServiceCatalog to check which have services
    let activeCatalogs = [];
    try {
      activeCatalogs = await ServiceCatalog.find({ isActive: true }).distinct('mainCategory');
      console.log(`[ServiceCatalog] Found ${activeCatalogs.length} active catalogs in database`);
    } catch (dbError) {
      console.error('[ServiceCatalog] Error fetching active catalogs:', dbError.message);
      activeCatalogs = [];
    }
    
    // Step 4: Build response with service availability status
    const categoriesWithStatus = categories.map(cat => ({
      name: cat,
      hasServices: activeCatalogs.includes(cat),
      description: activeCatalogs.includes(cat) 
        ? `${cat} services available for booking`
        : `${cat} services coming soon - check back later`,
      categoryCount: activeCatalogs.includes(cat) ? 1 : 0
    }));
    
    // Step 5: Send successful response
    res.json({
      success: true,
      count: categoriesWithStatus.length,
      data: categoriesWithStatus,
      metadata: {
        totalActive: activeCatalogs.length,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    // Comprehensive error handling with fallback
    console.error('[ServiceCatalog] CRITICAL ERROR in getMainCategories:', error);
    console.error('[ServiceCatalog] Error stack:', error.stack);
    
    // Return fallback categories even on error to keep frontend functional
    const fallbackCategories = getTechnicianCategories();
    res.status(500).json({
      success: false,
      message: 'Unable to fetch categories due to server error',
      data: fallbackCategories.map(cat => ({ 
        name: cat, 
        hasServices: false,
        error: true
      })),
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @desc    Get all service categories for a specific main category
 * @route   GET /api/service-catalog/:mainCategory/service-categories
 * @access  Public
 * 
 * This endpoint returns service categories under a main category.
 * For example, under "Electrical Services", it might return:
 * - "Wiring Services"
 * - "Repair Services" 
 * - "Installation Services"
 * 
 * @param {string} mainCategory - The main category name from URL params
 * @returns {Object} Response with service categories array
 */
exports.getServiceCategoriesByMain = async (req, res) => {
  try {
    const { mainCategory } = req.params;
    console.log(`[ServiceCatalog] Fetching service categories for main category: ${mainCategory}`);
    
    // Validate input
    if (!mainCategory || mainCategory.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Main category is required'
      });
    }
    
    // Check database connection
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again.',
        data: []
      });
    }
    
    // Find the catalog document for the main category
    const catalog = await ServiceCatalog.findOne({ 
      mainCategory: mainCategory, 
      isActive: true 
    });
    
    // Handle case when catalog doesn't exist
    if (!catalog) {
      console.log(`[ServiceCatalog] No catalog found for main category: ${mainCategory}`);
      return res.status(404).json({ 
        success: false, 
        message: `No services available for ${mainCategory} yet. Please check back later.`,
        data: []
      });
    }
    
    // Filter and map only active service categories
    const activeCategories = catalog.serviceCategories
      .filter(c => c.isActive !== false) // Handle undefined as active
      .map(c => ({
        id: c._id,
        name: c.name,
        description: c.description || `${c.name} services`,
        icon: c.icon || null,
        image: c.image || null,
        displayOrder: c.displayOrder || 0,
        tags: c.tags || [],
        // Count of active sub-services under this category
        subServiceCount: c.subServices ? c.subServices.filter(s => s.isActive !== false).length : 0,
        // Show up to 3 sample sub-services for preview
        sampleSubServices: c.subServices && c.subServices.length > 0
          ? c.subServices
              .filter(s => s.isActive !== false)
              .slice(0, 3)
              .map(s => ({
                name: s.name,
                description: s.description || `${s.name} service`
              }))
          : []
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    console.log(`[ServiceCatalog] Found ${activeCategories.length} service categories for ${mainCategory}`);
    
    // Return successful response
    res.json({ 
      success: true, 
      count: activeCategories.length,
      data: activeCategories,
      metadata: {
        mainCategory: mainCategory,
        catalogVersion: catalog.version || 1,
        lastUpdated: catalog.updatedAt
      }
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error in getServiceCategoriesByMain:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching service categories',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};


/**
 * @desc    Get technicians for a specific service category with distance filtering
 * @route   GET /api/service-catalog/:mainCategory/:serviceCategory/technicians
 * @access  Public
 * 
 * This endpoint reuses the search controller's logic to fetch technicians
 * who offer the given service, within the specified distance.
 */
exports.getTechniciansForService = async (req, res) => {
  try {
    const { mainCategory, serviceCategory } = req.params;
    const { radius, lat, lng, page, limit, minRating, minHourlyRate, maxHourlyRate } = req.query;

    // Validate required parameters
    if (!mainCategory || !serviceCategory) {
      return res.status(400).json({
        success: false,
        message: 'mainCategory and serviceCategory are required'
      });
    }

    // Build the query object as the search controller expects
    const searchQuery = {
      mainCategory,
      serviceCategory,
      radius: radius || 50, // default to 50km if not provided
      page: page || 1,
      limit: limit || 20,
      minRating: minRating || '',
      minHourlyRate: minHourlyRate || '',
      maxHourlyRate: maxHourlyRate || ''
    };

    // Add location if provided
    if (lat && lng) {
      searchQuery.lat = lat;
      searchQuery.lng = lng;
    }

    // We need to call the search controller's function
    // But we must pass the request and response objects.
    // We'll create a mock request object with the query parameters.
    const mockReq = {
      query: searchQuery
    };

    // We'll call the search controller function and let it handle the response.
    // We need to import the search controller at the top:
    // const searchController = require('./searchController');
    await searchController.searchTechnicians(mockReq, res);

  } catch (error) {
    console.error('[ServiceCatalog] Error in getTechniciansForService:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching technicians for service',
      error: error.message
    });
  }
};

/**
 * @desc    Get all sub-services for a specific service category
 * @route   GET /api/service-catalog/:mainCategory/:serviceCategory/sub-services
 * @access  Public
 * 
 * This endpoint returns specific sub-services with full details.
 * For example, under "Wiring Services", it might return:
 * - "House Wiring" with pricing, duration, requirements
 * - "Office Wiring" with detailed specifications
 * - "Circuit Installation" with equipment needs
 * 
 * @param {string} mainCategory - The main category name
 * @param {string} serviceCategory - The service category name
 * @returns {Object} Response with detailed sub-services array
 */
exports.getSubServices = async (req, res) => {
  try {
    const { mainCategory, serviceCategory } = req.params;
    console.log(`[ServiceCatalog] Fetching sub-services for: ${mainCategory} > ${serviceCategory}`);
    
    // Validate inputs
    if (!mainCategory || !serviceCategory) {
      return res.status(400).json({
        success: false,
        message: 'Both main category and service category are required'
      });
    }
    
    // Check database connection
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again.',
        data: null
      });
    }
    
    // Find the catalog for the main category
    const catalog = await ServiceCatalog.findOne({ 
      mainCategory: mainCategory, 
      isActive: true 
    });
    
    if (!catalog) {
      console.log(`[ServiceCatalog] No catalog found for main category: ${mainCategory}`);
      return res.status(404).json({ 
        success: false, 
        message: `Main category '${mainCategory}' not found in catalog`,
        data: null
      });
    }
    
    // Find the specific service category within the catalog
    const category = catalog.serviceCategories.find(
      c => c.name === serviceCategory && (c.isActive !== false)
    );
    
    if (!category) {
      console.log(`[ServiceCatalog] Service category not found: ${serviceCategory}`);
      return res.status(404).json({ 
        success: false, 
        message: `Service category '${serviceCategory}' not found in ${mainCategory}`,
        data: null
      });
    }
    
    // Process and return only active sub-services with full details
    const activeSubServices = (category.subServices || [])
      .filter(s => s.isActive !== false)
      .map(s => ({
        id: s._id,
        name: s.name,
        description: s.description || `Professional ${s.name} services`,
        
        // Pricing information
        suggestedPriceRange: s.suggestedPriceRange || { 
          min: 1000, 
          max: 5000, 
          currency: 'KES' 
        },
        
        // Duration estimates
        typicalDuration: s.typicalDuration || { 
          value: 2, 
          unit: 'hours' 
        },
        
        // Requirements and skills
        commonRequirements: s.commonRequirements || [],
        requiredSkills: s.requiredSkills || [],
        
        // Client questions to ask
        commonQuestions: s.commonQuestions || [],
        
        // Expertise level needed
        expertiseLevel: s.expertiseLevel || 'intermediate',
        
        // Equipment information
        equipmentNeeded: s.equipmentNeeded || false,
        commonEquipment: s.commonEquipment || [],
        
        // Media and display
        images: s.images || [],
        displayOrder: s.displayOrder || 0,
        
        // Analytics data
        popularity: s.popularity || { searchCount: 0, bookingCount: 0 }
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    console.log(`[ServiceCatalog] Found ${activeSubServices.length} sub-services for ${serviceCategory}`);
    
    // Return successful response with category metadata
    res.json({ 
      success: true, 
      count: activeSubServices.length,
      data: {
        categoryId: category._id,
        categoryName: category.name,
        categoryDescription: category.description || `${category.name} services`,
        categoryIcon: category.icon || null,
        categoryTags: category.tags || [],
        subServices: activeSubServices
      },
      metadata: {
        mainCategory: mainCategory,
        totalSubServices: activeSubServices.length,
        lastUpdated: catalog.updatedAt
      }
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error in getSubServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sub-services',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @desc    Get complete catalog for a main category (nested structure)
 * @route   GET /api/service-catalog/:mainCategory/full
 * @access  Public
 * 
 * Returns the complete nested catalog structure for a main category
 * including all service categories and their sub-services.
 * Useful for building multi-level navigation menus.
 * 
 * @param {string} mainCategory - The main category name
 * @returns {Object} Complete nested catalog structure
 */
exports.getFullCatalog = async (req, res) => {
  try {
    const { mainCategory } = req.params;
    console.log(`[ServiceCatalog] Fetching full catalog for: ${mainCategory}`);
    
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable'
      });
    }
    
    const catalog = await ServiceCatalog.findOne({ 
      mainCategory: mainCategory, 
      isActive: true 
    });
    
    if (!catalog) {
      return res.status(404).json({ 
        success: false, 
        message: `Category '${mainCategory}' not found` 
      });
    }
    
    // Build complete nested structure
    const activeCatalog = {
      mainCategory: catalog.mainCategory,
      version: catalog.version || 1,
      lastUpdated: catalog.updatedAt,
      serviceCategories: catalog.serviceCategories
        .filter(c => c.isActive !== false)
        .map(c => ({
          id: c._id,
          name: c.name,
          description: c.description,
          icon: c.icon,
          displayOrder: c.displayOrder,
          subServices: (c.subServices || [])
            .filter(s => s.isActive !== false)
            .map(s => ({
              id: s._id,
              name: s.name,
              description: s.description,
              suggestedPriceRange: s.suggestedPriceRange,
              typicalDuration: s.typicalDuration,
              expertiseLevel: s.expertiseLevel,
              equipmentNeeded: s.equipmentNeeded,
              displayOrder: s.displayOrder
            }))
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        }))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    };
    
    res.json({ 
      success: true, 
      data: activeCatalog 
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error in getFullCatalog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// SEARCH AND DISCOVERY ENDPOINTS
// ===========================================

/**
 * @desc    Search services across all categories
 * @route   GET /api/service-catalog/search
 * @access  Public
 * 
 * Performs text-based search across all service names and descriptions.
 * Increments search count for popular services tracking.
 * 
 * @query {string} q - Search query (minimum 2 characters)
 * @returns {Object} Search results with matching services
 */
exports.searchServices = async (req, res) => {
  try {
    const { q } = req.query;
    
    // Validate search query - minimum 2 characters
    if (!q || q.length < 2) {
      return res.json({ 
        success: true, 
        count: 0,
        data: [],
        message: 'Please enter at least 2 characters to search'
      });
    }
    
    console.log(`[ServiceCatalog] Searching for: "${q}"`);
    
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable'
      });
    }
    
    // Use the static search method from ServiceCatalog model
    const results = await ServiceCatalog.searchServices(q);
    console.log(`[ServiceCatalog] Found ${results.length} results for "${q}"`);
    
    // Increment search counts for analytics (fire and forget - don't await)
    // This helps track popular services without blocking the response
    for (const result of results) {
      ServiceCatalog.incrementSearchCount(
        result.mainCategory,
        result.serviceCategory,
        result.subService
      ).catch(err => console.error('[ServiceCatalog] Error incrementing search count:', err));
    }
    
    res.json({ 
      success: true, 
      count: results.length,
      data: results,
      searchTerm: q,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error in searchServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching',
      error: error.message
    });
  }
};

/**
 * @desc    Get popular services based on usage
 * @route   GET /api/service-catalog/popular
 * @access  Public
 * 
 * Returns the most popular services based on:
 * - Search count (weight: 1)
 * - Booking count (weight: 3 - more important)
 * 
 * @query {number} limit - Maximum number of results (default: 10)
 * @returns {Object} Popular services ranked by popularity score
 */
exports.getPopularServices = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    console.log(`[ServiceCatalog] Fetching top ${limit} popular services`);
    
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable'
      });
    }
    
    // Aggregate pipeline to calculate popularity scores
    const popular = await ServiceCatalog.aggregate([
      // Match only active catalogs
      { $match: { isActive: true } },
      
      // Unwind service categories array
      { $unwind: '$serviceCategories' },
      { $match: { 'serviceCategories.isActive': { $ne: false } } },
      
      // Unwind sub-services array
      { $unwind: '$serviceCategories.subServices' },
      { $match: { 'serviceCategories.subServices.isActive': { $ne: false } } },
      
      // Project relevant fields
      {
        $project: {
          mainCategory: 1,
          serviceCategory: '$serviceCategories.name',
          subService: '$serviceCategories.subServices.name',
          subServiceDescription: '$serviceCategories.subServices.description',
          searchCount: { $ifNull: ['$serviceCategories.subServices.popularity.searchCount', 0] },
          bookingCount: { $ifNull: ['$serviceCategories.subServices.popularity.bookingCount', 0] },
          suggestedPriceRange: '$serviceCategories.subServices.suggestedPriceRange',
          typicalDuration: '$serviceCategories.subServices.typicalDuration'
        }
      },
      
      // Calculate popularity score (bookings weighted 3x more than searches)
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
      
      // Sort by popularity score descending
      { $sort: { popularityScore: -1 } },
      
      // Limit results
      { $limit: parseInt(limit) }
    ]);
    
    console.log(`[ServiceCatalog] Found ${popular.length} popular services`);
    
    res.json({
      success: true,
      count: popular.length,
      data: popular,
      metadata: {
        scoring: {
          searchWeight: 1,
          bookingWeight: 3
        }
      }
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error in getPopularServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching popular services',
      error: error.message
    });
  }
};

/**
 * @desc    Get service categories with sub-service counts (summary)
 * @route   GET /api/service-catalog/categories-with-counts
 * @access  Public
 * 
 * Returns a summary of all categories with sub-service counts.
 * Useful for dashboard statistics and quick overviews.
 * 
 * @returns {Object} Summary of all categories and their sub-service counts
 */
exports.getCategoriesWithCounts = async (req, res) => {
  try {
    console.log('[ServiceCatalog] Fetching categories with counts');
    
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable'
      });
    }
    
    const catalogs = await ServiceCatalog.find({ isActive: true });
    
    const result = catalogs.map(catalog => ({
      mainCategory: catalog.mainCategory,
      totalServiceCategories: catalog.serviceCategories.filter(c => c.isActive !== false).length,
      serviceCategories: catalog.serviceCategories
        .filter(c => c.isActive !== false)
        .map(c => ({
          id: c._id,
          name: c.name,
          description: c.description,
          icon: c.icon,
          subServiceCount: c.subServices ? c.subServices.filter(s => s.isActive !== false).length : 0,
          displayOrder: c.displayOrder || 0
        }))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    }));
    
    res.json({
      success: true,
      data: result,
      metadata: {
        totalMainCategories: result.length,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error in getCategoriesWithCounts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================================
// VALIDATION ENDPOINTS
// ===========================================

/**
 * @desc    Validate if services exist in catalog
 * @route   POST /api/service-catalog/validate
 * @access  Public
 * 
 * Used by technician registration and job posting to validate
 * that selected services exist in the catalog.
 * 
 * @body {Array} services - Array of service objects to validate
 * @returns {Object} Validation results for each service
 */
exports.validateServices = async (req, res) => {
  try {
    const { services } = req.body;
    
    // Validate request body
    if (!services || !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: services array required'
      });
    }
    
    if (services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service must be provided for validation'
      });
    }
    
    console.log(`[ServiceCatalog] Validating ${services.length} service entries`);
    
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.'
      });
    }
    
    const validationResults = [];
    
    // Validate each service
    for (const service of services) {
      const { mainCategory, categoryName, subServices } = service;
      
      // Check if main category exists
      const catalog = await ServiceCatalog.findOne({ 
        mainCategory: mainCategory, 
        isActive: true 
      });
      
      if (!catalog) {
        validationResults.push({
          mainCategory,
          categoryName,
          valid: false,
          validSubServices: [],
          invalidSubServices: subServices || [],
          message: `Main category '${mainCategory}' not found in catalog`
        });
        continue;
      }
      
      // Check if service category exists
      const category = catalog.serviceCategories.find(
        c => c.name === categoryName && (c.isActive !== false)
      );
      
      if (!category) {
        validationResults.push({
          mainCategory,
          categoryName,
          valid: false,
          validSubServices: [],
          invalidSubServices: subServices || [],
          message: `Service category '${categoryName}' not found in ${mainCategory}`
        });
        continue;
      }
      
      // Validate each sub-service
      const validSubServices = [];
      const invalidSubServices = [];
      
      if (subServices && Array.isArray(subServices)) {
        for (const subName of subServices) {
          const subExists = category.subServices.some(
            s => s.name === subName && (s.isActive !== false)
          );
          
          if (subExists) {
            validSubServices.push(subName);
          } else {
            invalidSubServices.push(subName);
          }
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
      results: validationResults,
      summary: {
        totalValidated: validationResults.length,
        fullyValid: validationResults.filter(r => r.valid).length,
        hasErrors: validationResults.filter(r => !r.valid).length
      }
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error in validateServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during validation',
      error: error.message
    });
  }
};

/**
 * @desc    Get detailed sub-services with full specifications
 * @route   GET /api/service-catalog/:mainCategory/:serviceCategory/sub-services/detailed
 * @access  Public
 * 
 * Returns comprehensive details about sub-services including:
 * - Pricing ranges
 * - Duration estimates
 * - Requirements and skills
 * - Equipment needed
 * - Common questions for clients
 * - Popularity metrics
 * 
 * Used by the frontend Services page for detailed service displays.
 * 
 * @param {string} mainCategory - The main category name
 * @param {string} serviceCategory - The service category name
 * @returns {Object} Detailed sub-services with full specifications
 */
exports.getDetailedSubServices = async (req, res) => {
  try {
    const { mainCategory, serviceCategory } = req.params;
    console.log(`[ServiceCatalog] Fetching detailed sub-services for: ${mainCategory} > ${serviceCategory}`);
    
    // Validate inputs
    if (!mainCategory || !serviceCategory) {
      return res.status(400).json({
        success: false,
        message: 'Both main category and service category are required'
      });
    }
    
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again.'
      });
    }
    
    // Find the catalog for the main category
    const catalog = await ServiceCatalog.findOne({ 
      mainCategory: mainCategory, 
      isActive: true 
    });
    
    if (!catalog) {
      return res.status(404).json({ 
        success: false, 
        message: `Main category '${mainCategory}' not found in catalog` 
      });
    }
    
    // Find the specific service category
    const category = catalog.serviceCategories.find(
      c => c.name === serviceCategory && (c.isActive !== false)
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: `Service category '${serviceCategory}' not found in ${mainCategory}` 
      });
    }
    
    // Extract detailed sub-service information
    const subServices = (category.subServices || [])
      .filter(s => s.isActive !== false)
      .map(s => ({
        // Basic identification
        id: s._id,
        name: s.name,
        description: s.description || `Professional ${s.name} services`,
        
        // Pricing information
        suggestedPriceRange: s.suggestedPriceRange || { 
          min: 1000, 
          max: 5000, 
          currency: 'KES' 
        },
        
        // Time estimates
        typicalDuration: s.typicalDuration || { 
          value: 2, 
          unit: 'hours' 
        },
        
        // Requirements
        commonRequirements: s.commonRequirements || [],
        requiredSkills: s.requiredSkills || [],
        
        // Client interaction
        commonQuestions: s.commonQuestions || [],
        
        // Expertise and equipment
        expertiseLevel: s.expertiseLevel || 'intermediate',
        equipmentNeeded: s.equipmentNeeded || false,
        commonEquipment: s.commonEquipment || [],
        
        // Visual assets
        images: s.images || [],
        
        // Display preferences
        displayOrder: s.displayOrder || 0,
        
        // Analytics
        popularity: s.popularity || { searchCount: 0, bookingCount: 0 }
      }))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    
    console.log(`[ServiceCatalog] Found ${subServices.length} detailed sub-services for ${serviceCategory}`);
    
    // Return comprehensive response
    res.json({ 
      success: true, 
      count: subServices.length,
      data: {
        categoryId: category._id,
        categoryName: category.name,
        categoryDescription: category.description,
        categoryIcon: category.icon,
        categoryImage: category.image,
        categoryTags: category.tags || [],
        subServices: subServices
      },
      metadata: {
        mainCategory: mainCategory,
        totalSubServices: subServices.length,
        catalogVersion: catalog.version || 1,
        lastUpdated: catalog.updatedAt,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error in getDetailedSubServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching detailed sub-services',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// ===========================================
// ANALYTICS ENDPOINTS
// ===========================================

/**
 * @desc    Increment booking count for a service (analytics)
 * @route   POST /api/service-catalog/increment-booking
 * @access  Private (called when a booking is made)
 * 
 * Updates the booking count for a specific service to track popularity.
 * Called automatically when a booking is created.
 * 
 * @body {string} mainCategory - Main category name
 * @body {string} serviceCategory - Service category name  
 * @body {string} subService - Sub-service name
 * @returns {Object} Success confirmation
 */
exports.incrementBookingCount = async (req, res) => {
  try {
    const { mainCategory, serviceCategory, subService } = req.body;
    
    // Validate required fields
    if (!mainCategory || !serviceCategory || !subService) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: mainCategory, serviceCategory, subService'
      });
    }
    
    console.log(`[ServiceCatalog] Incrementing booking count for: ${mainCategory} > ${serviceCategory} > ${subService}`);
    
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable'
      });
    }
    
    // Call the static method to increment booking count
    await ServiceCatalog.incrementBookingCount(mainCategory, serviceCategory, subService);
    
    res.json({
      success: true,
      message: 'Booking count incremented successfully'
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Error incrementing booking count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating analytics',
      error: error.message
    });
  }
};

/**
 * @desc    Health check endpoint for service catalog
 * @route   GET /api/service-catalog/health
 * @access  Public
 * 
 * Provides status information about the service catalog system.
 * Useful for monitoring and debugging.
 * 
 * @returns {Object} System health status
 */
exports.healthCheck = async (req, res) => {
  try {
    const dbConnected = isDatabaseConnected();
    let catalogCount = 0;
    let totalSubServices = 0;
    
    if (dbConnected) {
      catalogCount = await ServiceCatalog.countDocuments({ isActive: true });
      
      // Count total sub-services for statistics
      const catalogs = await ServiceCatalog.find({ isActive: true });
      for (const catalog of catalogs) {
        for (const category of catalog.serviceCategories || []) {
          if (category.subServices) {
            totalSubServices += category.subServices.length;
          }
        }
      }
    }
    
    res.json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        state: getConnectionStatus()
      },
      catalog: {
        activeMainCategories: catalogCount,
        totalSubServices: totalSubServices,
        hasData: catalogCount > 0
      },
      endpoints: {
        mainCategories: '/api/service-catalog/main-categories',
        serviceCategories: '/api/service-catalog/:mainCategory/service-categories',
        subServices: '/api/service-catalog/:mainCategory/:serviceCategory/sub-services',
        search: '/api/service-catalog/search',
        popular: '/api/service-catalog/popular',
        validate: '/api/service-catalog/validate'
      }
    });
    
  } catch (error) {
    console.error('[ServiceCatalog] Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Export all controller functions
module.exports = exports;