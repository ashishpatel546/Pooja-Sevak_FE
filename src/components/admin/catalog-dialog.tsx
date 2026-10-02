'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { ServiceDefinition, ServiceDefinitionInput } from '@/lib/types';
import { pick, useFormat, useLocale, useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_META } from '@/components/common/puja-icon';
import { Field } from '@/components/dashboard/field';
import { Switch } from '@/components/dashboard/switch';
import { errorMessage } from '@/components/dashboard/use-api';
import { useCategoryLabel } from '@/components/dashboard/category';

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CATEGORY_VALUES = Object.keys(CATEGORY_META);

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  token: string | null;
  definition?: ServiceDefinition;
  onSaved: (d: ServiceDefinition) => void;
};

export function CatalogDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {props.open && <CatalogForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function CatalogForm({ onOpenChange, token, definition: d, onSaved }: Props) {
  const t = useT('admin');
  const tc = useT('common');
  const f = useFormat();
  const { locale } = useLocale();
  const categoryLabel = useCategoryLabel();
  const categories = useMemo(
    () => CATEGORY_VALUES.map((c) => ({ value: c, label: categoryLabel(c) })),
    [categoryLabel],
  );
  const editing = !!d;
  const [name, setName] = useState(d?.name ?? '');
  const [slug, setSlug] = useState(d?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(editing);
  const [category, setCategory] = useState<string>(d?.category ?? '');
  const [deity, setDeity] = useState(d?.deity ?? '');
  const [tagline, setTagline] = useState(d?.tagline ?? '');
  const [description, setDescription] = useState(d?.description ?? '');
  const [significance, setSignificance] = useState(d?.significance ?? '');
  const [nameHi, setNameHi] = useState(d?.name_hi ?? '');
  const [taglineHi, setTaglineHi] = useState(d?.tagline_hi ?? '');
  const [descriptionHi, setDescriptionHi] = useState(d?.description_hi ?? '');
  const [significanceHi, setSignificanceHi] = useState(d?.significance_hi ?? '');
  const [samagri, setSamagri] = useState((d?.samagri ?? []).join('\n'));
  const [duration, setDuration] = useState(d?.typical_duration_minutes != null ? String(d.typical_duration_minutes) : '');
  const [online, setOnline] = useState(!!d?.supports_online);
  const [active, setActive] = useState(d ? d.is_active : true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('cat.err.name');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(effectiveSlug)) errs.slug = t('cat.err.slug');
    const dur = duration ? Number(duration) : null;
    if (dur != null && (!Number.isInteger(dur) || dur < 15 || dur > 1440)) errs.duration = t('cat.err.duration');
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body: ServiceDefinitionInput = {
      name: name.trim(),
      slug: effectiveSlug,
      category: category || null,
      deity: deity.trim() || null,
      tagline: tagline.trim() || null,
      description: description.trim() || null,
      significance: significance.trim() || null,
      name_hi: nameHi.trim() || null,
      tagline_hi: taglineHi.trim() || null,
      description_hi: descriptionHi.trim() || null,
      significance_hi: significanceHi.trim() || null,
      samagri: samagri
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      typical_duration_minutes: dur,
      supports_online: online,
      is_active: active,
    };
    setBusy(true);
    try {
      const saved = editing
        ? await api<ServiceDefinition>(`/service-definitions/${d!.id}`, { method: 'PUT', token, body })
        : await api<ServiceDefinition>('/service-definitions', { method: 'POST', token, body });
      onSaved({ ...(d ?? { starting_price: null, pandit_count: 0 }), ...saved });
      const shown = (locale === 'hi' && body.name_hi) || body.name;
      toast.success(t(editing ? 'cat.toast.updated' : 'cat.toast.added', { name: shown }));
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-2xl">
          {editing ? t('cat.title.edit', { name: pick(d!, 'name', locale) }) : t('cat.title.add')}
        </DialogTitle>
        <DialogDescription>{t('cat.desc')}</DialogDescription>
      </DialogHeader>

      {editing && (
        <dl className="grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('cat.startingPrice')}</dt>
            <dd className="font-medium">{d!.starting_price != null ? f.inr(d!.starting_price) : t('cat.noPandits')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('cat.panditCount')}</dt>
            <dd className="font-medium">{Number(d!.pandit_count) || 0}</dd>
          </div>
        </dl>
      )}

      <h3 className="-mb-2 text-sm font-medium text-muted-foreground">{t('cat.section.en')}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="cat-name" label={t('cat.name')} error={errors.name}>
          <Input
            id="cat-name"
            lang="en"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            placeholder={t('cat.namePlaceholder')}
          />
        </Field>
        <Field id="cat-slug" label={t('cat.slug')} error={errors.slug} hint={t('cat.slugHint', { slug: effectiveSlug || '…' })}>
          <Input
            id="cat-slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
            }}
            aria-invalid={!!errors.slug}
            aria-describedby={errors.slug ? 'cat-slug-error' : 'cat-slug-hint'}
          />
        </Field>
        <Field id="cat-category" label={t('cat.category')}>
          <Select items={categories} value={category || null} onValueChange={(v) => setCategory(v ? String(v) : '')}>
            <SelectTrigger id="cat-category" className="w-full">
              <SelectValue placeholder={t('cat.chooseCategory')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="cat-deity" label={t('cat.deity')}>
          <Input id="cat-deity" lang="en" value={deity} onChange={(e) => setDeity(e.target.value)} placeholder={t('cat.deityPlaceholder')} />
        </Field>
        <Field id="cat-tagline" label={t('cat.tagline')} className="sm:col-span-2">
          <Input
            id="cat-tagline"
            lang="en"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={t('cat.taglinePlaceholder')}
          />
        </Field>
        <Field id="cat-description" label={t('cat.description')} className="sm:col-span-2">
          <Textarea id="cat-description" lang="en" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field id="cat-significance" label={t('cat.significance')} className="sm:col-span-2">
          <Textarea id="cat-significance" lang="en" value={significance} onChange={(e) => setSignificance(e.target.value)} />
        </Field>
        <Field id="cat-samagri" label={t('cat.samagri')} hint={t('cat.samagriHint')} className="sm:col-span-2">
          <Textarea
            id="cat-samagri"
            value={samagri}
            onChange={(e) => setSamagri(e.target.value)}
            aria-describedby="cat-samagri-hint"
            placeholder={t('cat.samagriPlaceholder')}
            className="min-h-32"
          />
        </Field>
        <Field id="cat-duration" label={t('cat.duration')} error={errors.duration}>
          <Input
            id="cat-duration"
            type="number"
            inputMode="numeric"
            min={15}
            step={15}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            aria-invalid={!!errors.duration}
          />
        </Field>
      </div>

      <fieldset className="grid grid-cols-1 gap-4 rounded-xl border border-diya/40 bg-accent/30 p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-medium text-accent-foreground">{t('cat.section.hi')}</legend>
        <p className="-mt-1 text-sm text-muted-foreground sm:col-span-2">{t('cat.section.hiHint')}</p>
        <Field id="cat-name-hi" label={t('cat.nameHi')} className="sm:col-span-2">
          <Input
            id="cat-name-hi"
            lang="hi"
            value={nameHi}
            onChange={(e) => setNameHi(e.target.value)}
            placeholder={t('cat.nameHiPlaceholder')}
          />
        </Field>
        <Field id="cat-tagline-hi" label={t('cat.taglineHi')} className="sm:col-span-2">
          <Input
            id="cat-tagline-hi"
            lang="hi"
            value={taglineHi}
            onChange={(e) => setTaglineHi(e.target.value)}
            placeholder={t('cat.taglineHiPlaceholder')}
          />
        </Field>
        <Field id="cat-description-hi" label={t('cat.descriptionHi')} className="sm:col-span-2">
          <Textarea
            id="cat-description-hi"
            lang="hi"
            value={descriptionHi}
            onChange={(e) => setDescriptionHi(e.target.value)}
          />
        </Field>
        <Field id="cat-significance-hi" label={t('cat.significanceHi')} className="sm:col-span-2">
          <Textarea
            id="cat-significance-hi"
            lang="hi"
            value={significanceHi}
            onChange={(e) => setSignificanceHi(e.target.value)}
          />
        </Field>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border p-3 text-sm font-medium">
          <span className="min-w-0">{t('cat.online')}</span>
          <Switch checked={online} onCheckedChange={setOnline} />
        </label>
        <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border p-3 text-sm font-medium">
          <span className="min-w-0">{t('cat.active')}</span>
          <Switch checked={active} onCheckedChange={setActive} />
        </label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          {tc('action.cancel')}
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? tc('action.saving') : editing ? t('cat.save') : t('cat.add')}
        </Button>
      </DialogFooter>
    </form>
  );
}
