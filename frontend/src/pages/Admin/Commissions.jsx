import React, { useEffect, useState, useCallback } from 'react';
import {
  DollarSign, Clock, CheckCircle2, FileText, RefreshCw, Download,
  Search, Check, Ban, Calendar,
} from 'lucide-react';
import { adminCommissionService } from '../../services/adminRevenueService';
import { useAdminAuth } from '../../context/AdminAuthContext';

// ─── Helpers ────────────────────────────────────────────
const KES = (n) =>
  n == null || isNaN(n) ? 'KES 0' : `KES ${Number(n).toLocaleString()}`;

const STATUS_BADGE = {
  pending:  'bg-yellow-100 text-yellow-800',
  invoiced: 'bg-blue-100 text-blue-800',
  paid:     'bg-green-100 text-green-800',
  waived:   'bg-gray-100 text-gray-700',
};

const PERIODS = [
  { value: 'day',   label: 'Today' },
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year',  label: 'This Year' },
  { value: 'all',   label: 'All Time' },
];

/**
 * The nested populate can return `technicianId.userId` as:
 *   - a populated object {firstName, lastName, email}
 *   - an ObjectId (if populate failed)
 *   - null
 *   - technicianId itself may be an ObjectId or a document
 *
 * This helper normalises all cases.
 */
const getTechnicianInfo = (booking) => {
  const tech = booking?.technicianId;
  if (!tech) return { name: '—', email: '—', business: '' };

  // If technicianId is a raw ObjectId, we can't get more
  if (typeof tech === 'string' || tech._bsontype === 'ObjectID') {
    return { name: '—', email: '—', business: '' };
  }

  const u = tech.userId;
  if (u && typeof u === 'object' && (u.firstName || u.lastName)) {
    return {
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—',
      email: u.email || '—',
      business: tech.businessName || '',
    };
  }

  // userId is still an ObjectId — populate failed
  return { name: '—', email: '—', business: tech.businessName || '' };
};

const StatCard = ({ icon: Icon, label, value, tint, sub }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-3">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tint} mb-2`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-xl font-bold text-gray-800">{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════
export default function Commissions() {
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [period, setPeriod] = useState('all');
  const [marking, setMarking] = useState(null);

  // ── Load ─────────────────────────────────────────────
  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      try {
        const [r, s] = await Promise.all([
          adminCommissionService.list({
            page,
            limit: 20,
            status: statusFilter,
            period,
          }),
          adminCommissionService.stats({ period }),
        ]);
        setItems(r.data.data || []);
        setPagination(
          r.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 }
        );
        setStats(s.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load commissions');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, statusFilter, period]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Reset page on filter change
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search, statusFilter, period]);

  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3000);
  };

  // ── Actions ──────────────────────────────────────────
  const handleMarkPaid = async (booking) => {
    if (
      !window.confirm(
        `Mark commission of ${KES(booking.commission?.amount)} as PAID?`
      )
    )
      return;
    setMarking(booking._id);
    try {
      await adminCommissionService.markPaid(booking._id);
      showToast('Commission marked as paid');
      load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as paid');
    } finally {
      setMarking(null);
    }
  };

  const handleWaive = async (booking) => {
    const reason = window.prompt('Reason for waiving this commission (optional):');
    if (reason === null) return;
    setMarking(booking._id);
    try {
      await adminCommissionService.waive(booking._id, reason);
      showToast('Commission waived');
      load(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to waive');
    } finally {
      setMarking(null);
    }
  };

  const exportCsv = async () => {
    try {
      const res = await adminCommissionService.export({ period });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `commissions-${period}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed');
    }
  };

  // Client-side search on top of server page
  const filtered = search
    ? items.filter((b) => {
        const { name, email } = getTechnicianInfo(b);
        const haystack = `${name} ${email}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
    : items;

  const currentPeriodLabel =
    stats?.periodLabel || PERIODS.find((p) => p.value === period)?.label || period;

  // ── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-yellow-600" /> Commissions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            5% of labor from each completed booking · {currentPeriodLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {hasPermission('commission.export') && (
            <button
              onClick={exportCsv}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-2 text-sm font-semibold"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Period toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 inline-flex flex-wrap gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.value
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
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
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          ✅ {toast}
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon={DollarSign}
            label={`Total · ${currentPeriodLabel}`}
            value={KES(stats.total)}
            tint="bg-blue-50 text-blue-600"
            sub={
              stats.growth != null
                ? `${stats.growth >= 0 ? '▲' : '▼'} ${Math.abs(stats.growth)}% vs previous`
                : undefined
            }
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={KES(stats.pending)}
            tint="bg-yellow-50 text-yellow-600"
            sub={`All-time owed: ${KES(stats.allTime?.pending)}`}
          />
          <StatCard
            icon={FileText}
            label="Invoiced"
            value={KES(stats.invoiced)}
            tint="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            icon={CheckCircle2}
            label="Paid"
            value={KES(stats.paid)}
            tint="bg-green-50 text-green-600"
            sub={`All-time paid: ${KES(stats.allTime?.paid)}`}
          />
          <StatCard
            icon={DollarSign}
            label="All-Time"
            value={KES(stats.allTime?.total)}
            tint="bg-purple-50 text-purple-600"
            sub={`${stats.count} booking${stats.count === 1 ? '' : 's'} in period`}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by technician name or email…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:border-green-500 outline-none"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
            <option value="waived">Waived</option>
          </select>
        </div>

        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Showing{' '}
          <strong className="text-gray-700">{currentPeriodLabel}</strong>
          {period !== 'all' && ' · commissions created in this window'}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No commissions {period === 'all' ? '' : `in ${currentPeriodLabel.toLowerCase()}`} match your filters.
            </p>
            {period !== 'all' && (
              <button
                onClick={() => setPeriod('all')}
                className="mt-3 text-sm text-green-600 hover:underline"
              >
                Show all time
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Booking</th>
                  <th className="px-4 py-3 text-left">Technician</th>
                  <th className="px-4 py-3 text-left">Service</th>
                  <th className="px-4 py-3 text-right">Labor</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => {
                  const tech = getTechnicianInfo(b);
                  return (
                    <tr key={b._id} className="hover:bg-gray-50">
                      {/* Booking */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-gray-800">
                          #{b._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {b.commission?.createdAt
                            ? new Date(b.commission.createdAt).toLocaleDateString(
                                'en-KE',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )
                            : '—'}
                        </p>
                      </td>

                      {/* Technician */}
                      <td className="px-4 py-3">
                        {tech.name !== '—' ? (
                          <>
                            <p className="text-xs font-medium text-gray-800">
                              {tech.name}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {tech.email}
                            </p>
                            {tech.business && tech.business !== tech.name && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[180px]">
                                {tech.business}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            Technician unavailable
                          </p>
                        )}
                      </td>

                      {/* Service */}
                      <td className="px-4 py-3 text-xs text-gray-700">
                        <p className="truncate max-w-[160px]">
                          {b.serviceCategory || '—'}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[160px]">
                          {b.subService || ''}
                        </p>
                      </td>

                      {/* Labor */}
                      <td className="px-4 py-3 text-xs text-right text-gray-700">
                        {KES(b.laborPayment?.amount)}
                      </td>

                      {/* Commission */}
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
                        {KES(b.commission?.amount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                            STATUS_BADGE[b.commission?.status] ||
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {b.commission?.status || 'pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {hasPermission('commission.manage') && (
                          <div className="inline-flex items-center gap-1">
                            {b.commission?.status !== 'paid' &&
                              b.commission?.status !== 'waived' && (
                                <>
                                  <button
                                    onClick={() => handleMarkPaid(b)}
                                    disabled={marking === b._id}
                                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                    title="Mark as paid"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleWaive(b)}
                                    disabled={marking === b._id}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                    title="Waive commission"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
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