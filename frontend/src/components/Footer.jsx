import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Globe } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    explore: [
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: "Search", path: "/search" },
      { name: "Book Service", path: "/book-service" },
    ],
    account: [
      { name: "Sign Up", path: "/signup" },
      { name: "Login", path: "/login" },
      { name: "My Bookings", path: "/bookings" },
      { name: "Profile", path: "/profile" },
    ],
    support: [
      { name: "Help Center", path: "/help" },
      { name: "FAQs", path: "/faqs" },
      { name: "Terms of Service", path: "/terms" },
      { name: "Privacy Policy", path: "/privacy" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", color: "hover:text-blue-600" },
    { icon: Twitter, href: "https://twitter.com", color: "hover:text-blue-400" },
    { icon: Instagram, href: "https://instagram.com", color: "hover:text-pink-600" },
    { icon: Linkedin, href: "https://linkedin.com", color: "hover:text-blue-700" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-xl font-bold">
                <span className="text-green-500">WeBA</span>
                <span className="text-red-500">-Hub</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Connecting you with verified professionals for all your technical and service needs.
            </p>
            <div className="flex space-x-3 pt-2">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 ${social.color} transition-all duration-300`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">Explore</h3>
            <ul className="space-y-2">
              {footerLinks.explore.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-green-500 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">Account</h3>
            <ul className="space-y-2">
              {footerLinks.account.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-green-500 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-green-500 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-green-500" />
                <span>hello@webahub.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-green-500" />
                <span>+254 700 123 456</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-green-500" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {currentYear} WeBA-Hub. All rights reserved.</p>
          <div className="flex gap-6 mt-3 sm:mt-0">
            <Link to="/privacy" className="hover:text-green-500 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-green-500 transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-green-500 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;