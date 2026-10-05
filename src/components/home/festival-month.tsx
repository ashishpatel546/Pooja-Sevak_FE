'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useFormat, useLocale, useT } from '@/i18n';
import type { Observance } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FestivalCard } from '@/components/ritual/festival-calendar';
import { observanceId, type PujaNames } from '@/components/ritual/observance';

/**
 * This month's festivals on the home page (or, in a month without any, the
 * next few), leading to the Festivals tab of /panchang.
 */
export function FestivalMonth({
  items,
  mode,
  month,
  place,
  pujaNames,
  tz,
}: {
  items: Observance[];
  /** 'month': the festivals of `month`; 'next': the next ones after an empty month. */
  mode: 'month' | 'next';
  /** YYYY-MM in the panchang place's zone. */
  month: string;
  place: string;
  pujaNames?: PujaNames;
  tz: string;
}) {
  const t = useT('home');
  const f = useFormat();
  const { locale } = useLocale();
  const monthName = f.dateKey(`${month}-15`, {
    weekday: undefined,
    day: undefined,
    month: 'long',
    year: undefined,
  });

  return (
    <section aria-labelledby="festivals-title" className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Sparkles className="size-8 text-diya" aria-hidden="true" />
          <h2
            id="festivals-title"
            className={cn('mt-4 text-4xl sm:text-5xl', locale === 'hi' ? 'leading-[1.3]' : 'leading-tight')}
            suppressHydrationWarning
          >
            {mode === 'month' ? t('festivals.titleMonth', { month: monthName }) : t('festivals.titleNext')}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">{t('festivals.lead', { place })}</p>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="self-start bg-card md:self-auto"
          render={<Link href="/panchang?view=festivals#sacred-days" />}
          nativeButton={false}
        >
          {t('festivals.explore')}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((o) => (
          <li key={observanceId(o)} className="min-w-0">
            <FestivalCard o={o} pujaNames={pujaNames} tz={tz} headingLevel="h3" showDescription={false} />
          </li>
        ))}
      </ul>
    </section>
  );
}
