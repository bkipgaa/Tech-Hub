/**
 * catalogAdminRoutes.js
 * =====================
 * Admin routes for service catalog management.
 * Mounted at /api/admin/catalog
 * 
 * ⚠️ Fixed paths before parameterised paths (same rule as /permissions).
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/catalogAdminController');

router.use(adminAuth);

// ── Main categories ─────────────────────────────────────
router.get('/',                requirePermission('catalog.view'),   ctrl.listCatalogs);
router.post('/',               requirePermission('catalog.create'), ctrl.createCatalog);
router.get('/:mainCategory',   requirePermission('catalog.view'),   ctrl.getCatalog);
router.patch('/:mainCategory', requirePermission('catalog.edit'),   ctrl.updateCatalog);
router.delete('/:mainCategory',requirePermission('catalog.delete'), ctrl.deleteCatalog);

// ── Services ────────────────────────────────────────────
router.post(
  '/:mainCategory/services',
  requirePermission('catalog.create'),
  ctrl.addServiceCategory
);
router.patch(
  '/:mainCategory/services/:serviceId',
  requirePermission('catalog.edit'),
  ctrl.updateServiceCategory
);
router.delete(
  '/:mainCategory/services/:serviceId',
  requirePermission('catalog.delete'),
  ctrl.deleteServiceCategory
);

// ── Sub-services ────────────────────────────────────────
router.post(
  '/:mainCategory/services/:serviceId/sub-services',
  requirePermission('catalog.create'),
  ctrl.addSubService
);
router.patch(
  '/:mainCategory/services/:serviceId/sub-services/:subId',
  requirePermission('catalog.edit'),
  ctrl.updateSubService
);
router.delete(
  '/:mainCategory/services/:serviceId/sub-services/:subId',
  requirePermission('catalog.delete'),
  ctrl.deleteSubService
);

module.exports = router;