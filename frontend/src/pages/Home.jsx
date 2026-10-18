import React, { useState, useEffect } from 'react';
import { Wordmark } from '../components/Wordmark';
import HeroSlideshow from '../components/HeroSlideshow';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookingBenefits from '../components/technician/BookingBenefits';
import TechnicianHome from '../components/technician/TechnicianHome';

const CLIENT_STEPS = [
  { title: 'Search for a Service', text: 'Browse categories or search for specific services you need' },
  { title: 'Choose an Expert', text: 'Compare profiles, ratings, and prices from verified professionals' },
  { title: 'Book & Get Service', text: 'Schedule your service and get quality work done' },
];

const TECHNICIAN_STEPS = [
  { title: 'Get a Booking', text: 'Clients near you find you in search and send a request' },
  { title: 'Quote & Do the Work', text: 'Send your quotation, agree with the client, and complete the job' },
  { title: 'Get Rated', text: 'The client confirms the labor amount and rates you — ratings move you up in search' },
  { title: 'Pay 5% Commission', text: 'Pay by M-Pesa or card within 30 days of finishing the job' },
];

const Home = () => {
  const navigate = useNavigate();
  const { isTechnician, user } = useAuth();
  const [showBenefits, setShowBenefits] = useState(false);
  const [mainCategories, setMainCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  // Fetch main categories from backend on component mount
  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const response = await api.get('/service-catalog/main-categories');
        setMainCategories(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load main categories:', err);
        setError('Could not load service categories. Please refresh the page.');
        setLoading(false);
      }
    };
    fetchMainCategories();
    
    // Get user location for better search results
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location permission denied'),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Handle category click - navigate to search with category filter
  const handleCategoryClick = (categoryName) => {
    // Navigate to search page with category filter
    // The search will automatically use user's location if available
    navigate(`/search?mainCategory=${encodeURIComponent(categoryName)}`);
  };

  // Get top 5 categories for featured section
  const topCategories = mainCategories.slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Why complete jobs through bookings — benefits popup */}
      {showBenefits && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowBenefits(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowBenefits(false)}
              className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <BookingBenefits />
          </div>
        </div>
      )}

      {/* Hero Section: rotating photos of experts at work, one per service area */}
      <div className="relative min-h-[540px] md:min-h-[520px] overflow-hidden flex">
        <HeroSlideshow />

        {/* Hero Content */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4 pt-12 pb-28">
          {isTechnician ? (
            <>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 animate-fadeIn">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
              </h1>
              <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-6 animate-fadeInUp">
                Here's how your business on <Wordmark className="" onDark /> is doing
              </p>
              <p className="text-gray-300 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed animate-fadeInUp">
                Need a job done outside your skills? You can find and book other experts too.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 animate-fadeIn">
                Welcome to <Wordmark className="" onDark />
              </h1>
              <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-6 animate-fadeInUp">
                Your trusted marketplace connecting you with verified professionals
              </p>
              <p className="text-gray-300 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed animate-fadeInUp">
                From IT solutions to home services, find qualified experts ready to help with your needs.
                Get matched with the best experts in your area.
              </p>
            </>
          )}
          
          {/* Search CTA */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 sm:gap-4 animate-fadeInUp">
            <button
              onClick={() => navigate('/search')}
              className="bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              Find an Expert
              <ArrowRight className="w-5 h-5" />
            </button>
            {/* Already a technician → nothing to become */}
            {!isTechnician && (
              <button
                onClick={() => navigate('/become-technician')}
                className="bg-white/20 backdrop-blur-sm text-white px-6 sm:px-8 py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-white/30 transition-colors border border-white/30"
              >
                Become an Expert
              </button>
            )}
            <button
              onClick={() => setShowBenefits(true)}
              className="bg-white/20 backdrop-blur-sm text-white px-6 sm:px-8 py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-white/30 transition-colors border border-white/30"
            >
              Why Complete Jobs Through Bookings?
            </button>
          </div>
        </div>
      </div>

      {/* Technician: business overview, plans, growth */}
      {isTechnician && <TechnicianHome />}

      {/* Top Categories Section - Featured */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {isTechnician ? 'Need Help With Something Else?' : 'Popular Services'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isTechnician
              ? 'Find an expert for jobs outside your skills — most requested categories'
              : 'Most requested categories by our users'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {topCategories.map((category, index) => (
            <div
              key={index}
              onClick={() => handleCategoryClick(category.name)}
              className="group bg-white py-3 px-2 rounded-md shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all duration-200 cursor-pointer text-center"
            >
              <h3 className="font-medium text-gray-800 group-hover:text-green-600 transition-colors duration-200 text-sm">
                {category.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {category.hasServices ? 'Available Now' : 'Coming Soon'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* All Categories Section */}
      <div className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">All Services</h2>
            <p className="text-gray-500 text-sm">Browse through our complete range of professional services</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {mainCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategoryClick(category.name)}
                className="flex items-center justify-between p-2.5 rounded-md border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
              >
                <span className="text-gray-700 group-hover:text-green-600 font-medium text-sm transition-colors">
                  {category.name}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-0.5 transition-all duration-200" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">How It Works</h2>
          <p className="text-gray-500 text-sm">
            {isTechnician ? 'From booking to getting paid' : 'Simple steps to get your service needs met'}
          </p>
        </div>

        <div className={`grid grid-cols-1 gap-6 ${isTechnician ? 'sm:grid-cols-2 md:grid-cols-4' : 'md:grid-cols-3'}`}>
          {(isTechnician ? TECHNICIAN_STEPS : CLIENT_STEPS).map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="w-10 h-10 bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-lg font-bold text-green-600">{index + 1}</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 text-base">{step.title}</h3>
              <p className="text-gray-500 text-xs">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter / CTA Bottom — not for people who are already technicians */}
      {!isTechnician && (
      <div className="bg-gradient-to-r from-green-700 to-green-900 py-10 mt-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to grow your business?</h2>
          <p className="text-green-100 mb-5 text-sm">Join thousands of professionals who trust Webafix</p>
          <button
            onClick={() => navigate('/become-technician')}
            className="bg-white text-green-700 px-6 py-2.5 rounded-md font-semibold hover:bg-gray-100 transition-colors text-sm"
          >
            Become an Expert Today
          </button>
        </div>
      </div>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Home;