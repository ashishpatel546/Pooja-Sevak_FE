'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Crosshair, Loader2, MapPin } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import type { Messages } from '@/i18n/messages';
import { getCurrentPosition, LocationError, readLocation } from '@/lib/location';
import { cityPlace, placeName, samePlace, sameStoredPlace, type City, type Place } from '@/lib/place';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  browserTimeZone,
  PICKER_CITIES,
  placeFromDevice,
  readPlaceCookie,
  resolveBasePlace,
  silentDevicePlace,
  usePlaceName,
  writePlaceCookie,
} from './use-place';

type PanchangKey = keyof Messages['panchang'] & string;

// One refresh per distinct place per page load, whatever re-renders happen.
const refreshedFor = new Set<string>();
const placeKey = (p: Pick<Place, 'lat' | 'lng' | 'tz'>) => `${p.lat.toFixed(2)},${p.lng.toFixed(2)},${p.tz}`;

/**
 * Works out the visitor's place in the browser, stores it in the `ps_place`
 * cookie, and — if the server rendered for a different place — refreshes the
 * server components once. Renders nothing.
 */
export function PlaceSync({ requested, refresh = true }: { requested: Place; refresh?: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { lat, lng, tz } = requested;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const browserTz = browserTimeZone();
      const cookie = readPlaceCookie();
      let next = resolveBasePlace(cookie, readLocation(), browserTz);
      if (next.source !== 'manual') {
        const device = await silentDevicePlace(browserTz);
        if (device) next = device;
      }
      if (cancelled) return;
      if (!sameStoredPlace(cookie, next)) writePlaceCookie(next);
      const key = placeKey(next);
      if (refresh && !samePlace(next, { lat, lng, tz }) && !refreshedFor.has(key)) {
        refreshedFor.add(key);
        startTransition(() => router.refresh());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lng, tz, refresh, router]);

  return null;
}

function useGeoErrorText() {
  const t = useT('panchang');
  return (e: unknown) =>
    t(`place.error.${e instanceof LocationError ? e.code : 'unavailable'}` as PanchangKey);
}

/**
 * "Showing panchang for Toronto · Use my exact location · Change city".
 * By default a new place is stored in the cookie and the page re-renders on the
 * server; pass `onChange` to handle it yourself (e.g. reminder preferences).
 */
export function PlaceControl({
  place,
  text,
  tone = 'light',
  onChange,
  className,
}: {
  /** The place the shown data is for. */
  place: Place;
  /** Sentence with the place name already in it; defaults to "Showing panchang for {place}". */
  text?: string;
  tone?: 'light' | 'dark';
  onChange?: (p: Place) => void | Promise<void>;
  className?: string;
}) {
  const t = useT('panchang');
  const router = useRouter();
  const name = usePlaceName();
  const geoErrorText = useGeoErrorText();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Place | null>(null);
  const dark = tone === 'dark';

  const apply = async (next: Place) => {
    setError(null);
    setOpen(false);
    if (onChange) {
      setSaving(true);
      try {
        await onChange(next);
      } finally {
        setSaving(false);
      }
      return;
    }
    writePlaceCookie(next);
    setTarget(next);
    startTransition(() => router.refresh());
  };

  const useExact = async () => {
    setError(null);
    setLocating(true);
    try {
      const c = await getCurrentPosition();
      await apply(placeFromDevice(c, browserTimeZone()));
    } catch (e) {
      setError(geoErrorText(e));
    } finally {
      setLocating(false);
    }
  };

  const busy = locating || saving || pending;
  const status = locating
    ? t('place.finding')
    : (pending || saving) && target
      ? t('place.updating', { place: name(target) })
      : null;

  const linkClass = cn(
    'inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:outline-none disabled:opacity-60',
    dark ? 'text-diya focus-visible:ring-diya/50' : 'text-primary focus-visible:ring-ring/50',
  );

  return (
    <div className={cn('min-w-0', className)}>
      <p className={cn('flex items-start gap-2', dark ? 'text-[#fbe3b6]' : 'text-foreground')}>
        <MapPin className={cn('mt-1 size-4 shrink-0', dark ? 'text-diya' : 'text-primary')} aria-hidden="true" />
        <span className="min-w-0">
          <span className="font-medium">{text ?? t('place.showing', { place: name(place) })}</span>
          {place.source === 'timezone' && (
            <span className={cn('block text-sm', dark ? 'text-[#f4e6d4]/70' : 'text-muted-foreground')}>
              {t('place.approx')}
            </span>
          )}
        </span>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 pl-5">
        {place.source !== 'gps' && (
          <button type="button" className={linkClass} onClick={useExact} disabled={busy}>
            {locating ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Crosshair className="size-4" aria-hidden="true" />
            )}
            {t('place.useExact')}
          </button>
        )}
        <button type="button" className={linkClass} onClick={() => setOpen(true)} disabled={busy}>
          {t('place.change')}
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={cn(
          'pl-5 text-sm',
          error ? (dark ? 'text-[#ffd0b0]' : 'text-destructive') : dark ? 'text-[#f4e6d4]/80' : 'text-muted-foreground',
          !error && !status && 'sr-only',
        )}
      >
        {error ?? status ?? ''}
      </p>

      <CityDialog
        open={open}
        onOpenChange={setOpen}
        current={place}
        onPick={(c) => void apply(cityPlace(c))}
        onUseExact={useExact}
        locating={locating}
      />
    </div>
  );
}

function CityDialog({
  open,
  onOpenChange,
  current,
  onPick,
  onUseExact,
  locating,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  current: Place;
  onPick: (c: City) => void;
  onUseExact: () => void;
  locating: boolean;
}) {
  const t = useT('panchang');
  const { locale } = useLocale();
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      PICKER_CITIES.filter(
        (c) =>
          !needle ||
          c.label_en.toLowerCase().includes(needle) ||
          c.label_hi.includes(query.trim()) ||
          c.tz.toLowerCase().includes(needle),
      ),
    [needle, query],
  );
  const groups = [
    { id: 'india', title: t('place.india'), items: matches.filter((c) => c.region === 'india') },
    { id: 'abroad', title: t('place.abroad'), items: matches.filter((c) => c.region === 'abroad') },
  ].filter((g) => g.items.length > 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQuery('');
      }}
    >
      <DialogContent className="flex max-h-[min(90dvh,40rem)] flex-col gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl leading-snug">{t('place.dialogTitle')}</DialogTitle>
          <DialogDescription className="text-base">{t('place.dialogDesc')}</DialogDescription>
        </DialogHeader>

        <Button size="lg" variant="outline" className="w-full sm:w-auto sm:self-start" onClick={onUseExact} disabled={locating}>
          {locating ? (
            <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Crosshair aria-hidden="true" />
          )}
          {t('place.useExact')}
        </Button>

        <div>
          <label htmlFor="place-filter" className="sr-only">
            {t('place.filter')}
          </label>
          <Input
            id="place-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('place.filter')}
            autoComplete="off"
            className="h-11 text-base"
          />
        </div>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
          {groups.length === 0 ? (
            <p className="text-muted-foreground">{t('place.noMatch')}</p>
          ) : (
            groups.map((g) => (
              <section key={g.id} aria-labelledby={`place-${g.id}`} className="mb-4 last:mb-0">
                <h3 id={`place-${g.id}`} className="mb-2 font-sans text-sm font-medium text-muted-foreground">
                  {g.title}
                </h3>
                <ul className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                  {g.items.map((c) => {
                    const active = samePlace(current, cityPlace(c)) && current.label === c.label_en;
                    const label = placeName({ label: c.label_en, label_hi: c.label_hi }, locale) ?? c.label_en;
                    return (
                      <li key={c.id} className="min-w-0">
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => onPick(c)}
                          className={cn(
                            'flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-left text-base transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                            active && 'border-primary bg-accent/50',
                          )}
                        >
                          <span className="min-w-0 truncate">{label}</span>
                          {active && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
