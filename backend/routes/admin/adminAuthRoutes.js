/**
 * adminAuthRoutes.js
 * ==================
 * Admin authentication routes.
 * Mounted at /api/admin/auth
 */

const express = require('express');
const router = express.Router();
const { adminAuth } = require('../../middleware/AdminAuth');
const adminAuthController = require('../../controllers/admin/adminAuthController');

// ── Public ──────────────────────────────────────────────────
router.post('/login', adminAuthController.login);

// ── Authenticated ───────────────────────────────────────────
router.post('/logout',            adminAuth, adminAuthController.logout);
router.get('/me',                 adminAuth, adminAuthController.getMe);
router.get('/check',              adminAuth, adminAuthController.check);
router.patch('/profile',          adminAuth, adminAuthController.updateProfile);
router.post('/change-password',   adminAuth, adminAuthController.changePassword);
router.post('/refresh',           adminAuth, adminAuthController.refresh);

module.exports = router;