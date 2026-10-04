'use client';

import { useState } from 'react';
import { Check, Copy, HandCoins, Phone, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { AdminWithdrawal } from '@/lib/types';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { errorMessage, useApi } from '@/components/dashboard/use-api';

/** A bank detail the admin types into the transfer, with a copy button. */
function CopyValue({ label, value }: { label: string; value: string }) {
  const t = useT('payouts');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: the value is on screen to select by hand
    }
  };
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1">
        <span className="font-medium tracking-wider break-all tabular-nums">{value}</span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={copy}
          aria-label={`${t('admin.withdrawals.copy')}: ${label}`}
          title={copied ? t('admin.withdrawals.copied') : t('admin.withdrawals.copy')}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
      </dd>
    </div>
  );
}

type Pending = { kind: 'paid' | 'reject'; w: AdminWithdrawal };

/** Open withdrawal requests: pay outside the app, then record the UTR. */
export function WithdrawalRequests({ token, onChanged }: { token: string | null; onChanged?: () => void }) {
  const t = useT('payouts');
  const ta = useT('admin');
  const f = useFormat();
  const { locale } = useLocale();
  const list = useApi<AdminWithdrawal[]>('/admin/payouts/withdrawals', token);
  const [pending, setPending] = useState<Pending | null>(null);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');

  const close = () => {
    setPending(null);
    setText('');
    setNote('');
  };

  const run = async () => {
    if (!pending) return;
    const { kind, w } = pending;
    try {
      await api(`/admin/payouts/withdrawals/${w.id}/${kind}`, {
        method: 'POST',
        token,
        body: kind === 'paid' ? { reference: text.trim(), note: note.trim() || undefined } : { reason: text.trim() },
      });
      toast.success(t(kind === 'paid' ? 'admin.withdrawals.paidToast' : 'admin.withdrawals.rejectedToast'));
      close();
      list.reload();
      onChanged?.();
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  const p = pending?.w;

  return (
    <section id="withdrawals" aria-labelledby="withdrawals-h" className="scroll-mt-24 rounded-2xl border bg-card">
      <header className="border-b p-4 sm:p-5">
        <h2 id="withdrawals-h" className="flex items-center gap-2 text-xl">
          <HandCoins className="size-5 text-muted-foreground" aria-hidden="true" />
          {t('admin.withdrawals.title')}
          {!!list.data?.length && <span className="text-base text-muted-foreground">({list.data.length})</span>}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.withdrawals.desc')}</p>
      </header>

      {list.loading ? (
        <Skeleton className="m-5 h-24 rounded-xl" />
      ) : list.error && !list.data ? (
        <p role="alert" className="p-5 text-sm text-destructive">
          {list.error}
        </p>
      ) : !list.data?.length ? (
        <p className="p-5 text-sm text-muted-foreground">{t('admin.withdrawals.empty')}</p>
      ) : (
        <ul className="divide-y">
          {list.data.map((w) => (
            <li key={w.id} className="grid gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-medium">{w.pandit_name ?? '—'}</p>
                  <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    {w.pandit_mobile && (
                      <a href={`tel:${w.pandit_mobile}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Phone className="size-3.5" aria-hidden="true" />
                        {w.pandit_mobile}
                      </a>
                    )}
                    {w.pandit_city && <span>{w.pandit_city}</span>}
                    <span>{t('admin.withdrawals.requested', { date: f.dateTime(w.requested_at) })}</span>
                  </p>
                </div>
                <p className="font-heading text-3xl text-heading tabular-nums">{f.inr(w.amount)}</p>
              </div>

              {w.account && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="mb-2 text-sm font-medium">{t('admin.withdrawals.payTo')}</p>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <CopyValue label={t('account.holder')} value={w.account.account_holder_name} />
                    <CopyValue label={t('account.number')} value={w.account.account_number} />
                    <CopyValue label={t('account.ifsc')} value={w.account.ifsc} />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{t('account.bank')}</dt>
                      <dd className="font-medium break-words">
                        {[w.account.bank_name, w.account.branch].filter(Boolean).join(', ') || '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}

              <details className="text-sm">
                <summary className="min-h-11 cursor-pointer content-center text-muted-foreground">
                  {t('admin.withdrawals.pujas')} ({w.booking_count})
                </summary>
                <ul className="divide-y">
                  {w.bookings.map((b) => (
                    <li key={b.id} className="flex items-baseline justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="font-medium">{b.puja ? pick(b.puja, 'name', locale) : ta('puja.fallback')}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {f.date(b.completed_at ?? b.start_time, { weekday: undefined })}
                          {b.customer_name && ` · ${b.customer_name}`}
                        </span>
                      </span>
                      <span className="tabular-nums">{f.inr(b.payout_amount)}</span>
                    </li>
                  ))}
                </ul>
              </details>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setPending({ kind: 'paid', w })}>
                  <Check aria-hidden="true" />
                  {t('admin.withdrawals.paid')}
                </Button>
                <Button variant="outline" onClick={() => setPending({ kind: 'reject', w })}>
                  <X aria-hidden="true" />
                  {t('admin.withdrawals.reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pending?.kind === 'paid'}
        onOpenChange={(o) => !o && close()}
        title={p ? t('admin.withdrawals.paidTitle', { name: p.pandit_name ?? '—' }) : ''}
        description={
          p
            ? t('admin.withdrawals.paidDesc', {
                amount: f.inr(p.amount),
                account: p.account?.account_number ?? '—',
                ifsc: p.account?.ifsc ?? '—',
              })
            : undefined
        }
        confirmLabel={t('admin.withdrawals.confirmPaid')}
        disabled={text.trim().length < 3}
        onConfirm={run}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="wd-ref">{t('admin.withdrawals.reference')}</Label>
            <Input
              id="wd-ref"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={100}
              autoComplete="off"
              aria-describedby="wd-ref-hint"
            />
            <p id="wd-ref-hint" className="text-xs text-muted-foreground">
              {t('admin.withdrawals.referenceHint')}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wd-note">{t('admin.withdrawals.note')}</Label>
            <Textarea id="wd-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.kind === 'reject'}
        onOpenChange={(o) => !o && close()}
        destructive
        title={t('admin.withdrawals.rejectTitle')}
        description={t('admin.withdrawals.rejectDesc')}
        confirmLabel={t('admin.withdrawals.reject')}
        disabled={text.trim().length < 5}
        onConfirm={run}
      >
        <div className="grid gap-2">
          <Label htmlFor="wd-reason">{t('admin.withdrawals.reason')}</Label>
          <Textarea id="wd-reason" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} />
        </div>
      </ConfirmDialog>
    </section>
  );
}
