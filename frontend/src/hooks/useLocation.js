/**
 * useLocation Hook
 * ================
 * Custom React hook for managing user location
 * Provides location state and methods to get/update location
 */

import { useState, useEffect, useCallback } from 'react';
import locationService from '../services/locationService';

const useLocation = (autoFetch = false) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null);

  /**
   * Fetch user's current location
   */
  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userLocation = await locationService.getCurrentLocation();
      setLocation(userLocation);
      setPermission('granted');
      return userLocation;
    } catch (err) {
      setError(err.message);
      setPermission('denied');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate distance to a technician
   * @param {Object} technicianLocation - Technician's coordinates {lat, lng}
   * @returns {number|null} Distance in km or null if no location
   */
  const getDistanceTo = useCallback((technicianLocation) => {
    if (!location || !technicianLocation) return null;
    return locationService.calculateDistance(
      location.lat,
      location.lng,
      technicianLocation.lat,
      technicianLocation.lng
    );
  }, [location]);

  /**
   * Auto-fetch location on mount if enabled
   */
  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
    
    // Check if location is cached
    const cached = locationService.getCachedLocation();
    if (cached) {
      setLocation(cached);
      setPermission('granted');
    }
  }, [autoFetch, fetchLocation]);

  return {
    location,
    loading,
    error,
    permission,
    fetchLocation,
    getDistanceTo,
    hasLocation: !!location
  };
};

export default useLocation;