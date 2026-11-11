/**
 * Services Page
 * =============
 * Main categories in a 4-column grid. Picking one opens its own page
 * (/services/:mainCategory) to choose a service category, then a distance,
 * then the Fundis for a service (see ServiceCategory.jsx).
 * Below the grid: popular services, top Fundis and Fundis nearby.
 *
 * @version 5.0.0 – Category grid; each step on its own page
 * @author Webafix Team
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, Loader2, AlertCircle, ArrowRight, Search, ChevronRight } from 'lucide-react';
import api from '../services/api';
import useMyLocation from '../hooks/useMyLocation';
import ServicesHighlights from '../components/ServicesHighlights';
import { categoryPath } from '../utils/servicePaths';

// useMyLocation statuses → the ones ServicesHighlights expects
const HIGHLIGHT_STATUS = { idle: 'idle', locating: 'loading', ready: 'success', error: 'error' };

const Services = () => {
  const navigate = useNavigate();
  // ?category= (new clients land here after signup) opens that category's page
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { location: userLocation, status, locate } = useMyLocation({ autoIfGranted: true });

  useEffect(() => {
    if (categoryParam) {
      navigate(categoryPath(categoryParam), { replace: true });
      return;
    }
    fetchServiceCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam]);

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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <p className="font-semibold mb-1">Unable to load services</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchServiceCatalog}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        {/* ─── Header ─────────────────────────────────── */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Browse Services</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Pick a category → choose a service → set your distance → book a Fundi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="self-start inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm flex-shrink-0"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {/* ─── Main categories (4 columns) ─────────────── */}
        {catalog.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {catalog.map((cat) => {
              const count = cat.serviceCategories?.length ?? 0;
              return (
                <button
                  key={cat.mainCategory}
                  onClick={() => navigate(categoryPath(cat.mainCategory))}
                  className="group text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-green-500 hover:shadow-md transition-all flex flex-col gap-3 min-h-[110px]"
                >
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <Wrench className="w-4 h-4 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-snug">{cat.mainCategory}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {count} service{count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-600 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No services available. Please check back later.</p>
          </div>
        )}

        {/* ── Popular services, top Fundis, Fundis nearby ── */}
        <ServicesHighlights
          userLocation={userLocation}
          locationStatus={HIGHLIGHT_STATUS[status] || 'idle'}
          onEnableLocation={locate}
        />
      </div>

      {/* ── Footer CTA ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Need a specific service not listed?</h3>
          <p className="text-gray-600 text-sm mb-5">
            Contact us and we'll connect you with the right Fundi.
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
