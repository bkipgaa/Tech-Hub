const ServiceCatalog = require('../models/ServiceCatalog');
const Technician = require('../models/Technician');
const searchController = require('./searchController');
const mongoose = require('mongoose');

// ===========================================
// SIMPLE IN-MEMORY CACHE (resets on deploy)
// ===========================================
const cache = {
  mainCategories: { data: null, timestamp: 0 },
  categories: new Map(),      // key: mainCategory
  fullCatalogs: new Map(),    // key: mainCategory
  subServices: new Map(),     // key: `${mainCategory}|${serviceCategory}`
  popular: { data: null, timestamp: 0 }
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const isStale = (timestamp) => Date.now() - timestamp > CACHE_TTL;

// Helper to safely get enum values
const getTechnicianCategories = () => {
  try {
    const path = Technician.schema.path('category');
    if (path?.enumValues?.length) return path.enumValues;
  } catch (e) { /* fallback below */ }
  return [
    'IT & Networking', 'Electrical Services', 'Mechanical Services', 'Plumbing',
    'Programming & AI', 'Hairdressing & Beauty', 'Carpentry & Furniture',
    'Laundry & Dry Cleaning', 'Cleaning Services', 'Painting & Decorating',
    'Welding & Fabrication', 'Automotive Repair', 'Tutoring & Training',
    'Photography & Videography', 'Event Planning', 'Construction & Renovation',
    'HVAC Services', 'Appliance Repair', 'Moving & Logistics', 'Gardening & Landscaping'
  ];
};

const dbConnected = () => mongoose.connection.readyState === 1;

// ===========================================
// MAIN CATEGORIES — cached, lean, fast
// ===========================================
exports.getMainCategories = async (req, res) => {
  try {
    // Return cached copy if still fresh
    if (cache.mainCategories.data && !isStale(cache.mainCategories.timestamp)) {
      return res.json({ ...cache.mainCategories.data, cached: true });
    }

    const categories = getTechnicianCategories();
    let activeCatalogs = [];

    if (dbConnected()) {
      // .lean() returns plain JS objects instead of heavy Mongoose docs
      activeCatalogs = await ServiceCatalog.find({ isActive: true })
        .select('mainCategory')
        .lean();
    }

    const activeSet = new Set(activeCatalogs.map(c => c.mainCategory));
    const data = categories.map(cat => ({
      name: cat,
      hasServices: activeSet.has(cat),
      description: activeSet.has(cat)
        ? `${cat} services available for booking`
        : `${cat} services coming soon`
    }));

    const payload = {
      success: true,
      count: data.length,
      data,
      metadata: { totalActive: activeSet.size, lastUpdated: new Date().toISOString() }
    };

    cache.mainCategories = { data: payload, timestamp: Date.now() };
    res.json(payload);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch categories',
      data: getTechnicianCategories().map(c => ({ name: c, hasServices: false }))
    });
  }
};

// ===========================================
// SERVICE CATEGORIES — aggregation projection
// ===========================================
exports.getServiceCategoriesByMain = async (req, res) => {
  try {
    const { mainCategory } = req.params;
    if (!mainCategory?.trim()) {
      return res.status(400).json({ success: false, message: 'Main category is required' });
    }
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable', data: [] });
    }

    // Use aggregation to reshape data INSIDE MongoDB instead of loading everything into Node
    const [catalog] = await ServiceCatalog.aggregate([
      { $match: { mainCategory, isActive: true } },
      { $project: {
          updatedAt: 1,
          version: 1,
          serviceCategories: {
            $filter: {
              input: '$serviceCategories',
              as: 'c',
              cond: { $ne: ['$$c.isActive', false] }
            }
          }
      }},
      { $project: {
          updatedAt: 1,
          version: 1,
          serviceCategories: {
            $map: {
              input: '$serviceCategories',
              as: 'c',
              in: {
                id: '$$c._id',
                name: '$$c.name',
                description: { $ifNull: ['$$c.description', { $concat: ['$$c.name', ' services'] }] },
                icon: '$$c.icon',
                image: '$$c.image',
                displayOrder: { $ifNull: ['$$c.displayOrder', 0] },
                tags: { $ifNull: ['$$c.tags', []] },
                subServiceCount: { $size: { $ifNull: ['$$c.subServices', []] } },
                sampleSubServices: {
                  $slice: [
                    { $map: {
                        input: { $filter: {
                          input: { $ifNull: ['$$c.subServices', []] },
                          as: 's',
                          cond: { $ne: ['$$s.isActive', false] }
                        }},
                        as: 's',
                        in: { name: '$$s.name', description: { $ifNull: ['$$s.description', ''] } }
                    }},
                    3
                  ]
                }
              }
            }
          }
      }}
    ]);

    if (!catalog) {
      return res.status(404).json({ success: false, message: `No services available for ${mainCategory}`, data: [] });
    }

    res.json({
      success: true,
      count: catalog.serviceCategories?.length || 0,
      data: catalog.serviceCategories,
      metadata: { mainCategory, catalogVersion: catalog.version || 1, lastUpdated: catalog.updatedAt }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// SUB-SERVICES — targeted aggregation
// ===========================================
exports.getSubServices = async (req, res) => {
  try {
    const { mainCategory, serviceCategory } = req.params;
    if (!mainCategory || !serviceCategory) {
      return res.status(400).json({ success: false, message: 'Both parameters required' });
    }
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const cacheKey = `${mainCategory}|${serviceCategory}`;
    const cached = cache.subServices.get(cacheKey);
    if (cached && !isStale(cached.timestamp)) {
      return res.json({ ...cached.data, cached: true });
    }

    // Aggregation: match the doc, filter to the ONE category, project only needed fields
    const [result] = await ServiceCatalog.aggregate([
      { $match: { mainCategory, isActive: true } },
      { $project: {
          updatedAt: 1,
          serviceCategories: {
            $filter: {
              input: '$serviceCategories',
              as: 'c',
              cond: { $eq: ['$$c.name', serviceCategory] }
            }
          }
      }},
      { $unwind: '$serviceCategories' },
      { $project: {
          updatedAt: 1,
          categoryId: '$serviceCategories._id',
          categoryName: '$serviceCategories.name',
          categoryDescription: { $ifNull: ['$serviceCategories.description', ''] },
          categoryIcon: '$serviceCategories.icon',
          categoryTags: { $ifNull: ['$serviceCategories.tags', []] },
          subServices: {
            $filter: {
              input: { $ifNull: ['$serviceCategories.subServices', []] },
              as: 's',
              cond: { $ne: ['$$s.isActive', false] }
            }
          }
      }},
      { $project: {
          updatedAt: 1,
          categoryId: 1,
          categoryName: 1,
          categoryDescription: 1,
          categoryIcon: 1,
          categoryTags: 1,
          subServices: {
            $map: {
              input: '$subServices',
              as: 's',
              in: {
                id: '$$s._id',
                name: '$$s.name',
                description: { $ifNull: ['$$s.description', `Professional ${'$$s.name'} services`] },
                suggestedPriceRange: { $ifNull: ['$$s.suggestedPriceRange', { min: 1000, max: 5000, currency: 'KES' }] },
                typicalDuration: { $ifNull: ['$$s.typicalDuration', { value: 2, unit: 'hours' }] },
                commonRequirements: { $ifNull: ['$$s.commonRequirements', []] },
                requiredSkills: { $ifNull: ['$$s.requiredSkills', []] },
                commonQuestions: { $ifNull: ['$$s.commonQuestions', []] },
                expertiseLevel: { $ifNull: ['$$s.expertiseLevel', 'intermediate'] },
                equipmentNeeded: { $ifNull: ['$$s.equipmentNeeded', false] },
                commonEquipment: { $ifNull: ['$$s.commonEquipment', []] },
                images: { $ifNull: ['$$s.images', []] },
                displayOrder: { $ifNull: ['$$s.displayOrder', 0] },
                popularity: { $ifNull: ['$$s.popularity', { searchCount: 0, bookingCount: 0 }] }
              }
            }
          }
      }}
    ]);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Category not found', data: null });
    }

    const payload = {
      success: true,
      count: result.subServices?.length || 0,
      data: {
        categoryId: result.categoryId,
        categoryName: result.categoryName,
        categoryDescription: result.categoryDescription,
        categoryIcon: result.categoryIcon,
        categoryTags: result.categoryTags,
        subServices: result.subServices
      },
      metadata: { mainCategory, totalSubServices: result.subServices?.length || 0, lastUpdated: result.updatedAt }
    };

    cache.subServices.set(cacheKey, { data: payload, timestamp: Date.now() });
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// FULL CATALOG — cached
// ===========================================
exports.getFullCatalog = async (req, res) => {
  try {
    const { mainCategory } = req.params;
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const cached = cache.fullCatalogs.get(mainCategory);
    if (cached && !isStale(cached.timestamp)) {
      return res.json({ success: true, data: cached.data, cached: true });
    }

    const catalog = await ServiceCatalog.findOne({ mainCategory, isActive: true })
      .select('mainCategory version updatedAt serviceCategories.name serviceCategories.description serviceCategories.icon serviceCategories.displayOrder serviceCategories.subServices.name serviceCategories.subServices.description serviceCategories.subServices.displayOrder')
      .lean();

    if (!catalog) {
      return res.status(404).json({ success: false, message: `Category '${mainCategory}' not found` });
    }

    const data = {
      mainCategory: catalog.mainCategory,
      version: catalog.version || 1,
      lastUpdated: catalog.updatedAt,
      serviceCategories: (catalog.serviceCategories || [])
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
              displayOrder: s.displayOrder
            }))
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        }))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    };

    cache.fullCatalogs.set(mainCategory, { data, timestamp: Date.now() });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// SEARCH — lean + text index
// ===========================================
exports.searchServices = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, count: 0, data: [], message: 'Enter at least 2 characters' });
    }
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Text search uses the index we added to the model
    const results = await ServiceCatalog.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .select('mainCategory serviceCategories.name serviceCategories.subServices.name')
    .sort({ score: { $meta: 'textScore' } })
    .limit(20)
    .lean();

    // Fire-and-forget analytics (don't await, don't block response)
    ServiceCatalog.updateMany(
      { $text: { $search: q } },
      { $inc: { 'serviceCategories.$[].subServices.$[].popularity.searchCount': 1 } }
    ).catch(() => {});

    res.json({ success: true, count: results.length, data: results, searchTerm: q });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search error', error: error.message });
  }
};

// ===========================================
// POPULAR — cached aggregation
// ===========================================
exports.getPopularServices = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    if (cache.popular.data && !isStale(cache.popular.timestamp)) {
      return res.json({ ...cache.popular.data, cached: true });
    }

    const popular = await ServiceCatalog.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$serviceCategories' },
      { $match: { 'serviceCategories.isActive': { $ne: false } } },
      { $unwind: '$serviceCategories.subServices' },
      { $match: { 'serviceCategories.subServices.isActive': { $ne: false } } },
      { $project: {
          mainCategory: 1,
          serviceCategory: '$serviceCategories.name',
          subService: '$serviceCategories.subServices.name',
          subServiceDescription: '$serviceCategories.subServices.description',
          searchCount: { $ifNull: ['$serviceCategories.subServices.popularity.searchCount', 0] },
          bookingCount: { $ifNull: ['$serviceCategories.subServices.popularity.bookingCount', 0] },
          suggestedPriceRange: '$serviceCategories.subServices.suggestedPriceRange',
          typicalDuration: '$serviceCategories.subServices.typicalDuration'
      }},
      { $addFields: {
          popularityScore: { $add: [
            { $multiply: ['$searchCount', 1] },
            { $multiply: ['$bookingCount', 3] }
          ]}
      }},
      { $sort: { popularityScore: -1 } },
      { $limit: limit }
    ]).allowDiskUse(false);

    const payload = {
      success: true,
      count: popular.length,
      data: popular,
      metadata: { scoring: { searchWeight: 1, bookingWeight: 3 } }
    };

    cache.popular = { data: payload, timestamp: Date.now() };
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// CATEGORIES WITH COUNTS — lean
// ===========================================
exports.getCategoriesWithCounts = async (req, res) => {
  try {
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const catalogs = await ServiceCatalog.find({ isActive: true })
      .select('mainCategory serviceCategories.name serviceCategories.description serviceCategories.icon serviceCategories.displayOrder serviceCategories.subServices')
      .lean();

    const data = catalogs.map(catalog => ({
      mainCategory: catalog.mainCategory,
      totalServiceCategories: (catalog.serviceCategories || []).filter(c => c.isActive !== false).length,
      serviceCategories: (catalog.serviceCategories || [])
        .filter(c => c.isActive !== false)
        .map(c => ({
          id: c._id,
          name: c.name,
          description: c.description,
          icon: c.icon,
          subServiceCount: (c.subServices || []).filter(s => s.isActive !== false).length,
          displayOrder: c.displayOrder || 0
        }))
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    }));

    res.json({ success: true, data, metadata: { totalMainCategories: data.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// VALIDATE — lean + early exit
// ===========================================
exports.validateServices = async (req, res) => {
  try {
    const { services } = req.body;
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ success: false, message: 'services array required' });
    }
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Fetch all needed catalogs in ONE query instead of N queries
    const mainCategories = [...new Set(services.map(s => s.mainCategory))];
    const catalogs = await ServiceCatalog.find({
      mainCategory: { $in: mainCategories },
      isActive: true
    }).select('mainCategory serviceCategories.name serviceCategories.subServices.name serviceCategories.isActive serviceCategories.subServices.isActive').lean();

    const catalogMap = new Map(catalogs.map(c => [c.mainCategory, c]));

    const results = services.map(service => {
      const { mainCategory, categoryName, subServices = [] } = service;
      const catalog = catalogMap.get(mainCategory);

      if (!catalog) {
        return { mainCategory, categoryName, valid: false, validSubServices: [], invalidSubServices: subServices, message: `Main category '${mainCategory}' not found` };
      }

      const category = catalog.serviceCategories?.find(c => c.name === categoryName && c.isActive !== false);
      if (!category) {
        return { mainCategory, categoryName, valid: false, validSubServices: [], invalidSubServices: subServices, message: `Category '${categoryName}' not found` };
      }

      const validSubServices = [];
      const invalidSubServices = [];
      const activeSubNames = new Set((category.subServices || []).filter(s => s.isActive !== false).map(s => s.name));

      for (const subName of subServices) {
        if (activeSubNames.has(subName)) validSubServices.push(subName);
        else invalidSubServices.push(subName);
      }

      return {
        mainCategory,
        categoryName,
        valid: validSubServices.length > 0,
        validSubServices,
        invalidSubServices,
        message: invalidSubServices.length ? `Invalid: ${invalidSubServices.join(', ')}` : 'All valid'
      };
    });

    res.json({ success: true, allValid: results.every(r => r.valid), results, summary: {
      totalValidated: results.length,
      fullyValid: results.filter(r => r.valid).length,
      hasErrors: results.filter(r => !r.valid).length
    }});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Validation error', error: error.message });
  }
};

// ===========================================
// DETAILED SUB-SERVICES — reuse getSubServices logic
// ===========================================
exports.getDetailedSubServices = async (req, res) => {
  try {
    const { mainCategory, serviceCategory } = req.params;
    if (!mainCategory || !serviceCategory) {
      return res.status(400).json({ success: false, message: 'Both parameters required' });
    }
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const [result] = await ServiceCatalog.aggregate([
      { $match: { mainCategory, isActive: true } },
      { $project: {
          updatedAt: 1,
          version: 1,
          serviceCategories: {
            $filter: {
              input: '$serviceCategories',
              as: 'c',
              cond: { $eq: ['$$c.name', serviceCategory] }
            }
          }
      }},
      { $unwind: '$serviceCategories' },
      { $project: {
          updatedAt: 1,
          version: 1,
          categoryId: '$serviceCategories._id',
          categoryName: '$serviceCategories.name',
          categoryDescription: '$serviceCategories.description',
          categoryIcon: '$serviceCategories.icon',
          categoryImage: '$serviceCategories.image',
          categoryTags: { $ifNull: ['$serviceCategories.tags', []] },
          subServices: {
            $filter: {
              input: { $ifNull: ['$serviceCategories.subServices', []] },
              as: 's',
              cond: { $ne: ['$$s.isActive', false] }
            }
          }
      }},
      { $project: {
          updatedAt: 1,
          version: 1,
          categoryId: 1,
          categoryName: 1,
          categoryDescription: 1,
          categoryIcon: 1,
          categoryImage: 1,
          categoryTags: 1,
          subServices: {
            $map: {
              input: '$subServices',
              as: 's',
              in: {
                id: '$$s._id',
                name: '$$s.name',
                description: { $ifNull: ['$$s.description', `Professional ${'$$s.name'} services`] },
                suggestedPriceRange: { $ifNull: ['$$s.suggestedPriceRange', { min: 1000, max: 5000, currency: 'KES' }] },
                typicalDuration: { $ifNull: ['$$s.typicalDuration', { value: 2, unit: 'hours' }] },
                commonRequirements: { $ifNull: ['$$s.commonRequirements', []] },
                requiredSkills: { $ifNull: ['$$s.requiredSkills', []] },
                commonQuestions: { $ifNull: ['$$s.commonQuestions', []] },
                expertiseLevel: { $ifNull: ['$$s.expertiseLevel', 'intermediate'] },
                equipmentNeeded: { $ifNull: ['$$s.equipmentNeeded', false] },
                commonEquipment: { $ifNull: ['$$s.commonEquipment', []] },
                images: { $ifNull: ['$$s.images', []] },
                displayOrder: { $ifNull: ['$$s.displayOrder', 0] },
                popularity: { $ifNull: ['$$s.popularity', { searchCount: 0, bookingCount: 0 }] }
              }
            }
          }
      }}
    ]);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    res.json({
      success: true,
      count: result.subServices?.length || 0,
      data: {
        categoryId: result.categoryId,
        categoryName: result.categoryName,
        categoryDescription: result.categoryDescription,
        categoryIcon: result.categoryIcon,
        categoryImage: result.categoryImage,
        categoryTags: result.categoryTags,
        subServices: result.subServices
      },
      metadata: { mainCategory, totalSubServices: result.subServices?.length || 0, catalogVersion: result.version || 1, lastUpdated: result.updatedAt }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// TECHNICIANS FOR SERVICE — delegate to search
// ===========================================
exports.getTechniciansForService = async (req, res) => {
  try {
    const { mainCategory, serviceCategory } = req.params;
    const { radius, lat, lng, page, limit, minRating, minHourlyRate, maxHourlyRate } = req.query;

    if (!mainCategory || !serviceCategory) {
      return res.status(400).json({ success: false, message: 'mainCategory and serviceCategory required' });
    }

    const searchQuery = {
      mainCategory,
      serviceCategory,
      radius: radius || 50,
      page: page || 1,
      limit: limit || 20,
      minRating: minRating || '',
      minHourlyRate: minHourlyRate || '',
      maxHourlyRate: maxHourlyRate || ''
    };
    if (lat && lng) { searchQuery.lat = lat; searchQuery.lng = lng; }

    await searchController.searchTechnicians({ query: searchQuery }, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ===========================================
// ANALYTICS & HEALTH
// ===========================================
exports.incrementBookingCount = async (req, res) => {
  try {
    const { mainCategory, serviceCategory, subService } = req.body;
    if (!mainCategory || !serviceCategory || !subService) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    await ServiceCatalog.incrementBookingCount(mainCategory, serviceCategory, subService);
    res.json({ success: true, message: 'Booking count incremented' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.healthCheck = async (req, res) => {
  try {
    const connected = dbConnected();
    let catalogCount = 0;
    let totalSubServices = 0;

    if (connected) {
      catalogCount = await ServiceCatalog.countDocuments({ isActive: true });
      const counts = await ServiceCatalog.aggregate([
        { $match: { isActive: true } },
        { $project: { count: { $sum: { $map: {
          input: '$serviceCategories',
          as: 'c',
          in: { $size: { $ifNull: ['$$c.subServices', []] } }
        }}}}}
      ]);
      totalSubServices = counts[0]?.count || 0;
    }

    res.json({
      success: true,
      status: 'operational',
      database: { connected, state: connected ? 'connected' : 'disconnected' },
      catalog: { activeMainCategories: catalogCount, totalSubServices, hasData: catalogCount > 0 },
      endpoints: {
        mainCategories: '/api/service-catalog/main-categories',
        serviceCategories: '/api/service-catalog/:mainCategory/service-categories',
        subServices: '/api/service-catalog/:mainCategory/:serviceCategory/sub-services'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, status: 'error', error: error.message });
  }
};


// ===========================================
// COMPLETE CATALOG — single query, flat response
// ===========================================
exports.getCompleteCatalog = async (req, res) => {
  try {
    if (!dbConnected()) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // One lightweight query — only the fields the frontend needs
    const catalogs = await ServiceCatalog.find({ isActive: true })
      .select('mainCategory serviceCategories.name serviceCategories.isActive serviceCategories.subServices.name serviceCategories.subServices.isActive')
      .lean();

    // Reshape into the exact structure the frontend expects
    const data = {};
    catalogs.forEach(catalog => {
      data[catalog.mainCategory] = (catalog.serviceCategories || [])
        .filter(c => c.isActive !== false)
        .map(c => ({
          name: c.name,
          subServices: (c.subServices || [])
            .filter(s => s.isActive !== false)
            .map(s => s.name)
        }));
    });
    // Inside getCompleteCatalog, before res.json():
res.set('Cache-Control', 'public, max-age=300'); // 5 min browser cache

    res.json({
      success: true,
      count: Object.keys(data).length,
      data,
      metadata: { lastUpdated: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Helper to clear cache (call this from an admin route after editing catalog)
exports.clearCatalogCache = () => {
  cache.mainCategories = { data: null, timestamp: 0 };
  cache.categories.clear();
  cache.fullCatalogs.clear();
  cache.subServices.clear();
  cache.popular = { data: null, timestamp: 0 };
};

module.exports = exports;