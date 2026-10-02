'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CircleCheck, KeyRound, Link2Off, Loader2 } from 'lucide-react';
import { useT } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import type { MessageResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthStatus } from '@/components/auth/auth-status';
import { PasswordInput } from '@/components/auth/password-input';
import { MIN_PASSWORD, PasswordStrength } from '@/components/auth/password-strength';
import { AuthLoader } from '@/components/auth/auth-loader';

type Errors = { password?: string; confirm?: string; form?: string };

function ResetForm() {
  const t = useT('auth');
  const params = useSearchParams();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'form' | 'done' | 'invalid'>('form');

  const requestNew = (
    <Button size="lg" render={<Link href="/forgot-password" />} nativeButton={false}>
      {t('reset.requestNew')}
    </Button>
  );

  if (!token) {
    return (
      <AuthStatus icon={KeyRound} title={t('reset.missingTitle')} actions={requestNew}>
        {t('reset.missingBody')}
      </AuthStatus>
    );
  }
  if (state === 'invalid') {
    return (
      <AuthStatus icon={Link2Off} tone="warning" title={t('reset.invalidTitle')} actions={requestNew}>
        {t('reset.invalidBody')}
      </AuthStatus>
    );
  }
  if (state === 'done') {
    return (
      <AuthStatus
        icon={CircleCheck}
        tone="success"
        title={t('reset.successTitle')}
        actions={
          <Button size="lg" render={<Link href="/login" />} nativeButton={false}>
            {t('reset.signIn')}
          </Button>
        }
      >
        {t('reset.successBody')}
      </AuthStatus>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errors = {};
    if (password.length < MIN_PASSWORD) errs.password = t('password.tooShort', { min: MIN_PASSWORD });
    if (confirm !== password) errs.confirm = t('password.mismatch');
    setErrors(errs);
    if (errs.password || errs.confirm) return;
    setBusy(true);
    try {
      await api<MessageResponse>('/auth/password/reset', { method: 'POST', body: { token, password } });
      setState('done');
    } catch (e2) {
      if (e2 instanceof ApiError && e2.code !== 'http') setErrors({ form: e2.message });
      else if (e2 instanceof ApiError && /password/i.test(e2.message) && !/token|expired|invalid link/i.test(e2.message))
        setErrors({ password: e2.message });
      else setState('invalid');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl leading-snug">{t('reset.title')}</h2>
      <p className="mt-1 text-muted-foreground">{t('reset.subtitle')}</p>
      <form onSubmit={submit} noValidate className="mt-7 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="new-password">{t('reset.new')}</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password || undefined}
            aria-describedby={errors.password ? 'new-password-error new-password-hint' : 'new-password-hint'}
          />
          {errors.password && (
            <p id="new-password-error" role="alert" className="text-sm text-destructive">
              {errors.password}
            </p>
          )}
          <PasswordStrength id="new-password-hint" password={password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">{t('reset.confirm')}</Label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors.confirm || undefined}
            aria-describedby={errors.confirm ? 'confirm-password-error' : undefined}
          />
          {errors.confirm && (
            <p id="confirm-password-error" role="alert" className="text-sm text-destructive">
              {errors.confirm}
            </p>
          )}
        </div>
        {errors.form && (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {errors.form}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {busy ? t('reset.submitting') : t('reset.submit')}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const t = useT('auth');
  return (
    <AuthShell
      shloka="॥ तमसो मा ज्योतिर्गमय ॥"
      shlokaMeaning={t('forgot.shlokaMeaning')}
      headline={t('forgot.headline')}
      lede={t('forgot.lede')}
    >
      <Suspense fallback={<AuthLoader />}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
