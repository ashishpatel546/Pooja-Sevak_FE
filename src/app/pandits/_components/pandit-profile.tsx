'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  Clock,
  Feather,
  Languages,
  MapPin,
  Package,
  MessageSquareQuote,
  ScrollText,
  UserX,
  Video,
} from 'lucide-react';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import type { PanditPublic } from '@/lib/types';
import { applyBookingDate, NO_BOOKING_DATE, readBookingDate, withBookingDate, type BookingDate } from '@/lib/booking-date';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common/empty-state';
import { DiyaLoader } from '@/components/common/loading';
import { PageShell } from '@/components/common/page-header';
import { PanditAvatar, VerifiedPill } from '@/components/common/pandit-avatar';
import { ProfilePhoto } from '@/components/common/profile-photo';
import { PujaIcon } from '@/components/common/puja-icon';
import { Rating } from '@/components/common/rating';
import { RatingBars, ReviewParams, Stars } from '@/components/common/rating-breakdown';
import { Button } from '@/components/ui/button';
import { BookingDateBanner } from '@/components/customer/booking-date-banner';
import { useApiQuery } from '@/components/customer/use-api';
import { useLanguageNames } from '@/components/customer/pandit-card';
import { SamagriListButton, samagriForMode } from '@/components/common/samagri-list';
import { samagriKitPriceFor } from '@/lib/samagri';

type ProfileService = PanditPublic['services'][number];

function ServiceRow({
  s,
  panditId,
  highlighted,
  online,
  canOnline,
  bookingDate,
}: {
  s: ProfileService;
  panditId: string;
  highlighted: boolean;
  online: boolean;
  canOnline: boolean;
  bookingDate: BookingDate;
}) {
  const t = useT('customer');
  const ts = useT('samagri');
  const f = useFormat();
  const { locale } = useLocale();
  const def = s.service_definition;
  const name = def ? pick(def, 'name', locale) : t('puja.fallbackName');
  const tagline = def ? pick(def, 'tagline', locale) : null;
  const lighter = s.offers_lighter_mode && s.lighter_mode_price !== null && s.lighter_mode_price !== undefined;
  const fullList = samagriForMode(ts, s, 'standard');
  const lighterList = samagriForMode(ts, s, 'lighter');
  const lighterKit = samagriKitPriceFor(s, 'lighter');
  const bookHref = withBookingDate(
    `/pandits/${panditId}/book?service=${s.id}${online && def?.supports_online ? '&type=online' : ''}`,
    bookingDate,
  );
  return (
    <li
      id={`service-${s.service_definition_id}`}
      className={cn(
        'scroll-mt-24 rounded-xl border bg-card p-4 sm:p-5',
        highlighted && 'border-primary/60 bg-accent/40 ring-1 ring-primary/30',
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <PujaIcon category={def?.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="min-w-0 text-xl leading-snug">{name}</h3>
            {highlighted && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {t('profile.lookingFor')}
              </span>
            )}
          </div>
          {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}

          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <dt className="text-xs text-muted-foreground">{t('profile.standard')}</dt>
              <dd className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-lg font-semibold tabular-nums">{f.inr(s.standard_price)}</span>
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {f.duration(Number(s.standard_duration_minutes))}
                </span>
              </dd>
            </div>
            {lighter && (
              <div className="rounded-lg border border-dashed px-3 py-2">
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Feather className="size-3.5" aria-hidden="true" />
                  {t('profile.lighter')}
                </dt>
                <dd className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-lg font-semibold tabular-nums">{f.inr(s.lighter_mode_price)}</span>
                  {s.lighter_mode_duration_minutes ? (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {f.duration(Number(s.lighter_mode_duration_minutes))}
                    </span>
                  ) : null}
                </dd>
              </div>
            )}
          </dl>
          {lighter && (
            <p className="mt-2 text-xs text-muted-foreground">{t('profile.lighterHint')}</p>
          )}
          {def?.supports_online && canOnline && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-tulsi">
              <Video className="size-3.5" aria-hidden="true" />
              {t('profile.availableOnline')}
            </p>
          )}
          {s.offers_samagri_kit && s.samagri_kit_price != null && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <Package className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {lighter && lighterKit > 0 && lighterKit !== Number(s.samagri_kit_price)
                ? ts('profile.kitBoth', { full: f.inr(s.samagri_kit_price), lighter: f.inr(lighterKit) })
                : ts('profile.kit', { price: f.inr(s.samagri_kit_price) })}
            </p>
          )}
          {/* Both versions with their own lists: one link each. */}
          <div className="mt-1 flex flex-wrap gap-x-5">
            <SamagriListButton
              {...fullList}
              items={def?.samagri}
              pujaName={name}
              label={lighter && s.lighter_samagri_list ? fullList.modeLabel : undefined}
            />
            {lighter && s.lighter_samagri_list && (
              <SamagriListButton {...lighterList} pujaName={name} label={lighterList.modeLabel} />
            )}
          </div>
        </div>
        <Button
          className="w-full sm:w-auto"
          variant={highlighted ? 'default' : 'outline'}
          render={<Link href={bookHref} />}
          nativeButton={false}
          aria-label={t('profile.bookAria', { puja: name })}
        >
          {t('profile.book')}
        </Button>
      </div>
    </li>
  );
}

function Profile({ initial }: { initial: PanditPublic | null }) {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const highlight = params.get('service');
  const fromOnline = params.get('online') === '1';
  const bookingDate = readBookingDate(params);
  const t = useT('customer');
  const f = useFormat();
  const languageNames = useLanguageNames();
  // Server-rendered when the server could reach the API; otherwise fetch here.
  const query = useApiQuery<PanditPublic>(!initial && id ? `/pandits/${encodeURIComponent(id)}` : null);
  const p = initial ?? query.data;
  const { loading, error, status } = query;

  if (loading) return <DiyaLoader label={t('profile.loading')} />;
  if (error || !p) {
    return (
      <PageShell size="narrow">
        <EmptyState
          icon={UserX}
          title={status === 404 ? t('profile.notFound') : t('profile.loadError')}
          action={
            <Button render={<Link href="/browse" />} nativeButton={false}>
              {t('profile.findAnother')}
            </Button>
          }
        >
          {status === 404 ? t('profile.notFoundHint') : error}
        </EmptyState>
      </PageShell>
    );
  }

  const services = [...(p.services ?? [])]
    .filter((s) => s.is_active !== false)
    .sort((a, b) => (a.service_definition_id === highlight ? -1 : b.service_definition_id === highlight ? 1 : 0));
  const offersOnline = p.offers_online;
  const years = Number(p.experience_years) || 0;
  const reviews = p.reviews ?? [];
  const backQs = new URLSearchParams();
  if (highlight) backQs.set('service', highlight);
  applyBookingDate(backQs, bookingDate);
  const backHref = `${fromOnline ? '/online' : '/browse'}${backQs.size ? `?${backQs.toString()}` : ''}`;
  const clearQs = applyBookingDate(new URLSearchParams(params.toString()), NO_BOOKING_DATE).toString();
  const clearDateHref = `/pandits/${encodeURIComponent(id)}${clearQs ? `?${clearQs}` : ''}`;

  return (
    <PageShell>
      <Link
        href={backHref}
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {fromOnline ? t('profile.backOnline') : t('profile.backNear')}
      </Link>

      <BookingDateBanner ctx={bookingDate} clearHref={clearDateHref} className="mb-4" />

      <header className="flex flex-col gap-6 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:p-8">
        <PanditAvatar name={p.name} photo={p} verified={p.is_verified} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 text-3xl leading-tight break-words sm:text-4xl">{p.name}</h1>
            {p.is_verified && <VerifiedPill />}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Rating value={p.average_rating} count={Number(p.total_reviews) || 0} />
            {years > 0 && (
              <span className="text-sm text-muted-foreground">{t.plural('profile.practice', years)}</span>
            )}
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {p.languages?.length > 0 && (
              <li className="flex items-center gap-2">
                <Languages className="size-4 shrink-0" aria-hidden="true" />
                {languageNames(p.languages)}
              </li>
            )}
            {p.tradition && (
              <li className="flex items-center gap-2">
                <ScrollText className="size-4 shrink-0" aria-hidden="true" />
                {p.tradition}
              </li>
            )}
            {p.city && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {p.city}
              </li>
            )}
            {Number(p.max_travel_distance_km) > 0 && (
              <li className="flex items-center gap-2">
                <Car className="size-4 shrink-0" aria-hidden="true" />
                {t('profile.travels', { km: Number(p.max_travel_distance_km) })}
              </li>
            )}
            {offersOnline && (
              <li className="flex items-center gap-2 font-medium text-tulsi">
                <Video className="size-4 shrink-0" aria-hidden="true" />
                {t('profile.offersOnline')}
              </li>
            )}
          </ul>
        </div>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-12">
          {p.bio && (
            <section aria-labelledby="bio-h">
              <h2 id="bio-h" className="text-2xl">
                {t('profile.about')}
              </h2>
              <p className="mt-3 text-[1.05rem] whitespace-pre-line">{p.bio}</p>
            </section>
          )}

          <section aria-labelledby="services-h">
            <h2 id="services-h" className="text-2xl">
              {t('profile.services')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('profile.servicesHint')}</p>
            {services.length === 0 ? (
              <p className="mt-4 text-muted-foreground">{t('profile.noServices')}</p>
            ) : (
              <ul className="mt-5 grid gap-3">
                {services.map((s) => (
                  <ServiceRow
                    key={s.id}
                    s={s}
                    panditId={p.id}
                    highlighted={s.service_definition_id === highlight}
                    online={offersOnline && fromOnline}
                    canOnline={offersOnline}
                    bookingDate={bookingDate}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <section aria-labelledby="reviews-h" className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="reviews-h" className="text-2xl">
            {t('profile.reviews')}
          </h2>
          {p.rating_breakdown && <RatingBars breakdown={p.rating_breakdown} className="mt-4" />}
          {reviews.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
              <MessageSquareQuote className="mb-2 size-5" aria-hidden="true" />
              {t('profile.noReviews')}
            </div>
          ) : (
            <ul className="mt-4 grid gap-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Stars
                      value={r.rating_overall ?? r.rating}
                      label={t('rating.outOf5', { rating: r.rating_overall ?? r.rating })}
                    />
                    <time dateTime={r.created_at} className="text-xs text-muted-foreground">
                      {f.date(r.created_at, { weekday: undefined })}
                    </time>
                  </div>
                  <ReviewParams review={r} className="mt-2" />
                  {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                  <p className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    {r.customer_photo_url && !r.customer_deleted && (
                      <span className="size-6 shrink-0 overflow-hidden rounded-full bg-muted">
                        <ProfilePhoto src={r.customer_photo_url} px={24} fallback={null} />
                      </span>
                    )}
                    <span>— {r.customer_deleted ? t('profile.deletedReviewer') : (r.customer_name || t('profile.devotee'))}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function ProfileFallback() {
  const t = useT('customer');
  return <DiyaLoader label={t('profile.loading')} />;
}

export function PanditProfile({ initial }: { initial: PanditPublic | null }) {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <Profile initial={initial} />
    </Suspense>
  );
}
