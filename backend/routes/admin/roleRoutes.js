/**
 * roleRoutes.js
 * =============
 * Admin role & permission management routes.
 * Mounted at /api/admin/roles
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission, requireRole } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/roleController');

router.use(adminAuth);

// List & read
router.get('/',             requirePermission('roles.view'),        ctrl.listRoles);
router.get('/permissions',  requirePermission('roles.view'),        ctrl.listPermissions);
router.get('/:id',          requirePermission('roles.view'),        ctrl.getRole);

// Mutations (super admin only, except edit which admins can do)
router.post('/',       requireRole('super_admin'), requirePermission('roles.create'), ctrl.createRole);
router.patch('/:id',   requireRole('super_admin'), requirePermission('roles.edit'),   ctrl.updateRole);
router.delete('/:id',  requireRole('super_admin'), requirePermission('roles.delete'), ctrl.deleteRole);

module.exports = router;