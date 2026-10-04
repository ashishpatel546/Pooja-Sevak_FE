'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Camera, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { PayoutAccount, PayoutAccountState, PayoutAccountStatus } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Panel } from '@/components/dashboard/field';
import { errorMessage } from '@/components/dashboard/use-api';

const STATUS_CLS: Record<PayoutAccountStatus, string> = {
  verifying: 'bg-muted text-muted-foreground ring-border',
  needs_document: 'bg-accent text-accent-foreground ring-diya/40',
  pending_review: 'bg-accent text-accent-foreground ring-diya/40',
  approved: 'bg-tulsi/10 text-tulsi ring-tulsi/30',
  rejected: 'bg-destructive/10 text-destructive ring-destructive/30',
  replaced: 'bg-muted text-muted-foreground ring-border',
};

export function AccountStatusPill({ status }: { status: PayoutAccountStatus }) {
  const t = useT('payouts');
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        STATUS_CLS[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  );
}

const ACCOUNT_RE = /^\d{9,18}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PAN_RE = /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/;

type Errors = { number?: string; confirm?: string; ifsc?: string; pan?: string; form?: string };

/** Account number, typed twice, IFSC and PAN. The holder name is the KYC name, read-only. */
function AccountForm({
  kycName,
  token,
  onSaved,
  onCancel,
}: {
  kycName: string;
  token: string | null;
  onSaved: (a: PayoutAccount) => void;
  onCancel?: () => void;
}) {
  const t = useT('payouts');
  const [number, setNumber] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [pan, setPan] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!ACCOUNT_RE.test(number)) next.number = t('account.err.number');
    if (confirm !== number) next.confirm = t('account.err.confirm');
    if (!IFSC_RE.test(ifsc)) next.ifsc = t('account.err.ifsc');
    if (!PAN_RE.test(pan)) next.pan = t('account.err.pan');
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const saved = await api<PayoutAccount>('/pandits/me/payout-account', {
        method: 'PUT',
        token,
        body: { account_number: number, confirm_account_number: confirm, ifsc, pan_number: pan },
      });
      toast.success(t('account.saved'));
      onSaved(saved);
    } catch (err) {
      setErrors({ form: errorMessage(err, t('account.err.failed')) });
    } finally {
      setBusy(false);
    }
  };

  const described = (id: string, err?: string) => (err ? `${id}-error` : `${id}-hint`);

  return (
    <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
      <Field id="acc-holder" label={t('account.holder')} hint={t('account.holderHint')} className="sm:col-span-2">
        <Input id="acc-holder" value={kycName} readOnly aria-describedby="acc-holder-hint" className="bg-muted" />
      </Field>
      <Field id="acc-number" label={t('account.number')} error={errors.number} hint={t('account.numberHint')}>
        <Input
          id="acc-number"
          inputMode="numeric"
          autoComplete="off"
          value={number}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 18))}
          aria-invalid={!!errors.number}
          aria-describedby={described('acc-number', errors.number)}
          className="tracking-wider tabular-nums"
        />
      </Field>
      <Field id="acc-confirm" label={t('account.confirm')} error={errors.confirm} hint={t('account.confirmHint')}>
        <Input
          id="acc-confirm"
          inputMode="numeric"
          autoComplete="off"
          value={confirm}
          // Typed, not pasted: a second, independent entry catches mistakes.
          onPaste={(e) => e.preventDefault()}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 18))}
          aria-invalid={!!errors.confirm}
          aria-describedby={described('acc-confirm', errors.confirm)}
          className="tracking-wider tabular-nums"
        />
      </Field>
      <Field id="acc-ifsc" label={t('account.ifsc')} error={errors.ifsc} hint={t('account.ifscHint')}>
        <Input
          id="acc-ifsc"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={ifsc}
          onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
          aria-invalid={!!errors.ifsc}
          aria-describedby={described('acc-ifsc', errors.ifsc)}
          className="tracking-wider uppercase"
          placeholder="SBIN0001234"
        />
      </Field>
      <Field id="acc-pan" label={t('account.pan')} error={errors.pan} hint={t('account.panHint')}>
        <Input
          id="acc-pan"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={pan}
          onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
          aria-invalid={!!errors.pan}
          aria-describedby={described('acc-pan', errors.pan)}
          className="tracking-wider uppercase"
          placeholder="ABCPE1234F"
        />
      </Field>
      {errors.form && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? t('account.saving') : t('account.save')}
        </Button>
        {onCancel && (
          <Button type="button" size="lg" variant="outline" onClick={onCancel} disabled={busy}>
            {t('account.cancelChange')}
          </Button>
        )}
      </div>
    </form>
  );
}

/** Cancelled cheque / passbook photo for the operator to compare. */
function DocumentUpload({
  account,
  token,
  onUploaded,
}: {
  account: PayoutAccount;
  token: string | null;
  onUploaded: (a: PayoutAccount) => void;
}) {
  const t = useT('payouts');
  const f = useFormat();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append('file', file);
    try {
      const updated = await api<PayoutAccount>('/pandits/me/payout-account/document', {
        method: 'POST',
        token,
        body,
      });
      toast.success(t('doc.uploaded'));
      onUploaded(updated);
    } catch (err) {
      setError(errorMessage(err, t('doc.err.failed')));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-dashed p-4 sm:p-5">
      <h3 className="font-medium">{t('doc.title')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('doc.help')}</p>
      {account.document_uploaded_at && (
        <p className="mt-2 text-sm">{t('doc.uploadedOn', { date: f.date(account.document_uploaded_at) })}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      <Button
        type="button"
        className="mt-4"
        variant={account.has_document ? 'outline' : 'default'}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <Camera aria-hidden="true" />
        {busy ? t('doc.uploading') : account.has_document ? t('doc.replace') : t('doc.choose')}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function BankAccountCard({
  state,
  token,
  onChanged,
}: {
  state: PayoutAccountState;
  token: string | null;
  onChanged: () => void;
}) {
  const t = useT('payouts');
  const account = state.account;
  const [editing, setEditing] = useState(false);

  // While the bank check runs, look again every 15 seconds.
  useEffect(() => {
    if (account?.status !== 'verifying') return;
    const id = window.setInterval(onChanged, 15_000);
    return () => window.clearInterval(id);
  }, [account?.status, onChanged]);

  const saved = () => {
    setEditing(false);
    onChanged();
  };

  const icon = (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tulsi/10 text-tulsi">
      <Landmark className="size-5" aria-hidden="true" />
    </span>
  );

  if (state.blocked_reason) {
    return (
      <Panel title={t('account.title')} description={t('account.desc')} icon={icon}>
        <p className="text-sm">{t(`account.blocked.${state.blocked_reason}`)}</p>
      </Panel>
    );
  }

  const showForm = !account || editing || account.reason === 'bank_invalid';
  const needsDocument =
    !!account &&
    (account.status === 'needs_document' ||
      account.status === 'pending_review' ||
      (account.status === 'rejected' && account.reason === 'admin'));

  return (
    <Panel
      title={t('account.title')}
      description={t('account.desc')}
      icon={icon}
      action={account ? <AccountStatusPill status={account.status} /> : undefined}
    >
      {account && (
        <div className="grid gap-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('account.holder')}</dt>
              <dd className="font-medium break-words">{account.account_holder_name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('account.number')}</dt>
              <dd className="font-medium tracking-wider tabular-nums">{account.account_number_masked}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('account.bank')}</dt>
              <dd className="font-medium break-words">
                {[account.bank_name, account.branch].filter(Boolean).join(', ') || '—'}
                <span className="block text-sm font-normal text-muted-foreground">{account.ifsc}</span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('account.pan')}</dt>
              <dd className="font-medium tracking-wider">{account.pan_masked}</dd>
            </div>
          </dl>

          {account.status === 'approved' ? (
            <p className="flex items-start gap-2 text-sm text-tulsi">
              <BadgeCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {t('state.approved')}{' '}
                {account.verified_via &&
                  `(${t(account.verified_via === 'bank' ? 'account.verifiedBank' : 'account.verifiedDocument')})`}
              </span>
            </p>
          ) : account.status === 'verifying' || account.status === 'pending_review' ? (
            <p className="text-sm" role="status">
              {t(`state.${account.status}`)}
            </p>
          ) : account.reason ? (
            <div className="grid gap-1 text-sm" role="alert">
              <p className={account.status === 'rejected' ? 'text-destructive' : undefined}>
                {t(`reason.${account.reason}`)}
              </p>
              {account.review_note && <p>{t('reason.note', { note: account.review_note })}</p>}
            </div>
          ) : null}

          {needsDocument && !editing && (
            <DocumentUpload account={account} token={token} onUploaded={onChanged} />
          )}
        </div>
      )}

      {showForm ? (
        <div className={account ? 'mt-6 border-t pt-6' : undefined}>
          {account && editing && <p className="mb-4 text-sm text-muted-foreground">{t('account.changeWarning')}</p>}
          <AccountForm
            kycName={state.kyc_name ?? ''}
            token={token}
            onSaved={saved}
            onCancel={account && editing ? () => setEditing(false) : undefined}
          />
        </div>
      ) : (
        account.status !== 'verifying' && (
          <Button variant="outline" className="mt-6" onClick={() => setEditing(true)}>
            {t('account.change')}
          </Button>
        )
      )}
    </Panel>
  );
}
