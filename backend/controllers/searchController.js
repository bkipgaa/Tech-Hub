/**
 * searchController.js
 * ===================
 * Enhanced search for technicians with subscription‑based visibility radius
 * 
 * @version 2.3.0 – Fixed 'test' plan, improved error handling for Render logging
 * @author Weba-Hub Team
 */

const mongoose = require('mongoose');
const Technician = require('../models/Technician');
const ServiceCatalog = require('../models/ServiceCatalog');

// ===========================================
// HELPERS
// ===========================================

/**
 * Safely parse a date from various input formats.
 * @param {any} dateValue - Date string, object, or undefined
 * @returns {Date|null} - Parsed Date or null if invalid
 */
const safeParseDate = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return isNaN(dateValue.getTime()) ? null : dateValue;
  if (typeof dateValue === 'object' && dateValue.$date) {
    const parsed = new Date(dateValue.$date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Determine if a technician's subscription is active.
 * 
 * - FREE, TEST, TRIAL: active for 30 days from startDate (or createdAt).
 * - PAID plans: active if endDate is in the future.
 * 
 * @param {Object} tech - The technician document (must include createdAt)
 * @returns {boolean} - True if subscription is active
 */
const isSubscriptionActive = (tech) => {
  // If no subscription object, treat as inactive
  if (!tech?.subscription) {
    console.warn(`Technician ${tech?._id} has no subscription object`);
    return false;
  }

  const { plan, startDate, endDate, trialEndDate, isTrial } = tech.subscription;
  const now = new Date();

  // --- FREE, TEST, TRIAL: 30 days from startDate or createdAt ---
  if (plan === 'free' || plan === 'test' || plan === 'trial' || isTrial === true) {
    // Explicit trialEndDate takes precedence for trial plans
    if ((plan === 'trial' || isTrial === true) && trialEndDate) {
      const parsed = safeParseDate(trialEndDate);
      if (!parsed) {
        console.warn(`Technician ${tech._id} has invalid trialEndDate`);
        return false;
      }
      return now < parsed;
    }

    // Otherwise use startDate or fallback to createdAt
    let start = startDate ? safeParseDate(startDate) : tech.createdAt;
    if (!start) {
      console.warn(`Technician ${tech._id} has no startDate or createdAt`);
      return false;
    }
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + 30);
    return now < expiry;
  }

  // --- PAID PLANS: endDate must exist and be in the future ---
  const parsedEnd = safeParseDate(endDate);
  if (!parsedEnd) {
    console.warn(`Technician ${tech._id} has paid plan but no valid endDate`);
    return false;
  }
  return now < parsedEnd;
};

/**
 * Get visibility radius (km) based on subscription plan.
 * @param {Object} tech - Technician document
 * @returns {number} - Radius in km
 */
const getVisibilityRadius = (tech) => {
  const DEFAULT_RADIUS = 10;
  if (!tech?.subscription) {
    console.warn(`Technician ${tech?._id} has no subscription, using default radius ${DEFAULT_RADIUS}km`);
    return DEFAULT_RADIUS;
  }

  // If planDetails has explicit radius, use it
  if (tech.subscription.planDetails?.visibilityRadius) {
    return tech.subscription.planDetails.visibilityRadius;
  }

  // Fallback mapping (includes 'test' at 20km)
  const map = {
    trial: 10,
    free: 10,
    test: 20,           // <-- test plan: 20km visibility
    basic: 10,
    basicPlus: 50,
    'basic-plus': 50,
    premium: 100,
    business: 300,
    enterprise: 600,
    unlimited: 1000,
  };
  const radius = map[tech.subscription.plan] || DEFAULT_RADIUS;
  return radius;
};

/**
 * Haversine distance between two coordinates (km).
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in km (rounded to 1 decimal)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round((R * c) * 10) / 10;
}

/**
 * Build a consistent error response for the frontend and Render logs.
 * @param {Error} error - The caught error
 * @param {string} fallbackMessage - User‑friendly message
 * @param {number} status - HTTP status code
 * @param {string} endpoint - API endpoint name for logging
 * @returns {Object} - Express response object
 */
const handleControllerError = (res, error, fallbackMessage, status = 500, endpoint = 'unknown') => {
  // Log the full error to Render console (visible in logs)
  console.error(`[${endpoint}] Error:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    status: status,
    timestamp: new Date().toISOString(),
  });

  // Send a clean response to the client
  const response = {
    success: false,
    message: fallbackMessage,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack,
    }),
  };

  // Specific database error handling
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    response.databaseError = true;
    response.message = 'Database error. Please try again later.';
  } else if (error.name === 'ValidationError') {
    response.message = 'Invalid data provided.';
    response.details = error.message;
    status = 400;
  } else if (error.name === 'CastError') {
    response.message = 'Invalid ID format.';
    status = 400;
  }

  res.status(status).json(response);
};

// ===========================================
// MAIN SEARCH FUNCTION
// ===========================================

/**
 * Search technicians with filters, subscription validation, and distance filtering.
 * Route: GET /api/search/technicians
 */
exports.searchTechnicians = async (req, res) => {
  try {
    // 1. Extract query parameters with defaults
    const {
      mainCategory,
      serviceCategory,
      subService,
      searchTerm,
      lat,
      lng,
      radius = 1000,
      minRating,
      maxHourlyRate,
      minHourlyRate,
      minExperience,
      verificationStatus,
      isAvailable = true,
      page = 1,
      limit = 20,
      sortBy = 'distance',
      sortOrder = 'asc'
    } = req.query;

    // 2. Validate at least one criterion
    if (!mainCategory && !serviceCategory && !subService && !searchTerm) {
      return handleControllerError(
        res,
        new Error('At least one search criteria is required'),
        'At least one search criteria is required (mainCategory, serviceCategory, subService, or searchTerm)',
        400,
        'searchTechnicians'
      );
    }

    // 3. Validate coordinates if provided
    if (lat && lng && (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)))) {
      return handleControllerError(
        res,
        new Error('Invalid coordinates'),
        'Invalid latitude or longitude values provided.',
        400,
        'searchTechnicians'
      );
    }

    // 4. Sanitise numeric inputs
    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 1000;
    searchRadius = Math.min(Math.max(searchRadius, 1), 1000);

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    const skip = (pageNum - 1) * limitNum;

    // 5. Build MongoDB query
    const query = {
      isActive: true,
      isAvailable: isAvailable === 'true' || isAvailable === true
    };

    // --- VERIFICATION STATUS: include 'verified' and 'pending' by default ---
    if (verificationStatus) {
      const statusArray = Array.isArray(verificationStatus)
        ? verificationStatus
        : verificationStatus.split(',');
      query.verificationStatus = { $in: statusArray };
    } else {
      // Default: show both verified and pending technicians
      query.verificationStatus = { $in: ['verified', 'pending'] };
    }

    // --- MAIN CATEGORY (exact, case‑insensitive) ---
    if (mainCategory) {
      query.mainCategory = { $regex: new RegExp(`^${mainCategory}$`, 'i') };
    }

    // --- SERVICE CATEGORY & SUB‑SERVICE (nested) ---
    if (serviceCategory && subService) {
      // Case‑sensitive exact match for subService – consider using $regex if needed
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

    // --- TEXT SEARCH ---
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      query.$or = [
        { businessName: regex },
        { mainCategory: regex },
        { 'serviceCategories.categoryName': regex },
        { 'serviceCategories.subServices': regex },
        { aboutMe: regex },
        { profileHeadline: regex },
        { 'skills.name': regex }
      ];
    }

    // --- RATING ---
    if (minRating) {
      const r = parseFloat(minRating);
      if (!isNaN(r) && r >= 0 && r <= 5) {
        query['rating.average'] = { $gte: r };
      }
    }

    // --- HOURLY RATE ---
    if (maxHourlyRate || minHourlyRate) {
      query['pricing.hourlyRate'] = {};
      if (maxHourlyRate) query['pricing.hourlyRate'].$lte = parseFloat(maxHourlyRate);
      if (minHourlyRate) query['pricing.hourlyRate'].$gte = parseFloat(minHourlyRate);
    }

    // --- EXPERIENCE ---
    if (minExperience) {
      const exp = parseFloat(minExperience);
      if (!isNaN(exp)) query.yearsOfExperience = { $gte: exp };
    }

    // 6. Execute database query (lean, limit to 200 for safety)
    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email')
      .select('-portfolio.mediaUrl')
      .limit(200)
      .lean();

    // Log how many technicians were found before filtering (for debugging on Render)
    console.log(`[searchTechnicians] Found ${technicians.length} technician(s) in database for query:`, JSON.stringify(query));

    // 7. Post‑processing: subscription check, distance calculation, visibility radius
    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;
    const visibleTechnicians = [];

    for (const tech of technicians) {
      try {
        // 7a. Subscription active? (includes 'test' plan now)
        if (!isSubscriptionActive(tech)) {
          console.log(`[searchTechnicians] Technician ${tech._id} skipped: subscription inactive`);
          continue;
        }

        // 7b. If coordinates given, compute distance and enforce radii
        if (latitude && longitude && tech.location?.coordinates) {
          const [techLng, techLat] = tech.location.coordinates;
          if (techLat === 0 && techLng === 0) {
            console.log(`[searchTechnicians] Technician ${tech._id} skipped: coordinates (0,0)`);
            continue;
          }

          const distance = calculateDistance(latitude, longitude, techLat, techLng);
          const visibilityRadius = getVisibilityRadius(tech);

          if (distance <= visibilityRadius && distance <= searchRadius) {
            tech.distance = distance;
            tech.visibilityRadius = visibilityRadius;
            tech.subscriptionPlan = tech.subscription?.plan || 'trial';
            tech.isTrial = tech.subscription?.isTrial || tech.subscription?.plan === 'trial';
            visibleTechnicians.push(tech);
          } else {
            console.log(`[searchTechnicians] Technician ${tech._id} skipped: distance ${distance}km exceeds radius (visibility ${visibilityRadius}km, search ${searchRadius}km)`);
          }
        }
        // 7c. No coordinates – include without distance filter
        else if (!latitude || !longitude) {
          tech.visibilityRadius = getVisibilityRadius(tech);
          tech.subscriptionPlan = tech.subscription?.plan || 'trial';
          tech.isTrial = tech.subscription?.isTrial || tech.subscription?.plan === 'trial';
          tech.distance = null;
          visibleTechnicians.push(tech);
        }
      } catch (err) {
        console.warn(`[searchTechnicians] Error processing technician ${tech._id}:`, err.message);
        continue;
      }
    }

    console.log(`[searchTechnicians] ${visibleTechnicians.length} technician(s) passed filtering`);

    // 8. Sorting
    if (sortBy === 'distance' && latitude && longitude) {
      visibleTechnicians.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return sortOrder === 'asc' ? a.distance - b.distance : b.distance - a.distance;
      });
    } else if (sortBy === 'rating') {
      visibleTechnicians.sort((a, b) => {
        const ra = a.rating?.average || 0;
        const rb = b.rating?.average || 0;
        return sortOrder === 'asc' ? ra - rb : rb - ra;
      });
    } else if (sortBy === 'price') {
      visibleTechnicians.sort((a, b) => {
        const pa = a.pricing?.hourlyRate || 0;
        const pb = b.pricing?.hourlyRate || 0;
        return sortOrder === 'asc' ? pa - pb : pb - pa;
      });
    } else if (sortBy === 'experience') {
      visibleTechnicians.sort((a, b) => {
        const ea = a.yearsOfExperience || 0;
        const eb = b.yearsOfExperience || 0;
        return sortOrder === 'asc' ? ea - eb : eb - ea;
      });
    }

    // 9. Pagination
    const total = visibleTechnicians.length;
    const paginated = visibleTechnicians.slice(skip, skip + limitNum);

    // 10. Format response
    const formatted = paginated.map(tech => ({
      _id: tech._id,
      businessName: tech.businessName,
      mainCategory: tech.mainCategory,
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

    // 11. Send response
    res.json({
      success: true,
      count: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      searchRadius,
      locationProvided: !!(latitude && longitude),
      data: formatted
    });

  } catch (error) {
    handleControllerError(res, error, 'An error occurred while searching for technicians.', 500, 'searchTechnicians');
  }
};

// ===========================================
// GET TECHNICIANS BY SUB‑SERVICE
// ===========================================

/**
 * Get technicians by a specific sub‑service (simplified).
 * Route: GET /api/search/by-sub-service
 */
exports.getTechniciansBySubService = async (req, res) => {
  try {
    const { subService, lat, lng, radius = 100, page = 1, limit = 20 } = req.query;

    if (!subService) {
      return handleControllerError(
        res,
        new Error('subService is required'),
        'subService parameter is required.',
        400,
        'getTechniciansBySubService'
      );
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const skip = (pageNum - 1) * limitNum;

    const query = {
      isActive: true,
      isAvailable: true,
      verificationStatus: { $in: ['verified', 'pending'] },
      'serviceCategories.subServices': subService
    };

    const total = await Technician.countDocuments(query);
    console.log(`[getTechniciansBySubService] Found ${total} total technicians for subService: "${subService}"`);

    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email')
      .skip(skip)
      .limit(limitNum)
      .lean();

    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;
    const visible = [];

    for (const tech of technicians) {
      if (!isSubscriptionActive(tech)) continue;

      if (latitude && longitude && tech.location?.coordinates) {
        const [techLng, techLat] = tech.location.coordinates;
        if (techLat !== 0 || techLng !== 0) {
          const distance = calculateDistance(latitude, longitude, techLat, techLng);
          const searchRadius = parseFloat(radius) || 100;
          const visibilityRadius = getVisibilityRadius(tech);
          if (distance <= Math.min(visibilityRadius, searchRadius)) {
            tech.distance = distance;
            tech.visibilityRadius = visibilityRadius;
            visible.push(tech);
          }
        }
      } else if (!latitude || !longitude) {
        visible.push(tech);
      }
    }

    if (latitude && longitude) {
      visible.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    const formatted = visible.map(tech => ({
      _id: tech._id,
      businessName: tech.businessName,
      mainCategory: tech.mainCategory,
      serviceCategories: tech.serviceCategories,
      aboutMe: tech.aboutMe,
      profileHeadline: tech.profileHeadline,
      skills: tech.skills,
      pricing: tech.pricing,
      rating: tech.rating,
      yearsOfExperience: tech.yearsOfExperience,
      distance: tech.distance,
      visibilityRadius: tech.visibilityRadius,
      subscriptionPlan: tech.subscription?.plan || 'trial',
      isTrial: tech.subscription?.isTrial || tech.subscription?.plan === 'trial',
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
      count: visible.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: formatted
    });

  } catch (error) {
    handleControllerError(res, error, 'An error occurred while fetching technicians by sub‑service.', 500, 'getTechniciansBySubService');
  }
};

// ===========================================
// GET NEARBY TECHNICIANS
// ===========================================

/**
 * Get nearby technicians (distance‑only search).
 * Route: GET /api/search/nearby
 */
exports.getNearbyTechnicians = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) {
      return handleControllerError(
        res,
        new Error('Latitude and longitude required'),
        'Both latitude (lat) and longitude (lng) are required.',
        400,
        'getNearbyTechnicians'
      );
    }

    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 10;
    searchRadius = Math.min(Math.max(searchRadius, 1), 1000);

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 50);
    const skip = (pageNum - 1) * limitNum;

    if (isNaN(latitude) || isNaN(longitude)) {
      return handleControllerError(
        res,
        new Error('Invalid coordinates'),
        'Invalid latitude or longitude values.',
        400,
        'getNearbyTechnicians'
      );
    }

    const technicians = await Technician.find({
      isActive: true,
      isAvailable: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    })
    .populate('userId', 'firstName lastName profileImage phone email')
    .lean();

    console.log(`[getNearbyTechnicians] Found ${technicians.length} active technicians`);

    const visible = [];

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
            visible.push(tech);
          }
        }
      }
    }

    visible.sort((a, b) => a.distance - b.distance);
    const total = visible.length;
    const paginated = visible.slice(skip, skip + limitNum);

    const formatted = paginated.map(tech => ({
      _id: tech._id,
      businessName: tech.businessName,
      mainCategory: tech.mainCategory,
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
      count: paginated.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      searchRadius,
      data: formatted
    });

  } catch (error) {
    handleControllerError(res, error, 'An error occurred while finding nearby technicians.', 500, 'getNearbyTechnicians');
  }
};

// ===========================================
// SEARCH SUGGESTIONS (AUTOCOMPLETE)
// ===========================================

/**
 * Get autocomplete suggestions for search.
 * Route: GET /api/search/suggestions
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) {
      return handleControllerError(
        res,
        new Error('Query too short'),
        'Please enter at least 2 characters for suggestions.',
        400,
        'getSearchSuggestions'
      );
    }

    const searchRegex = new RegExp(q, 'i');
    const limitNum = Math.min(parseInt(limit) || 10, 20);

    const [businesses, categories, serviceTechs, subServiceTechs] = await Promise.all([
      Technician.find({ businessName: searchRegex, isActive: true })
        .limit(limitNum)
        .select('businessName mainCategory')
        .lean(),

      Technician.distinct('mainCategory', { mainCategory: searchRegex, isActive: true }),

      Technician.find({ 'serviceCategories.categoryName': searchRegex, isActive: true })
        .limit(limitNum)
        .select('serviceCategories')
        .lean(),

      Technician.find({ 'serviceCategories.subServices': searchRegex, isActive: true })
        .limit(limitNum)
        .select('serviceCategories')
        .lean()
    ]);

    const servicesSet = new Set();
    serviceTechs.forEach(tech => {
      tech.serviceCategories?.forEach(cat => {
        if (searchRegex.test(cat.categoryName)) servicesSet.add(cat.categoryName);
      });
    });

    const subServicesSet = new Set();
    subServiceTechs.forEach(tech => {
      tech.serviceCategories?.forEach(cat => {
        cat.subServices?.forEach(sub => {
          if (searchRegex.test(sub)) subServicesSet.add(sub);
        });
      });
    });

    const suggestions = [
      ...businesses.map(b => ({ type: 'business', value: b.businessName, category: b.mainCategory })),
      ...categories.map(c => ({ type: 'category', value: c })),
      ...Array.from(servicesSet).map(s => ({ type: 'service', value: s })),
      ...Array.from(subServicesSet).map(s => ({ type: 'subservice', value: s }))
    ];

    console.log(`[getSearchSuggestions] Query "${q}" returned ${suggestions.length} suggestions`);

    res.json({
      success: true,
      query: q,
      suggestions: suggestions.slice(0, limitNum * 2)
    });

  } catch (error) {
    handleControllerError(res, error, 'An error occurred while fetching suggestions.', 500, 'getSearchSuggestions');
  }
};

// ===========================================
// GET CATEGORIES
// ===========================================

const DEFAULT_CATEGORIES = [
  'IT & Networking', 'Electrical Services', 'Mechanical Services', 'Plumbing',
  'Programming & AI', 'Hairdressing & Beauty', 'Carpentry & Furniture',
  'Laundry & Dry Cleaning', 'Cleaning Services', 'Painting & Decorating',
  'Welding & Fabrication', 'Automotive Repair', 'Tutoring & Training',
  'Photography & Videography', 'Event Planning', 'Construction & Renovation',
  'HVAC Services', 'Appliance Repair', 'Moving & Logistics', 'Gardening & Landscaping'
];

/**
 * Get all distinct main categories.
 * Route: GET /api/search/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Technician.distinct('mainCategory', {
      isActive: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    });

    console.log(`[getCategories] Found ${categories.length} distinct categories`);

    res.json({
      success: true,
      categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES
    });
  } catch (error) {
    handleControllerError(res, error, 'An error occurred while fetching categories.', 500, 'getCategories');
  }
};

// ===========================================
// GET FULL CATEGORY TREE
// ===========================================

/**
 * Get full category tree (from ServiceCatalog or fallback to Technician data).
 * Route: GET /api/search/categories/full
 */
exports.getFullCategories = async (req, res) => {
  try {
    // First, try to get from ServiceCatalog
    let catalogs = await ServiceCatalog.find({ isActive: true })
      .select('mainCategory serviceCategories.name serviceCategories.subServices')
      .lean();

    // If ServiceCatalog is empty, build from technicians
    if (!catalogs || catalogs.length === 0) {
      console.log('[getFullCategories] ServiceCatalog empty, building from Technician data');
      const technicians = await Technician.find({
        isActive: true,
        verificationStatus: { $in: ['verified', 'pending'] }
      })
      .select('mainCategory serviceCategories.categoryName serviceCategories.subServices')
      .limit(500)
      .lean();

      const categoryMap = {};
      technicians.forEach(tech => {
        if (!tech.mainCategory) return;
        if (!categoryMap[tech.mainCategory]) {
          categoryMap[tech.mainCategory] = { mainCategory: tech.mainCategory, serviceCategories: [] };
        }

        (tech.serviceCategories || []).forEach(sc => {
          let existing = categoryMap[tech.mainCategory].serviceCategories.find(
            s => s.name === sc.categoryName
          );
          if (!existing) {
            existing = { name: sc.categoryName, subServices: [] };
            categoryMap[tech.mainCategory].serviceCategories.push(existing);
          }
          (sc.subServices || []).forEach(sub => {
            if (!existing.subServices.includes(sub)) existing.subServices.push(sub);
          });
        });
      });

      catalogs = Object.values(categoryMap);
    }

    // Sort everything alphabetically
    catalogs.forEach(cat => {
      cat.serviceCategories?.sort((a, b) => a.name.localeCompare(b.name));
      cat.serviceCategories?.forEach(sc => sc.subServices?.sort());
    });

    console.log(`[getFullCategories] Returning ${catalogs.length} main categories`);

    res.json({
      success: true,
      categories: catalogs
    });

  } catch (error) {
    handleControllerError(res, error, 'An error occurred while fetching the full category tree.', 500, 'getFullCategories');
  }
};

// ===========================================
// EXPORT
// ===========================================

module.exports = exports;