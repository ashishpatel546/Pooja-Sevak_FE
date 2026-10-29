'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useFormat, useT } from '@/i18n';
import type { ActiveOffer } from '@/lib/types';
import { useApiQuery } from '@/components/customer/use-api';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'ps_offer_dismissed';

function readDismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/**
 * Festival offer banner (from GET /offers/active). On a puja page pass
 * `pujaId` to hide offers restricted to other pujas. Renders nothing when
 * there is no live offer.
 */
export function OfferBanner({ pujaId, className }: { pujaId?: string | null; className?: string }) {
  const t = useT('growth');
  const f = useFormat();
  const offers = useApiQuery<ActiveOffer[]>('/offers/active');
  const [dismissed, setDismissed] = useState<string[]>(() => (typeof window === 'undefined' ? [] : readDismissed()));

  const offer = (offers.data ?? []).find(
    (o) =>
      !dismissed.includes(o.code) &&
      (!o.service_definition_ids.length || !pujaId || o.service_definition_ids.includes(pujaId)),
  );
  if (!offer) return null;

  const text = (f.locale === 'en' ? offer.banner_text_en : offer.banner_text_hi) ?? offer.banner_text_hi ?? offer.banner_text_en;
  const until = offer.valid_to ? f.date(offer.valid_to, { day: 'numeric', month: 'long' }) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code);
      toast.success(t('offer.copied', { code: offer.code }));
    } catch {
      // Clipboard blocked: the code is visible on the banner anyway.
    }
  };
  const dismiss = () => {
    const next = [...dismissed, offer.code];
    setDismissed(next);
    try {
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <aside
      aria-label={t('offer.label')}
      className={cn('border-b border-diya/30 bg-gradient-to-r from-diya/15 via-accent/40 to-diya/15', className)}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-diya sm:mt-0" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm sm:text-base">
            {offer.festival_label && <span className="mr-2 font-semibold">{offer.festival_label}</span>}
            <span>{text}</span>
            {until && <span className="ml-1 text-muted-foreground">({t('offer.until', { date: until })})</span>}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="-my-2 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground sm:order-last"
            aria-label={t('offer.dismiss')}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-2 pl-8 sm:pl-0">
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-dashed border-diya/60 bg-background/70 px-3 font-mono text-sm font-semibold tracking-wider hover:bg-background"
            aria-label={t('offer.copy', { code: offer.code })}
          >
            {offer.code}
            <Copy className="size-3.5" aria-hidden="true" />
          </button>
          {offer.banner_link && (
            <Link
              href={offer.banner_link}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('offer.cta')}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
