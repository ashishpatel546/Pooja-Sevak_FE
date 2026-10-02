'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { KeyRound, Languages, Loader2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, useT } from '@/i18n';
import { LOCALES, type Locale } from '@/i18n/config';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AuthResponse, AuthUser, MessageResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Panel } from '@/components/dashboard/field';
import { errorMessage } from '@/components/dashboard/use-api';
import { isIndianMobile, normaliseMobile } from '@/components/dashboard/mobile';
import { PasswordInput } from '@/components/auth/password-input';
import { EmailVerifier, MobileVerifier, VerifiedBadge } from '@/components/auth/verification';
import { MIN_PASSWORD, PasswordStrength } from '@/components/auth/password-strength';

export function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
      {children}
    </span>
  );
}

/* ───────────────────────── Profile ───────────────────────── */

export function ProfileSection({ user }: { user: AuthUser }) {
  const t = useT('account');
  const { token, refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobile ?? '');
  const [errors, setErrors] = useState<{ name?: string; mobile?: string }>({});
  const [busy, setBusy] = useState(false);

  const mobileChanged = normaliseMobile(mobile) !== (user.mobile ?? '');
  const dirty = name.trim() !== user.name || mobileChanged;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (name.trim().length < 2) errs.name = t('profile.nameError');
    if (mobile.trim() && !isIndianMobile(mobile)) errs.mobile = t('profile.mobileError');
    setErrors(errs);
    if (errs.name || errs.mobile) return;
    setBusy(true);
    try {
      const body: { name?: string; mobile?: string } = {};
      if (name.trim() !== user.name) body.name = name.trim();
      if (mobileChanged && mobile.trim()) body.mobile = normaliseMobile(mobile);
      await api<AuthUser>('/users/me', { method: 'PUT', token, body });
      await refreshUser();
      toast.success(t('profile.saved'));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title={t('profile.title')}
      icon={
        <SectionIcon>
          <UserRound className="size-5" aria-hidden="true" />
        </SectionIcon>
      }
    >
      <dl className="mb-6 grid gap-1 rounded-xl bg-muted/50 p-4">
        <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" /> {t('profile.accountType')}
        </dt>
        <dd className="font-medium">{t(`role.${user.role}`)}</dd>
      </dl>

      <form onSubmit={save} noValidate className="grid gap-5">
        <Field id="acc-name" label={t('profile.name')} error={errors.name}>
          <Input
            id="acc-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'acc-name-error' : undefined}
          />
        </Field>
        <Field
          id="acc-mobile"
          label={t('profile.mobile')}
          error={errors.mobile}
          hint={mobileChanged && mobile.trim() ? t('profile.mobileChangedHint') : t('profile.mobileHint')}
        >
          <div className="flex">
            <span className="inline-flex h-11 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
              +91
            </span>
            <Input
              id="acc-mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              className="rounded-l-none"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 16))}
              aria-invalid={!!errors.mobile}
              aria-describedby={errors.mobile ? 'acc-mobile-error' : 'acc-mobile-hint'}
            />
          </div>
        </Field>

        <div>
          <Button type="submit" size="lg" disabled={busy || !dirty}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('profile.save')}
          </Button>
        </div>
      </form>

      <MobileVerification user={user} />
    </Panel>
  );
}

/** Mobile status with a badge; verify inline (outside the profile form). */
function MobileVerification({ user }: { user: AuthUser }) {
  const t = useT('account');
  const [open, setOpen] = useState(false);
  const verified = !!user.mobile_verified && !!user.mobile;
  return (
    <div id="verify-mobile" className="mt-6 scroll-mt-24 rounded-xl border border-dashed p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className={cn('text-sm', verified ? 'text-tulsi' : 'text-muted-foreground')}>
            {verified
              ? t('profile.mobileVerified', { mobile: user.mobile ?? '' })
              : user.mobile
                ? t('profile.mobileUnverified', { mobile: user.mobile })
                : t('profile.noMobile')}
          </p>
          <VerifiedBadge verified={verified} />
        </div>
        {!verified && !open && (
          <Button variant="outline" className="min-h-11 shrink-0" onClick={() => setOpen(true)}>
            {t('profile.verifyMobile')}
          </Button>
        )}
      </div>
      {!verified && open && (
        <div className="mt-4">
          <MobileVerifier idPrefix="acc-verify" autoFocus onVerified={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Email ───────────────────────── */

export function EmailSection({ user }: { user: AuthUser }) {
  const t = useT('account');
  const verified = !!user.email_verified;
  return (
    <Panel
      title={t('email.title')}
      icon={
        <SectionIcon>
          <Mail className="size-5" aria-hidden="true" />
        </SectionIcon>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-medium break-all">{user.email}</span>
          <VerifiedBadge verified={verified} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {verified ? t('email.verifiedBody') : t('email.unverifiedBody')}
        </p>
        {!verified && <EmailVerifier idPrefix="acc-email" />}
      </div>
    </Panel>
  );
}

/* ───────────────────────── Language ───────────────────────── */

export function LanguageSection() {
  const t = useT('account');
  const tc = useT('common');
  const { locale } = useLocale();
  const { changeLanguage } = useAuth();
  const [justSaved, setJustSaved] = useState(false);

  const choose = (l: Locale) => {
    if (l === locale) return;
    changeLanguage(l);
    setJustSaved(true);
  };

  return (
    <Panel
      title={t('language.title')}
      description={t('language.description')}
      icon={
        <SectionIcon>
          <Languages className="size-5" aria-hidden="true" />
        </SectionIcon>
      }
    >
      <fieldset>
        <legend className="sr-only">{t('language.legend')}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {LOCALES.map((l) => {
            const active = l === locale;
            return (
              <label
                key={l}
                className={cn(
                  'flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
                  'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  active
                    ? 'border-primary bg-accent/70 text-accent-foreground'
                    : 'border-input hover:border-primary/40 hover:bg-muted/60',
                )}
              >
                <input
                  type="radio"
                  name="preferred-language"
                  value={l}
                  checked={active}
                  onChange={() => choose(l)}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="grid">
                  <span lang={l} className={cn('text-lg leading-snug font-semibold', l === 'hi' && 'font-heading font-normal')}>
                    {tc(`language.${l}`)}
                  </span>
                  <span className="text-xs text-muted-foreground" lang={l === 'hi' ? 'en' : 'hi'}>
                    {l === 'hi' ? t('language.hiNote') : t('language.enNote')}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <p role="status" className="mt-3 min-h-5 text-sm text-tulsi">
        {justSaved ? t('language.saved') : ''}
      </p>
    </Panel>
  );
}

/* ───────────────────────── Password ───────────────────────── */

type PwErrors = { current?: string; next?: string; confirm?: string };

export function PasswordSection({ email }: { email: string }) {
  const t = useT('account');
  const ta = useT('auth');
  const { token, setSession } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<PwErrors>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: PwErrors = {};
    if (!current) errs.current = t('password.currentRequired');
    if (next.length < MIN_PASSWORD) errs.next = ta('password.tooShort', { min: MIN_PASSWORD });
    else if (next === current) errs.next = t('password.same');
    if (confirm !== next) errs.confirm = ta('password.mismatch');
    setErrors(errs);
    if (errs.current || errs.next || errs.confirm) return;
    setBusy(true);
    try {
      // Changing the password signs out other devices; keep this one with the fresh session.
      const res = await api<MessageResponse & AuthResponse>('/auth/password/change', {
        method: 'POST',
        token,
        body: { current_password: current, new_password: next },
      });
      if (res.access_token) await setSession(res);
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success(t('password.success'));
    } catch (err) {
      if (err instanceof ApiError && err.code === 'http' && (err.status === 401 || /current|incorrect|wrong|invalid/i.test(err.message))) {
        setErrors({ current: t('password.wrongCurrent') });
      } else {
        toast.error(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title={t('password.title')}
      description={t('password.description', { min: MIN_PASSWORD })}
      icon={
        <SectionIcon>
          <KeyRound className="size-5" aria-hidden="true" />
        </SectionIcon>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-5">
        {/* Helps password managers pair the new password with this account. */}
        <input type="email" name="username" autoComplete="username" value={email} hidden readOnly />
        <Field id="pw-current" label={t('password.current')} error={errors.current}>
          <PasswordInput
            id="pw-current"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            aria-invalid={!!errors.current}
            aria-describedby={errors.current ? 'pw-current-error' : undefined}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid content-start gap-2">
            <Field id="pw-new" label={t('password.new')} error={errors.next}>
              <PasswordInput
                id="pw-new"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                aria-invalid={!!errors.next}
                aria-describedby={errors.next ? 'pw-new-error pw-strength' : 'pw-strength'}
              />
            </Field>
            <PasswordStrength id="pw-strength" password={next} />
          </div>
          <Field id="pw-confirm" label={t('password.confirm')} error={errors.confirm} className="content-start">
            <PasswordInput
              id="pw-confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? 'pw-confirm-error' : undefined}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" size="lg" disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {busy ? t('password.submitting') : t('password.submit')}
          </Button>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('password.forgot')}
          </Link>
        </div>
      </form>
    </Panel>
  );
}
