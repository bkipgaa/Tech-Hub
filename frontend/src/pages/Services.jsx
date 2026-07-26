/**
 * Services Page Component
 * Displays all available services from the backend service catalog
 * Navigates to TechnicianSearchResults page when "View Technicians" is clicked
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
  Loader2,
} from 'lucide-react';
import api from '../services/api';

const Services = () => {
  const navigate = useNavigate();
  
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [subServicesData, setSubServicesData] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [maxDistance, setMaxDistance] = useState('');

  // Geolocation state
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationMessage, setLocationMessage] = useState('');

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchServiceCatalog();
  }, []);

  useEffect(() => {
    requestUserLocation();
  }, []);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('success');
      },
      (err) => {
        let msg = 'Unable to retrieve your location.';
        if (err.code === 1) msg = 'Location access denied.';
        else if (err.code === 2) msg = 'Location unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';
        setLocationStatus('error');
        setLocationMessage(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const fetchServiceCatalog = async () => {
    try {
      const response = await api.get('/service-catalog/categories-with-counts');
      const payload = response.data ?? response;
      setCatalog(payload.data ?? payload ?? []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('Could not load services. Please refresh the page.');
      setLoading(false);
    }
  };

  const fetchSubServices = async (mainCategory, serviceCategory) => {
    const key = `${mainCategory}-${serviceCategory}`;
    if (subServicesData[key]) return;
    try {
      const encodedMain = encodeURIComponent(mainCategory);
      const encodedService = encodeURIComponent(serviceCategory);
      const response = await api.get(`/service-catalog/${encodedMain}/${encodedService}/sub-services/detailed`);
      const payload = response.data ?? response;
      setSubServicesData(prev => ({ ...prev, [key]: payload.data ?? payload }));
    } catch (error) {
      console.error('Failed to load sub-services:', error);
    }
  };

  const toggleCategory = async (mainCategory, categoryName) => {
    const key = `${mainCategory}-${categoryName}`;
    if (!expandedCategories[key]) {
      await fetchSubServices(mainCategory, categoryName);
    }
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * Navigate to dedicated search results page
   */
  const handleViewTechnicians = (mainCategory, serviceCategory, subService) => {
    if (!maxDistance) {
      alert('Please select a maximum distance first.');
      return;
    }
    if (!userLocation) {
      alert('Please allow location access to find nearby technicians.');
      requestUserLocation();
      return;
    }

    const params = new URLSearchParams({
      mainCategory,
      serviceCategory,
      subService,
      radius: maxDistance,
      lat: userLocation.lat,
      lng: userLocation.lng,
    });

    navigate(`/technicians/search?${params.toString()}`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
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
            
            {/* Distance Filter & Location Status */}
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

              <div className="flex items-center gap-2 min-h-[24px]">
                {locationStatus === 'loading' && (
                  <span className="text-yellow-300 text-xs flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Detecting location...
                  </span>
                )}
                {locationStatus === 'error' && (
                  <button
                    onClick={requestUserLocation}
                    className="text-red-300 text-xs underline hover:text-red-200 font-medium flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    {locationMessage} (Retry)
                  </button>
                )}
                {locationStatus === 'success' && (
                  <span className="text-green-400 text-xs flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3" />
                    Location active
                  </span>
                )}
              </div>

              {!maxDistance && (
                <span className="text-yellow-300 text-xs font-medium">
                  ⚠️ Please select a distance
                </span>
              )}
            </div>

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
              
              <div className="bg-gray-100 px-6 py-4 transition-colors duration-300 hover:bg-green-50 group">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 group-hover:text-green-600 transition-colors duration-300">
                  <Wrench className="w-6 h-6" />
                  {category.mainCategory}
                </h2>
                <p className="text-gray-600 text-sm mt-1 group-hover:text-gray-700 transition-colors duration-300 font-medium">
                  {category.serviceCategories?.length ?? 0} service categories available
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {category.serviceCategories?.map((serviceCat) => (
                  <div key={serviceCat.name} className="bg-white">
                    
                    <button
                      onClick={() => toggleCategory(category.mainCategory, serviceCat.name)}
                      className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="pr-4">
                        <h3 className="text-lg font-bold text-gray-800">{serviceCat.name}</h3>
                        <p className="text-sm text-gray-600 font-medium mt-1">{serviceCat.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-semibold whitespace-nowrap">
                          {serviceCat.subServiceCount ?? 0} services
                        </span>
                        {expandedCategories[`${category.mainCategory}-${serviceCat.name}`] ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {expandedCategories[`${category.mainCategory}-${serviceCat.name}`] && 
                     subServicesData[`${category.mainCategory}-${serviceCat.name}`] && (
                      <div className="px-6 pb-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                          {subServicesData[`${category.mainCategory}-${serviceCat.name}`]?.subServices?.map((sub, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
                              <h4 className="font-bold text-gray-800">{sub.name}</h4>
                              <p className="text-sm text-gray-600 font-medium mt-1 flex-grow">{sub.description}</p>
                              
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
                                    KES {sub.suggestedPriceRange.min?.toLocaleString?.() ?? sub.suggestedPriceRange.min} - {sub.suggestedPriceRange.max?.toLocaleString?.() ?? sub.suggestedPriceRange.max}
                                  </span>
                                )}
                                {sub.expertiseLevel && (
                                  <span className="flex items-center gap-1">
                                    <Wrench className="w-3 h-3" /> 
                                    {sub.expertiseLevel.charAt(0).toUpperCase() + sub.expertiseLevel.slice(1)}
                                  </span>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleViewTechnicians(category.mainCategory, serviceCat.name, sub.name)}
                                disabled={!maxDistance || !userLocation}
                                className={`w-full mt-3 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                  maxDistance && userLocation
                                    ? 'bg-gray-800 text-white hover:bg-green-600'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {!maxDistance
                                  ? 'Select Distance First'
                                  : !userLocation
                                  ? 'Enable Location Access'
                                  : `View Technicians within ${maxDistance} km`}
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

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need a specific service not listed?</p>
          <button className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors">
            Contact Us for Custom Request
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.8s ease-out; }
      `}</style>
    </div>
  );
};

export default Services;