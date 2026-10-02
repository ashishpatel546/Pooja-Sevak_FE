'use client';

import { Check } from 'lucide-react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import { rich } from '@/components/common/rich';

/** Numbered progress for multi-step flows. Completed steps can be revisited. */
export function StepIndicator({
  steps,
  current,
  onSelect,
}: {
  steps: string[];
  current: number; // 0-based
  onSelect?: (index: number) => void;
}) {
  const t = useT('customer');
  return (
    <nav aria-label={t('steps.nav')}>
      <p className="mb-3 text-sm text-muted-foreground sm:hidden">
        {rich(t('steps.mobile', { n: current + 1, total: steps.length }), {
          label: <span className="font-medium text-foreground">{steps[current]}</span>,
        })}
      </p>
      <ol className="flex items-center gap-2 sm:gap-3">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const content = (
            <>
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors',
                  done && 'border-tulsi bg-tulsi text-white',
                  active && 'border-primary bg-primary text-primary-foreground',
                  !done && !active && 'bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm sm:inline',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </>
          );
          return (
            <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3" aria-current={active ? 'step' : undefined}>
              {done && onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className="flex min-h-11 items-center gap-2 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  aria-label={t('steps.back', { n: i + 1, label })}
                >
                  {content}
                </button>
              ) : (
                <span className="flex min-h-11 items-center gap-2" aria-label={t('steps.item', { n: i + 1, label })}>
                  {content}
                </span>
              )}
              {i < steps.length - 1 && (
                <span
                  className={cn('h-px flex-1', done ? 'bg-tulsi/60' : 'bg-border')}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
