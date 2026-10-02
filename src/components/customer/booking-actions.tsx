'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useFormat, useT } from '@/i18n';
import type { Booking, Review } from '@/lib/types';
import { customerPayable } from '@/lib/customer-fee';
import { StarInput } from '@/components/common/rating';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage } from './use-api';

export function CancelBookingDialog({
  booking,
  open,
  onOpenChange,
  onCancelled,
}: {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: () => void;
}) {
  const { token } = useAuth();
  const t = useT('customer');
  const f = useFormat();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const paid = booking.payment_status === 'paid';

  const cancel = async () => {
    setBusy(true);
    try {
      await api(`/bookings/${booking.id}/cancel`, {
        method: 'POST',
        token,
        body: reason.trim() ? { reason: reason.trim() } : {},
      });
      toast.success(t('cancel.toast'), {
        description: paid ? t('cancel.refundToast', { amount: f.inr(customerPayable(booking)) }) : undefined,
      });
      onOpenChange(false);
      onCancelled();
    } catch (e) {
      toast.error(errorMessage(e, t('cancel.error')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('cancel.title')}</DialogTitle>
          <DialogDescription>
            {paid ? t('cancel.paidBody', { amount: f.inr(customerPayable(booking)) }) : t('cancel.unpaidBody')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="cancel-reason">
            {t('cancel.reason')} <span className="font-normal text-muted-foreground">{t('optional')}</span>
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder={t('cancel.reasonPh')}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('cancel.keep')}
          </Button>
          <Button variant="destructive" onClick={cancel} disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {t('cancel.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Rate the pandit on four parameters plus remarks. Creates the review, or edits
 * `booking.review` when it exists. Rating never completes the puja.
 */
export function ReviewForm({
  booking,
  onReviewed,
  idPrefix = 'review',
}: {
  booking: Booking;
  onReviewed: (r: Review) => void;
  idPrefix?: string;
}) {
  const { token } = useAuth();
  const t = useT('customer');
  const existing = booking.review ?? null;
  const [ratings, setRatings] = useState<Record<ReviewParamKey, number>>({
    vidhi: existing?.rating_vidhi ?? 0,
    nature: existing?.rating_nature ?? 0,
    punctuality: existing?.rating_punctuality ?? 0,
    overall: existing?.rating_overall ?? existing?.rating ?? 0,
  });
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (REVIEW_PARAM_KEYS.some((k) => !ratings[k])) {
      setErr(t('review.needAll'));
      return;
    }
    setBusy(true);
    setErr(null);
    const body = {
      rating_vidhi: ratings.vidhi,
      rating_nature: ratings.nature,
      rating_punctuality: ratings.punctuality,
      rating_overall: ratings.overall,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    };
    try {
      const review = existing
        ? await api<Review>(`/reviews/${existing.id}`, { method: 'PUT', token, body })
        : await api<Review>('/reviews', { method: 'POST', token, body: { booking_id: booking.id, ...body } });
      toast.success(existing ? t('review.updated') : t('review.thanks'));
      onReviewed(review);
    } catch (e) {
      const msg = errorMessage(e, t('review.error'));
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-3">
        {REVIEW_PARAM_KEYS.map((k) => (
          <div key={k} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-center">
            <span id={`${idPrefix}-${k}`} className="text-sm font-medium">
              {t(`review.param.${k}`)}
            </span>
            <StarInput
              value={ratings[k]}
              labelledBy={`${idPrefix}-${k}`}
              onChange={(v) => {
                setRatings((r) => ({ ...r, [k]: v }));
                setErr(null);
              }}
            />
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-comment`}>
          {t('review.remarks')} <span className="font-normal text-muted-foreground">{t('optional')}</span>
        </Label>
        <Textarea
          id={`${idPrefix}-comment`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder={t('review.remarksPh')}
        />
      </div>
      {err && (
        <p role="alert" className="text-sm text-destructive">
          {err}
        </p>
      )}
      <Button type="submit" disabled={busy} className="justify-self-start">
        {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
        {existing ? t('review.save') : t('review.post')}
      </Button>
    </form>
  );
}

const REVIEW_PARAM_KEYS = ['vidhi', 'nature', 'punctuality', 'overall'] as const;
type ReviewParamKey = (typeof REVIEW_PARAM_KEYS)[number];

/** Rate (or edit the rating) from a booking card, in a dialog. */
export function ReviewDialog({
  booking,
  open,
  onOpenChange,
  onReviewed,
}: {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewed: (r: Review) => void;
}) {
  const t = useT('customer');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{booking.review ? t('review.edit') : t('review.rate')}</DialogTitle>
          <DialogDescription>{t('review.desc')}</DialogDescription>
        </DialogHeader>
        {open && (
          <ReviewForm
            booking={booking}
            idPrefix={`rv-${booking.id}`}
            onReviewed={(r) => {
              onOpenChange(false);
              onReviewed(r);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
