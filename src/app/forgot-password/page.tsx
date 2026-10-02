'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { useT } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import type { MessageResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthStatus } from '@/components/auth/auth-status';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotForm() {
  const t = useT('auth');
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setErr(t('error.emailInvalid'));
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await api<MessageResponse>('/auth/password/forgot', { method: 'POST', body: { email: value } });
      setSentTo(value);
    } catch (e2) {
      // Network trouble and rate limits are worth showing; anything else is
      // treated as success so the page never reveals whether an account exists.
      if (e2 instanceof ApiError && e2.code !== 'http') setErr(e2.message);
      else if (e2 instanceof ApiError && e2.status === 400) setErr(t('error.emailInvalid'));
      else setSentTo(value);
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthStatus
        icon={MailCheck}
        tone="success"
        title={t('forgot.sentTitle')}
        actions={
          <>
            <Button size="lg" render={<Link href="/login" />} nativeButton={false}>
              {t('backToSignIn')}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setSentTo(null)}>
              {t('forgot.tryAnother')}
            </Button>
          </>
        }
      >
        <p>{t('forgot.sentBody', { email: sentTo })}</p>
        <p className="mt-3 text-sm">{t('forgot.sentSpam')}</p>
      </AuthStatus>
    );
  }

  return (
    <>
      <h2 className="text-3xl leading-snug">{t('forgot.title')}</h2>
      <p className="mt-1 leading-relaxed text-muted-foreground">{t('forgot.subtitle')}</p>

      <form onSubmit={submit} noValidate className="mt-7 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t('field.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            autoFocus
            placeholder={t('field.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!err || undefined}
            aria-describedby={err ? 'forgot-error' : undefined}
          />
        </div>
        {err && (
          <p id="forgot-error" role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {err}
          </p>
        )}
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {busy ? t('forgot.submitting') : t('forgot.submit')}
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('backToSignIn')}
        </Link>
      </p>
    </>
  );
}

export default function ForgotPasswordPage() {
  const t = useT('auth');
  return (
    <AuthShell
      shloka="॥ तमसो मा ज्योतिर्गमय ॥"
      shlokaMeaning={t('forgot.shlokaMeaning')}
      headline={t('forgot.headline')}
      lede={t('forgot.lede')}
    >
      <Suspense>
        <ForgotForm />
      </Suspense>
    </AuthShell>
  );
}
