'use client';

import { useId, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useFormat, useT, type Translator } from '@/i18n';
import { api } from '@/lib/api';
import { istDateKey } from '@/lib/format';
import type { FamilyMember, FamilyProfile } from '@/lib/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, Panel } from '@/components/dashboard/field';
import { errorMessage, useApi } from '@/components/dashboard/use-api';
import { Diya } from '@/components/brand/diya';
import { NAKSHATRAS, RASHIS, RELATION_KEYS } from './astro';
import { SectionIcon } from './sections';

const MAX_MEMBERS = 20;
const NONE = '__none__';

type T = Translator<'account'>;

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Trims strings and drops empty optional fields so comparisons and saves are stable. */
function clean(p: FamilyProfile): FamilyProfile {
  const opt = (v?: string | null) => (v && v.trim() ? v.trim() : undefined);
  return {
    gotra: opt(p.gotra),
    kuldevta: opt(p.kuldevta),
    native_place: opt(p.native_place),
    members: (p.members ?? []).map((m) => ({
      id: m.id,
      name: m.name.trim(),
      relation: m.relation.trim(),
      nakshatra: opt(m.nakshatra),
      rashi: opt(m.rashi),
      date_of_birth: opt(m.date_of_birth),
    })),
  };
}

function labelFor(list: readonly { value: string; key: string }[], value: string | undefined, t: T) {
  if (!value) return '';
  const hit = list.find((x) => x.value.toLowerCase() === value.toLowerCase());
  return hit ? t(hit.key as Parameters<T>[0]) : value;
}

/* ───────────────────────── Section (loader) ───────────────────────── */

export function KulParichaySection({ token }: { token: string }) {
  const t = useT('account');
  const { data, error, loading, reload } = useApi<FamilyProfile>('/users/me/family-profile', token);

  return (
    <Panel
      title={t('kul.title')}
      description={t('kul.subtitle')}
      icon={
        <SectionIcon>
          <Users className="size-5" aria-hidden="true" />
        </SectionIcon>
      }
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl bg-chandan/50 p-4 dark:bg-accent/10">
        <Diya className="size-8 shrink-0" />
        <p className="leading-relaxed">{t('kul.why')}</p>
      </div>

      {loading ? (
        <p role="status" className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">{t('kul.title')}</span>
        </p>
      ) : !data ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-muted-foreground">{error ?? t('kul.loadError')}</p>
          <Button variant="outline" className="min-h-11" onClick={reload}>
            {t('kul.retry')}
          </Button>
        </div>
      ) : (
        <KulEditor token={token} initial={clean({ ...data, members: data.members ?? [] })} />
      )}
    </Panel>
  );
}

/* ───────────────────────── Editor ───────────────────────── */

function KulEditor({ token, initial }: { token: string; initial: FamilyProfile }) {
  const t = useT('account');
  const tc = useT('common');
  const f = useFormat();
  const uid = useId();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; member: FamilyMember | null; today: string; nonce: number }>({
    open: false,
    member: null,
    today: '',
    nonce: 0,
  });

  const dirty = JSON.stringify(clean(draft)) !== JSON.stringify(clean(saved));
  const set = (k: 'gotra' | 'kuldevta' | 'native_place', v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const openDialog = (member: FamilyMember | null) =>
    setDialog((d) => ({ open: true, member, today: istDateKey(), nonce: d.nonce + 1 }));

  const upsert = (m: FamilyMember) => {
    setDraft((d) => {
      const exists = d.members.some((x) => x.id === m.id);
      return { ...d, members: exists ? d.members.map((x) => (x.id === m.id ? m : x)) : [...d.members, m] };
    });
  };

  const remove = (m: FamilyMember) => {
    const index = draft.members.findIndex((x) => x.id === m.id);
    setDraft((d) => ({ ...d, members: d.members.filter((x) => x.id !== m.id) }));
    toast(t('kul.removed', { name: m.name }), {
      action: {
        label: t('kul.undo'),
        onClick: () =>
          setDraft((d) => {
            if (d.members.some((x) => x.id === m.id)) return d;
            const members = [...d.members];
            members.splice(Math.min(index, members.length), 0, m);
            return { ...d, members };
          }),
      },
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<FamilyProfile>('/users/me/family-profile', { method: 'PUT', token, body: clean(draft) });
      const next = clean({ ...res, members: res?.members ?? [] });
      setSaved(next);
      setDraft(next);
      toast.success(t('kul.saved'));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const full = draft.members.length >= MAX_MEMBERS;

  return (
    <>
      <form onSubmit={save} noValidate className="grid gap-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={`${uid}-gotra`} label={t('kul.gotra')} hint={t('kul.gotraHint')}>
            <Input
              id={`${uid}-gotra`}
              value={draft.gotra ?? ''}
              onChange={(e) => set('gotra', e.target.value)}
              placeholder={t('kul.gotraPlaceholder')}
              aria-describedby={`${uid}-gotra-hint`}
              maxLength={80}
            />
          </Field>
          <Field id={`${uid}-kuldevta`} label={t('kul.kuldevta')} hint={t('kul.kuldevtaHint')}>
            <Input
              id={`${uid}-kuldevta`}
              value={draft.kuldevta ?? ''}
              onChange={(e) => set('kuldevta', e.target.value)}
              placeholder={t('kul.kuldevtaPlaceholder')}
              aria-describedby={`${uid}-kuldevta-hint`}
              maxLength={120}
            />
          </Field>
          <Field id={`${uid}-native`} label={t('kul.nativePlace')} hint={t('kul.nativePlaceHint')} className="sm:col-span-2">
            <Input
              id={`${uid}-native`}
              value={draft.native_place ?? ''}
              onChange={(e) => set('native_place', e.target.value)}
              placeholder={t('kul.nativePlacePlaceholder')}
              aria-describedby={`${uid}-native-hint`}
              autoComplete="address-level2"
              maxLength={160}
            />
          </Field>
        </div>

        <section aria-labelledby={`${uid}-members`} className="grid gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 id={`${uid}-members`} className="text-xl leading-snug">
                {t('kul.members')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('kul.membersHint')}</p>
            </div>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => openDialog(null)} disabled={full}>
              <Plus aria-hidden="true" />
              {t('kul.addMember')}
            </Button>
          </div>
          {full && <p className="text-sm text-muted-foreground">{t('kul.max', { max: MAX_MEMBERS })}</p>}

          {draft.members.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-6 text-center leading-relaxed text-muted-foreground">
              {t('kul.noMembers')}
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {draft.members.map((m) => {
                const details = [
                  labelFor(NAKSHATRAS, m.nakshatra, t),
                  labelFor(RASHIS, m.rashi, t),
                  m.date_of_birth
                    ? t('kul.member.born', { date: f.dateKey(m.date_of_birth, { day: 'numeric', month: 'short', year: 'numeric' }) })
                    : '',
                ].filter(Boolean);
                return (
                  <li key={m.id} className="flex items-start gap-2 rounded-xl border bg-card p-3 pl-4">
                    <div className="min-w-0 flex-1 py-1">
                      <p className="leading-snug font-semibold break-words">
                        {m.name}
                        <span className="font-normal text-muted-foreground"> · {m.relation}</span>
                      </p>
                      {details.length > 0 && (
                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{details.join(' · ')}</p>
                      )}
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11"
                        onClick={() => openDialog(m)}
                        aria-label={t('kul.edit', { name: m.name })}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-11 text-destructive hover:text-destructive"
                        onClick={() => remove(m)}
                        aria-label={t('kul.remove', { name: m.name })}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={busy || !dirty}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {busy ? t('kul.saving') : t('kul.save')}
          </Button>
          {dirty && !busy && (
            <p role="status" className="text-sm text-muted-foreground">
              {t('kul.unsaved')}
            </p>
          )}
          {dirty && !busy && (
            <Button type="button" variant="ghost" className="min-h-11 sm:ml-auto" onClick={() => setDraft(saved)}>
              {tc('action.cancel')}
            </Button>
          )}
        </div>
      </form>

      <MemberDialog
        key={dialog.nonce}
        open={dialog.open}
        member={dialog.member}
        today={dialog.today}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSave={(m) => {
          upsert(m);
          setDialog((d) => ({ ...d, open: false }));
        }}
      />
    </>
  );
}

/* ───────────────────────── Member dialog ───────────────────────── */

function MemberDialog({
  open,
  member,
  today,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  member: FamilyMember | null;
  today: string;
  onOpenChange: (open: boolean) => void;
  onSave: (m: FamilyMember) => void;
}) {
  const t = useT('account');
  const tc = useT('common');
  const uid = useId();
  const [name, setName] = useState(member?.name ?? '');
  const [relation, setRelation] = useState(member?.relation ?? '');
  const [nakshatra, setNakshatra] = useState(member?.nakshatra ?? '');
  const [rashi, setRashi] = useState(member?.rashi ?? '');
  const [dob, setDob] = useState(member?.date_of_birth ?? '');
  const [errors, setErrors] = useState<{ name?: string; relation?: string }>({});

  const items = (list: readonly { value: string; key: string }[], current: string) => {
    const base = [
      { value: NONE, label: t('kul.member.notSure') },
      ...list.map((x) => ({ value: x.value, label: t(x.key as Parameters<T>[0]) })),
    ];
    const known = !current || list.some((x) => x.value.toLowerCase() === current.toLowerCase());
    return known ? base : [...base, { value: current, label: current }];
  };
  const nakItems = items(NAKSHATRAS, nakshatra);
  const rashiItems = items(RASHIS, rashi);
  const canonical = (list: readonly { value: string }[], v: string) =>
    list.find((x) => x.value.toLowerCase() === v.toLowerCase())?.value ?? v;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = t('kul.member.nameError');
    if (!relation.trim()) errs.relation = t('kul.member.relationError');
    setErrors(errs);
    if (errs.name || errs.relation) return;
    onSave({
      id: member?.id ?? newId(),
      name: name.trim(),
      relation: relation.trim(),
      nakshatra: nakshatra || undefined,
      rashi: rashi || undefined,
      date_of_birth: dob || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="text-2xl leading-snug">
              {member ? t('kul.dialog.editTitle') : t('kul.dialog.addTitle')}
            </DialogTitle>
            <DialogDescription className="leading-relaxed">{t('kul.dialog.description')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${uid}-name`} label={t('kul.member.name')} error={errors.name}>
              <Input
                id={`${uid}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? `${uid}-name-error` : undefined}
                maxLength={100}
                autoFocus
              />
            </Field>
            <Field id={`${uid}-relation`} label={t('kul.member.relation')} error={errors.relation}>
              <Input
                id={`${uid}-relation`}
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                list={`${uid}-relations`}
                placeholder={t('kul.member.relationPlaceholder')}
                aria-invalid={!!errors.relation}
                aria-describedby={errors.relation ? `${uid}-relation-error` : undefined}
                maxLength={60}
              />
              <datalist id={`${uid}-relations`}>
                {RELATION_KEYS.map((k) => (
                  <option key={k} value={t(k)} />
                ))}
              </datalist>
            </Field>
            <Field id={`${uid}-nak`} label={t('kul.member.nakshatra')}>
              <Select
                items={nakItems}
                value={nakshatra ? canonical(NAKSHATRAS, nakshatra) : NONE}
                onValueChange={(v) => setNakshatra(!v || v === NONE ? '' : String(v))}
              >
                <SelectTrigger id={`${uid}-nak`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="max-h-72">
                  {nakItems.map((x) => (
                    <SelectItem key={x.value} value={x.value}>
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id={`${uid}-rashi`} label={t('kul.member.rashi')}>
              <Select
                items={rashiItems}
                value={rashi ? canonical(RASHIS, rashi) : NONE}
                onValueChange={(v) => setRashi(!v || v === NONE ? '' : String(v))}
              >
                <SelectTrigger id={`${uid}-rashi`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="max-h-72">
                  {rashiItems.map((x) => (
                    <SelectItem key={x.value} value={x.value}>
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id={`${uid}-dob`} label={t('kul.member.dob')} className="sm:col-span-2">
              <Input
                id={`${uid}-dob`}
                type="date"
                value={dob}
                max={today || undefined}
                min="1900-01-01"
                onChange={(e) => setDob(e.target.value)}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              {tc('action.cancel')}
            </Button>
            <Button type="submit" className="min-h-11">
              {member ? t('kul.member.update') : t('kul.member.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
