'use client';

import Link from 'next/link';
import { LifeBuoy, MessageCircle, Phone } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { SUPPORT_PHONE, supportWhatsappUrl } from '@/lib/support';
import { Button } from '@/components/ui/button';

/** "Trouble with the online puja?" — reach the Pooja Sevak team by call, WhatsApp or the contact page. */
export function OnlinePujaHelp({ bookingId, className }: { bookingId: string; className?: string }) {
  const t = useT('booking');
  const whatsapp = supportWhatsappUrl(t('help.whatsappText', { id: bookingId }));
  return (
    <div className={cn('rounded-lg border border-dashed p-3', className)}>
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <LifeBuoy className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {t('help.title')}
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button variant="outline" size="sm" render={<a href={`tel:${SUPPORT_PHONE}`} />} nativeButton={false}>
          <Phone aria-hidden="true" /> {t('help.call')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          render={<a href={whatsapp} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          <MessageCircle aria-hidden="true" /> {t('help.whatsapp')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/contact?topic=online&booking=${encodeURIComponent(bookingId)}`} />}
          nativeButton={false}
        >
          {t('help.contact')}
        </Button>
      </div>
    </div>
  );
}
