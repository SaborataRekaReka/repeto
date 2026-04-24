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

// Module-level SWR-style cache. Rapid param switches (e.g. calendar
// view toggles) should serve stale data instantly and dedupe real
// network calls so the global throttler is never tripped by bursts.
type CacheEntry = { data: unknown; ts: number };
const CACHE = new Map<string, CacheEntry>();
const INFLIGHT = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 20_000;
const DEBOUNCE_MS = 120;

function buildCacheKey(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return endpoint;
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return `${endpoint}?${entries.map(([k, v]) => `${k}=${v}`).join('&')}`;
}

async function fetchWithRetry<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> | undefined,
  signal: AbortSignal,
): Promise<T> {
  let attempt = 0;
  // Retry only on 429 with a short backoff so a transient throttle
  // doesn't wipe the UI. Aborts and other errors propagate immediately.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await api<T>(endpoint, { params, signal });
    } catch (err) {
      if (signal.aborted) throw err;
      const status = (err as ApiError)?.status;
      if (status !== 429 || attempt >= 3) throw err;
      const delay = 400 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      attempt += 1;
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, delay);
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(t);
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
      });
    }
  }
}

export function useApi<T>(
  endpoint: string | null,
  params?: Record<string, string | number | boolean | undefined>,
  options: UseApiOptions = {},
): UseApiResult<T> {
  const { skip = false, refreshInterval } = options;
  const cacheKey = endpoint ? buildCacheKey(endpoint, params) : '';
  const cached = cacheKey ? (CACHE.get(cacheKey)?.data as T | undefined) : undefined;

  const [data, setData] = useState<T | undefined>(cached);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState(!skip && !!endpoint && cached === undefined);
  const mountedRef = useRef(true);
  const dataRef = useRef<T | undefined>(cached);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doFetch = useCallback(
    async (isBackground: boolean) => {
      if (!endpoint || skip) return;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (!isBackground && dataRef.current === undefined) {
        setLoading(true);
      }
      setError(null);

      let p = INFLIGHT.get(cacheKey) as Promise<T> | undefined;
      if (!p) {
        p = fetchWithRetry<T>(endpoint, params, ctrl.signal).finally(() => {
          if (INFLIGHT.get(cacheKey) === (p as Promise<unknown>)) {
            INFLIGHT.delete(cacheKey);
          }
        });
        INFLIGHT.set(cacheKey, p as Promise<unknown>);
      }

      try {
        const result = await p;
        if (!mountedRef.current || ctrl.signal.aborted) return;
        CACHE.set(cacheKey, { data: result, ts: Date.now() });
        dataRef.current = result;
        setData(result);
        setError(null);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        if ((err as any)?.name === 'AbortError') return;
        if (!mountedRef.current) return;
        // Preserve last-known data on 429 so the schedule doesn't blank out.
        if ((err as ApiError)?.status !== 429 || dataRef.current === undefined) {
          setError(err as Error);
        }
      } finally {
        if (mountedRef.current && !ctrl.signal.aborted) {
          setLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, skip, cacheKey],
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!endpoint || skip) {
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const entry = CACHE.get(cacheKey);
    if (entry) {
      dataRef.current = entry.data as T;
      setData(entry.data as T);
      setLoading(false);
      const fresh = Date.now() - entry.ts < CACHE_TTL_MS;
      if (fresh) {
        return () => {
          mountedRef.current = false;
          abortRef.current?.abort();
        };
      }
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doFetch(entry !== undefined);
    }, DEBOUNCE_MS);

    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [cacheKey, endpoint, skip, doFetch]);

  useEffect(() => {
    if (!refreshInterval || skip || !endpoint) return;
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      doFetch(true);
    }, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, skip, endpoint, doFetch]);

  const mutate = useCallback(
    (newData?: T) => {
      if (newData !== undefined) {
        dataRef.current = newData;
        setData(newData);
        if (cacheKey) CACHE.set(cacheKey, { data: newData, ts: Date.now() });
      } else {
        if (cacheKey) CACHE.delete(cacheKey);
        doFetch(true);
      }
    },
    [doFetch, cacheKey],
  );

  const refetch = useCallback(async () => {
    if (cacheKey) CACHE.delete(cacheKey);
    await doFetch(true);
  }, [doFetch, cacheKey]);

  return { data, error, loading, mutate, refetch };
}

/**
 * Purge all cache entries whose key starts with `prefix`.
 * Call after mutations that affect a whole resource collection,
 * e.g. `invalidateByPrefix('/lessons')` after createLesson().
 */
export function invalidateByPrefix(prefix: string): void {
  for (const key of Array.from(CACHE.keys())) {
    if (key === prefix || key.startsWith(prefix + '?') || key.startsWith(prefix + '/')) {
      CACHE.delete(key);
    }
  }
}
