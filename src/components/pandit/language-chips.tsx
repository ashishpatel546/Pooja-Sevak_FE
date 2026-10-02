'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Stored in English (the API value); shown in the visitor's language. */
export const COMMON_LANGUAGES = [
  'Hindi',
  'Sanskrit',
  'English',
  'Awadhi',
  'Bhojpuri',
  'Maithili',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
] as const;

/** Toggle chips for languages, plus free-text custom entries. */
export function LanguageChips({
  value,
  onChange,
  labelledBy,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  labelledBy: string;
}) {
  const t = useT('pandit');
  const [custom, setCustom] = useState('');
  const has = (l: string) => value.some((v) => v.toLowerCase() === l.toLowerCase());
  const toggle = (l: string) =>
    onChange(has(l) ? value.filter((v) => v.toLowerCase() !== l.toLowerCase()) : [...value, l]);
  const extras = value.filter((v) => !COMMON_LANGUAGES.some((c) => c.toLowerCase() === v.toLowerCase()));

  const addCustom = () => {
    const l = custom.trim().replace(/\s+/g, ' ');
    if (!l) return;
    if (!has(l)) onChange([...value, l.charAt(0).toUpperCase() + l.slice(1)]);
    setCustom('');
  };

  return (
    <div className="grid gap-3">
      <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
        {COMMON_LANGUAGES.map((l) => {
          const on = has(l);
          return (
            <button
              key={l}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(l)}
              className={cn(
                'inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                on
                  ? 'border-primary/50 bg-accent text-accent-foreground'
                  : 'border-border bg-card text-foreground/80 hover:bg-muted',
              )}
            >
              {on && <Check className="size-3.5" aria-hidden="true" />}
              {t(`lang.${l}`)}
            </button>
          );
        })}
        {extras.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => toggle(l)}
            aria-label={t('lang.remove', { language: l })}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-primary/50 bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {l}
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="flex max-w-sm min-w-0 gap-2">
        <Input
          aria-label={t('lang.addAria')}
          placeholder={t('lang.placeholder')}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="outline" className="h-11" onClick={addCustom} disabled={!custom.trim()}>
          <Plus aria-hidden="true" /> {t('lang.add')}
        </Button>
      </div>
    </div>
  );
}
