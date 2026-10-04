'use client';

import { useState } from 'react';
import { CircleAlert, Pause, Phone, Play, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { PayoutStatus, SettlementBooking, SettlementGroup, SettlementOverview } from '@/lib/types';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Ledger, LedgerRow } from '@/components/dashboard/ledger';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { PayoutAccountsReview } from '@/components/admin/payout-accounts-review';
import { WithdrawalRequests } from '@/components/admin/withdrawal-requests';

type Pending =
  | { kind: 'settle'; group: SettlementGroup; bookings: SettlementBooking[] }
  | { kind: 'hold'; booking: SettlementBooking }
  | { kind: 'release'; booking: SettlementBooking };

const PAYOUT_CLS: Record<PayoutStatus, string> = {
  not_due: 'bg-muted text-muted-foreground ring-border',
  due: 'bg-accent text-accent-foreground ring-diya/40',
  on_hold: 'bg-destructive/10 text-destructive ring-destructive/30',
  settled: 'bg-tulsi/10 text-tulsi ring-tulsi/30',
};

function PayoutPill({ status }: { status: PayoutStatus }) {
  const t = useT('admin');
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        PAYOUT_CLS[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(`payout.${status}`)}
    </span>
  );
}

export default function AdminSettlementsPage() {
  const { token } = useAuth();
  const t = useT('admin');
  const ts = useT('samagri');
  const tp = useT('payouts');
  const tc = useT('common');
  const f = useFormat();
  const { locale } = useLocale();
  const data = useApi<SettlementOverview>('/admin/settlements', token);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const pujaName = (b: SettlementBooking) => (b.puja ? pick(b.puja, 'name', locale) : t('puja.fallback'));
  const close = () => {
    setPending(null);
    setReference('');
    setNote('');
  };

  const run = async () => {
    if (!pending) return;
    try {
      if (pending.kind === 'settle') {
        await api('/admin/settlements/settle', {
          method: 'POST',
          token,
          body: {
            booking_ids: pending.bookings.map((b) => b.id),
            reference: reference.trim(),
            note: note.trim() || undefined,
          },
        });
        toast.success(t('settlements.toast.settled'));
      } else if (pending.kind === 'hold') {
        await api(`/admin/settlements/${pending.booking.id}/hold`, {
          method: 'POST',
          token,
          body: { reason: note.trim() },
        });
        toast.success(t('settlements.toast.held'));
      } else {
        await api(`/admin/settlements/${pending.booking.id}/release`, { method: 'POST', token, body: {} });
        toast.success(t('settlements.toast.released'));
      }
      close();
      data.reload();
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  const s = data.data;
  const settleTotal = pending?.kind === 'settle' ? pending.bookings.reduce((sum, b) => sum + Number(b.payout_amount ?? b.pandit_credit), 0) : 0;

  return (
    <>
      <PageHeader title={t('settlements.title')} description={t('settlements.desc')} />

      <div className="mb-8 grid gap-6">
        <WithdrawalRequests token={token} onChanged={data.reload} />
        <PayoutAccountsReview token={token} />
      </div>

      {data.loading ? (
        <div className="grid gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : !s ? (
        <EmptyState
          icon={CircleAlert}
          title={t('settlements.loadError')}
          action={<Button onClick={data.reload}>{tc('action.retry')}</Button>}
        >
          {data.error}
        </EmptyState>
      ) : (
        <div className="grid gap-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <Ledger>
              <LedgerRow
                label={t('settlements.totals.due')}
                value={f.inr(s.totals.due)}
                hint={t.plural('settlements.count', s.totals.due_count)}
                emphasis
              />
            </Ledger>
            <Ledger>
              <LedgerRow
                label={t('settlements.totals.onHold')}
                value={f.inr(s.totals.on_hold)}
                hint={t.plural('settlements.count', s.totals.on_hold_count)}
              />
            </Ledger>
          </div>

          {s.pandits.length === 0 ? (
            <EmptyState icon={Wallet} title={t('settlements.empty.title')}>
              {t('settlements.empty.body')}
            </EmptyState>
          ) : (
            <div className="grid gap-6">
              <p className="text-sm text-muted-foreground">{t('settlements.noPayoutDetails')}</p>
              {s.pandits.map((g) => {
                // Bookings in a withdrawal request are paid from that request.
                const due = g.bookings.filter((b) => b.payout_status === 'due' && !b.withdrawal_id);
                const dueTotal = due.reduce((sum, b) => sum + Number(b.payout_amount ?? b.pandit_credit), 0);
                return (
                  <section key={g.pandit_id} aria-labelledby={`p-${g.pandit_id}`} className="rounded-2xl border bg-card">
                    <header className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="min-w-0">
                        <h2 id={`p-${g.pandit_id}`} className="text-xl">
                          {g.name ?? '—'}
                        </h2>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {g.mobile && (
                            <a href={`tel:${g.mobile}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                              <Phone className="size-3.5" aria-hidden="true" />
                              {g.mobile}
                            </a>
                          )}
                          {g.email && <span className="break-all">{g.email}</span>}
                          {g.city && <span>{g.city}</span>}
                        </p>
                        <p className="mt-1 text-sm">
                          <span className="font-medium tabular-nums">{f.inr(g.due_total)}</span>{' '}
                          <span className="text-muted-foreground">· {t.plural('settlements.count', g.due_count)}</span>
                          {g.on_hold_count > 0 && (
                            <span className="text-destructive">
                              {' '}
                              · {t('payout.on_hold')}: {f.inr(g.on_hold_total)}
                            </span>
                          )}
                        </p>
                      </div>
                      {due.length > 0 && (
                        <Button onClick={() => setPending({ kind: 'settle', group: g, bookings: due })}>
                          <Wallet aria-hidden="true" />
                          {t('settlements.settleAll', { amount: f.inr(dueTotal) })}
                        </Button>
                      )}
                    </header>
                    <ul className="divide-y">
                      {g.bookings.map((b) => (
                        <li key={b.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{pujaName(b)}</p>
                            <p className="text-sm text-muted-foreground">
                              {f.date(b.completed_at ?? b.start_time, { weekday: undefined })}
                              {b.customer_name && ` · ${b.customer_name}`}
                              {b.completed_via === 'admin' && ` · ${t('settlements.byAdmin')}`}
                            </p>
                            {b.payout_status === 'on_hold' && b.payout_note && (
                              <p className="text-sm text-destructive">
                                {t('settlements.holdReason', { reason: b.payout_note })}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <PayoutPill status={b.payout_status} />
                            <span className="min-w-20 text-right font-medium tabular-nums">
                              {f.inr(b.payout_amount ?? b.pandit_credit)}
                              {Number(b.samagri_amount) > 0 && (
                                <span className="block text-xs font-normal text-muted-foreground">
                                  {ts('admin.inclSamagri', { amount: f.inr(b.samagri_amount) })}
                                </span>
                              )}
                            </span>
                            {b.withdrawal_id ? (
                              <span className="text-sm text-muted-foreground">{tp('admin.inRequest')}</span>
                            ) : b.payout_status === 'due' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPending({ kind: 'hold', booking: b })}
                                >
                                  <Pause aria-hidden="true" />
                                  {t('settlements.hold')}
                                </Button>
                                <Button size="sm" onClick={() => setPending({ kind: 'settle', group: g, bookings: [b] })}>
                                  {t('settlements.settleOne')}
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPending({ kind: 'release', booking: b })}
                              >
                                <Play aria-hidden="true" />
                                {t('settlements.release')}
                              </Button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}

          <section aria-labelledby="recent-h" className="rounded-2xl border bg-card p-4 sm:p-5">
            <h2 id="recent-h" className="mb-3 text-xl">
              {t('settlements.recent.title')}
            </h2>
            {s.recent_settled.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('settlements.recent.empty')}</p>
            ) : (
              <ul className="divide-y text-sm">
                {s.recent_settled.map((b) => (
                  <li key={b.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-4">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{b.pandit_name ?? '—'}</span>
                      <span className="text-muted-foreground"> · {pujaName(b)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {b.payout_settled_at && f.date(b.payout_settled_at, { weekday: undefined })} ·{' '}
                      <span className="break-all">{t('settlements.ref', { ref: b.payout_reference ?? '—' })}</span>
                    </span>
                    <span className="font-medium tabular-nums sm:min-w-20 sm:text-right">{f.inr(b.payout_amount ?? b.pandit_credit)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={pending?.kind === 'settle'}
        onOpenChange={(o) => !o && close()}
        title={pending?.kind === 'settle' ? t('settlements.dialog.settleTitle', { name: pending.group.name ?? '—' }) : ''}
        description={
          pending?.kind === 'settle'
            ? t('settlements.dialog.settleDesc', {
                amount: f.inr(settleTotal),
                pujas: t.plural('settlements.count', pending.bookings.length),
              })
            : undefined
        }
        confirmLabel={t('settlements.dialog.confirm')}
        disabled={reference.trim().length < 3}
        onConfirm={run}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="settle-ref">{t('settlements.dialog.reference')}</Label>
            <Input
              id="settle-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={100}
              autoComplete="off"
              aria-describedby="settle-ref-hint"
            />
            <p id="settle-ref-hint" className="text-xs text-muted-foreground">
              {t('settlements.dialog.referenceHint')}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="settle-note">{t('settlements.dialog.note')}</Label>
            <Textarea id="settle-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'hold'}
        onOpenChange={(o) => !o && close()}
        destructive
        title={t('settlements.dialog.holdTitle')}
        description={t('settlements.dialog.holdDesc')}
        confirmLabel={t('settlements.dialog.holdConfirm')}
        disabled={note.trim().length < 3}
        onConfirm={run}
      >
        <div className="grid gap-2">
          <Label htmlFor="hold-reason">{t('settlements.dialog.reason')}</Label>
          <Textarea id="hold-reason" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'release'}
        onOpenChange={(o) => !o && close()}
        title={t('settlements.dialog.releaseTitle')}
        description={t('settlements.dialog.releaseDesc')}
        confirmLabel={t('settlements.dialog.releaseConfirm')}
        onConfirm={run}
      />
    </>
  );
}
