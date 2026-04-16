/**
 * ProfileTab Component
 * ====================
 * Manages technician profile information including:
 * - Profile headline and bio
 * - Primary category (fetched from backend)
 * - Skills management
 * - Languages management
 * - Location with geocoding
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Globe, Award, Languages, User, Briefcase, Navigation } from 'lucide-react';
import api from '../../../services/api';

const ProfileTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  // State for dynamic form inputs
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', yearsOfExperience: 0 });
  const [newLanguage, setNewLanguage] = useState({ name: '', proficiency: 'Fluent' });
  
  // State for location services
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  // State for categories fetched from backend
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  // Static options for dropdowns
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const proficiencyLevels = ['Basic', 'Conversational', 'Fluent', 'Native'];

  /**
   * Fetch main categories from backend on component mount
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await api.get('/service-catalog/main-categories');
        setCategories(response.data.data);
        setCategoriesError('');
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategoriesError('Could not load categories. Please refresh the page.');
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  /**
   * Get current location using browser's geolocation API
   * Updates both coordinates and address fields
   */
  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError('');
    
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }
    
    // Request current position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        console.log('📍 Location captured:', { latitude, longitude });
        
        // Update form data with coordinates (GeoJSON format: [longitude, latitude])
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [longitude, latitude]
          }
        }));
        
        // Reverse geocode to get human-readable address
        await reverseGeocode(latitude, longitude);
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        // Handle different error types
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Please enable location access to help clients find you');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again');
            break;
          default:
            setLocationError(error.message);
        }
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /**
   * Reverse geocode coordinates to get address details
   * Uses OpenStreetMap's Nominatim API (free, no API key required)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.address) {
        // Update address fields with geocoded data
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.address.road || data.address.pedestrian || prev.address.street,
            city: data.address.city || data.address.town || data.address.village || prev.address.city,
            state: data.address.state || prev.address.state,
            country: data.address.country || 'Kenya',
            zipCode: data.address.postcode || prev.address.zipCode
          },
          location: {
            ...prev.location,
            formattedAddress: data.display_name
          }
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Don't show error to user - coordinates are still saved
    }
  };

  /**
   * Add a new skill to the skills array
   */
  const addSkill = () => {
    if (newSkill.name) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { ...newSkill }]
      });
      setNewSkill({ name: '', level: 'Intermediate', yearsOfExperience: 0 });
    }
  };

  /**
   * Remove a skill from the skills array by index
   * @param {number} index - Index of skill to remove
   */
  const removeSkill = (index) => {
    const updatedSkills = [...formData.skills];
    updatedSkills.splice(index, 1);
    setFormData({ ...formData, skills: updatedSkills });
  };

  /**
   * Add a new language to the languages array
   */
  const addLanguage = () => {
    if (newLanguage.name) {
      setFormData({
        ...formData,
        languages: [...formData.languages, { ...newLanguage }]
      });
      setNewLanguage({ name: '', proficiency: 'Fluent' });
    }
  };

  /**
   * Remove a language from the languages array by index
   * @param {number} index - Index of language to remove
   */
  const removeLanguage = (index) => {
    const updatedLanguages = [...formData.languages];
    updatedLanguages.splice(index, 1);
    setFormData({ ...formData, languages: updatedLanguages });
  };

  // ========== DISPLAY MODE (Non-editing) ==========
  if (!isEditing) {
    return (
      <div className="space-y-8">
        {/* Profile Headline */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
            <User className="w-3.5 h-3.5 mr-1.5" />
            Profile Headline
          </h3>
          <p className="text-gray-800 text-base">
            {formData.profileHeadline || '—'}
          </p>
        </div>

        {/* About Me */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
            About Me
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {formData.aboutMe || '—'}
          </p>
        </div>

        {/* Primary Category */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
            Primary Category
          </h3>
          <p className="text-gray-800 font-medium">
            {formData.category || '—'}
          </p>
        </div>

        {/* Skills */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Skills
          </h3>
          {formData.skills && formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
                >
                  {skill.name} ({skill.level})
                  {skill.yearsOfExperience > 0 && ` · ${skill.yearsOfExperience} yrs`}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No skills added yet</p>
          )}
        </div>

        {/* Languages */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
            <Languages className="w-3.5 h-3.5 mr-1.5" />
            Languages
          </h3>
          {formData.languages && formData.languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm"
                >
                  {lang.name} ({lang.proficiency})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No languages added</p>
          )}
        </div>

        {/* Location */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5" />
            Location
          </h3>
          <div className="space-y-1">
            {formData.address?.street && (
              <p className="text-gray-700">{formData.address.street}</p>
            )}
            <p className="text-gray-700">
              {formData.address?.city && `${formData.address.city}, `}
              {formData.address?.state}
              {formData.address?.zipCode && ` ${formData.address.zipCode}`}
            </p>
            <p className="text-gray-700">{formData.address?.country || 'Kenya'}</p>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Service radius: {formData.serviceRadius} km
            </p>
            
            {/* Display coordinates if they exist and are not default */}
            {formData.location?.coordinates && 
             formData.location.coordinates[0] !== 0 && 
             formData.location.coordinates[1] !== 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  📍 Location Coordinates
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 font-mono">
                    Latitude: <span className="text-gray-800">{formData.location.coordinates[1].toFixed(6)}°</span>
                  </p>
                  <p className="text-xs text-gray-600 font-mono">
                    Longitude: <span className="text-gray-800">{formData.location.coordinates[0].toFixed(6)}°</span>
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Clients can find you within {formData.serviceRadius} km radius
                  </p>
                </div>
              </div>
            )}
            
            {/* Warning if no coordinates set */}
            {(!formData.location?.coordinates || 
              formData.location.coordinates[0] === 0 || 
              formData.location.coordinates[1] === 0) && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-700">
                  ⚠️ No location coordinates set. Click "Edit Profile" and use "Update My Current Location" to help clients find you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== EDIT MODE ==========
  return (
    <div className="space-y-6">
      {/* Profile Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Headline
        </label>
        <input
          type="text"
          name="profileHeadline"
          value={formData.profileHeadline}
          onChange={handleInputChange}
          maxLength="200"
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="e.g., Expert Electrician with 10+ years experience"
        />
      </div>

      {/* About Me */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          About Me
        </label>
        <textarea
          name="aboutMe"
          value={formData.aboutMe}
          onChange={handleInputChange}
          rows="4"
          maxLength="2000"
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          placeholder="Tell clients about yourself, your experience, and your approach to work..."
        />
      </div>

      {/* Primary Category - Dynamically loaded from backend */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Category <span className="text-red-500">*</span>
        </label>
        {categoriesLoading ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
            <span className="text-sm text-gray-500">Loading categories...</span>
          </div>
        ) : categoriesError ? (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {categoriesError}
          </div>
        ) : (
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} {!cat.hasServices && '(coming soon)'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills
        </label>
        <div className="space-y-3">
          {/* Add Skill Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                placeholder="Skill name"
                className="p-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <select
                value={newSkill.level}
                onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                className="p-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
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
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>
          
          {/* Skills List */}
          {formData.skills.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Your Skills</p>
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <span className="font-medium text-gray-900">{skill.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({skill.level})</span>
                    {skill.yearsOfExperience > 0 && (
                      <span className="text-sm text-gray-500 ml-2">{skill.yearsOfExperience} years</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
        <div className="space-y-3">
          {/* Add Language Form */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newLanguage.name}
                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                placeholder="Language"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <select
                value={newLanguage.proficiency}
                onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
              >
                {proficiencyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addLanguage}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
          
          {/* Languages List */}
          {formData.languages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center border border-gray-200"
                >
                  {lang.name} ({lang.proficiency})
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        
        {/* Get Current Location Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {gettingLocation ? 'Getting Location...' : 'Update My Current Location'}
          </button>
          {locationError && (
            <p className="text-red-500 text-xs mt-2">{locationError}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Your location helps clients find you. Update when you move to a new area.
          </p>
        </div>
        
        {/* Show current coordinates status in edit mode */}
        {formData.location?.coordinates && 
         formData.location.coordinates[0] !== 0 && 
         formData.location.coordinates[1] !== 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" />
              ✓ Location coordinates saved
            </p>
            <p className="text-xs text-gray-600 font-mono">
              Lat: {formData.location.coordinates[1].toFixed(6)}°, Lng: {formData.location.coordinates[0].toFixed(6)}°
            </p>
          </div>
        )}
        
        {/* Address Form Fields */}
        <div className="space-y-3">
          <input
            type="text"
            name="address.street"
            value={formData.address.street}
            onChange={handleInputChange}
            placeholder="Street Address"
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleInputChange}
              placeholder="City"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleInputChange}
              placeholder="State/County"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="address.zipCode"
              value={formData.address.zipCode}
              onChange={handleInputChange}
              placeholder="Postal Code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <input
              type="text"
              name="address.country"
              value={formData.address.country}
              onChange={handleInputChange}
              placeholder="Country"
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Service Radius (km)</label>
            <input
              type="number"
              name="serviceRadius"
              value={formData.serviceRadius}
              onChange={handleInputChange}
              min="1"
              max="100"
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Clients within this radius will find you in their search results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;