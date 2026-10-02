import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Page title block. `back` renders above the title (e.g. a back link). */
export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {back && <div className="mb-3">{back}</div>}
        <h1 className="text-3xl leading-tight text-balance sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Standard page container widths. */
export function PageShell({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'narrow' | 'default' | 'wide';
}) {
  const max = size === 'narrow' ? 'max-w-2xl' : size === 'wide' ? 'max-w-7xl' : 'max-w-6xl';
  return <div className={cn('mx-auto w-full px-4 py-8 sm:px-6 sm:py-12', max, className)}>{children}</div>;
}
