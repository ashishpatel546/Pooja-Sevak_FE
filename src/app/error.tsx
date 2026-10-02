'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Diya } from '@/components/brand/diya';

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useT('errors');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Diya className="size-16" lit={false} />
      <h1 className="mt-6 text-3xl leading-snug sm:text-4xl">{t('page.title')}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">{t('page.body')}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button size="lg" onClick={() => unstable_retry()}>
          <RotateCcw aria-hidden="true" />
          {t('page.retry')}
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/" />} nativeButton={false}>
          {t('page.home')}
        </Button>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-xs text-muted-foreground">{t('page.reference', { digest: error.digest })}</p>
      )}
    </div>
  );
}
