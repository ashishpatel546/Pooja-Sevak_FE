'use client';

import { useState, type ReactNode } from 'react';
import { BadgeIndianRupee, CircleAlert, Headset, Scale, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { BusinessProfile } from '@/lib/site-info';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Field } from '@/components/dashboard/field';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { useT, type Translator } from '@/i18n';

type Key = keyof BusinessProfile;
type Values = Record<Key, string>;
type Errors = Partial<Record<Key, string>>;
type T = Translator<'business'>;

// Mirrors backend/src/global-settings/business-profile (DTO + fields).
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PHONE = /^\+?\d(?:[\s-]?\d){9,12}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX: Partial<Record<Key, number>> = {
  legal_name: 150,
  legal_name_hi: 150,
  support_email: 254,
  support_hours: 100,
  support_hours_hi: 100,
  postal_address: 500,
  postal_address_hi: 500,
  grievance_officer_name: 100,
  grievance_officer_email: 254,
  jurisdiction_city: 80,
  jurisdiction_city_hi: 80,
};
const REQUIRED: Key[] = ['legal_name', 'support_email', 'response_hours', 'legal_last_updated'];

const toValues = (p: BusinessProfile): Values =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v == null ? '' : String(v)])) as Values;

const cleanLines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');

/** Trimmed values in the shape the API expects. */
function normalize(v: Values): Omit<BusinessProfile, 'response_hours'> & { response_hours: number } {
  const out = Object.fromEntries(Object.entries(v).map(([k, s]) => [k, s.trim()])) as Values;
  out.gstin = out.gstin.toUpperCase();
  out.postal_address = cleanLines(v.postal_address);
  out.postal_address_hi = cleanLines(v.postal_address_hi);
  return { ...out, response_hours: Number(out.response_hours) };
}

function validate(v: Values, t: T): Errors {
  const n = normalize(v);
  const e: Errors = {};
  for (const [key, max] of Object.entries(MAX) as [Key, number][]) {
    if (String(n[key]).length > max) e[key] = t('err.tooLong', { max });
  }
  if (n.support_email && !EMAIL.test(n.support_email)) e.support_email = t('err.email');
  if (n.grievance_officer_email && !EMAIL.test(n.grievance_officer_email)) e.grievance_officer_email = t('err.email');
  if (n.support_phone && !PHONE.test(n.support_phone)) e.support_phone = t('err.phone');
  if (n.grievance_officer_phone && !PHONE.test(n.grievance_officer_phone)) e.grievance_officer_phone = t('err.phone');
  if (n.gstin && !GSTIN.test(n.gstin)) e.gstin = t('err.gstin');
  if (!Number.isInteger(n.response_hours) || n.response_hours < 1 || n.response_hours > 720) {
    e.response_hours = t('err.hours');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.legal_last_updated) || Number.isNaN(Date.parse(n.legal_last_updated))) {
    e.legal_last_updated = t('err.date');
  }
  for (const key of REQUIRED) if (!v[key].trim()) e[key] = t('err.required');
  return e;
}

/** Admin → Settings → Business details: the values behind /contact and the legal pages. */
export function BusinessProfileSection({ token }: { token: string | null }) {
  const t = useT('business');
  const tc = useT('common');
  const profile = useApi<BusinessProfile>('/admin/business-profile', token);

  return (
    <section id="business" aria-labelledby="business-h" className="mt-12 scroll-mt-24">
      <h2 id="business-h" className="text-2xl sm:text-3xl">
        {t('title')}
      </h2>
      <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{t('desc')}</p>
      <div className="mt-6">
        {profile.loading ? (
          <div className="grid max-w-4xl gap-4">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        ) : profile.error && !profile.data ? (
          <EmptyState
            icon={CircleAlert}
            title={t('loadError')}
            action={<Button onClick={profile.reload}>{tc('action.retry')}</Button>}
          >
            {profile.error}
          </EmptyState>
        ) : profile.data ? (
          <BusinessForm initial={profile.data} token={token} onSaved={(p) => profile.mutate(() => p)} />
        ) : null}
      </div>
    </section>
  );
}

function BusinessForm({
  initial,
  token,
  onSaved,
}: {
  initial: BusinessProfile;
  token: string | null;
  onSaved: (p: BusinessProfile) => void;
}) {
  const t = useT('business');
  const tc = useT('common');
  const [saved, setSaved] = useState<Values>(() => toValues(initial));
  const [values, setValues] = useState<Values>(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = (Object.keys(values) as Key[]).some((k) => values[k] !== saved[k]);

  const set = (key: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    // Re-check a field that already shows an error as the admin fixes it.
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: validate(next, t)[key] }));
  };
  const blur = (key: Key) => () => setErrors((prev) => ({ ...prev, [key]: validate(values, t)[key] }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values, t);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setFormError(t('fixErrors'));
      const first = (Object.keys(found) as Key[]).find((k) => found[k]);
      if (first) document.getElementById(`bp-${first}`)?.focus();
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      const result = await api<BusinessProfile>('/admin/business-profile', {
        method: 'PUT',
        token,
        body: normalize(values),
      });
      const next = toValues(result);
      setSaved(next);
      setValues(next);
      onSaved(result);
      // Refresh the cached copy the public pages read; if that fails they catch up within 5 minutes.
      const fresh = await fetch('/api/revalidate/business-profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).then(
        (r) => r.ok,
        () => false,
      );
      toast.success(fresh ? t('saved') : t('savedStale'));
    } catch (err) {
      const message = errorMessage(err);
      setFormError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  /** Props shared by every input: id, value, validation wiring. */
  const control = (key: Key) => ({
    id: `bp-${key}`,
    name: key,
    value: values[key],
    onChange: set(key),
    onBlur: blur(key),
    maxLength: MAX[key],
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `bp-${key}-error` : `bp-${key}-hint`,
  });

  const text = (key: Key, label: ReactNode, hint?: string, extra: React.ComponentProps<typeof Input> = {}) => (
    <Field id={`bp-${key}`} label={label} hint={hint} error={errors[key]}>
      <Input {...control(key)} {...extra} />
    </Field>
  );

  /** English + Hindi inputs side by side (stacked on phones) under one legend. */
  const bilingual = (base: Key, hiKey: Key, label: string, hint: string, multiline = false) => {
    const input = (key: Key, lang: 'en' | 'hi') => {
      const props = {
        ...control(key),
        'aria-describedby': errors[key] ? `bp-${key}-error` : `bp-${base}-hint`,
        lang,
      };
      return (
        <Field
          id={`bp-${key}`}
          label={<span className="font-normal text-muted-foreground">{t(`lang.${lang}`)}</span>}
          error={errors[key]}
        >
          {multiline ? <Textarea {...props} rows={3} /> : <Input {...props} />}
        </Field>
      );
    };
    return (
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm leading-none font-medium">{label}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {input(base, 'en')}
          {input(hiKey, 'hi')}
        </div>
        <p id={`bp-${base}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      </fieldset>
    );
  };

  const optional = (label: string) => (
    <>
      {label} <span className="font-normal text-muted-foreground">({t('optional')})</span>
    </>
  );

  return (
    <form onSubmit={save} noValidate className="grid max-w-4xl gap-4">
      <Group icon={BadgeIndianRupee} title={t('group.identity')} desc={t('group.identity.desc')}>
        {bilingual('legal_name', 'legal_name_hi', t('field.legalName'), t('field.legalName.hint'))}
        {bilingual('postal_address', 'postal_address_hi', t('field.address'), t('field.address.hint'), true)}
        <div className="sm:max-w-xs">
          {text('gstin', optional(t('field.gstin')), t('field.gstin.hint'), {
            autoCapitalize: 'characters',
            spellCheck: false,
            className: 'uppercase',
            maxLength: 15,
          })}
        </div>
      </Group>

      <Group icon={Headset} title={t('group.support')} desc={t('group.support.desc')}>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('support_email', t('field.supportEmail'), t('field.supportEmail.hint'), {
            type: 'email',
            inputMode: 'email',
            autoComplete: 'off',
          })}
          {text('support_phone', optional(t('field.supportPhone')), t('field.supportPhone.hint'), {
            type: 'tel',
            inputMode: 'tel',
            autoComplete: 'off',
          })}
        </div>
        {bilingual('support_hours', 'support_hours_hi', t('field.supportHours'), t('field.supportHours.hint'))}
        <div className="sm:max-w-xs">
          {text('response_hours', t('field.responseHours'), t('field.responseHours.hint'), {
            type: 'number',
            inputMode: 'numeric',
            min: 1,
            max: 720,
            step: 1,
          })}
        </div>
      </Group>

      <Group icon={ShieldCheck} title={t('group.grievance')} desc={t('group.grievance.desc')}>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('grievance_officer_name', optional(t('field.officerName')), t('field.officerName.hint'), {
            autoComplete: 'off',
          })}
          {text('grievance_officer_email', optional(t('field.officerEmail')), t('field.officerEmail.hint'), {
            type: 'email',
            inputMode: 'email',
            autoComplete: 'off',
          })}
          {text('grievance_officer_phone', optional(t('field.officerPhone')), t('field.officerPhone.hint'), {
            type: 'tel',
            inputMode: 'tel',
            autoComplete: 'off',
          })}
        </div>
      </Group>

      <Group icon={Scale} title={t('group.legal')} desc={t('group.legal.desc')}>
        {bilingual('jurisdiction_city', 'jurisdiction_city_hi', t('field.city'), t('field.city.hint'))}
        <div className="sm:max-w-xs">
          {text('legal_last_updated', t('field.updated'), t('field.updated.hint'), { type: 'date' })}
        </div>
      </Group>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
        <Button type="submit" disabled={busy || !dirty}>
          {busy ? tc('action.saving') : t('save')}
        </Button>
        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : dirty ? (
          <p className="text-sm text-muted-foreground">{t('unsaved')}</p>
        ) : null}
      </div>
    </form>
  );
}

function Group({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Scale;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-xl leading-tight" aria-hidden="true">
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="grid gap-5">{children}</div>
    </fieldset>
  );
}
