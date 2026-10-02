import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getT } from '@/i18n/server';
import { pick } from '@/i18n/translate';
import { JsonLd } from '@/components/seo/json-ld';
import { fetchPujaBySlug, isMissing } from '@/lib/seo/data';
import { excerpt, publicMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, pujaServiceSchema } from '@/lib/seo/schema';
import { readBookingDate } from '@/lib/booking-date';
import { PujaDetail } from '../_components/puja-detail';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// `?date=` / `?occasion=` (from "Book for this day") are deliberately left out of
// the canonical below: every dated variant canonicalises to the bare puja URL.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = `/pujas/${encodeURIComponent(slug)}`;
  const [{ data: puja }, locale, t, tc] = await Promise.all([
    fetchPujaBySlug(slug),
    getLocale(),
    getT('seo'),
    getT('catalog'),
  ]);
  // API down: still give the page a sensible, indexable title and canonical.
  if (!puja) {
    return publicMetadata({ path, title: tc('meta.pujas.title'), description: tc('meta.pujas.description') });
  }
  const name = pick(puja, 'name', locale);
  const price = puja.starting_price === null || puja.starting_price === undefined ? null : Number(puja.starting_price);
  const generic =
    price !== null && Number.isFinite(price)
      ? t('puja.descriptionPrice', { name, price: inr(price) })
      : t('puja.description', { name });
  const lead = excerpt(pick(puja, 'tagline', locale), 110);
  return publicMetadata({
    path,
    title: t('puja.title', { name }),
    description: lead ? `${lead} ${generic}` : generic,
    imageBase: path,
    robots: puja.is_active === false ? { index: false, follow: true } : undefined,
  });
}

export default async function PujaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  // Strictly validated (format, calendar, not past, horizon, known observance).
  const bookingDate = readBookingDate(await searchParams);
  const [{ data: puja, status }, locale, t, tc] = await Promise.all([
    fetchPujaBySlug(slug),
    getLocale(),
    getT('seo'),
    getT('common'),
  ]);
  if (!puja && isMissing(status)) notFound();
  return (
    <>
      {puja && (
        <JsonLd
          data={[
            pujaServiceSchema(puja, locale, { area: t('org.areaServed'), brand: tc('brand.name') }),
            breadcrumbSchema(
              [
                { name: t('breadcrumb.home'), path: '/' },
                { name: t('breadcrumb.pujas'), path: '/pujas' },
                { name: pick(puja, 'name', locale), path: `/pujas/${encodeURIComponent(puja.slug)}` },
              ],
              locale,
            ),
          ]}
        />
      )}
      <PujaDetail initial={puja} bookingDate={bookingDate} />
    </>
  );
}
