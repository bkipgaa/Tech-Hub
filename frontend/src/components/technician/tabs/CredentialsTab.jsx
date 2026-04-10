import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

/**
 * CredentialsTab Component
 * Manages technician's education, certifications, and work experience
 * Features: Add/remove education, certifications, experience entries with achievements
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.formData - Main form data containing credentials arrays
 * @param {Function} props.setFormData - Function to update form data
 * @param {boolean} props.isEditing - Whether the form is in edit mode
 * @param {Function} props.handleInputChange - Function to handle input changes
 */
const CredentialsTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  // State for new education entry
  const [newEducation, setNewEducation] = useState({
    institution: '',        // School/university name
    degree: '',             // Degree/certificate obtained
    fieldOfStudy: '',       // Major/specialization
    startDate: '',          // Start date
    endDate: '',            // End date (if not current)
    isCurrent: false,       // Currently studying flag
    description: '',        // Additional details
    grade: ''               // Grades achieved
  });

  // State for new certification entry
  const [newCertification, setNewCertification] = useState({
    name: '',                       // Certification name
    issuingOrganization: '',        // Organization that issued it
    issueDate: '',                  // Date issued
    expiryDate: '',                 // Expiration date
    credentialId: '',               // Certificate ID
    credentialUrl: '',              // Verification URL
    doesNotExpire: false            // Never expires flag
  });

  // State for new experience entry
  const [newExperience, setNewExperience] = useState({
    title: '',              // Job title
    company: '',            // Company name
    location: '',           // Work location
    startDate: '',          // Start date
    endDate: '',            // End date (if not current)
    isCurrent: false,       // Currently working flag
    description: '',        // Job description
    achievements: []        // Array of achievements
  });

  // State for new achievement being added
  const [newAchievement, setNewAchievement] = useState('');

  /**
   * ====================================
   * EDUCATION FUNCTIONS
   * ====================================
   */

  /**
   * Add a new education entry
   * Validates required fields before adding
   */
  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setFormData({
        ...formData,
        education: [...formData.education, newEducation]
      });
      // Reset form
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

  /**
   * Remove an education entry by index
   * @param {number} index - Index of the entry to remove
   */
  const removeEducation = (index) => {
    const updatedEducation = [...formData.education];
    updatedEducation.splice(index, 1);
    setFormData({ ...formData, education: updatedEducation });
  };

  /**
   * ====================================
   * CERTIFICATION FUNCTIONS
   * ====================================
   */

  /**
   * Add a new certification
   * Validates required fields before adding
   */
  const addCertification = () => {
    if (newCertification.name && newCertification.issuingOrganization) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, newCertification]
      });
      // Reset form
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

  /**
   * Remove a certification by index
   * @param {number} index - Index of the certification to remove
   */
  const removeCertification = (index) => {
    const updatedCertifications = [...formData.certifications];
    updatedCertifications.splice(index, 1);
    setFormData({ ...formData, certifications: updatedCertifications });
  };

  /**
   * ====================================
   * EXPERIENCE FUNCTIONS
   * ====================================
   */

  /**
   * Add a new work experience entry
   * Validates required fields before adding
   */
  const addExperience = () => {
    if (newExperience.title && newExperience.company) {
      setFormData({
        ...formData,
        experience: [...formData.experience, newExperience]
      });
      // Reset form
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

  /**
   * Remove an experience entry by index
   * @param {number} index - Index of the entry to remove
   */
  const removeExperience = (index) => {
    const updatedExperience = [...formData.experience];
    updatedExperience.splice(index, 1);
    setFormData({ ...formData, experience: updatedExperience });
  };

  /**
   * Add an achievement to a specific experience entry
   * @param {number} experienceIndex - Index of the experience entry
   */
  const addAchievement = (experienceIndex) => {
    if (newAchievement) {
      const updatedExperience = [...formData.experience];
      // Initialize achievements array if it doesn't exist
      updatedExperience[experienceIndex].achievements = [
        ...(updatedExperience[experienceIndex].achievements || []),
        newAchievement
      ];
      setFormData({ ...formData, experience: updatedExperience });
      setNewAchievement(''); // Clear input
    }
  };

  /**
   * Remove an achievement from a specific experience entry
   * @param {number} experienceIndex - Index of the experience entry
   * @param {number} achievementIndex - Index of the achievement to remove
   */
  const removeAchievement = (experienceIndex, achievementIndex) => {
    const updatedExperience = [...formData.experience];
    updatedExperience[experienceIndex].achievements.splice(achievementIndex, 1);
    setFormData({ ...formData, experience: updatedExperience });
  };

  return (
    <div className="space-y-6">
      {/* ===== YEARS OF EXPERIENCE ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Years of Experience
        </label>
        {isEditing ? (
          <input
            type="number"
            name="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={handleInputChange}
            min="0"
            className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
          />
        ) : (
          <p className="text-gray-900 font-medium">{formData.yearsOfExperience} years</p>
        )}
      </div>

      {/* ===== EDUCATION SECTION ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Education
        </label>
        {isEditing ? (
          <div className="space-y-4">
            {/* Add Education Form */}
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
              <button
                type="button"
                onClick={addEducation}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Add Education
              </button>
            </div>

            {/* Display Education Entries */}
            <div className="space-y-3">
              {formData.education.map((edu, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                      <p className="text-sm text-gray-700">{edu.institution}</p>
                      {edu.fieldOfStudy && (
                        <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {edu.startDate && new Date(edu.startDate).getFullYear()} - 
                        {edu.isCurrent ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ''}
                      </p>
                      {edu.description && (
                        <p className="text-sm text-gray-600 mt-2">{edu.description}</p>
                      )}
                      {edu.grade && (
                        <p className="text-xs text-green-600 mt-1">Grade: {edu.grade}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEducation(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // View Mode - Display education entries
          <div className="space-y-3">
            {formData.education.map((edu, idx) => (
              <div key={idx} className="border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                <p className="text-sm text-gray-700">{edu.institution}</p>
                {edu.fieldOfStudy && (
                  <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {edu.startDate && new Date(edu.startDate).getFullYear()} - 
                  {edu.isCurrent ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== CERTIFICATIONS SECTION ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Certifications
        </label>
        {isEditing ? (
          <div className="space-y-4">
            {/* Add Certification Form */}
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
                  placeholder="Issue Date"
                  className="p-2 border-2 border-green-300 rounded-lg"
                />
                <input
                  type="date"
                  value={newCertification.expiryDate}
                  onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
                  disabled={newCertification.doesNotExpire}
                  placeholder="Expiry Date"
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
              <button
                type="button"
                onClick={addCertification}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Add Certification
              </button>
            </div>

            {/* Display Certification Entries */}
            <div className="space-y-3">
              {formData.certifications.map((cert, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                      <p className="text-sm text-gray-700">{cert.issuingOrganization}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Issued: {cert.issueDate && new Date(cert.issueDate).toLocaleDateString()}
                        {!cert.doesNotExpire && cert.expiryDate && ` · Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                        {cert.doesNotExpire && ' · No Expiry'}
                      </p>
                      {cert.credentialId && (
                        <p className="text-xs text-gray-500">ID: {cert.credentialId}</p>
                      )}
                      {cert.verified && (
                        <span className="inline-flex items-center mt-1 text-xs text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" /> Verified
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertification(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // View Mode - Display certification entries
          <div className="space-y-3">
            {formData.certifications.map((cert, idx) => (
              <div key={idx} className="border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                <p className="text-sm text-gray-700">{cert.issuingOrganization}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Issued: {cert.issueDate && new Date(cert.issueDate).toLocaleDateString()}
                </p>
                {cert.verified && (
                  <span className="inline-flex items-center mt-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== WORK EXPERIENCE SECTION ===== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Experience
        </label>
        {isEditing ? (
          <div className="space-y-4">
            {/* Add Experience Form */}
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
              
              {/* Achievements Section within Experience */}
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
              
              <button
                type="button"
                onClick={addExperience}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Add Experience
              </button>
            </div>

            {/* Display Experience Entries */}
            <div className="space-y-3">
              {formData.experience.map((exp, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                      <p className="text-sm text-gray-700">{exp.company}</p>
                      {exp.location && (
                        <p className="text-xs text-gray-600">{exp.location}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {exp.startDate && new Date(exp.startDate).toLocaleDateString()} - 
                        {exp.isCurrent ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ''}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-gray-600 mt-2">{exp.description}</p>
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Achievements:</p>
                          <ul className="list-disc list-inside">
                            {exp.achievements.map((ach, aidx) => (
                              <li key={aidx} className="text-xs text-gray-600">{ach}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExperience(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // View Mode - Display experience entries
          <div className="space-y-3">
            {formData.experience.map((exp, idx) => (
              <div key={idx} className="border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                <p className="text-sm text-gray-700">{exp.company}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {exp.startDate && new Date(exp.startDate).toLocaleDateString()} - 
                  {exp.isCurrent ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CredentialsTab;