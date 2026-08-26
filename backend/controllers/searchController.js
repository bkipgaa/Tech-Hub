/**
 * searchController.js
 * ===================
 * Enhanced search for technicians with subscription‑based visibility radius
 * 
 * @version 2.2.0 – Fixed subscription expiration for free/trial (30 days)
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
 * - Free & Trial: active for 30 days from startDate (or createdAt if missing).
 * - Paid plans: active if endDate is in the future.
 * @param {Object} tech - The technician document (must include createdAt)
 * @returns {boolean} - True if subscription is active
 */
const isSubscriptionActive = (tech) => {
  // If no subscription object, treat as inactive (adjust if needed)
  if (!tech?.subscription) return false;

  const { plan, startDate, endDate, trialEndDate, isTrial } = tech.subscription;
  const now = new Date();

  // --- FREE PLAN: active for 30 days from startDate or createdAt ---
  if (plan === 'free') {
    // Use startDate if provided, otherwise fallback to technician's createdAt timestamp
    let start = startDate ? safeParseDate(startDate) : tech.createdAt;
    if (!start) return false; // Cannot determine start – treat as inactive
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + 30);
    return now < expiry;
  }

  // --- TRIAL PLAN: honour trialEndDate, or fallback to startDate+30 days ---
  if (plan === 'trial' || isTrial === true) {
    if (trialEndDate) {
      const parsed = safeParseDate(trialEndDate);
      return parsed ? now < parsed : false;
    } else {
      // If no trialEndDate, use startDate (or createdAt) + 30 days
      let start = startDate ? safeParseDate(startDate) : tech.createdAt;
      if (!start) return false;
      const expiry = new Date(start);
      expiry.setDate(expiry.getDate() + 30);
      return now < expiry;
    }
  }

  // --- PAID PLANS: endDate must exist and be in the future ---
  const parsedEnd = safeParseDate(endDate);
  return parsedEnd ? now < parsedEnd : false;
};

/**
 * Get visibility radius (km) based on subscription plan.
 * @param {Object} tech - Technician document
 * @returns {number} - Radius in km
 */
const getVisibilityRadius = (tech) => {
  const DEFAULT_RADIUS = 10;
  if (!tech?.subscription) return DEFAULT_RADIUS;

  // If planDetails has explicit radius, use it
  if (tech.subscription.planDetails?.visibilityRadius) {
    return tech.subscription.planDetails.visibilityRadius;
  }

  // Fallback mapping
  const map = {
    trial: 10,
    free: 10,
    basic: 10,
    basicPlus: 50,
    'basic-plus': 50,
    premium: 100,
    business: 300,
    enterprise: 600,
    unlimited: 1000,
  };
  return map[tech.subscription.plan] || DEFAULT_RADIUS;
};

/**
 * Haversine distance between two coordinates (km).
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

// ===========================================
// MAIN SEARCH FUNCTION
// ===========================================

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
      verificationStatus,      // now optional – we'll default to include pending+verified
      isAvailable = true,
      page = 1,
      limit = 20,
      sortBy = 'distance',
      sortOrder = 'asc'
    } = req.query;

    // 2. Validate at least one criterion
    if (!mainCategory && !serviceCategory && !subService && !searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'At least one search criteria is required'
      });
    }

    // 3. Validate coordinates if provided
    if (lat && lng && (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)))) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
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
      // If a comma‑separated list is provided, split it
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
      // Use case‑insensitive regex for subService to avoid case mismatches
      query.serviceCategories = {
        $elemMatch: {
          categoryName: { $regex: new RegExp(`^${serviceCategory}$`, 'i') },
          // For subServices, we use $in with exact match (case‑sensitive).
          // If case issues persist, switch to $regex: new RegExp(`^${subService}$`, 'i')
          subServices: { $in: [subService] }
        }
      };
    } else if (serviceCategory) {
      query['serviceCategories.categoryName'] = { $regex: new RegExp(serviceCategory, 'i') };
    } else if (subService) {
      // Search across all categories for this sub‑service
      query['serviceCategories.subServices'] = { $in: [subService] };
    }

    // --- TEXT SEARCH (multiple fields) ---
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
      .select('-portfolio.mediaUrl')  // exclude heavy field to improve performance
      .limit(200)
      .lean();

    // 7. Post‑processing: subscription check, distance calculation, visibility radius
    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;
    const visibleTechnicians = [];

    for (const tech of technicians) {
      try {
        // 7a. Subscription active? (now includes free/trial 30‑day logic)
        if (!isSubscriptionActive(tech)) continue;

        // 7b. If coordinates given, compute distance and enforce radii
        if (latitude && longitude && tech.location?.coordinates) {
          const [techLng, techLat] = tech.location.coordinates;
          if (techLat === 0 && techLng === 0) continue; // invalid location

          const distance = calculateDistance(latitude, longitude, techLat, techLng);
          const visibilityRadius = getVisibilityRadius(tech);

          if (distance <= visibilityRadius && distance <= searchRadius) {
            tech.distance = distance;
            tech.visibilityRadius = visibilityRadius;
            tech.subscriptionPlan = tech.subscription?.plan || 'trial';
            tech.isTrial = tech.subscription?.isTrial || tech.subscription?.plan === 'trial';
            visibleTechnicians.push(tech);
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
        // (If coordinates but no location, skip)
      } catch (err) {
        console.warn(`Error processing technician ${tech._id}:`, err.message);
        continue;
      }
    }

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
    console.error('Search error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===========================================
// OTHER EXPORTED FUNCTIONS (similarly updated)
// ===========================================

/**
 * Get technicians by a specific sub‑service (simplified)
 */
exports.getTechniciansBySubService = async (req, res) => {
  try {
    const { subService, lat, lng, radius = 100, page = 1, limit = 20 } = req.query;

    if (!subService) {
      return res.status(400).json({ success: false, message: 'subService is required' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = {
      isActive: true,
      isAvailable: true,
      verificationStatus: { $in: ['verified', 'pending'] },
      'serviceCategories.subServices': subService
    };

    const total = await Technician.countDocuments(query);

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
          const searchRadius = parseFloat(radius);
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
    console.error('BySubService error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get nearby technicians (distance‑only search)
 */
exports.getNearbyTechnicians = async (req, res) => {
  try {
    const { lat, lng, radius = 10, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 10;
    searchRadius = Math.min(Math.max(searchRadius, 1), 1000);

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const technicians = await Technician.find({
      isActive: true,
      isAvailable: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    })
    .populate('userId', 'firstName lastName profileImage phone email')
    .lean();

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
    console.error('Nearby search error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Search suggestions (autocomplete)
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Min 2 characters' });
    }

    const searchRegex = new RegExp(q, 'i');
    const limitNum = Math.min(parseInt(limit), 20);

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

    res.json({ success: true, query: q, suggestions: suggestions.slice(0, limitNum * 2) });

  } catch (error) {
    console.error('Suggestion error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all distinct main categories (with fallback)
 */
const DEFAULT_CATEGORIES = [
  'IT & Networking', 'Electrical Services', 'Mechanical Services', 'Plumbing',
  'Programming & AI', 'Hairdressing & Beauty', 'Carpentry & Furniture',
  'Laundry & Dry Cleaning', 'Cleaning Services', 'Painting & Decorating',
  'Welding & Fabrication', 'Automotive Repair', 'Tutoring & Training',
  'Photography & Videography', 'Event Planning', 'Construction & Renovation',
  'HVAC Services', 'Appliance Repair', 'Moving & Logistics', 'Gardening & Landscaping'
];

exports.getCategories = async (req, res) => {
  try {
    const categories = await Technician.distinct('mainCategory', {
      isActive: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    });

    res.json({
      success: true,
      categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES
    });
  } catch (error) {
    console.error('Categories error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      categories: DEFAULT_CATEGORIES
    });
  }
};

/**
 * Get full category tree (from ServiceCatalog or fallback to Technician data)
 */
exports.getFullCategories = async (req, res) => {
  try {
    let catalogs = await ServiceCatalog.find({ isActive: true })
      .select('mainCategory serviceCategories.name serviceCategories.subServices')
      .lean();

    if (!catalogs || catalogs.length === 0) {
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

    catalogs.forEach(cat => {
      cat.serviceCategories?.sort((a, b) => a.name.localeCompare(b.name));
      cat.serviceCategories?.forEach(sc => sc.subServices?.sort());
    });

    res.json({ success: true, categories: catalogs });

  } catch (error) {
    console.error('Full categories error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;