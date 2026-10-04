'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { HandHeart, ListChecks, NotebookPen, RefreshCw, Video, VideoOff } from 'lucide-react';
import type { PanditListItem, ServiceDefinition } from '@/lib/types';
import { applyBookingDate, NO_BOOKING_DATE, readBookingDate } from '@/lib/booking-date';
import { BookingDateBanner } from '@/components/customer/booking-date-banner';
import { pick, useLocale, useT } from '@/i18n';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PanditCard, PanditCardSkeleton } from '@/components/customer/pandit-card';
import { ServiceSelect } from '@/components/customer/service-select';
import { TimezoneNote } from '@/components/customer/timezone-note';
import { useApiQuery } from '@/components/customer/use-api';

const STEPS = [
  { icon: ListChecks, title: 'online.step1.title', text: 'online.step1.text' },
  { icon: NotebookPen, title: 'online.step2.title', text: 'online.step2.text' },
  { icon: Video, title: 'online.step3.title', text: 'online.step3.text' },
  { icon: HandHeart, title: 'online.step4.title', text: 'online.step4.text' },
] as const;

function Online() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const serviceId = params.get('service');
  const bookingDate = readBookingDate(params);
  const clearDateHref = (() => {
    const qs = applyBookingDate(new URLSearchParams(params.toString()), NO_BOOKING_DATE).toString();
    return qs ? `${pathname}?${qs}` : pathname;
  })();
  const t = useT('customer');
  const tc = useT('common');
  const { locale } = useLocale();
  const services = useApiQuery<ServiceDefinition[]>('/service-definitions');
  const pandits = useApiQuery<PanditListItem[]>('/pandits/browse', {
    query: { online: true, service_definition_id: serviceId ?? undefined },
  });
  const selected = services.data?.find((s) => s.id === serviceId);
  const selectedName = selected ? pick(selected, 'name', locale) : null;

  const setService = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('service', id);
    else next.delete('service');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <PageShell size="wide">
      <PageHeader
        title={t('online.title')}
        description={t('online.description')}
      />
      <BookingDateBanner ctx={bookingDate} clearHref={clearDateHref} className="mb-6" />

      <section aria-labelledby="how-h" className="rounded-2xl border bg-chandan p-5 sm:p-8">
        <h2 id="how-h" className="text-2xl">
          {t('online.howTitle')}
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex min-w-0 gap-4 lg:flex-col lg:gap-3">
              <span className="flex items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-heading text-lg text-primary-foreground"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <s.icon className="hidden size-5 text-primary lg:block" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-medium text-heading">{t(s.title)}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{t(s.text)}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-muted-foreground">{t('online.prasad')}</p>
      </section>

      <section aria-labelledby="online-pandits-h" className="mt-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 id="online-pandits-h" className="text-2xl text-balance sm:text-3xl">
              {t('online.panditsTitle')}
            </h2>
            <TimezoneNote className="mt-2" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="online-service">{t('service.label')}</Label>
            {services.loading ? (
              <Skeleton className="h-11 w-full rounded-lg sm:w-72" />
            ) : (
              <ServiceSelect
                id="online-service"
                services={services.data ?? []}
                value={serviceId}
                onChange={setService}
                onlineOnly
              />
            )}
          </div>
        </div>

        <div aria-live="polite" aria-busy={pandits.loading}>
          {pandits.loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <PanditCardSkeleton key={i} />
              ))}
            </div>
          ) : pandits.error ? (
            <EmptyState
              icon={RefreshCw}
              title={t('pandits.loadError')}
              action={<Button onClick={pandits.reload}>{tc('action.retry')}</Button>}
            >
              {pandits.error}
            </EmptyState>
          ) : !pandits.data || pandits.data.length === 0 ? (
            <EmptyState
              icon={VideoOff}
              title={selectedName ? t('online.noneFor', { puja: selectedName }) : t('online.none')}
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  {selected && (
                    <Button variant="outline" onClick={() => setService(null)}>
                      {t('online.showAll')}
                    </Button>
                  )}
                  <Button render={<Link href="/browse" />} nativeButton={false}>
                    {t('online.findNear')}
                  </Button>
                </div>
              }
            >
              {t('online.emptyHint')}
            </EmptyState>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pandits.data.map((p) => (
                <li key={p.id} className="flex min-w-0">
                  <PanditCard pandit={p} serviceDefinitionId={serviceId} bookingDate={bookingDate} online className="w-full" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </PageShell>
  );
}

/** Interactive part of /online (steps, puja filter, pandit list). */
export function OnlineClient() {
  return (
    <Suspense fallback={<PageShell size="wide"><Skeleton className="h-64 rounded-2xl" /></PageShell>}>
      <Online />
    </Suspense>
  );
}
