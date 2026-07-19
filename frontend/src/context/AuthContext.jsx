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
 * @version 2.0.0
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Create the authentication context
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // ============================================================
  // STATE VARIABLES
  // ============================================================
  
  const [user, setUser] = useState(null);
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  // Admin-specific state
  const [technicians, setTechnicians] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  // ============================================================
  // TOKEN MANAGEMENT
  // ============================================================

  /**
   * Set authentication token in localStorage and axios headers
   * @param {string|null} newToken - JWT token or null to remove
   */
  const setAuthToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
    }
  };

  // ============================================================
  // PROFILE FETCH FUNCTIONS
  // ============================================================

  /**
   * Fetch technician profile for current user
   * Handles both response formats: data.technician or data.data
   * @returns {Object|null} Technician profile or null if not found
   */
  const fetchTechnicianProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await api.get('/technician/profile');
      
      if (response.data.success) {
        // Handle both response formats: data.technician OR data.data
        const profileData = response.data.data || response.data.technician;
        
        if (profileData) {
          setTechnicianProfile(profileData);
          return profileData;
        }
      }
      
      setTechnicianProfile(null);
      return null;
    } catch (error) {
      // 404 means no profile yet – that's fine for new technicians
      if (error.response?.status !== 404) {
        console.error('Error fetching technician profile:', error);
      }
      setTechnicianProfile(null);
      return null;
    }
  };

  /**
   * Fetch current user profile from backend
   * @returns {Object|null} User data or null if failed
   */
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const response = await api.get('/auth/profile');
      
      const userData = response.data.user || response.data;
      setUser(userData);

      // Fetch technician profile for technicians and admins
      if (userData.role === 'technician' || userData.role === 'admin') {
        await fetchTechnicianProfile();
      }
      
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthError(error.response?.data?.message || 'Failed to fetch profile');
      
      // If token is invalid, logout
      if (error.response?.status === 401) {
        logout();
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // AUTHENTICATION FUNCTIONS
  // ============================================================

  /**
   * Register new user (client role by default)
   * @param {Object} userData - User registration data
   * @returns {Object} { success: boolean, user: Object, error: string }
   */
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;

      setAuthToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} { success: boolean, user: Object, token: string, error: string }
   */
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const token = response.data.token;
        const userData = response.data.user;
        
        if (!userData) {
          return { 
            success: false, 
            error: 'No user data received from server' 
          };
        }
        
        // Store authentication data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setToken(token);
        setUser(userData);
        
        // Fetch technician profile if needed
        if (userData.role === 'technician' || userData.role === 'admin') {
          await fetchTechnicianProfile();
        }
        
        return { 
          success: true, 
          token: token,
          user: userData,
          data: response.data 
        };
      }
      
      return { 
        success: false, 
        error: response.data.message || 'Login failed' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  /**
   * Logout user - clear all stored data and reset state
   */
  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setTechnicianProfile(null);
    setTechnicians([]);
    setAdminStats(null);
    setAuthError(null);
  };

  /**
   * Upgrade client to technician role
   * @returns {Object} { success: boolean, user: Object, message: string, error: string }
   */
  const becomeTechnician = async () => {
    try {
      const response = await api.put('/auth/become-technician');
      
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Fetch technician profile after role upgrade
      await fetchTechnicianProfile();
      
      return { 
        success: true, 
        user: updatedUser, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('Become technician error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upgrade to technician',
      };
    }
  };

  /**
   * Update user profile information
   * @param {Object} userData - Updated user data
   * @returns {Object} { success: boolean, user: Object, error: string }
   */
  const updateUserProfile = async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Update failed',
      };
    }
  };

  // ============================================================
  // TECHNICIAN PROFILE MANAGEMENT
  // ============================================================

  /**
   * Helper to extract profile data from response
   * Handles both response.data.data and response.data.technician
   * @param {Object} response - API response object
   * @returns {Object|null} Profile data or null
   */
  const extractProfileData = (response) => {
    if (!response?.data?.success) return null;
    return response.data.data || response.data.technician || null;
  };

  /**
   * Update technician profile state with response data
   * @param {Object} response - API response object
   * @returns {Object|null} Profile data or null
   */
  const updateProfileState = (response) => {
    const profileData = extractProfileData(response);
    if (profileData) {
      setTechnicianProfile(profileData);
    }
    return profileData;
  };

  /**
   * Create new technician profile
   * @param {Object} profileData - Technician profile data
   * @returns {Object} { success: boolean, technician: Object, error: string }
   */
  const createTechnicianProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return {
          success: false,
          error: 'Please login first to create a technician profile'
        };
      }

      const response = await api.post('/technician/create-profile', profileData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const profile = updateProfileState(response);
        
        // Update user role if needed
        if (user && user.role !== 'technician') {
          const updatedUser = { ...user, role: 'technician' };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return { success: true, technician: profile };
      }
      
      return { 
        success: false, 
        error: response.data.message || 'Failed to create technician profile' 
      };
    } catch (error) {
      console.error('Create profile error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Your session has expired. Please login again.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create technician profile',
      };
    }
  };

  /**
   * Update entire technician profile
   * @param {Object} profileData - Updated technician profile data
   * @returns {Object} { success: boolean, technician: Object, error: string }
   */
  const updateTechnicianProfile = async (profileData) => {
    try {
      const response = await api.put('/technician/profile', profileData);
      
      if (response.data.success) {
        const profile = updateProfileState(response);
        return { success: true, technician: profile };
      }
      
      return { 
        success: false, 
        error: response.data.message || 'Failed to update technician profile' 
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update technician profile',
      };
    }
  };

  /**
   * Get technician profile by ID (Admin only)
   * @param {string} technicianId - Technician ID
   * @returns {Object} { success: boolean, data: Object, error: string }
   */
  const getTechnicianById = async (technicianId) => {
    try {
      const response = await api.get(`/technician/${technicianId}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      
      return { 
        success: false, 
        error: response.data.message || 'Technician not found' 
      };
    } catch (error) {
      console.error('Error fetching technician:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch technician',
      };
    }
  };

  // ============================================================
  // SECTION-SPECIFIC UPDATE FUNCTIONS
  // ============================================================

  /**
   * Generic update function for profile sections
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Data to send
   * @returns {Object} { success: boolean, technician: Object, error: string }
   */
  const updateProfileSection = async (endpoint, data) => {
    try {
      const response = await api.put(endpoint, data);
      if (response.data.success) {
        const profile = updateProfileState(response);
        return { success: true, technician: profile };
      }
      return { 
        success: false, 
        error: response.data.message || `Failed to update ${endpoint.split('/').pop()}` 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || `Failed to update ${endpoint.split('/').pop()}` 
      };
    }
  };

  const updateBasicInfo = (data) => updateProfileSection('/technician/profile/basic', data);
  const updateSkills = (skills) => updateProfileSection('/technician/profile/skills', { skills });
  const updateLanguages = (languages) => updateProfileSection('/technician/profile/languages', { languages });
  const updateLocation = (locationData) => updateProfileSection('/technician/profile/location', locationData);
  const updatePricing = (pricingData) => updateProfileSection('/technician/profile/pricing', pricingData);
  const updateBusinessInfo = (businessData) => updateProfileSection('/technician/profile/business', businessData);
  const updateSocialLinks = (socialData) => updateProfileSection('/technician/profile/social-links', socialData);
  const updatePrivacySettings = (privacyData) => updateProfileSection('/technician/profile/settings', privacyData);
  const updateAvailabilitySchedule = (scheduleData) => updateProfileSection('/technician/profile/availability', scheduleData);




// AuthContext.js - Add service-specific update functions

/**
 * Update service categories for a technician
 * @param {Array} serviceCategories - Array of service category objects
 * @returns {Object} { success: boolean, technician: Object, error: string }
 */
const updateServiceCategories = async (serviceCategories) => {
  try {
    const response = await api.put('/technician/profile/services', { serviceCategories });
    
    if (response.data.success) {
      const profile = updateProfileState(response);
      return { success: true, technician: profile };
    }
    
    return { 
      success: false, 
      error: response.data.message || 'Failed to update services' 
    };
  } catch (error) {
    console.error('Update services error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update services',
    };
  }
};

/**
 * Add a service category
 * @param {Object} categoryData - Service category data
 * @returns {Object} { success: boolean, technician: Object, error: string }
 */
const addServiceCategory = async (categoryData) => {
  try {
    const response = await api.post('/technician/profile/service-category', categoryData);
    
    if (response.data.success) {
      const profile = updateProfileState(response);
      return { success: true, technician: profile };
    }
    
    return { 
      success: false, 
      error: response.data.message || 'Failed to add service category' 
    };
  } catch (error) {
    console.error('Add service category error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to add service category',
    };
  }
};

/**
 * Remove a service category
 * @param {string} categoryName - Name of the category to remove
 * @returns {Object} { success: boolean, technician: Object, error: string }
 */
const removeServiceCategory = async (categoryName) => {
  try {
    const response = await api.delete(`/technician/profile/service-category/${encodeURIComponent(categoryName)}`);
    
    if (response.data.success) {
      const profile = updateProfileState(response);
      return { success: true, technician: profile };
    }
    
    return { 
      success: false, 
      error: response.data.message || 'Failed to remove service category' 
    };
  } catch (error) {
    console.error('Remove service category error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to remove service category',
    };
  }
};


  /**
   * Toggle technician availability status
   * @returns {Object} { success: boolean, isAvailable: boolean, error: string }
   */
  const toggleAvailability = async () => {
    try {
      const response = await api.patch('/technician/profile/status', { 
        isAvailable: !technicianProfile?.isAvailable 
      });
      if (response.data.success) {
        const profile = updateProfileState(response);
        return { success: true, isAvailable: profile?.isAvailable };
      }
      return { 
        success: false, 
        error: response.data.message || 'Failed to toggle availability' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to toggle availability' 
      };
    }
  };

  // ============================================================
  // ADMIN FUNCTIONS
  // ============================================================

  /**
   * Get all technicians with optional filters
   * @param {Object} filters - Filter parameters
   * @returns {Object} { success: boolean, data: Array, pagination: Object, error: string }
   */
  const getAllTechnicians = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/admin/technician${params ? `?${params}` : ''}`);
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
   * @param {string} technicianId - Technician ID
   * @param {string} remarks - Verification remarks
   * @returns {Object} { success: boolean, data: Object, error: string }
   */
  const verifyTechnician = async (technicianId, remarks = '') => {
    try {
      const response = await api.put(`/admin/technician/${technicianId}/verify`, { remarks });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify technician',
      };
    }
  };

  /**
   * Reject a technician (Admin only)
   * @param {string} technicianId - Technician ID
   * @param {string} reason - Rejection reason
   * @returns {Object} { success: boolean, data: Object, error: string }
   */
  const rejectTechnician = async (technicianId, reason) => {
    try {
      const response = await api.put(`/admin/technician/${technicianId}/reject`, { reason });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reject technician',
      };
    }
  };

  /**
   * Update technician subscription (Admin only)
   * @param {string} technicianId - Technician ID
   * @param {Object} subscriptionData - Subscription data
   * @returns {Object} { success: boolean, data: Object, error: string }
   */
  const updateTechnicianSubscription = async (technicianId, subscriptionData) => {
    try {
      const response = await api.put(`/admin/technician/${technicianId}/subscription`, subscriptionData);
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
   * @returns {Object} { success: boolean, data: Object, error: string }
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

  // ============================================================
  // SUBSCRIPTION FUNCTIONS
  // ============================================================

  /**
   * Get available subscription plans
   * @returns {Object} { success: boolean, data: Array, error: string }
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
   * Get current user's subscription
   * @returns {Object} { success: boolean, data: Object, error: string }
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
   * Activate free trial subscription
   * @returns {Object} { success: boolean, data: Object, error: string }
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
   * Upgrade subscription to a plan
   * @param {string} planId - Plan ID
   * @param {boolean} autoRenew - Auto-renew flag
   * @returns {Object} { success: boolean, data: Object, error: string }
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
   * Cancel auto-renewal of subscription
   * @returns {Object} { success: boolean, data: Object, error: string }
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

  // ============================================================
  // ROLE CHECK HELPER PROPERTIES
  // ============================================================
  
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const isClient = user?.role === 'client';

  // ============================================================
  // INITIALIZATION EFFECT
  // ============================================================
  
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          
          // Restore user from localStorage
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Fetch fresh user profile
          await fetchUserProfile();
        } catch (error) {
          console.error('Error restoring auth:', error);
          logout();
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  
  const value = {
    // User state
    user,
    technicianProfile,
    token,
    loading,
    authError,
    
    // Role checks
    isAdmin,
    isTechnician,
    isClient,
    
    // Admin state
    technicians,
    adminStats,
    
    // Authentication functions
    register,
    login,
    logout,
    becomeTechnician,
    updateUserProfile,
    
    // Technician profile functions
    createTechnicianProfile,
    updateTechnicianProfile,
    fetchTechnicianProfile,
    getTechnicianById,
     addServiceCategory,        // ✅ New
  removeServiceCategory,
    
    // Section-specific update functions
    updateBasicInfo,
    updateSkills,
    updateLanguages,
    updateLocation,
    updatePricing,
    updateBusinessInfo,
    updateSocialLinks,
    updatePrivacySettings,
    updateAvailabilitySchedule,
    toggleAvailability,
    
    // Admin functions
    getAllTechnicians,
    verifyTechnician,
    rejectTechnician,
    updateTechnicianSubscription,
    getSubscriptionStats,
    
    // Subscription functions
    getSubscriptionPlans,
    getCurrentSubscription,
    activateTrial,
    upgradeSubscription,
    cancelAutoRenew,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};