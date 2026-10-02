import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, DollarSign, Percent, Wallet, RefreshCw, Download } from 'lucide-react';
import { adminRevenueService } from '../../services/adminRevenueService';

const KES = (n) =>
  n == null || isNaN(n) ? 'KES 0' : `KES ${Number(n).toLocaleString()}`;

const StatCard = ({ icon: Icon, label, value, tint, sub }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint} mb-3`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function Revenue() {
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [o, t, b] = await Promise.all([
        adminRevenueService.overview(),
        adminRevenueService.timeline(),
        adminRevenueService.breakdown(),
      ]);
      setOverview(o.data.data);
      setTimeline(t.data.data || []);
      setBreakdown(b.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    try {
      const res = await adminRevenueService.export();
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed'); }
  };

  const maxTotal = Math.max(...timeline.map((t) => t.total), 1);
  const maxPlanRev = Math.max(...(breakdown?.byPlan || []).map((p) => p.revenue), 1);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" /> Revenue
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Subscriptions + commission performance across the platform.
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={DollarSign}
          label="Revenue This Month"
          value={KES(overview?.thisMonth.total)}
          tint="bg-green-50 text-green-600"
          sub={`${overview?.growth >= 0 ? '▲' : '▼'} ${Math.abs(overview?.growth || 0)}% vs last month`}
        />
        <StatCard
          icon={Percent}
          label="Subscriptions (Month)"
          value={KES(overview?.thisMonth.subscriptions)}
          tint="bg-blue-50 text-blue-600"
          sub={`${overview?.activeSubscriptions || 0} active plans`}
        />
        <StatCard
          icon={Wallet}
          label="Commission (Month)"
          value={KES(overview?.thisMonth.commission)}
          tint="bg-purple-50 text-purple-600"
          sub={`${KES(overview?.pendingCommission)} pending overall`}
        />
        <StatCard
          icon={TrendingUp}
          label="All-Time Revenue"
          value={KES(overview?.allTime.total)}
          tint="bg-amber-50 text-amber-600"
          sub={`${KES(overview?.allTime.subscriptions)} subs + ${KES(overview?.allTime.commission)} comm`}
        />
      </div>

      {/* 6-month chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Revenue — Last 6 Months</h2>
          <span className="text-xs text-gray-500">Subscriptions + Commission</span>
        </div>
        {timeline.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {timeline.map((t, i) => {
              const subW = (t.subscriptions / maxTotal) * 100;
              const commW = (t.commission / maxTotal) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-12 text-xs text-gray-500 font-medium">{t.month}</span>
                  <div className="flex-1 bg-gray-100 h-6 rounded overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${subW}%` }}
                      title={`Subscriptions: ${KES(t.subscriptions)}`}
                    />
                    <div
                      className="bg-green-500 h-full transition-all"
                      style={{ width: `${commW}%` }}
                      title={`Commission: ${KES(t.commission)}`}
                    />
                  </div>
                  <span className="w-28 text-xs font-medium text-gray-700 text-right">
                    {KES(t.total)}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span className="text-xs text-gray-600">Subscriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                <span className="text-xs text-gray-600">Commission</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Subscriptions by Plan</h2>
          <span className="text-xs text-gray-500">
            Total commission: {KES(breakdown?.commissionTotal)}
          </span>
        </div>
        {!breakdown?.byPlan?.length ? (
          <p className="text-center py-4 text-sm text-gray-400">No plan revenue yet.</p>
        ) : (
          <div className="space-y-2">
            {breakdown.byPlan.map((p) => {
              const width = (p.revenue / maxPlanRev) * 100;
              return (
                <div key={p.plan} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-700 capitalize">{p.label}</span>
                  <div className="flex-1 bg-gray-100 h-5 rounded overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-28 text-xs font-medium text-gray-900 text-right">
                    {KES(p.revenue)}
                  </span>
                  <span className="w-12 text-xs text-gray-400 text-right">{p.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}