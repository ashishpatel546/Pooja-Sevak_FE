'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, Smartphone } from 'lucide-react';
import { useT } from '@/i18n';
import { useRequireAuth } from '@/lib/use-require-auth';
import type { AuthUser } from '@/lib/types';
import { PageShell } from '@/components/common/page-header';
import { AuthLoader } from '@/components/auth/auth-loader';
import { AartiFrame } from '@/components/brand/aarti-frame';
import { safeNext } from '@/components/auth/safe-next';
import { MobileVerifier } from '@/components/auth/verification';

export default function VerifyMobilePage() {
  return (
    <Suspense fallback={<AuthLoader />}>
      <VerifyMobile />
    </Suspense>
  );
}

function VerifyMobile() {
  const { ready, user } = useRequireAuth();
  if (!ready || !user) return <AuthLoader />;
  return <VerifyMobileForm user={user} />;
}

function VerifyMobileForm({ user }: { user: AuthUser }) {
  const t = useT('auth');
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next')) ?? '/dashboard';

  return (
    <PageShell size="narrow" className="max-w-lg">
      <AartiFrame innerClassName="p-6 sm:p-8">
        <span className="mb-5 grid size-12 place-items-center rounded-full bg-accent text-accent-foreground ring-1 ring-diya/40">
          <Smartphone className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-3xl leading-snug">{t('mobile.title')}</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">{t('mobile.intro')}</p>

        {user.mobile_verified && user.mobile && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-tulsi/10 px-3 py-2 text-sm text-tulsi">
            <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
            {t('mobile.alreadyVerified', { mobile: user.mobile })}
          </p>
        )}

        <div className="mt-6">
          <MobileVerifier idPrefix="verify" autoFocus onVerified={() => router.replace(next)} />
        </div>
      </AartiFrame>
    </PageShell>
  );
}
