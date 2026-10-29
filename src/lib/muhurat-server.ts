import 'server-only';
import { serverApiBase } from '@/lib/api';
import { placeQuery, type Place } from '@/lib/place';
import type { MuhuratKind, MuhuratSearch } from './muhurat';

/**
 * Muhurat dates for a place over `months` (from `from`, else today), cached for an hour;
 * null when the API cannot answer. The start date is part of the URL, so a list that
 * passes today's date turns over daily.
 */
export async function fetchMuhuratDates(
  kind: MuhuratKind,
  months: number,
  place: Place,
  from?: string | null,
): Promise<MuhuratSearch | null> {
  try {
    const url = new URL(`${serverApiBase()}/muhurat/dates`);
    for (const [k, v] of Object.entries({ kind, months, ...(from && { from }), ...placeQuery(place) })) {
      url.searchParams.set(k, String(v));
    }
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as MuhuratSearch;
    return Array.isArray(data?.days) ? data : null;
  } catch {
    return null;
  }
}
