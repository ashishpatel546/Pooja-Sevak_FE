'use client';

import Link from 'next/link';
import { ArrowRight, Languages, MapPin, ScrollText, Video } from 'lucide-react';
import type { PanditListItem } from '@/lib/types';
import { applyBookingDate, type BookingDate } from '@/lib/booking-date';
import { cn } from '@/lib/utils';
import { pick, useFormat, useT, type Translator } from '@/i18n';
import type enCustomer from '@/i18n/messages/en/customer';
import { PanditAvatar } from '@/components/common/pandit-avatar';
import { Rating } from '@/components/common/rating';
import { RatingParamsInline } from '@/components/common/rating-breakdown';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** "2.4 km away" — pass the 'customer' translator for the visitor's language. */
export function formatDistance(
  km: number | string | null | undefined,
  t?: Translator<'customer'>,
): string | null {
  if (km === null || km === undefined || km === '') return null;
  const n = Number(km);
  if (!Number.isFinite(n)) return null;
  if (n < 1) {
    const m = Math.max(100, Math.round((n * 1000) / 100) * 100);
    return t ? t('card.distanceM', { m }) : `${m} m away`;
  }
  const value = n < 10 ? n.toFixed(1) : Math.round(n);
  return t ? t('card.distanceKm', { km: value }) : `${value} km away`;
}

const LANGUAGE_KEYS: Record<string, Extract<keyof typeof enCustomer, `lang.${string}`>> = {
  hindi: 'lang.hindi',
  sanskrit: 'lang.sanskrit',
  english: 'lang.english',
  awadhi: 'lang.awadhi',
  bhojpuri: 'lang.bhojpuri',
  maithili: 'lang.maithili',
  bengali: 'lang.bengali',
  bangla: 'lang.bengali',
  marathi: 'lang.marathi',
  gujarati: 'lang.gujarati',
  punjabi: 'lang.punjabi',
  tamil: 'lang.tamil',
  telugu: 'lang.telugu',
  kannada: 'lang.kannada',
  malayalam: 'lang.malayalam',
  odia: 'lang.odia',
  oriya: 'lang.odia',
  urdu: 'lang.urdu',
  nepali: 'lang.nepali',
};

/** Translates known language names from the API ("Hindi" → "हिन्दी"); others are shown as sent. */
export function useLanguageNames() {
  const t = useT('customer');
  return (languages: string[] | null | undefined): string =>
    (languages ?? [])
      .map((l) => {
        const key = LANGUAGE_KEYS[l.trim().toLowerCase()];
        return key ? t(key) : l;
      })
      .join(', ');
}

/** Pandit summary used on /browse and /online. */
export function PanditCard({
  pandit,
  serviceDefinitionId,
  online = false,
  bookingDate,
  className,
}: {
  pandit: PanditListItem;
  serviceDefinitionId?: string | null;
  online?: boolean;
  /** A validated date/occasion being carried to the pandit's Book buttons. */
  bookingDate?: BookingDate;
  className?: string;
}) {
  const t = useT('customer');
  const f = useFormat();
  const languageNames = useLanguageNames();
  const qs = new URLSearchParams();
  if (serviceDefinitionId) qs.set('service', serviceDefinitionId);
  if (online) qs.set('online', '1');
  if (bookingDate) applyBookingDate(qs, bookingDate);
  const href = `/pandits/${pandit.id}${qs.size ? `?${qs.toString()}` : ''}`;
  const distance = online ? null : formatDistance(pandit.distance_km, t);
  const services = [...(pandit.services ?? [])].sort((a, b) => {
    // The service the devotee is looking for comes first.
    if (serviceDefinitionId) {
      if (a.service_definition_id === serviceDefinitionId) return -1;
      if (b.service_definition_id === serviceDefinitionId) return 1;
    }
    return 0;
  });
  const top = services.slice(0, 3);
  const more = services.length - top.length;
  const years = Number(pandit.experience_years) || 0;

  return (
    <article
      className={cn(
        'group flex flex-col rounded-xl border bg-card p-5 transition-shadow hover:shadow-[0_18px_40px_-28px_rgb(42_31_74/0.5)]',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <PanditAvatar name={pandit.name} photo={pandit} verified={pandit.is_verified} />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl leading-snug">
            <Link href={href} className="rounded-sm hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              {pandit.name}
            </Link>
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Rating value={pandit.average_rating} count={Number(pandit.total_reviews) || 0} />
            {years > 0 && (
              <span className="text-sm text-muted-foreground">{t.plural('card.experience', years)}</span>
            )}
          </div>
          <RatingParamsInline breakdown={pandit.rating_breakdown} className="mt-1" />
        </div>
      </div>

      <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
        {distance && (
          <li className="flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">{distance}</span>
              {pandit.city ? ` · ${pandit.city}` : ''}
            </span>
          </li>
        )}
        {online && (
          <li className="flex min-w-0 items-center gap-2">
            <Video className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              {pandit.city ? t('card.onlineFrom', { city: pandit.city }) : t('card.online')}
            </span>
          </li>
        )}
        {pandit.languages?.length > 0 && (
          <li className="flex min-w-0 items-center gap-2">
            <Languages className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">{languageNames(pandit.languages)}</span>
          </li>
        )}
        {pandit.tradition && (
          <li className="flex min-w-0 items-center gap-2">
            <ScrollText className="size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">{pandit.tradition}</span>
          </li>
        )}
      </ul>

      {top.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="sr-only">{t('card.offered')}</h4>
          <ul className="grid gap-2">
            {top.map((s) => (
              <li
                key={s.id}
                className={cn(
                  'flex items-baseline justify-between gap-3 text-sm',
                  s.service_definition_id === serviceDefinitionId && 'rounded-lg bg-accent/60 px-2 py-1 -mx-2',
                )}
              >
                <span className="min-w-0">
                  <span className="font-medium">{pick(s, 'service_name', f.locale)}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {f.duration(Number(s.standard_duration_minutes))}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{f.inr(s.standard_price)}</span>
              </li>
            ))}
          </ul>
          {more > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">{t.plural('card.more', more)}</p>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        <Button
          variant="outline"
          className="w-full group-hover:border-primary/50"
          render={<Link href={href} />}
          nativeButton={false}
        >
          {t('card.view')}
          <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </article>
  );
}

export function PanditCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5" aria-hidden="true">
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
      <div className="mt-5 space-y-2 border-t pt-4">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </div>
      <Skeleton className="mt-5 h-10 rounded-lg" />
    </div>
  );
}
