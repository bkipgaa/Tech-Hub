// routes/listingRoutes.js — Stays & Spaces (mounted at /api/listings)
const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const ctrl = require('../controllers/listingController');
const plan = require('../controllers/listingPlanController');

// Fixed paths first, so they aren't read as :id
router.get('/meta', ctrl.getMeta);
router.get('/places', ctrl.getPlaces);

// Listing plan (free 6 months, then KES 1,500 a month)
router.post('/plan/mpesa-callback', plan.mpesaCallback); // Safaricom, public
router.get('/plan', auth, plan.getPlan);
router.post('/plan/pay', auth, plan.pay);
router.get('/plan/verify', auth, plan.verify);
router.get('/plan/mpesa-status', auth, plan.mpesaStatus);

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
