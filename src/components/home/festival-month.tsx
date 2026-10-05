'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Sunrise, Sunset } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import { formatTimeIn } from '@/lib/format';
import type { Place } from '@/lib/place';
import type { Observance, ObservanceKey, PanchangMonth, PanchangMonthDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ObservanceIcon } from '@/components/ritual/observance-icon';
import { observanceId } from '@/components/ritual/observance';
import { useDays } from '@/components/ritual/use-days';
import { usePanchangText } from '@/components/ritual/use-panchang-text';

type Brief = PanchangMonthDay['observances'][number];

/** 0 = Sunday, for a YYYY-MM-DD key. */
const weekdayOf = (key: string) => new Date(`${key}T12:00:00Z`).getUTCDay();
/** 1–7 January 2023 ran Sunday to Saturday: keys for weekday names. */
const WEEK = Array.from({ length: 7 }, (_, i) => `2023-01-0${i + 1}`);
// Saffron and lamp gold are near twins in the dark theme, so festivals turn kumkum red there.
const FESTIVAL_DOT = 'size-1.5 rounded-full bg-sindoor dark:bg-kumkum';
/** Observances that are a full or new moon day. */
const MOON_KEYS: Partial<Record<ObservanceKey, 'purnima' | 'amavasya'>> = {
  purnima: 'purnima',
  amavasya: 'amavasya',
  sarva_pitru_amavasya: 'amavasya',
};

function moonOf(d: PanchangMonthDay): 'purnima' | 'amavasya' | null {
  for (const o of d.observances) if (MOON_KEYS[o.key]) return MOON_KEYS[o.key]!;
  return null;
}

/** A glowing full disc for Purnima, a dark disc with a gold rim for Amavasya. */
function MoonMark({ moon, className }: { moon: 'purnima' | 'amavasya'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-2.5 rounded-full',
        moon === 'purnima'
          ? 'bg-diya shadow-[0_0_5px_1px_rgb(226_162_59/0.7)] ring-1 ring-[#fbe3b6]'
          : 'bg-sandhya ring-1 ring-diya dark:bg-background',
        className,
      )}
    />
  );
}

const NO_DATE = { weekday: undefined, day: undefined, month: undefined, year: undefined } as const;

/**
 * This month on the home page: a calendar where hovering, focusing or tapping a
 * date shows that day's panchang and festivals, beside a one-line list of the
 * month's festivals (or the next few, in a month without any). Leads to the
 * Festivals tab of /panchang.
 */
export function FestivalMonth({
  month,
  festivals,
  today,
  place,
  placeLabel,
}: {
  /** Every day of the current month; null when it could not be loaded. */
  month: PanchangMonth | null;
  /** Upcoming festivals, for a month without any of its own. */
  festivals: Observance[];
  /** Today's date key in place.tz. */
  today: string;
  place: Place;
  placeLabel: string;
}) {
  const t = useT('home');
  const f = useFormat();
  const { locale, text } = usePanchangText();
  const days = useMemo(() => month?.days ?? [], [month]);
  const monthKey = month?.month ?? today.slice(0, 7);
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const [pinned, setPinned] = useState(() => (byDate.has(today) ? today : (days[0]?.date ?? today)));
  const [hovered, setHovered] = useState<string | null>(null);
  const shown = byDate.get(hovered ?? pinned);
  // A click, tap or arrow key picks a date over the one the mouse rests on.
  const pin = (date: string) => {
    setPinned(date);
    setHovered(null);
  };

  // The month's festivals, once each (Navratri spans several days).
  const monthFestivals = useMemo(() => {
    const seen = new Map<string, Brief>();
    for (const d of days) for (const o of d.observances) if (o.festival) seen.set(observanceId(o), o);
    return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [days]);
  const list: Brief[] = monthFestivals.length ? monthFestivals : festivals.slice(0, 3);

  const monthName = f.dateKey(`${monthKey}-15`, { ...NO_DATE, month: 'long' });
  const hi = locale === 'hi';

  return (
    <section aria-labelledby="festivals-title" className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            id="festivals-title"
            className={cn('flex items-center gap-2 text-3xl sm:text-4xl', hi ? 'leading-[1.3]' : 'leading-tight')}
            suppressHydrationWarning
          >
            <Sparkles className="size-6 shrink-0 text-diya" aria-hidden="true" />
            {month || monthFestivals.length ? t('festivals.titleMonth', { month: monthName }) : t('festivals.titleNext')}
          </h2>
          <p className="mt-1 text-muted-foreground">{t('festivals.lead', { place: placeLabel })}</p>
        </div>
        <Link
          href="/panchang?view=festivals#sacred-days"
          className="group inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-lg font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:self-auto"
        >
          {t('festivals.explore')}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      </div>

      <div
        className={cn(
          'mt-5 grid grid-cols-1 overflow-hidden rounded-3xl bg-card ring-1 ring-diya/35',
          month && 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]',
        )}
      >
        {month && (
          <MonthGrid
            days={days}
            monthName={monthName}
            today={today}
            pinned={pinned}
            shown={shown?.date ?? null}
            onPin={pin}
            onHover={setHovered}
          />
        )}

        <div
          className={cn(
            'min-w-0 p-4 sm:p-6',
            month && 'border-t border-dashed border-diya/30 md:border-t-0 md:border-l',
          )}
        >
          {shown && <DayPanchang day={shown} today={today} place={place} />}

          {list.length > 0 && (
            <div className={cn(shown && 'mt-5 border-t border-dashed border-diya/30 pt-4')}>
              <h3 className="font-sans text-sm font-semibold text-muted-foreground">
                {monthFestivals.length ? t('festivals.thisMonth') : t('festivals.comingUp')}
              </h3>
              <ul className="mt-1 divide-y divide-border">
                {list.map((o) => {
                  const inMonth = byDate.has(o.date);
                  const row = (
                    <>
                      <span
                        className="w-14 shrink-0 text-sm font-semibold text-sindoor tabular-nums"
                        suppressHydrationWarning
                      >
                        {f.dateKey(o.date, { ...NO_DATE, day: 'numeric', month: 'short' })}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{text(o, 'name')}</span>
                    </>
                  );
                  return (
                    <li key={observanceId(o)}>
                      {inMonth ? (
                        <button
                          type="button"
                          onClick={() => pin(o.date)}
                          onMouseEnter={() => setHovered(o.date)}
                          onMouseLeave={() => setHovered(null)}
                          className="flex min-h-10 w-full items-center gap-3 rounded-md text-left transition-colors hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          {row}
                        </button>
                      ) : (
                        <div className="flex min-h-10 items-center gap-3">{row}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** The month as a Sunday-first grid; arrow keys move between dates. */
function MonthGrid({
  days,
  monthName,
  today,
  pinned,
  shown,
  onPin,
  onHover,
}: {
  days: PanchangMonthDay[];
  monthName: string;
  today: string;
  pinned: string;
  shown: string | null;
  onPin: (date: string) => void;
  onHover: (date: string | null) => void;
}) {
  const t = useT('home');
  const f = useFormat();
  const { t: tp, text } = usePanchangText();
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const lead = days.length ? weekdayOf(days[0].date) : 0;

  const move = (from: number, by: number) => {
    const next = days[from + by];
    if (!next) return;
    onPin(next.date);
    refs.current.get(next.date)?.focus();
  };
  const STEP: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

  return (
    <div className="min-w-0 p-4 sm:p-6">
      <div
        role="group"
        aria-label={t('festivals.calendarLabel', { month: monthName })}
        className="grid grid-cols-7 gap-1"
        onMouseLeave={() => onHover(null)}
      >
        {WEEK.map((key) => (
          <span
            key={key}
            aria-hidden="true"
            className="pb-1 text-center text-xs font-medium text-muted-foreground"
            suppressHydrationWarning
          >
            {f.dateKey(key, { ...NO_DATE, weekday: 'short' })}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} aria-hidden="true" />
        ))}
        {days.map((d, i) => {
          const festival = d.observances.some((o) => o.festival);
          const moon = moonOf(d);
          // Purnima and Amavasya carry their own moon, not the gold dot.
          const vrat = d.observances.some((o) => !o.festival && !MOON_KEYS[o.key]);
          const isShown = d.date === shown;
          const names = d.observances.map((o) => text(o, 'name')).join(', ');
          const label = f.dateKey(d.date, { weekday: 'long', day: 'numeric', month: 'long', year: undefined });
          return (
            <button
              key={d.date}
              ref={(el) => {
                if (el) refs.current.set(d.date, el);
                else refs.current.delete(d.date);
              }}
              type="button"
              tabIndex={d.date === pinned ? 0 : -1}
              aria-pressed={d.date === pinned}
              aria-label={names ? `${label}: ${names}` : label}
              onClick={() => onPin(d.date)}
              onFocus={() => onPin(d.date)}
              onMouseEnter={() => onHover(d.date)}
              onKeyDown={(e) => {
                const by = STEP[e.key];
                if (by === undefined) return;
                e.preventDefault();
                move(i, by);
              }}
              className={cn(
                'relative grid h-10 place-items-center rounded-lg text-sm tabular-nums transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-11',
                isShown
                  ? 'bg-sandhya font-semibold text-[#fbe3b6] dark:bg-diya dark:text-[#1a1208]'
                  : festival
                    ? 'bg-chandan font-semibold text-heading hover:bg-accent dark:bg-kumkum/15 dark:hover:bg-kumkum/25'
                    : 'text-foreground hover:bg-accent/60',
                !isShown && d.date < today && 'text-muted-foreground',
                d.date === today && 'ring-2 ring-sindoor',
              )}
            >
              <span aria-hidden="true" suppressHydrationWarning>
                {Number(d.date.slice(8))}
              </span>
              {(festival || vrat || moon) && (
                <span className="absolute bottom-1 flex items-center gap-0.5" aria-hidden="true">
                  {moon && <MoonMark moon={moon} className="size-2" />}
                  {festival && <span className={FESTIVAL_DOT} />}
                  {vrat && <span className="size-1.5 rounded-full bg-diya" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className={FESTIVAL_DOT} />
          {t('festivals.festivalDay')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-diya" />
          {t('festivals.vratDay')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MoonMark moon="purnima" />
          {tp('type.purnima')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MoonMark moon="amavasya" />
          {tp('type.amavasya')}
        </span>
      </p>
    </div>
  );
}

/** The panchang of the date being looked at, with its festivals and vrats. */
function DayPanchang({ day, today, place }: { day: PanchangMonthDay; today: string; place: Place }) {
  const t = useT('home');
  const f = useFormat();
  const { t: tp, locale, lunarLine, text } = usePanchangText();
  const days = useDays(place.tz);
  const until = days.until(day.date);
  const time = (iso: string) => formatTimeIn(iso, place.tz, locale);

  return (
    <div aria-live="polite">
      <p className="flex flex-wrap items-baseline gap-x-2" suppressHydrationWarning>
        <span className="font-heading text-2xl text-heading">
          {f.dateKey(day.date, { weekday: 'long', day: 'numeric', month: 'long', year: undefined })}
        </span>
        {until >= 0 && (
          <span className={cn('text-sm font-semibold', day.date === today ? 'text-sindoor' : 'text-muted-foreground')}>
            {days.relative(day.date)}
          </span>
        )}
      </p>
      <p className="text-muted-foreground">{lunarLine(day)}</p>

      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="min-w-0">
          <dt className="text-muted-foreground">{tp('hero.nakshatra')}</dt>
          <dd className="truncate font-medium text-foreground">{text(day, 'nakshatra')}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">{tp('hero.sunrise')}</dt>
          <dd className="flex items-center gap-1 font-medium text-foreground" suppressHydrationWarning>
            <Sunrise className="size-3.5 shrink-0 text-diya" aria-hidden="true" />
            {time(day.sunrise)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">{tp('hero.sunset')}</dt>
          <dd className="flex items-center gap-1 font-medium text-foreground" suppressHydrationWarning>
            <Sunset className="size-3.5 shrink-0 text-diya" aria-hidden="true" />
            {time(day.sunset)}
          </dd>
        </div>
      </dl>

      {day.observances.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {day.observances.map((o) => (
            <li
              key={observanceId(o)}
              className={cn(
                'inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-sm ring-1',
                o.festival
                  ? 'bg-chandan font-medium text-foreground ring-sindoor/40 dark:bg-kumkum/15 dark:ring-kumkum/40'
                  : 'bg-background text-foreground ring-diya/40',
              )}
            >
              <ObservanceIcon observanceKey={o.key} festival={o.festival} size="xs" className="-ml-2" />
              {text(o, 'name')}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{t('festivals.quietDay')}</p>
      )}
    </div>
  );
}
