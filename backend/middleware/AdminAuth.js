/**
 * adminAuth.js
 * ============
 * Admin authentication & authorization middleware.
 * 
 * Exports:
 *   - adminAuth          → verifies JWT, loads admin + role + permissions
 *   - requirePermission  → ensures admin has ALL specified permission(s)
 *   - requireAnyPermission → ensures admin has AT LEAST ONE
 *   - requireRole        → ensures admin has one of the given roles
 *   - optionalAdminAuth  → like adminAuth but doesn't fail if no token
 * 
 * After adminAuth runs, these are available on the request:
 *   req.admin              → the AdminUser document
 *   req.adminRole          → the Role document
 *   req.adminPermissions   → array of permission keys (e.g. ['technicians.view'])
 * 
 * @version 2.0.0
 */

const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Role = require('../models/Role');

// ─────────────────────────────────────────────────────────────
// MAIN MIDDLEWARE
// ─────────────────────────────────────────────────────────────

/**
 * Verify the admin's JWT and attach admin, role, and permissions to req.
 * Rejects the request if anything is invalid.
 */
const adminAuth = async (req, res, next) => {
  try {
    // ── 1. Extract token ───────────────────────────────────
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Authentication required. Please log in.',
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'EMPTY_TOKEN',
        message: 'Authentication required.',
      });
    }

    // ── 2. Verify JWT signature & expiry ───────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Session expired. Please log in again.',
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token.',
        });
      }
      throw err;
    }

    // ── 3. Ensure it's an admin token ──────────────────────
    if (!decoded.isAdmin || !decoded.adminId) {
      return res.status(403).json({
        success: false,
        code: 'NOT_ADMIN_TOKEN',
        message: 'This token is not authorized for admin access.',
      });
    }

    // ── 4. Load admin from DB ──────────────────────────────
    const admin = await AdminUser.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        code: 'ADMIN_NOT_FOUND',
        message: 'Admin account no longer exists.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ADMIN_INACTIVE',
        message: 'Your account has been deactivated. Contact a super admin.',
      });
    }

    // Check if account is temporarily locked
    if (admin.isLocked && admin.isLocked()) {
      return res.status(423).json({
        success: false,
        code: 'ADMIN_LOCKED',
        message: 'Your account is temporarily locked. Try again later.',
      });
    }

    // ── 5. Load the role & permissions ─────────────────────
    const role = await Role.findOne({ name: admin.role });
    if (!role) {
      return res.status(403).json({
        success: false,
        code: 'ROLE_NOT_FOUND',
        message: `Role "${admin.role}" no longer exists. Contact a super admin.`,
      });
    }

    if (role.isActive === false) {
      return res.status(403).json({
        success: false,
        code: 'ROLE_INACTIVE',
        message: 'Your role has been disabled. Contact a super admin.',
      });
    }

    // ── 6. Attach to request ───────────────────────────────
    req.admin = admin;
    req.adminRole = role;
    req.adminPermissions = role.permissions || [];

    next();
  } catch (err) {
    console.error('[adminAuth] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authentication failed. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────
// PERMISSION CHECKS
// ─────────────────────────────────────────────────────────────

/**
 * Require ALL specified permissions.
 * 
 * Usage:
 *   router.delete('/:id', requirePermission('technicians.delete'), ctrl.delete);
 *   router.put('/:id', requirePermission('technicians.edit', 'technicians.view'), ctrl.update);
 */
const requirePermission = (...required) => (req, res, next) => {
  if (!req.adminPermissions) {
    return res.status(500).json({
      success: false,
      code: 'AUTH_MISCONFIGURED',
      message: 'Permission check ran before adminAuth.',
    });
  }

  const missing = required.filter((p) => !req.adminPermissions.includes(p));
  if (missing.length > 0) {
    return res.status(403).json({
      success: false,
      code: 'MISSING_PERMISSION',
      message: `You do not have permission to perform this action.`,
      required,
      missing,
    });
  }

  next();
};

/**
 * Require AT LEAST ONE of the specified permissions.
 * 
 * Usage:
 *   router.get('/', requireAnyPermission('technicians.view', 'users.view'), ctrl.list);
 */
const requireAnyPermission = (...anyOf) => (req, res, next) => {
  if (!req.adminPermissions) {
    return res.status(500).json({
      success: false,
      code: 'AUTH_MISCONFIGURED',
      message: 'Permission check ran before adminAuth.',
    });
  }

  const has = anyOf.some((p) => req.adminPermissions.includes(p));
  if (!has) {
    return res.status(403).json({
      success: false,
      code: 'MISSING_PERMISSION',
      message: `You need at least one of: ${anyOf.join(', ')}.`,
      required: anyOf,
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────────
// ROLE CHECKS
// ─────────────────────────────────────────────────────────────

/**
 * Require the admin to have one of the specified roles.
 * Useful for super-admin-only operations (e.g., role management).
 * 
 * Usage:
 *   router.post('/roles', requireRole('super_admin'), roleCtrl.create);
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.admin) {
    return res.status(500).json({
      success: false,
      code: 'AUTH_MISCONFIGURED',
      message: 'Role check ran before adminAuth.',
    });
  }

  if (!roles.includes(req.admin.role)) {
    return res.status(403).json({
      success: false,
      code: 'MISSING_ROLE',
      message: `This action requires one of: ${roles.join(', ')}.`,
      required: roles,
      yourRole: req.admin.role,
    });
  }

  next();
};

/**
 * Shorthand for `requireRole('super_admin')`.
 */
const requireSuperAdmin = requireRole('super_admin');

// ─────────────────────────────────────────────────────────────
// OPTIONAL AUTH
// ─────────────────────────────────────────────────────────────

/**
 * Like adminAuth, but does NOT fail if no token is provided.
 * Useful for endpoints that behave differently for admins vs public.
 * Attaches req.admin if the token is present and valid.
 */
const optionalAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // no token — continue as guest
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.isAdmin || !decoded.adminId) {
      return next(); // not an admin token — continue as guest
    }

    const admin = await AdminUser.findById(decoded.adminId);
    if (!admin || !admin.isActive) return next();

    const role = await Role.findOne({ name: admin.role });
    if (!role || role.isActive === false) return next();

    req.admin = admin;
    req.adminRole = role;
    req.adminPermissions = role.permissions || [];

    next();
  } catch {
    // Any error → continue as guest
    next();
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  adminAuth,
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireSuperAdmin,
  optionalAdminAuth,
};