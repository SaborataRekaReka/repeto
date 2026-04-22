import { useState, useEffect, useCallback, useRef } from 'react';
import { api, type ApiError } from '@/lib/api';

type UseApiOptions = {
  /** Skip fetching (e.g. when params are not ready) */
  skip?: boolean;
  /** Refetch interval in ms */
  refreshInterval?: number;
};

type UseApiResult<T> = {
  data: T | undefined;
  error: ApiError | Error | null;
  loading: boolean;
  mutate: (data?: T) => void;
  refetch: () => Promise<void>;
};

export function useApi<T>(
  endpoint: string | null,
  params?: Record<string, string | number | boolean | undefined>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { skip = false, refreshInterval } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(!skip && !!endpoint);
  const mountedRef = useRef(true);
  const dataRef = useRef<T | undefined>(undefined);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!endpoint || skip) return;
    if (!isBackground || dataRef.current === undefined) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await api<T>(endpoint, { params });
      if (mountedRef.current) {
        dataRef.current = result;
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, skip, JSON.stringify(params)]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    if (!refreshInterval || skip || !endpoint) return;
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData(true);
    }, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, skip, endpoint, fetchData]);

  const mutate = useCallback((newData?: T) => {
    if (newData !== undefined) {
      dataRef.current = newData;
      setData(newData);
    } else fetchData();
  }, [fetchData]);

  return { data, error, loading, mutate, refetch: () => fetchData() };
}
