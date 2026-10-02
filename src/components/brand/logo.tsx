'use client';

import Link from 'next/link';
import { Diya } from './diya';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const t = useT('customer');
  const tc = useT('common');
  return (
    <Link
      href="/"
      className={cn('group inline-flex items-center gap-2 rounded-lg', className)}
      aria-label={t('logo.home')}
    >
      <Diya className="size-8 -mt-1" />
      <span
        className={cn(
          'font-heading text-xl leading-none tracking-tight',
          onDark ? 'text-[#fbe3b6]' : 'text-heading',
        )}
      >
        {tc('brand.name')}
      </span>
    </Link>
  );
}
