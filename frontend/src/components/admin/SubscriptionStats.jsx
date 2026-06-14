import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';
import api from '../../services/api';

const SubscriptionStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/subscription/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscription Statistics</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Technicians</p>
              <p className="text-2xl font-bold">{stats?.totalTechnicians || 0}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Verified</p>
              <p className="text-2xl font-bold text-green-600">{stats?.verifiedTechnicians || 0}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.pendingVerification || 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Subscription Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Plans Distribution</h2>
        {stats?.subscriptionBreakdown && stats.subscriptionBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.subscriptionBreakdown}>
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" name="Technicians" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">No subscription data available</p>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStats;