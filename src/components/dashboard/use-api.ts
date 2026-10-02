'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';

/** Generic fallback in the page's language (this helper has no hook access). */
function genericError(): string {
  const lang = typeof document === 'undefined' ? 'hi' : document.documentElement.lang;
  return lang === 'en'
    ? 'Something went wrong. Please try again.'
    : 'कुछ गड़बड़ हो गई। कृपया फिर से प्रयास करें।';
}

/** Human-readable message from anything thrown by `api()` (which already localises its errors). */
export function errorMessage(e: unknown, fallback: string = genericError()): string {
  if (e instanceof ApiError) return e.message || fallback;
  if (e instanceof Error) return e.message || fallback;
  return fallback;
}

type Result<T> = { key: string; data: T | null; error: string | null };

/**
 * Fetch a GET endpoint once `path` and `token` are available.
 * - `loading` is true until the first response for the current key arrives.
 * - `reload()` refetches while keeping the last data on screen.
 * - `mutate(fn)` updates the cached data locally (optimistic updates).
 */
export function useApi<T>(path: string | null, token: string | null | undefined) {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const baseKey = path && token ? path : null;
  const key = baseKey ? `${baseKey}#${nonce}` : null;

  useEffect(() => {
    if (!key || !path || !token) return;
    let cancelled = false;
    api<T>(path, { token }).then(
      (data) => {
        if (!cancelled) setResult({ key, data, error: null });
      },
      (e) => {
        if (!cancelled) setResult((prev) => ({ key, data: prev?.data ?? null, error: errorMessage(e) }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, path, token]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const mutate = useCallback(
    (fn: (prev: T | null) => T | null) =>
      setResult((prev) => (prev ? { ...prev, data: fn(prev.data) } : prev)),
    [],
  );

  const sameBase = !!result && !!baseKey && result.key.startsWith(baseKey + '#');
  return {
    data: sameBase ? result!.data : null,
    error: result?.key === key ? result.error : null,
    loading: !!key && !sameBase,
    refreshing: !!key && sameBase && result!.key !== key,
    reload,
    mutate,
  };
}
