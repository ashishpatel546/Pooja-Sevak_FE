'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { daysUntilIn } from '@/lib/format';
import { panchangHref, PANCHANG_MAX_DATE, PANCHANG_MIN_DATE, isPanchangDate, shiftDate } from '@/lib/panchang-date';
import { cn } from '@/lib/utils';
import { usePanchangText } from './use-panchang-text';

const control =
  'inline-flex min-h-11 items-center gap-2 rounded-full bg-white/8 text-[#fbe3b6] ring-1 ring-[#fbe3b6]/25 transition-colors hover:bg-white/14 focus-visible:ring-3 focus-visible:ring-diya/60 focus-visible:outline-none';

/**
 * Day switcher for the panchang hero: previous / next day, a native date
 * picker and a way back to today. The day lives in the URL (?date=) so it can
 * be shared and survives the back button.
 */
export function PanchangDateNav({
  date,
  today,
  tz,
  className,
}: {
  /** The day being shown. */
  date: string;
  /** Today's date key in tz. */
  today: string;
  tz: string;
  className?: string;
}) {
  const { t } = usePanchangText();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (key: string) => {
    if (!isPanchangDate(key) || key === date) return;
    startTransition(() => router.push(panchangHref(key, today), { scroll: false }));
  };
  const prev = shiftDate(date, -1);
  const next = shiftDate(date, 1);
  const offset = date === today ? 0 : daysUntilIn(date, tz, new Date(`${today}T12:00:00Z`));

  return (
    <nav aria-label={t('date.nav')} className={cn('flex flex-wrap items-center gap-2', className)}>
      <Link
        href={panchangHref(prev, today)}
        scroll={false}
        aria-label={t('date.prev')}
        aria-disabled={!isPanchangDate(prev)}
        className={cn(control, 'w-11 justify-center', !isPanchangDate(prev) && 'pointer-events-none opacity-40')}
        onClick={(e) => {
          e.preventDefault();
          go(prev);
        }}
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </Link>

      {/* The native input sits over the pill so a tap opens the system date picker everywhere. */}
      <label className={cn(control, 'relative cursor-pointer px-4 font-medium')}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin text-diya motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <CalendarDays className="size-4 text-diya" aria-hidden="true" />
        )}
        <span>{t('date.pick')}</span>
        <input
          type="date"
          value={date}
          min={PANCHANG_MIN_DATE}
          max={PANCHANG_MAX_DATE}
          aria-label={t('date.pick')}
          className="absolute inset-0 size-full cursor-pointer opacity-0 [color-scheme:dark]"
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.();
            } catch {
              /* the browser opens its own picker */
            }
          }}
          onChange={(e) => go(e.target.value)}
        />
      </label>

      <Link
        href={panchangHref(next, today)}
        scroll={false}
        aria-label={t('date.next')}
        aria-disabled={!isPanchangDate(next)}
        className={cn(control, 'w-11 justify-center', !isPanchangDate(next) && 'pointer-events-none opacity-40')}
        onClick={(e) => {
          e.preventDefault();
          go(next);
        }}
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </Link>

      {offset !== 0 && (
        <>
          <span className="px-1 text-sm text-[#f4e6d4]/80">
            {offset > 0 ? t.plural('date.ahead', offset) : t.plural('date.ago', -offset)}
          </span>
          <Link
            href="/panchang"
            scroll={false}
            className="inline-flex min-h-11 items-center rounded-full px-2 text-sm font-semibold text-diya underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-diya/50 focus-visible:outline-none"
            onClick={(e) => {
              e.preventDefault();
              go(today);
            }}
          >
            {t('date.today')}
          </Link>
        </>
      )}
    </nav>
  );
}
