'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { PanditProfile } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VerifiedPill } from '@/components/common/pandit-avatar';
import { Field, Panel } from '@/components/dashboard/field';
import { errorMessage } from '@/components/dashboard/use-api';

const groupAadhaar = (d: string) => d.replace(/(\d{4})(?=\d)/g, '$1 ');

/** "XXXX XXXX 1234" whether the API returns the full or an already-masked number. */
export function maskAadhaar(n: string | null | undefined) {
  const last4 = (n ?? '').replace(/\D/g, '').slice(-4);
  return last4 ? `XXXX XXXX ${last4}` : 'XXXX XXXX XXXX';
}

export function KycCard({
  profile,
  token,
  onVerified,
}: {
  profile: PanditProfile;
  token: string | null;
  onVerified: (p: PanditProfile) => void;
}) {
  const t = useT('pandit');
  const f = useFormat();
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<{ aadhaar?: string; otp?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  const status = profile.verification_status;
  const submitted = !!profile.kyc_submitted_at;
  // A rejected pandit may correct their Aadhaar; otherwise the details are on file.
  const showDetails = submitted;
  const showForm = !submitted || status === 'rejected';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\d{12}$/.test(aadhaar)) next.aadhaar = t('kyc.err.number');
    if (!/^\d{6}$/.test(otp)) next.otp = t('kyc.err.otp');
    setErrors(next);
    if (next.aadhaar || next.otp) return;
    setBusy(true);
    try {
      const updated = await api<PanditProfile>('/pandits/me/kyc/verify-aadhaar', {
        method: 'POST',
        token,
        body: { aadhaar_number: aadhaar, otp },
      });
      onVerified(updated);
      setAadhaar('');
      setOtp('');
      toast.success(t('kyc.success'));
    } catch (err) {
      setErrors({ form: errorMessage(err, t('kyc.err.failed')) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title={t('kyc.title')}
      description={t('kyc.desc')}
      icon={
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tulsi/10 text-tulsi">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
      }
      action={status === 'approved' ? <VerifiedPill /> : undefined}
    >
      {showDetails && (
        <div className={showForm ? 'mb-6 border-b pb-6' : undefined}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">{t('kyc.number')}</dt>
              <dd className="font-medium tracking-wider tabular-nums">{maskAadhaar(profile.aadhaar_number)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('kyc.submittedOn')}</dt>
              <dd className="font-medium">{f.date(profile.kyc_submitted_at!)}</dd>
            </div>
          </dl>
          {status !== 'not_submitted' && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t(status === 'approved' ? 'kyc.status.approved' : status === 'rejected' ? 'kyc.status.rejected' : 'kyc.status.pending')}
            </p>
          )}
        </div>
      )}
      {showForm && (
        <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
          <Field id="aadhaar" label={t('kyc.number')} error={errors.aadhaar} hint={t('kyc.numberHint')}>
            <Input
              id="aadhaar"
              inputMode="numeric"
              autoComplete="off"
              placeholder="1234 5678 9012"
              value={groupAadhaar(aadhaar)}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
              aria-invalid={!!errors.aadhaar}
              aria-describedby={errors.aadhaar ? 'aadhaar-error' : 'aadhaar-hint'}
              className="tracking-wider tabular-nums"
            />
          </Field>
          <Field id="aadhaar-otp" label={t('kyc.otp')} error={errors.otp} hint={t('kyc.otpHint')}>
            <Input
              id="aadhaar-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t('kyc.otpPlaceholder')}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              aria-invalid={!!errors.otp}
              aria-describedby={errors.otp ? 'aadhaar-otp-error' : 'aadhaar-otp-hint'}
              className="tracking-[0.3em] tabular-nums"
            />
          </Field>
          {errors.form && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {errors.form}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? t('kyc.verifying') : t('kyc.submit')}
            </Button>
          </div>
        </form>
      )}
    </Panel>
  );
}
