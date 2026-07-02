import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Filter, Wrench, Navigation, DollarSign, X, Globe, Crown, Zap, Briefcase, Award, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api';

// Plan configuration for consistent styling
const planConfig = {
  free: { label: 'Free', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: null },
  basic: { label: 'Basic', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', icon: null },
  premium: { label: 'Premium', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', icon: Crown },
  business: { label: 'Business', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200', icon: Briefcase },
  enterprise: { label: 'Enterprise', color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200', icon: Zap },
  unlimited: { label: 'Unlimited', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: Globe },
  trial: { label: 'Trial', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', icon: Clock }
};

// Categories from Job model
const MAIN_CATEGORIES = [
  'IT & Networking',
  'Electrical Services',
  'Mechanical Services',
  'Plumbing',
  'Programming & AI',
  'Hairdressing & Beauty',
  'Carpentry & Furniture',
  'Laundry & Dry Cleaning',
  'Cleaning Services',
  'Painting & Decorating',
  'Welding & Fabrication',
  'Automotive Repair',
  'Tutoring & Training',
  'Photography & Videography',
  'Event Planning',
  'Construction & Renovation',
  'HVAC Services',
  'Appliance Repair',
  'Moving & Logistics',
  'Gardening & Landscaping'
];

// Sample service categories (you can expand these)
const SERVICE_CATEGORIES = {
  'IT & Networking': ['Network Setup', 'IT Support', 'Cybersecurity', 'Cloud Services', 'Data Recovery'],
  'Electrical Services': ['Wiring', 'Repair', 'Installation', 'Lighting', 'Circuit Breakers'],
  'Plumbing': ['Pipe Repair', 'Installation', 'Drain Cleaning', 'Water Heater', 'Leak Detection'],
  'Programming & AI': ['Web Development', 'Mobile Apps', 'AI Solutions', 'Data Analysis', 'Machine Learning'],
  'Hairdressing & Beauty': ['Haircut', 'Styling', 'Coloring', 'Makeup', 'Nail Art'],
  'Carpentry & Furniture': ['Custom Furniture', 'Repair', 'Installation', 'Restoration', 'Cabinetry'],
  'Cleaning Services': ['Home Cleaning', 'Office Cleaning', 'Deep Cleaning', 'Carpet Cleaning', 'Window Cleaning'],
  'Painting & Decorating': ['Interior Painting', 'Exterior Painting', 'Wallpaper', 'Decorative Finishes'],
  'Automotive Repair': ['Engine Repair', 'Brake Service', 'Oil Change', 'Tire Service', 'Diagnostics'],
  'Construction & Renovation': ['Building', 'Renovation', 'Roofing', 'Flooring', 'Tiling'],
  'HVAC Services': ['AC Repair', 'Heating', 'Ventilation', 'Installation', 'Maintenance'],
  'Appliance Repair': ['Refrigerator', 'Washing Machine', 'Oven', 'Dishwasher', 'Microwave'],
  'Moving & Logistics': ['Local Moving', 'Long Distance', 'Packing', 'Storage', 'Delivery'],
  'Gardening & Landscaping': ['Garden Design', 'Lawn Care', 'Tree Service', 'Irrigation', 'Landscaping']
};

// Sample sub-services (you can expand these)
const SUB_SERVICES = {
  'Network Setup': ['Home Network', 'Office Network', 'WiFi Setup', 'Cabling', 'Router Configuration'],
  'IT Support': ['Hardware Support', 'Software Support', 'Troubleshooting', 'Maintenance', 'Help Desk'],
  'Cybersecurity': ['Security Audit', 'Firewall Setup', 'Antivirus', 'Data Protection', 'Penetration Testing'],
  // Add more sub-services as needed
};

const SearchPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(MAIN_CATEGORIES);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Search filters - MATCH JOB MODEL
  const [filters, setFilters] = useState({
    mainCategory: '',        // Changed from category to mainCategory
    serviceCategory: '',
    subService: '',
    radius: 50,
    minRating: '',
    maxHourlyRate: '',
    minHourlyRate: ''
  });
  
  const [serviceCategories, setServiceCategories] = useState([]);
  const [subServices, setSubServices] = useState([]);
  const [allTechniciansData, setAllTechniciansData] = useState([]);
  
  // Load available categories on mount
  useEffect(() => {
    fetchAvailableCategories();
  }, []);
  
  // Update service categories when main category changes
  useEffect(() => {
    if (filters.mainCategory) {
      // Get service categories from the mapping
      const services = SERVICE_CATEGORIES[filters.mainCategory] || [];
      setServiceCategories(services);
      setFilters(prev => ({ ...prev, serviceCategory: '', subService: '' }));
      setSubServices([]);
    }
  }, [filters.mainCategory]);
  
  // Update sub-services when service category changes
  useEffect(() => {
    if (filters.serviceCategory) {
      // Get sub-services from the mapping
      const subs = SUB_SERVICES[filters.serviceCategory] || [];
      setSubServices(subs);
      setFilters(prev => ({ ...prev, subService: '' }));
    }
  }, [filters.serviceCategory]);
  
  const fetchAvailableCategories = async () => {
    try {
      // Try to get categories from API
      const response = await api.get('/search/categories');
      if (response.data.success && response.data.categories.length > 0) {
        setAvailableCategories(response.data.categories);
        console.log('Categories loaded from API:', response.data.categories);
        return;
      }
    } catch (error) {
      console.log('Could not fetch categories from API, using defaults');
    }
    
    // Use default categories from Job model
    setAvailableCategories(MAIN_CATEGORIES);
    console.log('Using default categories from Job model');
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
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setGettingLocation(false);
        performSearch(location.lat, location.lng);
      },
      (error) => {
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please check your location settings.';
        }
        alert(errorMessage);
        setGettingLocation(false);
        performSearch();
      }
    );
  };
  
  const performSearch = async (lat, lng) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Use mainCategory instead of category
      if (filters.mainCategory) params.append('mainCategory', filters.mainCategory);
      if (filters.serviceCategory) params.append('serviceCategory', filters.serviceCategory);
      if (filters.subService) params.append('subService', filters.subService);
      if (filters.radius) params.append('radius', filters.radius);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.maxHourlyRate) params.append('maxHourlyRate', filters.maxHourlyRate);
      if (filters.minHourlyRate) params.append('minHourlyRate', filters.minHourlyRate);
      
      if (lat && lng) {
        params.append('lat', lat);
        params.append('lng', lng);
      } else if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }
      
      console.log('Searching with params:', params.toString());
      
      const response = await api.get(`/search/technicians?${params.toString()}`);
      if (response.data.success) {
        setTechnicians(response.data.data || []);
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Search failed: ${error.response.data.message || 'Please try again.'}`);
      } else {
        alert('Search failed. Please try again.');
      }
      setTechnicians([]);
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
  
  const handleViewProfile = (technicianId) => {
    navigate(`/technician/${technicianId}`);
  };
  
  const clearFilters = () => {
    setFilters({
      mainCategory: '',
      serviceCategory: '',
      subService: '',
      radius: 50,
      minRating: '',
      maxHourlyRate: '',
      minHourlyRate: ''
    });
    setServiceCategories([]);
    setSubServices([]);
    if (userLocation) {
      performSearch(userLocation.lat, userLocation.lng);
    } else {
      performSearch();
    }
  };
  
  // Get radius display text
  const getRadiusText = () => {
    const radius = parseInt(filters.radius);
    if (radius <= 10) return `${radius} km (Local)`;
    if (radius <= 50) return `${radius} km (Extended Local)`;
    if (radius <= 100) return `${radius} km (Regional)`;
    if (radius <= 300) return `${radius} km (Provincial)`;
    if (radius <= 600) return `${radius} km (National)`;
    return `${radius} km (Nationwide)`;
  };
  
  // Get radius color based on value
  const getRadiusColor = () => {
    const radius = parseInt(filters.radius);
    if (radius <= 10) return 'bg-gray-100 text-gray-700';
    if (radius <= 50) return 'bg-blue-100 text-blue-700';
    if (radius <= 100) return 'bg-green-100 text-green-700';
    if (radius <= 300) return 'bg-yellow-100 text-yellow-700';
    if (radius <= 600) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Find a Technician</h1>
        
        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Service Selection Row - MATCH JOB MODEL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.mainCategory}
                onChange={(e) => setFilters({ ...filters, mainCategory: e.target.value })}
                className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none bg-white"
              >
                <option value="">Select Main Category</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select
                value={filters.serviceCategory}
                onChange={(e) => setFilters({ ...filters, serviceCategory: e.target.value })}
                disabled={!filters.mainCategory}
                className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none disabled:bg-gray-100 bg-white"
              >
                <option value="">Select Service Category</option>
                {serviceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select
                value={filters.subService}
                onChange={(e) => setFilters({ ...filters, subService: e.target.value })}
                disabled={!filters.serviceCategory}
                className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none disabled:bg-gray-100 bg-white"
              >
                <option value="">Select Sub-Service</option>
                {subServices.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            
            {/* Location and Radius Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Radius <span className="text-gray-400">(up to 1000km)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={filters.radius}
                    onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                    min="1"
                    max="1000"
                    step="10"
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${getRadiusColor()}`}>
                    {getRadiusText()}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 km</span>
                  <span>10 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                  <span>300 km</span>
                  <span>600 km</span>
                  <span>1000 km</span>
                </div>
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
              
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Advanced Filters"
                >
                  <Filter className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
                    <select
                      value={filters.minRating}
                      onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none bg-white"
                    >
                      <option value="">Any Rating</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="4.0">4.0+ Stars</option>
                      <option value="3.5">3.5+ Stars</option>
                      <option value="3.0">3.0+ Stars</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Hourly Rate (KES)</label>
                    <input
                      type="number"
                      value={filters.minHourlyRate}
                      onChange={(e) => setFilters({ ...filters, minHourlyRate: e.target.value })}
                      placeholder="Min price"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Hourly Rate (KES)</label>
                    <input
                      type="number"
                      value={filters.maxHourlyRate}
                      onChange={(e) => setFilters({ ...filters, maxHourlyRate: e.target.value })}
                      placeholder="Max price"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-red-600 transition-colors text-sm flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
        
        {/* Location Indicator */}
        {userLocation && (
          <div className="mb-4 text-sm text-gray-500 flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>Showing technicians within <strong>{filters.radius} km</strong> of your location</span>
            {filters.radius > 100 && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Extended search
              </span>
            )}
          </div>
        )}
        
        {/* No Results */}
        {technicians.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No technicians found matching your criteria</p>
            <p className="text-sm text-gray-400 mt-2">
              Try adjusting your filters or increasing the search radius
            </p>
            {userLocation && filters.radius < 1000 && (
              <button
                onClick={() => {
                  setFilters({ ...filters, radius: Math.min(filters.radius + 100, 1000) });
                  setTimeout(() => performSearch(userLocation.lat, userLocation.lng), 100);
                }}
                className="mt-4 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Increase search radius to {Math.min(filters.radius + 100, 1000)} km →
              </button>
            )}
          </div>
        )}
        
        {/* Results List */}
        {technicians.length > 0 && (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Found <strong>{technicians.length}</strong> technician(s)
            </div>
            <div className="space-y-4">
              {technicians.map((tech) => {
                const plan = tech.subscriptionPlan || 'free';
                const planInfo = planConfig[plan] || planConfig.free;
                const PlanIcon = planInfo.icon;
                
                return (
                  <div key={tech._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        {tech.user?.profileImage ? (
                          <img src={tech.user.profileImage} alt={tech.user.firstName} className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-3xl text-gray-500">
                              {tech.user?.firstName?.[0]}{tech.user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Tech Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xl font-semibold text-gray-800">
                                {tech.user?.firstName} {tech.user?.lastName}
                              </h3>
                              {/* Plan Badge */}
                              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${planInfo.bg} ${planInfo.color}`}>
                                {PlanIcon && <PlanIcon className="w-3 h-3" />}
                                {planInfo.label}
                              </span>
                              {/* Verified Badge */}
                              {tech.verificationStatus === 'verified' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                              {/* Trial Badge */}
                              {tech.isTrial && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Trial Period
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mt-1">{tech.profileHeadline || tech.businessName || 'Professional Technician'}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{tech.rating?.average?.toFixed(1) || 'New'}</span>
                            <span className="text-gray-400 text-sm">({tech.rating?.count || 0} reviews)</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mt-2 line-clamp-2">{tech.aboutMe || 'Experienced professional ready to help with your service needs.'}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-4">
                          {tech.distance !== undefined && tech.distance !== null && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-500">{tech.distance} km away</span>
                            </div>
                          )}
                          
                          {/* Visibility Radius */}
                          {tech.visibilityRadius && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Globe className="w-4 h-4" />
                              <span>Visible up to {tech.visibilityRadius} km</span>
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
                          
                          {tech.yearsOfExperience > 0 && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Briefcase className="w-4 h-4" />
                              <span>{tech.yearsOfExperience}+ years exp</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Skills Tags */}
                        {tech.skills && tech.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {tech.skills.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {skill.name}
                              </span>
                            ))}
                            {tech.skills.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                +{tech.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Service Categories */}
                        {tech.serviceCategories && tech.serviceCategories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {tech.serviceCategories.slice(0, 2).map((service, idx) => (
                              <span key={idx} className="text-xs border border-gray-200 text-gray-500 px-2 py-1 rounded-full">
                                {service.categoryName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex-shrink-0 flex flex-col gap-2">
                        <button
                          onClick={() => handleViewProfile(tech._id)}
                          className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          View Profile
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                          Request Service
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;