'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/** A row of single-choice chips backed by native radio inputs. */
export function ChoiceChips<T extends string | number>({
  legend,
  legendClassName,
  options,
  value,
  onChange,
  disabled,
  describedBy,
}: {
  legend: string;
  legendClassName?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  describedBy?: string;
}) {
  const name = useId();
  return (
    <fieldset className="min-w-0" disabled={disabled} aria-describedby={describedBy}>
      <legend className={cn('mb-2 text-sm font-medium', legendClassName)}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={String(o.value)}
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition-colors',
                'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60',
                checked ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/40 hover:bg-accent/40',
              )}
            >
              <input
                type="radio"
                name={name}
                value={String(o.value)}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
