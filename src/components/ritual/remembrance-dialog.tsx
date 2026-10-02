'use client';

import { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import type { Messages } from '@/i18n/messages';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { istDateKey } from '@/lib/format';
import type { ObserveBy, Remembrance, RemembranceInput, RemembranceKind } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChoiceChips } from './choice-chips';
import { useKindLabel } from './remembrance-card';
import { useErrorText } from './use-error-text';

type RemindersKey = keyof Messages['reminders'] & string;

const KINDS: RemembranceKind[] = ['punyatithi', 'birthday', 'anniversary', 'custom'];
const LEAD_DAYS = [0, 1, 3, 7];
const defaultObserve = (kind: RemembranceKind): ObserveBy => (kind === 'punyatithi' ? 'tithi' : 'date');

function ObserveOption({
  name,
  value,
  checked,
  onChange,
  title,
  badge,
  children,
}: {
  name: string;
  value: ObserveBy;
  checked: boolean;
  onChange: () => void;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40',
        'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
        checked && 'border-primary bg-accent/40 ring-1 ring-primary/40',
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={cn('mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2', checked ? 'border-primary' : 'border-input')}
        aria-hidden="true"
      >
        {checked && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
          {title}
          {badge && (
            <span className="rounded-full bg-tulsi/10 px-2 py-0.5 text-xs font-medium text-tulsi">{badge}</span>
          )}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{children}</span>
      </span>
    </label>
  );
}

function RemembranceForm({
  initial,
  onDone,
  onSaved,
}: {
  initial: Remembrance | null;
  onDone: () => void;
  onSaved: (r: Remembrance) => void;
}) {
  const t = useT('reminders');
  const tc = useT('common');
  const kindLabel = useKindLabel();
  const errorText = useErrorText();
  const { token } = useAuth();
  const uid = useId();
  const [today] = useState(() => istDateKey(0));

  const [name, setName] = useState(initial?.person_name ?? '');
  const [relation, setRelation] = useState(initial?.relation ?? '');
  const [kind, setKind] = useState<RemembranceKind>(initial?.kind ?? 'punyatithi');
  const [eventDate, setEventDate] = useState(initial?.event_date ?? '');
  const [observeChoice, setObserveChoice] = useState<ObserveBy | null>(initial?.observe_by ?? null);
  const [lead, setLead] = useState<number>(initial?.remind_days_before ?? 1);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({});
  const [saving, setSaving] = useState(false);

  // Until the person picks one, the observance follows the kind.
  const observeBy = observeChoice ?? defaultObserve(kind);
  const relations = t('form.relationSuggestions').split(',').map((s) => s.trim()).filter(Boolean);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = t('form.nameRequired');
    if (!eventDate) next.date = t('form.dateRequired');
    else if (kind === 'punyatithi' && eventDate > today) next.date = t('form.dateFuture');
    setErrors(next);
    if (next.name || next.date) return;

    const body: RemembranceInput = {
      person_name: name.trim(),
      kind,
      event_date: eventDate,
      observe_by: observeBy,
      remind_days_before: lead,
      ...(relation.trim() ? { relation: relation.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    setSaving(true);
    try {
      const saved = initial
        ? await api<Remembrance>(`/reminders/remembrances/${initial.id}`, { method: 'PUT', token, body })
        : await api<Remembrance>('/reminders/remembrances', { method: 'POST', token, body });
      onSaved(saved);
      toast.success(initial ? t('toast.updated', { name: saved.person_name }) : t('toast.added', { name: saved.person_name }));
      onDone();
    } catch (err) {
      toast.error(errorText(err, t('toast.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = t(`form.date.${kind}` as RemindersKey);

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={`${uid}-name`}>{t('form.name')}</Label>
          <Input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoComplete="off"
            placeholder={t('form.namePlaceholder')}
            aria-invalid={!!errors.name || undefined}
            aria-describedby={errors.name ? `${uid}-name-err` : undefined}
          />
          {errors.name && (
            <p id={`${uid}-name-err`} className="text-sm text-destructive">
              {errors.name}
            </p>
          )}
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={`${uid}-rel`}>
            {t('form.relation')} <span className="font-normal text-muted-foreground">{t('form.optional')}</span>
          </Label>
          <Input
            id={`${uid}-rel`}
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            maxLength={50}
            list={`${uid}-rel-list`}
            autoComplete="off"
            placeholder={t('form.relationPlaceholder')}
          />
          <datalist id={`${uid}-rel-list`}>
            {relations.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
      </div>

      <ChoiceChips
        legend={t('form.kind')}
        options={KINDS.map((k) => ({ value: k, label: kindLabel(k) }))}
        value={kind}
        onChange={setKind}
      />

      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${uid}-date`}>{dateLabel}</Label>
        <Input
          id={`${uid}-date`}
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          max={kind === 'punyatithi' ? today : undefined}
          className="w-full sm:w-56"
          aria-invalid={!!errors.date || undefined}
          aria-describedby={errors.date ? `${uid}-date-err` : `${uid}-date-hint`}
        />
        {errors.date ? (
          <p id={`${uid}-date-err`} className="text-sm text-destructive">
            {errors.date}
          </p>
        ) : (
          <p id={`${uid}-date-hint`} className="text-xs text-muted-foreground">
            {t('form.dateHint')}
          </p>
        )}
      </div>

      <fieldset className="grid min-w-0 gap-2">
        <legend className="mb-2 text-sm font-medium">{t('form.observeBy')}</legend>
        <ObserveOption
          name={`${uid}-observe`}
          value="tithi"
          checked={observeBy === 'tithi'}
          onChange={() => setObserveChoice('tithi')}
          title={t('form.observe.tithi')}
          badge={kind === 'punyatithi' ? t('form.recommended') : undefined}
        >
          {t('form.observe.tithiHelp')}
        </ObserveOption>
        <ObserveOption
          name={`${uid}-observe`}
          value="date"
          checked={observeBy === 'date'}
          onChange={() => setObserveChoice('date')}
          title={t('form.observe.date')}
        >
          {t('form.observe.dateHelp')}
        </ObserveOption>
      </fieldset>

      <ChoiceChips
        legend={t('form.lead')}
        options={LEAD_DAYS.map((n) => ({
          value: n,
          label: n === 0 ? t('lead.onDay') : t.plural('lead.before', n),
        }))}
        value={lead}
        onChange={setLead}
      />

      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${uid}-notes`}>
          {t('form.notes')} <span className="font-normal text-muted-foreground">{t('form.optional')}</span>
        </Label>
        <Textarea
          id={`${uid}-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          placeholder={t('form.notesPlaceholder')}
        />
      </div>

      <DialogFooter className="-mx-5 mt-1 -mb-5 sm:-mx-6 sm:-mb-6">
        <Button type="button" variant="outline" size="lg" onClick={onDone} disabled={saving}>
          {tc('action.cancel')}
        </Button>
        <Button type="submit" size="lg" disabled={saving} aria-busy={saving}>
          {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
          {saving ? tc('action.saving') : initial ? t('form.saveChanges') : t('form.add')}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Add or edit a loved one. Pass `initial` to edit. */
export function RemembranceDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Remembrance | null;
  onSaved: (r: Remembrance) => void;
}) {
  const t = useT('reminders');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:max-w-xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl leading-snug">
            {initial ? t('form.editTitle', { name: initial.person_name }) : t('form.addTitle')}
          </DialogTitle>
          <DialogDescription className="text-base">{t('form.description')}</DialogDescription>
        </DialogHeader>
        {open && (
          <RemembranceForm
            key={initial?.id ?? 'new'}
            initial={initial}
            onSaved={onSaved}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
