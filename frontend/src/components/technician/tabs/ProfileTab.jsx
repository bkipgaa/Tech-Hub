import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const ProfileTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate', yearsOfExperience: 0 });
  const [newLanguage, setNewLanguage] = useState({ name: '', proficiency: 'Fluent' });

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const proficiencyLevels = ['Basic', 'Conversational', 'Fluent', 'Native'];
  
  const categories = [
    'IT & Networking', 'Electrical Services', 'Mechanical Services', 'Plumbing',
    'Programming & AI', 'Hairdressing & Beauty', 'Carpentry & Furniture',
    'Laundry & Dry Cleaning', 'Cleaning Services', 'Painting & Decorating',
    'Welding & Fabrication', 'Automotive Repair', 'Tutoring & Training',
    'Photography & Videography', 'Event Planning', 'Construction & Renovation',
    'HVAC Services', 'Appliance Repair', 'Moving & Logistics', 'Gardening & Landscaping'
  ];

  // Skills Management
  const addSkill = () => {
    if (newSkill.name) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill]
      });
      setNewSkill({ name: '', level: 'Intermediate', yearsOfExperience: 0 });
    }
  };

  const removeSkill = (index) => {
    const updatedSkills = [...formData.skills];
    updatedSkills.splice(index, 1);
    setFormData({ ...formData, skills: updatedSkills });
  };

  // Languages Management
  const addLanguage = () => {
    if (newLanguage.name) {
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage]
      });
      setNewLanguage({ name: '', proficiency: 'Fluent' });
    }
  };

  const removeLanguage = (index) => {
    const updatedLanguages = [...formData.languages];
    updatedLanguages.splice(index, 1);
    setFormData({ ...formData, languages: updatedLanguages });
  };

  return (
    <div className="space-y-6">
      {/* Profile Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Headline
        </label>
        {isEditing ? (
          <input
            type="text"
            name="profileHeadline"
            value={formData.profileHeadline}
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          About Me
        </label>
        {isEditing ? (
          <textarea
            name="aboutMe"
            value={formData.aboutMe}
            onChange={handleInputChange}
            rows="4"
            maxLength="2000"
            className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            placeholder="Tell clients about yourself, your experience, and your approach to work..."
          />
        ) : (
          <p className="text-gray-700">{formData.aboutMe || 'No bio provided'}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Category
        </label>
        {isEditing ? (
          <select
            name="category"
            value={formData.category}
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
          <p className="text-gray-900 font-medium">{formData.category || 'Not specified'}</p>
        )}
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills
        </label>
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
                  onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: parseInt(e.target.value) })}
                  placeholder="Years"
                  min="0"
                  className="flex-1 p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div>
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({skill.level})</span>
                    <span className="text-sm text-gray-600 ml-2">{skill.yearsOfExperience} years</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {formData.skills.map((skill, index) => (
              <div key={index} className="bg-green-50 p-2 rounded">
                <span className="font-medium">{skill.name}</span>
                <span className="text-sm text-gray-600 ml-2">({skill.level})</span>
                {skill.yearsOfExperience > 0 && (
                  <span className="text-sm text-gray-600 ml-2">{skill.yearsOfExperience} years</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages
        </label>
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
              <button
                type="button"
                onClick={addLanguage}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.languages.map((lang, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {lang.name} ({lang.proficiency})
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {formData.languages.map((lang, index) => (
              <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {lang.name} ({lang.proficiency})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              placeholder="Street Address"
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                placeholder="City"
                required
                className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
              <input
                type="text"
                name="address.state"
                value={formData.address.state}
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
                value={formData.address.zipCode}
                onChange={handleInputChange}
                placeholder="Postal Code"
                className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
              <input
                type="text"
                name="address.country"
                value={formData.address.country}
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
                value={formData.serviceRadius}
                onChange={handleInputChange}
                min="1"
                max="100"
                className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-900">{formData.address.street}</p>
            <p className="text-gray-600">
              {formData.address.city}, {formData.address.state} {formData.address.zipCode}
            </p>
            <p className="text-gray-600">{formData.address.country}</p>
            <p className="text-sm text-green-600 mt-2">Service radius: {formData.serviceRadius} km</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;