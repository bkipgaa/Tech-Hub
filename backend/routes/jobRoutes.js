/**
 * Job Routes - COMPLETE WORKING VERSION
 */

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const jobController = require('../controllers/jobController');

// ===========================================
// PUBLIC ROUTES (No authentication required)
// ===========================================

// Get available jobs (approved, not expired)
router.get('/available', jobController.getAvailableJobs);

// Search jobs
router.get('/search', jobController.searchJobs);

// ===========================================
// ADMIN ROUTES (MUST come before /:jobId)
// ===========================================

// Get all jobs pending approval
router.get('/admin-pending', auth, authorize('admin'), jobController.getPendingJobs);

// Get all jobs (with filters) - Admin view
router.get('/admin/all', auth, authorize('admin'), jobController.getAllJobsAdmin);



// Bulk approve jobs
router.post('/admin/bulk-approve', auth, authorize('admin'), jobController.bulkApproveJobs);

// Approve a job
router.put('/admin/:jobId/approve', auth, authorize('admin'), jobController.approveJob);

// Reject a job
router.put('/admin/:jobId/reject', auth, authorize('admin'), jobController.rejectJob);

// Feature a job (paid promotion)
router.put('/admin/:jobId/feature', auth, authorize('admin'), jobController.featureJob);

// ===========================================
// CLIENT-ONLY ROUTES
// ===========================================

// Create new job posting
router.post('/', auth, authorize('client'), jobController.createJob);

// Get jobs posted by the authenticated client
router.get('/my-jobs', auth, authorize('client'), jobController.getMyJobs);

// Get job statistics for dashboard
router.get('/stats/my', auth, authorize('client'), jobController.getJobStats);

// Update job (only if pending)
router.put('/:jobId', auth, authorize('client'), jobController.updateJob);

// Delete job (only if pending)
router.delete('/:jobId', auth, authorize('client'), jobController.deleteJob);

// ===========================================
// PUBLIC ROUTE WITH PARAM (MUST be LAST)
// ===========================================

// Get single job details
router.get('/:jobId', jobController.getJobDetails);

module.exports = router;