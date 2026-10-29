import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { publicMetadata } from '@/lib/seo/metadata';
import { KundaliToolPage } from '@/components/tools/kundali-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('tools');
  return publicMetadata({
    path: '/kundali-milan',
    title: t('meta.milan.title'),
    description: t('meta.milan.description'),
    imageBase: '/kundali-milan',
  });
}

export default function KundaliMilanPage() {
  return <KundaliToolPage page="milan" />;
}
