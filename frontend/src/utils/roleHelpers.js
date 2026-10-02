/**
 * roleHelpers.js
 * ==============
 * Shared role utilities. Mirrors the backend hierarchy in
 * scripts/seedAdminRoles.js + middleware/roleHierarchy.js.
 *
 * @version 1.0.0
 */

export const ROLE_RANK = {
  super_admin: 100,
  admin: 50,
  supervisor: 20,
  content_moderator: 15,
  customer_service: 15,
  finance: 15,
  marketing: 15,
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  supervisor: 'Supervisor',
  content_moderator: 'Content Moderator',
  customer_service: 'Customer Service',
  finance: 'Finance',
  marketing: 'Marketing',
};

export const ROLE_BADGE = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  supervisor: 'bg-emerald-100 text-emerald-800',
  content_moderator: 'bg-amber-100 text-amber-800',
  customer_service: 'bg-cyan-100 text-cyan-800',
  finance: 'bg-indigo-100 text-indigo-800',
  marketing: 'bg-pink-100 text-pink-800',
};

export const ALL_ROLES = Object.keys(ROLE_RANK);

export const getRank = (r) => ROLE_RANK[r] ?? 1;

export const canManageRole = (actorRole, targetRole) =>
  getRank(actorRole) > getRank(targetRole);

/** Roles that `actorRole` can assign to others. */
export const assignableRoles = (actorRole) =>
  ALL_ROLES.filter((r) => canManageRole(actorRole, r));

/** Never trust the DB `fullName` virtual — compute from parts if needed. */
export const fullNameOf = (admin) =>
  admin?.fullName ||
  `${admin?.firstName || ''} ${admin?.lastName || ''}`.trim() ||
  admin?.email ||
  '—';