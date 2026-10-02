import 'server-only';
import type { Metadata } from 'next';
import { LANG_PARAM, LOCALES, type Locale } from '@/i18n/config';
import { getLocale, getT } from '@/i18n/server';
import { SITE_URL } from './site';

/** For private segments: keep out of search results and don't follow links. */
export const NOINDEX: Metadata['robots'] = { index: false, follow: false };

const HREFLANG: Record<Locale, string> = { hi: 'hi-IN', en: 'en-IN' };
const OG_LOCALE: Record<Locale, string> = { hi: 'hi_IN', en: 'en_IN' };

/** `/pujas` → `/pujas?lang=en` (paths stay relative; metadataBase makes them absolute). */
function langPath(path: string, locale: Locale) {
  return `${path}?${LANG_PARAM}=${locale}`;
}

/**
 * Canonical + hreflang for a public path. Each language variant is a crawlable
 * URL (`?lang=hi` / `?lang=en`, see src/proxy.ts); the bare URL is x-default
 * (Hindi, or the visitor's cookie). The canonical is the variant being served.
 */
export function languageAlternates(path: string, locale: Locale): Metadata['alternates'] {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = langPath(path, l);
  languages['x-default'] = path;
  return { canonical: langPath(path, locale), languages };
}

/**
 * Metadata for a public, indexable page: title (the root layout's template adds
 * the brand unless `absoluteTitle`), description, canonical/hreflang, Open Graph
 * and Twitter card. Images come from the opengraph-image / twitter-image files.
 */
export async function publicMetadata({
  path,
  title,
  description,
  absoluteTitle = false,
  type = 'website',
  robots,
  imageBase = '',
}: {
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  type?: 'website' | 'article' | 'profile';
  robots?: Metadata['robots'];
  /** Segment path that has its own opengraph-image / twitter-image files (e.g. '/pujas/x'). */
  imageBase?: string;
}): Promise<Metadata> {
  const locale = await getLocale();
  const [tc, ts] = await Promise.all([getT('common'), getT('seo')]);
  const brand = tc('brand.name');
  const fullTitle = absoluteTitle ? title : `${title} | ${brand}`;
  const alternates = languageAlternates(path, locale);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates,
    openGraph: {
      type,
      siteName: brand,
      title: fullTitle,
      description,
      url: alternates?.canonical as string,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      // Setting openGraph here replaces the root's (and the file-based image),
      // so name the card explicitly.
      images: [{ url: `${imageBase}/opengraph-image`, width: 1200, height: 630, alt: ts('og.alt') }],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [`${imageBase}/twitter-image`] },
    ...(robots ? { robots } : {}),
  };
}

/** Trims long copy to a meta-description-sized excerpt on a word boundary. */
export function excerpt(text: string | null | undefined, max = 160): string | null {
  const clean = text?.replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:.\s—-]+$/, '')}…`;
}

export { SITE_URL };
