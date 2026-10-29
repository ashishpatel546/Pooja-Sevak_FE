'use client';

import { useState } from 'react';
import { ImageDown } from 'lucide-react';
import { useLocale, useT } from '@/i18n';
import { track } from '@/lib/analytics';
import type { KootaKey } from '@/lib/kundali';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useReportT, type ReportT } from '@/components/kundali/report-kit';
import { ShareButtons, shareUrl, whatsappHref } from './share-buttons';

const MILAN_PATH = '/kundali-milan';
const SIZE = 1080;

type Koot = { key: KootaKey; max: number; score: number };

const fmt = (x: number) => (x % 1 === 0 ? String(x) : x.toFixed(1));

/** The page's own fonts (next/font family names), so Devanagari is shaped by the browser. */
function fontFamilies() {
  const css = getComputedStyle(document.documentElement);
  const heading = css.getPropertyValue('--font-tiro').trim() || 'serif';
  const body = css.getPropertyValue('--font-mukta').trim() || 'sans-serif';
  return { heading: `${heading}, serif`, body: `${body}, sans-serif` };
}

/**
 * A square share card drawn on a canvas (the browser shapes Devanagari correctly,
 * which next/og cannot). It carries only the score and the koot points — never
 * names or birth details.
 */
async function drawCard(o: { score: number; kootas: Koot[]; title: string; sub: string; cta: string; rt: ReportT }) {
  const f = fontFamilies();
  await Promise.all([
    document.fonts.load(`64px ${f.heading}`, o.title),
    document.fonts.load(`32px ${f.body}`, o.sub),
  ]).catch(() => undefined);

  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, '#140f24');
  bg.addColorStop(0.55, '#3a1d3f');
  bg.addColorStop(1, '#b8430c');
  g.fillStyle = bg;
  g.fillRect(0, 0, SIZE, SIZE);

  const pad = 80;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#f7b733';
  g.font = `36px ${f.heading}`;
  g.fillText('॥ श्री गणेशाय नमः ॥', pad, 120);

  g.fillStyle = '#fff7e8';
  g.font = `72px ${f.heading}`;
  g.fillText(o.title, pad, 230, SIZE - pad * 2);
  g.fillStyle = '#f4e6d4';
  g.font = `32px ${f.body}`;
  g.fillText(o.sub, pad, 285, SIZE - pad * 2);

  // Koot bars.
  const top = 350;
  const rowH = 62;
  const barX = 420;
  const barW = SIZE - pad - barX - 110;
  o.kootas.forEach((k, i) => {
    const y = top + i * rowH;
    g.fillStyle = '#fbe3b6';
    g.font = `34px ${f.body}`;
    g.fillText(o.rt(`koota.${k.key}`), pad, y + 30, barX - pad - 20);
    g.fillStyle = 'rgba(255,255,255,0.15)';
    g.fillRect(barX, y + 8, barW, 24);
    g.fillStyle = '#f7b733';
    g.fillRect(barX, y + 8, barW * Math.max(0, Math.min(1, k.score / k.max)), 24);
    g.fillStyle = '#fff7e8';
    g.textAlign = 'right';
    g.fillText(`${fmt(k.score)}/${k.max}`, SIZE - pad, y + 30);
    g.textAlign = 'left';
  });

  g.fillStyle = '#f7b733';
  g.fillRect(pad, SIZE - 150, 200, 6);
  g.fillStyle = '#f4e6d4';
  g.font = `34px ${f.body}`;
  g.fillText(o.cta, pad, SIZE - 90, SIZE - pad * 2);
  g.fillStyle = '#fff7e8';
  g.font = `38px ${f.heading}`;
  g.fillText(`${window.location.host}${MILAN_PATH}`, pad, SIZE - 40, SIZE - pad * 2);

  return new Promise<Blob | null>((resolve) => c.toBlob(resolve, 'image/jpeg', 0.9));
}

/**
 * Share a milan result: an image card (Web Share with a file on phones,
 * otherwise a download), plus WhatsApp text and copy link to /kundali-milan.
 */
export function MilanShare({
  score,
  kootas,
  className,
}: {
  score: number;
  kootas: Koot[];
  className?: string;
}) {
  const tt = useT('tools');
  const { locale } = useLocale();
  const rt = useReportT(locale);
  const [busy, setBusy] = useState(false);
  const text = tt('share.milanText', { score: fmt(score) });

  const shareImage = async () => {
    setBusy(true);
    track('share_clicked', { channel: 'image', source: 'milan' });
    try {
      const blob = await drawCard({
        score,
        kootas,
        title: tt('share.milanCardTitle', { score: fmt(score) }),
        sub: tt('share.milanCardSub'),
        cta: tt('share.milanCardCta'),
        rt,
      });
      if (!blob) throw new Error('canvas');
      const file = new File([blob], `kundali-milan-${fmt(score)}-36.jpg`, { type: 'image/jpeg' });
      const url = shareUrl(MILAN_PATH);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${url}` });
      } else {
        // Desktop: save the card, and open WhatsApp with the text and link.
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
        window.open(whatsappHref(text, url), '_blank', 'noopener,noreferrer');
      }
    } catch {
      /* share sheet cancelled */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2 print:hidden', className)}>
      <Button size="sm" onClick={shareImage} disabled={busy}>
        <ImageDown aria-hidden="true" />
        {tt('share.image')}
      </Button>
      <ShareButtons text={text} path={MILAN_PATH} source="milan" />
    </div>
  );
}
