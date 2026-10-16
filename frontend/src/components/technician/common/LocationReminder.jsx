import React, { useState } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

// After this many days we nudge the expert to confirm where they are
const STALE_AFTER_DAYS = 7;

const daysSince = (date) =>
  date ? Math.floor((Date.now() - new Date(date).getTime()) / 86400000) : null;

const describeAge = (days) => {
  if (days === null) return null;
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

// Best effort: a readable address for the profile. Location still saves without it.
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await res.json();
    const a = data.address || {};
    const address = {};
    const street = a.road || a.pedestrian;
    const city = a.city || a.town || a.village;
    if (street) address.street = street;
    if (city) address.city = city;
    if (a.state) address.state = a.state;
    if (a.postcode) address.zipCode = a.postcode;
    return { formattedAddress: data.display_name, address };
  } catch {
    return { formattedAddress: undefined, address: {} };
  }
};

const LocationReminder = ({ profile }) => {
  const { updateLocation } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  if (!profile) return null;

  const [lng, lat] = profile.location?.coordinates || [0, 0];
  const hasLocation = !(lng === 0 && lat === 0);
  const days = daysSince(profile.locationUpdatedAt);
  const isStale = !hasLocation || days === null || days >= STALE_AFTER_DAYS;

  const handleUpdate = () => {
    setError('');
    setJustSaved(false);
    if (!navigator.geolocation) {
      setError('Your browser cannot share location. Try a different browser or phone.');
      return;
    }
    setSaving(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        const { formattedAddress, address } = await reverseGeocode(latitude, longitude);
        const result = await updateLocation({
          location: { coordinates: [longitude, latitude], ...(formattedAddress && { formattedAddress }) },
          ...(Object.keys(address).length && { address }),
        });
        setSaving(false);
        if (result.success) setJustSaved(true);
        else setError(result.error || 'Could not save your location. Please try again.');
      },
      (err) => {
        setSaving(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access is blocked. Allow it in your browser settings, then try again.'
            : 'Could not get your location. Please try again.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const button = (
    <button
      onClick={handleUpdate}
      disabled={saving}
      className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
        isStale && !justSaved
          ? 'bg-amber-600 text-white hover:bg-amber-700'
          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
      {saving ? 'Updating…' : 'Use my current location'}
    </button>
  );

  // Fresh location: a quiet one-liner so they can still re-confirm after a move
  if (!isStale || justSaved) {
    return (
      <div className="mb-6 p-3 rounded-lg border border-green-200 bg-green-50 flex flex-wrap items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
        <p className="text-sm text-green-800 flex-1 min-w-[200px]">
          {justSaved ? 'Location updated. ' : `Location updated ${describeAge(days)}. `}
          Moved to a different area? Update it so nearby clients can find you.
          {profile.location?.formattedAddress && (
            <span className="block text-xs text-green-700 mt-0.5 truncate">
              {profile.location.formattedAddress}
            </span>
          )}
        </p>
        {button}
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-lg border border-amber-300 bg-amber-50 flex flex-wrap items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-[200px]">
        <p className="font-semibold text-amber-900">
          {hasLocation ? 'Is your location still correct?' : 'Add your location'}
        </p>
        <p className="text-sm text-amber-800 mt-0.5">
          Clients only see experts near them, so make sure your location is where you work now.
          {hasLocation && days !== null && ` You last updated it ${describeAge(days)}.`}
        </p>
      </div>
      {button}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default LocationReminder;
