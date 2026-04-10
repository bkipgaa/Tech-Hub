import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import tab components
import ProfileTab from './tabs/ProfileTab';
import ServicesTab from './tabs/ServicesTab';
import PortfolioTab from './tabs/PortfolioTab';
import CredentialsTab from './tabs/CredentialsTab';
import AvailabilityTab from './tabs/AvailabilityTab';
import BusinessTab from './tabs/BusinessTab';
import SettingsTab from './tabs/SettingsTab';

// Import common components
import Header from './common/Header';
import VerificationBanner from './common/VerificationBanner';
import ProfileCompletionBar from './common/ProfileCompletionBar';
import TabNavigation from './common/TabNavigation';

// Import icons
import { Edit, Save } from 'lucide-react';

const TechnicianDashboard = () => {
  const { user, technicianProfile, updateTechnicianProfile, getTechnicianProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form data state
  const [formData, setFormData] = useState({
    // Basic Info
    aboutMe: '',
    profileHeadline: '',
    
    // Skills
    skills: [],
    
    // Services
    category: '',
    serviceCategories: [],
    
    // Pricing
    pricing: {
      hourlyRate: 0,
      fixedPrice: 0,
      consultationFee: 0,
      currency: 'KES',
      paymentMethods: ['Cash', 'M-Pesa']
    },
    
    // Education
    education: [],
    
    // Certifications
    certifications: [],
    
    // Experience
    yearsOfExperience: 0,
    experience: [],
    
    // Portfolio
    portfolio: [],
    
    // Location
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
    
    // Languages
    languages: [{ name: 'English', proficiency: 'Fluent' }],
    
    // Availability
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
    
    // Business Info
    businessName: '',
    businessRegistrationNumber: '',
    insuranceInfo: {
      provider: '',
      policyNumber: '',
      expiryDate: ''
    },
    
    // Social Links
    socialLinks: {
      website: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      youtube: '',
      tiktok: ''
    },
    
    // Settings
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
    
    // Status
    isAvailable: true,
    isActive: true,
    
    // Gallery (for backward compatibility)
    gallery: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'technician') {
      navigate('/');
      return;
    }

    if (!technicianProfile) {
      getTechnicianProfile();
    } else {
      // Map backend data to form state
      setFormData({
        aboutMe: technicianProfile.aboutMe || '',
        profileHeadline: technicianProfile.profileHeadline || '',
        skills: technicianProfile.skills || [],
        category: technicianProfile.category || '',
        serviceCategories: technicianProfile.serviceCategories || [],
        pricing: technicianProfile.pricing || {
          hourlyRate: 0,
          fixedPrice: 0,
          consultationFee: 0,
          currency: 'KES',
          paymentMethods: ['Cash', 'M-Pesa']
        },
        education: technicianProfile.education || [],
        certifications: technicianProfile.certifications || [],
        yearsOfExperience: technicianProfile.yearsOfExperience || 0,
        experience: technicianProfile.experience || [],
        portfolio: technicianProfile.portfolio || [],
        address: technicianProfile.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Kenya'
        },
        location: technicianProfile.location || {
          coordinates: [0, 0],
          formattedAddress: '',
          placeId: ''
        },
        serviceRadius: technicianProfile.serviceRadius || 10,
        languages: technicianProfile.languages || [{ name: 'English', proficiency: 'Fluent' }],
        availability: technicianProfile.availability || {
          monday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          tuesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          wednesday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          thursday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          friday: { enabled: true, hours: [{ start: '09:00', end: '17:00' }] },
          saturday: { enabled: false, hours: [] },
          sunday: { enabled: false, hours: [] }
        },
        emergencyAvailable: technicianProfile.emergencyAvailable || false,
        remoteServiceAvailable: technicianProfile.remoteServiceAvailable || false,
        weekendAvailable: technicianProfile.weekendAvailable || false,
        businessName: technicianProfile.businessName || '',
        businessRegistrationNumber: technicianProfile.businessRegistrationNumber || '',
        insuranceInfo: technicianProfile.insuranceInfo || {
          provider: '',
          policyNumber: '',
          expiryDate: ''
        },
        socialLinks: technicianProfile.socialLinks || {
          website: '',
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: '',
          youtube: '',
          tiktok: ''
        },
        settings: technicianProfile.settings || {
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
        isAvailable: technicianProfile.isAvailable !== undefined ? technicianProfile.isAvailable : true,
        gallery: technicianProfile.portfolio?.map(item => item.mediaUrl) || []
      });
    }
  }, [user, technicianProfile]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      gallery: undefined
    };
    
    const result = await updateTechnicianProfile(submitData);
    setLoading(false);
    if (result.success) {
      setIsEditing(false);
    }
  };

  if (!technicianProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header with Stats - No background color */}
      <Header technicianProfile={technicianProfile} />

      {/* Verification Status Banner */}
      <VerificationBanner status={technicianProfile.verificationStatus} />

      {/* Profile Completion Bar */}
      <ProfileCompletionBar percentage={technicianProfile.profileCompletionPercentage} />

      {/* Tabs Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with Edit Toggle */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTab === 'profile' && 'Professional Information'}
            {activeTab === 'services' && 'Services & Pricing'}
            {activeTab === 'portfolio' && 'Work Portfolio'}
            {activeTab === 'credentials' && 'Education & Certifications'}
            {activeTab === 'availability' && 'Availability Schedule'}
            {activeTab === 'business' && 'Business Details'}
            {activeTab === 'settings' && 'Account Settings'}
          </h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel Editing
            </button>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Render active tab */}
          {activeTab === 'profile' && (
            <ProfileTab 
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              handleInputChange={handleInputChange}
            />
          )}
          
          {activeTab === 'services' && (
            <ServicesTab 
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              handleInputChange={handleInputChange}
            />
          )}
          
          {activeTab === 'portfolio' && (
            <PortfolioTab 
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
            />
          )}
          
          {activeTab === 'credentials' && (
            <CredentialsTab 
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              handleInputChange={handleInputChange}
            />
          )}
          
          {activeTab === 'availability' && (
            <AvailabilityTab 
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              handleInputChange={handleInputChange}
            />
          )}
          
          {activeTab === 'business' && (
            <BusinessTab 
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              handleInputChange={handleInputChange}
            />
          )}
          
          {activeTab === 'settings' && (
            <SettingsTab 
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              handleInputChange={handleInputChange}
              user={user}
            />
          )}

          {/* Submit Button */}
          {isEditing && (
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TechnicianDashboard;