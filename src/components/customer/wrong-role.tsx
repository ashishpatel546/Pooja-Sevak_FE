'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { useT } from '@/i18n';
import { EmptyState } from '@/components/common/empty-state';
import { PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';

/** Shown to pandits/admins who open a customer-only page. */
export function CustomerOnly() {
  const t = useT('customer');
  return (
    <PageShell size="narrow">
      <EmptyState
        icon={UserRound}
        title={t('wrongRole.title')}
        action={
          <Button render={<Link href="/dashboard" />} nativeButton={false}>
            {t('wrongRole.cta')}
          </Button>
        }
      >
        {t('wrongRole.body')}
      </EmptyState>
    </PageShell>
  );
}
