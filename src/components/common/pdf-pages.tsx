'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useT } from '@/i18n';

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

/**
 * pdf.js is ~1 MB: loaded only when a PDF is opened. The legacy build also
 * runs on older iPhone Safari. One module worker is shared by every viewer;
 * Turbopack bundles it from the package (served from /_next, i.e. 'self').
 */
let pdfjsPromise: Promise<PdfJs> | null = null;
function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import('pdfjs-dist/legacy/build/pdf.mjs').then((pdfjs) => {
    if (!pdfjs.GlobalWorkerOptions.workerPort) {
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(
        new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url),
        { type: 'module' },
      );
    }
    return pdfjs;
  });
  pdfjsPromise.catch(() => (pdfjsPromise = null));
  return pdfjsPromise;
}

/** Output pixels never exceed this width (memory on phones). */
const MAX_PIXEL_WIDTH = 2000;

type Page = { n: number; src: string; width: number; height: number };

/**
 * Renders every page of a PDF as an image, top to bottom. Pages are drawn on
 * one reused canvas and turned into blob images, so a long list doesn't keep
 * many large canvases alive (iOS Safari limits canvas memory), and pinch-zoom
 * works like on any picture. `src` must be same-origin (the bucket has no CORS).
 */
export function PdfPages({
  src,
  title,
  fallbackHref,
}: {
  src: string;
  /** Accessible name prefix for page images, e.g. the puja name. */
  title: string;
  /** Shown as "open in a new tab" when the PDF cannot be drawn here. */
  fallbackHref: string;
}) {
  const t = useT('samagri');
  const box = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    let destroy: (() => Promise<void>) | null = null;

    (async () => {
      const pdfjs = await loadPdfJs();
      const res = await fetch(src, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = new Uint8Array(await res.arrayBuffer());
      if (cancelled) return;
      const task = pdfjs.getDocument({
        data,
        // Copied from pdfjs-dist by scripts/copy-pdfjs-assets.mjs.
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        wasmUrl: '/pdfjs/wasm/',
      });
      destroy = () => task.destroy();
      const doc = await task.promise;
      if (cancelled) return;
      setTotal(doc.numPages);

      const cssWidth = Math.max(280, box.current?.clientWidth ?? 600);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement('canvas');
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        // A little extra resolution so text stays sharp when pinch-zoomed.
        const target = Math.min(cssWidth * ratio * 1.5, MAX_PIXEL_WIDTH);
        const viewport = page.getViewport({ scale: target / base.width });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvas, viewport }).promise;
        page.cleanup();
        const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.9));
        if (!blob) throw new Error('Could not draw the page');
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        setPages((p) => [...p, { n, src: url, width: canvas.width, height: canvas.height }]);
      }
      // Release the canvas backing store right away.
      canvas.width = 0;
      canvas.height = 0;
      if (!cancelled) setState('done');
    })().catch((err: unknown) => {
      if (cancelled) return;
      console.warn('[samagri] PDF could not be shown', err);
      setState('error');
    });

    return () => {
      cancelled = true;
      void destroy?.();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [src]);

  return (
    <div ref={box} className="grid gap-3">
      {total != null && total > 1 && (
        <p className="text-sm text-muted-foreground">{t.plural('viewer.pages', total)}</p>
      )}
      {pages.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element -- local blob URL of a rendered page
        <img
          key={p.n}
          src={p.src}
          width={p.width}
          height={p.height}
          alt={total && total > 1 ? t('viewer.pageAlt', { title, page: p.n, total }) : t('viewer.listAlt', { title })}
          className="h-auto w-full rounded-lg border bg-white shadow-xs"
        />
      ))}
      {state === 'error' && (
        <div role="alert" className="grid gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p>{t('viewer.error')}</p>
          <a
            href={fallbackHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink className="size-4" aria-hidden="true" /> {t('viewer.openNewTab')}
          </a>
        </div>
      )}
      {state === 'loading' && (
        <div
          role="status"
          className="grid min-h-48 place-items-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
        >
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <span>
            {total ? t('viewer.loadingPage', { page: Math.min(pages.length + 1, total), total }) : t('viewer.loading')}
          </span>
        </div>
      )}
    </div>
  );
}
