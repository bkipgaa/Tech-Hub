/**
 * Services Page Component
 * ========================
 * Displays the service catalog in a three-level hierarchy:
 * mainCategory → serviceCategory → subService.
 *
 * Features:
 * - Gradient + photographic hero (engineering tools backdrop)
 * - Brand name in green & red
 * - Distance & location controls with clear feedback
 * - Expandable service categories with lazy-loaded sub-services
 * - Responsive grid layout
 *
 * @version 3.1.0 – Rebranded hero (WeBA-Hub Service)
 * @author Weba-Hub Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
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

/**
 * Hero background image — engineering / hand tools.
 * Swap this URL for a local asset (e.g. `/images/tools-hero.jpg`)
 * if you'd rather not depend on an external CDN.
 */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=2000&q=80';

const Services = () => {
  const navigate = useNavigate();

  // --- State for catalog data ---
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // --- State for UI expansion & sub-service data ---
  const [expandedCategories, setExpandedCategories] = useState({});
  const [subServicesData, setSubServicesData] = useState({});
  const [subServicesLoading, setSubServicesLoading] = useState({});

  // --- Distance & location ---
  const [maxDistance, setMaxDistance] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationMessage, setLocationMessage] = useState('');

  // ============================================================
  // SIDE EFFECTS
  // ============================================================

  useEffect(() => {
    fetchServiceCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    requestUserLocation();
  }, []);

  // ============================================================
  // DATA FETCHING
  // ============================================================

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
      let errorMsg = 'Could not load services. ';
      if (err.response) {
        errorMsg += `Server error (${err.response.status}). `;
      } else if (err.request) {
        errorMsg += 'No response from server. Check your internet connection. ';
      } else {
        errorMsg += 'An unexpected error occurred. ';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubServices = async (mainCategory, serviceCategory) => {
    const key = `${mainCategory}-${serviceCategory}`;
    if (subServicesData[key]) return;

    setSubServicesLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const encodedMain = encodeURIComponent(mainCategory);
      const encodedService = encodeURIComponent(serviceCategory);
      const response = await api.get(
        `/service-catalog/${encodedMain}/${encodedService}/sub-services/detailed`
      );
      const payload = response.data ?? response;
      const data = payload.data ?? payload ?? { subServices: [] };
      setSubServicesData((prev) => ({ ...prev, [key]: data }));
    } catch (error) {
      console.error('Failed to load sub-services:', error);
    } finally {
      setSubServicesLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleCategory = async (mainCategory, categoryName) => {
    const key = `${mainCategory}-${categoryName}`;
    if (!expandedCategories[key]) {
      await fetchSubServices(mainCategory, categoryName);
    }
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ============================================================
  // LOCATION
  // ============================================================

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationMessage('Geolocation not supported');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
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

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleViewTechnicians = (mainCategory, serviceCategory, subService) => {
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
      mainCategory,
      serviceCategory,
      subService,
      radius: maxDistance,
      lat: userLocation.lat,
      lng: userLocation.lng,
    });

    navigate(`/technicians/search?${params.toString()}`);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    fetchServiceCatalog();
  };

  // ============================================================
  // RENDER: LOADING
  // ============================================================
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

  // ============================================================
  // RENDER: ERROR
  // ============================================================
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

  // ============================================================
  // RENDER: EMPTY CATALOG
  // ============================================================
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

  // ============================================================
  // RENDER: MAIN
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ════════════════ HERO SECTION ════════════════ */}
      <div className="relative overflow-hidden bg-gray-900">
        {/* ── Layer 1: Engineering-tools photograph ── */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
          aria-hidden="true"
        />

        {/* ── Layer 2: Darkening + brand colour wash ── */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-black/90"
          aria-hidden="true"
        />
        {/* Green glow (brand) from the top-left */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-green-700/60 via-transparent to-transparent"
          aria-hidden="true"
        />
        {/* Red glow (brand) from the bottom-right */}
        <div
          className="absolute inset-0 bg-gradient-to-tl from-red-800/50 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* ── Layer 3: Soft decorative blobs ── */}
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-400 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24">
          {/* Badge */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-semibold border border-white/25 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-green-300" />
              Verified Engineers &amp; Technicians
            </span>
          </div>

          {/* ═══ Brand Title — green + red ═══ */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-center mb-4 tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            <span className="bg-gradient-to-r from-green-400 via-green-500 to-emerald-400 bg-clip-text text-transparent">
              WeBA-Hub
            </span>{' '}
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-rose-400 bg-clip-text text-transparent">
              Service
            </span>
          </h1>

          {/* Brand accent rule: green → red */}
          <div className="flex justify-center mb-6">
            <div className="h-1.5 w-28 rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-red-500 shadow-lg"></div>
          </div>

          {/* Tagline */}
          <p className="text-base md:text-lg text-white/90 text-center max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-md">
            Browse our comprehensive range of professional services delivered by
            verified <span className="font-semibold text-green-300">engineers</span> and{' '}
            <span className="font-semibold text-red-300">technicians</span> across Kenya.
          </p>

          {/* ═══ Location & Distance Control Card ═══ */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl ring-1 ring-black/5 p-5 md:p-6">
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
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none bg-white text-gray-800 font-medium appearance-none cursor-pointer"
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
                {!maxDistance && locationStatus === 'success' &&
                  '👉 Pick a distance to start finding technicians near you'}
                {maxDistance && locationStatus !== 'success' &&
                  '👉 Enable location to see technicians within your chosen radius'}
                {maxDistance && locationStatus === 'success' &&
                  '✅ Ready! Browse services below and click "View Technicians"'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom fade into the page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* ════════════════ SERVICE CATALOG ════════════════ */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Browse Services
          </h2>
          <p className="text-gray-600">
            {catalog.length} main categor{catalog.length !== 1 ? 'ies' : 'y'} · click any service to expand
          </p>
        </div>

        <div className="space-y-6">
          {catalog.map((category) => (
            <div
              key={category.mainCategory}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Category header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {category.mainCategory}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.serviceCategories?.length ?? 0} service categor{category.serviceCategories?.length !== 1 ? 'ies' : 'y'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Service categories */}
              <div className="divide-y divide-gray-100">
                {category.serviceCategories?.map((serviceCat) => {
                  const key = `${category.mainCategory}-${serviceCat.name}`;
                  const isExpanded = expandedCategories[key];
                  const subData = subServicesData[key];
                  const isLoading = subServicesLoading[key];

                  return (
                    <div key={serviceCat.name}>
                      {/* Toggle button */}
                      <button
                        onClick={() => toggleCategory(category.mainCategory, serviceCat.name)}
                        className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="pr-4 min-w-0">
                          <h4 className="text-base font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                            {serviceCat.name}
                          </h4>
                          {serviceCat.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                              {serviceCat.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="hidden sm:inline-flex text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-semibold">
                            {serviceCat.subServiceCount ?? 0} services
                          </span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isExpanded ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded sub-services */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-100">
                          {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                              <span className="ml-2 text-gray-500 text-sm font-medium">
                                Loading services…
                              </span>
                            </div>
                          ) : subData?.subServices?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {subData.subServices.map((sub, idx) => {
                                const canBook = maxDistance && userLocation;
                                return (
                                  <div
                                    key={idx}
                                    className="bg-white p-5 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all flex flex-col group"
                                  >
                                    <div className="flex items-start gap-2 mb-2">
                                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-4 h-4 text-green-600" />
                                      </div>
                                      <h5 className="font-bold text-gray-800 text-sm leading-tight pt-1">
                                        {sub.name}
                                      </h5>
                                    </div>

                                    {sub.description && (
                                      <p className="text-xs text-gray-600 leading-relaxed mb-3 flex-grow">
                                        {sub.description}
                                      </p>
                                    )}

                                    {/* Meta chips */}
                                    <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
                                      {sub.typicalDuration && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                                          <Clock className="w-3 h-3" />
                                          {sub.typicalDuration.value} {sub.typicalDuration.unit}
                                        </span>
                                      )}
                                      {sub.suggestedPriceRange && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium">
                                          <DollarSign className="w-3 h-3" />
                                          {sub.suggestedPriceRange.min?.toLocaleString?.() ?? sub.suggestedPriceRange.min}
                                          {' - '}
                                          {sub.suggestedPriceRange.max?.toLocaleString?.() ?? sub.suggestedPriceRange.max}
                                        </span>
                                      )}
                                    </div>

                                    {/* CTA button */}
                                    <button
                                      onClick={() =>
                                        handleViewTechnicians(
                                          category.mainCategory,
                                          serviceCat.name,
                                          sub.name
                                        )
                                      }
                                      disabled={!canBook}
                                      className={`w-full mt-auto px-4 py-2.5 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                                        canBook
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
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">
                              No sub-services available for this category.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-8 text-center">
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