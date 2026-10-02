import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getT } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('auth');
  return { title: t('signup.meta'), robots: { index: false, follow: false } };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
