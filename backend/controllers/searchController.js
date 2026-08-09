/**
 * searchController.js
 * ===================
 * Enhanced search for technicians with subscription-based visibility radius
 * 
 * @version 2.1.0 - Optimized for production
 */

const mongoose = require('mongoose');
const Technician = require('../models/Technician');
const ServiceCatalog = require('../models/ServiceCatalog');

// ===========================================
// HELPERS
// ===========================================

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

const isSubscriptionActive = (technician) => {
  if (!technician?.subscription) return false;
  const { plan, endDate, trialEndDate, isTrial } = technician.subscription;
  const now = new Date();
  const parsedEndDate = safeParseDate(endDate);
  const parsedTrialEndDate = safeParseDate(trialEndDate);

  if (plan === 'trial' || isTrial === true) {
    return parsedTrialEndDate ? now < parsedTrialEndDate : false;
  }
  return parsedEndDate ? now < parsedEndDate : false;
};

const getVisibilityRadius = (technician) => {
  const DEFAULT_RADIUS = 10;
  if (!technician?.subscription) return DEFAULT_RADIUS;
  if (technician.subscription.planDetails?.visibilityRadius) {
    return technician.subscription.planDetails.visibilityRadius;
  }
  const map = {
    trial: 10, free: 10, basic: 10,
    basicPlus: 50, 'basic-plus': 50,
    premium: 100, business: 300,
    enterprise: 600, unlimited: 1000
  };
  return map[technician.subscription.plan] || DEFAULT_RADIUS;
};

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
// MAIN SEARCH
// ===========================================

exports.searchTechnicians = async (req, res) => {
  try {
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
      verificationStatus = 'verified',
      isAvailable = true,
      page = 1,
      limit = 20,
      sortBy = 'distance',
      sortOrder = 'asc'
    } = req.query;

    if (!mainCategory && !serviceCategory && !subService && !searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'At least one search criteria is required'
      });
    }

    if (lat && lng && (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng)))) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 1000;
    searchRadius = Math.min(Math.max(searchRadius, 1), 1000);

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    const skip = (pageNum - 1) * limitNum;

    const query = {
      isActive: true,
      isAvailable: isAvailable === 'true' || isAvailable === true
    };

    if (verificationStatus) {
      const statusArray = Array.isArray(verificationStatus) ? verificationStatus : [verificationStatus];
      query.verificationStatus = { $in: statusArray };
    }

    if (mainCategory) {
      query.mainCategory = { $regex: new RegExp(`^${mainCategory}$`, 'i') };
    }

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

    if (minRating) {
      const r = parseFloat(minRating);
      if (!isNaN(r) && r >= 0 && r <= 5) query['rating.average'] = { $gte: r };
    }

    if (maxHourlyRate || minHourlyRate) {
      query['pricing.hourlyRate'] = {};
      if (maxHourlyRate) query['pricing.hourlyRate'].$lte = parseFloat(maxHourlyRate);
      if (minHourlyRate) query['pricing.hourlyRate'].$gte = parseFloat(minHourlyRate);
    }

    if (minExperience) {
      const exp = parseFloat(minExperience);
      if (!isNaN(exp)) query.yearsOfExperience = { $gte: exp };
    }

    // Use lean() for performance, limit fields with select
    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email')
      .select('-portfolio.mediaUrl') // exclude heavy fields if not needed
      .limit(200) // safety cap to prevent memory explosion
      .lean();

    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;
    const visibleTechnicians = [];

    for (const tech of technicians) {
      try {
        if (!isSubscriptionActive(tech)) continue;

        if (latitude && longitude && tech.location?.coordinates) {
          const [techLng, techLat] = tech.location.coordinates;
          if (techLat === 0 && techLng === 0) continue;

          const distance = calculateDistance(latitude, longitude, techLat, techLng);
          const visibilityRadius = getVisibilityRadius(tech);

          if (distance <= visibilityRadius && distance <= searchRadius) {
            tech.distance = distance;
            tech.visibilityRadius = visibilityRadius;
            tech.subscriptionPlan = tech.subscription?.plan || 'trial';
            tech.isTrial = tech.subscription?.isTrial || tech.subscription?.plan === 'trial';
            visibleTechnicians.push(tech);
          }
        } else if (!latitude || !longitude) {
          tech.visibilityRadius = getVisibilityRadius(tech);
          tech.subscriptionPlan = tech.subscription?.plan || 'trial';
          tech.isTrial = tech.subscription?.isTrial || tech.subscription?.plan === 'trial';
          tech.distance = null;
          visibleTechnicians.push(tech);
        }
      } catch (err) {
        continue;
      }
    }

    // Sort
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

    const total = visibleTechnicians.length;
    const paginated = visibleTechnicians.slice(skip, skip + limitNum);

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
// BY SUB-SERVICE
// ===========================================

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
      verificationStatus: 'verified',
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

// ===========================================
// NEARBY
// ===========================================

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
      verificationStatus: 'verified'
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

// ===========================================
// SUGGESTIONS
// ===========================================

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: 'Min 2 characters' });
    }

    const searchRegex = new RegExp(q, 'i');
    const limitNum = Math.min(parseInt(limit), 20);

    // Parallel queries with limits
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

// ===========================================
// CATEGORIES
// ===========================================

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

// ===========================================
// FULL CATEGORIES (Service Catalog from Technicians)
// ===========================================

exports.getFullCategories = async (req, res) => {
  try {
    // Use ServiceCatalog if available (static catalog), fallback to Technician data
    let catalogs = await ServiceCatalog.find({ isActive: true })
      .select('mainCategory serviceCategories.name serviceCategories.subServices')
      .lean();

    // If ServiceCatalog is empty, build from technicians
    if (!catalogs || catalogs.length === 0) {
      const technicians = await Technician.find({
        isActive: true,
        verificationStatus: { $in: ['verified', 'pending'] }
      })
      .select('mainCategory serviceCategories.categoryName serviceCategories.subServices')
      .limit(500) // safety cap
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

    // Sort everything
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

// ===========================================
// EXPORT
// ===========================================

module.exports = exports;