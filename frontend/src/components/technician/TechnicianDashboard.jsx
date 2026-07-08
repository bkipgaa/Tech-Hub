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
 * 
 * Access: 
 * - Technicians: Full access to edit their own profile
 * - Admins: Read-only access (can view but not edit) for support and monitoring
 * 
 * Admin View Features:
 * - Admin badge displayed at top
 * - All fields are read-only for admins
 * - Can view all technician data for troubleshooting
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

// Import tab components - each tab represents a section of the technician profile
import ProfileTab from './tabs/ProfileTab';        // Basic info, bio, skills
import ServicesTab from './tabs/ServicesTab';      // Services offered, pricing
import PortfolioTab from './tabs/PortfolioTab';    // Work samples, gallery
import CredentialsTab from './tabs/CredentialsTab'; // Education, certifications
import AvailabilityTab from './tabs/AvailabilityTab'; // Working hours, schedule
import BusinessTab from './tabs/BusinessTab';      // Business registration, insurance
import SettingsTab from './tabs/SettingsTab';      // Privacy, notification preferences

// Import common UI components
import Header from './common/Header';                    // Displays technician stats and profile summary
import VerificationBanner from './common/VerificationBanner'; // Shows verification status with actions
import ProfileCompletionBar from './common/ProfileCompletionBar'; // Visual progress bar
import TabNavigation from './common/TabNavigation';      // Tab switching interface

// Import icons from lucide-react for visual elements
import { Edit, Save, X, Shield, Eye } from 'lucide-react';

const TechnicianDashboard = () => {
  // ===== HOOKS & STATE MANAGEMENT =====
  
  // Get technician ID from URL params (for admin viewing specific technician)
  const { id } = useParams();
  
  // Authentication context - provides user data and profile management functions
  const { user, technicianProfile, updateTechnicianProfile, getTechnicianProfile, getTechnicianById } = useAuth();
  const navigate = useNavigate(); // For programmatic navigation
  
  // State for admin viewing another technician's profile
  const [viewingTechnician, setViewingTechnician] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false); // Toggles edit mode on/off
  const [loading, setLoading] = useState(false);     // Shows loading spinner during save
  const [error, setError] = useState('');            // Stores error messages
  const [activeTab, setActiveTab] = useState('profile'); // Currently active tab
  
  /**
   * Determine if user is admin viewing another technician
   * Admins can view but not edit other technicians' profiles
   */
  const isAdminViewing = user?.role === 'admin' && id;
  const canEdit = !isAdminViewing && user?.role === 'technician' && isEditing;
  const isReadOnly = isAdminViewing || (user?.role === 'admin' && !id);
  
  /**
   * Form Data State
   * ===============
   * Complete technician profile data structure.
   * This matches the backend Technician model schema with three-level hierarchy.
   */
  const [formData, setFormData] = useState({
    // Basic Information
    aboutMe: '',
    profileHeadline: '',
    
    // Professional Skills
    skills: [],
    
    // Service Categories - THREE LEVEL HIERARCHY
    mainCategory: '', // Level 1: Main Category (e.g., "IT & Networking")
    serviceCategories: [], // Level 2 & 3: [{ categoryName: '...', subServices: ['...'] }]
    
    // Pricing Structure
    pricing: {
      hourlyRate: 0,
      fixedPrice: 0,
      consultationFee: 0,
      currency: 'KES',
      paymentMethods: ['Cash', 'M-Pesa']
    },
    
    // Educational Background
    education: [],
    
    // Professional Certifications
    certifications: [],
    
    // Work Experience
    yearsOfExperience: 0,
    experience: [],
    
    // Portfolio/Work Samples
    portfolio: [],
    
    // Location Information
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
    
    // Languages Spoken
    languages: [{ name: 'English', proficiency: 'Fluent' }],
    
    // Working Hours (7 days a week)
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
    
    // Business Information
    businessName: '',
    businessRegistrationNumber: '',
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      expiryDate: ''
    },
    
    // Social Media Links
    socialLinks: {
      website: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    },
    
    // Account Settings
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
    
    // Status Flags
    isAvailable: true,
    isActive: true,
    
    // Gallery (legacy support)
    gallery: []
  });

  /**
   * AUTHENTICATION & AUTHORIZATION CHECK
   * ====================================
   * Ensures only authenticated technicians or admins can access this page
   * 
   * Access Rules:
   * 1. Technicians can access their own dashboard (no ID param)
   * 2. Admins can access their own dashboard (no ID param)
   * 3. Admins can view any technician's dashboard (with ID param) - read-only
   * 4. Regular users (customers) are redirected to home
   */
  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      navigate('/login');
      return;
    }

    // Regular users (customers) should not access technician dashboard
    if (user.role === 'client') {
      navigate('/');
      return;
    }

    // Handle admin viewing specific technician
    if (user.role === 'admin' && id) {
      setIsAdminView(true);
      fetchTechnicianById(id);
    } 
    // Handle technician or admin viewing their own dashboard
    else if (user.role === 'technician' || (user.role === 'admin' && !id)) {
      if (!technicianProfile) {
        getTechnicianProfile();
      }
    }
  }, [user, technicianProfile, navigate, getTechnicianProfile, id]);

  /**
   * FETCH TECHNICIAN BY ID (For Admin View)
   * ========================================
   * Admins can fetch and view any technician's profile
   * This is read-only access for support and monitoring
   */
  const fetchTechnicianById = async (technicianId) => {
    setLoading(true);
    try {
      const response = await getTechnicianById(technicianId);
      if (response.success) {
        setViewingTechnician(response.data);
      } else {
        setError('Technician not found');
        navigate('/admin/technicians');
      }
    } catch (error) {
      console.error('Error fetching technician:', error);
      setError('Failed to load technician profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * POPULATE FORM DATA FROM PROFILE
   * ================================
   * When technicianProfile is loaded from backend, update formData state
   * Supports both self-view (technician) and admin-view modes
   * Updated to use mainCategory from the technician profile
   */
  useEffect(() => {
    // Use viewingTechnician for admin view, otherwise use technicianProfile
    const profile = isAdminView ? viewingTechnician : technicianProfile;
    
    if (profile) {
      setFormData({
        aboutMe: profile.aboutMe || '',
        profileHeadline: profile.profileHeadline || '',
        skills: profile.skills || [],
        mainCategory: profile.mainCategory || '', // Changed from category to mainCategory
        serviceCategories: profile.serviceCategories || [], // Level 2 & 3
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
        gallery: profile.portfolio?.map(item => item.mediaUrl) || []
      });
    }
  }, [technicianProfile, viewingTechnician, isAdminView]);

  /**
   * HANDLE INPUT CHANGES
   * ====================
   * Supports nested form fields using dot notation
   * Disabled when in admin read-only mode
   * Updated to handle mainCategory field
   */
  const handleInputChange = (e) => {
    // Don't allow edits in admin view mode
    if (isAdminView) return;
    
    const { name, value, type, checked } = e.target;
    
    // Handle mainCategory specifically (no dot notation needed)
    if (name === 'mainCategory') {
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
   * Only technicians can save changes
   * Admins cannot save changes when viewing other technicians
   * Submits the complete form data including mainCategory
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent admins from editing other technicians' profiles
    if (isAdminView) {
      setError('Admins cannot edit technician profiles. This is read-only mode.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    // Remove gallery from submit data as it's a legacy field
    const { gallery, ...submitData } = formData;
    
    // Validate mainCategory is selected
    if (!submitData.mainCategory) {
      setError('Please select a main category');
      setLoading(false);
      return;
    }
    
    const result = await updateTechnicianProfile(submitData);
    setLoading(false);
    
    if (result.success) {
      setIsEditing(false);
      // Refresh profile data after update
      await getTechnicianProfile();
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  /**
   * LOADING STATE
   * =============
   */
  if ((!technicianProfile && !isAdminView) || (isAdminView && !viewingTechnician && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Get the current profile object
  const currentProfile = isAdminView ? viewingTechnician : technicianProfile;

  /**
   * MAIN RENDER
   * ===========
   */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Admin View Banner - Shows when admin is viewing another technician */}
        {isAdminView && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-blue-800 font-semibold">Admin View Mode</p>
                <p className="text-blue-600 text-sm">
                  You are viewing {viewingTechnician?.userId?.firstName} {viewingTechnician?.userId?.lastName}'s profile. 
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
                <p className="text-purple-800 font-semibold">Admin View</p>
                <p className="text-purple-600 text-sm">
                  You are viewing your own technician profile. You have full edit access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <Header technicianProfile={currentProfile} isAdminView={isAdminView} />

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
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          
          {/* Tab Header with Edit/Cancel Button */}
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'profile' && 'Professional Information'}
              {activeTab === 'services' && 'Services & Pricing'}
              {activeTab === 'portfolio' && 'Work Portfolio'}
              {activeTab === 'credentials' && 'Education & Certifications'}
              {activeTab === 'availability' && 'Availability Schedule'}
              {activeTab === 'business' && 'Business Details'}
              {activeTab === 'settings' && 'Account Settings'}
            </h2>
            
            {/* Edit/Cancel Button - Hidden for admin view mode */}
            {!isAdminView && user?.role === 'technician' && (
              !isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )
            )}
            
            {/* Admin Edit Button (for their own profile only) */}
            {user?.role === 'admin' && !id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile (Admin)</span>
              </button>
            )}
            
            {/* Read-only indicator for admin view */}
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
              {error}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6">
            
            {/* Conditional Rendering of Active Tab Content */}
            {activeTab === 'profile' && (
              <ProfileTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {activeTab === 'services' && (
              <ServicesTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {activeTab === 'portfolio' && (
              <PortfolioTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
              />
            )}
            
            {activeTab === 'credentials' && (
              <CredentialsTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {activeTab === 'availability' && (
              <AvailabilityTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
            {activeTab === 'business' && (
              <BusinessTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={canEdit}
                isReadOnly={isReadOnly}
                handleInputChange={handleInputChange}
              />
            )}
            
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

            {/* Submit Button - Only show when in edit mode and not admin viewing */}
            {canEdit && (
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-600 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
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