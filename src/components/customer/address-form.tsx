'use client';

import { useId, useState } from 'react';
import { Check, Crosshair, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { findQuickCity, getCurrentPosition } from '@/lib/location';
import type { Address, AddressInput, Coordinates } from '@/lib/types';
import { cn } from '@/lib/utils';
import { pick, useLocale, useT, type Translator } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { errorMessage } from './use-api';

type Fields = {
  label: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pin_code: string;
  is_default: boolean;
};
type Errors = Partial<Record<keyof Fields | 'coords', string>>;

const PIN_RE = /^[1-9]\d{5}$/;

function validate(f: Fields, coords: Coordinates | null, t: Translator<'customer'>): Errors {
  const e: Errors = {};
  if (!f.label.trim()) e.label = t('address.err.label');
  if (!f.address_line_1.trim()) e.address_line_1 = t('address.err.line1');
  if (!f.city.trim()) e.city = t('address.err.city');
  if (!f.state.trim()) e.state = t('address.err.state');
  if (!PIN_RE.test(f.pin_code.trim())) e.pin_code = t('address.err.pin');
  if (!coords) e.coords = t('address.err.coords');
  return e;
}

/** Create or edit an address. Calls POST/PUT /addresses itself. */
export function AddressForm({
  initial,
  onSaved,
  onCancel,
  submitLabel,
  defaultChecked = false,
}: {
  initial?: Address | null;
  onSaved: (address: Address) => void;
  onCancel?: () => void;
  submitLabel?: string;
  defaultChecked?: boolean;
}) {
  const { token } = useAuth();
  const t = useT('customer');
  const tc = useT('common');
  const { locale } = useLocale();
  const uid = useId();
  const [f, setF] = useState<Fields>({
    label: initial?.label ?? t('address.defaultLabel'),
    address_line_1: initial?.address_line_1 ?? '',
    address_line_2: initial?.address_line_2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    pin_code: initial?.pin_code ?? '',
    is_default: initial?.is_default ?? defaultChecked,
  });
  const [coords, setCoords] = useState<Coordinates | null>(
    initial?.location_coordinates
      ? { lat: Number(initial.location_coordinates.lat), lng: Number(initial.location_coordinates.lng) }
      : null,
  );
  const [coordSource, setCoordSource] = useState<'saved' | 'gps' | 'city' | null>(initial ? 'saved' : null);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    const next = { ...f, [k]: v };
    setF(next);
    if (touched) setErrors(validate(next, coords, t));
  };

  const updateCoords = (c: Coordinates, src: 'gps' | 'city') => {
    setCoords(c);
    setCoordSource(src);
    if (touched) setErrors(validate(f, c, t));
  };

  const locate = async () => {
    setLocating(true);
    try {
      updateCoords(await getCurrentPosition(), 'gps');
    } catch (e) {
      toast.error(errorMessage(e, t('location.error.unavailable')));
    } finally {
      setLocating(false);
    }
  };

  const cityMatch = findQuickCity(f.city);
  const cityMatchName = cityMatch ? pick(cityMatch, 'name', locale) : f.city;

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTouched(true);
    const errs = validate(f, coords, t);
    setErrors(errs);
    if (Object.keys(errs).length || !coords) {
      const first = Object.keys(errs)[0];
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    const body: AddressInput = {
      label: f.label.trim(),
      address_line_1: f.address_line_1.trim(),
      ...(f.address_line_2.trim() ? { address_line_2: f.address_line_2.trim() } : {}),
      city: f.city.trim(),
      state: f.state.trim(),
      pin_code: f.pin_code.trim(),
      location_coordinates: coords,
      is_default: f.is_default,
    };
    setSaving(true);
    try {
      const saved = await api<Address>(initial ? `/addresses/${initial.id}` : '/addresses', {
        method: initial ? 'PUT' : 'POST',
        token,
        body,
      });
      toast.success(initial ? t('address.updated') : t('address.saved'));
      onSaved(saved);
    } catch (e) {
      toast.error(errorMessage(e, t('address.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const field = (
    k: keyof Fields,
    label: string,
    props: React.ComponentProps<'input'> = {},
    optional = false,
  ) => (
    <div className="grid gap-2">
      <Label htmlFor={`${uid}-${k}`}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">{t('optional')}</span>}
      </Label>
      <Input
        id={`${uid}-${k}`}
        value={f[k] as string}
        onChange={(e) => set(k, e.target.value as never)}
        aria-invalid={!!errors[k] || undefined}
        aria-describedby={errors[k] ? `${uid}-${k}-err` : undefined}
        {...props}
      />
      {errors[k] && (
        <p id={`${uid}-${k}-err`} className="text-sm text-destructive">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {field('label', t('address.name'), { placeholder: t('address.namePh'), autoComplete: 'off' })}
      {field('address_line_1', t('address.line1'), {
        placeholder: t('address.line1Ph'),
        autoComplete: 'address-line1',
      })}
      {field(
        'address_line_2',
        t('address.line2'),
        { placeholder: t('address.line2Ph'), autoComplete: 'address-line2' },
        true,
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {field('city', t('address.city'), { autoComplete: 'address-level2' })}
        {field('state', t('address.state'), { autoComplete: 'address-level1' })}
      </div>
      {field('pin_code', t('address.pin'), {
        inputMode: 'numeric',
        maxLength: 6,
        autoComplete: 'postal-code',
        placeholder: '226010',
        className: 'sm:max-w-40',
      })}

      <fieldset
        className={cn('grid gap-3 rounded-xl border bg-muted/40 p-4', errors.coords && 'border-destructive/60')}
        aria-describedby={errors.coords ? `${uid}-coords-err` : undefined}
      >
        <legend className="px-1 text-sm font-medium">{t('address.coordsLegend')}</legend>
        <p className="text-sm text-muted-foreground">{t('address.coordsHint')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            id={`${uid}-coords`}
            type="button"
            variant="outline"
            onClick={locate}
            disabled={locating}
          >
            {locating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Crosshair aria-hidden="true" />}
            {locating ? t('location.finding') : t('location.useMine')}
          </Button>
          {cityMatch && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => updateCoords({ lat: cityMatch.lat, lng: cityMatch.lng }, 'city')}
            >
              <MapPin aria-hidden="true" />
              {t('address.useCityCentre', { city: cityMatchName })}
            </Button>
          )}
        </div>
        <p role="status" aria-live="polite" className="text-sm">
          {coords ? (
            <span className="inline-flex flex-wrap items-center gap-x-1.5 text-tulsi">
              <Check className="size-4" aria-hidden="true" />
              {coordSource === 'gps'
                ? t('address.fromDevice')
                : coordSource === 'city'
                  ? t('address.approx', { city: cityMatchName })
                  : t('address.locationSaved')}
              <span className="text-muted-foreground tabular-nums">
                ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{t('address.tip')}</span>
          )}
        </p>
        {errors.coords && (
          <p id={`${uid}-coords-err`} className="text-sm text-destructive">
            {errors.coords}
          </p>
        )}
      </fieldset>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={f.is_default}
          onChange={(e) => set('is_default', e.target.checked)}
          className="size-5 accent-primary"
        />
        {t('address.makeDefault')}
      </label>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {tc('action.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          {saving ? tc('action.saving') : (submitLabel ?? t('address.submit'))}
        </Button>
      </div>
    </form>
  );
}
