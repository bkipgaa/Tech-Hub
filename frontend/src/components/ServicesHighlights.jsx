/**
 * ServicesHighlights Component
 * ============================
 * Discovery sections shown under the Services catalog:
 *   1. Most popular services (10, five per row on desktop)
 *   2. Top 10 experts: best rating first, then most jobs completed
 *   3. Top 5 experts near the visitor (needs their location)
 *
 * Clicking a service opens Search pre-filled with it; clicking an expert
 * opens their profile.
 *
 * Props:
 *   userLocation      {lat, lng} | null
 *   locationStatus    'idle' | 'loading' | 'success' | 'error'
 *   onEnableLocation  () => void
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Briefcase, MapPin, TrendingUp, Award, Navigation, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { cldImage, AVATAR_WIDTH } from '../utils/media';

const NEARBY_RADIUS_KM = 50;
const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3';

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

const ExpertCard = ({ tech, rank, onClick }) => {
  const name = [tech.user?.firstName, tech.user?.lastName].filter(Boolean).join(' ') || tech.businessName || 'Expert';
  const initials = `${tech.user?.firstName?.[0] || ''}${tech.user?.lastName?.[0] || ''}` || 'E';
  const rating = tech.rating?.average || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-green-400 hover:shadow-lg transition-all flex flex-col items-center"
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

const ServicesHighlights = ({ userLocation, locationStatus, onEnableLocation }) => {
  const navigate = useNavigate();

  const [popular, setPopular] = useState({ loading: true, data: [] });
  const [top, setTop] = useState({ loading: true, data: [] });
  const [nearby, setNearby] = useState({ loading: false, data: [], loaded: false });

  useEffect(() => {
    api.get('/service-catalog/popular?limit=10')
      .then((res) => setPopular({ loading: false, data: res.data?.data || [] }))
      .catch(() => setPopular({ loading: false, data: [] }));
    api.get('/search/top-technicians?limit=10')
      .then((res) => setTop({ loading: false, data: res.data?.data || [] }))
      .catch(() => setTop({ loading: false, data: [] }));
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    setNearby((n) => ({ ...n, loading: true }));
    const params = new URLSearchParams({
      lat: userLocation.lat,
      lng: userLocation.lng,
      radius: NEARBY_RADIUS_KM,
      limit: 5,
    });
    api.get(`/search/nearby?${params.toString()}`)
      .then((res) => setNearby({ loading: false, data: res.data?.data || [], loaded: true }))
      .catch(() => setNearby({ loading: false, data: [], loaded: true }));
  }, [userLocation]);

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

  return (
    <div className="space-y-10 mt-10">
      {/* ─── Most popular services ─── */}
      <section>
        <SectionHeading icon={TrendingUp} title="Most popular services" subtitle="What clients search for and book most" />
        {popular.loading ? spinner : popular.data.length === 0 ? (
          <Placeholder>Popular services will show here soon.</Placeholder>
        ) : (
          <div className={GRID}>
            {popular.data.map((item) => (
              <button
                key={`${item.mainCategory}|${item.serviceCategory}|${item.subService}`}
                type="button"
                onClick={() => openService(item)}
                className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-green-400 hover:shadow-md transition-all"
              >
                <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{item.subService}</p>
                <p className="mt-1 text-[11px] text-gray-500 line-clamp-1">{item.serviceCategory}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ─── Top 10 experts ─── */}
      <section>
        <SectionHeading icon={Award} title="Top 10 experts" subtitle="Ranked by rating, then by jobs completed" />
        {top.loading ? spinner : top.data.length === 0 ? (
          <Placeholder>Top experts will show here once jobs are rated.</Placeholder>
        ) : (
          <div className={GRID}>
            {top.data.map((tech, i) => (
              <ExpertCard key={tech._id} tech={tech} rank={i + 1} onClick={() => openExpert(tech)} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Top 5 near you ─── */}
      <section>
        <SectionHeading icon={MapPin} title="Experts near you" subtitle={`The closest available experts within ${NEARBY_RADIUS_KM} km`} />
        {!userLocation ? (
          <Placeholder>
            {locationStatus === 'loading' ? (
              'Finding your location…'
            ) : (
              <>
                <p className="mb-3">Allow location access to see experts near you.</p>
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
        ) : nearby.loading || !nearby.loaded ? spinner : nearby.data.length === 0 ? (
          <Placeholder>No experts within {NEARBY_RADIUS_KM} km yet. Try Search with a wider radius.</Placeholder>
        ) : (
          <div className={GRID}>
            {nearby.data.map((tech) => (
              <ExpertCard key={tech._id} tech={tech} onClick={() => openExpert(tech)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ServicesHighlights;
