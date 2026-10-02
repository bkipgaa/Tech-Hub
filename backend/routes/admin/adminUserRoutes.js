/**
 * adminUserRoutes.js
 * ==================
 * Admin management of AdminUser accounts.
 * Mounted at: /api/admin/admin-users  (see routes/admin/index.js)
 *
 * Every route is protected by adminAuth.
 * Coarse access is gated by requireRole; fine-grained checks (self-edits,
 * rank comparison, last-super guard) live in the controller.
 *
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

const { adminAuth, requireRole } = require('../../middleware/AdminAuth');
const ctrl = require('../../controllers/admin/adminUserController');

// Everything below requires a valid, active admin token
router.use(adminAuth);

// ── Read (any admin; controller enforces per-record visibility) ──
router.get('/stats', ctrl.getStats);  // must be BEFORE '/:id'
router.get('/',      ctrl.listAdmins);
router.get('/:id',   ctrl.getAdmin);

// ── Create (admin or super_admin) ────────────────────────────────
router.post(
  '/',
  requireRole('super_admin', 'admin'),
  ctrl.createAdmin
);

// ── Update profile (self or higher-ranked admin) ─────────────────
router.put('/:id', ctrl.updateAdmin);

// ── Change role (super_admin only) ───────────────────────────────
router.put(
  '/:id/role',
  requireRole('super_admin'),
  ctrl.changeRole
);

// ── Activate / deactivate (admin or super_admin) ─────────────────
router.put(
  '/:id/status',
  requireRole('super_admin', 'admin'),
  ctrl.setStatus
);

// ── Reset password (self or higher-ranked admin) ─────────────────
router.put('/:id/password', ctrl.resetPassword);

// ── Delete (super_admin only) ────────────────────────────────────
router.delete(
  '/:id',
  requireRole('super_admin'),
  ctrl.deleteAdmin
);

module.exports = router;