'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BellPlus, CalendarSearch } from 'lucide-react';
import { useFormat } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import type { Observance, ObservanceKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { observanceBookingDay, pujaHrefFor } from '@/lib/booking-date';
import { dateKeyIn } from '@/lib/format';
import { IST_ZONE } from '@/lib/place';
import { Button } from '@/components/ui/button';
import { ObservanceIcon } from './observance-icon';
import {
  groupByMonth,
  OBSERVANCE_KEYS,
  observanceId,
  occasionOf,
  pujaName,
  remindHref,
  signedInHref,
  type PujaNames,
} from './observance';
import { useDays } from './use-days';
import { usePanchangText } from './use-panchang-text';

/** "Fri 16 Oct", "in 3 days" or "Under way · ends 10 Oct" for an observance. */
export function useWhen(tz?: string) {
  const f = useFormat();
  const { t } = usePanchangText();
  const days = useDays(tz);
  return (o: Observance) => {
    const start = days.until(o.date);
    if (o.end_date && o.end_date !== o.date) {
      const range = t('pitru.range', {
        from: f.dateKey(o.date, { weekday: undefined, year: undefined, month: 'short' }),
        to: f.dateKey(o.end_date, { weekday: undefined, year: undefined, month: 'short' }),
      });
      return { date: range, relative: start <= 0 ? t('list.ongoing') : days.relative(o.date) };
    }
    return {
      date: f.dateKey(o.date, { year: undefined, month: 'short' }),
      relative: days.relative(o.date),
    };
  };
}

/** One sacred day: date, moon, name, lunar line, a short note and what to do. */
export function ObservanceRow({
  o,
  pujaNames,
  compact = false,
  headingLevel = 'h3',
  tz,
}: {
  o: Observance;
  pujaNames?: PujaNames;
  compact?: boolean;
  headingLevel?: 'h3' | 'h4';
  /** Zone of the place the dates are for (IST by default). */
  tz?: string;
}) {
  const f = useFormat();
  const { t, locale, lunarLine, typeName, text } = usePanchangText();
  const { user } = useAuth();
  const when = useWhen(tz)(o);
  const days = useDays(tz);
  const Heading = headingLevel;
  const name = text(o, 'name') || typeName(o.key);
  const lunar = lunarLine({ ...o, tithi: o.tithi });
  const day = f.dateKey(o.date, { weekday: undefined, day: 'numeric', month: undefined, year: undefined });
  const weekday = f.dateKey(o.date, { weekday: 'short', day: undefined, month: undefined, year: undefined });
  const isToday = days.until(o.date) <= 0;

  return (
    <article className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 sm:grid-cols-[3.75rem_minmax(0,1fr)_auto]">
      <div className="text-center" aria-hidden="true">
        <span className={cn('block font-heading text-3xl leading-none', isToday ? 'text-sindoor' : 'text-heading')}>
          {day}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">{weekday}</span>
      </div>

      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <ObservanceIcon observanceKey={o.key} festival={o.festival} tithi={o.tithi} size="sm" />
          <div className="min-w-0">
            <Heading className="font-sans text-lg leading-snug font-semibold text-foreground">{name}</Heading>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-sindoor">{when.relative}</span>
              <span aria-hidden="true"> · </span>
              <span className="sr-only">, </span>
              {when.date}
              {lunar && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="sr-only">, </span>
                  {lunar}
                </>
              )}
            </p>
          </div>
        </div>
        {!compact && text(o, 'description') && (
          <p className="mt-2 line-clamp-2 text-muted-foreground">{text(o, 'description')}</p>
        )}
        {!compact && o.suggested_puja_slugs.length > 0 && (
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">{t('list.suggested')} </span>
            {o.suggested_puja_slugs.slice(0, 3).map((slug, i) => (
              <span key={slug}>
                {i > 0 && <span className="text-muted-foreground">, </span>}
                <Link
                  href={pujaHrefFor(slug, observanceBookingDay(o, dateKeyIn(tz ?? IST_ZONE)), occasionOf(o))}
                  className="rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {pujaName(slug, pujaNames, locale)}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>

      {!compact && (
        <div className="col-start-2 sm:col-start-3 sm:row-start-1 sm:self-center">
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            render={<Link href={signedInHref(remindHref(o.key), !!user)} />}
            nativeButton={false}
            aria-label={t('list.remindAria', { name })}
          >
            <BellPlus aria-hidden="true" />
            {t('list.remind')}
          </Button>
        </div>
      )}
    </article>
  );
}

/** Sacred days grouped by month with type filters (the /panchang list). */
export function SacredDays({
  items,
  pujaNames,
  tz,
}: {
  items: Observance[];
  pujaNames?: PujaNames;
  tz?: string;
}) {
  const f = useFormat();
  const { t, typeName } = usePanchangText();
  const [filter, setFilter] = useState<ObservanceKey | 'all'>('all');

  // Festivals have their own tab on /panchang, so no chip here.
  const present = useMemo(
    () => OBSERVANCE_KEYS.filter((k) => k !== 'festival' && items.some((o) => o.key === k)),
    [items],
  );
  const shown = filter === 'all' ? items : items.filter((o) => o.key === filter);
  const groups = groupByMonth(shown);

  return (
    <div>
      {present.length > 1 && (
        <div role="group" aria-label={t('list.filterLabel')} className="flex flex-wrap gap-2">
          {(['all', ...present] as const).map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(k)}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  active
                    ? 'border-sandhya bg-sandhya text-[#fbe3b6] dark:border-diya dark:bg-diya dark:text-[#1a1208]'
                    : 'bg-card hover:border-primary/40 hover:bg-accent/40',
                )}
              >
                {k === 'all' ? t('list.all') : typeName(k)}
              </button>
            );
          })}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-dashed p-5 text-muted-foreground">
          <CalendarSearch className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{t('list.noneOfType')}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-10" aria-live="polite">
          {groups.map((g) => (
            <section key={g.month} aria-labelledby={`m-${g.month}`} className="min-w-0">
              <h3 id={`m-${g.month}`} className="border-b pb-2 text-2xl">
                {f.dateKey(`${g.month}-15`, { weekday: undefined, day: undefined, month: 'long', year: 'numeric' })}
              </h3>
              <ul className="divide-y">
                {g.items.map((o) => (
                  <li key={observanceId(o)}>
                    <ObservanceRow o={o} pujaNames={pujaNames} headingLevel="h4" tz={tz} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
