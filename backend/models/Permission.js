/**
 * Permission.js
 * =============
 * Defines every individual action an admin can perform.
 * 
 * Permissions are grouped by `section` (the app module)
 * and can be filtered in the UI by that section.
 */

const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  /**
   * The unique key used in code, e.g. "technicians.view".
   * Convention: "<section>.<action>"
   */
  key: {
    type: String,
    required: true,
    unique: true,
  },

  /**
   * Human-readable label, e.g. "View Technicians".
   */
  label: {
    type: String,
    required: true,
  },

  /**
   * The section this permission belongs to (the module).
   * e.g. "Technicians", "Bookings", "Revenue".
   * 
   * Used to group permissions in the role editor UI.
   */
  section: {
    type: String,
    required: true,
    index: true,
  },

  /**
   * Optional sub-category for finer grouping within a section.
   * e.g. "Technicians" → "Technicians.Management"
   */
  category: String,

  /**
   * Longer description shown as a tooltip.
   */
  description: String,

  /**
   * Display order within a section (lower = first).
   */
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Index for fast filtering by section
permissionSchema.index({ section: 1, order: 1 });

module.exports = mongoose.model('Permission', permissionSchema);