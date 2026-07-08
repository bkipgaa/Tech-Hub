// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [receivedToken, setReceivedToken] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  // If user is already logged in, redirect based on role
  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user]);

  const redirectBasedOnRole = (role) => {
    // If there's a specific redirect path in state, use it
    if (from && from !== '/login' && from !== '/signup') {
      navigate(from);
      return;
    }

    // Otherwise redirect based on role
    switch (role) {
      case 'technician':
        navigate('/technician-dashboard');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
        break;
    }
  };

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
    setLoginSuccess(false);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // ✅ Token should be stored in localStorage by AuthContext
        const storedToken = localStorage.getItem('token');
        setReceivedToken(storedToken || result.token);
        setLoginSuccess(true);
        
        console.log('✅ Login successful!');
        console.log('Token stored:', !!localStorage.getItem('token'));
        console.log('User stored:', !!localStorage.getItem('user'));
        console.log('User role:', result.user?.role);
        
        // Show success message briefly then redirect
        setTimeout(() => {
          redirectBasedOnRole(result.user?.role);
        }, 1500);
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTokenDisplay = () => {
    setShowToken(!showToken);
  };

  // Debug: Check localStorage
  const checkStoredData = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('🔍 localStorage check:');
    console.log('  - Token exists:', !!token);
    console.log('  - Token preview:', token ? `${token.substring(0, 20)}...` : 'none');
    console.log('  - User exists:', !!user);
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('  - User role:', userData.role);
        console.log('  - User email:', userData.email);
        console.log('  - User ID:', userData._id);
      } catch (e) {
        console.log('  - User data invalid');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-center text-red-600">Welcome Back</h2>
          <p className="mt-2 text-center text-gray-600">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loginSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <p className="font-semibold">✅ Login successful!</p>
            </div>
            <p className="text-sm mt-1">Redirecting to dashboard...</p>
            
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleTokenDisplay}
                className="text-xs bg-green-200 px-3 py-1 rounded-full hover:bg-green-300 transition-colors flex items-center gap-1"
              >
                {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showToken ? 'Hide Token' : 'View Token'}
              </button>
              
              <button
                type="button"
                onClick={checkStoredData}
                className="text-xs bg-blue-200 px-3 py-1 rounded-full hover:bg-blue-300 transition-colors"
              >
                Check Storage
              </button>
            </div>
            
            {showToken && receivedToken && (
              <div className="mt-3 p-2 bg-white rounded border border-green-300 overflow-auto max-h-24">
                <p className="text-xs font-mono text-gray-700 break-all">
                  Token: {receivedToken}
                </p>
              </div>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-600" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

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
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>

          <p className="text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-red-600 hover:text-red-700 font-semibold">
              Sign up here
            </Link>
          </p>
          
          {/* Test credentials - remove in production */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2">
              🧪 Quick Login (Demo)
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    email: 'john.mwangi@example.com',
                    password: 'password123'
                  });
                }}
                className="text-xs bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 transition-colors"
              >
                Technician
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    email: 'admin@weba-hub.com',
                    password: 'admin123'
                  });
                }}
                className="text-xs bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    email: 'client@example.com',
                    password: 'password123'
                  });
                }}
                className="text-xs bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 transition-colors"
              >
                Client
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;