/**
 * searchController.js
 * ===================
 * Enhanced search for technicians with subscription-based visibility radius
 * FIXED: Proper subscription checking, date handling, and category field mapping
 */

const mongoose = require('mongoose');
const Technician = require('../models/Technician');
const { subscriptionPlans, isPlanActive } = require('../utils/subscriptionPlans');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point (client)
 * @param {number} lon1 - Longitude of first point (client)
 * @param {number} lat2 - Latitude of second point (technician)
 * @param {number} lon2 - Longitude of second point (technician)
 * @returns {number} Distance in kilometers (rounded to 1 decimal place)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round((R * c) * 10) / 10;
}

/**
 * Helper function to safely parse MongoDB date objects
 * @param {any} dateValue - Date value from MongoDB (could be Date object, string, or MongoDB ISODate)
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
function safeParseDate(dateValue) {
  if (!dateValue) return null;
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // If it's a MongoDB ISODate (has $date property)
  if (typeof dateValue === 'object' && dateValue.$date) {
    const parsed = new Date(dateValue.$date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // If it's a string or number
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Check if technician's subscription is active
 * FIXED: Handles MongoDB Date objects properly
 */
function isSubscriptionActive(technician) {
  // If no subscription object exists, treat as inactive
  if (!technician.subscription) {
    console.log(`❌ Technician ${technician._id} has no subscription`);
    return false;
  }
  
  const { plan, endDate, trialEndDate, isTrial } = technician.subscription;
  const now = new Date();
  
  // Safely parse dates
  const parsedEndDate = safeParseDate(endDate);
  const parsedTrialEndDate = safeParseDate(trialEndDate);
  
  // Log for debugging
  console.log(`📋 Checking subscription for ${technician.businessName || technician._id}:`);
  console.log(`   Plan: ${plan}`);
  console.log(`   End Date: ${parsedEndDate ? parsedEndDate.toISOString() : 'NOT SET'}`);
  console.log(`   Trial End Date: ${parsedTrialEndDate ? parsedTrialEndDate.toISOString() : 'NOT SET'}`);
  console.log(`   Is Trial: ${isTrial || false}`);
  console.log(`   Current Time: ${now.toISOString()}`);
  
  // Handle trial subscriptions
  if (plan === 'trial' || isTrial === true) {
    if (parsedTrialEndDate) {
      const isValid = now < parsedTrialEndDate;
      console.log(`   Trial Active: ${isValid} ${isValid ? '✅' : '❌'} (ends ${parsedTrialEndDate.toISOString().split('T')[0]})`);
      return isValid;
    }
    console.log(`   Trial has no end date - INACTIVE ❌`);
    return false;
  }
  
  // Handle paid subscriptions (premium, business, basic, etc.)
  if (parsedEndDate) {
    const isValid = now < parsedEndDate;
    console.log(`   Subscription Active: ${isValid} ${isValid ? '✅' : '❌'} (ends ${parsedEndDate.toISOString().split('T')[0]})`);
    return isValid;
  }
  
  console.log(`   No end date found - INACTIVE ❌`);
  return false;
}

/**
 * Get technician's visibility radius based on subscription plan
 */
function getVisibilityRadius(technician) {
  const DEFAULT_RADIUS = 10;
  
  if (!technician || !technician.subscription) {
    console.log(`⚠️ No subscription for ${technician?.businessName}, default radius: ${DEFAULT_RADIUS}km`);
    return DEFAULT_RADIUS;
  }
  
  // First check if planDetails has visibilityRadius
  if (technician.subscription.planDetails && technician.subscription.planDetails.visibilityRadius) {
    const radius = technician.subscription.planDetails.visibilityRadius;
    console.log(`📍 ${technician.businessName} visibility radius from planDetails: ${radius}km`);
    return radius;
  }
  
  // Map plan names to visibility radii
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
 * MAIN SEARCH ENDPOINT
 * @route   GET /api/search/technicians
 */
exports.searchTechnicians = async (req, res) => {
  try {
    const {
      // Service filters
      category,
      serviceCategory,
      subService,
      searchTerm,
      
      // Location filters
      lat,
      lng,
      radius = 1000,
      
      // Rating and price filters
      minRating,
      maxHourlyRate,
      minHourlyRate,
      
      // Additional filters
      minExperience,
      verificationStatus = 'verified',
      isAvailable = true,
      
      // Pagination
      page = 1,
      limit = 20,
      
      // Sorting
      sortBy = 'distance',
      sortOrder = 'asc'
    } = req.query;

    console.log('\n🔍 ===== NEW SEARCH REQUEST =====');
    console.log('Parameters:', { category, serviceCategory, subService, searchTerm, lat, lng, radius });

    // ===== VALIDATION =====
    if (!category && !serviceCategory && !subService && !searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'At least one search criteria is required: category, serviceCategory, subService, or searchTerm'
      });
    }

    if (lat && lng && (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values'
      });
    }

    // Parse parameters
    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 1000;
    searchRadius = Math.min(Math.max(searchRadius, 1), 1000);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // ===== BUILD QUERY =====
    const query = {
      isActive: true,
      isAvailable: isAvailable === 'true' || isAvailable === true
    };

    // Add verification status filter
    if (verificationStatus) {
      const statusArray = Array.isArray(verificationStatus) ? verificationStatus : [verificationStatus];
      query.verificationStatus = { $in: statusArray };
    }

    // Service filters - using 'category' field
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Service category and sub-service filters
    if (serviceCategory && subService) {
      query.serviceCategories = {
        $elemMatch: {
          categoryName: { $regex: new RegExp(`^${serviceCategory}$`, 'i') },
          subServices: { $in: [subService] }
        }
      };
    } else if (serviceCategory) {
      query['serviceCategories.categoryName'] = { $regex: new RegExp(serviceCategory, 'i') };
    } else if (subService) {
      query['serviceCategories.subServices'] = { $in: [subService] };
    }

    // Search term
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

    // Rating filter
    if (minRating) {
      const ratingValue = parseFloat(minRating);
      if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
        query['rating.average'] = { $gte: ratingValue };
      }
    }

    // Price filters
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

    // Execute query
    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email')
      .lean();

    console.log(`📊 Found ${technicians.length} technicians matching criteria`);

    // Apply subscription and location filtering
    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;
    
    const visibleTechnicians = [];

    console.log(`\n📋 Filtering ${technicians.length} technicians...`);

    for (const tech of technicians) {
      try {
        console.log(`\n--- Processing: ${tech.businessName || tech._id} ---`);
        
        // Check subscription active
        const isActive = isSubscriptionActive(tech);
        
        if (!isActive) {
          console.log(`❌ Filtered out: subscription inactive`);
          continue;
        }
        
        // If location provided, check distance
        if (latitude && longitude && tech.location?.coordinates) {
          const [techLng, techLat] = tech.location.coordinates;
          
          // Skip invalid coordinates
          if (techLat === 0 && techLng === 0) {
            console.log(`❌ Filtered out: invalid coordinates (0,0)`);
            continue;
          }
          
          const distance = calculateDistance(latitude, longitude, techLat, techLng);
          const visibilityRadius = getVisibilityRadius(tech);
          
          console.log(`   Distance: ${distance}km`);
          console.log(`   Visibility Radius: ${visibilityRadius}km`);
          console.log(`   Search Radius: ${searchRadius}km`);
          
          // Check if within visibility radius AND search radius
          if (distance <= visibilityRadius && distance <= searchRadius) {
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
          // No location provided, include all active technicians
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
        continue;
      }
    }

    console.log(`\n✅ Total visible technicians: ${visibleTechnicians.length}`);

    // Sort results
    if (sortBy === 'distance' && latitude && longitude) {
      visibleTechnicians.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return sortOrder === 'asc' ? a.distance - b.distance : b.distance - a.distance;
      });
    } else if (sortBy === 'rating') {
      visibleTechnicians.sort((a, b) => {
        const ratingA = a.rating?.average || 0;
        const ratingB = b.rating?.average || 0;
        return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
    } else if (sortBy === 'price') {
      visibleTechnicians.sort((a, b) => {
        const priceA = a.pricing?.hourlyRate || 0;
        const priceB = b.pricing?.hourlyRate || 0;
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    } else if (sortBy === 'experience') {
      visibleTechnicians.sort((a, b) => {
        const expA = a.yearsOfExperience || 0;
        const expB = b.yearsOfExperience || 0;
        return sortOrder === 'asc' ? expA - expB : expB - expA;
      });
    }

    // Pagination
    const total = visibleTechnicians.length;
    const paginatedResults = visibleTechnicians.slice(skip, skip + limitNum);

    // Format response
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
      portfolio: tech.portfolio?.slice(0, 3),
      createdAt: tech.createdAt
    }));

    res.json({
      success: true,
      count: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      searchRadius: searchRadius,
      locationProvided: !!(latitude && longitude),
      filters: {
        category: category || null,
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
 * Get technicians by sub-service
 * @route   GET /api/search/by-service
 */
exports.getTechniciansBySubService = async (req, res) => {
  try {
    const { subService, lat, lng, radius = 100, page = 1, limit = 20 } = req.query;

    if (!subService) {
      return res.status(400).json({
        success: false,
        message: 'subService query parameter is required'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {
      isActive: true,
      isAvailable: true,
      verificationStatus: 'verified',
      'serviceCategories.subServices': subService
    };

    // Get total count
    const total = await Technician.countDocuments(query);

    // Find technicians
    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email')
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Apply subscription and location filtering
    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;
    
    const visibleTechnicians = [];

    for (const tech of technicians) {
      if (!isSubscriptionActive(tech)) continue;
      
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
 * Get nearby technicians
 * @route   GET /api/search/nearby
 */
exports.getNearbyTechnicians = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 20 } = req.query;

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

    // Find active technicians
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

    // Sort by distance
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
 * Get search suggestions (autocomplete)
 * @route   GET /api/search/suggestions
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters'
      });
    }

    const searchRegex = new RegExp(q, 'i');
    const limitNum = parseInt(limit);
    
    // Get business name suggestions
    const businesses = await Technician.find({
      businessName: searchRegex,
      isActive: true
    })
    .limit(limitNum)
    .select('businessName category')
    .lean();
    
    // Get category suggestions
    const categories = await Technician.distinct('category', {
      category: searchRegex,
      isActive: true
    });
    
    // Get service category suggestions
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
    
    // Get sub-service suggestions
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
    
    const suggestions = [
      ...businesses.map(b => ({ type: 'business', value: b.businessName, category: b.category })),
      ...categories.map(c => ({ type: 'category', value: c })),
      ...Array.from(servicesSet).map(s => ({ type: 'service', value: s })),
      ...Array.from(subServicesSet).map(s => ({ type: 'subservice', value: s }))
    ];
    
    res.json({
      success: true,
      query: q,
      suggestions: suggestions.slice(0, limitNum * 2)
    });
    
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export helper functions
exports.getVisibilityRadius = getVisibilityRadius;
exports.isSubscriptionActive = isSubscriptionActive;
exports.calculateDistance = calculateDistance;