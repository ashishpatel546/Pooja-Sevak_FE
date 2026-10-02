import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { NOINDEX } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('nav');
  return { title: t('link.dashboard'), robots: NOINDEX };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
