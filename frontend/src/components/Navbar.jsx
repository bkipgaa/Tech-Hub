import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, Calendar, Home as HomeIcon, Settings, LogIn, UserPlus, User, ChevronDown, LogOut, UserCircle, Wrench } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, technicianProfile, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: "Home", icon: HomeIcon, path: "/" },
    { name: "Services", icon: Settings, path: "/services" },
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

  // Check if user has technician profile
  const hasTechnicianProfile = user?.role === 'technician' && technicianProfile;

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-sm border-b-4 border-red-500 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo and brand */}
            <Link to="/" className="flex items-center space-x-2 group" onClick={closeMobileMenu}>
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg flex items-center justify-center">
                  <span className="text-white font-black text-xl md:text-2xl transform -rotate-6">W</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight">
                <span className="text-green-700">WeBA</span>
                <span className="text-red-600">-Hub</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 flex items-center space-x-1 group ${
                    link.highlight
                      ? "bg-green-100 text-green-800 hover:bg-green-200 border border-red-300"
                      : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <link.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span>{link.name}</span>
                </Link>
              ))}
              
              {/* Auth Buttons or User Menu */}
              {user ? (
                <div className="relative ml-4">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-red-100 px-3 py-2 rounded-full hover:from-green-200 hover:to-red-200 transition-all"
                  >
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover border-2 border-green-500"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">{user.fullName || `${user.firstName} ${user.lastName}`}</p>
                      <p className="text-xs text-gray-600 capitalize flex items-center">
                        {user.role}
                        {hasTechnicianProfile && (
                          <span className="ml-1 text-green-600">✓</span>
                        )}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border-2 border-green-200 py-2 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 transition-colors"
                      >
                        <UserCircle className="w-5 h-5 text-green-600" />
                        <span>View Profile</span>
                      </Link>
                      
                      {user.role === 'client' && (
                        <Link
                          to="/become-technician"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 transition-colors border-t border-gray-100"
                        >
                          <Wrench className="w-5 h-5 text-red-600" />
                          <span>Become a Technician</span>
                        </Link>
                      )}
                      
                      {user.role === 'technician' && !hasTechnicianProfile && (
                        <Link
                          to="/create-technician-profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 transition-colors border-t border-gray-100"
                        >
                          <Wrench className="w-5 h-5 text-green-600" />
                          <span>Create Technician Profile</span>
                        </Link>
                      )}

                      {user.role === 'technician' && hasTechnicianProfile && (
                        <Link
                          to="/technician-dashboard"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-green-50 transition-colors border-t border-gray-100"
                        >
                          <Wrench className="w-5 h-5 text-green-600" />
                          <span>Technician Dashboard</span>
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-red-50 transition-colors text-red-600 border-t border-gray-100"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center ml-4 space-x-2">
                  <Link
                    to="/signup"
                    className="bg-green-600 text-white px-4 lg:px-6 py-2 rounded-l-full rounded-r-md text-sm lg:text-base font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg border border-red-400 flex items-center space-x-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign up</span>
                  </Link>
                  <Link
                    to="/login"
                    className="bg-red-500 text-white px-4 lg:px-6 py-2 rounded-r-full rounded-l-md text-sm lg:text-base font-semibold hover:bg-red-600 transition-colors shadow-md hover:shadow-lg border border-green-400 flex items-center space-x-1"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-green-700 hover:text-red-600 hover:bg-green-50 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t-2 border-green-200 animate-fadeIn">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      link.highlight
                        ? "bg-green-100 text-green-800 border border-red-300"
                        : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ))}
                
                {/* Mobile Auth */}
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-3 bg-green-50 rounded-lg">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{user.fullName || `${user.firstName} ${user.lastName}`}</p>
                        <p className="text-sm text-gray-600 capitalize flex items-center">
                          {user.role}
                          {hasTechnicianProfile && (
                            <span className="ml-1 text-green-600">✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg"
                    >
                      <User className="w-5 h-5 text-green-600" />
                      <span>View Profile</span>
                    </Link>

                    {user.role === 'client' && (
                      <Link
                        to="/become-technician"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg"
                      >
                        <Wrench className="w-5 h-5 text-red-600" />
                        <span>Become a Technician</span>
                      </Link>
                    )}

                    {user.role === 'technician' && !hasTechnicianProfile && (
                      <Link
                        to="/create-technician-profile"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg"
                      >
                        <Wrench className="w-5 h-5 text-green-600" />
                        <span>Create Technician Profile</span>
                      </Link>
                    )}

                    {user.role === 'technician' && hasTechnicianProfile && (
                      <Link
                        to="/technician-dashboard"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-green-50 rounded-lg"
                      >
                        <Wrench className="w-5 h-5 text-green-600" />
                        <span>Technician Dashboard</span>
                      </Link>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col space-y-2 pt-4 mt-2 border-t-2 border-red-200">
                    <Link
                      to="/signup"
                      onClick={closeMobileMenu}
                      className="bg-green-600 text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-green-700 transition-colors text-center flex items-center justify-center space-x-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Sign up</span>
                    </Link>
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="bg-red-500 text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors text-center flex items-center justify-center space-x-2"
                    >
                      <LogIn className="w-5 h-5" />
                      <span>Login</span>
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