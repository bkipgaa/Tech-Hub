/**
 * Jobs.jsx (admin)
 * ================
 * Review job posts. New posts wait here and only appear in Available Jobs
 * once approved. Rejecting (or taking down a live post) needs a reason,
 * which is emailed to the poster.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Briefcase, Search, Loader2, AlertCircle, Check, X, Ban, MapPin, Mail, Tag,
  ChevronLeft, ChevronRight, ExternalLink, Zap,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PermissionGate from '../../components/admin/PermissionGate';

const TABS = [
  { id: 'pending', label: 'Waiting for review' },
  { id: 'approved', label: 'Live' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'filled', label: 'Filled' },
];

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const kes = (n, c = 'KES') => `${c} ${Number(n || 0).toLocaleString('en-KE')}`;
const roleLabel = (r) => (r === 'technician' ? 'Expert' : 'Client');

const JobCard = ({ job, tab, onDone }) => {
  const [mode, setMode] = useState(null); // 'reject' | 'takedown'
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const act = async (action, body) => {
    setBusy(true);
    setError('');
    try {
      const r = await adminApi.patch(`/jobs/${job._id}/${action}`, body);
      onDone(r.data?.message || 'Done.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  const poster = job.clientId || {};
  const cats = [job.mainCategory, job.serviceCategory, job.subService].filter((c) => c && c !== 'N/A');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {job.title}
            {job.isUrgent && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 inline-flex items-center gap-1">
                <Zap className="w-3 h-3" /> Urgent
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {job.location}{job.address ? ` · ${job.address}` : ''}
          </p>
        </div>
        <p className="text-lg font-bold text-green-700">
          {kes(job.budget, job.currency)}{job.pricingType === 'hourly' ? ' / hour' : job.pricingType === 'negotiable' ? ' (negotiable)' : ''}
        </p>
      </div>

      <p className="text-sm text-gray-600 flex flex-wrap items-center gap-2">
        <Tag className="w-4 h-4 text-gray-400" /> {cats.join(' › ')}
        {job.customCategory && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Typed by poster</span>
        )}
      </p>
      <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-6">{job.description}</p>
      {job.requirements?.length > 0 && (
        <p className="text-xs text-gray-500">Requirements: {job.requirements.join(' · ')}</p>
      )}

      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 grid sm:grid-cols-2 gap-1">
        <span>
          <strong>Posted by:</strong> {`${poster.firstName || ''} ${poster.lastName || ''}`.trim() || '—'} ({roleLabel(poster.role)})
        </span>
        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {poster.email || '—'}</span>
        <span><strong>Posted:</strong> {fmt(job.createdAt)}</span>
        {job.approvedAt && <span><strong>Approved:</strong> {fmt(job.approvedAt)}</span>}
        {tab === 'approved' && <span><strong>Open until:</strong> {fmt(job.expiresAt)} · {job.applicationCount || 0} applications</span>}
        {job.rejectionReason && <span className="sm:col-span-2 text-red-700"><strong>Reason given:</strong> {job.rejectionReason}</span>}
      </div>

      {tab === 'approved' && (
        <a href={`/jobs/${job._id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          Open public page <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      {error && <p className="text-sm text-red-700 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}

      {mode ? (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={mode === 'reject' ? 'What should the poster fix? e.g. Please add the location.' : 'Why is it being taken down?'}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => act(mode, { reason })}
              disabled={busy || !reason.trim()}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'reject' ? 'Reject and email poster' : 'Take down and email poster'}
            </button>
            <button onClick={() => setMode(null)} disabled={busy} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tab === 'pending' && (
            <>
              <PermissionGate permission="jobs.approve">
                <button
                  onClick={() => act('approve')}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                </button>
              </PermissionGate>
              <PermissionGate permission="jobs.reject">
                <button
                  onClick={() => setMode('reject')}
                  className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 inline-flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </PermissionGate>
            </>
          )}
          {tab === 'approved' && (
            <PermissionGate permission="jobs.reject">
              <button
                onClick={() => setMode('takedown')}
                className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 inline-flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" /> Take down
              </button>
            </PermissionGate>
          )}
        </div>
      )}
    </div>
  );
};

const AdminJobs = () => {
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ key: null, items: [], pagination: { page: 1, pages: 1, total: 0 }, error: '' });
  const [counts, setCounts] = useState({});
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  const key = `${tab}|${search}|${page}|${reload}`;

  const loadCounts = useCallback(() => {
    adminApi.get('/jobs/stats').then((r) => setCounts(r.data?.data || {})).catch(() => {});
  }, []);
  useEffect(() => { loadCounts(); }, [loadCounts, reload]);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get('/jobs', { params: { status: tab, q: search || undefined, page, limit: 10 } })
      .then((r) => !cancelled && setState({ key, items: r.data?.data || [], pagination: r.data?.pagination, error: '' }))
      .catch((err) => !cancelled && setState({ key, items: [], pagination: { page: 1, pages: 1, total: 0 }, error: err.response?.data?.message || 'Could not load jobs.' }));
    return () => { cancelled = true; };
  }, [key, tab, search, page]);

  const loading = state.key !== key;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-green-600" /> Job posts
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          New job posts only appear in Available Jobs after you approve them. Rejections are emailed to the poster with your reason.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              tab === t.id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.id ? 'bg-white/20' : t.id === 'pending' && counts.pending ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {counts[t.id] ?? 0}
            </span>
          </button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }} className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, category or location"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-green-500 outline-none"
          />
        </form>
      </div>

      {notice && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
          <Check className="w-4 h-4" /> {notice}
        </div>
      )}
      {state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {state.error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
      ) : state.items.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl text-sm text-gray-500">
          {tab === 'pending' ? 'No job posts waiting for review.' : 'No job posts here.'}
        </div>
      ) : (
        <div className="space-y-4">
          {state.items.map((j) => (
            <JobCard key={j._id} job={j} tab={tab} onDone={(msg) => { setNotice(`${j.title}: ${msg}`); setReload((n) => n + 1); }} />
          ))}
        </div>
      )}

      {state.pagination?.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40" aria-label="Previous page">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">Page {page} of {state.pagination.pages}</span>
          <button disabled={page >= state.pagination.pages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40" aria-label="Next page">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminJobs;
