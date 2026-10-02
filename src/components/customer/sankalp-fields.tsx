'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { BookUser, Check, Plus, X } from 'lucide-react';
import { useT } from '@/i18n';
import type { FamilyProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type SankalpDraft = {
  devotee_name: string;
  gotra: string;
  nakshatra: string;
  occasion: string;
  family_members: string[];
};

export const emptySankalp = (name = ''): SankalpDraft => ({
  devotee_name: name,
  gotra: '',
  nakshatra: '',
  occasion: '',
  family_members: [],
});

function hasKul(p: FamilyProfile) {
  return !!p.gotra?.trim() || p.members.length > 0;
}

/** "Fill from my Kul parichay": choose which family members to include and whose nakshatra to use. */
function KulPrefill({
  family,
  devoteeName,
  value,
  onApply,
}: {
  family: FamilyProfile;
  devoteeName?: string;
  value: SankalpDraft;
  onApply: (v: SankalpDraft) => void;
}) {
  const t = useT('booking');
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [chosen, setChosen] = useState<string[]>(() => family.members.map((m) => m.id));
  const withStar = family.members.filter((m) => m.nakshatra?.trim());
  const [starOf, setStarOf] = useState<string>(withStar[0]?.id ?? '');

  const summary = [
    family.gotra?.trim() ? t('kul.gotraSummary', { gotra: family.gotra.trim() }) : null,
    family.members.length ? t.plural('kul.membersSummary', family.members.length) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const apply = () => {
    const names = family.members.filter((m) => chosen.includes(m.id)).map((m) => m.name.trim()).filter(Boolean);
    const merged = [...names, ...value.family_members.filter((n) => !names.includes(n))].slice(0, 20);
    const star = withStar.find((m) => m.id === starOf)?.nakshatra?.trim();
    onApply({
      ...value,
      devotee_name: devoteeName?.trim() || value.devotee_name,
      gotra: family.gotra?.trim() || value.gotra,
      nakshatra: star || value.nakshatra,
      family_members: merged,
    });
    setOpen(false);
    setApplied(true);
  };

  return (
    <div className="min-w-0 rounded-xl border border-diya/40 bg-chandan p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <BookUser className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-medium">{t('kul.title')}</p>
            {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
          </div>
        </div>
        {!open && (
          <Button type="button" variant="outline" className="h-11 shrink-0 bg-card" onClick={() => setOpen(true)} aria-expanded={false} aria-controls={`${uid}-panel`}>
            {applied ? t('kul.again') : t('kul.fill')}
          </Button>
        )}
      </div>

      <p aria-live="polite" className="text-sm text-tulsi empty:hidden">
        {applied && !open ? (
          <span className="mt-3 flex items-center gap-1.5">
            <Check className="size-4 shrink-0" aria-hidden="true" />
            {t('kul.applied')}
          </span>
        ) : null}
      </p>

      {open && (
        <div id={`${uid}-panel`} className="mt-4 grid min-w-0 grid-cols-1 gap-4 border-t border-diya/30 pt-4">
          {family.members.length > 0 && (
            <fieldset className="min-w-0">
              <legend className="mb-2 text-sm font-medium">{t('kul.whichMembers')}</legend>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {family.members.map((m) => (
                  <li key={m.id} className="min-w-0">
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-card/70">
                      <input
                        type="checkbox"
                        checked={chosen.includes(m.id)}
                        onChange={(e) =>
                          setChosen((c) => (e.target.checked ? [...c, m.id] : c.filter((x) => x !== m.id)))
                        }
                        className="size-5 shrink-0 accent-primary"
                      />
                      <span className="min-w-0 truncate">
                        {m.name}
                        {m.relation && <span className="text-muted-foreground"> · {m.relation}</span>}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
          {withStar.length > 0 && (
            <div className="grid min-w-0 gap-2">
              <Label htmlFor={`${uid}-star`}>{t('kul.starOf')}</Label>
              <select
                id={`${uid}-star`}
                value={starOf}
                onChange={(e) => setStarOf(e.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:max-w-sm"
              >
                <option value="">{t('kul.starNone')}</option>
                {withStar.map((m) => (
                  <option key={m.id} value={m.id}>
                    {t('kul.starOption', { name: m.name, nakshatra: m.nakshatra ?? '' })}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {devoteeName ? t('kul.willFill', { name: devoteeName }) : t('kul.willFillNoName')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="h-11" onClick={apply}>
              {t('kul.apply')}
            </Button>
            <Button type="button" variant="ghost" className="h-11" onClick={() => setOpen(false)}>
              {t('kul.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Sankalp details: the names and lineage the pandit recites at the start of the puja. */
export function SankalpFields({
  value,
  onChange,
  nameRequired,
  nameError,
  family,
  devoteeName,
}: {
  value: SankalpDraft;
  onChange: (v: SankalpDraft) => void;
  nameRequired: boolean;
  nameError?: string | null;
  /** The signed-in user's Kul parichay; undefined while loading or unavailable. */
  family?: FamilyProfile | null;
  /** Used as the devotee name when filling from the Kul parichay. */
  devoteeName?: string;
}) {
  const t = useT('booking');
  const uid = useId();
  const [member, setMember] = useState('');
  const set = <K extends keyof SankalpDraft>(k: K, v: SankalpDraft[K]) => onChange({ ...value, [k]: v });

  const addMembers = (raw: string) => {
    const names = raw
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .filter((n) => !value.family_members.includes(n));
    if (names.length) set('family_members', [...value.family_members, ...names].slice(0, 20));
    setMember('');
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4">
      {family && hasKul(family) && (
        <KulPrefill family={family} devoteeName={devoteeName} value={value} onApply={onChange} />
      )}
      {family && !hasKul(family) && (
        <p className="text-sm text-muted-foreground">
          <Link
            href="/account"
            className="inline-flex min-h-11 items-center gap-1.5 rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <BookUser className="size-4" aria-hidden="true" />
            {t('kul.saveOnce')}
          </Link>{' '}
          {t('kul.saveOnceHint')}
        </p>
      )}

      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${uid}-name`}>
          {t('sankalp.name')}
          {!nameRequired && <span className="font-normal text-muted-foreground">{t('sankalp.recommended')}</span>}
        </Label>
        <Input
          id={`${uid}-name`}
          value={value.devotee_name}
          onChange={(e) => set('devotee_name', e.target.value)}
          autoComplete="name"
          required={nameRequired}
          aria-invalid={!!nameError || undefined}
          aria-describedby={nameError ? `${uid}-name-err` : undefined}
          placeholder={t('sankalp.namePlaceholder')}
        />
        {nameError && (
          <p id={`${uid}-name-err`} className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={`${uid}-gotra`}>
            {t('sankalp.gotra')} <span className="font-normal text-muted-foreground">{t('sankalp.gotraGloss')}</span>
          </Label>
          <Input
            id={`${uid}-gotra`}
            value={value.gotra}
            onChange={(e) => set('gotra', e.target.value)}
            placeholder={t('sankalp.gotraPlaceholder')}
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <Label htmlFor={`${uid}-nak`}>
            {t('sankalp.nakshatra')}{' '}
            <span className="font-normal text-muted-foreground">{t('sankalp.nakshatraGloss')}</span>
          </Label>
          <Input
            id={`${uid}-nak`}
            value={value.nakshatra}
            onChange={(e) => set('nakshatra', e.target.value)}
            placeholder={t('sankalp.nakshatraPlaceholder')}
          />
        </div>
      </div>
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${uid}-occ`}>{t('sankalp.occasion')}</Label>
        <Input
          id={`${uid}-occ`}
          value={value.occasion}
          onChange={(e) => set('occasion', e.target.value)}
          placeholder={t('sankalp.occasionPlaceholder')}
        />
      </div>
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${uid}-fam`}>{t('sankalp.family')}</Label>
        <div className="flex min-w-0 gap-2">
          <Input
            id={`${uid}-fam`}
            value={member}
            onChange={(e) => {
              const v = e.target.value;
              if (v.includes(',')) addMembers(v);
              else setMember(v);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMembers(member);
              }
            }}
            placeholder={t('sankalp.familyPlaceholder')}
            aria-describedby={`${uid}-fam-hint`}
            className="min-w-0"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => addMembers(member)}
            aria-label={t('sankalp.addMember')}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <p id={`${uid}-fam-hint`} className="text-xs text-muted-foreground">
          {t('sankalp.familyHint')}
        </p>
        {value.family_members.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={t('sankalp.familyAdded')}>
            {value.family_members.map((m) => (
              <li key={m} className="min-w-0 max-w-full">
                <span className="inline-flex h-9 max-w-full items-center gap-1 rounded-full bg-accent pr-1 pl-3 text-sm text-accent-foreground">
                  <span className="truncate">{m}</span>
                  <button
                    type="button"
                    onClick={() => set('family_members', value.family_members.filter((x) => x !== m))}
                    className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-background/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    aria-label={t('sankalp.removeMember', { name: m })}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
