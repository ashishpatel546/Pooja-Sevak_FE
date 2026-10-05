'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useLocale } from '@/i18n/provider';
import type { Locale } from '@/i18n/config';
import { api, SESSION_EXPIRED_EVENT } from './api';
import {
  adoptAccessToken,
  clearSession,
  getAccessToken,
  isUsableToken,
  logoutRequest,
  PROFILE_KEY,
  readProfile,
  refreshDelay,
  refreshSession,
  RefreshNetworkError,
  setAccessToken,
  subscribeSession,
  takeLegacySession,
  writeProfile,
} from './session';
import { disablePush } from './push';
import type { AuthResponse, AuthUser, Role } from './types';

export type { Role, AuthUser } from './types';

type AuthState = {
  user: AuthUser | null;
  /** Short-lived access token, in memory only (renewed from the httpOnly refresh cookie). */
  token: string | null;
  /** True until the session has been restored (or found absent) on load. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (data: {
    name: string;
    email: string;
    mobile?: string;
    password: string;
    role?: Role;
    /** The user ticked "I agree to the Terms of Service and Privacy Policy". */
    accept_terms: boolean;
  }) => Promise<AuthUser>;
  /** Signs out this browser (all tabs) and revokes its refresh token. */
  logout: () => void;
  /**
   * Adopts a session. Pass a full AuthResponse (Google exchange, OTP verify,
   * password change) or just an access token, in which case the user is
   * fetched from /auth/me.
   */
  setSession: (session: string | AuthResponse) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
  /**
   * Switches the interface language and, when signed in, saves it as the
   * user's preferred_language (fire-and-forget).
   */
  changeLanguage: (next: Locale) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useLocale();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const forget = useCallback(() => {
    setUser(null);
    setToken(null);
    writeProfile(null);
  }, []);

  // Restore the session on load from the refresh cookie. A cached profile
  // keeps the signed-in UI on screen meanwhile (no flash of signed-out UI).
  useEffect(() => {
    const legacy = takeLegacySession();
    const cached = readProfile() ?? legacy?.user ?? null;
    if (!cached) {
      // Never signed in on this browser (or signed out): nothing to restore.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    setUser(cached);
    writeProfile(cached);
    let cancelled = false;
    refreshSession()
      .then(async (session) => {
        if (cancelled) return;
        if (session) {
          setToken(session.access_token);
          if (session.user) {
            setUser(session.user);
            writeProfile(session.user);
          }
          return;
        }
        // No refresh cookie: a session from before refresh tokens. Keep using
        // its token until it expires (then the user signs in again).
        if (legacy && isUsableToken(legacy.token)) {
          adoptAccessToken(legacy.token);
          const me = await api<AuthUser>('/auth/me', { token: legacy.token });
          if (cancelled) return;
          setToken(legacy.token);
          setUser(me);
          writeProfile(me);
          return;
        }
        forget();
      })
      .catch((e: unknown) => {
        // Offline / API down: keep the cached profile; requests retry the refresh later.
        if (!(e instanceof RefreshNetworkError) && !cancelled) forget();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [forget]);

  // Tokens renewed by api() retries, the proactive timer or another tab; sign-out from another tab.
  useEffect(
    () =>
      subscribeSession((change) => {
        if (change.type === 'logout') {
          forget();
          setLoading(false);
          return;
        }
        setToken(change.token);
        if (change.user) {
          setUser(change.user);
          writeProfile(change.user);
        }
        setLoading(false);
      }),
    [forget],
  );

  // Fallback for browsers without BroadcastChannel: another tab removed the profile.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_KEY && e.newValue === null && getAccessToken()) {
        clearSession();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [forget]);

  // The API rejected our token and the refresh cookie could not renew it.
  useEffect(() => {
    const onExpired = (e: Event) => {
      const expired = (e as CustomEvent<string>).detail;
      const current = getAccessToken();
      // Ignore stale responses for a token we have already replaced.
      if (current && current !== expired) return;
      clearSession();
      forget();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [forget]);

  // Renew the access token shortly before it expires.
  useEffect(() => {
    if (!token) return;
    const delay = refreshDelay(token);
    if (delay < 0) return;
    const timer = window.setTimeout(() => {
      refreshSession()
        .then((session) => {
          if (!session && getAccessToken() === token) {
            clearSession();
            forget();
          }
        })
        .catch(() => {
          /* offline: the next API call retries */
        });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [token, forget]);

  const adopt = useCallback((u: AuthUser, t: string) => {
    setAccessToken(t, u);
    setUser(u);
    setToken(t);
    writeProfile(u);
  }, []);

  /** After signing in, show the app in the language the user chose earlier. */
  const adoptLanguage = (u: AuthUser) => {
    if ((u.preferred_language === 'hi' || u.preferred_language === 'en') && u.preferred_language !== locale) {
      setLocale(u.preferred_language);
    }
  };

  const login: AuthState['login'] = async (email, password) => {
    const res = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    adopt(res.user, res.access_token);
    adoptLanguage(res.user);
    return res.user;
  };

  const signup: AuthState['signup'] = async (data) => {
    const res = await api<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: { ...data, preferred_language: locale },
    });
    adopt(res.user, res.access_token);
    return res.user;
  };

  const logout = () => {
    // Before the token is dropped: this browser must stop getting this account's pushes.
    void disablePush(token);
    void logoutRequest();
    clearSession();
    forget();
  };

  const setSession: AuthState['setSession'] = async (session) => {
    let me: AuthUser;
    let newToken: string;
    if (typeof session === 'string') {
      newToken = session;
      me = await api<AuthUser>('/auth/me', { token: newToken });
    } else {
      newToken = session.access_token;
      me = session.user;
    }
    adopt(me, newToken);
    adoptLanguage(me);
    return me;
  };

  const refreshUser: AuthState['refreshUser'] = async () => {
    if (!token) return;
    const me = await api<AuthUser>('/auth/me', { token });
    setUser(me);
    writeProfile(me);
  };

  const changeLanguage = useCallback(
    (next: Locale) => {
      setLocale(next);
      if (!token || user?.preferred_language === next) return;
      api<AuthUser>('/users/me', { method: 'PUT', token, body: { preferred_language: next } })
        .then((me) => {
          setUser(me);
          writeProfile(me);
        })
        .catch(() => {
          /* the cookie already holds the choice; the profile catches up next time */
        });
    },
    [setLocale, token, user?.preferred_language],
  );

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, setSession, refreshUser, changeLanguage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
