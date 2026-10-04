'use client';

import { useState } from 'react';
import { Hourglass, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Withdrawal, WithdrawalStatus, WithdrawalSummary } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/dashboard/field';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { errorMessage } from '@/components/dashboard/use-api';

const STATUS_CLS: Record<WithdrawalStatus, string> = {
  requested: 'bg-accent text-accent-foreground ring-diya/40',
  paid: 'bg-tulsi/10 text-tulsi ring-tulsi/30',
  rejected: 'bg-destructive/10 text-destructive ring-destructive/30',
  cancelled: 'bg-muted text-muted-foreground ring-border',
};

export function WithdrawalPill({ status }: { status: WithdrawalStatus }) {
  const t = useT('payouts');
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        STATUS_CLS[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(`history.status.${status}`)}
    </span>
  );
}

function HistoryRow({ w }: { w: Withdrawal }) {
  const t = useT('payouts');
  const f = useFormat();
  const date = (iso: string) => f.date(iso, { weekday: undefined });
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-foreground">
          {w.status === 'paid' && w.processed_at
            ? t('history.paidOn', { date: date(w.processed_at), ref: w.reference ?? '—' })
            : t('history.requestedOn', { date: date(w.requested_at) })}
        </p>
        <p className="text-muted-foreground">
          {t.plural('history.pujas', w.booking_count)}
          {w.account_number_masked && ` · ${[w.bank_name, w.account_number_masked].filter(Boolean).join(' ')}`}
        </p>
        {w.status === 'rejected' && w.note && <p className="text-destructive">{t('history.reason', { reason: w.note })}</p>}
      </div>
      <div className="flex items-center gap-3 sm:justify-end">
        <WithdrawalPill status={w.status} />
        <span className="min-w-20 text-right font-medium tabular-nums">{f.inr(w.amount)}</span>
      </div>
    </li>
  );
}

export function WithdrawCard({
  summary,
  accountLabel,
  token,
  onChanged,
}: {
  summary: WithdrawalSummary;
  /** The approved account, e.g. "HDFC Bank XXXXXXXX9012". */
  accountLabel: string;
  token: string | null;
  onChanged: () => void;
}) {
  const t = useT('payouts');
  const f = useFormat();
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const open = summary.open_request;
  const min = summary.min_withdrawal;
  const short = Math.max(0, min - summary.available);

  const request = async () => {
    try {
      await api('/pandits/me/withdrawals', { method: 'POST', token });
      toast.success(t('withdraw.requested'));
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e, t('withdraw.err.failed')));
      throw e;
    }
  };

  const cancel = async () => {
    if (!open) return;
    try {
      await api(`/pandits/me/withdrawals/${open.id}/cancel`, { method: 'POST', token });
      toast.success(t('withdraw.open.cancelled'));
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  const history = summary.history.filter((w) => w.status !== 'requested');

  return (
    <Panel
      title={t('withdraw.title')}
      icon={
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <Wallet className="size-5" aria-hidden="true" />
        </span>
      }
    >
      <div className="grid gap-6">
        <div>
          <p className="text-sm text-muted-foreground">{t('withdraw.available')}</p>
          <p className="font-heading text-4xl text-heading tabular-nums">{f.inr(summary.available)}</p>
          {summary.available_count > 0 && (
            <p className="text-sm text-muted-foreground">
              {t.plural('withdraw.availableHint', summary.available_count)}
            </p>
          )}
        </div>

        {open ? (
          <div className="rounded-xl border bg-accent/40 p-4" role="status">
            <p className="flex items-center gap-2 font-medium">
              <Hourglass className="size-4" aria-hidden="true" />
              {t('withdraw.open.title')}
            </p>
            <p className="mt-1 text-sm">
              {t('withdraw.open.body', {
                amount: f.inr(open.amount),
                date: f.date(open.requested_at, { weekday: undefined }),
                account: [open.bank_name, open.account_number_masked].filter(Boolean).join(' '),
              })}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setCancelling(true)}>
              {t('withdraw.open.cancel')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            <Button size="lg" className="w-full sm:w-fit" disabled={!summary.can_withdraw} onClick={() => setConfirming(true)}>
              <Wallet aria-hidden="true" />
              {t('withdraw.button', { amount: f.inr(summary.available) })}
            </Button>
            {!summary.account_approved ? (
              <p className="text-sm text-muted-foreground">{t('withdraw.needAccount')}</p>
            ) : short > 0 ? (
              <p className="text-sm text-muted-foreground">
                {summary.available > 0
                  ? t('withdraw.needMore', { amount: f.inr(short), min: f.inr(min) })
                  : t('withdraw.min', { min: f.inr(min) })}
              </p>
            ) : null}
          </div>
        )}

        <section aria-labelledby="wd-history">
          <h3 id="wd-history" className="font-medium">
            {t('history.title')}
          </h3>
          {history.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">{t('history.empty')}</p>
          ) : (
            <ul className="divide-y">
              {history.map((w) => (
                <HistoryRow key={w.id} w={w} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t('withdraw.dialog.title', { amount: f.inr(summary.available) })}
        description={t('withdraw.dialog.desc', { account: accountLabel })}
        confirmLabel={t('withdraw.dialog.confirm')}
        onConfirm={request}
      />
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        destructive
        title={t('withdraw.open.cancelTitle')}
        description={t('withdraw.open.cancelDesc')}
        confirmLabel={t('withdraw.open.cancelConfirm')}
        cancelLabel={t('withdraw.open.keep')}
        onConfirm={cancel}
      />
    </Panel>
  );
}
