import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Users, CheckCircle, DollarSign, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-red-600">
            <Shield className="w-8 h-8 text-white mr-2" />
            <span className="text-white font-bold text-xl">Admin Panel</span>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link to="/admin/technicians" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
              <Users className="w-5 h-5" />
              <span>Technicians</span>
            </Link>
            
            <Link to="/admin/verification" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
              <CheckCircle className="w-5 h-5" />
              <span>Verification</span>
            </Link>
            
            <Link to="/admin/subscriptions" className="flex items-center gap-3 px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">
              <DollarSign className="w-5 h-5" />
              <span>Subscriptions</span>
            </Link>
          </nav>
          
          {/* Logout Button */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 w-full text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="ml-64">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;