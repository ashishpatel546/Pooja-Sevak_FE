import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getT } from '@/i18n/server';
import { isLocale } from '@/i18n/config';
import { publicMetadata } from '@/lib/seo/metadata';
import { KundaliToolPage } from '@/components/tools/kundali-page';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('kundali');
  return publicMetadata({ path: '/kundali', title: t('meta.title'), description: t('meta.description'), imageBase: '/kundali' });
}

export default async function KundaliPage({ searchParams }: Props) {
  const q = await searchParams;
  // Kundali milan has its own page now; old links keep working.
  if (q.tab === 'milan') permanentRedirect(isLocale(q.lang) ? `/kundali-milan?lang=${q.lang}` : '/kundali-milan');
  return <KundaliToolPage page="kundali" />;
}
