/**
 * Technicians Page Component
 * ==========================
 * 
 * PURPOSE:
 * - Displays a list of technicians based on the selected service (main category, service category, sub-service)
 * - Captures user's location to find nearby technicians
 * - Calculates and displays distances between user and each technician
 * - Provides radius filter (0-50km) to narrow down search results
 * 
 * FLOW:
 * 1. User selects a service from the Services page
 * 2. User is redirected to this page with query parameters (mainCategory, serviceCategory, subService)
 * 3. Page requests location permission from user
 * 4. Once location is granted, searches for technicians within the specified radius
 * 5. Displays results sorted by distance
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navigation, Filter, Wrench, MapPin } from 'lucide-react';
import api from '../services/api';
import TechnicianCard from '../components/TechnicianCard';

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
  
  // Filter state - only radius (0-50km)
  const [radius, setRadius] = useState(50);  // Default 50km radius
  const [showFilters, setShowFilters] = useState(false);
  
  // Get query parameters from URL
  const queryParams = new URLSearchParams(location.search);
  const mainCategory = queryParams.get('mainCategory');
  const serviceCategory = queryParams.get('serviceCategory');
  const subService = queryParams.get('subService');

  /**
   * Get user's current location on component mount
   */
  useEffect(() => {
    getCurrentLocation();
  }, []);

  /**
   * Search technicians when location or radius changes
   */
  useEffect(() => {
    if (userLocation) {
      searchTechnicians();
    }
  }, [userLocation, radius]);

  /**
   * Get current location using browser's geolocation API
   */
  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
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
      },
      (error) => {
        console.error('Location error:', error);
        setError('Unable to get your location. Please enable location services.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in kilometers
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  /**
   * Search for technicians using the current location and radius
   */
  const searchTechnicians = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      
      // Add service filters from URL
      if (mainCategory) params.append('mainCategory', mainCategory);
      if (serviceCategory) params.append('serviceCategory', serviceCategory);
      if (subService) params.append('subService', subService);
      
      // Add location parameters
      if (userLocation) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }
      
      // Add radius filter (only distance filter)
      if (radius) params.append('radius', radius);
      
      const response = await api.get(`/search/technicians?${params.toString()}`);
      
      // Calculate distance for each technician
      const techniciansWithDistance = response.data.data.map(tech => {
        if (userLocation && tech.location?.coordinates) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            tech.location.coordinates[1],
            tech.location.coordinates[0]
          );
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
      setLoading(false);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to find technicians. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Handle view profile button click
   * @param {string} technicianId - MongoDB _id of the technician
   */
  const handleViewProfile = (technicianId) => {
    navigate(`/technician/${technicianId}`);
  };

  // Loading state
  if (loading) {
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
              Showing technicians within {radius} km of your location
            </p>
          )}
        </div>

        {/* ========== LOCATION PERMISSION SECTION ========== */}
        {!userLocation && !gettingLocation && (
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

        {/* ========== LOCATION LOADING STATE ========== */}
        {gettingLocation && (
          <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Getting your location...</p>
          </div>
        )}

        {/* ========== RADIUS FILTER SECTION ========== */}
        {userLocation && (
          <>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mb-3 flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Radius Filter' : 'Show Radius Filter'}
            </button>

            {showFilters && (
              <div className="mb-5 bg-white p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Radius: <span className="font-bold text-blue-600">{radius} km</span>
                  </label>
                  <input
                    type="range"
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value))}
                    min="1"
                    max="50"
                    step="1"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 km</span>
                    <span>10 km</span>
                    <span>20 km</span>
                    <span>30 km</span>
                    <span>40 km</span>
                    <span>50 km</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Only technicians within {radius} km will be shown
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========== ERROR MESSAGE ========== */}
        {error && (
          <div className="mb-5 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* ========== NO RESULTS STATE ========== */}
        {technicians.length === 0 && !loading && userLocation && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Technicians Found</h3>
            <p className="text-gray-500 text-sm">
              No technicians found within {radius} km radius for this service.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Try increasing the search radius to see more results.
            </p>
          </div>
        )}

        {/* ========== TECHNICIANS LIST ========== */}
        {technicians.length > 0 && (
          <div className="space-y-4">
            {/* Result count indicator */}
            <div className="text-sm text-gray-500 mb-2">
              Found {technicians.length} technician(s) within {radius} km
            </div>
            
            {technicians.map((tech) => (
              <TechnicianCard
                key={tech._id}
                technician={tech}
                distance={tech.distance}
                showDistance={true}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Technicians;