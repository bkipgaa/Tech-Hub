const express = require('express');
const router = express.Router();

const {
  getMainCategories,
  getServiceCategoriesByMain,
  getSubServices,
  getFullCatalog,
  searchServices,
  getPopularServices,
  getCategoriesWithCounts,
  validateServices,
  getDetailedSubServices,
  getTechniciansForService,
  getCompleteCatalog
} = require('../controllers/serviceCatalogController');

// =============================================
// 1️⃣ STATIC ROUTES (no parameters) — ALWAYS FIRST
// =============================================
router.get('/main-categories', getMainCategories);
router.get('/search', searchServices);
router.get('/popular', getPopularServices);
router.get('/categories-with-counts', getCategoriesWithCounts);
router.get('/complete', getCompleteCatalog);        // ← your new single-call endpoint
router.post('/validate', validateServices);

// =============================================
// 2️⃣ PARAMETERIZED ROUTES — most specific to least specific
// =============================================

// 3 segments, specific suffix
router.get('/:mainCategory/:serviceCategory/technicians', getTechniciansForService);

// 4 segments (must come before the 3-segment /sub-services)
router.get('/:mainCategory/:serviceCategory/sub-services/detailed', getDetailedSubServices);

// 3 segments
router.get('/:mainCategory/:serviceCategory/sub-services', getSubServices);

// 2 segments
router.get('/:mainCategory/full', getFullCatalog);
router.get('/:mainCategory/service-categories', getServiceCategoriesByMain);

module.exports = router;