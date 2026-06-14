import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { 
  Users, CheckCircle, Clock, DollarSign, 
  TrendingUp, AlertCircle, Shield, Settings,
  LogOut, Menu, X, Briefcase, CheckSquare,
  XCircle, Eye, Filter
} from 'lucide-react';
import TechnicianList from './TechnicianList';
import TechnicianDetails from './TechnicianDetails';
import SubscriptionStats from './SubscriptionStats';
import AdminVerifyJobs from './AdminVerifyJobs';
import JobsManagement from './JobsManagement';
import api from '../../services/api';
import adminJobService from '../../services/adminJobService'; // ← ADD THIS IMPORT

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalTechnicians: 0,
    verifiedTechnicians: 0,
    pendingVerification: 0,
    totalJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    rejectedJobs: 0,
    loading: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchJobStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/subscription/stats');
      setStats(prev => ({
        ...prev,
        totalTechnicians: response.data.data.totalTechnicians,
        verifiedTechnicians: response.data.data.verifiedTechnicians,
        pendingVerification: response.data.data.pendingVerification,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  /**
   * FETCH JOB STATISTICS - UPDATED TO USE NEW MODULAR ENDPOINT
   * 
   * CHANGED: Now uses adminJobService instead of direct API call to old endpoint
   * OLD: api.get('/api/jobs/admin/stats')
   * NEW: adminJobService.getAdminStats()
   */
  const fetchJobStats = async () => {
    try {
      // Using the new admin job service with modular endpoint
      const response = await adminJobService.getAdminStats();
      
      if (response.success) {
        // The new endpoint returns data in response.data (not response.data.data)
        // Check the structure from your adminJobController.getJobStats()
        const jobStats = response.data;
        
        setStats(prev => ({
          ...prev,
          totalJobs: jobStats.overview?.total || 0,
          pendingJobs: jobStats.overview?.pending || 0,
          approvedJobs: jobStats.overview?.approved || 0,
          rejectedJobs: jobStats.overview?.rejected || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching job stats:', error);
      // Fallback: try old endpoint if new one fails (for backward compatibility)
      try {
        const fallbackResponse = await api.get('/api/jobs/admin/stats');
        if (fallbackResponse.data.success) {
          setStats(prev => ({
            ...prev,
            totalJobs: fallbackResponse.data.data.overview.total,
            pendingJobs: fallbackResponse.data.data.overview.pending,
            approvedJobs: fallbackResponse.data.data.overview.approved,
            rejectedJobs: fallbackResponse.data.data.overview.rejected
          }));
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar - same as before */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/admin/technicians" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <Users className="w-5 h-5" />
              <span>Technicians</span>
            </Link>
            <Link to="/admin/verification" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <Shield className="w-5 h-5" />
              <span>Verify Technicians</span>
            </Link>
            
            {/* Jobs Section Header */}
            <div className="pt-4 mt-4 border-t border-gray-800">
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Job Management
              </p>
            </div>
            
            <Link to="/admin/jobs/pending" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
              <span>Pending Jobs</span>
              {stats.pendingJobs > 0 && (
                <span className="ml-auto bg-yellow-500 text-xs px-2 py-1 rounded-full">
                  {stats.pendingJobs}
                </span>
              )}
            </Link>
            
            <Link to="/admin/jobs/approved" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <CheckCircle className="w-5 h-5" />
              <span>Approved Jobs</span>
              {stats.approvedJobs > 0 && (
                <span className="ml-auto bg-green-500 text-xs px-2 py-1 rounded-full">
                  {stats.approvedJobs}
                </span>
              )}
            </Link>
            
            <Link to="/admin/jobs/rejected" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <XCircle className="w-5 h-5" />
              <span>Rejected Jobs</span>
              {stats.rejectedJobs > 0 && (
                <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                  {stats.rejectedJobs}
                </span>
              )}
            </Link>
            
            <Link to="/admin/jobs/all" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <Briefcase className="w-5 h-5" />
              <span>All Jobs</span>
            </Link>
            
            <Link to="/admin/subscriptions" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <DollarSign className="w-5 h-5" />
              <span>Subscriptions</span>
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </nav>
          
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 w-full text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Welcome, Admin</h2>
            <div className="w-10"></div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="p-6">
          {/* Technician Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Technicians</p>
                  <p className="text-2xl font-bold">
                    {stats.loading ? '...' : stats.totalTechnicians}
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Verified Technicians</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.loading ? '...' : stats.verifiedTechnicians}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Pending Verification</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.loading ? '...' : stats.pendingVerification}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-purple-600">--</p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Job Stats Cards - Now showing actual data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-800 text-sm font-semibold">Pending Jobs</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.pendingJobs || 0}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">Awaiting approval</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500" />
              </div>
              <Link 
                to="/admin/jobs/pending"
                className="mt-3 inline-flex items-center text-sm text-yellow-700 hover:text-yellow-900"
              >
                Review now →
              </Link>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 text-sm font-semibold">Approved Jobs</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.approvedJobs || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Live on platform</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <Link 
                to="/admin/jobs/approved"
                className="mt-3 inline-flex items-center text-sm text-green-700 hover:text-green-900"
              >
                View all →
              </Link>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg shadow p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-800 text-sm font-semibold">Rejected Jobs</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.rejectedJobs || 0}
                  </p>
                  <p className="text-xs text-red-600 mt-1">Need revision</p>
                </div>
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <Link 
                to="/admin/jobs/rejected"
                className="mt-3 inline-flex items-center text-sm text-red-700 hover:text-red-900"
              >
                View rejected →
              </Link>
            </div>
          </div>

          {/* Routes */}
          <Routes>
            <Route index element={<SubscriptionStats />} />
            <Route path="technicians" element={<TechnicianList />} />
            <Route path="technicians/:id" element={<TechnicianDetails />} />
            <Route path="verification" element={<TechnicianList initialFilter="pending" />} />
            <Route path="subscriptions" element={<SubscriptionStats />} />
            <Route path="jobs/pending" element={<AdminVerifyJobs initialFilter="pending" />} />
            <Route path="jobs/approved" element={<JobsManagement status="approved" />} />
            <Route path="jobs/rejected" element={<JobsManagement status="rejected" />} />
            <Route path="jobs/all" element={<JobsManagement status="all" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;