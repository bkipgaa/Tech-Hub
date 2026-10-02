import React, { useEffect, useState, useCallback } from 'react';
import { Wallet, CreditCard, TrendingUp, RefreshCw, Download, Search, Clock } from 'lucide-react';
import { adminPaymentService } from '../../services/adminRevenueService';

const KES = (n) => (n == null || isNaN(n) ? 'KES 0' : `KES ${Number(n).toLocaleString()}`);

const STATUS_BADGE = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  invoiced: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-700',
  waived: 'bg-gray-100 text-gray-700',
};

const StatCard = ({ icon: Icon, label, value, tint, sub }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint} mb-3`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function Payments() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [r, s] = await Promise.all([
        adminPaymentService.list({
          page,
          limit: 20,
          type: typeFilter,
          status: statusFilter,
        }),
        adminPaymentService.stats(),
      ]);
      setItems(r.data.data || []);
      setPagination(r.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      setStats(s.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search, typeFilter, statusFilter]);

  const exportCsv = async () => {
    try {
      const res = await adminPaymentService.export();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  };

  const filtered = search
    ? items.filter((p) => {
        const name = p.user ? `${p.user.firstName} ${p.user.lastName} ${p.user.email}`.toLowerCase() : '';
        return (
          name.includes(search.toLowerCase()) ||
          (p.reference || '').toLowerCase().includes(search.toLowerCase())
        );
      })
    : items;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" /> Payments
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All platform transactions — subscription payments and commission collections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={exportCsv}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-2 text-sm font-semibold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Total Volume"
            value={KES(stats.totalVolume)}
            tint="bg-indigo-50 text-indigo-600"
            sub={`${(stats.subscriptions.count + stats.commission.count).toLocaleString()} transactions`}
          />
          <StatCard
            icon={CreditCard}
            label="Subscription Revenue"
            value={KES(stats.subscriptions.total)}
            tint="bg-blue-50 text-blue-600"
            sub={`${stats.subscriptions.count} payments`}
          />
          <StatCard
            icon={Wallet}
            label="Commission Paid"
            value={KES(stats.commission.paid)}
            tint="bg-green-50 text-green-600"
            sub={`${stats.commission.count} total bookings`}
          />
          <StatCard
            icon={Clock}
            label="Commission Pending"
            value={KES(stats.commission.pending)}
            tint="bg-yellow-50 text-yellow-600"
            sub={`${KES(stats.thisMonthCommission)} collected this month`}
          />
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
            placeholder="Search by name, email or reference…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:border-green-500 outline-none"
        >
          <option value="all">All types</option>
          <option value="subscription">Subscriptions</option>
          <option value="commission">Commissions</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:border-green-500 outline-none"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="invoiced">Invoiced</option>
          <option value="failed">Failed</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payments match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Paid By</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.type === 'subscription'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 max-w-[200px] truncate">
                      {p.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-800">
                        {p.user ? `${p.user.firstName} ${p.user.lastName}` : '—'}
                      </p>
                      <p className="text-[10px] text-gray-500">{p.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">
                      {KES(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 truncate max-w-[120px]">
                      {p.reference || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {p.date
                        ? new Date(p.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
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