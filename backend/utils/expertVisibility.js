/**
 * expertVisibility.js
 * ===================
 * Experts who sign up now wait for an admin to approve them before clients
 * can find them (Technician.awaitingApproval). Spread this into every public
 * query: search, listings, counts and public profiles.
 *
 * Experts who joined before approval was required aren't flagged, so they
 * stay visible as before.
 */

const PUBLIC_EXPERT_FILTER = { awaitingApproval: { $ne: true } };

module.exports = { PUBLIC_EXPERT_FILTER };
