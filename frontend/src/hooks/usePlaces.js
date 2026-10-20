/**
 * usePlaces
 * =========
 * Towns in a county, or estates in a town, from /listings/places.
 * The lists come from listings themselves, so new towns and estates added by
 * listers appear automatically. scope 'all' includes listings not yet live
 * (used for suggestions in the listing form).
 */

import { useEffect, useState } from 'react';
import api from '../services/api';

const cache = new Map();

const usePlaces = ({ county, town, scope } = {}) => {
  const key = county ? `${scope || 'live'}|${county}|${town || ''}` : null;
  const [result, setResult] = useState({ key: null, items: [] });

  useEffect(() => {
    if (!key || cache.has(key)) return;
    let cancelled = false;
    api
      .get('/listings/places', { params: { county, town: town || undefined, scope } })
      .then((r) => {
        const items = (town ? r.data?.data?.estates : r.data?.data?.towns) || [];
        cache.set(key, items);
        if (!cancelled) setResult({ key, items });
      })
      .catch(() => !cancelled && setResult({ key, items: [] }));
    return () => { cancelled = true; };
  }, [key, county, town, scope]);

  if (key && cache.has(key)) return { items: cache.get(key), loading: false };
  return {
    items: result.key === key ? result.items : [],
    loading: !!key && result.key !== key,
  };
};

export default usePlaces;
