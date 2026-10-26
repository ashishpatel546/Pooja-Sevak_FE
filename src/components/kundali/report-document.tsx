'use client';

import type { Locale } from '@/i18n/config';
import { displayName, isMilan, pickName, type KundaliReportView } from '@/lib/kundali';
import { normalizeBusinessProfile } from '@/lib/site-info';
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from '@/lib/support';
import { useApiQuery } from '@/components/customer/use-api';
import type { ChartStyle } from './kundali-chart';
import { KundaliReportBody } from './kundali-report';
import { MilanReportBody } from './milan-report';
import { KundaliCover, MilanCover, PrintFrame, PrintPages, pageRule } from './print-chrome';
import { fmtDate, type ReportT } from './report-kit';

/**
 * The report as a document: the on-screen report and, in print, the cover, border and
 * contact band. Shared by the report page and the print page the server turns into a PDF.
 */
export function ReportDocument({
  r,
  lang: reportLang,
  t,
  chartStyle,
}: {
  r: KundaliReportView;
  lang: Locale;
  t: ReportT;
  chartStyle: ChartStyle;
}) {
  // Contact details printed on every PDF page; the owner edits them in Admin → Settings.
  const profile = useApiQuery<unknown>('/public/business-profile');
  const biz = normalizeBusinessProfile(profile.data);
  const contact = { phone: biz?.support_phone || SUPPORT_PHONE_DISPLAY, email: biz?.support_email || SUPPORT_EMAIL };
  const milan = isMilan(r.result) && 'boy' in r.input ? { m: r.result, boy: r.input.boy, girl: r.input.girl } : null;
  const person = 'person' in r.input ? r.input.person : null;
  const prepared = t('report.preparedOn', { date: fmtDate(r.delivered_at ?? r.created_at, reportLang, 'Asia/Kolkata') });
  const moon = isMilan(r.result) ? null : r.result.grahas.find((g) => g.key === 'mo')!;

  return (
    <>
      {/* Edge-to-edge A4 so the border and colours print as designed; the frame sets its own margins. */}
      <style>{pageRule(t('pdf.page'))}</style>
      <PrintFrame contact={contact} t={t} />
    <PrintPages>
      <article lang={reportLang} className="grid grid-cols-1 gap-6 print:block print:space-y-6">
        {milan ? (
          <MilanCover
            boy={milan.boy}
            girl={milan.girl}
            boyName={displayName(milan.boy, reportLang)}
            girlName={displayName(milan.girl, reportLang)}
            total={milan.m.total}
            verdict={t(`milan.verdict.${milan.m.verdict}`)}
            prepared={prepared}
            lang={reportLang}
            t={t}
          />
        ) : (
          !isMilan(r.result) && (
            <KundaliCover
              person={person!}
              name={person!.name ? displayName(person!, reportLang) : t('report.ofNewborn')}
              lagna={r.result.lagna.sign}
              moon={moon!.sign}
              lagnaName={pickName(r.result.lagna.sign_name, reportLang)}
              rashiName={pickName(moon!.sign_name, reportLang)}
              nakshatra={pickName(r.result.panchang.nakshatra_name, reportLang)}
              prepared={prepared}
              lang={reportLang}
              t={t}
            />
          )
        )}
        <header className="sandhya stars relative overflow-hidden rounded-2xl px-5 py-8 text-center sm:px-8 print:hidden">
          <p lang="sa" className="font-heading text-lg text-diya">
            {t('hero.invocation')}
          </p>
          <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{milan ? t('report.milanTitle') : t('report.title')}</h1>
          <p className="mt-2 font-heading text-2xl text-[#fbe3b6]">
            {milan
              ? t('report.milanOf', { boy: displayName(milan.boy, reportLang), girl: displayName(milan.girl, reportLang) })
              : person!.name
                ? t('report.of', { name: displayName(person!, reportLang) })
                : t('report.ofNewborn')}
          </p>
          <div aria-hidden="true" className="toran mx-auto mt-4 max-w-xs" />
          <p className="mt-3 text-sm">{prepared}</p>
        </header>

        {milan ? (
          <MilanReportBody m={milan.m} boy={milan.boy} girl={milan.girl} lang={reportLang} t={t} chartStyle={chartStyle} />
        ) : (
          !isMilan(r.result) && (
            <KundaliReportBody
              k={r.result}
              person={person!}
              lang={reportLang}
              t={t}
              chartStyle={chartStyle}
              gochar={r.gochar}
            />
          )
        )}

        <footer className="grid gap-2 rounded-2xl border bg-accent/20 p-5 text-sm text-muted-foreground print:break-inside-avoid">
          <p>{t('footnote.method')}</p>
          <p className="font-medium text-foreground">{t('footnote.guidance')}</p>
        </footer>
      </article>
    </PrintPages>
    </>
  );
}
