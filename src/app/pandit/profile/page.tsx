'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useT } from '@/i18n';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { PanditAvatar, VerifiedPill } from '@/components/common/pandit-avatar';
import { Rating } from '@/components/common/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { useApi } from '@/components/dashboard/use-api';
import { ProfileForm } from '@/components/pandit/profile-form';
import { KycCard } from '@/components/pandit/kyc-card';
import { PhotoPicker } from '@/components/common/photo-picker';
import type { PanditProfile } from '@/lib/types';
import { CircleAlert } from 'lucide-react';

export default function PanditProfilePage() {
  const { ready, user, token } = useRequireAuth(['pandit']);
  const profile = useApi<PanditProfile>(ready ? '/pandits/me/profile' : null, token);
  const p = profile.data;
  const t = useT('pandit');
  const tc = useT('common');

  return (
    <PageShell size="narrow">
      <PageHeader
        back={
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> {t('nav.dashboard')}
          </Link>
        }
        title={t('profile.title')}
        description={t('profile.desc')}
      />

      {!ready || profile.loading ? (
        <div className="grid gap-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : !p ? (
        <EmptyState
          icon={CircleAlert}
          title={t('profile.loadError')}
          action={<Button onClick={profile.reload}>{tc('action.retry')}</Button>}
        >
          {profile.error ?? t('profile.loadErrorBody')}
        </EmptyState>
      ) : (
        <div className="grid gap-6">
          <div className="flex items-center gap-4 rounded-2xl border bg-card p-5">
            <PanditAvatar name={user?.name} photo={user} verified={p.is_verified} size="lg" />
            <div className="min-w-0">
              <p className="font-heading text-2xl break-words text-heading">{user?.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Rating value={p.average_rating} count={Number(p.total_reviews) || 0} />
                {p.is_verified ? (
                  <VerifiedPill />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t(
                      p.verification_status === 'pending_review'
                        ? 'profile.status.pending'
                        : p.verification_status === 'rejected'
                          ? 'profile.status.rejected'
                          : 'profile.notVisible',
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div id="photo" className="scroll-mt-24">
            <PhotoPicker variant="pandit" />
          </div>

          <ProfileForm key={p.id} profile={p} token={token} onSaved={(u) => profile.mutate(() => u)} />

          <div id="kyc" className="scroll-mt-24">
            <KycCard profile={p} token={token} onVerified={(u) => profile.mutate(() => u)} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
