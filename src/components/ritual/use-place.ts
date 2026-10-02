'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useLocale, useT } from '@/i18n';
import { findQuickCity, QUICK_CITIES, readLocation, type SavedLocation } from '@/lib/location';
import {
  DEFAULT_PLACE,
  IST_ZONE,
  nearestCity,
  parsePlaceCookie,
  PLACE_COOKIE,
  PLACE_MAX_AGE,
  placeFromTimezone,
  placeName,
  serializePlace,
  ZONE_CITIES,
  zoneFor,
  type City,
  type Place,
} from '@/lib/place';

// Resolution order (first match wins):
//   1. a place the visitor picked by hand (cookie, source 'manual')
//   2. the device location (cookie 'gps', or silently when permission is already granted — see <PlaceSync>)
//   3. the location chosen for browsing pandits (lib/location.ts)
//   4. a city guessed from the browser time zone (no prompt, nothing leaves the browser)
//   5. Lucknow / IST

const EVENT = 'ps-place-change';
const LOCATION_EVENT = 'puja-location-change';

/** Indian quick cities (lib/location.ts) followed by the NRI table, for the picker and GPS labels. */
export const PICKER_CITIES: City[] = [
  ...QUICK_CITIES.map((c) => ({
    id: `in-${c.name}`,
    tz: IST_ZONE,
    lat: c.lat,
    lng: c.lng,
    label_en: c.name,
    label_hi: c.name_hi,
    region: 'india' as const,
  })),
  ...ZONE_CITIES,
];

export function browserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function readCookieRaw(): string | null {
  if (typeof document === 'undefined') return null;
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${PLACE_COOKIE}=`));
  return hit ? hit.slice(PLACE_COOKIE.length + 1) : null;
}

export function readPlaceCookie(): Place | null {
  return parsePlaceCookie(readCookieRaw());
}

/** Persists the place for server components (one year) and tells every usePlace(). */
export function writePlaceCookie(p: Place) {
  document.cookie = `${PLACE_COOKIE}=${serializePlace(p)}; path=/; max-age=${PLACE_MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new Event(EVENT));
}

/** The pandit-browsing location as a panchang place. */
export function placeFromSaved(loc: SavedLocation, browserTz: string | null): Place {
  const device = loc.kind === 'gps' || loc.label === 'Your current location';
  // Saved addresses look like "Home · Lucknow"; the city is the useful part.
  const cityText = loc.address_id ? (loc.label.split(' · ').pop() ?? loc.label) : loc.label;
  const quick = device ? undefined : findQuickCity(cityText);
  const near = device ? nearestCity(loc, PICKER_CITIES, 40) : null;
  return {
    lat: loc.lat,
    lng: loc.lng,
    tz: zoneFor(loc.lat, loc.lng, browserTz),
    label: device ? (near?.label_en ?? null) : (quick?.name ?? cityText),
    label_hi: device ? (near?.label_hi ?? null) : (quick?.name_hi ?? null),
    source: 'saved',
  };
}

/** A device fix as a place, named after a known city when one is close by. */
export function placeFromDevice(coords: { lat: number; lng: number }, browserTz: string | null): Place {
  const near = nearestCity(coords, PICKER_CITIES, 40);
  return {
    lat: coords.lat,
    lng: coords.lng,
    tz: zoneFor(coords.lat, coords.lng, browserTz),
    label: near?.label_en ?? null,
    label_hi: near?.label_hi ?? null,
    source: 'gps',
  };
}

/** Steps 1–5 above, without touching the device. */
export function resolveBasePlace(
  cookie: Place | null,
  saved: SavedLocation | null,
  browserTz: string | null,
): Place {
  if (cookie && (cookie.source === 'manual' || cookie.source === 'gps')) return cookie;
  if (saved) return placeFromSaved(saved, browserTz);
  if (browserTz) return placeFromTimezone(browserTz);
  return cookie ?? DEFAULT_PLACE;
}

/**
 * Device location without a prompt: only when the visitor has already granted
 * geolocation to this site. Coarse accuracy and a cached fix are plenty.
 */
export async function silentDevicePlace(browserTz: string | null): Promise<Place | null> {
  try {
    if (!navigator.permissions?.query || !navigator.geolocation) return null;
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (status.state !== 'granted') return null;
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30 * 60_000,
      }),
    );
    return placeFromDevice({ lat: pos.coords.latitude, lng: pos.coords.longitude }, browserTz);
  } catch {
    return null;
  }
}

// --- reactive store -------------------------------------------------------

let cacheKey: string | null = null;
let cacheValue: Place = DEFAULT_PLACE;

function snapshot(): Place {
  const raw = readCookieRaw();
  const saved = readLocation();
  const tz = browserTimeZone();
  const key = `${raw}|${saved ? JSON.stringify(saved) : ''}|${tz}`;
  if (key !== cacheKey) {
    cacheKey = key;
    cacheValue = resolveBasePlace(parsePlaceCookie(raw), saved, tz);
  }
  return cacheValue;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener(LOCATION_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener(LOCATION_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

const serverSnapshot = () => DEFAULT_PLACE;

/**
 * The visitor's panchang place on the client (Lucknow during SSR). Server
 * pages should pass the place they fetched for instead, so text matches data.
 */
export function usePlace(): Place {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/** Display name for a place in the visitor's language ("Toronto", "टोरंटो", "Your location"). */
export function usePlaceName() {
  const { locale } = useLocale();
  const t = useT('panchang');
  return useCallback(
    (p: Pick<Place, 'label' | 'label_hi'>) => placeName(p, locale) ?? t('place.yourLocation'),
    [locale, t],
  );
}
