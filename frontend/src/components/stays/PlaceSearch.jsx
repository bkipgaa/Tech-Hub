/**
 * PlaceSearch.jsx
 * ===============
 * County → Town → Estate search. County and town are required; the estate is
 * optional. Towns and estates are the ones listers have added.
 *
 *   <PlaceSearch value={{county, town, estate}} onSearch={fn} />
 */

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import usePlaces from '../../hooks/usePlaces';
import { COUNTIES } from '../../utils/listingCategories';

const selectClass =
  'w-full px-3 py-3 rounded-lg text-gray-800 bg-white outline-none focus:ring-2 focus:ring-green-300 disabled:bg-gray-100 disabled:text-gray-400';

const PlaceSearch = ({ value = {}, onSearch }) => {
  const [county, setCounty] = useState(value.county || '');
  const [town, setTown] = useState(value.town || '');
  const [estate, setEstate] = useState(value.estate || '');

  const towns = usePlaces({ county });
  const estates = usePlaces({ county, town });

  const ready = county && town;

  const submit = (e) => {
    e.preventDefault();
    if (ready) onSearch({ county, town, estate });
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
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
