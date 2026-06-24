import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Technicians from './pages/Technicians';
import TechnicianProfile from './pages/TechnicianProfile';
import Search from './pages/Search';
import BookService from './pages/BookService';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Profile from './pages/Profile';
import BecomeTechnician from './pages/BecomeTechnician';
import CreateTechnicianProfile from './pages/CreateTechnicianProfile';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminRegister from './pages/Admin/AdminRegister';
import TechnicianDashboard from './components/technician/TechnicianDashboard';
import SubscriptionManager from './components/technician/subscriptionManager';
import AdminDashboard from './components/admin/adminDashboard';
import TechnicianList from './components/admin/TechnicianList';
import TechnicianDetails from './components/admin/TechnicianDetails';
import SubscriptionStats from './components/admin/SubscriptionStats';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import TechnicianRoute from './components/TechnicianRoute';

import JobsPage from './pages/JobsPage';
import PostJob from './components/jobs/PostJob';
import MyJobs from './components/jobs/MyJobs';
import JobDetails from './components/jobs/JobDetails';
import MyApplications from './components/applications/MyApplications';
import AdminVerifyJobs from './components/admin/AdminVerifyJobs';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - Everyone can access */}
          <Route path="/" element={<Layout />}>
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
            
            {/* Protected Routes - Any authenticated user */}
            {/* ==================== ADMIN ROUTES (Separate Layout) ==================== */}
          {/* Admin Authentication - No main layout, separate styling */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />

            <Route path="profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            
            {/* Technician & Admin Accessible Routes */}
            <Route path="technician-dashboard" element={
              <TechnicianRoute>
                <TechnicianDashboard />
              </TechnicianRoute>
            } />
            
            <Route path="subscription" element={
              <TechnicianRoute>
                <SubscriptionManager />
              </TechnicianRoute>
            } />

            
<Route path="jobs/:jobId" element={<JobDetails />} />
<Route path="post-job" element={
  <PrivateRoute>
    <PostJob />
  </PrivateRoute>
} />
<Route path="my-jobs" element={
  <PrivateRoute>
    <MyJobs />
  </PrivateRoute>
} />
<Route path="my-applications" element={
  <PrivateRoute>
    <MyApplications />
  </PrivateRoute>
} />
            
            {/* Admin-Only Routes */}
            <Route path="admin/*" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
          </Route>

          {/* Admin Job Verification Route */}
<Route path="admin/verify-jobs" element={
  <AdminRoute>
    <AdminVerifyJobs />
  </AdminRoute>
} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;