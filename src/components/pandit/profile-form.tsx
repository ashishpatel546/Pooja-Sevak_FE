'use client';

import { useMemo, useState } from 'react';
import { Clock, LocateFixed, MapPin, Sparkles, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Coordinates, PanditProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, Panel } from '@/components/dashboard/field';
import { Switch } from '@/components/dashboard/switch';
import { errorMessage } from '@/components/dashboard/use-api';
import { useT, type Translator } from '@/i18n';
import { LanguageChips } from './language-chips';

/** "6:00 am" in English; "सुबह 6 बजे" in Hindi (the way pandits say it). */
function hourLabel(h: number, t: Translator<'pandit'>) {
  if (h === 0 || h === 24) return t('hour.midnight');
  if (h === 12) return t('hour.noon');
  const hr = ((h + 11) % 12) + 1;
  if (h < 4) return t('hour.lateNight', { h: hr });
  if (h < 12) return t('hour.morning', { h: hr });
  if (h < 16) return t('hour.afternoon', { h: hr });
  if (h < 19) return t('hour.evening', { h: hr });
  return t('hour.night', { h: hr });
}

const SectionIcon = ({ icon: Icon }: { icon: typeof UserRound }) => (
  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
    <Icon className="size-5" aria-hidden="true" />
  </span>
);

function formatCoord(c: Coordinates | null, t: Translator<'pandit'>) {
  if (!c || (Number(c.lat) === 0 && Number(c.lng) === 0)) return null;
  const lat = Number(c.lat);
  const lng = Number(c.lng);
  return t('form.coords', {
    lat: Math.abs(lat).toFixed(4),
    ns: lat >= 0 ? t('form.dir.n') : t('form.dir.s'),
    lng: Math.abs(lng).toFixed(4),
    ew: lng >= 0 ? t('form.dir.e') : t('form.dir.w'),
  });
}

/** About, service area and availability — saved together with PUT /pandits/me/profile. */
export function ProfileForm({
  profile,
  token,
  onSaved,
}: {
  profile: PanditProfile;
  token: string | null;
  onSaved: (p: PanditProfile) => void;
}) {
  const t = useT('pandit');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [experience, setExperience] = useState(String(Number(profile.experience_years) || 0));
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const [tradition, setTradition] = useState(profile.tradition ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [coords, setCoords] = useState<Coordinates | null>(profile.home_coordinates ?? null);
  const [radius, setRadius] = useState(Number(profile.max_travel_distance_km) || 15);
  const [buffer, setBuffer] = useState(String(Number(profile.travel_buffer_minutes) || 60));
  const [startHour, setStartHour] = useState(Number(profile.work_start_hour ?? 6));
  const [endHour, setEndHour] = useState(Number(profile.work_end_hour ?? 20));
  const [online, setOnline] = useState(!!profile.offers_online);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error(t('form.geo.unsupported'));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success(t('form.geo.captured'));
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? t('form.geo.denied')
            : t('form.geo.failed'),
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const exp = Number(experience);
    const buf = Number(buffer);
    if (!Number.isFinite(exp) || exp < 0 || exp > 80) errs.experience = t('form.err.experience');
    if (!Number.isFinite(buf) || buf < 0 || buf > 720) errs.buffer = t('form.err.buffer');
    if (endHour <= startHour) errs.hours = t('form.err.hours');
    if (!Number.isFinite(radius) || radius < 1 || radius > 200) errs.radius = t('form.err.radius');
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error(t('form.checkFields'));
      return;
    }
    setSaving(true);
    try {
      const updated = await api<PanditProfile>('/pandits/me/profile', {
        method: 'PUT',
        token,
        body: {
          bio: bio.trim(),
          experience_years: exp,
          languages,
          tradition: tradition.trim() || null,
          city: city.trim() || null,
          ...(coords ? { home_coordinates: { lat: Number(coords.lat), lng: Number(coords.lng) } } : {}),
          max_travel_distance_km: radius,
          travel_buffer_minutes: buf,
          work_start_hour: startHour,
          work_end_hour: endHour,
          offers_online: online,
        },
      });
      onSaved(updated);
      toast.success(t('form.saved'));
    } catch (err) {
      toast.error(errorMessage(err, t('form.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const coordText = formatCoord(coords, t);

  return (
    <form onSubmit={save} noValidate className="grid gap-6">
      <Panel
        title={t('form.about.title')}
        description={t('form.about.desc')}
        icon={<SectionIcon icon={UserRound} />}
      >
        <div className="grid gap-5">
          <Field id="bio" label={t('form.bio')} hint={t('form.bioHint')}>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('form.bioPlaceholder')}
              maxLength={1500}
              aria-describedby="bio-hint"
              className="min-h-32"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="experience" label={t('form.experience')} error={errors.experience}>
              <Input
                id="experience"
                type="number"
                inputMode="numeric"
                min={0}
                max={80}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                aria-invalid={!!errors.experience}
              />
            </Field>
            <Field id="tradition" label={t('form.tradition')} hint={t('form.traditionHint')}>
              <Input
                id="tradition"
                value={tradition}
                onChange={(e) => setTradition(e.target.value)}
                aria-describedby="tradition-hint"
              />
            </Field>
            <Field id="city" label={t('form.city')}>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
            </Field>
          </div>
          <div className="grid gap-2">
            <span id="languages-label" className="text-sm font-medium">
              {t('form.languages')}
            </span>
            <LanguageChips value={languages} onChange={setLanguages} labelledBy="languages-label" />
          </div>
        </div>
      </Panel>

      <Panel
        title={t('form.area.title')}
        description={t('form.area.desc')}
        icon={<SectionIcon icon={MapPin} />}
      >
        <div className="grid gap-6">
          <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t('form.home')}</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {coordText ?? t('form.homeUnset')}
              </p>
              {coordText && coords && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${Number(coords.lat)},${Number(coords.lng)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t('form.checkMap')}
                </a>
              )}
            </div>
            <Button type="button" variant="outline" onClick={detectLocation} disabled={locating} className="shrink-0 self-start sm:self-auto">
              <LocateFixed aria-hidden="true" />
              {locating ? t('form.locating') : coordText ? t('form.updateLocation') : t('form.useLocation')}
            </Button>
          </div>

          <Field
            id="radius"
            label={
              <>
                {t('form.radius')}{' '}
                <span className="ml-auto font-heading text-lg text-heading tabular-nums">{t('form.radiusValue', { km: radius })}</span>
              </>
            }
            error={errors.radius}
            hint={t('form.radiusHint')}
          >
            <div className="flex items-center gap-4">
              <input
                id="radius"
                type="range"
                min={1}
                max={100}
                step={1}
                value={Math.min(radius, 100)}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="h-11 min-w-0 flex-1 accent-[var(--primary)]"
                aria-describedby="radius-hint"
                aria-valuetext={t('form.radiusValueText', { km: radius })}
              />
              <Input
                aria-label={t('form.radiusInput')}
                type="number"
                inputMode="numeric"
                min={1}
                max={200}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-24 shrink-0"
              />
            </div>
          </Field>

          <Field
            id="buffer"
            label={t('form.buffer')}
            error={errors.buffer}
            hint={t('form.bufferHint')}
          >
            <Input
              id="buffer"
              type="number"
              inputMode="numeric"
              min={0}
              max={720}
              step={5}
              value={buffer}
              onChange={(e) => setBuffer(e.target.value)}
              aria-invalid={!!errors.buffer}
              aria-describedby={errors.buffer ? 'buffer-error' : 'buffer-hint'}
              className="max-w-40"
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title={t('form.hours.title')}
        description={t('form.hours.desc')}
        icon={<SectionIcon icon={Clock} />}
      >
        <div className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <HourSelect id="start-hour" label={t('form.dayBegins')} value={startHour} onChange={setStartHour} />
            <HourSelect id="end-hour" label={t('form.dayEnds')} value={endHour} onChange={setEndHour} />
            {errors.hours && (
              <p role="alert" className="text-sm text-destructive sm:col-span-2">
                {errors.hours}
              </p>
            )}
          </div>
          <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
            <div className="min-w-0">
              <p id="online-label" className="flex items-center gap-2 font-medium">
                <Sparkles className="size-4 shrink-0 text-diya" aria-hidden="true" /> {t('form.online')}
              </p>
              <p id="online-hint" className="text-sm text-muted-foreground">
                {t('form.onlineHint')}
              </p>
            </div>
            <Switch
              checked={online}
              onCheckedChange={setOnline}
              aria-labelledby="online-label"
              aria-describedby="online-hint"
              className="mt-1"
            />
          </div>
        </div>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button type="submit" size="lg" disabled={saving} className="w-full sm:w-auto">
          {saving ? t('form.saving') : t('form.save')}
        </Button>
      </div>
    </form>
  );
}

function HourSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (h: number) => void;
}) {
  const t = useT('pandit');
  const hours = useMemo(
    () => Array.from({ length: 25 }, (_, h) => ({ value: String(h), label: hourLabel(h, t) })),
    [t],
  );
  return (
    <Field id={id} label={label}>
      <Select items={hours} value={String(value)} onValueChange={(v) => v != null && onChange(Number(v))}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h.value} value={h.value}>
              {h.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
