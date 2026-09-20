/**
 * api.js
 * ======
 * Axios instance for authenticated user requests.
 * 
 * IMPORTANT: Do NOT set a default 'Content-Type'.
 * Axios automatically sets the correct header:
 *   - `application/json` for plain objects
 *   - `multipart/form-data; boundary=...` for FormData (file uploads)
 * 
 * Setting a default Content-Type breaks multipart uploads because the
 * boundary parameter is never generated, so the server (Multer) can't
 * parse the file and `req.file` ends up undefined.
 * 
 * @version 2.0.0 – Fixed multipart upload bug
 */

import axios from 'axios';

// Vite uses import.meta.env instead of process.env
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://tech-hub-backend-ecno.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  // ✅ No default 'Content-Type' — Axios detects it per request.
});

// ─────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR
// Attaches the auth token and ensures FormData requests get the
// correct multipart boundary.
// ─────────────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Attach auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Extra safety: when the body is FormData, remove any
    // pre-set Content-Type so the browser/axios can generate
    // the correct `multipart/form-data; boundary=...` value.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;