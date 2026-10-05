'use client';

import Link from 'next/link';
import { BellPlus } from 'lucide-react';
import { useFormat } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import type { Observance } from '@/lib/types';
import { cn } from '@/lib/utils';
import { observanceBookingDay, pujaHrefFor } from '@/lib/booking-date';
import { dateKeyIn } from '@/lib/format';
import { IST_ZONE } from '@/lib/place';
import { Button } from '@/components/ui/button';
import { ObservanceIcon } from './observance-icon';
import {
  groupByMonth,
  observanceId,
  occasionOf,
  pujaName,
  remindHref,
  signedInHref,
  type PujaNames,
} from './observance';
import { useWhen } from './sacred-days';
import { usePanchangText } from './use-panchang-text';

/** Suggested pujas as inline links, booked for the festival's day. */
function PujaLinks({
  o,
  pujaNames,
  tz,
  onDark = false,
}: {
  o: Observance;
  pujaNames?: PujaNames;
  tz?: string;
  onDark?: boolean;
}) {
  const { t, locale } = usePanchangText();
  if (o.suggested_puja_slugs.length === 0) return null;
  const day = observanceBookingDay(o, dateKeyIn(tz ?? IST_ZONE));
  return (
    <p className="mt-3 text-sm">
      <span className={onDark ? 'text-[#f4e6d4]/75' : 'text-muted-foreground'}>{t('list.suggested')} </span>
      {o.suggested_puja_slugs.slice(0, 3).map((slug, i) => (
        <span key={slug}>
          {i > 0 && <span className={onDark ? 'text-[#f4e6d4]/75' : 'text-muted-foreground'}>, </span>}
          <Link
            href={pujaHrefFor(slug, day, occasionOf(o))}
            className={cn(
              'rounded font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
              onDark ? 'text-diya' : 'text-primary',
            )}
          >
            {pujaName(slug, pujaNames, locale)}
          </Link>
        </span>
      ))}
    </p>
  );
}

/** The next festival, given the room of a twilight card. */
function NextFestival({ o, pujaNames, tz }: { o: Observance; pujaNames?: PujaNames; tz?: string }) {
  const { t, locale, lunarLine, text } = usePanchangText();
  const { user } = useAuth();
  const when = useWhen(tz)(o);
  const name = text(o, 'name');
  const lunar = lunarLine(o);

  return (
    <article aria-labelledby="next-festival" className="sandhya stars relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="flex min-w-0 items-start gap-4">
          <ObservanceIcon observanceKey={o.key} festival={o.festival} tithi={o.tithi} size="lg" tone="gold" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-diya">{t('festivals.next')}</p>
            <h3
              id="next-festival"
              className={cn('mt-1 text-3xl sm:text-4xl', locale === 'hi' ? 'leading-[1.3]' : 'leading-tight')}
            >
              {name}
            </h3>
            <p className="mt-2" suppressHydrationWarning>
              <span className="font-semibold text-diya">{when.relative}</span>
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
            {text(o, 'description') && <p className="mt-3 max-w-2xl">{text(o, 'description')}</p>}
            <PujaLinks o={o} pujaNames={pujaNames} tz={tz} onDark />
          </div>
        </div>
        <Button
          size="lg"
          className="bg-diya text-[#2a1208] hover:bg-[#ebb253] md:self-end"
          render={<Link href={signedInHref(remindHref('festival'), !!user)} />}
          nativeButton={false}
          aria-label={t('festivals.remindAria', { name })}
        >
          <BellPlus aria-hidden="true" />
          {t('list.remind')}
        </Button>
      </div>
    </article>
  );
}

/** One festival in the month grid. */
export function FestivalCard({
  o,
  pujaNames,
  tz,
  headingLevel = 'h4',
  showDescription = true,
}: {
  o: Observance;
  pujaNames?: PujaNames;
  tz?: string;
  headingLevel?: 'h3' | 'h4';
  showDescription?: boolean;
}) {
  const f = useFormat();
  const { lunarLine, text } = usePanchangText();
  const when = useWhen(tz)(o);
  const Heading = headingLevel;
  const lunar = lunarLine(o);
  const dayNum = f.dateKey(o.date, {
    weekday: undefined,
    day: 'numeric',
    month: undefined,
    year: undefined,
  });
  const month = f.dateKey(o.date, {
    weekday: undefined,
    day: undefined,
    month: 'short',
    year: undefined,
  });

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-diya/30 bg-card p-5 transition-colors hover:border-diya/60">
      <div className="flex items-start justify-between gap-3">
        <div className="text-center" aria-hidden="true" suppressHydrationWarning>
          <span className="block font-heading text-4xl leading-none text-heading">{dayNum}</span>
          <span className="mt-1 block text-xs font-medium text-muted-foreground uppercase">{month}</span>
        </div>
        <ObservanceIcon observanceKey={o.key} festival={o.festival} tithi={o.tithi} />
      </div>
      <Heading className="mt-4 font-sans text-lg leading-snug font-semibold text-foreground">{text(o, 'name')}</Heading>
      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
        <span className="font-medium text-sindoor">{when.relative}</span>
        <span aria-hidden="true"> · </span>
        <span className="sr-only">, </span>
        {when.date}
      </p>
      {lunar && <p className="text-sm text-muted-foreground">{lunar}</p>}
      {showDescription && text(o, 'description') && (
        <p className="mt-3 line-clamp-3 text-muted-foreground">{text(o, 'description')}</p>
      )}
      <div className="mt-auto">
        <PujaLinks o={o} pujaNames={pujaNames} tz={tz} />
      </div>
    </article>
  );
}

/**
 * The festivals of the year ahead (the /panchang Festivals tab): the next one
 * featured, then the rest by month.
 */
export function FestivalCalendar({
  items,
  pujaNames,
  tz,
}: {
  items: Observance[];
  pujaNames?: PujaNames;
  tz?: string;
}) {
  const f = useFormat();
  const [next, ...rest] = items;
  const groups = groupByMonth(rest);

  return (
    <div className="grid grid-cols-1 gap-10">
      {next && <NextFestival o={next} pujaNames={pujaNames} tz={tz} />}
      {groups.map((g) => (
        <section key={g.month} aria-labelledby={`fm-${g.month}`} className="min-w-0">
          <h3 id={`fm-${g.month}`} className="border-b pb-2 text-2xl" suppressHydrationWarning>
            {f.dateKey(`${g.month}-15`, {
              weekday: undefined,
              day: undefined,
              month: 'long',
              year: 'numeric',
            })}
          </h3>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((o) => (
              <li key={observanceId(o)} className="min-w-0">
                <FestivalCard o={o} pujaNames={pujaNames} tz={tz} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
