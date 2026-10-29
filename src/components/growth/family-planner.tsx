'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarHeart, Flame, Flower2, Info, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { pick, useFormat, useT } from '@/i18n';
import { api } from '@/lib/api';
import type { FamilyPlan, FamilyReminderSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Switch } from '@/components/dashboard/switch';
import { useApiQuery } from '@/components/customer/use-api';

/** Days from `today` (YYYY-MM-DD, IST) to `date`. */
function daysUntil(date: string, today: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

const istToday = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

function DateLine({ label, date }: { label: string; date: string | null }) {
  const t = useT('growth');
  const f = useFormat();
  if (!date) return null;
  const d = daysUntil(date, istToday());
  const away = d === 0 ? t('family.today') : d === 1 ? t('family.tomorrow') : t('family.daysAway', { days: f.number(d) });
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right">
        <span className="font-medium">{f.dateKey(date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <span className="ml-2 text-sm text-muted-foreground">{away}</span>
      </dd>
    </div>
  );
}

/**
 * Shraddh planner + Hindu birthdays + kuldevta days, from the family's
 * remembrances and Kul parichay (GET /reminders/family-plan).
 */
export function FamilyPlanner({ token }: { token: string | null }) {
  const t = useT('growth');
  const tc = useT('common');
  const f = useFormat();
  const plan = useApiQuery<FamilyPlan>(token ? '/reminders/family-plan' : null, { token });
  const d = plan.data;
  const en = f.locale === 'en';

  if (plan.loading && !d) {
    return (
      <div className="grid gap-4" aria-hidden="true">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }
  if (!d) {
    return (
      <EmptyState
        icon={RefreshCw}
        title={t('family.loadError')}
        action={<Button onClick={plan.reload}>{tc('action.retry')}</Button>}
      >
        {plan.error}
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-8">
      <p className="max-w-2xl font-heading text-xl leading-relaxed text-heading">{t('family.subtitle')}</p>

      <section aria-labelledby="fam-shraddh" className="min-w-0">
        <h2 id="fam-shraddh" className="flex items-center gap-2 text-2xl">
          <Flame className="size-5 text-diya" aria-hidden="true" />
          {t('family.shraddh.title')}
        </h2>
        {d.shraddh.length === 0 ? (
          <p className="mt-2 text-muted-foreground">{t('family.shraddh.empty')}</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {d.shraddh.map((s) => (
              <li key={s.remembrance_id} className="flex flex-col rounded-2xl border bg-card p-5">
                <p className="text-lg font-medium">
                  {s.person_name}
                  {s.relation && <span className="ml-2 text-sm font-normal text-muted-foreground">{s.relation}</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('family.shraddh.deathTithi', { tithi: en ? s.death_tithi_en : s.death_tithi_hi })}
                </p>
                <dl className="mt-3 divide-y">
                  <DateLine
                    label={`${t('family.shraddh.pitruPaksha')} · ${en ? s.shraddh_name_en : s.shraddh_name_hi}`}
                    date={s.pitru_paksha_date}
                  />
                  <DateLine label={t('family.shraddh.punyatithi')} date={s.punyatithi_date} />
                </dl>
                {s.chaturdashi_date && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('family.shraddh.ghata', {
                      date: f.dateKey(s.chaturdashi_date, { day: 'numeric', month: 'long' }),
                    })}
                  </p>
                )}
                {(en ? s.note_en : s.note_hi) && (
                  <p className="mt-2 flex gap-1.5 text-sm text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {en ? s.note_en : s.note_hi}
                  </p>
                )}
                <Button
                  render={<Link href={`/pujas/${s.puja_slug}`} />}
                  nativeButton={false}
                  variant="outline"
                  className="mt-4 min-h-11 self-start"
                >
                  {t('family.shraddh.book')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="fam-bday" className="min-w-0">
        <h2 id="fam-bday" className="flex items-center gap-2 text-2xl">
          <CalendarHeart className="size-5 text-primary" aria-hidden="true" />
          {t('family.birthdays.title')}
        </h2>
        {d.birthdays.length === 0 ? (
          <p className="mt-2 text-muted-foreground">{t('family.birthdays.empty')}</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {d.birthdays.map((b) => (
              <li key={b.member_id} className="rounded-2xl border bg-card p-5">
                <p className="text-lg font-medium">
                  {b.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">{b.relation}</span>
                </p>
                <dl className="mt-2 divide-y">
                  <DateLine
                    label={t('family.birthdays.tithi', { tithi: (en ? b.tithi_label_en : b.tithi_label_hi) ?? '' })}
                    date={b.tithi_date}
                  />
                  {b.nakshatra && (
                    <DateLine label={t('family.birthdays.nakshatra', { nakshatra: b.nakshatra })} date={b.nakshatra_date} />
                  )}
                </dl>
                <Link
                  href={`/pujas/${b.puja_slugs[0]}`}
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t('family.birthdays.book')}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {d.members_missing_dob.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t('family.birthdays.missingDob', { names: d.members_missing_dob.join(', ') })}
          </p>
        )}
      </section>

      <section aria-labelledby="fam-kul" className="min-w-0">
        <h2 id="fam-kul" className="flex items-center gap-2 text-2xl">
          <Flower2 className="size-5 text-primary" aria-hidden="true" />
          {t('family.kuldevta.title')}
        </h2>
        {!d.kuldevta ? (
          <p className="mt-2 text-muted-foreground">{t('family.kuldevta.empty')}</p>
        ) : (
          <div className="mt-4 rounded-2xl border bg-card p-5">
            <p className="font-medium">{t('family.kuldevta.body', { name: d.kuldevta.kuldevta })}</p>
            <dl className="mt-2 divide-y">
              {d.kuldevta.observances.map((o) => (
                <DateLine key={o.festival} label={pick({ name: o.name_en, name_hi: o.name_hi }, 'name', f.locale)} date={o.date} />
              ))}
            </dl>
            <Button
              render={<Link href={`/pujas/${d.kuldevta.puja_slug}`} />}
              nativeButton={false}
              variant="outline"
              className="mt-4 min-h-11"
            >
              {t('family.kuldevta.book')}
            </Button>
          </div>
        )}
      </section>

      <p>
        <Link href="/account#kul-parichay" className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">
          {t('family.editKul')}
        </Link>
      </p>
    </div>
  );
}

/** Family reminder toggles (Preferences tab). Channels are the ones chosen above. */
export function FamilyReminderSettingsSection({ token }: { token: string | null }) {
  const t = useT('growth');
  const settings = useApiQuery<FamilyReminderSettings>(token ? '/reminders/family-settings' : null, { token });
  const [busy, setBusy] = useState(false);
  const s = settings.data;
  if (!s) return null;

  const set = async (key: keyof FamilyReminderSettings, on: boolean) => {
    const next = { ...s, [key]: on };
    settings.setData(next);
    setBusy(true);
    try {
      settings.setData(await api<FamilyReminderSettings>('/reminders/family-settings', { method: 'PUT', token, body: next }));
      toast.success(t('prefs.family.saved'));
    } catch {
      settings.setData(s);
      toast.error(t('prefs.family.error'));
    } finally {
      setBusy(false);
    }
  };

  const rows: { key: keyof FamilyReminderSettings; label: string }[] = [
    { key: 'shraddh', label: t('prefs.family.shraddh') },
    { key: 'family_birthdays', label: t('prefs.family.birthdays') },
    { key: 'kuldevta', label: t('prefs.family.kuldevta') },
  ];
  return (
    <section aria-labelledby="prefs-family" className="mt-10 min-w-0">
      <h2 id="prefs-family" className="text-2xl">
        {t('prefs.family.title')}
      </h2>
      <ul className="mt-4 divide-y rounded-2xl border bg-card">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <label htmlFor={`fam-${r.key}`} className="min-w-0 flex-1 font-medium">
              {r.label}
            </label>
            <Switch id={`fam-${r.key}`} checked={s[r.key]} disabled={busy} onCheckedChange={(on) => set(r.key, on)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
