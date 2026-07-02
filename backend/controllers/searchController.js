/**
 * searchController.js
 * ===================
 * Enhanced search for technicians with subscription-based visibility radius
 * 
 * This controller handles searching for technicians based on:
 * - mainCategory (matches Job model's mainCategory)
 * - serviceCategory (matches Job model's serviceCategory)
 * - subService (matches Job model's subService)
 * - Location-based search with radius
 * - Subscription-based visibility radius filtering
 * 
 * @version 2.0.0
 * @author Weba-Hub Team
 */

const mongoose = require('mongoose');
const Technician = require('../models/Technician');
const { subscriptionPlans, isPlanActive } = require('../utils/subscriptionPlans');

/**
 * ===========================================
 * HELPER FUNCTIONS
 * ===========================================
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * 
 * The Haversine formula calculates the shortest distance between two points
 * on a sphere (Earth) using their latitudes and longitudes.
 * 
 * @param {number} lat1 - Latitude of first point (client's location)
 * @param {number} lon1 - Longitude of first point (client's location)
 * @param {number} lat2 - Latitude of second point (technician's location)
 * @param {number} lon2 - Longitude of second point (technician's location)
 * @returns {number} Distance in kilometers (rounded to 1 decimal place)
 * 
 * @example
 * calculateDistance(-1.286389, 36.817223, -1.292066, 36.821946) // Returns ~0.8 km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  // Haversine formula
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  // Round to 1 decimal place for cleaner display
  return Math.round((R * c) * 10) / 10;
}

/**
 * Safely parse MongoDB date objects to JavaScript Date objects
 * 
 * MongoDB can store dates in various formats:
 * - JavaScript Date objects
 * - ISO strings
 * - MongoDB ISODate objects (with $date property)
 * 
 * This function handles all cases and returns null for invalid dates.
 * 
 * @param {any} dateValue - Date value from MongoDB
 * @returns {Date|null} JavaScript Date object or null if invalid
 * 
 * @example
 * safeParseDate('2024-12-31T23:59:59.000Z') // Returns Date object
 * safeParseDate({ $date: '2024-12-31' }) // Returns Date object
 * safeParseDate(null) // Returns null
 */
function safeParseDate(dateValue) {
  if (!dateValue) return null;
  
  // Case 1: Already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // Case 2: MongoDB ISODate with $date property
  if (typeof dateValue === 'object' && dateValue.$date) {
    const parsed = new Date(dateValue.$date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // Case 3: String or number - try to parse it
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Check if a technician's subscription is currently active
 * 
 * This is critical for search visibility - technicians with inactive
 * subscriptions are hidden from search results.
 * 
 * Subscription Types:
 * 1. Trial: Free for 30 days, limited to 10km visibility
 * 2. Basic: 500 KES/month, 10km visibility
 * 3. Basic-Plus: 1000 KES/month, 50km visibility
 * 4. Premium: 1500 KES/month, 100km visibility
 * 5. Business: 2000 KES/month, 300km visibility
 * 6. Enterprise: 3000 KES/month, 600km visibility
 * 7. Unlimited: 5000 KES/month, 1000km visibility
 * 
 * @param {Object} technician - Technician document from MongoDB
 * @returns {boolean} True if subscription is active, false otherwise
 * 
 * @example
 * isSubscriptionActive(technician) // Returns true if subscription is valid
 */
function isSubscriptionActive(technician) {
  // If no subscription object exists, treat as inactive
  if (!technician.subscription) {
    console.log(`❌ Technician ${technician._id} has no subscription`);
    return false;
  }
  
  const { plan, endDate, trialEndDate, isTrial } = technician.subscription;
  const now = new Date();
  
  // Safely parse dates (handles MongoDB date formats)
  const parsedEndDate = safeParseDate(endDate);
  const parsedTrialEndDate = safeParseDate(trialEndDate);
  
  // Log subscription details for debugging
  console.log(`📋 Checking subscription for ${technician.businessName || technician._id}:`);
  console.log(`   Plan: ${plan}`);
  console.log(`   End Date: ${parsedEndDate ? parsedEndDate.toISOString() : 'NOT SET'}`);
  console.log(`   Trial End Date: ${parsedTrialEndDate ? parsedTrialEndDate.toISOString() : 'NOT SET'}`);
  console.log(`   Is Trial: ${isTrial || false}`);
  console.log(`   Current Time: ${now.toISOString()}`);
  
  // ===== HANDLE TRIAL SUBSCRIPTIONS =====
  // Trial plans are free for a limited time (usually 30 days)
  if (plan === 'trial' || isTrial === true) {
    if (parsedTrialEndDate) {
      const isValid = now < parsedTrialEndDate;
      console.log(`   Trial Active: ${isValid} ${isValid ? '✅' : '❌'} (ends ${parsedTrialEndDate.toISOString().split('T')[0]})`);
      return isValid;
    }
    console.log(`   Trial has no end date - INACTIVE ❌`);
    return false;
  }
  
  // ===== HANDLE PAID SUBSCRIPTIONS =====
  // Paid plans (basic, premium, business, etc.) have an end date
  if (parsedEndDate) {
    const isValid = now < parsedEndDate;
    console.log(`   Subscription Active: ${isValid} ${isValid ? '✅' : '❌'} (ends ${parsedEndDate.toISOString().split('T')[0]})`);
    return isValid;
  }
  
  // If no relevant dates provided, subscription is inactive
  console.log(`   No end date found - INACTIVE ❌`);
  return false;
}

/**
 * Get a technician's visibility radius based on their subscription plan
 * 
 * Visibility radius determines how far away a technician can be seen in searches.
 * Higher-tier plans have larger visibility radii.
 * 
 * Plan Visibility Mapping:
 * - Trial/Free: 10 km
 * - Basic: 10 km
 * - Basic-Plus: 50 km
 * - Premium: 100 km
 * - Business: 300 km
 * - Enterprise: 600 km
 * - Unlimited: 1000 km
 * 
 * @param {Object} technician - Technician document from MongoDB
 * @returns {number} Visibility radius in kilometers (default: 10km)
 * 
 * @example
 * getVisibilityRadius(technician) // Returns 100 for Premium plan
 */
function getVisibilityRadius(technician) {
  const DEFAULT_RADIUS = 10; // Default to 10km if no subscription found
  
  // If technician has no subscription, use default radius
  if (!technician || !technician.subscription) {
    console.log(`⚠️ No subscription for ${technician?.businessName}, default radius: ${DEFAULT_RADIUS}km`);
    return DEFAULT_RADIUS;
  }
  
  // First check if planDetails has visibilityRadius (more specific)
  if (technician.subscription.planDetails && technician.subscription.planDetails.visibilityRadius) {
    const radius = technician.subscription.planDetails.visibilityRadius;
    console.log(`📍 ${technician.businessName} visibility radius from planDetails: ${radius}km`);
    return radius;
  }
  
  // Map plan names to their visibility radii
  const planRadiusMap = {
    'trial': 10,
    'free': 10,
    'basic': 10,
    'basicPlus': 50,
    'basic-plus': 50,
    'premium': 100,
    'business': 300,
    'enterprise': 600,
    'unlimited': 1000
  };
  
  const plan = technician.subscription.plan;
  const radius = planRadiusMap[plan] || DEFAULT_RADIUS;
  console.log(`📍 ${technician.businessName} (${plan}) visibility radius: ${radius}km`);
  return radius;
}

/**
 * ===========================================
 * MAIN SEARCH CONTROLLER FUNCTIONS
 * ===========================================
 */

/**
 * MAIN SEARCH ENDPOINT
 * 
 * Searches for technicians based on various criteria including:
 * - mainCategory (matches Job model)
 * - serviceCategory (matches Job model)
 * - subService (matches Job model)
 * - Location (latitude/longitude with radius)
 * - Rating, price, and experience filters
 * 
 * The search respects subscription visibility radii - technicians
 * with inactive subscriptions are hidden from results.
 * 
 * @route   GET /api/search/technicians
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with matching technicians
 * 
 * @example
 * // Search by category only
 * GET /api/search/technicians?mainCategory=Plumbing
 * 
 * // Search by category with location
 * GET /api/search/technicians?mainCategory=Electrical%20Services&lat=-1.286389&lng=36.817223&radius=50
 * 
 * // Search by service category and sub-service
 * GET /api/search/technicians?serviceCategory=Network%20Setup&subService=WiFi%20Setup
 */
exports.searchTechnicians = async (req, res) => {
  try {
    // ===== EXTRACT QUERY PARAMETERS =====
    const {
      // Service filters - MATCH JOB MODEL FIELDS
      mainCategory,          // Changed from 'category' to match Job model
      serviceCategory,       // Matches Job model's serviceCategory
      subService,            // Matches Job model's subService
      searchTerm,            // Free-text search
      
      // Location filters
      lat,                   // Client's latitude
      lng,                   // Client's longitude
      radius = 1000,         // Search radius in kilometers (max 1000km)
      
      // Rating and price filters
      minRating,             // Minimum average rating (0-5)
      maxHourlyRate,         // Maximum hourly rate in KES
      minHourlyRate,         // Minimum hourly rate in KES
      
      // Additional filters
      minExperience,         // Minimum years of experience
      verificationStatus = 'verified', // Technician verification status
      isAvailable = true,    // Whether technician is currently available
      
      // Pagination
      page = 1,              // Page number (default: 1)
      limit = 20,            // Results per page (default: 20)
      
      // Sorting
      sortBy = 'distance',   // Sort field: distance, rating, price, experience
      sortOrder = 'asc'      // Sort order: asc or desc
    } = req.query;

    // Log search request for debugging
    console.log('\n🔍 ===== NEW SEARCH REQUEST =====');
    console.log('Parameters:', { 
      mainCategory, serviceCategory, subService, searchTerm, 
      lat, lng, radius 
    });

    // ===== VALIDATION =====
    // Ensure at least one search criteria is provided
    if (!mainCategory && !serviceCategory && !subService && !searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'At least one search criteria is required: mainCategory, serviceCategory, subService, or searchTerm'
      });
    }

    // Validate location coordinates if provided
    if (lat && lng && (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values'
      });
    }

    // Parse and validate numeric parameters
    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 1000;
    searchRadius = Math.min(Math.max(searchRadius, 1), 1000); // Clamp between 1-1000km

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ===== BUILD MONGOOSE QUERY =====
    const query = {
      isActive: true, // Only active technicians
      isAvailable: isAvailable === 'true' || isAvailable === true
    };

    // Add verification status filter
    if (verificationStatus) {
      const statusArray = Array.isArray(verificationStatus) ? verificationStatus : [verificationStatus];
      query.verificationStatus = { $in: statusArray };
    }

    // ===== SERVICE FILTERS (MATCHING JOB MODEL) =====
    
    // Filter by mainCategory (matches Job model's mainCategory)
    if (mainCategory) {
      query.category = { $regex: new RegExp(`^${mainCategory}$`, 'i') };
    }

    // Filter by serviceCategory and subService
    if (serviceCategory && subService) {
      // Both service category and sub-service specified
      query.serviceCategories = {
        $elemMatch: {
          categoryName: { $regex: new RegExp(`^${serviceCategory}$`, 'i') },
          subServices: { $in: [subService] }
        }
      };
    } else if (serviceCategory) {
      // Only service category specified
      query['serviceCategories.categoryName'] = { $regex: new RegExp(serviceCategory, 'i') };
    } else if (subService) {
      // Only sub-service specified
      query['serviceCategories.subServices'] = { $in: [subService] };
    }

    // Free-text search across multiple fields
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, 'i');
      query.$or = [
        { businessName: searchRegex },
        { category: searchRegex },
        { 'serviceCategories.categoryName': searchRegex },
        { 'serviceCategories.subServices': searchRegex },
        { aboutMe: searchRegex },
        { profileHeadline: searchRegex },
        { 'skills.name': searchRegex }
      ];
    }

    // ===== RATING AND PRICE FILTERS =====
    
    // Minimum rating filter
    if (minRating) {
      const ratingValue = parseFloat(minRating);
      if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
        query['rating.average'] = { $gte: ratingValue };
      }
    }

    // Price range filters (hourly rate in KES)
    if (maxHourlyRate || minHourlyRate) {
      query['pricing.hourlyRate'] = {};
      if (maxHourlyRate) query['pricing.hourlyRate'].$lte = parseFloat(maxHourlyRate);
      if (minHourlyRate) query['pricing.hourlyRate'].$gte = parseFloat(minHourlyRate);
    }

    // Experience filter
    if (minExperience) {
      const experience = parseFloat(minExperience);
      if (!isNaN(experience)) {
        query.yearsOfExperience = { $gte: experience };
      }
    }

    console.log('📊 Search query:', JSON.stringify(query, null, 2));

    // ===== EXECUTE DATABASE QUERY =====
    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email')
      .lean(); // Use lean() for better performance

    console.log(`📊 Found ${technicians.length} technicians matching criteria`);

    // ===== SUBSCRIPTION AND LOCATION FILTERING =====
    // This is done in JavaScript (not MongoDB) because:
    // 1. We need to calculate visibility radius per technician
    // 2. Subscription status requires complex date handling
    // 3. Distance calculation is easier in JS with Haversine formula
    
    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;
    
    const visibleTechnicians = [];

    console.log(`\n📋 Filtering ${technicians.length} technicians by subscription and location...`);

    // Iterate through each technician and apply filters
    for (const tech of technicians) {
      try {
        console.log(`\n--- Processing: ${tech.businessName || tech._id} ---`);
        
        // STEP 1: Check if subscription is active
        const isActive = isSubscriptionActive(tech);
        if (!isActive) {
          console.log(`❌ Filtered out: subscription inactive`);
          continue;
        }
        
        // STEP 2: Apply location-based filtering if coordinates provided
        if (latitude && longitude && tech.location?.coordinates) {
          const [techLng, techLat] = tech.location.coordinates;
          
          // Skip technicians with invalid coordinates (0,0 is default)
          if (techLat === 0 && techLng === 0) {
            console.log(`❌ Filtered out: invalid coordinates (0,0)`);
            continue;
          }
          
          // Calculate distance from client to technician
          const distance = calculateDistance(latitude, longitude, techLat, techLng);
          
          // Get technician's visibility radius based on their subscription
          const visibilityRadius = getVisibilityRadius(tech);
          
          console.log(`   Distance: ${distance}km`);
          console.log(`   Visibility Radius: ${visibilityRadius}km`);
          console.log(`   Search Radius: ${searchRadius}km`);
          
          // Check if technician is within BOTH visibility radius AND search radius
          if (distance <= visibilityRadius && distance <= searchRadius) {
            // Add calculated fields to technician object for response
            tech.distance = distance;
            tech.visibilityRadius = visibilityRadius;
            tech.subscriptionPlan = tech.subscription?.plan || 'trial';
            tech.isTrial = tech.subscription?.isTrial || tech.subscription?.plan === 'trial';
            visibleTechnicians.push(tech);
            console.log(`✅ INCLUDED: distance ${distance}km within limits`);
          } else {
            console.log(`❌ EXCLUDED: distance ${distance}km exceeds min(${visibilityRadius},${searchRadius})km`);
          }
        } else if (!latitude || !longitude) {
          // No location provided - include all active technicians
          tech.visibilityRadius = getVisibilityRadius(tech);
          tech.subscriptionPlan = tech.subscription?.plan || 'trial';
          tech.isTrial = tech.subscription?.isTrial || tech.subscription?.plan === 'trial';
          tech.distance = null;
          visibleTechnicians.push(tech);
          console.log(`✅ INCLUDED: no location filter`);
        } else {
          console.log(`❌ EXCLUDED: missing coordinates`);
        }
      } catch (err) {
        console.error(`Error processing technician ${tech._id}:`, err.message);
        continue; // Skip this technician on error
      }
    }

    console.log(`\n✅ Total visible technicians: ${visibleTechnicians.length}`);

    // ===== SORT RESULTS =====
    if (sortBy === 'distance' && latitude && longitude) {
      // Sort by distance (closest first)
      visibleTechnicians.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return sortOrder === 'asc' ? a.distance - b.distance : b.distance - a.distance;
      });
    } else if (sortBy === 'rating') {
      // Sort by average rating
      visibleTechnicians.sort((a, b) => {
        const ratingA = a.rating?.average || 0;
        const ratingB = b.rating?.average || 0;
        return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
    } else if (sortBy === 'price') {
      // Sort by hourly rate
      visibleTechnicians.sort((a, b) => {
        const priceA = a.pricing?.hourlyRate || 0;
        const priceB = b.pricing?.hourlyRate || 0;
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else if (sortBy === 'experience') {
      // Sort by years of experience
      visibleTechnicians.sort((a, b) => {
        const expA = a.yearsOfExperience || 0;
        const expB = b.yearsOfExperience || 0;
        return sortOrder === 'asc' ? expA - expB : expB - expA;
      });
    }

    // ===== PAGINATION =====
    const total = visibleTechnicians.length;
    const paginatedResults = visibleTechnicians.slice(skip, skip + limitNum);

    // ===== FORMAT RESPONSE =====
    const formattedResults = paginatedResults.map(tech => ({
      _id: tech._id,
      businessName: tech.businessName,
      category: tech.category,
      serviceCategories: tech.serviceCategories,
      aboutMe: tech.aboutMe,
      profileHeadline: tech.profileHeadline,
      skills: tech.skills,
      pricing: tech.pricing,
      rating: tech.rating,
      yearsOfExperience: tech.yearsOfExperience,
      distance: tech.distance,
      visibilityRadius: tech.visibilityRadius,
      subscriptionPlan: tech.subscriptionPlan,
      isTrial: tech.isTrial,
      isAvailable: tech.isAvailable,
      verificationStatus: tech.verificationStatus,
      location: tech.location,
      address: tech.address,
      user: tech.userId ? {
        _id: tech.userId._id,
        firstName: tech.userId.firstName,
        lastName: tech.userId.lastName,
        profileImage: tech.userId.profileImage,
        phone: tech.userId.phone,
        email: tech.userId.email
      } : null,
      portfolio: tech.portfolio?.slice(0, 3), // Show only first 3 portfolio items
      createdAt: tech.createdAt
    }));

    // ===== SEND RESPONSE =====
    res.json({
      success: true,
      count: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      searchRadius: searchRadius,
      locationProvided: !!(latitude && longitude),
      filters: {
        mainCategory: mainCategory || null,
        serviceCategory: serviceCategory || null,
        subService: subService || null,
        searchTerm: searchTerm || null,
        minRating: minRating || null,
        priceRange: {
          min: minHourlyRate || null,
          max: maxHourlyRate || null
        },
        minExperience: minExperience || null
      },
      data: formattedResults
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * GET TECHNICIANS BY SUB-SERVICE
 * 
 * Convenience endpoint to find technicians who offer a specific sub-service.
 * Useful for quick searches when the user knows exactly what service they need.
 * 
 * @route   GET /api/search/by-service
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with matching technicians
 * 
 * @example
 * GET /api/search/by-service?subService=WiFi%20Setup&lat=-1.286389&lng=36.817223
 */
exports.getTechniciansBySubService = async (req, res) => {
  try {
    const { subService, lat, lng, radius = 100, page = 1, limit = 20 } = req.query;

    // Validate required parameter
    if (!subService) {
      return res.status(400).json({
        success: false,
        message: 'subService query parameter is required'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query to find technicians with the specified sub-service
    const query = {
      isActive: true,
      isAvailable: true,
      verificationStatus: 'verified',
      'serviceCategories.subServices': subService
    };

    // Get total count for pagination
    const total = await Technician.countDocuments(query);

    // Find technicians
    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email')
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Apply subscription and location filtering (same logic as main search)
    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;
    
    const visibleTechnicians = [];

    for (const tech of technicians) {
      // Check subscription active
      if (!isSubscriptionActive(tech)) continue;
      
      // Apply location filtering if coordinates provided
      if (latitude && longitude && tech.location?.coordinates) {
        const [techLng, techLat] = tech.location.coordinates;
        
        if (techLat !== 0 || techLng !== 0) {
          const distance = calculateDistance(latitude, longitude, techLat, techLng);
          const searchRadius = parseFloat(radius);
          const visibilityRadius = getVisibilityRadius(tech);
          
          if (distance <= Math.min(visibilityRadius, searchRadius)) {
            tech.distance = distance;
            tech.visibilityRadius = visibilityRadius;
            visibleTechnicians.push(tech);
          }
        }
      } else if (!latitude || !longitude) {
        // No location filter - include all active technicians
        visibleTechnicians.push(tech);
      }
    }

    // Sort by distance if location provided
    if (latitude && longitude) {
      visibleTechnicians.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    res.json({
      success: true,
      count: visibleTechnicians.length,
      total: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: visibleTechnicians
    });

  } catch (error) {
    console.error('Error in getTechniciansBySubService:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET NEARBY TECHNICIANS
 * 
 * Finds technicians near a specific location without requiring a service category.
 * Uses the client's location to find all visible technicians in the area.
 * 
 * @route   GET /api/search/nearby
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with nearby technicians
 * 
 * @example
 * GET /api/search/nearby?lat=-1.286389&lng=36.817223&radius=10
 */
exports.getNearbyTechnicians = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 20 } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 10;
    searchRadius = Math.min(Math.max(searchRadius, 1), 1000);

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find all active technicians
    const technicians = await Technician.find({
      isActive: true,
      isAvailable: true,
      verificationStatus: 'verified'
    })
    .populate('userId', 'firstName lastName profileImage phone email')
    .lean();

    // Filter by subscription and distance
    const visibleTechnicians = [];

    for (const tech of technicians) {
      if (!isSubscriptionActive(tech)) continue;
      
      if (tech.location?.coordinates) {
        const [techLng, techLat] = tech.location.coordinates;
        
        if (techLat !== 0 || techLng !== 0) {
          const distance = calculateDistance(latitude, longitude, techLat, techLng);
          const visibilityRadius = getVisibilityRadius(tech);
          
          if (distance <= Math.min(visibilityRadius, searchRadius)) {
            tech.distance = distance;
            tech.visibilityRadius = visibilityRadius;
            tech.subscriptionPlan = tech.subscription?.plan || 'trial';
            visibleTechnicians.push(tech);
          }
        }
      }
    }

    // Sort by distance (closest first)
    visibleTechnicians.sort((a, b) => a.distance - b.distance);
    
    // Paginate
    const total = visibleTechnicians.length;
    const paginatedResults = visibleTechnicians.slice(skip, skip + limitNum);

    res.json({
      success: true,
      count: paginatedResults.length,
      total: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      searchRadius: searchRadius,
      data: paginatedResults
    });

  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET SEARCH SUGGESTIONS (Auto-complete)
 * 
 * Provides real-time search suggestions as the user types.
 * Searches across business names, categories, service categories, and sub-services.
 * 
 * @route   GET /api/search/suggestions
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with suggestions categorized by type
 * 
 * @example
 * GET /api/search/suggestions?q=plumb&limit=10
 * // Returns suggestions: ['Plumbing', 'Plumber', 'Pipe Repair', etc.]
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    // Require at least 2 characters for meaningful suggestions
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters'
      });
    }

    const searchRegex = new RegExp(q, 'i');
    const limitNum = parseInt(limit);
    
    // ===== GET BUSINESS NAME SUGGESTIONS =====
    const businesses = await Technician.find({
      businessName: searchRegex,
      isActive: true
    })
    .limit(limitNum)
    .select('businessName category')
    .lean();
    
    // ===== GET CATEGORY SUGGESTIONS =====
    const categories = await Technician.distinct('category', {
      category: searchRegex,
      isActive: true
    });
    
    // ===== GET SERVICE CATEGORY SUGGESTIONS =====
    const technicians = await Technician.find({
      'serviceCategories.categoryName': searchRegex,
      isActive: true
    })
    .select('serviceCategories')
    .limit(limitNum)
    .lean();
    
    const servicesSet = new Set();
    technicians.forEach(tech => {
      tech.serviceCategories?.forEach(cat => {
        if (searchRegex.test(cat.categoryName)) {
          servicesSet.add(cat.categoryName);
        }
      });
    });
    
    // ===== GET SUB-SERVICE SUGGESTIONS =====
    const allTechnicians = await Technician.find({
      'serviceCategories.subServices': searchRegex,
      isActive: true
    })
    .select('serviceCategories')
    .limit(limitNum)
    .lean();
    
    const subServicesSet = new Set();
    allTechnicians.forEach(tech => {
      tech.serviceCategories?.forEach(cat => {
        cat.subServices?.forEach(sub => {
          if (searchRegex.test(sub)) {
            subServicesSet.add(sub);
          }
        });
      });
    });
    
    // ===== COMBINE ALL SUGGESTIONS =====
    const suggestions = [
      ...businesses.map(b => ({ type: 'business', value: b.businessName, category: b.category })),
      ...categories.map(c => ({ type: 'category', value: c })),
      ...Array.from(servicesSet).map(s => ({ type: 'service', value: s })),
      ...Array.from(subServicesSet).map(s => ({ type: 'subservice', value: s }))
    ];
    
    res.json({
      success: true,
      query: q,
      suggestions: suggestions.slice(0, limitNum * 2) // Limit total suggestions
    });
    
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET AVAILABLE CATEGORIES
 * 
 * Fetches all available main categories from the Job model.
 * Used to populate the category dropdown in the search interface.
 * 
 * @route   GET /api/search/categories
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @returns {Object} JSON response with array of categories
 * 
 * @example
 * GET /api/search/categories
 * // Returns: { success: true, categories: ['Plumbing', 'Electrical Services', ...] }
 */
exports.getCategories = async (req, res) => {
  try {
    // Try to get distinct categories from Job model
    const Job = require('../models/Job');
    
    // Get categories from approved jobs
    const categories = await Job.distinct('mainCategory', {
      status: 'approved'
    });
    
    // If no jobs found, return the full list from Job model enum
    const defaultCategories = [
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
    
    res.json({
      success: true,
      categories: categories.length > 0 ? categories : defaultCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return default categories even on error
    const defaultCategories = [
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
    
    res.status(500).json({
      success: false,
      message: error.message,
      categories: defaultCategories // Provide fallback
    });
  }
};

// ===========================================
// EXPORT ALL CONTROLLER FUNCTIONS
// ===========================================

module.exports = {
  // Main search functions
  searchTechnicians,
  getTechniciansBySubService,
  getNearbyTechnicians,
  getSearchSuggestions,
  getCategories, // New function for category dropdown
  
  // Helper functions (exported for testing and reuse)
  getVisibilityRadius,
  isSubscriptionActive,
  calculateDistance
};