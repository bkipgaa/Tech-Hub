/**
 * Job Application Routes
 * ======================
 * 
 * Defines all API endpoints for job application operations
 */

const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const jobApplicationController = require('../controllers/jobApplicationController');

// ===========================================
// TECHNICIAN ROUTES
// ===========================================

// Apply for a job
router.post('/apply/:jobId', auth, authorize('technician'), jobApplicationController.applyForJob);

// Get my applications (technician view)
router.get('/my-applications', auth, authorize('technician'), jobApplicationController.getMyApplications);

// Withdraw an application
router.put('/:applicationId/withdraw', auth, authorize('technician'), jobApplicationController.withdrawApplication);

// ===========================================
// CLIENT ROUTES
// ===========================================

// Get applications for my jobs (client view)
router.get('/my-job-applications', auth, authorize('client'), jobApplicationController.getApplicationsForMyJobs);

// Accept an application
router.put('/:applicationId/accept', auth, authorize('client'), jobApplicationController.acceptApplication);

// Reject an application
router.put('/:applicationId/reject', auth, authorize('client'), jobApplicationController.rejectApplication);

// Get application stats for a specific job
router.get('/job/:jobId/stats', auth, authorize('client'), jobApplicationController.getJobApplicationStats);

// ===========================================
// SHARED ROUTES (Client + Technician + Admin)
// ===========================================

// Get single application details
router.get('/:applicationId', auth, jobApplicationController.getApplicationDetails);

// Messages
router.get('/:applicationId/messages', auth, jobApplicationController.getMessages);
router.post('/:applicationId/messages', auth, jobApplicationController.sendMessage);

module.exports = router;