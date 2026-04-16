const express = require('express');
const router = express.Router();
const {
  searchTechnicians,
  getTechniciansBySubService,
  getNearbyTechnicians
} = require('../controllers/searchController');

// Public search routes
router.get('/technicians', searchTechnicians);
router.get('/by-subservice', getTechniciansBySubService);
router.get('/nearby', getNearbyTechnicians);

module.exports = router;