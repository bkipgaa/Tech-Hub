/**
 * ServiceCategory Page
 * ====================
 * /services/:mainCategory
 *   The main category as the heading, with its service categories below.
 * /services/:mainCategory/:serviceCategory
 *   Pick a distance, then a service → "View Fundis" opens the search results,
 *   where the client can view a Fundi's profile or book them straight away.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Loader2,
  MapPin,
  Navigation,
  Sparkles,
  Wrench,
} from 'lucide-react';
import api from '../services/api';
import useMyLocation from '../hooks/useMyLocation';
import useServiceBuckets from '../hooks/useServiceBuckets';
import RadiusPicker from '../components/RadiusPicker';
import { categoryPath } from '../utils/servicePaths';

const RADIUS_KEY = 'webafix.searchRadius';

const readRadius = () => {
  try {
    return sessionStorage.getItem(RADIUS_KEY) || '';
  } catch {
    return '';
  }
};

const StepTitle = ({ n, children }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
      {n}
    </span>
    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{children}</h2>
  </div>
);

const ServiceCategory = () => {
  const navigate = useNavigate();
  const { mainCategory, serviceCategory } = useParams();
  const { bucketOf } = useServiceBuckets();
  const bucket = bucketOf(mainCategory);

  // ── Service categories of this main category ──
  // Results are kept with the key they were loaded for; loading = no result for the current key yet
  const [catResult, setCatResult] = useState({ key: null, list: [], error: '' });
  const catLoading = catResult.key !== mainCategory;
  const serviceCategories = catLoading ? [] : catResult.list;
  const catError = catLoading ? '' : catResult.error;

  // ── Sub-services of the chosen service category ──
  const subKey = serviceCategory ? `${mainCategory}||${serviceCategory}` : null;
  const [subResult, setSubResult] = useState({ key: null, list: [] });
  const subLoading = Boolean(subKey) && subResult.key !== subKey;
  const subServices = subLoading ? [] : subResult.list;

  // ── Distance & location ──
  const [maxDistance, setMaxDistance] = useState(readRadius);
  const { location: userLocation, status: locStatus, error: locError, locate } = useMyLocation({
    autoIfGranted: true,
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get('/service-catalog/categories-with-counts')
      .then((response) => {
        if (cancelled) return;
        const payload = response.data ?? response;
        const data = payload.data ?? payload ?? [];
        const match = (Array.isArray(data) ? data : []).find((c) => c.mainCategory === mainCategory);
        setCatResult({
          key: mainCategory,
          list: match?.serviceCategories ?? [],
          error: match ? '' : 'This category was not found.',
        });
      })
      .catch(() => {
        if (!cancelled) setCatResult({ key: mainCategory, list: [], error: 'Could not load services. Please try again.' });
      });
    return () => {
      cancelled = true;
    };
  }, [mainCategory]);

  useEffect(() => {
    if (!subKey) return;
    let cancelled = false;
    api
      .get(
        `/service-catalog/${encodeURIComponent(mainCategory)}/${encodeURIComponent(serviceCategory)}/sub-services/detailed`
      )
      .then((response) => {
        if (cancelled) return;
        const payload = response.data ?? response;
        const data = payload.data ?? payload ?? {};
        setSubResult({ key: subKey, list: data.subServices ?? [] });
      })
      .catch(() => {
        if (!cancelled) setSubResult({ key: subKey, list: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [mainCategory, serviceCategory, subKey]);

  const chooseDistance = (km) => {
    setMaxDistance(String(km));
    try {
      sessionStorage.setItem(RADIUS_KEY, String(km));
    } catch {
      // storage unavailable — keep it for this page only
    }
  };

  const canSearch = Boolean(maxDistance && userLocation);

  const viewFundis = (sub) => {
    if (!canSearch) return;
    const params = new URLSearchParams({
      mainCategory,
      serviceCategory,
      subService: sub.name,
      radius: maxDistance,
      lat: userLocation.lat,
      lng: userLocation.lng,
    });
    navigate(`/technicians/search?${params.toString()}`);
  };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* Breadcrumb / back */}
        <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500 mb-4">
          <Link to="/services" className="inline-flex items-center gap-1 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" />
            Services
          </Link>
          {bucket && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <Link to={`/services?bucket=${bucket.id}`} className="hover:text-gray-800">
                {bucket.name}
              </Link>
            </>
          )}
          {serviceCategory && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <Link to={categoryPath(mainCategory)} className="hover:text-gray-800">
                {mainCategory}
              </Link>
            </>
          )}
        </nav>

        {!serviceCategory ? (
          /* ─────────────── SERVICE CATEGORIES ─────────────── */
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{mainCategory}</h1>
            <p className="text-sm md:text-base text-gray-600 mb-6">Choose a service category.</p>

            {catLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              </div>
            ) : catError ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-sm text-gray-500 mb-3">{catError}</p>
                <Link to="/services" className="text-green-700 text-sm font-medium underline">
                  Back to all services
                </Link>
              </div>
            ) : serviceCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {serviceCategories.map((sc) => (
                  <button
                    key={sc.name}
                    onClick={() => navigate(categoryPath(mainCategory, sc.name))}
                    className="group text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-green-500 hover:shadow-md transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-snug">{sc.name}</p>
                      {sc.subServiceCount != null && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {sc.subServiceCount} service{sc.subServiceCount === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No service categories here yet.</p>
              </div>
            )}
          </>
        ) : (
          /* ─────────────── DISTANCE → SERVICE → FUNDIS ─────────────── */
          <>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">{mainCategory}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{serviceCategory}</h1>

            {/* Step 1 — distance */}
            <section className="mb-6">
              <StepTitle n={1}>How far can the Fundi come from?</StepTitle>
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="distanceInput"
                      className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                    >
                      Distance
                    </label>
                    <RadiusPicker
                      id="distanceInput"
                      value={maxDistance === '' ? '' : Number(maxDistance)}
                      onChange={chooseDistance}
                    />
                    {bucket && !bucket.technical && bucket.freeRadiusKm && (
                      <p className="text-xs text-gray-500 mt-2">
                        Fundis for {bucket.name.toLowerCase()} serve clients within {bucket.freeRadiusKm} km.
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Your location
                    </p>
                    {userLocation ? (
                      <div className="inline-flex items-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 text-sm font-medium">
                        <MapPin className="w-4 h-4" />
                        {userLocation.saved ? 'Your saved location' : 'Location active'}
                      </div>
                    ) : locStatus === 'locating' ? (
                      <div className="inline-flex items-center gap-2 px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-yellow-700 text-sm font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Detecting…
                      </div>
                    ) : (
                      <button
                        onClick={locate}
                        className={`inline-flex items-center gap-2 px-4 py-3 border-2 rounded-xl text-sm font-medium transition-colors ${
                          locStatus === 'error'
                            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Navigation className="w-4 h-4" />
                        {locStatus === 'error' ? `${locError || 'Location unavailable'} · Retry` : 'Use my location'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2 — service → View Fundis */}
            <section>
              <StepTitle n={2}>Pick a service and view Fundis</StepTitle>
              {subLoading ? (
                <div className="flex justify-center items-center py-16 bg-white rounded-xl border border-gray-200">
                  <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                  <span className="ml-2 text-gray-500 text-sm font-medium">Loading services…</span>
                </div>
              ) : subServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subServices.map((sub) => (
                    <div
                      key={sub.name}
                      className="bg-white p-5 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all flex flex-col"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm leading-tight pt-1">{sub.name}</h3>
                      </div>
                      {sub.description && (
                        <p className="text-xs text-gray-600 leading-relaxed mb-4 flex-grow">{sub.description}</p>
                      )}
                      <button
                        onClick={() => viewFundis(sub)}
                        disabled={!canSearch}
                        className={`w-full mt-auto px-4 py-2.5 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                          canSearch
                            ? 'bg-gray-800 text-white hover:bg-green-600 shadow-sm hover:shadow-md'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {!maxDistance ? (
                          'Select distance first'
                        ) : !userLocation ? (
                          'Enable location'
                        ) : (
                          <>
                            View Fundis
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No services available in this category yet.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceCategory;
