import React from 'react';
import { Link as LinkIcon } from 'lucide-react';

/**
 * BusinessTab Component
 * Manages technician's business information, insurance, and social media links
 * Features: Business details, insurance info, social media profiles
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.formData - Main form data containing business info
 * @param {Function} props.setFormData - Function to update form data
 * @param {boolean} props.isEditing - Whether the form is in edit mode
 * @param {Function} props.handleInputChange - Function to handle input changes
 */
const BusinessTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  // Array of social media platforms for mapping
  const socialPlatforms = [
    { name: 'website', label: 'Website', icon: '🌐' },
    { name: 'facebook', label: 'Facebook', icon: '📘' },
    { name: 'twitter', label: 'Twitter', icon: '🐦' },
    { name: 'linkedin', label: 'LinkedIn', icon: '🔗' },
    { name: 'instagram', label: 'Instagram', icon: '📷' },
    { name: 'youtube', label: 'YouTube', icon: '▶️' },
    { name: 'tiktok', label: 'TikTok', icon: '🎵' }
  ];

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Information
        </label>
        {isEditing ? (
          // Edit Mode - Input fields
          <div className="space-y-4">
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              placeholder="Business Name"
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
            />
            <input
              type="text"
              name="businessRegistrationNumber"
              value={formData.businessRegistrationNumber}
              onChange={handleInputChange}
              placeholder="Business Registration Number"
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
            />
          </div>
        ) : (
          // View Mode - Display business info
          <div>
            <p className="text-gray-900 font-medium">{formData.businessName || 'No business name'}</p>
            {formData.businessRegistrationNumber && (
              <p className="text-sm text-gray-600">Reg: {formData.businessRegistrationNumber}</p>
            )}
          </div>
        )}
      </div>

      {/* Insurance Information */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Insurance Information
        </label>
        {isEditing ? (
          // Edit Mode - Insurance input fields
          <div className="space-y-4">
            <input
              type="text"
              name="insuranceInfo.provider"
              value={formData.insuranceInfo.provider}
              onChange={handleInputChange}
              placeholder="Insurance Provider"
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
            />
            <input
              type="text"
              name="insuranceInfo.policyNumber"
              value={formData.insuranceInfo.policyNumber}
              onChange={handleInputChange}
              placeholder="Policy Number"
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
            />
            <input
              type="date"
              name="insuranceInfo.expiryDate"
              value={formData.insuranceInfo.expiryDate}
              onChange={handleInputChange}
              className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
            />
          </div>
        ) : (
          // View Mode - Display insurance info
          <div>
            {formData.insuranceInfo.provider ? (
              <>
                <p className="text-gray-900">{formData.insuranceInfo.provider}</p>
                <p className="text-sm text-gray-600">Policy: {formData.insuranceInfo.policyNumber}</p>
                {formData.insuranceInfo.expiryDate && (
                  <p className="text-sm text-gray-600">
                    Expires: {new Date(formData.insuranceInfo.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500">No insurance information provided</p>
            )}
          </div>
        )}
      </div>

      {/* Social Media Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Social Media Links
        </label>
        {isEditing ? (
          // Edit Mode - Social media input fields for each platform
          <div className="space-y-3">
            {socialPlatforms.map((platform) => (
              <input
                key={platform.name}
                type="url"
                name={`socialLinks.${platform.name}`}
                value={formData.socialLinks[platform.name]}
                onChange={handleInputChange}
                placeholder={`${platform.label} URL`}
                className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
              />
            ))}
          </div>
        ) : (
          // View Mode - Display social links as clickable links
          <div className="space-y-2">
            {Object.entries(formData.socialLinks).map(([platform, url]) => (
              url && (
                <p key={platform} className="flex items-center text-sm">
                  <LinkIcon className="w-4 h-4 text-green-600 mr-2" />
                  <span className="capitalize">{platform}: </span>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ml-2 text-green-600 hover:underline"
                  >
                    {url}
                  </a>
                </p>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessTab;