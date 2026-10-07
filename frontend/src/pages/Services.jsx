/**
 * Services Page Component
 * ========================
 * Progressive-disclosure service catalog:
 *   1. Pick a main category   (compact horizontal chips)
 *   2. Pick a service category (compact horizontal chips)
 *   3. Set your search radius  (with location)
 *   4. Browse sub-services & book a technician
 *
 * @version 4.1.0 – Compact chips (no icon, ~7 per row)
 * @author Webalink Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  ChevronDown,
  Clock,
  DollarSign,
  MapPin,
  Loader2,
  AlertCircle,
  Navigation,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';

const Services = () => {
  const navigate = useNavigate();

  // ── Catalog ───────────────────────────────────────────
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Progressive selection ─────────────────────────────
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState(null);

  // ── Sub-services cache (per main||service pair) ───────
  const [subServicesData, setSubServicesData] = useState({});
  const [subServicesLoading, setSubServicesLoading] = useState({});

  // ── Location & distance ───────────────────────────────
  const [maxDistance, setMaxDistance] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationMessage, setLocationMessage] = useState('');

  // ═══════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    fetchServiceCatalog();
    requestUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════
  // FETCHING
  // ═══════════════════════════════════════════════════════
  const fetchServiceCatalog = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/service-catalog/categories-with-counts');
      const payload = response.data ?? response;
      const data = payload.data ?? payload ?? [];
      setCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load services:', err);
      let msg = 'Could not load services. ';
      if (err.response) msg += `Server error (${err.response.status}). `;
      else if (err.request) msg += 'No response from server. Check your internet connection. ';
      else msg += 'An unexpected error occurred. ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubServices = async (mainCat, serviceCat) => {
    const key = `${mainCat}||${serviceCat}`;
    if (subServicesData[key]) return;

    setSubServicesLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await api.get(
        `/service-catalog/${encodeURIComponent(mainCat)}/${encodeURIComponent(serviceCat)}/sub-services/detailed`
      );
      const payload = response.data ?? response;
      const data = payload.data ?? payload ?? { subServices: [] };
      setSubServicesData((prev) => ({ ...prev, [key]: data }));
    } catch (err) {
      console.error('Failed to load sub-services:', err);
      setSubServicesData((prev) => ({ ...prev, [key]: { subServices: [] } }));
    } finally {
      setSubServicesLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ═══════════════════════════════════════════════════════
  // LOCATION
  // ═══════════════════════════════════════════════════════
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationMessage('Geolocation not supported');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('success');
      },
      (err) => {
        let msg = 'Location unavailable';
        if (err.code === 1) msg = 'Location denied';
        else if (err.code === 2) msg = 'Location unavailable';
        else if (err.code === 3) msg = 'Location timed out';
        setLocationStatus('error');
        setLocationMessage(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // ═══════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleMainCategoryClick = (category) => {
    if (selectedMainCategory?.mainCategory === category.mainCategory) {
      setSelectedMainCategory(null);
      setSelectedServiceCategory(null);
      return;
    }
    setSelectedMainCategory(category);
    setSelectedServiceCategory(null);
  };

  const handleServiceCategoryClick = async (serviceCat) => {
    if (selectedServiceCategory?.name === serviceCat.name) {
      setSelectedServiceCategory(null);
      return;
    }
    setSelectedServiceCategory(serviceCat);

    const key = `${selectedMainCategory.mainCategory}||${serviceCat.name}`;
    if (!subServicesData[key]) {
      await fetchSubServices(selectedMainCategory.mainCategory, serviceCat.name);
    }
  };

  const handleViewTechnicians = (subService) => {
    if (!maxDistance) {
      alert('Please select a maximum distance first.');
      return;
    }
    if (!userLocation) {
      alert('Please allow location access to find nearby technicians.');
      requestUserLocation();
      return;
    }

    const params = new URLSearchParams({
      mainCategory: selectedMainCategory.mainCategory,
      serviceCategory: selectedServiceCategory.name,
      subService: subService.name,
      radius: maxDistance,
      lat: userLocation.lat,
      lng: userLocation.lng,
    });

    navigate(`/technicians/search?${params.toString()}`);
  };

  const handleRetry = () => {
    fetchServiceCatalog();
  };

  // ═══════════════════════════════════════════════════════
  // DERIVED
  // ═══════════════════════════════════════════════════════
  const canSearch = Boolean(maxDistance && userLocation);
  const subServicesKey =
    selectedMainCategory && selectedServiceCategory
      ? `${selectedMainCategory.mainCategory}||${selectedServiceCategory.name}`
      : null;
  const subServices = subServicesKey
    ? subServicesData[subServicesKey]?.subServices ?? []
    : [];
  const subServicesIsLoading = subServicesKey
    ? subServicesLoading[subServicesKey]
    : false;

  // ═══════════════════════════════════════════════════════
  // RENDER: LOADING
  // ═══════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading services…</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: ERROR
  // ═══════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <p className="font-semibold mb-1">Unable to load services</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: EMPTY CATALOG
  // ═══════════════════════════════════════════════════════
  if (catalog.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl">
            <Wrench className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
            <p className="font-semibold mb-1">No services available</p>
            <p className="text-sm mb-4">Please check back later.</p>
            <button
              onClick={handleRetry}
              className="bg-yellow-600 text-white px-5 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: MAIN
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">

        {/* ─── Header ─────────────────────────────────── */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Browse Services
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Pick a category → choose a service → set your distance → book a technician.
          </p>
        </div>

        {/* ═══════════════════════════════════════════════
            STEP 1 — MAIN CATEGORIES (compact chips)
            ═══════════════════════════════════════════════ */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              1
            </span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Choose a main category
            </h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {catalog.map((cat) => {
              const isActive =
                selectedMainCategory?.mainCategory === cat.mainCategory;

              return (
                <button
                  key={cat.mainCategory}
                  onClick={() => handleMainCategoryClick(cat)}
                  aria-pressed={isActive}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    isActive
                      ? 'bg-green-600 text-white border-green-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-500 hover:shadow-sm'
                  }`}
                >
                  <span>{cat.mainCategory}</span>
                  <span
                    className={`text-[9px] font-bold px-1 py-0.5 rounded-full leading-none transition-colors ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-700'
                    }`}
                  >
                    {cat.serviceCategories?.length ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            STEP 2 — SERVICE CATEGORIES
            ═══════════════════════════════════════════════ */}
        {selectedMainCategory && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Choose a service category
                <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                  in {selectedMainCategory.mainCategory}
                </span>
              </h2>
            </div>

            {selectedMainCategory.serviceCategories?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedMainCategory.serviceCategories.map((sc) => {
                  const isActive = selectedServiceCategory?.name === sc.name;

                  return (
                    <button
                      key={sc.name}
                      onClick={() => handleServiceCategoryClick(sc)}
                      aria-pressed={isActive}
                      className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                        isActive
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-500 hover:shadow-sm'
                      }`}
                    >
                      <span>{sc.name}</span>
                      {sc.subServiceCount != null && (
                        <span
                          className={`text-[9px] font-bold px-1 py-0.5 rounded-full leading-none transition-colors ${
                            isActive
                              ? 'bg-white/25 text-white'
                              : 'bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-700'
                          }`}
                        >
                          {sc.subServiceCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No service categories in this main category.
              </p>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 3 — DISTANCE & LOCATION
            ═══════════════════════════════════════════════ */}
        {selectedServiceCategory && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Set your search distance
              </h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                {/* Distance selector */}
                <div className="flex-1">
                  <label
                    htmlFor="distanceSelect"
                    className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
                  >
                    Search Radius
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      id="distanceSelect"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-gray-800 font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Select distance…</option>
                      <option value="5">Within 5 km</option>
                      <option value="10">Within 10 km</option>
                      <option value="20">Within 20 km</option>
                      <option value="50">Within 50 km</option>
                      <option value="100">Within 100 km</option>
                      <option value="200">Within 200 km</option>
                      <option value="500">Within 500 km</option>
                      <option value="1000">Within 1000 km</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Location status */}
                <div className="md:w-auto">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Your Location
                  </label>

                  {locationStatus === 'loading' && (
                    <div className="inline-flex items-center gap-2 px-4 py-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-yellow-700 text-sm font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Detecting…
                    </div>
                  )}

                  {locationStatus === 'error' && (
                    <button
                      onClick={requestUserLocation}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      {locationMessage} · Retry
                    </button>
                  )}

                  {locationStatus === 'success' && (
                    <div className="inline-flex items-center gap-2 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      Location active
                    </div>
                  )}

                  {locationStatus === 'idle' && (
                    <button
                      onClick={requestUserLocation}
                      className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      Enable location
                    </button>
                  )}
                </div>
              </div>

              {/* Help text */}
              <p className="text-xs text-gray-500 mt-3">
                {!maxDistance &&
                  locationStatus === 'success' &&
                  '👉 Pick a distance to unlock the "View Technicians" buttons'}
                {maxDistance &&
                  locationStatus !== 'success' &&
                  '👉 Enable location so we can find technicians near you'}
                {maxDistance &&
                  locationStatus === 'success' &&
                  '✅ Ready! Pick a service below to see technicians'}
              </p>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 4 — SUB-SERVICES
            ═══════════════════════════════════════════════ */}
        {selectedServiceCategory && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                4
              </span>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Pick a service
                <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                  {selectedMainCategory.mainCategory} › {selectedServiceCategory.name}
                </span>
              </h2>
            </div>

            {subServicesIsLoading ? (
              <div className="flex justify-center items-center py-16 bg-white rounded-xl border border-gray-200">
                <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                <span className="ml-2 text-gray-500 text-sm font-medium">
                  Loading services…
                </span>
              </div>
            ) : subServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subServices.map((sub, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all flex flex-col"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm leading-tight pt-1">
                        {sub.name}
                      </h3>
                    </div>

                    {sub.description && (
  <p className="text-xs text-gray-600 leading-relaxed mb-4 flex-grow">
    {sub.description}
  </p>
)}

                    {/* CTA */}
                    <button
                      onClick={() => handleViewTechnicians(sub)}
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
                          View Technicians
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
                <p className="text-sm text-gray-500">
                  No sub-services available for this category.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── Idle hint ─────────────────────────────── */}
        {!selectedMainCategory && (
          <div className="mt-8 text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Click a category above to get started</p>
            <p className="text-xs text-gray-400 mt-1">
              {catalog.length} categor{catalog.length !== 1 ? 'ies' : 'y'} available
            </p>
          </div>
        )}
      </div>

      {/* ── Footer CTA (kept) ─────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            Need a specific service not listed?
          </h3>
          <p className="text-gray-600 text-sm mb-5">
            Contact us and we'll connect you with the right professional.
          </p>
          <button className="bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors inline-flex items-center gap-2">
            Contact Us
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Services;