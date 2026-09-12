/**
 * Role.js
 * =======
 * A Role is a named bundle of permissions.
 * 
 * Examples:
 *   - "super_admin"      → all permissions
 *   - "supervisor"       → view + approve permissions
 *   - "customer_service" → view-only permissions
 * 
 * System roles (isSystem: true) cannot be deleted via the UI.
 * Admins are assigned a role by its `name` (see AdminUser.js).
 * 
 * @version 2.0.0
 */

const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  // ─── Identity ──────────────────────────────────────────────

  /**
   * Unique machine-readable name used in code and stored on AdminUser.role.
   * Always lowercase with underscores, e.g. "super_admin".
   */
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [50, 'Role name must be 50 characters or fewer'],
    match: [/^[a-z][a-z0-9_]*$/, 'Role name must be lowercase letters, numbers, and underscores only'],
  },

  /**
   * Human-readable name shown in the UI, e.g. "Super Admin".
   */
  label: {
    type: String,
    required: [true, 'Role label is required'],
    trim: true,
    maxlength: [100, 'Role label must be 100 characters or fewer'],
  },

  /**
   * Optional description explaining the role's purpose.
   */
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be 500 characters or fewer'],
  },

  // ─── Permissions ───────────────────────────────────────────

  /**
   * Array of permission keys (matching Permission.key).
   * e.g. ["technicians.view", "technicians.edit", "bookings.view"]
   * 
   * Stored as strings (not ObjectIds) for fast `includes()` checks.
   */
  permissions: [{
    type: String,
    trim: true,
  }],

  // ─── Meta ──────────────────────────────────────────────────

  /**
   * `true` for roles shipped with the system (super_admin, admin, etc.).
   * These cannot be deleted through the UI, only edited.
   */
  isSystem: {
    type: Boolean,
    default: false,
  },

  /**
   * Soft-disable a role without deleting it. Inactive roles
   * cannot be assigned to new admins.
   */
  isActive: {
    type: Boolean,
    default: true,
  },

  /**
   * Which admin created this role? Useful for auditing.
   * System roles have this as null.
   */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null,
  },

}, {
  timestamps: true,
});

// ─── Indexes ────────────────────────────────────────────────

roleSchema.index({ isActive: 1 });
roleSchema.index({ permissions: 1 }); // for "find roles with permission X"

// ─── Virtuals ───────────────────────────────────────────────

/**
 * Permission count for display in the UI.
 */
roleSchema.virtual('permissionCount').get(function () {
  return this.permissions?.length || 0;
});

// ─── Methods ────────────────────────────────────────────────

/**
 * Check if this role includes a specific permission.
 * @param {string} permissionKey
 * @returns {boolean}
 */
roleSchema.methods.hasPermission = function (permissionKey) {
  return this.permissions.includes(permissionKey);
};

/**
 * Check if this role includes ANY of the given permissions.
 */
roleSchema.methods.hasAnyPermission = function (...permissionKeys) {
  return permissionKeys.some((k) => this.permissions.includes(k));
};

// ─── Serialization ──────────────────────────────────────────

roleSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Role', roleSchema);