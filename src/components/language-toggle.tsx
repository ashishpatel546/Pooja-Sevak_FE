'use client';

import { Languages } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import { LOCALES, type Locale } from '@/i18n/config';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Switches between हिन्दी and English. When signed in, the choice is also
 * saved as the user's preferred_language (see AuthProvider.changeLanguage).
 *
 * - `variant="compact"` (default): a single icon-sized button showing the
 *   other language ("EN" / "हि") — for the top bar.
 * - `variant="segmented"`: both languages side by side — for menus and forms.
 */
export function LanguageToggle({
  className,
  onChange,
  showLabel = false,
  variant = 'compact',
}: {
  className?: string;
  onChange?: (next: Locale) => void;
  showLabel?: boolean;
  variant?: 'compact' | 'segmented';
}) {
  const { locale } = useLocale();
  const { changeLanguage } = useAuth();
  const t = useT('common');

  const choose = (next: Locale) => {
    if (next === locale) return;
    changeLanguage(next);
    onChange?.(next);
  };

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label={t('language.label')}
        className={cn('inline-grid grid-cols-2 gap-1 rounded-xl border bg-muted/60 p-1', className)}
      >
        {LOCALES.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={active}
              onClick={() => choose(l)}
              className={cn(
                'min-h-11 rounded-lg px-4 text-base font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                active
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-diya/40'
                  : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
              )}
            >
              {t(`language.${l}`)}
            </button>
          );
        })}
      </div>
    );
  }

  const next: Locale = locale === 'hi' ? 'en' : 'hi';
  const nextLabel = t(`language.${next}`);
  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? 'default' : 'icon'}
      className={cn('min-h-10 font-medium', !showLabel && 'size-10', className)}
      aria-label={t('language.switchTo', { language: nextLabel })}
      title={t('language.switchTo', { language: nextLabel })}
      onClick={() => choose(next)}
    >
      {showLabel ? (
        <>
          <Languages className="size-4" aria-hidden="true" />
          <span lang={next}>{nextLabel}</span>
        </>
      ) : (
        <span aria-hidden="true" lang={next} className="text-sm leading-none">
          {next === 'hi' ? 'हि' : 'EN'}
        </span>
      )}
    </Button>
  );
}
