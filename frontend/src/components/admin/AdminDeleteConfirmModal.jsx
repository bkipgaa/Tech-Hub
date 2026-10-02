/**
 * AdminDeleteConfirmModal.jsx
 * ===========================
 * Hard-delete confirmation for an admin account.
 *
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import { fullNameOf } from '../../utils/roleHelpers';

export default function AdminDeleteConfirmModal({ admin, onClose, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await adminUserService.remove(admin._id);
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Delete admin?</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>This action cannot be undone.</span>
          </div>

          <p className="text-sm text-gray-600">
            You are about to permanently delete{' '}
            <strong className="text-gray-900">{fullNameOf(admin)}</strong>{' '}
            <span className="text-gray-400">({admin.email})</span>. They will lose access
            immediately.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}