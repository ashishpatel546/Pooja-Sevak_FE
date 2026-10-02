'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, Clock, IndianRupee, MapPin, SearchX, Sparkles, Video } from 'lucide-react';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import type { ServiceDefinition } from '@/lib/types';
import { NO_BOOKING_DATE, withBookingDate, type BookingDate } from '@/lib/booking-date';
import { Mandala } from '@/components/brand/mandala';
import { EmptyState } from '@/components/common/empty-state';
import { DiyaLoader } from '@/components/common/loading';
import { PageShell } from '@/components/common/page-header';
import { PujaIcon, useCategoryLabel } from '@/components/common/puja-icon';
import { Button } from '@/components/ui/button';
import { BookingDateBanner } from '@/components/customer/booking-date-banner';
import { useApiQuery } from '@/components/customer/use-api';

export function PujaDetail({
  initial,
  bookingDate = NO_BOOKING_DATE,
}: {
  initial: ServiceDefinition | null;
  /** Validated on the server from ?date= / ?occasion=; carried on to the pandit lists. */
  bookingDate?: BookingDate;
}) {
  const { slug } = useParams<{ slug: string }>();
  const t = useT('catalog');
  const f = useFormat();
  const { locale } = useLocale();
  const categoryText = useCategoryLabel();
  // Server-rendered when the server could reach the API; otherwise fetch here.
  const query = useApiQuery<ServiceDefinition>(
    !initial && slug ? `/service-definitions/slug/${encodeURIComponent(slug)}` : null,
  );
  const puja = initial ?? query.data;
  const { loading, error, status } = query;

  if (loading) return <DiyaLoader label={t('detail.loading')} />;

  if (error || !puja) {
    return (
      <PageShell size="narrow">
        <EmptyState
          icon={SearchX}
          title={status === 404 ? t('detail.notFound') : t('detail.loadError')}
          action={
            <Button render={<Link href="/pujas" />} nativeButton={false}>
              {t('detail.exploreAll')}
            </Button>
          }
        >
          {status === 404 ? t('detail.notFoundHint') : error}
        </EmptyState>
      </PageShell>
    );
  }

  const samagri = puja.samagri ?? [];
  const name = pick(puja, 'name', locale);
  const tagline = pick(puja, 'tagline', locale);
  const description = pick(puja, 'description', locale);
  const significance = pick(puja, 'significance', locale);
  const panditCount = Number(puja.pandit_count) || 0;
  const price = puja.starting_price;
  const hasPrice = price !== null && price !== undefined;
  const nearHref = withBookingDate(`/browse?service=${puja.id}`, bookingDate);
  const onlineHref = withBookingDate(`/online?service=${puja.id}`, bookingDate);

  return (
    <>
      <section className="sandhya stars relative overflow-hidden">
        <Mandala className="absolute -top-24 -right-24 size-[26rem] text-diya/20 sm:size-[34rem]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-16">
          <Link
            href="/pujas"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm text-[#f4e6d4]/80 hover:text-[#fbe3b6]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('detail.back')}
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <PujaIcon category={puja.category} size="lg" className="bg-white/10 text-[#fbe3b6] ring-[#fbe3b6]/30" />
            {puja.category && <span className="text-sm text-[#f4e6d4]/80">{categoryText.label(puja.category)}</span>}
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight text-balance break-words sm:text-5xl lg:text-6xl">{name}</h1>
          {tagline && <p className="mt-3 max-w-2xl text-lg">{tagline}</p>}
          {puja.deity && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
              <Sparkles className="size-4 text-diya" aria-hidden="true" />
              {t('detail.offeredTo', { deity: puja.deity })}
            </p>
          )}
        </div>
      </section>

      <PageShell className="pt-8 sm:pt-10">
        <BookingDateBanner
          ctx={bookingDate}
          clearHref={`/pujas/${encodeURIComponent(puja.slug)}`}
          className="mb-8"
        />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div className="grid gap-10">
            {description && (
              <section aria-labelledby="about-h">
                <h2 id="about-h" className="text-2xl">
                  {t('detail.about')}
                </h2>
                <p className="mt-3 text-[1.05rem] whitespace-pre-line">{description}</p>
              </section>
            )}
            {significance && (
              <section aria-labelledby="why-h" className="rounded-2xl border-l-4 border-diya bg-chandan px-5 py-5 sm:px-6">
                <h2 id="why-h" className="text-2xl">
                  {t('detail.why')}
                </h2>
                <p className="mt-3 whitespace-pre-line">{significance}</p>
              </section>
            )}
            {samagri.length > 0 && (
              <section aria-labelledby="samagri-h">
                <h2 id="samagri-h" className="text-2xl">
                  {t('detail.samagri')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('detail.samagriHint')}</p>
                <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {samagri.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-1 size-4 shrink-0 text-tulsi" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside aria-label={t('detail.bookAside')} className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border bg-card p-6">
              <dl className="grid gap-4">
                <div className="flex items-start gap-3">
                  <IndianRupee className="mt-1 size-5 text-primary" aria-hidden="true" />
                  <div>
                    <dt className="text-sm text-muted-foreground">{t('detail.dakshinaFrom')}</dt>
                    <dd className={hasPrice ? 'text-2xl font-semibold tabular-nums' : 'font-medium'}>
                      {hasPrice ? f.inr(Number(price)) : t('tile.joiningSoon')}
                    </dd>
                  </div>
                </div>
                {puja.typical_duration_minutes ? (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-1 size-5 text-primary" aria-hidden="true" />
                    <div>
                      <dt className="text-sm text-muted-foreground">{t('detail.duration')}</dt>
                      <dd className="font-medium">{f.duration(Number(puja.typical_duration_minutes))}</dd>
                    </div>
                  </div>
                ) : null}
              </dl>
              {panditCount > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">{t.plural('detail.panditCount', panditCount)}</p>
              )}
              <div className="mt-6 grid gap-2">
                <Button size="lg" render={<Link href={nearHref} />} nativeButton={false}>
                  <MapPin aria-hidden="true" />
                  {t('detail.findNear')}
                </Button>
                {puja.supports_online && (
                  <Button
                    size="lg"
                    variant="outline"
                    render={<Link href={onlineHref} />}
                    nativeButton={false}
                  >
                    <Video aria-hidden="true" />
                    {t('detail.bookOnline')}
                  </Button>
                )}
              </div>
              {puja.supports_online && (
                <p className="mt-3 text-xs text-muted-foreground">{t('detail.onlineNote')}</p>
              )}
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}
