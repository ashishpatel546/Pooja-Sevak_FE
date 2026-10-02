'use client';

import { useState } from 'react';
import { CircleAlert, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { GlobalSetting } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Field } from '@/components/dashboard/field';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { useT, type Translator } from '@/i18n';
import { BusinessProfileSection } from './business-profile-form';
import { CustomerFeeSection } from './customer-fee-form';

type Kind = 'percent' | 'minutes' | 'raw';

const kindOf = (key: string): Kind =>
  /commission/i.test(key) ? 'percent' : /buffer|minutes/i.test(key) ? 'minutes' : 'raw';

const titleOf = (key: string, t: Translator<'admin'>) => {
  if (/commission/i.test(key)) return t('settings.commission.title');
  if (/buffer/i.test(key)) return t('settings.buffer.title');
  const s = key.replace(/[_-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Known settings get a translated description; others show the server's text. */
const descriptionOf = (setting: GlobalSetting, t: Translator<'admin'>) => {
  if (/commission/i.test(setting.key)) return t('settings.commission.desc');
  if (/buffer/i.test(setting.key)) return t('settings.buffer.desc');
  return setting.description ?? t('settings.fallbackDesc');
};

/** Stored → shown. Commission is stored as 0–1 and shown as a percentage. */
const toDisplay = (kind: Kind, v: string) => {
  if (kind !== 'percent') return v;
  const n = Number(v);
  return Number.isFinite(n) ? String(Math.round(n * 10000) / 100) : v;
};

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const settings = useApi<GlobalSetting[]>('/admin/settings', token);
  const t = useT('admin');
  const tc = useT('common');

  return (
    <>
      <PageHeader title={t('settings.title')} description={t('settings.desc')} />
      {settings.loading ? (
        <div className="grid max-w-2xl gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : settings.error && !settings.data ? (
        <EmptyState icon={CircleAlert} title={t('settings.loadError')} action={<Button onClick={settings.reload}>{tc('action.retry')}</Button>}>
          {settings.error}
        </EmptyState>
      ) : !settings.data?.length ? (
        <EmptyState icon={Settings2} title={t('settings.empty.title')}>
          {t('settings.empty.body')}
        </EmptyState>
      ) : (
        <div className="grid max-w-2xl gap-4">
          {settings.data.map((s) => (
            <SettingRow
              key={s.key}
              setting={s}
              token={token}
              onSaved={(u) => settings.mutate((l) => (l ?? []).map((x) => (x.key === u.key ? u : x)))}
            />
          ))}
        </div>
      )}
      <div className="mt-4 max-w-2xl">
        <CustomerFeeSection token={token} />
      </div>
      <BusinessProfileSection token={token} />
    </>
  );
}

function SettingRow({
  setting,
  token,
  onSaved,
}: {
  setting: GlobalSetting;
  token: string | null;
  onSaved: (s: GlobalSetting) => void;
}) {
  const t = useT('admin');
  const tc = useT('common');
  const kind = kindOf(setting.key);
  const title = titleOf(setting.key, t);
  const [value, setValue] = useState(toDisplay(kind, String(setting.value ?? "")));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = `setting-${setting.key}`;
  const dirty = value !== toDisplay(kind, String(setting.value ?? ""));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    let stored = value.trim();
    if (kind === 'percent') {
      const n = Number(stored);
      if (stored === '' || !Number.isFinite(n) || n < 0 || n > 100) return setError(t('settings.err.percent'));
      stored = String(Math.round(n * 100) / 10000);
    } else if (kind === 'minutes') {
      const n = Number(stored);
      if (stored === '' || !Number.isInteger(n) || n < 0 || n > 720) return setError(t('settings.err.minutes'));
      stored = String(n);
    } else if (!stored) {
      return setError(t('settings.err.raw'));
    }
    setError(null);
    setBusy(true);
    try {
      const saved = await api<GlobalSetting>(`/admin/settings/${encodeURIComponent(setting.key)}`, {
        method: 'PUT',
        token,
        body: { value: stored },
      });
      const next = { ...setting, ...(saved && typeof saved === 'object' ? saved : {}), value: saved?.value ?? stored };
      onSaved(next);
      setValue(toDisplay(kind, String(next.value)));
      toast.success(t('settings.saved', { title }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="rounded-2xl border bg-card p-5">
      <h2 className="text-xl leading-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {descriptionOf(setting, t)} <code className="text-xs break-all">{setting.key}</code>
      </p>
      <div className="mt-4 grid gap-4">
        <Field
          id={id}
          label={t(`settings.label.${kind}`)}
          error={error}
          hint={
            kind === 'percent'
              ? t('settings.hint.percent')
              : kind === 'minutes'
                ? t('settings.hint.minutes')
                : undefined
          }
        >
          <div className="relative">
            <Input
              id={id}
              type={kind === 'raw' ? 'text' : 'number'}
              inputMode={kind === 'raw' ? undefined : 'decimal'}
              step={kind === 'percent' ? 0.5 : kind === 'minutes' ? 5 : undefined}
              min={kind === 'raw' ? undefined : 0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : `${id}-hint`}
              className={kind === 'percent' ? 'pr-8' : undefined}
            />
            {kind === 'percent' && (
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" aria-hidden="true">
                %
              </span>
            )}
          </div>
        </Field>
        <Button type="submit" disabled={busy || !dirty} className="justify-self-start">
          {busy ? tc('action.saving') : tc('action.save')}
        </Button>
      </div>
    </form>
  );
}
