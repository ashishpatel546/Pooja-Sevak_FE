import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { NOINDEX } from '@/lib/seo/metadata';

// The booking wizard is per-visitor; keep it out of search results.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('seo');
  return { title: t('book.title'), robots: NOINDEX };
}

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
