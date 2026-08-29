/**
 * SearchPage.js
 * =============
 * A comprehensive search page for finding technicians.
 * Allows searching by three‑level service hierarchy:
 * mainCategory → serviceCategory → subService.
 * 
 * Features:
 * - Dropdown cascading from backend catalog data
 * - Location detection and radius control
 * - Advanced filters (rating, hourly rate)
 * - Results display with plan badges, visibility radius, and booking actions
 * 
 * @version 2.2.0 – Fixed sub-service object rendering (React error #31)
 * @author Weba-Hub Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  Filter,
  Wrench,
  Navigation,
  DollarSign,
  X,
  Globe,
  Crown,
  Zap,
  Briefcase,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

// ============================================================
// PLAN CONFIGURATION (matching backend subscription plans)
// ============================================================
const planConfig = {
  free: { label: 'Free', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: null },
  test: { label: 'Test', color: 'text-pink-600', bg: 'bg-pink-100', border: 'border-pink-200', icon: null },
  basic: { label: 'Basic', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', icon: null },
  premium: { label: 'Premium', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200', icon: Crown },
  business: { label: 'Business', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200', icon: Briefcase },
  enterprise: { label: 'Enterprise', color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200', icon: Zap },
  unlimited: { label: 'Unlimited', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: Globe },
  trial: { label: 'Trial', color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', icon: Clock },
};

const SearchPage = () => {
  const navigate = useNavigate();

  // --- Search & results state ---
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [searchError, setSearchError] = useState('');

  // --- Location state ---
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // --- Catalog state ---
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [catalogData, setCatalogData] = useState({
    mainCategories: [],
    serviceCategoriesMap: {},
    subServicesMap: {},
  });
  const [usingDefaultCatalog, setUsingDefaultCatalog] = useState(false);

  // --- Filter state ---
  const [filters, setFilters] = useState({
    mainCategory: '',
    serviceCategory: '',
    subService: '',
    radius: 50,
    minRating: '',
    maxHourlyRate: '',
    minHourlyRate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // --- Dynamic dropdown options (derived from catalog) ---
  const [serviceCategories, setServiceCategories] = useState([]);
  const [subServices, setSubServices] = useState([]);

  // ============================================================
  // CATALOG LOADING
  // ============================================================

  /**
   * Load the service catalog from the backend.
   * Uses `/search/categories/full` which returns a complete
   * hierarchy: mainCategory → serviceCategories → subServices.
   * 
   * On failure, falls back to a static default catalog.
   * Caches result in sessionStorage for instant loads on revisit.
   */
  const fetchCatalogData = async () => {
    setCatalogLoading(true);
    setCatalogError('');
    setUsingDefaultCatalog(false);

    // Check cache first
    const cached = sessionStorage.getItem('catalogData');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCatalogData(parsed);
        setCatalogLoading(false);
        return;
      } catch {
        sessionStorage.removeItem('catalogData');
      }
    }

    try {
      const response = await api.get('/search/categories/full');

      if (response.data.success) {
        const categories = response.data.categories || [];
        const mainCategories = [];
        const serviceCategoriesMap = {};
        const subServicesMap = {};

        categories.forEach((cat) => {
          // Main category name
          mainCategories.push(cat.mainCategory);
          // Service categories: array of names
          serviceCategoriesMap[cat.mainCategory] = (cat.serviceCategories || []).map((s) => s.name);

          // Sub-services: store only the names (not the full objects)
          (cat.serviceCategories || []).forEach((sc) => {
            // Ensure subServices is an array of strings (or extract .name)
            const subNames = (sc.subServices || []).map((sub) =>
              typeof sub === 'string' ? sub : sub.name || sub.subService || ''
            );
            subServicesMap[sc.name] = subNames;
          });
        });

        const payload = { mainCategories, serviceCategoriesMap, subServicesMap };
        setCatalogData(payload);
        sessionStorage.setItem('catalogData', JSON.stringify(payload));
      } else {
        throw new Error(response.data.message || 'Catalog data unavailable');
      }
    } catch (error) {
      console.error('Failed to load catalog:', error);
      setCatalogError(error.message || 'Could not load service catalog.');
      useDefaultCatalog();
      setUsingDefaultCatalog(true);
    } finally {
      setCatalogLoading(false);
    }
  };

  /**
   * Provides a static fallback catalog when the backend is unreachable.
   * This ensures the search page remains functional even without API.
   */
  const useDefaultCatalog = () => {
    const defaultMainCategories = [
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
      'Gardening & Landscaping',
    ];

    const defaultServiceCategories = {
      'IT & Networking': ['Internet Services', 'CCTV & Security Systems', 'Computer Repair & Maintenance'],
      'Electrical Services': ['Residential Electrical', 'Commercial Electrical'],
      'Mechanical Services': ['HVAC Services', 'General Mechanical'],
      Plumbing: ['General Plumbing', 'Drainage & Sewer'],
      'Cleaning Services': ['Residential Cleaning', 'Commercial Cleaning'],
    };

    const defaultSubServices = {
      'Internet Services': ['WiFi Setup & Configuration', 'Network Troubleshooting', 'Fiber Optic Installation'],
      'Residential Electrical': ['House Wiring & Rewiring', 'Lighting Installation', 'Ceiling Fan Installation'],
      'General Plumbing': ['Leak Detection & Repair', 'Faucet Installation & Repair', 'Toilet Repair & Installation'],
      'CCTV & Security Systems': ['CCTV Camera Installation', 'Security System Maintenance'],
      'Computer Repair & Maintenance': ['Hardware Repair', 'Virus & Malware Removal', 'Data Recovery'],
    };

    setCatalogData({
      mainCategories: defaultMainCategories,
      serviceCategoriesMap: defaultServiceCategories,
      subServicesMap: defaultSubServices,
    });
  };

  // Load catalog on mount (with cache check inside fetch function)
  useEffect(() => {
    fetchCatalogData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // DYNAMIC DROPDOWN UPDATES
  // ============================================================

  // When main category changes, update service categories
  useEffect(() => {
    if (filters.mainCategory) {
      const services = catalogData.serviceCategoriesMap[filters.mainCategory] || [];
      setServiceCategories(services);
      setFilters((prev) => ({ ...prev, serviceCategory: '', subService: '' }));
      setSubServices([]);
    } else {
      setServiceCategories([]);
      setSubServices([]);
    }
  }, [filters.mainCategory, catalogData.serviceCategoriesMap]);

  // When service category changes, update sub-services
  useEffect(() => {
    if (filters.serviceCategory) {
      // Ensure subServices is always an array of strings
      const subs = catalogData.subServicesMap[filters.serviceCategory] || [];
      // If subs contains objects, extract the name property
      const subNames = subs.map((sub) =>
        typeof sub === 'string' ? sub : sub.name || sub.subService || ''
      );
      setSubServices(subNames);
      setFilters((prev) => ({ ...prev, subService: '' }));
    } else {
      setSubServices([]);
    }
  }, [filters.serviceCategory, catalogData.subServicesMap]);

  // ============================================================
  // LOCATION FUNCTIONS
  // ============================================================

  /**
   * Request the user's geolocation and trigger a search if successful.
   * Shows an in‑UI error message on failure (instead of alert).
   */
  const getCurrentLocation = () => {
    setGettingLocation(true);
    setSearchError('');

    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setGettingLocation(false);
        performSearch(location.lat, location.lng);
      },
      (error) => {
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
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
        setSearchError(errorMessage);
        setGettingLocation(false);
        performSearch();
      }
    );
  };

  // ============================================================
  // SEARCH FUNCTION
  // ============================================================

  /**
   * Perform the actual technician search.
   * Builds query parameters from filters and location, then calls
   * the backend `/search/technicians` endpoint.
   * On success, updates the technicians list; on failure, sets searchError.
   */
  const performSearch = async (lat, lng) => {
    setLoading(true);
    setSearchError('');

    try {
      const params = new URLSearchParams();

      if (filters.mainCategory) params.append('mainCategory', filters.mainCategory);
      if (filters.serviceCategory) params.append('serviceCategory', filters.serviceCategory);
      if (filters.subService) params.append('subService', filters.subService);

      if (lat && lng) {
        params.append('lat', lat);
        params.append('lng', lng);
      } else if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }
      if (filters.radius) params.append('radius', filters.radius);

      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.maxHourlyRate) params.append('maxHourlyRate', filters.maxHourlyRate);
      if (filters.minHourlyRate) params.append('minHourlyRate', filters.minHourlyRate);

      const response = await api.get(`/search/technicians?${params.toString()}`);

      if (response.data.success) {
        setTechnicians(response.data.data || []);
        if (response.data.data?.length === 0) {
          setSearchError('No technicians match your criteria. Try broadening your search.');
        }
      } else {
        setTechnicians([]);
        setSearchError(response.data.message || 'Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      let errorMsg = 'Search failed. ';
      if (error.response) {
        errorMsg += `Server error (${error.response.status}). `;
        if (error.response.data?.message) errorMsg += error.response.data.message;
      } else if (error.request) {
        errorMsg += 'No response from server. Check your connection.';
      } else {
        errorMsg += error.message || 'An unexpected error occurred.';
      }
      setSearchError(errorMsg);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

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
      minHourlyRate: '',
    });
    setServiceCategories([]);
    setSubServices([]);
    if (userLocation) {
      performSearch(userLocation.lat, userLocation.lng);
    } else {
      performSearch();
    }
  };

  const dismissSearchError = () => setSearchError('');

  const retryCatalogLoad = () => {
    sessionStorage.removeItem('catalogData');
    fetchCatalogData();
  };

  // ============================================================
  // UI HELPERS
  // ============================================================

  const getRadiusText = () => {
    const radius = parseInt(filters.radius);
    if (radius <= 10) return `${radius} km (Local)`;
    if (radius <= 50) return `${radius} km (Extended Local)`;
    if (radius <= 100) return `${radius} km (Regional)`;
    if (radius <= 300) return `${radius} km (Provincial)`;
    if (radius <= 600) return `${radius} km (National)`;
    return `${radius} km (Nationwide)`;
  };

  const getRadiusColor = () => {
    const radius = parseInt(filters.radius);
    if (radius <= 10) return 'bg-gray-100 text-gray-700';
    if (radius <= 50) return 'bg-blue-100 text-blue-700';
    if (radius <= 100) return 'bg-green-100 text-green-700';
    if (radius <= 300) return 'bg-yellow-100 text-yellow-700';
    if (radius <= 600) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (catalogLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service catalog...</p>
        </div>
      </div>
    );
  }

  if (catalogError && !usingDefaultCatalog) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="font-medium">{catalogError}</p>
            <button
              onClick={retryCatalogLoad}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Find a Technician</h1>

        {/* ===== CATALOG FALLBACK WARNING ===== */}
        {usingDefaultCatalog && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Using default service catalog</p>
              <p className="text-xs text-yellow-700">
                Could not load the latest catalog from the server. Some services may be missing.
              </p>
            </div>
            <button
              onClick={retryCatalogLoad}
              className="text-xs text-yellow-800 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ===== SEARCH FORM ===== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Three‑level service dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Level 1: Main Category */}
              <select
                value={filters.mainCategory}
                onChange={(e) => setFilters({ ...filters, mainCategory: e.target.value })}
                className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none bg-white"
              >
                <option value="">Select Main Category</option>
                {catalogData.mainCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Level 2: Service Category */}
              <select
                value={filters.serviceCategory}
                onChange={(e) => setFilters({ ...filters, serviceCategory: e.target.value })}
                disabled={!filters.mainCategory || serviceCategories.length === 0}
                className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none disabled:bg-gray-100 bg-white"
              >
                <option value="">Select Service Category</option>
                {serviceCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Level 3: Sub‑Service */}
              <select
                value={filters.subService}
                onChange={(e) => setFilters({ ...filters, subService: e.target.value })}
                disabled={!filters.serviceCategory || subServices.length === 0}
                className="p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none disabled:bg-gray-100 bg-white"
              >
                <option value="">Select Sub‑Service</option>
                {subServices.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Location & Radius Row */}
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
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
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

            {/* Advanced Filters (collapsible) */}
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

        {/* ===== SEARCH ERROR BANNER ===== */}
        {searchError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="flex-1 text-sm">{searchError}</span>
            <button onClick={dismissSearchError} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ===== LOCATION INDICATOR ===== */}
        {userLocation && (
          <div className="mb-4 text-sm text-gray-500 flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <MapPin className="w-4 h-4 text-green-600" />
            <span>
              Showing technicians within <strong>{filters.radius} km</strong> of your location
            </span>
            {filters.radius > 100 && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Extended search
              </span>
            )}
          </div>
        )}

        {/* ===== NO RESULTS ===== */}
        {technicians.length === 0 && !loading && !searchError && (
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

        {/* ===== RESULTS LIST ===== */}
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
                  <div
                    key={tech._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        {tech.user?.profileImage ? (
                          <img
                            src={tech.user.profileImage}
                            alt={tech.user.firstName}
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-3xl text-gray-500">
                              {tech.user?.firstName?.[0]}
                              {tech.user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Technician Details */}
                      <div className="flex-1">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xl font-semibold text-gray-800">
                                {tech.user?.firstName} {tech.user?.lastName}
                              </h3>
                              {tech.mainCategory && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  {tech.mainCategory}
                                </span>
                              )}
                              {/* Plan Badge */}
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${planInfo.bg} ${planInfo.color}`}
                              >
                                {PlanIcon && <PlanIcon className="w-3 h-3" />}
                                {planInfo.label}
                              </span>
                              {tech.verificationStatus === 'verified' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                              {tech.isTrial && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Trial Period
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mt-1">
                              {tech.profileHeadline || tech.businessName || 'Professional Technician'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{tech.rating?.average?.toFixed(1) || 'New'}</span>
                            <span className="text-gray-400 text-sm">({tech.rating?.count || 0} reviews)</span>
                          </div>
                        </div>

                        <p className="text-gray-600 mt-2 line-clamp-2">
                          {tech.aboutMe || 'Experienced professional ready to help with your service needs.'}
                        </p>

                        <div className="flex flex-wrap gap-4 mt-4">
                          {tech.distance !== undefined && tech.distance !== null && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-500">{tech.distance} km away</span>
                            </div>
                          )}
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
                          {tech.yearsOfExperience > 0 && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Briefcase className="w-4 h-4" />
                              <span>{tech.yearsOfExperience}+ years exp</span>
                            </div>
                          )}
                        </div>

                        {/* Skills */}
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

                        {/* Service Categories & Sub‑Services */}
                        {tech.serviceCategories && tech.serviceCategories.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {tech.serviceCategories.slice(0, 2).map((service, idx) => (
                                <div key={idx} className="flex flex-wrap items-center gap-1">
                                  <span className="text-xs border border-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                    {service.categoryName}
                                  </span>
                                  {service.subServices && service.subServices.length > 0 && (
                                    <span className="text-xs text-gray-400">
                                      ({service.subServices.slice(0, 2).join(', ')}
                                      {service.subServices.length > 2 && ` +${service.subServices.length - 2} more`})
                                    </span>
                                  )}
                                </div>
                              ))}
                              {tech.serviceCategories.length > 2 && (
                                <span className="text-xs text-gray-400">
                                  +{tech.serviceCategories.length - 2} more categories
                                </span>
                              )}
                            </div>
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