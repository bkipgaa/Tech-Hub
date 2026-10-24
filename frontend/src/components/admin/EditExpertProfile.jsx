/**
 * EditExpertProfile.jsx
 * =====================
 * Admin form for tidying up an expert's profile so it reads professionally:
 * name and phone, headline, about, business name, experience, skills,
 * town/county and the services they offer.
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import adminApi from '../../services/adminApi';
import api from '../../services/api';
import ServicePicker from '../ServicePicker';
import { groupsFromTechnician, servicesError } from '../../utils/serviceGroups';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';

const Field = ({ label, hint, children }) => (
  <label className="block text-sm font-medium text-gray-700">
    {label}
    {children}
    {hint && <span className="block text-xs font-normal text-gray-400 mt-1">{hint}</span>}
  </label>
);

const EditExpertProfile = ({ tech, onSaved, onCancel }) => {
  const user = tech.userId || {};
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    profileHeadline: tech.profileHeadline || '',
    aboutMe: tech.aboutMe || '',
    businessName: tech.businessName || '',
    yearsOfExperience: tech.yearsOfExperience || 0,
    skills: (tech.skills || []).map((s) => s.name).join(', '),
    city: tech.address?.city || '',
    state: tech.address?.state || '',
  });
  const [services, setServices] = useState(() => groupsFromTechnician(tech));
  const [catalog, setCatalog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/service-catalog/complete')
      .then((r) => setCatalog(r.data?.data || {}))
      .catch(() => setCatalog({}));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    const problem = servicesError(services);
    if (problem) return setError(problem);
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required.');
    if (!form.city.trim() || !form.state.trim()) return setError('Town and county are required.');

    setSaving(true);
    setError('');
    try {
      await adminApi.patch(`/technicians/${tech._id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        profileHeadline: form.profileHeadline,
        aboutMe: form.aboutMe,
        businessName: form.businessName,
        yearsOfExperience: Math.max(0, Number(form.yearsOfExperience) || 0),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        address: { city: form.city, state: form.state },
        services: services.filter((g) => g.mainCategory),
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the profile.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Edit expert profile</h2>
        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="First name"><input className={inputClass} value={form.firstName} onChange={set('firstName')} /></Field>
        <Field label="Last name"><input className={inputClass} value={form.lastName} onChange={set('lastName')} /></Field>
        <Field label="Phone"><input className={inputClass} value={form.phone} onChange={set('phone')} /></Field>
      </div>

      <Field label="Headline" hint="One line shown under their name, e.g. “Certified electrician · 8 years”">
        <input className={inputClass} value={form.profileHeadline} onChange={set('profileHeadline')} maxLength={200} />
      </Field>

      <Field label="About">
        <textarea className={inputClass} rows={5} value={form.aboutMe} onChange={set('aboutMe')} maxLength={2000} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Business name"><input className={inputClass} value={form.businessName} onChange={set('businessName')} /></Field>
        <Field label="Years of experience">
          <input type="number" min="0" className={inputClass} value={form.yearsOfExperience} onChange={set('yearsOfExperience')} />
        </Field>
        <Field label="Town"><input className={inputClass} value={form.city} onChange={set('city')} /></Field>
        <Field label="County"><input className={inputClass} value={form.state} onChange={set('state')} /></Field>
      </div>

      <Field label="Skills" hint="Separate with commas">
        <input className={inputClass} value={form.skills} onChange={set('skills')} />
      </Field>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Services</p>
        {catalog ? (
          <ServicePicker catalog={catalog} value={services} onChange={setServices} />
        ) : (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>
    </form>
  );
};

export default EditExpertProfile;
