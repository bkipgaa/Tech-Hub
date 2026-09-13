/**
 * subscriptionAdminRoutes.js
 * ==========================
 * Admin subscription management routes.
 * Mounted at /api/admin/subscriptions
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/subscriptionAdminController');

router.use(adminAuth);

// List & aggregate
router.get('/',        requirePermission('subscriptions.view'), ctrl.listSubscriptions);
router.get('/stats',   requirePermission('subscriptions.view'), ctrl.getStats);
router.get('/expiring',requirePermission('subscriptions.view'), ctrl.getExpiringSoon);
router.get('/export',  requirePermission('subscriptions.export'), ctrl.exportSubscriptions);

// Single
router.get('/:id',            requirePermission('subscriptions.view_details'), ctrl.getSubscriptionDetail);

// Actions
router.patch('/:id/extend',   requirePermission('subscriptions.manage'), ctrl.extendSubscription);
router.patch('/:id/cancel',   requirePermission('subscriptions.manage'), ctrl.cancelSubscription);

module.exports = router;