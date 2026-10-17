/**
 * ui.jsx
 * ======
 * Small shared building blocks for the expert dashboard tabs (Profile,
 * Services, Credentials), so they look and behave the same.
 *
 * Every button here is type="button": the dashboard wraps the tabs in a
 * <form>, and a plain <button> would submit it.
 */

import React from 'react';
import { AlertCircle, CheckCircle, Pencil, Trash2, X, Plus } from 'lucide-react';

export const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-50 disabled:text-gray-400';

// ─── Layout ──────────────────────────────────────────────────────────────────
export const Section = ({ icon: Icon, title, description, action, children }) => (
  <section className="bg-white rounded-xl border border-gray-200">
    <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <span className="w-9 h-9 rounded-lg bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

export const Field = ({ label, htmlFor, required, hint, counter, children }) => (
  <div>
    {label && (
      <div className="flex items-baseline justify-between mb-1">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {counter && <span className="text-xs text-gray-400">{counter}</span>}
      </div>
    )}
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
    {Icon && <Icon className="w-9 h-9 mx-auto text-gray-300" />}
    <p className="mt-2 font-medium text-gray-700">{title}</p>
    {text && <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── Buttons ─────────────────────────────────────────────────────────────────
export const AddButton = ({ onClick, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
  >
    <Plus className="w-4 h-4" /> {children}
  </button>
);

export const RowActions = ({ onEdit, onDelete, disabled, editLabel = 'Edit', deleteLabel = 'Delete' }) => (
  <div className="flex items-center gap-1 flex-shrink-0">
    {onEdit && (
      <button type="button" onClick={onEdit} disabled={disabled} title={editLabel} aria-label={editLabel}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40">
        <Pencil className="w-4 h-4" />
      </button>
    )}
    {onDelete && (
      <button type="button" onClick={onDelete} disabled={disabled} title={deleteLabel} aria-label={deleteLabel}
        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40">
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </div>
);

// ─── Messages ────────────────────────────────────────────────────────────────
export const Banner = ({ type = 'error', children, onClose }) => {
  const styles = type === 'error'
    ? 'bg-red-50 border-red-200 text-red-700'
    : 'bg-green-50 border-green-200 text-green-700';
  const Icon = type === 'error' ? AlertCircle : CheckCircle;
  return (
    <div className={`p-3 border rounded-lg text-sm flex items-start gap-2 ${styles}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// ─── Modal with a form body ──────────────────────────────────────────────────
// onKeyDown: Enter in a text box must not submit the dashboard's <form>.
export const FormModal = ({ title, onClose, onSave, saving, saveLabel = 'Save', children, wide = false, error }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !saving && onClose()}>
    <div
      className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.key === 'Enter' && e.target.tagName === 'INPUT' && e.preventDefault()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} disabled={saving} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto">
        {children}
        {error && <Banner>{error}</Banner>}
      </div>
      <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
        <button type="button" onClick={onClose} disabled={saving}
          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Saving…' : saveLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── Dates ───────────────────────────────────────────────────────────────────
export const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? '' : d.toISOString().slice(0, 10);
};

export const formatMonthYear = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? '' : d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
};

export const formatRange = (start, end, isCurrent) => {
  const from = formatMonthYear(start);
  const to = isCurrent ? 'Present' : formatMonthYear(end);
  if (from && to) return `${from} – ${to}`;
  return from || to || '';
};

/**
 * Save a list optimistically; roll back and return false if the server refuses.
 * saveFn returns { success, error } (the AuthContext section updaters).
 */
export const saveList = async ({ field, next, formData, setFormData, saveFn, onError }) => {
  const previous = formData[field];
  setFormData((prev) => ({ ...prev, [field]: next }));
  const res = await saveFn(next);
  if (res?.success === false) {
    setFormData((prev) => ({ ...prev, [field]: previous }));
    onError?.(res.error || 'Could not save. Please try again.');
    return false;
  }
  return true;
};
