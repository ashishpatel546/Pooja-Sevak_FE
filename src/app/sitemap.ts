import type { MetadataRoute } from 'next';
import { LOCALES } from '@/i18n/config';
import { fetchCatalogList, fetchListedPandits } from '@/lib/seo/data';
import { absoluteUrl, withLang } from '@/lib/seo/site';
import { fetchBusinessProfile } from '@/lib/business-profile';

// Regenerate hourly so new pujas and pandits appear without a rebuild.
export const revalidate = 3600;

/** Seeded catalog, used when the API can't be reached (e.g. during a build). */
const FALLBACK_SLUGS = [
  'satyanarayan-katha',
  'griha-pravesh',
  'rudrabhishek',
  'vivah-sanskar',
  'namkaran-sanskar',
  'mundan-sanskar',
  'annaprashan',
  'bhoomi-pujan',
  'vastu-shanti',
  'navgraha-shanti',
  'mahamrityunjay-jaap',
  'kaal-sarp-dosh-nivaran',
  'sundarkand-path',
  'hanuman-chalisa-path',
  'durga-saptashati-path',
  'lakshmi-puja',
  'ganesh-puja',
  'pitru-paksha-shraddh',
];

const HREFLANG = { hi: 'hi-IN', en: 'en-IN' } as const;

type Entry = Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>;

/**
 * One entry per language variant (`?lang=hi` / `?lang=en`, the canonical URLs —
 * see languageAlternates in src/lib/seo/metadata.ts), each listing all variants.
 */
function localized(path: string, entry: Entry): MetadataRoute.Sitemap {
  const languages: Record<string, string> = { 'x-default': absoluteUrl(path) };
  for (const l of LOCALES) languages[HREFLANG[l]] = absoluteUrl(withLang(path, l));
  return LOCALES.map((l) => ({ url: absoluteUrl(withLang(path, l)), alternates: { languages }, ...entry }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Each lookup fails soft: the sitemap never errors because the API is down.
  const [catalog, pandits, business] = await Promise.all([
    fetchCatalogList(),
    fetchListedPandits(),
    fetchBusinessProfile(),
  ]);
  const legalUpdated = new Date(`${business.legal_last_updated}T00:00:00Z`);
  const slugs = catalog
    ? catalog.filter((d) => d.slug && d.is_active !== false).map((d) => d.slug)
    : FALLBACK_SLUGS;

  return [
    ...localized('/', { lastModified: now, changeFrequency: 'daily', priority: 1 }),
    ...localized('/pujas', { lastModified: now, changeFrequency: 'weekly', priority: 0.9 }),
    ...localized('/panchang', { lastModified: now, changeFrequency: 'daily', priority: 0.8 }),
    ...localized('/online', { lastModified: now, changeFrequency: 'weekly', priority: 0.8 }),
    ...localized('/browse', { lastModified: now, changeFrequency: 'weekly', priority: 0.6 }),
    ...localized('/about', { lastModified: now, changeFrequency: 'monthly', priority: 0.5 }),
    ...localized('/faq', { lastModified: now, changeFrequency: 'monthly', priority: 0.5 }),
    ...localized('/contact', { lastModified: now, changeFrequency: 'yearly', priority: 0.4 }),
    ...['/terms', '/privacy', '/refund-policy'].flatMap((path) =>
      localized(path, { lastModified: legalUpdated, changeFrequency: 'yearly', priority: 0.3 }),
    ),
    ...slugs.flatMap((slug) =>
      localized(`/pujas/${encodeURIComponent(slug)}`, { lastModified: now, changeFrequency: 'weekly', priority: 0.8 }),
    ),
    ...(pandits ?? []).flatMap((p) =>
      localized(`/pandits/${encodeURIComponent(p.id)}`, { lastModified: now, changeFrequency: 'weekly', priority: 0.6 }),
    ),
  ];
}
