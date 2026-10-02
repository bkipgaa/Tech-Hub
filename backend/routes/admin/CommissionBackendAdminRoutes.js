const express = require('express');
const router = express.Router();
const { adminAuth, requireRole } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/commissionAdminController');

router.use(adminAuth);
router.get('/stats',          requireRole('super_admin', 'admin', 'finance'), ctrl.stats);
router.get('/',               requireRole('super_admin', 'admin', 'finance'), ctrl.list);
router.get('/export',         requireRole('super_admin', 'admin', 'finance'), ctrl.exportCsv);
router.put('/:id/mark-paid',  requireRole('super_admin', 'admin', 'finance'), ctrl.markPaid);
router.put('/:id/waive',      requireRole('super_admin', 'admin', 'finance'), ctrl.waive);

module.exports = router;