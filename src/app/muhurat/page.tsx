import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { publicMetadata } from '@/lib/seo/metadata';
import { MuhuratFinder } from '@/components/muhurat/muhurat-finder';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('muhurat');
  return publicMetadata({ path: '/muhurat', title: t('meta.title'), description: t('meta.description') });
}

export default function MuhuratPage() {
  return <MuhuratFinder />;
}
