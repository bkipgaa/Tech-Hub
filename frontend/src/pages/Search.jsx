import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, Wrench, Navigation, DollarSign } from 'lucide-react';
import api from '../services/api';

const SearchPage = () => {
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Search filters
  const [filters, setFilters] = useState({
    mainCategory: '',
    serviceCategory: '',
    subService: '',
    radius: 50,
    minRating: '',
    maxHourlyRate: ''
  });
  
  // Available options for dropdowns
  const [serviceCategories, setServiceCategories] = useState([]);
  const [subServices, setSubServices] = useState([]);
  
  // Load available services on mount
  useEffect(() => {
    fetchAvailableServices();
  }, []);
  
  // Update service categories when main category changes
  useEffect(() => {
    if (filters.mainCategory) {
      const category = availableServices.find(c => c.mainCategory === filters.mainCategory);
      setServiceCategories(category?.serviceCategories || []);
      setFilters(prev => ({ ...prev, serviceCategory: '', subService: '' }));
      setSubServices([]);
    }
  }, [filters.mainCategory, availableServices]);
  
  // Update sub-services when service category changes
  useEffect(() => {
    if (filters.serviceCategory) {
      const category = serviceCategories.find(c => c.categoryName === filters.serviceCategory);
      setSubServices(category?.subServices || []);
      setFilters(prev => ({ ...prev, subService: '' }));
    }
  }, [filters.serviceCategory, serviceCategories]);
  
  const fetchAvailableServices = async () => {
    try {
      const response = await api.get('/search/available-services');
      setAvailableServices(response.data.data);
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };
  
  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingLocation(false);
        // Auto-search after getting location
        performSearch(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        alert('Unable to get your location. Please enable location services.');
        setGettingLocation(false);
        // Search without location
        performSearch();
      }
    );
  };
  
  const performSearch = async (lat, lng) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.mainCategory) params.append('mainCategory', filters.mainCategory);
      if (filters.serviceCategory) params.append('serviceCategory', filters.serviceCategory);
      if (filters.subService) params.append('subService', filters.subService);
      if (filters.radius) params.append('radius', filters.radius);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.maxHourlyRate) params.append('maxHourlyRate', filters.maxHourlyRate);
      if (lat && lng) {
        params.append('lat', lat);
        params.append('lng', lng);
      } else if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }
      
      const response = await api.get(`/search/technicians?${params.toString()}`);
      setTechnicians(response.data.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (userLocation) {
      performSearch(userLocation.lat, userLocation.lng);
    } else {
      performSearch();
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Find a Technician</h1>
      
      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.mainCategory}
              onChange={(e) => setFilters({ ...filters, mainCategory: e.target.value })}
              className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
            >
              <option value="">Select Main Category</option>
              {availableServices.map(cat => (
                <option key={cat.mainCategory} value={cat.mainCategory}>{cat.mainCategory}</option>
              ))}
            </select>
            
            <select
              value={filters.serviceCategory}
              onChange={(e) => setFilters({ ...filters, serviceCategory: e.target.value })}
              disabled={!filters.mainCategory}
              className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none disabled:bg-gray-100"
            >
              <option value="">Select Service Category</option>
              {serviceCategories.map(cat => (
                <option key={cat.categoryName} value={cat.categoryName}>{cat.categoryName}</option>
              ))}
            </select>
            
            <select
              value={filters.subService}
              onChange={(e) => setFilters({ ...filters, subService: e.target.value })}
              disabled={!filters.serviceCategory}
              className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none disabled:bg-gray-100"
            >
              <option value="">Select Sub-Service</option>
              {subServices.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Radius (km)</label>
              <input
                type="number"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
                min="1"
                max="100"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Min Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3.0">3.0+ Stars</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Max Hourly Rate (KES)</label>
              <input
                type="number"
                value={filters.maxHourlyRate}
                onChange={(e) => setFilters({ ...filters, maxHourlyRate: e.target.value })}
                placeholder="Any"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full bg-gray-800 text-white p-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                {gettingLocation ? 'Getting Location...' : 'Use My Location'}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Searching...' : 'Search Technicians'}
          </button>
        </form>
      </div>
      
      {/* Results */}
      {userLocation && (
        <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Showing technicians within {filters.radius} km of your location
        </div>
      )}
      
      {technicians.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No technicians found matching your criteria</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or increasing the search radius</p>
        </div>
      )}
      
      <div className="space-y-4">
        {technicians.map((tech) => (
          <div key={tech._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                {tech.userId?.profileImage ? (
                  <img src={tech.userId.profileImage} alt={tech.userId.firstName} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-3xl text-gray-500">
                      {tech.userId?.firstName?.[0]}{tech.userId?.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Tech Info */}
              <div className="flex-1">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {tech.userId?.firstName} {tech.userId?.lastName}
                    </h3>
                    <p className="text-gray-600">{tech.profileHeadline}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{tech.rating?.average?.toFixed(1) || 'New'}</span>
                    <span className="text-gray-400 text-sm">({tech.rating?.count || 0})</span>
                  </div>
                </div>
                
                <p className="text-gray-600 mt-2 line-clamp-2">{tech.aboutMe}</p>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  {tech.distance !== undefined && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{tech.distance} km away</span>
                      {tech.distance <= tech.serviceRadius ? (
                        <span className="ml-1 text-green-600 text-xs">(within service radius)</span>
                      ) : (
                        <span className="ml-1 text-orange-500 text-xs">(outside service radius)</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <DollarSign className="w-4 h-4" />
                    <span>KES {tech.pricing?.hourlyRate || 0}/hour</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Wrench className="w-4 h-4" />
                    <span>{tech.category}</span>
                  </div>
                </div>
                
                {/* Skills Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {tech.skills?.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex-shrink-0">
                <button className="w-full md:w-auto bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors">
                  View Profile
                </button>
                <button className="w-full md:w-auto mt-2 border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  Request Service
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchPage;