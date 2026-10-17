/**
 * ServicesTab.jsx
 * ================
 * The services an expert offers, grouped by category.
 *
 * - "Add services": pick any catalog category → service category → tick the
 *   services (with search and select-all). Saved straight away.
 * - Edit a service category's services in one save (PUT /profile/service-category),
 *   remove a single service, or remove the whole service category.
 * - Adding services under a category also adds that category to the profile.
 *
 * @version 4.0.0 – Grouped cards, modal picker, single-save edits
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, Layers, Search, Loader2, X, CheckCircle } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { Section, Field, EmptyState, AddButton, RowActions, Banner, FormModal, inputClass } from './ui';

const subServicesUrl = (main, sc) =>
  `/service-catalog/${encodeURIComponent(main)}/${encodeURIComponent(sc)}/sub-services/detailed`;

const readSubServices = (res) => {
  const subs = res.data?.data?.subServices || res.data?.subServices || res.data?.data || [];
  return Array.isArray(subs) ? subs : [];
};

// ─── Checklist with search + select all ──────────────────────────────────────
const ServiceChecklist = ({ options, selected, onChange, loading }) => {
  const [query, setQuery] = useState('');
  const visible = options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (name) => onChange(selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading services…
      </div>
    );
  }
  if (options.length === 0) {
    return <p className="text-sm text-gray-500 py-6 text-center">No services listed under this yet.</p>;
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${inputClass} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services" />
        </div>
        <button type="button" onClick={() => onChange([...new Set([...selected, ...visible.map((o) => o.name)])])}
          className="text-sm text-green-700 hover:underline">Select all</button>
        <button type="button" onClick={() => onChange([])} className="text-sm text-gray-500 hover:underline">Clear</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-2">
        {visible.map((o) => {
          const on = selected.includes(o.name);
          return (
            <label key={o.name} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer text-sm ${on ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
              <input type="checkbox" className="mt-0.5 h-4 w-4 text-green-600 rounded" checked={on} onChange={() => toggle(o.name)} />
              <span className="text-gray-800">{o.name}</span>
            </label>
          );
        })}
        {visible.length === 0 && <p className="col-span-full text-sm text-gray-500 p-2">No services match “{query}”.</p>}
      </div>
      <p className="text-xs text-gray-500">{selected.length} selected</p>
    </div>
  );
};

// ─── Tab ─────────────────────────────────────────────────────────────────────
const ServicesTab = ({ formData, setFormData, isEditing, isReadOnly, onAddServiceCategory, onRemoveServiceCategory, isSaving }) => {
  const { updateServiceCategoryServices } = useAuth();
  const canEdit = isEditing && !isReadOnly;

  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', main, sc, selected, options, loading }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const serviceCategories = useMemo(() => formData.serviceCategories || [], [formData.serviceCategories]);
  const busy = saving || isSaving;

  const loadCatalog = () => {
    setCatalogError('');
    api
      .get('/service-catalog/categories-with-counts')
      .then((res) => {
        const data = res.data?.data || res.data?.categories || res.data;
        if (Array.isArray(data)) setCatalog(data);
        else setCatalogError('Could not load the service list.');
      })
      .catch(() => setCatalogError('Could not load the service list.'));
  };
  useEffect(loadCatalog, []);

  const grouped = useMemo(() => {
    const groups = {};
    serviceCategories.forEach((sc) => {
      const key = sc.mainCategory || 'Other';
      (groups[key] = groups[key] || []).push(sc);
    });
    return groups;
  }, [serviceCategories]);

  const totalServices = serviceCategories.reduce((n, sc) => n + (sc.subServices?.length || 0), 0);

  // Expert's own categories first in the picker
  const categoryOptions = useMemo(() => {
    const own = formData.mainCategories || [];
    const names = catalog.map((c) => c.mainCategory);
    return [...own.filter((c) => names.includes(c)), ...names.filter((c) => !own.includes(c))];
  }, [catalog, formData.mainCategories]);

  const flash = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 3000);
  };

  const syncFromProfile = (technician) => {
    if (!technician) return;
    setFormData((prev) => ({
      ...prev,
      serviceCategories: technician.serviceCategories || prev.serviceCategories,
      mainCategories: technician.mainCategories?.length ? technician.mainCategories : prev.mainCategories,
    }));
  };

  // ── Modal helpers ──────────────────────────────────────
  const loadOptions = async (main, sc, keep = []) => {
    setModal((m) => ({ ...m, loading: true, options: [] }));
    try {
      const subs = readSubServices(await api.get(subServicesUrl(main, sc)));
      // Keep services the expert already has, even if no longer in the catalog
      const names = new Set(subs.map((s) => s.name));
      const extra = keep.filter((n) => !names.has(n)).map((name) => ({ name }));
      setModal((m) => ({ ...m, loading: false, options: [...subs, ...extra] }));
    } catch {
      setModal((m) => ({ ...m, loading: false, options: keep.map((name) => ({ name })) }));
    }
  };

  const openAdd = () => {
    setFormError('');
    setModal({ mode: 'add', main: '', sc: '', selected: [], options: [], loading: false });
  };

  const openEdit = (item) => {
    setFormError('');
    setModal({ mode: 'edit', main: item.mainCategory, sc: item.categoryName, selected: [...(item.subServices || [])], options: [], loading: true });
    loadOptions(item.mainCategory, item.categoryName, item.subServices || []);
  };

  const chooseMain = (main) => setModal((m) => ({ ...m, main, sc: '', selected: [], options: [] }));
  const chooseSc = (sc) => {
    setModal((m) => ({ ...m, sc, selected: [] }));
    if (sc) loadOptions(modal.main, sc);
  };

  const availableSc = useMemo(() => {
    if (!modal?.main) return [];
    const entry = catalog.find((c) => c.mainCategory === modal.main);
    return entry?.serviceCategories || [];
  }, [catalog, modal?.main]);

  const alreadyAdded = (main, sc) => serviceCategories.some((x) => x.mainCategory === main && x.categoryName === sc);

  const submit = async () => {
    const { mode, main, sc, selected } = modal;
    if (!main) return setFormError('Choose a category.');
    if (!sc) return setFormError('Choose a service category.');
    if (selected.length === 0) {
      return setFormError(mode === 'edit' ? 'Keep at least one service, or remove the whole service category.' : 'Tick at least one service you offer.');
    }
    setSaving(true);
    setFormError('');
    const res = mode === 'add'
      ? await onAddServiceCategory({ mainCategory: main, categoryName: sc, subServices: selected })
      : await updateServiceCategoryServices(main, sc, selected);
    setSaving(false);
    if (res?.success === false) return setFormError(res.error || 'Could not save. Please try again.');
    if (mode === 'add') {
      // The server also adds the category to the profile; mirror it so "Save Changes" keeps it
      setFormData((prev) => ({
        ...prev,
        mainCategories: (prev.mainCategories || []).includes(main) ? prev.mainCategories : [...(prev.mainCategories || []), main],
      }));
    } else {
      syncFromProfile(res.technician);
    }
    setModal(null);
    flash(mode === 'add' ? `${sc} added to your services.` : 'Services updated.');
  };

  const removeCategory = async (item) => {
    if (!window.confirm(`Remove “${item.categoryName}” and all its services from your profile?`)) return;
    setSaving(true);
    const res = await onRemoveServiceCategory(item.categoryName, item.mainCategory);
    setSaving(false);
    if (res?.success === false) setError(res.error || 'Could not remove it. Please try again.');
    else flash(`${item.categoryName} removed.`);
  };

  const removeOne = async (item, name) => {
    const remaining = (item.subServices || []).filter((s) => s !== name);
    if (remaining.length === 0) return removeCategory(item);
    setSaving(true);
    const res = await updateServiceCategoryServices(item.mainCategory, item.categoryName, remaining);
    setSaving(false);
    if (res?.success === false) return setError(res.error || 'Could not remove it. Please try again.');
    syncFromProfile(res.technician);
    flash(`${name} removed.`);
  };

  return (
    <div className="space-y-6">
      {error && <Banner onClose={() => setError('')}>{error}</Banner>}
      {notice && <Banner type="success">{notice}</Banner>}
      {catalogError && canEdit && (
        <Banner onClose={() => setCatalogError('')}>
          {catalogError}{' '}
          <button type="button" onClick={loadCatalog} className="underline font-medium">Try again</button>
        </Banner>
      )}

      <Section
        icon={Wrench}
        title="Services you offer"
        description={serviceCategories.length
          ? `${totalServices} service${totalServices === 1 ? '' : 's'} in ${serviceCategories.length} service categor${serviceCategories.length === 1 ? 'y' : 'ies'}. Clients find you by these.`
          : 'Clients find you by the services you list here.'}
        action={canEdit && <AddButton onClick={openAdd} disabled={busy || !catalog.length}>Add services</AddButton>}
      >
        {serviceCategories.length === 0 ? (
          <EmptyState icon={Wrench} title="No services yet"
            text={canEdit ? 'Click “Add services” and tick everything you can do — the more relevant services you list, the more searches you appear in.' : 'Click “Edit Profile”, then “Add services”.'} />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([main, items]) => (
              <div key={main}>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  <Layers className="w-4 h-4" /> {main}
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div key={`${item.mainCategory}||${item.categoryName}`} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">{item.categoryName}</h5>
                          <p className="text-xs text-gray-500">{item.subServices?.length || 0} service{item.subServices?.length === 1 ? '' : 's'}</p>
                        </div>
                        {canEdit && (
                          <RowActions disabled={busy} onEdit={() => openEdit(item)} onDelete={() => removeCategory(item)}
                            editLabel="Edit services" deleteLabel="Remove service category" />
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(item.subServices || []).map((name) => (
                          <span key={name} className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-xs px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> {name}
                            {canEdit && (
                              <button type="button" onClick={() => removeOne(item, name)} disabled={busy} aria-label={`Remove ${name}`}
                                className="ml-0.5 text-green-700/60 hover:text-red-600">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {modal && (
        <FormModal
          title={modal.mode === 'add' ? 'Add services' : `Edit ${modal.sc}`}
          onClose={() => setModal(null)}
          onSave={submit}
          saving={saving}
          saveLabel={modal.mode === 'add' ? `Add ${modal.selected.length || ''} service${modal.selected.length === 1 ? '' : 's'}` : 'Save changes'}
          error={formError}
          wide
        >
          {modal.mode === 'add' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Category" htmlFor="sv-main" required>
                <select id="sv-main" className={inputClass} value={modal.main} onChange={(e) => chooseMain(e.target.value)}>
                  <option value="">Choose a category</option>
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Service category" htmlFor="sv-sc" required>
                <select id="sv-sc" className={inputClass} value={modal.sc} onChange={(e) => chooseSc(e.target.value)} disabled={!modal.main}>
                  <option value="">{modal.main ? 'Choose a service category' : 'Choose a category first'}</option>
                  {availableSc.map((sc) => (
                    <option key={sc.name} value={sc.name} disabled={alreadyAdded(modal.main, sc.name)}>
                      {sc.name}{sc.subServiceCount ? ` (${sc.subServiceCount})` : ''}{alreadyAdded(modal.main, sc.name) ? ' — already added' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{modal.main} › <span className="font-medium text-gray-900">{modal.sc}</span></p>
          )}
          {modal.sc && (
            <Field label="Services you offer" required>
              <ServiceChecklist options={modal.options} selected={modal.selected} loading={modal.loading}
                onChange={(selected) => setModal((m) => ({ ...m, selected }))} />
            </Field>
          )}
        </FormModal>
      )}
    </div>
  );
};

export default ServicesTab;
