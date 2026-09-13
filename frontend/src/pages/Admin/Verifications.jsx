/**
 * Verifications.jsx
 * =================
 * Admin: review and manage technician verification requests.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Loader2, AlertCircle, ChevronLeft, ChevronRight, BadgeCheck,
  X, Check, Eye, FileText, Image as ImageIcon, Download, Shield,
  User as UserIcon, MapPin, FileWarning, Clock, XCircle, ExternalLink,
  Filter, MessageSquare,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PermissionGate from '../../components/admin/PermissionGate';

// ─── HELPERS ────────────────────────────────────────────────
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const timeAgo = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const statusBadge = (status) => {
  const map = {
    pending:  'bg-yellow-100 text-yellow-800',
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

const docTypeLabel = (type) => {
  const map = {
    id: 'National ID',
    certificate: 'Certificate',
    license: 'License',
    insurance: 'Insurance',
    business_registration: 'Business Registration',
  };
  return map[type] || type;
};

// ═════════════════════════════════════════════════════════════
const Verifications = () => {
  // State
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Modal state
  const [selected, setSelected] = useState(null); // technician being reviewed
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Reject / Request modal
  const [promptModal, setPromptModal] = useState({
    open: false,
    type: null, // 'reject' | 'request-more'
    value: '',
    loading: false,
  });

  // ─── FETCH LIST ──────────────────────────────────────────
  const fetchRequests = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pagination.limit);
      params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await adminApi.get(`/verifications?${params.toString()}`);
      setRequests(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load verification requests.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.get('/verifications/stats');
      setStats(res.data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchRequests(1); fetchStats(); }, [fetchRequests, fetchStats]);

  useEffect(() => {
    const t = setTimeout(() => fetchRequests(1), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ─── OPEN DETAIL MODAL ───────────────────────────────────
  const openDetail = async (techId) => {
    setSelected({ _id: techId });
    setModalLoading(true);
    setActionError('');
    try {
      const res = await adminApi.get(`/verifications/${techId}`);
      setSelected(res.data.data);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to load verification.');
    } finally {
      setModalLoading(false);
    }
  };

  const closeDetail = () => {
    if (actionLoading) return;
    setSelected(null);
    setActionError('');
  };

  // ─── ACTIONS ─────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selected) return;
    if (!window.confirm(`Verify ${selected.userId?.firstName} ${selected.userId?.lastName}?`)) return;

    setActionLoading(true);
    setActionError('');
    try {
      await adminApi.patch(`/verifications/${selected._id}/approve`);
      await fetchRequests(pagination.page);
      fetchStats();
      setSelected(null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const openPrompt = (type) => {
    setPromptModal({ open: true, type, value: '', loading: false });
  };

  const submitPrompt = async () => {
    if (!selected || !promptModal.value.trim()) return;
    setPromptModal((p) => ({ ...p, loading: true }));

    try {
      if (promptModal.type === 'reject') {
        await adminApi.patch(`/verifications/${selected._id}/reject`, {
          reason: promptModal.value.trim(),
        });
      } else if (promptModal.type === 'request-more') {
        await adminApi.patch(`/verifications/${selected._id}/request-more`, {
          message: promptModal.value.trim(),
        });
      }
      setPromptModal({ open: false, type: null, value: '', loading: false });
      await fetchRequests(pagination.page);
      fetchStats();
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
      setPromptModal((p) => ({ ...p, loading: false }));
    }
  };

  const handleDocAction = async (docId, status) => {
    if (!selected) return;

    let remarks = '';
    if (status === 'rejected') {
      remarks = window.prompt('Reason for rejecting this document:') || '';
      if (!remarks.trim()) return;
    }

    setActionLoading(true);
    try {
      await adminApi.patch(`/verifications/${selected._id}/documents/${docId}`, {
        status,
        remarks,
      });
      // Refresh the detail
      const res = await adminApi.get(`/verifications/${selected._id}`);
      setSelected(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update document.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Derived ─────────────────────────────────────────────
  const totalPending = useMemo(() => requests.length, [requests]);

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          Verifications
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review technician documents and approve verification requests.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Pending" value={stats.pending} color="yellow" />
          <StatCard label="Verified" value={stats.verified} color="green" />
          <StatCard label="Rejected" value={stats.rejected} color="red" />
          <StatCard label="Ready to review" value={stats.pendingWithDocs} color="blue" />
        </div>
      )}

      {/* Search + status tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['pending', 'verified', 'rejected', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <BadgeCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {statusFilter === 'pending'
                ? 'No pending verifications. All caught up!'
                : 'No verification requests match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Technician</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Documents</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((t) => {
                  const sum = t.verificationSummary || {};
                  return (
                    <tr key={t._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {t.userId?.profileImage ? (
                            <img src={t.userId.profileImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {t.userId?.firstName?.[0]}{t.userId?.lastName?.[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {t.userId?.firstName} {t.userId?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{t.userId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate">
                        {t.mainCategory || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {sum.hasDocuments ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-gray-700">
                              <FileText className="w-3.5 h-3.5" />
                              {sum.totalDocs}
                            </span>
                            {sum.pendingDocs > 0 && (
                              <span className="inline-flex px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                                {sum.pendingDocs} pending
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FileWarning className="w-3.5 h-3.5" /> No documents
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {t.userId?.createdAt ? timeAgo(t.userId.createdAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(t.verificationStatus)}`}>
                          {t.verificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openDetail(t._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-medium hover:bg-gray-900 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchRequests(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchRequests(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Detail Modal ═══ */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={closeDetail}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-lg font-bold text-gray-800">
                {modalLoading ? 'Loading…' : 'Review Verification'}
              </h2>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {actionError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Technician summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {selected.userId?.profileImage ? (
                      <img src={selected.userId.profileImage} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {selected.userId?.firstName?.[0]}{selected.userId?.lastName?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">
                        {selected.userId?.firstName} {selected.userId?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{selected.userId?.email}</p>
                      <p className="text-sm text-gray-600">{selected.userId?.phone || '—'}</p>

                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600">
                        {selected.mainCategory && (
                          <span className="inline-flex items-center gap-1">
                            <UserIcon className="w-3 h-3" /> {selected.mainCategory}
                          </span>
                        )}
                        {selected.address?.city && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {selected.address.city}, {selected.address.state}
                          </span>
                        )}
                        {selected.yearsOfExperience > 0 && (
                          <span>{selected.yearsOfExperience} yrs experience</span>
                        )}
                        {selected.businessName && (
                          <span>Business: {selected.businessName}</span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(selected.verificationStatus)}`}>
                      {selected.verificationStatus}
                    </span>
                  </div>

                  {selected.aboutMe && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">About</p>
                      <p className="text-sm text-gray-700">{selected.aboutMe}</p>
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Documents ({selected.verifiedDocuments?.length || 0})
                  </h3>

                  {!selected.verifiedDocuments?.length ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <FileWarning className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No documents submitted yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selected.verifiedDocuments.map((doc) => (
                        <div
                          key={doc._id}
                          className="flex flex-wrap items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 capitalize">
                              {docTypeLabel(doc.type)}
                            </p>
                            {doc.documentNumber && (
                              <p className="text-xs text-gray-500">#{doc.documentNumber}</p>
                            )}
                            {doc.remarks && (
                              <p className="text-xs text-red-500 mt-0.5">Note: {doc.remarks}</p>
                            )}
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(doc.status)}`}>
                            {doc.status}
                          </span>
                          {doc.documentUrl && (
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                          )}
                          {doc.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDocAction(doc._id, 'verified')}
                                disabled={actionLoading}
                                className="p-1.5 rounded text-green-600 hover:bg-green-50 disabled:opacity-50"
                                title="Approve document"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDocAction(doc._id, 'rejected')}
                                disabled={actionLoading}
                                className="p-1.5 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                                title="Reject document"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missing basics */}
                {selected.verificationSummary?.missingBasics?.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Missing basic profile info:</p>
                      <p className="text-yellow-700">
                        {selected.verificationSummary.missingBasics.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {!modalLoading && selected.verificationStatus !== 'verified' && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center gap-2 justify-end">
                <button
                  onClick={() => openPrompt('request-more')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-white disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" /> Request More
                </button>
                <button
                  onClick={() => openPrompt('reject')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                  Approve Verification
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ Prompt modal (reject / request-more) ═══ */}
      {promptModal.open && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {promptModal.type === 'reject' ? 'Reject Verification' : 'Request More Information'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {promptModal.type === 'reject'
                ? 'Explain why this verification is being rejected. The technician will see this message.'
                : 'Describe what additional information or documents are needed.'}
            </p>
            <textarea
              value={promptModal.value}
              onChange={(e) => setPromptModal((p) => ({ ...p, value: e.target.value }))}
              rows="4"
              maxLength={500}
              placeholder={promptModal.type === 'reject' ? 'Reason for rejection...' : 'Additional documents required...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {promptModal.value.length}/500
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setPromptModal({ open: false, type: null, value: '', loading: false })}
                disabled={promptModal.loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitPrompt}
                disabled={promptModal.loading || !promptModal.value.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                  promptModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {promptModal.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  promptModal.type === 'reject' ? 'Reject' : 'Send Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Small helpers ──────────────────────────────────────────
const StatCard = ({ label, value, color = 'gray' }) => {
  const colors = {
    gray:   'text-gray-800',
    green:  'text-green-600',
    red:    'text-red-600',
    yellow: 'text-yellow-600',
    blue:   'text-blue-600',
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${colors[color]}`}>{value}</p>
    </div>
  );
};

export default Verifications;