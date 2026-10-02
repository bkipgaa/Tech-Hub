/**
 * adminUserService.js
 * ===================
 * Thin wrapper around the admin-users endpoints.
 * Uses `adminApi` (baseURL → /api/admin) — matches AdminAuthContext.
 *
 * @version 1.0.0
 */

import adminApi from './adminApi';

export const adminUserService = {
  // ── Read ──────────────────────────────────────────────
  list: (params = {}) => adminApi.get('/admin-users', { params }),
  stats: () => adminApi.get('/admin-users/stats'),
  get: (id) => adminApi.get(`/admin-users/${id}`),

  // ── Write ─────────────────────────────────────────────
  create: (payload) => adminApi.post('/admin-users', payload),
  update: (id, payload) => adminApi.put(`/admin-users/${id}`, payload),
  changeRole: (id, role) =>
    adminApi.put(`/admin-users/${id}/role`, { role }),
  setStatus: (id, isActive) =>
    adminApi.put(`/admin-users/${id}/status`, { isActive }),
  resetPassword: (id, payload) =>
    adminApi.put(`/admin-users/${id}/password`, payload),
  remove: (id) => adminApi.delete(`/admin-users/${id}`),
};