/**
 * Subscriptions.jsx
 * =================
 * Admin page: monitor and manage technician subscriptions.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, X, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  CreditCard, TrendingUp, Download, Calendar, Clock, Ban, Plus,
  CheckCircle,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
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

const expiryBadge = (days, isActive) => {
  if (!isActive) return 'bg-red-100 text-red-700';
  if (days === null) return 'bg-green-100 text-green-700';
  if (days <= 3) return 'bg-red-100 text-red-700';
  if (days <= 7) return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
};

const formatCurrency = (n) => `KES ${Number(n || 0).toLocaleString()}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ═════════════════════════════════════════════════════════════
const Subscriptions = () => {
  const navigate = useNavigate();

  // State
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    plan: 'all',
    status: 'all',
    expiringInDays: 7,
  });

  // Modal state
  const [extendModal, setExtendModal] = useState({ open: false, tech: null, days: 7, loading: false });

  // ─── FETCH ───────────────────────────────────────────────
  const fetchSubscriptions = useCallback(async (page = 1) => {
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

      const res = await adminApi.get(`/subscriptions?${params.toString()}`);
      setSubscriptions(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.get('/subscriptions/stats');
      setStats(res.data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchSubscriptions(1); fetchStats(); }, [fetchSubscriptions, fetchStats]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchSubscriptions(1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ─── ACTIONS ─────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminApi.get('/subscriptions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscriptions-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleExtend = async () => {
    if (!extendModal.tech || !extendModal.days) return;
    setExtendModal((prev) => ({ ...prev, loading: true }));
    try {
      await adminApi.patch(`/subscriptions/${extendModal.tech._id}/extend`, {
        days: extendModal.days,
      });
      setExtendModal({ open: false, tech: null, days: 7, loading: false });
      fetchSubscriptions(pagination.page);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend.');
      setExtendModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCancel = async (tech) => {
    const reason = window.prompt(`Cancel subscription for ${tech.user?.firstName} ${tech.user?.lastName}?\n\nOptional reason:`);
    if (reason === null) return; // user cancelled
    try {
      await adminApi.patch(`/subscriptions/${tech._id}/cancel`, { reason });
      fetchSubscriptions(pagination.page);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel.');
    }
  };

  const clearFilters = () => {
    setFilters({ plan: 'all', status: 'all', expiringInDays: 7 });
    setSearch('');
  };

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([k, v]) => v !== 'all' && k !== 'expiringInDays').length,
    [filters]
  );

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            Subscriptions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor plans, expiries, and renewals.
          </p>
        </div>
        <PermissionGate permission="subscriptions.export">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </PermissionGate>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total"         value={stats.total} />
          <StatCard label="Active paid"   value={stats.activePaid} color="green" />
          <StatCard label="Expired"       value={stats.expiredPaid} color="red" />
          <StatCard label="Free"          value={stats.free} color="gray" />
          <StatCard label="Trial"         value={stats.trial} color="blue" />
          <StatCard label="Expiring ≤7d"  value={stats.expiringSoon} color="yellow" />
        </div>
      )}

      {/* Revenue row */}
      {stats?.revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">MRR (Active)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(stats.mrr)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {stats.activePaid} paid subscriptions
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Revenue This Month</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatCurrency(stats.revenue.thisMonth)}
            </p>
            <p className={`text-xs mt-0.5 ${stats.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.revenue.growth >= 0 ? '▲' : '▼'} {Math.abs(stats.revenue.growth)}% vs last month
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Last Month</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">
              {formatCurrency(stats.revenue.lastMonth)}
            </p>
          </div>
        </div>
      )}

      {/* Search & filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or business..."
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
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3">
            <FilterSelect
              label="Plan"
              value={filters.plan}
              onChange={(v) => setFilters({ ...filters, plan: v })}
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
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              options={[
                { value: 'all', label: 'Any' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'expiring', label: 'Expiring soon' },
                { value: 'free', label: 'Free plan' },
                { value: 'paid', label: 'Paid (any)' },
              ]}
            />
            <FilterSelect
              label="Expiring within"
              value={filters.expiringInDays}
              onChange={(v) => setFilters({ ...filters, expiringInDays: v })}
              options={[
                { value: 3, label: '3 days' },
                { value: 7, label: '7 days' },
                { value: 14, label: '14 days' },
                { value: 30, label: '30 days' },
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
        ) : subscriptions.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No subscriptions match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Technician</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Auto-renew</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((s) => {
                  const info = s.subscriptionStatus;
                  return (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.user?.profileImage ? (
                            <img src={s.user.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {s.user?.firstName?.[0]}{s.user?.lastName?.[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {s.user?.firstName} {s.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{s.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${planBadge(info.plan)}`}>
                          {info.planLabel}
                        </span>
                        {info.visibilityRadius && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {info.visibilityRadius} km radius
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {formatCurrency(info.price)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {info.expiresAt ? (
                          <>
                            <p>{formatDate(info.expiresAt)}</p>
                            <span className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${expiryBadge(info.daysRemaining, info.isActive)}`}>
                              <Clock className="w-3 h-3" />
                              {info.isActive
                                ? `${info.daysRemaining}d left`
                                : 'Expired'}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">No expiry</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {info.autoRenew ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="w-3.5 h-3.5" /> On
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Off</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {info.isActive ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {info.plan === 'free' || info.plan === 'trial' ? 'Always active' : 'Expired'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <PermissionGate permission="subscriptions.manage">
                            {info.isPaid && (
                              <>
                                <button
                                  onClick={() => setExtendModal({ open: true, tech: s, days: 7, loading: false })}
                                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                                  title="Extend"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCancel(s)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Cancel subscription"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                onClick={() => fetchSubscriptions(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchSubscriptions(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Extend modal */}
      {extendModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !extendModal.loading && setExtendModal({ open: false, tech: null, days: 7, loading: false })}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Extend Subscription</h3>
            <p className="text-sm text-gray-600 mb-4">
              Extend <strong>{extendModal.tech?.user?.firstName} {extendModal.tech?.user?.lastName}</strong>'s
              {' '}{extendModal.tech?.subscriptionStatus?.planLabel} plan by:
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setExtendModal({ ...extendModal, days: d })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    extendModal.days === d
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Or custom (days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={extendModal.days}
                onChange={(e) => setExtendModal({ ...extendModal, days: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setExtendModal({ open: false, tech: null, days: 7, loading: false })}
                disabled={extendModal.loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={extendModal.loading || !extendModal.days}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {extendModal.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Extending...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Extend
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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

export default Subscriptions;