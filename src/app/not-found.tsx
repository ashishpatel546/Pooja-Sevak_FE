import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Diya } from '@/components/brand/diya';
import { getT } from '@/i18n/server';

export default async function NotFound() {
  const t = await getT('errors');
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <Diya className="size-16" lit={false} />
      <h1 className="mt-6 text-3xl leading-snug sm:text-4xl">{t('notFound.title')}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">{t('notFound.body')}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button size="lg" render={<Link href="/pujas" />} nativeButton={false}>
          {t('notFound.explore')}
        </Button>
        <Button size="lg" variant="outline" render={<Link href="/" />} nativeButton={false}>
          {t('notFound.home')}
        </Button>
      </div>
    </div>
  );
}
