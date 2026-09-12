/**
 * AdminUser.js
 * ============
 * Admin accounts (super admins, admins, supervisors, etc.).
 * 
 * SEPARATE from the regular `User` model because:
 *   - Admins log in via a different endpoint (/api/admin/auth/login)
 *   - Admins have a `role` field tied to the Role collection
 *   - Admin tokens include an `isAdmin: true` flag
 *   - Admin accounts are managed only by other admins
 * 
 * @version 2.0.0
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
  // ─── Basic Profile ─────────────────────────────────────────

  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name must be 50 characters or fewer'],
  },

  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name must be 50 characters or fewer'],
  },

  /**
   * Unique email used for login. Always stored lowercase.
   */
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },

  /**
   * Hashed password (bcrypt, 12 rounds).
   * Hashed automatically by the pre-save hook below.
   * `select: false` prevents accidental leakage in API responses.
   */
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // 🔒 never returned by default
  },

  phone: {
    type: String,
    trim: true,
  },

  profileImage: String,

  // ─── Authorization ─────────────────────────────────────────

  /**
   * The role name (matching Role.name), e.g. "super_admin".
   * This determines what permissions the admin has.
   */
  role: {
    type: String,
    required: [true, 'Role is required'],
    lowercase: true,
    trim: true,
  },

  // ─── Account Status ────────────────────────────────────────

  /**
   * Soft-disable an admin without deleting them.
   * If false, login is rejected.
   */
  isActive: {
    type: Boolean,
    default: true,
  },

  /**
   * Track the last successful login.
   */
  lastLogin: Date,

  /**
   * When was the password last changed? Useful for security policies.
   */
  lastPasswordChange: Date,

  // ─── Brute-force Protection ────────────────────────────────

  failedLoginAttempts: {
    type: Number,
    default: 0,
  },

  /**
   * If set and in the future, login is temporarily blocked.
   * Typically set after 5 failed attempts (e.g., +15 minutes).
   */
  lockedUntil: Date,

  // ─── Meta ──────────────────────────────────────────────────

  /**
   * Who created this admin? Super admins have this as null.
   */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    default: null,
  },

  /**
   * Placeholder for future 2FA support.
   */
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },

  /**
   * Internal notes (e.g., "on probation", "team: finance").
   * Not visible to the admin themselves.
   */
  notes: {
    type: String,
    maxlength: [500, 'Notes must be 500 characters or fewer'],
  },

}, {
  timestamps: true,

  // Strip sensitive fields when serialising to JSON
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.failedLoginAttempts;
      delete ret.lockedUntil;
      delete ret.__v;
      return ret;
    },
  },
});

// ─── Indexes ────────────────────────────────────────────────

adminUserSchema.index({ role: 1 });
adminUserSchema.index({ isActive: 1 });
adminUserSchema.index({ createdAt: -1 });

// ─── Virtuals ───────────────────────────────────────────────

/**
 * Full name for display purposes.
 */
adminUserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// ─── Pre-save Hooks ─────────────────────────────────────────

/**
 * Hash the password before saving, but only if it was modified.
 * Also records the last password change timestamp.
 */
adminUserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.lastPasswordChange = new Date();
});

// ─── Instance Methods ───────────────────────────────────────

/**
 * Compare a plaintext candidate with the stored hash.
 * Returns true if they match.
 * 
 * Note: requires the document to have been fetched with `.select('+password')`.
 */
adminUserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Is the account currently locked out due to failed login attempts?
 */
adminUserSchema.methods.isLocked = function () {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
};

/**
 * Register a failed login attempt. Locks the account after 5 attempts.
 */
adminUserSchema.methods.registerFailedLogin = async function () {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;

  // Lock for 15 minutes after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  return this.save();
};

/**
 * Register a successful login. Resets counters and records the timestamp.
 */
adminUserSchema.methods.registerSuccessfulLogin = async function () {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};

// ─── Statics ────────────────────────────────────────────────

/**
 * Find an admin by email, including the (normally hidden) password field.
 * Used by the login controller.
 */
adminUserSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() }).select('+password');
};

module.exports = mongoose.model('AdminUser', adminUserSchema);