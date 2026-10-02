/**
 * AdminUserStats.jsx
 * ==================
 * Row of four summary cards at the top of the Admin Users page.
 *
 * @version 1.0.0
 */

import React from 'react';
import { Users, UserCheck, UserX, Crown, Loader2 } from 'lucide-react';

const Card = ({ label, value, icon: Icon, tint }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint} mb-3`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

export default function AdminUserStats({ stats, loading }) {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-4 h-28 flex items-center justify-center"
          >
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        label="Total Admins"
        value={stats?.total ?? '—'}
        icon={Users}
        tint="bg-blue-50 text-blue-600"
      />
      <Card
        label="Active"
        value={stats?.active ?? '—'}
        icon={UserCheck}
        tint="bg-green-50 text-green-600"
      />
      <Card
        label="Inactive"
        value={stats?.inactive ?? '—'}
        icon={UserX}
        tint="bg-red-50 text-red-600"
      />
      <Card
        label="Super Admins"
        value={stats?.byRole?.super_admin ?? '—'}
        icon={Crown}
        tint="bg-purple-50 text-purple-600"
      />
    </div>
  );
}