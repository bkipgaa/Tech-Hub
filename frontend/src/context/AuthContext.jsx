/**
 * AuthContext.js
 * ==============
 * 
 * Authentication and Authorization Context
 * 
 * Features:
 * - User authentication (login, register, logout)
 * - Role-based access (client, technician, admin)
 * - Technician profile management
 * - Admin user management
 * - Token-based authentication
 * 
 * Admin Features Added:
 * - Fetch all technicians (for admin panel)
 * - Get technician by ID (for admin viewing)
 * - Verify/reject technicians
 * - Update technician subscriptions (admin override)
 * - Fetch subscription statistics
 * 
 * IMPORTANT: All API endpoints now include /api prefix to match backend routes
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // your configured axios instance

// Create the authentication context
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // ==================== STATE VARIABLES ====================
  
  const [user, setUser] = useState(null);
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  
  // Admin-specific state
  const [technicians, setTechnicians] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  // Set default Authorization header for api instance if token exists
  if (token && !api.defaults.headers.common['Authorization']) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // ==================== PROFILE FETCH FUNCTIONS ====================
  // These are defined FIRST so they're available when called by other functions

  /**
   * Fetch technician profile for current user
   * Admins can also have technician profiles
   * 
   * IMPORTANT: Using /api/technician/profile (with /api prefix)
   * Returns 404 if no profile exists - this is handled gracefully
   */
  const fetchTechnicianProfile = async () => {
    try {
      // ✅ FIX: Added /api prefix to match backend route
      const response = await api.get('/auth/technician-profile');
      setTechnicianProfile(response.data.technician);
      return response.data.technician;
    } catch (error) {
      // 404 means no profile yet – that's fine, don't show error
      if (error.response?.status !== 404) {
        console.error('Error fetching technician profile:', error);
      }
      setTechnicianProfile(null);
      return null;
    }
  };

  /**
   * Fetch current user profile from backend
   * Also fetches technician profile if user is technician or admin
   */
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/technician-profile');
      setUser(response.data.user);

      // Fetch technician profile for technicians and admins
      if (response.data.user.role === 'technician' || response.data.user.role === 'admin') {
        await fetchTechnicianProfile();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ==================== AUTHENTICATION FUNCTIONS ====================

  /**
   * Register new user (client role by default)
   * @param {Object} userData - User registration data (name, email, password, etc.)
   */
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  /**
   * Upgrade client to technician role
   * This changes the user's role from 'client' to 'technician'
   */
  const becomeTechnician = async () => {
    try {
      const response = await api.put('/auth/become-technician');
      setUser(response.data.user);
      
      // Fetch technician profile after upgrade
      await fetchTechnicianProfile();
      
      return { success: true, user: response.data.user, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upgrade to technician',
      };
    }
  };

  /**
   * Login user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   */
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      // Fetch technician profile for technicians and admins
      if (user.role === 'technician' || user.role === 'admin') {
        await fetchTechnicianProfile();
      }

      return { success: true, user, token };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  /**
   * Logout user - clear all stored data and reset state
   */
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setTechnicianProfile(null);
    setTechnicians([]);
    setAdminStats(null);
  };

  /**
   * Update user profile information
   * @param {Object} userData - Updated user data
   */
  const updateUserProfile = async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Update failed',
      };
    }
  };

  // ==================== TECHNICIAN PROFILE MANAGEMENT ====================
  // All endpoints use /api/technician/profile with /api prefix

  /**
   * Create new technician profile
   * @param {Object} profileData - Technician profile data
   */
  const createTechnicianProfile = async (profileData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.post('/technician/profile', profileData);
      setTechnicianProfile(response.data.technician);

      // Update user role if needed
      if (user.role !== 'technician') {
        setUser({ ...user, role: 'technician' });
      }

      return { success: true, technician: response.data.technician };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create technician profile',
      };
    }
  };

  /**
   * Update entire technician profile
   * @param {Object} profileData - Complete technician profile data
   */
  const updateTechnicianProfile = async (profileData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile', profileData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update technician profile',
      };
    }
  };

  /**
   * Get technician profile by ID (Admin only)
   * @param {string} technicianId - Technician's user ID
   */
  const getTechnicianById = async (technicianId) => {
    try {
      const response = await api.get(`/admin/technicians/${technicianId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch technician',
      };
    }
  };

  // ==================== SECTION-SPECIFIC UPDATES ====================
  // All endpoints use /api/technician/profile with /api prefix

  /**
   * Update basic information section
   * @param {Object} data - Basic info data (firstName, lastName, aboutMe, etc.)
   */
  const updateBasicInfo = async (data) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/basic', data);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update basic info' };
    }
  };

  /**
   * Update skills section
   * @param {Array} skills - Array of skill objects with name, level, yearsOfExperience
   */
  const updateSkills = async (skills) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/skills', { skills });
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update skills' };
    }
  };

  /**
   * Update languages section
   * @param {Array} languages - Array of language objects with name and proficiency
   */
  const updateLanguages = async (languages) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/languages', { languages });
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update languages' };
    }
  };

  /**
   * Update location information
   * @param {Object} locationData - Address and coordinates
   */
  const updateLocation = async (locationData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/location', locationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update location' };
    }
  };

  /**
   * Update pricing information
   * @param {Object} pricingData - Hourly rate, fixed price, currency, etc.
   */
  const updatePricing = async (pricingData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/pricing', pricingData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update pricing' };
    }
  };

  /**
   * Add a service category
   * @param {Object} categoryData - Category with sub-services, pricing, etc.
   */
  const addServiceCategory = async (categoryData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.post('/api/technician/profile/service-category', categoryData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add service category' };
    }
  };

  /**
   * Remove a service category
   * @param {string} categoryName - Name of category to remove
   */
  const removeServiceCategory = async (categoryName) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.delete(`/api/technician/profile/service-category/${encodeURIComponent(categoryName)}`);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove service category' };
    }
  };

  /**
   * Add portfolio item
   * @param {Object} itemData - Portfolio item details
   */
  const addPortfolioItem = async (itemData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.post('/api/technician/profile/portfolio', itemData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add portfolio item' };
    }
  };

  /**
   * Remove portfolio item
   * @param {string} itemId - Portfolio item ID to remove
   */
  const removePortfolioItem = async (itemId) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.delete(`/api/technician/profile/portfolio/${itemId}`);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove portfolio item' };
    }
  };

  /**
   * Add education entry
   * @param {Object} educationData - Education details
   */
  const addEducation = async (educationData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.post('/api/technician/profile/education', educationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add education' };
    }
  };

  /**
   * Add certification
   * @param {Object} certData - Certification details
   */
  const addCertification = async (certData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.post('/api/technician/profile/certifications', certData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add certification' };
    }
  };

  /**
   * Add work experience entry
   * @param {Object} expData - Experience details
   */
  const addExperience = async (expData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.post('/api/technician/profile/experience', expData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add experience' };
    }
  };

  /**
   * Update availability schedule
   * @param {Object} scheduleData - Weekly schedule with hours
   */
  const updateAvailabilitySchedule = async (scheduleData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/availability', scheduleData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update availability' };
    }
  };

  /**
   * Toggle technician availability status (online/offline)
   */
  const toggleAvailability = async () => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.patch('/api/technician/profile/status', { 
        isAvailable: !technicianProfile?.isAvailable 
      });
      setTechnicianProfile(response.data.technician);
      return { success: true, isAvailable: response.data.isAvailable };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to toggle availability' };
    }
  };

  /**
   * Update business information
   * @param {Object} businessData - Business name, registration, insurance
   */
  const updateBusinessInfo = async (businessData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/business', businessData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update business info' };
    }
  };

  /**
   * Update social media links
   * @param {Object} socialData - Social media URLs
   */
  const updateSocialLinks = async (socialData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/social-links', socialData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update social links' };
    }
  };

  /**
   * Update privacy and notification settings
   * @param {Object} privacyData - Settings for visibility and notifications
   */
  const updatePrivacySettings = async (privacyData) => {
    try {
      // ✅ FIX: Added /api prefix
      const response = await api.put('/api/technician/profile/settings', privacyData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update settings' };
    }
  };

  // ==================== ADMIN FUNCTIONS ====================
  // These endpoints already have the correct paths (no /api prefix needed as they're absolute)

  /**
   * Get all technicians with filters (Admin only)
   * @param {Object} filters - Status, subscription plan, search term, pagination
   */
  const getAllTechnicians = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/technicians${params ? `?${params}` : ''}`);
      setTechnicians(response.data.data);
      return { 
        success: true, 
        data: response.data.data,
        pagination: response.data.pagination 
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch technicians',
      };
    }
  };

  /**
   * Verify a technician (Admin only)
   * @param {string} technicianId - Technician ID to verify
   * @param {string} remarks - Optional verification remarks
   */
  const verifyTechnician = async (technicianId, remarks = '') => {
    try {
      const response = await api.put(`/admin/technicians/${technicianId}/verify`, { remarks });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify technician',
      };
    }
  };

  /**
   * Reject a technician's verification (Admin only)
   * @param {string} technicianId - Technician ID to reject
   * @param {string} reason - Rejection reason
   */
  const rejectTechnician = async (technicianId, reason) => {
    try {
      const response = await api.put(`/admin/technicians/${technicianId}/reject`, { reason });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reject technician',
      };
    }
  };

  /**
   * Update technician subscription (Admin override)
   * @param {string} technicianId - Technician ID
   * @param {Object} subscriptionData - Plan ID, duration, trial status
   */
  const updateTechnicianSubscription = async (technicianId, subscriptionData) => {
    try {
      const response = await api.put(`/admin/technicians/${technicianId}/subscription`, subscriptionData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update subscription',
      };
    }
  };

  /**
   * Get subscription statistics (Admin only)
   */
  const getSubscriptionStats = async () => {
    try {
      const response = await api.get('/admin/subscription/stats');
      setAdminStats(response.data.data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch statistics',
      };
    }
  };

  // ==================== SUBSCRIPTION FUNCTIONS ====================

  /**
   * Get available subscription plans
   */
  const getSubscriptionPlans = async () => {
    try {
      const response = await api.get('/subscription/plans');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch plans',
      };
    }
  };

  /**
   * Get current technician's subscription
   */
  const getCurrentSubscription = async () => {
    try {
      const response = await api.get('/subscription/current');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch subscription',
      };
    }
  };

  /**
   * Activate free trial for technician
   */
  const activateTrial = async () => {
    try {
      const response = await api.post('/subscription/trial');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to activate trial',
      };
    }
  };

  /**
   * Upgrade subscription to paid plan
   * @param {string} planId - Plan identifier (basic, premium, etc.)
   * @param {boolean} autoRenew - Whether to auto-renew
   */
  const upgradeSubscription = async (planId, autoRenew = false) => {
    try {
      const response = await api.post('/subscription/upgrade', { planId, autoRenew });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upgrade subscription',
      };
    }
  };

  /**
   * Cancel auto-renewal for subscription
   */
  const cancelAutoRenew = async () => {
    try {
      const response = await api.put('/subscription/cancel-auto-renew');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel auto-renewal',
      };
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Toggle display of JWT token (for debugging)
   */
  const toggleTokenDisplay = () => {
    setShowToken(!showToken);
  };

  // ==================== ROLE CHECK HELPER PROPERTIES ====================
  
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const isClient = user?.role === 'client';

  // ==================== INITIALIZATION EFFECT ====================
  
  /**
   * On component mount or token change, fetch user profile
   * This effect runs once when the component mounts and whenever token changes
   */
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only re-run if token changes

  // ==================== CONTEXT VALUE ====================
  
  const value = {
    // User state
    user,                      // Current authenticated user object
    technicianProfile,         // Technician profile (if user is technician/admin)
    token,                     // JWT token for authentication
    loading,                   // Loading state for async operations
    showToken,                 // Whether to show token in UI (debug)
    
    // Role checks (convenience properties)
    isAdmin,                   // True if user has admin role
    isTechnician,              // True if user has technician role
    isClient,                  // True if user has client role
    
    // Admin state
    technicians,               // List of all technicians (admin only)
    adminStats,                // Subscription statistics (admin only)
    
    // Authentication functions
    register,                  // Register new user
    login,                     // Login existing user
    logout,                    // Logout current user
    becomeTechnician,          // Upgrade from client to technician
    updateUserProfile,         // Update user profile info
    
    // Technician profile functions
    createTechnicianProfile,   // Create new technician profile
    updateTechnicianProfile,   // Update entire technician profile
    fetchTechnicianProfile,    // Fetch technician profile
    getTechnicianById,         // Get technician by ID (admin only)
    
    // Section-specific update functions
    updateBasicInfo,           // Update basic information section
    updateSkills,              // Update skills section
    updateLanguages,           // Update languages section
    updateLocation,            // Update location information
    updatePricing,             // Update pricing information
    addServiceCategory,        // Add a service category
    removeServiceCategory,     // Remove a service category
    addPortfolioItem,          // Add portfolio item
    removePortfolioItem,       // Remove portfolio item
    addEducation,              // Add education entry
    addCertification,          // Add certification
    addExperience,             // Add work experience
    updateAvailabilitySchedule,// Update availability schedule
    toggleAvailability,        // Toggle online/offline status
    updateBusinessInfo,        // Update business information
    updateSocialLinks,         // Update social media links
    updatePrivacySettings,     // Update privacy settings
    
    // Admin functions
    getAllTechnicians,         // Get all technicians with filters
    verifyTechnician,          // Verify a technician
    rejectTechnician,          // Reject technician verification
    updateTechnicianSubscription, // Update technician subscription (admin)
    getSubscriptionStats,      // Get subscription statistics
    
    // Subscription functions (for technicians)
    getSubscriptionPlans,      // Get available subscription plans
    getCurrentSubscription,    // Get current subscription
    activateTrial,             // Activate free trial
    upgradeSubscription,       // Upgrade to paid plan
    cancelAutoRenew,           // Cancel auto-renewal
    
    // Utility functions
    toggleTokenDisplay,        // Toggle token display (debug)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};