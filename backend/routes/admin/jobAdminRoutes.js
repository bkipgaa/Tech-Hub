/**
 * jobAdminRoutes.js
 * =================
 * Admin review of job posts. Mounted at /api/admin/jobs
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/jobReviewAdminController');

router.use(adminAuth);

router.get('/',                requirePermission('jobs.view'),    ctrl.list);
router.get('/stats',           requirePermission('jobs.view'),    ctrl.stats);
router.patch('/:id/approve',   requirePermission('jobs.approve'), ctrl.approve);
router.patch('/:id/reject',    requirePermission('jobs.reject'),  ctrl.reject);
router.patch('/:id/takedown',  requirePermission('jobs.reject'),  ctrl.takedown);

module.exports = router;
