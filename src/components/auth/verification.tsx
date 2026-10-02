'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, CircleAlert, Loader2, Mail, RefreshCw, Smartphone, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AuthResponse, AuthUser, MessageResponse, SendOtpResponse, VerificationField } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/dashboard/field';
import { isIndianMobile, normaliseMobile } from '@/components/dashboard/mobile';

/* ───────────── helpers ───────────── */

/** Product rule: a customer may book only with a verified email AND mobile. */
export function isFullyVerified(user: Pick<AuthUser, 'email_verified' | 'mobile_verified' | 'mobile'> | null) {
  return !!user && !!user.email_verified && !!user.mobile_verified && !!user.mobile;
}

/** The `missing` list of a 403 VERIFICATION_REQUIRED response, or null for any other error. */
export function verificationMissing(e: unknown): VerificationField[] | null {
  if (!(e instanceof ApiError) || e.status !== 403) return null;
  const p = e.payload && typeof e.payload === 'object' ? (e.payload as Record<string, unknown>) : null;
  if (p?.code !== 'VERIFICATION_REQUIRED') return null;
  const missing = Array.isArray(p.missing)
    ? p.missing.filter((m): m is VerificationField => m === 'email' || m === 'mobile')
    : [];
  return missing.length ? missing : ['email', 'mobile'];
}

const mmss = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

function attemptsLeft(e: ApiError): number | null {
  const p = e.payload && typeof e.payload === 'object' ? (e.payload as Record<string, unknown>) : {};
  if (typeof p.attempts_left === 'number') return p.attempts_left;
  const m = e.message.match(/(\d+)\s*attempts?\s*left/i);
  return m ? Number(m[1]) : null;
}

type CodeOutcome = { message: string; locked?: boolean; expired?: boolean };

/** Shared reading of OTP / email-code errors (same backend rules for both). */
function useCodeError() {
  const t = useT('auth');
  return (e: unknown): CodeOutcome => {
    if (!(e instanceof ApiError) || e.code !== 'http') {
      return { message: e instanceof Error ? e.message : t('otp.wrong') };
    }
    if (/too many/i.test(e.message)) return { message: t('otp.tooMany'), locked: true };
    if (/expired|not requested|no longer valid|request a new/i.test(e.message)) {
      return { message: t('otp.expired'), expired: true };
    }
    const left = attemptsLeft(e);
    if (left === 0) return { message: t('otp.tooMany'), locked: true };
    return { message: left != null ? t.plural('otp.attemptsLeft', left) : t('otp.wrong') };
  };
}

/* ───────────── building blocks ───────────── */

export function VerifiedBadge({ verified, className }: { verified: boolean; className?: string }) {
  const t = useT('auth');
  return verified ? (
    <Badge className={cn('h-6 bg-tulsi/15 px-2.5 text-tulsi', className)}>
      <BadgeCheck aria-hidden="true" />
      {t('verify.verified')}
    </Badge>
  ) : (
    <Badge variant="outline" className={cn('h-6 border-kumkum/40 px-2.5 text-kumkum', className)}>
      <CircleAlert aria-hidden="true" />
      {t('verify.pending')}
    </Badge>
  );
}

/** Six-digit code box: numeric keypad, SMS/email autofill, paste-friendly. */
export function CodeInput({
  id,
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  describedBy,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
}) {
  const set = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    onChange(digits);
    if (digits.length === 6) onComplete?.(digits);
  };
  return (
    <Input
      id={id}
      name={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      placeholder="••••••"
      value={value}
      onChange={(e) => set(e.target.value)}
      onPaste={(e) => {
        const text = e.clipboardData.getData('text');
        const code = text.match(/\b\d{6}\b/)?.[0] ?? text.replace(/\D/g, '').slice(0, 6);
        if (code) {
          e.preventDefault();
          set(code);
        }
      }}
      disabled={disabled}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      autoFocus={autoFocus}
      className="h-14 text-center font-heading text-2xl tracking-[0.5em] tabular-nums"
    />
  );
}

/* ───────────── mobile ───────────── */

/**
 * Enter mobile → send OTP → enter OTP. On success the session is replaced
 * with the fresh one returned by the API, then `onVerified` runs.
 */
export function MobileVerifier({
  idPrefix = 'mv',
  onVerified,
  autoFocus,
}: {
  idPrefix?: string;
  onVerified?: () => void;
  autoFocus?: boolean;
}) {
  const t = useT('auth');
  const codeError = useCodeError();
  const { user, token, setSession } = useAuth();
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);

  // One-second tick for the expiry and resend countdowns while a code is pending.
  useEffect(() => {
    if (step !== 'otp') return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const expiresIn = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const expired = step === 'otp' && expiresAt > 0 && expiresIn === 0;
  const mobileId = `${idPrefix}-mobile`;
  const otpId = `${idPrefix}-otp`;

  const sendOtp = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!isIndianMobile(mobile)) {
      setErr(t('mobile.invalid'));
      return;
    }
    const m = normaliseMobile(mobile);
    setErr(null);
    setBusy(true);
    try {
      const res = await api<SendOtpResponse>('/auth/mobile/send-otp', { method: 'POST', token, body: { mobile: m } });
      const sentAt = Date.now();
      setMobile(res.mobile || m);
      setOtp('');
      setLocked(false);
      setDevOtp(res.dev_otp ?? null);
      setExpiresAt(sentAt + (res.expires_in ?? 600) * 1000);
      setResendAt(sentAt + (res.resend_after ?? 30) * 1000);
      setNow(sentAt);
      setStep('otp');
      toast.success(t('mobile.sentToast', { mobile: res.mobile || m }));
    } catch (e2) {
      if (e2 instanceof ApiError && e2.code !== 'http') setErr(e2.message);
      else if (e2 instanceof ApiError && e2.status === 409) setErr(t('mobile.inUse'));
      else setErr(t('mobile.sendError'));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (code: string) => {
    if (!/^\d{6}$/.test(code)) {
      setErr(t('otp.enterSix'));
      return;
    }
    if (busy || locked || expired) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await api<AuthResponse>('/auth/mobile/verify-otp', { method: 'POST', token, body: { otp: code } });
      if (res && typeof res === 'object' && 'access_token' in res) await setSession(res);
      toast.success(t('otp.verified'));
      onVerified?.();
    } catch (e2) {
      if (e2 instanceof ApiError && e2.status === 409) {
        setErr(t('mobile.inUse'));
      } else {
        const out = codeError(e2);
        if (out.locked) setLocked(true);
        if (out.expired) {
          setExpiresAt(Date.now());
          setNow(Date.now());
        }
        setErr(out.message);
      }
      setOtp('');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'mobile') {
    return (
      <form onSubmit={sendOtp} noValidate className="grid gap-4">
        <Field id={mobileId} label={t('field.mobile')} error={err} hint={t('mobile.hint')}>
          <div className="flex">
            <span className="inline-flex h-11 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id={mobileId}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 16))}
              aria-invalid={!!err}
              aria-describedby={err ? `${mobileId}-error` : `${mobileId}-hint`}
              className="rounded-l-none"
              autoFocus={autoFocus}
            />
          </div>
        </Field>
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {busy ? t('mobile.sending') : t('mobile.send')}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verify(otp);
      }}
      noValidate
      className="grid gap-4"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{t('mobile.codeSent', { mobile })}</p>
      <Field id={otpId} label={t('otp.label')} error={err} hint={t('otp.hint')}>
        <CodeInput
          id={otpId}
          value={otp}
          onChange={(d) => {
            setOtp(d);
            if (err) setErr(null);
          }}
          onComplete={(c) => void verify(c)}
          disabled={locked || expired}
          invalid={!!err}
          describedBy={err ? `${otpId}-error` : `${otpId}-hint`}
          autoFocus
        />
      </Field>

      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <TimerReset className="size-4 shrink-0" aria-hidden="true" />
        {expired ? t('otp.expired') : t('otp.expiresIn', { time: mmss(expiresIn) })}
      </p>

      {devOtp && (
        <p className="rounded-md border border-dashed px-3 py-2 font-mono text-xs text-muted-foreground">
          {t('otp.devNote', { code: devOtp })}
        </p>
      )}

      <Button type="submit" size="lg" disabled={busy || locked || expired || otp.length !== 6} className="w-full">
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {busy ? t('otp.verifying') : t('otp.verify')}
      </Button>
      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          onClick={() => {
            setStep('mobile');
            setErr(null);
            setDevOtp(null);
          }}
          disabled={busy}
        >
          {t('otp.changeNumber')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 tabular-nums"
          onClick={() => sendOtp()}
          disabled={busy || resendIn > 0}
        >
          {resendIn > 0 ? t('otp.resendIn', { seconds: resendIn }) : t('otp.resend')}
        </Button>
      </div>
    </form>
  );
}

/* ───────────── email ───────────── */

/**
 * The verification email carries a link and a 6-digit code. Type the code
 * here, ask for a new email, or — after tapping the link on any device —
 * re-check the account.
 */
export function EmailVerifier({
  idPrefix = 'ev',
  onVerified,
  autoFocus,
}: {
  idPrefix?: string;
  onVerified?: () => void;
  autoFocus?: boolean;
}) {
  const t = useT('auth');
  const codeError = useCodeError();
  const { user, token, setSession } = useAuth();
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'verify' | 'send' | 'check'>(null);
  const [locked, setLocked] = useState(false);
  const codeId = `${idPrefix}-code`;
  const email = user?.email ?? '';

  const verify = async (value: string) => {
    if (!/^\d{6}$/.test(value)) {
      setErr(t('otp.enterSix'));
      return;
    }
    if (busy || locked) return;
    setErr(null);
    setInfo(null);
    setBusy('verify');
    try {
      const res = await api<AuthResponse>('/auth/email/verify-code', { method: 'POST', token, body: { code: value } });
      if (res && typeof res === 'object' && 'access_token' in res) await setSession(res);
      toast.success(t('emailCode.verified'));
      onVerified?.();
    } catch (e) {
      const out = codeError(e);
      if (out.locked || out.expired) setLocked(true);
      setErr(out.message);
      setCode('');
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    setErr(null);
    setInfo(null);
    setBusy('send');
    try {
      await api<MessageResponse>('/auth/email/send-verification', { method: 'POST', token });
      setLocked(false);
      setCode('');
      setInfo(t('emailCode.sent', { email }));
      toast.success(t('emailCode.sent', { email }));
    } catch (e) {
      setErr(e instanceof ApiError && e.code !== 'http' ? e.message : t('emailCode.sendError'));
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    setErr(null);
    setInfo(null);
    setBusy('check');
    try {
      // Re-reads the user from the server and stores it, so badges update everywhere.
      const me = token ? await setSession(token) : null;
      if (me?.email_verified) {
        toast.success(t('emailCode.verified'));
        onVerified?.();
      } else {
        setInfo(t('emailCode.notYet'));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('emailCode.sendError'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verify(code);
      }}
      noValidate
      className="grid gap-4"
    >
      <p className="text-sm leading-relaxed break-words text-muted-foreground">{t('emailCode.intro', { email })}</p>
      <Field id={codeId} label={t('emailCode.label')} error={err} hint={t('emailCode.hint')}>
        <CodeInput
          id={codeId}
          value={code}
          onChange={(d) => {
            setCode(d);
            if (err) setErr(null);
          }}
          onComplete={(c) => void verify(c)}
          disabled={locked || busy === 'verify'}
          invalid={!!err}
          describedBy={err ? `${codeId}-error` : `${codeId}-hint`}
          autoFocus={autoFocus}
        />
      </Field>
      {info && (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          {info}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!!busy || locked || code.length !== 6} className="w-full">
        {busy === 'verify' && <Loader2 className="animate-spin" aria-hidden="true" />}
        {busy === 'verify' ? t('otp.verifying') : t('emailCode.verify')}
      </Button>
      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" className="min-h-11" onClick={send} disabled={!!busy}>
          {busy === 'send' ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {busy === 'send' ? t('emailCode.sending') : t('emailCode.send')}
        </Button>
        <Button type="button" variant="ghost" className="min-h-11" onClick={check} disabled={!!busy}>
          {busy === 'check' ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw aria-hidden="true" />
          )}
          {busy === 'check' ? t('emailCode.checking') : t('emailCode.clickedLink')}
        </Button>
      </div>
    </form>
  );
}

/* ───────────── the booking gate ───────────── */

function Row({
  icon: Icon,
  label,
  value,
  verified,
  children,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  label: string;
  value: string;
  verified: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm text-muted-foreground">{label}</span>
            <span className="block font-medium break-all">{value}</span>
          </span>
        </span>
        <VerifiedBadge verified={verified} />
      </div>
      {!verified && children && <div className="mt-4">{children}</div>}
    </li>
  );
}

/**
 * Inline "verify email and mobile" step shown in the booking flow, so the
 * customer never loses the slot they picked. Calls `onComplete` once both are
 * verified (after refreshing the user from the server).
 */
export function VerificationPanel({
  onComplete,
  className,
  headingId = 'verify-h',
}: {
  onComplete?: () => void;
  className?: string;
  headingId?: string;
}) {
  const t = useT('auth');
  const { user, refreshUser } = useAuth();
  const emailOk = !!user?.email_verified;
  const mobileOk = !!user?.mobile_verified && !!user?.mobile;
  const done = emailOk && mobileOk;
  const wasIncomplete = useRef(!done);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  });

  useEffect(() => {
    if (!done) {
      wasIncomplete.current = true;
      return;
    }
    if (!wasIncomplete.current) return;
    wasIncomplete.current = false;
    refreshUser()
      .catch(() => {})
      .finally(() => completeRef.current?.());
  }, [done, refreshUser]);

  if (!user) return null;
  return (
    <section
      aria-labelledby={headingId}
      className={cn('rounded-2xl border border-diya/40 bg-chandan p-4 sm:p-6', className)}
    >
      <h2 id={headingId} className="text-2xl leading-snug">
        {done ? t('verify.done') : t('verify.title')}
      </h2>
      {!done && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('verify.intro')}</p>}
      <ul className="mt-4 grid gap-3">
        <Row icon={Mail} label={t('verify.email')} value={user.email} verified={emailOk}>
          <EmailVerifier idPrefix={`${headingId}-email`} />
        </Row>
        <Row
          icon={Smartphone}
          label={t('verify.mobile')}
          value={user.mobile ? `+91 ${user.mobile}` : t('verify.noMobile')}
          verified={mobileOk}
        >
          <MobileVerifier idPrefix={`${headingId}-mobile`} />
        </Row>
      </ul>
    </section>
  );
}
