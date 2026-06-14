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
  getDetailedSubServices
} = require('../controllers/serviceCatalogController');

// Public routes (no authentication needed)
router.get('/main-categories', getMainCategories);
router.get('/search', searchServices);
router.get('/popular', getPopularServices);
router.get('/categories-with-counts', getCategoriesWithCounts);
router.post('/validate', validateServices);

// ⚠️ IMPORTANT: More specific routes FIRST
router.get('/:mainCategory/:serviceCategory/sub-services/detailed', getDetailedSubServices);
router.get('/:mainCategory/:serviceCategory/sub-services', getSubServices);
router.get('/:mainCategory/service-categories', getServiceCategoriesByMain);
router.get('/:mainCategory/full', getFullCatalog);

module.exports = router;