// src/components/Layout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, showToken } = useAuth();
  const [showTokenDisplay, setShowTokenDisplay] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-red-50">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <Outlet />
      </main>
      <Footer />
      
      {/* Token Display Button (only when logged in) */}
      {user && (
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