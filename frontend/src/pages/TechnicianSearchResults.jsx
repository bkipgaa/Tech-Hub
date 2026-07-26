/**
 * TechnicianSearchResults.jsx
 * Dedicated page for displaying technicians found for a specific service + distance
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wrench,
  MapPin,
  Star,
  DollarSign,
  Clock,
  ArrowLeft,
  Loader2,
  X,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import api from '../services/api';

const TechnicianSearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read params from URL
  const mainCategory = searchParams.get('mainCategory') || '';
  const serviceCategory = searchParams.get('serviceCategory') || '';
  const subService = searchParams.get('subService') || '';
  const radius = searchParams.get('radius') || '10';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // distance | rating | price | experience

  // Fetch technicians on mount
  useEffect(() => {
    if (!mainCategory || !serviceCategory || !subService) {
      setError('Invalid search parameters.');
      setLoading(false);
      return;
    }
    fetchTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        mainCategory,
        serviceCategory,
        subService,
        radius,
        ...(lat && { lat }),
        ...(lng && { lng }),
        sortBy,
        sortOrder: sortBy === 'price' ? 'asc' : 'desc',
      });

      const response = await api.get(`/search/technicians?${params.toString()}`);
      const payload = response.data ?? response;
      const data = payload.data ?? [];

      if (payload.success) {
        setTechnicians(Array.isArray(data) ? data : []);
        if (data.length === 0) {
          setError('No technicians found for this service within the selected distance.');
        }
      } else {
        setError(payload.message || 'Failed to fetch technicians.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Could not load technicians. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when sort changes
  useEffect(() => {
    if (!loading) fetchTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const getInitials = (user) => {
    if (!user) return '?';
    const first = user.firstName?.[0] ?? '';
    const last = user.lastName?.[0] ?? '';
    return `${first}${last}` || '?';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/services')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Services
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Technicians for {subService}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {mainCategory} &rsaquo; {serviceCategory} &rsaquo; {subService}
                <span className="ml-2 inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                  <MapPin className="w-3 h-3" />
                  Within {radius} km
                </span>
              </p>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:outline-none bg-white"
              >
                <option value="distance">Sort by Distance</option>
                <option value="rating">Sort by Rating</option>
                <option value="price">Sort by Price (Low-High)</option>
                <option value="experience">Sort by Experience</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
            <p className="text-gray-600">Finding technicians near you...</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-xl mb-6">
              <Filter className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="font-medium">{error}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={fetchTechnicians}
                className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Retry Search
              </button>
              <div>
                <button
                  onClick={() => navigate('/services')}
                  className="text-gray-500 hover:text-gray-800 text-sm underline mt-2"
                >
                  Browse other services
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Found <span className="font-semibold text-gray-800">{technicians.length}</span> technician{technicians.length !== 1 ? 's' : ''}
            </p>

            {technicians.map((tech) => (
              <div
                key={tech._id ?? tech.id ?? Math.random()}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {tech.user?.profileImage ? (
                      <img
                        src={tech.user.profileImage}
                        alt={`${tech.user?.firstName ?? 'Technician'} profile`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}
                    <div
                      className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-100"
                      style={{ display: tech.user?.profileImage ? 'none' : 'flex' }}
                    >
                      <span className="text-xl font-bold text-gray-500">
                        {getInitials(tech.user)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold text-gray-800">
                            {tech.user?.firstName ?? 'Unknown'} {tech.user?.lastName ?? ''}
                          </h2>
                          {tech.verificationStatus === 'verified' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {tech.profileHeadline || tech.businessName || 'Professional Technician'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full whitespace-nowrap">
                        <MapPin className="w-4 h-4 text-green-600" />
                        {tech.distance !== undefined && tech.distance !== null
                          ? `${tech.distance} km away`
                          : 'Distance unknown'}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold">{tech.rating?.average?.toFixed(1) ?? 'New'}</span>
                        <span className="text-gray-400">({tech.rating?.count ?? 0} reviews)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">KES {tech.pricing?.hourlyRate ?? 0}/hr</span>
                      </span>
                      {tech.yearsOfExperience > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-blue-500" />
                          {tech.yearsOfExperience}+ years exp
                        </span>
                      )}
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {tech.subscriptionPlan ?? 'Basic'}
                      </span>
                    </div>

                    {/* Skills */}
                    {tech.skills && tech.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tech.skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {tech.skills.length > 4 && (
                          <span className="text-xs text-gray-400 px-1 py-1">
                            +{tech.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* About */}
                    {tech.aboutMe && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                        {tech.aboutMe}
                      </p>
                    )}

                    {/* Action */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => navigate(`/technician/${tech._id ?? tech.id}`)}
                        className="bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                      >
                        View Profile & Book
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianSearchResults;