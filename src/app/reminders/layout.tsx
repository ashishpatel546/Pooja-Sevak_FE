import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { NOINDEX } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('reminders');
  return { title: t('meta.title'), description: t('meta.description'), robots: NOINDEX };
}

export default function RemindersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
