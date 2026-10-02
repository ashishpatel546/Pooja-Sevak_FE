'use client';

import { Copy, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import type { Booking } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** Live bookings whose family holds a completion code. */
export function hasLiveCode(b: Booking): b is Booking & { completion_code: string } {
  return (b.booking_status === 'confirmed' || b.booking_status === 'in_progress') && !!b.completion_code;
}

function useCopyCode(code: string) {
  const t = useT('booking');
  return async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('code.copied'));
    } catch {
      toast.error(t('code.copyFailed'));
    }
  };
}

/**
 * The code as a slim strip inside a booking in the My Bookings list: label,
 * digits and a copy button on one line, the "only after the puja" note below.
 */
export function CompletionCodeInline({ booking: b, className }: { booking: Booking; className?: string }) {
  const t = useT('booking');
  const copy = useCopyCode(b.completion_code ?? '');
  if (!hasLiveCode(b)) return null;
  const code = b.completion_code;
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center gap-2.5">
        <KeyRound className="size-4 shrink-0 text-sindoor" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">{t('code.title')}</span>
        <span
          className="font-heading text-xl leading-none tracking-[0.2em] text-heading tabular-nums select-all"
          aria-label={t('code.aria', { digits: code.split('').join(' ') })}
        >
          {code}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={copy}
          aria-label={t('code.copy')}
          className="-my-2 size-10 shrink-0"
        >
          <Copy aria-hidden="true" />
        </Button>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t('code.short')} {b.booking_type === 'online' && t('code.online')}
      </p>
    </div>
  );
}

/**
 * The family's "satisfaction code": shown only to the customer, to be told to
 * the pandit once the puja is complete. Full version for the booking page.
 */
export function CompletionCodeCard({ booking: b, className }: { booking: Booking; className?: string }) {
  const t = useT('booking');
  const copy = useCopyCode(b.completion_code ?? '');
  if (!hasLiveCode(b)) return null;
  const code = b.completion_code;
  const online = b.booking_type === 'online';
  const headingId = `code-h-${b.id}`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn('min-w-0 rounded-2xl border-2 border-dashed border-diya/60 bg-chandan p-5 sm:p-6', className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 id={headingId} className="flex items-center gap-2 text-xl">
            <KeyRound className="size-5 shrink-0 text-sindoor" aria-hidden="true" />
            {t('code.title')}
          </h2>
          <p
            className="mt-2 font-heading text-4xl tracking-[0.3em] text-heading tabular-nums select-all sm:text-5xl"
            aria-label={t('code.aria', { digits: code.split('').join(' ') })}
          >
            {code}
          </p>
        </div>
        <Button variant="outline" size="lg" onClick={copy} className="self-start sm:self-auto">
          <Copy aria-hidden="true" />
          {t('code.copy')}
        </Button>
      </div>
      <div className="mt-4 grid gap-2 text-sm">
        <p className="font-medium">{t('code.lead')}</p>
        {online && <p>{t('code.online')}</p>}
        <p className="flex items-start gap-1.5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t('code.warning')}
        </p>
      </div>
    </section>
  );
}
