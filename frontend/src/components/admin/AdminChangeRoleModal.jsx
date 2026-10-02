/**
 * AdminChangeRoleModal.jsx
 * ========================
 * Change an admin's role. Super-admin-only by the parent table.
 *
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { X, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import {
  assignableRoles,
  ROLE_LABELS,
  fullNameOf,
  canManageRole,
} from '../../utils/roleHelpers';

export default function AdminChangeRoleModal({
  admin,
  currentAdmin,
  onClose,
  onSaved,
}) {
  const [role, setRole] = useState(admin.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const assignable = assignableRoles(currentAdmin?.role);
  const options = assignable.includes(admin.role)
    ? assignable
    : [...assignable, admin.role];

  const submit = async (e) => {
    e.preventDefault();
    if (role === admin.role) return onClose();
    setError('');
    setSaving(true);
    try {
      await adminUserService.changeRole(admin._id, role);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change role');
    } finally {
      setSaving(false);
    }
  };

  const canAssignTarget = canManageRole(currentAdmin?.role, role);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Change Role</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            Changing role for{' '}
            <strong className="text-gray-900">{fullNameOf(admin)}</strong>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              New Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:border-green-500 outline-none"
            >
              {options.map((r) => (
                <option
                  key={r}
                  value={r}
                  disabled={!canManageRole(currentAdmin?.role, r)}
                >
                  {ROLE_LABELS[r] || r}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Current role:{' '}
              <strong>{ROLE_LABELS[admin.role] || admin.role}</strong>
            </p>
          </div>

          {!canAssignTarget && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg">
              ⚠️ You cannot assign this role — it is at or above your level.
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
              type="submit"
              disabled={saving || !canAssignTarget || role === admin.role}
              className="flex-1 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Change role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}