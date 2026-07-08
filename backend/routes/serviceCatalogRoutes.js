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

// =============================================
// 1️⃣ PUBLIC ROUTES (No parameters)
// =============================================
router.get('/main-categories', getMainCategories);
router.get('/search', searchServices);
router.get('/popular', getPopularServices);
router.get('/categories-with-counts', getCategoriesWithCounts);
router.post('/validate', validateServices);

// =============================================
// 2️⃣ SPECIFIC ROUTES WITH PARAMETERS
// (Most specific to least specific)
// =============================================

// ✅ MOST SPECIFIC: Detailed sub-services with multiple parameters
router.get(
  '/:mainCategory/:serviceCategory/sub-services/detailed', 
  getDetailedSubServices
);

// ✅ SECOND MOST SPECIFIC: Sub-services by service category
router.get(
  '/:mainCategory/:serviceCategory/sub-services', 
  getSubServices
);

// ✅ THIRD: Full catalog for a main category
router.get(
  '/:mainCategory/full', 
  getFullCatalog
);

// ✅ LEAST SPECIFIC: Service categories by main category
// This must come LAST among parameterized routes
router.get(
  '/:mainCategory/service-categories', 
  getServiceCategoriesByMain
);

module.exports = router;