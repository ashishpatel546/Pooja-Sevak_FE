'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Sunrise, Sunset } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import { formatTimeIn } from '@/lib/format';
import { samePlace, type Place } from '@/lib/place';
import type { Observance, PanchangDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Mandala } from '@/components/brand/mandala';
import { MoonPhase } from '@/components/ritual/moon-phase';
import { ObservanceIcon } from '@/components/ritual/observance-icon';
import { isOnDay, pakshaOf } from '@/components/ritual/observance';
import { PlaceControl } from '@/components/ritual/place-control';
import { useDays } from '@/components/ritual/use-days';
import { usePanchangText } from '@/components/ritual/use-panchang-text';
import { usePlaceName } from '@/components/ritual/use-place';

/** Amanta months in order from Chaitra, as the panchang API names them. */
const LUNAR_ORDER = [
  'Chaitra',
  'Vaishakha',
  'Jyeshtha',
  'Ashadha',
  'Shravana',
  'Bhadrapada',
  'Ashwin',
  'Kartika',
  'Margashirsha',
  'Pausha',
  'Magha',
  'Phalguna',
];

/**
 * Vikram Samvat year for a civil date and its amanta month. The year turns at
 * Chaitra Shukla Pratipada (March/April), so Pausha–Phalguna days that fall in
 * January–April still belong to the previous Samvat year.
 */
export function vikramSamvat(dateKey: string, lunarMonthEn: string | null | undefined): number | null {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(5, 7));
  const index = LUNAR_ORDER.findIndex((m) => lunarMonthEn?.replace(/^Adhik\s+/i, '') === m);
  if (!year || !month || index < 0) return null;
  return month <= 4 && index >= 9 ? year + 56 : year + 57;
}

function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-foreground">
        {icon}
        {/* Zone names can differ slightly between the server's and the browser's ICU data. */}
        <span className="min-w-0" suppressHydrationWarning>
          {value}
        </span>
      </dd>
    </div>
  );
}

/**
 * "Aaj ka Panchang" for the home page: today's tithi, paksha, nakshatra and
 * sunrise/sunset for the visitor's place, the next few sacred days with a
 * countdown, the change-city control and a link to the full /panchang.
 * The caller renders nothing when the day could not be loaded.
 */
export function PanchangGlance({
  day,
  today,
  place,
  requested,
  upcoming,
  className,
}: {
  day: PanchangDay;
  /** Today's date key in place.tz. */
  today: string;
  /** The place the data is for. */
  place: Place;
  /** The place the visitor asked for (differs only when the API fell back to India time). */
  requested: Place;
  upcoming: Observance[] | null;
  className?: string;
}) {
  const t = useT('home');
  const f = useFormat();
  const { t: tp, locale, pakshaName, typeName, text } = usePanchangText();
  const name = usePlaceName();
  const days = useDays(place.tz);
  const hi = locale === 'hi';

  const time = (iso: string) => formatTimeIn(iso, place.tz, locale, { zone: true });
  const dateLine = f.dateKey(today, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const samvat = vikramSamvat(today, day.lunar_month_en);
  const fellBack = !samePlace(requested, place) ? requested : null;
  const next = (upcoming ?? []).filter((o) => o.date > today && !isOnDay(o, today)).slice(0, 3);

  return (
    <section
      aria-labelledby="glance-title"
      className={cn(
        'relative overflow-hidden rounded-3xl bg-card ring-1 ring-diya/35',
        'shadow-[0_30px_60px_-36px_rgb(42_31_74/0.55)] dark:shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)]',
        'animate-in duration-700 fade-in slide-in-from-bottom-4 motion-reduce:animate-none',
        className,
      )}
    >
      {/* Sized inline so the faint watermark never depends on a freshly built stylesheet. */}
      <Mandala
        className="absolute text-diya"
        style={{ top: '-6rem', right: '-6rem', width: '18rem', height: '18rem', opacity: 0.15 }}
      />
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Today */}
        <div className="min-w-0 p-5 sm:p-7">
          <h2
            id="glance-title"
            className={cn('flex items-center gap-2 text-2xl', hi ? 'leading-[1.4]' : 'leading-tight')}
          >
            <Sparkles className="size-5 shrink-0 text-diya" aria-hidden="true" />
            {t('glance.title')}
          </h2>
          <p className="mt-2 text-foreground" suppressHydrationWarning>
            {dateLine}
          </p>
          {samvat && <p className="text-sm text-muted-foreground">{t('glance.samvat', { year: samvat })}</p>}
          <div className="mt-5 flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-sandhya ring-1 ring-diya/40">
              <MoonPhase tithi={day.tithi} tone="gold" className="size-11" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{t('glance.tithi')}</p>
              <p
                className={cn(
                  'font-heading text-3xl text-heading sm:text-4xl',
                  hi ? 'leading-[1.35]' : 'leading-tight',
                )}
              >
                {text(day, 'tithi_name')}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {tp('hero.monthLine', {
              month: text(day, 'lunar_month'),
              paksha: pakshaName(day.paksha ?? pakshaOf(day.tithi)),
            })}
          </p>
        </div>

        {/* Sky */}
        <div className="min-w-0 border-t border-dashed border-diya/30 p-5 sm:p-7 md:border-t-0 md:border-l">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-1">
            <div className="col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-1">
              <Fact label={tp('hero.nakshatra')} value={text(day, 'nakshatra')} />
            </div>
            <Fact
              label={tp('hero.sunrise')}
              value={time(day.sunrise)}
              icon={<Sunrise className="size-4 shrink-0 text-diya" aria-hidden="true" />}
            />
            <Fact
              label={tp('hero.sunset')}
              value={time(day.sunset)}
              icon={<Sunset className="size-4 shrink-0 text-diya" aria-hidden="true" />}
            />
          </dl>
          {day.observances.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label={tp('hero.todayIs')}>
              {day.observances.map((o) => (
                <li
                  key={`${o.key}-${o.date}`}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-chandan px-3 text-sm text-foreground ring-1 ring-diya/40"
                >
                  <Sparkles className="size-3.5 text-sindoor" aria-hidden="true" />
                  {text(o, 'name') || typeName(o.key)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Coming up */}
        <div className="min-w-0 border-t border-dashed border-diya/30 p-5 sm:p-7 md:col-span-2 lg:col-span-1 lg:border-t-0 lg:border-l">
          {next.length > 0 && (
            <>
              <h3 className="font-sans text-sm font-semibold text-muted-foreground">{t('glance.next')}</h3>
              <ul className="mt-2 divide-y divide-border">
                {next.map((o) => (
                  <li key={`${o.key}-${o.date}`} className="flex items-center gap-3 py-2.5">
                    <ObservanceIcon observanceKey={o.key} tithi={o.tithi} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate leading-snug font-medium text-foreground">
                        {text(o, 'name') || typeName(o.key)}
                      </p>
                      <p className="truncate text-sm text-muted-foreground" suppressHydrationWarning>
                        {f.dateKey(o.date, { year: undefined, month: 'short' })}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-sm font-medium text-accent-foreground"
                      suppressHydrationWarning
                    >
                      {days.relative(o.date)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Link
            href="/panchang"
            className="group mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t('glance.full')}
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>

      <div className="relative border-t border-diya/25 bg-chandan/60 px-5 py-3 sm:px-7">
        {fellBack && (
          <p role="status" className="mb-1 text-sm text-muted-foreground">
            {tp('place.fallback', { place: name(fellBack) })}
          </p>
        )}
        <PlaceControl place={fellBack ?? place} />
      </div>
    </section>
  );
}
