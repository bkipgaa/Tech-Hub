import React, { useState } from 'react';
import { Plus, Trash2, Camera, Star, FileText } from 'lucide-react';

/**
 * PortfolioTab Component
 * Manages technician's portfolio items including images, videos, and documents
 * Features: Add/remove portfolio items, manage tags, feature items
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.formData - Main form data containing portfolio array
 * @param {Function} props.setFormData - Function to update form data
 * @param {boolean} props.isEditing - Whether the form is in edit mode
 */
const PortfolioTab = ({ formData, setFormData, isEditing }) => {
  // State for new portfolio item being added
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',              // Title of the portfolio item
    description: '',        // Description of the work
    category: '',           // Category this work belongs to
    mediaType: 'image',     // Type: 'image', 'video', or 'document'
    mediaUrl: '',           // URL to the media file
    thumbnailUrl: '',       // URL to thumbnail image (for videos/documents)
    clientName: '',         // Name of client (if applicable)
    completionDate: '',     // Date work was completed
    tags: [],               // Array of tags for searching
    isFeatured: false       // Whether to feature this item
  });

  // State for new tag being added
  const [newTag, setNewTag] = useState('');

  /**
   * Add a new portfolio item to the list
   * Validates that title and media URL are provided before adding
   */
  const addPortfolio = () => {
    // Validate required fields
    if (newPortfolio.title && newPortfolio.mediaUrl) {
      // Add new portfolio item to the portfolio array
      setFormData({
        ...formData,
        portfolio: [...formData.portfolio, newPortfolio],
        // Also add to gallery for backward compatibility
        gallery: [...formData.gallery, newPortfolio.mediaUrl]
      });
      // Reset the new portfolio form
      setNewPortfolio({
        title: '',
        description: '',
        category: '',
        mediaType: 'image',
        mediaUrl: '',
        thumbnailUrl: '',
        clientName: '',
        completionDate: '',
        tags: [],
        isFeatured: false
      });
    }
  };

  /**
   * Remove a portfolio item by index
   * @param {number} index - Index of the item to remove
   */
  const removePortfolio = (index) => {
    // Create copies of arrays to avoid direct mutation
    const updatedPortfolio = [...formData.portfolio];
    const updatedGallery = [...formData.gallery];
    // Remove item at specified index
    updatedPortfolio.splice(index, 1);
    updatedGallery.splice(index, 1);
    // Update form data
    setFormData({ 
      ...formData, 
      portfolio: updatedPortfolio,
      gallery: updatedGallery 
    });
  };

  /**
   * Add a tag to the new portfolio item
   * Prevents duplicate tags
   */
  const addTag = () => {
    // Check if tag is not empty and doesn't already exist
    if (newTag && !newPortfolio.tags.includes(newTag)) {
      setNewPortfolio({
        ...newPortfolio,
        tags: [...newPortfolio.tags, newTag]
      });
      setNewTag(''); // Clear input after adding
    }
  };

  /**
   * Remove a tag from the new portfolio item
   * @param {string} tagToRemove - The tag to remove
   */
  const removeTag = (tagToRemove) => {
    setNewPortfolio({
      ...newPortfolio,
      // Filter out the tag to remove
      tags: newPortfolio.tags.filter(tag => tag !== tagToRemove)
    });
  };

  /**
   * Handle image upload and convert to base64
   * @param {Object} e - File input change event
   */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a FileReader to read the file
      const reader = new FileReader();
      reader.onloadend = () => {
        // Set both mediaUrl and thumbnailUrl to the base64 string
        setNewPortfolio({
          ...newPortfolio,
          mediaUrl: reader.result,
          thumbnailUrl: reader.result
        });
      };
      reader.readAsDataURL(file); // Convert to base64
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Portfolio Item Section - Only visible in edit mode */}
      {isEditing && (
        <div className="bg-green-50 p-4 rounded-lg space-y-3">
          <h3 className="font-medium text-gray-900">Add Portfolio Item</h3>
          
          {/* Title and Media Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newPortfolio.title}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
              placeholder="Title"
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
            />
            <select
              value={newPortfolio.mediaType}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, mediaType: e.target.value })}
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </div>

          {/* Description Textarea */}
          <textarea
            value={newPortfolio.description}
            onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
            placeholder="Description"
            className="w-full p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
            rows="2"
          />

          {/* Client Name and Completion Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newPortfolio.clientName}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, clientName: e.target.value })}
              placeholder="Client Name"
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
            />
            <input
              type="date"
              value={newPortfolio.completionDate}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, completionDate: e.target.value })}
              className="p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
            />
          </div>

          {/* Media Upload Section */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Upload Media</label>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Choose File
                <input
                  type="file"
                  accept="image/*,video/*,.pdf"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {newPortfolio.mediaUrl && (
                <span className="text-sm text-green-600">File selected</span>
              )}
            </div>
          </div>

          {/* Tags Management */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                className="flex-1 p-2 border-2 border-green-300 rounded-lg focus:border-green-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {/* Display tags with remove buttons */}
            <div className="flex flex-wrap gap-2">
              {newPortfolio.tags.map((tag, idx) => (
                <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center">
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

          {/* Featured Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newPortfolio.isFeatured}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, isFeatured: e.target.checked })}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Feature this item
            </label>
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={addPortfolio}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Add to Portfolio
          </button>
        </div>
      )}

      {/* Portfolio Grid - Display all portfolio items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formData.portfolio.map((item, index) => (
          <div key={index} className="border border-green-200 rounded-lg overflow-hidden group relative">
            {/* Media Display - Different rendering based on media type */}
            {item.mediaType === 'image' && (
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
            )}
            {item.mediaType === 'video' && (
              <video src={item.mediaUrl} className="w-full h-48 object-cover" controls />
            )}
            {item.mediaType === 'document' && (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Portfolio Item Details */}
            <div className="p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900">{item.title}</h4>
                {item.isFeatured && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
              {item.clientName && (
                <p className="text-xs text-gray-500 mt-1">Client: {item.clientName}</p>
              )}
              {/* Display tags (limit to first 3) */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Button - Only visible in edit mode on hover */}
            {isEditing && (
              <button
                type="button"
                onClick={() => removePortfolio(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioTab;