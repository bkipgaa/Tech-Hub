/**
 * PortfolioTab.jsx
 * ================
 * Technician portfolio management tab.
 * 
 * Features:
 * - Add portfolio items (image, video, document)
 * - Cloudinary upload via /api/upload/portfolio
 * - Shows selected file name + size before upload
 * - Preview uploaded media
 * - Tags, client name, completion date
 * 
 * @version 3.0.0 – File name display + better feedback
 */

import React, { useState } from 'react';
import {
  Plus, Trash2, Camera, Star, FileText, Loader2,
  CheckCircle, AlertCircle, X,
} from 'lucide-react';
import api from '../../../services/api';

const PortfolioTab = ({ formData, setFormData, isEditing }) => {
  const [newPortfolio, setNewPortfolio] = useState({
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
  });

  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // ← holds the File object

  // ─── Utility: format file size ──────────────────────────
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ─── Add portfolio item ─────────────────────────────────
  const addPortfolio = () => {
    if (newPortfolio.title && newPortfolio.mediaUrl) {
      setFormData({
        ...formData,
        portfolio: [...(formData.portfolio || []), newPortfolio],
        gallery: [...(formData.gallery || []), newPortfolio.mediaUrl],
      });

      // Reset form
      setNewPortfolio({
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
      });
      setNewTag('');
      setUploadError('');
      setUploading(false);
      setSelectedFile(null);
    }
  };

  // ─── Remove portfolio item ──────────────────────────────
  const removePortfolio = (index) => {
    const updatedPortfolio = [...(formData.portfolio || [])];
    const updatedGallery = [...(formData.gallery || [])];
    updatedPortfolio.splice(index, 1);
    updatedGallery.splice(index, 1);
    setFormData({
      ...formData,
      portfolio: updatedPortfolio,
      gallery: updatedGallery,
    });
  };

  // ─── Tags ───────────────────────────────────────────────
  const addTag = () => {
    if (newTag && !newPortfolio.tags.includes(newTag)) {
      setNewPortfolio({ ...newPortfolio, tags: [...newPortfolio.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewPortfolio({
      ...newPortfolio,
      tags: newPortfolio.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // ─── Media upload ───────────────────────────────────────
  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📁 File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Size guard
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    // Store the selected file so we can display its name
    setSelectedFile(file);
    setUploading(true);
    setUploadError('');

    const formPayload = new FormData();
    formPayload.append('media', file);

    try {
      console.log('📤 Uploading:', file.name);

      // DO NOT set Content-Type — axios auto-detects FormData
      const res = await api.post('/upload/portfolio', formPayload);

      console.log('📤 Upload response:', res.data);

      if (res.data.success) {
        setNewPortfolio((prev) => ({
          ...prev,
          mediaUrl: res.data.mediaUrl,
          publicId: res.data.publicId,
          thumbnailUrl: res.data.mediaUrl,
          mediaType: res.data.mediaType,
        }));
        setUploadError('');
      } else {
        setUploadError(res.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  // ─── Clear selected file ────────────────────────────────
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setNewPortfolio((prev) => ({
      ...prev,
      mediaUrl: '',
      publicId: '',
      thumbnailUrl: '',
    }));
    setUploadError('');
    // Note: can't reset the <input type="file"> value directly.
    // The user can pick another file if they want.
  };

  // ═════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ═══ Add form (only in edit mode) ═══ */}
      {isEditing && (
        <div className="bg-green-50 p-4 rounded-lg space-y-3 border border-green-200">
          <h3 className="font-medium text-gray-900">Add Portfolio Item</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newPortfolio.title}
              onChange={(e) =>
                setNewPortfolio({ ...newPortfolio, title: e.target.value })
              }
              placeholder="Project Title *"
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
            <select
              value={newPortfolio.mediaType}
              onChange={(e) =>
                setNewPortfolio({ ...newPortfolio, mediaType: e.target.value })
              }
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </div>

          <textarea
            value={newPortfolio.description}
            onChange={(e) =>
              setNewPortfolio({ ...newPortfolio, description: e.target.value })
            }
            placeholder="Describe this project..."
            className="w-full p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            rows="2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newPortfolio.clientName}
              onChange={(e) =>
                setNewPortfolio({ ...newPortfolio, clientName: e.target.value })
              }
              placeholder="Client Name (optional)"
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
            <input
              type="date"
              value={newPortfolio.completionDate}
              onChange={(e) =>
                setNewPortfolio({
                  ...newPortfolio,
                  completionDate: e.target.value,
                })
              }
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* ═══ Upload Section ═══ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Media <span className="text-red-500">*</span>
            </label>

            {/* File picker button */}
            <div className="flex flex-wrap items-center gap-3">
              <label
                className={`cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-flex items-center gap-2 transition-colors ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Choose File
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

              {/* Selected file info */}
              {selectedFile && !newPortfolio.mediaUrl && !uploading && (
                <span className="text-sm text-gray-600">
                  {selectedFile.name}
                </span>
              )}

              {/* Uploaded success badge */}
              {newPortfolio.mediaUrl && !uploading && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Uploaded
                </span>
              )}
            </div>

            {/* Selected file details (before upload completes) */}
            {selectedFile && !newPortfolio.mediaUrl && !uploading && (
              <div className="mt-2 p-2 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)} · {selectedFile.type}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{uploadError}</p>
              </div>
            )}

            {/* Preview once uploaded */}
            {newPortfolio.mediaUrl && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Ready to add
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
                  <img
                    src={newPortfolio.mediaUrl}
                    alt="Preview"
                    className="max-h-40 rounded object-contain"
                  />
                )}
                {newPortfolio.mediaType === 'video' && (
                  <video
                    src={newPortfolio.mediaUrl}
                    className="max-h-40 rounded"
                    controls
                  />
                )}
                {newPortfolio.mediaType === 'document' && (
                  <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
                placeholder="Add tag and press Enter"
                className="flex-1 p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
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
              {newPortfolio.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center"
                >
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

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newPortfolio.isFeatured}
              onChange={(e) =>
                setNewPortfolio({
                  ...newPortfolio,
                  isFeatured: e.target.checked,
                })
              }
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Feature this item
            </label>
          </div>

          <button
            type="button"
            onClick={addPortfolio}
            disabled={!newPortfolio.mediaUrl || !newPortfolio.title || uploading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Portfolio
          </button>
        </div>
      )}

      {/* ═══ Portfolio grid ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(formData.portfolio || []).map((item, index) => (
          <div
            key={index}
            className="border border-green-200 rounded-lg overflow-hidden group relative bg-white shadow-sm"
          >
            {item.mediaType === 'image' && (
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            )}
            {item.mediaType === 'video' && (
              <video
                src={item.mediaUrl}
                className="w-full h-48 object-cover"
                controls
              />
            )}
            {item.mediaType === 'document' && (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
            )}

            <div className="p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900">{item.title}</h4>
                {item.isFeatured && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {item.description}
              </p>
              {item.clientName && (
                <p className="text-xs text-gray-500 mt-1">
                  Client: {item.clientName}
                </p>
              )}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={() => removePortfolio(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {(!formData.portfolio || formData.portfolio.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>
              No portfolio items yet.{' '}
              {isEditing ? 'Add your first project above!' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioTab;