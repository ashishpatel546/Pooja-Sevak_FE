'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MapPin, MapPinOff, RefreshCw, Video } from 'lucide-react';
import { readLocation, saveLocation, useSavedLocation } from '@/lib/location';
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
import {
  browserTimeZone,
  devicePlace,
  nameDevicePlace,
  readPlaceCookie,
  savedFromDevice,
} from '@/components/ritual/use-place';

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
  const { user, token, loading: authLoading } = useAuth();
  const t = useT('customer');
  const tc = useT('common');
  const { locale } = useLocale();
  const locationLabel = useLocationLabel();
  // The "Change" dialog, also opened from the empty state's "search another area".
  const [chooserOpen, setChooserOpen] = useState(false);

  // Nothing chosen yet: a returning devotee's default address, else the
  // device location (the browser asks once), so nearby pandits show straight away.
  useEffect(() => {
    if (!hydrated || location || authLoading) return;
    let cancelled = false;
    const fromDevice = async () => {
      const d = await devicePlace(browserTimeZone());
      if (cancelled || !d) return;
      const named = await nameDevicePlace(d, readPlaceCookie());
      if (cancelled || readLocation()) return;
      saveLocation(savedFromDevice(named));
    };
    if (!token || user?.role !== 'customer') {
      void fromDevice();
    } else {
      api<Address[]>('/addresses', { token })
        .then((list) => {
          const a = list.find((x) => x.is_default) ?? list[0];
          if (cancelled) return;
          if (!a) return fromDevice();
          saveLocation({
            label: `${a.label} · ${a.city}`,
            lat: a.location_coordinates.lat,
            lng: a.location_coordinates.lng,
            address_id: a.id,
          });
        })
        .catch(() => fromDevice());
    }
    return () => {
      cancelled = true;
    };
  }, [hydrated, location, authLoading, token, user?.role]);

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
            <LocationBar location={location} open={chooserOpen} onOpenChange={setChooserOpen} />
            <div className="grid gap-2">
              <Label htmlFor="browse-service">{t('service.label')}</Label>
              {services.loading ? (
                <Skeleton className="h-11 w-full rounded-lg sm:w-72 lg:h-[66px] lg:rounded-2xl" />
              ) : (
                <ServiceSelect
                  id="browse-service"
                  services={services.data ?? []}
                  value={serviceId}
                  onChange={setService}
                  // Same height and shape as the location bar beside it (py-3 + h-10 button + border).
                  className="text-base lg:rounded-2xl lg:px-4 lg:data-[size=default]:h-[66px]"
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
                    <Button onClick={() => setChooserOpen(true)}>
                      <MapPin aria-hidden="true" />
                      {t('browse.changeArea')}
                    </Button>
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
