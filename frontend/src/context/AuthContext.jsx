import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api'; // your configured axios instance

// Create the authentication context
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [technicianProfile, setTechnicianProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);

  // Set default Authorization header for api instance
  if (token && !api.defaults.headers.common['Authorization']) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.user);

      if (response.data.user.role === 'technician') {
        await fetchTechnicianProfile();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Corrected technician profile endpoint
  const fetchTechnicianProfile = async () => {
    try {
      const response = await api.get('/technician/profile');
      setTechnicianProfile(response.data.technician);
    } catch (error) {
      // 404 means no profile yet – that's fine
      if (error.response?.status !== 404) {
        console.error('Error fetching technician profile:', error);
      }
    }
  };

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

  const becomeTechnician = async () => {
    try {
      const response = await api.put('/users/become-technician'); // adjust if different
      setUser(response.data.user);
      return { success: true, user: response.data.user, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upgrade to technician',
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);

      if (user.role === 'technician') {
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

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setTechnicianProfile(null);
  };

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

  // ✅ Corrected technician profile creation endpoint
  const createTechnicianProfile = async (profileData) => {
    try {
      const response = await api.post('/technician/profile', profileData);
      setTechnicianProfile(response.data.technician);

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

  // General update (if needed) – you may not use this
 const updateTechnicianProfile = async (profileData) => {
  try {
    const response = await api.put('/technician/profile', profileData);
    setTechnicianProfile(response.data.technician);
    return { success: true, technician: response.data.technician };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update technician profile',
    };
  }
};
  // ------------------------------------------------------------
  //  Section‑specific updates (match your modular controllers)
  // ------------------------------------------------------------
  const updateBasicInfo = async (data) => {
    try {
      const response = await api.put('/technician/profile/basic', data);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update basic info' };
    }
  };

  const updateSkills = async (skills) => {
    try {
      const response = await api.put('/technician/profile/skills', { skills });
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update skills' };
    }
  };

  const updateLanguages = async (languages) => {
    try {
      const response = await api.put('/technician/profile/languages', { languages });
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update languages' };
    }
  };

  const updateLocation = async (locationData) => {
    try {
      const response = await api.put('/technician/profile/location', locationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update location' };
    }
  };

  const updatePricing = async (pricingData) => {
    try {
      const response = await api.put('/technician/profile/pricing', pricingData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update pricing' };
    }
  };

  const addServiceCategory = async (categoryData) => {
    try {
      const response = await api.post('/technician/profile/service-category', categoryData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add service category' };
    }
  };

  const removeServiceCategory = async (categoryName) => {
    try {
      const response = await api.delete(`/technician/profile/service-category/${encodeURIComponent(categoryName)}`);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove service category' };
    }
  };

  const addPortfolioItem = async (itemData) => {
    try {
      const response = await api.post('/technician/profile/portfolio', itemData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add portfolio item' };
    }
  };

  const removePortfolioItem = async (itemId) => {
    try {
      const response = await api.delete(`/technician/profile/portfolio/${itemId}`);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to remove portfolio item' };
    }
  };

  const addEducation = async (educationData) => {
    try {
      const response = await api.post('/technician/profile/education', educationData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add education' };
    }
  };

  const addCertification = async (certData) => {
    try {
      const response = await api.post('/technician/profile/certifications', certData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add certification' };
    }
  };

  const addExperience = async (expData) => {
    try {
      const response = await api.post('/technician/profile/experience', expData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to add experience' };
    }
  };

  const updateAvailabilitySchedule = async (scheduleData) => {
    try {
      const response = await api.put('/technician/profile/availability', scheduleData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update availability' };
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await api.patch('/technician/profile/status', { isAvailable: !technicianProfile?.isAvailable });
      setTechnicianProfile(response.data.technician);
      return { success: true, isAvailable: response.data.isAvailable };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to toggle availability' };
    }
  };

  const updateBusinessInfo = async (businessData) => {
    try {
      const response = await api.put('/technician/profile/business', businessData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update business info' };
    }
  };

  const updateSocialLinks = async (socialData) => {
    try {
      const response = await api.put('/technician/profile/social-links', socialData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update social links' };
    }
  };

  const updatePrivacySettings = async (privacyData) => {
    try {
      const response = await api.put('/technician/profile/settings', privacyData);
      setTechnicianProfile(response.data.technician);
      return { success: true, technician: response.data.technician };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Failed to update settings' };
    }
  };

  const toggleTokenDisplay = () => {
    setShowToken(!showToken);
  };

  const value = {
    user,
    technicianProfile,
    token,
    loading,
    showToken,

    register,
    login,
    logout,
    becomeTechnician,
    updateUserProfile,

    createTechnicianProfile,
    updateTechnicianProfile,
    fetchTechnicianProfile,

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

    toggleTokenDisplay,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};