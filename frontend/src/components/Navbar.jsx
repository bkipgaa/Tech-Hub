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
 * - Real-time chat unread badge (red dot on message icon)
 * 
 * Access Control:
 * - Public links: Home, Services, Search, Book Service
 * - Authenticated users: Profile, Messages, Logout
 * - Technicians: Dashboard, Subscription, Commissions
 * - Admins: Admin Panel, View all technicians
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Menu, X, Search, Calendar, Home, Settings, LogIn, UserPlus, Plus, List,
  User, ChevronDown, LogOut, UserCircle, Wrench, FileText, Shield, Briefcase,
  LayoutDashboard, CreditCard, Users, MessageSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSocket } from '../services/socket';

const Navbar = () => {
  // ─── LOCAL UI STATE ───────────────────────────
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ─── AUTH CONTEXT ─────────────────────────────
  const { user, technicianProfile, logout, getUnreadCount } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  // ─── CHAT UNREAD BADGE STATE ──────────────────
  const [unreadCount, setUnreadCount] = useState(0);

  // ===========================================
  // SCROLL EFFECT (navbar background shadow)
  // ===========================================
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ===========================================
  // REAL-TIME UNREAD BADGE
  // ===========================================
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount();
        if (res.success) setUnreadCount(res.count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };
    fetchUnread();

    const socket = getSocket();
    const handleConversationUpdate = () => fetchUnread();
    socket?.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket?.off('conversation_updated', handleConversationUpdate);
    };
  }, [user, getUnreadCount]);

  // ─── DERIVED FLAGS ────────────────────────────
  const hasTechnicianProfile = user?.role === 'technician' && technicianProfile;
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';

  // Navigation links visible to ALL users (public) — icons removed
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "Available Jobs", path: "/available-jobs" },
    { name: "Search", path: "/search", highlight: true },
    { name: "My Bookings", path: "/bookings" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMobileMenu();
    setIsProfileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-lg border-b border-gray-100" : "bg-white/95 backdrop-blur-sm border-b border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* ─── LOGO ───────────────────────────── */}
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

            {/* ─── DESKTOP NAVIGATION ─────────────── */}
            <div className="hidden md:flex items-center space-x-1">
              
              {/* Public nav links — icons removed, text-xs for smaller size */}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? "bg-green-50 text-green-700"
                      : link.highlight
                      ? "text-gray-700 hover:bg-red-50 hover:text-red-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{link.name}</span>
                </Link>
              ))}

              {/* ─── CLIENT-SPECIFIC LINKS ────────── */}
              {user?.role === 'client' && (
                <>
                  <Link
                    to="/post-job"
                    className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-green-600 text-white hover:bg-green-700"
                  >
                    Post a Job
                  </Link>
                  <Link
                    to="/my-jobs"
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive('/my-jobs') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    My Jobs
                  </Link>
                </>
              )}

              {/* ─── TECHNICIAN-SPECIFIC LINKS ────── */}
              {user?.role === 'technician' && (
                <Link
                  to="/my-applications"
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive('/my-applications') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  My Applications
                </Link>
              )}

              {/* ─── TECHNICIAN / ADMIN SHARED ────── */}
              {(isTechnician || isAdmin) && (
                <>
                  <Link
                    to="/technician-dashboard"
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive('/technician-dashboard') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/subscription"
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive('/subscription') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    Subscription
                  </Link>
                  {/* ─── NEW: COMMISSIONS LINK (TECHNICIANS ONLY) ── */}
                  {isTechnician && (
                    <Link
                      to="/technician-dashboard/commissions"
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isActive('/technician-dashboard/commissions') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      Commissions
                    </Link>
                  )}
                </>
              )}

              {/* ─── ADMIN ONLY ───────────────────── */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    location.pathname.startsWith('/admin')
                      ? "bg-red-50 text-red-700"
                      : "text-red-600 hover:bg-red-50 hover:text-red-700"
                  }`}
                >
                  Admin Panel
                </Link>
              )}

              {/* ─── AUTHENTICATED USER SECTION ───── */}
              {user ? (
                <div className="flex items-center space-x-2 ml-2">
                  
                  {/* Chat link — now text with badge, no icon */}
                  <Link 
                    to="/chat" 
                    className="relative px-2 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                  >
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* ─── PROFILE DROPDOWN ───────────── */}
                  <div className="relative">
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

                    {/* Dropdown Menu (icons kept as they are) */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn">
                        
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-800">
                            {user.fullName || `${user.firstName} ${user.lastName}`}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <UserCircle className="w-4 h-4 text-gray-500" />
                          <span>View Profile</span>
                        </Link>

                        <Link
                          to="/chat"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span>Messages</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                              {unreadCount}
                            </span>
                          )}
                        </Link>

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

                        {user.role === 'technician' && hasTechnicianProfile && (
                          <>
                            <Link
                              to="/technician-dashboard"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                            >
                              <LayoutDashboard className="w-4 h-4 text-gray-500" />
                              <span>Technician Dashboard</span>
                            </Link>
                            {/* ─── NEW: COMMISSIONS LINK IN DROPDOWN ── */}
                            <Link
                              to="/technician-dashboard/commissions"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <CreditCard className="w-4 h-4 text-gray-500" />
                              <span>Commissions</span>
                            </Link>
                          </>
                        )}

                        {isAdmin && (
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
                </div>
              ) : (
                /* ─── GUEST BUTTONS ──────────────── */
                <div className="flex items-center ml-2 space-x-2">
                  <Link
                    to="/signup"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Sign up
                  </Link>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>

            {/* ─── MOBILE MENU BUTTON ─────────────── */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* ─── MOBILE NAVIGATION MENU ─────────── */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 animate-fadeIn">
              <div className="flex flex-col space-y-1">
                
                {/* Public links — icons removed */}
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive(link.path) ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ))}

                {/* Mobile chat link with badge */}
                {user && (
                  <Link
                    to="/chat"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive('/chat') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">Messages</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Technician / Admin mobile links */}
                {(isTechnician || isAdmin) && (
                  <>
                    <Link
                      to="/technician-dashboard"
                      onClick={closeMobileMenu}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/technician-dashboard') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link
                      to="/subscription"
                      onClick={closeMobileMenu}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/subscription') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium">Subscription</span>
                    </Link>
                    {/* ─── NEW: COMMISSIONS LINK (TECHNICIANS ONLY) ── */}
                    {isTechnician && (
                      <Link
                        to="/technician-dashboard/commissions"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive('/technician-dashboard/commissions') ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span className="font-medium">Commissions</span>
                      </Link>
                    )}
                  </>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                      location.pathname.startsWith('/admin') ? "bg-red-50 text-red-700" : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <span className="font-medium">Admin Panel</span>
                  </Link>
                )}

                {/* Mobile auth section */}
                {user ? (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <div className="flex items-center space-x-3 px-3 py-2.5 bg-gray-50 rounded-lg">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-10 h-10 rounded-full object-cover" />
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

                    <Link to="/profile" onClick={closeMobileMenu} className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-500" />
                      <span>View Profile</span>
                    </Link>

                    {user.role === 'client' && (
                      <Link to="/become-technician" onClick={closeMobileMenu} className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                        <Wrench className="w-5 h-5 text-gray-500" />
                        <span>Become a Technician</span>
                      </Link>
                    )}

                    {user.role === 'technician' && !hasTechnicianProfile && (
                      <Link to="/create-technician-profile" onClick={closeMobileMenu} className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                        <Wrench className="w-5 h-5 text-gray-500" />
                        <span>Create Technician Profile</span>
                      </Link>
                    )}

                    {user.role === 'technician' && hasTechnicianProfile && (
                      <>
                        <Link to="/technician-dashboard" onClick={closeMobileMenu} className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                          <LayoutDashboard className="w-5 h-5 text-gray-500" />
                          <span>Dashboard</span>
                        </Link>
                        <Link to="/technician-dashboard/commissions" onClick={closeMobileMenu} className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                          <CreditCard className="w-5 h-5 text-gray-500" />
                          <span>Commissions</span>
                        </Link>
                      </>
                    )}

                    <button onClick={handleLogout} className="flex items-center space-x-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg">
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 pt-2">
                    <Link to="/signup" onClick={closeMobileMenu} className="bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium text-center hover:bg-green-700">
                      Sign up
                    </Link>
                    <Link to="/login" onClick={closeMobileMenu} className="border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium text-center hover:bg-gray-50">
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