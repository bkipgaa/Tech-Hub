/**
 * adminUserController.js
 * ======================
 * Admin-side management of AdminUser accounts.
 * Mounted at: /api/admin/admin-users
 *
 * All routes are guarded by adminAuth + requireRole (see adminUserRoutes.js).
 * Rank-based checks inside this controller prevent one admin from
 * modifying another at the same or higher level.
 *
 * Endpoints:
 *   GET    /              list / search / paginate
 *   GET    /stats         summary counters
 *   GET    /:id           view one
 *   POST   /              create
 *   PUT    /:id           update profile
 *   PUT    /:id/role      change role
 *   PUT    /:id/status    activate / deactivate
 *   PUT    /:id/password  reset password (self = needs currentPassword)
 *   DELETE /:id           delete
 */

const AdminUser = require('../../models/AdminUser');
const { canManageRole } = require('../../middleware/roleHierarchy');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

function buildPagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const rawLimit = parseInt(query.limit, 10) || PAGE_SIZE_DEFAULT;
  const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, rawLimit));
  return { page, limit, skip: (page - 1) * limit };
}

const clean = (v) => (typeof v === 'string' ? v.trim() : v);

/**
 * Throws a 403 error if `actor` cannot modify `target`.
 * Self is allowed for profile-only updates (the route + controller enforce
 * what self can actually change).
 */
function assertCanManage(actor, target) {
  if (actor._id.toString() === target._id.toString()) return;
  if (!canManageRole(actor.role, target.role)) {
    const err = new Error(
      `You (${actor.role}) cannot manage a ${target.role} account.`
    );
    err.status = 403;
    err.code = 'INSUFFICIENT_RANK';
    throw err;
  }
}

/**
 * Count active super admins other than `excludeId`.
 * Used to block actions that would leave the platform with zero supers.
 */
async function otherActiveSuperAdminCount(excludeId) {
  return AdminUser.countDocuments({
    role: 'super_admin',
    isActive: true,
    _id: { $ne: excludeId },
  });
}

// ═════════════════════════════════════════════════════════════
// LIST
// ═════════════════════════════════════════════════════════════

/**
 * GET /api/admin/admin-users
 * Query: ?page=&limit=&role=&isActive=&search=
 */
exports.listAdmins = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);

    const filter = {};
    if (req.query.role) filter.role = req.query.role.toLowerCase().trim();
    if (req.query.isActive !== undefined && req.query.isActive !== '') {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      const rx = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
    }

    const [items, total] = await Promise.all([
      AdminUser.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminUser.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error('listAdmins error:', err);
    res.status(500).json({ success: false, message: 'Failed to load admins' });
  }
};

// ═════════════════════════════════════════════════════════════
// GET ONE
// ═════════════════════════════════════════════════════════════

/**
 * GET /api/admin/admin-users/:id
 */
exports.getAdmin = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isSelf = admin._id.toString() === req.admin._id.toString();
    if (!isSelf && !canManageRole(req.admin.role, admin.role)) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_RANK',
        message: 'Insufficient permissions to view this admin.',
      });
    }

    res.json({ success: true, data: admin });
  } catch (err) {
    console.error('getAdmin error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin' });
  }
};

// ═════════════════════════════════════════════════════════════
// CREATE
// ═════════════════════════════════════════════════════════════

/**
 * POST /api/admin/admin-users
 * Body: { firstName, lastName, email, password, role, phone? }
 *
 * Rules:
 *   - Actor's rank must be strictly higher than the new role.
 *   - Email must be unique.
 */
exports.createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'firstName, lastName, email, password and role are required',
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const targetRole = role.toLowerCase().trim();

    if (!canManageRole(req.admin.role, targetRole)) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_RANK',
        message: `You (${req.admin.role}) cannot create a ${targetRole} account.`,
      });
    }

    // Validate the role actually exists in the Role collection
    const Role = require('../../models/Role');
    const roleDoc = await Role.findOne({ name: targetRole });
    if (!roleDoc) {
      return res.status(400).json({
        success: false,
        message: `Role "${targetRole}" does not exist.`,
      });
    }
    if (roleDoc.isActive === false) {
      return res.status(400).json({
        success: false,
        message: `Role "${targetRole}" is disabled and cannot be assigned.`,
      });
    }

    const existing = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const admin = await AdminUser.create({
      firstName: clean(firstName),
      lastName: clean(lastName),
      email: email.toLowerCase().trim(),
      password, // hashed by the model's pre-save hook
      role: targetRole,
      phone: clean(phone),
      createdBy: req.admin._id,
      isActive: true,
    });

    res.status(201).json({ success: true, data: admin });
  } catch (err) {
    console.error('createAdmin error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
};

// ═════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ═════════════════════════════════════════════════════════════

/**
 * PUT /api/admin/admin-users/:id
 * Body: { firstName?, lastName?, phone?, profileImage?, notes? }
 * Role is NOT updatable here — see changeRole.
 */
exports.updateAdmin = async (req, res) => {
  try {
    const target = await AdminUser.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isSelf = target._id.toString() === req.admin._id.toString();

    try {
      assertCanManage(req.admin, target);
    } catch (e) {
      return res.status(e.status || 403).json({
        success: false,
        code: e.code,
        message: e.message,
      });
    }

    const allowed = ['firstName', 'lastName', 'phone', 'profileImage'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) target[key] = clean(req.body[key]);
    });

    // `notes` is internal — only higher-ranked admins may edit it, never self
    if (req.body.notes !== undefined && !isSelf) {
      target.notes = String(req.body.notes).slice(0, 500);
    }

    await target.save();
    res.json({ success: true, data: target });
  } catch (err) {
    console.error('updateAdmin error:', err);
    res.status(500).json({ success: false, message: 'Failed to update admin' });
  }
};

// ═════════════════════════════════════════════════════════════
// CHANGE ROLE
// ═════════════════════════════════════════════════════════════

/**
 * PUT /api/admin/admin-users/:id/role
 * Body: { role }
 *
 * Both the CURRENT role and the NEW role must be strictly below the actor's rank.
 * Prevents lateral promotion and privilege escalation.
 */
exports.changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'role is required' });
    }

    const target = await AdminUser.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (target._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    const nextRole = role.toLowerCase().trim();

    // Cannot modify someone at or above your level
    if (!canManageRole(req.admin.role, target.role)) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_RANK',
        message: `You cannot modify a ${target.role} account.`,
      });
    }
    // Cannot promote someone to your level or above
    if (!canManageRole(req.admin.role, nextRole)) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_RANK',
        message: `You cannot assign the ${nextRole} role.`,
      });
    }

    // Validate target role exists & is active
    const Role = require('../../models/Role');
    const roleDoc = await Role.findOne({ name: nextRole });
    if (!roleDoc) {
      return res.status(400).json({
        success: false,
        message: `Role "${nextRole}" does not exist.`,
      });
    }
    if (roleDoc.isActive === false) {
      return res.status(400).json({
        success: false,
        message: `Role "${nextRole}" is disabled.`,
      });
    }

    // If demoting an active super admin, ensure at least one other active super remains
    if (target.role === 'super_admin' && nextRole !== 'super_admin' && target.isActive) {
      const remaining = await otherActiveSuperAdminCount(target._id);
      if (remaining === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the last active super admin.',
        });
      }
    }

    target.role = nextRole;
    await target.save();

    res.json({ success: true, data: target });
  } catch (err) {
    console.error('changeRole error:', err);
    res.status(500).json({ success: false, message: 'Failed to change role' });
  }
};

// ═════════════════════════════════════════════════════════════
// ACTIVATE / DEACTIVATE
// ═════════════════════════════════════════════════════════════

/**
 * PUT /api/admin/admin-users/:id/status
 * Body: { isActive: boolean }
 */
exports.setStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive (boolean) required' });
    }

    const target = await AdminUser.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (target._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot disable your own account',
      });
    }

    try {
      assertCanManage(req.admin, target);
    } catch (e) {
      return res.status(e.status || 403).json({
        success: false,
        code: e.code,
        message: e.message,
      });
    }

    // Guard: cannot disable the last active super admin
    if (!isActive && target.role === 'super_admin') {
      const remaining = await otherActiveSuperAdminCount(target._id);
      if (remaining === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot disable the last active super admin.',
        });
      }
    }

    target.isActive = isActive;
    if (!isActive) target.lockedUntil = undefined;
    await target.save();

    res.json({ success: true, data: target });
  } catch (err) {
    console.error('setStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// ═════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═════════════════════════════════════════════════════════════

/**
 * PUT /api/admin/admin-users/:id/password
 * Body: { newPassword, currentPassword? }
 *
 *   - self      → currentPassword required + must match
 *   - not self  → actor must outrank target
 */
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword, currentPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'newPassword must be at least 8 characters',
      });
    }

    const target = await AdminUser.findById(req.params.id).select('+password');
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const isSelf = target._id.toString() === req.admin._id.toString();

    if (isSelf) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'currentPassword is required to change your own password',
        });
      }
      const ok = await target.comparePassword(currentPassword);
      if (!ok) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }
    } else {
      try {
        assertCanManage(req.admin, target);
      } catch (e) {
        return res.status(e.status || 403).json({
          success: false,
          code: e.code,
          message: e.message,
        });
      }
    }

    target.password = newPassword; // model pre-save hook hashes + timestamps
    target.failedLoginAttempts = 0;
    target.lockedUntil = undefined;
    await target.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// ═════════════════════════════════════════════════════════════
// DELETE
// ═════════════════════════════════════════════════════════════

/**
 * DELETE /api/admin/admin-users/:id
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const target = await AdminUser.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (target._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    try {
      assertCanManage(req.admin, target);
    } catch (e) {
      return res.status(e.status || 403).json({
        success: false,
        code: e.code,
        message: e.message,
      });
    }

    // Guard: cannot delete the last active super admin
    if (target.role === 'super_admin' && target.isActive) {
      const remaining = await otherActiveSuperAdminCount(target._id);
      if (remaining === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last active super admin.',
        });
      }
    }

    await target.deleteOne();
    res.json({ success: true, message: 'Admin deleted' });
  } catch (err) {
    console.error('deleteAdmin error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
};

// ═════════════════════════════════════════════════════════════
// STATS
// ═════════════════════════════════════════════════════════════

/**
 * GET /api/admin/admin-users/stats
 */
exports.getStats = async (req, res) => {
  try {
    const [total, active, inactive, byRoleRaw] = await Promise.all([
      AdminUser.countDocuments(),
      AdminUser.countDocuments({ isActive: true }),
      AdminUser.countDocuments({ isActive: false }),
      AdminUser.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    ]);

    const byRole = byRoleRaw.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: { total, active, inactive, byRole },
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
};