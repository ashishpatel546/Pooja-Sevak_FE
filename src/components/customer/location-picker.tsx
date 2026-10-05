'use client';

import { useState } from 'react';
import { Crosshair, Home, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  findQuickCity,
  getCurrentPosition,
  QUICK_CITIES,
  saveLocation,
  type SavedLocation,
} from '@/lib/location';
import type { Address } from '@/lib/types';
import { cn } from '@/lib/utils';
import { pick, useLocale, useT } from '@/i18n';
import { rich } from '@/components/common/rich';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessage, useApiQuery } from './use-api';

/**
 * Display label for a saved location in the visitor's language: the device
 * location and quick cities are translated; address labels are shown as saved.
 */
export function useLocationLabel() {
  const t = useT('customer');
  const { locale } = useLocale();
  return (loc: SavedLocation): string => {
    if (loc.kind === 'gps' || loc.label === 'Your current location') return t('location.current');
    if (!loc.address_id) {
      const city = findQuickCity(loc.label);
      if (city) return pick(city, 'name', locale);
    }
    return loc.label;
  };
}

/** The three ways to choose a location. Saves the choice, then calls `onChosen`. */
export function LocationChooser({
  current,
  onChosen,
}: {
  current?: SavedLocation | null;
  onChosen?: (loc: SavedLocation) => void;
}) {
  const { token } = useAuth();
  const t = useT('customer');
  const { locale } = useLocale();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const addresses = useApiQuery<Address[]>(token ? '/addresses' : null, { token });

  const choose = (loc: SavedLocation) => {
    saveLocation(loc);
    onChosen?.(loc);
  };

  const useMine = async () => {
    setGeoError(null);
    setLocating(true);
    try {
      const c = await getCurrentPosition();
      choose({ label: 'Your current location', kind: 'gps', lat: c.lat, lng: c.lng });
    } catch (e) {
      setGeoError(errorMessage(e, t('location.error.unavailable')));
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <Button size="lg" className="w-full sm:w-auto" onClick={useMine} disabled={locating}>
          {locating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Crosshair aria-hidden="true" />}
          {locating ? t('location.finding') : t('location.useMine')}
        </Button>
        <p role="status" aria-live="polite" className={cn('text-sm', geoError ? 'mt-2 text-destructive' : 'sr-only')}>
          {geoError ?? ''}
        </p>
      </div>

      {token && (
        <section aria-labelledby="saved-addr-h">
          <h3 id="saved-addr-h" className="mb-2 font-sans text-sm font-medium text-foreground">
            {t('location.saved')}
          </h3>
          {addresses.loading ? (
            <div className="grid gap-2">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : addresses.error ? (
            <p className="text-sm text-muted-foreground">{t('location.savedError')}</p>
          ) : addresses.data && addresses.data.length > 0 ? (
            <ul className="grid gap-2">
              {addresses.data.map((a) => {
                const active = current?.address_id === a.id;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        choose({
                          label: `${a.label} · ${a.city}`,
                          lat: Number(a.location_coordinates.lat),
                          lng: Number(a.location_coordinates.lng),
                          address_id: a.id,
                        })
                      }
                      className={cn(
                        'flex min-h-14 w-full items-start gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                        active && 'border-primary bg-accent/50',
                      )}
                    >
                      <Home className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-medium">{a.label}</span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {a.address_line_1}, {a.city}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t('location.savedNone')}</p>
          )}
        </section>
      )}

      <section aria-labelledby="quick-city-h">
        <h3 id="quick-city-h" className="mb-2 font-sans text-sm font-medium text-foreground">
          {t('location.pickCity')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_CITIES.map((c) => {
            const active = !current?.address_id && current?.label === c.name;
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={active}
                onClick={() => choose({ label: c.name, lat: c.lat, lng: c.lng })}
                className={cn(
                  'inline-flex h-11 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                  active && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              >
                <MapPin className="size-3.5" aria-hidden="true" />
                {pick(c, 'name', locale)}
                {c.live && (
                  <span className={cn('text-xs', active ? 'opacity-90' : 'text-tulsi')}>{t('location.live')}</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t('location.launch')}</p>
      </section>
    </div>
  );
}

/** Current location with a "Change" control that opens the chooser in a dialog. */
export function LocationBar({
  location,
  prefix,
  className,
  open: openProp,
  onOpenChange,
}: {
  location: SavedLocation;
  /** Legacy override shown before the place name; by default a translated sentence is used. */
  prefix?: string;
  className?: string;
  /** Control the chooser dialog from outside (e.g. an empty state's "search another area"). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const t = useT('customer');
  const labelFor = useLocationLabel();
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  const place = <span className="font-medium text-foreground">{labelFor(location)}</span>;
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 sm:px-5',
        className,
      )}
    >
      <p className="flex min-w-0 items-center gap-2">
        <MapPin className="size-5 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 text-muted-foreground">
          {prefix ? (
            <>
              {prefix} {place}
            </>
          ) : (
            rich(t('location.barText'), { place })
          )}
        </span>
      </p>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t('location.change')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('location.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('location.dialogDesc')}</DialogDescription>
          </DialogHeader>
          <LocationChooser current={location} onChosen={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
