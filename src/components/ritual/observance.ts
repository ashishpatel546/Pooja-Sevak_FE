// Pure helpers for panchang data. Safe in server and client components.
import type { Locale } from '@/i18n/config';
import type { Observance, ObservanceKey, Paksha, ServiceDefinition } from '@/lib/types';

/** Display order for filters and preference toggles. */
export const OBSERVANCE_KEYS: ObservanceKey[] = [
  'festival',
  'purnima',
  'amavasya',
  'ekadashi',
  'pradosh',
  'sankashti',
  'masik_shivratri',
  'sankranti',
  'pitru_paksha',
  'sarva_pitru_amavasya',
];

/** Representative tithi (1–30) for drawing the moon when the API gives none. */
export const TYPICAL_TITHI: Record<ObservanceKey, number> = {
  festival: 15,
  purnima: 15,
  amavasya: 30,
  ekadashi: 11,
  pradosh: 13,
  sankashti: 19,
  masik_shivratri: 29,
  sankranti: 15,
  pitru_paksha: 20,
  sarva_pitru_amavasya: 30,
};

export const PITRU_PAKSHA_SLUG = 'pitru-paksha-shraddh';

/** The /panchang tab, from `?view=`. */
export type PanchangView = 'all' | 'festivals';

export function parsePanchangView(raw: unknown): PanchangView {
  return raw === 'festivals' ? 'festivals' : 'all';
}

export function localized<T extends Record<string, unknown>>(obj: T, base: string, locale: Locale): string {
  const value = obj[`${base}_${locale}`] ?? obj[`${base}_en`];
  return typeof value === 'string' ? value : '';
}

/** True when `dateKey` (YYYY-MM-DD) falls on the observance or inside its range. */
export function isOnDay(o: Pick<Observance, 'date' | 'end_date'>, dateKey: string): boolean {
  return o.date <= dateKey && dateKey <= (o.end_date ?? o.date);
}

/** Stable React key: several festivals can share a date (Hartalika Teej, Ganesh Chaturthi). */
export function observanceId(o: Pick<Observance, 'key' | 'date' | 'festival'>): string {
  return `${o.festival ?? o.key}-${o.date}`;
}

/** The occasion a "Book for this day" link carries; festivals have no single type name. */
export function occasionOf(o: Pick<Observance, 'key'>): ObservanceKey | null {
  return o.key === 'festival' ? null : o.key;
}

/** The Pitru Paksha observance in force on `today`, if any. */
export function activePitruPaksha(today: string, ...lists: (Observance[] | null | undefined)[]): Observance | null {
  for (const list of lists) {
    const hit = list?.find((o) => o.key === 'pitru_paksha' && isOnDay(o, today));
    if (hit) return hit;
  }
  return null;
}

/** Tithi in its paksha: 1–15, with 30 kept as Amavasya. */
export function tithiInPaksha(tithi: number): number {
  if (tithi === 30) return 30;
  return tithi > 15 ? tithi - 15 : tithi;
}

export function pakshaOf(tithi: number): Paksha {
  return tithi > 15 ? 'krishna' : 'shukla';
}

/** Groups items by YYYY-MM of their `date`, keeping order. */
export function groupByMonth<T extends { date: string }>(items: T[]): { month: string; items: T[] }[] {
  const groups: { month: string; items: T[] }[] = [];
  for (const item of items) {
    const month = item.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }
  return groups;
}

export type PujaName = { name: string; name_hi: string | null };
export type PujaNames = Record<string, PujaName>;

export function pujaNamesFrom(defs: ServiceDefinition[] | null | undefined): PujaNames {
  const out: PujaNames = {};
  for (const d of defs ?? []) out[d.slug] = { name: d.name, name_hi: d.name_hi };
  return out;
}

/** Catalog name for a slug in the visitor's language; falls back to a tidy slug. */
export function pujaName(slug: string, names: PujaNames | undefined, locale: Locale): string {
  const hit = names?.[slug];
  if (hit) return locale === 'hi' && hit.name_hi ? hit.name_hi : hit.name;
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** `/login?next=…` when signed out, else the path itself. */
export function signedInHref(path: string, signedIn: boolean): string {
  return signedIn ? path : `/login?next=${encodeURIComponent(path)}`;
}

export function remindHref(key: ObservanceKey): string {
  return `/reminders?tab=preferences&remind=${key}`;
}
