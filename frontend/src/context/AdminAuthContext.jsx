/**
 * AdminAuthContext.jsx
 * ====================
 * Admin session context.
 * 
 * SEPARATE from the regular AuthContext because:
 *   - Admin tokens live in `adminToken`, not `token`
 *   - Admin sessions must not interfere with user sessions
 *   - Admin panel has its own permissions/roles system
 *   - Auto-logout rules differ from the regular app
 * 
 * Exposes:
 *   - admin                : the current admin user object
 *   - role                 : { name, label, description }
 *   - permissions          : array of permission keys
 *   - loading              : true while hydrating from localStorage
 *   - login(email, pw)     : authenticates and stores the session
 *   - logout()             : clears session and redirects
 *   - refreshProfile()     : re-fetches /auth/me
 *   - hasPermission(key)   : boolean
 *   - hasAnyPermission(..) : boolean
 *   - hasAllPermissions(..): boolean
 *   - hasRole(...)         : boolean
 * 
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../services/adminApi';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  // ─── STATE ────────────────────────────────────────────────
  const [admin, setAdmin] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ─── HYDRATE FROM LOCALSTORAGE ON MOUNT ──────────────────
  useEffect(() => {
    const hydrate = () => {
      try {
        const token = localStorage.getItem('adminToken');
        const data = localStorage.getItem('adminData');

        if (token && data) {
          const parsed = JSON.parse(data);
          setAdmin(parsed.admin || null);
          setRole(parsed.role || null);
          setPermissions(parsed.permissions || []);
        }
      } catch (err) {
        console.error('[AdminAuth] Failed to hydrate session:', err);
        // Corrupt data → clear it
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  // ─── HELPER: PERSIST SESSION ─────────────────────────────
  const persistSession = useCallback((token, adminObj, roleObj, perms) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem(
      'adminData',
      JSON.stringify({ admin: adminObj, role: roleObj, permissions: perms })
    );
    setAdmin(adminObj);
    setRole(roleObj);
    setPermissions(perms || []);
  }, []);

  // ─── LOGIN ────────────────────────────────────────────────
  /**
   * Authenticate an admin and store the session.
   * Throws an error object { code, message } on failure.
   */
  const login = useCallback(async (email, password) => {
    try {
      const res = await adminApi.post('/auth/login', { email, password });
      const { token, admin: adminObj, role: roleObj, permissions: perms } = res.data.data;

      persistSession(token, adminObj, roleObj, perms);

      return res.data;
    } catch (err) {
      // Re-throw a clean error object for the login page to display
      const message =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please try again.';
      const code = err.response?.data?.code || 'LOGIN_ERROR';
      const attemptsRemaining = err.response?.data?.attemptsRemaining;

      throw { code, message, attemptsRemaining };
    }
  }, [persistSession]);

  // ─── LOGOUT ───────────────────────────────────────────────
  /**
   * Clear the admin session. Attempts to notify the backend
   * (best effort), then redirects to /admin/login.
   */
  const logout = useCallback(async () => {
    try {
      // Only call the backend if we have a token (avoid 401 noise)
      if (localStorage.getItem('adminToken')) {
        await adminApi.post('/auth/logout');
      }
    } catch (err) {
      // Ignore network errors on logout — we clear local state anyway
      console.warn('[AdminAuth] Logout API call failed (ignored):', err?.message);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      setAdmin(null);
      setRole(null);
      setPermissions([]);
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  // ─── REFRESH PROFILE ─────────────────────────────────────
  /**
   * Re-fetch the current admin profile + permissions from the server.
   * Useful if the role changes mid-session.
   */
  const refreshProfile = useCallback(async () => {
    try {
      const res = await adminApi.get('/auth/me');
      const { admin: adminObj, role: roleObj, permissions: perms } = res.data.data;

      // Update both state and localStorage
      const token = localStorage.getItem('adminToken');
      if (token) persistSession(token, adminObj, roleObj, perms);

      return { admin: adminObj, role: roleObj, permissions: perms };
    } catch (err) {
      console.error('[AdminAuth] Failed to refresh profile:', err);
      throw err;
    }
  }, [persistSession]);

  // ─── PERMISSION HELPERS ──────────────────────────────────
  const hasPermission = useCallback(
    (key) => !!key && permissions.includes(key),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...keys) => keys.some((k) => permissions.includes(k)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (...keys) => keys.every((k) => permissions.includes(k)),
    [permissions]
  );

  const hasRole = useCallback(
    (...roles) => roles.includes(admin?.role),
    [admin]
  );

  // ─── CONTEXT VALUE ───────────────────────────────────────
  const value = {
    // state
    admin,
    role,
    permissions,
    loading,
    isAuthenticated: !!admin,

    // actions
    login,
    logout,
    refreshProfile,

    // helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────
export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an <AdminAuthProvider>');
  }
  return ctx;
};

export default AdminAuthContext;