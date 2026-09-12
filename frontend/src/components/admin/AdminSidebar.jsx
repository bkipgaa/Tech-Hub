/**
 * AdminSidebar.jsx
 * ================
 * Admin navigation sidebar.
 * 
 * Features:
 * - Permission-filtered menu (only shows items the admin can access)
 * - Grouped sections (Overview, Operations, Finance, System)
 * - Active route highlighting
 * - Collapsible on mobile (drawer with backdrop)
 * - Footer with logged-in admin info
 * 
 * @version 1.0.0
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  BadgeCheck,
  CreditCard,
  Briefcase,
  FileText,
  ListTree,
  TrendingUp,
  DollarSign,
  Wallet,
  Users,
  Shield,
  KeyRound,
  Activity,
  Bell,
  BarChart3,
  Headphones,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

// ─────────────────────────────────────────────────────────────
// MENU CONFIG
// Each item: { path, label, icon, permission }
// Items are grouped into sections for readability.
// ─────────────────────────────────────────────────────────────

const MENU_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/admin/technicians',   label: 'Technicians',    icon: Wrench,     permission: 'technicians.view' },
      { path: '/admin/verifications', label: 'Verifications',  icon: BadgeCheck, permission: 'verifications.view' },
      { path: '/admin/bookings',      label: 'Bookings',       icon: Briefcase,  permission: 'bookings.view' },
      { path: '/admin/jobs',          label: 'Jobs',           icon: FileText,   permission: 'jobs.view' },
      { path: '/admin/catalog',       label: 'Service Catalog', icon: ListTree,  permission: 'catalog.view' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, permission: 'subscriptions.view' },
      { path: '/admin/revenue',       label: 'Revenue',       icon: TrendingUp, permission: 'revenue.view' },
      { path: '/admin/commissions',   label: 'Commissions',   icon: DollarSign, permission: 'commission.view' },
      { path: '/admin/payments',      label: 'Payments',      icon: Wallet,     permission: 'payments.view' },
    ],
  },
  {
    label: 'Users',
    items: [
      { path: '/admin/users', label: 'Users', icon: Users, permission: 'users.view' },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/admin/admin-users',   label: 'Admin Users',   icon: Shield,    permission: 'admin_users.view' },
      { path: '/admin/roles',         label: 'Roles',         icon: KeyRound,  permission: 'roles.view' },
      { path: '/admin/activity',      label: 'Activity Logs', icon: Activity,  permission: 'activity.view' },
      { path: '/admin/notifications', label: 'Notifications', icon: Bell,      permission: 'notifications.view' },
      { path: '/admin/reports',       label: 'Reports',       icon: BarChart3, permission: 'reports.view' },
      { path: '/admin/support',       label: 'Support',       icon: Headphones, permission: 'support.view' },
      { path: '/admin/settings',      label: 'Settings',      icon: Settings,  permission: 'settings.view' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

const AdminSidebar = ({ isOpen, onClose }) => {
  const { admin, role, hasPermission, logout } = useAdminAuth();
  const navigate = useNavigate();

  // Filter the menu based on permissions
  const visibleSections = MENU_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <>
      {/* ─── Mobile backdrop ─────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar ────────────────────────────────── */}
      <aside
        className={`
          fixed lg:sticky lg:top-0 top-0 left-0 z-50 lg:z-0
          h-screen w-64 bg-gray-900 text-white flex flex-col
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">WeBA-Hub</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Navigation ─────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {visibleSections.map((section) => (
            <div key={section.label}>
              {/* Section heading */}
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {section.label}
              </p>

              {/* Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-red-600 text-white font-medium'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* If no sections are visible, show a friendly message */}
          {visibleSections.length === 0 && (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-gray-500">
                No menu items available for your role.
              </p>
            </div>
          )}
        </nav>

        {/* ── Footer: Logged-in admin ───────────────── */}
        <div className="px-3 py-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {admin?.firstName?.[0]}
              {admin?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {admin?.fullName || `${admin?.firstName} ${admin?.lastName}`}
              </p>
              <p className="text-[10px] text-gray-400 truncate capitalize">
                {role?.label || admin?.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;