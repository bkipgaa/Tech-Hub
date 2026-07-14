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
 * 
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const ServicesTab = ({ formData, setFormData, isEditing, isReadOnly, handleInputChange }) => {
  // ============================================================
  // STATE VARIABLES
  // ============================================================
  
  // Service catalog data
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  
  // Dynamic selection UI
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('');
  const [availableServiceCategories, setAvailableServiceCategories] = useState([]);
  const [availableSubServices, setAvailableSubServices] = useState([]);
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  
  // UI state
  const [expandedCategories, setExpandedCategories] = useState({});
  const [validationError, setValidationError] = useState('');
  const [subServicesLoading, setSubServicesLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // ============================================================
  // MEMOIZED VALUES
  // ============================================================
  
  const hasMainCategory = useMemo(() => !!formData.mainCategory, [formData.mainCategory]);
  const categoryCount = useMemo(() => formData.serviceCategories?.length || 0, [formData.serviceCategories]);

  // ============================================================
  // EFFECT HOOKS
  // ============================================================

  /**
   * Fetch service catalog on component mount
   */
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchServiceCatalog = async () => {
      try {
        setCatalogLoading(true);
        setCatalogError('');
        
        const response = await api.get('/service-catalog/categories-with-counts', {
          signal: abortController.signal
        });
        
        console.log('📦 Catalog API Response:', response.data);
        
        if (response.data?.success !== false) {
          // ✅ Handle multiple possible response formats
          let catalogData = null;
          
          // Option 1: response.data.data
          if (response.data?.data && Array.isArray(response.data.data)) {
            catalogData = response.data.data;
            console.log('✅ Found catalog in response.data.data');
          }
          // Option 2: response.data.categories
          else if (response.data?.categories && Array.isArray(response.data.categories)) {
            catalogData = response.data.categories;
            console.log('✅ Found catalog in response.data.categories');
          }
          // Option 3: response.data (if the whole response is the array)
          else if (Array.isArray(response.data)) {
            catalogData = response.data;
            console.log('✅ Found catalog in response.data itself');
          }
          // Option 4: response.data.data.items
          else if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
            catalogData = response.data.data.items;
            console.log('✅ Found catalog in response.data.data.items');
          }
          
          if (catalogData && catalogData.length > 0) {
            setCatalog(catalogData);
            console.log('✅ Catalog loaded with', catalogData.length, 'items');
          } else {
            console.warn('⚠️ No catalog data found in response:', response.data);
            setCatalogError('No service catalog data available');
          }
        } else {
          setCatalogError(response.data?.message || 'Failed to load catalog');
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          console.log('Catalog fetch cancelled');
          return;
        }
        console.error('Failed to load service catalog:', err);
        setCatalogError('Could not load services. Please refresh the page.');
      } finally {
        setCatalogLoading(false);
      }
    };

    fetchServiceCatalog();

    return () => {
      abortController.abort();
    };
  }, []);

  /**
   * When mainCategory changes, update available service categories
   */
  useEffect(() => {
    if (hasMainCategory && catalog.length > 0) {
      const category = catalog.find(c => c.mainCategory === formData.mainCategory);
      const services = category?.serviceCategories || [];
      setAvailableServiceCategories(services);
      
      // Reset selections when main category changes
      setSelectedServiceCategory('');
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    } else if (!hasMainCategory) {
      setAvailableServiceCategories([]);
      setSelectedServiceCategory('');
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    }
  }, [formData.mainCategory, catalog, hasMainCategory]);

  /**
   * When service category changes, fetch sub-services
   */
  useEffect(() => {
    if (hasMainCategory && selectedServiceCategory) {
      fetchSubServicesWithLoading(formData.mainCategory, selectedServiceCategory);
    } else {
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    }
  }, [selectedServiceCategory, formData.mainCategory, hasMainCategory]);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  /**
   * Fetch sub-services with loading state
   */
  const fetchSubServicesWithLoading = useCallback(async (mainCategory, serviceCategory) => {
    if (!mainCategory || !serviceCategory) {
      setAvailableSubServices([]);
      return;
    }

    try {
      setSubServicesLoading(true);
      setValidationError('');
      
      const encodedMain = encodeURIComponent(mainCategory);
      const encodedService = encodeURIComponent(serviceCategory);
      
      const response = await api.get(
        `/service-catalog/${encodedMain}/${encodedService}/sub-services/detailed`
      );
      
      console.log('📦 Sub-services response:', response.data);
      
      // ✅ Handle multiple possible response formats
      let subServices = [];
      
      if (response.data?.data?.subServices) {
        subServices = response.data.data.subServices;
      } else if (response.data?.subServices) {
        subServices = response.data.subServices;
      } else if (Array.isArray(response.data?.data)) {
        subServices = response.data.data;
      } else if (Array.isArray(response.data)) {
        subServices = response.data;
      }
      
      if (subServices && subServices.length > 0) {
        setAvailableSubServices(subServices);
        console.log('✅ Loaded', subServices.length, 'sub-services');
      } else {
        setAvailableSubServices([]);
        console.log('ℹ️ No sub-services found for this category');
      }
    } catch (err) {
      console.error('Failed to load sub-services:', err);
      setAvailableSubServices([]);
      
      if (err.response?.status !== 404) {
        setValidationError('Failed to load sub-services. Please try again.');
      }
    } finally {
      setSubServicesLoading(false);
    }
  }, []);

  /**
   * Toggle sub-service selection
   */
  const toggleSubService = useCallback((subServiceName) => {
    setSelectedSubServices(prev => {
      const isSelected = prev.includes(subServiceName);
      const newSelection = isSelected
        ? prev.filter(s => s !== subServiceName)
        : [...prev, subServiceName];
      
      if (validationError) setValidationError('');
      
      return newSelection;
    });
  }, [validationError]);

  /**
   * Add a new service category
   */
  const addServiceCategory = useCallback(() => {
    if (isAdding) return;
    
    if (!hasMainCategory) {
      setValidationError('Please select a main category in the Profile tab first.');
      return;
    }
    
    if (!selectedServiceCategory) {
      setValidationError('Please select a service category.');
      return;
    }
    
    if (selectedSubServices.length === 0) {
      setValidationError('Please select at least one sub-service.');
      return;
    }
    
    if (formData.serviceCategories?.some(sc => sc.categoryName === selectedServiceCategory)) {
      setValidationError(`"${selectedServiceCategory}" is already added.`);
      return;
    }
    
    setIsAdding(true);
    
    try {
      const newServiceCategory = {
        categoryName: selectedServiceCategory,
        subServices: [...selectedSubServices],
        description: `${selectedServiceCategory} services`,
        basePrice: 0,
        estimatedDuration: '2-4 hours',
        isActive: true,
        displayOrder: formData.serviceCategories?.length || 0
      };
      
      setFormData(prev => ({
        ...prev,
        serviceCategories: [...(prev.serviceCategories || []), newServiceCategory]
      }));
      
      // Reset form
      setSelectedServiceCategory('');
      setSelectedSubServices([]);
      setAvailableSubServices([]);
      setValidationError('');
    } catch (err) {
      console.error('Error adding service category:', err);
      setValidationError('Failed to add service category. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }, [
    isAdding,
    hasMainCategory,
    selectedServiceCategory,
    selectedSubServices,
    formData.serviceCategories,
    setFormData
  ]);

  /**
   * Remove a service category
   */
  const removeServiceCategory = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories?.filter((_, i) => i !== index) || []
    }));
  }, [setFormData]);

  /**
   * Remove a sub-service
   */
  const removeSubService = useCallback((categoryIndex, subIndex) => {
    setFormData(prev => {
      const updatedCategories = [...(prev.serviceCategories || [])];
      
      if (!updatedCategories[categoryIndex]) return prev;
      
      updatedCategories[categoryIndex].subServices.splice(subIndex, 1);
      
      if (updatedCategories[categoryIndex].subServices.length === 0) {
        updatedCategories.splice(categoryIndex, 1);
      }
      
      return {
        ...prev,
        serviceCategories: updatedCategories
      };
    });
  }, [setFormData]);

  /**
   * Toggle category expansion
   */
  const toggleCategoryExpand = useCallback((index) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  /**
   * Retry loading catalog
   */
  const retryLoad = useCallback(() => {
    setCatalogError('');
    setCatalogLoading(true);
    
    api.get('/service-catalog/categories-with-counts')
      .then(response => {
        let catalogData = response.data?.data || response.data?.categories || response.data;
        if (Array.isArray(catalogData)) {
          setCatalog(catalogData);
        } else {
          setCatalogError('Invalid catalog data received');
        }
      })
      .catch(err => {
        console.error('Retry failed:', err);
        setCatalogError('Could not load services. Please refresh the page.');
      })
      .finally(() => {
        setCatalogLoading(false);
      });
  }, []);

  // ============================================================
  // RENDER: LOADING STATE
  // ============================================================
  
  if (catalogLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading services...</span>
      </div>
    );
  }

  // ============================================================
  // RENDER: ERROR STATE
  // ============================================================
  
  if (catalogError) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Error loading services</p>
          <p className="text-sm">{catalogError}</p>
          <button
            onClick={retryLoad}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: DISPLAY MODE
  // ============================================================
  
  if (!isEditing || isReadOnly) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-1">Main Category</h4>
          <p className="text-lg font-semibold text-gray-800">
            {formData.mainCategory || 'Not selected'}
          </p>
        </div>

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
                    type="button"
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

  // ============================================================
  // RENDER: EDIT MODE
  // ============================================================
  
  return (
    <div className="space-y-6">
      {/* Main Category Info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800">Main Category</h4>
            <p className="text-blue-900 font-semibold">
              {hasMainCategory 
                ? formData.mainCategory 
                : '⚠️ Please select a main category in Profile tab first'}
            </p>
            {!hasMainCategory && (
              <p className="text-xs text-blue-600 mt-1">
                You need to select a main category before adding services.
              </p>
            )}
          </div>
          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {categoryCount} categories added
          </div>
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{validationError}</span>
          <button
            onClick={() => setValidationError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Service Category Selection */}
      <div className={!hasMainCategory ? 'opacity-50 pointer-events-none' : ''}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Service Category
        </label>
        <select
          value={selectedServiceCategory}
          onChange={(e) => setSelectedServiceCategory(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
          disabled={!hasMainCategory}
        >
          <option value="">-- Select a service category --</option>
          {availableServiceCategories.map(cat => (
            <option key={cat.name} value={cat.name}>
              {cat.name} ({cat.subServiceCount} sub-services)
            </option>
          ))}
        </select>
        {!hasMainCategory && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Please go to Profile tab and select a main category first
          </p>
        )}
      </div>

      {/* Sub-services Selection */}
      {selectedServiceCategory && hasMainCategory && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Sub-Services You Offer
          </label>
          
          {subServicesLoading ? (
            <div className="flex justify-center items-center py-8 bg-white rounded-lg border border-gray-200">
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
              <span className="ml-2 text-gray-600 text-sm">Loading sub-services...</span>
            </div>
          ) : availableSubServices.length > 0 ? (
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
                  disabled={selectedSubServices.length === 0 || isAdding}
                  className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add {selectedServiceCategory}
                    </>
                  )}
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
      {formData.serviceCategories && formData.serviceCategories.length > 0 && (
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
                        ({cat.subServices?.length || 0} sub-services)
                      </span>
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cat.subServices && cat.subServices.map((sub, subIdx) => (
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