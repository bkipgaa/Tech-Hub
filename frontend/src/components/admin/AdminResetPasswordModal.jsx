/**
 * AdminResetPasswordModal.jsx
 * ===========================
 * Change password (self) or reset password (other admins).
 *
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, KeyRound } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import { fullNameOf } from '../../utils/roleHelpers';

export default function AdminResetPasswordModal({
  target,
  currentAdmin,
  onClose,
  onSaved,
}) {
  const isSelf = target._id === currentAdmin?._id;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      return setError('New password must be at least 8 characters');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setSaving(true);
    try {
      await adminUserService.resetPassword(target._id, {
        newPassword,
        ...(isSelf ? { currentPassword } : {}),
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {isSelf ? 'Change Your Password' : 'Reset Password'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            {isSelf ? (
              <>Updating your own password</>
            ) : (
              <>
                Updating password for{' '}
                <strong className="text-gray-900">{fullNameOf(target)}</strong>{' '}
                <span className="text-gray-400">({target.email})</span>
              </>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSelf && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:border-green-500 outline-none"
            />
          </div>

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
              Update password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}