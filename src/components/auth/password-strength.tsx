'use client';

import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export const MIN_PASSWORD = 8;

/** 0–4: length plus variety of character classes. */
export function passwordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= MIN_PASSWORD) score++;
  if (pw.length >= 12) score++;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (classes >= 2) score++;
  if (classes >= 3) score++;
  if (pw.length < MIN_PASSWORD) score = Math.min(score, 1);
  return Math.max(1, Math.min(4, score));
}

const LEVELS = ['strength.weak', 'strength.fair', 'strength.good', 'strength.strong'] as const;
const COLORS = ['bg-destructive', 'bg-diya', 'bg-tulsi/70', 'bg-tulsi'];

/** Four-segment meter with a short, polite hint. `id` is for aria-describedby. */
export function PasswordStrength({ id, password }: { id: string; password: string }) {
  const t = useT('auth');
  const score = passwordScore(password);
  const level = score ? t(LEVELS[score - 1]) : '';
  return (
    <div id={id} className="grid gap-1.5">
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 rounded-full transition-colors', i <= score ? COLORS[score - 1] : 'bg-muted')}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {password ? `${t('strength.label', { level })} · ` : ''}
        {t('strength.hint', { min: MIN_PASSWORD })}
      </p>
    </div>
  );
}
