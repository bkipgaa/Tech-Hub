/**
 * ExtrasEditor.jsx
 * ================
 * "What it offers" items the lister types in themselves (beyond the
 * checkboxes), e.g. "Free tile cutting" or "Kids play area". Saved on the
 * listing as `extras` and shown to users with the other amenities.
 */

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const MAX_EXTRAS = 20; // matches backend/models/Listing.js
const MAX_LENGTH = 60;

const ExtrasEditor = ({ value, onChange, placeholder }) => {
  const extras = value || [];
  const [text, setText] = useState('');
  const [note, setNote] = useState('');

  const add = () => {
    const item = text.replace(/\s+/g, ' ').trim();
    if (!item) return;
    if (extras.some((x) => x.toLowerCase() === item.toLowerCase())) {
      setNote('You have already added that.');
      return;
    }
    onChange([...extras, item]);
    setText('');
    setNote('');
  };

  const full = extras.length >= MAX_EXTRAS;

  return (
    <div>
      <p className="text-sm font-medium text-gray-700">Anything else you offer?</p>
      <p className="text-xs text-gray-500 mb-2">Add your own, one at a time. Up to {MAX_EXTRAS}.</p>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); setNote(''); }}
          // Enter adds the item instead of submitting the whole form
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          maxLength={MAX_LENGTH}
          disabled={full}
          placeholder={full ? `You've added ${MAX_EXTRAS} items` : placeholder}
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={add}
          disabled={full || !text.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {note && <p className="text-xs text-amber-700 mt-1">{note}</p>}
      {extras.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {extras.map((x) => (
            <span key={x} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-green-50 border border-green-200 text-sm text-green-800">
              {x}
              <button
                type="button"
                onClick={() => onChange(extras.filter((y) => y !== x))}
                aria-label={`Remove ${x}`}
                className="w-6 h-6 rounded-full hover:bg-green-100 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExtrasEditor;
