/**
 * bookingAdminRoutes.js
 * =====================
 * Admin booking management routes.
 * Mounted at /api/admin/bookings
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/bookingAdminController');

router.use(adminAuth);

// List & aggregate
router.get('/',       requirePermission('bookings.view'), ctrl.listBookings);
router.get('/stats',  requirePermission('bookings.view'), ctrl.getStats);
router.get('/export', requirePermission('bookings.export'), ctrl.exportBookings);

// Single
router.get('/:id',    requirePermission('bookings.view_details'), ctrl.getBooking);

// Actions
router.patch('/:id/cancel', requirePermission('bookings.cancel'), ctrl.cancelBooking);
router.patch('/:id/notes',  requirePermission('bookings.manage'), ctrl.updateAdminNotes);
router.patch('/:id/status', requirePermission('bookings.manage'), ctrl.forceStatus);

module.exports = router;