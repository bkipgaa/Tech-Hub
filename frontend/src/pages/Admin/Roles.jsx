/**
 * Roles.jsx
 * =========
 * Admin page for managing roles and permissions.
 * 
 * Features:
 * - List all roles (system roles are marked and can't be deleted)
 * - Create new roles with custom permission sets
 * - Edit existing roles (name, label, description, permissions)
 * - Delete custom roles (system roles are protected)
 * - Permission picker grouped by section, with search and bulk toggle
 * 
 * Backend endpoints used:
 *   GET    /api/admin/roles                → list all roles
 *   GET    /api/admin/roles/permissions    → list all permissions
 *   POST   /api/admin/roles                → create role
 *   PATCH  /api/admin/roles/:id            → update role
 *   DELETE /api/admin/roles/:id            → delete role
 * 
 * @version 1.0.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Lock,
  Users as UsersIcon,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import { useAdminAuth } from '../../context/AdminAuthContext';

// ═════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════

/**
 * Group permissions by their `section` field.
 * Returns an object: { 'Technicians': [...perms], 'Bookings': [...] }
 */
const groupPermissions = (permissions) => {
  return permissions.reduce((acc, perm) => {
    const section = perm.section || 'Other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(perm);
    return acc;
  }, {});
};

/**
 * Detect if a role name follows the kebab/snake pattern.
 */
const isValidRoleName = (name) => /^[a-z][a-z0-9_]*$/.test(name);

// ═════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════

/**
 * Modal shell used for create/edit forms.
 */
const Modal = ({ title, onClose, children, size = 'lg' }) => {
  const maxWidth = size === 'sm' ? 'max-w-md' : size === 'md' ? 'max-w-xl' : 'max-w-3xl';
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/**
 * Confirm-delete modal.
 */
const ConfirmModal = ({ title, message, onConfirm, onCancel, loading }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </button>
      </div>
    </div>
  </div>
);

/**
 * Permission picker – grouped by section, with search and bulk toggles.
 */
const PermissionPicker = ({ permissions, selected, onChange }) => {
  const [search, setSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});

  const grouped = useMemo(() => groupPermissions(permissions), [permissions]);

  const filteredGrouped = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const result = {};
    Object.entries(grouped).forEach(([section, perms]) => {
      const matched = perms.filter(
        (p) =>
          p.key.toLowerCase().includes(q) ||
          p.label.toLowerCase().includes(q) ||
          section.toLowerCase().includes(q)
      );
      if (matched.length > 0) result[section] = matched;
    });
    return result;
  }, [grouped, search]);

  const toggle = (key) => {
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    onChange(next);
  };

  const toggleSection = (section, perms) => {
    const keys = perms.map((p) => p.key);
    const allSelected = keys.every((k) => selected.includes(k));
    if (allSelected) {
      onChange(selected.filter((k) => !keys.includes(k)));
    } else {
      const union = new Set([...selected, ...keys]);
      onChange(Array.from(union));
    }
  };

  const toggleCollapse = (section) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = Object.keys(filteredGrouped);
  const totalVisible = sections.reduce((sum, s) => sum + filteredGrouped[s].length, 0);

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search permissions..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>
          {selected.length} of {permissions.length} permissions selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(permissions.map((p) => p.key))}
            className="text-green-600 hover:underline"
          >
            Select all
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-red-600 hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <p className="text-center py-6 text-sm text-gray-400">
          No permissions match your search.
        </p>
      ) : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {sections.map((section) => {
            const perms = filteredGrouped[section];
            const isCollapsed = collapsedSections[section];
            const allSelected = perms.every((p) => selected.includes(p.key));
            const someSelected = perms.some((p) => selected.includes(p.key)) && !allSelected;

            return (
              <div key={section} className="bg-white">
                {/* Section header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(section)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="checkbox"
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    checked={allSelected}
                    onChange={() => toggleSection(section, perms)}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 flex-1">
                    {section}
                  </span>
                  <span className="text-xs text-gray-400">
                    {perms.filter((p) => selected.includes(p.key)).length}/{perms.length}
                  </span>
                </div>

                {/* Items */}
                {!isCollapsed && (
                  <div className="p-2 space-y-0.5">
                    {perms.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(perm.key)}
                          onChange={() => toggle(perm.key)}
                          className="mt-0.5 rounded text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{perm.label}</p>
                          <p className="text-xs text-gray-400 font-mono truncate">
                            {perm.key}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════

const Roles = () => {
  const { hasPermission } = useAdminAuth();

  // ─── DATA ────────────────────────────────────────────────
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── UI STATE ────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [editingRole, setEditingRole] = useState(null); // null = closed, {} = creating
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ─── FORM STATE ──────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    label: '',
    description: '',
    permissions: [],
  });

  // ─── FETCH ───────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [rolesRes, permsRes] = await Promise.all([
        adminApi.get('/roles'),
        adminApi.get('/roles/permissions'),
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissions(permsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch roles data:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load roles. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── OPEN MODALS ─────────────────────────────────────────
  const openCreate = () => {
    setFormError('');
    setForm({
      name: '',
      label: '',
      description: '',
      permissions: [],
    });
    setEditingRole({});
  };

  const openEdit = (role) => {
    setFormError('');
    setForm({
      name: role.name,
      label: role.label,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setEditingRole(role);
  };

  const closeModal = () => {
    if (saving) return;
    setEditingRole(null);
    setFormError('');
  };

  // ─── SAVE (create / update) ──────────────────────────────
  const handleSave = async () => {
    setFormError('');

    // Client-side validation
    if (!form.name.trim()) {
      setFormError('Role name is required.');
      return;
    }
    if (!isValidRoleName(form.name.trim())) {
      setFormError(
        'Role name must be lowercase letters, numbers, or underscores (e.g., "team_lead").'
      );
      return;
    }
    if (!form.label.trim()) {
      setFormError('Role label is required.');
      return;
    }
    if (form.permissions.length === 0) {
      setFormError('Select at least one permission for this role.');
      return;
    }

    setSaving(true);
    try {
      const isCreating = !editingRole._id;
      const payload = {
        name: form.name.trim().toLowerCase(),
        label: form.label.trim(),
        description: form.description.trim(),
        permissions: form.permissions,
      };

      if (isCreating) {
        await adminApi.post('/roles', payload);
      } else {
        // Don't allow changing the name of system roles
        if (editingRole.isSystem) {
          delete payload.name;
        }
        await adminApi.patch(`/roles/${editingRole._id}`, payload);
      }

      await fetchData();
      setEditingRole(null);
    } catch (err) {
      console.error('Save role failed:', err);
      setFormError(
        err.response?.data?.message ||
          'Failed to save role. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── DELETE ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      await adminApi.delete(`/roles/${deletingRole._id}`);
      await fetchData();
      setDeletingRole(null);
    } catch (err) {
      console.error('Delete role failed:', err);
      setError(
        err.response?.data?.message ||
          'Failed to delete role. Please try again.'
      );
      setDeletingRole(null);
    } finally {
      setDeleting(false);
    }
  };

  // ─── FILTER ROLE LIST ────────────────────────────────────
  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
    );
  }, [roles, search]);

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage roles and the permissions assigned to each.
          </p>
        </div>
        {hasPermission('roles.create') && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </button>
        )}
      </div>

      {/* ─── Error banner ───────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Search ─────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles by name or label..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
        />
      </div>

      {/* ─── Roles Table ────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Permissions</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRoles.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                  {search
                    ? 'No roles match your search.'
                    : 'No roles found.'}
                </td>
              </tr>
            ) : (
              filteredRoles.map((role) => (
                <tr key={role._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {role.isSystem ? (
                          <Lock className="w-4 h-4 text-gray-500" />
                        ) : (
                          <UsersIcon className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {role.label}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {role.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <p className="truncate">
                      {role.description || (
                        <span className="text-gray-400 italic">
                          No description
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {role.permissions?.length || 0} permissions
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {role.isSystem ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        System
                      </span>
                    ) : (
                      <span className="text-xs text-green-600 font-medium">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {hasPermission('roles.edit') && (
                        <button
                          onClick={() => openEdit(role)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit role"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('roles.delete') && !role.isSystem && (
                        <button
                          onClick={() => setDeletingRole(role)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Create / Edit Modal ────────────────────────── */}
      {editingRole !== null && (
        <Modal
          title={editingRole._id ? `Edit "${editingRole.label}"` : 'Create New Role'}
          onClose={closeModal}
        >
          <div className="p-5 space-y-5">
            {/* Form error */}
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Role identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. team_lead"
                  disabled={editingRole.isSystem}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none font-mono disabled:bg-gray-100 disabled:text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {editingRole.isSystem
                    ? 'System role names cannot be changed.'
                    : 'Lowercase letters, numbers, and underscores only.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Team Lead"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is this role for?"
                rows="2"
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
              />
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions <span className="text-red-500">*</span>
              </label>
              <PermissionPicker
                permissions={permissions}
                selected={form.permissions}
                onChange={(next) => setForm({ ...form, permissions: next })}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {editingRole._id ? 'Save Changes' : 'Create Role'}
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Delete Modal ───────────────────────────────── */}
      {deletingRole && (
        <ConfirmModal
          title="Delete this role?"
          message={`Deleting "${deletingRole.label}" cannot be undone. Any admins currently using it must be reassigned.`}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setDeletingRole(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default Roles;