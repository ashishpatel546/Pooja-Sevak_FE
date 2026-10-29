import 'server-only';
import { serverApiBase } from '@/lib/api';
import type { RashifalOverview, RashifalReading, RashifalWeek } from '@/lib/rashifal';

// Public readings, cached for an hour (the date is in every query, so the cache turns over
// at midnight IST). Each call fails soft (null) so the page can say so instead of erroring.
const REVALIDATE = 3600;
const TIMEOUT_MS = 5000;

async function getJson<T>(path: string, query: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(serverApiBase() + path);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    const res = await fetch(url, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchRashifalOverview(date: string, lang: 'hi' | 'en') {
  return getJson<RashifalOverview>('/rashifal/today', { date, lang });
}

export function fetchRashifalReading(sign: string, date: string, lang: 'hi' | 'en') {
  return getJson<RashifalReading>(`/rashifal/${encodeURIComponent(sign)}`, { date, lang });
}

/** `date` only keys the cache; the week always starts today (India). */
export function fetchRashifalWeek(sign: string, date: string, lang: 'hi' | 'en') {
  return getJson<RashifalWeek>(`/rashifal/${encodeURIComponent(sign)}/week`, { lang, d: date });
}
