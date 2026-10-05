'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import type { Observance } from '@/lib/types';
import { cn } from '@/lib/utils';
import { observanceBookingDay, pujaHrefFor } from '@/lib/booking-date';
import { dateKeyIn } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ObservanceIcon } from '@/components/ritual/observance-icon';
import { observanceId, occasionOf, pujaName, type PujaNames } from '@/components/ritual/observance';
import { useDays } from '@/components/ritual/use-days';
import { usePanchangText } from '@/components/ritual/use-panchang-text';

export type PujaPrices = Record<string, number | null>;

/**
 * Upcoming sacred days, each with the pujas families traditionally keep on it
 * (from the observance's suggested_puja_slugs) and a way to book one.
 */
export function SacredPlans({
  items,
  pujaNames,
  prices,
  tz,
}: {
  items: Observance[];
  pujaNames: PujaNames;
  prices: PujaPrices;
  /** Zone of the place the dates are for. */
  tz: string;
}) {
  const t = useT('home');
  const tc = useT('catalog');
  const f = useFormat();
  const { locale, lunarLine, typeName, text } = usePanchangText();
  const days = useDays(tz);

  return (
    <ol className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((o) => {
        const name = text(o, 'name') || typeName(o.key);
        const date = f.dateKey(o.date, {
          weekday: 'long',
          year: undefined,
          month: 'long',
        });
        const lunar = lunarLine(o);
        const slugs = o.suggested_puja_slugs.slice(0, 2);
        const first = slugs[0];
        const relative = days.relative(o.date);
        // The observance's civil date in the panchang place's zone, carried as-is
        // (booking slots are IST; see lib/booking-date.ts for why no shift).
        const day = observanceBookingDay(o, dateKeyIn(tz));
        return (
          <li
            key={observanceId(o)}
            className="flex min-w-0 flex-col rounded-2xl border border-diya/30 bg-card p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <ObservanceIcon observanceKey={o.key} festival={o.festival} tithi={o.tithi} />
              <div className="min-w-0">
                <h3 className="font-sans text-lg leading-snug font-semibold text-foreground">{name}</h3>
                <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                  <span className="font-medium text-sindoor">{relative}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="sr-only">, </span>
                  {date}
                </p>
                {lunar && <p className="text-sm text-muted-foreground">{lunar}</p>}
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('sacred.pujas')}
            </p>
            <ul className="mt-1 flex-1 divide-y divide-dashed divide-border">
              {slugs.map((slug) => {
                const price = prices[slug];
                return (
                  <li key={slug}>
                    <Link
                      href={pujaHrefFor(slug, day, occasionOf(o))}
                      className="group flex min-h-11 items-center justify-between gap-3 rounded-md py-1.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span className="min-w-0 font-medium text-foreground group-hover:text-primary">
                        {pujaName(slug, pujaNames, locale)}
                      </span>
                      {price != null && (
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {tc('tile.from', { price: f.inr(price) })}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {first && (
              <Button
                variant="outline"
                size="lg"
                className={cn('mt-4 w-full bg-card sm:w-auto sm:self-start')}
                render={<Link href={pujaHrefFor(first, day, occasionOf(o))} />}
                nativeButton={false}
                aria-label={t('sacred.bookAria', {
                  puja: pujaName(first, pujaNames, locale),
                  name,
                  date,
                })}
              >
                {t('sacred.book')}
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </li>
        );
      })}
    </ol>
  );
}
