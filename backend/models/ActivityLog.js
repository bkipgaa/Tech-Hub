/**
 * ActivityLog.js
 * ==============
 * Immutable audit trail of every mutating action an admin performs.
 * 
 * Every important operation (approving a job, deleting a technician,
 * marking a commission paid, etc.) creates an entry here.
 * 
 * Used for:
 *   - Compliance / audit
 *   - Debugging ("who changed this?")
 *   - Security ("who logged in from that IP?")
 * 
 * @version 2.0.0
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // ─── Who ───────────────────────────────────────────────────

  /**
   * Reference to the AdminUser who performed the action.
   */
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true,
  },

  /**
   * Denormalized name ("First Last"). Persists even if the admin is
   * later deleted from the database.
   */
  adminName: {
    type: String,
    trim: true,
  },

  /**
   * Denormalized role (e.g. "super_admin"). Same persistence rationale.
   */
  adminRole: {
    type: String,
    trim: true,
  },

  // ─── What ──────────────────────────────────────────────────

  /**
   * Short action code, e.g. "approve_job", "delete_technician".
   * Lowercase, snake_case, verb_noun.
   */
  action: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Action must be 100 characters or fewer'],
  },

  /**
   * The section of the admin panel this action belongs to.
   * Matches the `section` field in the Permission model.
   * e.g. "Bookings", "Technicians", "Revenue".
   */
  section: {
    type: String,
    trim: true,
  },

  // ─── Target ────────────────────────────────────────────────

  /**
   * Type of entity affected, e.g. "Job", "Technician", "Booking".
   * Matches the model name.
   */
  targetType: {
    type: String,
    trim: true,
  },

  /**
   * ID of the affected entity. Stored as a raw ObjectId (not a ref)
   * because the target may be deleted later, and the target type varies.
   */
  targetId: mongoose.Schema.Types.ObjectId,

  /**
   * Denormalized target name for display, e.g. "Job #12345".
   */
  targetName: {
    type: String,
    trim: true,
  },

  // ─── Context ───────────────────────────────────────────────

  /**
   * Human-readable summary: "Approved job 'Fix AC'".
   */
  description: {
    type: String,
    maxlength: [500, 'Description must be 500 characters or fewer'],
  },

  /**
   * Free-form JSON payload for extra context.
   * Examples:
   *   { oldValue: 'pending', newValue: 'active' }
   *   { amount: 500, reason: 'refund' }
   */
  metadata: mongoose.Schema.Types.Mixed,

  /**
   * IP address of the admin's request.
   */
  ipAddress: {
    type: String,
    trim: true,
  },

  /**
   * Browser / client user-agent string.
   */
  userAgent: {
    type: String,
    trim: true,
  },

  /**
   * Optional correlation ID for chaining multi-step actions.
   */
  requestId: {
    type: String,
    trim: true,
  },

  // ─── Outcome ───────────────────────────────────────────────

  /**
   * Whether the action succeeded or failed.
   */
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },

  /**
   * Severity level for filtering and alerting.
   *  - low:      routine (view, list, export)
   *  - medium:   mutating (edit, approve)
   *  - high:     destructive (delete, cancel, refund)
   *  - critical: security-sensitive (role change, admin create)
   */
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },

}, {
  timestamps: true,

  // Logs should never be updated via Mongoose — only created.
  strict: true,
});

// ─── Indexes ────────────────────────────────────────────────

// "What did admin X do recently?"
activityLogSchema.index({ adminId: 1, createdAt: -1 });

// "Show all 'approve_job' actions"
activityLogSchema.index({ action: 1, createdAt: -1 });

// "History of this specific entity"
activityLogSchema.index({ targetType: 1, targetId: 1 });

// "All activity in the 'Bookings' section"
activityLogSchema.index({ section: 1, createdAt: -1 });

// "All failed actions"
activityLogSchema.index({ status: 1, createdAt: -1 });

// "Activity from a suspicious IP"
activityLogSchema.index({ ipAddress: 1, createdAt: -1 });

// "All high-severity events"
activityLogSchema.index({ severity: 1, createdAt: -1 });

// ─── Virtuals ───────────────────────────────────────────────

/**
 * Human-friendly timestamp for display.
 */
activityLogSchema.virtual('when').get(function () {
  return this.createdAt;
});

// ─── Statics ────────────────────────────────────────────────

/**
 * Convenience static for creating a log entry from a request.
 * 
 * Usage:
 *   await ActivityLog.record(req, {
 *     action: 'approve_job',
 *     section: 'Jobs',
 *     targetType: 'Job',
 *     targetId: job._id,
 *     targetName: job.title,
 *     description: `Approved job "${job.title}"`,
 *     severity: 'medium',
 *     metadata: { oldStatus: 'pending', newStatus: 'active' },
 *   });
 */
activityLogSchema.statics.record = async function (req, options = {}) {
  try {
    if (!req?.admin) return null;

    return await this.create({
      adminId: req.admin._id,
      adminName: `${req.admin.firstName} ${req.admin.lastName}`.trim(),
      adminRole: req.admin.role,
      action: options.action,
      section: options.section,
      targetType: options.targetType,
      targetId: options.targetId,
      targetName: options.targetName,
      description: options.description,
      metadata: options.metadata,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get?.('user-agent'),
      requestId: req.get?.('x-request-id'),
      status: options.status || 'success',
      severity: options.severity || 'low',
    });
  } catch (err) {
    console.error('ActivityLog.record failed:', err.message);
    return null;
  }
};

// ─── Serialization ──────────────────────────────────────────

activityLogSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);