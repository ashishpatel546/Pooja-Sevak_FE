'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useT } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import { API_URL, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell, GoogleMark, OrDivider } from '@/components/auth/auth-shell';
import { PasswordInput } from '@/components/auth/password-input';
import { destinationAfterAuth, safeNext } from '@/components/auth/safe-next';
import { GoogleConsentNote } from '@/components/auth/consent';

function LoginForm() {
  const t = useT('auth');
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      router.push(destinationAfterAuth(user, next));
    } catch (e: unknown) {
      if (e instanceof ApiError && (e.code === 'network' || e.code === 'rate_limited' || e.code === 'server')) {
        setErr(e.message);
      } else if (e instanceof ApiError && (e.status === 401 || /invalid credentials/i.test(e.message))) {
        setErr(t('login.error.invalid'));
      } else {
        setErr((e instanceof Error && e.message) || t('login.error.generic'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl leading-snug">{t('login.title')}</h2>
      <p className="mt-1 text-muted-foreground">{t('login.subtitle')}</p>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t('field.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder={t('field.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!err || undefined}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">{t('field.password')}</Label>
            <Link
              href={email.trim() ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : '/forgot-password'}
              className="-my-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('login.forgot')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!err || undefined}
            aria-describedby={err ? 'login-error' : undefined}
          />
        </div>

        {err && (
          <p id="login-error" role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {err}
          </p>
        )}

        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {busy ? t('login.submitting') : t('login.submit')}
        </Button>
      </form>

      <OrDivider label={t('shell.or')} />

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        render={<a href={`${API_URL}/auth/google${next ? `?next=${encodeURIComponent(next)}` : ''}`} />}
        nativeButton={false}
      >
        <GoogleMark />
        {t('google.continue')}
      </Button>
      <GoogleConsentNote />

      <p className="mt-7 text-center text-sm text-muted-foreground">
        {t('login.newHere')}{' '}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('login.createAccount')}
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {t('login.panditPrompt')}{' '}
        <Link
          href="/signup?role=pandit"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('login.panditJoin')}
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  const t = useT('auth');
  return (
    <AuthShell
      shloka="॥ शुभं करोति कल्याणम् ॥"
      shlokaMeaning={t('login.shlokaMeaning')}
      headline={t('login.headline')}
      lede={t('login.lede')}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
