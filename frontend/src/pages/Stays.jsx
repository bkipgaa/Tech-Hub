/**
 * Stays.jsx
 * =========
 * Stays & Spaces: browse Airbnbs, guest houses, hotels, houses for rent,
 * hostels, offices and shops. Filters live in the URL so results can be
 * shared and survive a refresh.
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, Loader2, AlertCircle, Home as HomeIcon, Wrench, SlidersHorizontal, LocateFixed, X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import useMyLocation from '../hooks/useMyLocation';
import ListingCard from '../components/stays/ListingCard';
import NearYou from '../components/stays/NearYou';
import {
  LISTING_GROUPS, COUNTIES, DISTANCE_BANDS, categoryById, groupById, bandById,
} from '../utils/listingCategories';

const FILTER_KEYS = ['group', 'category', 'county', 'q', 'minPrice', 'maxPrice', 'bedrooms', 'sort', 'page'];

const Stays = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  // "Near me" mode lives in the URL (near=1&band=1-10); the coordinates never do
  const nearOn = params.get('near') === '1';
  const band = bandById(params.get('band'));
  const { location, status: locStatus, error: locError, locate } = useMyLocation();
  const [counts, setCounts] = useState({});
  // Last finished search, keyed by the query string it was for
  const [result, setResult] = useState({ key: null, listings: [], pagination: { page: 1, pages: 1, total: 0 }, error: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(params.get('q') || '');

  const category = params.get('category') || '';
  const group = params.get('group') || '';
  const activeGroup = category ? categoryById(category)?.groupId : group;
  const priceUnit = categoryById(category)?.priceUnit || groupById(group)?.priceUnit;

  // Category counts for the chips
  useEffect(() => {
    api
      .get('/listings/meta')
      .then((r) => {
        const map = {};
        (r.data?.data?.groups || []).forEach((g) => g.categories.forEach((c) => { map[c.id] = c.count; }));
        setCounts(map);
      })
      .catch(() => setCounts({}));
  }, []);

  // Opening a near-me link (e.g. from "See all nearby") asks for location once
  useEffect(() => {
    if (nearOn && !location && locStatus === 'idle') locate();
  }, [nearOn, location, locStatus, locate]);

  const waitingForLocation = nearOn && !location;

  // Results
  const searchKey = params.toString() + (nearOn && location ? `@${location.lat},${location.lng}` : '');
  useEffect(() => {
    if (waitingForLocation) return;
    const filters = {};
    FILTER_KEYS.forEach((k) => {
      const v = params.get(k);
      if (v) filters[k] = v;
    });
    if (nearOn && location) {
      filters.lat = location.lat;
      filters.lng = location.lng;
      if (band.minKm) filters.minKm = band.minKm;
      if (band.maxKm) filters.maxKm = band.maxKm;
    }
    let cancelled = false;
    api
      .get('/listings', { params: { ...filters, limit: 12 } })
      .then((r) => !cancelled && setResult({
        key: searchKey,
        listings: r.data?.data || [],
        pagination: r.data?.pagination || { page: 1, pages: 1, total: 0 },
        error: '',
      }))
      .catch(() => !cancelled && setResult((prev) => ({
        ...prev,
        key: searchKey,
        listings: [],
        error: 'Could not load listings. Please try again.',
      })));
    return () => { cancelled = true; };
  }, [params, searchKey, waitingForLocation, nearOn, location, band.minKm, band.maxKm]);

  const loading = !waitingForLocation && result.key !== searchKey;
  const { listings, pagination, error } = result;

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, v);
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const pickGroup = (id) => update({ group: id === activeGroup && !category ? '' : id, category: '' });
  const pickCategory = (id) => update({ category: id === category ? '' : id, group: '' });

  const turnNearOn = async () => {
    // Sorting by price isn't the point of near me; start nearest-first
    update({ near: '1', sort: '' });
    // First try is made by the effect above; this retries after a failure
    if (!location && locStatus === 'error') await locate();
  };
  const turnNearOff = () => update({ near: '', band: '', sort: '' });

  const submitSearch = (e) => {
    e.preventDefault();
    update({ q: query.trim() });
  };

  const groupCount = (g) => g.categories.reduce((sum, c) => sum + (counts[c.id] || 0), 0);
  const visibleGroups = activeGroup ? LISTING_GROUPS.filter((g) => g.id === activeGroup) : LISTING_GROUPS;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-green-700 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Stays &amp; Spaces</h1>
              <p className="text-green-50 mt-2 max-w-xl">
                Airbnbs, guest houses, hotels, homes for rent and office space across Kenya.
                Contact hosts and landlords directly. No booking fees.
              </p>
            </div>
            <Link
              to={user ? '/stays/new' : '/login'}
              state={user ? undefined : { from: { pathname: '/stays/new' } }}
              className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-green-50 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> List your property
            </Link>
          </div>

          <form onSubmit={submitSearch} className="mt-6 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search an area or estate, e.g. Kilimani, Nyali, Westlands"
                className="w-full pl-10 pr-3 py-3 rounded-lg text-gray-800 outline-none focus:ring-2 focus:ring-green-300"
              />
            </div>
            <select
              value={params.get('county') || ''}
              onChange={(e) => update({ county: e.target.value })}
              className="px-3 py-3 rounded-lg text-gray-800 outline-none sm:w-48"
              aria-label="County"
            >
              <option value="">All counties</option>
              {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800">
              Search
            </button>
          </form>

          {/* ─── Near me ──────────────────────────────────── */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {nearOn ? (
              <>
                <span className="inline-flex items-center gap-1.5 bg-white text-green-700 text-sm font-semibold pl-3 pr-1 py-1 rounded-full">
                  <LocateFixed className="w-4 h-4" /> Near me
                  <button
                    onClick={turnNearOff}
                    aria-label="Turn off near me"
                    className="ml-1 w-6 h-6 rounded-full hover:bg-green-50 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
                {DISTANCE_BANDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => update({ band: b.id === 'any' ? '' : b.id })}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      band.id === b.id
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white/10 text-white border-white/40 hover:bg-white/20'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </>
            ) : (
              <button
                onClick={turnNearOn}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/40 text-white text-sm font-semibold px-4 py-2 rounded-full"
              >
                <LocateFixed className="w-4 h-4" /> Near me
              </button>
            )}
          </div>
          {nearOn && locStatus === 'error' && (
            <p className="mt-2 text-sm text-white bg-red-600/80 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {locError}
              <button onClick={locate} className="underline font-semibold">Try again</button>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!nearOn && <NearYou className="mb-8" />}

        {/* ─── Groups & categories ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LISTING_GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => pickGroup(g.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeGroup === g.id
                  ? 'bg-green-50 border-green-500 ring-1 ring-green-500'
                  : 'bg-white border-gray-200 hover:border-green-400'
              }`}
            >
              <p className="font-semibold text-gray-800">{g.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{g.blurb} · priced per {g.priceUnit}</p>
              <p className="text-xs text-green-700 font-medium mt-2">{groupCount(g)} listed</p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {visibleGroups.flatMap((g) => g.categories).map((c) => (
            <button
              key={c.id}
              onClick={() => pickCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                category === c.id
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {c.name}
              <span className={category === c.id ? 'text-green-100' : 'text-gray-400'}> · {counts[c.id] || 0}</span>
            </button>
          ))}
        </div>

        {/* ─── Filters ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
          <p className="text-sm text-gray-600">
            {waitingForLocation
              ? 'Finding your location…'
              : loading
              ? 'Loading…'
              : `${pagination.total} place${pagination.total === 1 ? '' : 's'} found${
                  nearOn
                    ? ` · ${band.id === '0-1' ? 'within 1 km of you' : band.maxKm ? `${band.label} from you` : 'near you'} · nearest first`
                    : ''
                }`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <select
              value={params.get('sort') || ''}
              onChange={(e) => update({ sort: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700"
              aria-label="Sort"
            >
              <option value="">{nearOn ? 'Nearest first' : 'Newest first'}</option>
              <option value="price_asc">Lowest price</option>
              <option value="price_desc">Highest price</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div
            key={params.toString()}
            className="mt-3 bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <label className="text-sm text-gray-600">
              Min price{priceUnit ? ` / ${priceUnit}` : ''}
              <input
                type="number"
                min="0"
                defaultValue={params.get('minPrice') || ''}
                onBlur={(e) => update({ minPrice: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="KES"
              />
            </label>
            <label className="text-sm text-gray-600">
              Max price{priceUnit ? ` / ${priceUnit}` : ''}
              <input
                type="number"
                min="0"
                defaultValue={params.get('maxPrice') || ''}
                onBlur={(e) => update({ maxPrice: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="KES"
              />
            </label>
            <label className="text-sm text-gray-600">
              Bedrooms
              <select
                value={params.get('bedrooms') || ''}
                onChange={(e) => update({ bedrooms: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
              >
                <option value="">Any</option>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setQuery('');
                  setParams(new URLSearchParams());
                }}
                className="w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* ─── Results ──────────────────────────────────── */}
        {error ? (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : loading || waitingForLocation ? (
          <div className="flex justify-center py-16">
            {nearOn && locStatus === 'error' ? (
              <p className="text-sm text-gray-500">Allow location to see places near you, or turn off Near me.</p>
            ) : (
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            )}
          </div>
        ) : listings.length === 0 && nearOn ? (
          <div className="mt-6 bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <LocateFixed className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="mt-3 font-semibold text-gray-700">
              Nothing listed {band.maxKm ? band.label.toLowerCase() : 'near you'} yet
            </p>
            <p className="text-sm text-gray-500 mt-1">Try a wider distance or another category.</p>
            {band.id !== 'any' && (
              <button
                onClick={() => update({ band: '' })}
                className="inline-flex items-center gap-2 mt-4 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Show any distance
              </button>
            )}
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-6 bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <HomeIcon className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="mt-3 font-semibold text-gray-700">No places here yet</p>
            <p className="text-sm text-gray-500 mt-1">Try another area or category, or be the first to list one.</p>
            <Link
              to={user ? '/stays/new' : '/login'}
              state={user ? undefined : { from: { pathname: '/stays/new' } }}
              className="inline-flex items-center gap-2 mt-4 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> List your property
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
              {listings.map((l) => <ListingCard key={l._id} listing={l} />)}
            </div>
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => update({ page: pagination.page - 1 })}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => update({ page: pagination.page + 1 })}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── Property services ────────────────────────── */}
        <div className="mt-12 bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Landlords and hosts: need help with your property?</p>
            <p className="text-sm text-gray-500">
              Find property managers, agents, cleaners, plumbers and electricians, all rated by clients.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-green-600 text-green-700 font-semibold hover:bg-green-50"
          >
            Find an expert
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Stays;
