// routes/listingRoutes.js — Stays & Spaces (mounted at /api/listings)
const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const ctrl = require('../controllers/listingController');

// Fixed paths first, so they aren't read as :id
router.get('/meta', ctrl.getMeta);
router.get('/mine', auth, ctrl.getMyListings);
router.post('/photos', auth, upload.single('photo'), ctrl.uploadPhoto);

router.get('/', ctrl.searchListings);
router.post('/', auth, ctrl.createListing);

router.get('/:id', optionalAuth, ctrl.getListing);
router.get('/:id/nearby', ctrl.getNearbyListings);
router.put('/:id', auth, ctrl.updateListing);
router.patch('/:id/status', auth, ctrl.setListingStatus);
router.delete('/:id', auth, ctrl.deleteListing);

module.exports = router;
