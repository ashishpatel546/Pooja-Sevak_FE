// The free jyotish tools and how they connect to each other and to the puja
// catalog. One place for every slug map, so links stay consistent; pure data,
// safe in server and client components.
import type { DoshaKey } from '@/lib/kundali';
import { muhuratHref, type MuhuratKind } from '@/lib/muhurat';

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

/** Muhurat links (a kind's page, or the one-day view) live with the kinds in lib/muhurat.ts. */
export { muhuratHref } from '@/lib/muhurat';

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

/**
 * Tools worth linking from a puja's page, by catalog slug. `muhuratKind` links to that
 * kind's muhurat page and is labelled with the kind's name.
 */
export type PujaToolLink =
  | { href: string; label: 'milan' | 'muhuratDay' | 'kundaliNaam' | 'kundali' | 'panchang' | 'rashifal' }
  | { href: string; label: 'muhuratKind'; kind: MuhuratKind };

const kindLink = (kind: MuhuratKind): PujaToolLink => ({ href: muhuratHref(kind), label: 'muhuratKind', kind });

export const PUJA_TOOL_LINKS: Record<string, PujaToolLink[]> = {
  [VIVAH_PUJA_SLUG]: [{ href: '/kundali-milan', label: 'milan' }, kindLink('vivah')],
  [GRIHA_PRAVESH_PUJA_SLUG]: [kindLink('griha_pravesh')],
  'bhoomi-pujan': [kindLink('bhoomi_pujan'), { href: muhuratHref('day'), label: 'muhuratDay' }],
  'vastu-shanti': [kindLink('griha_pravesh'), { href: muhuratHref('day'), label: 'muhuratDay' }],
  'namkaran-sanskar': [{ href: '/kundali', label: 'kundaliNaam' }, kindLink('namkaran')],
  'mundan-sanskar': [kindLink('mundan')],
  'annaprashan': [kindLink('annaprashan')],
  'upanayan-sanskar': [kindLink('upanayan')],
  'vahan-puja': [kindLink('vahan_kharid')],
  'vyapar-udghatan-puja': [kindLink('vyapar_arambh'), { href: muhuratHref('day'), label: 'muhuratDay' }],
  'navgraha-shanti': [{ href: '/kundali', label: 'kundali' }],
  'kaal-sarp-dosh-nivaran': [{ href: '/kundali', label: 'kundali' }],
  'mahamrityunjay-jaap': [{ href: '/kundali', label: 'kundali' }],
  'mangal-dosh-nivaran': [{ href: '/kundali', label: 'kundali' }, { href: '/kundali-milan', label: 'milan' }],
  'shani-shanti-puja': [{ href: '/kundali', label: 'kundali' }, { href: '/rashifal', label: 'rashifal' }],
  'satyanarayan-katha': [{ href: '/panchang', label: 'panchang' }],
  'pitru-paksha-shraddh': [{ href: '/panchang', label: 'panchang' }],
  'tripindi-shraddh': [{ href: '/panchang', label: 'panchang' }],
  'navratri-puja': [{ href: '/panchang', label: 'panchang' }],
  'karwa-chauth-puja': [{ href: '/panchang', label: 'panchang' }],
  'chhath-puja': [{ href: '/panchang', label: 'panchang' }],
};
