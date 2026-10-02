/**
 * AdminUserTable.jsx
 * ==================
 * Table of admin users with an inline actions dropdown.
 * Every action button is gated by rank via `canManageRole`.
 *
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  MoreVertical,
  Pencil,
  KeyRound,
  Power,
  Trash2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import {
  ROLE_BADGE,
  ROLE_LABELS,
  canManageRole,
  fullNameOf,
} from '../../utils/roleHelpers';

export default function AdminUserTable({
  admins,
  loading,
  currentAdmin,
  onEdit,
  onChangeRole,
  onToggleStatus,
  onResetPassword,
  onDelete,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  if (loading) {
    return (
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (!admins.length) {
    return (
      <div className="mt-6 bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No admin accounts match your filters.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Admin</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Last Login</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {admins.map((admin) => {
              const isSelf = admin._id === currentAdmin?._id;
              const canManage =
                !isSelf && canManageRole(currentAdmin?.role, admin.role);
              const isSuper = currentAdmin?.role === 'super_admin';

              return (
                <tr key={admin._id} className="hover:bg-gray-50/60">
                  {/* Admin cell */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        {admin.firstName?.[0]}
                        {admin.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {fullNameOf(admin)}
                          {isSelf && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ROLE_BADGE[admin.role] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ROLE_LABELS[admin.role] || admin.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        admin.isActive ? 'text-green-700' : 'text-gray-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          admin.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      {admin.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>

                  {/* Last login */}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {admin.lastLogin
                      ? new Date(admin.lastLogin).toLocaleString()
                      : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === admin._id ? null : admin._id)
                      }
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      aria-label="Actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuId === admin._id && (
                      <>
                        {/* Backdrop to close on outside click */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />

                        <div className="absolute right-4 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 text-left">
                          {/* Edit profile */}
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              onEdit(admin);
                            }}
                            disabled={!isSelf && !canManage}
                            className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit profile
                          </button>

                          {/* Reset password */}
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              onResetPassword(admin);
                            }}
                            disabled={!isSelf && !canManage}
                            className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {isSelf ? 'Change my password' : 'Reset password'}
                          </button>

                          {/* Change role — super_admin only, and not self */}
                          {!isSelf && isSuper && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                onChangeRole(admin);
                              }}
                              className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Change role
                            </button>
                          )}

                          {/* Enable / disable */}
                          {!isSelf && canManage && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                onToggleStatus(admin);
                              }}
                              className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
                            >
                              <Power className="w-3.5 h-3.5" />
                              {admin.isActive ? 'Disable account' : 'Enable account'}
                            </button>
                          )}

                          <div className="my-1 border-t border-gray-100" />

                          {/* Delete — super_admin only, not self */}
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              onDelete(admin);
                            }}
                            disabled={isSelf || !isSuper}
                            className="w-full px-3 py-2 text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete admin
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}