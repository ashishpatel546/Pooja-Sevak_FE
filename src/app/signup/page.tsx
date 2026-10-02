'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import { API_URL, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell, GoogleMark, OrDivider } from '@/components/auth/auth-shell';
import { PasswordInput } from '@/components/auth/password-input';
import { MIN_PASSWORD, PasswordStrength } from '@/components/auth/password-strength';
import { destinationAfterAuth, safeNext } from '@/components/auth/safe-next';
import { GoogleConsentNote, TermsConsent } from '@/components/auth/consent';
import { RoleCards, type SignupRole } from '@/components/auth/role-cards';

function SignupForm() {
  const t = useT('auth');
  const { signup } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const [role, setRole] = useState<SignupRole>(params.get('role') === 'pandit' ? 'pandit' : 'customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [mobileErr, setMobileErr] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsErr, setTermsErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The chosen role rides through Google in a signed state; it only applies to a new account.
  const googleHref = `${API_URL}/auth/google?${new URLSearchParams({ role, ...(next ? { next } : {}) })}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const m = mobile.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    const badMobile = !!m && !/^[6-9]\d{9}$/.test(m);
    const shortPw = password.length < MIN_PASSWORD;
    setMobileErr(badMobile ? t('signup.mobileError') : null);
    setPwErr(shortPw ? t('password.tooShort', { min: MIN_PASSWORD }) : null);
    setTermsErr(acceptTerms ? null : t('consent.required'));
    if (badMobile || shortPw || !acceptTerms) return;
    setBusy(true);
    try {
      const user = await signup({
        name: name.trim(),
        email: email.trim(),
        mobile: m || undefined,
        password,
        role,
        accept_terms: true,
      });
      toast.success(t('signup.verifySent', { email: user.email }), {
        description: t('signup.verifySentHint'),
        duration: 8000,
      });
      // A new pandit always starts on the dashboard, where the setup checklist lives.
      router.push(destinationAfterAuth(user, role === 'pandit' ? null : next));
    } catch (e: unknown) {
      if (e instanceof ApiError && e.code !== 'http') setErr(e.message);
      else if (e instanceof ApiError && (e.status === 409 || /already in use/i.test(e.message))) setErr(t('signup.error.exists'));
      else setErr((e instanceof Error && e.message) || t('signup.error.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl leading-snug">{role === 'pandit' ? t('signup.titlePandit') : t('signup.titleCustomer')}</h2>
      <p className="mt-1 text-muted-foreground">
        {role === 'pandit' ? t('signup.subtitlePandit') : t('signup.subtitleCustomer')}
      </p>

      <RoleCards className="mt-6" legend={t('signup.accountType')} value={role} onChange={setRole} />

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{t('field.name')}</Label>
          <Input
            id="name"
            autoComplete="name"
            required
            placeholder={role === 'pandit' ? t('signup.namePlaceholderPandit') : t('signup.namePlaceholderCustomer')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobile">
            {t('field.mobile')} <span className="font-normal text-muted-foreground">{t('field.optional')}</span>
          </Label>
          <div className="flex">
            <span className="grid h-11 place-items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="mobile"
              type="tel"
              autoComplete="tel-national"
              inputMode="numeric"
              placeholder="98765 43210"
              className="rounded-l-none"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              aria-invalid={!!mobileErr || undefined}
              aria-describedby={mobileErr ? 'mobile-error' : 'mobile-hint'}
            />
          </div>
          {mobileErr ? (
            <p id="mobile-error" role="alert" className="text-sm text-destructive">
              {mobileErr}
            </p>
          ) : (
            <p id="mobile-hint" className="text-xs text-muted-foreground">
              {t('signup.mobileHint')}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('field.password')}</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!pwErr || undefined}
            aria-describedby={pwErr ? 'password-error password-hint' : 'password-hint'}
          />
          {pwErr && (
            <p id="password-error" role="alert" className="text-sm text-destructive">
              {pwErr}
            </p>
          )}
          <PasswordStrength id="password-hint" password={password} />
        </div>

        <TermsConsent
          checked={acceptTerms}
          onChange={(v) => {
            setAcceptTerms(v);
            if (v) setTermsErr(null);
          }}
          error={termsErr}
        />

        {err && (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {err}
          </p>
        )}

        <Button type="submit" size="lg" disabled={busy || !acceptTerms} className="w-full">
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {busy ? t('signup.submitting') : role === 'pandit' ? t('signup.submitPandit') : t('signup.submitCustomer')}
        </Button>
      </form>

      <OrDivider label={t('shell.or')} />
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        render={<a href={googleHref} />}
        nativeButton={false}
      >
        <GoogleMark />
        {t('google.continue')}
      </Button>
      <GoogleConsentNote />

      <p className="mt-7 text-center text-sm text-muted-foreground">
        {t('signup.haveAccount')}{' '}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('signup.signIn')}
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  const t = useT('auth');
  return (
    <AuthShell
      shloka="॥ श्रद्धावान् लभते ज्ञानम् ॥"
      shlokaMeaning={t('signup.shlokaMeaning')}
      headline={t('signup.headline')}
      lede={t('signup.lede')}
    >
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
