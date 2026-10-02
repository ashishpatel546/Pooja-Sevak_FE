'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MapPinOff, RefreshCw, Video } from 'lucide-react';
import { QUICK_CITIES, saveLocation, useSavedLocation } from '@/lib/location';
import type { Address, PanditListItem, ServiceDefinition } from '@/lib/types';
import { applyBookingDate, NO_BOOKING_DATE, readBookingDate, withBookingDate } from '@/lib/booking-date';
import { BookingDateBanner } from '@/components/customer/booking-date-banner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { pick, useLocale, useT } from '@/i18n';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { LocationBar, LocationChooser, useLocationLabel } from '@/components/customer/location-picker';
import { PanditCard, PanditCardSkeleton } from '@/components/customer/pandit-card';
import { ServiceSelect } from '@/components/customer/service-select';
import { useApiQuery, useHydrated } from '@/components/customer/use-api';

function ResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <PanditCardSkeleton key={i} />
      ))}
    </div>
  );
}

function Browse() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const serviceId = params.get('service');
  const bookingDate = readBookingDate(params);
  const clearDateHref = (() => {
    const qs = applyBookingDate(new URLSearchParams(params.toString()), NO_BOOKING_DATE).toString();
    return qs ? `${pathname}?${qs}` : pathname;
  })();
  const hydrated = useHydrated();
  const location = useSavedLocation();
  const { user, token } = useAuth();
  const t = useT('customer');
  const tc = useT('common');
  const { locale } = useLocale();
  const locationLabel = useLocationLabel();

  // A returning devotee with a default address sees nearby pandits straight away.
  useEffect(() => {
    if (!hydrated || location || !token || user?.role !== 'customer') return;
    let cancelled = false;
    api<Address[]>('/addresses', { token })
      .then((list) => {
        const a = list.find((x) => x.is_default) ?? list[0];
        if (cancelled || !a) return;
        saveLocation({
          label: `${a.label} · ${a.city}`,
          lat: a.location_coordinates.lat,
          lng: a.location_coordinates.lng,
          address_id: a.id,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated, location, token, user?.role]);

  const services = useApiQuery<ServiceDefinition[]>('/service-definitions');
  const pandits = useApiQuery<PanditListItem[]>(location ? '/pandits/browse' : null, {
    query: location
      ? { lat: location.lat, lng: location.lng, service_definition_id: serviceId ?? undefined }
      : undefined,
  });

  const setService = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('service', id);
    else next.delete('service');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const selected = services.data?.find((s) => s.id === serviceId);
  const selectedName = selected ? pick(selected, 'name', locale) : null;
  const lucknow = QUICK_CITIES[0];
  const onlineHref = withBookingDate(`/online${serviceId ? `?service=${serviceId}` : ''}`, bookingDate);

  return (
    <PageShell size="wide">
      <PageHeader
        title={t('browse.title')}
        description={t('browse.description')}
      />
      <BookingDateBanner ctx={bookingDate} clearHref={clearDateHref} className="mb-6" />

      {!hydrated ? (
        <Skeleton className="h-16 rounded-2xl" />
      ) : !location ? (
        <section aria-labelledby="where-h" className="rounded-2xl border bg-card p-5 sm:p-8">
          <h2 id="where-h" className="text-2xl">
            {t('browse.whereTitle')}
          </h2>
          <p className="mt-1 mb-6 text-muted-foreground">{t('browse.whereHint')}</p>
          <LocationChooser />
        </section>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <LocationBar location={location} />
            <div className="grid gap-2">
              <Label htmlFor="browse-service">{t('service.label')}</Label>
              {services.loading ? (
                <Skeleton className="h-11 w-full rounded-lg sm:w-72" />
              ) : (
                <ServiceSelect
                  id="browse-service"
                  services={services.data ?? []}
                  value={serviceId}
                  onChange={setService}
                />
              )}
            </div>
          </div>

          <div className="mt-8" aria-live="polite" aria-busy={pandits.loading}>
            {pandits.loading ? (
              <ResultsSkeleton />
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
                icon={MapPinOff}
                title={selectedName ? t('browse.noneFor', { puja: selectedName }) : t('browse.none')}
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {location.label !== lucknow.name && (
                      <Button
                        onClick={() => saveLocation({ label: lucknow.name, lat: lucknow.lat, lng: lucknow.lng })}
                      >
                        {t('browse.tryCity', { city: pick(lucknow, 'name', locale) })}
                      </Button>
                    )}
                    {selected && (
                      <Button variant="outline" onClick={() => setService(null)}>
                        {t('browse.showAll')}
                      </Button>
                    )}
                    <Button variant="outline" render={<Link href={onlineHref} />} nativeButton={false}>
                      <Video aria-hidden="true" />
                      {t('browse.bookOnline')}
                    </Button>
                  </div>
                }
              >
                {t('browse.emptyHint')}
              </EmptyState>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  {selectedName
                    ? t.plural('browse.countFor', pandits.data.length, {
                        place: locationLabel(location),
                        puja: selectedName,
                      })
                    : t.plural('browse.count', pandits.data.length, { place: locationLabel(location) })}
                </p>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pandits.data.map((p) => (
                    <li key={p.id} className="flex min-w-0">
                      <PanditCard pandit={p} serviceDefinitionId={serviceId} bookingDate={bookingDate} className="w-full" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <PageShell size="wide">
          <ResultsSkeleton />
        </PageShell>
      }
    >
      <Browse />
    </Suspense>
  );
}
