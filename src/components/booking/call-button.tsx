'use client';

import { useEffect } from 'react';
import { MessageCircle, Phone, PhoneOff } from 'lucide-react';
import type { BookingContact } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApi } from '@/components/dashboard/use-api';

/** Longest wait before asking the server again (setTimeout caps at ~24.8 days). */
const MAX_WAIT_MS = 6 * 60 * 60_000;

/** wa.me wants the full international number as digits only; bare 10-digit numbers are Indian. */
export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

/**
 * Call the other side of a booking over the normal mobile network. The
 * server hands out the number only from 5 hours before the puja until 3 hours
 * after it ends; until then this shows when calling opens.
 */
export function CallButton({
  bookingId,
  token,
  className,
}: {
  bookingId: string;
  token: string | null;
  className?: string;
}) {
  const t = useT('chat');
  const f = useFormat();
  const contact = useApi<BookingContact>(`/bookings/${bookingId}/contact`, token);
  const c = contact.data;
  const reload = contact.reload;

  // Ask again the moment the window opens (or closes).
  useEffect(() => {
    if (!c) return;
    const next = c.open ? c.closes_at : c.reason === 'not_yet' ? c.opens_at : null;
    if (!next) return;
    const wait = new Date(next).getTime() - Date.now() + 1_000;
    const id = window.setTimeout(reload, Math.min(Math.max(wait, 1_000), MAX_WAIT_MS));
    return () => window.clearTimeout(id);
  }, [c, reload]);

  if (!c) return null;
  const label = c.with === 'pandit' ? t('call.withPandit') : t('call.withFamily');
  const at = (iso: string) => ({ time: f.time(iso), date: f.date(iso, { weekday: undefined, year: undefined }) });

  if (c.open && c.phone) {
    return (
      <div className={cn('grid gap-1', className)}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="lg" className="w-full sm:w-fit" render={<a href={`tel:${c.phone}`} />} nativeButton={false}>
            <Phone aria-hidden="true" />
            {label}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-fit"
            render={<a href={whatsappUrl(c.phone)} target="_blank" rel="noopener noreferrer" />}
            nativeButton={false}
          >
            <MessageCircle aria-hidden="true" />
            {t('call.whatsapp')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('call.number', { phone: c.phone })} · {t('call.openUntil', at(c.closes_at))}
        </p>
        <p className="text-xs text-muted-foreground">{t('call.whatsappHint')}</p>
      </div>
    );
  }

  const note =
    c.reason === 'not_yet'
      ? t('call.opensAt', at(c.opens_at))
      : c.reason === 'finished'
        ? t('call.finished')
        : c.reason === 'no_number'
          ? t('call.noNumber')
          : t('call.notConfirmed');
  return (
    <div className={cn('grid gap-1', className)}>
      <Button size="lg" variant="outline" className="w-full sm:w-fit" disabled>
        <PhoneOff aria-hidden="true" />
        {label}
      </Button>
      <p className="text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
