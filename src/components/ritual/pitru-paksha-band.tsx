'use client';

import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { useFormat } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import type { Observance } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Diya } from '@/components/brand/diya';
import { Button } from '@/components/ui/button';
import { PITRU_PAKSHA_SLUG, signedInHref } from './observance';
import { useDays } from './use-days';
import { usePanchangText } from './use-panchang-text';

/**
 * Seasonal band shown while Pitru Paksha is in force. `full` explains the
 * fortnight and shraddh (panchang page); `compact` is a single invitation (home).
 */
export function PitruPakshaBand({
  observance,
  variant = 'full',
  className,
  tz,
}: {
  observance: Observance;
  variant?: 'full' | 'compact';
  className?: string;
  /** Zone of the place the dates are for (IST by default). */
  tz?: string;
}) {
  const f = useFormat();
  const { t, locale } = usePanchangText();
  const { user } = useAuth();
  const end = observance.end_date ?? observance.date;
  const days = useDays(tz);
  const left = Math.max(0, days.until(end));
  const range = t('pitru.range', {
    from: f.dateKey(observance.date, { weekday: undefined, year: undefined, month: 'long' }),
    to: f.dateKey(end, { weekday: undefined, year: undefined, month: 'long' }),
  });
  const remaining = left === 0 ? t('pitru.endsToday') : t.plural('pitru.endsIn', left);
  const hi = locale === 'hi';

  return (
    <section
      aria-labelledby="pitru-title"
      className={cn('relative overflow-hidden rounded-2xl border border-diya/30 bg-chandan', className)}
    >
      <div className="toran" aria-hidden="true" />
      <div
        className={cn(
          'grid grid-cols-1 gap-6 p-5 sm:p-8',
          variant === 'full' && 'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10',
        )}
      >
        <div className="flex min-w-0 items-start gap-4">
          <Diya className="mt-1 size-12 shrink-0 sm:size-14" />
          <div className="min-w-0">
            <h2
              id="pitru-title"
              className={cn('text-2xl sm:text-3xl', hi ? 'leading-[1.35]' : 'leading-tight')}
            >
              {t('pitru.title')}
            </h2>
            <p className="mt-1 text-sm font-medium text-sindoor">
              {range} · {remaining}
            </p>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {variant === 'full' ? t('pitru.what') : t('pitru.invite')}
            </p>
            {variant === 'compact' && (
              <BandActions userSignedIn={!!user} className="mt-5" />
            )}
          </div>
        </div>

        {variant === 'full' && (
          <div className="min-w-0 border-t border-diya/25 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <h3 className="font-sans text-base font-semibold text-foreground">{t('pitru.whyTitle')}</h3>
            <p className="mt-2 text-muted-foreground">{t('pitru.why')}</p>
            <p className="mt-3 text-muted-foreground">{t('pitru.sarva')}</p>
            <BandActions userSignedIn={!!user} className="mt-6" />
          </div>
        )}
      </div>
    </section>
  );
}

function BandActions({ userSignedIn, className }: { userSignedIn: boolean; className?: string }) {
  const { t } = usePanchangText();
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap', className)}>
      <Button size="lg" render={<Link href={`/pujas/${PITRU_PAKSHA_SLUG}`} />} nativeButton={false}>
        {t('pitru.bookShraddh')}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="bg-card"
        render={<Link href={signedInHref('/reminders?tab=loved-ones', userSignedIn)} />}
        nativeButton={false}
      >
        <HeartHandshake aria-hidden="true" />
        {t('pitru.remember')}
      </Button>
    </div>
  );
}
