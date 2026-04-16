/**
 * ServicesTab Component
 * ====================
 * Allows technicians to select and manage their services:
 * - Main category selection from backend catalog
 * - Multiple service categories under each main category
 * - Multiple sub-services under each service category
 * - No pricing section - just service selection
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import api from '../../../services/api';

const ServicesTab = ({ formData, setFormData, isEditing, handleInputChange }) => {
  // State for service catalog data
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  
  // State for dynamic selection UI
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [availableServiceCategories, setAvailableServiceCategories] = useState([]);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('');
  const [availableSubServices, setAvailableSubServices] = useState([]);
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  
  // State for expanding/collapsing service categories in view mode
  const [expandedCategories, setExpandedCategories] = useState({});

  /**
   * Fetch service catalog on component mount
   */
  useEffect(() => {
    fetchServiceCatalog();
  }, []);

  /**
   * Fetch the complete service catalog from backend
   */
  const fetchServiceCatalog = async () => {
    try {
      setCatalogLoading(true);
      const response = await api.get('/service-catalog/categories-with-counts');
      setCatalog(response.data.data);
      setCatalogLoading(false);
    } catch (err) {
      console.error('Failed to load service catalog:', err);
      setCatalogError('Could not load services. Please refresh the page.');
      setCatalogLoading(false);
    }
  };

  /**
   * When main category changes, update available service categories
   */
  useEffect(() => {
    if (selectedMainCategory) {
      const category = catalog.find(c => c.mainCategory === selectedMainCategory);
      setAvailableServiceCategories(category?.serviceCategories || []);
      setSelectedServiceCategory('');
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    }
  }, [selectedMainCategory, catalog]);

  /**
   * When service category changes, fetch and update available sub-services
   */
  useEffect(() => {
    if (selectedMainCategory && selectedServiceCategory) {
      fetchSubServicesForCategory(selectedMainCategory, selectedServiceCategory);
    }
  }, [selectedServiceCategory, selectedMainCategory]);

  /**
   * Fetch sub-services for a specific service category from the detailed endpoint
   */
  const fetchSubServicesForCategory = async (mainCategory, serviceCategory) => {
    try {
      const encodedMain = encodeURIComponent(mainCategory);
      const encodedService = encodeURIComponent(serviceCategory);
      const response = await api.get(`/service-catalog/${encodedMain}/${encodedService}/sub-services/detailed`);
      setAvailableSubServices(response.data.data.subServices || []);
    } catch (err) {
      console.error('Failed to load sub-services:', err);
      setAvailableSubServices([]);
    }
  };

  /**
   * Toggle sub-service selection (allow multiple selection)
   */
  const toggleSubService = (subServiceName) => {
    setSelectedSubServices(prev =>
      prev.includes(subServiceName)
        ? prev.filter(s => s !== subServiceName)
        : [...prev, subServiceName]
    );
  };

  /**
   * Add a new service category with selected sub-services
   */
  const addServiceCategory = () => {
    if (!selectedServiceCategory) {
      alert('Please select a service category');
      return;
    }
    
    if (selectedSubServices.length === 0) {
      alert('Please select at least one sub-service');
      return;
    }
    
    // Check if category already exists
    if (formData.serviceCategories.some(sc => sc.categoryName === selectedServiceCategory)) {
      alert('This service category is already added');
      return;
    }
    
    // Create new service category object
    const newServiceCategory = {
      categoryName: selectedServiceCategory,
      subServices: [...selectedSubServices]
    };
    
    setFormData(prev => ({
      ...prev,
      serviceCategories: [...prev.serviceCategories, newServiceCategory]
    }));
    
    // Reset form for next selection
    setSelectedServiceCategory('');
    setSelectedSubServices([]);
    setAvailableSubServices([]);
  };

  /**
   * Remove an entire service category
   */
  const removeServiceCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.filter((_, i) => i !== index)
    }));
  };

  /**
   * Remove a specific sub-service from a category
   */
  const removeSubService = (categoryIndex, subIndex) => {
    const updatedCategories = [...formData.serviceCategories];
    updatedCategories[categoryIndex].subServices.splice(subIndex, 1);
    
    // If no sub-services left, remove the entire category
    if (updatedCategories[categoryIndex].subServices.length === 0) {
      updatedCategories.splice(categoryIndex, 1);
    }
    
    setFormData(prev => ({
      ...prev,
      serviceCategories: updatedCategories
    }));
  };

  /**
   * Toggle category expansion in view mode
   */
  const toggleCategoryExpand = (index) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (catalogLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Loading services...</span>
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        {catalogError}
      </div>
    );
  }

  // ========== DISPLAY MODE (Not Editing) ==========
  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Service Categories - Display only */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Services Offered
          </h3>
          {formData.serviceCategories && formData.serviceCategories.length > 0 ? (
            <div className="space-y-3">
              {formData.serviceCategories.map((cat, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategoryExpand(idx)}
                    className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-800">{cat.categoryName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {cat.subServices.length} services
                      </span>
                      {expandedCategories[idx] ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {expandedCategories[idx] && (
                    <div className="px-4 py-3 bg-white">
                      <div className="flex flex-wrap gap-2">
                        {cat.subServices.map((sub, subIdx) => (
                          <span
                            key={subIdx}
                            className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No services added yet</p>
          )}
        </div>
      </div>
    );
  }

  // ========== EDIT MODE ==========
  return (
    <div className="space-y-6">
      {/* Main Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Main Category
        </label>
        <select
          value={selectedMainCategory}
          onChange={(e) => setSelectedMainCategory(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none bg-white"
        >
          <option value="">-- Select a main category --</option>
          {catalog.map(cat => (
            <option key={cat.mainCategory} value={cat.mainCategory}>
              {cat.mainCategory} ({cat.serviceCategories.length} categories)
            </option>
          ))}
        </select>
      </div>

      {/* Service Category Selection (only if main category selected) */}
      {selectedMainCategory && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Service Category
          </label>
          <select
            value={selectedServiceCategory}
            onChange={(e) => setSelectedServiceCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none bg-white"
          >
            <option value="">-- Select a service category --</option>
            {availableServiceCategories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.subServiceCount} sub-services)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-services Selection (only if service category selected) */}
      {selectedServiceCategory && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Sub-Services You Offer
          </label>
          
          {availableSubServices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                {availableSubServices.map((sub) => (
                  <label
                    key={sub.name}
                    className={`flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-colors ${
                      selectedSubServices.includes(sub.name)
                        ? 'bg-green-50 border border-green-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubServices.includes(sub.name)}
                      onChange={() => toggleSubService(sub.name)}
                      className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                      {sub.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{sub.description}</p>
                      )}
                    </div>
                    {selectedSubServices.includes(sub.name) && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </label>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {selectedSubServices.length} sub-service(s) selected
                </p>
                <button
                  type="button"
                  onClick={addServiceCategory}
                  className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add {selectedServiceCategory}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-400 text-sm">No sub-services available for this category</p>
            </div>
          )}
        </div>
      )}

      {/* Display Added Service Categories */}
      {formData.serviceCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Added Services
          </label>
          <div className="space-y-3">
            {formData.serviceCategories.map((cat, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        Category {idx + 1}
                      </span>
                      {cat.categoryName}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cat.subServices.map((sub, subIdx) => (
                        <span
                          key={subIdx}
                          className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {sub}
                          <button
                            type="button"
                            onClick={() => removeSubService(idx, subIdx)}
                            className="text-red-500 hover:text-red-700 ml-1"
                            title="Remove this sub-service"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeServiceCategory(idx)}
                    className="text-red-500 hover:text-red-700 ml-2 p-1"
                    title="Remove entire category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-700">
          💡 <span className="font-semibold">Tip:</span> You can add multiple service categories under your main category. 
          For each category, select the sub-services you offer. You can add another category by selecting a different 
          service category from the dropdown above.
        </p>
      </div>
    </div>
  );
};

export default ServicesTab;