/**
 * Admin Registration Page
 * ========================
 * 
 * Separate registration page for administrators
 * Accessible at /admin/register
 * 
 * Features:
 * - Requires admin secret key for security
 * - No public access - only users with the secret key can register
 * - Redirects to admin login after successful registration
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, Phone, Key, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    adminSecretKey: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (!formData.adminSecretKey) {
      setError('Admin registration key is required');
      return false;
    }
    
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register-admin', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        adminSecretKey: formData.adminSecretKey
      });
      
      if (response.data.success) {
        setSuccess('Admin account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Registration</h2>
          <p className="mt-2 text-gray-600">Create administrator account</p>
        </div>
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{success}</p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-600" />
                Email Address
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

            {/* Phone Field */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-600" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="+254700000000"
              />
            </div>

            {/* Password Fields */}
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
                minLength="6"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-600" />
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Confirm your password"
              />
            </div>

            {/* Admin Secret Key */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-red-600" />
                Admin Registration Key
              </label>
              <input
                type="password"
                name="adminSecretKey"
                value={formData.adminSecretKey}
                onChange={handleChange}
                required
                className="w-full p-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="Enter admin registration key"
              />
              <p className="text-xs text-red-500 mt-1">
                ⚠️ This key is required to create admin accounts
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Admin Account...' : 'Register as Admin'}
          </button>

          {/* Links */}
          <div className="text-center space-y-2">
            <Link to="/admin/login" className="text-sm text-red-600 hover:text-red-700 hover:underline block">
              Already have an admin account? Sign in
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

export default AdminRegister;