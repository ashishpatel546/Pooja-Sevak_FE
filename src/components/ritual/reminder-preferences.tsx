'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BellRing, Check, Loader2, Mail, MessageSquareText, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import type { Messages } from '@/i18n/messages';
import { api } from '@/lib/api';
import { DEFAULT_PLACE, fromPanchangPlace, toPanchangPlace, type Place } from '@/lib/place';
import type { AuthUser, ObservanceKey, ReminderChannels, ReminderPreferences } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/dashboard/switch';
import { ChoiceChips } from './choice-chips';
import { ObservanceIcon } from './observance-icon';
import { OBSERVANCE_KEYS } from './observance';
import { PlaceControl } from './place-control';
import { usePlaceName } from './use-place';
import { usePanchangText } from './use-panchang-text';
import { useErrorText } from './use-error-text';

type RemindersKey = keyof Messages['reminders'] & string;
const LEAD_DAYS = [0, 1, 3, 7];

function Row({
  id,
  icon,
  title,
  description,
  checked,
  onChange,
  disabled,
  highlight,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li
      id={`row-${id}`}
      className={cn(
        'flex items-start gap-3 px-4 py-4 transition-colors sm:px-5',
        highlight && 'bg-accent/50',
      )}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block cursor-pointer font-medium">
          {title}
        </label>
        {description && (
          <p id={`${id}-desc`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-describedby={description ? `${id}-desc` : undefined}
        className="mt-1"
      />
    </li>
  );
}

/**
 * Which sacred days to be reminded of, how early, and where. Every change saves
 * at once; if the server refuses, the switch returns to its saved position.
 */
export function ReminderPreferencesForm({
  initial,
  user,
  token,
  remindKey,
  onSaved,
  onAutoEnabled,
}: {
  initial: ReminderPreferences;
  user: AuthUser;
  token: string | null;
  /** From "Remind me" on /panchang: switch this observance on once. */
  remindKey?: ObservanceKey | null;
  onSaved: (p: ReminderPreferences) => void;
  onAutoEnabled?: () => void;
}) {
  const t = useT('reminders');
  const { typeName } = usePanchangText();
  const errorText = useErrorText();
  const placeName = usePlaceName();
  const autoAdd = !!remindKey && !initial.observances.includes(remindKey);
  const [prefs, setPrefs] = useState<ReminderPreferences>(() =>
    autoAdd && remindKey ? { ...initial, observances: [...initial.observances, remindKey] } : initial,
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const confirmed = useRef(initial);
  const inflight = useRef(false);
  const queued = useRef<ReminderPreferences | null>(null);
  const autoDone = useRef(false);

  const save = async (next: ReminderPreferences, successToast?: string) => {
    if (inflight.current) {
      queued.current = next;
      return;
    }
    inflight.current = true;
    setStatus('saving');
    let current: ReminderPreferences | null = next;
    let failed = false;
    while (current) {
      queued.current = null;
      try {
        confirmed.current = await api<ReminderPreferences>('/reminders/preferences', {
          method: 'PUT',
          token,
          body: current,
        });
      } catch (e) {
        failed = true;
        queued.current = null;
        toast.error(errorText(e, t('toast.prefsFailed')));
        break;
      }
      current = queued.current;
    }
    inflight.current = false;
    setPrefs(confirmed.current);
    setStatus(failed ? 'idle' : 'saved');
    if (!failed) {
      onSaved(confirmed.current);
      if (successToast) toast.success(successToast);
    }
  };

  // Arriving from "Remind me": the switch is already shown on; persist it once.
  useEffect(() => {
    if (!autoAdd || !remindKey || autoDone.current) return;
    autoDone.current = true;
    document.getElementById(`row-obs-${remindKey}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const next = { ...initial, observances: [...initial.observances, remindKey] };
    void Promise.resolve().then(() => save(next, t('toast.remindOn', { name: typeName(remindKey) })));
    onAutoEnabled?.();
    // Runs once for the key in the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch: Partial<ReminderPreferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    void save(next);
  };

  const toggleObservance = (key: ObservanceKey, on: boolean) => {
    const set = new Set(prefs.observances);
    if (on) set.add(key);
    else set.delete(key);
    update({ observances: OBSERVANCE_KEYS.filter((k) => set.has(k)) });
  };
  const setChannel = (key: keyof ReminderChannels, on: boolean) =>
    update({ channels: { ...prefs.channels, [key]: on } });

  const noChannel = !prefs.channels.email && !prefs.channels.sms && !prefs.channels.in_app;
  const smsBlocked = !user.mobile_verified;
  const savedPlace = prefs.location ? fromPanchangPlace(prefs.location) : null;
  const shownPlace = savedPlace ?? DEFAULT_PLACE;
  const changePlace = async (p: Place) => {
    const next = { ...prefs, location: toPanchangPlace(p) };
    setPrefs(next);
    await save(next, t('toast.placeSaved', { place: placeName(p) }));
  };

  return (
    <div className="grid grid-cols-1 gap-10">
      <p aria-live="polite" className="flex min-h-6 items-center gap-1.5 text-sm text-muted-foreground">
        {status === 'saving' && (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t('prefs.saving')}
          </>
        )}
        {status === 'saved' && (
          <>
            <Check className="size-4 text-tulsi" aria-hidden="true" />
            {t('prefs.saved')}
          </>
        )}
      </p>

      <section aria-labelledby="prefs-days" className="-mt-8 min-w-0">
        <h2 id="prefs-days" className="text-2xl">
          {t('prefs.daysTitle')}
        </h2>
        <p className="mt-1 text-muted-foreground">{t('prefs.daysIntro')}</p>
        <ul className="mt-4 divide-y rounded-2xl border bg-card">
          {OBSERVANCE_KEYS.map((key) => (
            <Row
              key={key}
              id={`obs-${key}`}
              icon={<ObservanceIcon observanceKey={key} size="sm" />}
              title={typeName(key)}
              description={t(`prefs.desc.${key}` as RemindersKey)}
              checked={prefs.observances.includes(key)}
              onChange={(on) => toggleObservance(key, on)}
              highlight={remindKey === key}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby="prefs-when" className="min-w-0">
        <h2 id="prefs-when" className="text-2xl">
          {t('prefs.whenTitle')}
        </h2>
        <p id="prefs-when-help" className="mt-1 mb-4 text-muted-foreground">
          {t('prefs.whenIntro')}
        </p>
        <ChoiceChips
          legend={t('prefs.whenLegend')}
          legendClassName="sr-only"
          describedBy="prefs-when-help"
          options={LEAD_DAYS.map((n) => ({
            value: n,
            label: n === 0 ? t('lead.onDay') : t.plural('lead.before', n),
          }))}
          value={prefs.remind_days_before}
          onChange={(n) => update({ remind_days_before: n })}
        />
      </section>

      <section aria-labelledby="prefs-how" className="min-w-0">
        <h2 id="prefs-how" className="text-2xl">
          {t('prefs.howTitle')}
        </h2>
        <p className="mt-1 text-muted-foreground">{t('prefs.howIntro', { place: placeName(shownPlace) })}</p>
        <ul className="mt-4 divide-y rounded-2xl border bg-card">
          <Row
            id="ch-in_app"
            icon={<BellRing className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />}
            title={t('channel.in_app')}
            description={t('channel.in_appHelp')}
            checked={prefs.channels.in_app}
            onChange={(on) => setChannel('in_app', on)}
          />
          <Row
            id="ch-email"
            icon={<Mail className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />}
            title={t('channel.email')}
            description={t('channel.emailHelp', { email: user.email })}
            checked={prefs.channels.email}
            onChange={(on) => setChannel('email', on)}
          />
          <Row
            id="ch-sms"
            icon={<MessageSquareText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />}
            title={t('channel.sms')}
            description={
              smsBlocked ? t('channel.smsNeedsMobile') : t('channel.smsHelp', { mobile: user.mobile ?? '' })
            }
            checked={prefs.channels.sms}
            onChange={(on) => setChannel('sms', on)}
            disabled={smsBlocked && !prefs.channels.sms}
          >
            {smsBlocked && (
              <Link
                href={`/verify-mobile?next=${encodeURIComponent('/reminders?tab=preferences')}`}
                className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Smartphone className="size-4" aria-hidden="true" />
                {t('channel.verifyMobile')}
              </Link>
            )}
          </Row>
        </ul>
        {noChannel && (
          <p role="status" className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
            {t('prefs.noChannel')}
          </p>
        )}
      </section>

      <section aria-labelledby="prefs-place" className="min-w-0">
        <h2 id="prefs-place" className="text-2xl">
          {t('prefs.placeTitle')}
        </h2>
        <p className="mt-1 text-muted-foreground">{t('prefs.placeIntro')}</p>
        <div className="mt-4 rounded-2xl border bg-card px-4 py-4 sm:px-5">
          <PlaceControl
            place={shownPlace}
            text={savedPlace ? t('prefs.placeCurrent', { place: placeName(savedPlace) }) : t('prefs.placeUnset')}
            onChange={changePlace}
          />
        </div>
      </section>
    </div>
  );
}
