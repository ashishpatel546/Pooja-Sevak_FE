// Muhurat kinds (backend src/muhurat/engine.ts → MUHURAT_KINDS), their public routes, the
// catalog pujas each one leads to, the /muhurat query (prefill) and the API shapes of
// GET /v1/muhurat/dates. Pure; safe in server and client components.
import { isBookableDate, parseDateKey } from '@/lib/booking-date';
import type { Place } from '@/lib/place';

export const MUHURAT_KINDS = [
  'vivah',
  'griha_pravesh',
  'mundan',
  'namkaran',
  'annaprashan',
  'upanayan',
  'vahan_kharid',
  'sampatti_kharid',
  'vyapar_arambh',
  'bhoomi_pujan',
] as const;

export type MuhuratKind = (typeof MUHURAT_KINDS)[number];

export function isMuhuratKind(v: unknown): v is MuhuratKind {
  return typeof v === 'string' && (MUHURAT_KINDS as readonly string[]).includes(v);
}

/** /muhurat/<route> for each kind: 'griha_pravesh' → 'griha-pravesh'. */
export function kindRoute(kind: MuhuratKind): string {
  return kind.replace(/_/g, '-');
}

/** Kind from a route segment or a `?kind=` value (either spelling). */
export function kindFromParam(v: unknown): MuhuratKind | null {
  if (typeof v !== 'string') return null;
  const k = v.replace(/-/g, '_');
  return isMuhuratKind(k) ? k : null;
}

// ───────────────────────── API shapes ─────────────────────────

export type Bilingual = { en: string; hi: string };
type Iso = { start: string; end: string };

export type MuhuratDay = {
  date: string;
  weekday: number;
  tithi_name: Bilingual;
  nakshatra_name: Bilingual;
  lunar_month: Bilingual;
  windows: (Iso & { tithi_name: Bilingual; nakshatra_name: Bilingual })[];
};
export type MuhuratBlocked = {
  reason: 'chaturmas' | 'kharmas' | 'adhik' | 'guru_asta' | 'shukra_asta';
  from: string;
  to: string;
};
export type MuhuratSearch = { kind: MuhuratKind; from: string; to: string; days: MuhuratDay[]; blocked: MuhuratBlocked[] };

// ───────────────────────── pujas to book ─────────────────────────

/**
 * Catalog pujas (slugs) for each muhurat kind, most fitting first. The finder offers
 * "Book <puja>" for those that exist in the live catalog.
 */
export const MUHURAT_PUJA_SLUGS: Record<MuhuratKind, string[]> = {
  vivah: ['vivah-sanskar'],
  griha_pravesh: ['griha-pravesh', 'vastu-shanti'],
  mundan: ['mundan-sanskar'],
  namkaran: ['namkaran-sanskar'],
  annaprashan: ['annaprashan'],
  upanayan: ['upanayan-sanskar'],
  vahan_kharid: ['vahan-puja'],
  sampatti_kharid: ['vastu-shanti', 'griha-pravesh'],
  vyapar_arambh: ['vyapar-udghatan-puja', 'ganesh-puja'],
  bhoomi_pujan: ['bhoomi-pujan'],
};

/** Puja names by slug, for the "Book <puja>" buttons. */
export type PujaNames = Record<string, Bilingual>;

/** Active catalog pujas as { slug: { en, hi } }. */
export function pujaNamesOf(defs: { slug: string; name: string; name_hi?: string | null; is_active?: boolean }[] | null): PujaNames {
  const out: PujaNames = {};
  for (const d of defs ?? []) {
    if (d.is_active === false) continue;
    out[d.slug] = { en: d.name, hi: d.name_hi || d.name };
  }
  return out;
}

/** The catalog pujas for a kind, most fitting first (only those in the catalog). */
export function pujasFor(kind: MuhuratKind, pujaNames: PujaNames): { slug: string; name: Bilingual }[] {
  return MUHURAT_PUJA_SLUGS[kind].filter((s) => pujaNames[s]).map((slug) => ({ slug, name: pujaNames[slug] }));
}

/**
 * The puja page for a muhurat date: `?date=` carries the day into booking only when it
 * is inside the booking horizon (lib/booking-date.ts); later dates link without it.
 */
export function pujaBookingHref(slug: string, date: string): string {
  return `/pujas/${encodeURIComponent(slug)}${isBookableDate(date) ? `?date=${date}` : ''}`;
}

// ───────────────────────── the /muhurat query ─────────────────────────

/** Delhi: the default city for the server-rendered date lists on /muhurat/[kind]. */
export const DELHI: Place = {
  lat: 28.6139,
  lng: 77.209,
  tz: 'Asia/Kolkata',
  label: 'New Delhi',
  label_hi: 'नई दिल्ली',
  source: 'default',
};

/** A real YYYY-MM-DD, else null (the API checks the range). */
export function parseFrom(v: unknown): string | null {
  return parseDateKey(v);
}

export type MuhuratTab = 'dates' | 'day';

/** What `/muhurat?…` opens on. */
export type MuhuratPrefill = {
  tab: MuhuratTab;
  /** Kind for the date list (vivah when none was asked for). */
  kind: MuhuratKind;
  /** `?from=`: first date the date list searches from. */
  from: string | null;
  /** `?date=` with `?kind=day`: the day the one-day view shows. */
  date: string | null;
};

/**
 * `?kind=` is a muhurat kind (vivah, griha-pravesh, griha_pravesh, mundan, …) or `day`
 * for the one-day view; `?from=YYYY-MM-DD` starts the date list; `?date=YYYY-MM-DD` opens
 * that day in the one-day view (a date without a kind also means the one-day view).
 */
export function parseMuhuratQuery(q: Record<string, string | string[] | undefined>): MuhuratPrefill {
  const kind = kindFromParam(q.kind);
  const date = parseDateKey(q.date);
  const day = q.kind === 'day' || (!kind && !!date);
  return { tab: day ? 'day' : 'dates', kind: kind ?? 'vivah', from: parseFrom(q.from), date: day ? date : null };
}

/** Link into the muhurat tools: a kind's own page, or the one-day view (optionally on a date). */
export function muhuratHref(kind: MuhuratKind | 'day', date?: string): string {
  if (kind === 'day') return `/muhurat?kind=day${date ? `&date=${date}` : ''}`;
  return `/muhurat/${kindRoute(kind)}`;
}

/** '2026–27': this year and the next (IST), for muhurat page titles. */
export function yearsLabel(now = new Date()): string {
  const y = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(now));
  return `${y}–${String(y + 1).slice(2)}`;
}
