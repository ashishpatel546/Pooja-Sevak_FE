import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { publicMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('kundali');
  return publicMetadata({ path: '/kundali', title: t('meta.title'), description: t('meta.description') });
}

export default function KundaliLayout({ children }: { children: React.ReactNode }) {
  return children;
}
