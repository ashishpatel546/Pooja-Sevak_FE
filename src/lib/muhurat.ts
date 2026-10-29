// Muhurat kinds (backend src/muhurat/engine.ts → MUHURAT_KINDS), their public routes and the
// catalog pujas each one leads to.

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

/**
 * Catalog pujas (slugs) for each muhurat kind, most fitting first. The finder offers
 * "Book <puja>" for those that exist in the catalog.
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
export type PujaNames = Record<string, { en: string; hi: string }>;

/** Delhi: the default city for the server-rendered date lists on /muhurat/[kind]. */
export const DELHI = { lat: 28.6139, lng: 77.209, tz: 'Asia/Kolkata', label: 'New Delhi', label_hi: 'नई दिल्ली' };

/** A plain YYYY-MM-DD, else null (the API checks the range). */
export function parseFrom(v: unknown): string | null {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? v : null;
}

/** Active catalog pujas as { slug: { en, hi } }. */
export function pujaNamesOf(defs: { slug: string; name: string; name_hi?: string | null; is_active?: boolean }[] | null): PujaNames {
  const out: PujaNames = {};
  for (const d of defs ?? []) {
    if (d.is_active === false) continue;
    out[d.slug] = { en: d.name, hi: d.name_hi || d.name };
  }
  return out;
}

/** '2026–27': this year and the next, for muhurat page titles. */
export function yearsLabel(now = new Date()): string {
  const y = Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(now));
  return `${y}–${String(y + 1).slice(2)}`;
}
