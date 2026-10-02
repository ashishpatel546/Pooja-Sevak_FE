import 'server-only';
import { cache } from 'react';
import { serverApiBase } from '@/lib/api';
import type { PanditListItem, PanditPublic, ServiceDefinition } from '@/lib/types';

// Public catalog/profile data for metadata, JSON-LD, the sitemap and the first
// server render. Cached for 10 minutes; every call fails soft so pages still
// render (and fall back to client fetching) when the API is down.
const REVALIDATE = 600;
const TIMEOUT_MS = 5000;

/** Lucknow centre: home-visit pandits who cover the city (for the sitemap). */
const LUCKNOW = { lat: 26.8467, lng: 80.9462 };

export type Fetched<T> = { data: T; status: 200 } | { data: null; status: number };

async function getJson<T>(path: string, query: Record<string, string | number | boolean> = {}): Promise<Fetched<T>> {
  try {
    const url = new URL(serverApiBase() + path);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
    const res = await fetch(url, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return { data: null, status: res.status };
    return { data: (await res.json()) as T, status: 200 };
  } catch {
    return { data: null, status: 0 };
  }
}

/** Status 404/400 means "no such puja"; 0 or 5xx means the API is unavailable. */
export const fetchPujaBySlug = cache((slug: string) =>
  getJson<ServiceDefinition>(`/service-definitions/slug/${encodeURIComponent(slug)}`),
);

export const fetchPandit = cache((id: string) => getJson<PanditPublic>(`/pandits/${encodeURIComponent(id)}`));

export const fetchCatalogList = cache(async () => {
  const res = await getJson<ServiceDefinition[]>('/service-definitions');
  return Array.isArray(res.data) ? res.data : null;
});

/** Verified pandits with a public profile: online pandits plus those covering Lucknow. */
export async function fetchListedPandits(): Promise<PanditListItem[] | null> {
  const [online, local] = await Promise.all([
    getJson<PanditListItem[]>('/pandits/browse', { online: true }),
    getJson<PanditListItem[]>('/pandits/browse', LUCKNOW),
  ]);
  if (!Array.isArray(online.data) && !Array.isArray(local.data)) return null;
  const byId = new Map<string, PanditListItem>();
  for (const p of [...(online.data ?? []), ...(local.data ?? [])]) {
    if (p.is_verified !== false) byId.set(p.id, p);
  }
  return [...byId.values()];
}

/** True when a failed lookup means the record doesn't exist (vs. the API being down). */
export function isMissing(status: number) {
  return status === 404 || status === 400;
}
