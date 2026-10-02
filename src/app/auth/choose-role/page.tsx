'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Link2Off, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { api, API_URL, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AuthResponse, AuthUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AuthShell, GoogleMark } from '@/components/auth/auth-shell';
import { AuthStatus } from '@/components/auth/auth-status';
import { TermsConsent } from '@/components/auth/consent';
import { RoleCards, type SignupRole } from '@/components/auth/role-cards';
import { destinationAfterAuth, safeNext } from '@/components/auth/safe-next';

/** Same landing as the Google callback: role home (pandit → dashboard), via mobile verification. */
function destinationFor(user: AuthUser, next: string | null) {
  const dest = destinationAfterAuth(user, user.role === 'pandit' ? null : next);
  if (user.role === 'admin' || user.mobile_verified) return dest;
  return `/verify-mobile?next=${encodeURIComponent(dest)}`;
}

/**
 * First Google sign-in from the login page: the person picks devotee or pandit
 * and accepts the Terms before the account is created. `ticket` is a
 * short-lived, single-use server-side reference to their verified Google
 * profile; abandoning this page creates nothing.
 */
function ChooseRole() {
  const t = useT('auth');
  const router = useRouter();
  const params = useSearchParams();
  const { setSession } = useAuth();
  const ticket = params.get('ticket');
  const next = safeNext(params.get('next'));

  const [role, setRole] = useState<SignupRole | null>(null);
  const [roleErr, setRoleErr] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsErr, setTermsErr] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expired, setExpired] = useState(!ticket);
  const [busy, setBusy] = useState(false);

  const googleHref = `${API_URL}/auth/google${next ? `?${new URLSearchParams({ next })}` : ''}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setRoleErr(role ? null : t('chooseRole.pick'));
    setTermsErr(acceptTerms ? null : t('consent.required'));
    if (!role || !acceptTerms || !ticket) return;
    setBusy(true);
    try {
      const res = await api<AuthResponse & { existing_account?: boolean }>('/auth/google/complete', {
        method: 'POST',
        body: { ticket, role, accept_terms: true },
      });
      const user = await setSession(res);
      if (res.existing_account) toast.info(t('chooseRole.existing'), { duration: 8000 });
      router.replace(destinationFor(user, next));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 410 || e.status === 401)) setExpired(true);
      else if (e instanceof ApiError && e.code !== 'http') setErr(e.message);
      else setErr((e instanceof Error && e.message) || t('chooseRole.error'));
      setBusy(false);
    }
  };

  if (expired) {
    return (
      <AuthStatus
        icon={Link2Off}
        tone="warning"
        title={t('chooseRole.expiredTitle')}
        actions={
          <>
            <Button size="lg" render={<a href={googleHref} />} nativeButton={false}>
              <GoogleMark />
              {t('chooseRole.retryGoogle')}
            </Button>
            <Button size="lg" variant="ghost" render={<Link href="/login" />} nativeButton={false}>
              {t('callback.useEmail')}
            </Button>
          </>
        }
      >
        {t('chooseRole.expiredBody')}
      </AuthStatus>
    );
  }

  return (
    <>
      <h2 className="text-3xl leading-snug">{t('chooseRole.title')}</h2>
      <p className="mt-1 text-muted-foreground">{t('chooseRole.subtitle')}</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <div className="space-y-2">
          <RoleCards
            legend={t('signup.accountType')}
            value={role}
            onChange={(r) => {
              setRole(r);
              setRoleErr(null);
            }}
          />
          {roleErr && (
            <p role="alert" className="text-sm text-destructive">
              {roleErr}
            </p>
          )}
          {role === 'pandit' && <p className="text-sm text-muted-foreground">{t('chooseRole.panditNote')}</p>}
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

        <Button type="submit" size="lg" disabled={busy} aria-busy={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {busy ? t('chooseRole.submitting') : t('chooseRole.continue')}
        </Button>
      </form>
    </>
  );
}

export default function ChooseRolePage() {
  const t = useT('auth');
  return (
    <AuthShell
      shloka="॥ श्रद्धावान् लभते ज्ञानम् ॥"
      shlokaMeaning={t('signup.shlokaMeaning')}
      headline={t('signup.headline')}
      lede={t('signup.lede')}
    >
      <Suspense>
        <ChooseRole />
      </Suspense>
    </AuthShell>
  );
}
