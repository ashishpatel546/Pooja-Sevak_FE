'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { api } from '@/lib/api';
import type { BirthDetails, KundaliInput } from '@/lib/kundali';
import { hasLatin, nameToDevanagari } from '@/lib/transliterate';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Who = 'person' | 'boy' | 'girl';

/**
 * Adds or corrects the Devanagari spelling of the names on a saved report, shown beside
 * the English name on Hindi kundalis. Hidden when every name is already in Devanagari.
 */
export function HindiNamesButton({
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
  const people: [Who, BirthDetails][] = ('person' in input ? [['person', input.person]] : [['boy', input.boy], ['girl', input.girl]]) as [
    Who,
    BirthDetails,
  ][];
  const latin = people.filter(([, p]) => hasLatin(p.name));
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Partial<Record<Who, string>>>({});
  const [busy, setBusy] = useState(false);

  if (latin.length === 0) return null;
  const hasAll = latin.every(([, p]) => p.name_hi);

  const start = () => {
    setValues(Object.fromEntries(latin.map(([w, p]) => [w, p.name_hi ?? nameToDevanagari(p.name, p.gender)])));
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await api(`/kundali/reports/${reportId}/names`, {
        method: 'PUT',
        token,
        body: Object.fromEntries(latin.map(([w]) => [w, (values[w] ?? '').trim()])),
      });
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
        <Languages aria-hidden="true" />
        {hasAll ? t('names.edit') : t('names.add')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('names.title')}</DialogTitle>
            <DialogDescription>{t('names.about')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {latin.map(([w, p]) => (
              <div key={w} className="grid gap-1.5">
                <Label htmlFor={`hindi-name-${w}`}>{p.name}</Label>
                <Input
                  id={`hindi-name-${w}`}
                  lang="hi"
                  value={values[w] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [w]: e.target.value }))}
                  maxLength={80}
                  autoComplete="off"
                  className="h-11 text-base"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tc('action.cancel')}
            </Button>
            <Button onClick={() => void save()} disabled={busy}>
              {t('names.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
