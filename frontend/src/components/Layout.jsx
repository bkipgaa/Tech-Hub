// src/components/Layout.jsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

// Token Display Component (keep as is)
const TokenDisplay = ({ onClose }) => {
  const { token } = useAuth();
  
  if (!token) return null;
  
  return (
    <div className="fixed bottom-20 left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-w-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-gray-700">JWT Token</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="bg-gray-100 rounded p-2 overflow-x-auto">
        <code className="text-xs break-all">{token}</code>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(token);
          alert('Token copied to clipboard!');
        }}
        className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
      >
        Copy Token
      </button>
    </div>
  );
};

const Layout = () => {
  const { user, showToken } = useAuth();
  const [showTokenDisplay, setShowTokenDisplay] = useState(false);
  const location = useLocation();

  // Don't show the token button on admin routes to keep admin panel clean
  const isAdminRoute = location.pathname.startsWith('/admin');
  const showTokenButton = user && !isAdminRoute;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-red-50">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <Outlet />
      </main>
      <Footer />
      
      {/* Quick Access Sidebar for Technicians & Admins (Desktop) */}
      {user && (user.role === 'technician' || user.role === 'admin') && (
        <div className="hidden lg:block fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 space-y-2">
            {(user.role === 'technician' || user.role === 'admin') && (
              <>
                <Link
                  to="/technician-dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === '/technician-dashboard'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Dashboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                
                <Link
                  to="/subscription"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === '/subscription'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Subscription"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              </>
            )}
            
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Admin Panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* Token Display Button (only when logged in and not on admin routes) */}
      {showTokenButton && (
        <>
          <button
            onClick={() => setShowTokenDisplay(!showTokenDisplay)}
            className="fixed bottom-4 left-4 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors z-40"
            title="Toggle Token Display"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </button>
          
          {showTokenDisplay && (
            <TokenDisplay onClose={() => setShowTokenDisplay(false)} />
          )}
        </>
      )}
    </div>
  );
};

export default Layout;