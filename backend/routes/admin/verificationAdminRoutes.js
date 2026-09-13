/**
 * verificationAdminRoutes.js
 * ==========================
 * Admin verification workflow routes.
 * Mounted at /api/admin/verifications
 */

const express = require('express');
const router = express.Router();
const { adminAuth, requirePermission } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/verificationAdminController');

router.use(adminAuth);

router.get('/',          requirePermission('verifications.view'),   ctrl.listVerifications);
router.get('/stats',     requirePermission('verifications.view'),   ctrl.getStats);
router.get('/:id',       requirePermission('verifications.view'),   ctrl.getVerification);

router.patch('/:id/approve',         requirePermission('verifications.approve'),       ctrl.approveVerification);
router.patch('/:id/reject',          requirePermission('verifications.reject'),        ctrl.rejectVerification);
router.patch('/:id/request-more',    requirePermission('verifications.request_more'),  ctrl.requestMoreInfo);
router.patch('/:id/documents/:docId', requirePermission('verifications.approve'),      ctrl.updateDocument);

module.exports = router;