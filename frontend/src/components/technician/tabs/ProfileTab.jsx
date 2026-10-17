/**
 * ProfileTab Component
 * ====================
 * The expert's public introduction: headline and bio, categories, skills,
 * languages and location — each in its own section.
 *
 * - Headline, bio, categories and address are saved with "Save Changes".
 * - Skills and languages are added / edited in a modal and saved straight away.
 * - "Use my current location" saves the new location straight away.
 * - How far clients can see the expert comes from their plan (Subscription),
 *   so there is no separate radius setting here.
 *
 * @version 4.0.0 – Sectioned layout, modal forms, instant saves
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Briefcase, Award, Languages, MapPin, Navigation, Loader2, X, Star,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import {
  Section, Field, EmptyState, AddButton, RowActions, Banner, FormModal, inputClass, saveList,
} from './ui';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const PROFICIENCY_LEVELS = ['Basic', 'Conversational', 'Fluent', 'Native'];
const EMPTY_SKILL = { name: '', level: 'Intermediate', yearsOfExperience: 0 };
const EMPTY_LANGUAGE = { name: '', proficiency: 'Fluent' };
const LEVEL_STYLE = {
  Beginner: 'bg-gray-100 text-gray-700',
  Intermediate: 'bg-blue-50 text-blue-700',
  Advanced: 'bg-indigo-50 text-indigo-700',
  Expert: 'bg-green-50 text-green-700',
};

const daysAgo = (value) => {
  if (!value) return null;
  const days = Math.floor((Date.now() - new Date(value)) / 86400000);
  if (Number.isNaN(days)) return null;
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

const ProfileTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  const { updateSkills, updateLanguages, updateLocation, technicianProfile } = useAuth();

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryToAdd, setCategoryToAdd] = useState('');
  const [editor, setEditor] = useState(null); // { field: 'skills'|'languages', index|null, item }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const mainCategories = useMemo(() => formData.mainCategories || [], [formData.mainCategories]);
  const skills = formData.skills || [];
  const languages = formData.languages || [];

  // Categories come from the live service catalog (admins can add new ones)
  useEffect(() => {
    api
      .get('/service-catalog/main-categories')
      .then((res) => setCategoryOptions((res.data?.data || []).map((c) => c.name)))
      .catch(() => setCategoryOptions([]));
  }, []);

  const flash = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 3000);
  };

  // ── Categories (saved with "Save Changes") ─────────────
  const addCategory = () => {
    if (!categoryToAdd || mainCategories.includes(categoryToAdd)) return;
    setFormData((prev) => ({ ...prev, mainCategories: [...(prev.mainCategories || []), categoryToAdd] }));
    setCategoryToAdd('');
  };

  const removeCategory = (name) => {
    setFormData((prev) => ({ ...prev, mainCategories: (prev.mainCategories || []).filter((c) => c !== name) }));
  };

  const makePrimary = (name) => {
    setFormData((prev) => ({
      ...prev,
      mainCategories: [name, ...(prev.mainCategories || []).filter((c) => c !== name)],
    }));
  };

  // ── Skills & languages (saved straight away) ───────────
  const savers = { skills: updateSkills, languages: updateLanguages };
  const empties = { skills: EMPTY_SKILL, languages: EMPTY_LANGUAGE };

  const openEditor = (field, index = null) => {
    setFormError('');
    setEditor({ field, index, item: { ...empties[field], ...(index === null ? {} : formData[field][index]) } });
  };

  const setItemField = (key, value) => setEditor((prev) => ({ ...prev, item: { ...prev.item, [key]: value } }));

  const submitEditor = async () => {
    const { field, index, item } = editor;
    const name = item.name.trim();
    if (!name) return setFormError(field === 'skills' ? 'Please enter the skill.' : 'Please enter the language.');
    const list = formData[field] || [];
    const duplicate = list.some((x, i) => i !== index && x.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) return setFormError(`“${name}” is already on your profile.`);

    const clean = { ...item, name };
    if (field === 'skills') clean.yearsOfExperience = Math.max(0, parseInt(clean.yearsOfExperience, 10) || 0);
    const next = [...list];
    if (index === null) next.push(clean);
    else next[index] = clean;

    setSaving(true);
    const ok = await saveList({ field, next, formData, setFormData, saveFn: savers[field], onError: setFormError });
    setSaving(false);
    if (ok) {
      setEditor(null);
      flash(index === null ? `“${name}” added.` : 'Changes saved.');
    }
  };

  const removeItem = async (field, index) => {
    const name = formData[field][index]?.name;
    if (!window.confirm(`Remove “${name}” from your profile?`)) return;
    setSaving(true);
    const ok = await saveList({
      field, next: formData[field].filter((_, i) => i !== index), formData, setFormData, saveFn: savers[field], onError: setError,
    });
    setSaving(false);
    if (ok) flash(`“${name}” removed.`);
  };

  // ── Location (saved straight away) ─────────────────────
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      return {
        formattedAddress: data.display_name || '',
        address: data.address
          ? {
              street: data.address.road || data.address.pedestrian || '',
              city: data.address.city || data.address.town || data.address.village || '',
              state: data.address.state || data.address.county || '',
              zipCode: data.address.postcode || '',
              country: data.address.country || 'Kenya',
            }
          : null,
      };
    } catch {
      return { formattedAddress: '', address: null };
    }
  };

  const useCurrentLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) return setLocationError('Your browser does not support location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        const geo = await reverseGeocode(latitude, longitude);
        // Keep the address the expert typed where the lookup found nothing
        const address = { ...formData.address };
        if (geo.address) Object.entries(geo.address).forEach(([k, v]) => { if (v) address[k] = v; });
        const res = await updateLocation({
          location: { coordinates: [longitude, latitude], formattedAddress: geo.formattedAddress },
          address,
        });
        setLocating(false);
        if (res?.success === false) return setLocationError(res.error || 'Could not save your location.');
        setFormData((prev) => ({
          ...prev,
          address,
          location: { ...prev.location, coordinates: [longitude, latitude], formattedAddress: geo.formattedAddress },
        }));
        flash('Location updated. Clients near you can now find you.');
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was blocked. Allow location for this site in your browser settings, then try again.'
            : 'Could not get your location. Please try again.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const hasLocation = (formData.location?.coordinates || []).some((c) => c !== 0);
  const addressLine = [formData.address?.street, formData.address?.city, formData.address?.state].filter(Boolean).join(', ');
  const lastUpdated = daysAgo(technicianProfile?.locationUpdatedAt);

  return (
    <div className="space-y-6">
      {error && <Banner onClose={() => setError('')}>{error}</Banner>}
      {notice && <Banner type="success">{notice}</Banner>}

      {/* About */}
      <Section icon={User} title="About you" description="The first thing clients read on your profile.">
        {isEditing ? (
          <div className="space-y-4">
            <Field label="Headline" htmlFor="pf-headline" counter={`${(formData.profileHeadline || '').length}/200`}
              hint="One line that says what you do and why you're good at it.">
              <input id="pf-headline" name="profileHeadline" maxLength={200} className={inputClass}
                value={formData.profileHeadline || ''} onChange={handleInputChange}
                placeholder="e.g. Licensed electrician · 10+ years · residential & commercial wiring" />
            </Field>
            <Field label="About me" htmlFor="pf-about" counter={`${(formData.aboutMe || '').length}/2000`}
              hint="Your experience, the jobs you take on, the areas you cover, and how you work.">
              <textarea id="pf-about" name="aboutMe" rows="6" maxLength={2000} className={`${inputClass} resize-y`}
                value={formData.aboutMe || ''} onChange={handleInputChange} />
            </Field>
          </div>
        ) : formData.profileHeadline || formData.aboutMe ? (
          <div className="space-y-2">
            {formData.profileHeadline && <p className="text-lg font-medium text-gray-900">{formData.profileHeadline}</p>}
            {formData.aboutMe && <p className="text-gray-700 leading-relaxed whitespace-pre-line">{formData.aboutMe}</p>}
          </div>
        ) : (
          <EmptyState icon={User} title="No introduction yet" text="Add a headline and a short bio so clients know who they're booking." />
        )}
      </Section>

      {/* Categories */}
      <Section icon={Briefcase} title="Categories" description="The areas you work in. Your primary category is shown first on your profile.">
        {mainCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {mainCategories.map((cat, i) => (
              <span key={cat} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${
                i === 0 ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'
              }`}>
                {i === 0 && <Star className="w-3.5 h-3.5 fill-current" />}
                {cat}
                {i === 0 && <span className="text-xs opacity-80">Primary</span>}
                {isEditing && i !== 0 && (
                  <button type="button" onClick={() => makePrimary(cat)} className="text-xs text-green-700 hover:underline">
                    Make primary
                  </button>
                )}
                {isEditing && mainCategories.length > 1 && (
                  <button type="button" onClick={() => removeCategory(cat)} aria-label={`Remove ${cat}`}
                    className={i === 0 ? 'opacity-80 hover:opacity-100' : 'text-gray-400 hover:text-red-600'}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-amber-700">Add at least one category so clients can find you.</p>
        )}
        {isEditing && (
          <div className="mt-4 flex gap-2">
            <select className={inputClass} value={categoryToAdd} onChange={(e) => setCategoryToAdd(e.target.value)}>
              <option value="">Add a category…</option>
              {categoryOptions.filter((c) => !mainCategories.includes(c)).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button type="button" onClick={addCategory} disabled={!categoryToAdd}
              className="px-4 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              Add
            </button>
          </div>
        )}
        {isEditing && <p className="mt-2 text-xs text-gray-500">Category changes are saved with “Save Changes”.</p>}
      </Section>

      {/* Skills */}
      <Section icon={Award} title="Skills" description="Specific skills and how experienced you are in each."
        action={isEditing && <AddButton onClick={() => openEditor('skills')} disabled={saving}>Add skill</AddButton>}>
        {skills.length === 0 ? (
          <EmptyState icon={Award} title="No skills added" text="E.g. “Three-phase wiring”, “Solar installation”, “Fault finding”." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {skills.map((skill, index) => (
              <li key={`${skill.name}-${index}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="font-medium text-gray-900">{skill.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_STYLE[skill.level] || LEVEL_STYLE.Intermediate}`}>{skill.level}</span>
                  {skill.yearsOfExperience > 0 && (
                    <span className="text-xs text-gray-500">{skill.yearsOfExperience} yr{skill.yearsOfExperience === 1 ? '' : 's'}</span>
                  )}
                </div>
                {isEditing && (
                  <RowActions disabled={saving} onEdit={() => openEditor('skills', index)} onDelete={() => removeItem('skills', index)} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Languages */}
      <Section icon={Languages} title="Languages" description="Languages you can serve clients in."
        action={isEditing && <AddButton onClick={() => openEditor('languages')} disabled={saving}>Add language</AddButton>}>
        {languages.length === 0 ? (
          <EmptyState icon={Languages} title="No languages added" text="E.g. English, Kiswahili." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {languages.map((lang, index) => (
              <span key={`${lang.name}-${index}`} className="inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-gray-100 text-sm text-gray-800">
                {lang.name}
                <span className="text-xs text-gray-500">{lang.proficiency}</span>
                {isEditing && (
                  <RowActions disabled={saving} onEdit={() => openEditor('languages', index)} onDelete={() => removeItem('languages', index)} />
                )}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Location */}
      <Section icon={MapPin} title="Location" description="Clients see experts near them, so keep this current.">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {hasLocation ? (
              <>
                <p className="font-medium text-gray-900">{addressLine || formData.location?.formattedAddress || 'Location set'}</p>
                {formData.address?.country && <p className="text-sm text-gray-500">{formData.address.country}</p>}
                {lastUpdated && <p className="text-xs text-gray-400 mt-1">Updated {lastUpdated}</p>}
              </>
            ) : (
              <p className="text-sm text-amber-700">No location yet — clients can't find you in search until you add it.</p>
            )}
          </div>
          <button type="button" onClick={useCurrentLocation} disabled={locating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {locating ? 'Getting location…' : 'Use my current location'}
          </button>
        </div>
        {locationError && <div className="mt-3"><Banner onClose={() => setLocationError('')}>{locationError}</Banner></div>}

        <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          How far away clients can see you depends on your plan.{' '}
          <Link to="/subscription" className="text-green-700 font-medium hover:underline">See plans</Link>
        </p>

        {isEditing && (
          <div className="mt-5 space-y-4">
            <p className="text-sm font-medium text-gray-700">Address shown on your profile</p>
            <Field label="Street / area" htmlFor="pf-street">
              <input id="pf-street" name="address.street" className={inputClass} value={formData.address?.street || ''} onChange={handleInputChange} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Town / city" htmlFor="pf-city" required>
                <input id="pf-city" name="address.city" className={inputClass} value={formData.address?.city || ''} onChange={handleInputChange} />
              </Field>
              <Field label="County" htmlFor="pf-county" required>
                <input id="pf-county" name="address.state" className={inputClass} value={formData.address?.state || ''} onChange={handleInputChange} />
              </Field>
              <Field label="Postal code" htmlFor="pf-zip">
                <input id="pf-zip" name="address.zipCode" className={inputClass} value={formData.address?.zipCode || ''} onChange={handleInputChange} />
              </Field>
              <Field label="Country" htmlFor="pf-country">
                <input id="pf-country" name="address.country" className={inputClass} value={formData.address?.country || ''} onChange={handleInputChange} />
              </Field>
            </div>
            <p className="text-xs text-gray-500">Address changes are saved with “Save Changes”.</p>
          </div>
        )}
      </Section>

      {!isEditing && <p className="text-xs text-gray-400 text-center">Click “Edit Profile” to make changes.</p>}

      {editor && (
        <FormModal
          title={`${editor.index === null ? 'Add' : 'Edit'} ${editor.field === 'skills' ? 'skill' : 'language'}`}
          onClose={() => setEditor(null)}
          onSave={submitEditor}
          saving={saving}
          saveLabel={editor.index === null ? 'Add' : 'Save changes'}
          error={formError}
        >
          {editor.field === 'skills' ? (
            <>
              <Field label="Skill" htmlFor="sk-name" required>
                <input id="sk-name" autoFocus maxLength={60} className={inputClass} value={editor.item.name}
                  onChange={(e) => setItemField('name', e.target.value)} placeholder="e.g. Three-phase wiring" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Level" htmlFor="sk-level">
                  <select id="sk-level" className={inputClass} value={editor.item.level} onChange={(e) => setItemField('level', e.target.value)}>
                    {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Years of experience" htmlFor="sk-years">
                  <input id="sk-years" type="number" min="0" max="60" className={inputClass} value={editor.item.yearsOfExperience}
                    onChange={(e) => setItemField('yearsOfExperience', e.target.value)} />
                </Field>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Language" htmlFor="lg-name" required>
                <input id="lg-name" autoFocus maxLength={40} className={inputClass} value={editor.item.name}
                  onChange={(e) => setItemField('name', e.target.value)} placeholder="e.g. Kiswahili" />
              </Field>
              <Field label="Proficiency" htmlFor="lg-level">
                <select id="lg-level" className={inputClass} value={editor.item.proficiency} onChange={(e) => setItemField('proficiency', e.target.value)}>
                  {PROFICIENCY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
            </div>
          )}
        </FormModal>
      )}
    </div>
  );
};

export default ProfileTab;
