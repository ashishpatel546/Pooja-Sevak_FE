'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useT } from '@/i18n';
import { PageShell } from '@/components/common/page-header';
import { DiyaLoader } from '@/components/common/loading';
import { CustomerHome } from '@/components/dashboard/customer-home';
import { PanditHome } from '@/components/dashboard/pandit-home';

export default function DashboardPage() {
  const { ready, user, token } = useRequireAuth();
  const router = useRouter();
  const t = useT('dashboard');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (ready && isAdmin) router.replace('/admin');
  }, [ready, isAdmin, router]);

  if (!ready || !user || isAdmin) return <DiyaLoader label={t('page.loading')} />;

  return (
    <PageShell size="wide" className="pt-6 sm:pt-8">
      {user.role === 'pandit' ? <PanditHome user={user} token={token} /> : <CustomerHome user={user} token={token} />}
    </PageShell>
  );
}
