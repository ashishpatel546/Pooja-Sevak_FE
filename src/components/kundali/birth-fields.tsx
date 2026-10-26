'use client';

import { useId, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import { api } from '@/lib/api';
import type { Gender } from '@/lib/kundali';
import { IST_ZONE, placeName, ZONE_CITIES } from '@/lib/place';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type BirthDraft = {
  name: string;
  gender: Gender | '';
  date: string;
  time: string;
  place: { label: string; lat: number; lng: number; tz: string } | null;
};

export const EMPTY_BIRTH: BirthDraft = { name: '', gender: '', date: '', time: '', place: null };

type PlaceResult = { label: string; detail: string | null; lat: number; lng: number };

const ABROAD = ZONE_CITIES.filter((c) => c.region === 'abroad');

export const selectClass =
  'h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

/** Birth place: India by search (OpenStreetMap via our API, on submit only), abroad by nearest city. */
function PlacePicker({
  value,
  onChange,
  invalid,
}: {
  value: BirthDraft['place'];
  onChange: (p: BirthDraft['place']) => void;
  invalid: boolean;
}) {
  const t = useT('kundali');
  const { locale } = useLocale();
  const id = useId();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (value) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border bg-accent/30 px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 break-words">{t('form.placeChosen', { place: value.label })}</span>
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          {t('form.placeChange')}
        </Button>
      </div>
    );
  }

  const search = async () => {
    const text = q.trim();
    if (text.length < 2 || busy) return;
    setBusy(true);
    setMessage(null);
    setResults(null);
    try {
      const list = await api<PlaceResult[]>('/places/search', { query: { q: text, lang: locale } });
      setResults(list);
      if (list.length === 0) setMessage(t('form.placeNone'));
    } catch {
      setMessage(t('form.placeError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div>
        <Label htmlFor={`${id}-q`} className="mb-1.5 text-sm font-normal text-muted-foreground">
          {t('form.placeSearch')}
        </Label>
        {/* Not a nested <form>: Enter runs the search instead of submitting the outer form. */}
        <div className="flex gap-2">
          <Input
            id={`${id}-q`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void search();
              }
            }}
            placeholder={t('form.placePlaceholder')}
            autoComplete="off"
            enterKeyHint="search"
            maxLength={100}
            aria-invalid={invalid || undefined}
            className="h-11 min-w-0 flex-1 text-base"
          />
          <Button type="button" size="lg" variant="outline" onClick={() => void search()} disabled={busy || q.trim().length < 2}>
            {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}
            <span className="sr-only sm:not-sr-only">{busy ? t('form.placeSearching') : t('form.placeSearchButton')}</span>
          </Button>
        </div>
        <p role="status" aria-live="polite" className={cn('text-sm', message ? 'mt-2 text-muted-foreground' : 'sr-only')}>
          {message ?? ''}
        </p>
        {results && results.length > 0 && (
          <ul className="mt-2 grid gap-2">
            {results.map((r) => (
              <li key={`${r.lat},${r.lng}`}>
                <button
                  type="button"
                  onClick={() => onChange({ label: r.detail ? `${r.label}, ${r.detail}` : r.label, lat: r.lat, lng: r.lng, tz: IST_ZONE })}
                  className="flex min-h-11 w-full flex-col items-start rounded-lg border bg-card px-3 py-2 text-left hover:border-primary/50 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="font-medium">{r.label}</span>
                  {r.detail && <span className="text-sm text-muted-foreground">{r.detail}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <Label htmlFor={`${id}-abroad`} className="mb-1.5 text-sm font-normal text-muted-foreground">
          {t('form.abroad')}
        </Label>
        <select
          id={`${id}-abroad`}
          className={selectClass}
          value=""
          onChange={(e) => {
            const c = ABROAD.find((x) => x.id === e.target.value);
            if (c) onChange({ label: placeName({ label: c.label_en, label_hi: c.label_hi }, locale) ?? c.label_en, lat: c.lat, lng: c.lng, tz: c.tz });
          }}
        >
          <option value="">{t('form.abroadNone')}</option>
          {ABROAD.map((c) => (
            <option key={c.id} value={c.id}>
              {placeName({ label: c.label_en, label_hi: c.label_hi }, locale) ?? c.label_en}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function BirthFields({
  value,
  onChange,
  legend,
  showErrors,
  maxDate,
}: {
  value: BirthDraft;
  onChange: (v: BirthDraft) => void;
  legend?: string;
  showErrors: boolean;
  maxDate: string;
}) {
  const t = useT('kundali');
  const id = useId();
  const set = <K extends keyof BirthDraft>(k: K, v: BirthDraft[K]) => onChange({ ...value, [k]: v });
  const missing = (v: unknown) => showErrors && !v;

  return (
    <fieldset className="grid min-w-0 gap-4">
      {legend && <legend className="mb-1 font-heading text-xl text-heading">{legend}</legend>}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${id}-name`}>{t('form.name')}</Label>
          <Input
            id={`${id}-name`}
            value={value.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('form.namePlaceholder')}
            autoComplete="off"
            maxLength={80}
            required
            aria-invalid={missing(value.name.trim()) || undefined}
            className="h-11 text-base"
          />
        </div>
        <fieldset className="grid content-start gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">{t('form.gender')}</legend>
          <div className="flex gap-2">
            {(['male', 'female', 'other'] as const).map((g) => (
              <label
                key={g}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center rounded-lg border px-3 text-base has-checked:border-primary has-checked:bg-accent/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  missing(value.gender) && 'border-destructive',
                )}
              >
                <input
                  type="radio"
                  name={`${id}-gender`}
                  value={g}
                  checked={value.gender === g}
                  onChange={() => set('gender', g)}
                  className="sr-only"
                  required
                />
                {t(`gender.${g}`)}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${id}-date`}>{t('form.date')}</Label>
          <Input
            id={`${id}-date`}
            type="date"
            min="1901-01-01"
            max={maxDate}
            value={value.date}
            onChange={(e) => set('date', e.target.value)}
            required
            aria-invalid={missing(value.date) || undefined}
            className="h-11 text-base"
          />
        </div>
        <div className="grid content-start gap-1.5">
          <Label htmlFor={`${id}-time`}>{t('form.time')}</Label>
          <Input
            id={`${id}-time`}
            type="time"
            value={value.time}
            onChange={(e) => set('time', e.target.value)}
            required
            aria-describedby={`${id}-time-hint`}
            aria-invalid={missing(value.time) || undefined}
            className="h-11 text-base"
          />
          <p id={`${id}-time-hint`} className="text-sm text-muted-foreground">
            {t('form.timeHint')}
          </p>
        </div>
      </div>
      <div className="grid content-start gap-1.5">
        <p className="text-sm font-medium">{t('form.place')}</p>
        <PlacePicker value={value.place} onChange={(p) => set('place', p)} invalid={missing(value.place)} />
        {missing(value.place) && <p className="text-sm text-destructive">{t('form.placeRequired')}</p>}
      </div>
    </fieldset>
  );
}

export function isComplete(b: BirthDraft): boolean {
  return !!(b.name.trim() && b.gender && b.date && b.time && b.place);
}

export function toPayload(b: BirthDraft) {
  return { name: b.name.trim(), gender: b.gender, date: b.date, time: b.time, place: b.place! };
}
