'use client';

import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Clock,
  Home,
  Lock,
  MapPin,
  Package,
  Pencil,
  SearchX,
  Undo2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { pick, useFormat, useT } from '@/i18n';
import { buildIcs, downloadIcs } from '@/lib/ics';
import type { Booking, Review } from '@/lib/types';
import { cn } from '@/lib/utils';
import { bookingFee, bookingSamagri, customerPayable } from '@/lib/customer-fee';
import { Diya } from '@/components/brand/diya';
import { Mandala } from '@/components/brand/mandala';
import { EmptyState } from '@/components/common/empty-state';
import { DiyaLoader } from '@/components/common/loading';
import { PageShell } from '@/components/common/page-header';
import { PanditAvatar } from '@/components/common/pandit-avatar';
import { PujaIcon } from '@/components/common/puja-icon';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { CancelBookingDialog, ReviewForm } from '@/components/customer/booking-actions';
import { BookingTimeline } from '@/components/customer/booking-timeline';
import { CompletionCodeCard } from '@/components/customer/completion-code-card';
import { ReviewParams, Stars } from '@/components/common/rating-breakdown';
import { canEditReview, canRate, reviewEditableUntil } from '@/lib/review-rules';
import { FeeLines, hasExtras } from '@/components/customer/price-breakdown';
import { SamagriListButton, samagriForMode } from '@/components/common/samagri-list';
import { formatLocalTime, useForeignTimeZone } from '@/components/customer/timezone-note';
import { useApiQuery, useNow } from '@/components/customer/use-api';
import { usePayment } from '@/components/customer/use-payment';
import { useRequireCustomer } from '@/components/customer/use-require-customer';
import { CustomerOnly } from '@/components/customer/wrong-role';
import { useErrorText } from '@/components/ritual/use-error-text';
import { isFullyVerified, VerificationPanel, verificationMissing } from '@/components/auth/verification';

const JOIN_EARLY_MS = 15 * 60_000;

function Panel({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn('min-w-0 rounded-2xl border bg-card p-5 sm:p-6', className)}>
      <h2 id={id} className="mb-4 text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-0.5 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 wrap-break-word">{children}</dd>
    </div>
  );
}

function addressText(b: Booking) {
  const a = b.address;
  if (!a) return '';
  return [a.address_line_1, a.address_line_2, a.city, a.state, a.pin_code].filter(Boolean).join(', ');
}

function JoinLive({ booking, now }: { booking: Booking; now: number }) {
  const t = useT('booking');
  const f = useFormat();
  const start = +new Date(booking.start_time);
  const end = +new Date(booking.end_time);
  const opensAt = start - JOIN_EARLY_MS;
  const tz = useForeignTimeZone();
  const active = booking.booking_status === 'confirmed' || booking.booking_status === 'in_progress';
  const unpaid = booking.payment_status !== 'paid';

  let body: React.ReactNode;
  if (booking.booking_status === 'completed' || (active && now > end + 30 * 60_000)) {
    body = <p className="text-sm text-muted-foreground">{t('live.ended')}</p>;
  } else if (unpaid || !active) {
    body = <p className="text-sm text-muted-foreground">{t('live.afterPayment')}</p>;
  } else if (!booking.meeting_url) {
    body = <p className="text-sm text-muted-foreground">{t('live.linkSoon')}</p>;
  } else if (now < opensAt) {
    const vars = { time: f.time(new Date(opensAt)), date: f.date(new Date(opensAt)) };
    body = (
      <>
        <Button size="lg" disabled className="w-full sm:w-auto">
          <Lock aria-hidden="true" />
          {t('live.join')}
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">
          {tz
            ? t('live.opensAtLocal', { ...vars, local: formatLocalTime(new Date(opensAt), tz, f.locale) })
            : t('live.opensAt', vars)}
        </p>
      </>
    );
  } else {
    body = (
      <>
        <Button
          size="lg"
          className="w-full sm:w-auto"
          render={<a href={booking.meeting_url} target="_blank" rel="noopener noreferrer" />}
          nativeButton={false}
        >
          <Video aria-hidden="true" />
          {t('live.join')}
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">{t('live.newTab')}</p>
      </>
    );
  }
  return (
    <Panel id="live-h" title={t('live.title')}>
      {body}
    </Panel>
  );
}

function Detail() {
  const t = useT('booking');
  const ts = useT('samagri');
  const f = useFormat();
  const errorText = useErrorText();
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const isNew = params.get('new') === '1';
  const { ready, wrongRole, token, user, refreshUser } = useRequireCustomer();
  const ta = useT('auth');
  const verified = isFullyVerified(user);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const payAfterVerify = useRef(false);
  const q = useApiQuery<Booking>(ready && id ? `/bookings/${encodeURIComponent(id)}` : null, { token });
  const { pay, paying, paymentDialog } = usePayment();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const tc = useT('customer');
  const now = useNow(30_000);

  if (wrongRole) return <CustomerOnly />;
  if (!ready || (q.loading && !q.data)) return <DiyaLoader label={t('detail.loading')} />;

  const b = q.data;
  if (q.error || !b) {
    const missing = q.status === 404 || q.status === 403;
    return (
      <PageShell size="narrow">
        <EmptyState
          icon={SearchX}
          title={missing ? t('detail.notFound') : t('detail.loadFailed')}
          action={
            <Button render={<Link href="/bookings" />} nativeButton={false}>
              {t('detail.toBookings')}
            </Button>
          }
        >
          {missing ? t('detail.otherAccount') : t('loadError.hint')}
        </EmptyState>
      </PageShell>
    );
  }

  const def = b.pandit_service?.service_definition;
  const pujaName = def ? pick(def, 'name', f.locale) : t('pujaFallback');
  const panditName = b.pandit?.user?.name ?? t('detail.yourPandit');
  const online = b.booking_type === 'online';
  const cancelled = b.booking_status === 'cancelled';
  const completed = b.booking_status === 'completed';
  const payDue = b.payment_status === 'pending' && !cancelled;
  const canCancel = !cancelled && !completed;
  const duration = Math.round((+new Date(b.end_time) - +new Date(b.start_time)) / 60_000);
  const modeLabel = b.puja_mode === 'lighter' ? t('mode.lighter') : t('mode.standard');
  const hasRefund = b.refund_amount != null || !!b.refunded_at;
  const fee = bookingFee(b);
  const samagri = bookingSamagri(b);
  const samagriByPandit = b.samagri_by === 'pandit';
  // The list of the version booked (the shorter version has its own).
  const modeSamagri = samagriForMode(ts, b.pandit_service ?? {}, b.puja_mode);
  const payable = customerPayable(b);
  const refundAmount = f.inr(b.refund_amount ?? payable);

  const payNow = async () => {
    if (!verified) {
      payAfterVerify.current = true;
      setVerifyOpen(true);
      toast.error(ta('verify.blocked'));
      return;
    }
    try {
      const r = await pay({ id: b.id, description: t('pay.description', { puja: pujaName, pandit: panditName }) });
      if (r.status === 'paid') {
        toast.success(t('toast.paidConfirmed'));
        q.reload();
      } else {
        toast(t('toast.notPaid'), { description: t('detail.payAnyTime') });
      }
    } catch (e) {
      if (verificationMissing(e)) {
        await refreshUser().catch(() => {});
        payAfterVerify.current = true;
        setVerifyOpen(true);
        toast.error(ta('verify.blocked'));
        return;
      }
      toast.error(errorText(e, t('error.payFailed')));
    }
  };

  const addToCalendar = () => {
    const s = b.sankalp;
    const sankalpBits = s?.devotee_name
      ? [
          s.devotee_name,
          s.gotra ? t('ics.gotra', { gotra: s.gotra }) : null,
          s.nakshatra ? t('ics.nakshatra', { nakshatra: s.nakshatra }) : null,
          s.family_members?.length ? t('ics.family', { names: s.family_members.join(', ') }) : null,
        ].filter(Boolean)
      : [];
    const where = online ? (b.meeting_url ?? '') : addressText(b);
    const description = [
      t('ics.pandit', { name: panditName }),
      t('ics.mode', { mode: modeLabel }),
      sankalpBits.length ? t('ics.sankalp', { details: sankalpBits.join(', ') }) : null,
      s?.occasion ? t('ics.occasion', { occasion: s.occasion }) : null,
      online && b.meeting_url ? t('ics.online', { url: b.meeting_url }) : null,
      t('ics.link', { url: `${window.location.origin}/bookings/${b.id}` }),
    ]
      .filter(Boolean)
      .join('\n');
    const ics = buildIcs({
      uid: `booking-${b.id}@poojasevak.in`,
      start: b.start_time,
      end: b.end_time,
      summary: t('pay.description', { puja: pujaName, pandit: panditName }),
      location: where || undefined,
      description,
      url: online && b.meeting_url ? b.meeting_url : undefined,
      alarmMinutesBefore: 60,
      alarmText: t('ics.alarm', { puja: pujaName }),
    });
    const slug = def?.slug ?? 'puja';
    downloadIcs(`${slug}-${b.start_time.slice(0, 10)}.ics`, ics);
    toast.success(t('ics.done'));
  };

  const onReviewed = (r: Review) => q.setData({ ...b, review: r });
  const sankalp = b.sankalp;

  return (
    <>
      {isNew && !cancelled && (
        <section className="sandhya stars relative overflow-hidden" aria-live="polite">
          <Mandala className="absolute -top-28 -right-20 size-96 text-diya/20" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-10 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-12">
            <Diya className="size-16 shrink-0 sm:size-20" />
            <div className="min-w-0">
              <h1 className={cn('text-3xl sm:text-4xl', f.locale === 'hi' ? 'leading-[1.35]' : 'leading-tight')}>
                {payDue ? t('detail.reserved') : t('detail.booked')}
              </h1>
              <p className="mt-2 max-w-xl">
                {payDue ? t('detail.completePayment') : t('detail.notified', { name: panditName })}
              </p>
            </div>
          </div>
        </section>
      )}

      <PageShell className={cn(isNew && 'pt-6 sm:pt-8')}>
        <Link
          href="/bookings"
          className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('detail.back')}
        </Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <PujaIcon category={def?.category} size="lg" />
          <div className="min-w-0 flex-1">
            {isNew && !cancelled ? (
              <h2 className={cn('text-2xl sm:text-3xl', f.locale === 'hi' ? 'leading-[1.35]' : 'leading-tight')}>
                {pujaName}
              </h2>
            ) : (
              <h1 className={cn('text-3xl sm:text-4xl', f.locale === 'hi' ? 'leading-[1.35]' : 'leading-tight')}>
                {pujaName}
              </h1>
            )}
            <p className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
              <BookingStatusBadge status={b.booking_status} />
              <PaymentStatusBadge status={b.payment_status} />
              <span className="text-sm">{t('detail.number', { id: b.id.slice(0, 8).toUpperCase() })}</span>
            </p>
          </div>
          {!cancelled && !completed && (
            <Button variant="outline" size="lg" onClick={addToCalendar} className="w-full sm:w-auto">
              <CalendarPlus aria-hidden="true" />
              {t('ics.add')}
            </Button>
          )}
        </header>

        <div className="mb-8 rounded-2xl border bg-card p-5 sm:p-6">
          <BookingTimeline booking={b} now={now} />
        </div>

        <CompletionCodeCard booking={b} className="mb-8" />
        {completed && b.completed_via === 'admin' && (
          <p className="mb-8 text-sm text-muted-foreground">{t('code.completedBy')}</p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-w-0 grid-cols-1 content-start gap-6">
            <Panel id="details-h" title={t('detail.pujaDetails')}>
              <dl className="divide-y">
                <Row label={t('review.when')}>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {t('detail.whenValue', { datetime: f.dateTime(b.start_time) })}
                  </span>
                </Row>
                <Row label={t('detail.duration')}>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {t('detail.durationValue', { duration: f.duration(duration), mode: modeLabel })}
                  </span>
                </Row>
                <Row label={t('review.where')}>
                  {online ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Video className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {t('type.online')}
                    </span>
                  ) : b.address ? (
                    <span className="flex items-start gap-1.5">
                      <MapPin className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block font-medium">{b.address.label}</span>
                        <span className="block text-sm text-muted-foreground">{addressText(b)}</span>
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Home className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {t('type.home')}
                    </span>
                  )}
                </Row>
                <Row label={t('detail.pandit')}>
                  <Link
                    href={`/pandits/${b.pandit_id}`}
                    className="inline-flex min-w-0 items-center gap-2 font-medium hover:text-primary"
                  >
                    <PanditAvatar name={panditName} photo={b.pandit?.user} size="sm" verified={b.pandit?.is_verified} />
                    <span className="truncate">{panditName}</span>
                  </Link>
                </Row>
                <Row label={ts('book.title')}>
                  <span className="grid gap-0.5">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {samagriByPandit ? ts('by.pandit') : ts('by.family')}
                    </span>
                    {!samagriByPandit && !online && !cancelled && !completed && (
                      <span className="text-sm text-muted-foreground">{ts('by.prepareHint')}</span>
                    )}
                    <SamagriListButton
                      {...modeSamagri}
                      items={b.pandit_service?.service_definition?.samagri}
                      pujaName={pujaName}
                      label={modeSamagri.modeLabel ?? ts('by.listLink')}
                      className="justify-self-start"
                    />
                  </span>
                </Row>
                {b.customer_notes && (
                  <Row label={t('detail.notes')}>
                    <span className="whitespace-pre-line">{b.customer_notes}</span>
                  </Row>
                )}
              </dl>
            </Panel>

            {online && <JoinLive booking={b} now={now} />}

            <Panel id="sankalp-h" title={t('detail.sankalp')}>
              {sankalp && sankalp.devotee_name ? (
                <dl className="divide-y">
                  <Row label={t('detail.devotee')}>{sankalp.devotee_name}</Row>
                  {sankalp.gotra && <Row label={t('sankalp.gotra')}>{sankalp.gotra}</Row>}
                  {sankalp.nakshatra && <Row label={t('sankalp.nakshatra')}>{sankalp.nakshatra}</Row>}
                  {sankalp.occasion && <Row label={t('sankalp.occasion')}>{sankalp.occasion}</Row>}
                  {sankalp.family_members && sankalp.family_members.length > 0 && (
                    <Row label={t('detail.family')}>{sankalp.family_members.join(', ')}</Row>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">{t('detail.noSankalp')}</p>
              )}
            </Panel>

            {canRate(b, now) && (
              <Panel id="review-h" title={b.review ? t('detail.reviewYours') : t('detail.reviewShare')}>
                {b.review && !editingReview ? (
                  <div>
                    <Stars
                      value={b.review.rating_overall ?? b.review.rating}
                      label={t('detail.stars', { n: b.review.rating_overall ?? b.review.rating })}
                    />
                    <ReviewParams review={b.review} className="mt-3 max-w-xs" />
                    {b.review.comment && <p className="mt-3">{b.review.comment}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('detail.posted', { date: f.date(b.review.created_at, { weekday: undefined }) })}
                    </p>
                    {canEditReview(b, now) && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => setEditingReview(true)}>
                          <Pencil aria-hidden="true" />
                          {tc('review.edit')}
                        </Button>
                        {reviewEditableUntil(b) && (
                          <span className="text-xs text-muted-foreground">
                            {tc('review.editUntil', {
                              date: f.date(reviewEditableUntil(b)!, { weekday: undefined }),
                            })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-sm text-muted-foreground">{tc('review.desc')}</p>
                    <ReviewForm
                      booking={b}
                      onReviewed={(r) => {
                        setEditingReview(false);
                        onReviewed(r);
                      }}
                    />
                  </>
                )}
              </Panel>
            )}
          </div>

          <aside className="grid min-w-0 grid-cols-1 content-start gap-6 lg:sticky lg:top-24 lg:self-start">
            <Panel id="payment-h" title={t('payment.title')}>
              <FeeLines price={b.total_amount} fee={fee} samagri={samagri} className="mb-3 border-b pb-3" />
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">{hasExtras(fee, samagri) ? t('price.total') : t('review.total')}</span>
                <span className="text-2xl font-semibold tabular-nums">{f.inr(payable)}</span>
              </div>
              {hasRefund ? (
                <div className="mt-4 rounded-xl bg-tulsi/10 p-4 text-sm">
                  <p className="flex items-start gap-2 font-medium text-tulsi">
                    <Undo2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {b.refunded_at
                      ? t('refund.done', {
                          amount: refundAmount,
                          date: f.date(b.refunded_at, { weekday: undefined }),
                        })
                      : t('refund.processing', { amount: refundAmount })}
                  </p>
                  {b.refund_id && (
                    <p className="mt-2 break-all text-muted-foreground">{t('refund.ref', { id: b.refund_id })}</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {b.payment_status === 'paid' && t('payment.paid')}
                  {b.payment_status === 'refunded' && t('payment.refunded')}
                  {b.payment_status === 'failed' && !cancelled && t('payment.failed')}
                  {b.payment_status === 'pending' && !cancelled && t('payment.pending')}
                  {b.payment_status === 'pending' && cancelled && t('payment.none')}
                </p>
              )}
              {(payDue || (b.payment_status === 'failed' && !cancelled)) && (verifyOpen || !verified) && (
                <VerificationPanel
                  className="mt-4"
                  headingId="pay-verify"
                  onComplete={() => {
                    setVerifyOpen(false);
                    if (!payAfterVerify.current) return;
                    payAfterVerify.current = false;
                    void payNow();
                  }}
                />
              )}
              {(payDue || (b.payment_status === 'failed' && !cancelled)) && (
                <Button size="lg" className="mt-4 w-full" onClick={payNow} disabled={paying}>
                  {paying ? t('busy.paying') : t('pay.now', { amount: f.inr(payable) })}
                </Button>
              )}
            </Panel>

            {canCancel && (
              <div className="rounded-2xl border border-dashed p-5">
                <p className="text-sm text-muted-foreground">
                  {b.payment_status === 'paid' ? t('cancel.leadRefund') : t('cancel.lead')}
                </p>
                <Button variant="outline" size="lg" className="mt-3 w-full" onClick={() => setCancelOpen(true)}>
                  {t('cancel.cta')}
                </Button>
              </div>
            )}
            {cancelled && b.cancellation_reason && (
              <Panel id="cancel-h" title={t('cancel.title')}>
                <p className="text-sm">{b.cancellation_reason}</p>
              </Panel>
            )}
          </aside>
        </div>
      </PageShell>

      {canCancel && (
        <CancelBookingDialog booking={b} open={cancelOpen} onOpenChange={setCancelOpen} onCancelled={q.reload} />
      )}
      {paymentDialog}
    </>
  );
}

function Opening() {
  const t = useT('booking');
  return <DiyaLoader label={t('detail.loading')} />;
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<Opening />}>
      <Detail />
    </Suspense>
  );
}
