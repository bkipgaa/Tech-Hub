/**
 * Admin Login Page
 * ================
 * 
 * Separate login page for administrators
 * Accessible at /admin/login
 * 
 * Features:
 * - Email and password authentication
 * - Redirects to admin dashboard on success
 * - Admin-specific error messages
 * - No links to regular user registration
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      
      if (response.data.success && response.data.user.role === 'admin') {
        // Store token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'admin');
        
        // Set default auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError('Access denied. Admin privileges required.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Portal</h2>
          <p className="mt-2 text-gray-600">Sign in to manage the platform</p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-600" />
                Admin Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="admin@weba-hub.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-600" />
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in as Admin'}
          </button>

          {/* Links */}
          <div className="text-center space-y-2">
            <Link to="/admin/register" className="text-sm text-red-600 hover:text-red-700 hover:underline block">
              Need an admin account? Register here
            </Link>
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-600 hover:underline block">
              ← Back to Main Site
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;