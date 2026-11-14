/**
 * Services Page
 * =============
 * The service buckets first (Technical Services, Personal Care & Appearance,
 * …). Picking one (/services?bucket=<id>) lists its main categories; a
 * category opens its own page (/services/:mainCategory) to choose a service
 * category, then a distance, then the Fundis (see ServiceCategory.jsx).
 * Below: popular services, top Fundis and Fundis nearby.
 *
 * @version 6.0.0 – Buckets first, then their categories
 * @author Webafix Team
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wrench, Loader2, AlertCircle, ArrowRight, ArrowLeft, Search, ChevronRight } from 'lucide-react';
import useServiceBuckets from '../hooks/useServiceBuckets';
import useMyLocation from '../hooks/useMyLocation';
import ServicesHighlights from '../components/ServicesHighlights';
import { categoryPath, HIGHLIGHT_SECTIONS as SECTION_IDS } from '../utils/servicePaths';

// useMyLocation statuses → the ones ServicesHighlights expects
const HIGHLIGHT_STATUS = { idle: 'idle', locating: 'loading', ready: 'success', error: 'error' };

// Buttons beside the heading that jump to the sections in ServicesHighlights.
// The landing page only has popular services; a group also has its top and
// nearby experts, under the group's name for them (Fundis, Stylists, …).
const jumpLinks = (bucket) => [
  { id: SECTION_IDS.popular, label: 'Most popular services' },
  ...(bucket
    ? [
        { id: SECTION_IDS.top, label: `Top 10 ${bucket.expertTerm}` },
        { id: SECTION_IDS.nearby, label: `${bucket.expertTerm} near you` },
      ]
    : []),
];

const GREEN_BUTTON =
  'inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm';

const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const Services = () => {
  const navigate = useNavigate();
  // ?category= (new clients land here after signup) opens that category's page
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const bucketParam = searchParams.get('bucket');

  const { buckets, loading, error, retry } = useServiceBuckets();
  const bucket = buckets.find((b) => b.id === bucketParam);

  const { location: userLocation, status, locate } = useMyLocation({ autoIfGranted: true });

  useEffect(() => {
    if (categoryParam) navigate(categoryPath(categoryParam), { replace: true });
  }, [categoryParam, navigate]);

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
              onClick={retry}
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
        <div className="mb-6 md:mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{bucket ? bucket.name : 'Browse Services'}</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              {bucket
                ? `Pick a category → choose a service → set your distance → book a ${bucket.expertTermSingular || 'Fundi'}.`
                : 'Pick a group of services to see its categories.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end lg:max-w-xl">
            <button type="button" onClick={() => navigate('/search')} className={GREEN_BUTTON}>
              <Search className="w-4 h-4" />
              Search
            </button>
            {/* Jump to the sections further down this page */}
            {jumpLinks(bucket).map(({ id, label }) => (
              <button key={id} type="button" onClick={() => jumpTo(id)} className={GREEN_BUTTON}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {bucket ? (
          <BucketCategories bucket={bucket} onBack={() => navigate('/services')} onPick={(name) => navigate(categoryPath(name))} />
        ) : buckets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {buckets.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(`/services?bucket=${b.id}`)}
                className="group text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900 group-hover:text-green-700">{b.name}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                </div>
                <p className="text-sm text-gray-500 mt-1">{b.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {b.categories.length} {b.categories.length === 1 ? 'category' : 'categories'}
                  {!b.technical && b.freeRadiusKm ? ` · free within ${b.freeRadiusKm} km` : ''}
                </p>
              </button>
            ))}
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
          bucket={bucket}
        />
      </div>

      {/* ── Footer CTA ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Need a specific service not listed?</h3>
          <p className="text-gray-600 text-sm mb-5">
            Contact us and we'll connect you with the right {bucket?.expertTermSingular || 'Fundi'}.
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

// A bucket's main categories, as 4 columns of plain links
const BucketCategories = ({ bucket, onBack, onPick }) => (
  <div>
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
    >
      <ArrowLeft className="w-4 h-4" /> All service groups
    </button>
    {!bucket.technical && bucket.freeRadiusKm && (
      <p className="text-sm text-gray-500 mb-3">
        {bucket.expertTerm} in these categories serve clients within {bucket.freeRadiusKm} km of them.
      </p>
    )}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
      {bucket.categories.map((cat) => (
        <button
          key={cat.name}
          type="button"
          onClick={() => onPick(cat.name)}
          className="text-left py-2 px-2 -mx-2 rounded-md text-sm md:text-base font-medium text-gray-800 hover:text-green-700 hover:bg-green-50 transition-colors"
        >
          {cat.name}
        </button>
      ))}
    </div>
  </div>
);

export default Services;
