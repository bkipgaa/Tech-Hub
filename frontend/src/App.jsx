/**
 * App.jsx
 * =======
 * Root app component.
 * 
 * Architecture (after admin panel integration):
 * 
 *   /admin/*   → <AdminAuthProvider> + <AdminRoutes>   (isolated)
 *   /*         → <AuthProvider>    + <Layout>          (existing user app)
 * 
 * Why the admin tree is isolated:
 *   - Admin uses its own token (adminToken) and storage (adminData)
 *   - Admin pages don't render the user Navbar/Footer
 *   - A user logged in on one tab won't affect the admin on another
 *   - Admin 401s auto-logout to /admin/login without touching user session
 * 
 * @version 2.0.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ─── User-facing providers & shell ───────────────────────────
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

// ─── Admin providers & routes ────────────────────────────────
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminRoutes from './routes/AdminRoutes';

// ─── User pages ──────────────────────────────────────────────
import Home from './pages/Home';
import Services from './pages/Services';
import Technicians from './pages/Technicians';
import TechnicianProfile from './pages/TechnicianProfile';
import TechnicianSearchResults from './pages/TechnicianSearchResults';
import Search from './pages/Search';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import BecomeTechnician from './pages/BecomeTechnician';
import CreateTechnicianProfile from './pages/CreateTechnicianProfile';
import TechnicianDashboard from './components/technician/TechnicianDashboard';
import TechnicianCommission from './pages/TechnicianCommission';
import SubscriptionManager from './components/technician/subscriptionManager';
import PrivateRoute from './components/PrivateRoute';
import TechnicianRoute from './components/TechnicianRoute';
import ChatPage from './components/chat/ChatPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import JobsPage from './pages/jobsPage';
import PostJob from './components/jobs/postJob';
import MyJobs from './components/jobs/MyJobs';
import JobDetails from './components/jobs/JobDetails';
import MyApplications from './components/applications/MyApplications';
import BookService from './pages/BookService';
import PaymentCallback from './pages/PaymentCallback';
import TechnicianBookings from './pages/TechnicianBookings';
import BookingDetails from './pages/BookingDetails';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* ═══════════════════════════════════════════════════ */}
        {/* 1. ADMIN TREE — isolated, no user Navbar/Footer     */}
        {/*    Everything under /admin/* is handled here.       */}
        {/* ═══════════════════════════════════════════════════ */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <AdminRoutes />
            </AdminAuthProvider>
          }
        />

        {/* ═══════════════════════════════════════════════════ */}
        {/* 2. USER TREE — existing routes, wrapped in Auth+Layout */}
        {/* ═══════════════════════════════════════════════════ */}
        <Route
          path="/"
          element={
            <AuthProvider>
              <Layout />
            </AuthProvider>
          }
        >
          {/* ── Public routes ─────────────────────────────── */}
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="technician/:id" element={<TechnicianProfile />} />
          <Route path="available-jobs" element={<JobsPage />} />
          <Route path="search" element={<Search />} />
          <Route path="book-service" element={<BookService />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="login" element={<Login />} />
          <Route path="become-technician" element={<BecomeTechnician />} />
          <Route path="create-technician-profile" element={<CreateTechnicianProfile />} />
          <Route path="technicians/search" element={<TechnicianSearchResults />} />
          <Route path="jobs/:jobId" element={<JobDetails />} />

          {/* ── Password reset / OAuth callbacks ─────────── */}
          <Route path="payment-callback" element={<PaymentCallback />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />

          {/* ── Authenticated (any role) ─────────────────── */}
          <Route
            path="profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="bookings/:id"
            element={
              <PrivateRoute>
                <BookingDetails />
              </PrivateRoute>
            }
          />

          {/* ── Chat ─────────────────────────────────────── */}
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:conversationId" element={<ChatPage />} />

          {/* ── Job actions (client) ─────────────────────── */}
          <Route
            path="post-job"
            element={
              <PrivateRoute>
                <PostJob />
              </PrivateRoute>
            }
          />
          <Route
            path="my-jobs"
            element={
              <PrivateRoute>
                <MyJobs />
              </PrivateRoute>
            }
          />
          <Route
            path="my-applications"
            element={
              <PrivateRoute>
                <MyApplications />
              </PrivateRoute>
            }
          />

          {/* ── Technician-only routes ───────────────────── */}
          <Route
            path="technician-dashboard"
            element={
              <TechnicianRoute>
                <TechnicianDashboard />
              </TechnicianRoute>
            }
          />
          <Route
            path="technician-dashboard/bookings"
            element={
              <PrivateRoute requiredRole="technician">
                <TechnicianBookings />
              </PrivateRoute>
            }
          />
          <Route
            path="technician-dashboard/commissions"
            element={
              <TechnicianRoute>
                <TechnicianCommission />
              </TechnicianRoute>
            }
          />
          <Route
            path="subscription"
            element={
              <TechnicianRoute>
                <SubscriptionManager />
              </TechnicianRoute>
            }
          />

          {/* ── Bookings (client) ────────────────────────── */}
          <Route
            path="bookings"
            element={
              <PrivateRoute>
                <BookService />
              </PrivateRoute>
            }
          />

          {/* ── 404 fallback for user tree ──────────────── */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;