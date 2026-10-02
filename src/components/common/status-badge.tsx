'use client';

import type { BookingStatus, PaymentStatus } from '@/lib/types';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

const BOOKING: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: 'Awaiting payment', cls: 'bg-accent text-accent-foreground ring-diya/40' },
  confirmed: { label: 'Confirmed', cls: 'bg-tulsi/10 text-tulsi ring-tulsi/30' },
  in_progress: { label: 'Puja in progress', cls: 'bg-sindoor/10 text-sindoor ring-sindoor/30' },
  completed: { label: 'Completed', cls: 'bg-secondary/10 text-heading ring-secondary/25' },
  cancelled: { label: 'Cancelled', cls: 'bg-muted text-muted-foreground ring-border' },
};

const PAYMENT: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: 'Payment due', cls: 'bg-accent text-accent-foreground ring-diya/40' },
  paid: { label: 'Paid', cls: 'bg-tulsi/10 text-tulsi ring-tulsi/30' },
  failed: { label: 'Payment failed', cls: 'bg-destructive/10 text-destructive ring-destructive/30' },
  refunded: { label: 'Refunded', cls: 'bg-muted text-muted-foreground ring-border' },
};

const base =
  'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset';

/** Translated status labels: `const label = useStatusLabels(); label.booking('confirmed')`. */
export function useStatusLabels() {
  const t = useT('customer');
  return {
    booking: (s: BookingStatus) => (s in BOOKING ? t(`status.booking.${s}`) : s),
    payment: (s: PaymentStatus) => (s in PAYMENT ? t(`status.payment.${s}`) : s),
  };
}

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const label = useStatusLabels();
  const key = status in BOOKING ? status : 'pending';
  return (
    <span className={cn(base, BOOKING[key].cls, className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label.booking(key)}
    </span>
  );
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const label = useStatusLabels();
  const key = status in PAYMENT ? status : 'pending';
  return <span className={cn(base, PAYMENT[key].cls, className)}>{label.payment(key)}</span>;
}

/** English label (non-hook). Prefer `useStatusLabels().booking` in components. */
export const bookingStatusLabel = (s: BookingStatus) => BOOKING[s]?.label ?? s;
