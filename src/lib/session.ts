/**
 * Browser session store.
 *
 * - The access token (short-lived JWT) lives only in memory, here.
 * - The refresh token is an httpOnly cookie (`ps_rt`, Path=/v1/auth) that
 *   JavaScript never sees; POST /auth/refresh rotates it and returns a new
 *   access token.
 * - Refreshes are single-flight within a tab and serialised across tabs with
 *   a Web Lock; a fresh token is shared with other tabs over a BroadcastChannel,
 *   which also carries sign-out to every tab.
 */
import type { AuthResponse, AuthUser } from './types';

/** Sent with cookie-authenticated auth POSTs; the API rejects them without it (CSRF guard). */
export const CSRF_HEADERS = { 'X-Requested-With': 'ps' } as const;

/** Cached profile for instant UI on reload. Never holds a token. */
export const PROFILE_KEY = 'puja_user';
/** Pre-refresh-token storage ({ user, token }); migrated and removed on load. */
export const LEGACY_KEY = 'puja_auth';

const CHANNEL = 'ps-auth';
const LOCK = 'ps-auth-refresh';
/** A token with less than this left is refreshed (proactively or when shared). */
const MIN_VALIDITY_MS = 60_000;

export type SessionChange =
  | { type: 'session'; token: string; user?: AuthUser }
  | { type: 'logout' };

type Listener = (change: SessionChange) => void;

let accessToken: string | null = null;
/** A refreshed session; `user` is absent when the token came from another tab. */
export type RefreshResult = { access_token: string; user?: AuthUser };

let inflight: Promise<RefreshResult | null> | null = null;
const listeners = new Set<Listener>();
let channel: BroadcastChannel | null | undefined;

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '/v1';
}

/** Milliseconds since epoch at which a JWT expires (0 if unreadable). */
export function tokenExpiry(token: string | null | undefined): number {
  if (!token) return 0;
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

function isFresh(token: string | null): token is string {
  return !!token && tokenExpiry(token) - Date.now() > MIN_VALIDITY_MS;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function getChannel(): BroadcastChannel | null {
  if (channel !== undefined) return channel;
  channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);
  channel?.addEventListener('message', (e: MessageEvent<SessionChange>) => {
    const msg = e.data;
    if (msg?.type === 'session' && typeof msg.token === 'string') {
      accessToken = msg.token;
      emit(msg);
    } else if (msg?.type === 'logout') {
      accessToken = null;
      emit(msg);
    }
  });
  return channel;
}

function emit(change: SessionChange) {
  listeners.forEach((l) => l(change));
}

/** Listen for token changes, from this tab or another. Returns an unsubscribe function. */
export function subscribeSession(listener: Listener): () => void {
  getChannel();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Store a new access token (and tell other tabs). */
export function setAccessToken(token: string, user?: AuthUser) {
  accessToken = token;
  const change: SessionChange = { type: 'session', token, user };
  emit(change);
  getChannel()?.postMessage(change);
}

/** Forget the session in every tab. Does not call the API. */
export function clearSession() {
  accessToken = null;
  const change: SessionChange = { type: 'logout' };
  emit(change);
  getChannel()?.postMessage(change);
}

/** Use a token without announcing it (e.g. a legacy token being migrated). */
export function adoptAccessToken(token: string) {
  accessToken = token;
}

export class RefreshNetworkError extends Error {}

async function callRefresh(): Promise<AuthResponse | null> {
  let res: Response;
  try {
    res = await fetch(`${apiBase()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { ...CSRF_HEADERS },
      cache: 'no-store',
    });
  } catch (e) {
    throw new RefreshNetworkError(String(e));
  }
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new RefreshNetworkError(`refresh failed: HTTP ${res.status}`);
  return (await res.json()) as AuthResponse;
}

/**
 * Get a new access token from the refresh cookie.
 * Resolves to the session, or null when there is no valid session (signed out
 * elsewhere, expired, revoked). Throws RefreshNetworkError when the API could
 * not be reached — the session may still be fine.
 */
export function refreshSession(): Promise<RefreshResult | null> {
  if (inflight) return inflight;
  const startedWith = accessToken;
  const run = async (): Promise<RefreshResult | null> => {
    // Another tab may have refreshed while we waited for the lock.
    if (accessToken !== startedWith && isFresh(accessToken)) {
      return { access_token: accessToken };
    }
    const session = await callRefresh();
    if (session) setAccessToken(session.access_token, session.user);
    return session;
  };
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  const locked: Promise<RefreshResult | null> = locks
    ? locks.request(LOCK, run).then((r) => r)
    : run();
  const p = locked.finally(() => {
    inflight = null;
  });
  inflight = p;
  return p;
}

/** POST /auth/logout (revokes this browser's refresh token, clears the cookie). */
export async function logoutRequest(): Promise<void> {
  try {
    await fetch(`${apiBase()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { ...CSRF_HEADERS },
      cache: 'no-store',
      keepalive: true,
    });
  } catch {
    /* offline: the cookie expires on its own; local state is cleared anyway */
  }
}

/** Milliseconds until this token should be refreshed proactively. */
export function refreshDelay(token: string): number {
  const exp = tokenExpiry(token);
  if (!exp) return -1;
  // Refresh a minute early (or at 80% of very short lifetimes), with jitter so tabs don't line up.
  const left = exp - Date.now();
  const lead = Math.min(MIN_VALIDITY_MS, left * 0.2);
  return Math.max(1_000, left - lead - Math.random() * 5_000);
}

export function readProfile(): AuthUser | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function writeProfile(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    else localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* storage unavailable (private mode): the in-memory session still works */
  }
}

type LegacySession = { user?: AuthUser; token?: string };
let legacySession: LegacySession | null | undefined;

/**
 * Read and delete the pre-refresh-token session ({ user, token }) if present.
 * Remembered for this page load, so a re-mounted provider still sees it.
 */
export function takeLegacySession(): LegacySession | null {
  if (legacySession !== undefined) return legacySession;
  legacySession = null;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    localStorage.removeItem(LEGACY_KEY);
    const parsed = JSON.parse(raw) as LegacySession;
    legacySession = parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    /* unreadable: treat as absent */
  }
  return legacySession;
}

/** True if a legacy token is still usable for at least a minute. */
export function isUsableToken(token: string | undefined): token is string {
  return !!token && isFresh(token);
}
