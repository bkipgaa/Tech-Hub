/**
 * ProfileTab Component
 * ====================
 * Manages technician profile information with inline editing for
 * skills and languages.
 *
 * @version 3.0.0 – Inline edit for skills & languages
 */

import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, MapPin, Globe, Award, Languages,
  User, Briefcase, Navigation, Pencil, Save, X, Loader2,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const EMPTY_SKILL = { name: '', level: 'Intermediate', yearsOfExperience: 0 };
const EMPTY_LANGUAGE = { name: '', proficiency: 'Fluent' };

const ProfileTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  const { updateSkills, updateLanguages } = useAuth();

  // ── Add-form state ─────────────────────────────────────
  const [newSkill, setNewSkill] = useState({ ...EMPTY_SKILL });
  const [newLanguage, setNewLanguage] = useState({ ...EMPTY_LANGUAGE });

  // ── Inline-edit state ──────────────────────────────────
  const [editingSkillIdx, setEditingSkillIdx] = useState(null);
  const [editSkillData, setEditSkillData] = useState({ ...EMPTY_SKILL });
  const [savingSkill, setSavingSkill] = useState(false);

  const [editingLanguageIdx, setEditingLanguageIdx] = useState(null);
  const [editLanguageData, setEditLanguageData] = useState({ ...EMPTY_LANGUAGE });
  const [savingLanguage, setSavingLanguage] = useState(false);

  const [error, setError] = useState('');

  // ── Location state (unchanged) ─────────────────────────
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // ── Categories state (unchanged) ───────────────────────
  const [mainCategories, setMainCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState('');

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const proficiencyLevels = ['Basic', 'Conversational', 'Fluent', 'Native'];

  // ═══════════════════════════════════════════════════════
  // FETCH CATEGORIES (unchanged)
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError('');
        const response = await api.get('/service-catalog/complete');
        const catalogData = response.data?.data;
        if (catalogData && typeof catalogData === 'object' && Object.keys(catalogData).length > 0) {
          setMainCategories(
            Object.keys(catalogData).map((name) => ({
              name,
              hasServices: Array.isArray(catalogData[name]) && catalogData[name].length > 0,
            }))
          );
        } else {
          useFallbackCategories();
        }
      } catch (err) {
        console.error('❌ Failed to load categories:', err);
        useFallbackCategories();
      } finally {
        setCategoriesLoading(false);
      }
    };

    const useFallbackCategories = () => {
      const fallback = [
        'IT & Networking', 'Electrical Services', 'Mechanical Services', 'Plumbing',
        'Programming & AI', 'Hairdressing & Beauty', 'Carpentry & Furniture',
        'Laundry & Dry Cleaning', 'Cleaning Services', 'Painting & Decorating',
        'Welding & Fabrication', 'Automotive Repair', 'Tutoring & Training',
        'Photography & Videography', 'Event Planning', 'Construction & Renovation',
        'HVAC Services', 'Appliance Repair', 'Moving & Logistics', 'Gardening & Landscaping',
      ];
      setMainCategories(fallback.map((name) => ({ name, hasServices: true })));
      setCategoriesError('');
    };

    fetchCategories();
  }, []);

  // ═══════════════════════════════════════════════════════
  // LOCATION (unchanged)
  // ═══════════════════════════════════════════════════════
  const getCurrentLocation = () => {
    setGettingLocation(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          location: { ...prev.location, coordinates: [longitude, latitude] },
        }));
        await reverseGeocode(latitude, longitude);
        setGettingLocation(false);
      },
      (error) => {
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

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.address) {
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.address.road || data.address.pedestrian || prev.address.street,
            city: data.address.city || data.address.town || data.address.village || prev.address.city,
            state: data.address.state || prev.address.state,
            country: data.address.country || 'Kenya',
            zipCode: data.address.postcode || prev.address.zipCode,
          },
          location: { ...prev.location, formattedAddress: data.display_name },
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  // ═══════════════════════════════════════════════════════
  // SKILLS — add / edit / delete
  // ═══════════════════════════════════════════════════════
  const addSkill = () => {
    if (!newSkill.name) return;
    setFormData({ ...formData, skills: [...formData.skills, { ...newSkill }] });
    setNewSkill({ ...EMPTY_SKILL });
  };

  const removeSkill = async (index) => {
    const next = formData.skills.filter((_, i) => i !== index);
    setFormData({ ...formData, skills: next });
    if (editingSkillIdx === index) cancelEditSkill();
    const res = await updateSkills(next);
    if (!res.success) setError(res.error || 'Failed to delete skill');
  };

  const startEditSkill = (idx) => {
    setEditingSkillIdx(idx);
    setEditSkillData({ ...EMPTY_SKILL, ...formData.skills[idx] });
    setError('');
  };

  const cancelEditSkill = () => {
    setEditingSkillIdx(null);
    setEditSkillData({ ...EMPTY_SKILL });
  };

  const saveEditSkill = async () => {
    if (!editSkillData.name.trim()) {
      setError('Skill name is required');
      return;
    }
    setSavingSkill(true);
    setError('');
    const previous = formData.skills;
    const next = [...previous];
    next[editingSkillIdx] = editSkillData;
    setFormData({ ...formData, skills: next });

    const res = await updateSkills(next);
    setSavingSkill(false);
    if (res.success) cancelEditSkill();
    else {
      setFormData({ ...formData, skills: previous });
      setError(res.error || 'Failed to save skill');
    }
  };

  // ═══════════════════════════════════════════════════════
  // LANGUAGES — add / edit / delete
  // ═══════════════════════════════════════════════════════
  const addLanguage = () => {
    if (!newLanguage.name) return;
    setFormData({ ...formData, languages: [...formData.languages, { ...newLanguage }] });
    setNewLanguage({ ...EMPTY_LANGUAGE });
  };

  const removeLanguage = async (index) => {
    const next = formData.languages.filter((_, i) => i !== index);
    setFormData({ ...formData, languages: next });
    if (editingLanguageIdx === index) cancelEditLanguage();
    const res = await updateLanguages(next);
    if (!res.success) setError(res.error || 'Failed to delete language');
  };

  const startEditLanguage = (idx) => {
    setEditingLanguageIdx(idx);
    setEditLanguageData({ ...EMPTY_LANGUAGE, ...formData.languages[idx] });
    setError('');
  };

  const cancelEditLanguage = () => {
    setEditingLanguageIdx(null);
    setEditLanguageData({ ...EMPTY_LANGUAGE });
  };

  const saveEditLanguage = async () => {
    if (!editLanguageData.name.trim()) {
      setError('Language name is required');
      return;
    }
    setSavingLanguage(true);
    setError('');
    const previous = formData.languages;
    const next = [...previous];
    next[editingLanguageIdx] = editLanguageData;
    setFormData({ ...formData, languages: next });

    const res = await updateLanguages(next);
    setSavingLanguage(false);
    if (res.success) cancelEditLanguage();
    else {
      setFormData({ ...formData, languages: previous });
      setError(res.error || 'Failed to save language');
    }
  };

  // ═══════════════════════════════════════════════════════
  // MAIN CATEGORIES (unchanged)
  // ═══════════════════════════════════════════════════════
  const addMainCategory = () => {
    if (!selectedCategoryToAdd) return;
    if (formData.mainCategories?.includes(selectedCategoryToAdd)) {
      alert('This main category is already selected.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      mainCategories: [...(prev.mainCategories || []), selectedCategoryToAdd],
    }));
    setSelectedCategoryToAdd('');
  };

  const removeMainCategory = (categoryToRemove) => {
    setFormData((prev) => ({
      ...prev,
      mainCategories: prev.mainCategories.filter((cat) => cat !== categoryToRemove),
    }));
  };

  // ═══════════════════════════════════════════════════════
  // DISPLAY MODE
  // ═══════════════════════════════════════════════════════
  if (!isEditing) {
    return (
      <div className="space-y-8">
        {/* Headline */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
            <User className="w-3.5 h-3.5 mr-1.5" /> Profile Headline
          </h3>
          <p className="text-gray-800 text-base">{formData.profileHeadline || '—'}</p>
        </div>

        {/* About */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">About Me</h3>
          <p className="text-gray-700 leading-relaxed">{formData.aboutMe || '—'}</p>
        </div>

        {/* Main Categories */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
            <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Main Categories
          </h3>
          {formData.mainCategory && (
            <div className="mb-2">
              <span className="text-xs text-gray-500 mr-2">Primary:</span>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                {formData.mainCategory}
              </span>
            </div>
          )}
          {formData.mainCategories && formData.mainCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.mainCategories.map((cat, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {cat}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No additional main categories</p>
          )}
        </div>

        {/* Skills */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
            <Award className="w-3.5 h-3.5 mr-1.5" /> Skills
          </h3>
          {formData.skills && formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
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
            <Languages className="w-3.5 h-3.5 mr-1.5" /> Languages
          </h3>
          {formData.languages && formData.languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
                  {lang.name} ({lang.proficiency})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No languages added</p>
          )}
        </div>

        {/* Location (unchanged) */}
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1.5" /> Location
          </h3>
          <div className="space-y-1">
            {formData.address?.street && <p className="text-gray-700">{formData.address.street}</p>}
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
            {formData.location?.coordinates &&
              formData.location.coordinates[0] !== 0 &&
              formData.location.coordinates[1] !== 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> 📍 Location Coordinates
                  </p>
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
              )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Profile Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Headline</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
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

      {/* Main Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Main Categories <span className="text-red-500">*</span>
        </label>
        {categoriesLoading ? (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
            <span className="text-sm text-gray-500">Loading categories...</span>
          </div>
        ) : (
          <>
            {categoriesError && (
              <div className="mb-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs">
                {categoriesError}
              </div>
            )}
            <div className="flex gap-2 mb-2">
              <select
                value={selectedCategoryToAdd}
                onChange={(e) => setSelectedCategoryToAdd(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
              >
                <option value="">-- Select a main category --</option>
                {mainCategories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name} {cat.hasServices === false ? '(coming soon)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addMainCategory}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.mainCategories &&
                formData.mainCategories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeMainCategory(cat)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              You can select multiple main categories that best describe your expertise.
            </p>
          </>
        )}
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
        <div className="space-y-3">
          {/* Add form */}
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
                {skillLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newSkill.yearsOfExperience}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, yearsOfExperience: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Years"
                  min="0"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Saved skills with inline edit */}
          {formData.skills && formData.skills.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Your Skills</p>
              {formData.skills.map((skill, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {editingSkillIdx === index ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={editSkillData.name}
                          onChange={(e) => setEditSkillData({ ...editSkillData, name: e.target.value })}
                          placeholder="Skill name"
                          className="p-2 border-2 border-green-300 rounded-lg"
                        />
                        <select
                          value={editSkillData.level}
                          onChange={(e) => setEditSkillData({ ...editSkillData, level: e.target.value })}
                          className="p-2 border-2 border-green-300 rounded-lg bg-white"
                        >
                          {skillLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={editSkillData.yearsOfExperience}
                          onChange={(e) =>
                            setEditSkillData({
                              ...editSkillData,
                              yearsOfExperience: parseInt(e.target.value) || 0,
                            })
                          }
                          min="0"
                          placeholder="Years"
                          className="p-2 border-2 border-green-300 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEditSkill}
                          disabled={savingSkill}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 inline-flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                        >
                          {savingSkill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {savingSkill ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditSkill}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 inline-flex items-center justify-center gap-1.5 text-sm"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{skill.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({skill.level})</span>
                        {skill.yearsOfExperience > 0 && (
                          <span className="text-sm text-gray-500 ml-2">
                            {skill.yearsOfExperience} years
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditSkill(index)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
        <div className="space-y-3">
          {/* Add form */}
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
                {proficiencyLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addLanguage}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Saved languages with inline edit */}
          {formData.languages && formData.languages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Your Languages</p>
              {formData.languages.map((lang, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {editingLanguageIdx === index ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editLanguageData.name}
                          onChange={(e) => setEditLanguageData({ ...editLanguageData, name: e.target.value })}
                          placeholder="Language"
                          className="flex-1 p-2 border-2 border-green-300 rounded-lg"
                        />
                        <select
                          value={editLanguageData.proficiency}
                          onChange={(e) =>
                            setEditLanguageData({ ...editLanguageData, proficiency: e.target.value })
                          }
                          className="flex-1 p-2 border-2 border-green-300 rounded-lg bg-white"
                        >
                          {proficiencyLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEditLanguage}
                          disabled={savingLanguage}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 inline-flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                        >
                          {savingLanguage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {savingLanguage ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditLanguage}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 inline-flex items-center justify-center gap-1.5 text-sm"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        <span className="font-medium text-gray-900">{lang.name}</span>
                        <span className="text-gray-500 ml-2">({lang.proficiency})</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditLanguage(index)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLanguage(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location (unchanged) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
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
          {locationError && <p className="text-red-500 text-xs mt-2">{locationError}</p>}
          <p className="text-xs text-gray-500 mt-2">
            Your location helps clients find you. Update when you move to a new area.
          </p>
        </div>

        {formData.location?.coordinates &&
          formData.location.coordinates[0] !== 0 &&
          formData.location.coordinates[1] !== 0 && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" /> ✓ Location coordinates saved
              </p>
              <p className="text-xs text-gray-600 font-mono">
                Lat: {formData.location.coordinates[1].toFixed(6)}°, Lng:{' '}
                {formData.location.coordinates[0].toFixed(6)}°
              </p>
            </div>
          )}

        <div className="space-y-3">
          <input
            type="text"
            name="address.street"
            value={formData.address?.street || ''}
            onChange={handleInputChange}
            placeholder="Street Address"
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="address.city"
              value={formData.address?.city || ''}
              onChange={handleInputChange}
              placeholder="City"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <input
              type="text"
              name="address.state"
              value={formData.address?.state || ''}
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
              value={formData.address?.zipCode || ''}
              onChange={handleInputChange}
              placeholder="Postal Code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <input
              type="text"
              name="address.country"
              value={formData.address?.country || ''}
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
              value={formData.serviceRadius || 50}
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