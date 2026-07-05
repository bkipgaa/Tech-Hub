/**
 * TechnicianDashboard.js
 * ======================
 * Technician Dashboard Component - COMPLETE FIXED VERSION
 * 
 * @version 2.0.3
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, MapPin, Star, Briefcase, Clock, DollarSign, 
  Award, Languages, Phone, Mail, Calendar, CheckCircle, 
  XCircle, AlertCircle, Edit, Save, Camera, Plus, Trash2,
  Globe, Home, Shield, FileText, Users, BookOpen, 
  Link as LinkIcon, Settings, TrendingUp, Video, Image,
  FileCheck, UserCheck, Bell, CreditCard, Network,
  ChevronDown, ChevronUp
} from 'lucide-react';

const TechnicianDashboard = () => {
  const { user, technicianProfile, updateTechnicianProfile, getTechnicianProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    services: true,
    skills: false,
    experience: false,
    education: false,
    certifications: false,
    portfolio: false,
    languages: false,
    location: false,
    pricing: false,
    availability: false,
    social: false,
    settings: false
  });
  
  // Form state with safe defaults
  const [formData, setFormData] = useState({
    aboutMe: '',
    profileHeadline: '',
    skills: [],
    mainCategory: '',
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

  // New item states
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', yearsOfExperience: 0 });
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    grade: ''
  });
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    doesNotExpire: false
  });
  const [newExperience, setNewExperience] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    achievements: []
  });
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    category: '',
    mediaType: 'image',
    mediaUrl: '',
    thumbnailUrl: '',
    clientName: '',
    completionDate: '',
    tags: [],
    isFeatured: false
  });
  const [newLanguage, setNewLanguage] = useState({ name: '', proficiency: 'Fluent' });
  const [newAchievement, setNewAchievement] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSubService, setNewSubService] = useState('');

  const categories = [
    'IT & Networking', 'Electrical Services', 'Mechanical Services', 'Plumbing',
    'Programming & AI', 'Hairdressing & Beauty', 'Carpentry & Furniture',
    'Laundry & Dry Cleaning', 'Cleaning Services', 'Painting & Decorating',
    'Welding & Fabrication', 'Automotive Repair', 'Tutoring & Training',
    'Photography & Videography', 'Event Planning', 'Construction & Renovation',
    'HVAC Services', 'Appliance Repair', 'Moving & Logistics', 'Gardening & Landscaping'
  ];

  const proficiencyLevels = ['Basic', 'Conversational', 'Fluent', 'Native'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsProfileLoading(true);
        setError(null);
        
        if (!user) {
          navigate('/login');
          return;
        }

        if (user.role !== 'technician') {
          navigate('/');
          return;
        }

        if (!technicianProfile) {
          await getTechnicianProfile();
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [user, technicianProfile, navigate, getTechnicianProfile]);

  // Update form data when technicianProfile changes
  useEffect(() => {
    if (technicianProfile && typeof technicianProfile === 'object') {
      try {
        // Safely map data with fallbacks
        setFormData(prev => ({
          ...prev,
          aboutMe: technicianProfile.aboutMe || '',
          profileHeadline: technicianProfile.profileHeadline || '',
          skills: Array.isArray(technicianProfile.skills) ? technicianProfile.skills : [],
          mainCategory: technicianProfile.mainCategory || technicianProfile.category || '',
          serviceCategories: Array.isArray(technicianProfile.serviceCategories) 
            ? technicianProfile.serviceCategories 
            : [],
          pricing: technicianProfile.pricing || {
            hourlyRate: 0,
            fixedPrice: 0,
            consultationFee: 0,
            currency: 'KES',
            paymentMethods: ['Cash', 'M-Pesa']
          },
          education: Array.isArray(technicianProfile.education) ? technicianProfile.education : [],
          certifications: Array.isArray(technicianProfile.certifications) ? technicianProfile.certifications : [],
          yearsOfExperience: technicianProfile.yearsOfExperience || 0,
          experience: Array.isArray(technicianProfile.experience) ? technicianProfile.experience : [],
          portfolio: Array.isArray(technicianProfile.portfolio) ? technicianProfile.portfolio : [],
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
          languages: Array.isArray(technicianProfile.languages) ? technicianProfile.languages : [{ name: 'English', proficiency: 'Fluent' }],
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
          gallery: Array.isArray(technicianProfile.portfolio) 
            ? technicianProfile.portfolio.map(item => item.mediaUrl || '') 
            : []
        }));
      } catch (err) {
        console.error('Error mapping profile data:', err);
        setError('Error loading profile data. Please refresh the page.');
      }
    }
  }, [technicianProfile]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [child]: {
              ...(prev[parent]?.[child] || {}),
              [grandchild]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Skills Management
  const addSkill = () => {
    if (newSkill.name) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), { ...newSkill }]
      }));
      setNewSkill({ name: '', level: 'Intermediate', yearsOfExperience: 0 });
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index)
    }));
  };

  // Education Management
  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setFormData(prev => ({
        ...prev,
        education: [...(prev.education || []), { ...newEducation }]
      }));
      setNewEducation({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
        grade: ''
      });
    }
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index)
    }));
  };

  // Certification Management
  const addCertification = () => {
    if (newCertification.name && newCertification.issuingOrganization) {
      setFormData(prev => ({
        ...prev,
        certifications: [...(prev.certifications || []), { ...newCertification }]
      }));
      setNewCertification({
        name: '',
        issuingOrganization: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        credentialUrl: '',
        doesNotExpire: false
      });
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index)
    }));
  };

  // Experience Management
  const addExperience = () => {
    if (newExperience.title && newExperience.company) {
      setFormData(prev => ({
        ...prev,
        experience: [...(prev.experience || []), { ...newExperience }]
      }));
      setNewExperience({
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
        achievements: []
      });
    }
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: (prev.experience || []).filter((_, i) => i !== index)
    }));
  };

  const addAchievement = (experienceIndex) => {
    if (newAchievement) {
      setFormData(prev => {
        const updatedExperience = [...(prev.experience || [])];
        if (updatedExperience[experienceIndex]) {
          updatedExperience[experienceIndex].achievements = [
            ...(updatedExperience[experienceIndex].achievements || []),
            newAchievement
          ];
        }
        return { ...prev, experience: updatedExperience };
      });
      setNewAchievement('');
    }
  };

  const removeAchievement = (experienceIndex, achievementIndex) => {
    setFormData(prev => {
      const updatedExperience = [...(prev.experience || [])];
      if (updatedExperience[experienceIndex]) {
        updatedExperience[experienceIndex].achievements.splice(achievementIndex, 1);
      }
      return { ...prev, experience: updatedExperience };
    });
  };

  // Portfolio Management
  const addPortfolio = () => {
    if (newPortfolio.title && newPortfolio.mediaUrl) {
      setFormData(prev => ({
        ...prev,
        portfolio: [...(prev.portfolio || []), { ...newPortfolio }],
        gallery: [...(prev.gallery || []), newPortfolio.mediaUrl]
      }));
      setNewPortfolio({
        title: '',
        description: '',
        category: '',
        mediaType: 'image',
        mediaUrl: '',
        thumbnailUrl: '',
        clientName: '',
        completionDate: '',
        tags: [],
        isFeatured: false
      });
    }
  };

  const removePortfolio = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio: (prev.portfolio || []).filter((_, i) => i !== index),
      gallery: (prev.gallery || []).filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag && !newPortfolio.tags.includes(newTag)) {
      setNewPortfolio(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewPortfolio(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Service Categories Management
  const addSubServiceToCategory = (categoryIndex) => {
    if (newSubService) {
      setFormData(prev => {
        const updatedCategories = [...(prev.serviceCategories || [])];
        if (updatedCategories[categoryIndex]) {
          if (!updatedCategories[categoryIndex].subServices) {
            updatedCategories[categoryIndex].subServices = [];
          }
          updatedCategories[categoryIndex].subServices = [
            ...updatedCategories[categoryIndex].subServices,
            newSubService
          ];
        }
        return { ...prev, serviceCategories: updatedCategories };
      });
      setNewSubService('');
    }
  };

  const removeSubServiceFromCategory = (categoryIndex, subIndex) => {
    setFormData(prev => {
      const updatedCategories = [...(prev.serviceCategories || [])];
      if (updatedCategories[categoryIndex]) {
        updatedCategories[categoryIndex].subServices.splice(subIndex, 1);
      }
      return { ...prev, serviceCategories: updatedCategories };
    });
  };

  const removeServiceCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceCategories: (prev.serviceCategories || []).filter((_, i) => i !== index)
    }));
  };

  // Languages Management
  const addLanguage = () => {
    if (newLanguage.name) {
      setFormData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), { ...newLanguage }]
      }));
      setNewLanguage({ name: '', proficiency: 'Fluent' });
    }
  };

  const removeLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: (prev.languages || []).filter((_, i) => i !== index)
    }));
  };

  // Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPortfolio(prev => ({
          ...prev,
          mediaUrl: reader.result,
          thumbnailUrl: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const submitData = {
        ...formData,
        gallery: undefined
      };
      
      const result = await updateTechnicianProfile(submitData);
      if (result.success) {
        setIsEditing(false);
        // Refresh profile data
        await getTechnicianProfile();
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update failed:', err);
      setError('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Loading state
  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // No profile found
  if (!technicianProfile || Object.keys(technicianProfile).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Profile Found</h2>
          <p className="text-gray-600 mb-4">You don't have a technician profile yet. Please create one to get started.</p>
          <button
            onClick={() => navigate('/create-technician-profile')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  // Safely get values with fallbacks
  const averageRating = technicianProfile.rating?.average || 0;
  const completedJobs = technicianProfile.statistics?.completedJobs || 0;
  const reviewsCount = technicianProfile.reviews?.length || 0;
  const profileCompletion = technicianProfile.profileCompletionPercentage || 0;
  const verificationStatus = technicianProfile.verificationStatus || 'pending';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Technician Dashboard</h1>
            <p className="text-red-100">Manage your professional profile and services</p>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <Star className="w-5 h-5 inline mb-1" />
              <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
              <p className="text-xs">Rating</p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <Briefcase className="w-5 h-5 inline mb-1" />
              <p className="text-2xl font-bold">{completedJobs}</p>
              <p className="text-xs">Jobs Done</p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <CheckCircle className="w-5 h-5 inline mb-1" />
              <p className="text-2xl font-bold">{reviewsCount}</p>
              <p className="text-xs">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationStatus !== 'verified' && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          verificationStatus === 'pending' 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {verificationStatus === 'pending' ? (
            <>
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>Your profile is pending verification. You'll be able to accept jobs once approved.</span>
            </>
          ) : verificationStatus === 'rejected' ? (
            <>
              <XCircle className="w-5 h-5 mr-2" />
              <span>Your profile verification was rejected. Please update your information.</span>
            </>
          ) : null}
        </div>
      )}

      {/* Profile Completion Bar */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-green-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Completion</span>
          <span className="text-sm font-medium text-green-600">{profileCompletion}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UserCheck className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Wrench className="w-4 h-4 inline mr-2" />
            Services
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'portfolio'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Image className="w-4 h-4 inline mr-2" />
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'credentials'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Credentials
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'availability'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Availability
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'business'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Business
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
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

        <form onSubmit={handleSubmit} className="p-6">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Headline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Headline</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="profileHeadline"
                    value={formData.profileHeadline || ''}
                    onChange={handleInputChange}
                    maxLength="200"
                    className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="e.g., Expert Electrician with 10+ years experience"
                  />
                ) : (
                  <p className="text-gray-900">{formData.profileHeadline || 'No headline provided'}</p>
                )}
              </div>

              {/* About Me */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
                {isEditing ? (
                  <textarea
                    name="aboutMe"
                    value={formData.aboutMe || ''}
                    onChange={handleInputChange}
                    rows="4"
                    maxLength="2000"
                    className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="Tell clients about yourself..."
                  />
                ) : (
                  <p className="text-gray-700">{formData.aboutMe || 'No bio provided'}</p>
                )}
              </div>

              {/* Main Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Main Category</label>
                {isEditing ? (
                  <select
                    name="mainCategory"
                    value={formData.mainCategory || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium">{formData.mainCategory || 'Not specified'}</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        placeholder="Skill name"
                        className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                      />
                      <select
                        value={newSkill.level}
                        onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                        className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                      >
                        {skillLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newSkill.yearsOfExperience}
                          onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: parseInt(e.target.value) || 0 })}
                          placeholder="Years"
                          min="0"
                          className="flex-1 p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                        />
                        <button type="button" onClick={addSkill} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(formData.skills || []).map((skill, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                          <div>
                            <span className="font-medium">{skill.name}</span>
                            <span className="text-sm text-gray-600 ml-2">({skill.level})</span>
                            <span className="text-sm text-gray-600 ml-2">{skill.yearsOfExperience} years</span>
                          </div>
                          <button type="button" onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(formData.skills || []).length === 0 && (
                        <p className="text-gray-400 italic">No skills added</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(formData.skills || []).map((skill, index) => (
                      <div key={index} className="bg-green-50 p-2 rounded">
                        <span className="font-medium">{skill.name}</span>
                        <span className="text-sm text-gray-600 ml-2">({skill.level})</span>
                        {skill.yearsOfExperience > 0 && (
                          <span className="text-sm text-gray-600 ml-2">{skill.yearsOfExperience} years</span>
                        )}
                      </div>
                    ))}
                    {(formData.skills || []).length === 0 && (
                      <p className="text-gray-400 italic">No skills added</p>
                    )}
                  </div>
                )}
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLanguage.name}
                        onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                        placeholder="Language"
                        className="flex-1 p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                      />
                      <select
                        value={newLanguage.proficiency}
                        onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
                        className="flex-1 p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                      >
                        {proficiencyLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      <button type="button" onClick={addLanguage} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(formData.languages || []).map((lang, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                          {lang.name} ({lang.proficiency})
                          <button type="button" onClick={() => removeLanguage(index)} className="ml-2 text-red-500 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(formData.languages || []).map((lang, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {lang.name} ({lang.proficiency})
                      </span>
                    ))}
                    {(formData.languages || []).length === 0 && (
                      <p className="text-gray-400 italic">No languages added</p>
                    )}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address?.street || ''}
                      onChange={handleInputChange}
                      placeholder="Street Address"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address?.city || ''}
                        onChange={handleInputChange}
                        placeholder="City"
                        required
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address?.state || ''}
                        onChange={handleInputChange}
                        placeholder="State/County"
                        required
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="address.zipCode"
                        value={formData.address?.zipCode || ''}
                        onChange={handleInputChange}
                        placeholder="Postal Code"
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        name="address.country"
                        value={formData.address?.country || 'Kenya'}
                        onChange={handleInputChange}
                        placeholder="Country"
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Service Radius (km)</label>
                      <input
                        type="number"
                        name="serviceRadius"
                        value={formData.serviceRadius || 10}
                        onChange={handleInputChange}
                        min="1"
                        max="100"
                        className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-900">{formData.address?.street || ''}</p>
                    <p className="text-gray-600">{formData.address?.city || ''}, {formData.address?.state || ''} {formData.address?.zipCode || ''}</p>
                    <p className="text-gray-600">{formData.address?.country || 'Kenya'}</p>
                    <p className="text-sm text-green-600 mt-2">Service radius: {formData.serviceRadius || 10} km</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hourly Rate</label>
                        <input
                          type="number"
                          name="pricing.hourlyRate"
                          value={formData.pricing?.hourlyRate || 0}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Fixed Price</label>
                        <input
                          type="number"
                          name="pricing.fixedPrice"
                          value={formData.pricing?.fixedPrice || 0}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Consultation Fee</label>
                        <input
                          type="number"
                          name="pricing.consultationFee"
                          value={formData.pricing?.consultationFee || 0}
                          onChange={handleInputChange}
                          min="0"
                          className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Currency</label>
                        <select
                          name="pricing.currency"
                          value={formData.pricing?.currency || 'KES'}
                          onChange={handleInputChange}
                          className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                        >
                          <option value="KES">KES - Kenyan Shilling</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Payment Methods</label>
                        <select
                          multiple
                          name="pricing.paymentMethods"
                          value={formData.pricing?.paymentMethods || ['Cash', 'M-Pesa']}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value);
                            setFormData(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, paymentMethods: values }
                            }));
                          }}
                          className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 h-32"
                        >
                          <option value="Cash">Cash</option>
                          <option value="M-Pesa">M-Pesa</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Card">Card</option>
                          <option value="PayPal">PayPal</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Hourly Rate</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formData.pricing?.currency || 'KES'} {formData.pricing?.hourlyRate || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fixed Price</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formData.pricing?.currency || 'KES'} {formData.pricing?.fixedPrice || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Consultation Fee</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formData.pricing?.currency || 'KES'} {formData.pricing?.consultationFee || 0}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Payment Methods: {(formData.pricing?.paymentMethods || []).join(', ') || 'Cash, M-Pesa'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Categories & Sub-Services</label>
                {isEditing ? (
                  <div className="space-y-4">
                    {(formData.serviceCategories || []).map((cat, idx) => (
                      <div key={idx} className="border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{cat.categoryName}</h4>
                            {cat.subServices && cat.subServices.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Sub-services:</p>
                                <div className="flex flex-wrap gap-1">
                                  {cat.subServices.map((sub, subIdx) => (
                                    <span key={subIdx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center">
                                      {sub}
                                      <button
                                        type="button"
                                        onClick={() => removeSubServiceFromCategory(idx, subIdx)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                value={newSubService}
                                onChange={(e) => setNewSubService(e.target.value)}
                                placeholder="Add sub-service"
                                className="flex-1 p-2 border-2 border-green-300 rounded-lg text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => addSubServiceToCategory(idx)}
                                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeServiceCategory(idx)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(formData.serviceCategories || []).length === 0 && (
                      <p className="text-gray-400 italic">No service categories added</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(formData.serviceCategories || []).map((cat, idx) => (
                      <div key={idx} className="border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{cat.categoryName}</h4>
                        {cat.subServices && cat.subServices.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Sub-services:</p>
                            <div className="flex flex-wrap gap-1">
                              {cat.subServices.map((sub, subIdx) => (
                                <span key={subIdx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(formData.serviceCategories || []).length === 0 && (
                      <p className="text-gray-400 italic">No service categories added</p>
                    )}
                  </div>
                )}
              </div>

              {/* Availability toggles */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="emergencyAvailable"
                    checked={formData.emergencyAvailable || false}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Available for emergency services</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="remoteServiceAvailable"
                    checked={formData.remoteServiceAvailable || false}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Available for remote services</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="weekendAvailable"
                    checked={formData.weekendAvailable || false}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Available on weekends</label>
                </div>
              </div>
            </div>
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              {isEditing && (
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900">Add Portfolio Item</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newPortfolio.title}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                      placeholder="Title"
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                    <select
                      value={newPortfolio.mediaType}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, mediaType: e.target.value })}
                      className="p-2 border-2 border-green-300 rounded-lg"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  <textarea
                    value={newPortfolio.description}
                    onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                    placeholder="Description"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                    rows="2"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newPortfolio.clientName}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, clientName: e.target.value })}
                      placeholder="Client Name"
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={newPortfolio.completionDate}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, completionDate: e.target.value })}
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Upload Media</label>
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-flex items-center">
                        <Camera className="w-4 h-4 mr-2" />
                        Choose File
                        <input type="file" accept="image/*,video/*,.pdf" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {newPortfolio.mediaUrl && <span className="text-sm text-green-600">File selected</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        className="flex-1 p-2 border-2 border-green-300 rounded-lg"
                      />
                      <button type="button" onClick={addTag} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newPortfolio.tags.map((tag, idx) => (
                        <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-red-500 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newPortfolio.isFeatured}
                      onChange={(e) => setNewPortfolio({ ...newPortfolio, isFeatured: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">Feature this item</label>
                  </div>
                  <button type="button" onClick={addPortfolio} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    Add to Portfolio
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(formData.portfolio || []).map((item, index) => (
                  <div key={index} className="border border-green-200 rounded-lg overflow-hidden group relative">
                    {item.mediaType === 'image' && (
                      <img src={item.mediaUrl} alt={item.title} className="w-full h-48 object-cover" />
                    )}
                    {item.mediaType === 'video' && (
                      <video src={item.mediaUrl} className="w-full h-48 object-cover" controls />
                    )}
                    {item.mediaType === 'document' && (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        {item.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      {(item.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(item.tags || []).slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removePortfolio(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {(formData.portfolio || []).length === 0 && (
                  <p className="text-gray-400 italic col-span-3 text-center py-8">No portfolio items added</p>
                )}
              </div>
            </div>
          )}

          {/* CREDENTIALS TAB */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Years of Experience</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience || 0}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formData.yearsOfExperience || 0} years</p>
                )}
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg space-y-3">
                      <input
                        type="text"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
                        placeholder="Institution"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                        placeholder="Degree"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={newEducation.fieldOfStudy}
                        onChange={(e) => setNewEducation({ ...newEducation, fieldOfStudy: e.target.value })}
                        placeholder="Field of Study"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={newEducation.startDate}
                          onChange={(e) => setNewEducation({ ...newEducation, startDate: e.target.value })}
                          className="p-2 border-2 border-green-300 rounded-lg"
                        />
                        <input
                          type="date"
                          value={newEducation.endDate}
                          onChange={(e) => setNewEducation({ ...newEducation, endDate: e.target.value })}
                          disabled={newEducation.isCurrent}
                          className="p-2 border-2 border-green-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newEducation.isCurrent}
                          onChange={(e) => setNewEducation({ ...newEducation, isCurrent: e.target.checked })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Currently studying</label>
                      </div>
                      <textarea
                        value={newEducation.description}
                        onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
                        placeholder="Description"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                        rows="2"
                      />
                      <input
                        type="text"
                        value={newEducation.grade}
                        onChange={(e) => setNewEducation({ ...newEducation, grade: e.target.value })}
                        placeholder="Grade (optional)"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <button type="button" onClick={addEducation} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        Add Education
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(formData.education || []).map((edu, idx) => (
                        <div key={idx} className="border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                              <p className="text-sm text-gray-700">{edu.institution}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} - 
                                {edu.isCurrent ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ''}
                              </p>
                            </div>
                            <button type="button" onClick={() => removeEducation(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(formData.education || []).map((edu, idx) => (
                      <div key={idx} className="border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                        <p className="text-sm text-gray-700">{edu.institution}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {edu.startDate ? new Date(edu.startDate).getFullYear() : ''} - 
                          {edu.isCurrent ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ''}
                        </p>
                      </div>
                    ))}
                    {(formData.education || []).length === 0 && (
                      <p className="text-gray-400 italic">No education added</p>
                    )}
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg space-y-3">
                      <input
                        type="text"
                        value={newCertification.name}
                        onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                        placeholder="Certification Name"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={newCertification.issuingOrganization}
                        onChange={(e) => setNewCertification({ ...newCertification, issuingOrganization: e.target.value })}
                        placeholder="Issuing Organization"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={newCertification.issueDate}
                          onChange={(e) => setNewCertification({ ...newCertification, issueDate: e.target.value })}
                          className="p-2 border-2 border-green-300 rounded-lg"
                        />
                        <input
                          type="date"
                          value={newCertification.expiryDate}
                          onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
                          disabled={newCertification.doesNotExpire}
                          className="p-2 border-2 border-green-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newCertification.doesNotExpire}
                          onChange={(e) => setNewCertification({ ...newCertification, doesNotExpire: e.target.checked })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Does not expire</label>
                      </div>
                      <input
                        type="text"
                        value={newCertification.credentialId}
                        onChange={(e) => setNewCertification({ ...newCertification, credentialId: e.target.value })}
                        placeholder="Credential ID"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <input
                        type="url"
                        value={newCertification.credentialUrl}
                        onChange={(e) => setNewCertification({ ...newCertification, credentialUrl: e.target.value })}
                        placeholder="Credential URL"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <button type="button" onClick={addCertification} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        Add Certification
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(formData.certifications || []).map((cert, idx) => (
                        <div key={idx} className="border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                              <p className="text-sm text-gray-700">{cert.issuingOrganization}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : ''}
                              </p>
                              {cert.verified && (
                                <span className="inline-flex items-center mt-1 text-xs text-green-600">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                </span>
                              )}
                            </div>
                            <button type="button" onClick={() => removeCertification(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(formData.certifications || []).map((cert, idx) => (
                      <div key={idx} className="border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                        <p className="text-sm text-gray-700">{cert.issuingOrganization}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Issued: {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : ''}
                        </p>
                      </div>
                    ))}
                    {(formData.certifications || []).length === 0 && (
                      <p className="text-gray-400 italic">No certifications added</p>
                    )}
                  </div>
                )}
              </div>

              {/* Work Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Experience</label>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg space-y-3">
                      <input
                        type="text"
                        value={newExperience.title}
                        onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                        placeholder="Job Title"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        placeholder="Company"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={newExperience.location}
                        onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                        placeholder="Location"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={newExperience.startDate}
                          onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                          className="p-2 border-2 border-green-300 rounded-lg"
                        />
                        <input
                          type="date"
                          value={newExperience.endDate}
                          onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                          disabled={newExperience.isCurrent}
                          className="p-2 border-2 border-green-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newExperience.isCurrent}
                          onChange={(e) => setNewExperience({ ...newExperience, isCurrent: e.target.checked })}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">Currently working here</label>
                      </div>
                      <textarea
                        value={newExperience.description}
                        onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                        placeholder="Description"
                        className="w-full p-2 border-2 border-green-300 rounded-lg"
                        rows="2"
                      />
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Achievements</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newAchievement}
                            onChange={(e) => setNewAchievement(e.target.value)}
                            placeholder="Add achievement"
                            className="flex-1 p-2 border-2 border-green-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newAchievement) {
                                setNewExperience({
                                  ...newExperience,
                                  achievements: [...(newExperience.achievements || []), newAchievement]
                                });
                                setNewAchievement('');
                              }
                            }}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          {(newExperience.achievements || []).map((ach, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-2 rounded">
                              <span className="text-sm">{ach}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = newExperience.achievements.filter((_, i) => i !== idx);
                                  setNewExperience({ ...newExperience, achievements: updated });
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={addExperience} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        Add Experience
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(formData.experience || []).map((exp, idx) => (
                        <div key={idx} className="border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                              <p className="text-sm text-gray-700">{exp.company}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} - 
                                {exp.isCurrent ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ''}
                              </p>
                              {(exp.achievements || []).length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-700">Achievements:</p>
                                  <ul className="list-disc list-inside">
                                    {(exp.achievements || []).map((ach, aidx) => (
                                      <li key={aidx} className="text-xs text-gray-600">{ach}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <button type="button" onClick={() => removeExperience(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(formData.experience || []).map((exp, idx) => (
                      <div key={idx} className="border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                        <p className="text-sm text-gray-700">{exp.company}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''} - 
                          {exp.isCurrent ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                    ))}
                    {(formData.experience || []).length === 0 && (
                      <p className="text-gray-400 italic">No work experience added</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AVAILABILITY TAB */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Availability</label>
                {isEditing ? (
                  <div className="space-y-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.availability[day]?.enabled || false}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  availability: {
                                    ...prev.availability,
                                    [day]: {
                                      ...prev.availability[day],
                                      enabled: e.target.checked,
                                      hours: e.target.checked ? [{ start: '09:00', end: '17:00' }] : []
                                    }
                                  }
                                }));
                              }}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 font-medium text-gray-700 capitalize">{day}</span>
                          </label>
                        </div>
                        {(formData.availability[day]?.enabled || false) && (
                          <div className="space-y-2">
                            {(formData.availability[day]?.hours || []).map((hour, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <input
                                  type="time"
                                  value={hour.start}
                                  onChange={(e) => {
                                    const updatedHours = [...(formData.availability[day]?.hours || [])];
                                    updatedHours[idx] = { ...updatedHours[idx], start: e.target.value };
                                    setFormData(prev => ({
                                      ...prev,
                                      availability: {
                                        ...prev.availability,
                                        [day]: {
                                          ...prev.availability[day],
                                          hours: updatedHours
                                        }
                                      }
                                    }));
                                  }}
                                  className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                                />
                                <span>to</span>
                                <input
                                  type="time"
                                  value={hour.end}
                                  onChange={(e) => {
                                    const updatedHours = [...(formData.availability[day]?.hours || [])];
                                    updatedHours[idx] = { ...updatedHours[idx], end: e.target.value };
                                    setFormData(prev => ({
                                      ...prev,
                                      availability: {
                                        ...prev.availability,
                                        [day]: {
                                          ...prev.availability[day],
                                          hours: updatedHours
                                        }
                                      }
                                    }));
                                  }}
                                  className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedHours = (formData.availability[day]?.hours || []).filter((_, i) => i !== idx);
                                    setFormData(prev => ({
                                      ...prev,
                                      availability: {
                                        ...prev.availability,
                                        [day]: {
                                          ...prev.availability[day],
                                          hours: updatedHours
                                        }
                                      }
                                    }));
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  availability: {
                                    ...prev.availability,
                                    [day]: {
                                      ...prev.availability[day],
                                      hours: [...(prev.availability[day]?.hours || []), { start: '09:00', end: '17:00' }]
                                    }
                                  }
                                }));
                              }}
                              className="text-green-600 hover:text-green-700 text-sm flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add time slot
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(formData.availability || {}).map(([day, schedule]) => (
                      <div key={day} className="border border-green-200 rounded-lg p-3">
                        <p className="font-medium text-gray-700 capitalize">{day}</p>
                        {schedule?.enabled ? (
                          (schedule.hours || []).map((hour, idx) => (
                            <p key={idx} className="text-sm text-gray-600">{hour.start} - {hour.end}</p>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400">Unavailable</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable || false}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">Currently available for work</label>
                </div>
              </div>
            </div>
          )}

          {/* BUSINESS TAB */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Information</label>
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName || ''}
                      onChange={handleInputChange}
                      placeholder="Business Name"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                    <input
                      type="text"
                      name="businessRegistrationNumber"
                      value={formData.businessRegistrationNumber || ''}
                      onChange={handleInputChange}
                      placeholder="Business Registration Number"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-900 font-medium">{formData.businessName || 'No business name'}</p>
                    {formData.businessRegistrationNumber && (
                      <p className="text-sm text-gray-600">Reg: {formData.businessRegistrationNumber}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Information</label>
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="insuranceInfo.provider"
                      value={formData.insuranceInfo?.provider || ''}
                      onChange={handleInputChange}
                      placeholder="Insurance Provider"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                    <input
                      type="text"
                      name="insuranceInfo.policyNumber"
                      value={formData.insuranceInfo?.policyNumber || ''}
                      onChange={handleInputChange}
                      placeholder="Policy Number"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                    <input
                      type="date"
                      name="insuranceInfo.expiryDate"
                      value={formData.insuranceInfo?.expiryDate || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                  </div>
                ) : (
                  <div>
                    {formData.insuranceInfo?.provider ? (
                      <>
                        <p className="text-gray-900">{formData.insuranceInfo.provider}</p>
                        <p className="text-sm text-gray-600">Policy: {formData.insuranceInfo.policyNumber}</p>
                        {formData.insuranceInfo.expiryDate && (
                          <p className="text-sm text-gray-600">Expires: {new Date(formData.insuranceInfo.expiryDate).toLocaleDateString()}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">No insurance information provided</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Media Links</label>
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="url"
                      name="socialLinks.website"
                      value={formData.socialLinks?.website || ''}
                      onChange={handleInputChange}
                      placeholder="Website"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                    <input
                      type="url"
                      name="socialLinks.facebook"
                      value={formData.socialLinks?.facebook || ''}
                      onChange={handleInputChange}
                      placeholder="Facebook"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                    <input
                      type="url"
                      name="socialLinks.twitter"
                      value={formData.socialLinks?.twitter || ''}
                      onChange={handleInputChange}
                      placeholder="Twitter"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                    <input
                      type="url"
                      name="socialLinks.linkedin"
                      value={formData.socialLinks?.linkedin || ''}
                      onChange={handleInputChange}
                      placeholder="LinkedIn"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                    <input
                      type="url"
                      name="socialLinks.instagram"
                      value={formData.socialLinks?.instagram || ''}
                      onChange={handleInputChange}
                      placeholder="Instagram"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                    <input
                      type="url"
                      name="socialLinks.youtube"
                      value={formData.socialLinks?.youtube || ''}
                      onChange={handleInputChange}
                      placeholder="YouTube"
                      className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(formData.socialLinks || {}).map(([platform, url]) => (
                      url && (
                        <p key={platform} className="flex items-center text-sm">
                          <LinkIcon className="w-4 h-4 text-green-600 mr-2" />
                          <span className="capitalize">{platform}: </span>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="ml-2 text-green-600 hover:underline">
                            {url}
                          </a>
                        </p>
                      )
                    ))}
                    {Object.values(formData.socialLinks || {}).every(v => !v) && (
                      <p className="text-gray-400 italic">No social links added</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Privacy Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.showEmail"
                      checked={formData.settings?.showEmail || false}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Show email address on profile</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.showPhone"
                      checked={formData.settings?.showPhone || false}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Show phone number on profile</label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Booking Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.instantBooking"
                      checked={formData.settings?.instantBooking || false}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Allow instant booking (no approval needed)</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.requiresApproval"
                      checked={formData.settings?.requiresApproval || false}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Require approval for all bookings</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.autoAcceptJobs"
                      checked={formData.settings?.autoAcceptJobs || false}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Auto-accept jobs within availability</label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.notifications.email"
                      checked={formData.settings?.notifications?.email || false}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            notifications: {
                              ...prev.settings?.notifications,
                              email: e.target.checked
                            }
                          }
                        }));
                      }}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Email notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.notifications.sms"
                      checked={formData.settings?.notifications?.sms || false}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            notifications: {
                              ...prev.settings?.notifications,
                              sms: e.target.checked
                            }
                          }
                        }));
                      }}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">SMS notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.notifications.push"
                      checked={formData.settings?.notifications?.push || false}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            notifications: {
                              ...prev.settings?.notifications,
                              push: e.target.checked
                            }
                          }
                        }));
                      }}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Push notifications</label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">Job Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="settings.jobReminders"
                      checked={formData.settings?.jobReminders || false}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-900">Receive job reminders</label>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Phone className="w-4 h-4 text-green-600 mr-2" />
                  Contact Information
                </h3>
                <div className="space-y-2">
                  <p className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-green-600" />
                    {user?.email || 'No email available'}
                  </p>
                  <p className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-green-600" />
                    {user?.phone || 'No phone available'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
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