import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create the authentication context
const AuthContext = createContext();

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * AuthProvider Component
 * Provides authentication state and methods to all child components
 * Manages user authentication, technician profiles, and API interactions
 */
export const AuthProvider = ({ children }) => {
  // State management
  const [user, setUser] = useState(null);                 // User data from database
  const [technicianProfile, setTechnicianProfile] = useState(null); // Technician profile data
  const [token, setToken] = useState(localStorage.getItem('token')); // JWT token from localStorage
  const [loading, setLoading] = useState(true);           // Loading state for initial auth check
  const [showToken, setShowToken] = useState(false);       // For toggling token display in UI

  // Set axios default header with token if it exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Effect to fetch user profile when token changes
   * Runs on initial load and after login/register
   */
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  /**
   * Fetch user profile from the server
   * Uses the token from localStorage to authenticate
   * If user is a technician, also fetches their technician profile
   */
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/profile');
      setUser(response.data.user);
      
      // If user is a technician, fetch their technician profile
      if (response.data.user.role === 'technician') {
        fetchTechnicianProfile();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout(); // Log out if token is invalid
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch technician profile using the new endpoint structure
   * GET /api/technicians/profile/get
   * This matches the route we created in technicianRoutes.js
   */
  const fetchTechnicianProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/technicians/profile/get');
      setTechnicianProfile(response.data.technician);
    } catch (error) {
      console.error('Error fetching technician profile:', error);
    }
  };

  /**
   * Register a new user
   * POST /api/auth/register
   * @param {Object} userData - User registration data (name, email, password, phone)
   * @returns {Object} Success status and user data or error
   */
  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      const { token, user } = response.data;
      
      // Store token and set default header
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  /**
   * Upgrade existing user to technician role
   * PUT /api/auth/become-technician
   * This updates the user's role in the database
   * @returns {Object} Success status and updated user data
   */
  const becomeTechnician = async () => {
    try {
      console.log('Upgrading user to technician...');
      const response = await axios.put('http://localhost:5000/api/auth/become-technician');
      
      // Update user in state with new role
      setUser(response.data.user);
      
      return { 
        success: true, 
        user: response.data.user,
        message: response.data.message 
      };
    } catch (error) {
      console.error('Become technician error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to upgrade to technician' 
      };
    }
  };

  /**
   * Login user with email and password
   * POST /api/auth/login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object} Success status and user data or error
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      console.log('✅ Login successful! Token received:', token);
      
      // Store token and set default header
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      
      // If user is a technician, fetch their profile
      if (user.role === 'technician') {
        await fetchTechnicianProfile();
      }
      
      return { success: true, user, token };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  /**
   * Logout user - clear token and user data
   */
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setTechnicianProfile(null);
  };

  /**
   * Update user profile information
   * PUT /api/users/profile
   * @param {Object} userData - Updated user data
   * @returns {Object} Success status and updated user data
   */
  const updateUserProfile = async (userData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/users/profile', userData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  /**
   * Create technician profile
   * POST /api/technicians/profile/create
   * This matches the route we created in technicianRoutes.js
   * @param {Object} profileData - Complete technician profile data matching the schema
   * @returns {Object} Success status and created profile
   */
  const createTechnicianProfile = async (profileData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/technicians/profile/create', profileData);
      setTechnicianProfile(response.data.technician);
      
      // Update user role if not already technician
      if (user.role !== 'technician') {
        setUser({ ...user, role: 'technician' });
      }
      
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create technician profile' 
      };
    }
  };

  /**
   * Update technician profile
   * PUT /api/technicians/profile/update
   * Note: This is a general update endpoint. For specific sections,
   * we'll need to add more specific endpoints later.
   * @param {Object} profileData - Updated profile data
   * @returns {Object} Success status and updated profile
   */
  const updateTechnicianProfile = async (profileData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/profile/update', profileData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update technician profile' 
      };
    }
  };

  /**
   * Get technician profile
   * GET /api/technicians/profile/get
   * This matches the route we created in technicianRoutes.js
   * @returns {Object} Success status and technician profile
   */
  const getTechnicianProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/technicians/profile/get');
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to fetch technician profile' 
      };
    }
  };

  /**
   * ====================================
   * SPECIFIC PROFILE SECTION UPDATES
   * These functions will be added as we implement the tab components
   * Each one corresponds to a specific tab in the technician dashboard
   * ====================================
   */

  /**
   * Update basic profile information (Tab 1)
   * PUT /api/technicians/profile/basic/update
   * Updates aboutMe, profileHeadline, category
   */
  const updateBasicInfo = async (data) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/profile/basic/update', data);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update basic info' 
      };
    }
  };

  /**
   * Update skills (Tab 1)
   * PUT /api/technicians/profile/skills/update
   */
  const updateSkills = async (skills) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/profile/skills/update', { skills });
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update skills' 
      };
    }
  };

  /**
   * Update languages (Tab 1)
   * PUT /api/technicians/profile/languages/update
   */
  const updateLanguages = async (languages) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/profile/languages/update', { languages });
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update languages' 
      };
    }
  };

  /**
   * Update location (Tab 1)
   * PUT /api/technicians/profile/location/update
   */
  const updateLocation = async (locationData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/profile/location/update', locationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update location' 
      };
    }
  };

  /**
   * Update pricing (Tab 2)
   * PUT /api/technicians/services/pricing/update
   */
  const updatePricing = async (pricingData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/services/pricing/update', pricingData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update pricing' 
      };
    }
  };

  /**
   * Add service category (Tab 2)
   * POST /api/technicians/services/category/add
   */
  const addServiceCategory = async (categoryData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/technicians/services/category/add', categoryData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add service category' 
      };
    }
  };

  /**
   * Update service category (Tab 2)
   * PUT /api/technicians/services/category/:categoryId/update
   */
  const updateServiceCategory = async (categoryId, categoryData) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/technicians/services/category/${categoryId}/update`, categoryData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update service category' 
      };
    }
  };

  /**
   * Remove service category (Tab 2)
   * DELETE /api/technicians/services/category/:categoryId/remove
   */
  const removeServiceCategory = async (categoryId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/technicians/services/category/${categoryId}/remove`);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to remove service category' 
      };
    }
  };

  /**
   * Add portfolio item (Tab 3)
   * POST /api/technicians/portfolio/item/add
   */
  const addPortfolioItem = async (itemData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/technicians/portfolio/item/add', itemData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add portfolio item' 
      };
    }
  };

  /**
   * Update portfolio item (Tab 3)
   * PUT /api/technicians/portfolio/item/:itemId/update
   */
  const updatePortfolioItem = async (itemId, itemData) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/technicians/portfolio/item/${itemId}/update`, itemData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update portfolio item' 
      };
    }
  };

  /**
   * Remove portfolio item (Tab 3)
   * DELETE /api/technicians/portfolio/item/:itemId/remove
   */
  const removePortfolioItem = async (itemId) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/technicians/portfolio/item/${itemId}/remove`);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to remove portfolio item' 
      };
    }
  };

  /**
   * Add education (Tab 4)
   * POST /api/technicians/education/add
   */
  const addEducation = async (educationData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/technicians/education/add', educationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add education' 
      };
    }
  };

  /**
   * Add certification (Tab 4)
   * POST /api/technicians/certifications/add
   */
  const addCertification = async (certData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/technicians/certifications/add', certData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add certification' 
      };
    }
  };

  /**
   * Add experience (Tab 4)
   * POST /api/technicians/experience/add
   */
  const addExperience = async (expData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/technicians/experience/add', expData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add experience' 
      };
    }
  };

  /**
   * Update availability schedule (Tab 5)
   * PUT /api/technicians/availability/schedule/update
   */
  const updateAvailabilitySchedule = async (scheduleData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/availability/schedule/update', scheduleData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update availability' 
      };
    }
  };

  /**
   * Toggle availability status (Tab 5)
   * PATCH /api/technicians/availability/status/toggle
   */
  const toggleAvailability = async () => {
    try {
      const response = await axios.patch('http://localhost:5000/api/technicians/availability/status/toggle');
      setTechnicianProfile(response.data.technician);
      return { success: true, isAvailable: response.data.isAvailable };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to toggle availability' 
      };
    }
  };

  /**
   * Update business info (Tab 6)
   * PUT /api/technicians/business/info/update
   */
  const updateBusinessInfo = async (businessData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/business/info/update', businessData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update business info' 
      };
    }
  };

  /**
   * Update insurance info (Tab 6)
   * PUT /api/technicians/business/insurance/update
   */
  const updateInsuranceInfo = async (insuranceData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/business/insurance/update', insuranceData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update insurance info' 
      };
    }
  };

  /**
   * Update social links (Tab 6)
   * PUT /api/technicians/business/social/update
   */
  const updateSocialLinks = async (socialData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/business/social/update', socialData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update social links' 
      };
    }
  };

  /**
   * Update privacy settings (Tab 7)
   * PUT /api/technicians/settings/privacy/update
   */
  const updatePrivacySettings = async (privacyData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/settings/privacy/update', privacyData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update privacy settings' 
      };
    }
  };

  /**
   * Update booking settings (Tab 7)
   * PUT /api/technicians/settings/booking/update
   */
  const updateBookingSettings = async (bookingData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/settings/booking/update', bookingData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update booking settings' 
      };
    }
  };

  /**
   * Update notification settings (Tab 7)
   * PUT /api/technicians/settings/notifications/update
   */
  const updateNotificationSettings = async (notificationData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/technicians/settings/notifications/update', notificationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update notification settings' 
      };
    }
  };

  /**
   * Toggle token display for debugging
   */
  const toggleTokenDisplay = () => {
    setShowToken(!showToken);
  };

  /**
   * Context value object containing all state and methods
   * This will be provided to all child components
   */
  const value = {
    // State
    user,
    technicianProfile,
    token,
    loading,
    showToken,
    
    // Auth methods
    register,
    login,
    logout,
    becomeTechnician,
    updateUserProfile,
    
    // Technician profile methods - Main
    createTechnicianProfile,
    updateTechnicianProfile,
    getTechnicianProfile,
    
    // Technician profile methods - Tab 1 (Profile)
    updateBasicInfo,
    updateSkills,
    updateLanguages,
    updateLocation,
    
    // Technician profile methods - Tab 2 (Services)
    updatePricing,
    addServiceCategory,
    updateServiceCategory,
    removeServiceCategory,
    
    // Technician profile methods - Tab 3 (Portfolio)
    addPortfolioItem,
    updatePortfolioItem,
    removePortfolioItem,
    
    // Technician profile methods - Tab 4 (Credentials)
    addEducation,
    addCertification,
    addExperience,
    
    // Technician profile methods - Tab 5 (Availability)
    updateAvailabilitySchedule,
    toggleAvailability,
    
    // Technician profile methods - Tab 6 (Business)
    updateBusinessInfo,
    updateInsuranceInfo,
    updateSocialLinks,
    
    // Technician profile methods - Tab 7 (Settings)
    updatePrivacySettings,
    updateBookingSettings,
    updateNotificationSettings,
    
    // Utility methods
    toggleTokenDisplay
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};