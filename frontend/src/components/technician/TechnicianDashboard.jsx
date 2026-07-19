/**
 * TechnicianDashboard Component
 * =============================
 * 
 * Purpose: Main dashboard for technicians to manage their profile, services,
 *          portfolio, credentials, availability, business info, and settings.
 * 
 * Features:
 * - Tab-based navigation (7 tabs for different profile sections)
 * - Edit mode toggle for updating information
 * - Form validation and submission
 * - Profile completion tracking
 * - Verification status display
 * - Admin view mode (read-only for support)
 * 
 * Access Control:
 * - Technicians: Full access to edit their own profile
 * - Admins viewing own profile: Full edit access
 * - Admins viewing other technicians: Read-only access
 * - Regular users (clients): Redirected to home
 * 
 * @version 2.0.0
 * @author Weba-Hub Team
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

// Import tab components - each tab represents a section of the technician profile
import ProfileTab from './tabs/ProfileTab';          // Basic info, bio, skills
import ServicesTab from './tabs/ServicesTab';        // Services offered, pricing
import PortfolioTab from './tabs/PortfolioTab';      // Work samples, gallery
import CredentialsTab from './tabs/CredentialsTab';  // Education, certifications
import AvailabilityTab from './tabs/AvailabilityTab'; // Working hours, schedule
import BusinessTab from './tabs/BusinessTab';        // Business registration, insurance
import SettingsTab from './tabs/SettingsTab';        // Privacy, notification preferences

// Import common UI components
import Header from './common/Header';                     // Technician stats and profile summary
import VerificationBanner from './common/VerificationBanner'; // Verification status with actions
import ProfileCompletionBar from './common/ProfileCompletionBar'; // Visual progress bar
import TabNavigation from './common/TabNavigation';       // Tab switching interface

// Import icons from lucide-react for visual elements
import { Edit, Save, X, Shield, Eye } from 'lucide-react';

const TechnicianDashboard = () => {
  // ============================================================
  // HOOKS & STATE MANAGEMENT
  // ============================================================
  
  /**
   * Get technician ID from URL params (for admin viewing specific technician)
   * Example: /technician-dashboard/12345 where 12345 is the technician ID
   */
  const { id } = useParams();
  
  /**
   * Authentication Context
   * Provides user data, profile management, and service category functions
   */
  const { 
    user, 
    technicianProfile, 
    updateTechnicianProfile, 
    getTechnicianProfile, 
    getTechnicianById,
    addServiceCategory,        // ✅ New: add service category API
    removeServiceCategory      // ✅ New: remove service category API
  } = useAuth();
  
  const navigate = useNavigate(); // For programmatic navigation

  // ============================================================
  // STATE VARIABLES
  // ============================================================
  
  /**
   * LOADING STATES
   * --------------
   * isLoading: True while fetching data from API
   * loading: True while saving data to API
   * serviceUpdateLoading: True while adding/removing service categories
   */
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serviceUpdateLoading, setServiceUpdateLoading] = useState(false);
  
  /**
   * ADMIN VIEW MODE
   * ---------------
   * When an admin is viewing another technician's profile
   * All fields become read-only
   */
  const [viewingTechnician, setViewingTechnician] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);
  
  /**
   * UI STATE
   * ---------
   * isEditing: Toggles edit mode on/off
   * error: Stores error messages to display
   * activeTab: Currently selected tab ('profile', 'services', etc.)
   */
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================
  
  /**
   * Determine if current user is an admin viewing another technician
   */
  const isAdminViewing = user?.role === 'admin' && id;
  
  /**
   * Determine if user can edit the profile
   * - Technicians can edit their own profile when in edit mode
   * - Admins cannot edit other technicians' profiles
   */
  const canEdit = !isAdminViewing && user?.role === 'technician' && isEditing;
  
  /**
   * Determine if profile is read-only
   * - Admin viewing another technician: Read-only
   * - Admin viewing own profile: Editable (when isEditing is true)
   */
  const isReadOnly = isAdminViewing || (user?.role === 'admin' && !id);

  // ============================================================
  // FORM DATA STATE
  // ============================================================
  
  /**
   * Complete technician profile data structure
   * This matches the backend Technician model schema
   * All fields are initialized with default values
   */
  const [formData, setFormData] = useState({
    // --- BASIC INFORMATION ---
    aboutMe: '',
    profileHeadline: '',
    
    // --- PROFESSIONAL SKILLS ---
    skills: [],
    
    // --- SERVICE CATEGORIES (THREE LEVEL HIERARCHY) ---
    mainCategory: '',
    serviceCategories: [],
    
    // --- PRICING STRUCTURE ---
    pricing: {
      hourlyRate: 0,
      fixedPrice: 0,
      consultationFee: 0,
      currency: 'KES',
      paymentMethods: ['Cash', 'M-Pesa']
    },
    
    // --- EDUCATIONAL BACKGROUND ---
    education: [],
    
    // --- PROFESSIONAL CERTIFICATIONS ---
    certifications: [],
    
    // --- WORK EXPERIENCE ---
    yearsOfExperience: 0,
    experience: [],
    
    // --- PORTFOLIO/WORK SAMPLES ---
    portfolio: [],
    
    // --- LOCATION INFORMATION ---
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Kenya'
    },
    location: {
      coordinates: [0, 0],
      formattedAddress: '',
      placeId: ''
    },
    serviceRadius: 10,
    
    // --- LANGUAGES SPOKEN ---
    languages: [{ name: 'English', proficiency: 'Fluent' }],
    
    // --- WORKING HOURS (7 days a week) ---
    availability: {
      monday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
      tuesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
      wednesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
      thursday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
      friday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
      saturday: { enabled: false, hours: [] },
      sunday: { enabled: false, hours: [] }
    },
    emergencyAvailable: false,
    remoteServiceAvailable: false,
    weekendAvailable: false,
    
    // --- BUSINESS INFORMATION ---
    businessName: '',
    businessRegistrationNumber: '',
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      expiryDate: ''
    },
    
    // --- SOCIAL MEDIA LINKS ---
    socialLinks: {
      website: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    },
    
    // --- ACCOUNT SETTINGS ---
    settings: {
      showEmail: false,
      showPhone: true,
      instantBooking: true,
      requiresApproval: false,
      autoAcceptJobs: false,
      jobReminders: true,
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    },
    
    // --- STATUS FLAGS ---
    isAvailable: true,
    isActive: true,
    
    // --- LEGACY SUPPORT ---
    gallery: []
  });

  // ============================================================
  // EFFECT HOOKS
  // ============================================================

  /**
   * EFFECT 1: AUTHENTICATION & AUTHORIZATION CHECK
   * =============================================
   * 
   * Runs when the component mounts or when user/id changes
   * Ensures only authorized users can access this page
   * 
   * Access Rules:
   * 1. Technicians can access their own dashboard (no ID param)
   * 2. Admins can access their own dashboard (no ID param) - full edit access
   * 3. Admins can view any technician's dashboard (with ID param) - read-only
   * 4. Regular users (customers) are redirected to home
   * 
   * Loading Flow:
   * 1. Set isLoading = true
   * 2. Check user authentication
   * 3. Fetch appropriate profile data
   * 4. Set isLoading = false
   */
  useEffect(() => {
    const initDashboard = async () => {
      // --- Step 1: Check if user is logged in ---
      if (!user) {
        console.log('🔒 No user found, redirecting to login...');
        navigate('/login');
        return;
      }

      // --- Step 2: Check user role ---
      if (user.role === 'client') {
        console.log('🚫 Client users cannot access technician dashboard');
        navigate('/');
        return;
      }

      // --- Step 3: Start loading ---
      setIsLoading(true);

      try {
        // --- Step 4: Admin viewing specific technician ---
        if (user.role === 'admin' && id) {
          console.log(`🔍 Admin viewing technician ID: ${id}`);
          setIsAdminView(true);
          
          const response = await getTechnicianById(id);
          if (response.success) {
            setViewingTechnician(response.data);
            console.log('✅ Technician loaded for admin view');
          } else {
            setError('Technician not found');
            navigate('/admin/technicians');
          }
        } 
        // --- Step 5: Technician or admin viewing own dashboard ---
        else if (user.role === 'technician' || (user.role === 'admin' && !id)) {
          if (technicianProfile) {
            console.log('✅ Technician profile already loaded in context');
          } else {
            console.log('🔍 Fetching technician profile...');
            const profile = await getTechnicianProfile();
            console.log('📦 Profile fetched:', profile);
            
            if (!profile) {
              console.log('ℹ️ No technician profile exists, redirecting to create...');
              navigate('/create-technician-profile');
              return;
            }
          }
        }
      } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        setError('Failed to load profile. Please try again.');
      } finally {
        console.log('✅ Dashboard initialization complete');
        setIsLoading(false);
      }
    };

    initDashboard();
  }, [user, id, navigate, getTechnicianProfile, getTechnicianById, technicianProfile]);

  /**
   * EFFECT 2: POPULATE FORM DATA FROM PROFILE
   * =========================================
   * 
   * Runs when technicianProfile or viewingTechnician changes
   * Copies profile data from context into formData state
   * 
   * This separation allows:
   * - Form data to be edited independently
   * - Easy reset/cancel functionality
   * - Clean separation between data and UI state
   * 
   * Supports both:
   * - Self-view (technicianProfile from context)
   * - Admin-view (viewingTechnician from API)
   */
  useEffect(() => {
    const profile = isAdminView ? viewingTechnician : technicianProfile;
    
    if (profile) {
      console.log('📝 Populating form data with profile:', {
        id: profile._id,
        name: profile.userId?.firstName + ' ' + profile.userId?.lastName,
        mainCategory: profile.mainCategory,
        serviceCount: profile.serviceCategories?.length || 0
      });

      setFormData({
        aboutMe: profile.aboutMe || '',
        profileHeadline: profile.profileHeadline || '',
        skills: profile.skills || [],
        mainCategory: profile.mainCategory || '',
        serviceCategories: profile.serviceCategories || [],
        pricing: profile.pricing || {
          hourlyRate: 0,
          fixedPrice: 0,
          consultationFee: 0,
          currency: 'KES',
          paymentMethods: ['Cash', 'M-Pesa']
        },
        education: profile.education || [],
        certifications: profile.certifications || [],
        yearsOfExperience: profile.yearsOfExperience || 0,
        experience: profile.experience || [],
        portfolio: profile.portfolio || [],
        address: profile.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Kenya'
        },
        location: profile.location || {
          coordinates: [0, 0],
          formattedAddress: '',
          placeId: ''
        },
        serviceRadius: profile.serviceRadius || 10,
        languages: profile.languages || [{ name: 'English', proficiency: 'Fluent' }],
        availability: profile.availability || {
          monday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          tuesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          wednesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          thursday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          friday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          saturday: { enabled: false, hours: [] },
          sunday: { enabled: false, hours: [] }
        },
        emergencyAvailable: profile.emergencyAvailable || false,
        remoteServiceAvailable: profile.remoteServiceAvailable || false,
        weekendAvailable: profile.weekendAvailable || false,
        businessName: profile.businessName || '',
        businessRegistrationNumber: profile.businessRegistrationNumber || '',
        insuranceInfo: profile.insuranceInfo || {
          provider: '',
          policyNumber: '',
          expiryDate: ''
        },
        socialLinks: profile.socialLinks || {
          website: '',
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: '',
          youtube: '',
          tiktok: ''
        },
        settings: profile.settings || {
          showEmail: false,
          showPhone: true,
          instantBooking: true,
          requiresApproval: false,
          autoAcceptJobs: false,
          jobReminders: true,
          notifications: {
            email: true,
            sms: true,
            push: true
          }
        },
        isAvailable: profile.isAvailable !== undefined ? profile.isAvailable : true,
        isActive: profile.isActive !== undefined ? profile.isActive : true,
        gallery: profile.portfolio?.map(item => item.mediaUrl) || []
      });
    }
  }, [technicianProfile, viewingTechnician, isAdminView]);

  // ============================================================
  // SERVICE CATEGORY HANDLERS (NEW)
  // ============================================================

  /**
   * Add a new service category
   * Calls AuthContext, updates formData, refreshes profile
   * @param {Object} categoryData - { categoryName, subServices }
   * @returns {Object} { success: boolean, error: string }
   */
  const handleAddServiceCategory = async (categoryData) => {
    setServiceUpdateLoading(true);
    try {
      const result = await addServiceCategory(categoryData);
      if (result.success) {
        const updatedProfile = result.technician;
        setFormData(prev => ({
          ...prev,
          serviceCategories: updatedProfile.serviceCategories || []
        }));
        await getTechnicianProfile(); // refresh context
        return { success: true };
      } else {
        setError(result.error || 'Failed to add service category');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error adding service category:', error);
      setError('Failed to add service category');
      return { success: false, error: 'Failed to add service category' };
    } finally {
      setServiceUpdateLoading(false);
    }
  };

  /**
   * Remove a service category
   * Calls AuthContext, updates formData, refreshes profile
   * @param {string} categoryName - Name of the category to remove
   * @returns {Object} { success: boolean, error: string }
   */
  const handleRemoveServiceCategory = async (categoryName) => {
    setServiceUpdateLoading(true);
    try {
      const result = await removeServiceCategory(categoryName);
      if (result.success) {
        const updatedProfile = result.technician;
        setFormData(prev => ({
          ...prev,
          serviceCategories: updatedProfile.serviceCategories || []
        }));
        await getTechnicianProfile();
        return { success: true };
      } else {
        setError(result.error || 'Failed to remove service category');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error removing service category:', error);
      setError('Failed to remove service category');
      return { success: false, error: 'Failed to remove service category' };
    } finally {
      setServiceUpdateLoading(false);
    }
  };

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  /**
   * HANDLE INPUT CHANGES
   * ====================
   * 
   * Supports nested form fields using dot notation
   * Example: 'pricing.hourlyRate' updates formData.pricing.hourlyRate
   * 
   * Also handles checkbox inputs (type === 'checkbox')
   * Special handling for 'mainCategory' field (no dot notation)
   * 
   * @param {Event} e - The input change event
   * 
   * @disabled When in admin view mode (isAdminView = true)
   */
  const handleInputChange = (e) => {
    if (isAdminView) {
      console.warn('⚠️ Edit attempted in admin view mode - blocked');
      return;
    }
    
    const { name, value, type, checked } = e.target;
    
    if (name === 'mainCategory') {
      console.log(`📝 Setting mainCategory to: ${value}`);
      setFormData({
        ...formData,
        mainCategory: value
      });
      return;
    }
    
    if (name.includes('.')) {
      const parts = name.split('.');
      
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        });
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: {
              ...formData[parent]?.[child],
              [grandchild]: type === 'checkbox' ? checked : value
            }
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  /**
   * HANDLE FORM SUBMISSION
   * ======================
   * 
   * Saves the updated profile data to the backend
   * 
   * Flow:
   * 1. Validate user permissions (admin view blocked)
   * 2. Validate required fields (mainCategory must be selected)
   * 3. Remove legacy fields (gallery)
   * 4. Submit to API via updateTechnicianProfile
   * 5. On success: Exit edit mode, refresh profile
   * 6. On error: Display error message
   * 
   * @param {Event} e - The form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isAdminView) {
      setError('Admins cannot edit technician profiles. This is read-only mode.');
      console.warn('⚠️ Admin attempted to edit technician profile - blocked');
      return;
    }
    
    setError('');
    setLoading(true);
    
    const { gallery, ...submitData } = formData;
    
    if (!submitData.mainCategory) {
      setError('Please select a main category');
      setLoading(false);
      console.warn('⚠️ Form submission failed: mainCategory is required');
      return;
    }
    
    console.log('📤 Submitting profile update:', {
      mainCategory: submitData.mainCategory,
      serviceCategories: submitData.serviceCategories?.length || 0,
      skills: submitData.skills?.length || 0,
      isAvailable: submitData.isAvailable
    });
    
    const result = await updateTechnicianProfile(submitData);
    
    setLoading(false);
    
    if (result.success) {
      console.log('✅ Profile updated successfully');
      setIsEditing(false);
      await getTechnicianProfile();
    } else {
      console.error('❌ Profile update failed:', result.error);
      setError(result.error || 'Failed to update profile');
    }
  };

  // ============================================================
  // RENDER HELPERS
  // ============================================================

  /**
   * Get the current profile object
   * Returns viewingTechnician for admin view, technicianProfile otherwise
   */
  const currentProfile = isAdminView ? viewingTechnician : technicianProfile;

  // ============================================================
  // RENDER: LOADING STATE
  // ============================================================
  
  if (isLoading) {
    console.log('⏳ Dashboard loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: PROFILE NOT FOUND
  // ============================================================
  
  if (!currentProfile && !isLoading) {
    console.warn('⚠️ No profile found after loading');
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      );
    }
    
    if (isAdminView) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <p className="text-xl text-gray-700">Technician profile not found</p>
            <button
              onClick={() => navigate('/admin/technicians')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Technicians
            </button>
          </div>
        </div>
      );
    }
    
    if (!technicianProfile && !isLoading) {
      console.log('🔄 No technician profile, redirecting to create...');
      navigate('/create-technician-profile');
      return null;
    }
    
    if (technicianProfile && !currentProfile) {
      console.log('✅ Using technicianProfile from context');
    }
  }

  // ============================================================
  // RENDER: MAIN DASHBOARD
  // ============================================================
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Admin View Banner */}
        {isAdminView && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-blue-800 font-semibold">🔒 Admin View Mode</p>
                <p className="text-blue-600 text-sm">
                  You are viewing <strong>
                    {viewingTechnician?.userId?.firstName} {viewingTechnician?.userId?.lastName}
                  </strong>'s profile. 
                  This is read-only mode for support and monitoring purposes.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/technicians')}
                className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                Back to Technicians
              </button>
            </div>
          </div>
        )}
        
        {/* Admin Self-View Banner */}
        {user?.role === 'admin' && !id && (
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-purple-800 font-semibold">👁️ Admin View</p>
                <p className="text-purple-600 text-sm">
                  You are viewing your own technician profile. You have full edit access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <Header 
          technicianProfile={currentProfile} 
          isAdminView={isAdminView} 
        />

        {/* Verification Banner */}
        <VerificationBanner 
          status={currentProfile?.verificationStatus} 
          isAdminView={isAdminView}
          technicianId={currentProfile?._id}
        />

        {/* Profile Completion Bar */}
        <ProfileCompletionBar 
          percentage={currentProfile?.profileCompletionPercentage} 
          isAdminView={isAdminView}
        />

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          
          {/* Tab Header */}
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
            
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'profile' && '📋 Professional Information'}
              {activeTab === 'services' && '🔧 Services & Pricing'}
              {activeTab === 'portfolio' && '🖼️ Work Portfolio'}
              {activeTab === 'credentials' && '🎓 Education & Certifications'}
              {activeTab === 'availability' && '📅 Availability Schedule'}
              {activeTab === 'business' && '🏢 Business Details'}
              {activeTab === 'settings' && '⚙️ Account Settings'}
            </h2>
            
            {/* Edit Button (Technicians only) */}
            {!isAdminView && user?.role === 'technician' && (
              !isEditing ? (
                <button
                  onClick={() => {
                    console.log('✏️ Entering edit mode');
                    setIsEditing(true);
                  }}
                  className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    console.log('❌ Cancelling edit mode');
                    setIsEditing(false);
                    const profile = isAdminView ? viewingTechnician : technicianProfile;
                    if (profile) {
                      const { gallery, ...rest } = profile;
                      setFormData({
                        ...rest,
                        gallery: profile.portfolio?.map(item => item.mediaUrl) || []
                      });
                    }
                  }}
                  className="bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )
            )}
            
            {/* Edit Button (Admin viewing own profile) */}
            {user?.role === 'admin' && !id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile (Admin)</span>
              </button>
            )}
            
            {/* Read-only indicator (Admin viewing other technician) */}
            {isAdminView && (
              <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Read-Only Mode</span>
              </div>
            )}
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6">
            
            {/* Tab 1: Profile */}
            {activeTab === 'profile' && (
              <ProfileTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 2: Services - WITH SERVICE CATEGORY HANDLERS */}
            {activeTab === 'services' && (
              <ServicesTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
                onAddServiceCategory={handleAddServiceCategory}       // ✅ new
                onRemoveServiceCategory={handleRemoveServiceCategory} // ✅ new
                isSaving={serviceUpdateLoading}                       // ✅ new
              />
            )}
            
            {/* Tab 3: Portfolio */}
            {activeTab === 'portfolio' && (
              <PortfolioTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
              />
            )}
            
            {/* Tab 4: Credentials */}
            {activeTab === 'credentials' && (
              <CredentialsTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 5: Availability */}
            {activeTab === 'availability' && (
              <AvailabilityTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 6: Business */}
            {activeTab === 'business' && (
              <BusinessTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 7: Settings */}
            {activeTab === 'settings' && (
              <SettingsTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
                user={isAdminView ? viewingTechnician?.userId : user}
              />
            )}

            {/* Save Button */}
            {canEdit && (
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-600 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {loading ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;