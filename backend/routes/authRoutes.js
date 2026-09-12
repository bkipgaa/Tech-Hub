/**
 * Authentication Routes
 * =====================
 * 
 * User-facing authentication endpoints only (clients & technicians).
 * 
 * Admin authentication has moved to the isolated admin panel:
 *   → /api/admin/auth/login       (login)
 *   → /api/admin/auth/me          (profile)
 *   → /api/admin/auth/logout      (logout)
 *   → /api/admin/auth/change-password
 * 
 * Admin users live in a separate collection (AdminUser), so nothing
 * admin-related should flow through this router.
 * 
 * ─────────────────────────────────────────────────────────────
 * PUBLIC ROUTES
 *   POST   /register
 *   POST   /login
 *   POST   /forgot-password
 *   POST   /reset-password/:token
 * 
 * PROTECTED (any authenticated user)
 *   GET    /profile
 *   PUT    /profile
 *   PUT    /become-technician
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  becomeTechnician,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/authcontroller');

const { validateRegistration, validateLogin } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ============ PROTECTED ROUTES (any authenticated user) ============
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/become-technician', auth, becomeTechnician);

// ============================================================
// REMOVED (now handled by the separate admin panel):
//   POST /register-admin              → use /api/admin/auth/*
//   GET  /users                       → use /api/admin/users/*
//   PUT  /users/:userId/role          → use /api/admin/users/*
// ============================================================

module.exports = router;