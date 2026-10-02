'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { setFlash } from '@/lib/flash';
import type { AccountDeletionPreview, AuthUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/dashboard/field';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { PasswordInput } from '@/components/auth/password-input';
import { SectionIcon } from './sections';

/** Danger zone: self-service account deletion (DPDP right to erasure). */
export function DeleteAccountSection({ user }: { user: AuthUser }) {
  const t = useT('account');
  const tc = useT('common');
  const { token } = useAuth();
  const preview = useApi<AccountDeletionPreview>('/users/me/deletion', token);
  const [open, setOpen] = useState(false);
  const p = preview.data;

  const consequences = [
    user.role === 'pandit' ? t('delete.c.panditBookings') : user.role === 'customer' ? t('delete.c.bookings') : null,
    t('delete.c.data'),
    t('delete.c.records'),
    t('delete.c.final'),
  ].filter((c): c is string => !!c);

  return (
    <section
      aria-labelledby="delete-account-title"
      className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 sm:p-7"
    >
      <div className="mb-5 flex items-start gap-3">
        <SectionIcon>
          <Trash2 className="size-5 text-destructive" aria-hidden="true" />
        </SectionIcon>
        <div className="min-w-0">
          <h2 id="delete-account-title" className="text-2xl leading-tight">
            {t('delete.title')}
          </h2>
          <p className="mt-1 text-muted-foreground">{t('delete.description')}</p>
        </div>
      </div>

      <h3 className="font-semibold">{t('delete.whatHappens')}</h3>
      <ul className="mt-2 grid list-disc gap-2 pl-5 text-sm leading-relaxed text-foreground/90">
        {consequences.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <div className="mt-5 grid gap-3" aria-live="polite">
        {preview.loading && !p ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {tc('state.loading')}
          </p>
        ) : preview.error && !p ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-destructive">
            <span>{t('delete.loadError')}</span>
            <Button variant="outline" className="min-h-11" onClick={preview.reload}>
              {t('delete.retry')}
            </Button>
          </div>
        ) : p ? (
          <>
            {p.blocked ? (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t(`delete.blocked.${p.blocked.code}`)}
              </p>
            ) : p.bookings_to_cancel > 0 ? (
              <p className="text-sm font-medium">
                {t.plural('delete.toCancel', p.bookings_to_cancel)}{' '}
                {p.paid_bookings_to_refund > 0 && t.plural('delete.toRefund', p.paid_bookings_to_refund)}
              </p>
            ) : null}
            <div>
              <Button
                variant="destructive"
                size="lg"
                className="min-h-11"
                disabled={!!p.blocked}
                onClick={() => setOpen(true)}
              >
                <Trash2 aria-hidden="true" /> {t('delete.open')}
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {p && !p.blocked && (
        <DeleteAccountDialog
          open={open}
          onOpenChange={setOpen}
          email={user.email}
          confirmWith={p.confirm_with}
          onBlocked={preview.reload}
        />
      )}
    </section>
  );
}

function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
  confirmWith,
  onBlocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  confirmWith: 'password' | 'email';
  onBlocked: () => void;
}) {
  const t = useT('account');
  const { token, logout } = useAuth();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailOk = value.trim().toLowerCase() === email.trim().toLowerCase();
  const ready = confirmWith === 'password' ? value.length > 0 : emailOk;

  const close = (o: boolean) => {
    if (busy) return;
    if (!o) {
      setValue('');
      setError(null);
    }
    onOpenChange(o);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) {
      setError(confirmWith === 'password' ? t('delete.dialog.passwordRequired') : t('delete.dialog.emailMismatch'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('/users/me/delete', {
        method: 'POST',
        token,
        body: confirmWith === 'password' ? { password: value } : { email: value.trim() },
      });
      setFlash({ type: 'success', message: t('delete.done') });
      logout();
      // Hard navigation so this page's auth guard doesn't bounce to /login.
      window.location.assign('/');
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 400) {
        setError(confirmWith === 'password' ? t('delete.dialog.wrongPassword') : t('delete.dialog.emailMismatch'));
      } else if (err instanceof ApiError && err.status === 409) {
        // Something changed (e.g. a puja started): refresh the reason shown on the page.
        onOpenChange(false);
        onBlocked();
        toast.error(errorMessage(err));
      } else {
        toast.error(errorMessage(err));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('delete.dialog.title')}</DialogTitle>
            <DialogDescription className="text-base">{t('delete.dialog.description')}</DialogDescription>
          </DialogHeader>

          {confirmWith === 'password' ? (
            <>
              {/* Lets password managers pair the password with this account. */}
              <input type="email" name="username" autoComplete="username" value={email} hidden readOnly />
              <Field id="delete-confirm" label={t('delete.dialog.password')} error={error}>
                <PasswordInput
                  id="delete-confirm"
                  autoComplete="current-password"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'delete-confirm-error' : undefined}
                />
              </Field>
            </>
          ) : (
            <Field
              id="delete-confirm"
              label={t('delete.dialog.email')}
              error={error}
              hint={t('delete.dialog.emailHint', { email })}
            >
              <Input
                id="delete-confirm"
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'delete-confirm-error' : 'delete-confirm-hint'}
              />
            </Field>
          )}

          <DialogFooter className="flex-wrap">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => close(false)} disabled={busy}>
              {t('delete.dialog.cancel')}
            </Button>
            <Button type="submit" variant="destructive" className="min-h-11" disabled={busy || !ready} aria-busy={busy}>
              {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
              {t('delete.dialog.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
