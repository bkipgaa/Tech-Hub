/**
 * useServiceBuckets
 * =================
 * The service buckets (Technical Services, Personal Care & Appearance, …) and
 * the main categories in each, from GET /service-catalog/buckets.
 * Loaded once per page load and shared by every component that asks.
 *
 * Returns { buckets, loading, error, retry, bucketOf }
 *   buckets: [{ id, name, description, technical, freeRadiusKm, categories: [{ name }] }]
 *   bucketOf(mainCategory) → the bucket holding it (or undefined)
 */

import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

let cached = null;   // buckets once loaded
let pending = null;  // the request in flight

const load = () => {
  if (!pending) {
    pending = api
      .get('/service-catalog/buckets')
      .then((r) => {
        cached = r.data?.data || [];
        return cached;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
};

const useServiceBuckets = () => {
  const [buckets, setBuckets] = useState(cached || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    load()
      .then((data) => alive && setBuckets(data))
      .catch(() => alive && setError('Could not load services. Check your connection and try again.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError('');
    setAttempt((n) => n + 1);
  }, []);

  const bucketOf = useCallback(
    (mainCategory) => buckets.find((b) => b.categories.some((c) => c.name === mainCategory)),
    [buckets]
  );

  return { buckets, loading, error, retry, bucketOf };
};

export default useServiceBuckets;
