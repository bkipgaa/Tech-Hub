/**
 * adminAuthController.js
 * ======================
 * Admin authentication endpoints:
 *   - POST   /api/admin/auth/login             (public)
 *   - POST   /api/admin/auth/logout            (auth)
 *   - GET    /api/admin/auth/me                (auth)
 *   - PATCH  /api/admin/auth/profile           (auth)
 *   - POST   /api/admin/auth/change-password   (auth)
 *   - POST   /api/admin/auth/refresh           (auth)
 * 
 * @version 2.0.0
 */

const jwt = require('jsonwebtoken');
const AdminUser = require('../../models/AdminUser');
const Role = require('../../models/Role');
const ActivityLog = require('../../models/ActivityLog');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Generate a JWT for an admin.
 */
const signAdminToken = (admin) => {
  const payload = {
    adminId: admin._id.toString(),
    role: admin.role,
    isAdmin: true,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Build a sanitised admin object for the client (no password, no secrets).
 */
const sanitiseAdmin = (admin) => ({
  _id: admin._id,
  firstName: admin.firstName,
  lastName: admin.lastName,
  fullName: `${admin.firstName} ${admin.lastName}`.trim(),
  email: admin.email,
  phone: admin.phone || null,
  profileImage: admin.profileImage || null,
  role: admin.role,
  isActive: admin.isActive,
  lastLogin: admin.lastLogin,
  twoFactorEnabled: admin.twoFactorEnabled,
  createdAt: admin.createdAt,
});

/**
 * Standard error response.
 */
const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ success: false, code, message, ...extra });

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validate input ─────────────────────────────────────
    if (!email || !password) {
      return fail(res, 400, 'MISSING_CREDENTIALS', 'Email and password are required.');
    }

    // ── Find admin (with password this time) ───────────────
    const admin = await AdminUser.findByEmailWithPassword(email);
    if (!admin) {
      // Don't reveal whether the email exists
      return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // ── Check account status ───────────────────────────────
    if (!admin.isActive) {
      return fail(res, 403, 'ADMIN_INACTIVE', 'Your account has been deactivated. Contact a super admin.');
    }

    if (admin.isLocked && admin.isLocked()) {
      const minutesLeft = Math.ceil((admin.lockedUntil - new Date()) / 60000);
      return fail(
        res,
        423,
        'ADMIN_LOCKED',
        `Too many failed attempts. Try again in ${minutesLeft} minute(s).`
      );
    }

    // ── Compare password ───────────────────────────────────
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      await admin.registerFailedLogin();

      // Log the failed attempt
      await ActivityLog.record(
        { admin, ip: req.ip, get: (h) => req.get(h) },
        {
          action: 'login',
          section: 'Authentication',
          description: `Failed login attempt for ${email}`,
          status: 'failed',
          severity: 'high',
        }
      );

      const remaining = Math.max(0, 5 - (admin.failedLoginAttempts || 0));
      return fail(
        res,
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
        remaining > 0 ? { attemptsRemaining: remaining } : {}
      );
    }

    // ── Load role & permissions ────────────────────────────
    const role = await Role.findOne({ name: admin.role });
    if (!role) {
      return fail(
        res,
        403,
        'ROLE_NOT_FOUND',
        `Role "${admin.role}" does not exist. Contact a super admin.`
      );
    }

    if (role.isActive === false) {
      return fail(res, 403, 'ROLE_INACTIVE', 'Your role has been disabled.');
    }

    // ── Record successful login ────────────────────────────
    await admin.registerSuccessfulLogin();

    // Log the successful login
    await ActivityLog.record(
      { admin, ip: req.ip, get: (h) => req.get(h) },
      {
        action: 'login',
        section: 'Authentication',
        description: `Successful login for ${admin.email}`,
        status: 'success',
        severity: 'low',
      }
    );

    // ── Sign the JWT ───────────────────────────────────────
    const token = signAdminToken(admin);

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        admin: sanitiseAdmin(admin),
        role: {
          name: role.name,
          label: role.label,
          description: role.description,
        },
        permissions: role.permissions || [],
      },
    });
  } catch (err) {
    console.error('[adminAuth.login] error:', err);
    return fail(res, 500, 'LOGIN_ERROR', 'Login failed. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/auth/logout
 * 
 * JWTs are stateless — logout is primarily a client-side action
 * (delete the token). We still record the event for audit purposes.
 */
exports.logout = async (req, res) => {
  try {
    await ActivityLog.record(req, {
      action: 'logout',
      section: 'Authentication',
      description: `${req.admin.email} logged out`,
      severity: 'low',
    });

    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('[adminAuth.logout] error:', err);
    // Even if logging fails, consider logout successful
    return res.json({ success: true, message: 'Logged out successfully.' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET CURRENT ADMIN (ME)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/auth/me
 * Returns the current admin's profile + role + permissions.
 */
exports.getMe = async (req, res) => {
  try {
    const admin = req.admin;
    const role = req.adminRole;

    return res.json({
      success: true,
      data: {
        admin: sanitiseAdmin(admin),
        role: {
          name: role.name,
          label: role.label,
          description: role.description,
        },
        permissions: req.adminPermissions || [],
      },
    });
  } catch (err) {
    console.error('[adminAuth.getMe] error:', err);
    return fail(res, 500, 'PROFILE_ERROR', 'Failed to load profile.');
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE OWN PROFILE
// ─────────────────────────────────────────────────────────────

/**
 * PATCH /api/admin/auth/profile
 * Body: { firstName?, lastName?, phone?, profileImage? }
 * 
 * Admins can only edit their own basic info. Role and email
 * changes require a super admin.
 */
exports.updateProfile = async (req, res) => {
  try {
    const admin = req.admin;
    const { firstName, lastName, phone, profileImage } = req.body;

    if (firstName !== undefined) admin.firstName = firstName.trim();
    if (lastName !== undefined) admin.lastName = lastName.trim();
    if (phone !== undefined) admin.phone = phone.trim();
    if (profileImage !== undefined) admin.profileImage = profileImage;

    await admin.save();

    await ActivityLog.record(req, {
      action: 'update_own_profile',
      section: 'Authentication',
      targetType: 'AdminUser',
      targetId: admin._id,
      targetName: admin.email,
      description: `${admin.email} updated their profile`,
      severity: 'low',
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { admin: sanitiseAdmin(admin) },
    });
  } catch (err) {
    console.error('[adminAuth.updateProfile] error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return fail(res, 400, 'VALIDATION_ERROR', messages.join(', '));
    }
    return fail(res, 500, 'PROFILE_UPDATE_ERROR', 'Failed to update profile.');
  }
};

// ─────────────────────────────────────────────────────────────
// CHANGE OWN PASSWORD
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/auth/change-password
 * Body: { currentPassword, newPassword }
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // ── Validate input ─────────────────────────────────────
    if (!currentPassword || !newPassword) {
      return fail(
        res,
        400,
        'MISSING_FIELDS',
        'Both current and new password are required.'
      );
    }

    if (newPassword.length < 8) {
      return fail(
        res,
        400,
        'PASSWORD_TOO_SHORT',
        'New password must be at least 8 characters.'
      );
    }

    if (currentPassword === newPassword) {
      return fail(
        res,
        400,
        'SAME_PASSWORD',
        'New password must be different from the current one.'
      );
    }

    // ── Reload admin with password ─────────────────────────
    const admin = await AdminUser.findById(req.admin._id).select('+password');
    if (!admin) {
      return fail(res, 404, 'ADMIN_NOT_FOUND', 'Admin account not found.');
    }

    // ── Verify current password ────────────────────────────
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      await ActivityLog.record(req, {
        action: 'change_password',
        section: 'Authentication',
        targetType: 'AdminUser',
        targetId: admin._id,
        targetName: admin.email,
        description: `Failed password change attempt for ${admin.email}`,
        status: 'failed',
        severity: 'high',
      });
      return fail(res, 401, 'INVALID_PASSWORD', 'Current password is incorrect.');
    }

    // ── Update & save (pre-save hook will hash it) ─────────
    admin.password = newPassword;
    await admin.save();

    await ActivityLog.record(req, {
      action: 'change_password',
      section: 'Authentication',
      targetType: 'AdminUser',
      targetId: admin._id,
      targetName: admin.email,
      description: `${admin.email} changed their password`,
      severity: 'high',
    });

    return res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (err) {
    console.error('[adminAuth.changePassword] error:', err);
    return fail(res, 500, 'PASSWORD_CHANGE_ERROR', 'Failed to change password.');
  }
};

// ─────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/auth/refresh
 * Issues a fresh JWT using the currently valid one.
 * Requires adminAuth middleware to have run.
 */
exports.refresh = async (req, res) => {
  try {
    const admin = req.admin;
    const token = signAdminToken(admin);

    return res.json({
      success: true,
      message: 'Token refreshed.',
      data: { token },
    });
  } catch (err) {
    console.error('[adminAuth.refresh] error:', err);
    return fail(res, 500, 'REFRESH_ERROR', 'Failed to refresh token.');
  }
};

// ─────────────────────────────────────────────────────────────
// SESSION CHECK (lightweight)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/auth/check
 * Quickly validates that the current token is still valid.
 * Requires adminAuth middleware.
 */
exports.check = async (req, res) => {
  return res.json({
    success: true,
    data: {
      valid: true,
      admin: {
        _id: req.admin._id,
        fullName: `${req.admin.firstName} ${req.admin.lastName}`.trim(),
        role: req.admin.role,
      },
    },
  });
};