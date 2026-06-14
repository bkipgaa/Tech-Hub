import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TechnicianRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
      </div>
    );
  }
  
  // Technicians AND Admins can access technician pages
  return user && (user.role === 'technician' || user.role === 'admin') 
    ? children 
    : <Navigate to="/login" />;
};

export default TechnicianRoute;