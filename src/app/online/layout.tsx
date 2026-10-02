import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { publicMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('customer');
  return publicMetadata({ path: '/online', title: t('meta.online.title'), description: t('meta.online.description') });
}

export default function OnlineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
