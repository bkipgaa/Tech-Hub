/**
 * ListingDetails.jsx
 * ==================
 * One Stays & Spaces listing: photos, details, amenities and the lister's
 * contact buttons (call / WhatsApp). The phone number is only sent by the
 * API to signed-in users.
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, MessageCircle, BedDouble, Bath, Users, Ruler, CalendarDays, Clock,
  CheckCircle, Loader2, AlertCircle, ImageOff, Wrench, Pencil, Eye, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cldImage } from '../utils/media';
import ListingCard from '../components/stays/ListingCard';
import { AreaMap } from '../components/stays/ListingMap';
import {
  categoryById, formatPrice, propertyTypeLabel, amenityLabel, listerTypeLabel, toInternationalPhone, placeLabel,
} from '../utils/listingCategories';

const Fact = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
    <Icon className="w-5 h-5 text-green-600 flex-shrink-0" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

const ListingDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  // { id, listing, error } for the last finished request; loading until it matches the URL
  const [result, setResult] = useState({ id: null, listing: null, error: '' });
  const [photoIndex, setPhotoIndex] = useState(0);
  const [nearbyResult, setNearbyResult] = useState({ id: null, items: [] });

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/listings/${id}/nearby`, { params: { limit: 4 } })
      .then((r) => !cancelled && setNearbyResult({ id, items: r.data?.data || [] }))
      .catch(() => !cancelled && setNearbyResult({ id, items: [] }));
    return () => { cancelled = true; };
  }, [id]);

  const nearby = nearbyResult.id === id ? nearbyResult.items : [];

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/listings/${id}`)
      .then((r) => !cancelled && setResult({ id, listing: r.data?.data || null, error: '' }))
      .catch((err) => !cancelled && setResult({
        id,
        listing: null,
        error: err.response?.data?.message || 'Could not load this listing.',
      }));
    return () => { cancelled = true; };
  }, [id, user]);

  const { listing, error } = result;

  if (result.id !== id) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-gray-300 mx-auto" />
        <p className="mt-3 text-gray-700 font-semibold">{error || 'Listing not found.'}</p>
        <Link to="/stays" className="inline-block mt-4 text-green-700 font-medium hover:underline">
          Back to Stays &amp; Spaces
        </Link>
      </div>
    );
  }

  const category = categoryById(listing.category);
  const photos = listing.photos || [];
  const photo = photos[photoIndex];
  const phone = listing.contactPhone ? toInternationalPhone(listing.contactPhone) : null;
  const waText = encodeURIComponent(`Hi, I saw "${listing.title}" on Webafix. Is it still available?`);
  const ownerName = listing.owner ? `${listing.owner.firstName || ''} ${listing.owner.lastName || ''}`.trim() : '';

  const facts = [];
  if (listing.propertyType) facts.push({ icon: BedDouble, label: 'Type', value: propertyTypeLabel(listing.propertyType) });
  if (listing.bedrooms) facts.push({ icon: BedDouble, label: 'Bedrooms', value: listing.bedrooms });
  if (listing.bathrooms) facts.push({ icon: Bath, label: 'Bathrooms', value: listing.bathrooms });
  if (listing.maxGuests) facts.push({ icon: Users, label: 'Guests', value: `Up to ${listing.maxGuests}` });
  if (listing.sizeSqft) facts.push({ icon: Ruler, label: 'Size', value: `${listing.sizeSqft.toLocaleString()} sq ft` });
  if (listing.openingHours) facts.push({ icon: Clock, label: 'Opening hours', value: listing.openingHours });
  if (listing.availableFrom) {
    facts.push({
      icon: CalendarDays,
      label: 'Available from',
      value: new Date(listing.availableFrom).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
  }

  const step = (delta) => setPhotoIndex((i) => (i + delta + photos.length) % photos.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link to="/stays" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-green-700">
          <ArrowLeft className="w-4 h-4" /> Stays &amp; Spaces
        </Link>

        {listing.isOwner && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" /> This is your listing ·{' '}
              {listing.visibleInSearch
                ? 'live in search'
                : {
                    pending: 'waiting for approval by our team',
                    rejected: `changes needed: ${listing.review?.rejectionReason || 'see My Listings'}`,
                    hidden: 'hidden by Webafix',
                    paused: 'paused, not shown in search',
                  }[listing.status] || 'not shown in search: unpaid'}{' '}
              · {listing.views || 0} views
              {listing.status === 'active' && !listing.visibleInSearch && (
                <Link to="/my-listings" className="font-semibold underline">Pay to go live</Link>
              )}
            </span>
            <Link to={`/stays/${listing._id}/edit`} className="inline-flex items-center gap-1 font-semibold hover:underline">
              <Pencil className="w-4 h-4" /> Edit listing
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* ─── Main column ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="relative aspect-[16/10] bg-gray-100">
                {photo ? (
                  <img src={cldImage(photo.url, 1200)} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <ImageOff className="w-12 h-12" />
                    <p className="text-sm mt-2">No photos yet</p>
                  </div>
                )}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => step(-1)}
                      aria-label="Previous photo"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => step(1)}
                      aria-label="Next photo"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {photoIndex + 1} / {photos.length}
                    </span>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto">
                  {photos.map((p, i) => (
                    <button
                      key={p.url}
                      onClick={() => setPhotoIndex(i)}
                      className={`w-20 h-14 flex-shrink-0 rounded-md overflow-hidden border-2 ${
                        i === photoIndex ? 'border-green-600' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={cldImage(p.url, 200)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & facts */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {category && <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{category.name}</p>}
              <h1 className="text-2xl font-bold text-gray-800 mt-1">{listing.title}</h1>
              <p className="text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> {placeLabel(listing)}
                {listing.landmark ? ` · ${listing.landmark}` : ''}
              </p>

              {facts.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                  {facts.map((f) => <Fact key={f.label} {...f} />)}
                </div>
              )}

              {listing.description && (
                <div className="mt-6">
                  <h2 className="font-semibold text-gray-800 mb-2">About this place</h2>
                  <p className="text-gray-600 whitespace-pre-line text-sm leading-relaxed">{listing.description}</p>
                </div>
              )}

              {listing.amenities?.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-semibold text-gray-800 mb-2">What it offers</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {listing.amenities.map((a) => (
                      <span key={a} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" /> {amenityLabel(a)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Area map: approximate for visitors, exact pin only on the edit page */}
            {(listing.approxLocation || (listing.isOwner && listing.lat != null)) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-800 mb-1">Where it is</h2>
                <p className="text-sm text-gray-500 mb-3">
                  {placeLabel(listing)}. The {listing.isOwner ? 'circle shows what clients see' : 'exact address is shared by the lister'}.
                </p>
                <AreaMap center={listing.approxLocation || { lat: listing.lat, lng: listing.lng }} />
              </div>
            )}
          </div>

          {/* ─── Contact column ──────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 lg:sticky lg:top-20">
              <p className="text-2xl font-bold text-green-700">{formatPrice(listing.price, listing.priceUnit)}</p>
              {listing.deposit > 0 && (
                <p className="text-sm text-gray-500 mt-1">Deposit: KES {listing.deposit.toLocaleString('en-KE')}</p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Listed by</p>
                <p className="font-semibold text-gray-800">{ownerName || 'Webafix member'}</p>
                <p className="text-xs text-gray-500">{listerTypeLabel(listing.listerType)}</p>
              </div>

              {listing.isOwner ? null : phone ? (
                <div className="mt-4 space-y-2">
                  <a
                    href={`tel:+${phone}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-700"
                  >
                    <Phone className="w-4 h-4" /> Call {listing.contactPhone}
                  </a>
                  {listing.whatsapp && (
                    <a
                      href={`https://wa.me/${phone}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 border border-green-600 text-green-700 font-semibold px-4 py-2.5 rounded-lg hover:bg-green-50"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                  <p className="text-xs text-gray-400 text-center pt-1">
                    Never pay a deposit before you've viewed the place.
                  </p>
                </div>
              ) : (
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-700"
                >
                  <Phone className="w-4 h-4" /> Sign in to see contacts
                </Link>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="font-semibold text-gray-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-green-600" /> Need a fundi for this property?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Movers, cleaners, plumbers and electricians near {listing.estate || listing.town || listing.area}.
              </p>
              <Link to="/services" className="inline-block mt-3 text-sm font-semibold text-green-700 hover:underline">
                Find an expert →
              </Link>
            </div>
          </div>
        </div>

        {nearby.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-800">More places nearby</h2>
            <p className="text-sm text-gray-500 mb-4">Closest to this {category ? category.name.toLowerCase() : 'place'} first</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearby.map((l) => <ListingCard key={l._id} listing={l} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDetails;
