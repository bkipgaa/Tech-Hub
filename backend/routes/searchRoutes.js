const express = require('express');
const router = express.Router();
const {
  searchTechnicians,
  getTechniciansBySubService,  // Now this exists
  getNearbyTechnicians
} = require('../controllers/searchController');

// Public search routes
router.get('/technicians', searchTechnicians);
router.get('/by-service', getTechniciansBySubService);  // Fixed route
router.get('/nearby', getNearbyTechnicians);

module.exports = router;