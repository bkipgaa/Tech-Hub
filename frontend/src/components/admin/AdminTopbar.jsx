/**
 * AdminTopbar.jsx
 * ===============
 * Top bar for the admin panel.
 * 
 * Features:
 * - Mobile menu button (opens the sidebar drawer)
 * - Current page title (derived from the URL)
 * - Profile dropdown (name, role, logout)
 * - Sticky on scroll
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, ChevronDown, UserCircle, LogOut, Shield } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

// ─────────────────────────────────────────────────────────────
// PAGE TITLE MAPPING
// Maps URL segments to human-readable page titles.
// ─────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  'dashboard':      'Dashboard',
  'technicians':    'Technicians',
  'verifications':  'Verifications',
  'subscriptions':  'Subscriptions',
  'bookings':       'Bookings',
  'jobs':           'Jobs',
  'catalog':        'Service Catalog',
  'revenue':        'Revenue',
  'commissions':    'Commissions',
  'payments':       'Payments',
  'users':          'Users',
  'admin-users':    'Admin Users',
  'roles':          'Roles & Permissions',
  'activity':       'Activity Logs',
  'notifications':  'Notifications',
  'reports':        'Reports',
  'support':        'Support',
  'settings':       'Settings',
};

const AdminTopbar = ({ onMenuClick }) => {
  const { admin, role, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ─── Derive the current page title from the URL ──────────
  const getPageTitle = () => {
    const segments = location.pathname.split('/').filter(Boolean);
    // segments[0] = 'admin', segments[1] = page
    const page = segments[1];
    return PAGE_TITLES[page] || 'Admin';
  };

  // ─── Close dropdown when clicking outside ────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Close dropdown on route change ──────────────────────
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* ─── Left: Mobile menu + Page title ─────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* ─── Right: Profile dropdown ────────────────────── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Open profile menu"
          >
            {admin?.profileImage ? (
              <img
                src={admin.profileImage}
                alt={admin.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-bold">
                {admin?.firstName?.[0]}
                {admin?.lastName?.[0]}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-gray-800 leading-tight">
                {admin?.firstName} {admin?.lastName}
              </p>
              <p className="text-[10px] text-gray-500 capitalize leading-tight">
                {role?.label || admin?.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* ── Dropdown menu ──────────────────────────── */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {admin?.fullName || `${admin?.firstName} ${admin?.lastName}`}
                </p>
                <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-400">
                  <Shield className="w-3 h-3" />
                  {role?.label || admin?.role}
                </p>
              </div>

              <Link
                to="/admin/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserCircle className="w-4 h-4 text-gray-500" />
                <span>My Profile</span>
              </Link>

              <div className="border-t border-gray-100 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;