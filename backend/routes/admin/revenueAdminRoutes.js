const express = require('express');
const router = express.Router();
const { adminAuth, requireRole } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/revenueAdminController');

router.use(adminAuth);
router.get('/overview',       requireRole('super_admin', 'admin', 'finance'), ctrl.getOverview);
router.get('/timeline',       requireRole('super_admin', 'admin', 'finance'), ctrl.getTimeline);
router.get('/breakdown',      requireRole('super_admin', 'admin', 'finance'), ctrl.getBreakdown);
router.get('/transactions',   requireRole('super_admin', 'admin', 'finance'), ctrl.getTransactions);
router.get('/export',         requireRole('super_admin', 'admin', 'finance'), ctrl.exportRevenue);

module.exports = router;