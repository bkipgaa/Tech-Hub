/**
 * RelatedBusinesses.jsx
 * =====================
 * On a service page: the business groups that go with it (Plumbing →
 * Hardware & Building Supplies…) as links, and a few of those businesses,
 * nearest first when the visitor's location is known.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import ListingCard from './ListingCard';
import { groupIcon } from './groupIcons';

const NEARBY_KM = 50;

const RelatedBusinesses = ({ groups, location, subject }) => {
  const ids = groups.map((g) => g.id).join(',');
  const lat = location?.lat;
  const lng = location?.lng;
  const key = `${ids}@${lat ?? ''},${lng ?? ''}`;
  const [result, setResult] = useState({ key: null, items: [] });

  useEffect(() => {
    if (!ids) return undefined;
    let cancelled = false;
    const params = { groups: ids, limit: 4, ...(lat != null && { lat, lng, maxKm: NEARBY_KM }) };
    api
      .get('/listings', { params })
      .then((r) => !cancelled && setResult({ key, items: r.data?.data || [] }))
      .catch(() => !cancelled && setResult({ key, items: [] }));
    return () => { cancelled = true; };
  }, [ids, key, lat, lng]);

  if (!groups.length) return null;
  const items = result.key === key ? result.items : [];

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Store className="w-5 h-5 text-green-600" /> Businesses for {subject}
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        Shops and places that go with these services{location ? ', nearest first' : ''}.
      </p>
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <Link
            key={g.id}
            to={`/businesses?group=${g.id}${location ? '&near=1' : ''}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-gray-200 bg-white text-gray-700 hover:bg-green-50 hover:border-green-500 hover:text-green-800"
          >
            {React.createElement(groupIcon(g.id), { className: 'w-4 h-4 text-green-600' })}
            {g.name}
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          </Link>
        ))}
      </div>
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {items.map((l) => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}
    </section>
  );
};

export default RelatedBusinesses;
