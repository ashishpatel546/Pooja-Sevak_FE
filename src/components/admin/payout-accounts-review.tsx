'use client';

import { useState } from 'react';
import { Check, Eye, EyeOff, Landmark, Phone, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { AdminPayoutAccount } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { errorMessage, useApi } from '@/components/dashboard/use-api';

function Detail({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-medium tracking-wider break-all tabular-nums' : 'font-medium break-words'}>{value}</dd>
    </div>
  );
}

/** Loads a short-lived URL for the cheque photo only when the operator asks. */
function DocumentViewer({ account, token }: { account: AdminPayoutAccount; token: string | null }) {
  const t = useT('payouts');
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (url) return setUrl(null);
    setBusy(true);
    try {
      const res = await api<{ url: string }>(`/admin/payouts/accounts/${account.id}/document`, { token });
      setUrl(res.url);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <Button variant="outline" size="sm" className="w-fit" onClick={toggle} disabled={busy}>
        {url ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        {url ? t('admin.accounts.hideDoc') : t('admin.accounts.viewDoc')}
      </Button>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- presigned, short-lived private URL
        <img
          src={url}
          alt={t('admin.accounts.docAlt', { name: account.kyc_name ?? account.account_holder_name })}
          className="max-h-[70vh] w-full rounded-lg border object-contain"
        />
      )}
    </div>
  );
}

type Pending = { kind: 'approve' | 'reject'; account: AdminPayoutAccount };

/** Bank accounts whose cheque photo an operator must compare with the details. */
export function PayoutAccountsReview({ token }: { token: string | null }) {
  const t = useT('payouts');
  const f = useFormat();
  const list = useApi<AdminPayoutAccount[]>('/admin/payouts/accounts/pending', token);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState('');

  const close = () => {
    setPending(null);
    setReason('');
  };

  const run = async () => {
    if (!pending) return;
    const { kind, account } = pending;
    try {
      await api(`/admin/payouts/accounts/${account.id}/${kind}`, {
        method: 'POST',
        token,
        body: kind === 'reject' ? { reason: reason.trim() } : {},
      });
      toast.success(t(kind === 'approve' ? 'admin.accounts.approved' : 'admin.accounts.rejected'));
      close();
      list.reload();
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  return (
    <section id="bank-accounts" aria-labelledby="bank-accounts-h" className="scroll-mt-24 rounded-2xl border bg-card">
      <header className="border-b p-4 sm:p-5">
        <h2 id="bank-accounts-h" className="flex items-center gap-2 text-xl">
          <Landmark className="size-5 text-muted-foreground" aria-hidden="true" />
          {t('admin.accounts.title')}
          {!!list.data?.length && <span className="text-base text-muted-foreground">({list.data.length})</span>}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.accounts.desc')}</p>
      </header>

      {list.loading ? (
        <Skeleton className="m-5 h-24 rounded-xl" />
      ) : list.error && !list.data ? (
        <p role="alert" className="p-5 text-sm text-destructive">
          {list.error}
        </p>
      ) : !list.data?.length ? (
        <p className="p-5 text-sm text-muted-foreground">{t('admin.accounts.empty')}</p>
      ) : (
        <ul className="divide-y">
          {list.data.map((a) => (
            <li key={a.id} className="grid gap-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg font-medium">{a.pandit_name ?? '—'}</p>
                <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                  {a.pandit_mobile && (
                    <a href={`tel:${a.pandit_mobile}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Phone className="size-3.5" aria-hidden="true" />
                      {a.pandit_mobile}
                    </a>
                  )}
                  {a.pandit_city && <span>{a.pandit_city}</span>}
                  {a.document_uploaded_at && (
                    <span>{t('admin.accounts.uploaded', { date: f.dateTime(a.document_uploaded_at) })}</span>
                  )}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label={t('admin.accounts.kycName')} value={a.kyc_name ?? '—'} />
                <Detail label={t('admin.accounts.holder')} value={a.account_holder_name} />
                {a.bank_registered_name && (
                  <Detail label={t('admin.accounts.bankName')} value={a.bank_registered_name} />
                )}
                <Detail label={t('admin.accounts.number')} value={a.account_number} mono />
                <Detail label={t('admin.accounts.ifsc')} value={a.ifsc} mono />
                <Detail
                  label={t('admin.accounts.bank')}
                  value={[a.bank_name, a.branch].filter(Boolean).join(', ') || '—'}
                />
                <Detail label={t('admin.accounts.pan')} value={a.pan_number} mono />
              </dl>
              <DocumentViewer account={a} token={token} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setPending({ kind: 'approve', account: a })}>
                  <Check aria-hidden="true" />
                  {t('admin.accounts.approve')}
                </Button>
                <Button variant="outline" onClick={() => setPending({ kind: 'reject', account: a })}>
                  <X aria-hidden="true" />
                  {t('admin.accounts.reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pending?.kind === 'approve'}
        onOpenChange={(o) => !o && close()}
        title={t('admin.accounts.approveTitle')}
        description={
          pending
            ? t('admin.accounts.approveDesc', {
                name: pending.account.account_holder_name,
                account: pending.account.account_number,
                ifsc: pending.account.ifsc,
              })
            : undefined
        }
        confirmLabel={t('admin.accounts.approve')}
        onConfirm={run}
      />
      <ConfirmDialog
        open={pending?.kind === 'reject'}
        onOpenChange={(o) => !o && close()}
        destructive
        title={t('admin.accounts.rejectTitle')}
        description={t('admin.accounts.rejectDesc')}
        confirmLabel={t('admin.accounts.reject')}
        disabled={reason.trim().length < 5}
        onConfirm={run}
      >
        <div className="grid gap-2">
          <Label htmlFor="acc-reject-reason">{t('admin.accounts.reason')}</Label>
          <Textarea id="acc-reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
        </div>
      </ConfirmDialog>
    </section>
  );
}
