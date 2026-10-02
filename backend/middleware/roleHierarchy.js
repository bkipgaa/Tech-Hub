/**
 * roleHierarchy.js
 * ================
 * Rank ladder for role-based admin authorization.
 * Must match the roles seeded in scripts/seedAdminRoles.js.
 *
 * Rule: actor.rank > target.rank  →  actor can manage target.
 *
 * @version 1.1.0
 */

const ROLE_RANK = {
  super_admin: 100,
  admin: 50,
  supervisor: 20,
  content_moderator: 15,
  customer_service: 15,
  finance: 15,
  marketing: 15,
};

/** Unknown roles get rank 1 so they can never manage anything. */
const getRank = (roleName) => ROLE_RANK[roleName] ?? 1;

const canManageRole = (actorRole, targetRole) =>
  getRank(actorRole) > getRank(targetRole);

module.exports = { ROLE_RANK, getRank, canManageRole };