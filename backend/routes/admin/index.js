/**
 * routes/admin/index.js
 * =====================
 * Combines all admin sub-routers.
 * Mounted at /api/admin in server.js
 */

const express = require('express');
const router = express.Router();

// Auth routes are the entry point — they handle login
router.use('/auth', require('./adminAuthRoutes'));

// Everything else will be added as we build it:
router.use('/dashboard',     require('./dashboardRoutes'));
router.use('/technicians',   require('./technicianAdminRoutes'));
router.use('/subscriptions', require('./subscriptionAdminRoutes'));
router.use('/verifications', require('./verificationAdminRoutes'));
router.use('/bookings',      require('./bookingAdminRoutes'));
// router.use('/jobs',          require('./jobAdminRoutes'));
// router.use('/revenue',       require('./revenueAdminRoutes'));
// router.use('/commissions',   require('./commissionAdminRoutes'));
// router.use('/users',         require('./userAdminRoutes'));
// router.use('/admin-users',   require('./adminUserRoutes'));
router.use('/roles',         require('./roleRoutes'));
// router.use('/activity',      require('./activityLogRoutes'));
// router.use('/settings',      require('./settingsRoutes'));

module.exports = router;