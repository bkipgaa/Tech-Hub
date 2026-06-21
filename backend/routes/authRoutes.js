/**
 * Authentication Routes
 * =====================
 * 
 * Public Routes:
 * - POST /register - Register as client/technician
 * - POST /register-admin - Register as admin (requires secret key)
 * - POST /login - Login for all roles
 * 
 * Private Routes (require authentication):
 * - GET /profile - Get current user profile
 * - PUT /profile - Update user profile
 * - PUT /become-technician - Upgrade to technician role
 * 
 * Admin Routes (require admin role):
 * - GET /users - Get all users
 * - PUT /users/:userId/role - Update user role
 */

const express = require('express');
const router = express.Router();
const { 
  register, 
  registerAdmin,
  login, 
  getProfile,
  becomeTechnician, 
  updateProfile,
  getAllUsers,
  updateUserRole
} = require('../controllers/authcontroller');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const {auth} = require('../middleware/auth');
const adminAuth = require('../middleware/AdminAuth');

// ==================== PUBLIC ROUTES ====================
router.post('/register', validateRegistration, register);
router.post('/register-admin', registerAdmin); // Secure admin registration
router.post('/login', validateLogin, login);

// ==================== PROTECTED ROUTES (Any authenticated user) ====================
router.get('/technician-profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/become-technician', auth, becomeTechnician);

// ==================== ADMIN ONLY ROUTES ====================
router.get('/users', auth, adminAuth, getAllUsers);
router.put('/users/:userId/role', auth, adminAuth, updateUserRole);

module.exports = router;