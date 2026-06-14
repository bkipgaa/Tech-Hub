const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminJobRoutes = require('./admin/adminJobRoutes'); // Add this line
const { auth, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(auth);
router.use(authorize('admin'));
// Mount job management routes
router.use('/jobs', adminJobRoutes); // Add this line

// Technician management
router.get('/technicians', adminController.getAllTechnicians);
router.get('/technicians/:id', adminController.getTechnicianDetails);
router.put('/technicians/:id/verify', adminController.verifyTechnician);
router.put('/technicians/:id/reject', adminController.rejectTechnician);
router.put('/technicians/:id/subscription', adminController.updateSubscription);

// Statistics
router.get('/subscription/stats', adminController.getSubscriptionStats);

module.exports = router;