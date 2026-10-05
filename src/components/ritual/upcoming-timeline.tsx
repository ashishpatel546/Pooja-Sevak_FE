'use client';

import Link from 'next/link';
import { CalendarHeart } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import type { UpcomingReminder } from '@/lib/types';
import { cn } from '@/lib/utils';
import { observanceBookingDay, pujaHrefFor } from '@/lib/booking-date';
import { dateKeyIn } from '@/lib/format';
import { IST_ZONE } from '@/lib/place';
import { Button } from '@/components/ui/button';
import { ObservanceIcon } from './observance-icon';
import { groupByMonth, pujaName, type PujaNames } from './observance';
import { useDays } from './use-days';
import { usePanchangText } from './use-panchang-text';

function useItemText(tz?: string) {
  const f = useFormat();
  const days = useDays(tz);
  const { text } = usePanchangText();
  const t = useT('reminders');
  return (r: UpcomingReminder) => {
    const ranged = r.end_date && r.end_date !== r.date;
    const ongoing = ranged && days.until(r.date) <= 0;
    return {
      title: text(r, 'title'),
      subtitle: text(r, 'subtitle'),
      date: ranged
        ? t('upcoming.range', {
            from: f.dateKey(r.date, { weekday: undefined, year: undefined }),
            to: f.dateKey(r.end_date!, { weekday: undefined, year: undefined }),
          })
        : f.dateKey(r.date, { weekday: 'long', year: undefined, month: 'long' }),
      relative: ongoing ? t('upcoming.ongoing') : days.relative(r.date),
    };
  };
}

function BookLink({
  item,
  tz,
  names,
  emphasis,
}: {
  item: UpcomingReminder;
  tz?: string;
  names?: PujaNames;
  emphasis?: boolean;
}) {
  const t = useT('reminders');
  const { locale } = usePanchangText();
  const slug = item.suggested_puja_slugs[0];
  const puja = pujaName(slug, names, locale);
  // Civil date in the reminder place's zone, carried as-is (see lib/booking-date.ts).
  const occasion = item.observance_key === 'festival' ? null : item.observance_key;
  const href = pujaHrefFor(slug, observanceBookingDay(item, dateKeyIn(tz ?? IST_ZONE)), occasion);
  if (emphasis) {
    return (
      <Button size="lg" render={<Link href={href} />} nativeButton={false} className="w-full sm:w-auto">
        <CalendarHeart aria-hidden="true" />
        {t('upcoming.bookFor')}
      </Button>
    );
  }
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {t('upcoming.bookPuja', { puja })}
    </Link>
  );
}

/**
 * A quiet timeline of what is coming: observances the person follows and the
 * loved ones they remember. The very next day is lifted out and given room.
 */
export function UpcomingTimeline({
  items,
  pujaNames,
  tz,
}: {
  items: UpcomingReminder[];
  pujaNames?: PujaNames;
  /** Zone of the reminder location; dates are civil dates there. */
  tz?: string;
}) {
  const f = useFormat();
  const t = useT('reminders');
  const { locale } = usePanchangText();
  const describe = useItemText(tz);
  const [next, ...rest] = items;
  if (!next) return null;
  const n = describe(next);
  const groups = groupByMonth(rest);
  const hi = locale === 'hi';

  return (
    <div className="grid grid-cols-1 gap-10">
      <section
        aria-labelledby="next-title"
        className={cn(
          'relative overflow-hidden rounded-2xl border p-5 sm:p-7',
          next.kind === 'remembrance' ? 'border-diya/40 bg-chandan' : 'bg-card',
        )}
      >
        <p className="text-sm font-medium text-sindoor">
          {t('upcoming.next')} · {n.relative}
        </p>
        <div className="mt-3 flex items-start gap-4">
          <ObservanceIcon observanceKey={next.observance_key} festival={next.festival} size="lg" />
          <div className="min-w-0">
            <h2
              id="next-title"
              className={cn('text-3xl sm:text-4xl', hi ? 'leading-[1.3]' : 'leading-tight')}
            >
              {n.title}
            </h2>
            <p className="mt-1 text-lg">{n.date}</p>
            {n.subtitle && <p className="mt-1 text-muted-foreground">{n.subtitle}</p>}
          </div>
        </div>
        {next.suggested_puja_slugs.length > 0 && (
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
            <BookLink item={next} tz={tz} names={pujaNames} emphasis />
            <p className="text-sm text-muted-foreground">
              {t('upcoming.suggests', { puja: pujaName(next.suggested_puja_slugs[0], pujaNames, locale) })}
            </p>
          </div>
        )}
      </section>

      {groups.map((g) => (
        <section key={g.month} aria-labelledby={`tl-${g.month}`} className="min-w-0">
          <h3 id={`tl-${g.month}`} className="mb-2 text-xl text-muted-foreground">
            {f.dateKey(`${g.month}-15`, { weekday: undefined, day: undefined, month: 'long', year: 'numeric' })}
          </h3>
          <ol className="relative ml-[1.125rem] border-l border-diya/40">
            {g.items.map((r) => {
              const d = describe(r);
              return (
                <li
                  key={`${r.kind}-${r.festival ?? r.observance_key ?? r.remembrance_id}-${r.date}`}
                  className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 py-4"
                >
                  <span className="-ml-[1.125rem]">
                    <ObservanceIcon observanceKey={r.observance_key} festival={r.festival} size="sm" className="bg-background" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{d.relative}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="sr-only">, </span>
                      {d.date}
                    </p>
                    <h4
                      className={cn(
                        'mt-0.5 font-sans text-lg leading-snug font-semibold',
                        r.kind === 'remembrance' ? 'text-heading' : 'text-foreground',
                      )}
                    >
                      {d.title}
                    </h4>
                    {d.subtitle && <p className="text-sm text-muted-foreground">{d.subtitle}</p>}
                    {r.suggested_puja_slugs[0] && <BookLink item={r} tz={tz} names={pujaNames} />}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
