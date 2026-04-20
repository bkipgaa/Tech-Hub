import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Search, Calendar, Home, Settings, LogIn, UserPlus, User, ChevronDown, LogOut, UserCircle, Wrench } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, technicianProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", icon: Home, path: "/" },
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

  const isActive = (path) => location.pathname === path;

  const hasTechnicianProfile = user?.role === 'technician' && technicianProfile;

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-lg border-b border-gray-100" : "bg-white/95 backdrop-blur-sm border-b border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
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

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-gray-500" />
                        <span>View Profile</span>
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
                        <Link
                          to="/technician-dashboard"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        >
                          <Wrench className="w-4 h-4 text-gray-500" />
                          <span>Dashboard</span>
                        </Link>
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
              ) : (
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

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 animate-fadeIn">
              <div className="flex flex-col space-y-1">
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
                
                {/* Mobile Auth */}
                {user ? (
                  <>
                    <div className="border-t border-gray-200 my-2"></div>
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
                        <p className="font-semibold text-gray-800">{user.fullName || `${user.firstName} ${user.lastName}`}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="w-5 h-5 text-gray-500" />
                      <span>View Profile</span>
                    </Link>

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

                    {user.role === 'technician' && hasTechnicianProfile && (
                      <Link
                        to="/technician-dashboard"
                        onClick={closeMobileMenu}
                        className="flex items-center space-x-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                      >
                        <Wrench className="w-5 h-5 text-gray-500" />
                        <span>Dashboard</span>
                      </Link>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
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