'use client';

import { Check, X } from 'lucide-react';
import type { Booking } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useFormat, useT, type Translator } from '@/i18n';

type Stage = { id: string; label: string; done: boolean; note?: string; tone?: 'cancel' };

function stages(
  b: Booking,
  now: number,
  t: Translator<'customer'>,
  f: ReturnType<typeof useFormat>,
): Stage[] {
  const paid = b.payment_status === 'paid' || b.payment_status === 'refunded';
  const s = b.booking_status;
  if (s === 'cancelled') {
    return [
      { id: 'booked', label: t('timeline.booked'), done: true, note: f.date(b.created_at) },
      ...(paid ? [{ id: 'paid', label: t('timeline.paid'), done: true }] : []),
      {
        id: 'cancelled',
        label: t('timeline.cancelled'),
        done: true,
        tone: 'cancel' as const,
        note:
          b.payment_status === 'refunded'
            ? t('timeline.refunding')
            : (b.cancellation_reason ?? undefined),
      },
    ];
  }
  const confirmed = s === 'confirmed' || s === 'in_progress' || s === 'completed';
  const pujaDay = s === 'in_progress' || s === 'completed' || (confirmed && now >= +new Date(b.start_time));
  return [
    { id: 'booked', label: t('timeline.booked'), done: true, note: f.date(b.created_at) },
    { id: 'paid', label: t('timeline.paid'), done: paid, note: paid ? undefined : t('timeline.awaitingPayment') },
    {
      id: 'confirmed',
      label: t('timeline.confirmed'),
      done: confirmed,
      note: confirmed ? undefined : t('timeline.confirmOnPay'),
    },
    {
      id: 'pujaDay',
      label: t('timeline.pujaDay'),
      done: pujaDay,
      note: t('timeline.ist', { dateTime: f.dateTime(b.start_time) }),
    },
    { id: 'completed', label: t('timeline.completed'), done: s === 'completed' },
  ];
}

/** Vertical on mobile, horizontal from `sm`. */
export function BookingTimeline({ booking, now }: { booking: Booking; now: number }) {
  const t = useT('customer');
  const f = useFormat();
  const list = stages(booking, now, t, f);
  const current = list.findIndex((st) => !st.done);
  return (
    <ol className="grid gap-0 sm:flex sm:gap-2" aria-label={t('steps.nav')}>
      {list.map((st, i) => {
        const isCurrent = i === current;
        return (
          <li
            key={st.id}
            className="relative flex gap-3 pb-5 last:pb-0 sm:flex-1 sm:flex-col sm:gap-2 sm:pb-0"
            aria-current={isCurrent ? 'step' : undefined}
          >
            {i < list.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-8 bottom-0 left-[15px] w-px sm:top-[15px] sm:right-0 sm:left-10 sm:h-px sm:w-auto',
                  list[i + 1].done ? (list[i + 1].tone === 'cancel' ? 'bg-border' : 'bg-tulsi/60') : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative grid size-8 shrink-0 place-items-center rounded-full border text-sm',
                st.done && st.tone === 'cancel' && 'border-muted-foreground bg-muted text-muted-foreground',
                st.done && st.tone !== 'cancel' && 'border-tulsi bg-tulsi text-white',
                !st.done && isCurrent && 'border-primary bg-accent text-primary',
                !st.done && !isCurrent && 'bg-card text-muted-foreground',
              )}
            >
              {st.done ? (
                st.tone === 'cancel' ? (
                  <X className="size-4" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )
              ) : (
                <span className="size-2 rounded-full bg-current" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 pt-1 sm:pt-0 sm:pr-2">
              <span className={cn('block text-sm font-medium', !st.done && !isCurrent && 'text-muted-foreground')}>
                {st.label}
                <span className="sr-only">
                  {' '}
                  {st.done ? t('timeline.done') : isCurrent ? t('timeline.current') : t('timeline.upcoming')}
                </span>
              </span>
              {st.note && <span className="block text-xs text-muted-foreground">{st.note}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
