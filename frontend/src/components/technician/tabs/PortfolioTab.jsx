/**
 * PortfolioTab.jsx
 * ================
 * Technician portfolio management tab.
 * Supports inline edit for every portfolio item, including media replacement.
 *
 * @version 3.1.0 – Inline edit with API persistence
 */

import React, { useState } from 'react';
import {
  Plus, Trash2, Camera, Star, FileText, Loader2,
  CheckCircle, AlertCircle, X, Pencil, Save,
} from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const EMPTY_PORTFOLIO = {
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

const PortfolioTab = ({ formData, setFormData, isEditing }) => {
  const { updatePortfolio } = useAuth();

  // ─── Add-form state ─────────────────────────────────────
  const [newPortfolio, setNewPortfolio] = useState({ ...EMPTY_PORTFOLIO });
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // ─── Inline-edit state ──────────────────────────────────
  const [editingIdx, setEditingIdx] = useState(null);
  const [editData, setEditData] = useState({ ...EMPTY_PORTFOLIO });
  const [editTag, setEditTag] = useState('');
  const [editUploading, setEditUploading] = useState(false);
  const [editUploadError, setEditUploadError] = useState('');
  const [editSelectedFile, setEditSelectedFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState('');

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ═══════════════════════════════════════════════════════
  // ADD FLOW
  // ═══════════════════════════════════════════════════════
  const addPortfolio = () => {
    if (newPortfolio.title && newPortfolio.mediaUrl) {
      setFormData({
        ...formData,
        portfolio: [...(formData.portfolio || []), newPortfolio],
        gallery: [...(formData.gallery || []), newPortfolio.mediaUrl],
      });
      setNewPortfolio({ ...EMPTY_PORTFOLIO });
      setNewTag('');
      setUploadError('');
      setSelectedFile(null);
    }
  };

  const removePortfolio = async (index) => {
    const updatedPortfolio = (formData.portfolio || []).filter((_, i) => i !== index);
    const updatedGallery = (formData.gallery || []).filter((_, i) => i !== index);
    setFormData({ ...formData, portfolio: updatedPortfolio, gallery: updatedGallery });
    if (editingIdx === index) cancelEdit();

    const res = await updatePortfolio(updatedPortfolio);
    if (!res.success) setError(res.error || 'Failed to delete portfolio item');
  };

  const addTag = () => {
    if (newTag && !newPortfolio.tags.includes(newTag)) {
      setNewPortfolio({ ...newPortfolio, tags: [...newPortfolio.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewPortfolio({ ...newPortfolio, tags: newPortfolio.tags.filter((t) => t !== tagToRemove) });
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }
    setSelectedFile(file);
    setUploading(true);
    setUploadError('');
    const fd = new FormData();
    fd.append('media', file);
    try {
      const res = await api.post('/upload/portfolio', fd);
      if (res.data.success) {
        setNewPortfolio((prev) => ({
          ...prev,
          mediaUrl: res.data.mediaUrl,
          publicId: res.data.publicId,
          thumbnailUrl: res.data.mediaUrl,
          mediaType: res.data.mediaType,
        }));
      } else {
        setUploadError(res.data.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setNewPortfolio((prev) => ({ ...prev, mediaUrl: '', publicId: '', thumbnailUrl: '' }));
    setUploadError('');
  };

  // ═══════════════════════════════════════════════════════
  // EDIT FLOW
  // ═══════════════════════════════════════════════════════
  const startEdit = (idx) => {
    const item = formData.portfolio[idx];
    setEditingIdx(idx);
    setEditData({ ...EMPTY_PORTFOLIO, ...item, tags: [...(item.tags || [])] });
    setEditTag('');
    setEditUploadError('');
    setEditSelectedFile(null);
    setError('');
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditData({ ...EMPTY_PORTFOLIO });
    setEditTag('');
    setEditUploadError('');
    setEditSelectedFile(null);
    setEditUploading(false);
  };

  const saveEdit = async () => {
    if (!editData.title || !editData.mediaUrl) {
      setError('Title and media are required');
      return;
    }
    setSavingEdit(true);
    setError('');

    const previousPortfolio = formData.portfolio;
    const previousGallery = formData.gallery;

    const updatedPortfolio = [...previousPortfolio];
    const previousUrl = updatedPortfolio[editingIdx]?.mediaUrl;
    updatedPortfolio[editingIdx] = editData;

    const updatedGallery = [...(previousGallery || [])];
    if (previousUrl !== editData.mediaUrl) {
      const gIdx = updatedGallery.indexOf(previousUrl);
      if (gIdx !== -1) updatedGallery[gIdx] = editData.mediaUrl;
    }

    // Optimistic UI
    setFormData({ ...formData, portfolio: updatedPortfolio, gallery: updatedGallery });

    const res = await updatePortfolio(updatedPortfolio);
    setSavingEdit(false);

    if (res.success) {
      cancelEdit();
    } else {
      // Roll back
      setFormData({ ...formData, portfolio: previousPortfolio, gallery: previousGallery });
      setError(res.error || 'Failed to save portfolio item');
    }
  };

  const addEditTag = () => {
    if (editTag && !editData.tags.includes(editTag)) {
      setEditData((prev) => ({ ...prev, tags: [...prev.tags, editTag] }));
      setEditTag('');
    }
  };

  const removeEditTag = (tagToRemove) => {
    setEditData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  const handleEditMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setEditUploadError('File size must be less than 10MB');
      return;
    }
    setEditSelectedFile(file);
    setEditUploading(true);
    setEditUploadError('');
    const fd = new FormData();
    fd.append('media', file);
    try {
      const res = await api.post('/upload/portfolio', fd);
      if (res.data.success) {
        setEditData((prev) => ({
          ...prev,
          mediaUrl: res.data.mediaUrl,
          publicId: res.data.publicId,
          thumbnailUrl: res.data.mediaUrl,
          mediaType: res.data.mediaType,
        }));
      } else {
        setEditUploadError(res.data.message || 'Upload failed');
      }
    } catch (err) {
      setEditUploadError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setEditUploading(false);
    }
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

      {/* ═══ Add form ═══ */}
      {isEditing && (
        <div className="bg-green-50 p-4 rounded-lg space-y-3 border border-green-200">
          <h3 className="font-medium text-gray-900">Add Portfolio Item</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newPortfolio.title}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
              placeholder="Project Title *"
              className="p-2 border-2 border-green-300 rounded-lg"
            />
            <select
              value={newPortfolio.mediaType}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, mediaType: e.target.value })}
              className="p-2 border-2 border-green-300 rounded-lg bg-white"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </div>

          <textarea
            value={newPortfolio.description}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
            placeholder="Describe this project..."
            className="w-full p-2 border-2 border-green-300 rounded-lg"
            rows="2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newPortfolio.clientName}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, clientName: e.target.value })}
              placeholder="Client Name (optional)"
              className="p-2 border-2 border-green-300 rounded-lg"
            />
            <input
              type="date"
              value={newPortfolio.completionDate}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, completionDate: e.target.value })}
              className="p-2 border-2 border-green-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Media <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label
                className={`cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2 ${
                  uploading ? 'opacity-50' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Choose File
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,video/*,.pdf"
                  onChange={handleMediaUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {selectedFile && !newPortfolio.mediaUrl && !uploading && (
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
              )}
              {newPortfolio.mediaUrl && !uploading && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" /> Uploaded
                </span>
              )}
            </div>

            {uploadError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{uploadError}</p>
              </div>
            )}

            {newPortfolio.mediaUrl && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Ready to add
                  </span>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Change
                  </button>
                </div>
                {newPortfolio.mediaType === 'image' && (
                  <img src={newPortfolio.mediaUrl} alt="Preview" className="max-h-40 rounded object-contain" />
                )}
                {newPortfolio.mediaType === 'video' && (
                  <video src={newPortfolio.mediaUrl} className="max-h-40 rounded" controls />
                )}
                {newPortfolio.mediaType === 'document' && (
                  <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag and press Enter"
                className="flex-1 p-2 border-2 border-green-300 rounded-lg"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newPortfolio.tags.map((tag, i) => (
                <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
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
              onChange={(e) => setNewPortfolio({ ...newPortfolio, isFeatured: e.target.checked })}
              className="h-4 w-4 text-green-600 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Feature this item</label>
          </div>

          <button
            type="button"
            onClick={addPortfolio}
            disabled={!newPortfolio.mediaUrl || !newPortfolio.title || uploading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Add to Portfolio
          </button>
        </div>
      )}

      {/* ═══ Grid ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(formData.portfolio || []).map((item, index) => (
          <div
            key={index}
            className="border border-green-200 rounded-lg overflow-hidden group relative bg-white shadow-sm"
          >
            {editingIdx === index ? (
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Project Title *"
                  className="w-full p-2 border-2 border-green-300 rounded-lg text-sm"
                />
                <select
                  value={editData.mediaType}
                  onChange={(e) => setEditData({ ...editData, mediaType: e.target.value })}
                  className="w-full p-2 border-2 border-green-300 rounded-lg text-sm bg-white"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  placeholder="Describe this project..."
                  className="w-full p-2 border-2 border-green-300 rounded-lg text-sm"
                  rows="2"
                />
                <input
                  type="text"
                  value={editData.clientName || ''}
                  onChange={(e) => setEditData({ ...editData, clientName: e.target.value })}
                  placeholder="Client Name (optional)"
                  className="w-full p-2 border-2 border-green-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={editData.completionDate || ''}
                  onChange={(e) => setEditData({ ...editData, completionDate: e.target.value })}
                  className="w-full p-2 border-2 border-green-300 rounded-lg text-sm"
                />

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Media (current)</label>
                  {editData.mediaType === 'image' && editData.mediaUrl && (
                    <img src={editData.mediaUrl} alt="Current" className="w-full h-28 object-cover rounded mb-1" />
                  )}
                  {editData.mediaType === 'video' && editData.mediaUrl && (
                    <video src={editData.mediaUrl} className="w-full h-28 object-cover rounded mb-1" controls />
                  )}
                  {editData.mediaType === 'document' && editData.mediaUrl && (
                    <div className="w-full h-20 flex items-center justify-center bg-gray-50 rounded mb-1">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <label
                    className={`cursor-pointer text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 ${
                      editUploading ? 'opacity-50' : ''
                    }`}
                  >
                    {editUploading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <Camera className="w-3 h-3" /> Replace file
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*,.pdf"
                      onChange={handleEditMediaUpload}
                      disabled={editUploading}
                      className="hidden"
                    />
                  </label>
                  {editSelectedFile && editUploading && (
                    <p className="text-[11px] text-gray-500 mt-1 truncate">{editSelectedFile.name}</p>
                  )}
                  {editUploadError && <p className="text-[11px] text-red-600 mt-1">{editUploadError}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tags</label>
                  <div className="flex gap-1 mb-1">
                    <input
                      type="text"
                      value={editTag}
                      onChange={(e) => setEditTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditTag())}
                      placeholder="Add tag"
                      className="flex-1 p-1.5 border-2 border-green-300 rounded text-xs"
                    />
                    <button type="button" onClick={addEditTag} className="bg-green-600 text-white px-2 rounded">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(editData.tags || []).map((tag, i) => (
                      <span key={i} className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeEditTag(tag)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!!editData.isFeatured}
                    onChange={(e) => setEditData({ ...editData, isFeatured: e.target.checked })}
                    className="h-3.5 w-3.5 text-green-600 rounded"
                  />
                  <label className="ml-2 text-xs text-gray-800">Feature this item</label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={savingEdit || editUploading || !editData.title || !editData.mediaUrl}
                    className="flex-1 bg-green-600 text-white py-1.5 rounded text-xs hover:bg-green-700 inline-flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {savingEdit ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 bg-gray-200 text-gray-700 py-1.5 rounded text-xs hover:bg-gray-300 inline-flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {item.mediaType === 'image' && (
                  <img src={item.mediaUrl} alt={item.title} className="w-full h-48 object-cover" loading="lazy" />
                )}
                {item.mediaType === 'video' && (
                  <video src={item.mediaUrl} className="w-full h-48 object-cover" controls />
                )}
                {item.mediaType === 'document' && (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    {item.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                  {item.clientName && <p className="text-xs text-gray-500 mt-1">Client: {item.clientName}</p>}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePortfolio(index)}
                      className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {(!formData.portfolio || formData.portfolio.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No portfolio items yet. {isEditing ? 'Add your first project above!' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioTab;