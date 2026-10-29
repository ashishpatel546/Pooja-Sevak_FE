'use client';

import { useEffect, useRef } from 'react';
import { api, ApiError } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useAuth } from '@/lib/auth-context';
import { clearRef, readRef, storeRef } from '@/lib/referral';

/**
 * Remembers `?ref=CODE` from any page for 30 days, and once a customer is
 * signed in (email, Google or any other way) asks the server to attach it.
 * The server only accepts brand-new accounts, so older ones just clear it.
 */
export function RefCapture() {
  const { user, token } = useAuth();
  const tried = useRef(false);

  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) storeRef(ref);
    } catch {
      // ignore malformed URLs
    }
  }, []);

  useEffect(() => {
    if (!user || !token || tried.current) return;
    const code = readRef();
    if (!code) return;
    tried.current = true;
    if (user.role !== 'customer') {
      clearRef();
      return;
    }
    api<{ applied: boolean }>('/referrals/claim', { method: 'POST', token, body: { code } })
      .then((res) => {
        clearRef();
        if (res?.applied) track('referral_signup', { source: 'referral' });
      })
      .catch((e: unknown) => {
        // Keep it for a retry only when the request never got an answer.
        if (e instanceof ApiError && e.code !== 'network') clearRef();
      });
  }, [user, token]);

  return null;
}
