'use client';

import { useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { apiBlob } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { ChartStyle } from './kundali-chart';
import type { ReportT } from './report-kit';

const SITE = 'https://www.pujasevak.in/kundali';

function save(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * "Download PDF" fetches the PDF made on the server (same on every phone) and falls back to
 * the browser's print dialog when the server can't make one. "Send on WhatsApp" prepares the
 * same file, then hands it to the phone's share sheet; a second tap is needed because phones
 * only open the share sheet straight from a tap.
 */
export function PdfActions({
  reportId,
  token,
  lang,
  style,
  fileName,
  t,
}: {
  reportId: string;
  token: string | null;
  lang: Locale;
  style: ChartStyle;
  fileName: string;
  t: ReportT;
}) {
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [ready, setReady] = useState<File | null>(null);

  const fetchPdf = async (): Promise<File | null> => {
    if (!token) return null;
    const blob = await apiBlob(`/kundali/reports/${reportId}/pdf`, { token, query: { lang, style } });
    return blob && new File([blob], `${fileName}.pdf`, { type: 'application/pdf' });
  };

  const download = async () => {
    setBusy('download');
    const file = await fetchPdf();
    setBusy(null);
    if (file) save(file);
    else window.print();
  };

  const text = t('share.text', { title: fileName, url: SITE });
  const send = async (file: File) => {
    try {
      await navigator.share({ files: [file], title: fileName, text });
    } catch {
      /* closed the share sheet */
    }
    setReady(null);
  };
  const share = async () => {
    if (ready) return send(ready);
    setBusy('share');
    const file = await fetchPdf();
    setBusy(null);
    if (file && navigator.canShare?.({ files: [file] })) {
      setReady(file);
      return;
    }
    // Computers can't hand a file to WhatsApp: save it and open WhatsApp to attach it there.
    if (file) save(file);
    window.open(`https://wa.me/?text=${encodeURIComponent(t('share.attach', { title: fileName, url: SITE }))}`, '_blank', 'noopener');
  };

  return (
    <>
      <Button size="lg" variant="outline" onClick={() => void share()} disabled={busy !== null} aria-describedby="share-hint">
        {busy === 'share' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        {busy === 'share' ? t('share.preparing') : ready ? t('share.send') : t('share.button')}
      </Button>
      <p id="share-hint" className="sr-only">
        {t('share.hint')}
      </p>
      <Button size="lg" className="sm:ml-auto" onClick={() => void download()} disabled={busy !== null} aria-describedby="print-hint">
        {busy === 'download' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
        {busy === 'download' ? t('share.preparing') : t('report.print')}
      </Button>
    </>
  );
}
