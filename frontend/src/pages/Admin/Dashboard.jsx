/**
 * Dashboard.jsx
 * =============
 * Admin dashboard — the landing page of the admin panel.
 * 
 * Shows:
 * - 4 top stat cards (users, subscriptions, revenue, bookings)
 * - Revenue chart (last 6 months)
 * - Subscription breakdown by plan
 * - Alerts (expiring subscriptions, pending jobs)
 * - Recent activity feed
 * 
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Wrench,
  CreditCard,
  TrendingUp,
  Briefcase,
  DollarSign,
  AlertCircle,
  Loader2,
  Activity,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import adminApi from '../../services/adminApi';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 'KES 0';
  return `KES ${Number(amount).toLocaleString()}`;
};

const formatNumber = (n) => {
  if (n === undefined || n === null) return '0';
  return Number(n).toLocaleString();
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, subtext, trend, color = 'green' }) => {
  const colorMap = {
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200' },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  };
  const c = colorMap[color] || colorMap.green;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate">{value}</p>
          {subtext && (
            <p className="text-xs text-gray-500 mt-1 truncate">{subtext}</p>
          )}
          {trend !== undefined && trend !== null && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${c.bg} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
    </div>
  );
};

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center py-8 text-sm text-gray-400">No revenue data yet.</p>;
  }

  const maxValue = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="space-y-3">
      {data.map((m, i) => {
        const subPercent  = (m.subscription / maxValue) * 100;
        const commPercent = (m.commission / maxValue) * 100;

        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-16 text-xs text-gray-500 font-medium">{m.monthShort}</span>
            <div className="flex-1 bg-gray-100 h-6 rounded overflow-hidden flex relative">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${subPercent}%` }}
                title={`Subscriptions: ${formatCurrency(m.subscription)}`}
              />
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${commPercent}%` }}
                title={`Commission: ${formatCurrency(m.commission)}`}
              />
            </div>
            <span className="w-28 text-xs font-medium text-gray-700 text-right">
              {formatCurrency(m.total)}
            </span>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
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
  );
};

const PlanBreakdown = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center py-4 text-sm text-gray-400">No data</p>;
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500'];

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const pct = total > 0 ? (item.count / total) * 100 : 0;
        return (
          <div key={item.plan} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-sm ${colors[i % colors.length]}`} />
            <span className="flex-1 text-sm text-gray-700 capitalize">{item.label}</span>
            <span className="text-sm font-medium text-gray-900">{item.count}</span>
            <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');

      const [statsRes, timelineRes, breakdownRes, activityRes] = await Promise.allSettled([
        adminApi.get('/dashboard/stats'),
        adminApi.get('/dashboard/revenue-timeline'),
        adminApi.get('/dashboard/subscription-breakdown'),
        adminApi.get('/dashboard/recent-activity?limit=10'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      else console.warn('Stats failed:', statsRes.reason?.message);

      if (timelineRes.status === 'fulfilled') setTimeline(timelineRes.value.data.data || []);
      if (breakdownRes.status === 'fulfilled') setBreakdown(breakdownRes.value.data.data || []);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value.data.data || []);

      // If stats failed, show a friendly error
      if (statsRes.status === 'rejected') {
        setError(
          statsRes.reason?.response?.data?.message ||
          'Failed to load dashboard stats. Please try again.'
        );
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-gray-500 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────
  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-red-800">Failed to load dashboard</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={() => fetchAll()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Overview of your platform's activity and performance
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ─── Alerts ─────────────────────────────────────── */}
      {stats?.subscriptions?.expiringSoon > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-yellow-800">
              {stats.subscriptions.expiringSoon} subscription{stats.subscriptions.expiringSoon !== 1 ? 's' : ''} expire{stats.subscriptions.expiringSoon === 1 ? 's' : ''} in the next 7 days
            </p>
            <Link
              to="/admin/subscriptions?status=expiring"
              className="text-sm text-yellow-700 underline hover:no-underline mt-0.5 inline-block"
            >
              View expiring subscriptions →
            </Link>
          </div>
        </div>
      )}

      {/* ─── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={formatNumber(stats?.users?.total)}
          subtext={`${formatNumber(stats?.users?.technicians)} technicians · ${formatNumber(stats?.users?.clients)} clients`}
          color="blue"
        />
        <StatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={formatNumber(stats?.subscriptions?.active)}
          subtext={`${formatNumber(stats?.subscriptions?.paid)} paid · ${formatNumber(stats?.subscriptions?.expiringSoon)} expiring soon`}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue This Month"
          value={formatCurrency(stats?.revenue?.thisMonth)}
          trend={stats?.revenue?.growth}
          color="purple"
        />
        <StatCard
          icon={Briefcase}
          label="Bookings This Month"
          value={formatNumber(stats?.bookings?.thisMonth)}
          subtext={`${formatNumber(stats?.bookings?.completed)} completed · ${formatNumber(stats?.bookings?.pending)} pending`}
          color="yellow"
        />
      </div>

      {/* ─── Charts row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              Revenue — Last 6 Months
            </h2>
            <span className="text-xs text-gray-500">Subscriptions + Commission</span>
          </div>
          <RevenueChart data={timeline} />
        </div>

        {/* Subscription breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Subscriptions by Plan
          </h2>
          <PlanBreakdown data={breakdown} />
        </div>
      </div>

      {/* ─── Secondary stats row ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Pending Commission
            </p>
            <DollarSign className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(stats?.commission?.pending)}
          </p>
          <Link
            to="/admin/commissions"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            Manage commissions →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Invoiced Commission
            </p>
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats?.commission?.invoiced)}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Pending Jobs
            </p>
            <Briefcase className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {formatNumber(stats?.jobs?.pending)}
          </p>
          <Link
            to="/admin/jobs"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            Review jobs →
          </Link>
        </div>
      </div>

      {/* ─── Recent activity ────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" />
            Recent Activity
          </h2>
          <Link
            to="/admin/activity"
            className="text-xs text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        {activity.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">
            No recent activity yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {activity.map((item) => (
              <li key={item._id} className="py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">
                    <span className="font-medium">{item.adminName || 'Admin'}</span>{' '}
                    {item.description || item.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(item.createdAt)}
                    {item.status === 'failed' && (
                      <span className="ml-2 text-red-500 font-medium">· failed</span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;