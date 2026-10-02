import type { ReactNode } from 'react';
import { AartiFrame } from '@/components/brand/aarti-frame';
import { Diya } from '@/components/brand/diya';
import { Mandala } from '@/components/brand/mandala';

/**
 * Two-panel auth layout: the twilight "sandhya" panel with a lit diya on the
 * left (top on mobile), and the form card circled by the aarti ring.
 */
export function AuthShell({
  shloka,
  shlokaMeaning,
  headline,
  lede,
  children,
}: {
  shloka: string;
  shlokaMeaning: string;
  headline: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-0 px-0 sm:px-6 sm:py-10 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-12 lg:py-16">
      <aside className="sandhya stars relative flex flex-col justify-end overflow-hidden px-6 pt-10 pb-24 sm:rounded-3xl sm:px-10 lg:min-h-144 lg:pb-12">
        <Mandala className="mandala-spin absolute -top-24 -right-24 size-104 text-diya/20 lg:-top-16 lg:-right-16 lg:size-136" />
        <div className="relative">
          <Diya className="mb-6 size-14 lg:size-20" />
          <p lang="sa" className="font-heading text-2xl leading-relaxed text-[#fbe3b6] lg:text-3xl">
            {shloka}
          </p>
          <p className="mt-1 text-sm text-[#f4e6d4]/70">{shlokaMeaning}</p>
          <h1 className="mt-8 hidden max-w-md text-4xl leading-snug lg:block">{headline}</h1>
          <p className="mt-4 hidden max-w-md lg:block">{lede}</p>
        </div>
      </aside>

      <div className="relative -mt-16 px-4 pb-12 sm:px-0 lg:mt-0 lg:self-center lg:pb-0">
        <AartiFrame innerClassName="p-6 sm:p-8">{children}</AartiFrame>
      </div>
    </div>
  );
}

/** Google "G" mark for the social sign-in button. */
export function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-6 flex items-center gap-3" role="separator">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
