/**
 * dashboardRoutes.js
 * ==================
 * Admin dashboard routes.
 * Mounted at /api/admin/dashboard
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../../middleware/AdminAuth');
const dashboardController = require('../../controllers/admin/dashboardController');

router.use(adminAuth);

router.get('/stats',                  requirePermission('dashboard.view'), dashboardController.getStats);
router.get('/revenue-timeline',       requirePermission('revenue.view'),   dashboardController.getRevenueTimeline);
router.get('/subscription-breakdown', requirePermission('subscriptions.view'), dashboardController.getSubscriptionBreakdown);
router.get('/recent-activity',        requirePermission('activity.view'),  dashboardController.getRecentActivity);

module.exports = router;