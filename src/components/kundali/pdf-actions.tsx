'use client';

import { useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { api, apiBlob, apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { ChartStyle } from './kundali-chart';
import type { ReportT } from './report-kit';

const SITE = 'https://www.pujasevak.in/kundali';

/**
 * "Download PDF" is the browser's own print to PDF (no load on the server), the file named
 * after the report through the page title. "Send on WhatsApp" needs a real file, so it asks
 * the server for the PDF and hands it to the phone's share sheet; a second tap is needed
 * because phones only open the share sheet straight from a tap.
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
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<File | null>(null);

  const fetchPdf = async (): Promise<File | null> => {
    if (!token) return null;
    const blob = await apiBlob(`/kundali/reports/${reportId}/pdf`, { token, query: { lang, style } });
    return blob && new File([blob], `${fileName}.pdf`, { type: 'application/pdf' });
  };

  const download = () => {
    const title = document.title;
    document.title = fileName;
    window.print();
    document.title = title;
  };

  /** Saves the server PDF through a short-lived link, so the server names the file. */
  const saveFromServer = async () => {
    const link = await api<{ path: string }>(`/kundali/reports/${reportId}/pdf-link`, {
      method: 'POST',
      token,
      query: { lang, style },
    });
    window.location.assign(apiUrl(link.path));
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
    setBusy(true);
    // Phones can hand a PDF to WhatsApp through the share sheet.
    const probe = new File([''], 'x.pdf', { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [probe] })) {
      const file = await fetchPdf();
      setBusy(false);
      if (file) setReady(file);
      else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      return;
    }
    // Computers can't: save the PDF, then open WhatsApp to attach it there.
    const saved = await saveFromServer().then(
      () => true,
      () => false,
    );
    setBusy(false);
    const message = saved ? t('share.attach', { title: fileName, url: SITE }) : text;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  };

  return (
    <>
      <Button size="lg" variant="outline" onClick={() => void share()} disabled={busy} aria-describedby="share-hint">
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        {busy ? t('share.preparing') : ready ? t('share.send') : t('share.button')}
      </Button>
      <p id="share-hint" className="sr-only">
        {t('share.hint')}
      </p>
      <Button size="lg" className="sm:ml-auto" onClick={download} aria-describedby="print-hint">
        <Download aria-hidden="true" />
        {t('report.print')}
      </Button>
    </>
  );
}
