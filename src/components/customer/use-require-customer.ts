'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * Like `useRequireAuth(['customer'])`, but the return path keeps the query
 * string (e.g. the chosen service on the booking page). Signed-in users with
 * another role get `wrongRole` instead of a redirect so the page can explain.
 */
export function useRequireCustomer() {
  const auth = useAuth();
  const router = useRouter();
  const signedOut = !auth.loading && !auth.user;

  useEffect(() => {
    if (!signedOut) return;
    const here = window.location.pathname + window.location.search;
    router.replace(`/login?next=${encodeURIComponent(here)}`);
  }, [signedOut, router]);

  return {
    ...auth,
    ready: !auth.loading && auth.user?.role === 'customer',
    wrongRole: !auth.loading && !!auth.user && auth.user.role !== 'customer',
  };
}
