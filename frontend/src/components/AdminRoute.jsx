import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Admin Route Guard
 * =================
 * 
 * Protects admin routes from unauthorized access
 * Redirects non-admin users to admin login page
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
      </div>
    );
  }
  
  // Check if user is admin
  if (!user || user.role !== 'admin') {
    // Redirect to admin login page
    return <Navigate to="/admin/login" />;
  }
  
  return children;
};

export default AdminRoute;