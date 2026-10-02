'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { homeFor } from '@/components/auth/safe-next';
import { useAuth } from './auth-context';
import type { Role } from './types';

/**
 * Redirects to /login (with a return path) when signed out, and to the
 * role's home page when the user's role is not allowed. Returns `ready` once the
 * current user may see the page.
 */
export function useRequireAuth(roles?: Role[]) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!auth.user && (!roles || roles.includes(auth.user.role));

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
    } else if (!allowed) {
      router.replace(homeFor(auth.user));
    }
  }, [auth.loading, auth.user, allowed, router, pathname]);

  return { ...auth, ready: !auth.loading && allowed };
}
