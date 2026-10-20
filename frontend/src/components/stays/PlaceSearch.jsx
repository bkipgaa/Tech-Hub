/**
 * PlaceSearch.jsx
 * ===============
 * What → County → Town → Estate search. County and town are required; the
 * type of place and the estate are optional. Towns and estates are the ones
 * listers have added.
 *
 *   <PlaceSearch value={{category, county, town, estate}} counts={{airbnb: 3, …}} onSearch={fn} />
 */

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import usePlaces from '../../hooks/usePlaces';
import { COUNTIES, LISTING_GROUPS } from '../../utils/listingCategories';

const selectClass =
  'w-full px-3 py-3 rounded-lg text-gray-800 bg-white outline-none focus:ring-2 focus:ring-green-300 disabled:bg-gray-100 disabled:text-gray-400';

const PlaceSearch = ({ value = {}, counts = {}, onSearch }) => {
  const [category, setCategory] = useState(value.category || '');
  const [county, setCounty] = useState(value.county || '');
  const [town, setTown] = useState(value.town || '');
  const [estate, setEstate] = useState(value.estate || '');

  const towns = usePlaces({ county });
  const estates = usePlaces({ county, town });

  const ready = county && town;

  const submit = (e) => {
    e.preventDefault();
    if (ready) onSearch({ category, county, town, estate });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto] gap-2">
      <label className="sr-only" htmlFor="ps-category">What are you looking for?</label>
      <select id="ps-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
        <option value="">Any type of place</option>
        {LISTING_GROUPS.map((g) => (
          <optgroup key={g.id} label={g.name}>
            {g.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{counts[c.id] != null ? ` (${counts[c.id]})` : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <label className="sr-only" htmlFor="ps-county">County</label>
      <select
        id="ps-county"
        value={county}
        onChange={(e) => { setCounty(e.target.value); setTown(''); setEstate(''); }}
        className={selectClass}
      >
        <option value="">County *</option>
        {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label className="sr-only" htmlFor="ps-town">Town</label>
      <select
        id="ps-town"
        value={town}
        onChange={(e) => { setTown(e.target.value); setEstate(''); }}
        disabled={!county || towns.loading}
        className={selectClass}
      >
        <option value="">
          {!county ? 'Town *' : towns.loading ? 'Loading towns…' : towns.items.length ? 'Town *' : 'No towns listed yet'}
        </option>
        {towns.items.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.count})</option>)}
      </select>

      <label className="sr-only" htmlFor="ps-estate">Estate (optional)</label>
      <select
        id="ps-estate"
        value={estate}
        onChange={(e) => setEstate(e.target.value)}
        disabled={!town || estates.loading || estates.items.length === 0}
        className={selectClass}
      >
        <option value="">
          {!town ? 'Estate (optional)' : estates.loading ? 'Loading estates…' : estates.items.length ? 'All estates' : 'No estates listed'}
        </option>
        {estates.items.map((x) => <option key={x.name} value={x.name}>{x.name} ({x.count})</option>)}
      </select>

      <button
        type="submit"
        disabled={!ready}
        title={ready ? 'Search' : 'Choose a county and a town'}
        className="px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
      >
        {towns.loading || estates.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        Search
      </button>
    </form>
  );
};

export default PlaceSearch;
