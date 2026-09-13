/**
 * AdminRoutes.jsx
 * ===============
 * Route tree for the admin panel.
 * 
 * Structure:
 *   - /admin/login  → AdminLogin            (public)
 *   - /admin/*      → AdminLayout           (protected)
 *                       ├─ /dashboard       → Dashboard
 *                       ├─ /technicians     → Technicians
 *                       ├─ /subscriptions   → Subscriptions
 *                       └─ ... (all feature pages)
 * 
 * Every protected route is wrapped in:
 *   1. <ProtectedAdminRoute>       → checks authentication
 *   2. Optionally permission="..." → checks a specific permission
 * 
 * The <AdminLayout> provides the sidebar + topbar shell and renders
 * the active page inside via <Outlet />.
 * 
 * @version 1.0.0
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// ─── Layout & guards ─────────────────────────────────────────
import AdminLayout from '../components/admin/AdminLayout';
import ProtectedAdminRoute from '../components/admin/ProtectedAdminRoute';

// ─── Pages (built so far) ────────────────────────────────────
import AdminLogin from '../pages/Admin/AdminLogin';
import Roles from '../pages/Admin/Roles';
import Dashboard from '../pages/Admin/Dashboard';
import Technicians from '../pages/Admin/Technicians';
import TechnicianDetail from '../pages/Admin/TechnicianDetail';
import Subscriptions from '../pages/Admin/Subscriptions';

// ─── Placeholders for pages not yet built ────────────────────
// Replace each placeholder as you build the real page.
const Placeholder = ({ title }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
    <p className="text-gray-500">This page is under construction.</p>
  </div>
);

<Route
  path="dashboard"
  element={
    <ProtectedAdminRoute permission="dashboard.view">
      <Dashboard />
    </ProtectedAdminRoute>
  }
/>;

<Route
  path="technicians"
  element={
    <ProtectedAdminRoute permission="technicians.view">
      <Technicians />
    </ProtectedAdminRoute>
  }
/>;
<Route
  path="technicians/:id"
  element={
    <ProtectedAdminRoute permission="technicians.view_details">
      <TechnicianDetail />
    </ProtectedAdminRoute>
  }
/>;

<Route
  path="subscriptions"
  element={
    <ProtectedAdminRoute permission="subscriptions.view">
      <Subscriptions />
    </ProtectedAdminRoute>
  }
/>

const VerificationsPage   = () => <Placeholder title="Verifications" />;

const BookingsPage        = () => <Placeholder title="Bookings" />;
const BookingDetailPage   = () => <Placeholder title="Booking Detail" />;
const JobsPage            = () => <Placeholder title="Jobs" />;
const ServiceCatalogPage  = () => <Placeholder title="Service Catalog" />;
const RevenuePage         = () => <Placeholder title="Revenue" />;
const CommissionsPage     = () => <Placeholder title="Commissions" />;
const PaymentsPage        = () => <Placeholder title="Payments" />;
const UsersPage           = () => <Placeholder title="Users" />;
const UserDetailPage      = () => <Placeholder title="User Detail" />;
const AdminUsersPage      = () => <Placeholder title="Admin Users" />;
const ActivityLogsPage    = () => <Placeholder title="Activity Logs" />;
const NotificationsPage   = () => <Placeholder title="Notifications" />;
const ReportsPage         = () => <Placeholder title="Reports" />;
const SettingsPage        = () => <Placeholder title="Settings" />;
const NotFoundPage        = () => <Placeholder title="Page Not Found" />;

// ═════════════════════════════════════════════════════════════
// ROUTES
// ═════════════════════════════════════════════════════════════

const AdminRoutes = () => {
  return (
    <Routes>
      {/* ─── PUBLIC ────────────────────────────────────── */}
      {/* Login is the only admin route that doesn't require auth */}
      <Route path="login" element={<AdminLogin />} />

      {/* ─── PROTECTED ─────────────────────────────────── */}
      {/* Everything under the layout is guarded by ProtectedAdminRoute */}
      <Route
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        {/* Default redirect: /admin → /admin/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* ── Dashboard ─────────────────────────────── */}
        <Route
          path="dashboard"
          element={
            <ProtectedAdminRoute permission="dashboard.view">
              <Dashboard/>
            </ProtectedAdminRoute>
          }
        />

        {/* ── Technicians ───────────────────────────── */}
        <Route
          path="technicians"
          element={
            <ProtectedAdminRoute permission="technicians.view">
              <Technicians />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="technicians/:id"
          element={
            <ProtectedAdminRoute permission="technicians.view_details">
              <TechnicianDetail />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Verifications ─────────────────────────── */}
        <Route
          path="verifications"
          element={
            <ProtectedAdminRoute permission="verifications.view">
              <VerificationsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Subscriptions ─────────────────────────── */}
        <Route
          path="subscriptions"
          element={
            <ProtectedAdminRoute permission="subscriptions.view">
              <SubscriptionsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Bookings ──────────────────────────────── */}
        <Route
          path="bookings"
          element={
            <ProtectedAdminRoute permission="bookings.view">
              <BookingsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="bookings/:id"
          element={
            <ProtectedAdminRoute permission="bookings.view_details">
              <BookingDetailPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Jobs ──────────────────────────────────── */}
        <Route
          path="jobs"
          element={
            <ProtectedAdminRoute permission="jobs.view">
              <JobsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Service Catalog ───────────────────────── */}
        <Route
          path="catalog"
          element={
            <ProtectedAdminRoute permission="catalog.view">
              <ServiceCatalogPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Revenue ───────────────────────────────── */}
        <Route
          path="revenue"
          element={
            <ProtectedAdminRoute permission="revenue.view">
              <RevenuePage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Commissions ───────────────────────────── */}
        <Route
          path="commissions"
          element={
            <ProtectedAdminRoute permission="commission.view">
              <CommissionsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Payments ──────────────────────────────── */}
        <Route
          path="payments"
          element={
            <ProtectedAdminRoute permission="payments.view">
              <PaymentsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Users ─────────────────────────────────── */}
        <Route
          path="users"
          element={
            <ProtectedAdminRoute permission="users.view">
              <UsersPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <ProtectedAdminRoute permission="users.view_details">
              <UserDetailPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Admin Users ───────────────────────────── */}
        <Route
          path="admin-users"
          element={
            <ProtectedAdminRoute permission="admin_users.view">
              <AdminUsersPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Roles & Permissions ───────────────────── */}
        <Route
          path="roles"
          element={
            <ProtectedAdminRoute permission="roles.view">
              <Roles />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Activity Logs ─────────────────────────── */}
        <Route
          path="activity"
          element={
            <ProtectedAdminRoute permission="activity.view">
              <ActivityLogsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Notifications ─────────────────────────── */}
        <Route
          path="notifications"
          element={
            <ProtectedAdminRoute permission="notifications.view">
              <NotificationsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Reports ───────────────────────────────── */}
        <Route
          path="reports"
          element={
            <ProtectedAdminRoute permission="reports.view">
              <ReportsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── Settings ──────────────────────────────── */}
        <Route
          path="settings"
          element={
            <ProtectedAdminRoute permission="settings.view">
              <SettingsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* ── 404 inside admin tree ─────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;