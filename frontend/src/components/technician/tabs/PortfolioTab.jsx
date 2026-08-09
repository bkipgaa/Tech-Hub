import React, { useState } from 'react';
import { Plus, Trash2, Camera, Star, FileText, Loader2 } from 'lucide-react';
import api from '../../../services/api'; // your axios instance with auth interceptors

const PortfolioTab = ({ formData, setFormData, isEditing }) => {
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    category: '',
    mediaType: 'image',
    mediaUrl: '',
    publicId: '',           // ← Cloudinary public_id
    thumbnailUrl: '',
    clientName: '',
    completionDate: '',
    tags: [],
    isFeatured: false
  });

  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const addPortfolio = () => {
    if (newPortfolio.title && newPortfolio.mediaUrl) {
      setFormData({
        ...formData,
        portfolio: [...(formData.portfolio || []), newPortfolio],
        gallery: [...(formData.gallery || []), newPortfolio.mediaUrl]
      });
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
        isFeatured: false
      });
      setUploadError('');
    }
  };

  const removePortfolio = (index) => {
    const updatedPortfolio = [...(formData.portfolio || [])];
    const updatedGallery = [...(formData.gallery || [])];
    updatedPortfolio.splice(index, 1);
    updatedGallery.splice(index, 1);
    setFormData({ 
      ...formData, 
      portfolio: updatedPortfolio,
      gallery: updatedGallery 
    });
  };

  const addTag = () => {
    if (newTag && !newPortfolio.tags.includes(newTag)) {
      setNewPortfolio({ ...newPortfolio, tags: [...newPortfolio.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewPortfolio({
      ...newPortfolio,
      tags: newPortfolio.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formPayload = new FormData();
    formPayload.append('media', file);

    try {
      const res = await api.post('/upload/portfolio', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setNewPortfolio(prev => ({
          ...prev,
          mediaUrl: res.data.mediaUrl,
          publicId: res.data.publicId,
          thumbnailUrl: res.data.mediaUrl,
          mediaType: res.data.mediaType
        }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Form */}
      {isEditing && (
        <div className="bg-green-50 p-4 rounded-lg space-y-3 border border-green-200">
          <h3 className="font-medium text-gray-900">Add Portfolio Item</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newPortfolio.title}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
              placeholder="Project Title"
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
            <select
              value={newPortfolio.mediaType}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, mediaType: e.target.value })}
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white"
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
            className="w-full p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            rows="2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newPortfolio.clientName}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, clientName: e.target.value })}
              placeholder="Client Name (optional)"
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
            <input
              type="date"
              value={newPortfolio.completionDate}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, completionDate: e.target.value })}
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Upload */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Upload Media</label>
            <div className="flex items-center space-x-2">
              <label className={`cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-flex items-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Choose File'}
                <input
                  type="file"
                  accept="image/*,video/*,.pdf"
                  onChange={handleMediaUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {newPortfolio.mediaUrl && !uploading && (
                <span className="text-sm text-green-600 font-medium">✓ Uploaded</span>
              )}
            </div>
            {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
            
            {newPortfolio.mediaUrl && (
              <div className="mt-3 p-2 bg-white rounded-lg border border-green-200">
                {newPortfolio.mediaType === 'image' && (
                  <img src={newPortfolio.mediaUrl} alt="Preview" className="h-32 rounded object-cover" />
                )}
                {newPortfolio.mediaType === 'video' && (
                  <video src={newPortfolio.mediaUrl} className="h-32 rounded" controls />
                )}
                {newPortfolio.mediaType === 'document' && (
                  <div className="h-32 flex items-center justify-center bg-gray-50 rounded">
                    <FileText className="w-8 h-8 text-gray-400" />
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
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
                <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-red-500 hover:text-red-700">
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
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Feature this item</label>
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(formData.portfolio || []).map((item, index) => (
          <div key={index} className="border border-green-200 rounded-lg overflow-hidden group relative bg-white shadow-sm">
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
                  {item.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{tag}</span>
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
            <p>No portfolio items yet. {isEditing ? 'Add your first project above!' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioTab;