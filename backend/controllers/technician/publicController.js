// Import the Technician model to interact with the technician collection
const Technician = require('../../models/Technician');

/**
 * Get technician by ID (public view - limited data)
 * @param {Object} req - Express request object with technician ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with technician public data
 */
exports.getTechnicianById = async (req, res) => {
  try {
    // Find technician by ID from URL parameters
    const technician = await Technician.findById(req.params.id)
      // Populate user data (only public fields)
      .populate('userId', 'firstName lastName profileImage')
      // Exclude sensitive information from response
      .select('-settings -subscription -verifiedDocuments -insuranceInfo');
    
    // If technician not found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician not found' 
      });
    }
    
    // Increment view count for analytics
    technician.views += 1;
    // Save the updated view count
    await technician.save();
    
    // Return success response with technician data
    res.json({
      success: true,
      technician
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get technician error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

/**
 * Search technicians with various filters (public)
 * @param {Object} req - Express request object with query parameters
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with search results and pagination
 */
exports.searchTechnicians = async (req, res) => {
  try {
    // Extract all possible query parameters
    const {
      query,        // Text search query
      category,     // Service category filter
      city,         // City filter
      minRating,    // Minimum rating filter
      maxPrice,     // Maximum price filter
      skill,        // Skill filter
      available,    // Availability filter
      lat,          // Latitude for location search
      lng,          // Longitude for location search
      radius,       // Search radius in kilometers
      page = 1,     // Page number for pagination (default 1)
      limit = 20,   // Results per page (default 20)
      sortBy = 'rating' // Sort field (default 'rating')
    } = req.query;
    
    // Initialize filter object with base condition
    let filter = { isActive: true }; // Only show active technicians
    
    // Text search using MongoDB text index
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // City filter (case-insensitive partial match)
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }
    
    // Rating filter (greater than or equal to minRating)
    if (minRating) {
      filter['rating.average'] = { $gte: parseFloat(minRating) };
    }
    
    // Skill filter (case-insensitive partial match)
    if (skill) {
      filter['skills.name'] = { $regex: skill, $options: 'i' };
    }
    
    // Availability filter
    if (available === 'true') {
      filter.isAvailable = true;
    }
    
    // Location-based search using GeoJSON
    if (lat && lng && radius) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      };
    }
    
    // Determine sort order based on sortBy parameter
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { 'rating.average': -1 }; // Highest rating first
        break;
      case 'experience':
        sort = { yearsOfExperience: -1 }; // Most experienced first
        break;
      case 'jobs':
        sort = { 'statistics.completedJobs': -1 }; // Most jobs completed first
        break;
      case 'newest':
        sort = { createdAt: -1 }; // Newest profiles first
        break;
      default:
        sort = { 'rating.average': -1, isFeatured: -1 }; // Default: rating then featured
    }
    
    // Calculate pagination offset
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute search query with filters, sorting, and pagination
    const technicians = await Technician.find(filter)
      // Populate basic user info
      .populate('userId', 'firstName lastName profileImage')
      // Exclude sensitive data
      .select('-settings -subscription -verifiedDocuments -insuranceInfo')
      // Apply sorting
      .sort(sort)
      // Apply pagination
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Technician.countDocuments(filter);
    
    // Update search appearances for analytics (non-blocking)
    technicians.forEach(async (tech) => {
      tech.searchAppearances += 1;
      await tech.save();
    });
    
    // Return success response with results and pagination info
    res.json({
      success: true,
      technicians,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Search technicians error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error during search' 
    });
  }
};

/**
 * Get nearby technicians based on location
 * @param {Object} req - Express request object with location coordinates
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with nearby technicians
 */
exports.getNearbyTechnicians = async (req, res) => {
  try {
    // Extract location parameters from query
    const { lat, lng, radius = 10, category } = req.query;
    
    // Validate that coordinates were provided
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // Build query for nearby technicians
    let query = {
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      },
      isActive: true,      // Only active technicians
      isAvailable: true    // Only available technicians
    };
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Execute query and limit results
    const technicians = await Technician.find(query)
      // Populate basic user info
      .populate('userId', 'firstName lastName profileImage')
      // Exclude sensitive data
      .select('-settings -subscription -verifiedDocuments')
      // Limit to 50 results
      .limit(50);
    
    // Return success response with nearby technicians
    res.json({
      success: true,
      technicians,
      count: technicians.length
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get nearby technicians error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

/**
 * Get technician statistics (public view)
 * @param {Object} req - Express request object with technician ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with technician statistics
 */
exports.getTechnicianStatistics = async (req, res) => {
  try {
    // Find technician by ID and select only statistics fields
    const technician = await Technician.findById(req.params.id)
      .select('statistics rating views saves shares searchAppearances');
    
    // If technician not found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician not found' 
      });
    }
    
    // Return success response with statistics
    res.json({
      success: true,
      statistics: {
        ...technician.statistics,  // Include all statistics fields
        rating: technician.rating,  // Include rating details
        views: technician.views,    // Include profile views
        saves: technician.saves,    // Include profile saves
        shares: technician.shares,  // Include profile shares
        searchAppearances: technician.searchAppearances // Include search appearances
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get technician statistics error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

/**
 * Get featured technicians
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with featured technicians
 */
exports.getFeaturedTechnicians = async (req, res) => {
  try {
    // Extract limit from query (default 10)
    const { limit = 10, category } = req.query;
    
    // Build query for featured technicians
    let query = { 
      isFeatured: true,  // Only featured technicians
      isActive: true     // Only active technicians
    };
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Find featured technicians with high ratings
    const technicians = await Technician.find(query)
      // Sort by rating (highest first)
      .sort({ 'rating.average': -1 })
      // Apply limit
      .limit(parseInt(limit))
      // Populate basic user info
      .populate('userId', 'firstName lastName profileImage')
      // Exclude sensitive data
      .select('-settings -subscription -verifiedDocuments -insuranceInfo');
    
    // Return success response with featured technicians
    res.json({
      success: true,
      technicians,
      count: technicians.length
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get featured technicians error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

/**
 * Get technician by category
 * @param {Object} req - Express request object with category
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with technicians in category
 */
exports.getTechniciansByCategory = async (req, res) => {
  try {
    // Extract category from URL parameters
    const { category } = req.params;
    // Extract pagination parameters
    const { page = 1, limit = 20 } = req.query;
    
    // Calculate pagination offset
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find technicians in the specified category
    const technicians = await Technician.find({ 
      category, 
      isActive: true 
    })
      // Sort by rating and featured status
      .sort({ 'rating.average': -1, isFeatured: -1 })
      // Apply pagination
      .skip(skip)
      .limit(parseInt(limit))
      // Populate basic user info
      .populate('userId', 'firstName lastName profileImage')
      // Exclude sensitive data
      .select('-settings -subscription -verifiedDocuments -insuranceInfo');
    
    // Get total count for pagination
    const total = await Technician.countDocuments({ category, isActive: true });
    
    // Return success response with results and pagination
    res.json({
      success: true,
      technicians,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get technicians by category error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};