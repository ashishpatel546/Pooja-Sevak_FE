'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleAlert, KeyRound, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { Booking } from '@/lib/types';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { errorMessage } from '@/components/dashboard/use-api';

type CodeError = { kind: 'invalid'; left: number } | { kind: 'locked' } | { kind: 'format' } | { kind: 'other'; text: string };

/** Machine-readable 422 body from POST /bookings/:id/complete. */
function codeError(e: unknown): CodeError | null {
  if (!(e instanceof ApiError) || e.status !== 422) return null;
  const body = (e.payload ?? {}) as { code?: string; attempts_left?: number };
  if (body.code === 'COMPLETION_CODE_LOCKED') return { kind: 'locked' };
  if (body.code === 'COMPLETION_CODE_INVALID') return { kind: 'invalid', left: Number(body.attempts_left ?? 0) };
  return null;
}

/**
 * The pandit marks a puja complete by entering the family's 6-digit code.
 * Wrong codes show the attempts left; after 5 the booking locks and only
 * support (an admin) can complete or unlock it.
 */
export function CompleteWithCodeDialog({
  booking: b,
  token,
  open,
  onOpenChange,
  onCompleted,
}: {
  booking: Booking;
  token: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: (updated: Booking) => void;
}) {
  const t = useT('pandit');
  const td = useT('dashboard');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<CodeError | null>(b.completion_code_locked_at ? { kind: 'locked' } : null);
  const locked = err?.kind === 'locked' || !!b.completion_code_locked_at;
  const inputId = `code-${b.id}`;
  const errId = `code-err-${b.id}`;

  const close = (o: boolean) => {
    if (busy) return;
    onOpenChange(o);
    if (!o) {
      setCode('');
      if (!locked) setErr(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!/^\d{6}$/.test(code)) {
      setErr({ kind: 'format' });
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const updated = await api<Booking>(`/bookings/${b.id}/complete`, { method: 'POST', token, body: { code } });
      toast.success(t('card.toast.complete'));
      setCode('');
      onOpenChange(false);
      onCompleted(updated);
    } catch (e) {
      const ce = codeError(e);
      setErr(ce ?? { kind: 'other', text: errorMessage(e) });
      if (ce?.kind === 'invalid') setCode('');
    } finally {
      setBusy(false);
    }
  };

  const message =
    err?.kind === 'locked'
      ? t('complete.locked')
      : err?.kind === 'invalid'
        ? t.plural('complete.invalid', err.left)
        : err?.kind === 'format'
          ? t('complete.format')
          : err?.kind === 'other'
            ? err.text
            : null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <KeyRound className="size-5 text-sindoor" aria-hidden="true" />
              {t('complete.title')}
            </DialogTitle>
            <DialogDescription className="text-base">
              {t('complete.desc')} {b.booking_type === 'online' && t('complete.online')}
            </DialogDescription>
          </DialogHeader>

          {locked ? (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="grid gap-2">
                <p>{t('complete.locked')}</p>
                <Link href="/contact" className="font-medium underline underline-offset-4">
                  {t('complete.contact')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor={inputId}>{t('complete.label')}</Label>
              <Input
                id={inputId}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (err?.kind === 'format' || err?.kind === 'other') setErr(null);
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="••••••"
                autoFocus
                aria-invalid={!!err || undefined}
                aria-describedby={message ? errId : undefined}
                className="h-14 text-center font-heading text-3xl tracking-[0.4em] tabular-nums md:text-3xl"
              />
              {message && (
                <p id={errId} role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {message}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-wrap">
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={busy}>
              {td('confirm.goBack')}
            </Button>
            {!locked && (
              <Button type="submit" disabled={busy || code.length !== 6} aria-busy={busy}>
                {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
                {t('complete.submit')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
