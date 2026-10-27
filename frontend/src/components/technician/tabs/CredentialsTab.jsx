/**
 * CredentialsTab.jsx
 * ==================
 * Work experience, education and certifications.
 *
 * Each list is a clean card list; adding and editing happen in a modal and
 * every add / edit / delete is saved straight away through the section
 * endpoints. "Total years of experience" is part of the main profile form.
 *
 * @version 4.0.0 – Sectioned layout, modal forms, instant save
 */

import React, { useRef, useState } from 'react';
import {
  Briefcase, GraduationCap, BadgeCheck, CheckCircle, ExternalLink, Clock, MapPin, FileText, Upload, Loader2, Trash2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { CV_ACCEPT, cvFileError, cvFilledText } from '../../../utils/cv';
import {
  Section, Field, EmptyState, AddButton, RowActions, Banner, FormModal,
  inputClass, toDateInput, formatMonthYear, formatRange, saveList,
} from './ui';

const EMPTY = {
  experience: { title: '', company: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '', achievements: [] },
  education: { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false, description: '', grade: '' },
  certifications: { name: '', issuingOrganization: '', issueDate: '', expiryDate: '', doesNotExpire: false, credentialId: '', credentialUrl: '' },
};

const REQUIRED = {
  experience: [['title', 'job title'], ['company', 'company or client']],
  education: [['institution', 'institution'], ['degree', 'qualification']],
  certifications: [['name', 'certificate name'], ['issuingOrganization', 'issuing organisation']],
};

const TITLES = { experience: 'work experience', education: 'education', certifications: 'certification' };

// Newest first; current roles on top
const byNewest = (dateField) => (a, b) => {
  if (!!b.item.isCurrent !== !!a.item.isCurrent) return b.item.isCurrent ? 1 : -1;
  return new Date(b.item[dateField] || 0) - new Date(a.item[dateField] || 0);
};

const certStatus = (cert) => {
  if (cert.doesNotExpire || !cert.expiryDate) return null;
  const days = (new Date(cert.expiryDate) - new Date()) / 86400000;
  if (days < 0) return { label: 'Expired', className: 'bg-red-50 text-red-700' };
  if (days < 60) return { label: 'Expires soon', className: 'bg-amber-50 text-amber-700' };
  return null;
};

const safeUrl = (url) => (/^https?:\/\//i.test(url || '') ? url : null);

// ─── Forms ───────────────────────────────────────────────────────────────────
const DateRange = ({ item, set, startField = 'startDate', endField = 'endDate', currentField = 'isCurrent', currentLabel }) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Start date" htmlFor="cr-start">
        <input id="cr-start" type="date" className={inputClass} value={item[startField]} onChange={(e) => set(startField, e.target.value)} />
      </Field>
      <Field label="End date" htmlFor="cr-end">
        <input id="cr-end" type="date" className={inputClass} value={item[endField]} disabled={item[currentField]} onChange={(e) => set(endField, e.target.value)} />
      </Field>
    </div>
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" className="h-4 w-4 text-green-600 rounded" checked={!!item[currentField]}
        onChange={(e) => set(currentField, e.target.checked)} />
      {currentLabel}
    </label>
  </>
);

const ExperienceFields = ({ item, set }) => {
  const [achievement, setAchievement] = useState('');
  const addAchievement = () => {
    if (!achievement.trim()) return;
    set('achievements', [...(item.achievements || []), achievement.trim()]);
    setAchievement('');
  };
  return (
    <>
      <Field label="Job title" htmlFor="cr-title" required>
        <input id="cr-title" className={inputClass} value={item.title} maxLength={80} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Lead Electrician" />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company or client" htmlFor="cr-company" required>
          <input id="cr-company" className={inputClass} value={item.company} maxLength={80} onChange={(e) => set('company', e.target.value)} placeholder="e.g. Kenya Power, or Self-employed" />
        </Field>
        <Field label="Location" htmlFor="cr-loc">
          <input id="cr-loc" className={inputClass} value={item.location} maxLength={60} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Mombasa" />
        </Field>
      </div>
      <DateRange item={item} set={set} currentLabel="I currently work here" />
      <Field label="What you did" htmlFor="cr-desc" counter={`${(item.description || '').length}/600`}>
        <textarea id="cr-desc" rows="3" maxLength={600} className={`${inputClass} resize-y`} value={item.description} onChange={(e) => set('description', e.target.value)}
          placeholder="Main responsibilities and the kind of jobs you handled" />
      </Field>
      <Field label="Key achievements" hint="Press Enter to add. E.g. “Wired 40+ homes in Nyali estate”.">
        <div className="flex gap-2">
          <input className={inputClass} value={achievement} maxLength={120} onChange={(e) => setAchievement(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())} placeholder="Add an achievement" />
          <button type="button" onClick={addAchievement} className="px-3 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Add</button>
        </div>
        {(item.achievements || []).length > 0 && (
          <ul className="mt-2 space-y-1">
            {item.achievements.map((a, i) => (
              <li key={`${a}-${i}`} className="flex items-start justify-between gap-2 text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                <span>{a}</span>
                <RowActions onDelete={() => set('achievements', item.achievements.filter((_, j) => j !== i))} deleteLabel="Remove achievement" />
              </li>
            ))}
          </ul>
        )}
      </Field>
    </>
  );
};

const EducationFields = ({ item, set }) => (
  <>
    <Field label="Institution" htmlFor="cr-inst" required>
      <input id="cr-inst" className={inputClass} value={item.institution} maxLength={100} onChange={(e) => set('institution', e.target.value)} placeholder="e.g. Kenya Technical Trainers College" />
    </Field>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Qualification" htmlFor="cr-degree" required>
        <input id="cr-degree" className={inputClass} value={item.degree} maxLength={80} onChange={(e) => set('degree', e.target.value)} placeholder="e.g. Diploma, Certificate, BSc" />
      </Field>
      <Field label="Field of study" htmlFor="cr-field">
        <input id="cr-field" className={inputClass} value={item.fieldOfStudy} maxLength={80} onChange={(e) => set('fieldOfStudy', e.target.value)} placeholder="e.g. Electrical Engineering" />
      </Field>
    </div>
    <DateRange item={item} set={set} currentLabel="I'm currently studying here" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Grade (optional)" htmlFor="cr-grade">
        <input id="cr-grade" className={inputClass} value={item.grade} maxLength={30} onChange={(e) => set('grade', e.target.value)} placeholder="e.g. Distinction" />
      </Field>
    </div>
    <Field label="Notes (optional)" htmlFor="cr-edu-desc" counter={`${(item.description || '').length}/400`}>
      <textarea id="cr-edu-desc" rows="2" maxLength={400} className={`${inputClass} resize-y`} value={item.description} onChange={(e) => set('description', e.target.value)} />
    </Field>
  </>
);

const CertificationFields = ({ item, set }) => (
  <>
    <Field label="Certificate name" htmlFor="cr-cert" required>
      <input id="cr-cert" className={inputClass} value={item.name} maxLength={100} onChange={(e) => set('name', e.target.value)} placeholder="e.g. EPRA Class A1 Electrician Licence" />
    </Field>
    <Field label="Issuing organisation" htmlFor="cr-org" required>
      <input id="cr-org" className={inputClass} value={item.issuingOrganization} maxLength={100} onChange={(e) => set('issuingOrganization', e.target.value)} placeholder="e.g. EPRA, NITA, KEBS" />
    </Field>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Issued on" htmlFor="cr-issued">
        <input id="cr-issued" type="date" className={inputClass} value={item.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
      </Field>
      <Field label="Expires on" htmlFor="cr-expires">
        <input id="cr-expires" type="date" className={inputClass} value={item.expiryDate} disabled={item.doesNotExpire} onChange={(e) => set('expiryDate', e.target.value)} />
      </Field>
    </div>
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" className="h-4 w-4 text-green-600 rounded" checked={!!item.doesNotExpire} onChange={(e) => set('doesNotExpire', e.target.checked)} />
      This certificate does not expire
    </label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Certificate / licence number" htmlFor="cr-id">
        <input id="cr-id" className={inputClass} value={item.credentialId} maxLength={60} onChange={(e) => set('credentialId', e.target.value)} />
      </Field>
      <Field label="Verification link (optional)" htmlFor="cr-url" hint="A link where clients can check it, starting with https://">
        <input id="cr-url" type="url" className={inputClass} value={item.credentialUrl} onChange={(e) => set('credentialUrl', e.target.value)} placeholder="https://" />
      </Field>
    </div>
  </>
);

const FIELDS = { experience: ExperienceFields, education: EducationFields, certifications: CertificationFields };

// ─── CV ──────────────────────────────────────────────────────────────────────
// Uploading reads the CV and fills in the sections that are still empty.
const CvCard = ({ cv, canManage, onUploaded, onRemoved, onError, flash }) => {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState('');

  const upload = async (file) => {
    const problem = cvFileError(file);
    if (problem) return onError(problem);
    setBusy('upload');
    try {
      const body = new FormData();
      body.append('cv', file);
      const { data } = await api.post('/technician/profile/cv', body);
      onUploaded(data);
      flash(cvFilledText(data.filled));
    } catch (err) {
      onError(err.response?.data?.message || 'Could not upload your CV. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove your CV from your profile?')) return;
    setBusy('remove');
    try {
      await api.delete('/technician/profile/cv');
      onRemoved();
      flash('CV removed.');
    } catch (err) {
      onError(err.response?.data?.message || 'Could not remove your CV.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Section icon={FileText} title="CV" description="Shown on your public profile. Uploading one also fills in any empty sections below."
      action={canManage && (
        <AddButton onClick={() => inputRef.current?.click()} disabled={!!busy}>{cv ? 'Replace CV' : 'Upload CV'}</AddButton>
      )}>
      <input ref={inputRef} type="file" accept={CV_ACCEPT} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
      {busy === 'upload' ? (
        <p className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="w-4 h-4 animate-spin" /> Uploading and reading your CV…</p>
      ) : cv ? (
        <div className="flex flex-wrap items-center gap-3">
          <FileText className="w-8 h-8 text-green-700 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{cv.fileName || 'CV'}</p>
            {cv.uploadedAt && <p className="text-xs text-gray-500">Uploaded {formatMonthYear(cv.uploadedAt)}</p>}
          </div>
          <a href={cv.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:underline">
            <ExternalLink className="w-4 h-4" /> View
          </a>
          {canManage && (
            <button type="button" onClick={remove} disabled={!!busy}
              className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          )}
        </div>
      ) : (
        <EmptyState icon={Upload} title="No CV uploaded" text="Upload a PDF or Word (.docx) CV, up to 5 MB." />
      )}
    </Section>
  );
};

// ─── Tab ─────────────────────────────────────────────────────────────────────
const CredentialsTab = ({ formData, setFormData, isEditing, handleInputChange, canManageCv = false }) => {
  const { updateEducation, updateCertifications, updateExperience, getTechnicianProfile } = useAuth();
  const [editor, setEditor] = useState(null); // { field, index|null, item }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const savers = {
    experience: (next) => updateExperience(next, formData.yearsOfExperience),
    education: updateEducation,
    certifications: updateCertifications,
  };

  const flash = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 3000);
  };

  const openEditor = (field, index = null) => {
    const source = index === null ? EMPTY[field] : formData[field][index];
    const item = { ...EMPTY[field], ...source };
    ['startDate', 'endDate', 'issueDate', 'expiryDate'].forEach((k) => { if (k in item) item[k] = toDateInput(item[k]); });
    if (field === 'experience') item.achievements = [...(source.achievements || [])];
    setFormError('');
    setEditor({ field, index, item });
  };

  const setItemField = (key, value) => setEditor((prev) => ({ ...prev, item: { ...prev.item, [key]: value } }));

  const submit = async () => {
    const { field, index, item } = editor;
    const missing = REQUIRED[field].find(([key]) => !String(item[key] || '').trim());
    if (missing) return setFormError(`Please enter the ${missing[1]}.`);
    if (field === 'certifications' && item.credentialUrl && !safeUrl(item.credentialUrl)) {
      return setFormError('The verification link must start with http:// or https://');
    }
    const clean = { ...item };
    if (clean.isCurrent) clean.endDate = '';
    if (clean.doesNotExpire) clean.expiryDate = '';

    const next = [...(formData[field] || [])];
    if (index === null) next.push(clean);
    else next[index] = clean;

    setSaving(true);
    const ok = await saveList({ field, next, formData, setFormData, saveFn: savers[field], onError: setFormError });
    setSaving(false);
    if (ok) {
      setEditor(null);
      flash(index === null ? `Added to your ${TITLES[field]}.` : 'Changes saved.');
    }
  };

  const remove = async (field, index, label) => {
    if (!window.confirm(`Remove “${label}”? This can't be undone.`)) return;
    setSaving(true);
    const ok = await saveList({
      field, next: formData[field].filter((_, i) => i !== index), formData, setFormData, saveFn: savers[field], onError: setError,
    });
    setSaving(false);
    if (ok) flash('Removed.');
  };

  const sorted = (field, dateField) =>
    (formData[field] || []).map((item, index) => ({ item, index })).sort(byNewest(dateField));

  const Fields = editor ? FIELDS[editor.field] : null;

  return (
    <div className="space-y-6">
      {error && <Banner onClose={() => setError('')}>{error}</Banner>}
      {notice && <Banner type="success">{notice}</Banner>}

      <CvCard
        cv={formData.cv}
        canManage={canManageCv}
        onError={setError}
        flash={flash}
        onUploaded={({ cv, filled = [], data }) => {
          const updates = Object.fromEntries(filled.map((k) => [k, data[k]]));
          setFormData((prev) => ({ ...prev, ...updates, cv }));
          getTechnicianProfile?.(); // keeps the completion bar and other tabs in step
        }}
        onRemoved={() => setFormData((prev) => ({ ...prev, cv: null }))}
      />

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 rounded-xl border border-gray-200 px-5 py-4">
        <Clock className="w-5 h-5 text-green-700" />
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm text-gray-500">Total years of experience</p>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input type="number" name="yearsOfExperience" min="0" max="60" className={inputClass.replace('w-full', 'w-28')}
                value={formData.yearsOfExperience ?? 0} onChange={handleInputChange} />
              <span className="text-xs text-gray-500">Saved with “Save Changes”.</span>
            </div>
          ) : (
            <p className="text-lg font-semibold text-gray-900">{formData.yearsOfExperience || 0} years</p>
          )}
        </div>
        <div className="flex gap-6 text-center">
          {[['experience', 'Jobs'], ['education', 'Education'], ['certifications', 'Certificates']].map(([k, label]) => (
            <div key={k}>
              <p className="text-lg font-semibold text-gray-900">{(formData[k] || []).length}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Work experience */}
      <Section icon={Briefcase} title="Work experience" description="Where you've worked and what you've done."
        action={isEditing && <AddButton onClick={() => openEditor('experience')} disabled={saving}>Add experience</AddButton>}>
        {(formData.experience || []).length === 0 ? (
          <EmptyState icon={Briefcase} title="No work experience yet"
            text="Clients trust experts who show where they've worked — including self-employed work." />
        ) : (
          <ol className="space-y-4">
            {sorted('experience', 'startDate').map(({ item: exp, index }) => (
              <li key={index} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <span className="mt-1 w-2.5 h-2.5 rounded-full bg-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                      <p className="text-sm text-gray-700">{exp.company}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3">
                        {formatRange(exp.startDate, exp.endDate, exp.isCurrent) && <span>{formatRange(exp.startDate, exp.endDate, exp.isCurrent)}</span>}
                        {exp.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{exp.location}</span>}
                      </p>
                    </div>
                    {isEditing && (
                      <RowActions disabled={saving} onEdit={() => openEditor('experience', index)}
                        onDelete={() => remove('experience', index, `${exp.title} at ${exp.company}`)} />
                    )}
                  </div>
                  {exp.description && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{exp.description}</p>}
                  {exp.achievements?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.achievements.map((a, i) => (
                        <li key={i} className="text-sm text-gray-600 flex gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Certifications */}
      <Section icon={BadgeCheck} title="Certifications & licences" description="Professional licences and certificates. Verified ones get a badge."
        action={isEditing && <AddButton onClick={() => openEditor('certifications')} disabled={saving}>Add certification</AddButton>}>
        {(formData.certifications || []).length === 0 ? (
          <EmptyState icon={BadgeCheck} title="No certifications yet"
            text="Add licences and certificates (e.g. EPRA, NITA). They're one of the strongest trust signals for clients." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sorted('certifications', 'issueDate').map(({ item: cert, index }) => {
              const status = certStatus(cert);
              const link = safeUrl(cert.credentialUrl);
              return (
                <div key={index} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                      <p className="text-sm text-gray-700">{cert.issuingOrganization}</p>
                    </div>
                    {isEditing && (
                      <RowActions disabled={saving} onEdit={() => openEditor('certifications', index)}
                        onDelete={() => remove('certifications', index, cert.name)} />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {cert.verified && <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Verified</span>}
                    {status && <span className={`px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>}
                    {formatMonthYear(cert.issueDate) && <span className="text-gray-500">Issued {formatMonthYear(cert.issueDate)}</span>}
                    {cert.doesNotExpire
                      ? <span className="text-gray-500">· No expiry</span>
                      : formatMonthYear(cert.expiryDate) && <span className="text-gray-500">· Expires {formatMonthYear(cert.expiryDate)}</span>}
                  </div>
                  {(cert.credentialId || link) && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {cert.credentialId && <span>No. {cert.credentialId}</span>}
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-700 hover:underline">
                          Verify <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Education */}
      <Section icon={GraduationCap} title="Education & training" description="Schools, colleges and trade training."
        action={isEditing && <AddButton onClick={() => openEditor('education')} disabled={saving}>Add education</AddButton>}>
        {(formData.education || []).length === 0 ? (
          <EmptyState icon={GraduationCap} title="No education added" text="Add colleges, technical institutes or apprenticeships." />
        ) : (
          <div className="space-y-3">
            {sorted('education', 'startDate').map(({ item: edu, index }) => (
              <div key={index} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-900">
                    {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}
                  </h4>
                  <p className="text-sm text-gray-700">{edu.institution}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3">
                    {formatRange(edu.startDate, edu.endDate, edu.isCurrent) && <span>{formatRange(edu.startDate, edu.endDate, edu.isCurrent)}</span>}
                    {edu.grade && <span>Grade: {edu.grade}</span>}
                  </p>
                  {edu.description && <p className="text-sm text-gray-600 mt-1">{edu.description}</p>}
                </div>
                {isEditing && (
                  <RowActions disabled={saving} onEdit={() => openEditor('education', index)}
                    onDelete={() => remove('education', index, `${edu.degree} — ${edu.institution}`)} />
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {!isEditing && (
        <p className="text-xs text-gray-400 text-center">Click “Edit Profile” to add or change your credentials.</p>
      )}

      {editor && (
        <FormModal
          title={`${editor.index === null ? 'Add' : 'Edit'} ${TITLES[editor.field]}`}
          onClose={() => setEditor(null)}
          onSave={submit}
          saving={saving}
          saveLabel={editor.index === null ? 'Add' : 'Save changes'}
          error={formError}
          wide
        >
          <Fields item={editor.item} set={setItemField} />
        </FormModal>
      )}
    </div>
  );
};

export default CredentialsTab;
