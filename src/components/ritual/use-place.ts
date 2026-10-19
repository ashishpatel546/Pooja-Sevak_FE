'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useLocale, useT } from '@/i18n';
import { api } from '@/lib/api';
import { findQuickCity, QUICK_CITIES, readLocation, type SavedLocation } from '@/lib/location';
import {
  DEFAULT_PLACE,
  INDIA_CITIES,
  IST_ZONE,
  nearestCity,
  parsePlaceCookie,
  PLACE_COOKIE,
  PLACE_MAX_AGE,
  placeFromTimezone,
  placeName,
  placeQuery,
  samePlace,
  serializePlace,
  ZONE_CITIES,
  zoneFor,
  type City,
  type Place,
} from '@/lib/place';

// Resolution order (first match wins):
//   1. a place the visitor picked by hand (cookie, source 'manual')
//   2. the device location (cookie 'gps', or asked for once — see devicePlace() and <PlaceSync>)
//   3. the location chosen for browsing pandits (lib/location.ts)
//   4. a city guessed from the browser time zone (no prompt, nothing leaves the browser)
//   5. Lucknow / IST

const EVENT = 'ps-place-change';
const LOCATION_EVENT = 'puja-location-change';

/** Indian quick cities (lib/location.ts), larger Indian cities, then the NRI table — for the picker and GPS labels. */
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
  ...INDIA_CITIES,
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
    label: device ? (deviceName(loc) ?? near?.label_en ?? null) : (quick?.name ?? cityText),
    label_hi: device ? (deviceName(loc) ? (loc.label_hi ?? null) : (near?.label_hi ?? null)) : (quick?.name_hi ?? null),
    source: 'saved',
  };
}

/** The town name stored with a device location, if we looked one up. */
function deviceName(loc: SavedLocation): string | null {
  return loc.label && loc.label !== 'Your current location' ? loc.label : null;
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

const ASKED_KEY = 'ps_geo_asked';

function askedBefore(): boolean {
  try {
    return localStorage.getItem(ASKED_KEY) === '1';
  } catch {
    return false;
  }
}

function markAsked() {
  try {
    localStorage.setItem(ASKED_KEY, '1');
  } catch {
    /* storage unavailable — we may ask again next visit */
  }
}

/**
 * The device location as the default place. Used silently when the visitor has
 * already allowed it; asked for once per browser when they haven't decided yet.
 * A dismissed or denied prompt is not repeated — "Use my exact location" still
 * asks. Coarse accuracy and a cached fix are plenty.
 */
export function devicePlace(browserTz: string | null): Promise<Place | null> {
  // One lookup at a time: effects that re-run mid-prompt share it instead of
  // finding the "asked" flag set and giving up.
  inFlight ??= lookupDevice(browserTz).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

let inFlight: Promise<Place | null> | null = null;

async function lookupDevice(browserTz: string | null): Promise<Place | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;
  let state: PermissionState | null = null;
  try {
    state = (await navigator.permissions?.query({ name: 'geolocation' as PermissionName }))?.state ?? null;
  } catch {
    /* Permissions API missing (older Safari) — fall through to asking once */
  }
  if (state === 'denied') return null;
  if (state !== 'granted') {
    if (askedBefore()) return null;
    markAsked();
  }
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 30 * 60_000,
      }),
    );
    return placeFromDevice({ lat: pos.coords.latitude, lng: pos.coords.longitude }, browserTz);
  } catch {
    return null;
  }
}

/** A named device place as the pandit-browsing location. */
export function savedFromDevice(p: Place): SavedLocation {
  return {
    label: p.label ?? 'Your current location',
    ...(p.label && p.label_hi ? { label_hi: p.label_hi } : {}),
    kind: 'gps',
    lat: p.lat,
    lng: p.lng,
  };
}

type ReverseName = { name: { label: string; label_hi: string | null } | null };

/**
 * Names a device place after its town (our API asks OpenStreetMap, with the
 * coordinates rounded to ~1 km). Reuses `known` when it is the same spot, so a
 * returning visitor costs no lookup; keeps the nearby-city name on failure.
 */
export async function nameDevicePlace(p: Place, known?: Place | null): Promise<Place> {
  if (known?.label && samePlace(known, p)) return { ...p, label: known.label, label_hi: known.label_hi ?? null };
  const { lat, lng } = placeQuery(p);
  try {
    const res = await Promise.race([
      api<ReverseName>('/places/reverse', { query: { lat, lng } }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    if (res?.name) return { ...p, label: res.name.label, label_hi: res.name.label_hi };
  } catch {
    /* keep the nearby-city name, or "your location" */
  }
  return p;
}

// Set once <PlaceSync> has finished looking for the device location on this
// page, so callers that store the place (reminders) don't save a guess.
let settled = false;
const SETTLED_EVENT = 'ps-place-settled';

export function markPlaceSettled() {
  if (settled) return;
  settled = true;
  window.dispatchEvent(new Event(SETTLED_EVENT));
}

function subscribeSettled(cb: () => void) {
  window.addEventListener(SETTLED_EVENT, cb);
  return () => window.removeEventListener(SETTLED_EVENT, cb);
}

/** True once the visitor's place is as good as it will get on this page load. */
export function usePlaceSettled(): boolean {
  return useSyncExternalStore(
    subscribeSettled,
    () => settled,
    () => false,
  );
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
