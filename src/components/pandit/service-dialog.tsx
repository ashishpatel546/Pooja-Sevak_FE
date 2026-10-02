'use client';

import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { PanditServiceItem, SamagriList, ServiceDefinition } from '@/lib/types';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, FileText, ImageIcon, Paperclip, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PujaIcon } from '@/components/common/puja-icon';
import { Field } from '@/components/dashboard/field';
import { Switch } from '@/components/dashboard/switch';
import { errorMessage } from '@/components/dashboard/use-api';
import { useCategoryLabel } from '@/components/dashboard/category';
import { SamagriListButton } from '@/components/common/samagri-list';

/** Same limits as the API (POST /pandits/me/services[/:id/samagri-list]). */
const MAX_LIST_BYTES = 10 * 1024 * 1024;
const MAX_KIT_PRICE = 100_000;
const LIST_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif';
const LIST_TYPES = new Set(LIST_ACCEPT.split(','));

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  token: string | null;
  /** Editing an existing puja, or adding a new one when undefined. */
  service?: PanditServiceItem;
  /** Catalog entries the pandit hasn't added yet (add mode). */
  available?: ServiceDefinition[];
  onSaved: (s: PanditServiceItem) => void;
};

/** Add / edit one of the pandit's pujas. Mount with a `key` so state resets per open. */
export function ServiceDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {props.open && <ServiceForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function ServiceForm({ onOpenChange, token, service, available = [], onSaved }: Props) {
  const t = useT('pandit');
  const tc = useT('common');
  const td = useT('dashboard');
  const f = useFormat();
  const { locale } = useLocale();
  const categoryLabel = useCategoryLabel();
  const editing = !!service;
  const [defId, setDefId] = useState<string>(service?.service_definition_id ?? '');
  const def = service?.service_definition ?? available.find((d) => d.id === defId);
  const defName = def ? pick(def, 'name', locale) : t('puja.fallback');

  const [price, setPrice] = useState(service ? String(Number(service.standard_price)) : '');
  const [duration, setDuration] = useState(service ? String(Number(service.standard_duration_minutes)) : '');
  const [lighter, setLighter] = useState(!!service?.offers_lighter_mode);
  const [lPrice, setLPrice] = useState(service?.lighter_mode_price != null ? String(Number(service.lighter_mode_price)) : '');
  const [lDuration, setLDuration] = useState(
    service?.lighter_mode_duration_minutes != null ? String(Number(service.lighter_mode_duration_minutes)) : '',
  );
  const [kit, setKit] = useState(!!service?.offers_samagri_kit);
  const [kitPrice, setKitPrice] = useState(service?.samagri_kit_price != null ? String(Number(service.samagri_kit_price)) : '');
  // The shorter version has its own samagri list and kit price.
  const [lKitPrice, setLKitPrice] = useState(
    service?.lighter_samagri_kit_price != null ? String(Number(service.lighter_samagri_kit_price)) : '',
  );
  const [listFile, setListFile] = useState<File | null>(null);
  const [lListFile, setLListFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const ts = useT('samagri');

  /** Localized message for a rejected samagri list upload. */
  const listFailure = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.status === 413) return ts('svc.err.listSize');
      if (err.status === 503) return ts('svc.err.listUnavailable');
      const m = err.message.toLowerCase();
      if (err.status === 400 && m.includes('shorter version first')) return ts('svc.err.lighterListRequired');
      if (err.status === 422) {
        if (m.includes('shorter version')) return ts('svc.err.lighterListRequired');
        if (m.includes('too many pages')) return ts('svc.err.listPages');
        if (m.includes('password')) return ts('svc.err.listEncrypted');
        if (m.includes('could not open this pdf')) return ts('svc.err.listPdf');
        if (m.includes('could not read this image')) return ts('svc.err.listImage');
        if (m.includes('samagri list')) return ts('svc.err.listType');
      }
    }
    return null;
  };

  /** A file chosen for the full (`list`) or shorter-version (`lList`) samagri list. */
  const onListFile = (field: 'list' | 'lList') => (file: File) => {
    // Some Android pickers report no type; the server checks the bytes anyway.
    const err =
      file.type && !LIST_TYPES.has(file.type.toLowerCase())
        ? ts('svc.err.listType')
        : file.size > MAX_LIST_BYTES
          ? ts('svc.err.listSize')
          : null;
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
    (field === 'list' ? setListFile : setLListFile)(err ? null : file);
  };

  const [query, setQuery] = useState('');
  const q = normalize(query);

  const grouped = useMemo(() => {
    const m = new Map<string, ServiceDefinition[]>();
    const name = (d: ServiceDefinition) => pick(d, 'name', locale);
    // Match either language, the slug and the deity, so "ganesh" and "गणेश" both find Ganesh Puja.
    const matches = (d: ServiceDefinition) =>
      !q ||
      [d.name, d.name_hi, d.slug.replace(/-/g, ' '), d.deity, d.category ? categoryLabel(d.category) : '']
        .some((v) => v && normalize(v).includes(q));
    for (const d of [...available].filter(matches).sort((a, b) => name(a).localeCompare(name(b), locale))) {
      const k = d.category ?? '';
      m.set(k, [...(m.get(k) ?? []), d]);
    }
    return [...m.entries()]
      .map(([k, defs]) => [k ? categoryLabel(k) : td('category.other'), defs] as const)
      .sort(([a], [b]) => a.localeCompare(b, locale));
  }, [available, locale, categoryLabel, td, q]);
  const shown = grouped.reduce((n, [, defs]) => n + defs.length, 0);

  const choose = (id: string) => {
    setDefId(id);
    const d = available.find((x) => x.id === id);
    if (d?.typical_duration_minutes && !duration) setDuration(String(d.typical_duration_minutes));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const p = Number(price);
    const d = Number(duration);
    if (!editing && !defId) errs.def = t('svc.err.def');
    if (!price || !Number.isFinite(p) || p <= 0) errs.price = t('svc.err.price');
    if (!duration || !Number.isInteger(d) || d < 15 || d > 1440) errs.duration = t('svc.err.duration');
    let lp: number | null = null;
    let ld: number | null = null;
    if (lighter) {
      lp = Number(lPrice);
      ld = Number(lDuration);
      if (!lPrice || !Number.isFinite(lp) || lp <= 0) errs.lPrice = t('svc.err.lPrice');
      else if (lp >= p) errs.lPrice = t('svc.err.lPriceHigh');
      if (!lDuration || !Number.isInteger(ld) || ld < 15) errs.lDuration = t('svc.err.lDuration');
      else if (ld >= d) errs.lDuration = t('svc.err.lDurationLong');
    }
    const kp = Number(kitPrice);
    const validKit = (v: string, n: number) => !!v && Number.isFinite(n) && n > 0 && n <= MAX_KIT_PRICE;
    if (kit && !validKit(kitPrice, kp)) errs.kitPrice = ts('svc.err.kitPrice');
    const lkp = Number(lKitPrice);
    if (kit && lighter && !validKit(lKitPrice, lkp)) errs.lKitPrice = ts('svc.err.lighterKitPrice');
    // The list is mandatory: new pujas need one, and older ones get one on save.
    if (!listFile && !service?.samagri_list) errs.list = errors.list ?? ts('svc.err.listRequired');
    // So is the shorter version's own list whenever that version is offered.
    if (lighter && !lListFile && !service?.lighter_samagri_list) {
      errs.lList = errors.lList ?? ts('svc.err.lighterListRequired');
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body = {
      standard_price: p,
      standard_duration_minutes: d,
      offers_lighter_mode: lighter,
      lighter_mode_price: lighter ? lp : null,
      lighter_mode_duration_minutes: lighter ? ld : null,
      offers_samagri_kit: kit,
      // Kept when switched off, so switching back on restores them.
      ...(validKit(kitPrice, kp) ? { samagri_kit_price: kp } : {}),
      ...(lighter && validKit(lKitPrice, lkp) ? { lighter_samagri_kit_price: lkp } : {}),
    };
    const upload = (file: File, mode: 'full' | 'lighter') => {
      const form = new FormData();
      form.append('file', file);
      return api<PanditServiceItem>(
        `/pandits/me/services/${service!.id}/samagri-list${mode === 'lighter' ? '?mode=lighter' : ''}`,
        { method: 'POST', token, body: form },
      );
    };
    setBusy(true);
    let saved: PanditServiceItem | null = null;
    // Which list a failed upload belongs to (for the inline error).
    let failing: 'list' | 'lList' | 'both' = 'list';
    try {
      if (editing) {
        // The shorter version's list goes first: switching that version on requires it.
        if (lighter && lListFile) {
          failing = 'lList';
          saved = await upload(lListFile, 'lighter');
        }
        failing = 'list';
        saved = await api<PanditServiceItem>(`/pandits/me/services/${service!.id}`, { method: 'PUT', token, body });
        if (listFile) saved = await upload(listFile, 'full');
      } else {
        // One multipart request: the puja is only created together with its list.
        const form = new FormData();
        form.append('service_definition_id', defId);
        for (const [k, v] of Object.entries(body)) {
          if (v != null) form.append(k, String(v));
        }
        form.append('file', listFile!);
        if (lighter) {
          form.append('lighter_file', lListFile!);
          failing = 'both';
        }
        saved = await api<PanditServiceItem>('/pandits/me/services', { method: 'POST', token, body: form });
      }
      onSaved({ ...saved, service_definition: saved.service_definition ?? def });
      toast.success(editing ? t('svc.saved') : t('svc.added', { puja: defName }));
      onOpenChange(false);
    } catch (err) {
      // Edit: the fields may already be saved even if the new list was refused.
      if (saved) onSaved({ ...saved, service_definition: saved.service_definition ?? def });
      const listErr = listFailure(err);
      if (listErr) {
        // One request carries both files on add, so the error may be either one's.
        const lighterErr = err instanceof ApiError && err.message.toLowerCase().includes('shorter version');
        const fields = lighterErr ? ['lList'] : failing === 'both' ? ['list', 'lList'] : [failing];
        setErrors((e) => ({ ...e, ...Object.fromEntries(fields.map((k) => [k, listErr])) }));
      }
      toast.error(listErr ?? errorMessage(err));
    } finally {
      setBusy(false);
    }
  };


  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-2xl">{editing ? t('svc.title.edit', { puja: defName }) : t('svc.title.add')}</DialogTitle>
        <DialogDescription>{t('svc.desc')}</DialogDescription>
      </DialogHeader>

      {editing ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <PujaIcon category={def?.category} size="sm" />
          <div className="min-w-0">
            <p className="font-medium">{defName}</p>
            {def?.category && <p className="text-sm text-muted-foreground">{categoryLabel(def.category)}</p>}
          </div>
        </div>
      ) : (
        <Field id="svc-def" label={t('svc.puja')} error={errors.def}>
          {available.length ? (
            <div className="grid gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="svc-def"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  placeholder={t('svc.searchPlaceholder')}
                  aria-label={t('svc.search')}
                  aria-controls="svc-def-list"
                  aria-invalid={!!errors.def}
                  autoComplete="off"
                  className="pl-9"
                />
              </div>
              <p className="sr-only" aria-live="polite">
                {q ? (shown ? t('svc.count', { count: shown }) : t('svc.noMatch', { q: query.trim() })) : ''}
              </p>
              <div
                id="svc-def-list"
                role="radiogroup"
                aria-label={t('svc.choose')}
                className="max-h-64 overflow-y-auto overscroll-contain rounded-lg border bg-card p-1"
              >
                {shown === 0 && (
                  <p className="px-3 py-4 text-sm text-muted-foreground">{t('svc.noMatch', { q: query.trim() })}</p>
                )}
                {grouped.map(([cat, defs]) => (
                  <div key={cat} role="group" aria-label={cat} className="py-1">
                    <p className="px-2.5 pt-1 pb-1.5 text-sm font-medium text-muted-foreground">{cat}</p>
                    {defs.map((d) => {
                      const selected = d.id === defId;
                      return (
                        <label
                          key={d.id}
                          className={cn(
                            'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm hover:bg-muted',
                            'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                            selected && 'bg-accent text-accent-foreground hover:bg-accent',
                          )}
                        >
                          <input
                            type="radio"
                            name="svc-def"
                            value={d.id}
                            checked={selected}
                            onChange={() => choose(d.id)}
                            className="sr-only"
                          />
                          <PujaIcon category={d.category} size="sm" />
                          <span className="min-w-0 flex-1 font-medium">{pick(d, 'name', locale)}</span>
                          {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('svc.allAdded')}</p>
          )}
        </Field>
      )}

      {def?.typical_duration_minutes ? (
        <p className="-mt-2 text-sm text-muted-foreground">
          {t('svc.typical', { duration: f.duration(def.typical_duration_minutes) })}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="svc-price" label={t('svc.price')} error={errors.price}>
          <Input
            id="svc-price"
            type="number"
            inputMode="numeric"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={!!errors.price}
            placeholder={t('svc.pricePlaceholder')}
          />
        </Field>
        <Field id="svc-duration" label={t('svc.duration')} error={errors.duration}>
          <Input
            id="svc-duration"
            type="number"
            inputMode="numeric"
            min={15}
            step={15}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            aria-invalid={!!errors.duration}
            placeholder={t('svc.durationPlaceholder')}
          />
        </Field>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p id="lighter-label" className="font-medium">
              {t('svc.lighter.title')}
            </p>
            <p id="lighter-hint" className="text-sm text-muted-foreground">
              {t('svc.lighter.hint')}
            </p>
          </div>
          <Switch
            checked={lighter}
            onCheckedChange={setLighter}
            aria-labelledby="lighter-label"
            aria-describedby="lighter-hint"
            className="mt-1"
          />
        </div>
        {lighter && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field id="svc-lprice" label={t('svc.lighter.price')} error={errors.lPrice}>
              <Input
                id="svc-lprice"
                type="number"
                inputMode="numeric"
                min={1}
                value={lPrice}
                onChange={(e) => setLPrice(e.target.value)}
                aria-invalid={!!errors.lPrice}
              />
            </Field>
            <Field id="svc-lduration" label={t('svc.lighter.duration')} error={errors.lDuration}>
              <Input
                id="svc-lduration"
                type="number"
                inputMode="numeric"
                min={15}
                step={15}
                value={lDuration}
                onChange={(e) => setLDuration(e.target.value)}
                aria-invalid={!!errors.lDuration}
              />
            </Field>
          </div>
        )}
        {lighter && (
          <ListPicker
            id="svc-llist"
            label={ts('svc.lighterList.label')}
            hint={ts('svc.lighterList.hint')}
            error={errors.lList}
            file={lListFile}
            current={service?.lighter_samagri_list ?? null}
            onPick={onListFile('lList')}
            pujaName={defName}
            modeLabel={ts('mode.lighterList')}
            className="mt-4 border-t pt-4"
          />
        )}
      </div>

      <ListPicker
        id="svc-list"
        label={lighter ? ts('svc.list.fullLabel') : ts('svc.list.label')}
        hint={ts('svc.list.hint')}
        error={errors.list}
        file={listFile}
        current={service?.samagri_list ?? null}
        onPick={onListFile('list')}
        pujaName={defName}
        modeLabel={lighter ? ts('mode.fullList') : undefined}
        className="rounded-xl border p-4"
      />

      <div className="rounded-xl border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p id="kit-label" className="font-medium">
              {ts('svc.kit.title')}
            </p>
            <p id="kit-hint" className="text-sm text-muted-foreground">
              {ts('svc.kit.hint')}
            </p>
          </div>
          <Switch
            checked={kit}
            onCheckedChange={setKit}
            aria-labelledby="kit-label"
            aria-describedby="kit-hint"
            className="mt-1"
          />
        </div>
        {kit && (
          <Field
            id="svc-kit-price"
            label={lighter ? ts('svc.kit.fullPrice') : ts('svc.kit.price')}
            hint={ts('svc.kit.priceHint')}
            error={errors.kitPrice}
            className="mt-4"
          >
            <Input
              id="svc-kit-price"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_KIT_PRICE}
              value={kitPrice}
              onChange={(e) => setKitPrice(e.target.value)}
              aria-invalid={!!errors.kitPrice}
              placeholder={ts('svc.kit.pricePlaceholder')}
            />
          </Field>
        )}
        {kit && lighter && (
          <Field
            id="svc-lkit-price"
            label={ts('svc.kit.lighterPrice')}
            hint={ts('svc.kit.lighterPriceHint')}
            error={errors.lKitPrice}
            className="mt-4"
          >
            <Input
              id="svc-lkit-price"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_KIT_PRICE}
              value={lKitPrice}
              onChange={(e) => setLKitPrice(e.target.value)}
              aria-invalid={!!errors.lKitPrice}
              placeholder={ts('svc.kit.lighterPricePlaceholder')}
            />
          </Field>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{t('svc.feeNote')}</p>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          {tc('action.cancel')}
        </Button>
        <Button type="submit" disabled={busy || (!editing && !available.length)}>
          {busy ? (listFile || (lighter && lListFile) ? ts('svc.list.uploading') : tc('action.saving')) : editing ? t('svc.save') : t('svc.add')}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * A samagri list upload control: the chosen file or the current list (with a
 * viewer link) and a choose/replace button. The file is checked by the parent.
 */
function ListPicker({
  id,
  label,
  hint,
  error,
  file,
  current,
  onPick,
  pujaName,
  modeLabel,
  className,
}: {
  id: string;
  label: string;
  hint: string;
  error?: string;
  file: File | null;
  current: SamagriList | null;
  onPick: (file: File) => void;
  pujaName: string;
  modeLabel?: string;
  className?: string;
}) {
  const ts = useT('samagri');
  const ref = useRef<HTMLInputElement>(null);
  const pdf = file ? file.type === 'application/pdf' : current?.type === 'pdf';
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className}>
      <input
        ref={ref}
        id={`${id}-input`}
        type="file"
        accept={LIST_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ''; // choosing the same file again still fires change
          if (f) onPick(f);
        }}
      />
      {(file || current) && (
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-sm">
          {pdf ? (
            <FileText className="size-5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <ImageIcon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1 break-words">
            {file
              ? ts('svc.list.selected', { name: file.name })
              : current?.type === 'pdf'
                ? ts.plural('svc.list.currentPdf', current.pages ?? 1)
                : ts('svc.list.currentImage')}
          </span>
          {!file && current && (
            <SamagriListButton
              list={current}
              pujaName={pujaName}
              modeLabel={modeLabel}
              label={ts('svc.list.view')}
              className="shrink-0"
            />
          )}
        </div>
      )}
      <Button
        id={id}
        type="button"
        variant="outline"
        className="min-h-11 justify-self-start"
        onClick={() => ref.current?.click()}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
      >
        <Paperclip aria-hidden="true" />
        {file || current ? ts('svc.list.replace') : ts('svc.list.choose')}
      </Button>
    </Field>
  );
}

/** Lower-case and strip accents/nuktas so search ignores case and diacritics. */
function normalize(v: string) {
  return v.normalize('NFKD').replace(/[\u0300-\u036f\u093c]/g, '').toLowerCase().trim();
}
