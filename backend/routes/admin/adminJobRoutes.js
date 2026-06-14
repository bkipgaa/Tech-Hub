/**
 * Admin Job Routes
 * ================
 * 
 * Routes for admin job management:
 * - View all jobs with filtering
 * - Approve/reject pending jobs
 * - Feature/unfeature jobs
 * - Bulk operations
 * - Job analytics
 * 
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');
const adminJobController = require('../../controllers/admin/adminJobController');

// Apply admin authentication to all routes
router.use(auth);
router.use(authorize('admin'));

// ===========================================
// STATISTICS & EXPORTS (MUST come before /:jobId)
// ===========================================

// Get job statistics for admin dashboard
router.get('/stats', adminJobController.getJobStats);

// Export jobs data
router.get('/export', adminJobController.exportJobs);

// Get pending jobs for verification
router.get('/pending', adminJobController.getPendingJobs);

// Get all jobs with filters
router.get('/', adminJobController.getAllJobs);

// ===========================================
// BULK OPERATIONS
// ===========================================

// Bulk approve jobs
router.post('/bulk-approve', adminJobController.bulkApproveJobs);

// Bulk reject jobs
router.post('/bulk-reject', adminJobController.bulkRejectJobs);

// ===========================================
// SINGLE JOB OPERATIONS
// ===========================================

// Get single job details
router.get('/:jobId', adminJobController.getJobDetails);

// Approve a job
router.put('/:jobId/approve', adminJobController.approveJob);

// Reject a job
router.put('/:jobId/reject', adminJobController.rejectJob);

// Feature a job
router.put('/:jobId/feature', adminJobController.featureJob);

// Unfeature a job
router.put('/:jobId/unfeature', adminJobController.unfeatureJob);

module.exports = router;