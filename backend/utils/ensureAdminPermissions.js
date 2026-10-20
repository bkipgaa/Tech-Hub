/**
 * ensureAdminPermissions.js
 * =========================
 * Makes sure the review permissions exist in the database and belong to the
 * roles that review content, without re-running scripts/seedAdminRoles.js:
 *   - Stays & Spaces listings: listings.view, listings.review
 *   - Job posts: jobs.view, jobs.approve, jobs.reject
 * Given to super_admin, admin and content_moderator. Safe to run on every
 * start ($setOnInsert / $addToSet never duplicate or overwrite edits).
 */

const Permission = require('../models/Permission');
const Role = require('../models/Role');

const PERMISSIONS = [
  { section: 'Listings', key: 'listings.view', label: 'View Listings', order: 1 },
  { section: 'Listings', key: 'listings.review', label: 'Approve, Reject & Hide Listings', order: 2 },
  { section: 'Jobs', key: 'jobs.view', label: 'View Jobs', order: 1 },
  { section: 'Jobs', key: 'jobs.approve', label: 'Approve Jobs', order: 2 },
  { section: 'Jobs', key: 'jobs.reject', label: 'Reject Jobs', order: 3 },
];
const ROLES = ['super_admin', 'admin', 'content_moderator'];

const ensureAdminPermissions = async () => {
  for (const p of PERMISSIONS) {
    await Permission.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true });
  }
  await Role.updateMany(
    { name: { $in: ROLES } },
    { $addToSet: { permissions: { $each: PERMISSIONS.map((p) => p.key) } } }
  );
};

module.exports = ensureAdminPermissions;
