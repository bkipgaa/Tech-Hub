/**
 * AdminUsers.jsx
 * ==============
 * Admin-side management of AdminUser accounts.
 *
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminUserService } from '../../services/adminUserService';
import { ALL_ROLES, ROLE_LABELS, assignableRoles } from '../../utils/roleHelpers';
import AdminUserStats from '../../components/admin/AdminUserStats';
import AdminUserTable from '../../components/admin/AdminUserTable';
import AdminUserFormModal from '../../components/admin/AdminUserFormModal';
import AdminChangeRoleModal from '../../components/admin/AdminChangeRoleModal';
import AdminResetPasswordModal from '../../components/admin/AdminResetPasswordModal';
import AdminDeleteConfirmModal from '../../components/admin/AdminDeleteConfirmModal';

export default function AdminUsers() {
  const { admin: currentAdmin } = useAdminAuth();

  // Data
  const [admins, setAdmins] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // UI
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Loaders ─────────────────────────────────────────────
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminUserService.list({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === '' ? undefined : statusFilter === 'active',
      });
      setAdmins(res.data?.data || []);
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminUserService.stats();
      setStats(res.data?.data || null);
    } catch {
      /* non-fatal */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Debounce filters → reset to page 1
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search, roleFilter, statusFilter]);

  const refreshAll = () => {
    setRefreshing(true);
    loadAdmins();
    loadStats();
  };

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Row actions ─────────────────────────────────────────
  const handleToggleStatus = async (admin) => {
    try {
      await adminUserService.setStatus(admin._id, !admin.isActive);
      showToast(`${admin.firstName} ${admin.lastName} ${admin.isActive ? 'disabled' : 'enabled'}`);
      refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  // ── Modal success handlers ──────────────────────────────
  const handleCreated = () => {
    setShowCreate(false);
    showToast('Admin created');
    refreshAll();
  };
  const handleEdited = () => {
    setEditingAdmin(null);
    showToast('Admin updated');
    refreshAll();
  };
  const handleRoleChanged = () => {
    setRoleTarget(null);
    showToast('Role updated');
    refreshAll();
  };
  const handlePasswordChanged = () => {
    setPasswordTarget(null);
    showToast('Password updated');
    refreshAll();
  };
  const handleDeleted = () => {
    setDeleteTarget(null);
    showToast('Admin deleted');
    refreshAll();
  };

  // ── Render ──────────────────────────────────────────────
  const canCreate = assignableRoles(currentAdmin?.role).length > 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Admin Accounts</h2>
          <p className="text-sm text-gray-500">
            Manage platform administrators, roles, and access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-2 text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Admin
            </button>
          )}
        </div>
      </div>

      {/* Banners */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}
      {toast && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          ✅ {toast}
        </div>
      )}

      {/* Stats */}
      <AdminUserStats stats={stats} loading={statsLoading} />

      {/* Filters */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:border-green-500 outline-none"
        >
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r] || r}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:border-green-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {/* Table */}
      <AdminUserTable
        admins={admins}
        loading={loading}
        currentAdmin={currentAdmin}
        onEdit={setEditingAdmin}
        onChangeRole={setRoleTarget}
        onToggleStatus={handleToggleStatus}
        onResetPassword={setPasswordTarget}
        onDelete={setDeleteTarget}
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <AdminUserFormModal
          mode="create"
          currentAdmin={currentAdmin}
          onClose={() => setShowCreate(false)}
          onSaved={handleCreated}
        />
      )}

      {editingAdmin && (
        <AdminUserFormModal
          mode="edit"
          admin={editingAdmin}
          currentAdmin={currentAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={handleEdited}
        />
      )}

      {roleTarget && (
        <AdminChangeRoleModal
          admin={roleTarget}
          currentAdmin={currentAdmin}
          onClose={() => setRoleTarget(null)}
          onSaved={handleRoleChanged}
        />
      )}

      {passwordTarget && (
        <AdminResetPasswordModal
          target={passwordTarget}
          currentAdmin={currentAdmin}
          onClose={() => setPasswordTarget(null)}
          onSaved={handlePasswordChanged}
        />
      )}

      {deleteTarget && (
        <AdminDeleteConfirmModal
          admin={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}