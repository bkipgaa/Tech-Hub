import React, { useState, useEffect } from 'react';
import { Wrench, ArrowRight } from 'lucide-react';
import api from '../services/api';

const Home = () => {
  const [mainCategories, setMainCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, []);

  // Professional descriptions for each main category
  const getCategoryDescription = (categoryName) => {
    const descriptions = {
      'IT & Networking': 'Network setup, security systems, computer repair & infrastructure management.',
      'Electrical Services': 'Residential wiring, commercial installations & electrical repairs.',
      'Mechanical Services': 'Equipment repair, maintenance & industrial solutions.',
      'Plumbing': 'Leak detection, pipe installation & emergency repairs.',
      'Programming & AI': 'Custom software, web apps & AI solutions for businesses.',
      'Hairdressing & Beauty': 'Haircuts, styling, makeup & spa treatments.',
      'Carpentry & Furniture': 'Custom furniture, repair & woodworking services.',
      'Laundry & Dry Cleaning': 'Dry cleaning, laundry & garment care services.',
      'Cleaning Services': 'Home, office & commercial cleaning solutions.',
      'Painting & Decorating': 'Interior, exterior painting & decorative finishes.',
      'Welding & Fabrication': 'Metal fabrication, welding & custom metalwork.',
      'Automotive Repair': 'Auto diagnostics, engine repair & maintenance.',
      'Tutoring & Training': 'Professional tutoring & skills training.',
      'Photography & Videography': 'Event, commercial photography & video production.',
      'Event Planning': 'Wedding, corporate & party planning services.',
      'Construction & Renovation': 'Quality construction & home renovation.',
      'HVAC Services': 'AC, heating & ventilation installation & repair.',
      'Appliance Repair': 'Home & commercial appliance repair services.',
      'Moving & Logistics': 'Professional moving, packing & storage services.',
      'Gardening & Landscaping': 'Landscape design, garden maintenance & lawn care.'
    };
    
    return descriptions[categoryName] || `Professional ${categoryName.toLowerCase()} services by verified experts.`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
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
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome section with green text on black background */}
        <div className="text-center mb-10 bg-black py-10 rounded-2xl">
          <h1 className="text-4xl font-bold text-green-500 mb-3">
            Welcome to WeBA-Hub
          </h1>
          
          <p className="text-gray-400 max-w-3xl mx-auto mt-5 text-base leading-relaxed">
            Connecting you with verified professionals for all your technical and service needs. 
            From IT solutions to home services, we bring quality and reliability right to your doorstep.
          </p>
        </div>

        {/* Main Categories Grid - 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {mainCategories.map((category, index) => (
            <div
              key={index}
              className="group bg-white p-5 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              {/* Small icon */}
              <div className="mb-3">
                <Wrench className="w-8 h-8 text-gray-500 group-hover:text-red-600 transition-colors" />
              </div>
              
              {/* Category Name with red hover effect */}
              <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors duration-300 line-clamp-1">
                {category.name}
              </h3>
              
              {/* Short description */}
              <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">
                {getCategoryDescription(category.name)}
              </p>
              
              {/* Availability indicator */}
              {category.hasServices ? (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-green-600 font-medium">✓ Available</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              ) : (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-orange-500 font-medium">🔄 Coming Soon</span>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action Section */}
        <div className="mt-12 text-center bg-gray-50 rounded-xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Ready to Get Started?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-5 text-sm">
            Whether you need a service or want to offer your expertise, WeBA-Hub connects you 
            with the right people.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm">
              Find a Technician
            </button>
            <button className="border-2 border-gray-800 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-gray-800 hover:text-white transition-colors text-sm">
              Become a Technician
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;