import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Wrench, MapPin, Briefcase, Clock, Award, 
  Languages, Plus, Trash2, CheckCircle, AlertCircle,
  User, DollarSign, BadgeCheck as Certificate, Calendar, Globe, Settings,
  BookOpen, Image, Video, Star,Facebook, Twitter, Linkedin, Instagram, Youtube, 
} from 'lucide-react';
import api from '../services/api';

const CreateTechnicianProfile = () => {
  const { user, createTechnicianProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Service catalog data
  const [mainCategories, setMainCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [subServices, setSubServices] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Temporary selections for adding a service category
  const [tempServiceCategory, setTempServiceCategory] = useState('');
  const [tempSubServices, setTempSubServices] = useState([]);

  // Proficiency & skill levels
  const proficiencyLevels = ['Basic', 'Conversational', 'Fluent', 'Native'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Form state
  const [formData, setFormData] = useState({
    aboutMe: '',
    profileHeadline: '',
    skills: [],
    category: '',
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
      coordinates: [36.8219, -1.2921],
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
    socialLinks: {
      website: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: '',
      youtube: ''
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
    isAvailable: true
  });

  // --- Dynamic input states (unchanged from your original) ---
  const [newSkill, setNewSkill] = useState({ 
    name: '', 
    level: 'Intermediate', 
    yearsOfExperience: 0
  });
  const [newLanguage, setNewLanguage] = useState({ name: '', proficiency: 'Fluent' });
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
  const [newAchievement, setNewAchievement] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  // --- Fetch main categories on mount ---
  useEffect(() => {
    const fetchMainCategories = async () => {
      try {
        const response = await api.get('/service-catalog/main-categories');
        setMainCategories(response.data.data);
      } catch (err) {
        console.error('Failed to load main categories', err);
        setError('Could not load service categories. Please refresh the page.');
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchMainCategories();
  }, []);

  // --- When main category changes, fetch its service categories ---
  useEffect(() => {
    if (!formData.category) {
      setServiceCategories([]);
      setSubServices([]);
      setTempServiceCategory('');
      setTempSubServices([]);
      return;
    }

    const fetchServiceCategories = async () => {
      try {
        const response = await api.get(`/service-catalog/${formData.category}/service-categories`);
        setServiceCategories(response.data.data);
        // Reset temporary selections
        setTempServiceCategory('');
        setTempSubServices([]);
        setSubServices([]);
      } catch (err) {
        console.error('Failed to load service categories', err);
        setServiceCategories([]);
      }
    };
    fetchServiceCategories();
  }, [formData.category]);

  // --- When temporary service category changes, fetch its sub-services ---
  useEffect(() => {
    if (!formData.category || !tempServiceCategory) {
      setSubServices([]);
      return;
    }

    const fetchSubServices = async () => {
      try {
        const response = await api.get(`/service-catalog/${formData.category}/${tempServiceCategory}/sub-services`);
        setSubServices(response.data.data.subServices || []);
      } catch (err) {
        console.error('Failed to load sub-services', err);
        setSubServices([]);
      }
    };
    fetchSubServices();
  }, [formData.category, tempServiceCategory]);

  // --- Handlers for form fields (nested paths) ---
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandChild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent]?.[child],
              [grandChild]: type === 'checkbox' ? checked : value
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

  // --- Skills management ---
  const addSkill = () => {
    if (newSkill.name) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, { ...newSkill }]
      }));
      setNewSkill({ name: '', level: 'Intermediate', yearsOfExperience: 0 });
    }
  };
  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // --- Languages management ---
  const addLanguage = () => {
    if (newLanguage.name) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, { ...newLanguage }]
      }));
      setNewLanguage({ name: '', proficiency: 'Fluent' });
    }
  };
  const removeLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  // --- Education management ---
  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, { ...newEducation }]
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
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // --- Certifications management ---
  const addCertification = () => {
    if (newCertification.name && newCertification.issuingOrganization) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...newCertification }]
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
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  // --- Experience management ---
  const addAchievement = () => {
    if (newAchievement) {
      setNewExperience(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement]
      }));
      setNewAchievement('');
    }
  };
  const removeAchievement = (index) => {
    setNewExperience(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };
  const addExperience = () => {
    if (newExperience.title && newExperience.company) {
      setFormData(prev => ({
        ...prev,
        experience: [...prev.experience, { ...newExperience }]
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
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // --- Portfolio management ---
  const addTag = () => {
    if (newTag) {
      setNewPortfolio(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };
  const removeTag = (index) => {
    setNewPortfolio(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };
  const addPortfolio = () => {
    if (newPortfolio.title && newPortfolio.mediaUrl) {
      setFormData(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, { ...newPortfolio }]
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
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  // --- Payment methods ---
  const addPaymentMethod = () => {
    if (newPaymentMethod && !formData.pricing.paymentMethods.includes(newPaymentMethod)) {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          paymentMethods: [...prev.pricing.paymentMethods, newPaymentMethod]
        }
      }));
      setNewPaymentMethod('');
    }
  };
  const removePaymentMethod = (method) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        paymentMethods: prev.pricing.paymentMethods.filter(m => m !== method)
      }
    }));
  };

  // --- Service categories (using catalog data) ---
  const addServiceCategory = () => {
    if (!tempServiceCategory) {
      setError('Please select a service category');
      return;
    }
    if (tempSubServices.length === 0) {
      setError('Please select at least one sub-service for this category');
      return;
    }
    if (formData.serviceCategories.some(sc => sc.categoryName === tempServiceCategory)) {
      setError('This service category is already added');
      return;
    }
    setFormData(prev => ({
      ...prev,
      serviceCategories: [
        ...prev.serviceCategories,
        { categoryName: tempServiceCategory, subServices: [...tempSubServices] }
      ]
    }));
    // Reset temporary selections
    setTempServiceCategory('');
    setTempSubServices([]);
    setError('');
  };

  const removeServiceCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.filter((_, i) => i !== index)
    }));
  };

  // Toggle sub-service selection
  const toggleSubService = (subName) => {
    setTempSubServices(prev =>
      prev.includes(subName) ? prev.filter(s => s !== subName) : [...prev, subName]
    );
  };

  // --- Submit handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.category) {
      setError('Please select a main category');
      setLoading(false);
      return;
    }
    if (!formData.address.city || !formData.address.state) {
      setError('City and state are required');
      setLoading(false);
      return;
    }

    const submitData = {
      ...formData,
      yearsOfExperience: Number(formData.yearsOfExperience)
    };

    const result = await createTechnicianProfile(submitData);
    setLoading(false);
    if (result.success) {
      navigate('/technician-dashboard');
    } else {
      setError(result.error || 'Failed to create profile');
    }
  };

  if (catalogLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-red-600 px-6 py-8">
          <div className="flex items-center space-x-4">
            <Wrench className="w-12 h-12 text-white" />
            <div>
              <h1 className="text-3xl font-bold text-white">Create Technician Profile</h1>
              <p className="text-green-100">Complete your profile to start offering services</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-8">
            {/* ========== BASIC INFO ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-green-600" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Headline</label>
                  <input
                    type="text"
                    name="profileHeadline"
                    value={formData.profileHeadline}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="e.g., Expert Electrician with 10+ years experience"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
                  <textarea
                    name="aboutMe"
                    value={formData.aboutMe}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="Your Business Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Registration Number (Optional)</label>
                  <input
                    type="text"
                    name="businessRegistrationNumber"
                    value={formData.businessRegistrationNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="e.g., BRN-2024-00123"
                  />
                </div>
              </div>
            </div>

            {/* ========== SERVICES OFFERED (Dynamic from catalog) ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Wrench className="w-6 h-6 mr-2 text-green-600" />
                Services Offered
              </h2>
              <div className="space-y-4">
                {/* Main Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  >
                    <option value="">Select a category</option>
                    {mainCategories.map(cat => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name} {!cat.hasServices && '(coming soon)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Service Categories (only if main category selected) */}
                {formData.category && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Service Category
                    </label>
                    <div className="space-y-3">
                      <select
                        value={tempServiceCategory}
                        onChange={(e) => {
                          setTempServiceCategory(e.target.value);
                          setTempSubServices([]);
                        }}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg"
                      >
                        <option value="">Select a service category</option>
                        {serviceCategories.map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name} ({cat.subServiceCount} sub-services)
                          </option>
                        ))}
                      </select>

                      {/* Sub-services checkboxes */}
                      {tempServiceCategory && subServices.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Sub-Services you offer
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                            {subServices.map(sub => (
                              <label key={sub.name} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={tempSubServices.includes(sub.name)}
                                  onChange={() => toggleSubService(sub.name)}
                                  className="h-4 w-4 text-green-600 rounded"
                                />
                                <span className="text-sm text-gray-700">{sub.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={addServiceCategory}
                        className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Display added service categories */}
                {formData.serviceCategories.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Selected Service Categories
                    </label>
                    <div className="space-y-2">
                      {formData.serviceCategories.map((sc, idx) => (
                        <div key={idx} className="bg-green-50 p-3 rounded-lg flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-green-800">{sc.categoryName}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sc.subServices.map(sub => (
                                <span key={sub} className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeServiceCategory(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========== SKILLS ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Award className="w-6 h-6 mr-2 text-green-600" />
                Skills
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                    placeholder="Skill name"
                    className="p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <select
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}
                    className="p-3 border-2 border-gray-300 rounded-lg"
                  >
                    {skillLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={newSkill.yearsOfExperience}
                    onChange={(e) => setNewSkill({...newSkill, yearsOfExperience: parseInt(e.target.value) || 0})}
                    placeholder="Years of experience"
                    className="p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <button type="button" onClick={addSkill} className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700">
                    Add Skill
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">{skill.name}</span>
                      <span className="ml-2 text-sm text-gray-600">({skill.level})</span>
                      <span className="ml-2 text-sm text-gray-500">{skill.yearsOfExperience} years</span>
                    </div>
                    <button type="button" onClick={() => removeSkill(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ========== EXPERIENCE ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Briefcase className="w-6 h-6 mr-2 text-green-600" />
                Experience
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Years of Experience <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                  min="0"
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-800 mb-4">Add Work Experience</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({...newExperience, title: e.target.value})}
                    placeholder="Job Title"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newExperience.company}
                    onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                    placeholder="Company"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newExperience.location}
                    onChange={(e) => setNewExperience({...newExperience, location: e.target.value})}
                    placeholder="Location"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={newExperience.startDate}
                      onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})}
                      className="p-3 border-2 border-gray-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={newExperience.endDate}
                      onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})}
                      disabled={newExperience.isCurrent}
                      className="p-3 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newExperience.isCurrent}
                      onChange={(e) => setNewExperience({...newExperience, isCurrent: e.target.checked})}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">I currently work here</label>
                  </div>
                  <textarea
                    value={newExperience.description}
                    onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
                    placeholder="Job Description"
                    rows="3"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achievements</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newAchievement}
                        onChange={(e) => setNewAchievement(e.target.value)}
                        placeholder="Add achievement"
                        className="flex-1 p-2 border-2 border-gray-300 rounded-lg"
                      />
                      <button type="button" onClick={addAchievement} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {newExperience.achievements.map((ach, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                          <span className="text-sm">{ach}</span>
                          <button type="button" onClick={() => removeAchievement(idx)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={addExperience} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Add Experience
                  </button>
                </div>
              </div>
              {formData.experience.map((exp, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-gray-600">{exp.company} • {exp.location}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                      </p>
                      {exp.description && <p className="mt-2 text-gray-700">{exp.description}</p>}
                    </div>
                    <button type="button" onClick={() => removeExperience(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ========== EDUCATION ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-green-600" />
                Education
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newEducation.institution}
                    onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                    placeholder="Institution"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                    placeholder="Degree"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newEducation.fieldOfStudy}
                    onChange={(e) => setNewEducation({...newEducation, fieldOfStudy: e.target.value})}
                    placeholder="Field of Study"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={newEducation.startDate}
                      onChange={(e) => setNewEducation({...newEducation, startDate: e.target.value})}
                      className="p-3 border-2 border-gray-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={newEducation.endDate}
                      onChange={(e) => setNewEducation({...newEducation, endDate: e.target.value})}
                      disabled={newEducation.isCurrent}
                      className="p-3 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newEducation.isCurrent}
                      onChange={(e) => setNewEducation({...newEducation, isCurrent: e.target.checked})}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">I am currently studying here</label>
                  </div>
                  <input
                    type="text"
                    value={newEducation.grade}
                    onChange={(e) => setNewEducation({...newEducation, grade: e.target.value})}
                    placeholder="Grade (optional)"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={newEducation.description}
                    onChange={(e) => setNewEducation({...newEducation, description: e.target.value})}
                    placeholder="Description"
                    rows="3"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <button type="button" onClick={addEducation} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Add Education
                  </button>
                </div>
              </div>
              {formData.education.map((edu, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</h4>
                      <p className="text-gray-600">{edu.institution}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(edu.startDate).toLocaleDateString()} - {edu.isCurrent ? 'Present' : new Date(edu.endDate).toLocaleDateString()}
                      </p>
                      {edu.grade && <p className="text-sm text-gray-600">Grade: {edu.grade}</p>}
                    </div>
                    <button type="button" onClick={() => removeEducation(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ========== CERTIFICATIONS ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Certificate className="w-6 h-6 mr-2 text-green-600" />
                Certifications
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newCertification.name}
                    onChange={(e) => setNewCertification({...newCertification, name: e.target.value})}
                    placeholder="Certification Name"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newCertification.issuingOrganization}
                    onChange={(e) => setNewCertification({...newCertification, issuingOrganization: e.target.value})}
                    placeholder="Issuing Organization"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={newCertification.issueDate}
                      onChange={(e) => setNewCertification({...newCertification, issueDate: e.target.value})}
                      className="p-3 border-2 border-gray-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={newCertification.expiryDate}
                      onChange={(e) => setNewCertification({...newCertification, expiryDate: e.target.value})}
                      disabled={newCertification.doesNotExpire}
                      className="p-3 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCertification.doesNotExpire}
                      onChange={(e) => setNewCertification({...newCertification, doesNotExpire: e.target.checked})}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">This certification does not expire</label>
                  </div>
                  <input
                    type="text"
                    value={newCertification.credentialId}
                    onChange={(e) => setNewCertification({...newCertification, credentialId: e.target.value})}
                    placeholder="Credential ID"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="url"
                    value={newCertification.credentialUrl}
                    onChange={(e) => setNewCertification({...newCertification, credentialUrl: e.target.value})}
                    placeholder="Credential URL"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <button type="button" onClick={addCertification} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Add Certification
                  </button>
                </div>
              </div>
              {formData.certifications.map((cert, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold">{cert.name}</h4>
                      <p className="text-gray-600">{cert.issuingOrganization}</p>
                      <p className="text-sm text-gray-500">
                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                        {!cert.doesNotExpire && cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeCertification(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ========== PORTFOLIO ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Image className="w-6 h-6 mr-2 text-green-600" />
                Portfolio
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newPortfolio.title}
                    onChange={(e) => setNewPortfolio({...newPortfolio, title: e.target.value})}
                    placeholder="Project Title"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={newPortfolio.description}
                    onChange={(e) => setNewPortfolio({...newPortfolio, description: e.target.value})}
                    placeholder="Project Description"
                    rows="3"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newPortfolio.mediaType}
                      onChange={(e) => setNewPortfolio({...newPortfolio, mediaType: e.target.value})}
                      className="p-3 border-2 border-gray-300 rounded-lg"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                    </select>
                    <input
                      type="text"
                      value={newPortfolio.category}
                      onChange={(e) => setNewPortfolio({...newPortfolio, category: e.target.value})}
                      placeholder="Category"
                      className="p-3 border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                  <input
                    type="url"
                    value={newPortfolio.mediaUrl}
                    onChange={(e) => setNewPortfolio({...newPortfolio, mediaUrl: e.target.value})}
                    placeholder="Media URL"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="url"
                    value={newPortfolio.thumbnailUrl}
                    onChange={(e) => setNewPortfolio({...newPortfolio, thumbnailUrl: e.target.value})}
                    placeholder="Thumbnail URL (optional)"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newPortfolio.clientName}
                    onChange={(e) => setNewPortfolio({...newPortfolio, clientName: e.target.value})}
                    placeholder="Client Name"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <input
                    type="date"
                    value={newPortfolio.completionDate}
                    onChange={(e) => setNewPortfolio({...newPortfolio, completionDate: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        className="flex-1 p-2 border-2 border-gray-300 rounded-lg"
                      />
                      <button type="button" onClick={addTag} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newPortfolio.tags.map((tag, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                          {tag}
                          <button type="button" onClick={() => removeTag(idx)} className="ml-1 text-blue-500 hover:text-blue-700">
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
                      onChange={(e) => setNewPortfolio({...newPortfolio, isFeatured: e.target.checked})}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Feature this item</label>
                  </div>
                  <button type="button" onClick={addPortfolio} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Add to Portfolio
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.portfolio.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        {item.mediaType === 'image' && <Image className="w-4 h-4 text-gray-500 mt-1" />}
                        {item.mediaType === 'video' && <Video className="w-4 h-4 text-gray-500 mt-1" />}
                        {item.isFeatured && <Star className="w-4 h-4 text-yellow-500 mt-1" />}
                      </div>
                      <button type="button" onClick={() => removePortfolio(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ========== LANGUAGES ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Languages className="w-6 h-6 mr-2 text-green-600" />
                Languages
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    value={newLanguage.name}
                    onChange={(e) => setNewLanguage({...newLanguage, name: e.target.value})}
                    placeholder="Language"
                    className="p-3 border-2 border-gray-300 rounded-lg"
                  />
                  <select
                    value={newLanguage.proficiency}
                    onChange={(e) => setNewLanguage({...newLanguage, proficiency: e.target.value})}
                    className="p-3 border-2 border-gray-300 rounded-lg"
                  >
                    {proficiencyLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addLanguage} className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700">
                    Add Language
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                    {lang.name} ({lang.proficiency})
                    <button type="button" onClick={() => removeLanguage(index)} className="ml-2 text-red-500 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* ========== LOCATION ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-green-600" />
                Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="ZIP Code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Radius (km)</label>
                  <input
                    type="number"
                    name="serviceRadius"
                    value={formData.serviceRadius}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========== PRICING ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                Pricing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (KES)</label>
                  <input
                    type="number"
                    name="pricing.hourlyRate"
                    value={formData.pricing.hourlyRate}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Price (KES)</label>
                  <input
                    type="number"
                    name="pricing.fixedPrice"
                    value={formData.pricing.fixedPrice}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (KES)</label>
                  <input
                    type="number"
                    name="pricing.consultationFee"
                    value={formData.pricing.consultationFee}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Methods</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    placeholder="Add payment method"
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                  <button type="button" onClick={addPaymentMethod} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.pricing.paymentMethods.map((method, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                      {method}
                      <button type="button" onClick={() => removePaymentMethod(method)} className="ml-2 text-red-500 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ========== AVAILABILITY ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-green-600" />
                Availability
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-medium text-gray-700 capitalize">{day}</label>
                      <input
                        type="checkbox"
                        checked={formData.availability[day].enabled}
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
                        className="h-4 w-4 text-green-600 rounded"
                      />
                    </div>
                    {formData.availability[day].enabled && (
                      <div>
                        {formData.availability[day].hours.map((hour, idx) => (
                          <div key={idx} className="flex items-center space-x-2 mt-2">
                            <input
                              type="time"
                              value={hour.start}
                              onChange={(e) => {
                                const updated = [...formData.availability[day].hours];
                                updated[idx] = { ...updated[idx], start: e.target.value };
                                setFormData(prev => ({
                                  ...prev,
                                  availability: {
                                    ...prev.availability,
                                    [day]: { ...prev.availability[day], hours: updated }
                                  }
                                }));
                              }}
                              className="p-2 border-2 border-gray-300 rounded-lg"
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={hour.end}
                              onChange={(e) => {
                                const updated = [...formData.availability[day].hours];
                                updated[idx] = { ...updated[idx], end: e.target.value };
                                setFormData(prev => ({
                                  ...prev,
                                  availability: {
                                    ...prev.availability,
                                    [day]: { ...prev.availability[day], hours: updated }
                                  }
                                }));
                              }}
                              className="p-2 border-2 border-gray-300 rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="emergencyAvailable"
                    checked={formData.emergencyAvailable}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 rounded"
                  />
                  <label className="ml-2 text-gray-700">Available for emergency services</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="remoteServiceAvailable"
                    checked={formData.remoteServiceAvailable}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 rounded"
                  />
                  <label className="ml-2 text-gray-700">Available for remote services</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="weekendAvailable"
                    checked={formData.weekendAvailable}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 rounded"
                  />
                  <label className="ml-2 text-gray-700">Available on weekends</label>
                </div>
              </div>
            </div>

            {/* ========== SOCIAL LINKS ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Globe className="w-6 h-6 mr-2 text-green-600" />
                Social Links
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-gray-500" />
                  <input
                    type="url"
                    name="socialLinks.website"
                    value={formData.socialLinks.website}
                    onChange={handleInputChange}
                    placeholder="Website URL"
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Facebook className="w-5 h-5 text-blue-600" />
                  <input
                    type="url"
                    name="socialLinks.facebook"
                    value={formData.socialLinks.facebook}
                    onChange={handleInputChange}
                    placeholder="Facebook URL"
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Twitter className="w-5 h-5 text-blue-400" />
                  <input
                    type="url"
                    name="socialLinks.twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleInputChange}
                    placeholder="Twitter URL"
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  <input
                    type="url"
                    name="socialLinks.linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleInputChange}
                    placeholder="LinkedIn URL"
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  <input
                    type="url"
                    name="socialLinks.instagram"
                    value={formData.socialLinks.instagram}
                    onChange={handleInputChange}
                    placeholder="Instagram URL"
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Youtube className="w-5 h-5 text-red-600" />
                  <input
                    type="url"
                    name="socialLinks.youtube"
                    value={formData.socialLinks.youtube}
                    onChange={handleInputChange}
                    placeholder="YouTube URL"
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ========== SETTINGS ========== */}
            <div className="border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-green-600" />
                Settings
              </h2>
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Privacy Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Show email on profile</label>
                      <input type="checkbox" name="settings.showEmail" checked={formData.settings.showEmail} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Show phone on profile</label>
                      <input type="checkbox" name="settings.showPhone" checked={formData.settings.showPhone} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Booking Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Allow instant booking</label>
                      <input type="checkbox" name="settings.instantBooking" checked={formData.settings.instantBooking} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Require approval for bookings</label>
                      <input type="checkbox" name="settings.requiresApproval" checked={formData.settings.requiresApproval} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Auto-accept jobs</label>
                      <input type="checkbox" name="settings.autoAcceptJobs" checked={formData.settings.autoAcceptJobs} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Notification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Email notifications</label>
                      <input type="checkbox" name="settings.notifications.email" checked={formData.settings.notifications.email} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">SMS notifications</label>
                      <input type="checkbox" name="settings.notifications.sms" checked={formData.settings.notifications.sms} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Push notifications</label>
                      <input type="checkbox" name="settings.notifications.push" checked={formData.settings.notifications.push} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Job reminders</label>
                      <input type="checkbox" name="settings.jobReminders" checked={formData.settings.jobReminders} onChange={handleInputChange} className="h-4 w-4 text-green-600 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-green-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Profile...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Create Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTechnicianProfile;