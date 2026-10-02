'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Hourglass, MessageSquareWarning } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { PanditProfile, PanditServiceItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/components/dashboard/use-api';
import { lighterListMissing } from '@/lib/samagri';

/** `optional` steps are recommendations: they never count towards progress or block resubmission. */
export type SetupStep = {
  key: 'about' | 'services' | 'lists' | 'kyc' | 'photo';
  done: boolean;
  href: string;
  optional?: boolean;
};

export function setupSteps(profile: PanditProfile, services: PanditServiceItem[], hasPhoto = false): SetupStep[] {
  const c = profile.home_coordinates;
  const hasLocation = !!c && (Number(c.lat) !== 0 || Number(c.lng) !== 0);
  // Pujas added before lists became mandatory may still lack one.
  const missingLists = services.some((sv) => !sv.samagri_list || lighterListMissing(sv));
  const steps: SetupStep[] = [
    {
      key: 'about',
      done: !!profile.bio?.trim() && !!profile.city?.trim() && hasLocation,
      href: '/pandit/profile',
    },
    {
      key: 'services',
      done: services.some((sv) => sv.is_active),
      href: '/pandit/services',
    },
    ...(missingLists ? [{ key: 'lists' as const, done: false, href: '/pandit/services' }] : []),
    {
      key: 'kyc',
      done: !!profile.kyc_submitted_at,
      href: '/pandit/profile#kyc',
    },
    {
      key: 'photo',
      done: hasPhoto,
      href: '/pandit/profile#photo',
      optional: true,
    },
  ];
  return steps;
}

/**
 * Onboarding card for pandits who are not live yet. Driven by the admin review
 * status: steps to finish → under review → (rejected) reason + resubmit.
 */
export function SetupChecklist({
  steps,
  profile,
  token,
  onUpdated,
}: {
  steps: SetupStep[];
  profile: PanditProfile;
  token: string | null;
  onUpdated: (p: PanditProfile) => void;
}) {
  const t = useT('pandit');
  const [busy, setBusy] = useState(false);
  const status = profile.verification_status;
  const required = steps.filter((s) => !s.optional);
  const done = required.filter((s) => s.done).length;
  const allDone = done === required.length;

  if (status === 'pending_review') {
    return (
      <section
        aria-labelledby="setup-heading"
        className="flex gap-4 rounded-2xl border border-diya/40 bg-card p-5 shadow-[0_18px_40px_-30px_rgb(42_31_74/0.5)] sm:p-7"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-diya/15 text-foreground" aria-hidden="true">
          <Hourglass className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="setup-heading" className="text-2xl leading-tight">
            {t('setup.pending.title')}
          </h2>
          <p className="mt-1 text-muted-foreground">{t('setup.pending.desc')}</p>
        </div>
      </section>
    );
  }

  const rejected = status === 'rejected';

  const resubmit = async () => {
    if (!allDone) {
      toast.error(t('setup.resubmitIncomplete'));
      return;
    }
    setBusy(true);
    try {
      onUpdated(await api<PanditProfile>('/pandits/me/verification/resubmit', { method: 'POST', token }));
      toast.success(t('setup.resubmitted'));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="setup-heading"
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-[0_18px_40px_-30px_rgb(42_31_74/0.5)] sm:p-7',
        rejected ? 'border-destructive/40' : 'border-diya/40',
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 id="setup-heading" className="text-2xl leading-tight">
            {rejected ? t('setup.rejected.title') : t('setup.title.todo')}
          </h2>
          <p className="mt-1 text-muted-foreground">{rejected ? t('setup.rejected.desc') : t('setup.desc.todo')}</p>
        </div>
        {!rejected && (
          <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {t('setup.progress', { done, total: required.length })}
          </p>
        )}
      </div>
      {rejected && profile.verification_note && (
        <div className="mt-4 flex gap-3 rounded-xl bg-destructive/5 p-4" role="note">
          <MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{t('setup.rejected.note')}</p>
            <p className="mt-0.5 break-words whitespace-pre-line">{profile.verification_note}</p>
          </div>
        </div>
      )}
      {!rejected && (
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={t('setup.progressLabel')}
          aria-valuemin={0}
          aria-valuemax={required.length}
          aria-valuenow={done}
        >
          <div className="h-full rounded-full bg-diya transition-[width]" style={{ width: `${(done / required.length) * 100}%` }} />
        </div>
      )}
      <ol className="mt-5 grid gap-3">
        {steps.map((s, i) => {
          // After a rejection every step stays editable, whatever its state.
          const showCta = !s.done || rejected;
          return (
            <li
              key={s.key}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center',
                s.done ? 'bg-muted/40' : 'bg-background',
              )}
            >
              <span
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-full text-sm font-medium',
                  s.done ? 'bg-tulsi text-white' : 'bg-accent text-accent-foreground ring-1 ring-diya/40',
                )}
                aria-hidden="true"
              >
                {s.done ? <Check className="size-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('font-medium', s.done && !rejected && 'text-muted-foreground line-through decoration-1')}>
                  {t(`setup.${s.key}.label`)}
                  <span className="sr-only"> {s.done ? t('setup.stepDone') : t('setup.stepTodo')}</span>
                </p>
                {!s.done && <p className="text-sm text-muted-foreground">{t(`setup.${s.key}.detail`)}</p>}
              </div>
              {showCta && (
                <Button
                  variant="outline"
                  render={<Link href={s.href} />}
                  nativeButton={false}
                  className="shrink-0 self-start sm:self-auto"
                >
                  {t(`setup.${s.key}.cta`)} <ArrowRight aria-hidden="true" />
                </Button>
              )}
            </li>
          );
        })}
      </ol>
      {rejected && (
        <div className="mt-5">
          <Button size="lg" onClick={resubmit} disabled={busy} aria-busy={busy} className="w-full sm:w-auto">
            {busy ? t('setup.resubmitting') : t('setup.resubmit')}
          </Button>
        </div>
      )}
    </section>
  );
}
