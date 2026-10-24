/**
 * ServicePicker.jsx
 * =================
 * Pick the categories an expert works in: a main category, then its service
 * categories and the services under each. The first main category is
 * required; more can be added with "Add another category".
 *
 * value: [{ mainCategory, serviceCategories: [{ categoryName, subServices: [] }] }]
 * catalog: { [mainCategory]: [{ name, subServices: [names] }] } (GET /service-catalog/complete)
 */

import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { EMPTY_GROUP } from '../utils/serviceGroups';

const ServicePicker = ({ catalog, value, onChange }) => {
  const groups = value.length ? value : [{ ...EMPTY_GROUP }];
  const mainCategories = Object.keys(catalog || {}).sort();

  const setGroup = (i, group) => onChange(groups.map((g, j) => (j === i ? group : g)));
  const removeGroup = (i) => onChange(groups.filter((_, j) => j !== i));
  const addGroup = () => onChange([...groups, { ...EMPTY_GROUP }]);
  const canAdd = groups.every((g) => g.mainCategory) && groups.length < mainCategories.length;

  return (
    <div className="space-y-4">
      {groups.map((group, i) => (
        <GroupEditor
          key={i}
          index={i}
          group={group}
          catalog={catalog}
          mainCategories={mainCategories.filter(
            (m) => m === group.mainCategory || !groups.some((g) => g.mainCategory === m)
          )}
          onChange={(g) => setGroup(i, g)}
          onRemove={i > 0 ? () => removeGroup(i) : null}
        />
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={addGroup}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-green-300 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-50"
        >
          <Plus className="w-4 h-4" /> Add another category
        </button>
      )}
    </div>
  );
};

const GroupEditor = ({ index, group, catalog, mainCategories, onChange, onRemove }) => {
  const [open, setOpen] = useState(null); // service category whose services are showing
  const catalogEntries = catalog?.[group.mainCategory] || [];
  // Keep picked service categories that are no longer in the catalog visible
  const entries = [
    ...catalogEntries,
    ...group.serviceCategories
      .filter((sc) => !catalogEntries.some((c) => c.name === sc.categoryName))
      .map((sc) => ({ name: sc.categoryName, subServices: sc.subServices })),
  ];

  const picked = (name) => group.serviceCategories.find((sc) => sc.categoryName === name);

  const toggleCategory = (entry) => {
    if (picked(entry.name)) {
      onChange({ ...group, serviceCategories: group.serviceCategories.filter((sc) => sc.categoryName !== entry.name) });
      if (open === entry.name) setOpen(null);
    } else {
      onChange({ ...group, serviceCategories: [...group.serviceCategories, { categoryName: entry.name, subServices: [] }] });
      setOpen(entry.name);
    }
  };

  const setSubServices = (name, subServices) =>
    onChange({
      ...group,
      serviceCategories: group.serviceCategories.map((sc) => (sc.categoryName === name ? { ...sc, subServices } : sc)),
    });

  const toggleSub = (name, sub) => {
    const current = picked(name)?.subServices || [];
    setSubServices(name, current.includes(sub) ? current.filter((s) => s !== sub) : [...current, sub]);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-sm font-semibold text-gray-700">
          {index === 0 ? <>Main category <span className="text-red-500">*</span></> : 'Another category'}
        </label>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-600 p-1" aria-label="Remove category">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <select
        value={group.mainCategory}
        onChange={(e) => onChange({ mainCategory: e.target.value, serviceCategories: [] })}
        className="w-full p-2.5 border-2 border-green-300 rounded-lg focus:border-green-600 focus:outline-none bg-white"
      >
        <option value="">Select a category…</option>
        {mainCategories.map((m) => <option key={m} value={m}>{m}</option>)}
        {group.mainCategory && !mainCategories.includes(group.mainCategory) && (
          <option value={group.mainCategory}>{group.mainCategory}</option>
        )}
      </select>

      {group.mainCategory && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Service categories <span className="normal-case font-normal">(pick one or more)</span>
          </p>
          <div className="space-y-2">
            {entries.map((entry) => {
              const sel = picked(entry.name);
              const isOpen = open === entry.name && sel;
              return (
                <div key={entry.name} className={`rounded-lg border ${sel ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleCategory(entry)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-sm"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${sel ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                        {sel && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="font-medium text-gray-800">{entry.name}</span>
                      {sel && (
                        <span className={`ml-auto text-xs ${sel.subServices.length ? 'text-green-700' : 'text-red-600'}`}>
                          {sel.subServices.length ? `${sel.subServices.length} selected` : 'pick services'}
                        </span>
                      )}
                    </button>
                    {sel && (
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : entry.name)}
                        className="px-3 py-2 text-gray-500 hover:text-gray-800"
                        aria-label={isOpen ? 'Hide services' : 'Show services'}
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <div className="px-3 pb-3 border-t border-green-200">
                      <div className="flex justify-end py-1.5">
                        <button
                          type="button"
                          onClick={() => setSubServices(entry.name, sel.subServices.length === entry.subServices.length ? [] : [...entry.subServices])}
                          className="text-xs text-green-700 font-semibold hover:underline"
                        >
                          {sel.subServices.length === entry.subServices.length ? 'Clear all' : 'Select all'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {entry.subServices.map((sub) => (
                          <label key={sub} className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sel.subServices.includes(sub)}
                              onChange={() => toggleSub(entry.name, sub)}
                              className="mt-0.5 accent-green-600"
                            />
                            <span>{sub}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePicker;
