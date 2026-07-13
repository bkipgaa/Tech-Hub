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

  // ==================== PROFILE FETCH FUNCTIONS ====================

  /**
   * Fetch technician profile for current user
   * Uses /technicians/profile endpoint (plural)
   */
  const fetchTechnicianProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping technician profile fetch');
        return null;
      }

      console.log('🔍 Fetching technician profile...');
      const response = await api.get('/technician-public/profile');
      
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        console.log('✅ Technician profile fetched successfully');
        return response.data.data;
      } else {
        console.warn('⚠️ Could not fetch technician profile:', response.data.message);
        setTechnicianProfile(null);
        return null;
      }
    } catch (error) {
      // 404 means no profile yet – that's fine for new technicians
      if (error.response?.status === 404) {
        console.log('ℹ️ No technician profile found (user may not have created one yet)');
        setTechnicianProfile(null);
        return null;
      }
      console.error('❌ Error fetching technician profile:', error);
      setTechnicianProfile(null);
      return null;
    }
  };

  /**
   * Fetch current user profile from backend
   * Uses /auth/profile endpoint
   */
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('🔍 Fetching user profile...');
      
      // ✅ FIXED: Complete the API call with response variable
      const response = await api.get('/auth/profile');
      
      console.log('📦 User profile response:', response.data);
      
      const userData = response.data.user || response.data;
      setUser(userData);

      // Fetch technician profile for technicians and admins
      if (userData.role === 'technician' || userData.role === 'admin') {
        await fetchTechnicianProfile();
      }
      
      return userData;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
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

  // ==================== AUTHENTICATION FUNCTIONS ====================

  /**
   * Register new user (client role by default)
   */
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;

      setAuthToken(token);
      setUser(user);

      return { success: true, user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  /**
   * Login user with email and password
   * ✅ FIXED: Properly stores token and user data
   */
  const login = async (email, password) => {
    try {
      console.log('🔄 Attempting login...');
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('📦 Login response:', response.data);
      
      if (response.data.success) {
        // ✅ Extract token and user from response
        const token = response.data.token;
        const userData = response.data.user;
        
        if (!userData) {
          console.error('❌ No user data in response');
          return { 
            success: false, 
            error: 'No user data received from server' 
          };
        }
        
        // ✅ Store token in localStorage
        localStorage.setItem('token', token);
        
        // ✅ Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // ✅ Set token in axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setToken(token);
        
        // ✅ Set user in state
        setUser(userData);
        
        console.log('✅ Login successful!');
        console.log('  - Token stored:', !!localStorage.getItem('token'));
        console.log('  - User stored:', !!localStorage.getItem('user'));
        console.log('  - User role:', userData.role);
        console.log('  - User email:', userData.email);
        
        // ✅ Fetch technician profile if needed
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
      console.error('❌ Login error:', error);
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
   */
  const becomeTechnician = async () => {
    try {
      const response = await api.put('/auth/become-technician');
      
      // Update user with the new role data from response
      const updatedUser = response.data.user;
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Fetch technician profile after role upgrade
      await fetchTechnicianProfile();
      
      return { 
        success: true, 
        user: updatedUser, 
        message: response.data.message 
      };
    } catch (error) {
      console.error('❌ Become technician error:', error);
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
      const response = await api.put('/users/profile', userData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('❌ Update profile error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Update failed',
      };
    }
  };

  // ==================== TECHNICIAN PROFILE MANAGEMENT ====================

  /**
   * Get technician profile (alias for fetchTechnicianProfile)
   */
  const getTechnicianProfile = async () => {
    return await fetchTechnicianProfile();
  };

  /**
   * Create new technician profile
   */
  const createTechnicianProfile = async (profileData) => {
    try {
      const response = await api.post('/technician/create-profile', profileData);
      
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        
        // Update user role if needed
        if (user && user.role !== 'technician') {
          const updatedUser = { ...user, role: 'technician' };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        return { success: true, technician: response.data.data };
      }
      
      return { 
        success: false, 
        error: response.data.message || 'Failed to create technician profile' 
      };
    } catch (error) {
      console.error('❌ Create profile error:', error);
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
      const response = await api.put('/technician/profile', profileData);
      
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      
      return { 
        success: false, 
        error: response.data.message || 'Failed to update technician profile' 
      };
    } catch (error) {
      console.error('❌ Update profile error:', error);
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
      const response = await api.get(`/technician/${technicianId}`);
      
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      
      return { 
        success: false, 
        error: response.data.message || 'Technician not found' 
      };
    } catch (error) {
      console.error('❌ Error fetching technician:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch technician',
      };
    }
  };

  // ==================== SECTION-SPECIFIC UPDATES ====================

  const updateBasicInfo = async (data) => {
    try {
      const response = await api.put('/technician/profile/basic', data);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update basic info' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update basic info' };
    }
  };

  const updateSkills = async (skills) => {
    try {
      const response = await api.put('/technician/profile/skills', { skills });
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update skills' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update skills' };
    }
  };

  const updateLanguages = async (languages) => {
    try {
      const response = await api.put('/technician/profile/languages', { languages });
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update languages' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update languages' };
    }
  };

  const updateLocation = async (locationData) => {
    try {
      const response = await api.put('/technician/profile/location', locationData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update location' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update location' };
    }
  };

  const updatePricing = async (pricingData) => {
    try {
      const response = await api.put('/technician/profile/pricing', pricingData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update pricing' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update pricing' };
    }
  };

  const addServiceCategory = async (categoryData) => {
    try {
      const response = await api.post('/technician/profile/service-category', categoryData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to add service category' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add service category' };
    }
  };

  const removeServiceCategory = async (categoryName) => {
    try {
      const response = await api.delete(`/technician/profile/service-category/${encodeURIComponent(categoryName)}`);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to remove service category' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove service category' };
    }
  };

  const addPortfolioItem = async (itemData) => {
    try {
      const response = await api.post('/technician/profile/portfolio', itemData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to add portfolio item' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add portfolio item' };
    }
  };

  const removePortfolioItem = async (itemId) => {
    try {
      const response = await api.delete(`/technician/profile/portfolio/${itemId}`);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to remove portfolio item' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove portfolio item' };
    }
  };

  const addEducation = async (educationData) => {
    try {
      const response = await api.post('/technician/profile/education', educationData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to add education' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add education' };
    }
  };

  const addCertification = async (certData) => {
    try {
      const response = await api.post('/technician/profile/certifications', certData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to add certification' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add certification' };
    }
  };

  const addExperience = async (expData) => {
    try {
      const response = await api.post('/technician/profile/experience', expData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to add experience' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add experience' };
    }
  };

  const updateAvailabilitySchedule = async (scheduleData) => {
    try {
      const response = await api.put('/technician/profile/availability', scheduleData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update availability' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update availability' };
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await api.patch('/technician/profile/status', { 
        isAvailable: !technicianProfile?.isAvailable 
      });
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, isAvailable: response.data.data.isAvailable };
      }
      return { success: false, error: response.data.message || 'Failed to toggle availability' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to toggle availability' };
    }
  };

  const updateBusinessInfo = async (businessData) => {
    try {
      const response = await api.put('/technician/profile/business', businessData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update business info' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update business info' };
    }
  };

  const updateSocialLinks = async (socialData) => {
    try {
      const response = await api.put('/technician/profile/social-links', socialData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update social links' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update social links' };
    }
  };

  const updatePrivacySettings = async (privacyData) => {
    try {
      const response = await api.put('/technician/profile/settings', privacyData);
      if (response.data.success) {
        setTechnicianProfile(response.data.data);
        return { success: true, technician: response.data.data };
      }
      return { success: false, error: response.data.message || 'Failed to update settings' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update settings' };
    }
  };

  // ==================== ADMIN FUNCTIONS ====================

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
      const storedUser = localStorage.getItem('user');
      
      console.log('🔍 Auth initialization:');
      console.log('  - Token exists:', !!storedToken);
      console.log('  - Stored user exists:', !!storedUser);
      
      if (storedToken && storedUser) {
        try {
          // Set token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          
          // Restore user from localStorage
          const userData = JSON.parse(storedUser);
          console.log('  - Restored user role:', userData.role);
          console.log('  - Restored user email:', userData.email);
          setUser(userData);
          
          // Fetch fresh user profile
          await fetchUserProfile();
        } catch (error) {
          console.error('❌ Error restoring auth:', error);
          logout();
        }
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