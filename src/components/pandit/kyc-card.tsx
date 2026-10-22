'use client';

import { useState } from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { PanditProfile } from '@/lib/types';
import { useFormat, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifiedPill } from '@/components/common/pandit-avatar';
import { Field, Panel } from '@/components/dashboard/field';
import { errorMessage, useApi } from '@/components/dashboard/use-api';

const groupAadhaar = (d: string) => d.replace(/(\d{4})(?=\d)/g, '$1 ');

/** "XXXX XXXX 1234" whether the API returns the full or an already-masked number. */
export function maskAadhaar(n: string | null | undefined) {
  const last4 = (n ?? '').replace(/\D/g, '').slice(-4);
  return last4 ? `XXXX XXXX ${last4}` : 'XXXX XXXX XXXX';
}

const DIGILOCKER_ERRORS = ['invalid_state', 'no_aadhaar', 'already_linked', 'not_configured'] as const;

/** i18n key for a failed DigiLocker start/complete, from the API's `code`. */
export function digilockerErrorKey(e: unknown) {
  const code = e instanceof ApiError ? (e.payload as { code?: unknown } | null)?.code : null;
  const known = DIGILOCKER_ERRORS.find((c) => c === code);
  return known ? (`kyc.dl.err.${known}` as const) : ('kyc.dl.err.failed' as const);
}

/** Sends the browser to DigiLocker; resolves only if starting failed. */
export async function startDigilocker(token: string | null) {
  const { url } = await api<{ url: string }>('/pandits/me/kyc/digilocker/start', { method: 'POST', token });
  window.location.assign(url);
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

  const dlState = useApi<{ enabled: boolean }>('/pandits/me/kyc/digilocker', token);
  const digilocker = dlState.data?.enabled ?? null; // null while unknown

  const status = profile.verification_status;
  const submitted = !!profile.kyc_submitted_at;
  const viaDigilocker = !!profile.digilocker_id;
  // A rejected pandit may correct their Aadhaar; otherwise the details are on file.
  // With DigiLocker on, anyone not yet verified there (e.g. the old form) may verify.
  const showDetails = submitted;
  const showForm = !submitted || status === 'rejected' || (digilocker === true && !viaDigilocker);

  const verifyWithDigilocker = async () => {
    setErrors({});
    setBusy(true);
    try {
      await startDigilocker(token);
    } catch (err) {
      setErrors({ form: t(digilockerErrorKey(err)) });
      setBusy(false);
    }
  };

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
          {viaDigilocker && (
            <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-tulsi">
              <BadgeCheck className="size-4" aria-hidden="true" />
              {t('kyc.dl.verified')}
            </p>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            {viaDigilocker && profile.kyc_name && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('kyc.dl.name')}</dt>
                <dd className="font-medium break-words">{profile.kyc_name}</dd>
              </div>
            )}
            {viaDigilocker && profile.kyc_dob && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('kyc.dl.dob')}</dt>
                <dd className="font-medium">{f.date(profile.kyc_dob)}</dd>
              </div>
            )}
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
              {t(
                status === 'approved'
                  ? 'kyc.status.approved'
                  : status === 'rejected'
                    ? digilocker
                      ? 'kyc.dl.rejected'
                      : 'kyc.status.rejected'
                    : 'kyc.status.pending',
              )}
            </p>
          )}
        </div>
      )}
      {showForm && digilocker === null && dlState.loading && <Skeleton className="h-24 w-full rounded-xl" />}
      {showForm && digilocker === true && (
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">{t('kyc.dl.hint')}</p>
          {errors.form && (
            <p role="alert" className="text-sm text-destructive">
              {errors.form}
            </p>
          )}
          <div>
            <Button type="button" size="lg" disabled={busy} onClick={verifyWithDigilocker}>
              <ShieldCheck aria-hidden="true" />
              {busy ? t('kyc.dl.redirecting') : t(viaDigilocker ? 'kyc.dl.again' : 'kyc.dl.button')}
            </Button>
          </div>
        </div>
      )}
      {showForm && digilocker !== true && !dlState.loading && (
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
