'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link2Off } from 'lucide-react';
import { useT } from '@/i18n';
import { api, API_URL, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AuthResponse, AuthUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AartiFrame } from '@/components/brand/aarti-frame';
import { AuthStatus } from '@/components/auth/auth-status';
import { DiyaLoader } from '@/components/common/loading';
import { AuthLoader } from '@/components/auth/auth-loader';
import { GoogleMark } from '@/components/auth/auth-shell';
import { destinationAfterAuth } from '@/components/auth/safe-next';
import { toast } from 'sonner';

/** The role comes from the stored account; `next` is honoured only if that role may see it. */
function destinationFor(user: AuthUser, next: string | null) {
  const dest = destinationAfterAuth(user, next);
  if (user.role === 'admin' || user.mobile_verified) return dest;
  return `/verify-mobile?next=${encodeURIComponent(dest)}`;
}

function AuthCallbackContent() {
  const t = useT('auth');
  const router = useRouter();
  const params = useSearchParams();
  const { setSession } = useAuth();
  const handled = useRef(false);
  const code = params.get('code');
  const legacyToken = params.get('token');
  const next = params.get('next');
  // Set when the person picked one account type but this email already has the other.
  const roleNote = params.get('role_note') === '1';
  const hasCredential = !!(code || legacyToken) && !params.get('error');
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current || !hasCredential) return;
    handled.current = true;

    const session: Promise<AuthUser> = code
      ? api<AuthResponse>('/auth/google/exchange', { method: 'POST', body: { code } }).then((res) => setSession(res))
      : setSession(legacyToken!);

    session.then(
      (user) => {
        if (roleNote) {
          toast.info(t(user.role === 'pandit' ? 'callback.roleNote.pandit' : 'callback.roleNote.customer'), {
            duration: 8000,
          });
        }
        router.replace(destinationFor(user, next));
      },
      (e) => {
        // Network trouble and rate limits get their own message; anything else
        // means the one-time code was missing, expired or already used.
        setFailure(e instanceof ApiError && e.code !== 'http' ? e.message : t('callback.failedBody'));
      },
    );
  }, [code, legacyToken, next, roleNote, hasCredential, router, setSession, t]);

  if (hasCredential && !failure) return <DiyaLoader label={t('callback.loading')} />;

  return (
    <AartiFrame innerClassName="p-6 sm:p-8">
      <AuthStatus
        icon={Link2Off}
        tone="warning"
        title={t('callback.failedTitle')}
        actions={
          <>
            <Button size="lg" variant="outline" render={<a href={`${API_URL}/auth/google`} />} nativeButton={false}>
              <GoogleMark />
              {t('callback.retryGoogle')}
            </Button>
            <Button size="lg" variant="ghost" render={<Link href="/login" />} nativeButton={false}>
              {t('callback.useEmail')}
            </Button>
          </>
        }
      >
        {failure ?? t('callback.failedBody')}
      </AuthStatus>
    </AartiFrame>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center px-4 py-10">
      <div className="w-full">
        <Suspense fallback={<AuthLoader />}>
          <AuthCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
