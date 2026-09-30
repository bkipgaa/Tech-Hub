/**
 * CredentialsTab.jsx
 * ==================
 * Manages technician's education, certifications, and work experience.
 * Supports inline editing of every individual entry — each Save persists
 * immediately via the granular section endpoints.
 *
 * @version 3.0.0 – Inline edit with API persistence
 */

import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Pencil, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const EMPTY_EDUCATION = {
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  grade: '',
};

const EMPTY_CERTIFICATION = {
  name: '',
  issuingOrganization: '',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
  credentialUrl: '',
  doesNotExpire: false,
};

const EMPTY_EXPERIENCE = {
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  achievements: [],
};

const CredentialsTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  const { updateEducation, updateCertifications, updateExperience } = useAuth();

  // ─── Add-form state ─────────────────────────────────────
  const [newEducation, setNewEducation] = useState({ ...EMPTY_EDUCATION });
  const [newCertification, setNewCertification] = useState({ ...EMPTY_CERTIFICATION });
  const [newExperience, setNewExperience] = useState({ ...EMPTY_EXPERIENCE });
  const [newAchievement, setNewAchievement] = useState('');

  // ─── Inline-edit state ──────────────────────────────────
  const [editingEducationIdx, setEditingEducationIdx] = useState(null);
  const [editEducationData, setEditEducationData] = useState({ ...EMPTY_EDUCATION });

  const [editingCertificationIdx, setEditingCertificationIdx] = useState(null);
  const [editCertificationData, setEditCertificationData] = useState({ ...EMPTY_CERTIFICATION });

  const [editingExperienceIdx, setEditingExperienceIdx] = useState(null);
  const [editExperienceData, setEditExperienceData] = useState({ ...EMPTY_EXPERIENCE });
  const [editAchievementInput, setEditAchievementInput] = useState('');

  // ─── Saving flags ───────────────────────────────────────
  const [savingEducation, setSavingEducation] = useState(false);
  const [savingCertification, setSavingCertification] = useState(false);
  const [savingExperience, setSavingExperience] = useState(false);
  const [error, setError] = useState('');

  // ═══════════════════════════════════════════════════════
  // EDUCATION
  // ═══════════════════════════════════════════════════════
  const addEducation = () => {
    if (!newEducation.institution || !newEducation.degree) return;
    setFormData({
      ...formData,
      education: [...(formData.education || []), newEducation],
    });
    setNewEducation({ ...EMPTY_EDUCATION });
  };

  const removeEducation = async (index) => {
    const next = (formData.education || []).filter((_, i) => i !== index);
    setFormData({ ...formData, education: next });
    if (editingEducationIdx === index) cancelEditEducation();

    const res = await updateEducation(next);
    if (!res.success) setError(res.error || 'Failed to delete education');
  };

  const startEditEducation = (idx) => {
    setEditingEducationIdx(idx);
    setEditEducationData({ ...EMPTY_EDUCATION, ...formData.education[idx] });
    setError('');
  };

  const cancelEditEducation = () => {
    setEditingEducationIdx(null);
    setEditEducationData({ ...EMPTY_EDUCATION });
  };

  const saveEditEducation = async () => {
    if (!editEducationData.institution || !editEducationData.degree) {
      setError('Institution and Degree are required');
      return;
    }
    setSavingEducation(true);
    setError('');

    const previous = formData.education;
    const next = [...previous];
    next[editingEducationIdx] = editEducationData;

    // Optimistic UI
    setFormData({ ...formData, education: next });

    const res = await updateEducation(next);
    setSavingEducation(false);

    if (res.success) {
      cancelEditEducation();
    } else {
      // Roll back
      setFormData({ ...formData, education: previous });
      setError(res.error || 'Failed to save education');
    }
  };

  // ═══════════════════════════════════════════════════════
  // CERTIFICATIONS
  // ═══════════════════════════════════════════════════════
  const addCertification = () => {
    if (!newCertification.name || !newCertification.issuingOrganization) return;
    setFormData({
      ...formData,
      certifications: [...(formData.certifications || []), newCertification],
    });
    setNewCertification({ ...EMPTY_CERTIFICATION });
  };

  const removeCertification = async (index) => {
    const next = (formData.certifications || []).filter((_, i) => i !== index);
    setFormData({ ...formData, certifications: next });
    if (editingCertificationIdx === index) cancelEditCertification();

    const res = await updateCertifications(next);
    if (!res.success) setError(res.error || 'Failed to delete certification');
  };

  const startEditCertification = (idx) => {
    setEditingCertificationIdx(idx);
    setEditCertificationData({ ...EMPTY_CERTIFICATION, ...formData.certifications[idx] });
    setError('');
  };

  const cancelEditCertification = () => {
    setEditingCertificationIdx(null);
    setEditCertificationData({ ...EMPTY_CERTIFICATION });
  };

  const saveEditCertification = async () => {
    if (!editCertificationData.name || !editCertificationData.issuingOrganization) {
      setError('Name and Issuing Organization are required');
      return;
    }
    setSavingCertification(true);
    setError('');

    const previous = formData.certifications;
    const next = [...previous];
    next[editingCertificationIdx] = editCertificationData;

    setFormData({ ...formData, certifications: next });

    const res = await updateCertifications(next);
    setSavingCertification(false);

    if (res.success) {
      cancelEditCertification();
    } else {
      setFormData({ ...formData, certifications: previous });
      setError(res.error || 'Failed to save certification');
    }
  };

  // ═══════════════════════════════════════════════════════
  // EXPERIENCE
  // ═══════════════════════════════════════════════════════
  const addExperience = () => {
    if (!newExperience.title || !newExperience.company) return;
    setFormData({
      ...formData,
      experience: [...(formData.experience || []), newExperience],
    });
    setNewExperience({ ...EMPTY_EXPERIENCE });
    setNewAchievement('');
  };

  const removeExperience = async (index) => {
    const next = (formData.experience || []).filter((_, i) => i !== index);
    setFormData({ ...formData, experience: next });
    if (editingExperienceIdx === index) cancelEditExperience();

    const res = await updateExperience(next, formData.yearsOfExperience);
    if (!res.success) setError(res.error || 'Failed to delete experience');
  };

  const startEditExperience = (idx) => {
    setEditingExperienceIdx(idx);
    setEditExperienceData({
      ...EMPTY_EXPERIENCE,
      ...formData.experience[idx],
      achievements: [...(formData.experience[idx].achievements || [])],
    });
    setEditAchievementInput('');
    setError('');
  };

  const cancelEditExperience = () => {
    setEditingExperienceIdx(null);
    setEditExperienceData({ ...EMPTY_EXPERIENCE });
    setEditAchievementInput('');
  };

  const saveEditExperience = async () => {
    if (!editExperienceData.title || !editExperienceData.company) {
      setError('Title and Company are required');
      return;
    }
    setSavingExperience(true);
    setError('');

    const previous = formData.experience;
    const next = [...previous];
    next[editingExperienceIdx] = editExperienceData;

    setFormData({ ...formData, experience: next });

    const res = await updateExperience(next, formData.yearsOfExperience);
    setSavingExperience(false);

    if (res.success) {
      cancelEditExperience();
    } else {
      setFormData({ ...formData, experience: previous });
      setError(res.error || 'Failed to save experience');
    }
  };

  const addEditAchievement = () => {
    if (!editAchievementInput.trim()) return;
    setEditExperienceData((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), editAchievementInput.trim()],
    }));
    setEditAchievementInput('');
  };

  const removeEditAchievement = (aIdx) => {
    setEditExperienceData((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== aIdx),
    }));
  };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* ============== YEARS OF EXPERIENCE ============== */}
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

      {/* ============== EDUCATION ============== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>

        {isEditing && (
          <div className="bg-green-50 p-4 rounded-lg space-y-3 mb-4">
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
                className="h-4 w-4 text-green-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Currently studying</label>
            </div>
            <textarea
              value={newEducation.description}
              onChange={(e) => setNewEducation({ ...newEducation, description: e.target.value })}
              placeholder="Description"
              rows="2"
              className="w-full p-2 border-2 border-green-300 rounded-lg"
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
        )}

        <div className="space-y-3">
          {(formData.education || []).map((edu, idx) => (
            <div key={idx} className="border border-green-200 rounded-lg p-4 bg-white">
              {editingEducationIdx === idx ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editEducationData.institution}
                    onChange={(e) => setEditEducationData({ ...editEducationData, institution: e.target.value })}
                    placeholder="Institution"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={editEducationData.degree}
                    onChange={(e) => setEditEducationData({ ...editEducationData, degree: e.target.value })}
                    placeholder="Degree"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={editEducationData.fieldOfStudy || ''}
                    onChange={(e) => setEditEducationData({ ...editEducationData, fieldOfStudy: e.target.value })}
                    placeholder="Field of Study"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={editEducationData.startDate || ''}
                      onChange={(e) => setEditEducationData({ ...editEducationData, startDate: e.target.value })}
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={editEducationData.endDate || ''}
                      onChange={(e) => setEditEducationData({ ...editEducationData, endDate: e.target.value })}
                      disabled={editEducationData.isCurrent}
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!!editEducationData.isCurrent}
                      onChange={(e) => setEditEducationData({ ...editEducationData, isCurrent: e.target.checked })}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Currently studying</label>
                  </div>
                  <textarea
                    value={editEducationData.description || ''}
                    onChange={(e) => setEditEducationData({ ...editEducationData, description: e.target.value })}
                    placeholder="Description"
                    rows="2"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={editEducationData.grade || ''}
                    onChange={(e) => setEditEducationData({ ...editEducationData, grade: e.target.value })}
                    placeholder="Grade (optional)"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={saveEditEducation}
                      disabled={savingEducation}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 inline-flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                    >
                      {savingEducation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingEducation ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditEducation}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 inline-flex items-center justify-center gap-1.5 text-sm"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                    <p className="text-sm text-gray-700">{edu.institution}</p>
                    {edu.fieldOfStudy && <p className="text-sm text-gray-600">{edu.fieldOfStudy}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {edu.startDate && new Date(edu.startDate).getFullYear()} -{' '}
                      {edu.isCurrent ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).getFullYear()}` : ''}
                    </p>
                    {edu.description && <p className="text-sm text-gray-600 mt-2">{edu.description}</p>}
                    {edu.grade && <p className="text-xs text-green-600 mt-1">Grade: {edu.grade}</p>}
                  </div>
                  {isEditing && (
                    <div className="flex items-start gap-1 flex-shrink-0">
                      <button type="button" onClick={() => startEditEducation(idx)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => removeEducation(idx)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ============== CERTIFICATIONS ============== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>

        {isEditing && (
          <div className="bg-green-50 p-4 rounded-lg space-y-3 mb-4">
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
                className="h-4 w-4 text-green-600 rounded"
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
        )}

        <div className="space-y-3">
          {(formData.certifications || []).map((cert, idx) => (
            <div key={idx} className="border border-green-200 rounded-lg p-4 bg-white">
              {editingCertificationIdx === idx ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editCertificationData.name}
                    onChange={(e) => setEditCertificationData({ ...editCertificationData, name: e.target.value })}
                    placeholder="Certification Name"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={editCertificationData.issuingOrganization}
                    onChange={(e) => setEditCertificationData({ ...editCertificationData, issuingOrganization: e.target.value })}
                    placeholder="Issuing Organization"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={editCertificationData.issueDate || ''}
                      onChange={(e) => setEditCertificationData({ ...editCertificationData, issueDate: e.target.value })}
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={editCertificationData.expiryDate || ''}
                      onChange={(e) => setEditCertificationData({ ...editCertificationData, expiryDate: e.target.value })}
                      disabled={editCertificationData.doesNotExpire}
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!!editCertificationData.doesNotExpire}
                      onChange={(e) => setEditCertificationData({ ...editCertificationData, doesNotExpire: e.target.checked })}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Does not expire</label>
                  </div>
                  <input
                    type="text"
                    value={editCertificationData.credentialId || ''}
                    onChange={(e) => setEditCertificationData({ ...editCertificationData, credentialId: e.target.value })}
                    placeholder="Credential ID"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <input
                    type="url"
                    value={editCertificationData.credentialUrl || ''}
                    onChange={(e) => setEditCertificationData({ ...editCertificationData, credentialUrl: e.target.value })}
                    placeholder="Credential URL"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={saveEditCertification}
                      disabled={savingCertification}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 inline-flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                    >
                      {savingCertification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingCertification ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditCertification}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 inline-flex items-center justify-center gap-1.5 text-sm"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                    <p className="text-sm text-gray-700">{cert.issuingOrganization}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Issued: {cert.issueDate && new Date(cert.issueDate).toLocaleDateString()}
                      {!cert.doesNotExpire && cert.expiryDate && ` · Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                      {cert.doesNotExpire && ' · No Expiry'}
                    </p>
                    {cert.credentialId && <p className="text-xs text-gray-500">ID: {cert.credentialId}</p>}
                    {cert.verified && (
                      <span className="inline-flex items-center mt-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex items-start gap-1 flex-shrink-0">
                      <button type="button" onClick={() => startEditCertification(idx)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => removeCertification(idx)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ============== WORK EXPERIENCE ============== */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Work Experience</label>

        {isEditing && (
          <div className="bg-green-50 p-4 rounded-lg space-y-3 mb-4">
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
                className="h-4 w-4 text-green-600 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Currently working here</label>
            </div>
            <textarea
              value={newExperience.description}
              onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
              placeholder="Description"
              rows="2"
              className="w-full p-2 border-2 border-green-300 rounded-lg"
            />

            <div>
              <label className="block text-sm text-gray-600 mb-1">Achievements</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newAchievement) {
                        setNewExperience({ ...newExperience, achievements: [...(newExperience.achievements || []), newAchievement] });
                        setNewAchievement('');
                      }
                    }
                  }}
                  placeholder="Add achievement"
                  className="flex-1 p-2 border-2 border-green-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newAchievement) {
                      setNewExperience({ ...newExperience, achievements: [...(newExperience.achievements || []), newAchievement] });
                      setNewAchievement('');
                    }
                  }}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {(newExperience.achievements || []).map((ach, aIdx) => (
                  <div key={aIdx} className="flex items-center justify-between bg-white p-2 rounded">
                    <span className="text-sm">{ach}</span>
                    <button
                      type="button"
                      onClick={() => setNewExperience({ ...newExperience, achievements: newExperience.achievements.filter((_, i) => i !== aIdx) })}
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
        )}

        <div className="space-y-3">
          {(formData.experience || []).map((exp, idx) => (
            <div key={idx} className="border border-green-200 rounded-lg p-4 bg-white">
              {editingExperienceIdx === idx ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editExperienceData.title}
                    onChange={(e) => setEditExperienceData({ ...editExperienceData, title: e.target.value })}
                    placeholder="Job Title"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={editExperienceData.company}
                    onChange={(e) => setEditExperienceData({ ...editExperienceData, company: e.target.value })}
                    placeholder="Company"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={editExperienceData.location || ''}
                    onChange={(e) => setEditExperienceData({ ...editExperienceData, location: e.target.value })}
                    placeholder="Location"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={editExperienceData.startDate || ''}
                      onChange={(e) => setEditExperienceData({ ...editExperienceData, startDate: e.target.value })}
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={editExperienceData.endDate || ''}
                      onChange={(e) => setEditExperienceData({ ...editExperienceData, endDate: e.target.value })}
                      disabled={editExperienceData.isCurrent}
                      className="p-2 border-2 border-green-300 rounded-lg"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!!editExperienceData.isCurrent}
                      onChange={(e) => setEditExperienceData({ ...editExperienceData, isCurrent: e.target.checked })}
                      className="h-4 w-4 text-green-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Currently working here</label>
                  </div>
                  <textarea
                    value={editExperienceData.description || ''}
                    onChange={(e) => setEditExperienceData({ ...editExperienceData, description: e.target.value })}
                    placeholder="Description"
                    rows="2"
                    className="w-full p-2 border-2 border-green-300 rounded-lg"
                  />

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Achievements</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={editAchievementInput}
                        onChange={(e) => setEditAchievementInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEditAchievement();
                          }
                        }}
                        placeholder="Add achievement"
                        className="flex-1 p-2 border-2 border-green-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={addEditAchievement}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {(editExperienceData.achievements || []).map((ach, aIdx) => (
                        <div key={aIdx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{ach}</span>
                          <button
                            type="button"
                            onClick={() => removeEditAchievement(aIdx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={saveEditExperience}
                      disabled={savingExperience}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 inline-flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                    >
                      {savingExperience ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {savingExperience ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditExperience}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 inline-flex items-center justify-center gap-1.5 text-sm"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                    <p className="text-sm text-gray-700">{exp.company}</p>
                    {exp.location && <p className="text-xs text-gray-600">{exp.location}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {exp.startDate && new Date(exp.startDate).toLocaleDateString()} -{' '}
                      {exp.isCurrent ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString()}` : ''}
                    </p>
                    {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">Achievements:</p>
                        <ul className="list-disc list-inside">
                          {exp.achievements.map((ach, aIdx) => (
                            <li key={aIdx} className="text-xs text-gray-600">{ach}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex items-start gap-1 flex-shrink-0">
                      <button type="button" onClick={() => startEditExperience(idx)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => removeExperience(idx)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CredentialsTab;