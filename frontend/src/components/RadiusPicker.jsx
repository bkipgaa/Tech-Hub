import React, { useState } from 'react';

export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 1000;

// Common distances people pick; anything else can be typed
const PRESETS = [1, 5, 10, 15, 20, 30, 50, 100, 200, 500, 1000];

const clamp = (n) => Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Math.round(n)));

/**
 * Search distance picker: one-tap presets plus a box for any whole number of km.
 * Typed values are applied on Enter or when the box loses focus, so a search
 * isn't fired for every keystroke.
 *
 * @param {number|''} value     current radius in km ('' = nothing chosen yet)
 * @param {Function}  onChange  called with the new radius (number)
 */
const RadiusPicker = ({ value, onChange, id = 'radiusInput' }) => {
  const [text, setText] = useState(value === '' ? '' : String(value));
  const [shownValue, setShownValue] = useState(value);

  // Keep the box in sync when the radius changes elsewhere (preset, reset, "increase radius")
  if (value !== shownValue) {
    setShownValue(value);
    setText(value === '' ? '' : String(value));
  }

  const commit = () => {
    const n = parseFloat(text);
    if (!Number.isFinite(n)) {
      setText(value === '' ? '' : String(value));
      return;
    }
    const km = clamp(n);
    setText(String(km));
    if (km !== Number(value)) onChange(km);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((km) => {
          const active = Number(value) === km;
          return (
            <button
              key={km}
              type="button"
              onClick={() => onChange(km)}
              aria-pressed={active}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-700'
              }`}
            >
              {km} km
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor={id} className="text-sm text-gray-600 whitespace-nowrap">
          Or type a distance:
        </label>
        <div className="relative w-32">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            step="1"
            placeholder="e.g. 12"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
            }}
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
            km
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Any distance from {MIN_RADIUS_KM} to {MAX_RADIUS_KM} km.
      </p>
    </div>
  );
};

export default RadiusPicker;
