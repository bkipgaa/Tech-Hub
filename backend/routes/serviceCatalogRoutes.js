// routes/serviceCatalogRoutes.js
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
  validateServices
} = require('../controllers/serviceCatalogController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/main-categories', getMainCategories);
router.get('/search', searchServices);
router.get('/popular', getPopularServices);
router.get('/categories-with-counts', getCategoriesWithCounts);
router.post('/validate', validateServices); // Used by technician registration

// Param-based routes
router.get('/:mainCategory/service-categories', getServiceCategoriesByMain);
router.get('/:mainCategory/full', getFullCatalog);
router.get('/:mainCategory/:serviceCategory/sub-services', getSubServices);

// Admin routes (protected)
// These would be implemented for managing the catalog
// router.post('/', protect, admin, createCatalog);
// router.put('/:id', protect, admin, updateCatalog);
// router.delete('/:id', protect, admin, deleteCatalog);

module.exports = router;