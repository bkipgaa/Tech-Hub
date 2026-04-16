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
import TechnicianDashboard from './components/technician/TechnicianDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="/technicians" element={<Technicians />} />
            <Route path="/technician/:id" element={<TechnicianProfile />} /> 
            <Route path="search" element={<Search />} />
            <Route path="book-service" element={<BookService />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="login" element={<Login />} />
            <Route path="profile" element={<Profile />} />
            <Route path="become-technician" element={<BecomeTechnician />} />
            <Route path="create-technician-profile" element={<CreateTechnicianProfile />} />
            <Route path="technician-dashboard" element={<TechnicianDashboard />} />
            
            
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;