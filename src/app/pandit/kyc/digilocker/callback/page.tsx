'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, UserRoundPen } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useRequireAuth } from '@/lib/use-require-auth';
import type { PanditProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AartiFrame } from '@/components/brand/aarti-frame';
import { AuthStatus } from '@/components/auth/auth-status';
import { DiyaLoader } from '@/components/common/loading';
import { digilockerErrorKey, startDigilocker } from '@/components/pandit/kyc-card';

type FailureKey = ReturnType<typeof digilockerErrorKey> | 'kyc.dl.err.denied' | 'kyc.dl.mismatch.declined';
type Mismatch = { aadhaar: string; profile: string };

/** The names from a `name_mismatch` answer, if that is what it was. */
function mismatchOf(e: unknown): Mismatch | null {
  if (!(e instanceof ApiError)) return null;
  const p = e.payload as { code?: unknown; kyc_name?: unknown; profile_name?: unknown } | null;
  if (p?.code !== 'name_mismatch' || typeof p.kyc_name !== 'string') return null;
  return { aadhaar: p.kyc_name, profile: typeof p.profile_name === 'string' ? p.profile_name : '' };
}

/** DigiLocker sends the pandit back here with `code` + `state` (or `error`). */
function DigilockerCallbackContent() {
  const t = useT('pandit');
  const router = useRouter();
  const params = useSearchParams();
  const { ready, token } = useRequireAuth(['pandit']);
  const { refreshUser } = useAuth();
  const handled = useRef(false);
  const code = params.get('code');
  const state = params.get('state');
  const [failure, setFailure] = useState<FailureKey | null>(
    params.get('error') ? 'kyc.dl.err.denied' : !code || !state ? 'kyc.dl.err.invalid_state' : null,
  );
  const [retrying, setRetrying] = useState(false);
  const [mismatch, setMismatch] = useState<Mismatch | null>(null);
  const [accepting, setAccepting] = useState(false);

  const done = (profile: PanditProfile) => {
    toast.success(t(profile.verification_status === 'approved' ? 'kyc.dl.cb.updated' : 'kyc.dl.cb.success'), {
      duration: 8000,
    });
    router.replace('/pandit/profile#kyc');
  };

  useEffect(() => {
    if (handled.current || !ready || failure || !code || !state) return;
    handled.current = true;
    api<PanditProfile>('/pandits/me/kyc/digilocker/complete', {
      method: 'POST',
      token,
      body: { code, state },
    }).then(done, (e) => {
      const names = mismatchOf(e);
      if (names) setMismatch(names);
      else setFailure(digilockerErrorKey(e));
    });
    // `done` only reads router/t, which are already dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, code, state, failure, router, t]);

  const acceptAadhaarName = async () => {
    setAccepting(true);
    try {
      const profile = await api<PanditProfile>('/pandits/me/kyc/digilocker/accept-aadhaar-name', {
        method: 'POST',
        token,
        body: { state },
      });
      await refreshUser().catch(() => undefined); // header shows the new name
      done(profile);
    } catch (e) {
      setMismatch(null);
      setFailure(digilockerErrorKey(e));
    }
  };

  if (mismatch && !failure) {
    return (
      <AartiFrame innerClassName="p-6 sm:p-8">
        <AuthStatus
          icon={UserRoundPen}
          tone="warning"
          title={t('kyc.dl.mismatch.title')}
          actions={
            <>
              <Button size="lg" onClick={acceptAadhaarName} disabled={accepting}>
                {accepting ? t('kyc.dl.mismatch.saving') : t('kyc.dl.mismatch.yes')}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                disabled={accepting}
                onClick={() => {
                  setMismatch(null);
                  setFailure('kyc.dl.mismatch.declined');
                }}
              >
                {t('kyc.dl.mismatch.no')}
              </Button>
            </>
          }
        >
          <p>{t('kyc.dl.mismatch.body', mismatch)}</p>
          <p className="mt-3 font-medium text-foreground">{t('kyc.dl.mismatch.question', mismatch)}</p>
        </AuthStatus>
      </AartiFrame>
    );
  }

  if (!failure) return <DiyaLoader label={t('kyc.dl.cb.loading')} />;

  const retry = async () => {
    setRetrying(true);
    try {
      await startDigilocker(token);
    } catch (e) {
      setFailure(digilockerErrorKey(e));
      setRetrying(false);
    }
  };
  // Retrying cannot help when the account is linked elsewhere.
  const canRetry = failure !== 'kyc.dl.err.already_linked';

  return (
    <AartiFrame innerClassName="p-6 sm:p-8">
      <AuthStatus
        icon={ShieldAlert}
        tone="warning"
        title={t('kyc.dl.cb.failedTitle')}
        actions={
          <>
            {canRetry && ready && (
              <Button size="lg" onClick={retry} disabled={retrying}>
                {retrying ? t('kyc.dl.redirecting') : t('kyc.dl.cb.tryAgain')}
              </Button>
            )}
            <Button size="lg" variant="ghost" render={<Link href="/pandit/profile#kyc" />} nativeButton={false}>
              {t('kyc.dl.cb.back')}
            </Button>
          </>
        }
      >
        {t(failure)}
      </AuthStatus>
    </AartiFrame>
  );
}

export default function DigilockerCallbackPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center px-4 py-10">
      <div className="w-full">
        <Suspense fallback={<DiyaLoader />}>
          <DigilockerCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
