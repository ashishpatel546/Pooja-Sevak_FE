import 'server-only';
import { serverApiBase } from '@/lib/api';
import { DELHI, type MuhuratKind } from '@/lib/muhurat';

type Bilingual = { en: string; hi: string };

export type ServerMuhuratDay = {
  date: string;
  weekday: number;
  tithi_name: Bilingual;
  nakshatra_name: Bilingual;
  lunar_month: Bilingual;
  windows: { start: string; end: string }[];
};

// Cached for an hour; the start date is in the query, so the list turns over daily.
const REVALIDATE = 3600;
const TIMEOUT_MS = 8000;

/** Muhurat dates for New Delhi from `from` over `months`; null when the API is unavailable. */
export async function fetchDelhiMuhurats(kind: MuhuratKind, from: string, months: number) {
  try {
    const url = new URL(serverApiBase() + '/muhurat/dates');
    const q = { kind, from, months: String(months), lat: String(DELHI.lat), lng: String(DELHI.lng), tz: DELHI.tz };
    for (const [k, v] of Object.entries(q)) url.searchParams.set(k, v);
    const res = await fetch(url, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const data = (await res.json()) as { days?: ServerMuhuratDay[] };
    return Array.isArray(data.days) ? data.days : null;
  } catch {
    return null;
  }
}
