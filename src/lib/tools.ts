// The free jyotish tools and how they connect to each other and to the puja
// catalog. One place for every slug map, so links stay consistent; pure data,
// safe in server and client components.
import type { DoshaKey } from '@/lib/kundali';

export type ToolKey = 'kundali' | 'milan' | 'muhurat' | 'panchang' | 'rashifal';

export const TOOLS: { key: ToolKey; href: string }[] = [
  { key: 'kundali', href: '/kundali' },
  { key: 'milan', href: '/kundali-milan' },
  { key: 'muhurat', href: '/muhurat' },
  { key: 'panchang', href: '/panchang' },
  { key: 'rashifal', href: '/rashifal' },
];

/** Catalog slugs (backend seed) the tools link to. */
export const VIVAH_PUJA_SLUG = 'vivah-sanskar';
export const GRIHA_PRAVESH_PUJA_SLUG = 'griha-pravesh';

/** Muhurat finder tabs and the puja each one books. */
export type MuhuratTab = 'vivah' | 'griha_pravesh' | 'day';
export const MUHURAT_TABS: MuhuratTab[] = ['vivah', 'griha_pravesh', 'day'];
export const MUHURAT_PUJA: Partial<Record<MuhuratTab, string>> = {
  vivah: VIVAH_PUJA_SLUG,
  griha_pravesh: GRIHA_PRAVESH_PUJA_SLUG,
};

/** `/muhurat?kind=vivah` (and `&date=` for the day view): the finder opens on that tab. */
export function muhuratHref(kind: MuhuratTab, date?: string): string {
  return `/muhurat?kind=${kind}${date ? `&date=${date}` : ''}`;
}

/**
 * Pujas traditionally done for a dosha, by catalog slug. Only slugs that exist
 * in the catalog are linked (callers filter against the live catalog).
 */
export const DOSHA_REMEDY_PUJAS: Partial<Record<DoshaKey, string[]>> = {
  mangal: ['navgraha-shanti', 'hanuman-chalisa-path'],
  kaal_sarp: ['kaal-sarp-dosh-nivaran'],
  pitra: ['pitru-paksha-shraddh'],
  grahan: ['navgraha-shanti', 'mahamrityunjay-jaap'],
  guru_chandal: ['navgraha-shanti'],
  angarak: ['navgraha-shanti', 'hanuman-chalisa-path'],
  shrapit: ['navgraha-shanti'],
  vish: ['navgraha-shanti'],
  kemadruma: ['navgraha-shanti'],
};

/** Tools worth linking from a puja's page, by catalog slug. */
export type PujaToolLink = { href: string; label: 'milan' | 'muhuratVivah' | 'muhuratGriha' | 'muhuratDay' | 'kundaliNaam' | 'kundali' | 'panchang' };
export const PUJA_TOOL_LINKS: Record<string, PujaToolLink[]> = {
  [VIVAH_PUJA_SLUG]: [
    { href: '/kundali-milan', label: 'milan' },
    { href: muhuratHref('vivah'), label: 'muhuratVivah' },
  ],
  [GRIHA_PRAVESH_PUJA_SLUG]: [{ href: muhuratHref('griha_pravesh'), label: 'muhuratGriha' }],
  'bhoomi-pujan': [{ href: muhuratHref('day'), label: 'muhuratDay' }],
  'vastu-shanti': [{ href: muhuratHref('day'), label: 'muhuratDay' }],
  'namkaran-sanskar': [
    { href: '/kundali', label: 'kundaliNaam' },
    { href: muhuratHref('day'), label: 'muhuratDay' },
  ],
  'mundan-sanskar': [{ href: muhuratHref('day'), label: 'muhuratDay' }],
  'annaprashan': [{ href: muhuratHref('day'), label: 'muhuratDay' }],
  'navgraha-shanti': [{ href: '/kundali', label: 'kundali' }],
  'kaal-sarp-dosh-nivaran': [{ href: '/kundali', label: 'kundali' }],
  'mahamrityunjay-jaap': [{ href: '/kundali', label: 'kundali' }],
  'satyanarayan-katha': [{ href: '/panchang', label: 'panchang' }],
  'pitru-paksha-shraddh': [{ href: '/panchang', label: 'panchang' }],
};
