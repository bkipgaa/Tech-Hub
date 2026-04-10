import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t-4 border-green-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-500 rounded-lg flex items-center justify-center text-white font-black text-xl">
                W
              </div>
              <span className="text-xl font-bold">
                <span className="text-green-700">WeBA</span>
                <span className="text-red-600">-Hub</span>
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Crafting digital experiences with <span className="text-green-600 font-medium">green</span> innovation and 
              <span className="text-red-500 font-medium"> red</span> passion.
            </p>
            <div className="flex space-x-3 pt-2">
              {["📘", "📷", "🐦", "💼"].map((icon, idx) => (
                <div key={idx} className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-red-100 flex items-center justify-center text-lg hover:from-green-200 hover:to-red-200 cursor-pointer transition-all duration-300 border border-green-300">
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-green-700 font-bold text-lg mb-4 border-b-2 border-red-300 pb-2 inline-block">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-600 hover:text-red-600 cursor-pointer transition-colors flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-600 hover:text-red-600 cursor-pointer transition-colors flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Services</span>
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-600 hover:text-red-600 cursor-pointer transition-colors flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Search</span>
                </Link>
              </li>
              <li>
                <Link to="/book-service" className="text-gray-600 hover:text-red-600 cursor-pointer transition-colors flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span>Book Service</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-red-600 font-bold text-lg mb-4 border-b-2 border-green-400 pb-2 inline-block">Account</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/signup" className="text-gray-600 hover:text-green-600 cursor-pointer transition-colors flex items-center space-x-2">
                  <span className="text-red-400 text-sm">▶</span>
                  <span>Sign up</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-600 hover:text-green-600 cursor-pointer transition-colors flex items-center space-x-2">
                  <span className="text-red-400 text-sm">▶</span>
                  <span>Login</span>
                </Link>
              </li>
              <li>
                <Link to="/book-service" className="text-gray-600 hover:text-green-600 cursor-pointer transition-colors flex items-center space-x-2">
                  <span className="text-red-400 text-sm">▶</span>
                  <span>My Bookings</span>
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-600 hover:text-green-600 cursor-pointer transition-colors flex items-center space-x-2">
                  <span className="text-red-400 text-sm">▶</span>
                  <span>Profile</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-green-700 font-bold text-lg mb-4 border-b-2 border-red-300 pb-2 inline-block">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 text-gray-600">
                <span className="bg-green-100 p-2 rounded-full text-red-600">📧</span>
                <span className="text-sm">hello@webahub.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600">
                <span className="bg-red-100 p-2 rounded-full text-green-600">📞</span>
                <span className="text-sm">+1 (800) 555-4321</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-600">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                <span className="text-sm">123 Green Red Lane, CA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 md:mt-12 pt-6 border-t-2 border-green-200 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <span className="flex items-center space-x-2">
            <span>© {currentYear} WeBA-Hub.</span>
            <span className="text-green-600">Green</span>
            <span className="text-red-500">&</span>
            <span className="text-red-500">Red</span>
            <span>harmony.</span>
          </span>
          <span className="flex items-center space-x-1 mt-2 sm:mt-0">
            <span>Made with</span>
            <span className="text-red-500 text-xl animate-pulse">❤️</span>
            <span className="text-green-600">/leaf</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;