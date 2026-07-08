/**
 * ServicesTab Component
 * ====================
 * Allows technicians to select and manage their services using the three-level hierarchy:
 * Level 1: mainCategory (selected from parent component)
 * Level 2: serviceCategories (categoryName)
 * Level 3: subServices (array of sub-service names)
 * 
 * Features:
 * - Fetches service catalog from backend
 * - Dynamically loads service categories based on selected main category
 * - Dynamically loads sub-services based on selected service category
 * - Allows multiple sub-service selection
 * - Manages adding/removing service categories
 * - Prevents duplicate entries
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

const ServicesTab = ({ formData, setFormData, isEditing, isReadOnly, handleInputChange }) => {
  // State for service catalog data
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  
  // State for dynamic selection UI
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('');
  const [availableServiceCategories, setAvailableServiceCategories] = useState([]);
  const [availableSubServices, setAvailableSubServices] = useState([]);
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  
  // State for expanding/collapsing service categories in view mode
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // State for validation errors
  const [validationError, setValidationError] = useState('');

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
   * When mainCategory changes in formData, update available service categories
   */
  useEffect(() => {
    if (formData.mainCategory) {
      const category = catalog.find(c => c.mainCategory === formData.mainCategory);
      setAvailableServiceCategories(category?.serviceCategories || []);
      // Reset selections when main category changes
      setSelectedServiceCategory('');
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    } else {
      setAvailableServiceCategories([]);
      setSelectedServiceCategory('');
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    }
  }, [formData.mainCategory, catalog]);

  /**
   * When service category changes, fetch and update available sub-services
   */
  useEffect(() => {
    if (formData.mainCategory && selectedServiceCategory) {
      fetchSubServicesForCategory(formData.mainCategory, selectedServiceCategory);
    }
  }, [selectedServiceCategory, formData.mainCategory]);

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
    // Clear validation error when user makes a selection
    setValidationError('');
  };

  /**
   * Add a new service category with selected sub-services
   */
  const addServiceCategory = () => {
    // Validate main category is selected
    if (!formData.mainCategory) {
      setValidationError('Please select a main category in the Profile tab first.');
      return;
    }
    
    // Validate service category is selected
    if (!selectedServiceCategory) {
      setValidationError('Please select a service category.');
      return;
    }
    
    // Validate sub-services are selected
    if (selectedSubServices.length === 0) {
      setValidationError('Please select at least one sub-service.');
      return;
    }
    
    // Check if category already exists
    if (formData.serviceCategories.some(sc => sc.categoryName === selectedServiceCategory)) {
      setValidationError(`"${selectedServiceCategory}" is already added.`);
      return;
    }
    
    // Create new service category object
    const newServiceCategory = {
      categoryName: selectedServiceCategory,
      subServices: [...selectedSubServices],
      description: `${selectedServiceCategory} services`,
      basePrice: 0, // Will be updated in pricing section
      estimatedDuration: '2-4 hours',
      isActive: true,
      displayOrder: formData.serviceCategories.length
    };
    
    setFormData(prev => ({
      ...prev,
      serviceCategories: [...prev.serviceCategories, newServiceCategory]
    }));
    
    // Reset form for next selection
    setSelectedServiceCategory('');
    setSelectedSubServices([]);
    setAvailableSubServices([]);
    setValidationError('');
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

  // ========== LOADING STATE ==========
  if (catalogLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        <span className="ml-2 text-gray-600">Loading services...</span>
      </div>
    );
  }

  // ========== ERROR STATE ==========
  if (catalogError) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Error loading services</p>
          <p className="text-sm">{catalogError}</p>
        </div>
      </div>
    );
  }

  // ========== DISPLAY MODE (Not Editing) ==========
  if (!isEditing || isReadOnly) {
    return (
      <div className="space-y-6">
        {/* Main Category Display */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Main Category</h4>
          <p className="text-lg font-semibold text-gray-800">
            {formData.mainCategory || 'Not selected'}
          </p>
        </div>

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
                        {cat.subServices?.length || 0} services
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
                        {cat.subServices && cat.subServices.length > 0 ? (
                          cat.subServices.map((sub, subIdx) => (
                            <span
                              key={subIdx}
                              className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                            >
                              {sub}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-400 italic text-sm">No sub-services listed</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-700 text-sm">
                No services added yet. Switch to edit mode to add your services.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== EDIT MODE ==========
  return (
    <div className="space-y-6">
      {/* Main Category Info - Readonly display */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800">Main Category</h4>
            <p className="text-blue-900 font-semibold">
              {formData.mainCategory || '⚠️ Please select a main category in Profile tab first'}
            </p>
            {!formData.mainCategory && (
              <p className="text-xs text-blue-600 mt-1">
                You need to select a main category before adding services.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Validation Error Display */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{validationError}</span>
        </div>
      )}

      {/* Service Category Selection - Only enabled if main category is selected */}
      <div className={!formData.mainCategory ? 'opacity-50 pointer-events-none' : ''}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Service Category
        </label>
        <select
          value={selectedServiceCategory}
          onChange={(e) => setSelectedServiceCategory(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
          disabled={!formData.mainCategory}
        >
          <option value="">-- Select a service category --</option>
          {availableServiceCategories.map(cat => (
            <option key={cat.name} value={cat.name}>
              {cat.name} ({cat.subServiceCount} sub-services)
            </option>
          ))}
        </select>
        {!formData.mainCategory && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Please go to Profile tab and select a main category first
          </p>
        )}
      </div>

      {/* Sub-services Selection (only if service category selected) */}
      {selectedServiceCategory && formData.mainCategory && (
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
                    className={`flex items-start space-x-3 cursor-pointer p-2 rounded-lg transition-colors ${
                      selectedSubServices.includes(sub.name)
                        ? 'bg-green-50 border border-green-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubServices.includes(sub.name)}
                      onChange={() => toggleSubService(sub.name)}
                      className="h-4 w-4 text-green-600 rounded focus:ring-green-500 mt-1"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                      {sub.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{sub.description}</p>
                      )}
                      {sub.averagePrice && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Avg. price: {sub.averagePrice}
                        </p>
                      )}
                    </div>
                    {selectedSubServices.includes(sub.name) && (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
              
              <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
                <p className="text-xs text-gray-500">
                  {selectedSubServices.length} sub-service(s) selected
                </p>
                <button
                  type="button"
                  onClick={addServiceCategory}
                  className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  disabled={selectedSubServices.length === 0}
                >
                  <Plus className="w-4 h-4" />
                  Add {selectedServiceCategory}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-400 text-sm">No sub-services available for this category</p>
              <p className="text-xs text-gray-400 mt-1">Try selecting a different service category</p>
            </div>
          )}
        </div>
      )}

      {/* Display Added Service Categories */}
      {formData.serviceCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Added Services ({formData.serviceCategories.length} categories)
          </label>
          <div className="space-y-3">
            {formData.serviceCategories.map((cat, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                        #{idx + 1}
                      </span>
                      {cat.categoryName}
                      <span className="text-xs text-gray-400 font-normal">
                        ({cat.subServices.length} sub-services)
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cat.subServices.map((sub, subIdx) => (
                        <span
                          key={subIdx}
                          className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-green-200"
                        >
                          {sub}
                          <button
                            type="button"
                            onClick={() => removeSubService(idx, subIdx)}
                            className="text-red-400 hover:text-red-600 transition-colors ml-1"
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
                    className="text-red-400 hover:text-red-600 transition-colors ml-2 p-1 hover:bg-red-50 rounded"
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
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h5 className="text-sm font-semibold text-blue-800 mb-2">💡 How to Add Services:</h5>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Select a <strong>Service Category</strong> from the dropdown above</li>
          <li>Check the <strong>Sub-Services</strong> you offer</li>
          <li>Click <strong>"Add [Category Name]"</strong> to add them to your profile</li>
          <li>Repeat to add more service categories</li>
          <li>You can remove individual sub-services or entire categories</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          ⚠️ Make sure you've selected a <strong>Main Category</strong> in the Profile tab first
        </p>
      </div>
    </div>
  );
};

export default ServicesTab;