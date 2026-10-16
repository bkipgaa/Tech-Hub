/**
 * PortfolioTab.jsx
 * ================
 * Expert portfolio: a clean gallery of past projects with a full-size viewer,
 * plus an add/edit form (in a modal) when the profile is in edit mode.
 *
 * Every add, edit and delete is saved straight away (PUT /technician/profile/portfolio).
 * Media is uploaded to Cloudinary via POST /upload/portfolio; the media type
 * (image / video / document) comes from the upload itself.
 *
 * @version 4.0.0 – Professional layout, modal form, viewer, instant save
 */

import React, { useMemo, useState } from 'react';
import {
  Plus, Trash2, Camera, Star, FileText, Loader2, CheckCircle, AlertCircle,
  X, Pencil, Video, Calendar, Briefcase, ExternalLink, UploadCloud, Image as ImageIcon,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const MAX_ITEMS = 20;
const MAX_FILE_MB = 10;
const MAX_TAGS = 5;
const MAX_DESCRIPTION = 500;

const EMPTY_ITEM = {
  title: '',
  description: '',
  category: '',
  mediaType: 'image',
  mediaUrl: '',
  publicId: '',
  thumbnailUrl: '',
  clientName: '',
  completionDate: '',
  tags: [],
  isFeatured: false,
};

const formatMonthYear = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? '' : d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
};

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? '' : d.toISOString().slice(0, 10);
};

// ─── Media preview used by cards, the form and the viewer ───────────────────
const MediaPreview = ({ item, className = '', controls = false }) => {
  if (item.mediaType === 'video') {
    return <video src={item.mediaUrl} className={`${className} bg-black object-cover`} controls={controls} muted={!controls} />;
  }
  if (item.mediaType === 'document') {
    return (
      <div className={`${className} bg-gray-50 flex flex-col items-center justify-center text-gray-500`}>
        <FileText className="w-12 h-12 mb-2 text-gray-400" />
        <span className="text-xs font-medium">PDF document</span>
      </div>
    );
  }
  return <img src={item.mediaUrl} alt={item.title || 'Portfolio item'} className={`${className} object-cover`} loading="lazy" />;
};

// ─── Modal shell ─────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div
      className={`relative bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
        <h3 className="text-lg font-semibold text-gray-900 pr-6">{title}</h3>
        <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Add / edit form ─────────────────────────────────────────────────────────
const ProjectForm = ({ initial, serviceOptions, onCancel, onSave, saving }) => {
  const [item, setItem] = useState({ ...EMPTY_ITEM, ...initial, completionDate: toDateInput(initial?.completionDate) });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');

  const set = (field, value) => setItem((prev) => ({ ...prev, [field]: value }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`File is too large. The maximum is ${MAX_FILE_MB} MB.`);
      return;
    }
    setUploading(true);
    setUploadError('');
    const fd = new FormData();
    fd.append('media', file);
    try {
      const res = await api.post('/upload/portfolio', fd);
      if (!res.data.success) throw new Error(res.data.message || 'Upload failed');
      setItem((prev) => ({
        ...prev,
        mediaUrl: res.data.mediaUrl,
        publicId: res.data.publicId,
        thumbnailUrl: res.data.mediaUrl,
        mediaType: res.data.mediaType,
      }));
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || item.tags.includes(tag) || item.tags.length >= MAX_TAGS) return;
    set('tags', [...item.tags, tag]);
    setTagInput('');
  };

  const submit = () => {
    if (!item.title.trim()) return setFormError('Please give the project a title.');
    if (!item.mediaUrl) return setFormError('Please upload a photo, video or PDF of the project.');
    setFormError('');
    onSave({ ...item, title: item.title.trim(), description: item.description.trim() });
  };

  const label = 'block text-sm font-medium text-gray-700 mb-1';
  const input =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none';

  return (
    // The dashboard wraps tabs in a <form>: Enter in a text box must not submit it
    <div
      className="p-5 space-y-4"
      onKeyDown={(e) => e.key === 'Enter' && e.target.tagName === 'INPUT' && e.preventDefault()}
    >
      {/* Media */}
      <div>
        <span className={label}>
          Photo, video or PDF <span className="text-red-500">*</span>
        </span>
        {item.mediaUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <MediaPreview item={item} className="w-full h-56" controls={item.mediaType === 'video'} />
            <label className="absolute bottom-2 right-2 cursor-pointer bg-white/95 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow hover:bg-white inline-flex items-center gap-1">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : 'Replace'}
              <input type="file" accept="image/*,video/*,.pdf" onChange={handleFile} disabled={uploading} className="hidden" />
            </label>
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors ${
              uploading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 text-gray-400" />
            )}
            <span className="mt-2 text-sm font-medium text-gray-700">{uploading ? 'Uploading…' : 'Click to upload'}</span>
            <span className="text-xs text-gray-500">JPG, PNG, WEBP, MP4 or PDF · up to {MAX_FILE_MB} MB</span>
            <input type="file" accept="image/*,video/*,.pdf" onChange={handleFile} disabled={uploading} className="hidden" />
          </label>
        )}
        {uploadError && (
          <p className="mt-2 text-xs text-red-600 flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {uploadError}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">Tip: clear, well-lit photos of finished work get the most bookings.</p>
      </div>

      {/* Title */}
      <div>
        <label className={label} htmlFor="pf-title">
          Project title <span className="text-red-500">*</span>
        </label>
        <input
          id="pf-title"
          className={input}
          value={item.title}
          maxLength={80}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Full house rewiring, 3-bedroom bungalow"
        />
      </div>

      {/* Service + date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="pf-service">Service</label>
          <select id="pf-service" className={`${input} bg-white`} value={item.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">Select a service</option>
            {serviceOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            {item.category && !serviceOptions.includes(item.category) && <option value={item.category}>{item.category}</option>}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="pf-date">Completed on</label>
          <input
            id="pf-date"
            type="date"
            className={input}
            value={item.completionDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => set('completionDate', e.target.value)}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={label} htmlFor="pf-desc">Description</label>
        <textarea
          id="pf-desc"
          className={`${input} resize-y`}
          rows="3"
          maxLength={MAX_DESCRIPTION}
          value={item.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="What was the job, what did you do, and what was the result?"
        />
        <p className="text-xs text-gray-400 text-right">{item.description.length}/{MAX_DESCRIPTION}</p>
      </div>

      {/* Client */}
      <div>
        <label className={label} htmlFor="pf-client">Client (optional)</label>
        <input
          id="pf-client"
          className={input}
          value={item.clientName}
          maxLength={60}
          onChange={(e) => set('clientName', e.target.value)}
          placeholder="e.g. Greenview Apartments"
        />
        <p className="mt-1 text-xs text-gray-500">Only add a client's name with their permission — it is shown publicly.</p>
      </div>

      {/* Tags */}
      <div>
        <label className={label} htmlFor="pf-tag">Tags ({item.tags.length}/{MAX_TAGS})</label>
        <div className="flex gap-2">
          <input
            id="pf-tag"
            className={input}
            value={tagInput}
            maxLength={30}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="e.g. residential, solar, 3-phase"
            disabled={item.tags.length >= MAX_TAGS}
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim() || item.tags.length >= MAX_TAGS}
            className="px-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {item.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs">
                {tag}
                <button type="button" onClick={() => set('tags', item.tags.filter((t) => t !== tag))} className="text-gray-400 hover:text-red-500" aria-label={`Remove ${tag}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Featured */}
      <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
        <input type="checkbox" checked={!!item.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="mt-0.5 h-4 w-4 text-green-600 rounded" />
        <span>
          <span className="block text-sm font-medium text-gray-800">Feature this project</span>
          <span className="block text-xs text-gray-500">Featured projects are shown first on your profile.</span>
        </span>
      </label>

      {formError && (
        <p className="text-sm text-red-600 flex items-start gap-1">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {formError}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving || uploading}
          className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : initial?.mediaUrl ? 'Save changes' : 'Add project'}
        </button>
      </div>
    </div>
  );
};

// ─── Tab ─────────────────────────────────────────────────────────────────────
const PortfolioTab = ({ formData, setFormData, isEditing }) => {
  const { updatePortfolio } = useAuth();
  const portfolio = formData.portfolio || [];

  const [formFor, setFormFor] = useState(null); // null | { index: number|null }
  const [viewing, setViewing] = useState(null); // index being viewed full-size
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Services the expert offers, for the project's "Service" field
  const serviceOptions = useMemo(() => {
    const names = new Set();
    (formData.serviceCategories || []).forEach((sc) => {
      if (sc.categoryName) names.add(sc.categoryName);
      (sc.subServices || []).forEach((s) => names.add(typeof s === 'string' ? s : s?.name));
    });
    names.delete(undefined);
    return [...names];
  }, [formData.serviceCategories]);

  // Featured first, then newest completion date; keep original indexes for saving
  const ordered = useMemo(
    () =>
      portfolio
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
          if (!!b.item.isFeatured !== !!a.item.isFeatured) return b.item.isFeatured ? 1 : -1;
          return new Date(b.item.completionDate || 0) - new Date(a.item.completionDate || 0);
        }),
    [portfolio]
  );

  // Save the whole list; optimistic, rolled back if the server refuses
  const persist = async (next, successText) => {
    const previous = portfolio;
    setSaving(true);
    setError('');
    setFormData({ ...formData, portfolio: next, gallery: next.map((p) => p.mediaUrl) });
    const res = await updatePortfolio(next);
    setSaving(false);
    if (res?.success === false) {
      setFormData({ ...formData, portfolio: previous, gallery: previous.map((p) => p.mediaUrl) });
      setError(res.error || 'Could not save your portfolio. Please try again.');
      return false;
    }
    setNotice(successText);
    setTimeout(() => setNotice(''), 3000);
    return true;
  };

  const saveItem = async (item) => {
    const next = [...portfolio];
    if (formFor.index === null) next.push(item);
    else next[formFor.index] = item;
    if (await persist(next, formFor.index === null ? 'Project added to your portfolio.' : 'Project updated.')) setFormFor(null);
  };

  const deleteItem = async (index) => {
    if (!window.confirm(`Delete "${portfolio[index]?.title || 'this project'}" from your portfolio? This can't be undone.`)) return;
    if (viewing === index) setViewing(null);
    await persist(portfolio.filter((_, i) => i !== index), 'Project deleted.');
  };

  const atLimit = portfolio.length >= MAX_ITEMS;
  const viewed = viewing !== null ? portfolio[viewing] : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio</h3>
          <p className="text-sm text-gray-500">
            Show clients your best work. {portfolio.length}/{MAX_ITEMS} projects
          </p>
        </div>
        {isEditing ? (
          <button
            type="button"
            onClick={() => setFormFor({ index: null })}
            disabled={atLimit || saving}
            title={atLimit ? `You can have up to ${MAX_ITEMS} projects` : ''}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add project
          </button>
        ) : (
          portfolio.length > 0 && <p className="text-xs text-gray-400 self-center">Click “Edit Profile” to add or change projects.</p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-red-600" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {notice && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {notice}
        </div>
      )}

      {/* Gallery */}
      {portfolio.length === 0 ? (
        <div className="text-center py-14 px-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-3 font-medium text-gray-700">No projects yet</p>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            Experts with 3 or more projects in their portfolio get noticeably more bookings. Add photos of jobs you're proud of.
          </p>
          {isEditing ? (
            <button
              type="button"
              onClick={() => setFormFor({ index: null })}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Add your first project
            </button>
          ) : (
            <p className="mt-3 text-xs text-gray-400">Click “Edit Profile” to add projects.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ordered.map(({ item, index }) => (
            <div key={item.publicId || item.mediaUrl || index} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <button type="button" onClick={() => setViewing(index)} className="relative block w-full aspect-[4/3] overflow-hidden group" aria-label={`View ${item.title}`}>
                <MediaPreview item={item} className="w-full h-full group-hover:scale-[1.02] transition-transform" />
                {item.isFeatured && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                    <Star className="w-3 h-3 fill-current" /> Featured
                  </span>
                )}
                {item.mediaType === 'video' && (
                  <span className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full"><Video className="w-3.5 h-3.5" /></span>
                )}
              </button>

              <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  {item.category && (
                    <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {item.category}</span>
                  )}
                  {formatMonthYear(item.completionDate) && (
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatMonthYear(item.completionDate)}</span>
                  )}
                </div>
                {item.description && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>}
                {item.tags?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{tag}</span>
                    ))}
                  </div>
                )}

                {isEditing && (
                  <div className="mt-auto pt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormFor({ index })}
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(index)}
                      disabled={saving}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit */}
      {formFor && (
        <Modal title={formFor.index === null ? 'Add a project' : 'Edit project'} onClose={() => !saving && setFormFor(null)}>
          <ProjectForm
            initial={formFor.index === null ? EMPTY_ITEM : portfolio[formFor.index]}
            serviceOptions={serviceOptions}
            onCancel={() => setFormFor(null)}
            onSave={saveItem}
            saving={saving}
          />
        </Modal>
      )}

      {/* Full-size viewer */}
      {viewed && (
        <Modal title={viewed.title} onClose={() => setViewing(null)} wide>
          <div className="bg-gray-900 flex items-center justify-center">
            {viewed.mediaType === 'image' && <img src={viewed.mediaUrl} alt={viewed.title} className="max-h-[60vh] w-auto object-contain" />}
            {viewed.mediaType === 'video' && <video src={viewed.mediaUrl} className="max-h-[60vh] w-full" controls autoPlay />}
            {viewed.mediaType === 'document' && (
              <div className="py-12 text-center text-gray-200">
                <FileText className="w-14 h-14 mx-auto mb-3" />
                <a href={viewed.mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100">
                  <ExternalLink className="w-4 h-4" /> Open document
                </a>
              </div>
            )}
          </div>
          <div className="p-5 space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              {viewed.category && <span className="inline-flex items-center gap-1"><Briefcase className="w-4 h-4" /> {viewed.category}</span>}
              {formatMonthYear(viewed.completionDate) && <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatMonthYear(viewed.completionDate)}</span>}
              {viewed.clientName && <span>Client: {viewed.clientName}</span>}
            </div>
            {viewed.description && <p className="text-gray-700 whitespace-pre-line">{viewed.description}</p>}
            {viewed.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {viewed.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PortfolioTab;
