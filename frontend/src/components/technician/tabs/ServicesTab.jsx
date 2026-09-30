/**
 * ServicesTab.jsx
 * ================
 * Technician services & pricing tab.
 * Supports inline editing of service categories (edit sub-services).
 *
 * @version 3.0.0 – Inline edit for service categories
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, AlertCircle,
  Loader2, Pencil, Save, X,
} from 'lucide-react';
import api from '../../../services/api';

const ServicesTab = ({
  formData,
  setFormData,
  isEditing,
  isReadOnly,
  handleInputChange,
  onAddServiceCategory,
  onRemoveServiceCategory,
  isSaving,
}) => {
  // ── Catalog state ──────────────────────────────────────
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  // ── Add-form state ─────────────────────────────────────
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('');
  const [availableServiceCategories, setAvailableServiceCategories] = useState([]);
  const [availableSubServices, setAvailableSubServices] = useState([]);
  const [selectedSubServices, setSelectedSubServices] = useState([]);
  const [subServicesLoading, setSubServicesLoading] = useState(false);

  // ── Inline-edit state ──────────────────────────────────
  const [editingCategoryKey, setEditingCategoryKey] = useState(null); // "mainCat||serviceCat"
  const [editAvailableSubs, setEditAvailableSubs] = useState([]);      // all options
  const [editSelectedSubs, setEditSelectedSubs] = useState([]);        // checked ones
  const [editSubsLoading, setEditSubsLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Misc UI state ──────────────────────────────────────
  const [expandedCategories, setExpandedCategories] = useState({});
  const [validationError, setValidationError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // ── Memoized ───────────────────────────────────────────
  const mainCategories = useMemo(() => formData.mainCategories || [], [formData.mainCategories]);
  const serviceCategories = useMemo(() => formData.serviceCategories || [], [formData.serviceCategories]);

  const groupedServices = useMemo(() => {
    const groups = {};
    serviceCategories.forEach((item) => {
      const key = item.mainCategory || 'Uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [serviceCategories]);

  // ═══════════════════════════════════════════════════════
  // EFFECTS — catalog fetch
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    const abortController = new AbortController();
    const fetchCatalog = async () => {
      try {
        setCatalogLoading(true);
        const response = await api.get('/service-catalog/categories-with-counts', {
          signal: abortController.signal,
        });
        if (response.data?.success !== false) {
          const data = response.data?.data || response.data?.categories || response.data;
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
      const cat = catalog.find((c) => c.mainCategory === selectedMainCategory);
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

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════
  const fetchSubServicesWithLoading = useCallback(async (mainCat, serviceCat) => {
    if (!mainCat || !serviceCat) return [];
    try {
      setSubServicesLoading(true);
      const encodedMain = encodeURIComponent(mainCat);
      const encodedService = encodeURIComponent(serviceCat);
      const response = await api.get(
        `/service-catalog/${encodedMain}/${encodedService}/sub-services/detailed`
      );
      let subs =
        response.data?.data?.subServices ||
        response.data?.subServices ||
        response.data?.data ||
        [];
      if (!Array.isArray(subs)) subs = [];
      setAvailableSubServices(subs);
      return subs;
    } catch (err) {
      console.error(err);
      setAvailableSubServices([]);
      if (err.response?.status !== 404) setValidationError('Failed to load sub-services.');
      return [];
    } finally {
      setSubServicesLoading(false);
    }
  }, []);

  const toggleSubService = (subName) => {
    setSelectedSubServices((prev) =>
      prev.includes(subName) ? prev.filter((s) => s !== subName) : [...prev, subName]
    );
    if (validationError) setValidationError('');
  };

  const toggleEditSubService = (subName) => {
    setEditSelectedSubs((prev) =>
      prev.includes(subName) ? prev.filter((s) => s !== subName) : [...prev, subName]
    );
  };

  const toggleCategoryExpand = useCallback((key) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ═══════════════════════════════════════════════════════
  // ADD FLOW
  // ═══════════════════════════════════════════════════════
  const addServiceCategory = useCallback(async () => {
    if (isAdding || isSaving) return;
    if (!selectedMainCategory) return setValidationError('Please select a main category to add services under.');
    if (!selectedServiceCategory) return setValidationError('Please select a service category.');
    if (selectedSubServices.length === 0) return setValidationError('Please select at least one sub-service.');

    const exists = serviceCategories.some(
      (sc) => sc.categoryName === selectedServiceCategory && sc.mainCategory === selectedMainCategory
    );
    if (exists)
      return setValidationError(
        `"${selectedServiceCategory}" is already added under "${selectedMainCategory}".`
      );

    setIsAdding(true);
    try {
      const payload = {
        mainCategory: selectedMainCategory,
        categoryName: selectedServiceCategory,
        subServices: [...selectedSubServices],
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
    isAdding, isSaving, selectedMainCategory, selectedServiceCategory,
    selectedSubServices, serviceCategories, onAddServiceCategory,
  ]);

  // ═══════════════════════════════════════════════════════
  // DELETE FLOW
  // ═══════════════════════════════════════════════════════
  const removeServiceCategory = useCallback(
    async (index) => {
      const item = serviceCategories[index];
      if (!item) return;
      if (!window.confirm(`Remove "${item.categoryName}" from "${item.mainCategory}"? This will remove all its sub-services.`))
        return;

      setIsAdding(true);
      try {
        const result = await onRemoveServiceCategory(item.categoryName, item.mainCategory);
        if (!result.success) setValidationError(result.error || 'Failed to remove service category');
      } catch (err) {
        console.error(err);
        setValidationError('Failed to remove service category.');
      } finally {
        setIsAdding(false);
      }
    },
    [serviceCategories, onRemoveServiceCategory]
  );

  const removeSubService = useCallback(
    (categoryIndex, subIndex) => {
      setFormData((prev) => {
        const updated = [...(prev.serviceCategories || [])];
        if (!updated[categoryIndex]) return prev;
        updated[categoryIndex].subServices.splice(subIndex, 1);
        if (updated[categoryIndex].subServices.length === 0) updated.splice(categoryIndex, 1);
        return { ...prev, serviceCategories: updated };
      });
    },
    [setFormData]
  );

  // ═══════════════════════════════════════════════════════
  // INLINE EDIT FLOW
  // ═══════════════════════════════════════════════════════
  const startEditCategory = async (item) => {
    setValidationError('');
    const key = `${item.mainCategory}||${item.categoryName}`;
    setEditingCategoryKey(key);
    setEditSelectedSubs([...(item.subServices || [])]);
    setEditSubsLoading(true);
    setEditAvailableSubs([]);

    try {
      const response = await api.get(
        `/service-catalog/${encodeURIComponent(item.mainCategory)}/${encodeURIComponent(item.categoryName)}/sub-services/detailed`
      );
      let subs =
        response.data?.data?.subServices ||
        response.data?.subServices ||
        response.data?.data ||
        [];
      if (!Array.isArray(subs)) subs = [];

      // Merge any currently-selected sub-services that are missing from the catalog
      // (e.g. legacy entries) so the user doesn't lose them on save.
      const catalogNames = new Set(subs.map((s) => s.name));
      const missing = (item.subServices || [])
        .filter((n) => !catalogNames.has(n))
        .map((n) => ({ name: n, description: '(not in catalog)' }));

      setEditAvailableSubs([...subs, ...missing]);
    } catch (err) {
      console.error('Failed to load sub-services for edit:', err);
      // Fall back to showing only what's already saved
      setEditAvailableSubs((item.subServices || []).map((n) => ({ name: n })));
      if (err.response?.status !== 404) setValidationError('Could not load sub-services for editing.');
    } finally {
      setEditSubsLoading(false);
    }
  };

  const cancelEditCategory = () => {
    setEditingCategoryKey(null);
    setEditAvailableSubs([]);
    setEditSelectedSubs([]);
  };

  const saveEditCategory = async (item) => {
    if (editSelectedSubs.length === 0) {
      setValidationError('A service category must have at least one sub-service.');
      return;
    }

    setSavingEdit(true);
    setValidationError('');

    try {
      // 1) Remove the old category
      const removeRes = await onRemoveServiceCategory(item.categoryName, item.mainCategory);
      if (!removeRes.success) {
        setValidationError(removeRes.error || 'Failed to update service category');
        setSavingEdit(false);
        return;
      }

      // 2) Re-add with the new sub-services
      const addRes = await onAddServiceCategory({
        mainCategory: item.mainCategory,
        categoryName: item.categoryName,
        subServices: [...editSelectedSubs],
      });
      if (!addRes.success) {
        // Roll back: re-add the original sub-services
        await onAddServiceCategory({
          mainCategory: item.mainCategory,
          categoryName: item.categoryName,
          subServices: [...(item.subServices || [])],
        });
        setValidationError(addRes.error || 'Failed to save sub-service changes');
        setSavingEdit(false);
        return;
      }

      cancelEditCategory();
    } catch (err) {
      console.error(err);
      setValidationError('Failed to save changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // RENDER — guards
  // ═══════════════════════════════════════════════════════
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
          <button
            onClick={() => { setCatalogError(''); setCatalogLoading(true); }}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── DISPLAY MODE ───────────────────────────────────────
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
              <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">{mainCat}</div>
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

  // ── EDIT MODE ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-sm flex-1">{validationError}</span>
          <button onClick={() => setValidationError('')} className="text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Main Category picker */}
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
          {mainCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {mainCategories.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            ⚠️ Please add at least one main category in the Profile tab first.
          </p>
        )}
      </div>

      {/* Service Category picker */}
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
            {availableServiceCategories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.subServiceCount} sub-services)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-services checkboxes for ADD */}
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

      {/* Saved categories — now with pencil for inline edit */}
      {serviceCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Added Services ({serviceCategories.length} total)
          </label>
          <div className="space-y-3">
            {Object.entries(groupedServices).map(([mainCat, items]) => (
              <div key={mainCat} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">{mainCat}</div>
                <div className="divide-y divide-gray-100">
                  {items.map((cat) => {
                    const globalIndex = serviceCategories.indexOf(cat);
                    const editKey = `${cat.mainCategory}||${cat.categoryName}`;
                    const isEditingThis = editingCategoryKey === editKey;

                    return (
                      <div key={editKey} className="p-4 bg-white">
                        {isEditingThis ? (
                          /* ─── Inline edit form ─── */
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                              <Pencil className="w-4 h-4 text-blue-500" />
                              <span className="font-semibold text-gray-800">
                                Editing: {cat.categoryName}
                              </span>
                            </div>

                            {editSubsLoading ? (
                              <div className="flex justify-center items-center py-6">
                                <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                                <span className="ml-2 text-sm text-gray-500">Loading sub-services…</span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                                {editAvailableSubs.map((sub) => (
                                  <label
                                    key={sub.name}
                                    className={`flex items-start space-x-3 cursor-pointer p-2 rounded-lg transition-colors ${
                                      editSelectedSubs.includes(sub.name)
                                        ? 'bg-green-50 border border-green-200'
                                        : 'hover:bg-white border border-transparent'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editSelectedSubs.includes(sub.name)}
                                      onChange={() => toggleEditSubService(sub.name)}
                                      className="h-4 w-4 text-green-600 rounded focus:ring-green-500 mt-1"
                                    />
                                    <div className="flex-1">
                                      <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                                      {sub.description && (
                                        <p className="text-xs text-gray-500 mt-0.5">{sub.description}</p>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-gray-500">
                              {editSelectedSubs.length} sub-service(s) selected
                            </p>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => saveEditCategory(cat)}
                                disabled={
                                  savingEdit || editSubsLoading || editSelectedSubs.length === 0
                                }
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 inline-flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
                              >
                                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {savingEdit ? 'Saving…' : 'Save Changes'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditCategory}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 inline-flex items-center justify-center gap-1.5 text-sm"
                              >
                                <X className="w-4 h-4" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ─── Display card ─── */
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
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                type="button"
                                onClick={() => startEditCategory(cat)}
                                className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"
                                title="Edit sub-services"
                                disabled={isAdding || isSaving}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeServiceCategory(globalIndex)}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                                title="Remove entire category"
                                disabled={isAdding || isSaving}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help box */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h5 className="text-sm font-semibold text-blue-800 mb-2">💡 How to Manage Services:</h5>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>To <strong>add</strong>: select a main category, then a service category, then tick the sub-services you offer.</li>
          <li>To <strong>edit</strong>: click the pencil on any saved category and toggle sub-services on/off.</li>
          <li>To <strong>remove a single sub-service</strong>: click its × inside the green chip.</li>
          <li>To <strong>remove an entire category</strong>: click the trash icon on the card.</li>
        </ol>
      </div>
    </div>
  );
};

export default ServicesTab;