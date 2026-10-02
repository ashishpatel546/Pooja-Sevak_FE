'use client';

import Link from 'next/link';
import { ArrowRight, CircleAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { AdminStats, BookingStatus } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { BookingStatusBadge } from '@/components/common/status-badge';
import { Ledger, LedgerRow } from '@/components/dashboard/ledger';
import { useApi } from '@/components/dashboard/use-api';

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const n = (v: unknown) => Number(v ?? 0) || 0;
const QUICK = [
  { href: '/admin/pandits', key: 'pandits' },
  { href: '/admin/bookings', key: 'bookings' },
  { href: '/admin/catalog', key: 'catalog' },
  { href: '/admin/settings', key: 'settings' },
] as const;

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const t = useT('admin');
  const ts = useT('samagri');
  const tc = useT('common');
  const f = useFormat();
  const stats = useApi<AdminStats>('/admin/stats', token);
  const s = stats.data;

  const awaiting = s ? n(s.pending_pandits) : 0;
  const totalBookings = s ? n(s.bookings) : 0;

  return (
    <>
      <PageHeader
        title={t('overview.title')}
        description={t('overview.desc')}
      />

      {stats.loading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : !s ? (
        <EmptyState icon={CircleAlert} title={t('overview.loadError')} action={<Button onClick={stats.reload}>{tc('action.retry')}</Button>}>
          {stats.error}
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Ledger title={t('overview.money.title')} caption={t('overview.money.caption')}>
            <LedgerRow label={t('overview.money.gmv')} value={f.inr(s.gmv)} emphasis />
            <LedgerRow label={t('overview.money.commission')} value={f.inr(s.commission)} />
            <LedgerRow label={t('overview.money.customerFees')} value={f.inr(n(s.customer_fees))} />
            <LedgerRow
              label={t('overview.money.revenue')}
              value={f.inr(n(s.commission) + n(s.customer_fees))}
              hint={t('overview.money.revenueHint')}
            />
            {n(s.samagri) > 0 && <LedgerRow label={ts('admin.samagri')} value={f.inr(n(s.samagri))} />}
            <LedgerRow
              label={t('overview.money.panditShare')}
              value={f.inr(n(s.gmv) - n(s.commission) - n(s.customer_fees))}
              hint={n(s.samagri) > 0 ? ts('admin.inclSamagri', { amount: f.inr(n(s.samagri)) }) : undefined}
            />
          </Ledger>

          <Ledger title={t('overview.people.title')}>
            <LedgerRow label={t('overview.people.users')} value={n(s.users)} emphasis />
            <LedgerRow label={t('overview.people.customers')} value={n(s.customers)} />
            <LedgerRow label={t('overview.people.pandits')} value={n(s.pandits)} />
            <LedgerRow
              label={t('overview.people.verified')}
              value={n(s.verified_pandits)}
              hint={
                awaiting ? (
                  <Link href="/admin/pandits?filter=pending" className="text-primary underline-offset-4 hover:underline">
                    {t.plural('overview.people.awaiting', awaiting)}
                  </Link>
                ) : (
                  t('overview.people.allVerified')
                )
              }
            />
          </Ledger>

          <Ledger title={t('overview.bookings.title')}>
            <LedgerRow label={t('overview.bookings.all')} value={totalBookings} emphasis />
            {STATUSES.map((st) => (
              <LedgerRow
                key={st}
                label={<BookingStatusBadge status={st} />}
                value={
                  <span className="inline-flex items-baseline gap-2">
                    {n(s.bookings_by_status?.[st])}
                    {totalBookings > 0 && (
                      <span className="w-10 text-right text-xs font-normal text-muted-foreground">
                        {Math.round((n(s.bookings_by_status?.[st]) / totalBookings) * 100)}%
                      </span>
                    )}
                  </span>
                }
              />
            ))}
          </Ledger>
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="min-w-0">
              <span className="block font-medium">{t(`overview.quick.${l.key}`)}</span>
              <span className="block text-sm text-muted-foreground">{t(`overview.quick.${l.key}.blurb`)}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </>
  );
}
