/**
 * searchRoutes.js
 * ===============
 * Routes for technician search, categories, and suggestions.
 * 
 * @version 2.0.0 – Added categories/full endpoint
 * @author Weba-Hub Team
 */

const express = require('express');
const router = express.Router();

// Import all search controller functions
const {
  searchTechnicians,
  getTechniciansBySubService,
  getNearbyTechnicians,
  getCategories,
  getFullCategories,
  getSearchSuggestions,
} = require('../controllers/searchController');

// ─── PUBLIC SEARCH ROUTES ─────────────────────────────────────

/**
 * GET /technicians
 * Search technicians with filters, location, and subscription validation.
 */
router.get('/technicians', searchTechnicians);

/**
 * GET /by-service
 * Get technicians by a specific sub‑service.
 * Query: subService, lat, lng, radius, page, limit
 */
router.get('/by-service', getTechniciansBySubService);

/**
 * GET /nearby
 * Get technicians near a location (distance‑only).
 * Query: lat, lng, radius, page, limit
 */
router.get('/nearby', getNearbyTechnicians);

/**
 * GET /categories
 * Get all distinct main categories (from technicians).
 */
router.get('/categories', getCategories);

/**
 * GET /categories/full
 * Get the full category tree: mainCategory → serviceCategories → subServices.
 * Used by the frontend search page to populate dropdowns.
 */
router.get('/categories/full', getFullCategories);

/**
 * GET /suggestions
 * Autocomplete suggestions for search (business names, categories, sub‑services).
 * Query: q (minimum 2 characters), limit
 */
router.get('/suggestions', getSearchSuggestions);

module.exports = router;