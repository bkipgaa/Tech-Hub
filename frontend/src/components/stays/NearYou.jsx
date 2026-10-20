/**
 * NearYou.jsx
 * ===========
 * "Near you" strip: the closest short stays, rentals, business spaces and
 * experts to the visitor, nearest first, with a link to see all.
 * Asks for location only when the visitor taps the button (or uses it
 * straight away if they already allowed it).
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LocateFixed, Loader2, Navigation, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import useMyLocation from '../../hooks/useMyLocation';
import ListingCard from './ListingCard';
import { ExpertCard } from '../ServicesHighlights';

const NEARBY_KM = 50;

const TABS = [
  { id: 'short_stays', label: 'Stays', hint: 'Airbnbs, guest houses & hotels' },
  { id: 'rentals', label: 'Rentals', hint: 'Homes, hostels & rooms' },
  { id: 'business', label: 'Business spaces', hint: 'Offices & shops' },
  { id: 'experts', label: 'Experts', hint: 'Fundis & professionals' },
];

const NearYou = ({ className = '' }) => {
  const navigate = useNavigate();
  const { location, status, error, locate } = useMyLocation({ autoIfGranted: true });
  const [tab, setTab] = useState('short_stays');
  const [result, setResult] = useState({ key: null, items: [] });

  const key = location ? `${tab}@${location.lat},${location.lng}` : null;

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    const request =
      tab === 'experts'
        ? api.get('/search/nearby', { params: { lat: location.lat, lng: location.lng, radius: NEARBY_KM, limit: 4 } })
        : api.get('/listings', { params: { lat: location.lat, lng: location.lng, maxKm: NEARBY_KM, group: tab, limit: 4 } });
    request
      .then((r) => !cancelled && setResult({ key, items: r.data?.data || [] }))
      .catch(() => !cancelled && setResult({ key, items: [] }));
    return () => { cancelled = true; };
  }, [tab, location, key]);

  const loading = location && result.key !== key;
  const seeAll = tab === 'experts' ? '/services' : `/stays?near=1&group=${tab}`;

  return (
    <section className={className}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-green-600" /> Near you
          </h2>
          <p className="text-sm text-gray-500">The closest places and experts, nearest first</p>
        </div>
        {location && (
          <Link to={seeAll} className="text-sm font-semibold text-green-700 hover:text-green-800 inline-flex items-center gap-1">
            See all nearby <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {!location ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <LocateFixed className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">See Airbnbs, rentals, offices and experts around you</p>
            <p className="text-sm text-gray-500">
              We use your location only to sort results by distance. It isn't saved or shared.
            </p>
            {status === 'error' && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
          </div>
          <button
            onClick={locate}
            disabled={status === 'locating'}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-60"
          >
            {status === 'locating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            {status === 'locating' ? 'Finding you…' : 'Show what’s near me'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  tab === t.id
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'
                }`}
                title={t.hint}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-green-600" />
            </div>
          ) : result.items.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
              {tab === 'experts' ? `No experts within ${NEARBY_KM} km yet.` : `Nothing listed within ${NEARBY_KM} km yet.`}{' '}
              {tab === 'experts' ? (
                <Link to="/services" className="text-green-700 font-medium hover:underline">
                  Browse all services
                </Link>
              ) : (
                <Link to={`/stays?near=1&group=${tab}`} className="text-green-700 font-medium hover:underline">
                  Search further away
                </Link>
              )}
            </div>
          ) : tab === 'experts' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {result.items.map((tech) => (
                <ExpertCard key={tech._id} tech={tech} onClick={() => navigate(`/technician/${tech._id}`)} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {result.items.map((l) => <ListingCard key={l._id} listing={l} />)}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default NearYou;
