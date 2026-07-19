import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const ServicesTab = ({
  formData,
  setFormData,
  isEditing,
  isReadOnly,
  handleInputChange,
  onAddServiceCategory,
  onRemoveServiceCategory,
  isSaving
}) => {
  // ============================================================
  // STATE
  // ============================================================
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('');
  const [availableServiceCategories, setAvailableServiceCategories] = useState([]);
  const [availableSubServices, setAvailableSubServices] = useState([]);
  const [selectedSubServices, setSelectedSubServices] = useState([]);

  const [expandedCategories, setExpandedCategories] = useState({});
  const [validationError, setValidationError] = useState('');
  const [subServicesLoading, setSubServicesLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // ============================================================
  // MEMOIZED
  // ============================================================
  const mainCategories = useMemo(() => formData.mainCategories || [], [formData.mainCategories]);
  const serviceCategories = useMemo(() => formData.serviceCategories || [], [formData.serviceCategories]);

  const groupedServices = useMemo(() => {
    const groups = {};
    serviceCategories.forEach(item => {
      const key = item.mainCategory || 'Uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [serviceCategories]);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const abortController = new AbortController();
    const fetchCatalog = async () => {
      try {
        setCatalogLoading(true);
        const response = await api.get('/service-catalog/categories-with-counts', {
          signal: abortController.signal
        });
        if (response.data?.success !== false) {
          let data = response.data?.data || response.data?.categories || response.data;
          if (Array.isArray(data)) setCatalog(data);
          else setCatalogError('Invalid catalog format');
        } else {
          setCatalogError(response.data?.message || 'Failed to load catalog');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setCatalogError('Could not load services.');
        }
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchCatalog();
    return () => abortController.abort();
  }, []);

  useEffect(() => {
    if (selectedMainCategory && catalog.length) {
      const cat = catalog.find(c => c.mainCategory === selectedMainCategory);
      setAvailableServiceCategories(cat?.serviceCategories || []);
      setSelectedServiceCategory('');
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    } else {
      setAvailableServiceCategories([]);
      setSelectedServiceCategory('');
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    }
  }, [selectedMainCategory, catalog]);

  useEffect(() => {
    if (selectedMainCategory && selectedServiceCategory) {
      fetchSubServicesWithLoading(selectedMainCategory, selectedServiceCategory);
    } else {
      setAvailableSubServices([]);
      setSelectedSubServices([]);
    }
  }, [selectedServiceCategory, selectedMainCategory]);

  // ============================================================
  // HELPERS
  // ============================================================
  const fetchSubServicesWithLoading = useCallback(async (mainCat, serviceCat) => {
    if (!mainCat || !serviceCat) return;
    try {
      setSubServicesLoading(true);
      const encodedMain = encodeURIComponent(mainCat);
      const encodedService = encodeURIComponent(serviceCat);
      const response = await api.get(
        `/service-catalog/${encodedMain}/${encodedService}/sub-services/detailed`
      );
      let subs = response.data?.data?.subServices ||
                 response.data?.subServices ||
                 response.data?.data ||
                 [];
      if (!Array.isArray(subs)) subs = [];
      setAvailableSubServices(subs);
    } catch (err) {
      console.error(err);
      setAvailableSubServices([]);
      if (err.response?.status !== 404) {
        setValidationError('Failed to load sub-services.');
      }
    } finally {
      setSubServicesLoading(false);
    }
  }, []);

  const toggleSubService = (subName) => {
    setSelectedSubServices(prev =>
      prev.includes(subName) ? prev.filter(s => s !== subName) : [...prev, subName]
    );
    if (validationError) setValidationError('');
  };

  const addServiceCategory = useCallback(async () => {
    if (isAdding || isSaving) return;

    if (!selectedMainCategory) {
      setValidationError('Please select a main category to add services under.');
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

    const exists = serviceCategories.some(
      sc => sc.categoryName === selectedServiceCategory && sc.mainCategory === selectedMainCategory
    );
    if (exists) {
      setValidationError(`"${selectedServiceCategory}" is already added under "${selectedMainCategory}".`);
      return;
    }

    setIsAdding(true);
    try {
      const payload = {
        mainCategory: selectedMainCategory,
        categoryName: selectedServiceCategory,
        subServices: [...selectedSubServices]
      };
      const result = await onAddServiceCategory(payload);
      if (result.success) {
        setSelectedServiceCategory('');
        setSelectedSubServices([]);
        setAvailableSubServices([]);
        setValidationError('');
      } else {
        setValidationError(result.error || 'Failed to add service category');
      }
    } catch (err) {
      console.error(err);
      setValidationError('Failed to add service category.');
    } finally {
      setIsAdding(false);
    }
  }, [
    isAdding, isSaving,
    selectedMainCategory, selectedServiceCategory, selectedSubServices,
    serviceCategories, onAddServiceCategory
  ]);

  // ✅ UPDATED: Pass both categoryName and mainCategory
  const removeServiceCategory = useCallback(async (index) => {
    const item = serviceCategories[index];
    if (!item) return;
    if (!window.confirm(`Remove "${item.categoryName}" from "${item.mainCategory}"? This will remove all its sub-services.`)) return;

    setIsAdding(true);
    try {
      const result = await onRemoveServiceCategory(item.categoryName, item.mainCategory);
      if (!result.success) {
        setValidationError(result.error || 'Failed to remove service category');
      }
    } catch (err) {
      console.error(err);
      setValidationError('Failed to remove service category.');
    } finally {
      setIsAdding(false);
    }
  }, [serviceCategories, onRemoveServiceCategory]);

  const removeSubService = useCallback((categoryIndex, subIndex) => {
    setFormData(prev => {
      const updated = [...(prev.serviceCategories || [])];
      if (!updated[categoryIndex]) return prev;
      updated[categoryIndex].subServices.splice(subIndex, 1);
      if (updated[categoryIndex].subServices.length === 0) {
        updated.splice(categoryIndex, 1);
      }
      return { ...prev, serviceCategories: updated };
    });
  }, [setFormData]);

  const toggleCategoryExpand = useCallback((key) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const retryLoad = useCallback(() => {
    setCatalogError('');
    setCatalogLoading(true);
    api.get('/service-catalog/categories-with-counts')
      .then(res => {
        let data = res.data?.data || res.data?.categories || res.data;
        if (Array.isArray(data)) setCatalog(data);
        else setCatalogError('Invalid catalog data');
      })
      .catch(err => {
        console.error(err);
        setCatalogError('Could not load services.');
      })
      .finally(() => setCatalogLoading(false));
  }, []);

  // ============================================================
  // RENDER
  // ============================================================
  if (catalogLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading services...</span>
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Error loading services</p>
          <p className="text-sm">{catalogError}</p>
          <button onClick={retryLoad} className="mt-2 text-sm text-red-600 underline hover:text-red-800">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---------- DISPLAY MODE ----------
  if (!isEditing || isReadOnly) {
    return (
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Services Offered
        </h3>
        {Object.keys(groupedServices).length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-700 text-sm">No services added yet.</p>
          </div>
        ) : (
          Object.entries(groupedServices).map(([mainCat, items]) => (
            <div key={mainCat} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">
                {mainCat}
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((cat, idx) => {
                  const key = `${mainCat}-${cat.categoryName}`;
                  return (
                    <div key={idx}>
                      <button
                        onClick={() => toggleCategoryExpand(key)}
                        className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="font-medium text-gray-800">{cat.categoryName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {cat.subServices?.length || 0}
                          </span>
                          {expandedCategories[key] ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>
                      {expandedCategories[key] && (
                        <div className="px-4 py-3 bg-white flex flex-wrap gap-2">
                          {cat.subServices?.map((sub, i) => (
                            <span key={i} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // ---------- EDIT MODE ----------
  return (
    <div className="space-y-6">
      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{validationError}</span>
          <button onClick={() => setValidationError('')} className="ml-auto text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Main Category <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedMainCategory}
          onChange={(e) => setSelectedMainCategory(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
        >
          <option value="">-- Choose a main category --</option>
          {mainCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {mainCategories.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Please add at least one main category in the Profile tab first.
          </p>
        )}
      </div>

      {selectedMainCategory && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Service Category <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedServiceCategory}
            onChange={(e) => setSelectedServiceCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
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

      {selectedServiceCategory && selectedMainCategory && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Sub-Services You Offer <span className="text-red-500">*</span>
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
                      {sub.description && <p className="text-xs text-gray-500 mt-0.5">{sub.description}</p>}
                      {sub.averagePrice && <p className="text-xs text-gray-400 mt-0.5">Avg. price: {sub.averagePrice}</p>}
                    </div>
                    {selectedSubServices.includes(sub.name) && (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-500">{selectedSubServices.length} sub-service(s) selected</p>
                <button
                  type="button"
                  onClick={addServiceCategory}
                  disabled={selectedSubServices.length === 0 || isAdding || isSaving}
                  className="bg-gray-800 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding || isSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add {selectedServiceCategory}</>
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

      {serviceCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Added Services ({serviceCategories.length} total)
          </label>
          <div className="space-y-3">
            {Object.entries(groupedServices).map(([mainCat, items]) => (
              <div key={mainCat} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">
                  {mainCat}
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((cat, idx) => {
                    const globalIndex = serviceCategories.indexOf(cat);
                    return (
                      <div key={idx} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{cat.categoryName}</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {cat.subServices.map((sub, subIdx) => (
                                <span
                                  key={subIdx}
                                  className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-green-200"
                                >
                                  {sub}
                                  <button
                                    type="button"
                                    onClick={() => removeSubService(globalIndex, subIdx)}
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
                            onClick={() => removeServiceCategory(globalIndex)}
                            className="text-red-400 hover:text-red-600 transition-colors ml-2 p-1 hover:bg-red-50 rounded"
                            title="Remove entire category"
                            disabled={isAdding || isSaving}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h5 className="text-sm font-semibold text-blue-800 mb-2">💡 How to Add Services:</h5>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Select a <strong>Main Category</strong> you already added in the Profile tab.</li>
          <li>Choose a <strong>Service Category</strong> from the list.</li>
          <li>Check the <strong>Sub-Services</strong> you offer.</li>
          <li>Click <strong>"Add [Category Name]"</strong> to add them to your profile.</li>
          <li>You can remove individual sub‑services (local change) or entire categories (saved immediately).</li>
        </ol>
      </div>
    </div>
  );
};

export default ServicesTab;