'use client';

import Link from 'next/link';
import { ArrowLeft, CircleAlert } from 'lucide-react';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useFormat, useT } from '@/i18n';
import type { PayoutAccountState, WithdrawalSummary } from '@/lib/types';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/components/dashboard/use-api';
import { BankAccountCard } from '@/components/pandit/bank-account-card';
import { WithdrawCard } from '@/components/pandit/withdraw-card';

/** The pandit's bank account (verification) and withdrawals. */
export default function PanditPayoutsPage() {
  const { ready, token } = useRequireAuth(['pandit']);
  const t = useT('payouts');
  const tc = useT('common');
  const f = useFormat();
  const account = useApi<PayoutAccountState>(ready ? '/pandits/me/payout-account' : null, token);
  const summary = useApi<WithdrawalSummary>(ready ? '/pandits/me/withdrawals' : null, token);
  const reloadAccount = account.reload;
  const reloadSummary = summary.reload;
  const reloadAll = () => {
    reloadAccount();
    reloadSummary();
  };

  const a = account.data?.account;
  const accountLabel = a ? [a.bank_name, a.account_number_masked].filter(Boolean).join(' ') : '';
  const loading = !ready || account.loading || summary.loading;

  return (
    <PageShell size="narrow">
      <PageHeader
        back={
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" /> {t('nav.dashboard')}
          </Link>
        }
        title={t('page.title')}
        description={t('page.desc', { min: f.inr(summary.data?.min_withdrawal ?? 1000) })}
      />

      {loading ? (
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : !account.data || !summary.data ? (
        <EmptyState
          icon={CircleAlert}
          title={t('loadError')}
          action={<Button onClick={reloadAll}>{tc('action.retry')}</Button>}
        >
          {account.error ?? summary.error}
        </EmptyState>
      ) : (
        <div className="grid gap-6">
          <WithdrawCard summary={summary.data} accountLabel={accountLabel} token={token} onChanged={reloadAll} />
          <div id="bank-account" className="scroll-mt-24">
            <BankAccountCard state={account.data} token={token} onChanged={reloadAll} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
