/**
 * Bookings.jsx
 * ============
 * Admin page: list and manage all bookings.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, X, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  Calendar, Briefcase, Download, Eye, DollarSign, Clock,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PermissionGate from '../../components/admin/PermissionGate';

// ─── HELPERS ────────────────────────────────────────────────
const STATUS_LABELS = {
  pending: 'Pending',
  quoted: 'Quoted',
  agreed: 'Agreed',
  materials_delivered: 'Materials Delivered',
  materials_confirmed: 'Materials Confirmed',
  in_progress: 'In Progress',
  work_completed: 'Work Completed',
  labor_paid: 'Labor Paid',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no-show': 'No Show',
};

const STATUS_COLORS = {
  pending:              'bg-yellow-100 text-yellow-800',
  quoted:               'bg-blue-100 text-blue-800',
  agreed:               'bg-indigo-100 text-indigo-800',
  materials_delivered:  'bg-cyan-100 text-cyan-800',
  materials_confirmed:  'bg-teal-100 text-teal-800',
  in_progress:          'bg-purple-100 text-purple-800',
  work_completed:       'bg-blue-100 text-blue-800',
  labor_paid:           'bg-emerald-100 text-emerald-800',
  completed:            'bg-green-100 text-green-800',
  cancelled:            'bg-red-100 text-red-800',
  'no-show':            'bg-gray-100 text-gray-700',
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatCurrency = (n) => `KES ${Number(n || 0).toLocaleString()}`;

// ═════════════════════════════════════════════════════════════
const Bookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    from: '',
    to: '',
  });

  // ─── FETCH ───────────────────────────────────────────────
  const fetchBookings = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pagination.limit);
      if (search.trim()) params.append('search', search.trim());
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params.append(k, v);
      });

      const res = await adminApi.get(`/bookings?${params.toString()}`);
      setBookings(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.get('/bookings/stats');
      setStats(res.data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchBookings(1); fetchStats(); }, [fetchBookings, fetchStats]);

  useEffect(() => {
    const t = setTimeout(() => fetchBookings(1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params.append(k, v);
      });
      const res = await adminApi.get(`/bookings/export?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({ status: 'all', paymentStatus: 'all', from: '', to: '' });
    setSearch('');
  };

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([, v]) => v && v !== 'all').length,
    [filters]
  );

  // ═════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-purple-600" />
            Bookings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Monitor all service bookings across the platform.
          </p>
        </div>
        <PermissionGate permission="bookings.export">
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total"         value={stats.total} />
          <StatCard label="This Month"    value={stats.thisMonth} color="blue" />
          <StatCard label="Pending"       value={stats.pending} color="yellow" />
          <StatCard label="In Progress"   value={stats.inProgress} color="purple" />
          <StatCard label="Completed"     value={stats.completed} color="green" />
          <StatCard label="Cancelled"     value={stats.cancelled} color="red" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client, technician, category..."
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
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active (any)' },
                { value: 'pending', label: 'Pending' },
                { value: 'quoted', label: 'Quoted' },
                { value: 'agreed', label: 'Agreed' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <FilterSelect
              label="Payment"
              value={filters.paymentStatus}
              onChange={(v) => setFilters({ ...filters, paymentStatus: v })}
              options={[
                { value: 'all', label: 'Any' },
                { value: 'pending', label: 'Pending' },
                { value: 'paid', label: 'Paid' },
                { value: 'refunded', label: 'Refunded' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
              />
            </div>
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
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bookings match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Booking</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Technician</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono text-gray-800">
                        #{b._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatDate(b.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {b.clientId?.profileImage ? (
                          <img src={b.clientId.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {b.clientId?.firstName?.[0]}{b.clientId?.lastName?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {b.clientId?.firstName} {b.clientId?.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-800 truncate">
                        {b.technicianId?.businessName ||
                          `${b.technicianId?.userId?.firstName || ''} ${b.technicianId?.userId?.lastName || ''}`.trim() ||
                          '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      <p className="truncate max-w-[160px]">{b.serviceCategory}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{b.subService}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium text-gray-800">{formatCurrency(b.totalAmount)}</p>
                      <p className="text-[10px] text-gray-400">{b.paymentStatus}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[b.status]}`}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/bookings/${b._id}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-medium hover:bg-gray-900 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
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
                onClick={() => fetchBookings(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchBookings(pagination.page + 1)}
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
    purple: 'text-purple-600',
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

export default Bookings;