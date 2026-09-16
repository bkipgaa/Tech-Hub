/**
 * catalogAdminController.js
 * =========================
 * Admin endpoints for managing the service catalog.
 * Three-level hierarchy: Main Category → Service → Sub-Service
 * 
 * Endpoints:
 *   GET    /api/admin/catalog                                     → list main categories
 *   GET    /api/admin/catalog/:mainCategory                       → full tree for one category
 *   POST   /api/admin/catalog                                     → create main category
 *   PATCH  /api/admin/catalog/:mainCategory                       → update main category
 *   DELETE /api/admin/catalog/:mainCategory                       → delete main category
 * 
 *   POST   /api/admin/catalog/:mainCategory/services              → add service
 *   PATCH  /api/admin/catalog/:mainCategory/services/:serviceId   → update service
 *   DELETE /api/admin/catalog/:mainCategory/services/:serviceId   → delete service
 * 
 *   POST   /api/admin/catalog/:mainCategory/services/:serviceId/sub-services           → add sub
 *   PATCH  /api/admin/catalog/:mainCategory/services/:serviceId/sub-services/:subId    → update sub
 *   DELETE /api/admin/catalog/:mainCategory/services/:serviceId/sub-services/:subId    → delete sub
 * 
 * @version 1.0.0
 */

const ServiceCatalog = require('../../models/ServiceCatalog');
const Technician = require('../../models/Technician');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const handleError = (res, error, message, status = 500, code = 'SERVER_ERROR') => {
  console.error('[catalogAdminController]', message, error);
  res.status(status).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
};

// ─────────────────────────────────────────────────────────────
// LIST MAIN CATEGORIES
// ─────────────────────────────────────────────────────────────
exports.listCatalogs = async (req, res) => {
  try {
    const { search, isActive } = req.query;

    const filter = {};
    if (isActive === 'true')  filter.isActive = true;
    if (isActive === 'false') filter.isActive = false;

    if (search && search.trim()) {
      filter.mainCategory = new RegExp(search.trim(), 'i');
    }

    const catalogs = await ServiceCatalog.find(filter)
      .select('mainCategory serviceCategories.name serviceCategories.isActive serviceCategories.displayOrder serviceCategories.subServices isActive version updatedAt')
      .sort({ mainCategory: 1 })
      .lean();

    const data = catalogs.map((cat) => ({
      _id: cat._id,
      mainCategory: cat.mainCategory,
      isActive: cat.isActive,
      version: cat.version,
      updatedAt: cat.updatedAt,
      serviceCount: cat.serviceCategories?.length || 0,
      activeServiceCount: cat.serviceCategories?.filter((s) => s.isActive !== false).length || 0,
      subServiceCount: (cat.serviceCategories || []).reduce(
        (sum, s) => sum + (s.subServices?.length || 0),
        0
      ),
    }));

    res.json({ success: true, data });
  } catch (error) {
    handleError(res, error, 'Failed to fetch catalog.');
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE MAIN CATEGORY (full tree)
// ─────────────────────────────────────────────────────────────
exports.getCatalog = async (req, res) => {
  try {
    const { mainCategory } = req.params;

    const catalog = await ServiceCatalog.findOne({ mainCategory }).lean();
    if (!catalog) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    res.json({ success: true, data: catalog });
  } catch (error) {
    handleError(res, error, 'Failed to fetch catalog.');
  }
};

// ─────────────────────────────────────────────────────────────
// CREATE MAIN CATEGORY
// ─────────────────────────────────────────────────────────────
exports.createCatalog = async (req, res) => {
  try {
    const { mainCategory, serviceCategories = [] } = req.body;

    if (!mainCategory || !mainCategory.trim()) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_NAME',
        message: 'Main category name is required.',
      });
    }

    const exists = await ServiceCatalog.findOne({ mainCategory: mainCategory.trim() });
    if (exists) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_EXISTS',
        message: 'A catalog for this main category already exists.',
      });
    }

    const catalog = new ServiceCatalog({
      mainCategory: mainCategory.trim(),
      serviceCategories,
      isActive: true,
      version: 1,
    });
    await catalog.save();

    res.status(201).json({
      success: true,
      message: 'Catalog created.',
      data: catalog,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: Object.values(error.errors).map((e) => e.message).join(', '),
      });
    }
    handleError(res, error, 'Failed to create catalog.');
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE MAIN CATEGORY
// ─────────────────────────────────────────────────────────────
exports.updateCatalog = async (req, res) => {
  try {
    const { mainCategory } = req.params;
    const { isActive } = req.body;

    const update = {};
    if (isActive !== undefined) update.isActive = isActive;

    const catalog = await ServiceCatalog.findOneAndUpdate(
      { mainCategory },
      { $set: update, $inc: { version: 1 } },
      { new: true }
    );

    if (!catalog) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    res.json({ success: true, message: 'Catalog updated.', data: catalog });
  } catch (error) {
    handleError(res, error, 'Failed to update catalog.');
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE MAIN CATEGORY
// ─────────────────────────────────────────────────────────────
exports.deleteCatalog = async (req, res) => {
  try {
    const { mainCategory } = req.params;

    // Safety: prevent deleting if technicians use it
    const inUse = await Technician.countDocuments({ mainCategory });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        code: 'IN_USE',
        message: `${inUse} technician(s) use this category. Deactivate it instead of deleting.`,
      });
    }

    const result = await ServiceCatalog.findOneAndDelete({ mainCategory });
    if (!result) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    res.json({ success: true, message: 'Catalog deleted.' });
  } catch (error) {
    handleError(res, error, 'Failed to delete catalog.');
  }
};

// ─────────────────────────────────────────────────────────────
// SERVICE CATEGORY CRUD
// ─────────────────────────────────────────────────────────────
exports.addServiceCategory = async (req, res) => {
  try {
    const { mainCategory } = req.params;
    const { name, description, icon, isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_NAME',
        message: 'Service name is required.',
      });
    }

    const catalog = await ServiceCatalog.findOne({ mainCategory });
    if (!catalog) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    const duplicate = catalog.serviceCategories.find((s) => s.name === name.trim());
    if (duplicate) {
      return res.status(400).json({
        success: false,
        code: 'DUPLICATE',
        message: 'This service already exists under this category.',
      });
    }

    catalog.serviceCategories.push({
      name: name.trim(),
      description: description || '',
      icon: icon || '',
      isActive,
      displayOrder: catalog.serviceCategories.length,
      subServices: [],
    });
    catalog.version += 1;
    await catalog.save();

    res.status(201).json({ success: true, message: 'Service added.', data: catalog });
  } catch (error) {
    handleError(res, error, 'Failed to add service.');
  }
};

exports.updateServiceCategory = async (req, res) => {
  try {
    const { mainCategory, serviceId } = req.params;
    const { name, description, icon, isActive } = req.body;

    const catalog = await ServiceCatalog.findOne({ mainCategory });
    if (!catalog) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    const service = catalog.serviceCategories.id(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Service not found.',
      });
    }

    if (name) service.name = name.trim();
    if (description !== undefined) service.description = description;
    if (icon !== undefined) service.icon = icon;
    if (isActive !== undefined) service.isActive = isActive;

    catalog.version += 1;
    await catalog.save();

    res.json({ success: true, message: 'Service updated.', data: catalog });
  } catch (error) {
    handleError(res, error, 'Failed to update service.');
  }
};

exports.deleteServiceCategory = async (req, res) => {
  try {
    const { mainCategory, serviceId } = req.params;

    const catalog = await ServiceCatalog.findOne({ mainCategory });
    if (!catalog) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    catalog.serviceCategories.pull({ _id: serviceId });
    catalog.version += 1;
    await catalog.save();

    res.json({ success: true, message: 'Service deleted.', data: catalog });
  } catch (error) {
    handleError(res, error, 'Failed to delete service.');
  }
};

// ─────────────────────────────────────────────────────────────
// SUB-SERVICE CRUD
// ─────────────────────────────────────────────────────────────
exports.addSubService = async (req, res) => {
  try {
    const { mainCategory, serviceId } = req.params;
    const { name, description, suggestedPriceRange } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_NAME',
        message: 'Sub-service name is required.',
      });
    }

    const catalog = await ServiceCatalog.findOne({ mainCategory });
    if (!catalog) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    const service = catalog.serviceCategories.id(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Service not found.',
      });
    }

    const duplicate = service.subServices.find((s) => s.name === name.trim());
    if (duplicate) {
      return res.status(400).json({
        success: false,
        code: 'DUPLICATE',
        message: 'This sub-service already exists.',
      });
    }

    service.subServices.push({
      name: name.trim(),
      description: description || '',
      suggestedPriceRange: suggestedPriceRange || undefined,
      isActive: true,
      displayOrder: service.subServices.length,
    });
    catalog.version += 1;
    await catalog.save();

    res.status(201).json({ success: true, message: 'Sub-service added.', data: catalog });
  } catch (error) {
    handleError(res, error, 'Failed to add sub-service.');
  }
};

exports.updateSubService = async (req, res) => {
  try {
    const { mainCategory, serviceId, subId } = req.params;
    const { name, description, suggestedPriceRange, isActive } = req.body;

    const catalog = await ServiceCatalog.findOne({ mainCategory });
    if (!catalog) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    const service = catalog.serviceCategories.id(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Service not found.',
      });
    }

    const sub = service.subServices.id(subId);
    if (!sub) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Sub-service not found.',
      });
    }

    if (name) sub.name = name.trim();
    if (description !== undefined) sub.description = description;
    if (suggestedPriceRange) sub.suggestedPriceRange = suggestedPriceRange;
    if (isActive !== undefined) sub.isActive = isActive;

    catalog.version += 1;
    await catalog.save();

    res.json({ success: true, message: 'Sub-service updated.', data: catalog });
  } catch (error) {
    handleError(res, error, 'Failed to update sub-service.');
  }
};

exports.deleteSubService = async (req, res) => {
  try {
    const { mainCategory, serviceId, subId } = req.params;

    const catalog = await ServiceCatalog.findOne({ mainCategory });
    if (!catalog) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Main category not found.',
      });
    }

    const service = catalog.serviceCategories.id(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Service not found.',
      });
    }

    service.subServices.pull({ _id: subId });
    catalog.version += 1;
    await catalog.save();

    res.json({ success: true, message: 'Sub-service deleted.', data: catalog });
  } catch (error) {
    handleError(res, error, 'Failed to delete sub-service.');
  }
};