/**
 * listingAdminRoutes.js
 * =====================
 * Admin review of Stays & Spaces listings. Mounted at /api/admin/listings
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/listingAdminController');

router.use(adminAuth);

router.get('/',            requirePermission('listings.view'),   ctrl.list);
router.get('/stats',       requirePermission('listings.view'),   ctrl.stats);
router.patch('/:id/approve', requirePermission('listings.review'), ctrl.approve);
router.patch('/:id/reject',  requirePermission('listings.review'), ctrl.reject);
router.patch('/:id/hide',    requirePermission('listings.review'), ctrl.hide);
router.patch('/:id/unhide',  requirePermission('listings.review'), ctrl.unhide);

module.exports = router;
