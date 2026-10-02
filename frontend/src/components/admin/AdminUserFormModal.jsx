/**
 * AdminUserFormModal.jsx
 * ======================
 * Single modal used for both create and edit.
 * Role selection is create-only (edit uses AdminChangeRoleModal).
 *
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import { assignableRoles, ROLE_LABELS } from '../../utils/roleHelpers';

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  role: '',
  notes: '',
};

export default function AdminUserFormModal({
  mode, // 'create' | 'edit'
  admin,
  currentAdmin,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const roles = assignableRoles(currentAdmin?.role);

  useEffect(() => {
    if (isEdit && admin) {
      setForm({
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        email: admin.email || '',
        password: '',
        phone: admin.phone || '',
        role: admin.role || '',
        notes: admin.notes || '',
      });
    } else {
      setForm({ ...EMPTY, role: roles[0] || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, admin]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        const isSelf = admin._id === currentAdmin?._id;
        const payload = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        };
        if (!isSelf) payload.notes = form.notes;
        await adminUserService.update(admin._id, payload);
      } else {
        await adminUserService.create({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role: form.role,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const isSelf = isEdit && admin?._id === currentAdmin?._id;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Admin' : 'Create New Admin'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                First Name
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                required
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                required
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
              />
            </div>
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  required
                  minLength={8}
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-lg bg-white focus:border-green-500 outline-none"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r] || r}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  You can only assign roles below your own level.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
            />
          </div>

          {isEdit && !isSelf && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Internal notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows="2"
                maxLength={500}
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
                placeholder="Not visible to the admin themselves."
              />
            </div>
          )}

          {isEdit && (
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
              To change this admin's role, use <strong>Change role</strong> from the
              actions menu.
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
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}