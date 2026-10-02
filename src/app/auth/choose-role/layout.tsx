import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getT } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const [t, tc] = await Promise.all([getT('auth'), getT('common')]);
  // The parent /auth layout sets a plain title, so the root "%s | brand" template doesn't reach here.
  return { title: { absolute: `${t('chooseRole.meta')} | ${tc('brand.name')}` }, robots: { index: false, follow: false } };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
