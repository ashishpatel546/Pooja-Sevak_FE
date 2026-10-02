import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { NOINDEX } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('customer');
  return { title: t('meta.bookings.title'), robots: NOINDEX };
}

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
