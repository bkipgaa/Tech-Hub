/**
 * ServicesHighlights Component
 * ============================
 * Discovery sections shown under the Services catalog:
 *   1. Most popular services (10, five per row on desktop)
 *   2. Top 10 experts: best rating first, then most jobs completed
 *   3. Top 5 experts near the visitor (needs their location)
 *
 * On the Services landing page (no bucket) only the popular services show.
 * Inside a group (bucket) all three show, limited to that group and using
 * its name for the experts (Fundis, Stylists, Tutors, …).
 *
 * Clicking a service opens Search pre-filled with it; clicking an expert
 * opens their profile.
 *
 * Props:
 *   userLocation      {lat, lng} | null
 *   locationStatus    'idle' | 'loading' | 'success' | 'error'
 *   onEnableLocation  () => void
 *   bucket            { id, name, expertTerm } | undefined
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Briefcase, MapPin, TrendingUp, Award, Navigation, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { cldImage, AVATAR_WIDTH } from '../utils/media';
import { HIGHLIGHT_SECTIONS } from '../utils/servicePaths';

const NEARBY_RADIUS_KM = 50;
const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3';

const SECTION_IDS = HIGHLIGHT_SECTIONS;

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-2 mb-3">
    <Icon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

const Placeholder = ({ children }) => (
  <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300 text-sm text-gray-500">
    {children}
  </div>
);

export const ExpertCard = ({ tech, rank, onClick }) => {
  const name = [tech.user?.firstName, tech.user?.lastName].filter(Boolean).join(' ') || tech.businessName || 'Fundi';
  const initials = `${tech.user?.firstName?.[0] || ''}${tech.user?.lastName?.[0] || ''}` || 'E';
  const rating = tech.rating?.average || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-green-500 hover:bg-green-100 hover:shadow-lg transition-all flex flex-col items-center"
    >
      {rank && (
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
          {rank}
        </span>
      )}
      {tech.user?.profileImage ? (
        <img
          src={cldImage(tech.user.profileImage, AVATAR_WIDTH)}
          alt=""
          className="w-16 h-16 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-500">
          {initials}
        </div>
      )}
      <p className="mt-2 text-sm font-bold text-gray-900 leading-tight line-clamp-2 break-words">
        {name}
        {tech.verificationStatus === 'verified' && (
          <CheckCircle className="inline w-3.5 h-3.5 text-blue-500 ml-1 align-[-2px]" aria-label="Verified" />
        )}
      </p>
      {tech.mainCategory && <p className="text-xs text-gray-500 line-clamp-1">{tech.mainCategory}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
          {rating > 0 ? rating.toFixed(1) : 'New'}
          {tech.rating?.count > 0 && <span className="text-gray-400">({tech.rating.count})</span>}
        </span>
        <span className="inline-flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
          {tech.completedJobs || 0} jobs
        </span>
        {tech.distance != null && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            {Number(tech.distance).toFixed(1)} km
          </span>
        )}
      </div>
    </button>
  );
};

const ServicesHighlights = ({ userLocation, locationStatus, onEnableLocation, bucket }) => {
  const navigate = useNavigate();
  const bucketId = bucket?.id || '';
  const term = bucket?.expertTerm || 'Fundis';

  // Results are kept with the group they were loaded for; no match = still loading
  const [popular, setPopular] = useState({ key: null, data: [] });
  const [top, setTop] = useState({ key: null, data: [] });
  const [nearby, setNearby] = useState({ key: null, data: [] });

  useEffect(() => {
    const group = bucketId ? `&bucket=${encodeURIComponent(bucketId)}` : '';
    api.get(`/service-catalog/popular?limit=10${group}`)
      .then((res) => setPopular({ key: bucketId, data: res.data?.data || [] }))
      .catch(() => setPopular({ key: bucketId, data: [] }));
    if (!bucketId) return;
    api.get(`/search/top-technicians?limit=10${group}`)
      .then((res) => setTop({ key: bucketId, data: res.data?.data || [] }))
      .catch(() => setTop({ key: bucketId, data: [] }));
  }, [bucketId]);

  const nearbyKey = userLocation && bucketId ? `${bucketId}|${userLocation.lat},${userLocation.lng}` : null;
  useEffect(() => {
    if (!nearbyKey) return;
    const params = new URLSearchParams({
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: NEARBY_RADIUS_KM,
      limit: 5,
      bucket: bucketId,
    });
    api.get(`/search/nearby?${params.toString()}`)
      .then((res) => setNearby({ key: nearbyKey, data: res.data?.data || [] }))
      .catch(() => setNearby({ key: nearbyKey, data: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyKey]);

  const openService = (item) => {
    const params = new URLSearchParams({
      mainCategory: item.mainCategory,
      serviceCategory: item.serviceCategory,
      subService: item.subService,
    });
    navigate(`/search?${params.toString()}`);
  };
  const openExpert = (tech) => navigate(`/technician/${tech._id}`);

  const spinner = (
    <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
    </div>
  );

  const popularLoading = popular.key !== bucketId;
  const topLoading = top.key !== bucketId;
  const nearbyLoading = nearby.key !== nearbyKey;

  return (
    <div className="space-y-10 mt-10">
      {/* ─── Most popular services ─── */}
      <section id={SECTION_IDS.popular} className="scroll-mt-24">
        <SectionHeading
          icon={TrendingUp}
          title="Most popular services"
          subtitle={bucket ? `${bucket.name} services with the most completed bookings` : 'Services with the most completed bookings'}
        />
        {popularLoading ? spinner : popular.data.length === 0 ? (
          <Placeholder>Popular services will show here soon.</Placeholder>
        ) : (
          <div className={GRID}>
            {popular.data.map((item) => (
              <button
                key={`${item.mainCategory}|${item.serviceCategory}|${item.subService}`}
                type="button"
                onClick={() => openService(item)}
                className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-green-500 hover:bg-green-100 hover:shadow-md transition-all"
              >
                <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{item.subService}</p>
                <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">{item.serviceCategory}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {bucket && (
        <>
          {/* ─── Top 10 experts in this group ─── */}
          <section id={SECTION_IDS.top} className="scroll-mt-24">
            <SectionHeading icon={Award} title={`Top 10 ${term}`} subtitle="Ranked by rating, then by jobs completed" />
            {topLoading ? spinner : top.data.length === 0 ? (
              <Placeholder>Top {term} will show here once jobs are rated.</Placeholder>
            ) : (
              <div className={GRID}>
                {top.data.map((tech, i) => (
                  <ExpertCard key={tech._id} tech={tech} rank={i + 1} onClick={() => openExpert(tech)} />
                ))}
              </div>
            )}
          </section>

          {/* ─── Top 5 near you in this group ─── */}
          <section id={SECTION_IDS.nearby} className="scroll-mt-24">
            <SectionHeading
              icon={MapPin}
              title={`${term} near you`}
              subtitle={`The closest available ${term} within ${NEARBY_RADIUS_KM} km`}
            />
            {!userLocation ? (
              <Placeholder>
                {locationStatus === 'loading' ? (
                  'Finding your location…'
                ) : (
                  <>
                    <p className="mb-3">Allow location access to see {term} near you.</p>
                    <button
                      type="button"
                      onClick={onEnableLocation}
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      Use my location
                    </button>
                  </>
                )}
              </Placeholder>
            ) : nearbyLoading ? spinner : nearby.data.length === 0 ? (
              <Placeholder>No {term} within {NEARBY_RADIUS_KM} km yet. Try Search with a wider radius.</Placeholder>
            ) : (
              <div className={GRID}>
                {nearby.data.map((tech) => (
                  <ExpertCard key={tech._id} tech={tech} onClick={() => openExpert(tech)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default ServicesHighlights;
