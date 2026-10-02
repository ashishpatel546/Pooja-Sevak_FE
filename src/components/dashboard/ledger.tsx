import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A quiet, typographic ledger: label … value rows with a dotted leader,
 * like entries in a temple account book. Not loud KPI cards.
 */
export function Ledger({
  title,
  caption,
  children,
  className,
}: {
  title?: ReactNode;
  caption?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border bg-card p-5 sm:p-6', className)}>
      {title && <h2 className="text-xl leading-tight">{title}</h2>}
      {caption && <p className="mt-1 text-sm text-muted-foreground">{caption}</p>}
      <dl className={cn('grid', title || caption ? 'mt-4' : '')}>{children}</dl>
    </section>
  );
}

export function LedgerRow({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="border-b border-dashed py-3 last:border-b-0">
      <div className="flex items-baseline gap-3">
        <dt className={cn('min-w-0', emphasis ? 'font-medium text-foreground' : 'text-muted-foreground')}>
          {label}
        </dt>
        <span
          aria-hidden="true"
          className="mb-1 min-w-4 flex-1 self-end border-b border-dotted border-muted-foreground/30"
        />
        <dd
          className={cn(
            'shrink-0 text-right tabular-nums',
            emphasis ? 'font-heading text-2xl text-heading' : 'text-lg font-medium',
          )}
        >
          {value}
        </dd>
      </div>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
