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
 * @version 3.0.0 - Supports multiple main categories with primary sync
 * @author Weba-Hub Team
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

// Import tab components
import ProfileTab from './tabs/ProfileTab';
import ServicesTab from './tabs/ServicesTab';
import PortfolioTab from './tabs/PortfolioTab';
import CredentialsTab from './tabs/CredentialsTab';
import AvailabilityTab from './tabs/AvailabilityTab';
import BusinessTab from './tabs/BusinessTab';
import SettingsTab from './tabs/SettingsTab';

// Import common UI components
import Header from './common/Header';
import VerificationBanner from './common/VerificationBanner';
import ProfileCompletionBar from './common/ProfileCompletionBar';
import TabNavigation from './common/TabNavigation';

// Import icons
import { Edit, Save, X, Shield, Eye } from 'lucide-react';

const TechnicianDashboard = () => {
  // ============================================================
  // HOOKS & STATE MANAGEMENT
  // ============================================================
  
  const { id } = useParams();
  
  const { 
    user, 
    technicianProfile, 
    updateTechnicianProfile, 
    getTechnicianProfile, 
    getTechnicianById,
    addServiceCategory,
    removeServiceCategory
  } = useAuth();
  
  const navigate = useNavigate();

  // ============================================================
  // STATE VARIABLES
  // ============================================================
  
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serviceUpdateLoading, setServiceUpdateLoading] = useState(false);
  
  const [viewingTechnician, setViewingTechnician] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Ref to prevent infinite loops when syncing mainCategory
  const isSyncingRef = useRef(false);

  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================
  
  const isAdminViewing = user?.role === 'admin' && id;
  const canEdit = !isAdminViewing && user?.role === 'technician' && isEditing;
  const isReadOnly = isAdminViewing || (user?.role === 'admin' && !id);

  // ============================================================
  // FORM DATA STATE – KEEP BOTH mainCategory AND mainCategories
  // ============================================================
  
  const [formData, setFormData] = useState({
    aboutMe: '',
    profileHeadline: '',
    skills: [],
    
    // ✅ Keep both: primary single category and array for multiple
    mainCategory: '',               // ← primary (first one)
    mainCategories: [],             // ← full list
    
    serviceCategories: [],
    pricing: {
      hourlyRate: 0,
      fixedPrice: 0,
      consultationFee: 0,
      currency: 'KES',
      paymentMethods: ['Cash', 'M-Pesa']
    },
    education: [],
    certifications: [],
    yearsOfExperience: 0,
    experience: [],
    portfolio: [],
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
    languages: [{ name: 'English', proficiency: 'Fluent' }],
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
    businessName: '',
    businessRegistrationNumber: '',
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      expiryDate: ''
    },
    socialLinks: {
      website: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    },
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
    isAvailable: true,
    isActive: true,
    gallery: []
  });

  // ============================================================
  // SYNC: mainCategory ↔ mainCategories[0]
  // ============================================================
  
  /**
   * Whenever mainCategories changes, update mainCategory to the first item (or empty).
   * Uses a ref to prevent recursive loops.
   */
  useEffect(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    const newMainCategory = formData.mainCategories && formData.mainCategories.length > 0
      ? formData.mainCategories[0]
      : '';

    if (formData.mainCategory !== newMainCategory) {
      setFormData(prev => ({
        ...prev,
        mainCategory: newMainCategory
      }));
    }

    isSyncingRef.current = false;
  }, [formData.mainCategories, formData.mainCategory]);

  /**
   * When mainCategory is manually changed (e.g., by ServicesTab filter),
   * we could optionally reorder mainCategories to put it first.
   * But we'll keep it simple and only sync one way.
   */

  // ============================================================
  // EFFECTS
  // ============================================================

  /**
   * EFFECT 1: AUTHENTICATION & AUTHORIZATION CHECK
   */
  useEffect(() => {
    const initDashboard = async () => {
      if (!user) {
        console.log('🔒 No user found, redirecting to login...');
        navigate('/login');
        return;
      }

      if (user.role === 'client') {
        console.log('🚫 Client users cannot access technician dashboard');
        navigate('/');
        return;
      }

      setIsLoading(true);

      try {
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
   * Reads both mainCategory (single) and mainCategories (array) from profile.
   */
  useEffect(() => {
    const profile = isAdminView ? viewingTechnician : technicianProfile;
    
    if (profile) {
      console.log('📝 Populating form data with profile:', {
        id: profile._id,
        name: profile.userId?.firstName + ' ' + profile.userId?.lastName,
        mainCategories: profile.mainCategories || (profile.mainCategory ? [profile.mainCategory] : []),
        serviceCount: profile.serviceCategories?.length || 0
      });

      // Determine categories array
      const categoriesArray = (profile.mainCategories && profile.mainCategories.length > 0) 
                         ? profile.mainCategories 
                         : (profile.mainCategory ? [profile.mainCategory] : []);

      setFormData({
        aboutMe: profile.aboutMe || '',
        profileHeadline: profile.profileHeadline || '',
        skills: profile.skills || [],
        
        // ✅ Both fields
        mainCategory: profile.mainCategory || (categoriesArray.length > 0 ? categoriesArray[0] : ''),
        mainCategories: categoriesArray,
        
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
  // SERVICE CATEGORY HANDLERS (unchanged)
  // ============================================================

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
      await getTechnicianProfile();
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

const handleRemoveServiceCategory = async (categoryName, mainCategory) => {
  setServiceUpdateLoading(true);
  try {
    const result = await removeServiceCategory(categoryName, mainCategory);
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
   * Still handles nested fields, but no special case for mainCategory.
   * mainCategory is synced automatically via useEffect.
   */
  const handleInputChange = (e) => {
    if (isAdminView) {
      console.warn('⚠️ Edit attempted in admin view mode - blocked');
      return;
    }
    
    const { name, value, type, checked } = e.target;
    
    // No special case for 'mainCategory' – it is synced from mainCategories.
    
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
   * Validates that at least one main category exists.
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
    
    // ✅ Validate: at least one main category
    if (!submitData.mainCategories || submitData.mainCategories.length === 0) {
      setError('Please select at least one main category');
      setLoading(false);
      console.warn('⚠️ Form submission failed: mainCategories is required');
      return;
    }
    
    // Ensure mainCategory is set to the first one (already synced)
    submitData.mainCategory = submitData.mainCategories[0];
    
    console.log('📤 Submitting profile update:', {
      mainCategory: submitData.mainCategory,
      mainCategories: submitData.mainCategories,
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

        <Header 
          technicianProfile={currentProfile} 
          isAdminView={isAdminView} 
        />

        <VerificationBanner 
          status={currentProfile?.verificationStatus} 
          isAdminView={isAdminView}
          technicianId={currentProfile?._id}
        />

        <ProfileCompletionBar 
          percentage={currentProfile?.profileCompletionPercentage} 
          isAdminView={isAdminView}
        />

        <TabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          
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
            
            {user?.role === 'admin' && !id && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile (Admin)</span>
              </button>
            )}
            
            {isAdminView && (
              <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Read-Only Mode</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <strong>❌ Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            
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
                onAddServiceCategory={handleAddServiceCategory}
                onRemoveServiceCategory={handleRemoveServiceCategory}
                isSaving={serviceUpdateLoading}
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