import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { NOINDEX } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('kundali');
  return { title: t('meta.reportTitle'), robots: NOINDEX };
}

export default function KundaliReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
