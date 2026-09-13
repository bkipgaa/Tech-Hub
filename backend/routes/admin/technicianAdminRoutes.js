/**
 * technicianAdminRoutes.js
 * ========================
 * Admin technician management routes.
 * Mounted at /api/admin/technicians
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/technicianAdminController');

router.use(adminAuth);

// List & stats
router.get('/',       requirePermission('technicians.view'), ctrl.listTechnicians);
router.get('/stats',  requirePermission('technicians.view'), ctrl.getStats);

// Single technician
router.get('/:id',    requirePermission('technicians.view_details'), ctrl.getTechnician);
router.patch('/:id',  requirePermission('technicians.edit'),         ctrl.updateTechnician);

// Verification
router.patch('/:id/verify', requirePermission('technicians.verify'), ctrl.verifyTechnician);
router.patch('/:id/reject', requirePermission('technicians.verify'), ctrl.rejectVerification);

// Suspension
router.patch('/:id/suspend',  requirePermission('technicians.suspend'), ctrl.suspendTechnician);
router.patch('/:id/activate', requirePermission('technicians.suspend'), ctrl.activateTechnician);

// Delete
router.delete('/:id', requirePermission('technicians.delete'), ctrl.deleteTechnician);

module.exports = router;