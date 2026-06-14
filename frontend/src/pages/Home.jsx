import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import api from '../services/api';

const Home = () => {
  const navigate = useNavigate();
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
      {/* Hero Section with Background Video */}
      <div className="relative h-[500px] overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=1920&h=500&fit=crop"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-man-working-on-laptop-and-phone-32868-large.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fadeIn">
            Welcome to <span className="text-green-500">WeBA-Hub</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-6 animate-fadeInUp">
            Your trusted marketplace connecting you with verified professionals
          </p>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg leading-relaxed animate-fadeInUp">
            From IT solutions to home services, find qualified experts ready to help with your needs. 
            Get matched with the best technicians in your area.
          </p>
          
          {/* Search CTA */}
          <div className="mt-8 flex gap-4 animate-fadeInUp">
            <button
              onClick={() => navigate('/search')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              Find a Technician
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/become-technician')}
              className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30"
            >
              Become a Technician
            </button>
          </div>
        </div>
      </div>

      {/* Top Categories Section - Featured */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Popular Services</h2>
          <p className="text-gray-500 text-sm">Most requested categories by our users</p>
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
          <p className="text-gray-500 text-sm">Simple steps to get your service needs met</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-green-600">1</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1 text-base">Search for a Service</h3>
            <p className="text-gray-500 text-xs">Browse categories or search for specific services you need</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-green-600">2</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1 text-base">Choose a Technician</h3>
            <p className="text-gray-500 text-xs">Compare profiles, ratings, and prices from verified professionals</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-green-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-green-600">3</span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1 text-base">Book & Get Service</h3>
            <p className="text-gray-500 text-xs">Schedule your service and get quality work done</p>
          </div>
        </div>
      </div>

      {/* Newsletter / CTA Bottom */}
      <div className="bg-gradient-to-r from-green-700 to-green-900 py-10 mt-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to grow your business?</h2>
          <p className="text-green-100 mb-5 text-sm">Join thousands of professionals who trust WeBA-Hub</p>
          <button
            onClick={() => navigate('/become-technician')}
            className="bg-white text-green-700 px-6 py-2.5 rounded-md font-semibold hover:bg-gray-100 transition-colors text-sm"
          >
            Become a Technician Today
          </button>
        </div>
      </div>

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