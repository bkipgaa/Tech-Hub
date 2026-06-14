/**
 * Technicians Page Component - FIXED RADIUS ISSUE
 * ==========================
 * 
 * IMPORTANT: The backend already filters technicians based on their subscription
 * visibility radius AND the client's search radius (taking the MINIMUM of both).
 * The frontend should NOT re-filter or double-apply radius rules.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navigation, Filter, Wrench, MapPin, Star, DollarSign, Clock, AlertCircle, Info } from 'lucide-react';
import api from '../services/api';

const Technicians = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for technicians data and search status
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for user location
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  
  // Filter state
  const [radius, setRadius] = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [maxHourlyRate, setMaxHourlyRate] = useState('');
  
  // Search metadata
  const [searchMetadata, setSearchMetadata] = useState({
    totalCount: 0,
    searchRadiusUsed: null,
    freeTechsVisible: 0,
    paidTechsVisible: 0
  });
  
  // Get query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const mainCategory = queryParams.get('mainCategory');
  const serviceCategory = queryParams.get('serviceCategory');
  const subService = queryParams.get('subService');

  /**
   * Get user's current location
   */
  const getCurrentLocation = useCallback(() => {
    setGettingLocation(true);
    setLocationPermissionDenied(false);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      setLocationPermissionDenied(true);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermissionDenied(true);
          setError('Location access denied. Please enable location services to find nearby technicians.');
        } else {
          setError('Unable to get your location. Please check your device settings.');
        }
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  /**
   * Search for technicians using backend API
   * Backend automatically applies subscription visibility rules
   * IMPORTANT: Backend uses MIN(technician.visibilityRadius, client.searchRadius)
   * So a Premium tech (50km radius) will only be visible if client searches within 50km
   */
  const searchTechnicians = useCallback(async () => {
    if (!userLocation) return;
    
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      
      // Add service filters from URL
      if (mainCategory) params.append('mainCategory', mainCategory);
      if (serviceCategory) params.append('serviceCategory', serviceCategory);
      if (subService) params.append('subService', subService);
      
      // Add location parameters
      params.append('lat', userLocation.lat);
      params.append('lng', userLocation.lng);
      
      // Add radius filter (client's search radius)
      // BACKEND will take MIN(radius, technician.visibilityRadius)
      if (radius) params.append('radius', radius);
      
      // Add optional filters
      if (minRating) params.append('minRating', minRating);
      if (maxHourlyRate) params.append('maxHourlyRate', maxHourlyRate);
      
      const response = await api.get(`/search/technicians?${params.toString()}`);
      
      // Calculate actual distance for display (NOT for filtering)
      const techniciansWithDistance = response.data.data.map(tech => {
        if (userLocation && tech.location?.coordinates) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            tech.location.coordinates[1],
            tech.location.coordinates[0]
          );
          // Round to 1 decimal place for display
          return { ...tech, distance: parseFloat(distance).toFixed(1) };
        }
        return tech;
      });
      
      // Sort by distance (closest first)
      techniciansWithDistance.sort((a, b) => {
        const distA = a.distance ? parseFloat(a.distance) : Infinity;
        const distB = b.distance ? parseFloat(b.distance) : Infinity;
        return distA - distB;
      });
      
      setTechnicians(techniciansWithDistance);
      
      // Count by subscription type for metadata display
      const freeCount = techniciansWithDistance.filter(t => t.subscriptionPlan === 'free').length;
      const paidCount = techniciansWithDistance.filter(t => t.subscriptionPlan !== 'free').length;
      
      setSearchMetadata({
        totalCount: response.data.count,
        searchRadiusUsed: response.data.searchRadius,
        freeTechsVisible: freeCount,
        paidTechsVisible: paidCount
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err.response?.data?.message || 'Failed to find technicians. Please try again.');
      setLoading(false);
    }
  }, [userLocation, mainCategory, serviceCategory, subService, radius, minRating, maxHourlyRate]);

  /**
   * Calculate distance between two coordinates using Haversine formula
   * This returns the ACTUAL distance in kilometers
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Return exact distance without any modification
    return distance;
  };

  /**
   * Format distance for display
   */
  const formatDistance = (distance) => {
    if (!distance) return 'Distance unknown';
    const dist = parseFloat(distance);
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m away`;
    }
    return `${dist.toFixed(1)}km away`;
  };

  /**
   * Get subscription plan badge color
   */
  const getPlanBadgeColor = (plan, isTrial) => {
    if (isTrial) return 'bg-purple-100 text-purple-700 border-purple-200';
    switch(plan) {
      case 'free': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'basic': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'basicPlus': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'premium': return 'bg-green-100 text-green-700 border-green-200';
      case 'business': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'enterprise': return 'bg-red-100 text-red-700 border-red-200';
      case 'unlimited': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  /**
   * Get visibility description - Shows the ACTUAL visibility radius
   */
  const getVisibilityDescription = (plan, visibilityRadius, isTrial) => {
    if (isTrial) return `🔬 Trial: Visible within ${visibilityRadius}km radius`;
    if (plan === 'free') return `📍 Free Plan: Visible within ${visibilityRadius}km radius`;
    const planNames = {
      basic: 'Basic',
      basicPlus: 'Basic-Plus',
      premium: 'Premium',
      business: 'Business',
      enterprise: 'Enterprise',
      unlimited: 'Unlimited'
    };
    const planName = planNames[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
    return `🌟 ${planName}: Visible within ${visibilityRadius}km radius`;
  };

  /**
   * Handle view profile button click
   */
  const handleViewProfile = (technicianId) => {
    navigate(`/technician/${technicianId}`);
  };

  /**
   * Handle request booking
   */
  const handleRequestBooking = (technician) => {
    navigate(`/booking/new`, {
      state: {
        technicianId: technician._id,
        technicianName: `${technician.userId?.firstName || ''} ${technician.userId?.lastName || ''}`,
        service: subService,
        category: mainCategory,
        hourlyRate: technician.pricing?.hourlyRate
      }
    });
  };

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setRadius(50);
    setMinRating('');
    setMaxHourlyRate('');
  };

  /**
   * Apply filters and search
   */
  const applyFilters = () => {
    searchTechnicians();
    setShowFilters(false);
  };

  /**
   * Get radius display text - Shows what radius the CLIENT is searching within
   */
  const getRadiusText = () => {
    const r = parseInt(radius);
    if (r <= 10) return `${r} km (Local search)`;
    if (r <= 30) return `${r} km (Regional search)`;
    if (r <= 50) return `${r} km (Wide area search)`;
    if (r <= 200) return `${r} km (Metropolitan search)`;
    if (r <= 500) return `${r} km (Provincial search)`;
    return `${r} km (National search)`;
  };

  // Get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Search when location is available
  useEffect(() => {
    if (userLocation) {
      searchTechnicians();
    }
  }, [userLocation, searchTechnicians]);

  // Loading state
  if (loading && !technicians.length) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding technicians near you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* ========== PAGE HEADER ========== */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {subService || serviceCategory || mainCategory || 'Technicians'} Near You
          </h1>
          {userLocation && (
            <p className="text-gray-500 text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Showing technicians within your search radius of {radius}km (subject to their plan limits)
            </p>
          )}
        </div>

        {/* ========== LOCATION PERMISSION SECTION ========== */}
        {!userLocation && !gettingLocation && !locationPermissionDenied && (
          <div className="mb-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 text-sm">
                  Enable location to find technicians near you
                </span>
              </div>
              <button
                onClick={getCurrentLocation}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Navigation className="w-4 h-4" />
                Enable Location
              </button>
            </div>
          </div>
        )}

        {/* ========== LOCATION DENIED MESSAGE ========== */}
        {locationPermissionDenied && !userLocation && (
          <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">Location access denied</span>
            </div>
            <p className="text-yellow-700 text-sm mb-3">
              Please enable location access in your browser settings to find technicians near you.
            </p>
            <button
              onClick={getCurrentLocation}
              className="bg-yellow-600 text-white px-4 py-1.5 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ========== LOCATION LOADING STATE ========== */}
        {gettingLocation && (
          <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Getting your location...</p>
          </div>
        )}

        {/* ========== VISIBILITY INFO BANNER ========== */}
        {userLocation && (
          <div className="mb-5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">How technician visibility works:</p>
                <ul className="space-y-0.5">
                  <li>• <span className="font-medium">Free plan</span> technicians: Visible within <span className="font-bold">10km</span></li>
                  <li>• <span className="font-medium">Basic plan</span> technicians: Visible within <span className="font-bold">10km</span></li>
                  <li>• <span className="font-medium">Basic-Plus plan</span> technicians: Visible within <span className="font-bold">50km</span></li>
                  <li>• <span className="font-medium">Premium plan</span> technicians: Visible within <span className="font-bold">100km</span></li>
                  <li>• <span className="font-medium">Business plan</span> technicians: Visible within <span className="font-bold">300km</span></li>
                  <li>• <span className="font-medium">Enterprise plan</span> technicians: Visible within <span className="font-bold">600km</span></li>
                  <li>• <span className="font-medium">Unlimited plan</span> technicians: Visible within <span className="font-bold">1000km</span></li>
                  <li>• <span className="font-medium">Trial</span> technicians: Visible within <span className="font-bold">10km</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ========== FILTERS SECTION ========== */}
        {userLocation && (
          <>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mb-3 flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {(minRating || maxHourlyRate || radius !== 50) && (
                <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {(minRating ? 1 : 0) + (maxHourlyRate ? 1 : 0) + (radius !== 50 ? 1 : 0)}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="mb-5 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-4">
                  {/* Radius Filter - Client's search radius */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Your Search Radius
                      </label>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {getRadiusText()}
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      value={radius}
                      onChange={(e) => setRadius(parseInt(e.target.value))}
                      min="1"
                      max="1000"
                      step="10"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>1km</span>
                      <span className="font-medium">10km<br/>(Free/Basic)</span>
                      <span>50km<br/>(Basic-Plus)</span>
                      <span className="font-medium">100km<br/>(Premium)</span>
                      <span>300km<br/>(Business)</span>
                      <span>600km<br/>(Enterprise)</span>
                      <span>1000km<br/>(Unlimited)</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Note: Technicians will only appear if they're within BOTH your search radius AND their plan's visibility radius
                    </p>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Rating
                    </label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Any rating</option>
                      <option value="4.5">4.5+ stars</option>
                      <option value="4.0">4.0+ stars</option>
                      <option value="3.5">3.5+ stars</option>
                      <option value="3.0">3.0+ stars</option>
                    </select>
                  </div>

                  {/* Hourly Rate Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Hourly Rate (KES)
                    </label>
                    <input
                      type="number"
                      value={maxHourlyRate}
                      onChange={(e) => setMaxHourlyRate(e.target.value)}
                      placeholder="e.g., 2000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {/* Filter Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========== ERROR MESSAGE ========== */}
        {error && (
          <div className="mb-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
            <button
              onClick={searchTechnicians}
              className="ml-3 underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ========== NO RESULTS STATE ========== */}
        {technicians.length === 0 && !loading && userLocation && !error && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Technicians Found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              No technicians found for {subService || 'this service'} within your search radius of {radius}km.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Note: Technicians are only visible if they're within BOTH your search radius AND their plan's visibility radius.
            </p>
            {radius < 1000 && (
              <button
                onClick={() => {
                  setRadius(Math.min(radius + 50, 1000));
                  setTimeout(() => searchTechnicians(), 100);
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Increase search radius to {Math.min(radius + 50, 1000)} km →
              </button>
            )}
          </div>
        )}

        {/* ========== TECHNICIANS LIST ========== */}
        {technicians.length > 0 && (
          <>
            {/* Result metadata */}
            <div className="mb-4 bg-white px-4 py-3 rounded-lg border border-gray-200">
              <div className="flex flex-wrap justify-between items-center text-sm">
                <div className="text-gray-600">
                  Found <span className="font-bold text-gray-800">{technicians.length}</span> technician(s)
                  {searchMetadata.searchRadiusUsed && ` within ${searchMetadata.searchRadiusUsed}km`}
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-gray-500">
                    📍 Free/Basic: {searchMetadata.freeTechsVisible}
                  </span>
                  <span className="text-gray-500">
                    🌟 Premium+: {searchMetadata.paidTechsVisible}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Technicians Grid */}
            <div className="space-y-4">
              {technicians.map((tech) => (
                <div
                  key={tech._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-5">
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {tech.userId?.profileImage ? (
                          <img src={tech.userId.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl md:text-2xl font-bold text-gray-500">
                            {tech.userId?.firstName?.[0]}{tech.userId?.lastName?.[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Technician Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {tech.userId?.firstName} {tech.userId?.lastName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {/* Rating */}
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium ml-1">
                                {tech.rating?.average?.toFixed(1) || 'New'}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">
                                ({tech.rating?.count || 0} reviews)
                              </span>
                            </div>
                            
                            {/* Subscription Plan Badge */}
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getPlanBadgeColor(tech.subscriptionPlan, tech.isTrial)}`}>
                              {tech.isTrial ? '🔬 Trial' : (tech.subscriptionPlan === 'basicPlus' ? 'Basic-Plus' : (tech.subscriptionPlan?.charAt(0).toUpperCase() + tech.subscriptionPlan?.slice(1)))}
                            </span>
                          </div>
                        </div>
                        
                        {/* Pricing */}
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            KES {tech.pricing?.hourlyRate?.toLocaleString()}
                            <span className="text-sm font-normal text-gray-500">/hr</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1 flex items-center gap-1 justify-end">
                            <MapPin className="w-3 h-3" />
                            {formatDistance(tech.distance)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Bio */}
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {tech.bio || 'Professional technician ready to help with your service needs.'}
                      </p>
                      
                      {/* Visibility Info - Shows ACTUAL radius */}
                      <div className="mt-2 text-xs text-gray-400">
                        {getVisibilityDescription(tech.subscriptionPlan, tech.visibilityRadius, tech.isTrial)}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleViewProfile(tech._id)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleRequestBooking(tech)}
                          className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                        >
                          Request Booking
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
      </div>
    </div>
  );
};

export default Technicians;