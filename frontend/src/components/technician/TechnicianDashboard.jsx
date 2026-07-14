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
   * Provides user data and profile management functions
   */
  const { user, technicianProfile, updateTechnicianProfile, getTechnicianProfile, getTechnicianById } = useAuth();
  const navigate = useNavigate(); // For programmatic navigation

  // ============================================================
  // STATE VARIABLES
  // ============================================================
  
  /**
   * LOADING STATES
   * --------------
   * isLoading: True while fetching data from API
   * loading: True while saving data to API
   */
  const [isLoading, setIsLoading] = useState(true); // Initial page load
  const [loading, setLoading] = useState(false);   // Save/update operations
  
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
    aboutMe: '',                    // Bio/description
    profileHeadline: '',            // Short headline/tagline
    
    // --- PROFESSIONAL SKILLS ---
    skills: [],                     // Array of skill objects: { name, level, yearsOfExperience }
    
    // --- SERVICE CATEGORIES (THREE LEVEL HIERARCHY) ---
    mainCategory: '',               // Level 1: e.g., "IT & Networking"
    serviceCategories: [],          // Level 2 & 3: [{ categoryName: '...', subServices: ['...'] }]
    
    // --- PRICING STRUCTURE ---
    pricing: {
      hourlyRate: 0,               // Per hour rate in KES
      fixedPrice: 0,               // Fixed price for common services
      consultationFee: 0,          // Consultation fee
      currency: 'KES',             // Currency code
      paymentMethods: ['Cash', 'M-Pesa'] // Accepted payment methods
    },
    
    // --- EDUCATIONAL BACKGROUND ---
    education: [],                  // Array of education objects
    
    // --- PROFESSIONAL CERTIFICATIONS ---
    certifications: [],            // Array of certification objects
    
    // --- WORK EXPERIENCE ---
    yearsOfExperience: 0,          // Total years of experience
    experience: [],                // Array of work experience objects
    
    // --- PORTFOLIO/WORK SAMPLES ---
    portfolio: [],                 // Array of portfolio items (images, videos, projects)
    
    // --- LOCATION INFORMATION ---
    address: {
      street: '',                  // Street address
      city: '',                    // City
      state: '',                   // State/County
      zipCode: '',                 // Postal code
      country: 'Kenya'             // Country
    },
    location: {
      coordinates: [0, 0],         // [longitude, latitude]
      formattedAddress: '',        // Full formatted address
      placeId: ''                  // Google Places ID
    },
    serviceRadius: 10,             // Service radius in kilometers
    
    // --- LANGUAGES SPOKEN ---
    languages: [{ name: 'English', proficiency: 'Fluent' }], // Array of language objects
    
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
    emergencyAvailable: false,     // Available for emergency calls
    remoteServiceAvailable: false, // Can provide remote services
    weekendAvailable: false,       // Available on weekends
    
    // --- BUSINESS INFORMATION ---
    businessName: '',              // Business/Company name
    businessRegistrationNumber: '', // Registration number
    insuranceInfo: {
      provider: '',                // Insurance provider name
      policyNumber: '',            // Policy number
      expiryDate: ''               // Expiry date
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
      showEmail: false,           // Show email on public profile
      showPhone: true,            // Show phone on public profile
      instantBooking: true,       // Allow instant booking
      requiresApproval: false,    // Require approval for bookings
      autoAcceptJobs: false,      // Auto-accept job requests
      jobReminders: true,         // Send job reminders
      notifications: {
        email: true,              // Email notifications
        sms: true,                // SMS notifications
        push: true               // Push notifications
      }
    },
    
    // --- STATUS FLAGS ---
    isAvailable: true,            // Currently available for work
    isActive: true,               // Account is active
    
    // --- LEGACY SUPPORT ---
    gallery: []                  // Backward compatibility with portfolio
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
 // TechnicianDashboard.js - Update the initDashboard function

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
        // ✅ Check if profile already exists in context
        if (technicianProfile) {
          console.log('✅ Technician profile already loaded in context');
          // Profile is already loaded, nothing to do
        } else {
          console.log('🔍 Fetching technician profile...');
          // ✅ Wait for the profile to be fetched and stored
          const profile = await getTechnicianProfile();
          console.log('📦 Profile fetched:', profile);
          
          // ✅ If still no profile after fetch, redirect to create
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
      // --- Step 6: Stop loading ---
      console.log('✅ Dashboard initialization complete');
      setIsLoading(false);
    }
  };

  initDashboard();
  // ✅ Add technicianProfile to dependencies so it re-runs when it changes
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
    // Determine which profile to use
    const profile = isAdminView ? viewingTechnician : technicianProfile;
    
    // Only update if we have a profile
    if (profile) {
      console.log('📝 Populating form data with profile:', {
        id: profile._id,
        name: profile.userId?.firstName + ' ' + profile.userId?.lastName,
        mainCategory: profile.mainCategory,
        serviceCount: profile.serviceCategories?.length || 0
      });

      // Map profile data to form data structure
      setFormData({
        // Basic Information
        aboutMe: profile.aboutMe || '',
        profileHeadline: profile.profileHeadline || '',
        
        // Professional Skills
        skills: profile.skills || [],
        
        // Service Categories - Three Level Hierarchy
        mainCategory: profile.mainCategory || '',
        serviceCategories: profile.serviceCategories || [],
        
        // Pricing Structure
        pricing: profile.pricing || {
          hourlyRate: 0,
          fixedPrice: 0,
          consultationFee: 0,
          currency: 'KES',
          paymentMethods: ['Cash', 'M-Pesa']
        },
        
        // Educational Background
        education: profile.education || [],
        
        // Professional Certifications
        certifications: profile.certifications || [],
        
        // Work Experience
        yearsOfExperience: profile.yearsOfExperience || 0,
        experience: profile.experience || [],
        
        // Portfolio/Work Samples
        portfolio: profile.portfolio || [],
        
        // Location Information
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
        
        // Languages Spoken
        languages: profile.languages || [{ name: 'English', proficiency: 'Fluent' }],
        
        // Working Hours (7 days a week)
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
        
        // Business Information
        businessName: profile.businessName || '',
        businessRegistrationNumber: profile.businessRegistrationNumber || '',
        insuranceInfo: profile.insuranceInfo || {
          provider: '',
          policyNumber: '',
          expiryDate: ''
        },
        
        // Social Media Links
        socialLinks: profile.socialLinks || {
          website: '',
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: '',
          youtube: '',
          tiktok: ''
        },
        
        // Account Settings
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
        
        // Status Flags
        isAvailable: profile.isAvailable !== undefined ? profile.isAvailable : true,
        isActive: profile.isActive !== undefined ? profile.isActive : true,
        
        // Legacy support - convert portfolio to gallery
        gallery: profile.portfolio?.map(item => item.mediaUrl) || []
      });
    }
  }, [technicianProfile, viewingTechnician, isAdminView]);

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
    // --- Prevent edits in admin view mode ---
    if (isAdminView) {
      console.warn('⚠️ Edit attempted in admin view mode - blocked');
      return;
    }
    
    // --- Extract input properties ---
    const { name, value, type, checked } = e.target;
    
    // --- Special handling for mainCategory (Level 1) ---
    if (name === 'mainCategory') {
      console.log(`📝 Setting mainCategory to: ${value}`);
      setFormData({
        ...formData,
        mainCategory: value
      });
      return;
    }
    
    // --- Handle nested fields using dot notation ---
    if (name.includes('.')) {
      const parts = name.split('.');
      
      // --- Two levels deep: parent.child ---
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        });
      } 
      // --- Three levels deep: parent.child.grandchild ---
      else if (parts.length === 3) {
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
    } 
    // --- Handle top-level fields (no dot notation) ---
    else {
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
    // --- Prevent default form submission ---
    e.preventDefault();
    
    // --- Block admins from editing other technicians' profiles ---
    if (isAdminView) {
      setError('Admins cannot edit technician profiles. This is read-only mode.');
      console.warn('⚠️ Admin attempted to edit technician profile - blocked');
      return;
    }
    
    // --- Clear previous errors ---
    setError('');
    setLoading(true);
    
    // --- Remove legacy gallery field (not needed for API) ---
    const { gallery, ...submitData } = formData;
    
    // --- Validate required fields ---
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
    
    // --- Submit to API ---
    const result = await updateTechnicianProfile(submitData);
    
    // --- Stop loading ---
    setLoading(false);
    
    // --- Handle response ---
    if (result.success) {
      console.log('✅ Profile updated successfully');
      setIsEditing(false); // Exit edit mode
      await getTechnicianProfile(); // Refresh profile data
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
  
  /**
   * Show loading spinner while data is being fetched
   * This prevents flash of empty content
   */
  if (isLoading) {
    console.log('⏳ Dashboard loading...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          {/* Animated spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: PROFILE NOT FOUND
  // ============================================================
  
  /**
   * Handle case where profile doesn't exist after loading
   * Different behavior for admins vs technicians
   */
  // TechnicianDashboard.js - After the loading state

// ============================================================
// RENDER: PROFILE NOT FOUND
// ============================================================

/**
 * Handle case where profile doesn't exist after loading
 * Different behavior for admins vs technicians
 */
// TechnicianDashboard.js - Update the profile check

// ============================================================
// RENDER: PROFILE NOT FOUND
// ============================================================

if (!currentProfile && !isLoading) {
  console.warn('⚠️ No profile found after loading');
  
  // ✅ IMPORTANT: If we're still fetching, don't redirect
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
  
  // --- Admin view: Show error and provide back button ---
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
  
  // ✅ Only redirect if we've confirmed no profile exists
  // Check if we've actually tried to fetch the profile
  if (!technicianProfile && !isLoading) {
    console.log('🔄 No technician profile, redirecting to create...');
    navigate('/create-technician-profile');
    return null;
  }
  
  // If we have technicianProfile but currentProfile is null, use it
  if (technicianProfile && !currentProfile) {
    console.log('✅ Using technicianProfile from context');
    // The component will re-render with the correct profile
  }
}
  // ============================================================
  // RENDER: MAIN DASHBOARD
  // ============================================================
  
  /**
   * Main dashboard render
   * Shows all sections with appropriate access controls
   */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* ============================================================
            ADMIN VIEW BANNER
            Shows when admin is viewing another technician's profile
            ============================================================ */}
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
        
        {/* ============================================================
            ADMIN SELF-VIEW BANNER
            Shows when admin is viewing their own technician profile
            ============================================================ */}
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

        {/* ============================================================
            HEADER SECTION
            Displays technician stats and profile summary
            ============================================================ */}
        <Header 
          technicianProfile={currentProfile} 
          isAdminView={isAdminView} 
        />

        {/* ============================================================
            VERIFICATION BANNER
            Shows verification status with action buttons
            ============================================================ */}
        <VerificationBanner 
          status={currentProfile?.verificationStatus} 
          isAdminView={isAdminView}
          technicianId={currentProfile?._id}
        />

        {/* ============================================================
            PROFILE COMPLETION BAR
            Visual progress bar showing how complete the profile is
            ============================================================ */}
        <ProfileCompletionBar 
          percentage={currentProfile?.profileCompletionPercentage} 
          isAdminView={isAdminView}
        />

        {/* ============================================================
            TAB NAVIGATION
            Allows switching between different profile sections
            ============================================================ */}
        <TabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* ============================================================
            MAIN CONTENT AREA
            Displays the active tab content
            ============================================================ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          
          {/* ==========================================================
              TAB HEADER
              Shows the current tab title with edit/cancel buttons
              ========================================================== */}
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
            
            {/* --- Tab Title --- */}
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'profile' && '📋 Professional Information'}
              {activeTab === 'services' && '🔧 Services & Pricing'}
              {activeTab === 'portfolio' && '🖼️ Work Portfolio'}
              {activeTab === 'credentials' && '🎓 Education & Certifications'}
              {activeTab === 'availability' && '📅 Availability Schedule'}
              {activeTab === 'business' && '🏢 Business Details'}
              {activeTab === 'settings' && '⚙️ Account Settings'}
            </h2>
            
            {/* --- Edit Button (Technicians only) --- */}
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
                    // Reset form data to original profile
                    const profile = isAdminView ? viewingTechnician : technicianProfile;
                    if (profile) {
                      // Re-populate form data from profile
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
            
            {/* --- Edit Button (Admin viewing own profile) --- */}
            {user?.role === 'admin' && !id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile (Admin)</span>
              </button>
            )}
            
            {/* --- Read-only indicator (Admin viewing other technician) --- */}
            {isAdminView && (
              <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Read-Only Mode</span>
              </div>
            )}
          </div>

          {/* ==========================================================
              ERROR MESSAGE DISPLAY
              Shows validation or API errors
              ========================================================== */}
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          {/* ==========================================================
              PROFILE FORM
              Contains all tab content with form fields
              ========================================================== */}
          <form onSubmit={handleSubmit} className="p-6">
            
            {/* --- Conditionally render active tab content --- */}
            
            {/* Tab 1: Profile - Basic info, bio, skills */}
            {activeTab === 'profile' && (
              <ProfileTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 2: Services - Services offered, pricing */}
            {activeTab === 'services' && (
              <ServicesTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 3: Portfolio - Work samples, gallery */}
            {activeTab === 'portfolio' && (
              <PortfolioTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
              />
            )}
            
            {/* Tab 4: Credentials - Education, certifications */}
            {activeTab === 'credentials' && (
              <CredentialsTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 5: Availability - Working hours, schedule */}
            {activeTab === 'availability' && (
              <AvailabilityTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 6: Business - Business registration, insurance */}
            {activeTab === 'business' && (
              <BusinessTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {/* Tab 7: Settings - Privacy, notification preferences */}
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

            {/* ==========================================================
                SAVE BUTTON
                Only shown when in edit mode and user has permission
                ========================================================== */}
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