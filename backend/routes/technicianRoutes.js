const express = require('express');
const router = express.Router();
const publicController = require('../controllers/technician/publicController');

// Public routes (no authentication needed)
router.get('/public', publicController.getAllPublicProfiles);
router.get('/public/all', publicController.getAllPublicProfiles);
router.get('/public/:id', publicController.getPublicProfile);
router.get('/public/category/:category', publicController.getTechniciansByCategory);
router.get('/public/stats/summary', publicController.getTechnicianStats);

module.exports = router;