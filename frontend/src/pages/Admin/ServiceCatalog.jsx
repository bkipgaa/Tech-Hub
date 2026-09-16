/**
 * ServiceCatalog.jsx
 * ==================
 * Admin: manage the service catalog (main categories → services → sub-services).
 * 
 * Features:
 * - Search across main categories
 * - Expandable tree view
 * - Inline actions (edit, delete, toggle active) for all three levels
 * - Modals for creating/editing services and sub-services
 * - Safety checks (e.g., can't delete a category in use)
 * 
 * @version 1.0.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2, AlertCircle, Plus, Search, ChevronRight, ChevronDown,
  Trash2, Pencil, ListTree, Power, Save, X,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PermissionGate from '../../components/admin/PermissionGate';

const ServiceCatalog = () => {
  // ─── DATA ────────────────────────────────────────────────
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // ─── UI STATE ────────────────────────────────────────────
  const [expandedCat, setExpandedCat] = useState(null);
  const [expandedServices, setExpandedServices] = useState(new Set());
  const [treeData, setTreeData] = useState({}); // { [mainCategory]: fullCatalog }

  // ─── MODALS ──────────────────────────────────────────────
  const [createCatModal, setCreateCatModal] = useState({ open: false, name: '', loading: false });
  const [serviceModal, setServiceModal] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    mainCategory: '',
    serviceId: null,
    form: { name: '', description: '', isActive: true },
    loading: false,
  });
  const [subModal, setSubModal] = useState({
    open: false,
    mode: 'create',
    mainCategory: '',
    serviceId: null,
    subId: null,
    form: { name: '', description: '', isActive: true },
    loading: false,
  });

  // ─── FETCH LIST ──────────────────────────────────────────
  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      const res = await adminApi.get(`/catalog?${params.toString()}`);
      setCatalogs(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load catalog.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCatalogs(); }, [fetchCatalogs]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(fetchCatalogs, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ─── FETCH FULL TREE ─────────────────────────────────────
  const fetchTree = async (mainCategory, force = false) => {
    if (!force && treeData[mainCategory]) return;
    try {
      const res = await adminApi.get(`/catalog/${encodeURIComponent(mainCategory)}`);
      setTreeData((prev) => ({ ...prev, [mainCategory]: res.data.data }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load catalog tree.');
    }
  };

  const toggleCat = async (mainCategory) => {
    if (expandedCat === mainCategory) {
      setExpandedCat(null);
    } else {
      setExpandedCat(mainCategory);
      await fetchTree(mainCategory);
    }
  };

  const toggleService = (serviceId) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  // ─── MAIN CATEGORY ACTIONS ───────────────────────────────
  const handleCreateCategory = async () => {
    if (!createCatModal.name.trim()) return;
    setCreateCatModal((p) => ({ ...p, loading: true }));
    try {
      await adminApi.post('/catalog', { mainCategory: createCatModal.name.trim() });
      setCreateCatModal({ open: false, name: '', loading: false });
      fetchCatalogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create.');
      setCreateCatModal((p) => ({ ...p, loading: false }));
    }
  };

  const handleDeleteCategory = async (mainCategory) => {
    if (!window.confirm(`Delete "${mainCategory}"? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/catalog/${encodeURIComponent(mainCategory)}`);
      fetchCatalogs();
      setExpandedCat(null);
      setTreeData((prev) => {
        const next = { ...prev };
        delete next[mainCategory];
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const toggleCategoryActive = async (mainCategory, isActive) => {
    try {
      await adminApi.patch(`/catalog/${encodeURIComponent(mainCategory)}`, { isActive: !isActive });
      fetchCatalogs();
      fetchTree(mainCategory, true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update.');
    }
  };

  // ─── SERVICE ACTIONS ─────────────────────────────────────
  const openServiceModal = (mainCategory, service = null) => {
    setServiceModal({
      open: true,
      mode: service ? 'edit' : 'create',
      mainCategory,
      serviceId: service?._id || null,
      form: {
        name: service?.name || '',
        description: service?.description || '',
        isActive: service?.isActive !== false,
      },
      loading: false,
    });
  };

  const saveService = async () => {
    const { mode, mainCategory, serviceId, form } = serviceModal;
    if (!form.name.trim()) return;
    setServiceModal((p) => ({ ...p, loading: true }));
    try {
      if (mode === 'create') {
        await adminApi.post(`/catalog/${encodeURIComponent(mainCategory)}/services`, form);
      } else {
        await adminApi.patch(
          `/catalog/${encodeURIComponent(mainCategory)}/services/${serviceId}`,
          form
        );
      }
      setServiceModal({ open: false });
      fetchTree(mainCategory, true);
      fetchCatalogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save service.');
      setServiceModal((p) => ({ ...p, loading: false }));
    }
  };

  const deleteService = async (mainCategory, serviceId, name) => {
    if (!window.confirm(`Delete service "${name}"? All sub-services will also be removed.`)) return;
    try {
      await adminApi.delete(
        `/catalog/${encodeURIComponent(mainCategory)}/services/${serviceId}`
      );
      fetchTree(mainCategory, true);
      fetchCatalogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete service.');
    }
  };

  // ─── SUB-SERVICE ACTIONS ─────────────────────────────────
  const openSubModal = (mainCategory, serviceId, sub = null) => {
    setSubModal({
      open: true,
      mode: sub ? 'edit' : 'create',
      mainCategory,
      serviceId,
      subId: sub?._id || null,
      form: {
        name: sub?.name || '',
        description: sub?.description || '',
        isActive: sub?.isActive !== false,
      },
      loading: false,
    });
  };

  const saveSubService = async () => {
    const { mode, mainCategory, serviceId, subId, form } = subModal;
    if (!form.name.trim()) return;
    setSubModal((p) => ({ ...p, loading: true }));
    try {
      if (mode === 'create') {
        await adminApi.post(
          `/catalog/${encodeURIComponent(mainCategory)}/services/${serviceId}/sub-services`,
          form
        );
      } else {
        await adminApi.patch(
          `/catalog/${encodeURIComponent(mainCategory)}/services/${serviceId}/sub-services/${subId}`,
          form
        );
      }
      setSubModal({ open: false });
      fetchTree(mainCategory, true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save sub-service.');
      setSubModal((p) => ({ ...p, loading: false }));
    }
  };

  const deleteSubService = async (mainCategory, serviceId, subId, name) => {
    if (!window.confirm(`Delete sub-service "${name}"?`)) return;
    try {
      await adminApi.delete(
        `/catalog/${encodeURIComponent(mainCategory)}/services/${serviceId}/sub-services/${subId}`
      );
      fetchTree(mainCategory, true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete sub-service.');
    }
  };

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ListTree className="w-6 h-6 text-indigo-600" />
            Service Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage main categories, services, and sub-services.
          </p>
        </div>
        <PermissionGate permission="catalog.create">
          <button
            onClick={() => setCreateCatModal({ open: true, name: '', loading: false })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> New Main Category
          </button>
        </PermissionGate>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search main categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Catalog tree */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : catalogs.length === 0 ? (
          <div className="py-16 text-center">
            <ListTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search ? 'No categories match your search.' : 'No categories yet. Create one to get started.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {catalogs.map((cat) => {
              const isExpanded = expandedCat === cat.mainCategory;
              const tree = treeData[cat.mainCategory];

              return (
                <li key={cat._id}>
                  {/* Main category row */}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <button
                      onClick={() => toggleCat(cat.mainCategory)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      aria-label="Expand"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {cat.mainCategory}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cat.serviceCount} service{cat.serviceCount !== 1 ? 's' : ''} ·{' '}
                        {cat.subServiceCount} sub-service{cat.subServiceCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {!cat.isActive && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}

                    <PermissionGate permission="catalog.edit">
                      <button
                        onClick={() => toggleCategoryActive(cat.mainCategory, cat.isActive)}
                        className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                        title={cat.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </PermissionGate>

                    <PermissionGate permission="catalog.delete">
                      <button
                        onClick={() => handleDeleteCategory(cat.mainCategory)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                  </div>

                  {/* Expanded tree */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      {!tree ? (
                        <div className="py-4 text-center">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
                        </div>
                      ) : (
                        <>
                          {/* Services section header */}
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs uppercase tracking-wider text-gray-500">
                              Services
                            </h4>
                            <PermissionGate permission="catalog.create">
                              <button
                                onClick={() => openServiceModal(cat.mainCategory)}
                                className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Service
                              </button>
                            </PermissionGate>
                          </div>

                          {(tree.serviceCategories || []).length === 0 ? (
                            <p className="text-sm text-gray-400 py-2">
                              No services yet. Click "Add Service" to create one.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {tree.serviceCategories.map((svc) => {
                                const svcExpanded = expandedServices.has(svc._id);
                                return (
                                  <li
                                    key={svc._id}
                                    className="bg-white rounded-lg border border-gray-200"
                                  >
                                    {/* Service row */}
                                    <div className="flex items-center gap-2 px-3 py-2">
                                      <button
                                        onClick={() => toggleService(svc._id)}
                                        className="p-0.5 text-gray-500 hover:text-gray-700"
                                        aria-label="Expand service"
                                      >
                                        {svcExpanded ? (
                                          <ChevronDown className="w-4 h-4" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4" />
                                        )}
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                          {svc.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {svc.subServices?.length || 0} sub-service
                                          {svc.subServices?.length !== 1 ? 's' : ''}
                                        </p>
                                      </div>

                                      {!svc.isActive && (
                                        <span className="text-[10px] text-gray-500">
                                          inactive
                                        </span>
                                      )}

                                      <PermissionGate permission="catalog.edit">
                                        <button
                                          onClick={() => openServiceModal(cat.mainCategory, svc)}
                                          className="p-1 text-gray-500 hover:text-blue-600 rounded"
                                          title="Edit service"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                      </PermissionGate>

                                      <PermissionGate permission="catalog.delete">
                                        <button
                                          onClick={() =>
                                            deleteService(cat.mainCategory, svc._id, svc.name)
                                          }
                                          className="p-1 text-gray-500 hover:text-red-600 rounded"
                                          title="Delete service"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </PermissionGate>
                                    </div>

                                    {/* Sub-services */}
                                    {svcExpanded && (
                                      <div className="px-3 pb-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[10px] uppercase tracking-wider text-gray-400">
                                            Sub-services
                                          </span>
                                          <PermissionGate permission="catalog.create">
                                            <button
                                              onClick={() =>
                                                openSubModal(cat.mainCategory, svc._id)
                                              }
                                              className="text-[11px] text-green-600 hover:underline inline-flex items-center gap-1"
                                            >
                                              <Plus className="w-3 h-3" /> Add
                                            </button>
                                          </PermissionGate>
                                        </div>

                                        {(svc.subServices || []).length === 0 ? (
                                          <p className="text-xs text-gray-400 py-1">
                                            No sub-services yet.
                                          </p>
                                        ) : (
                                          <ul className="space-y-1">
                                            {svc.subServices.map((sub) => (
                                              <li
                                                key={sub._id}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50"
                                              >
                                                <span className="text-sm text-gray-700 flex-1 truncate">
                                                  {sub.name}
                                                </span>
                                                {!sub.isActive && (
                                                  <span className="text-[10px] text-gray-400">
                                                    inactive
                                                  </span>
                                                )}
                                                <PermissionGate permission="catalog.edit">
                                                  <button
                                                    onClick={() =>
                                                      openSubModal(cat.mainCategory, svc._id, sub)
                                                    }
                                                    className="p-1 text-gray-400 hover:text-blue-600"
                                                    title="Edit sub-service"
                                                  >
                                                    <Pencil className="w-3 h-3" />
                                                  </button>
                                                </PermissionGate>
                                                <PermissionGate permission="catalog.delete">
                                                  <button
                                                    onClick={() =>
                                                      deleteSubService(
                                                        cat.mainCategory,
                                                        svc._id,
                                                        sub._id,
                                                        sub.name
                                                      )
                                                    }
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                    title="Delete sub-service"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </PermissionGate>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ═══ Create main category modal ═══ */}
      {createCatModal.open && (
        <Modal
          title="New Main Category"
          onClose={() =>
            !createCatModal.loading &&
            setCreateCatModal({ open: false, name: '', loading: false })
          }
        >
          <input
            type="text"
            autoFocus
            value={createCatModal.name}
            onChange={(e) =>
              setCreateCatModal((p) => ({ ...p, name: e.target.value }))
            }
            placeholder="e.g. IT & Networking"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            Category name must match the enum in the Technician model.
          </p>
          <ModalActions
            onClose={() =>
              setCreateCatModal({ open: false, name: '', loading: false })
            }
            onSave={handleCreateCategory}
            loading={createCatModal.loading}
            disabled={!createCatModal.name.trim()}
            saveLabel="Create"
          />
        </Modal>
      )}

      {/* ═══ Service modal ═══ */}
      {serviceModal.open && (
        <Modal
          title={serviceModal.mode === 'create' ? 'Add Service' : 'Edit Service'}
          onClose={() => !serviceModal.loading && setServiceModal({ open: false })}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={serviceModal.form.name}
                onChange={(e) =>
                  setServiceModal((p) => ({
                    ...p,
                    form: { ...p.form, name: e.target.value },
                  }))
                }
                placeholder="e.g. Internet Services"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={serviceModal.form.description}
                onChange={(e) =>
                  setServiceModal((p) => ({
                    ...p,
                    form: { ...p.form, description: e.target.value },
                  }))
                }
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={serviceModal.form.isActive}
                onChange={(e) =>
                  setServiceModal((p) => ({
                    ...p,
                    form: { ...p.form, isActive: e.target.checked },
                  }))
                }
                className="rounded text-green-600 focus:ring-green-500"
              />
              Active
            </label>
          </div>
          <ModalActions
            onClose={() => setServiceModal({ open: false })}
            onSave={saveService}
            loading={serviceModal.loading}
            disabled={!serviceModal.form.name.trim()}
            saveLabel={serviceModal.mode === 'create' ? 'Add' : 'Save'}
          />
        </Modal>
      )}

      {/* ═══ Sub-service modal ═══ */}
      {subModal.open && (
        <Modal
          title={subModal.mode === 'create' ? 'Add Sub-Service' : 'Edit Sub-Service'}
          onClose={() => !subModal.loading && setSubModal({ open: false })}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={subModal.form.name}
                onChange={(e) =>
                  setSubModal((p) => ({
                    ...p,
                    form: { ...p.form, name: e.target.value },
                  }))
                }
                placeholder="e.g. WiFi Setup & Configuration"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                value={subModal.form.description}
                onChange={(e) =>
                  setSubModal((p) => ({
                    ...p,
                    form: { ...p.form, description: e.target.value },
                  }))
                }
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={subModal.form.isActive}
                onChange={(e) =>
                  setSubModal((p) => ({
                    ...p,
                    form: { ...p.form, isActive: e.target.checked },
                  }))
                }
                className="rounded text-green-600 focus:ring-green-500"
              />
              Active
            </label>
          </div>
          <ModalActions
            onClose={() => setSubModal({ open: false })}
            onSave={saveSubService}
            loading={subModal.loading}
            disabled={!subModal.form.name.trim()}
            saveLabel={subModal.mode === 'create' ? 'Add' : 'Save'}
          />
        </Modal>
      )}
    </div>
  );
};

// ─── Small helpers ──────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      {children}
    </div>
  </div>
);

const ModalActions = ({ onClose, onSave, loading, disabled, saveLabel }) => (
  <div className="flex gap-3 mt-5">
    <button
      onClick={onClose}
      disabled={loading}
      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      Cancel
    </button>
    <button
      onClick={onSave}
      disabled={loading || disabled}
      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {saveLabel}
    </button>
  </div>
);

export default ServiceCatalog;