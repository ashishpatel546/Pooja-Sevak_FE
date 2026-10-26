'use client';

import { useId, useState } from 'react';
import { PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { api } from '@/lib/api';
import type { BirthDetails, KundaliInput } from '@/lib/kundali';
import { hasLatin, nameToDevanagari } from '@/lib/transliterate';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * The Devanagari name, typed directly or produced from a "how it sounds" spelling
 * (Shaashvika → शाश्विका) that never replaces the English name itself.
 */
export function HindiNameField({
  id,
  value,
  onChange,
  gender,
  label,
  hint,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  gender?: string;
  label: string;
  hint?: string;
}) {
  const t = useT('kundali');
  const [sounds, setSounds] = useState<string | null>(null);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        lang="hi"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        maxLength={80}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-11 text-base"
      />
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {sounds === null ? (
        <Button type="button" variant="link" className="h-auto justify-self-start p-0 text-sm" onClick={() => setSounds('')}>
          {t('names.sounds')}
        </Button>
      ) : (
        <div className="mt-1 grid gap-1.5 rounded-lg bg-accent/40 p-3">
          <Label htmlFor={`${id}-sounds`} className="text-sm">
            {t('names.sounds')}
          </Label>
          <Input
            id={`${id}-sounds`}
            value={sounds}
            onChange={(e) => {
              setSounds(e.target.value);
              if (hasLatin(e.target.value)) onChange(nameToDevanagari(e.target.value, gender));
            }}
            placeholder="Shaashvika Patel"
            autoComplete="off"
            maxLength={80}
            aria-describedby={`${id}-sounds-hint`}
            className="h-11 bg-card text-base"
          />
          <p id={`${id}-sounds-hint`} className="text-sm text-muted-foreground">
            {t('names.soundsHint')}
          </p>
        </div>
      )}
    </div>
  );
}

type Who = 'person' | 'boy' | 'girl';
type Draft = { name: string; nameHi: string; hiEdited: boolean };

/** Corrects the names on a saved report, in English, in Hindi or both; the chart is unchanged. */
export function EditNamesButton({
  reportId,
  input,
  token,
  onSaved,
}: {
  reportId: string;
  input: KundaliInput;
  token: string;
  onSaved: () => void;
}) {
  const t = useT('kundali');
  const tc = useT('common');
  const id = useId();
  const people = ('person' in input ? [['person', input.person]] : [['boy', input.boy], ['girl', input.girl]]) as [Who, BirthDetails][];
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Partial<Record<Who, Draft>>>({});
  const [busy, setBusy] = useState(false);

  const start = () => {
    setDrafts(
      Object.fromEntries(
        people.map(([w, p]) => [
          w,
          { name: p.name, nameHi: p.name_hi ?? (hasLatin(p.name) ? nameToDevanagari(p.name, p.gender) : ''), hiEdited: !!p.name_hi },
        ]),
      ),
    );
    setOpen(true);
  };

  const update = (w: Who, gender: string, patch: Partial<Draft>) =>
    setDrafts((all) => {
      const d = { ...all[w]!, ...patch };
      // Until the Hindi name is touched, it follows the English one.
      if (patch.name !== undefined && !d.hiEdited) d.nameHi = hasLatin(d.name) ? nameToDevanagari(d.name, gender) : '';
      return { ...all, [w]: d };
    });

  const valid = people.every(([w, p]) => {
    const name = drafts[w]?.name.trim() ?? '';
    return name || (p.newborn && !p.name); // only an unnamed newborn may stay unnamed
  });

  const save = async () => {
    setBusy(true);
    try {
      const body = Object.fromEntries(
        people.map(([w, p]) => {
          const d = drafts[w]!;
          const name = d.name.trim();
          return [w, { ...(name && name !== p.name && { name }), name_hi: d.nameHi.trim() }];
        }),
      );
      await api(`/kundali/reports/${reportId}/names`, { method: 'PUT', token, body });
      toast.success(t('names.saved'));
      setOpen(false);
      onSaved();
    } catch {
      toast.error(t('names.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="lg" variant="outline" onClick={start}>
        <PencilLine aria-hidden="true" />
        {t('names.edit')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('names.title')}</DialogTitle>
            <DialogDescription>{t('names.about')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6">
            {people.map(([w, p]) => {
              const d = drafts[w];
              if (!d) return null;
              return (
                <fieldset key={w} className="grid gap-3">
                  {w !== 'person' && (
                    <legend className="mb-1 font-heading text-lg text-heading">{w === 'boy' ? t('form.boy') : t('form.girl')}</legend>
                  )}
                  <div className="grid gap-1.5">
                    <Label htmlFor={`${id}-${w}-en`} className="text-sm font-normal text-muted-foreground">
                      {t('names.english')}
                    </Label>
                    <Input
                      id={`${id}-${w}-en`}
                      value={d.name}
                      onChange={(e) => update(w, p.gender, { name: e.target.value })}
                      autoComplete="off"
                      maxLength={80}
                      aria-describedby={p.newborn && !p.name ? `${id}-${w}-nb` : undefined}
                      className="h-11 text-base"
                    />
                    {p.newborn && !p.name && (
                      <p id={`${id}-${w}-nb`} className="text-sm text-muted-foreground">
                        {t('names.newbornHint')}
                      </p>
                    )}
                  </div>
                  <HindiNameField
                    id={`${id}-${w}-hi`}
                    value={d.nameHi}
                    onChange={(v) => update(w, p.gender, { nameHi: v, hiEdited: true })}
                    gender={p.gender}
                    label={t('names.hindi')}
                  />
                </fieldset>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tc('action.cancel')}
            </Button>
            <Button onClick={() => void save()} disabled={busy || !valid}>
              {t('names.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
