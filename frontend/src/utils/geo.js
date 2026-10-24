/**
 * Live device location (no cached fix), as { lat, lng, accuracy, at }.
 * Rejects with a message that can be shown to the user.
 */
const GEO_ERRORS = {
  1: 'Location permission was denied. Allow location access for this site in your browser settings and try again.',
  2: 'Your location is not available right now. Check that location (GPS) is turned on.',
  3: 'Getting your location took too long. Please try again, ideally near a window or outside.',
};

export const getLivePosition = (options = {}) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
        at: pos.timestamp,
      }),
      (err) => reject(new Error(GEO_ERRORS[err.code] || 'Could not get your location.')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0, ...options }
    );
  });

export const mapsLink = ({ lat, lng }) => `https://www.google.com/maps?q=${lat},${lng}`;

/**
 * Town, county and a readable address for a point (OpenStreetMap Nominatim).
 * Resolves to empty strings when the lookup fails; the coordinates are what matter.
 */
export const reverseGeocode = async ({ lat, lng }) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
    );
    const data = await res.json();
    const a = data.address || {};
    return {
      city: a.city || a.town || a.village || a.suburb || '',
      // In Kenya OSM puts the county in `state` and the sub-county in `county`
      state: (a.state || a.county || '').replace(/ County$/, ''),
      formattedAddress: data.display_name || '',
    };
  } catch {
    return { city: '', state: '', formattedAddress: '' };
  }
};
