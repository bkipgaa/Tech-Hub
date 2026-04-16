/**
 * Location Service
 * =================
 * Handles all location-related functionality including:
 * - Getting user's current location
 * - Calculating distances
 * - Checking if location is within service radius
 * - Caching location data
 */

class LocationService {
  constructor() {
    this.userLocation = null;
    this.locationPermission = null;
  }

  /**
   * Check if browser supports geolocation
   * @returns {boolean} True if geolocation is supported
   */
  isGeolocationSupported() {
    return 'geolocation' in navigator;
  }

  /**
   * Get user's current location
   * @param {Object} options - Geolocation options
   * @returns {Promise} Promise that resolves with location data
   */
  async getCurrentLocation(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      if (!this.isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          // Cache the location
          this.userLocation = location;
          this.locationPermission = 'granted';
          
          resolve(location);
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Please enable location access to find technicians near you';
              this.locationPermission = 'denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
          }
          reject(new Error(errorMessage));
        },
        mergedOptions
      );
    });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lng1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lng2 - Longitude of point 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get cached user location
   * @returns {Object|null} Cached location or null
   */
  getCachedLocation() {
    return this.userLocation;
  }

  /**
   * Clear cached location
   */
  clearCachedLocation() {
    this.userLocation = null;
  }

  /**
   * Check if location permission is granted
   * @returns {boolean} True if permission granted
   */
  hasLocationPermission() {
    return this.locationPermission === 'granted';
  }
}

export default new LocationService();