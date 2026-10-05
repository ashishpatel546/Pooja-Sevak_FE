'use client';

import Link from 'next/link';
import { RefreshCw, Sparkles, Sunrise, Sunset } from 'lucide-react';
import { useFormat } from '@/i18n';
import { formatTimeIn, zoneAbbr } from '@/lib/format';
import { IST_ZONE, samePlace, type Place } from '@/lib/place';
import type { PanchangDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Mandala } from '@/components/brand/mandala';
import { MoonPhase } from './moon-phase';
import { observanceId, pakshaOf, tithiInPaksha } from './observance';
import { PlaceControl } from './place-control';
import { usePlaceName } from './use-place';
import { usePanchangText } from './use-panchang-text';

function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  // Zone names can differ slightly between the server's and the browser's ICU data.
  return (
    <div className="min-w-0">
      <dt className="text-sm text-[#f4e6d4]/70">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-lg text-[#fff4e0]">
        {icon}
        <span className="min-w-0" suppressHydrationWarning>
          {value}
        </span>
      </dd>
    </div>
  );
}

/**
 * Twilight hero for /panchang: today's tithi set large beside the moon as it
 * looks tonight, with paksha, month, nakshatra and sunrise/sunset in the
 * place's own time zone (with the zone named when it isn't IST).
 */
export function PanchangToday({
  day,
  today,
  place,
  requested,
}: {
  day: PanchangDay | null;
  /** Today's date key in place.tz. */
  today: string;
  /** The place the data is for. */
  place: Place;
  /** The place the visitor asked for (differs only when we had to fall back to Lucknow). */
  requested?: Place;
}) {
  const f = useFormat();
  const { t, locale, pakshaName, typeName, text } = usePanchangText();
  const name = usePlaceName();
  const dateLine = f.dateKey(today, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hi = locale === 'hi';
  const ist = place.tz === IST_ZONE;
  const time = (iso: string) => formatTimeIn(iso, place.tz, locale, { zone: !ist });
  const zone = ist
    ? t('hero.zoneIst')
    : t('hero.zoneLocal', { place: name(place), zone: zoneAbbr(place.tz, day?.sunrise ?? `${today}T12:00:00Z`) });
  /** Set when the API could not answer for the visitor's place and we show Lucknow instead. */
  const fellBack = requested && !samePlace(requested, place) ? requested : null;

  return (
    <section className="sandhya stars relative overflow-hidden" aria-labelledby="panchang-title">
      <Mandala className="pointer-events-none absolute -top-24 -left-24 size-[22rem] text-diya/15" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:pt-14 md:pb-20">
        <div className="min-w-0">
          <h1 id="panchang-title" className="text-lg text-[#fbe3b6]/90 sm:text-xl">
            {t('hero.title', { date: dateLine, place: name(place) })}
          </h1>

          {day ? (
            <>
              <p
                className={cn(
                  'mt-3 font-heading text-5xl text-[#fbe3b6] sm:text-6xl',
                  hi ? 'leading-[1.3]' : 'leading-[1.08]',
                )}
              >
                {text(day, 'tithi_name')}
              </p>
              <p className="mt-3 max-w-xl text-lg">
                {t('hero.monthLine', {
                  month: text(day, 'lunar_month'),
                  paksha: pakshaName(day.paksha ?? pakshaOf(day.tithi)),
                })}
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                <Fact label={t('hero.nakshatra')} value={text(day, 'nakshatra')} />
                <Fact
                  label={t('hero.sunrise')}
                  value={time(day.sunrise)}
                  icon={<Sunrise className="size-5 shrink-0 text-diya" aria-hidden="true" />}
                />
                <Fact
                  label={t('hero.sunset')}
                  value={time(day.sunset)}
                  icon={<Sunset className="size-5 shrink-0 text-diya" aria-hidden="true" />}
                />
              </dl>

              {day.observances.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-2" aria-label={t('hero.todayIs')}>
                  {day.observances.map((o) => (
                    <li
                      key={observanceId(o)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/8 px-3 text-sm text-[#fbe3b6] ring-1 ring-[#fbe3b6]/25"
                    >
                      <Sparkles className="size-3.5 text-diya" aria-hidden="true" />
                      {text(o, 'name') || typeName(o.key)}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-6 text-sm" suppressHydrationWarning>
                {t('hero.footnote', { place: name(place), zone })}
              </p>
            </>
          ) : (
            <div className="mt-4 max-w-xl">
              <p className="font-heading text-3xl leading-snug text-[#fbe3b6]">{t('hero.unavailableTitle')}</p>
              <p className="mt-2">{t('hero.unavailableText')}</p>
              <Link
                href="/panchang"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-1 font-medium text-diya underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-diya/50 focus-visible:outline-none"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                {t('hero.reload')}
              </Link>
            </div>
          )}

          {fellBack && (
            <p role="status" className="mt-6 max-w-xl rounded-lg bg-white/8 px-3 py-2 text-sm text-[#fbe3b6] ring-1 ring-[#fbe3b6]/20">
              {t('place.fallback', { place: name(fellBack) })}
            </p>
          )}
          <PlaceControl place={fellBack ?? place} tone="dark" className="mt-6" />
        </div>

        <div className="relative mx-auto grid size-56 place-items-center sm:size-64 md:size-72" aria-hidden={!day}>
          <div
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(251_227_182/0.28),transparent_62%)]"
            aria-hidden="true"
          />
          <MoonPhase
            tithi={day?.tithi ?? 15}
            tone="gold"
            className="relative size-40 drop-shadow-[0_0_28px_rgb(251_227_182/0.45)] sm:size-48"
            label={
              day
                ? t('hero.moonLabel', {
                    tithi: text(day, 'tithi_name'),
                    percent: Math.round(
                      ((day.tithi <= 15 ? tithiInPaksha(day.tithi) : 30 - day.tithi) / 15) * 100,
                    ),
                  })
                : undefined
            }
          />
        </div>
      </div>
      <div className="toran" aria-hidden="true" />
    </section>
  );
}
