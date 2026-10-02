// Where the panchang is calculated for. Pure and isomorphic: used by server
// components (via getPlace() in components/ritual/panchang-server.ts) and by
// clients (via usePlace() in components/ritual/use-place.ts).
//
// Privacy: nothing here talks to a third party. The approximate place comes
// from the browser's own time zone; the exact one only from the device, after
// the visitor allows it. Coordinates are rounded to 2 decimals (~1 km) before
// they are stored.

import type { Locale } from '@/i18n/config';
import type { PanchangPlace } from './types';

export const PLACE_COOKIE = 'ps_place';
export const PLACE_MAX_AGE = 31_536_000; // one year
export const IST_ZONE = 'Asia/Kolkata';

/** saved: the pandit-browsing location · timezone: guessed from the browser zone · gps: the device · manual: picked. */
export type PlaceSource = 'saved' | 'timezone' | 'gps' | 'manual' | 'default';

export type Place = {
  lat: number;
  lng: number;
  tz: string;
  /** English (or as-typed) label; null for the device location ("Your location"). */
  label: string | null;
  label_hi?: string | null;
  source: PlaceSource;
};

export type City = {
  id: string;
  tz: string;
  lat: number;
  lng: number;
  label_en: string;
  label_hi: string;
  region: 'india' | 'abroad';
};

/**
 * Visitors in India whose city we don't know yet. The coordinates are the
 * server's default (north-central India, same as the API), but the label says
 * "India" — the app serves the whole country, not one city.
 */
export const DEFAULT_PLACE: Place = {
  lat: 26.85,
  lng: 80.95,
  tz: IST_ZONE,
  label: 'India',
  label_hi: 'भारत',
  source: 'default',
};

/** One representative city per time zone where Indian families live. */
export const ZONE_CITIES: City[] = (
  [
    // Americas
    ['America/Toronto', 43.65, -79.38, 'Toronto', 'टोरंटो'],
    ['America/New_York', 40.71, -74.01, 'New York', 'न्यूयॉर्क'],
    ['America/Chicago', 41.88, -87.63, 'Chicago', 'शिकागो'],
    ['America/Denver', 39.74, -104.99, 'Denver', 'डेनवर'],
    ['America/Phoenix', 33.45, -112.07, 'Phoenix', 'फ़ीनिक्स'],
    ['America/Los_Angeles', 37.77, -122.42, 'San Francisco', 'सैन फ़्रांसिस्को'],
    ['America/Vancouver', 49.28, -123.12, 'Vancouver', 'वैंकूवर'],
    ['America/Edmonton', 51.05, -114.07, 'Calgary', 'कैलगरी'],
    ['America/Winnipeg', 49.9, -97.14, 'Winnipeg', 'विनिपेग'],
    ['America/Halifax', 44.65, -63.57, 'Halifax', 'हैलिफ़ैक्स'],
    ['America/Port_of_Spain', 10.66, -61.51, 'Port of Spain', 'पोर्ट ऑफ़ स्पेन'],
    ['America/Guyana', 6.8, -58.16, 'Georgetown', 'जॉर्जटाउन'],
    ['America/Paramaribo', 5.85, -55.2, 'Paramaribo', 'पारामारिबो'],
    ['America/Jamaica', 18.02, -76.81, 'Kingston', 'किंग्स्टन'],
    // Europe
    ['Europe/London', 51.51, -0.13, 'London', 'लंदन'],
    ['Europe/Dublin', 53.35, -6.26, 'Dublin', 'डबलिन'],
    ['Europe/Berlin', 52.52, 13.4, 'Berlin', 'बर्लिन'],
    ['Europe/Paris', 48.86, 2.35, 'Paris', 'पेरिस'],
    ['Europe/Amsterdam', 52.37, 4.9, 'Amsterdam', 'एम्स्टर्डम'],
    ['Europe/Brussels', 50.85, 4.35, 'Brussels', 'ब्रसेल्स'],
    ['Europe/Zurich', 47.38, 8.54, 'Zurich', 'ज़्यूरिख़'],
    ['Europe/Rome', 41.9, 12.5, 'Rome', 'रोम'],
    ['Europe/Madrid', 40.42, -3.7, 'Madrid', 'मैड्रिड'],
    ['Europe/Stockholm', 59.33, 18.07, 'Stockholm', 'स्टॉकहोम'],
    ['Europe/Moscow', 55.76, 37.62, 'Moscow', 'मॉस्को'],
    // Gulf and Middle East
    ['Asia/Dubai', 25.2, 55.27, 'Dubai', 'दुबई'],
    ['Asia/Qatar', 25.29, 51.53, 'Doha', 'दोहा'],
    ['Asia/Riyadh', 24.71, 46.68, 'Riyadh', 'रियाद'],
    ['Asia/Muscat', 23.59, 58.41, 'Muscat', 'मस्कट'],
    ['Asia/Kuwait', 29.38, 47.99, 'Kuwait City', 'कुवैत सिटी'],
    ['Asia/Bahrain', 26.23, 50.59, 'Manama', 'मनामा'],
    // Asia
    ['Asia/Kathmandu', 27.72, 85.32, 'Kathmandu', 'काठमांडू'],
    ['Asia/Dhaka', 23.81, 90.41, 'Dhaka', 'ढाका'],
    ['Asia/Colombo', 6.93, 79.86, 'Colombo', 'कोलंबो'],
    ['Asia/Singapore', 1.35, 103.82, 'Singapore', 'सिंगापुर'],
    ['Asia/Kuala_Lumpur', 3.14, 101.69, 'Kuala Lumpur', 'कुआलालंपुर'],
    ['Asia/Bangkok', 13.76, 100.5, 'Bangkok', 'बैंकॉक'],
    ['Asia/Hong_Kong', 22.32, 114.17, 'Hong Kong', 'हांगकांग'],
    ['Asia/Shanghai', 31.23, 121.47, 'Shanghai', 'शंघाई'],
    ['Asia/Tokyo', 35.68, 139.69, 'Tokyo', 'टोक्यो'],
    // Oceania
    ['Australia/Sydney', -33.87, 151.21, 'Sydney', 'सिडनी'],
    ['Australia/Melbourne', -37.81, 144.96, 'Melbourne', 'मेलबर्न'],
    ['Australia/Brisbane', -27.47, 153.03, 'Brisbane', 'ब्रिस्बेन'],
    ['Australia/Adelaide', -34.93, 138.6, 'Adelaide', 'एडिलेड'],
    ['Australia/Perth', -31.95, 115.86, 'Perth', 'पर्थ'],
    ['Pacific/Auckland', -36.85, 174.76, 'Auckland', 'ऑकलैंड'],
    ['Pacific/Fiji', -18.14, 178.44, 'Suva', 'सुवा'],
    // Africa and the Indian Ocean
    ['Africa/Nairobi', -1.29, 36.82, 'Nairobi', 'नैरोबी'],
    ['Africa/Dar_es_Salaam', -6.79, 39.21, 'Dar es Salaam', 'दार एस सलाम'],
    ['Africa/Kampala', 0.35, 32.58, 'Kampala', 'कंपाला'],
    ['Africa/Johannesburg', -26.2, 28.05, 'Johannesburg', 'जोहान्सबर्ग'],
    ['Africa/Lagos', 6.52, 3.38, 'Lagos', 'लागोस'],
    ['Indian/Mauritius', -20.16, 57.5, 'Port Louis', 'पोर्ट लुई'],
  ] as const
).map(([tz, lat, lng, label_en, label_hi]) => ({
  id: tz,
  tz,
  lat,
  lng,
  label_en,
  label_hi,
  region: 'abroad' as const,
}));

/** Old or alternative IANA names browsers still report. */
const ZONE_ALIASES: Record<string, string> = {
  'Asia/Calcutta': IST_ZONE,
  'Asia/Katmandu': 'Asia/Kathmandu',
  'America/Montreal': 'America/Toronto',
  'America/Detroit': 'America/New_York',
  'America/Indiana/Indianapolis': 'America/New_York',
  'America/Kentucky/Louisville': 'America/New_York',
  'US/Eastern': 'America/New_York',
  'US/Central': 'America/Chicago',
  'US/Mountain': 'America/Denver',
  'US/Pacific': 'America/Los_Angeles',
  'Canada/Eastern': 'America/Toronto',
  'Canada/Pacific': 'America/Vancouver',
  'Europe/Belfast': 'Europe/London',
  'GB': 'Europe/London',
  'Australia/ACT': 'Australia/Sydney',
  'Australia/NSW': 'Australia/Sydney',
  'Australia/Victoria': 'Australia/Melbourne',
  'Australia/Canberra': 'Australia/Sydney',
  'Australia/Hobart': 'Australia/Melbourne',
  'NZ': 'Pacific/Auckland',
  'Singapore': 'Asia/Singapore',
  'Asia/Dacca': 'Asia/Dhaka',
};

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Minutes east of UTC for `tz` at `at` (DST-aware). */
export function utcOffsetMinutes(tz: string, at: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(at);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour') % 24, n('minute'));
  return Math.round((asUtc - Math.floor(at.getTime() / 60_000) * 60_000) / 60_000);
}

/** Rough bounding box for India — enough to decide that a place keeps IST. */
export function isInIndia(lat: number, lng: number): boolean {
  return lat >= 6.5 && lat <= 35.7 && lng >= 68 && lng <= 97.5;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function cityToPlace(c: City, source: PlaceSource, tz = c.tz): Place {
  return { lat: c.lat, lng: c.lng, tz, label: c.label_en, label_hi: c.label_hi, source };
}

/**
 * Approximate place from the browser's time zone, without asking anything.
 * India → DEFAULT_PLACE ("India"). A known zone → its city. An unknown zone keeps its own tz,
 * borrows the coordinates of the table city closest in UTC offset and is
 * labelled with the zone's own city name ("America/Regina" → "Regina").
 */
export function placeFromTimezone(rawTz: string | null | undefined, at: Date = new Date()): Place {
  if (!isValidTimeZone(rawTz)) return DEFAULT_PLACE;
  const tz = ZONE_ALIASES[rawTz] ?? rawTz;
  if (tz === IST_ZONE) return { ...DEFAULT_PLACE, source: 'timezone' };
  const known = ZONE_CITIES.find((c) => c.tz === tz);
  if (known) return cityToPlace(known, 'timezone');

  const offset = utcOffsetMinutes(tz, at);
  let best = ZONE_CITIES[0];
  let bestDiff = Infinity;
  for (const c of ZONE_CITIES) {
    const diff = Math.abs(utcOffsetMinutes(c.tz, at) - offset);
    if (diff < bestDiff) {
      best = c;
      bestDiff = diff;
    }
  }
  const own = tz.includes('/') ? tz.split('/').pop()!.replace(/_/g, ' ') : null;
  return {
    lat: best.lat,
    lng: best.lng,
    tz,
    label: own ?? best.label_en,
    label_hi: own ? null : best.label_hi,
    source: 'timezone',
  };
}

/** Distance in km (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Nearest city within `maxKm`, to give device coordinates a friendly name. */
export function nearestCity(point: { lat: number; lng: number }, cities: City[], maxKm = 60): City | null {
  let best: City | null = null;
  let bestKm = maxKm;
  for (const c of cities) {
    const km = distanceKm(point, c);
    if (km <= bestKm) {
      best = c;
      bestKm = km;
    }
  }
  return best;
}

/** Zone for device or saved coordinates: IST inside India, else the browser's own zone. */
export function zoneFor(lat: number, lng: number, browserTz: string | null | undefined): string {
  if (isInIndia(lat, lng)) return IST_ZONE;
  const tz = isValidTimeZone(browserTz) ? (ZONE_ALIASES[browserTz] ?? browserTz) : IST_ZONE;
  return tz;
}

const SOURCES: PlaceSource[] = ['saved', 'timezone', 'gps', 'manual', 'default'];

function cleanLabel(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, 80);
  return s || null;
}

/** Validates an untrusted value (cookie, API) into a Place, or null. */
export function toPlace(v: unknown, fallbackSource: PlaceSource = 'manual'): Place | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (!isValidTimeZone(o.tz)) return null;
  const source = SOURCES.includes(o.source as PlaceSource) ? (o.source as PlaceSource) : fallbackSource;
  return {
    lat: round2(lat),
    lng: round2(lng),
    tz: o.tz,
    label: cleanLabel(o.label),
    label_hi: cleanLabel(o.label_hi),
    source,
  };
}

/** Parses the `ps_place` cookie value (URI-encoded JSON). */
export function parsePlaceCookie(raw: string | null | undefined): Place | null {
  if (!raw) return null;
  try {
    return toPlace(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
}

/** Cookie value for a place (coordinates rounded to 2 decimals). */
export function serializePlace(p: Place): string {
  return encodeURIComponent(
    JSON.stringify({
      lat: round2(p.lat),
      lng: round2(p.lng),
      tz: p.tz,
      label: p.label,
      ...(p.label_hi ? { label_hi: p.label_hi } : {}),
      source: p.source,
    }),
  );
}

/** Same calculation place (coordinates to 2 decimals, same zone). Labels don't matter. */
export function samePlace(a: Pick<Place, 'lat' | 'lng' | 'tz'> | null, b: Pick<Place, 'lat' | 'lng' | 'tz'> | null) {
  if (!a || !b) return a === b;
  return round2(a.lat) === round2(b.lat) && round2(a.lng) === round2(b.lng) && a.tz === b.tz;
}

/** Same as samePlace and also the same label and source — i.e. the cookie needs no rewrite. */
export function sameStoredPlace(a: Place | null, b: Place | null) {
  return samePlace(a, b) && a?.label === b?.label && (a?.label_hi ?? null) === (b?.label_hi ?? null) && a?.source === b?.source;
}

/** Query params for /panchang/day and /panchang/upcoming. */
export function placeQuery(p: Pick<Place, 'lat' | 'lng' | 'tz'>): { lat: number; lng: number; tz: string } {
  return { lat: round2(p.lat), lng: round2(p.lng), tz: p.tz };
}

/** The API shape for ReminderPreferences.location. */
export function toPanchangPlace(p: Place): PanchangPlace {
  return { lat: round2(p.lat), lng: round2(p.lng), tz: p.tz, label: p.label };
}

/** A Place from an API PanchangPlace (e.g. ReminderPreferences.location). */
export function fromPanchangPlace(p: PanchangPlace, source: PlaceSource = 'manual'): Place | null {
  const place = toPlace({ ...p, source });
  if (!place) return null;
  // Translate known city names for Hindi readers.
  const city = [...ZONE_CITIES].find((c) => c.label_en === place.label);
  if (city) place.label_hi = city.label_hi;
  else if (place.label === DEFAULT_PLACE.label) place.label_hi = DEFAULT_PLACE.label_hi;
  // Reminder places saved before the default was renamed.
  else if (place.label === 'Lucknow') place.label_hi = 'लखनऊ';
  return place;
}

/** Display name in the visitor's language; null when the place has no label (device location). */
export function placeName(p: Pick<Place, 'label' | 'label_hi'>, locale: Locale): string | null {
  if (locale === 'hi' && p.label_hi) return p.label_hi;
  return p.label;
}

export function cityPlace(c: City, source: PlaceSource = 'manual'): Place {
  return cityToPlace(c, source);
}
