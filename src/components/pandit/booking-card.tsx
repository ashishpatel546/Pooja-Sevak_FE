'use client';

import { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Home,
  KeyRound,
  Lock,
  MapPin,
  MessageSquareText,
  Package,
  Play,
  RefreshCw,
  ScrollText,
  TriangleAlert,
  Video,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Booking } from '@/lib/types';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { bookingFee, bookingSamagri, panditPayout } from '@/lib/customer-fee';
import { SamagriListButton, samagriForMode } from '@/components/common/samagri-list';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/common/status-badge';
import { PujaIcon } from '@/components/common/puja-icon';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { errorMessage } from '@/components/dashboard/use-api';
import { CompleteWithCodeDialog } from './complete-dialog';
import { CallButton } from '@/components/booking/call-button';
import { ChatPanel } from '@/components/booking/chat-panel';
import { OnlinePujaHelp } from '@/components/booking/online-help';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { PayoutStatus } from '@/lib/types';

const PAYOUT_CLS: Record<Exclude<PayoutStatus, 'not_due'>, string> = {
  due: 'bg-accent text-accent-foreground ring-diya/40',
  on_hold: 'bg-destructive/10 text-destructive ring-destructive/30',
  settled: 'bg-tulsi/10 text-tulsi ring-tulsi/30',
};

/** Settlement state of a completed booking, as the pandit sees it. */
function PayoutBadge({ status }: { status: Exclude<PayoutStatus, 'not_due'> }) {
  const t = useT('pandit');
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        PAYOUT_CLS[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(`payout.${status}`)}
    </span>
  );
}

type Action = 'confirm' | 'start' | 'complete' | 'cancel' | 'meeting';

/** Matches the backend: the room can be replaced until 30 minutes after the end. */
const MEETING_CLOSES_AFTER_MS = 30 * 60_000;

const mapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${Number(lat)},${Number(lng)}`;

/**
 * One booking as the pandit sees it: when, where, for whom (sankalp), what
 * they earn, and the next step they can take.
 */
export function PanditBookingCard({
  booking: b,
  token,
  onChanged,
  compact = false,
  chatOpen = false,
  onChatOpenChange,
}: {
  booking: Booking;
  token: string | null;
  onChanged: (updated: Booking | null) => void;
  compact?: boolean;
  /** Controlled chat drawer (e.g. opened from a notification link). */
  chatOpen?: boolean;
  onChatOpenChange?: (open: boolean) => void;
}) {
  const t = useT('pandit');
  const tchat = useT('chat');
  const [ownChatOpen, setOwnChatOpen] = useState(false);
  const showChat = chatOpen || ownChatOpen;
  const setShowChat = (o: boolean) => {
    setOwnChatOpen(o);
    if (!o) onChatOpenChange?.(false);
  };
  const ts = useT('samagri');
  const f = useFormat();
  const { locale } = useLocale();
  const [dialog, setDialog] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const def = b.pandit_service?.service_definition;
  const pujaName = def ? pick(def, 'name', locale) : t('puja.fallback');
  const durationMin = Math.round(
    (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 60_000,
  );
  // Matches the backend: a puja can be started from one hour before it is due.
  const startOpensAt = new Date(b.start_time).getTime() - 60 * 60_000;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Action responses may omit relations — keep the ones we already have.
  const merge = (updated: Booking | null | undefined): Booking | null =>
    updated && typeof updated === 'object' && 'id' in updated
      ? {
          ...b,
          ...updated,
          customer: updated.customer ?? b.customer,
          pandit_service: updated.pandit_service ?? b.pandit_service,
          address: updated.address ?? b.address,
        }
      : null;

  const act = async (action: Exclude<Action, 'complete'>) => {
    try {
      const updated = await api<Booking>(`/bookings/${b.id}/${action}`, {
        method: 'POST',
        token,
        body: action === 'cancel' ? { reason: reason.trim() || undefined } : undefined,
      });
      toast.success(t(`card.toast.${action}`));
      setReason('');
      onChanged(merge(updated));
    } catch (e) {
      toast.error(errorMessage(e));
      throw e;
    }
  };

  // Paid online puja whose room is still usable: show the host steps and allow a new link.
  const meetingLive =
    b.booking_type === 'online' &&
    b.payment_status === 'paid' &&
    (b.booking_status === 'confirmed' || b.booking_status === 'in_progress') &&
    now <= new Date(b.end_time).getTime() + MEETING_CLOSES_AFTER_MS;

  const s = b.sankalp;
  const family = (s?.family_members ?? []).filter(Boolean);
  const status = b.booking_status;
  const samagri = bookingSamagri(b);
  const panditBrings = b.samagri_by === 'pandit';
  // The list of the version booked; a missing shorter-version list is the pandit's to-do.
  const modeSamagri = samagriForMode(ts, b.pandit_service ?? {}, b.puja_mode);

  return (
    <article
      className={cn(
        'rounded-xl border bg-card',
        status === 'in_progress' && 'border-sindoor/40 ring-1 ring-sindoor/20',
        status === 'cancelled' && 'opacity-80',
      )}
    >
      {/* Header: what & when */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
        <PujaIcon category={def?.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-xl leading-tight break-words">{pujaName}</h3>
            {b.puja_mode === 'lighter' && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t('card.lighter')}</span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-muted-foreground">
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
            <span>
              {t('card.timeRange', { date: f.date(b.start_time), start: f.time(b.start_time), end: f.time(b.end_time) })}
            </span>
            {durationMin > 0 && <span className="text-sm">({f.duration(durationMin)})</span>}
          </p>
          <p className="mt-0.5 text-sm">
            <span className="text-muted-foreground">{t('card.familyLabel')}</span>{' '}
            <span className="font-medium">{b.customer?.name ?? t('card.familyFallback')}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          <BookingStatusBadge status={status} />
          {status === 'completed' && b.payout_status && b.payout_status !== 'not_due' ? (
            <PayoutBadge status={b.payout_status} />
          ) : (
            <PaymentStatusBadge status={b.payment_status} />
          )}
        </div>
      </div>

      {/* Who arranges the samagri: unmissable, so the pandit knows what to bring. */}
      <div className="px-4 pb-4 sm:px-5">
        <div
          className={cn(
            'flex flex-col gap-1 rounded-lg px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3',
            panditBrings ? 'bg-diya/15 ring-1 ring-diya/60' : 'bg-muted/60',
          )}
        >
          <div className="min-w-0">
            <p className={cn('flex items-center gap-2', panditBrings ? 'font-semibold text-heading' : 'font-medium')}>
              <Package className={cn('size-4 shrink-0', panditBrings ? 'text-sindoor' : 'text-muted-foreground')} aria-hidden="true" />
              {panditBrings ? ts('by.panditForPandit', { price: f.inr(samagri) }) : ts('by.familyForPandit')}
            </p>
            {panditBrings && !compact && status !== 'cancelled' && status !== 'completed' && (
              <p className="mt-0.5 pl-6 text-sm text-muted-foreground">{ts('by.panditForPanditHint')}</p>
            )}
          </div>
          <SamagriListButton
            list={modeSamagri.list}
            modeLabel={modeSamagri.modeLabel}
            note={modeSamagri.note ? ts('services.lighterListMissing') : undefined}
            items={def?.samagri}
            pujaName={pujaName}
            label={modeSamagri.modeLabel ?? ts('by.viewMyList')}
            className="shrink-0 self-start text-sm sm:self-auto"
          />
        </div>
      </div>

      {!compact && (
        <div className="grid gap-4 border-t border-dashed px-4 py-4 sm:px-5 md:grid-cols-2">
          {/* Where */}
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              {b.booking_type === 'online' ? (
                <Video className="size-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Home className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
              {b.booking_type === 'online' ? t('card.online') : t('card.atHome')}
            </p>
            {b.booking_type === 'online' ? (
              <div className="grid gap-3">
                {b.meeting_url ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<a href={b.meeting_url} target="_blank" rel="noopener noreferrer" />}
                      nativeButton={false}
                    >
                      <Video aria-hidden="true" /> {t('card.openMeeting')}
                    </Button>
                    {meetingLive && (
                      <Button variant="ghost" size="sm" onClick={() => setDialog('meeting')}>
                        <RefreshCw aria-hidden="true" /> {t('card.meeting.regenerate')}
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('card.meetingSoon')}</p>
                )}
                {meetingLive && (
                  <div className="rounded-lg bg-diya/15 p-3 text-sm ring-1 ring-diya/60">
                    <p className="flex items-center gap-1.5 font-semibold text-heading">
                      <TriangleAlert className="size-4 shrink-0 text-sindoor" aria-hidden="true" />
                      {t('card.meeting.loginTitle')}
                    </p>
                    <ol className="mt-1.5 list-decimal space-y-1 pl-5">
                      <li>{t('card.meeting.step1')}</li>
                      <li className="font-medium">{t('card.meeting.step2')}</li>
                      <li>{t('card.meeting.step3')}</li>
                      <li>{t('card.meeting.step4')}</li>
                    </ol>
                  </div>
                )}
                {meetingLive && <OnlinePujaHelp bookingId={b.id} />}
              </div>
            ) : b.address ? (
              <div className="text-sm">
                <p>
                  {b.address.address_line_1}
                  {b.address.address_line_2 && `, ${b.address.address_line_2}`}
                </p>
                <p className="text-muted-foreground">
                  {b.address.city}, {b.address.state} {b.address.pin_code}
                </p>
                {b.address.location_coordinates && (
                  <a
                    href={mapsUrl(b.address.location_coordinates.lat, b.address.location_coordinates.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <MapPin className="size-4" aria-hidden="true" /> {t('card.openMaps')}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('card.noAddress')}</p>
            )}
          </div>

          {/* Money */}
          <div className="grid content-start gap-1">
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="min-w-0 text-muted-foreground">{t('card.paidByFamily')}</dt>
                <dd className="shrink-0 tabular-nums">{f.inr(b.total_amount)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="min-w-0 text-muted-foreground">{t('card.platformFee')}</dt>
                <dd className="shrink-0 tabular-nums">− {f.inr(b.platform_commission)}</dd>
              </div>
              {samagri > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="min-w-0 text-muted-foreground">{ts('pandit.samagriLine')}</dt>
                  <dd className="shrink-0 tabular-nums">+ {f.inr(samagri)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-dashed pt-1">
                <dt className="min-w-0 font-medium">{t('card.yourEarning')}</dt>
                <dd className="shrink-0 font-heading text-lg text-heading tabular-nums">{f.inr(panditPayout(b))}</dd>
              </div>
            </dl>
            {samagri > 0 && <p className="mt-1 text-xs text-muted-foreground">{ts('pandit.samagriNote')}</p>}
            {bookingFee(b) > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('card.customerFeeNote', { amount: f.inr(bookingFee(b)) })}
              </p>
            )}
            {status === 'completed' && b.payout_status && b.payout_status !== 'not_due' && (
              <p className="mt-1 text-xs text-muted-foreground">
                {b.payout_status === 'settled' && b.payout_settled_at
                  ? t('payout.settledOn', {
                      date: f.date(b.payout_settled_at, { weekday: undefined }),
                      ref: b.payout_reference ?? '—',
                    })
                  : b.payout_status === 'on_hold'
                    ? b.payout_note
                      ? t('payout.holdReason', { reason: b.payout_note })
                      : t('payout.on_hold')
                    : t('payout.dueHint')}
              </p>
            )}
          </div>

          {/* Sankalp */}
          <div className="rounded-lg bg-chandan p-3 md:col-span-2">
            <p className="mb-2 flex flex-wrap items-center gap-1.5 text-sm font-medium">
              <ScrollText className="size-4 text-accent-foreground" aria-hidden="true" />
              {t('card.sankalp.title')}
              <span className="font-normal text-muted-foreground">{t('card.sankalp.subtitle')}</span>
            </p>
            {s && (s.devotee_name || s.gotra || s.nakshatra || s.occasion || family.length) ? (
              <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                <SankalpItem label={t('card.sankalp.devotee')} value={s.devotee_name} />
                <SankalpItem label={t('card.sankalp.gotra')} value={s.gotra} />
                <SankalpItem label={t('card.sankalp.nakshatra')} value={s.nakshatra} />
                <SankalpItem label={t('card.sankalp.occasion')} value={s.occasion} />
                {family.length > 0 && (
                  <SankalpItem label={t('card.sankalp.family')} value={family.join(', ')} className="sm:col-span-2" />
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">{t('card.sankalp.empty')}</p>
            )}
          </div>

          {b.customer_notes && (
            <div className="md:col-span-2">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                <MessageSquareText className="size-4 text-muted-foreground" aria-hidden="true" />
                {t('card.note')}
              </p>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{b.customer_notes}</p>
            </div>
          )}

          {status === 'cancelled' && b.cancellation_reason && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              {t('card.cancelReason', { reason: b.cancellation_reason })}
            </p>
          )}

          {status === 'completed' && b.completed_via === 'admin' && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              {t('card.completedByAdmin')}
              {b.completion_note ? ` ${b.completion_note}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Contact: call (from 5 hours before) and chat, once paid */}
      {(b.payment_status === 'paid' || b.payment_status === 'refunded') && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          {status === 'confirmed' || status === 'in_progress' ? (
            <CallButton bookingId={b.id} token={token} />
          ) : (
            <span />
          )}
          <Button variant="outline" size="lg" className="w-full sm:w-fit" onClick={() => setShowChat(true)}>
            <MessageSquareText aria-hidden="true" /> {tchat('open')}
          </Button>
        </div>
      )}

      <Sheet open={showChat} onOpenChange={setShowChat}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{tchat('titleWith', { name: b.customer?.name ?? t('card.familyFallback') })}</SheetTitle>
            <SheetDescription>
              {pujaName} · {f.date(b.start_time, { weekday: undefined })}, {f.time(b.start_time)}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {showChat && (
              <ChatPanel bookingId={b.id} token={token} otherName={b.customer?.name} autoFocus />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Actions */}
      {(status === 'pending' || status === 'confirmed' || status === 'in_progress') && (
        <div className="flex flex-col gap-2 border-t bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
          {status === 'pending' && b.payment_status !== 'paid' && (
            <p className="mr-auto text-sm text-muted-foreground">
              {t('card.unpaid')}
            </p>
          )}
          {status === 'pending' && (
            <>
              <Button variant="outline" onClick={() => setDialog('cancel')}>
                <XCircle aria-hidden="true" /> {t('card.decline')}
              </Button>
              <Button onClick={() => setDialog('confirm')}>
                <CheckCircle2 aria-hidden="true" /> {t('card.accept')}
              </Button>
            </>
          )}
          {status === 'confirmed' && (
            <>
              <Button variant="outline" onClick={() => setDialog('cancel')}>
                <XCircle aria-hidden="true" /> {t('card.cancel')}
              </Button>
              {startOpensAt <= now ? (
                <Button onClick={() => setDialog('start')}>
                  <Play aria-hidden="true" /> {t('card.start')}
                </Button>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground sm:self-center">
                  <Play className="size-3.5 shrink-0" aria-hidden="true" />
                  {t('card.startsFrom', {
                    time: f.time(new Date(startOpensAt)),
                    date: f.date(new Date(startOpensAt), { year: undefined }),
                  })}
                </p>
              )}
            </>
          )}
          {status === 'in_progress' &&
            (b.completion_code_locked_at ? (
              <>
                <p className="flex items-center gap-1.5 text-sm text-destructive sm:mr-auto">
                  <Lock className="size-4 shrink-0" aria-hidden="true" />
                  {t('complete.lockedShort')}
                </p>
                <Button variant="outline" onClick={() => setDialog('complete')}>
                  <KeyRound aria-hidden="true" /> {t('card.complete')}
                </Button>
              </>
            ) : (
              <Button onClick={() => setDialog('complete')}>
                <KeyRound aria-hidden="true" /> {t('card.complete')}
              </Button>
            ))}
        </div>
      )}

      <ConfirmDialog
        open={dialog === 'confirm'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={t('card.dialog.accept.title')}
        description={t('card.dialog.accept.desc', { puja: pujaName, date: f.date(b.start_time), time: f.time(b.start_time) })}
        confirmLabel={t('card.accept')}
        onConfirm={() => act('confirm')}
      />
      <ConfirmDialog
        open={dialog === 'meeting'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={t('card.dialog.meeting.title')}
        description={t('card.dialog.meeting.desc')}
        confirmLabel={t('card.meeting.regenerate')}
        onConfirm={() => act('meeting')}
      />
      <ConfirmDialog
        open={dialog === 'start'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={t('card.dialog.start.title')}
        description={t('card.dialog.start.desc')}
        confirmLabel={t('card.start')}
        onConfirm={() => act('start')}
      />
      {(status === 'in_progress' || status === 'confirmed') && (
        <CompleteWithCodeDialog
          booking={b}
          token={token}
          open={dialog === 'complete'}
          onOpenChange={(o) => setDialog(o ? 'complete' : null)}
          onCompleted={(updated) => onChanged(merge(updated))}
        />
      )}
      <ConfirmDialog
        open={dialog === 'cancel'}
        onOpenChange={(o) => {
          if (!o) {
            setDialog(null);
            setReason('');
          }
        }}
        destructive
        title={status === 'pending' ? t('card.dialog.decline.title') : t('card.dialog.cancel.title')}
        description={
          b.payment_status === 'paid' ? t('card.dialog.cancel.descPaid') : t('card.dialog.cancel.desc')
        }
        confirmLabel={status === 'pending' ? t('card.dialog.decline.confirm') : t('card.dialog.cancel.confirm')}
        cancelLabel={t('card.dialog.cancel.keep')}
        onConfirm={() => act('cancel')}
      >
        <div className="grid gap-2">
          <Label htmlFor={`reason-${b.id}`}>{t('card.dialog.reason.label')}</Label>
          <Textarea
            id={`reason-${b.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('card.dialog.reason.placeholder')}
            maxLength={500}
          />
        </div>
      </ConfirmDialog>
    </article>
  );
}

function SankalpItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2', className)}>
      <dt className="shrink-0 text-muted-foreground">{label}:</dt>
      <dd className={cn('min-w-0 break-words', value ? 'font-medium' : 'text-muted-foreground')}>{value || '—'}</dd>
    </div>
  );
}
