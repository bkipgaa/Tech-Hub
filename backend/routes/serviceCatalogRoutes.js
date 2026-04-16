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
  getDetailedSubServices  // ← Add this import
} = require('../controllers/serviceCatalogController');
const protect = require('../middleware/auth'); // ✅ ensure this path is correct



// Public routes (no authentication needed)
router.get('/main-categories', getMainCategories);
router.get('/search', searchServices);
router.get('/popular', getPopularServices);
router.get('/categories-with-counts', getCategoriesWithCounts);
router.post('/validate', validateServices); // used by technician registration

// Param-based public routes

// Param-based routes (order matters - more specific routes first)
router.get('/:mainCategory/:serviceCategory/sub-services/detailed', getDetailedSubServices); // ← Ad
router.get('/:mainCategory/service-categories', getServiceCategoriesByMain);
router.get('/:mainCategory/full', getFullCatalog);
router.get('/:mainCategory/:serviceCategory/sub-services', getSubServices);

// 🔒 Protected routes (require authentication)
// Comment out or remove the lines below if you don't have these controller functions yet
// router.post('/', protect, createCatalog);
// router.put('/:id', protect, updateCatalog);
// router.delete('/:id', protect, deleteCatalog);

module.exports = router;