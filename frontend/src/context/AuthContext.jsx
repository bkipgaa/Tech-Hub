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
  // ==================== STATE VARIABLES ====================
  
  const [user, setUser] = useState(null);
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // Admin-specific state
  const [technicians, setTechnicians] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  // ==================== TOKEN MANAGEMENT ====================

  /**
   * Set token in localStorage and axios headers
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

  /**
   * Initialize auth token on app load
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  // ==================== PROFILE FETCH FUNCTIONS ====================

  /**
   * Fetch technician profile for current user
   */
  const fetchTechnicianProfile = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.get('/technician/profile');
      setTechnicianProfile(response.data.technician);
      return response.data.technician;
    } catch (error) {
      // 404 means no profile yet – that's fine
      if (error.response?.status !== 404) {
        console.error('Error fetching technician profile:', error);
      }
      setTechnicianProfile(null);
      return null;
    }
  };

  /**
   * Fetch current user profile from backend
   */
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.get('/auth/profile');
      const userData = response.data.user || response.data;
      setUser(userData);

      // Fetch technician profile for technicians and admins
      if (userData.role === 'technician' || userData.role === 'admin') {
        await fetchTechnicianProfile();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setAuthError(error.response?.data?.message || 'Failed to fetch profile');
      
      // If token is invalid, logout
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // ==================== AUTHENTICATION FUNCTIONS ====================

  /**
   * Register new user (client role by default)
   */
  const register = async (userData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
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
   */
  const login = async (email, password) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      setAuthToken(token);
      setUser(user);

      // Fetch technician profile for technicians and admins
      if (user.role === 'technician' || user.role === 'admin') {
        await fetchTechnicianProfile();
      }

      return { success: true, user, token };
    } catch (error) {
      console.error('Login error:', error);
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
    setAuthToken(null);
    setUser(null);
    setTechnicianProfile(null);
    setTechnicians([]);
    setAdminStats(null);
    setAuthError(null);
  };

  /**
   * Upgrade client to technician role
   */
  const becomeTechnician = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/auth/become-technician');
      
      // Update user with the new role data from response
      const updatedUser = response.data.user;
      setUser(updatedUser);
      
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
   */
  const updateUserProfile = async (userData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
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

  // ==================== TECHNICIAN PROFILE MANAGEMENT ====================

  /**
   * Get technician profile
   */
  const getTechnicianProfile = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.get('/technician/profile');
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching technician profile:', error);
      }
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile not found' 
      };
    }
  };

  /**
   * Create new technician profile
   */
  const createTechnicianProfile = async (profileData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/technician/profile', profileData);
      setTechnicianProfile(response.data.technician);

      // Update user role if needed
      if (user && user.role !== 'technician') {
        setUser({ ...user, role: 'technician' });
      }

      return { success: true, technician: response.data.technician };
    } catch (error) {
      console.error('Create profile error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create technician profile',
      };
    }
  };

  /**
   * Update entire technician profile
   */
  const updateTechnicianProfile = async (profileData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile', profileData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
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
   */
  const getTechnicianById = async (technicianId) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
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

  const updateBasicInfo = async (data) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/basic', data);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update basic info' };
    }
  };

  const updateSkills = async (skills) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/skills', { skills });
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update skills' };
    }
  };

  const updateLanguages = async (languages) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/languages', { languages });
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update languages' };
    }
  };

  const updateLocation = async (locationData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/location', locationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update location' };
    }
  };

  const updatePricing = async (pricingData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/pricing', pricingData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update pricing' };
    }
  };

  const addServiceCategory = async (categoryData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/technician/profile/service-category', categoryData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add service category' };
    }
  };

  const removeServiceCategory = async (categoryName) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.delete(`/technician/profile/service-category/${encodeURIComponent(categoryName)}`);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove service category' };
    }
  };

  const addPortfolioItem = async (itemData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/technician/profile/portfolio', itemData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add portfolio item' };
    }
  };

  const removePortfolioItem = async (itemId) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.delete(`/technician/profile/portfolio/${itemId}`);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove portfolio item' };
    }
  };

  const addEducation = async (educationData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/technician/profile/education', educationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add education' };
    }
  };

  const addCertification = async (certData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/technician/profile/certifications', certData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add certification' };
    }
  };

  const addExperience = async (expData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/technician/profile/experience', expData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add experience' };
    }
  };

  const updateAvailabilitySchedule = async (scheduleData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/availability', scheduleData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update availability' };
    }
  };

  const toggleAvailability = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.patch('/technician/profile/status', { 
        isAvailable: !technicianProfile?.isAvailable 
      });
      setTechnicianProfile(response.data.technician);
      return { success: true, isAvailable: response.data.isAvailable };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to toggle availability' };
    }
  };

  const updateBusinessInfo = async (businessData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/business', businessData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update business info' };
    }
  };

  const updateSocialLinks = async (socialData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/social-links', socialData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update social links' };
    }
  };

  const updatePrivacySettings = async (privacyData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put('/technician/profile/settings', privacyData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update settings' };
    }
  };

  // ==================== ADMIN FUNCTIONS ====================

  const getAllTechnicians = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      // ✅ No /api prefix - api.js interceptor adds it
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

  const verifyTechnician = async (technicianId, remarks = '') => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put(`/admin/technicians/${technicianId}/verify`, { remarks });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify technician',
      };
    }
  };

  const rejectTechnician = async (technicianId, reason) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put(`/admin/technicians/${technicianId}/reject`, { reason });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to reject technician',
      };
    }
  };

  const updateTechnicianSubscription = async (technicianId, subscriptionData) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.put(`/admin/technicians/${technicianId}/subscription`, subscriptionData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update subscription',
      };
    }
  };

  const getSubscriptionStats = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
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

  const getSubscriptionPlans = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.get('/subscription/plans');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch plans',
      };
    }
  };

  const getCurrentSubscription = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.get('/subscription/current');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch subscription',
      };
    }
  };

  const activateTrial = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/subscription/trial');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to activate trial',
      };
    }
  };

  const upgradeSubscription = async (planId, autoRenew = false) => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
      const response = await api.post('/subscription/upgrade', { planId, autoRenew });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upgrade subscription',
      };
    }
  };

  const cancelAutoRenew = async () => {
    try {
      // ✅ No /api prefix - api.js interceptor adds it
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

  const toggleTokenDisplay = () => {
    setShowToken(!showToken);
  };

  // ==================== ROLE CHECK HELPER PROPERTIES ====================
  
  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';
  const isClient = user?.role === 'client';

  // ==================== INITIALIZATION EFFECT ====================
  
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        // Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setToken(storedToken);
        await fetchUserProfile();
      } else {
        setLoading(false);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== CONTEXT VALUE ====================
  
  const value = {
    // User state
    user,
    technicianProfile,
    token,
    loading,
    showToken,
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
    getTechnicianProfile,
    getTechnicianById,
    
    // Section-specific update functions
    updateBasicInfo,
    updateSkills,
    updateLanguages,
    updateLocation,
    updatePricing,
    addServiceCategory,
    removeServiceCategory,
    addPortfolioItem,
    removePortfolioItem,
    addEducation,
    addCertification,
    addExperience,
    updateAvailabilitySchedule,
    toggleAvailability,
    updateBusinessInfo,
    updateSocialLinks,
    updatePrivacySettings,
    
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
    
    // Utility functions
    toggleTokenDisplay,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};