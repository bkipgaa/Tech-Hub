/**
 * searchController.js
 * ===================
 * Search for technicians with subscription-based visibility radius
 * 
 * This controller handles all technician search functionality including:
 * - Service-based filtering (category, service category, sub-service)
 * - Location-based proximity search
 * - Subscription plan visibility radius filtering
 * - Distance calculation and sorting
 * 
 * Key Concept: Technicians are only visible to clients within their subscription plan's
 * visibility radius (e.g., Free plan: 10km, Premium: 50km, Enterprise: 500km)
 */

const Technician = require('../models/Technician');
const { subscriptionPlans } = require('../utils/subscriptionPlans');

/**
 * Calculate distance between two coordinates using Haversine formula
 * 
 * The Haversine formula calculates the great-circle distance between two points
 * on a sphere (Earth) given their longitudes and latitudes.
 * 
 * @param {number} lat1 - Latitude of first point (client)
 * @param {number} lon1 - Longitude of first point (client)
 * @param {number} lat2 - Latitude of second point (technician)
 * @param {number} lon2 - Longitude of second point (technician)
 * @returns {number} Distance in kilometers (rounded to 1 decimal place)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert latitude and longitude differences from degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  // Haversine formula
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Round to 1 decimal place for cleaner display
  return Math.round(distance * 10) / 10;
}

/**
 * Check if technician's subscription is active
 * 
 * A subscription is considered active if:
 * - Trial is active (within trial period)
 * - Paid subscription hasn't expired
 * - Free plan is always active
 * 
 * @param {Object} technician - Technician document from database
 * @returns {boolean} True if subscription is active, false otherwise
 */
function isSubscriptionActive(technician) {
  // If technician has no subscription record, treat as inactive
  if (!technician.subscription) return false;
  
  // Check if trial is active (30-day trial period)
  if (technician.subscription.isTrial && technician.subscription.trialEndDate) {
    if (new Date() < new Date(technician.subscription.trialEndDate)) {
      return true; // Trial is still valid
    }
  }
  
  // Check if paid subscription is active (not expired)
  if (technician.subscription.endDate) {
    return new Date() < new Date(technician.subscription.endDate);
  }
  
  // Free plan is always active (no expiration)
  return technician.subscription.plan === 'free';
}

/**
 * Get technician's visibility radius based on their subscription plan
 * 
 * Visibility radius determines how far clients can be to see this technician.
 * Example: Free plan (10km) means only clients within 10km can see them.
 * 
 * @param {Object} technician - Technician document from database
 * @returns {number} Visibility radius in kilometers
 */
function getVisibilityRadius(technician) {
  // Default to 'free' plan if no subscription data
  const plan = technician.subscription?.plan || 'free';
  
  // Trial users get premium visibility (50km) to encourage conversion
  if (technician.subscription?.isTrial) {
    return subscriptionPlans.premium.visibilityRadius;
  }
  
  // Return the visibility radius for the technician's plan
  // Fallback to free plan if plan not found
  return subscriptionPlans[plan]?.visibilityRadius || subscriptionPlans.free.visibilityRadius;
}

/**
 * Search for technicians by service and location
 * 
 * This is the main search endpoint that clients use to find technicians.
 * It filters by:
 * 1. Service criteria (main category, service category, sub-service)
 * 2. Location (client's coordinates)
 * 3. Subscription plan visibility (technician's plan determines how far they appear)
 * 
 * @route   GET /api/search/technicians
 * @access  Public
 * 
 * Query Parameters:
 * - mainCategory: string (required) - e.g., "IT & Networking"
 * - serviceCategory: string (required) - e.g., "Internet Services"  
 * - subService: string (required) - e.g., "WiFi Setup & Configuration"
 * - lat: number (required) - Client's latitude
 * - lng: number (required) - Client's longitude
 * - radius: number (optional) - Max search radius (default: 1000km, max: 1000km)
 * - minRating: number (optional) - Minimum rating filter
 * - maxHourlyRate: number (optional) - Maximum hourly rate filter
 */
exports.searchTechnicians = async (req, res) => {
  try {
    // Extract query parameters from request
    const {
      mainCategory,
      serviceCategory,
      subService,
      lat,
      lng,
      radius = 1000, // Default to 1000km if not specified
      minRating,
      maxHourlyRate
    } = req.query;

    // ========== VALIDATION ==========
    // All service parameters are required for accurate search
    if (!mainCategory || !serviceCategory || !subService) {
      return res.status(400).json({
        success: false,
        message: 'mainCategory, serviceCategory, and subService are required'
      });
    }

    // Location is required for proximity search
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location (lat, lng) is required'
      });
    }

    // Validate and sanitize radius input
    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 1000; // Default if invalid
    if (searchRadius < 1) searchRadius = 1;      // Minimum 1km
    if (searchRadius > 1000) searchRadius = 1000; // Maximum 1000km

    // Parse coordinates as floats
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // ========== BUILD BASE QUERY ==========
    // Find all technicians that match the service criteria
    // This query does NOT include location filtering yet
    const baseQuery = {
      // Basic status filters
      isActive: true,                    // Account is active
      isAvailable: true,                 // Available for work
      verificationStatus: { $in: ['verified', 'pending'] }, // Include both verified and pending
      
      // Service filters (exact matches required)
      category: mainCategory,
      serviceCategories: {
        $elemMatch: {
          categoryName: serviceCategory,
          subServices: { $in: [subService] }
        }
      }
    };

    // Optional: Add rating filter if provided
    if (minRating) {
      baseQuery['rating.average'] = { $gte: parseFloat(minRating) };
    }

    // Optional: Add hourly rate filter if provided
    if (maxHourlyRate) {
      baseQuery['pricing.hourlyRate'] = { $lte: parseFloat(maxHourlyRate) };
    }

    // Execute the base query to get all matching technicians
    let allTechnicians = await Technician.find(baseQuery)
      .populate('userId', 'firstName lastName profileImage phone email');

    // ========== SUBSCRIPTION-BASED VISIBILITY FILTERING ==========
    // Filter technicians based on their subscription plan's visibility radius
    // This is the key feature: technicians only appear within their plan's radius
    const visibleTechnicians = allTechnicians.filter(tech => {
      // First check if subscription is active (not expired)
      if (!isSubscriptionActive(tech)) return false;
      
      // Check if technician has valid location coordinates
      if (tech.location?.coordinates && tech.location.coordinates[0] !== 0) {
        // Calculate actual distance between client and technician
        const distance = calculateDistance(
          latitude,
          longitude,
          tech.location.coordinates[1], // Latitude from coordinates [lng, lat]
          tech.location.coordinates[0]  // Longitude from coordinates [lng, lat]
        );
        
        // Get technician's allowed visibility radius based on their plan
        const visibilityRadius = getVisibilityRadius(tech);
        
        // Technician is visible ONLY IF:
        // 1. Distance <= their plan's visibility radius (subscription limit)
        // 2. Distance <= client's requested search radius (client limit)
        return distance <= visibilityRadius && distance <= searchRadius;
      }
      
      return false; // No valid location data
    });

    // ========== PREPARE RESULTS ==========
    // Calculate distance for each visible technician and add metadata
    const results = visibleTechnicians.map(tech => {
      const techObj = tech.toObject();
      
      // Calculate exact distance from client to this technician
      const distance = calculateDistance(
        latitude,
        longitude,
        tech.location.coordinates[1],
        tech.location.coordinates[0]
      );
      
      // Add useful metadata to the response
      techObj.distance = distance;                                    // How far technician is (km)
      techObj.visibilityRadius = getVisibilityRadius(tech);          // Their plan's max distance
      techObj.subscriptionPlan = tech.subscription?.plan || 'free';  // Current plan name
      techObj.isTrial = tech.subscription?.isTrial || false;         // Whether on trial
      
      return techObj;
    });

    // Sort results by distance (closest technicians first)
    results.sort((a, b) => a.distance - b.distance);

    // ========== RESPONSE ==========
    res.json({
      success: true,
      count: results.length,
      searchRadius: searchRadius,
      data: results
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};

/**
 * Get nearby technicians by location only (no service filter)
 * 
 * This is a simplified search that only uses location and subscription visibility.
 * Useful for the homepage or "find technicians near me" feature.
 * 
 * @route   GET /api/search/nearby
 * @access  Public
 * 
 * Query Parameters:
 * - lat: number (required) - Client's latitude
 * - lng: number (required) - Client's longitude
 * - radius: number (optional) - Max search radius (default: 50km)
 */
exports.getNearbyTechnicians = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate and sanitize radius
    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 50;
    if (searchRadius < 1) searchRadius = 1;
    if (searchRadius > 1000) searchRadius = 1000;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Get all active technicians (no service filters)
    const allTechnicians = await Technician.find({
      isActive: true,
      isAvailable: true,
      verificationStatus: { $in: ['verified', 'pending'] }
    }).populate('userId', 'firstName lastName profileImage phone email');

    // Filter based on subscription visibility radius
    const visibleTechnicians = allTechnicians.filter(tech => {
      // Check subscription is active
      if (!isSubscriptionActive(tech)) return false;
      
      // Check location data exists
      if (tech.location?.coordinates && tech.location.coordinates[0] !== 0) {
        const distance = calculateDistance(
          latitude,
          longitude,
          tech.location.coordinates[1],
          tech.location.coordinates[0]
        );
        
        const visibilityRadius = getVisibilityRadius(tech);
        // Technician visible if within both visibility radius and client's radius
        return distance <= visibilityRadius && distance <= searchRadius;
      }
      return false;
    });

    // Prepare results with distance metadata
    const results = visibleTechnicians.map(tech => {
      const techObj = tech.toObject();
      techObj.distance = calculateDistance(
        latitude,
        longitude,
        tech.location.coordinates[1],
        tech.location.coordinates[0]
      );
      techObj.visibilityRadius = getVisibilityRadius(tech);
      techObj.subscriptionPlan = tech.subscription?.plan || 'free';
      return techObj;
    });

    // Sort by closest first
    results.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error('Nearby search error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export helper functions for use in other controllers (e.g., subscription management)
exports.getVisibilityRadius = getVisibilityRadius;
exports.isSubscriptionActive = isSubscriptionActive;