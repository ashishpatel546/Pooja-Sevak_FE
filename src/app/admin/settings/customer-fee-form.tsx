'use client';

import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { computeCustomerFee } from '@/lib/customer-fee';
import type { CustomerFeeConfig, CustomerFeeMode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Field } from '@/components/dashboard/field';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { useFormat, useT, type Translator } from '@/i18n';

// Mirrors backend/src/global-settings/customer-fee (DTO + cross-field checks).
const MAX_PERCENT = 30;
const MAX_RUPEES = 10_000;
const EXAMPLE_PRICE = 2100;

type Draft = { enabled: boolean; mode: CustomerFeeMode; value: string; min: string; max: string };
type Errors = Partial<Record<'value' | 'min' | 'max', string>>;

const toDraft = (c: CustomerFeeConfig): Draft => ({
  enabled: c.enabled,
  mode: c.mode,
  value: String(c.value),
  min: c.min_amount == null ? '' : String(c.min_amount),
  max: c.max_amount == null ? '' : String(c.max_amount),
});

const cap = (s: string) => (s.trim() === '' ? null : Number(s));

/** Draft → API body (caps only apply to a percentage fee). */
const toConfig = (d: Draft): CustomerFeeConfig => {
  const percent = d.mode === 'percent';
  return {
    enabled: d.enabled,
    mode: d.mode,
    value: Number(d.value.trim() || 0),
    min_amount: percent ? cap(d.min) : null,
    max_amount: percent ? cap(d.max) : null,
  };
};

function validate(d: Draft, t: Translator<'admin'>): Errors {
  const e: Errors = {};
  const c = toConfig(d);
  const limit = d.mode === 'percent' ? MAX_PERCENT : MAX_RUPEES;
  if (d.value.trim() === '' || !Number.isFinite(c.value) || c.value < 0 || c.value > limit) {
    e.value = d.mode === 'percent' ? t('settings.fee.err.percent') : t('settings.fee.err.flat');
  }
  if (d.mode === 'percent') {
    const bad = (n: number | null) => n != null && (!Number.isInteger(n) || n < 0 || n > MAX_RUPEES);
    if (bad(c.min_amount)) e.min = t('settings.fee.err.cap');
    if (bad(c.max_amount)) e.max = t('settings.fee.err.cap');
    if (!e.min && !e.max && c.min_amount != null && c.max_amount != null && c.min_amount > c.max_amount) {
      e.min = t('settings.fee.err.minMax');
    }
  }
  return e;
}

/** Admin → Settings: the platform fee charged to customers on top of the dakshina. */
export function CustomerFeeSection({ token }: { token: string | null }) {
  const t = useT('admin');
  const tc = useT('common');
  const fee = useApi<CustomerFeeConfig>('/admin/customer-fee', token);

  if (fee.loading) return <Skeleton className="h-72 rounded-2xl" />;
  if (fee.error && !fee.data) {
    return (
      <EmptyState
        icon={CircleAlert}
        title={t('settings.fee.loadError')}
        action={<Button onClick={fee.reload}>{tc('action.retry')}</Button>}
      >
        {fee.error}
      </EmptyState>
    );
  }
  return fee.data ? <CustomerFeeForm initial={fee.data} token={token} onSaved={(c) => fee.mutate(() => c)} /> : null;
}

function CustomerFeeForm({
  initial,
  token,
  onSaved,
}: {
  initial: CustomerFeeConfig;
  token: string | null;
  onSaved: (c: CustomerFeeConfig) => void;
}) {
  const t = useT('admin');
  const tc = useT('common');
  const f = useFormat();
  const [saved, setSaved] = useState<Draft>(() => toDraft(initial));
  const [draft, setDraft] = useState<Draft>(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== saved[k]);
  const percent = draft.mode === 'percent';

  const update = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    // Re-check as the admin fixes a field that already shows an error.
    if (Object.values(errors).some(Boolean)) setErrors(validate(next, t));
  };

  const live = validate(draft, t);
  const exampleFee = Object.values(live).some(Boolean) ? null : computeCustomerFee(EXAMPLE_PRICE, toConfig(draft));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(live);
    if (Object.values(live).some(Boolean)) return;
    setBusy(true);
    try {
      const result = await api<CustomerFeeConfig>('/admin/customer-fee', {
        method: 'PUT',
        token,
        body: toConfig(draft),
      });
      const next = toDraft(result);
      setSaved(next);
      setDraft(next);
      onSaved(result);
      toast.success(t('settings.fee.saved'));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const number = (key: 'value' | 'min' | 'max', label: string, hint?: string, suffix?: string) => (
    <Field id={`fee-${key}`} label={label} hint={hint} error={errors[key]}>
      <div className="relative">
        <Input
          id={`fee-${key}`}
          type="number"
          inputMode="decimal"
          min={0}
          step={key === 'value' && percent ? 0.5 : 1}
          value={draft[key]}
          onChange={(e) => update({ [key]: e.target.value })}
          disabled={!draft.enabled}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `fee-${key}-error` : hint ? `fee-${key}-hint` : undefined}
          className={suffix ? 'pr-8' : undefined}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );

  return (
    <form onSubmit={save} noValidate className="rounded-2xl border bg-card p-5">
      <h2 className="text-xl leading-tight">{t('settings.fee.title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('settings.fee.desc')}</p>

      <div className="mt-4 grid gap-4">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="size-5 accent-primary"
          />
          {t('settings.fee.enabled')}
        </label>

        <fieldset disabled={!draft.enabled} className="grid gap-2 disabled:opacity-60">
          <legend className="mb-2 text-sm leading-none font-medium">{t('settings.fee.mode')}</legend>
          <div className="flex flex-wrap gap-2">
            {(['percent', 'flat'] as const).map((m) => (
              <label
                key={m}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm',
                  'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                  draft.mode === m && 'border-primary bg-accent/40',
                )}
              >
                <input
                  type="radio"
                  name="fee-mode"
                  value={m}
                  checked={draft.mode === m}
                  onChange={() => update({ mode: m })}
                  className="accent-primary"
                />
                {t(`settings.fee.mode.${m}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className={cn('grid gap-4', percent && 'sm:grid-cols-3')}>
          {number(
            'value',
            percent ? t('settings.fee.label.percent') : t('settings.fee.label.flat'),
            percent ? t('settings.fee.hint.percent') : t('settings.fee.hint.flat'),
            percent ? '%' : undefined,
          )}
          {percent && number('min', t('settings.fee.min'), t('settings.fee.capHint'))}
          {percent && number('max', t('settings.fee.max'), t('settings.fee.capHint'))}
        </div>

        <p className="rounded-lg bg-muted px-3 py-2 text-sm" aria-live="polite">
          <span className="font-medium">{t('settings.fee.exampleTitle')}: </span>
          {!draft.enabled
            ? t('settings.fee.exampleOff', { price: f.inr(EXAMPLE_PRICE) })
            : exampleFee == null
              ? '—'
              : t('settings.fee.example', {
                  price: f.inr(EXAMPLE_PRICE),
                  fee: f.inr(exampleFee),
                  total: f.inr(EXAMPLE_PRICE + exampleFee),
                })}
        </p>

        <Button type="submit" disabled={busy || !dirty} className="justify-self-start">
          {busy ? tc('action.saving') : tc('action.save')}
        </Button>
      </div>
    </form>
  );
}
