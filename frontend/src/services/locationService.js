/**
 * Location Service
 * Handles geolocation and distance calculations
 */

class LocationService {
  constructor() {
    this.cachedLocation = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    this.lastFetchTime = null;
  }

  /**
   * Get user's current location using browser geolocation
   * @returns {Promise<{lat: number, lng: number}>}
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      // Check if we have valid cached location
      if (this.cachedLocation && this.lastFetchTime) {
        const age = Date.now() - this.lastFetchTime;
        if (age < this.cacheExpiry) {
          resolve(this.cachedLocation);
          return;
        }
      }

      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.cachedLocation = location;
          this.lastFetchTime = Date.now();
          resolve(location);
        },
        (error) => {
          let message = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Please enable location access to find nearby technicians';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 10) / 10;
  }

  /**
   * Format distance for display
   * @param {number} distance - Distance in km
   * @returns {string} Formatted distance string
   */
  formatDistance(distance) {
    if (!distance && distance !== 0) return 'Distance unknown';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  }

  /**
   * Get visibility description based on technician's plan
   */
  getVisibilityDescription(plan, isTrial = false) {
    if (isTrial) return 'Trial: Visible up to 50km';
    
    const visibilityRadii = {
      free: 'Visible up to 10km',
      basic: 'Visible up to 30km',
      premium: 'Visible up to 50km',
      business: 'Visible up to 200km',
      enterprise: 'Visible up to 500km',
      unlimited: 'Visible up to 1000km'
    };
    
    return visibilityRadii[plan] || 'Free: Visible up to 10km';
  }

  getCachedLocation() {
    if (this.cachedLocation && this.lastFetchTime) {
      const age = Date.now() - this.lastFetchTime;
      if (age < this.cacheExpiry) {
        return this.cachedLocation;
      }
    }
    return null;
  }

  clearCache() {
    this.cachedLocation = null;
    this.lastFetchTime = null;
  }
}

export default new LocationService();