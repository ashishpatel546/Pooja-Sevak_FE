import 'server-only';
import { cookies } from 'next/headers';
import { serverApiBase } from '@/lib/api';
import { dateKeyIn } from '@/lib/format';
import { DEFAULT_PLACE, parsePlaceCookie, PLACE_COOKIE, placeQuery, samePlace, type Place } from '@/lib/place';
import type { Observance, ObservanceKey, PanchangDay, PanchangMonth, ServiceDefinition } from '@/lib/types';

// Public data, cached for an hour. Each call fails soft (null) so pages can
// hide or replace the section when the API is unreachable.
const REVALIDATE = 3600;
const TIMEOUT_MS = 5000;

async function getJson<T>(path: string, query: Record<string, string | number> = {}): Promise<T | null> {
  try {
    const url = new URL(serverApiBase() + path);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * The place this visitor's panchang is calculated for: the `ps_place` cookie
 * (written by <PlaceSync>), else Lucknow / IST.
 */
export async function getPlace(): Promise<Place> {
  return parsePlaceCookie((await cookies()).get(PLACE_COOKIE)?.value) ?? DEFAULT_PLACE;
}

/** Today's date key in `tz` (IST by default); part of the cache key so the cache turns over at midnight. */
export function todayKey(tz: string = DEFAULT_PLACE.tz): string {
  return dateKeyIn(tz, 0);
}

export function fetchPanchangDay(date = todayKey(), place: Place = DEFAULT_PLACE) {
  return getJson<PanchangDay>('/panchang/day', { date, ...placeQuery(place) });
}

/** Every day of `month` (YYYY-MM) for a calendar grid. */
export async function fetchPanchangMonth(month: string, place: Place = DEFAULT_PLACE) {
  const data = await getJson<PanchangMonth>('/panchang/month', { month, ...placeQuery(place) });
  return Array.isArray(data?.days) ? data : null;
}

export async function fetchUpcoming(
  days: number,
  from = todayKey(),
  place: Place = DEFAULT_PLACE,
  keys?: ObservanceKey[],
) {
  const query = { from, days, ...placeQuery(place), ...(keys?.length ? { keys: keys.join(',') } : {}) };
  const list = await getJson<Observance[]>('/panchang/upcoming', query);
  return Array.isArray(list) ? list : null;
}

export type PanchangView = {
  /** The place the visitor asked for (cookie or default) — what <PlaceSync> compares against. */
  requested: Place;
  /** The place the data below was actually calculated for. */
  place: Place;
  /** Today's date key in place.tz. */
  today: string;
  day: PanchangDay | null;
  upcoming: Observance[] | null;
  /** Festivals over the next `festivalDays` (null when not asked for or unavailable). */
  festivals: Observance[] | null;
  /** Every day of the current month (null when not asked for or unavailable). */
  month: PanchangMonth | null;
};

export type LoadPanchangOptions = {
  /** Also load festivals over this many days. */
  festivalDays?: number;
  /** Also load every day of the current month (calendar grid). */
  month?: boolean;
};

/**
 * Today's panchang and the next `days` of observances for the visitor's place,
 * plus festivals and the month grid when asked. If the API cannot answer for that
 * place at all, falls back to Lucknow so the page still has something true to
 * show (and says so via `place`).
 */
export async function loadPanchang(days: number, opts: LoadPanchangOptions = {}): Promise<PanchangView> {
  const requested = await getPlace();
  const load = async (place: Place) => {
    const today = todayKey(place.tz);
    const [day, upcoming, festivals, month] = await Promise.all([
      fetchPanchangDay(today, place),
      fetchUpcoming(days, today, place),
      opts.festivalDays ? fetchUpcoming(opts.festivalDays, today, place, ['festival']) : null,
      opts.month ? fetchPanchangMonth(today.slice(0, 7), place) : null,
    ]);
    return { place, today, day, upcoming, festivals, month };
  };
  const view = await load(requested);
  if (!view.day && !view.upcoming && !samePlace(requested, DEFAULT_PLACE)) {
    const fallback = await load(DEFAULT_PLACE);
    if (fallback.day || fallback.upcoming) return { requested, ...fallback };
  }
  return { requested, ...view };
}

export async function fetchCatalog() {
  const list = await getJson<ServiceDefinition[]>('/service-definitions');
  return Array.isArray(list) ? list : null;
}
