/**
 * PermissionGate.jsx
 * ==================
 * Conditionally render children based on the admin's permissions.
 * 
 * Unlike ProtectedAdminRoute, this does NOT redirect — it just
 * hides content (or shows a fallback). Perfect for:
 *   - Hiding "Delete" buttons for read-only admins
 *   - Showing/hiding table columns
 *   - Disabling sections of a page
 * 
 * Usage:
 *   <PermissionGate permission="technicians.delete">
 *     <button>Delete</button>
 *   </PermissionGate>
 * 
 *   <PermissionGate
 *     anyOf={['technicians.edit', 'technicians.verify']}
 *     fallback={<span>Read-only</span>}
 *   >
 *     <EditMenu />
 *   </PermissionGate>
 * 
 * @version 1.0.0
 */

import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const PermissionGate = ({
  permission,   // single permission string
  anyOf,        // array — at least one required
  allOf,        // array — all required
  role,         // single role name
  roles,        // array of role names (any match)
  fallback = null,
  children,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  } = useAdminAuth();

  let allowed = true;

  // If any check is specified, apply them all (AND logic)
  if (permission) allowed = allowed && hasPermission(permission);
  if (anyOf) allowed = allowed && hasAnyPermission(...anyOf);
  if (allOf) allowed = allowed && hasAllPermissions(...allOf);
  if (role) allowed = allowed && hasRole(role);
  if (roles) allowed = allowed && hasRole(...roles);

  return allowed ? children : fallback;
};

export default PermissionGate;  