import 'server-only';
import type { Locale } from '@/i18n/config';
import { pick } from '@/i18n/translate';
import type { PanditPublic, ServiceDefinition } from '@/lib/types';
import { absoluteUrl, withLang } from './site';

// schema.org builders. Only real data from the API goes in; optional fields are
// omitted rather than guessed.

const ORG_ID = absoluteUrl('/#organization');
const SITE_ID = absoluteUrl('/#website');

type Thing = Record<string, unknown>;

/** Drops undefined/null/empty-array fields so the JSON stays clean. */
function compact<T extends Thing>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)),
  ) as T;
}

export function organizationSchema(o: {
  name: string;
  alternateName: string;
  description: string;
  area: string;
  /** From the owner-edited business profile; blank values are omitted. */
  legalName?: string;
  email?: string;
  telephone?: string;
  taxID?: string;
}): Thing {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: o.name,
    alternateName: o.alternateName,
    legalName: o.legalName && o.legalName !== o.name ? o.legalName : undefined,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/icon-512.png'),
    description: o.description,
    email: o.email,
    telephone: o.telephone,
    taxID: o.taxID,
    areaServed: { '@type': 'Country', name: o.area },
  });
}

export function websiteSchema(o: { name: string; alternateName: string; description: string }): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: o.name,
    alternateName: o.alternateName,
    url: absoluteUrl('/'),
    description: o.description,
    inLanguage: ['hi-IN', 'en-IN'],
    publisher: { '@id': ORG_ID },
  };
}

/** BreadcrumbList; each item's `path` is a site path, made absolute in the page's language. */
export function breadcrumbSchema(items: { name: string; path: string }[], locale: Locale): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(withLang(it.path, locale)),
    })),
  };
}

/** ItemList of catalog pujas (for /pujas). */
export function catalogListSchema(pujas: ServiceDefinition[], locale: Locale): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: pujas.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: pick(p, 'name', locale),
      url: absoluteUrl(withLang(`/pujas/${encodeURIComponent(p.slug)}`, locale)),
    })),
  };
}

export function pujaServiceSchema(p: ServiceDefinition, locale: Locale, o: { area: string; brand: string }): Thing {
  const path = `/pujas/${encodeURIComponent(p.slug)}`;
  const price = p.starting_price === null || p.starting_price === undefined ? null : Number(p.starting_price);
  const offerCount = Number(p.pandit_count) || 0;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: pick(p, 'name', locale),
    alternateName: locale === 'hi' ? p.name : p.name_hi || undefined,
    description: pick(p, 'description', locale) || pick(p, 'tagline', locale) || undefined,
    serviceType: p.category || undefined,
    url: absoluteUrl(withLang(path, locale)),
    provider: { '@type': 'Organization', '@id': ORG_ID, name: o.brand, url: absoluteUrl('/') },
    // Home visits are in India; online pujas reach devotees anywhere.
    areaServed: p.supports_online ? undefined : { '@type': 'Country', name: o.area },
    offers:
      price !== null && Number.isFinite(price)
        ? compact({
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: price,
            offerCount: offerCount || undefined,
            availability: 'https://schema.org/InStock',
          })
        : undefined,
  });
}

/**
 * A pandit's public profile as a ProfessionalService (a LocalBusiness type, which
 * — unlike Person — may carry aggregateRating). The rating is included only when
 * the pandit has real reviews.
 */
export function panditSchema(p: PanditPublic, locale: Locale, o: { brand: string }): Thing {
  const path = `/pandits/${encodeURIComponent(p.id)}`;
  const services = (p.services ?? []).filter((s) => s.is_active !== false && s.service_definition);
  const reviews = Number(p.total_reviews) || 0;
  const rating = Number(p.average_rating) || 0;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': absoluteUrl(`${path}#service`),
    name: p.name,
    description: p.bio || undefined,
    url: absoluteUrl(withLang(path, locale)),
    image: absoluteUrl('/icon-512.png'),
    address: p.city ? { '@type': 'PostalAddress', addressLocality: p.city, addressCountry: 'IN' } : undefined,
    areaServed: p.city ? { '@type': 'City', name: p.city } : undefined,
    knowsLanguage: p.languages?.length ? p.languages : undefined,
    parentOrganization: { '@type': 'Organization', '@id': ORG_ID, name: o.brand, url: absoluteUrl('/') },
    employee: compact({
      '@type': 'Person',
      name: p.name,
      jobTitle: 'Pandit',
      knowsLanguage: p.languages?.length ? p.languages : undefined,
    }),
    hasOfferCatalog: services.length
      ? {
          '@type': 'OfferCatalog',
          name: p.name,
          itemListElement: services.map((s) => ({
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: Number(s.standard_price),
            itemOffered: compact({
              '@type': 'Service',
              name: pick(s.service_definition, 'name', locale),
              url: absoluteUrl(withLang(`/pujas/${encodeURIComponent(s.service_definition.slug)}`, locale)),
            }),
          })),
        }
      : undefined,
    aggregateRating:
      reviews > 0 && rating > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Math.round(rating * 10) / 10,
            reviewCount: reviews,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  });
}

/** FAQPage from plain-text question/answer pairs (the same text shown on the page). */
export function faqPageSchema(items: { question: string; answer: string }[], locale: Locale): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale === 'hi' ? 'hi-IN' : 'en-IN',
    url: absoluteUrl(withLang('/faq', locale)),
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: { '@type': 'Answer', text: it.answer },
    })),
  };
}
