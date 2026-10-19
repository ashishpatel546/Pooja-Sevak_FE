'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { Clock, Sunrise, Sunset } from 'lucide-react';
import { INTL_LOCALE } from '@/i18n/config';
import { dateKeyIn, formatTimeIn, midnightIn } from '@/lib/format';
import type { DayTithi, PanchangDay } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MoonPhase } from './moon-phase';
import { usePanchangText } from './use-panchang-text';

const MINUTE = 60_000;

const subscribeMinutes = (onTick: () => void) => {
  const id = window.setInterval(onTick, 15_000);
  return () => window.clearInterval(id);
};
const thisMinute = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const noTime = () => null;

/** The current minute on the client; null on the server so markup agrees. */
function useClientNow(): number | null {
  return useSyncExternalStore(subscribeMinutes, thisMinute, noTime);
}

type Phase = 'done' | 'now' | 'next';

/** Words and positions shared by the full timeline and the one-line summary. */
function useTithiTimes(day: PanchangDay, tz: string) {
  const { t, locale, tithiName } = usePanchangText();
  const now = useClientNow();
  return useMemo(() => {
    const tithis = day.tithis ?? [];
    const dayStart = midnightIn(day.date, tz).getTime();
    const dayEnd = midnightIn(dateKeyIn(tz, 1, new Date(dayStart + 12 * 3_600_000)), tz).getTime();
    const span = dayEnd - dayStart;
    /** Position of an instant along the day, 0–100. */
    const pct = (iso: string | number) =>
      Math.min(100, Math.max(0, ((new Date(iso).getTime() - dayStart) / span) * 100));

    const clock = (iso: string) => formatTimeIn(iso, tz, locale, { spoken: true });
    const weekday = (iso: string) =>
      new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: tz, weekday: 'long' }).format(new Date(iso));
    /** "today 12:50 pm" / "आज दोपहर 12:50"; other days by name in Hindi, where कल is ambiguous. */
    const when = (iso: string) => {
      const ms = new Date(iso).getTime();
      const key = ms < dayStart ? 'times.yesterday' : ms >= dayEnd ? 'times.tomorrow' : 'times.today';
      return t(key, { time: clock(iso), weekday: weekday(iso) });
    };
    const duration = (ms: number) => {
      const total = Math.max(1, Math.round(ms / MINUTE));
      const h = Math.floor(total / 60);
      const m = total % 60;
      if (!h) return t('times.m', { m });
      if (!m) return t('times.h', { h });
      return t('times.hm', { h, m });
    };
    const phase = (x: DayTithi): Phase | null => {
      if (now === null) return null;
      if (now >= new Date(x.end).getTime()) return 'done';
      if (now >= new Date(x.start).getTime()) return 'now';
      return 'next';
    };
    const nowPct = now !== null && now >= dayStart && now < dayEnd ? pct(now) : null;
    /** Full name in the visitor's language. */
    const name = (x: DayTithi) => (locale === 'hi' ? x.name_hi : x.name_en);
    /** Bare name of the tithi after `x` ("Dashami"). */
    const nextName = (x: DayTithi) => tithiName((x.tithi % 30) + 1);

    return { t, tithis, now, pct, nowPct, clock, when, duration, phase, name, nextName, tithiName };
  }, [day.tithis, day.date, tz, t, locale, tithiName, now]);
}

/**
 * Dainik panchang for the twilight hero: a midnight-to-midnight ribbon with the
 * daylight hours lit, each tithi as a band and a lamp at "now", then the tithis
 * in order with when each began and ends.
 */
export function TithiTimeline({ day, tz, className }: { day: PanchangDay; tz: string; className?: string }) {
  const x = useTithiTimes(day, tz);
  if (!x.tithis.length) return null;
  const { t } = x;
  const udaya = x.tithis.some((d) => d.at_sunrise);

  return (
    <section aria-labelledby="tithi-times-title" className={cn('max-w-2xl', className)}>
      <h2 id="tithi-times-title" className="flex items-center gap-2 font-sans text-base font-semibold text-[#fbe3b6]">
        <Clock className="size-4 text-diya" aria-hidden="true" />
        {t('times.title')}
      </h2>

      {/* Ribbon: decorative summary of the list below. */}
      <div className="mt-9 mb-9" aria-hidden="true">
        <div className="relative">
          {/* Change instants, labelled above the ribbon */}
          {x.tithis.slice(1).map((d) => {
            const p = x.pct(d.start);
            return (
              <span
                key={`b-${d.start}`}
                className="absolute bottom-full mb-1.5 -translate-x-1/2 text-xs whitespace-nowrap text-[#fbe3b6]"
                style={{ left: `${Math.min(88, Math.max(12, p))}%` }}
                suppressHydrationWarning
              >
                {x.clock(d.start)}
              </span>
            );
          })}

          <div className="relative h-12 overflow-hidden rounded-xl bg-[#0f0a1f]/70 ring-1 ring-[#fbe3b6]/20">
            {/* Daylight */}
            <div
              className="absolute inset-y-0 bg-[linear-gradient(90deg,transparent,rgb(251_227_182/0.13)_18%,rgb(251_227_182/0.13)_82%,transparent)]"
              style={{ left: `${x.pct(day.sunrise)}%`, width: `${x.pct(day.sunset) - x.pct(day.sunrise)}%` }}
            />
            {x.tithis.map((d, i) => {
              const left = x.pct(d.start);
              const width = x.pct(d.end) - left;
              const phase = x.phase(d);
              return (
                <div
                  key={d.start}
                  className={cn(
                    'absolute inset-y-0 flex items-center justify-center px-2',
                    i > 0 && 'border-l-2 border-diya',
                    phase === 'now' && 'bg-diya/22',
                    phase === 'done' && 'opacity-55',
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  {width > 14 && (
                    <span className="truncate text-sm font-medium text-[#fff4e0]">{x.tithiName(d.tithi)}</span>
                  )}
                </div>
              );
            })}
            {x.nowPct !== null && (
              <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[#fff4e0]" style={{ left: `${x.nowPct}%` }} />
            )}
          </div>

          {x.nowPct !== null && (
            <span
              className="absolute top-full mt-1 -translate-x-1/2 text-xs font-semibold whitespace-nowrap text-[#fff4e0]"
              style={{ left: `${Math.min(94, Math.max(6, x.nowPct))}%` }}
            >
              <span className="mx-auto mb-0.5 block size-2 rounded-full bg-diya shadow-[0_0_10px_3px_rgb(240_179_86/0.7)] motion-safe:animate-pulse" />
              {t('times.nowMark')}
            </span>
          )}

          {/* Sunrise and sunset under the ribbon, unless "now" sits on top of them */}
          {(
            [
              [day.sunrise, Sunrise],
              [day.sunset, Sunset],
            ] as const
          ).map(([iso, Icon]) =>
            x.nowPct !== null && Math.abs(x.pct(iso) - x.nowPct) < 9 ? null : (
              <span
                key={iso}
                className="absolute top-full mt-1.5 flex -translate-x-1/2 items-center gap-1 text-xs whitespace-nowrap text-[#f4e6d4]/70"
                style={{ left: `${x.pct(iso)}%` }}
                suppressHydrationWarning
              >
                <Icon className="size-3.5 text-diya" />
                {x.clock(iso)}
              </span>
            ),
          )}
        </div>
      </div>

      <ol className="divide-y divide-[#fbe3b6]/15 border-y border-[#fbe3b6]/15">
        {x.tithis.map((d) => {
          const phase = x.phase(d);
          const startMs = new Date(d.start).getTime();
          const endMs = new Date(d.end).getTime();
          return (
            <li
              key={d.start}
              className={cn('flex gap-3 py-3.5', phase === 'done' && 'opacity-60')}
              aria-current={phase === 'now' ? 'time' : undefined}
            >
              <MoonPhase tithi={d.tithi} tone="gold" className="mt-1 size-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <p className="font-heading text-xl leading-snug text-[#fbe3b6]">{x.name(d)}</p>
                  {d.at_sunrise && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-diya/15 px-2 py-0.5 text-xs font-medium text-[#fbe3b6] ring-1 ring-diya/40">
                      <Sunrise className="size-3.5 text-diya" aria-hidden="true" />
                      {t('times.udaya')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[0.95rem]" suppressHydrationWarning>
                  <span className="whitespace-nowrap">{t('times.from', { when: x.when(d.start) })}</span>{' '}
                  <span className="whitespace-nowrap">{t('times.until', { when: x.when(d.end) })}</span>
                </p>
                {phase === 'now' && x.now !== null && (
                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="h-1 w-28 overflow-hidden rounded-full bg-[#fbe3b6]/15"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(((x.now - startMs) / (endMs - startMs)) * 100)}
                      aria-label={t('times.now')}
                    >
                      <div
                        className="h-full rounded-full bg-diya"
                        style={{ width: `${((x.now - startMs) / (endMs - startMs)) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium text-[#fbe3b6]">
                      {t('times.now')}, {t('times.left', { time: x.duration(endMs - x.now) })}
                    </p>
                  </div>
                )}
                {phase === 'next' && x.now !== null && (
                  <p className="mt-1 text-sm text-[#f4e6d4]/70">
                    {t('times.startsIn', { time: x.duration(startMs - x.now) })}
                  </p>
                )}
                {phase === 'done' && <p className="mt-1 text-sm text-[#f4e6d4]/70">{t('times.done')}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {udaya && <p className="mt-3 text-sm text-[#f4e6d4]/70">{t('times.udayaHint')}</p>}
    </section>
  );
}

/**
 * One line for compact cards: "Navami until today 12:50 pm, then Dashami".
 * Follows the clock once mounted, so it names whichever tithi is running now.
 */
export function TithiChangeLine({ day, tz, className }: { day: PanchangDay; tz: string; className?: string }) {
  const x = useTithiTimes(day, tz);
  const current = x.tithis.find((d) => x.phase(d) === 'now') ?? x.tithis.find((d) => d.at_sunrise);
  if (!current) return null;
  const text =
    x.tithis.length === 1
      ? x.t('times.lineAllDay', { tithi: x.tithiName(current.tithi), when: x.when(current.end) })
      : x.t('times.line', {
          tithi: x.tithiName(current.tithi),
          when: x.when(current.end),
          next: x.nextName(current),
        });
  return (
    <p className={cn('flex items-start gap-1.5 text-sm', className)} suppressHydrationWarning>
      <Clock className="mt-0.5 size-4 shrink-0 text-diya" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}
