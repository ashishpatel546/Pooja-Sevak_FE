'use client';

import type { ReactNode } from 'react';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useT } from '@/i18n';
import { PageShell } from '@/components/common/page-header';
import { DiyaLoader } from '@/components/common/loading';
import { AdminNav } from '@/components/admin/admin-nav';

export function AdminShell({ children }: { children: ReactNode }) {
  const { ready } = useRequireAuth(['admin']);
  const t = useT('admin');
  if (!ready) return <DiyaLoader label={t('layout.loading')} />;
  return (
    <PageShell size="wide" className="pt-6 sm:pt-8">
      <AdminNav />
      {children}
    </PageShell>
  );
}
