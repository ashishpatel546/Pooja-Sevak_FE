'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, Loader2, MailQuestion, MailWarning } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { MessageResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/auth-shell';
import { AuthStatus } from '@/components/auth/auth-status';
import { homeFor } from '@/components/auth/safe-next';
import { DiyaLoader } from '@/components/common/loading';
import { errorMessage } from '@/components/dashboard/use-api';

type Status = 'verifying' | 'success' | 'expired';

/** Resend button for signed-in users whose email is still unverified. */
function ResendLink() {
  const t = useT('auth');
  const { user, token, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (loading) return null;
  if (!user || !token) {
    return (
      <Button size="lg" render={<Link href="/login?next=/account" />} nativeButton={false}>
        {t('verifyEmail.signInToResend')}
      </Button>
    );
  }
  if (user.email_verified) {
    return (
      <>
        <p className="flex items-center gap-2 text-sm text-tulsi">
          <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
          {t('verifyEmail.alreadyVerified', { email: user.email })}
        </p>
        <Button size="lg" render={<Link href={homeFor(user)} />} nativeButton={false}>
          {t('verifyEmail.continue')}
        </Button>
      </>
    );
  }
  const resend = async () => {
    setBusy(true);
    try {
      await api<MessageResponse>('/auth/email/send-verification', { method: 'POST', token });
      setSent(true);
      toast.success(t('verifyEmail.resent', { email: user.email }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {sent && (
        <p role="status" className="text-sm text-tulsi">
          {t('verifyEmail.resent', { email: user.email })}
        </p>
      )}
      <Button size="lg" onClick={resend} disabled={busy || sent}>
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {busy ? t('verifyEmail.resending') : t('verifyEmail.resend')}
      </Button>
    </>
  );
}

function VerifyEmail() {
  const t = useT('auth');
  const tc = useT('common');
  const params = useSearchParams();
  const token = params.get('token');
  const { user, token: session, refreshUser } = useAuth();
  const [status, setStatus] = useState<Status>('verifying');
  const started = useRef(false);
  const refreshed = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    api<MessageResponse>('/auth/email/verify', { method: 'POST', body: { token } }).then(
      () => setStatus('success'),
      () => setStatus('expired'),
    );
  }, [token]);

  // Once verified, refresh the stored user so badges elsewhere update.
  useEffect(() => {
    if (status !== 'success' || !session || !user || user.email_verified || refreshed.current) return;
    refreshed.current = true;
    refreshUser().catch(() => {});
  }, [status, session, user, refreshUser]);

  if (!token) {
    return (
      <AuthStatus icon={MailQuestion} title={t('verifyEmail.missingTitle')} actions={<ResendLink />}>
        {t('verifyEmail.missingBody')}
      </AuthStatus>
    );
  }
  if (status === 'verifying') return <DiyaLoader label={t('verifyEmail.verifying')} />;
  if (status === 'expired') {
    return (
      <AuthStatus icon={MailWarning} tone="warning" title={t('verifyEmail.expiredTitle')} actions={<ResendLink />}>
        {t('verifyEmail.expiredBody')}
      </AuthStatus>
    );
  }
  return (
    <AuthStatus
      icon={BadgeCheck}
      tone="success"
      title={t('verifyEmail.successTitle')}
      actions={
        user ? (
          <Button size="lg" render={<Link href={homeFor(user)} />} nativeButton={false}>
            {t('verifyEmail.continue')}
          </Button>
        ) : (
          <Button size="lg" render={<Link href="/login" />} nativeButton={false}>
            {tc('action.signIn')}
          </Button>
        )
      }
    >
      {t('verifyEmail.successBody')}
    </AuthStatus>
  );
}

export default function VerifyEmailPage() {
  const t = useT('auth');
  return (
    <AuthShell
      shloka="॥ सत्यमेव जयते ॥"
      shlokaMeaning={t('verifyEmail.shlokaMeaning')}
      headline={t('verifyEmail.headline')}
      lede={t('verifyEmail.lede')}
    >
      <Suspense fallback={<DiyaLoader label={t('verifyEmail.verifying')} />}>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
