/**
 * Listings.jsx (admin)
 * ====================
 * Review Stays & Spaces listings. New listings wait here until approved;
 * approved ones can be hidden again. Rejections need a reason, which is
 * emailed to the lister so they know what to fix.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2, Search, Loader2, AlertCircle, Check, X, EyeOff, Eye, MapPin, Phone, Mail, ImageOff,
  ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react';
import adminApi from '../../services/adminApi';
import PermissionGate from '../../components/admin/PermissionGate';
import { cldImage } from '../../utils/media';
import { categoryById, formatPrice, placeLabel, amenityLabel, propertyTypeLabel } from '../../utils/listingCategories';

const TABS = [
  { id: 'pending', label: 'Waiting for review' },
  { id: 'active', label: 'Live' },
  { id: 'paused', label: 'Paused' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'hidden', label: 'Hidden' },
];

const fmt = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const ListingCard = ({ listing, tab, onDone }) => {
  const [photo, setPhoto] = useState(0);
  const [mode, setMode] = useState(null); // 'reject' | 'hide'
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const act = async (action, body) => {
    setBusy(true);
    setError('');
    try {
      const r = await adminApi.patch(`/listings/${listing._id}/${action}`, body);
      onDone(r.data?.message || 'Done.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  const photos = listing.photos || [];
  const owner = listing.owner || {};
  const facts = [
    categoryById(listing.category)?.name,
    listing.propertyType && propertyTypeLabel(listing.propertyType),
    listing.bedrooms && `${listing.bedrooms} bedrooms`,
    listing.maxGuests && `Up to ${listing.maxGuests} guests`,
    listing.sizeSqft && `${listing.sizeSqft} sq ft`,
    listing.openingHours,
  ].filter(Boolean);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
        {/* Photos */}
        <div className="bg-gray-100">
          <div className="aspect-[4/3]">
            {photos[photo] ? (
              <img src={cldImage(photos[photo].url, 640)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <ImageOff className="w-8 h-8 mb-1" /> No photos
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-1 p-2 overflow-x-auto">
              {photos.map((p, i) => (
                <button
                  key={p.url}
                  onClick={() => setPhoto(i)}
                  className={`w-14 h-10 flex-shrink-0 rounded overflow-hidden border-2 ${i === photo ? 'border-green-600' : 'border-transparent opacity-70'}`}
                >
                  <img src={cldImage(p.url, 120)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {placeLabel(listing)}
                {listing.landmark ? ` · ${listing.landmark}` : ''}
              </p>
            </div>
            <p className="text-lg font-bold text-green-700">{formatPrice(listing.price, listing.priceUnit)}</p>
          </div>

          <p className="text-xs text-gray-500">{facts.join(' · ')}</p>
          {listing.description && <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-6">{listing.description}</p>}
          {listing.amenities?.length > 0 && (
            <p className="text-xs text-gray-500">Offers: {listing.amenities.map(amenityLabel).join(', ')}</p>
          )}

          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 grid sm:grid-cols-2 gap-1">
            <span><strong>Lister:</strong> {`${owner.firstName || ''} ${owner.lastName || ''}`.trim() || '—'}</span>
            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {owner.email || '—'}</span>
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {listing.contactPhone || owner.phone || '—'}</span>
            <span><strong>Submitted:</strong> {fmt(listing.review?.submittedAt || listing.createdAt)}</span>
            {listing.review?.reviewedAt && <span><strong>Reviewed:</strong> {fmt(listing.review.reviewedAt)}</span>}
            {listing.review?.rejectionReason && (
              <span className="sm:col-span-2 text-red-700"><strong>Reason given:</strong> {listing.review.rejectionReason}</span>
            )}
            <span>{listing.freeSlot ? 'Free listing (free months)' : 'Paid listing (KES 200 a month)'}</span>
          </div>

          {['active', 'paused', 'hidden'].includes(tab) && (
            <a
              href={`/stays/${listing._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Open public page <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {error && <p className="text-sm text-red-700 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</p>}

          <PermissionGate permission="listings.review">
            {mode ? (
              <div className="space-y-2">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={mode === 'reject'
                    ? 'What should the lister fix? e.g. Photos are blurry, or the price is missing.'
                    : 'Why is it being hidden? (optional)'}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => act(mode, { reason })}
                    disabled={busy || (mode === 'reject' && !reason.trim())}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {mode === 'reject' ? 'Reject and email lister' : 'Hide listing'}
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
                    <button
                      onClick={() => act('approve')}
                      disabled={busy}
                      className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                    </button>
                    <button
                      onClick={() => setMode('reject')}
                      disabled={busy}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 inline-flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                {['active', 'paused'].includes(tab) && (
                  <button
                    onClick={() => setMode('hide')}
                    className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 inline-flex items-center gap-1.5"
                  >
                    <EyeOff className="w-4 h-4" /> Hide from search
                  </button>
                )}
                {tab === 'hidden' && (
                  <button
                    onClick={() => act('unhide')}
                    disabled={busy}
                    className="px-4 py-2 rounded-lg border border-green-600 text-green-700 text-sm font-semibold hover:bg-green-50 inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> Restore
                  </button>
                )}
              </div>
            )}
          </PermissionGate>
        </div>
      </div>
    </div>
  );
};

const AdminListings = () => {
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
    adminApi.get('/listings/stats').then((r) => setCounts(r.data?.data || {})).catch(() => {});
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts, reload]);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get('/listings', { params: { status: tab, q: search || undefined, page, limit: 10 } })
      .then((r) => !cancelled && setState({ key, items: r.data?.data || [], pagination: r.data?.pagination, error: '' }))
      .catch((err) => !cancelled && setState({ key, items: [], pagination: { page: 1, pages: 1, total: 0 }, error: err.response?.data?.message || 'Could not load listings.' }));
    return () => { cancelled = true; };
  }, [key, tab, search, page]);

  const loading = state.key !== key;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-green-600" /> Stays &amp; Spaces listings
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          New listings only appear in search after you approve them. Rejecting emails the lister your reason.
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
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); setPage(1); }}
          className="relative ml-auto w-full sm:w-72"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, town or estate"
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
          {tab === 'pending' ? 'Nothing waiting for review. 🎉' : 'No listings here.'}
        </div>
      ) : (
        <div className="space-y-4">
          {state.items.map((l) => (
            <ListingCard
              key={l._id}
              listing={l}
              tab={tab}
              onDone={(msg) => { setNotice(`${l.title}: ${msg}`); setReload((n) => n + 1); }}
            />
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

export default AdminListings;
