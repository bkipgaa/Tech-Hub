/**
 * adminApi.js
 * ===========
 * Axios instance dedicated to admin panel requests.
 * 
 * Differences from the regular `api.js`:
 *   - Base URL is /api/admin (not /api)
 *   - Reads `adminToken` from localStorage (not `token`)
 *   - Auto-logs out on 401 (except for the login endpoint)
 *   - Separate storage keys (`adminToken`, `adminData`)
 * 
 * This keeps admin sessions completely isolated from user sessions
 * so that an admin logging in on one tab doesn't affect a user
 * session on another tab (and vice versa).
 */

import axios from 'axios';

// Vite uses import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'https://tech-hub-backend-ecno.onrender.com/api';

const adminApi = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR
// Attach the admin JWT to every outgoing request.
// ─────────────────────────────────────────────────────────────
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Auto-logout on 401 (expired or invalid admin token),
// except on the login endpoint itself (where 401 just means
// "wrong credentials" — we want the login form to show that).
// ─────────────────────────────────────────────────────────────
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // Auto-logout only on authentication failures, not on
    // wrong credentials from the login endpoint.
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');

    if (status === 401 && !isLoginEndpoint && code !== 'INVALID_CREDENTIALS') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');

      // Redirect to the admin login page (avoid loop if already there)
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;    