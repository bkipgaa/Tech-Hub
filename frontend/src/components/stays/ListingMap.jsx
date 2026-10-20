/**
 * ListingMap.jsx
 * ==============
 * Leaflet maps for Stays & Spaces (OpenStreetMap tiles, no API key).
 *
 *   <LocationPicker value={{lat,lng}} onChange={fn} />  — lister sets the pin
 *   <AreaMap center={{lat,lng}} />                      — approximate area only
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Search, Loader2 } from 'lucide-react';
import { getLivePosition } from '../../utils/geo';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const NAIROBI = { lat: -1.2864, lng: 36.8172 };

// Inline SVG pin, so no image files need bundling
const PIN = L.divIcon({
  className: '',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.4 17 27 17 27s17-14.6 17-27C34 7.6 26.4 0 17 0z" fill="#16a34a"/>
    <circle cx="17" cy="17" r="7" fill="#fff"/></svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
});

const Recenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], zoom ?? map.getZoom(), { animate: true });
  }, [center?.lat, center?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
};

const ClickToPlace = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
};

const round6 = (n) => Math.round(n * 1e6) / 1e6;

export const LocationPicker = ({ value, onChange, height = 320 }) => {
  const [view, setView] = useState(value || null);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');

  const pick = (p) => {
    onChange({ lat: round6(p.lat), lng: round6(p.lng) });
    setMessage('');
  };

  const useMine = async () => {
    setLocating(true);
    setMessage('');
    try {
      const pos = await getLivePosition();
      pick(pos);
      setView({ lat: pos.lat, lng: pos.lng, zoom: 17 });
      if (pos.accuracy > 100) {
        setMessage(`Your location is accurate to about ${pos.accuracy} m. Drag the pin onto the exact building.`);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLocating(false);
    }
  };

  // Place search with OpenStreetMap Nominatim (on submit only, per its usage policy)
  const search = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setMessage('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ke&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      const [hit] = await r.json();
      if (!hit) {
        setMessage('Place not found. Try a nearby landmark, estate or town.');
        return;
      }
      const p = { lat: Number(hit.lat), lng: Number(hit.lon) };
      setView({ ...p, zoom: 16 });
      pick(p);
      setMessage('Pin placed near that place. Drag it onto the exact building.');
    } catch {
      setMessage('Place search is unavailable right now. Tap the map or use your location instead.');
    } finally {
      setSearching(false);
    }
  };

  const start = value || NAIROBI;

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(e)}
            placeholder="Find a place, e.g. Yaya Centre, Nairobi"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={searching}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Find
        </button>
        <button
          type="button"
          onClick={useMine}
          disabled={locating}
          className="px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          I'm at the property
        </button>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-300 relative z-0" style={{ height }}>
        <MapContainer center={[start.lat, start.lng]} zoom={value ? 16 : 12} className="w-full h-full" scrollWheelZoom={false}>
          <TileLayer url={TILES} attribution={ATTRIBUTION} />
          <ClickToPlace onPick={pick} />
          {view && <Recenter center={view} zoom={view.zoom} />}
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={PIN}
              draggable
              eventHandlers={{ dragend: (e) => pick(e.target.getLatLng()) }}
            />
          )}
        </MapContainer>
      </div>

      <p className={`text-xs ${message ? 'text-amber-700' : 'text-gray-500'}`}>
        {message ||
          (value
            ? 'Pin set. Drag it if it isn’t exactly on the property. Clients only see the approximate area, never the exact pin.'
            : 'Tap the map where the property is, search for a place, or use your location if you’re there now.')}
      </p>
    </div>
  );
};

/** Approximate area: a ~800 m circle, no pin */
export const AreaMap = ({ center, height = 220 }) => (
  <div className="rounded-lg overflow-hidden border border-gray-200 relative z-0" style={{ height }}>
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      className="w-full h-full"
      scrollWheelZoom={false}
      attributionControl
    >
      <TileLayer url={TILES} attribution={ATTRIBUTION} />
      <Circle
        center={[center.lat, center.lng]}
        radius={800}
        pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.15, weight: 2 }}
      />
    </MapContainer>
  </div>
);
