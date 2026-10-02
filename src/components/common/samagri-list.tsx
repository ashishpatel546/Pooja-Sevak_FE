'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink, ImageOff, ListChecks, Loader2 } from 'lucide-react';
import { useFormat, useT } from '@/i18n';
import type { PanditServiceSamagri, PujaMode, SamagriList } from '@/lib/types';
import { offersLighter, samagriListFor } from '@/lib/samagri';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// pdf.js is only downloaded when a PDF list is actually opened.
const PdfPages = dynamic(() => import('./pdf-pages').then((m) => m.PdfPages), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
    </div>
  ),
});

type ListProps = {
  /** The pandit's uploaded list; null/undefined for older pujas without one. */
  list?: SamagriList | null;
  /** The catalogue's generic samagri, shown when there is no uploaded list. */
  items?: string[] | null;
  /** Puja name, for the heading and image descriptions. */
  pujaName: string;
  /** "पूर्ण विधि की सूची" / "संक्षिप्त विधि की सूची" when the puja has both versions. */
  modeLabel?: string;
  /** Shown above the list (e.g. the shorter version has no list of its own yet). */
  note?: string;
};

/**
 * The list to show for a version of the puja, with its label when the service
 * offers both versions. The shorter version falls back to the full list (with
 * a note) until the pandit uploads its own. `ts` is the samagri translator.
 */
export function samagriForMode(
  ts: (key: 'mode.fullList' | 'mode.lighterList' | 'mode.fallbackNote') => string,
  service: PanditServiceSamagri & { offers_lighter_mode?: boolean; lighter_mode_price?: number | null },
  mode: PujaMode,
): Pick<ListProps, 'list' | 'modeLabel' | 'note'> {
  const { list, fallback } = samagriListFor(service, mode);
  if (!offersLighter(service)) return { list };
  return {
    list,
    modeLabel: mode === 'lighter' && !fallback ? ts('mode.lighterList') : ts('mode.fullList'),
    note: fallback && list ? ts('mode.fallbackNote') : undefined,
  };
}

/** True when there is anything to show (an uploaded list or generic items). */
export const hasSamagri = ({ list, items }: Pick<ListProps, 'list' | 'items'>) => !!list || !!items?.length;

/**
 * "पूजा सामग्री सूची" viewer: the pandit's list (image or PDF) shown inside the
 * app — nothing to download. PDFs are drawn page by page with pdf.js (an
 * <iframe> shows only the first page on iPhone). Pinch-zoom works natively.
 */
export function SamagriListDialog({
  open,
  onOpenChange,
  ...props
}: ListProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useT('samagri');
  const tc = useT('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('viewer.title')}</DialogTitle>
          <DialogDescription>
            {props.modeLabel ? `${props.pujaName} · ${props.modeLabel}` : props.pujaName}
          </DialogDescription>
        </DialogHeader>
        {open && <SamagriListBody {...props} />}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="min-h-11" />}>{tc('action.close')}</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SamagriListBody({ list, items, pujaName, note }: ListProps) {
  const t = useT('samagri');
  const f = useFormat();
  const [imgState, setImgState] = useState<'loading' | 'done' | 'error'>('loading');

  if (!list) {
    if (!items?.length) {
      return <p className="text-sm text-muted-foreground">{t('viewer.none')}</p>;
    }
    return (
      <div className="grid gap-3">
        <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">{t('viewer.genericNote')}</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <ListChecks className="mt-0.5 size-4 shrink-0 text-tulsi" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const openLink = (
    <a
      href={list.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      <ExternalLink className="size-4" aria-hidden="true" /> {t('viewer.openNewTab')}
    </a>
  );

  return (
    <div className="grid gap-3">
      {note && <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">{note}</p>}
      {list.updated_at && (
        <p className="text-sm text-muted-foreground">
          {t('viewer.updated', { date: f.date(list.updated_at, { weekday: undefined }) })}
        </p>
      )}
      {list.type === 'pdf' ? (
        <PdfPages src={list.data_url} title={pujaName} fallbackHref={list.url} />
      ) : imgState === 'error' ? (
        <div role="alert" className="grid gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="flex items-center gap-2">
            <ImageOff className="size-4" aria-hidden="true" /> {t('viewer.error')}
          </p>
          {openLink}
        </div>
      ) : (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- presigned redirect; next/image would proxy a private file */}
          <img
            src={list.url}
            alt={t('viewer.listAlt', { title: pujaName })}
            onLoad={() => setImgState('done')}
            onError={() => setImgState('error')}
            className={cn('h-auto w-full rounded-lg border bg-white', imgState === 'loading' && 'min-h-48')}
          />
          {imgState === 'loading' && (
            <span role="status" className="absolute inset-0 grid place-items-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
              <span className="sr-only">{t('viewer.loading')}</span>
            </span>
          )}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{t('viewer.zoomHint')}</p>
      {openLink}
    </div>
  );
}

/**
 * A "सामग्री सूची देखें" button that opens the viewer. Renders nothing when
 * there is neither an uploaded list nor generic items.
 */
export function SamagriListButton({
  label,
  variant = 'link',
  className,
  ...props
}: ListProps & { label?: string; variant?: 'link' | 'outline' | 'ghost'; className?: string }) {
  const t = useT('samagri');
  const [open, setOpen] = useState(false);
  if (!hasSamagri(props)) return null;
  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={() => setOpen(true)}
        className={cn(variant === 'link' && 'h-auto min-h-11 px-0', className)}
      >
        <ListChecks aria-hidden="true" /> {label ?? t('viewer.open')}
      </Button>
      <SamagriListDialog open={open} onOpenChange={setOpen} {...props} />
    </>
  );
}
