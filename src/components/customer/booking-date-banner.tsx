'use client';

import Link from 'next/link';
import { CalendarHeart, X } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import type { BookingDate } from '@/lib/booking-date';
import { cn } from '@/lib/utils';
import { usePanchangText } from '@/components/ritual/use-panchang-text';

/**
 * "Booking for {date}" — shown while a date chosen on a sacred-day card is being
 * carried through the booking path. Only ever renders validated values
 * (see readBookingDate); `clearHref` is the same page without date/occasion.
 */
export function BookingDateBanner({
  ctx,
  clearHref,
  className,
}: {
  ctx: BookingDate;
  clearHref: string;
  className?: string;
}) {
  const t = useT('booking');
  const f = useFormat();
  const { typeName } = usePanchangText();
  if (!ctx.date) return null;
  const date = f.dateKey(ctx.date, { weekday: 'long', month: 'long' });
  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-xl border border-diya/40 bg-chandan px-4 py-2 text-sm text-foreground',
        className,
      )}
    >
      <CalendarHeart className="size-5 shrink-0 text-sindoor" aria-hidden="true" />
      <p className="min-w-0 flex-1 font-medium">
        {ctx.occasion
          ? t('carry.forOccasion', { occasion: typeName(ctx.occasion), date })
          : t('carry.for', { date })}
      </p>
      <Link
        href={clearHref}
        replace
        scroll={false}
        aria-label={t('carry.clearAria', { date })}
        className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <X className="size-4" aria-hidden="true" />
        <span className="max-sm:sr-only">{t('carry.clear')}</span>
      </Link>
    </div>
  );
}
