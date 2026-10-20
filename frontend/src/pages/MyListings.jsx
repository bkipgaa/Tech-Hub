/**
 * MyListings.jsx
 * ==============
 * The signed-in user's Stays & Spaces listings: views, pause/resume, edit, delete.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Loader2, AlertCircle, Eye, Pencil, Trash2, Pause, Play, ImageOff, Home as HomeIcon } from 'lucide-react';
import api from '../services/api';
import { cldImage } from '../utils/media';
import { categoryById, formatPrice, placeLabel } from '../utils/listingCategories';
import ListingPlanCard from '../components/stays/ListingPlanCard';

const STATUS = {
  active: { label: 'Live', className: 'bg-green-100 text-green-700' },
  paused: { label: 'Paused', className: 'bg-gray-100 text-gray-600' },
  hidden: { label: 'Hidden by Webafix', className: 'bg-red-100 text-red-700' },
  lapsed: { label: 'Hidden: plan ended', className: 'bg-red-100 text-red-700' },
};

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [plan, setPlan] = useState(null);
  const planLapsed = plan?.phase === 'lapsed';

  const load = () => {
    setLoading(true);
    api
      .get('/listings/mine')
      .then((r) => setListings(r.data?.data || []))
      .catch(() => setError('Could not load your listings.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

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

        <ListingPlanCard onPlanChange={setPlan} />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-6 bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <HomeIcon className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="mt-3 font-semibold text-gray-700">You haven't listed anything yet</p>
            <p className="text-sm text-gray-500 mt-1">
              List an Airbnb, guest house, rental, office, shop, club or bar. Your first 6 months are free.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {listings.map((l) => {
              const status = l.status === 'active' && planLapsed ? STATUS.lapsed : STATUS[l.status] || STATUS.active;
              const busy = busyId === l._id;
              return (
                <div key={l._id} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row gap-4">
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${status.className}`}>{status.label}</span>
                      <span className="text-xs text-gray-500">{categoryById(l.category)?.name}</span>
                    </div>
                    <Link to={`/stays/${l._id}`} className="block font-semibold text-gray-800 hover:text-green-700 mt-1 truncate">
                      {l.title}
                    </Link>
                    <p className="text-sm text-gray-500 truncate">{placeLabel(l)}</p>
                    <p className="text-sm font-semibold text-green-700 mt-1">{formatPrice(l.price, l.priceUnit)}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {l.views || 0} views
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 sm:justify-center">
                    <Link
                      to={`/stays/${l._id}/edit`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </Link>
                    {l.status !== 'hidden' && (
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
        )}
      </div>
    </div>
  );
};

export default MyListings;
