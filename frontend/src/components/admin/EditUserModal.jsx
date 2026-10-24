/**
 * EditUserModal.jsx
 * =================
 * Admin form for a user's account details: name, email, phone, town/county
 * and account status. Experts also get a link to edit their expert profile.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Save, X, Wrench } from 'lucide-react';
import { adminUserServiceFull } from '../../services/adminRevenueService';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';

const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-gray-700">
    {label}
    {children}
  </label>
);

const EditUserModal = ({ userId, onSaved, onClose }) => {
  const [form, setForm] = useState(null);
  const [technicianId, setTechnicianId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminUserServiceFull
      .get(userId)
      .then((r) => {
        const { user, technicianProfile } = r.data.data;
        setForm({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          status: user.status || 'active',
        });
        setTechnicianId(technicianProfile?._id || null);
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load this user.'));
  }, [userId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return setError('First and last name are required.');
    if (!form.email.trim() || !form.phone.trim()) return setError('Email and phone are required.');
    setSaving(true);
    setError('');
    try {
      await adminUserServiceFull.update(userId, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: { city: form.city, state: form.state },
        status: form.status,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the user.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Edit user</h2>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{loadError}</div>}
        {!form && !loadError && <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto my-8" />}

        {form && (
          <>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name"><input className={inputClass} value={form.firstName} onChange={set('firstName')} /></Field>
              <Field label="Last name"><input className={inputClass} value={form.lastName} onChange={set('lastName')} /></Field>
            </div>
            <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={set('email')} /></Field>
            <Field label="Phone"><input className={inputClass} value={form.phone} onChange={set('phone')} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Town"><input className={inputClass} value={form.city} onChange={set('city')} /></Field>
              <Field label="County"><input className={inputClass} value={form.state} onChange={set('state')} /></Field>
            </div>
            <Field label="Account status">
              <select className={inputClass} value={form.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </Field>

            {technicianId && (
              <Link
                to={`/admin/technicians/${technicianId}?edit=1`}
                className="flex items-center gap-2 text-sm text-green-700 font-medium hover:underline"
              >
                <Wrench className="w-4 h-4" /> Edit their expert profile (headline, about, services…)
              </Link>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save changes
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default EditUserModal;
