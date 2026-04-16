/**
 * searchController.js
 * ===================
 * Simplified search for technicians by:
 * - Main category
 * - Service category (subcategory)
 * - Sub-service
 * - Location within 1-50km radius
 * - Includes both verified and pending technicians
 */

const Technician = require('../models/Technician');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers (rounded to 1 decimal)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

/**
 * Search for technicians by service and location
 * 
 * Query Parameters:
 * - mainCategory: string (required) - e.g., "IT & Networking"
 * - serviceCategory: string (required) - e.g., "Internet Services"  
 * - subService: string (required) - e.g., "WiFi Setup & Configuration"
 * - lat: number (required) - User's latitude
 * - lng: number (required) - User's longitude
 * - radius: number (optional) - Search radius in km (default: 50, max: 50, min: 1)
 * 
 * @route   GET /api/search/technicians
 * @access  Public
 */
exports.searchTechnicians = async (req, res) => {
  try {
    const {
      mainCategory,
      serviceCategory,
      subService,
      lat,
      lng,
      radius = 50
    } = req.query;

    // ========== VALIDATION ==========
    // Check required parameters
    if (!mainCategory) {
      return res.status(400).json({
        success: false,
        message: 'mainCategory is required'
      });
    }

    if (!serviceCategory) {
      return res.status(400).json({
        success: false,
        message: 'serviceCategory is required'
      });
    }

    if (!subService) {
      return res.status(400).json({
        success: false,
        message: 'subService is required'
      });
    }

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Location (lat, lng) is required'
      });
    }

    // Validate and limit radius (1-50km)
    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) {
      searchRadius = 50;
    }
    if (searchRadius < 1) {
      searchRadius = 1;
    }
    if (searchRadius > 50) {
      searchRadius = 50;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // ========== BUILD QUERY ==========
    // Find technicians who offer the specific sub-service
    // ✅ Includes BOTH verified and pending technicians
    const query = {
      isActive: true,
      isAvailable: true,
      verificationStatus: { $in: ['verified', 'pending'] },  // ✅ Both verified and pending
      category: mainCategory,
      serviceCategories: {
        $elemMatch: {
          categoryName: serviceCategory,
          subServices: { $in: [subService] }
        }
      }
    };

    // Add location filter (find technicians within radius)
    const maxDistance = searchRadius * 1000; // Convert km to meters
    query.location = {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], maxDistance / 6378100]
      }
    };

    // ========== EXECUTE SEARCH ==========
    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email');

    // ========== CALCULATE DISTANCES ==========
    const results = technicians.map(tech => {
      const techObj = tech.toObject();
      
      // Calculate exact distance
      const distance = calculateDistance(
        latitude,
        longitude,
        tech.location.coordinates[1],
        tech.location.coordinates[0]
      );
      
      techObj.distance = distance;
      techObj.withinServiceRadius = distance <= tech.serviceRadius;
      
      return techObj;
    });

    // Sort by distance (closest first)
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
 * Get technicians by sub-service only (without location)
 * Useful for testing or when location is not available
 * ✅ Includes both verified and pending technicians
 * 
 * @route   GET /api/search/by-subservice
 * @access  Public
 */
exports.getTechniciansBySubService = async (req, res) => {
  try {
    const { mainCategory, serviceCategory, subService } = req.query;

    // Validate required parameters
    if (!mainCategory || !serviceCategory || !subService) {
      return res.status(400).json({
        success: false,
        message: 'mainCategory, serviceCategory, and subService are required'
      });
    }

    // ✅ Includes BOTH verified and pending technicians
    const query = {
      isActive: true,
      isAvailable: true,
      verificationStatus: { $in: ['verified', 'pending'] },  // ✅ Both verified and pending
      category: mainCategory,
      serviceCategories: {
        $elemMatch: {
          categoryName: serviceCategory,
          subServices: { $in: [subService] }
        }
      }
    };

    const technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email');

    res.json({
      success: true,
      count: technicians.length,
      data: technicians
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get nearby technicians by location only (no service filter)
 * ✅ Includes both verified and pending technicians
 * 
 * @route   GET /api/search/nearby
 * @access  Public
 */
exports.getNearbyTechnicians = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    let searchRadius = parseFloat(radius);
    if (isNaN(searchRadius)) searchRadius = 10;
    if (searchRadius < 1) searchRadius = 1;
    if (searchRadius > 50) searchRadius = 50;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = searchRadius * 1000;

    // ✅ Includes BOTH verified and pending technicians
    const query = {
      isActive: true,
      isAvailable: true,
      verificationStatus: { $in: ['verified', 'pending'] },  // ✅ Both verified and pending
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], maxDistance / 6378100]
        }
      }
    };

    let technicians = await Technician.find(query)
      .populate('userId', 'firstName lastName profileImage phone email');

    const results = technicians.map(tech => {
      const techObj = tech.toObject();
      techObj.distance = calculateDistance(
        latitude,
        longitude,
        tech.location.coordinates[1],
        tech.location.coordinates[0]
      );
      return techObj;
    });

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