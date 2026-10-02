import type { Metadata } from 'next';
import { getT } from '@/i18n/server';
import { NOINDEX } from '@/lib/seo/metadata';

// Pandit's own dashboard (bookings, services, profile editor) — private.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('nav');
  return { title: t('link.dashboard'), robots: NOINDEX };
}

export default function PanditDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
