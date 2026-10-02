const express = require('express');
const router = express.Router();
const { adminAuth, requireRole } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/userAdminController');

router.use(adminAuth);
router.get('/stats',       ctrl.stats);        // any admin can read
router.get('/',            ctrl.list);
router.get('/:id',         ctrl.getOne);
router.put('/:id',         requireRole('super_admin', 'admin'), ctrl.update);
router.put('/:id/status',  requireRole('super_admin', 'admin'), ctrl.setStatus);
router.delete('/:id',      requireRole('super_admin'),          ctrl.remove);

module.exports = router;