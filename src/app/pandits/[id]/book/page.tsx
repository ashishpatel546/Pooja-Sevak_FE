'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Feather,
  Home,
  Loader2,
  Plus,
  SearchX,
  ShieldCheck,
  Package,
  Sparkles,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import { pick, useFormat, useT } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { istDateKey } from '@/lib/format';
import { BOOKING_HORIZON_DAYS, isBookableDate, readBookingDate, withBookingDate, type BookingDate } from '@/lib/booking-date';
import { useAuth } from '@/lib/auth-context';
import { useSavedLocation } from '@/lib/location';
import type {
  Address,
  AuthUser,
  Availability,
  Booking,
  BookingType,
  CreateBookingInput,
  CustomerFeeConfig,
  FamilyProfile,
  Observance,
  PanditPublic,
  PujaMode,
  Sankalp,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { bookingFee, bookingSamagri, computeCustomerFee, customerPayable } from '@/lib/customer-fee';
import { AartiFrame } from '@/components/brand/aarti-frame';
import { isFullyVerified, VerificationPanel, verificationMissing } from '@/components/auth/verification';
import { EmptyState } from '@/components/common/empty-state';
import { rich } from '@/components/common/rich';
import { DiyaLoader } from '@/components/common/loading';
import { PageShell } from '@/components/common/page-header';
import { PanditAvatar } from '@/components/common/pandit-avatar';
import { PujaIcon } from '@/components/common/puja-icon';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AddressForm } from '@/components/customer/address-form';
import { emptySankalp, SankalpFields, type SankalpDraft } from '@/components/customer/sankalp-fields';
import { DateStrip, SlotGrid, type DateMark } from '@/components/customer/slot-picker';
import { StepIndicator } from '@/components/customer/step-indicator';
import { formatLocalTime, TimezoneNote, useForeignTimeZone } from '@/components/customer/timezone-note';
import { useApiQuery } from '@/components/customer/use-api';
import { FeeLines, hasExtras } from '@/components/customer/price-breakdown';
import { SamagriListButton, samagriForMode } from '@/components/common/samagri-list';
import { samagriKitPriceFor } from '@/lib/samagri';
import { usePayment } from '@/components/customer/use-payment';
import { useRequireCustomer } from '@/components/customer/use-require-customer';
import { CustomerOnly } from '@/components/customer/wrong-role';
import { localized } from '@/components/ritual/observance';
import { usePanchangText } from '@/components/ritual/use-panchang-text';
import { useErrorText } from '@/components/ritual/use-error-text';

type Service = PanditPublic['services'][number];
const DAYS = 21;

/* ───────────── small building blocks ───────────── */

function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  icon: Icon,
  title,
  meta,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  title: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40',
        'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
        checked && 'border-primary bg-accent/40 ring-1 ring-primary/40',
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={cn(
          'mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2',
          checked ? 'border-primary' : 'border-input',
        )}
        aria-hidden="true"
      >
        {checked && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-x-3">
          <span className="inline-flex items-center gap-2 font-medium">
            {Icon && <Icon className="size-4 text-primary" aria-hidden="true" />}
            {title}
          </span>
          {meta}
        </span>
        {children && <span className="mt-1 block text-sm text-muted-foreground">{children}</span>}
      </span>
    </label>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function addressLine(a: Address) {
  return [a.address_line_1, a.address_line_2, a.city, a.pin_code].filter(Boolean).join(', ');
}

/* ───────────── the wizard ───────────── */

function Wizard({
  pandit,
  service,
  initialType,
  carried,
  user,
  token,
}: {
  pandit: PanditPublic;
  service: Service;
  initialType: BookingType;
  /** Validated ?date= / ?occasion= carried from a sacred-day "Book for this day" link. */
  carried: BookingDate;
  user: AuthUser;
  token: string | null;
}) {
  const router = useRouter();
  const t = useT('booking');
  const ts = useT('samagri');
  const tc = useT('common');
  const ta = useT('auth');
  const { refreshUser } = useAuth();
  const f = useFormat();
  const { typeName } = usePanchangText();
  const errorText = useErrorText();
  const def = service.service_definition;
  const pujaName = def ? pick(def, 'name', f.locale) : t('pujaFallback');
  const steps = [t('step.mode'), t('step.when'), t('step.place'), t('step.review')];
  const savedLocation = useSavedLocation();
  const foreignTz = useForeignTimeZone();
  const { pay, paying, paymentDialog } = usePayment();

  const canOnline = !!pandit.offers_online && !!def?.supports_online;
  const hasLighter =
    !!service.offers_lighter_mode && service.lighter_mode_price !== null && service.lighter_mode_price !== undefined;

  const [step, setStep] = useState(0);
  const [modeChoice, setMode] = useState<PujaMode>('standard');
  const [typeChoice, setType] = useState<BookingType>(initialType);
  const mode: PujaMode = hasLighter ? modeChoice : 'standard';
  const bookingType: BookingType = canOnline ? typeChoice : 'at_home';
  // Samagri kit: only for pujas at home, and only when this pandit offers it.
  // The shorter version has its own kit price and list.
  const [kitChoice, setKitChoice] = useState(false);
  const kitPrice = samagriKitPriceFor(service, mode);
  const modeSamagri = samagriForMode(ts, service, mode);
  const canKit = bookingType === 'at_home' && !!service.offers_samagri_kit && kitPrice > 0;
  const wantKit = canKit && kitChoice;

  // A carried date is an IST calendar day (slots are IST; see lib/booking-date.ts).
  // Re-checked here (lead time may have lapsed since the link was made); a stale
  // one is dropped silently. Later dates stretch the strip a week past them.
  const carriedDate = carried.date && isBookableDate(carried.date) ? carried.date : null;
  const dates = useMemo(() => {
    const all = Array.from({ length: BOOKING_HORIZON_DAYS }, (_, i) => istDateKey(i));
    const at = carriedDate ? all.indexOf(carriedDate) : -1;
    return all.slice(0, Math.max(DAYS, at + 8));
  }, [carriedDate]);
  const [date, setDate] = useState<string>(() => (carriedDate && dates.includes(carriedDate) ? carriedDate : dates[0]));
  const [slot, setSlot] = useState<string | null>(null);
  const [slotMsg, setSlotMsg] = useState<string | null>(null);

  const [addressChoice, setAddressId] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  // Occasion from a sacred-day link fills the (still empty) occasion field.
  const [sankalp, setSankalp] = useState<SankalpDraft>(() => {
    const draft = emptySankalp(user.name);
    return carried.occasion && !draft.occasion.trim() ? { ...draft, occasion: typeName(carried.occasion) } : draft;
  });
  const [notes, setNotes] = useState('');
  const [stepError, setStepError] = useState<string | null>(null);

  // Bookings need a verified email + mobile; the check happens inline on the review step.
  const verified = isFullyVerified(user);
  // Stays mounted until the panel reports completion (it unmounts itself otherwise mid-way).
  const [verifyOpen, setVerifyOpen] = useState(() => !verified);
  const payAfterVerify = useRef(false);
  const verifyRef = useRef<HTMLDivElement>(null);

  const [created, setCreated] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const price = Number(mode === 'lighter' ? service.lighter_mode_price : service.standard_price);
  const duration = Number(
    (mode === 'lighter' ? service.lighter_mode_duration_minutes : null) ?? service.standard_duration_minutes,
  );

  // Platform fee shown before payment; the server recomputes it on booking.
  const feeRule = useApiQuery<CustomerFeeConfig>('/public/customer-fee');
  // The fee is on the dakshina only; the samagri kit is added on top in full.
  const fee = created ? bookingFee(created) : computeCustomerFee(price, feeRule.data);
  const samagri = created ? bookingSamagri(created) : wantKit ? kitPrice : 0;
  const payable = created ? customerPayable(created) : price + samagri + fee;
  const samagriByPandit = created ? created.samagri_by === 'pandit' : wantKit;

  const availability = useApiQuery<Availability>(step >= 1 ? `/pandits/${pandit.id}/availability` : null, {
    query: { date, pandit_service_id: service.id, mode },
  });
  const addresses = useApiQuery<Address[]>('/addresses', { token });
  const family = useApiQuery<FamilyProfile>('/users/me/family-profile', { token });
  // Sacred days across the visible dates, fetched once.
  const panchang = useApiQuery<Observance[]>('/panchang/upcoming', { query: { from: dates[0], days: dates.length } });
  const marks = useMemo(() => {
    const out: Record<string, DateMark> = {};
    for (const o of panchang.data ?? []) {
      if (o.key === 'pitru_paksha' || !dates.includes(o.date)) continue;
      const name = localized(o, 'name', f.locale) || typeName(o.key);
      const prev = out[o.date];
      out[o.date] = prev
        ? { label: prev.label, description: `${prev.description}, ${name}` }
        : { label: typeName(o.key), description: name };
    }
    return out;
  }, [panchang.data, dates, f.locale, typeName]);

  // A chosen slot only counts while it is still offered as available.
  const slotValid =
    !!slot && !!availability.data?.slots.some((s) => s.start === slot && s.available) && !availability.loading;
  const chosenSlot = slotValid ? slot : null;

  const addrList = addresses.data ?? [];
  const fallbackAddress =
    addrList.find((a) => a.id === savedLocation?.address_id) ?? addrList.find((a) => a.is_default) ?? addrList[0];
  const addressId =
    addressChoice && addrList.some((a) => a.id === addressChoice) ? addressChoice : (fallbackAddress?.id ?? null);
  const address = addrList.find((a) => a.id === addressId) ?? null;

  const locked = !!created; // once the booking exists, details are fixed

  const changeDate = (d: string) => {
    setDate(d);
    setSlot(null);
    setSlotMsg(null);
  };
  const changeMode = (m: PujaMode) => {
    setMode(m);
    setSlot(null);
  };

  const validate = (s: number): string | null => {
    if (s === 1 && !chosenSlot) return t('error.chooseTime');
    if (s === 2) {
      if (bookingType === 'at_home' && !address) return t('error.chooseAddress');
      if (bookingType === 'online' && !sankalp.devotee_name.trim()) return t('error.devoteeName');
    }
    return null;
  };

  const goTo = (target: number) => {
    for (let s = step; s < target; s++) {
      const err = validate(s);
      if (err) {
        setStep(s);
        setStepError(err);
        return;
      }
    }
    setStepError(null);
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildSankalp = (): Sankalp | undefined => {
    const name = sankalp.devotee_name.trim();
    const extra = {
      gotra: sankalp.gotra.trim() || undefined,
      nakshatra: sankalp.nakshatra.trim() || undefined,
      occasion: sankalp.occasion.trim() || undefined,
      family_members: sankalp.family_members.length ? sankalp.family_members : undefined,
    };
    const hasExtra = Object.values(extra).some(Boolean);
    if (!name && !hasExtra) return undefined;
    return { devotee_name: name || user.name, ...extra };
  };

  /** Bring the verification step into view; payment resumes once it is done. */
  const askToVerify = () => {
    payAfterVerify.current = true;
    setVerifyOpen(true);
    setSubmitError(null);
    if (step !== 3) setStep(3);
    toast.error(ta('verify.blocked'));
    window.setTimeout(() => verifyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  /** The API refused because of verification: sync the user from the server, then show the step. */
  const onVerificationRequired = async () => {
    await refreshUser().catch(() => {});
    askToVerify();
  };

  const confirmAndPay = async () => {
    setSubmitError(null);
    if (!verified) {
      askToVerify();
      return;
    }
    let booking = created;
    if (!booking) {
      if (!chosenSlot) {
        goTo(1);
        return;
      }
      const body: CreateBookingInput = {
        pandit_service_id: service.id,
        booking_type: bookingType,
        puja_mode: mode,
        start_time: chosenSlot,
        ...(bookingType === 'at_home' && address ? { address_id: address.id } : {}),
        ...(wantKit ? { samagri_by: 'pandit' as const } : {}),
        ...(notes.trim() ? { customer_notes: notes.trim() } : {}),
        ...(buildSankalp() ? { sankalp: buildSankalp() } : {}),
      };
      setSubmitting(true);
      try {
        booking = await api<Booking>('/bookings', { method: 'POST', token, body });
        setCreated(booking);
        // The fee rule changed (or never loaded): show the real total before paying.
        if (customerPayable(booking) !== payable) {
          setSubmitting(false);
          feeRule.reload();
          toast(t('toast.priceUpdated'), { description: t('toast.priceUpdatedText') });
          return;
        }
      } catch (e) {
        setSubmitting(false);
        if (verificationMissing(e)) {
          await onVerificationRequired();
          return;
        }
        if (e instanceof ApiError && (e.status === 409 || e.status === 400)) {
          const placeIssue = e.status === 400 && /address|range|distance|travel|km/i.test(e.message);
          if (placeIssue) {
            // Address outside the pandit's travel range: back to the place step.
            setStepError(e.message);
            setStep(2);
            toast.error(e.message);
            return;
          }
          const msg =
            e.status === 409
              ? t('error.slotTaken')
              : t('error.slotRetry', { reason: e.message || t('error.slotGone') });
          setSlot(null);
          setSlotMsg(msg);
          availability.reload();
          setStep(1);
          toast.error(e.status === 409 ? t('toast.slotTaken') : msg);
          return;
        }
        const msg = errorText(e, t('error.createFailed'));
        setSubmitError(msg);
        toast.error(msg);
        return;
      }
      setSubmitting(false);
    }

    try {
      const result = await pay({ id: booking.id, description: t('pay.description', { puja: pujaName, pandit: pandit.name }) });
      if (result.status === 'paid') {
        toast.success(t('toast.paid'));
        router.push(`/bookings/${booking.id}?new=1`);
      } else {
        toast(t('toast.notPaid'), { description: t('toast.notPaidText') });
      }
    } catch (e) {
      if (verificationMissing(e)) {
        await onVerificationRequired();
        return;
      }
      const msg = errorText(e, t('error.payFailed'));
      setSubmitError(t('error.paySaved', { message: msg }));
      toast.error(msg);
    }
  };

  const busy = submitting || paying;
  const primary =
    step < 3
      ? { label: [t('next.when'), t('next.place'), t('next.review')][step], onClick: () => goTo(step + 1) }
      : {
          label: created ? t('pay.now', { amount: f.inr(payable) }) : t('pay.confirm', { amount: f.inr(payable) }),
          onClick: confirmAndPay,
        };

  const primaryButton = (cls?: string) => (
    <Button size="lg" className={cls} onClick={primary.onClick} disabled={busy || (step === 3 && feeRule.loading)}>
      {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
      {busy ? (submitting ? t('busy.booking') : t('busy.paying')) : primary.label}
      {!busy && step < 3 && <ArrowRight aria-hidden="true" />}
    </Button>
  );

  const whenText = chosenSlot ? t('when', { date: f.date(chosenSlot), time: f.time(chosenSlot) }) : null;
  const modeLabel = mode === 'lighter' ? t('mode.lighter') : t('mode.standard');

  return (
    <PageShell className="pb-32 lg:pb-12">
      <Link
        href={withBookingDate(`/pandits/${pandit.id}?service=${service.service_definition_id}`, carried)}
        className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('backTo', { name: pandit.name })}
      </Link>
      <div className="mb-6 flex items-center gap-4">
        <PujaIcon category={def?.category} size="lg" />
        <div className="min-w-0">
          <h1 className={cn('text-3xl sm:text-4xl', f.locale === 'hi' ? 'leading-[1.35]' : 'leading-tight')}>
            {t('title', { puja: pujaName })}
          </h1>
          <p className="text-muted-foreground">{t('withPandit', { name: pandit.name })}</p>
        </div>
      </div>

      <StepIndicator steps={steps} current={step} onSelect={locked ? undefined : (i) => goTo(i)} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {/* Step 1 */}
          {step === 0 && (
            <div className="grid grid-cols-1 gap-8">
              <fieldset className="grid min-w-0 grid-cols-1 gap-3">
                <legend className="mb-3 font-heading text-2xl text-heading">{t('mode.legend')}</legend>
                <ChoiceCard
                  name="mode"
                  value="standard"
                  checked={mode === 'standard'}
                  onChange={() => changeMode('standard')}
                  icon={Sparkles}
                  title={t('mode.standard')}
                  meta={
                    <span className="text-sm font-semibold tabular-nums">
                      {f.inr(service.standard_price)} · {f.duration(Number(service.standard_duration_minutes))}
                    </span>
                  }
                >
                  {t('mode.standardText')}
                </ChoiceCard>
                {hasLighter && (
                  <ChoiceCard
                    name="mode"
                    value="lighter"
                    checked={mode === 'lighter'}
                    onChange={() => changeMode('lighter')}
                    icon={Feather}
                    title={t('mode.lighter')}
                    meta={
                      <span className="text-sm font-semibold tabular-nums">
                        {f.inr(service.lighter_mode_price)}
                        {service.lighter_mode_duration_minutes
                          ? ` · ${f.duration(Number(service.lighter_mode_duration_minutes))}`
                          : ''}
                      </span>
                    }
                  >
                    {t('mode.lighterText')}
                  </ChoiceCard>
                )}
              </fieldset>

              <fieldset className="grid min-w-0 grid-cols-1 gap-3">
                <legend className="mb-3 font-heading text-2xl text-heading">{t('type.legend')}</legend>
                <ChoiceCard
                  name="type"
                  value="at_home"
                  checked={bookingType === 'at_home'}
                  onChange={() => setType('at_home')}
                  icon={Home}
                  title={t('type.home')}
                >
                  {pandit.city ? t('type.homeTextCity', { city: pandit.city }) : t('type.homeText')}
                </ChoiceCard>
                {canOnline ? (
                  <ChoiceCard
                    name="type"
                    value="online"
                    checked={bookingType === 'online'}
                    onChange={() => setType('online')}
                    icon={Video}
                    title={t('type.online')}
                  >
                    {t('type.onlineText')}
                  </ChoiceCard>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {pandit.offers_online
                      ? t('type.inPersonPuja')
                      : t('type.inPersonPandit', { name: pandit.name })}
                  </p>
                )}
              </fieldset>

              <section aria-labelledby="samagri-h" className="grid min-w-0 grid-cols-1 gap-3">
                <h2 id="samagri-h" className="font-heading text-2xl text-heading">
                  {ts('book.title')}
                </h2>
                {canKit && (
                  // The family's choice on every booking; arranging it themselves is the default.
                  <fieldset className="grid gap-2">
                    <legend className="mb-2 font-medium">{ts('book.choice.legend')}</legend>
                    {(
                      [
                        { pandit: false, icon: Home, label: ts('book.choice.family'), hint: ts('book.choice.familyHint') },
                        {
                          pandit: true,
                          icon: Package,
                          label: ts('book.kit.label', { price: f.inr(kitPrice) }),
                          hint: ts('book.kit.hint'),
                        },
                      ] as const
                    ).map(({ pandit, icon: Icon, label, hint }) => (
                      <label
                        key={String(pandit)}
                        className={cn(
                          'relative flex cursor-pointer gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40',
                          'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                          kitChoice === pandit && 'border-primary bg-accent/40 ring-1 ring-primary/40',
                        )}
                      >
                        <input
                          type="radio"
                          name="samagri-by"
                          checked={kitChoice === pandit}
                          onChange={() => setKitChoice(pandit)}
                          className="mt-1 size-5 shrink-0 accent-primary"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="inline-flex items-center gap-2 font-medium">
                            <Icon className="size-4 text-primary" aria-hidden="true" />
                            {label}
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )}
                {!canKit && (
                  <p className="text-sm text-muted-foreground">
                    {bookingType === 'online' ? ts('book.onlineNote') : ts('book.family')}
                  </p>
                )}
                {canKit && kitChoice && <p className="text-sm text-muted-foreground">{ts('price.samagriNote')}</p>}
                <SamagriListButton
                  {...modeSamagri}
                  items={def?.samagri}
                  pujaName={pujaName}
                  label={modeSamagri.modeLabel ?? ts('book.viewList')}
                  className="justify-self-start"
                />
              </section>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-6">
              <section aria-labelledby="date-h">
                <h2 id="date-h" className="mb-3 text-2xl">
                  {t('date.title')}
                </h2>
                <DateStrip dates={dates} value={date} onChange={changeDate} marks={marks} />
              </section>
              <section aria-labelledby="time-h">
                <h2 id="time-h" className="text-2xl">
                  {t('time.title')}
                </h2>
                <p className="mt-1 mb-4 text-sm text-muted-foreground">
                  {t('time.meta', { date: f.dateKey(date), duration: f.duration(duration) })}
                  {marks[date] && (
                    <span className="mt-1 flex items-center gap-1.5 text-heading">
                      <span className="size-1.5 shrink-0 rounded-full bg-diya" aria-hidden="true" />
                      {t('date.isSacred', { name: marks[date].description })}
                    </span>
                  )}
                </p>
                {slotMsg && (
                  <p role="alert" className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {slotMsg}
                  </p>
                )}
                <SlotGrid
                  slots={availability.data?.slots}
                  loading={availability.loading}
                  error={availability.error}
                  value={chosenSlot}
                  emptyText={
                    date === carriedDate
                      ? t('carry.noSlots', { name: pandit.name, date: f.dateKey(date, { weekday: 'long', month: 'long' }) })
                      : undefined
                  }
                  onChange={(iso) => {
                    setSlot(iso);
                    setSlotMsg(null);
                    setStepError(null);
                  }}
                />
                <TimezoneNote className="mt-4" />
                {chosenSlot && foreignTz && (
                  <p className="mt-1 pl-6 text-sm font-medium">
                    {t('tz.local', { ist: f.time(chosenSlot), local: formatLocalTime(chosenSlot, foreignTz, f.locale) })}
                  </p>
                )}
              </section>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-10">
              {bookingType === 'at_home' ? (
                <section aria-labelledby="place-h">
                  <h2 id="place-h" className="text-2xl">
                    {t('place.title')}
                  </h2>
                  {addresses.loading ? (
                    <div className="mt-4 grid gap-2">
                      <Skeleton className="h-20 rounded-xl" />
                      <Skeleton className="h-20 rounded-xl" />
                    </div>
                  ) : (
                    <>
                      {addrList.length > 0 && (
                        <fieldset className="mt-4 grid gap-2">
                          <legend className="sr-only">{t('place.saved')}</legend>
                          {addrList.map((a) => (
                            <ChoiceCard
                              key={a.id}
                              name="address"
                              value={a.id}
                              checked={a.id === addressId}
                              onChange={() => {
                                setAddressId(a.id);
                                setStepError(null);
                              }}
                              icon={Home}
                              title={a.label}
                              meta={
                                a.is_default ? (
                                  <span className="text-xs text-muted-foreground">{t('place.default')}</span>
                                ) : undefined
                              }
                            >
                              {addressLine(a)}
                            </ChoiceCard>
                          ))}
                        </fieldset>
                      )}
                      {addingAddress || addrList.length === 0 ? (
                        <div className="mt-4 rounded-2xl border bg-card p-5">
                          <h3 className="mb-4 text-xl">{t('place.addTitle')}</h3>
                          <AddressForm
                            defaultChecked={addrList.length === 0}
                            submitLabel={t('place.saveUse')}
                            onCancel={addrList.length ? () => setAddingAddress(false) : undefined}
                            onSaved={(a) => {
                              addresses.setData([...addrList.filter((x) => x.id !== a.id), a]);
                              setAddressId(a.id);
                              setAddingAddress(false);
                              setStepError(null);
                              addresses.reload();
                            }}
                          />
                        </div>
                      ) : (
                        <Button variant="outline" className="mt-3" onClick={() => setAddingAddress(true)}>
                          <Plus aria-hidden="true" />
                          {t('place.addNew')}
                        </Button>
                      )}
                      <p className="mt-3 text-sm text-muted-foreground">
                        {pandit.city
                          ? t('place.rangeCity', {
                              name: pandit.name,
                              km: Number(pandit.max_travel_distance_km),
                              city: pandit.city,
                            })
                          : t('place.range', { name: pandit.name, km: Number(pandit.max_travel_distance_km) })}
                      </p>
                    </>
                  )}
                </section>
              ) : (
                <section aria-labelledby="online-h" className="rounded-2xl border bg-chandan p-5">
                  <h2 id="online-h" className="flex items-center gap-2 text-2xl">
                    <Video className="size-6 text-primary" aria-hidden="true" />
                    {t('online.title')}
                  </h2>
                  <p className="mt-2">{t('online.text')}</p>
                </section>
              )}

              <section aria-labelledby="sankalp-h">
                <h2 id="sankalp-h" className="text-2xl">
                  {t('sankalp.title')}
                </h2>
                <p className="mt-1 mb-4 text-sm text-muted-foreground">
                  {t('sankalp.intro')}
                  {bookingType === 'at_home' ? ` ${t('sankalp.optionalHome')}` : ''}
                </p>
                <SankalpFields
                  value={sankalp}
                  onChange={(v) => {
                    setSankalp(v);
                    if (stepError) setStepError(null);
                  }}
                  nameRequired={bookingType === 'online'}
                  nameError={bookingType === 'online' && stepError && !sankalp.devotee_name.trim() ? stepError : null}
                  family={family.error ? undefined : family.data}
                  devoteeName={user.name}
                />
              </section>

              <section aria-labelledby="notes-h">
                <Label htmlFor="booking-notes" id="notes-h" className="text-base">
                  {t('notes.label')} <span className="font-normal text-muted-foreground">{t('notes.optional')}</span>
                </Label>
                <Textarea
                  id="booking-notes"
                  className="mt-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  placeholder={t('notes.placeholder')}
                />
              </section>
            </div>
          )}

          {/* Step 4 */}
          {step === 3 && (verifyOpen || !verified) && (
            <div ref={verifyRef} className="mb-6 scroll-mt-24">
              <VerificationPanel
                headingId="book-verify"
                onComplete={() => {
                  setVerifyOpen(false);
                  if (!payAfterVerify.current) return;
                  payAfterVerify.current = false;
                  void confirmAndPay();
                }}
              />
            </div>
          )}
          {step === 3 && (
            <AartiFrame innerClassName="p-5 sm:p-7">
              <h2 className="text-2xl">{t('review.title')}</h2>
              <div className="mt-4 flex items-center gap-3">
                <PanditAvatar name={pandit.name} photo={pandit} verified={pandit.is_verified} size="sm" />
                <div>
                  <p className="font-medium">{pujaName}</p>
                  <p className="text-sm text-muted-foreground">{t('withPandit', { name: pandit.name })}</p>
                </div>
              </div>
              <dl className="mt-4 divide-y">
                <SummaryRow label={t('review.mode')}>
                  {modeLabel} · {f.duration(duration)}
                </SummaryRow>
                <SummaryRow label={t('review.where')}>
                  {bookingType === 'online' ? t('type.online') : t('type.home')}
                </SummaryRow>
                <SummaryRow label={t('review.when')}>{whenText ?? '—'}</SummaryRow>
                <SummaryRow label={ts('book.title')}>
                  {samagriByPandit ? ts('by.pandit') : ts('by.family')}
                </SummaryRow>
                {bookingType === 'at_home' && address && (
                  <SummaryRow label={t('review.address')}>
                    <span className="block font-medium">{address.label}</span>
                    <span className="block font-normal text-muted-foreground">{addressLine(address)}</span>
                  </SummaryRow>
                )}
                {sankalp.devotee_name.trim() && (
                  <SummaryRow label={t('review.sankalpFor')}>
                    {sankalp.gotra.trim()
                      ? t('review.nameGotra', { name: sankalp.devotee_name.trim(), gotra: sankalp.gotra.trim() })
                      : sankalp.devotee_name.trim()}
                  </SummaryRow>
                )}
              </dl>
              <div className="mt-4 rounded-xl bg-muted px-4 py-3">
                <FeeLines price={price} fee={fee} samagri={samagri} className="mb-2 border-b pb-2" />
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{hasExtras(fee, samagri) ? t('price.total') : t('review.total')}</span>
                  <span className="text-2xl font-semibold tabular-nums">{f.inr(payable)}</span>
                </div>
              </div>
              {fee > 0 && <p className="mt-2 text-xs text-muted-foreground">{t('price.feeNote')}</p>}
              {samagri > 0 && <p className="mt-1 text-xs text-muted-foreground">{ts('price.samagriNote')}</p>}
              {created && (
                <p className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                  {rich(t('review.savedAwaiting'), {
                    link: (
                      <Link href={`/bookings/${created.id}`} className="font-medium underline underline-offset-4">
                        {t('review.myBookings')}
                      </Link>
                    ),
                  })}
                </p>
              )}
              {submitError && (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {submitError}
                </p>
              )}
              <div className="mt-6 hidden lg:block">{primaryButton('w-full')}</div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 text-tulsi" aria-hidden="true" />
                {t('review.secure')}
              </p>
            </AartiFrame>
          )}

          {stepError && step !== 2 && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {stepError}
            </p>
          )}
          {stepError && step === 2 && bookingType === 'at_home' && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {stepError}
            </p>
          )}

          {step > 0 && !locked && (
            <Button variant="ghost" className="mt-6" onClick={() => setStep(step - 1)}>
              <ArrowLeft aria-hidden="true" />
              {tc('action.back')}
            </Button>
          )}
        </div>

        {/* Desktop summary */}
        <aside aria-label={t('summary.aria')} className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-card p-5">
            <h2 className="text-xl">{t('summary.title')}</h2>
            <dl className="mt-3 divide-y">
              <SummaryRow label={t('summary.puja')}>{pujaName}</SummaryRow>
              <SummaryRow label={t('review.mode')}>{modeLabel}</SummaryRow>
              <SummaryRow label={t('review.where')}>
                {bookingType === 'online' ? t('summary.online') : t('summary.home')}
              </SummaryRow>
              <SummaryRow label={t('review.when')}>{whenText ?? t('summary.notChosen')}</SummaryRow>
              {samagriByPandit && <SummaryRow label={ts('book.title')}>{ts('by.pandit')}</SummaryRow>}
            </dl>
            <FeeLines price={price} fee={fee} samagri={samagri} className="mt-3 border-t pt-3" />
            <div className="mt-3 flex items-baseline justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">{t('summary.total')}</span>
              <span className="text-2xl font-semibold tabular-nums">{f.inr(payable)}</span>
            </div>
            {step < 3 && <div className="mt-4">{primaryButton('w-full')}</div>}
          </div>
        </aside>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('summary.total')}</p>
            <p className="text-lg leading-tight font-semibold tabular-nums">{f.inr(payable)}</p>
          </div>
          {primaryButton('min-w-0 flex-1 sm:flex-none')}
        </div>
      </div>

      {paymentDialog}
    </PageShell>
  );
}

/* ───────────── data + auth gate ───────────── */

function BookingLoader() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const serviceId = params.get('service');
  const initialType: BookingType = params.get('type') === 'online' ? 'online' : 'at_home';
  const carried = readBookingDate(params);
  const t = useT('booking');
  const { ready, wrongRole, user, token } = useRequireCustomer();
  const pandit = useApiQuery<PanditPublic>(ready && id ? `/pandits/${encodeURIComponent(id)}` : null);

  if (wrongRole) return <CustomerOnly />;
  if (!ready || !user || pandit.loading) return <DiyaLoader label={t('loading')} />;

  const service = pandit.data?.services.find((s) => s.id === serviceId && s.is_active !== false);
  if (pandit.error || !pandit.data || !service) {
    return (
      <PageShell size="narrow">
        <EmptyState
          icon={SearchX}
          title={pandit.error ? t('loadError.title') : t('loadError.choose')}
          action={
            <Button render={<Link href={`/pandits/${id}`} />} nativeButton={false}>
              {t('loadError.cta')}
            </Button>
          }
        >
          {pandit.error ? t('loadError.hint') : t('loadError.gone')}
        </EmptyState>
      </PageShell>
    );
  }

  return (
    <Wizard
      key={`${pandit.data.id}-${service.id}`}
      pandit={pandit.data}
      service={service}
      initialType={initialType}
      carried={carried}
      user={user}
      token={token}
    />
  );
}

function Preparing() {
  const t = useT('booking');
  return <DiyaLoader label={t('loading')} />;
}

export default function BookPage() {
  return (
    <Suspense fallback={<Preparing />}>
      <BookingLoader />
    </Suspense>
  );
}
