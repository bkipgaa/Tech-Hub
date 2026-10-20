/**
 * ensureListingPermissions.js
 * ===========================
 * Adds the Stays & Spaces listing-review permissions to an existing database
 * without re-running scripts/seedAdminRoles.js: creates the permission
 * records and gives them to the super_admin, admin and content_moderator
 * roles. Safe to run on every start ($addToSet never duplicates).
 */

const Permission = require('../models/Permission');
const Role = require('../models/Role');

const PERMISSIONS = [
  { section: 'Listings', key: 'listings.view', label: 'View Listings', order: 1 },
  { section: 'Listings', key: 'listings.review', label: 'Approve, Reject & Hide Listings', order: 2 },
];
const ROLES = ['super_admin', 'admin', 'content_moderator'];

const ensureListingPermissions = async () => {
  for (const p of PERMISSIONS) {
    await Permission.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true });
  }
  await Role.updateMany(
    { name: { $in: ROLES } },
    { $addToSet: { permissions: { $each: PERMISSIONS.map((p) => p.key) } } }
  );
};

module.exports = ensureListingPermissions;
