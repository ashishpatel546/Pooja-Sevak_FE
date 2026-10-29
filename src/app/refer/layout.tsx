import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { NOINDEX } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('growth');
  return { title: t('refer.meta.title'), robots: NOINDEX };
}

export default function ReferLayout({ children }: { children: React.ReactNode }) {
  return children;
}
