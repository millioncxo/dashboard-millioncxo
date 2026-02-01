'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api-client';

/**
 * Robust fetch hook: runs fetcher on mount, handles loading/error, supports retry.
 * Use for initial page data load so loading never gets stuck and errors are handled.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    cancelled.current = false;
    try {
      const result = await fetcher();
      if (!cancelled.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (!cancelled.current) {
        setError(err instanceof ApiError ? err.message : (err as Error).message || 'Request failed');
        setData(null);
      }
    } finally {
      if (!cancelled.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps from caller
  }, [fetcher, ...deps]);

  useEffect(() => {
    run();
    return () => {
      cancelled.current = true;
    };
  }, [run]);

  const retry = useCallback(() => {
    run();
  }, [run]);

  return { data, loading, error, retry };
}
