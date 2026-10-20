/**
 * MyListings.jsx
 * ==============
 * The signed-in user's Stays & Spaces listings: review status, what each one
 * costs and until when it's live, paying for selected listings, and
 * pause/resume, edit, delete.
 *
 * Pricing: the first 5 listings are free for 3 months from the first listing;
 * otherwise each listing is KES 200 a month. Only approved listings can be paid for.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Loader2, AlertCircle, Eye, Pencil, Trash2, Pause, Play, ImageOff, Home as HomeIcon,
  Gift, CheckCircle, Clock, XCircle, CreditCard,
} from 'lucide-react';
import api from '../services/api';
import { cldImage } from '../utils/media';
import {
  categoryById, formatPrice, placeLabel, LISTING_FREE_MONTHS, LISTING_FREE_COUNT, LISTING_PRICE,
} from '../utils/listingCategories';
import PayListingsPanel from '../components/stays/PayListingsPanel';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** One badge and one line of detail per listing, from review status and billing */
const describe = (l) => {
  const b = l.billing || {};
  if (l.status === 'pending') return { badge: 'Waiting for approval', tone: 'amber', icon: Clock, detail: `Submitted ${fmtDate(l.review?.submittedAt)}. We'll email you.` };
  if (l.status === 'rejected') return { badge: 'Changes needed', tone: 'red', icon: XCircle, detail: l.review?.rejectionReason || 'Edit the listing to resubmit it.' };
  if (l.status === 'hidden') return { badge: 'Hidden by Webafix', tone: 'red', icon: XCircle, detail: l.review?.rejectionReason || 'Contact support.' };
  if (b.needsPayment) return { badge: 'Not showing: unpaid', tone: 'red', icon: CreditCard, detail: `KES ${LISTING_PRICE} a month to show it in search.` };
  const until = `${b.coveredBy === 'free' ? 'Free' : 'Paid'} until ${fmtDate(b.activeUntil)}`;
  if (l.status === 'paused') return { badge: 'Paused', tone: 'gray', icon: Pause, detail: until };
  return { badge: b.expiringSoon ? `Live · ${b.daysLeft} day${b.daysLeft === 1 ? '' : 's'} left` : 'Live', tone: b.expiringSoon ? 'amber' : 'green', icon: CheckCircle, detail: until };
};

const TONES = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
};

const MyListings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [busyId, setBusyId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [paying, setPaying] = useState(false);
  const verified = useRef(false);

  const load = () =>
    Promise.all([api.get('/listings/mine'), api.get('/listings/plan')])
      .then(([mine, p]) => {
        setListings(mine.data?.data || []);
        setPlan(p.data?.data || null);
      })
      .catch(() => setError('Could not load your listings.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    if (location.state?.notice) navigate(location.pathname + location.search, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Back from Paystack: ?reference=... (or ?trxref=...)
  useEffect(() => {
    const reference = params.get('reference') || params.get('trxref');
    if (!reference || verified.current) return;
    verified.current = true;
    api
      .get('/listings/plan/verify', { params: { reference } })
      .then((r) => (r.data?.success ? setNotice(r.data.message) : setError(r.data?.message || 'Payment was not successful.')))
      .catch((err) => setError(err.response?.data?.message || 'Could not confirm the payment.'))
      .finally(() => {
        load();
        const next = new URLSearchParams(params);
        next.delete('reference');
        next.delete('trxref');
        setParams(next, { replace: true });
      });
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const payable = listings.filter((l) => l.billing?.canPay);
  const due = payable.filter((l) => l.billing?.needsPayment || l.billing?.expiringSoon);
  const selectedListings = listings.filter((l) => selected.has(l._id));

  const openPay = (ids) => {
    setSelected(new Set(ids));
    setPaying(true);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setStatus = async (listing, status) => {
    setBusyId(listing._id);
    setError('');
    try {
      const r = await api.patch(`/listings/${listing._id}/status`, { status });
      setListings((ls) => ls.map((l) => (l._id === listing._id ? r.data.data : l)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the listing.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (listing) => {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return;
    setBusyId(listing._id);
    setError('');
    try {
      await api.delete(`/listings/${listing._id}`);
      setListings((ls) => ls.filter((l) => l._id !== listing._id));
      setSelected((s) => { const next = new Set(s); next.delete(listing._id); return next; });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the listing.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My listings</h1>
            <p className="text-sm text-gray-500">Your places on Stays &amp; Spaces</p>
          </div>
          <Link
            to="/stays/new"
            className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> New listing
          </Link>
        </div>

        {/* ─── Plan summary ───────────────────────────── */}
        {plan && (
          <div className={`mt-6 border rounded-xl p-5 ${plan.freeActive || !plan.started ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Gift className={`w-8 h-8 flex-shrink-0 ${plan.freeActive || !plan.started ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="flex-1">
                {!plan.started ? (
                  <>
                    <p className="font-semibold text-gray-800">Your first {LISTING_FREE_MONTHS} months are free</p>
                    <p className="text-sm text-gray-600">
                      Up to {LISTING_FREE_COUNT} listings, starting with your first one. After that it's KES {LISTING_PRICE} per listing a month.
                    </p>
                  </>
                ) : plan.freeActive ? (
                  <>
                    <p className="font-semibold text-gray-800">
                      Free until {fmtDate(plan.freeUntil)} · {plan.freeUsed} of {plan.freeListings} free listings used
                    </p>
                    <p className="text-sm text-gray-600">
                      {plan.freeDaysLeft} day{plan.freeDaysLeft === 1 ? '' : 's'} left. Extra listings, and every listing after that,
                      are KES {plan.pricePerListing} a month each.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800">KES {plan.pricePerListing} per listing a month</p>
                    <p className="text-sm text-gray-600">
                      Your free months ended on {fmtDate(plan.freeUntil)}. Pay only for the listings you want to keep live.
                    </p>
                  </>
                )}
              </div>
              {due.length > 0 && !paying && (
                <button
                  onClick={() => openPay(due.map((l) => l._id))}
                  className="px-5 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700"
                >
                  Pay for {due.length} due · KES {(due.length * LISTING_PRICE).toLocaleString()}
                </button>
              )}
            </div>
          </div>
        )}

        {notice && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {notice}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {paying && selectedListings.length > 0 && (
          <div className="mt-4">
            <PayListingsPanel
              listings={selectedListings}
              onClose={() => setPaying(false)}
              onPaid={(text) => {
                setPaying(false);
                setSelected(new Set());
                setNotice(text);
                load();
              }}
            />
          </div>
        )}

        {/* ─── Listings ───────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-6 bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <HomeIcon className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="mt-3 font-semibold text-gray-700">You haven't listed anything yet</p>
            <p className="text-sm text-gray-500 mt-1">
              List an Airbnb, guest house, rental, office, shop, club or bar. Your first {LISTING_FREE_COUNT} listings are free
              for {LISTING_FREE_MONTHS} months.
            </p>
          </div>
        ) : (
          <>
            {payable.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="text-gray-600">Tick listings to pay for them together.</p>
                {selected.size > 0 && !paying && (
                  <button
                    onClick={() => openPay([...selected])}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                  >
                    Pay for {selected.size} selected
                  </button>
                )}
              </div>
            )}
            <div className="mt-3 space-y-3">
              {listings.map((l) => {
                const d = describe(l);
                const busy = busyId === l._id;
                const canEdit = !['active', 'paused'].includes(l.status) ? l.status !== 'hidden' : l.billing?.covered;
                return (
                  <div key={l._id} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row gap-4">
                    {l.billing?.canPay && (
                      <label className="flex sm:items-center gap-2 text-sm text-gray-600 sm:pl-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.has(l._id)}
                          onChange={() => toggle(l._id)}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500"
                          aria-label={`Select ${l.title} to pay`}
                        />
                        <span className="sm:hidden">Select to pay</span>
                      </label>
                    )}
                    <Link to={`/stays/${l._id}`} className="sm:w-40 aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {l.photos?.[0]?.url ? (
                        <img src={cldImage(l.photos[0].url, 320)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ImageOff className="w-8 h-8" />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${TONES[d.tone]}`}>
                          <d.icon className="w-3.5 h-3.5" /> {d.badge}
                        </span>
                        {l.freeSlot && l.status !== 'rejected' && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-green-700">Free listing</span>
                        )}
                        <span className="text-xs text-gray-500">{categoryById(l.category)?.name}</span>
                      </div>
                      <Link to={`/stays/${l._id}`} className="block font-semibold text-gray-800 hover:text-green-700 mt-1 truncate">
                        {l.title}
                      </Link>
                      <p className="text-sm text-gray-500 truncate">{placeLabel(l)}</p>
                      <p className="text-sm font-semibold text-green-700 mt-1">{formatPrice(l.price, l.priceUnit)}</p>
                      <p className={`text-xs mt-1 ${d.tone === 'red' ? 'text-red-700' : 'text-gray-500'}`}>{d.detail}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {l.views || 0} views
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-2 sm:justify-center">
                      {l.billing?.canPay && (
                        <button
                          onClick={() => openPay([l._id])}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                            l.billing.needsPayment ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-green-600 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" /> {l.billing.needsPayment ? 'Pay' : 'Renew'}
                        </button>
                      )}
                      {canEdit ? (
                        <Link
                          to={`/stays/${l._id}/edit`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </Link>
                      ) : (
                        <span
                          title={l.status === 'hidden' ? 'Hidden by Webafix' : 'Pay for this listing to edit it'}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 text-sm text-gray-300 cursor-not-allowed"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </span>
                      )}
                      {['active', 'paused'].includes(l.status) && (
                        <button
                          disabled={busy}
                          onClick={() => setStatus(l, l.status === 'active' ? 'paused' : 'active')}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {l.status === 'active' ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => remove(l)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyListings;
