'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { api, ApiError, type ApiOptions } from '@/lib/api';
import { LocationError } from '@/lib/location';
import { CheckoutError } from '@/lib/razorpay';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';
import enCommon from '@/i18n/messages/en/common';
import hiCommon from '@/i18n/messages/hi/common';
import enCustomer from '@/i18n/messages/en/customer';
import hiCustomer from '@/i18n/messages/hi/customer';

type State<T> = { key: string | null; nonce: number; data?: T; error?: string; status?: number };

/** Active UI language outside React (the root layout sets <html lang>). */
function documentLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/**
 * Human-friendly message from anything thrown by `api()`, checkout or
 * geolocation, in the visitor's language. Server (ApiError) messages are
 * shown as sent. Pass a translated `fallback` from the calling component.
 */
export function errorMessage(e: unknown, fallback?: string): string {
  const hi = documentLocale() === 'hi';
  const customer = hi ? hiCustomer : enCustomer;
  const generic = fallback ?? (hi ? hiCommon : enCommon)['state.error'];
  if (e instanceof ApiError) return e.message || generic;
  if (e instanceof CheckoutError) return customer[`error.checkout.${e.code}`];
  if (e instanceof LocationError) return customer[`location.error.${e.code}`];
  if (e instanceof TypeError) return customer['error.network'];
  if (e instanceof Error && e.message) return e.message;
  return generic;
}

/**
 * GET `path` (skipped while `path` is null). Re-fetches when path, query or
 * token change, or when `reload()` is called. Stale data is kept during a
 * reload of the same query, never shown for a different one.
 */
export function useApiQuery<T>(
  path: string | null,
  opts: { token?: string | null; query?: ApiOptions['query'] } = {},
) {
  const key = path ? JSON.stringify([path, opts.query ?? null, opts.token ?? null]) : null;
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State<T>>({ key: null, nonce: 0 });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const [p, q, t] = JSON.parse(key) as [string, ApiOptions['query'] | null, string | null];
    api<T>(p, { query: q ?? undefined, token: t })
      .then((data) => {
        if (!cancelled) setState({ key, nonce, data });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            key,
            nonce,
            error: errorMessage(e),
            status: e instanceof ApiError ? e.status : undefined,
          });
      });
    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const same = state.key === key;
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (data: T) => setState((s) => ({ ...s, data, error: undefined })),
    [],
  );

  return {
    data: same ? state.data : undefined,
    error: same && state.nonce === nonce ? state.error : undefined,
    status: same ? state.status : undefined,
    loading: !!key && (!same || state.nonce !== nonce),
    reload,
    setData,
  };
}

/** Current time, refreshed every `intervalMs`. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

const noopSubscribe = () => () => {};
/** False during SSR and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
