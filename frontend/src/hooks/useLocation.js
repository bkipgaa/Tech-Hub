/**
 * useLocation Hook
 * Custom React hook for managing user location
 */

import { useState, useEffect, useCallback } from 'react';
import locationService from '../services/locationService';

const useLocation = (autoFetch = false) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null);

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

  const getDistanceTo = useCallback((technicianLocation) => {
    if (!location || !technicianLocation) return null;
    return locationService.calculateDistance(
      location.lat,
      location.lng,
      technicianLocation.lat,
      technicianLocation.lng
    );
  }, [location]);

  const formatDistance = useCallback((distance) => {
    return locationService.formatDistance(distance);
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
    
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
    formatDistance,
    hasLocation: !!location
  };
};

export default useLocation;