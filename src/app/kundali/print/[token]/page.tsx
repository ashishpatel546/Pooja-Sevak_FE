'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import type { KundaliReportView } from '@/lib/kundali';
import { useApiQuery } from '@/components/customer/use-api';
import type { ChartStyle } from '@/components/kundali/kundali-chart';
import { ReportDocument } from '@/components/kundali/report-document';
import { useReportT } from '@/components/kundali/report-kit';

/**
 * The page the server's PDF renderer opens (not linked from the site). The print token in
 * the URL stands in for sign-in; once the report and fonts are in, it marks the page ready.
 */
export default function KundaliPrintPage() {
  const { token } = useParams<{ token: string }>();
  const q = useSearchParams();
  const report = useApiQuery<KundaliReportView>(`/kundali/print/${encodeURIComponent(token)}`);
  const lang: Locale = q.get('lang') === 'en' ? 'en' : q.get('lang') === 'hi' ? 'hi' : (report.data?.language ?? 'hi');
  const style: ChartStyle = q.get('style') === 'south' ? 'south' : 'north';
  const t = useReportT(lang);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!report.data) return;
    // Every dasha list is open in the PDF, as when the family prints from the report page.
    document
      .querySelectorAll<HTMLDetailsElement>('article details:not([open]):not([data-print-skip])')
      .forEach((d) => (d.open = true));
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [report.data]);

  if (!report.data) return null;
  return (
    <div className="print:p-0" data-print-ready={ready ? '' : undefined}>
      <ReportDocument r={report.data} lang={lang} t={t} chartStyle={style} />
    </div>
  );
}
