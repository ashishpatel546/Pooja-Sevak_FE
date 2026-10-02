import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getT } from '@/i18n/server';
import { JsonLd } from '@/components/seo/json-ld';
import { fetchPandit, isMissing } from '@/lib/seo/data';
import { excerpt, publicMetadata } from '@/lib/seo/metadata';
import { panditSchema } from '@/lib/seo/schema';
import { PanditProfile } from '../_components/pandit-profile';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const path = `/pandits/${encodeURIComponent(id)}`;
  const [{ data: p }, t, tc, locale] = await Promise.all([fetchPandit(id), getT('seo'), getT('customer'), getLocale()]);
  // API down: generic but indexable title; the page fetches on the client.
  if (!p) return publicMetadata({ path, title: tc('meta.browse.title'), description: tc('meta.browse.description') });
  const generic = t('pandit.description', { name: p.name });
  // Bios have no Hindi field: in Hindi, use one only if it is written in Devanagari.
  const bio = locale === 'en' || /[\u0900-\u097F]/.test(p.bio ?? '') ? excerpt(p.bio, 110) : null;
  return publicMetadata({
    path,
    type: 'profile',
    title: p.city ? t('pandit.title', { name: p.name, city: p.city }) : t('pandit.titleNoCity', { name: p.name }),
    description: bio ? `${bio} ${generic}` : generic,
    // Only verified pandits are listed publicly; keep any other profile out of search.
    robots: p.is_verified ? undefined : { index: false, follow: true },
  });
}

export default async function PanditPage({ params }: Props) {
  const { id } = await params;
  const [{ data: p, status }, locale, tc] = await Promise.all([fetchPandit(id), getLocale(), getT('common')]);
  if (!p && isMissing(status)) notFound();
  return (
    <>
      {p?.is_verified && <JsonLd data={panditSchema(p, locale, { brand: tc('brand.name') })} />}
      <PanditProfile initial={p} />
    </>
  );
}
