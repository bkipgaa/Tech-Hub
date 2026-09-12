/**
 * AdminLayout.jsx
 * ===============
 * The admin panel shell.
 * 
 * Structure:
 *   ┌─────────────────────────────────────────────────┐
 *   │  Topbar (profile, notifications)                │
 *   ├──────────────┬──────────────────────────────────┤
 *   │              │                                  │
 *   │   Sidebar    │   <Outlet />  (active page)      │
 *   │   (nav)      │                                  │
 *   │              │                                  │
 *   └──────────────┴──────────────────────────────────┘
 * 
 * On mobile, the sidebar becomes an overlay drawer.
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ─── Sidebar (desktop fixed, mobile drawer) ─── */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ─── Main content area ──────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar with a menu button on mobile */}
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;