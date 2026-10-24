/**
 * useMyLocation
 * =============
 * The visitor's position for "near me" features, shared across pages.
 * Asked for only when the visitor taps a near-me control (or automatically if
 * they already allowed location for this site), kept in sessionStorage for
 * the tab, and never put in URLs. Signed-in users who saved a location on
 * their account (at signup or on their profile) get that until they ask for
 * a live one.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLivePosition } from '../utils/geo';
import { useAuth } from '../context/AuthContext';

const KEY = 'webafix.myLocation';
const MAX_AGE_MS = 30 * 60 * 1000;

const readCached = () => {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return v && Date.now() - v.at < MAX_AGE_MS ? v : null;
  } catch {
    return null;
  }
};

const listeners = new Set();
let shared = readCached();

const publish = (value) => {
  shared = value;
  try {
    if (value) sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode) — keep it in memory only
  }
  listeners.forEach((fn) => fn(value));
};

const useMyLocation = ({ autoIfGranted = false } = {}) => {
  const [location, setLocation] = useState(shared);
  const [status, setStatus] = useState(shared ? 'ready' : 'idle'); // idle | locating | ready | error
  const [error, setError] = useState('');

  useEffect(() => {
    const onChange = (v) => {
      setLocation(v);
      if (v) setStatus('ready');
    };
    listeners.add(onChange);
    return () => listeners.delete(onChange);
  }, []);

  const locate = useCallback(async () => {
    setStatus('locating');
    setError('');
    try {
      // A recent, lower-accuracy fix is fine for "near me" and much faster than GPS
      const pos = await getLivePosition({ enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 15000 });
      publish({ lat: pos.lat, lng: pos.lng, at: Date.now() });
      return pos;
    } catch (err) {
      setStatus('error');
      setError(err.message);
      return null;
    }
  }, []);

  const { user } = useAuth() || {};
  const savedLat = user?.location?.lat;
  const savedLng = user?.location?.lng;
  const hasSaved = savedLat != null && savedLng != null;
  // Same object between renders, so effects that depend on the location don't re-run
  const saved = useMemo(
    () => (hasSaved ? { lat: savedLat, lng: savedLng, saved: true } : null),
    [hasSaved, savedLat, savedLng]
  );

  // If the visitor already allowed location for this site, fetch without asking again
  useEffect(() => {
    if (!autoIfGranted || shared || hasSaved || !navigator.permissions?.query) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((p) => {
        if (!cancelled && p.state === 'granted') locate();
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [autoIfGranted, hasSaved, locate]);

  if (!location && saved && status !== 'locating') {
    return { location: saved, status: 'ready', error: '', locate };
  }
  return { location, status, error, locate };
};

export default useMyLocation;
