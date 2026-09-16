/**
 * roleController.js
 * =================
 * Admin endpoints for managing roles and permissions.
 * 
 * Endpoints:
 *   GET    /api/admin/roles                    → list all roles
 *   GET    /api/admin/roles/permissions        → list all permissions (grouped by section)
 *   GET    /api/admin/roles/:id                → single role
 *   POST   /api/admin/roles                    → create role
 *   PATCH  /api/admin/roles/:id                → update role
 *   DELETE /api/admin/roles/:id                → delete role (custom only)
 * 
 * @version 1.0.0
 */

const Role = require('../../models/Role');
const Permission = require('../../models/Permission');
const AdminUser = require('../../models/AdminUser');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const handleError = (res, error, message, status = 500, code = 'SERVER_ERROR') => {
  console.error('[roleController]', message, error);
  res.status(status).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
};

/**
 * Attach a count of admins using each role to the role list.
 */
const attachUserCounts = async (roles) => {
  const counts = await AdminUser.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);
  const map = counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {});

  return roles.map((r) => ({
    ...r,
    userCount: map[r.name] || 0,
  }));
};

// ─────────────────────────────────────────────────────────────
// LIST ROLES
// ─────────────────────────────────────────────────────────────
exports.listRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .sort({ isSystem: -1, name: 1 })
      .lean();

    const withCounts = await attachUserCounts(roles);

    res.json({ success: true, data: withCounts });
  } catch (error) {
    handleError(res, error, 'Failed to fetch roles.');
  }
};

// ─────────────────────────────────────────────────────────────
// LIST PERMISSIONS
// ─────────────────────────────────────────────────────────────
exports.listPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find()
      .sort({ section: 1, order: 1, key: 1 })
      .lean();

    res.json({ success: true, data: permissions });
  } catch (error) {
    handleError(res, error, 'Failed to fetch permissions.');
  }
};

// ─────────────────────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────────────────────
exports.getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).lean();
    if (!role) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Role not found.' });
    }

    const userCount = await AdminUser.countDocuments({ role: role.name });

    res.json({ success: true, data: { ...role, userCount } });
  } catch (error) {
    handleError(res, error, 'Failed to fetch role.');
  }
};

// ─────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────
exports.createRole = async (req, res) => {
  try {
    const { name, label, description, permissions = [] } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_NAME',
        message: 'Role name is required.',
      });
    }
    if (!/^[a-z][a-z0-9_]*$/.test(name.trim())) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_NAME',
        message: 'Role name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores.',
      });
    }
    if (!label || !label.trim()) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_LABEL',
        message: 'Role label is required.',
      });
    }
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PERMISSIONS',
        message: 'At least one permission is required.',
      });
    }

    // Check duplicate name
    const existing = await Role.findOne({ name: name.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        code: 'DUPLICATE_NAME',
        message: 'A role with this name already exists.',
      });
    }

    // Validate that all permission keys exist
    const validKeys = await Permission.distinct('key');
    const invalidKeys = permissions.filter((p) => !validKeys.includes(p));
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PERMISSIONS',
        message: `Unknown permission(s): ${invalidKeys.join(', ')}`,
      });
    }

    const role = await Role.create({
      name: name.trim().toLowerCase(),
      label: label.trim(),
      description: description?.trim() || '',
      permissions,
      isSystem: false,
      isActive: true,
      createdBy: req.admin?._id || null,
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully.',
      data: role,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        code: 'DUPLICATE_NAME',
        message: 'A role with this name already exists.',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: Object.values(error.errors).map((e) => e.message).join(', '),
      });
    }
    handleError(res, error, 'Failed to create role.');
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────
exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Role not found.' });
    }

    const { name, label, description, permissions, isActive } = req.body;

    // ── System roles: only allow permission updates, not name ──
    if (role.isSystem && name && name.trim().toLowerCase() !== role.name) {
      return res.status(400).json({
        success: false,
        code: 'SYSTEM_ROLE_NAME_LOCKED',
        message: 'Cannot rename a system role.',
      });
    }

    // ── Permission validation ──
    if (permissions !== undefined) {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({
          success: false,
          code: 'MISSING_PERMISSIONS',
          message: 'At least one permission is required.',
        });
      }
      const validKeys = await Permission.distinct('key');
      const invalidKeys = permissions.filter((p) => !validKeys.includes(p));
      if (invalidKeys.length > 0) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PERMISSIONS',
          message: `Unknown permission(s): ${invalidKeys.join(', ')}`,
        });
      }
      role.permissions = permissions;
    }

    // ── Name change (custom roles only) ──
    if (name && !role.isSystem) {
      const newName = name.trim().toLowerCase();
      if (newName !== role.name) {
        const existing = await Role.findOne({ name: newName, _id: { $ne: role._id } });
        if (existing) {
          return res.status(400).json({
            success: false,
            code: 'DUPLICATE_NAME',
            message: 'A role with this name already exists.',
          });
        }
        role.name = newName;
      }
    }

    if (label !== undefined) role.label = label.trim();
    if (description !== undefined) role.description = description.trim();
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    res.json({
      success: true,
      message: 'Role updated successfully.',
      data: role,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: Object.values(error.errors).map((e) => e.message).join(', '),
      });
    }
    handleError(res, error, 'Failed to update role.');
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Role not found.' });
    }

    // Cannot delete system roles
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        code: 'SYSTEM_ROLE',
        message: 'System roles cannot be deleted. You can edit their permissions instead.',
      });
    }

    // Cannot delete if any admin is using it
    const userCount = await AdminUser.countDocuments({ role: role.name });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        code: 'ROLE_IN_USE',
        message: `${userCount} admin(s) are using this role. Reassign them before deleting.`,
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Role deleted successfully.' });
  } catch (error) {
    handleError(res, error, 'Failed to delete role.');
  }
};