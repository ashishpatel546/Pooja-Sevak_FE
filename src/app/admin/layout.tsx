import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getT } from '@/i18n/server';
import { NOINDEX } from '@/lib/seo/metadata';
import { AdminShell } from './_components/admin-shell';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT('nav');
  return { title: t('link.admin'), robots: NOINDEX };
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
