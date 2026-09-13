/**
 * Technicians.jsx
 * ===============
 * Admin page: browse, filter, and manage technicians.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Filter, X, Loader2, AlertCircle, Eye, Shield,
  Ban, CheckCircle, ChevronLeft, ChevronRight, BadgeCheck,
  Wrench, Star, MapPin,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import PermissionGate from '../../components/admin/PermissionGate';

// ─── HELPERS ────────────────────────────────────────────────
const planBadge = (plan) => {
  const map = {
    free:       'bg-gray-100 text-gray-700',
    trial:      'bg-blue-100 text-blue-700',
    test:       'bg-pink-100 text-pink-700',
    basic:      'bg-blue-100 text-blue-700',
    basicPlus:  'bg-indigo-100 text-indigo-700',
    premium:    'bg-yellow-100 text-yellow-700',
    business:   'bg-purple-100 text-purple-700',
    enterprise: 'bg-orange-100 text-orange-700',
    unlimited:  'bg-red-100 text-red-700',
  };
  return map[plan] || map.free;
};

const verificationBadge = (status) => {
  const map = {
    verified: 'bg-green-100 text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Technicians = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAdminAuth();

  // State
  const [technicians, setTechnicians] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    plan: 'all',
    verificationStatus: 'all',
    isActive: 'all',
    isAvailable: 'all',
  });

  // ─── Fetch list ──────────────────────────────────────────
  const fetchTechnicians = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pagination.limit);
      if (search.trim()) params.append('search', search.trim());
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== 'all') params.append(k, v);
      });

      const res = await adminApi.get(`/technicians?${params.toString()}`);
      setTechnicians(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load technicians.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.limit]);

  // ─── Fetch stats ─────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.get('/technicians/stats');
      setStats(res.data.data);
    } catch {
      // Non-blocking
    }
  }, []);

  // Initial load
  useEffect(() => { fetchTechnicians(1); fetchStats(); }, [fetchTechnicians, fetchStats]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchTechnicians(1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Action handlers
  const handleVerify = async (id) => {
    if (!window.confirm('Mark this technician as verified?')) return;
    try {
      await adminApi.patch(`/technicians/${id}/verify`);
      fetchTechnicians(pagination.page);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify.');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason || !reason.trim()) return;
    try {
      await adminApi.patch(`/technicians/${id}/reject`, { reason });
      fetchTechnicians(pagination.page);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject.');
    }
  };

  const handleSuspend = async (id, isActive) => {
    const verb = isActive ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${verb} this technician?`)) return;
    try {
      await adminApi.patch(`/technicians/${id}/${isActive ? 'suspend' : 'activate'}`);
      fetchTechnicians(pagination.page);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${verb}.`);
    }
  };

  const clearFilters = () => {
    setFilters({ plan: 'all', verificationStatus: 'all', isActive: 'all', isAvailable: 'all' });
    setSearch('');
  };

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(v => v !== 'all').length,
    [filters]
  );

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            Technicians
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage technician profiles, verifications, and account status.
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} color="green" />
          <StatCard label="Suspended" value={stats.suspended} color="red" />
          <StatCard label="Pending" value={stats.verification.pending} color="yellow" />
          <StatCard label="Verified" value={stats.verification.verified} color="blue" />
          <StatCard label="Expiring soon" value={stats.subscriptions.expiringSoon} color="orange" />
        </div>
      )}

      {/* Search & filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-green-600 text-white text-xs rounded-full px-1.5">
                {activeFilterCount}
              </span>
            )}
          </button>
          {(activeFilterCount > 0 || search) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3">
            <FilterSelect label="Plan" value={filters.plan} onChange={(v) => setFilters({ ...filters, plan: v })}
              options={[
                { value: 'all', label: 'All plans' },
                { value: 'free', label: 'Free' },
                { value: 'trial', label: 'Trial' },
                { value: 'basic', label: 'Basic' },
                { value: 'basicPlus', label: 'Basic-Plus' },
                { value: 'premium', label: 'Premium' },
                { value: 'business', label: 'Business' },
                { value: 'enterprise', label: 'Enterprise' },
                { value: 'unlimited', label: 'Unlimited' },
              ]}
            />
            <FilterSelect label="Verification" value={filters.verificationStatus} onChange={(v) => setFilters({ ...filters, verificationStatus: v })}
              options={[
                { value: 'all', label: 'Any' },
                { value: 'pending', label: 'Pending' },
                { value: 'verified', label: 'Verified' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
            <FilterSelect label="Account" value={filters.isActive} onChange={(v) => setFilters({ ...filters, isActive: v })}
              options={[
                { value: 'all', label: 'Any' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Suspended' },
              ]}
            />
            <FilterSelect label="Availability" value={filters.isAvailable} onChange={(v) => setFilters({ ...filters, isAvailable: v })}
              options={[
                { value: 'all', label: 'Any' },
                { value: 'true', label: 'Available' },
                { value: 'false', label: 'Unavailable' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : technicians.length === 0 ? (
          <div className="py-16 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No technicians match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Technician</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-left">Verification</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {technicians.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {t.user?.profileImage ? (
                          <img src={t.user.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {t.user?.firstName?.[0]}{t.user?.lastName?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {t.user?.firstName} {t.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{t.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p className="text-xs truncate max-w-[140px]">{t.mainCategory || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planBadge(t.subscriptionStatus.plan)}`}>
                        {t.subscriptionStatus.plan}
                      </span>
                      {t.subscriptionStatus.daysRemaining !== null && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {t.subscriptionStatus.daysRemaining}d left
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                        <span className="text-gray-700 font-medium">
                          {t.rating?.average?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-gray-400">({t.rating?.count || 0})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${verificationBadge(t.verificationStatus)}`}>
                        {t.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-700">
                          <Ban className="w-3.5 h-3.5" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/technicians/${t._id}`)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <PermissionGate permission="technicians.verify">
                          {t.verificationStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleVerify(t._id)}
                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Verify"
                              >
                                <BadgeCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(t._id)}
                                className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </PermissionGate>

                        <PermissionGate permission="technicians.suspend">
                          <button
                            onClick={() => handleSuspend(t._id, t.isActive)}
                            className={`p-1.5 rounded ${
                              t.isActive
                                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={t.isActive ? 'Suspend' : 'Reactivate'}
                          >
                            {t.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchTechnicians(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchTechnicians(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Small helpers ──────────────────────────────────────────
const StatCard = ({ label, value, color = 'gray' }) => {
  const colors = {
    gray:   'text-gray-800',
    green:  'text-green-600',
    red:    'text-red-600',
    yellow: 'text-yellow-600',
    blue:   'text-blue-600',
    orange: 'text-orange-600',
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${colors[color]}`}>{value}</p>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

export default Technicians;