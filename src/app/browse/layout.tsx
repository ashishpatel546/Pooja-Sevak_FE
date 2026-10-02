import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { publicMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('customer');
  return publicMetadata({ path: '/browse', title: t('meta.browse.title'), description: t('meta.browse.description') });
}

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
