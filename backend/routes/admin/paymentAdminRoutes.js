const express = require('express');
const router = express.Router();
const { adminAuth, requireRole } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/paymentAdminController');

router.use(adminAuth);
router.get('/stats',   requireRole('super_admin', 'admin', 'finance'), ctrl.stats);
router.get('/',        requireRole('super_admin', 'admin', 'finance'), ctrl.list);
router.get('/export',  requireRole('super_admin', 'admin', 'finance'), ctrl.exportCsv);

module.exports = router;