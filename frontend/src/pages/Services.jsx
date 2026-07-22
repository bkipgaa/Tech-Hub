/**
 * Services Page Component
 * Displays all available services from the backend service catalog
 * Fetches main categories, service categories, and sub-services dynamically
 * Features a rotating background image slider for the hero section
 * Now fetches and displays technicians inline based on selected distance.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  MapPin,
  Star,
  X,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

const Services = () => {
  const navigate = useNavigate();
  
  // ============================================================
  // STATE
  // ============================================================
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [subServicesData, setSubServicesData] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [maxDistance, setMaxDistance] = useState('');

  // 🆕 State for inline technician results
  const [technicians, setTechnicians] = useState([]);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [techniciansError, setTechniciansError] = useState('');
  const [selectedServiceKey, setSelectedServiceKey] = useState(''); // key to identify which sub-service we searched for
  const [showTechnicians, setShowTechnicians] = useState(false);

  // Background images for the hero section
  const backgroundImages = [
    {
      url: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=1920&h=500&fit=crop",
      alt: "IT & Networking Services"
    },
    {
      url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&h=500&fit=crop",
      alt: "Electrical Services"
    },
    {
      url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&h=500&fit=crop",
      alt: "Plumbing Services"
    },
    {
      url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&h=500&fit=crop",
      alt: "Mechanical Services"
    },
    {
      url: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=1920&h=500&fit=crop",
      alt: "Construction & Renovation"
    }
  ];

  // Rotate background images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch service catalog when component mounts
  useEffect(() => {
    fetchServiceCatalog();
  }, []);

  // ============================================================
  // API CALLS
  // ============================================================

  /**
   * Fetch the main service catalog from backend
   */
  const fetchServiceCatalog = async () => {
    try {
      const response = await api.get('/service-catalog/categories-with-counts');
      setCatalog(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('Could not load services. Please refresh the page.');
      setLoading(false);
    }
  };

  /**
   * Fetch detailed sub-services for a specific service category
   */
  const fetchSubServices = async (mainCategory, serviceCategory) => {
    const key = `${mainCategory}-${serviceCategory}`;
    if (subServicesData[key]) return;
    
    try {
      const encodedMain = encodeURIComponent(mainCategory);
      const encodedService = encodeURIComponent(serviceCategory);
      const response = await api.get(`/service-catalog/${encodedMain}/${encodedService}/sub-services/detailed`);
      setSubServicesData(prev => ({
        ...prev,
        [key]: response.data.data
      }));
    } catch (error) {
      console.error('Failed to load sub-services:', error);
    }
  };

  /**
   * 🆕 Fetch technicians for a specific sub-service using the search endpoint
   */
  const fetchTechniciansForSubService = async (mainCategory, serviceCategory, subService) => {
    if (!maxDistance) {
      setTechniciansError('Please select a distance first.');
      return;
    }

    setTechniciansLoading(true);
    setTechniciansError('');
    setShowTechnicians(true);
    setSelectedServiceKey(`${mainCategory}-${serviceCategory}-${subService}`);

    try {
      const params = new URLSearchParams({
        mainCategory,
        serviceCategory,
        subService,
        radius: maxDistance,
        // You can also add lat/lng if you have the user's location
      });

      // Use the existing search endpoint
      const response = await api.get(`/search/technicians?${params.toString()}`);

      if (response.data.success) {
        setTechnicians(response.data.data || []);
        if (response.data.data.length === 0) {
          setTechniciansError('No technicians found within this distance.');
        }
      } else {
        setTechniciansError(response.data.message || 'Failed to fetch technicians.');
        setTechnicians([]);
      }
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
      setTechniciansError('Could not load technicians. Please try again.');
      setTechnicians([]);
    } finally {
      setTechniciansLoading(false);
    }
  };

  /**
   * Toggle category expansion/collapse
   */
  const toggleCategory = async (mainCategory, categoryName) => {
    const key = `${mainCategory}-${categoryName}`;
    if (!expandedCategories[key]) {
      await fetchSubServices(mainCategory, categoryName);
    }
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  /**
   * Handle "View Technicians" click – fetch inline instead of navigating
   */
  const handleViewTechnicians = (mainCategory, serviceCategory, subService) => {
    fetchTechniciansForSubService(mainCategory, serviceCategory, subService);
  };

  /**
   * Clear the technician results
   */
  const clearTechnicians = () => {
    setTechnicians([]);
    setShowTechnicians(false);
    setTechniciansError('');
    setSelectedServiceKey('');
  };

  // ============================================================
  // RENDER HELPERS
  // ============================================================

  const renderTechnicians = () => {
    if (!showTechnicians) return null;

    return (
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            Technicians for {selectedServiceKey.split('-').slice(1).join(' - ')}
            <span className="text-sm font-normal text-gray-500 ml-2">
              (within {maxDistance} km)
            </span>
          </h3>
          <button
            onClick={clearTechnicians}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {techniciansLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading technicians...</span>
          </div>
        ) : techniciansError ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
            {techniciansError}
          </div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No technicians found for this service within the selected distance.
          </div>
        ) : (
          <div className="space-y-4">
            {technicians.map((tech) => (
              <div key={tech._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {tech.user?.profileImage ? (
                      <img
                        src={tech.user.profileImage}
                        alt={tech.user.firstName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-500">
                          {tech.user?.firstName?.[0]}{tech.user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-gray-800">
                        {tech.user?.firstName} {tech.user?.lastName}
                      </h4>
                      {tech.verificationStatus === 'verified' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tech.distance !== undefined && tech.distance !== null
                          ? `${tech.distance} km away`
                          : 'Distance unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {tech.profileHeadline || tech.businessName || 'Professional Technician'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        {tech.rating?.average?.toFixed(1) || 'New'}
                        ({tech.rating?.count || 0})
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        KES {tech.pricing?.hourlyRate || 0}/hr
                      </span>
                      {tech.yearsOfExperience > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {tech.yearsOfExperience}+ yrs
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/technician/${tech._id}`)}
                    className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-600 transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Rotating Background Images */}
      <div className="relative h-[400px] w-full overflow-hidden">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${image.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ))}
        
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-green-500 mb-3 animate-fadeIn">
              WeBA INFINITY SERVICES
            </h1>
            <p className="text-base md:text-lg text-gray-200 mb-4 animate-fadeInUp">
              Browse through our comprehensive range of professional services offered by verified technicians
            </p>
            <p className="text-sm md:text-base text-gray-300 max-w-3xl mx-auto animate-fadeInUp">
              From IT solutions to home services, find qualified professionals ready to help with your needs
            </p>
            
            {/* Distance Filter Dropdown */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fadeInUp">
              <label htmlFor="distanceSelect" className="text-white text-sm font-medium">
                Max distance:
              </label>
              <select
                id="distanceSelect"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none bg-white text-gray-800 text-sm w-full sm:w-auto"
              >
                <option value="">Select distance</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
                <option value="200">200 km</option>
                <option value="500">500 km</option>
                <option value="1000">1000 km</option>
              </select>
              {!maxDistance && (
                <span className="text-yellow-300 text-xs font-medium">
                  ⚠️ Please select a distance to view technicians
                </span>
              )}
            </div>

            {/* Image Indicator Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {backgroundImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? 'w-8 bg-green-500' : 'w-2 bg-gray-400 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services by Category */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="space-y-8">
          {catalog.map((category) => (
            <div key={category.mainCategory} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* Main Category Header */}
              <div className="bg-gray-100 px-6 py-4 transition-colors duration-300 hover:bg-green-50 group">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 group-hover:text-green-600 transition-colors duration-300">
                  <Wrench className="w-6 h-6" />
                  {category.mainCategory}
                </h2>
                <p className="text-gray-600 text-sm mt-1 group-hover:text-gray-700 transition-colors duration-300 font-medium">
                  {category.serviceCategories.length} service categories available
                </p>
              </div>

              {/* Service Categories List */}
              <div className="divide-y divide-gray-200">
                {category.serviceCategories.map((serviceCat) => (
                  <div key={serviceCat.name} className="bg-white">
                    
                    {/* Service Category Header */}
                    <button
                      onClick={() => toggleCategory(category.mainCategory, serviceCat.name)}
                      className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          {serviceCat.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium mt-1">{serviceCat.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-semibold">
                          {serviceCat.subServiceCount} services
                        </span>
                        {expandedCategories[`${category.mainCategory}-${serviceCat.name}`] ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Sub-services Section with View Technicians Button */}
                    {expandedCategories[`${category.mainCategory}-${serviceCat.name}`] && 
                     subServicesData[`${category.mainCategory}-${serviceCat.name}`] && (
                      <div className="px-6 pb-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                          {subServicesData[`${category.mainCategory}-${serviceCat.name}`].subServices.map((sub, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                              <h4 className="font-bold text-gray-800">{sub.name}</h4>
                              <p className="text-sm text-gray-600 font-medium mt-1">{sub.description}</p>
                              
                              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 font-medium">
                                {sub.typicalDuration && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 
                                    {sub.typicalDuration.value} {sub.typicalDuration.unit}
                                  </span>
                                )}
                                
                                {sub.suggestedPriceRange && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> 
                                    KES {sub.suggestedPriceRange.min.toLocaleString()} - {sub.suggestedPriceRange.max.toLocaleString()}
                                  </span>
                                )}
                                
                                {sub.expertiseLevel && (
                                  <span className="flex items-center gap-1">
                                    <Wrench className="w-3 h-3" /> 
                                    {sub.expertiseLevel.charAt(0).toUpperCase() + sub.expertiseLevel.slice(1)}
                                  </span>
                                )}
                              </div>
                              
                              {/* View Technicians Button – fetches inline */}
                              <button
                                onClick={() => handleViewTechnicians(category.mainCategory, serviceCat.name, sub.name)}
                                disabled={!maxDistance}
                                className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                  maxDistance
                                    ? 'bg-gray-800 text-white hover:bg-green-600'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                View Technicians {maxDistance && `within ${maxDistance} km`}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 🆕 Inline Technician Results Section */}
        {renderTechnicians()}

        {/* Call to Action Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need a specific service not listed?</p>
          <button className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors">
            Contact Us for Custom Request
          </button>
        </div>
      </div>

      {/* Add animation keyframes */}
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

export default Services;