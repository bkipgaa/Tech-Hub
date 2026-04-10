import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const ServicesTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  const [newServiceCategory, setNewServiceCategory] = useState({
    categoryName: '',
    subServices: [],
    description: '',
    basePrice: '',
    estimatedDuration: ''
  });
  const [newSubService, setNewSubService] = useState('');

  // Service Categories Management
  const addServiceCategory = () => {
    if (newServiceCategory.categoryName) {
      setFormData({
        ...formData,
        serviceCategories: [...formData.serviceCategories, newServiceCategory]
      });
      setNewServiceCategory({
        categoryName: '',
        subServices: [],
        description: '',
        basePrice: '',
        estimatedDuration: ''
      });
    }
  };

  const removeServiceCategory = (index) => {
    const updatedCategories = [...formData.serviceCategories];
    updatedCategories.splice(index, 1);
    setFormData({ ...formData, serviceCategories: updatedCategories });
  };

  const addSubService = (categoryIndex) => {
    if (newSubService) {
      const updatedCategories = [...formData.serviceCategories];
      updatedCategories[categoryIndex].subServices = [
        ...updatedCategories[categoryIndex].subServices,
        newSubService
      ];
      setFormData({ ...formData, serviceCategories: updatedCategories });
      setNewSubService('');
    }
  };

  const removeSubService = (categoryIndex, subIndex) => {
    const updatedCategories = [...formData.serviceCategories];
    updatedCategories[categoryIndex].subServices.splice(subIndex, 1);
    setFormData({ ...formData, serviceCategories: updatedCategories });
  };

  return (
    <div className="space-y-6">
      {/* Pricing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pricing
        </label>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hourly Rate</label>
                <input
                  type="number"
                  name="pricing.hourlyRate"
                  value={formData.pricing.hourlyRate}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Fixed Price</label>
                <input
                  type="number"
                  name="pricing.fixedPrice"
                  value={formData.pricing.fixedPrice}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Consultation Fee</label>
                <input
                  type="number"
                  name="pricing.consultationFee"
                  value={formData.pricing.consultationFee}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Currency</label>
                <select
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleInputChange}
                  className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500"
                >
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Payment Methods</label>
                <select
                  multiple
                  name="pricing.paymentMethods"
                  value={formData.pricing.paymentMethods}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, paymentMethods: values }
                    });
                  }}
                  className="w-full p-3 border-2 border-green-300 rounded-lg focus:border-green-500 h-32"
                >
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Hourly Rate</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.pricing.currency} {formData.pricing.hourlyRate || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fixed Price</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.pricing.currency} {formData.pricing.fixedPrice || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Consultation Fee</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formData.pricing.currency} {formData.pricing.consultationFee || 0}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">Payment Methods: {formData.pricing.paymentMethods?.join(', ')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Service Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Categories
        </label>
        {isEditing ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg space-y-3">
              <input
                type="text"
                value={newServiceCategory.categoryName}
                onChange={(e) => setNewServiceCategory({ ...newServiceCategory, categoryName: e.target.value })}
                placeholder="Category Name"
                className="w-full p-2 border-2 border-green-300 rounded-lg"
              />
              <textarea
                value={newServiceCategory.description}
                onChange={(e) => setNewServiceCategory({ ...newServiceCategory, description: e.target.value })}
                placeholder="Description"
                className="w-full p-2 border-2 border-green-300 rounded-lg"
                rows="2"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={newServiceCategory.basePrice}
                  onChange={(e) => setNewServiceCategory({ ...newServiceCategory, basePrice: e.target.value })}
                  placeholder="Base Price"
                  className="p-2 border-2 border-green-300 rounded-lg"
                />
                <input
                  type="text"
                  value={newServiceCategory.estimatedDuration}
                  onChange={(e) => setNewServiceCategory({ ...newServiceCategory, estimatedDuration: e.target.value })}
                  placeholder="Est. Duration (e.g., 2 hours)"
                  className="p-2 border-2 border-green-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sub-Services</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubService}
                    onChange={(e) => setNewSubService(e.target.value)}
                    placeholder="Add sub-service"
                    className="flex-1 p-2 border-2 border-green-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSubService) {
                        setNewServiceCategory({
                          ...newServiceCategory,
                          subServices: [...newServiceCategory.subServices, newSubService]
                        });
                        setNewSubService('');
                      }
                    }}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newServiceCategory.subServices.map((sub, idx) => (
                    <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center">
                      {sub}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newServiceCategory.subServices.filter((_, i) => i !== idx);
                          setNewServiceCategory({ ...newServiceCategory, subServices: updated });
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={addServiceCategory}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Add Service Category
              </button>
            </div>

            <div className="space-y-3">
              {formData.serviceCategories.map((cat, idx) => (
                <div key={idx} className="border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{cat.categoryName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                      {(cat.basePrice || cat.estimatedDuration) && (
                        <p className="text-sm text-green-600 mt-1">
                          {cat.basePrice && `KES ${cat.basePrice}`}
                          {cat.basePrice && cat.estimatedDuration && ' • '}
                          {cat.estimatedDuration && cat.estimatedDuration}
                        </p>
                      )}
                      {cat.subServices && cat.subServices.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Sub-services:</p>
                          <div className="flex flex-wrap gap-1">
                            {cat.subServices.map((sub, subIdx) => (
                              <span key={subIdx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeServiceCategory(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.serviceCategories.map((cat, idx) => (
              <div key={idx} className="border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">{cat.categoryName}</h4>
                <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                {(cat.basePrice || cat.estimatedDuration) && (
                  <p className="text-sm text-green-600 mt-1">
                    {cat.basePrice && `KES ${cat.basePrice}`}
                    {cat.basePrice && cat.estimatedDuration && ' • '}
                    {cat.estimatedDuration && cat.estimatedDuration}
                  </p>
                )}
                {cat.subServices && cat.subServices.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Sub-services:</p>
                    <div className="flex flex-wrap gap-1">
                      {cat.subServices.map((sub, subIdx) => (
                        <span key={subIdx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Toggles */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="emergencyAvailable"
            checked={formData.emergencyAvailable}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Available for emergency services
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="remoteServiceAvailable"
            checked={formData.remoteServiceAvailable}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Available for remote services
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="weekendAvailable"
            checked={formData.weekendAvailable}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Available on weekends
          </label>
        </div>
      </div>
    </div>
  );
};

export default ServicesTab;