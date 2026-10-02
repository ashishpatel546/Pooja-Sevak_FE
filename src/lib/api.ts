import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from '@/i18n/config';
import enErrors from '@/i18n/messages/en/errors';
import hiErrors from '@/i18n/messages/hi/errors';
import { CSRF_HEADERS, getAccessToken, refreshSession, RefreshNetworkError } from './session';

/**
 * Public API base used by the browser and in links (e.g. Google sign-in).
 * '/v1' keeps every call same-origin: next.config.ts proxies it to the backend,
 * so the site works unchanged on localhost, a LAN IP or a tunnel hostname.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/v1';

/** API base reachable from the Next.js server itself (relative URLs don't work there). */
export function serverApiBase(): string {
  if (process.env.API_INTERNAL_URL) return process.env.API_INTERNAL_URL.replace(/\/$/, '');
  return /^https?:\/\//.test(API_URL) ? API_URL : 'http://localhost:6001/v1';
}

function apiBase(): string {
  return typeof window === 'undefined' ? serverApiBase() : API_URL;
}

export type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  /** Internal: set on the single retry after a token refresh. */
  retried?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
};

/**
 * Machine-readable reason, so callers can branch without parsing messages.
 * - `network`: the request never reached the API (offline, DNS, CORS, server down) — status 0.
 * - `rate_limited`: HTTP 429.
 * - `server`: HTTP 5xx.
 * - `http`: any other non-2xx response; `message` is the API's own message.
 */
export type ApiErrorCode = 'network' | 'rate_limited' | 'server' | 'http';

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: unknown,
    message: string,
    public code: ApiErrorCode = 'http',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The visitor's language, read from the locale cookie (api() has no hook access). */
function currentLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1] ?? document.documentElement.lang;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

function friendly(key: keyof typeof enErrors): string {
  return (currentLocale() === 'en' ? enErrors : hiErrors)[key];
}

/**
 * Fired on window when the API rejects the token a request was sent with and
 * the session could not be renewed from the refresh cookie.
 */
export const SESSION_EXPIRED_EVENT = 'ps:session-expired';

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const url = new URL(
    apiBase() + path,
    typeof window === 'undefined' ? undefined : window.location.origin,
  );
  if (opts.query) {
    Object.entries(opts.query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  // FormData (file uploads) is sent as multipart; the browser sets the boundary.
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...CSRF_HEADERS,
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? 'GET',
      headers,
      body: isForm ? (opts.body as FormData) : opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
      // Lets /auth/* calls send and receive the httpOnly refresh cookie.
      credentials: 'include',
    });
  } catch (e) {
    throw new ApiError(0, e, friendly('api.network'), 'network');
  }

  let text = '';
  try {
    text = await res.text();
  } catch (e) {
    throw new ApiError(0, e, friendly('api.network'), 'network');
  }
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text; // e.g. an HTML error page from a proxy
    }
  }

  if (!res.ok) {
    // A rejected bearer token: usually just an expired access token. Renew it
    // from the refresh cookie (one shared refresh) and retry once. If the
    // session itself is over (revoked, password changed, account suspended),
    // let AuthProvider sign out.
    if (res.status === 401 && opts.token && !opts.retried && typeof window !== 'undefined') {
      let next: string | null = null;
      let networkTrouble = false;
      const current = getAccessToken();
      if (current && current !== opts.token) {
        next = current; // already renewed by another request or tab
      } else {
        try {
          next = (await refreshSession())?.access_token ?? null;
        } catch (e) {
          networkTrouble = e instanceof RefreshNetworkError;
        }
      }
      if (next) return api<T>(path, { ...opts, token: next, retried: true });
      if (!networkTrouble) {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: opts.token }));
      }
    } else if (res.status === 401 && opts.token && opts.retried && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: opts.token }));
    }
    if (res.status === 429) throw new ApiError(429, payload, friendly('api.rateLimited'), 'rate_limited');
    const body = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    const raw = body ? body.message ?? body.error : null;
    const apiMsg = Array.isArray(raw) ? raw.join(', ') : typeof raw === 'string' ? raw : '';
    if (res.status >= 500) {
      throw new ApiError(res.status, payload, friendly('api.server'), 'server');
    }
    throw new ApiError(res.status, payload, apiMsg || friendly('api.generic'), 'http');
  }
  return payload as T;
}
