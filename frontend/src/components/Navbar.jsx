/**
 * Navbar Component
 * ================
 * 
 * Purpose: Main navigation bar for the entire application
 * 
 * Features:
 * - Responsive design (mobile and desktop)
 * - Role-based navigation links
 * - User profile dropdown
 * - Active route highlighting
 * - Smooth scroll effects
 * 
 * Access Control:
 * - Public links: Home, Services, Search, Book Service
 * - Authenticated users: Profile, Logout
 * - Technicians: Dashboard, Subscription
 * - Admins: Admin Panel, View all technicians
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Menu, X, Search, Calendar, Home, Settings, LogIn, UserPlus, Plus, List,
 User, ChevronDown, LogOut, UserCircle, Wrench, FileText, Shield, Briefcase,
  LayoutDashboard, CreditCard, Users 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, technicianProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links available to all users
  const navLinks = [
    { name: "Home", icon: Home, path: "/" },
    { name: "Services", icon: Settings, path: "/services" },
    { name: "Available Jobs", icon: Briefcase, path: "/available-jobs" }, // NEW
    { name: "Search", icon: Search, path: "/search", highlight: true },
    { name: "Book Service", icon: Calendar, path: "/book-service" },
  ];

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMobileMenu();
    setIsProfileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const hasTechnicianProfile = user?.role === 'technician' && technicianProfile;
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-lg border-b border-gray-100" : "bg-white/95 backdrop-blur-sm border-b border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Section */}
            <Link to="/" className="flex items-center space-x-2 group" onClick={closeMobileMenu}>
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-green-500 rounded-lg rotate-6 group-hover:rotate-12 transition-transform duration-300 shadow-md flex items-center justify-center">
                  <span className="text-white font-bold text-xl transform -rotate-6">W</span>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-green-700">WeBA</span>
                <span className="text-red-600">-Hub</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {/* Main Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive(link.path)
                      ? "bg-green-50 text-green-700"
                      : link.highlight
                      ? "text-gray-700 hover:bg-red-50 hover:text-red-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              ))}

              {/* Accessing Job SECTION - For clients, technicians and admins */}


              {user && user.role === 'client' && (
  <>
    <Link
      to="/post-job"
      className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 bg-green-600 text-white hover:bg-green-700"
    >
      <Plus className="w-4 h-4" />
      <span>Post a Job</span>
    </Link>
    <Link
      to="/my-jobs"
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
        isActive('/my-jobs')
          ? "bg-green-50 text-green-700"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <List className="w-4 h-4" />
      <span>My Jobs</span>
    </Link>
  </>
)}

{user && user.role === 'technician' && (
  <Link
    to="/my-applications"
    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
      isActive('/my-applications')
        ? "bg-green-50 text-green-700"
        : "text-gray-700 hover:bg-gray-100"
    }`}
  >
    <FileText className="w-4 h-4" />
    <span>My Applications</span>
  </Link>
)}
              
              {/* Technician Dashboard Link - For technicians and admins */}
              {(isTechnician || isAdmin) && (
                <Link
                  to="/technician-dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive('/technician-dashboard')
                      ? "bg-green-50 text-green-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )}
              
              {/* Subscription Link - For technicians and admins */}
              {(isTechnician || isAdmin) && (
                <Link
                  to="/subscription"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive('/subscription')
                      ? "bg-green-50 text-green-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Subscription</span>
                </Link>
              )}
              
              {/* Admin Panel Link - Only for admins */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    location.pathname.startsWith('/admin')
                      ? "bg-red-50 text-red-700"
                      : "text-red-600 hover:bg-red-50 hover:text-red-700"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
              
              {/* Auth Buttons or User Menu */}
              {user ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition-all"
                  >
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn">
                      {/* User Info Header */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">
                          {user.fullName || `${user.firstName} ${user.lastName}`}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                      
                      {/* Profile Link */}
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-gray-500" />
                        <span>View Profile</span>
                      </Link>
                      
                      {/* Client to Technician Upgrade */}
                      {user.role === 'client' && (
                        <Link
                          to="/become-technician"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        >
                          <Wrench className="w-4 h-4 text-gray-500" />
                          <span>Become a Technician</span>
                        </Link>
                      )}
                      
                      {/* Create Technician Profile (for technicians without profile) */}
                      {user.role === 'technician' && !hasTechnicianProfile && (
                        <Link
                          to="/create-technician-profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        >
                          <Wrench className="w-4 h-4 text-gray-500" />
                          <span>Create Technician Profile</span>
                        </Link>
                      )}

                      {/* Technician Dashboard Link in Dropdown */}
                      {user.role === 'technician' && hasTechnicianProfile && (
                        <Link
                          to="/technician-dashboard"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-500" />
                          <span>Technician Dashboard</span>
                        </Link>
                      )}
                      
                      {/* Admin Quick Links */}
                      {user.role === 'admin' && (
                        <>
                          <Link
                            to="/technician-dashboard"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                          >
                            <LayoutDashboard className="w-4 h-4 text-gray-500" />
                            <span>My Dashboard</span>
                          </Link>
                          <Link
                            to="/admin/technicians"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Users className="w-4 h-4 text-gray-500" />
                            <span>Manage Technicians</span>
                          </Link>
                          <Link
                            to="/admin/verification"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Shield className="w-4 h-4 text-gray-500" />
                            <span>Verification Requests</span>
                          </Link>
                        </>
                      )}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Auth Buttons for Non-authenticated Users */
                <div className="flex items-center ml-2 space-x-2">
                  <Link
                    to="/signup"
                    className="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Sign up
                  </Link>
                  <Link
                    to="/login"
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 animate-fadeIn">
              <div className="flex flex-col space-y-1">
                {/* Main Navigation Links */}
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive(link.path)
                        ? "bg-green-50 text-green-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ))}
                
                {/* Technician Dashboard - Mobile */}
                {(isTechnician || isAdmin) && (
                  <Link
                    to="/technician-dashboard"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/technician-dashboard')
                        ? "bg-green-50 text-green-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                )}
                
                {/* Subscription - Mobile */}
                {(isTechnician || isAdmin) && (
                  <Link
                    to="/subscription"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/subscription')
                        ? "bg-green-50 text-green-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Subscription</span>
                  </Link>
                )}
                
                {/* Admin Panel - Mobile */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      location.pathname.startsWith('/admin')
                        ? "bg-red-50 text-red-700"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Admin Panel</span>
                  </Link>
                )}
                
                {/* Mobile Auth Section */}
                {user ? (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    {/* User Info Card */}
                    <div className="flex items-center space-x-3 px-3 py-2.5 bg-gray-50 rounded-lg">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.fullName || `${user.firstName} ${user.lastName}`}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    
                    {/* Profile Link */}
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="w-5 h-5 text-gray-500" />
                      <span>View Profile</span>
                    </Link>

                    {/* Become Technician Link */}
                    {user.role === 'client' && (
                      <Link
                        to="/become-technician"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <Wrench className="w-5 h-5 text-gray-500" />
                        <span>Become a Technician</span>
                      </Link>
                    )}

                    {/* Create Technician Profile Link */}
                    {user.role === 'technician' && !hasTechnicianProfile && (
                      <Link
                        to="/create-technician-profile"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <Wrench className="w-5 h-5 text-gray-500" />
                        <span>Create Technician Profile</span>
                      </Link>
                    )}
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  /* Mobile Auth Buttons */
                  <div className="flex flex-col space-y-2 pt-2">
                    <Link
                      to="/signup"
                      onClick={closeMobileMenu}
                      className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium text-center hover:bg-green-700 transition-colors"
                    >
                      Sign up
                    </Link>
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium text-center hover:bg-gray-50 transition-colors"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;