import React, { useEffect, useState, useCallback } from 'react';
import { Users as UsersIcon, UserCheck, UserX, UserPlus, RefreshCw, Search, Power, Trash2, MoreVertical, Pencil } from 'lucide-react';
import { adminUserServiceFull } from '../../services/adminRevenueService';
import { useAdminAuth } from '../../context/AdminAuthContext';

const ROLE_BADGE = {
  client: 'bg-gray-100 text-gray-700',
  technician: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
};

const StatCard = ({ icon: Icon, label, value, tint }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint} mb-3`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

export default function Users() {
  const { hasPermission } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [r, s] = await Promise.all([
        adminUserServiceFull.list({
          page,
          limit: 20,
          role: roleFilter === 'all' ? undefined : roleFilter,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
          search: search || undefined,
        }),
        adminUserServiceFull.stats(),
      ]);
      setItems(r.data.data || []);
      setPagination(r.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      setStats(s.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, roleFilter, statusFilter, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search, roleFilter, statusFilter]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const toggleStatus = async (user) => {
    if (!window.confirm(`${user.isActive ? 'Suspend' : 'Activate'} ${user.firstName} ${user.lastName}?`)) return;
    try {
      await adminUserServiceFull.setStatus(user._id, !user.isActive);
      showToast(`User ${user.isActive ? 'suspended' : 'activated'}`);
      load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) return;
    try {
      await adminUserServiceFull.remove(user._id);
      showToast('User deleted');
      load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-600" /> Users
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All clients and technicians registered on the platform.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {toast && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          ✅ {toast}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard icon={UsersIcon} label="Total"        value={stats.total}        tint="bg-blue-50 text-blue-600" />
          <StatCard icon={UserCheck} label="Active"       value={stats.active}       tint="bg-green-50 text-green-600" />
          <StatCard icon={UserX}     label="Inactive"     value={stats.inactive}     tint="bg-red-50 text-red-600" />
          <StatCard icon={UsersIcon} label="Clients"      value={stats.clients}      tint="bg-gray-100 text-gray-600" />
          <StatCard icon={UsersIcon} label="Technicians"  value={stats.technicians}  tint="bg-indigo-50 text-indigo-600" />
          <StatCard icon={UserPlus}  label="New This Month" value={stats.newThisMonth} tint="bg-amber-50 text-amber-600" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:border-green-500 outline-none"
        >
          <option value="all">All roles</option>
          <option value="client">Clients</option>
          <option value="technician">Technicians</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:border-green-500 outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.profileImage ? (
                          <img src={u.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.isActive ? 'text-green-700' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === u._id ? null : u._id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        aria-label="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenuId === u._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-4 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 text-left">
                            {hasPermission('users.edit') && (
                              <button
                                onClick={() => { setOpenMenuId(null); /* open edit modal */ }}
                                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit user
                              </button>
                            )}
                            {hasPermission('users.suspend') && (
                              <button
                                onClick={() => { setOpenMenuId(null); toggleStatus(u); }}
                                className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
                              >
                                <Power className="w-3.5 h-3.5" />
                                {u.isActive ? 'Suspend account' : 'Activate account'}
                              </button>
                            )}
                            {hasPermission('users.delete') && (
                              <>
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                  onClick={() => { setOpenMenuId(null); deleteUser(u); }}
                                  className="w-full px-3 py-2 text-sm flex items-center gap-2 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete user
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded border border-gray-200 bg-white text-xs hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 rounded border border-gray-200 bg-white text-xs hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}