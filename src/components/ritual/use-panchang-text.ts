'use client';

import { useMemo } from 'react';
import { useLocale, useT } from '@/i18n';
import type { Messages } from '@/i18n/messages';
import type { ObservanceKey, Paksha } from '@/lib/types';
import { localized, pakshaOf, tithiInPaksha } from './observance';

type PanchangKey = keyof Messages['panchang'] & string;

type LunarDate = {
  tithi: number | null;
  paksha?: Paksha | null;
  lunar_month_en?: string | null;
  lunar_month_hi?: string | null;
};

/** Words for the lunar calendar in the visitor's language. */
export function usePanchangText() {
  const t = useT('panchang');
  const { locale } = useLocale();
  return useMemo(() => {
    const tithiName = (tithi: number) => t(`tithi.${tithiInPaksha(tithi)}` as PanchangKey);
    const pakshaName = (p: Paksha) => t(`paksha.${p}` as PanchangKey);
    const typeName = (key: ObservanceKey) => t(`type.${key}` as PanchangKey);
    /** "Ashwin Krishna Dashami" / "आश्विन कृष्ण दशमी"; Purnima and Amavasya drop the paksha. */
    const lunarLine = (d: LunarDate) => {
      if (!d.tithi) return '';
      const month = locale === 'hi' ? (d.lunar_month_hi ?? d.lunar_month_en) : d.lunar_month_en;
      const tithi = tithiName(d.tithi);
      const inPaksha = tithiInPaksha(d.tithi);
      const paksha = pakshaName(d.paksha ?? pakshaOf(d.tithi));
      if (inPaksha === 15 || inPaksha === 30) {
        return month ? t('line.monthTithi', { month, tithi }) : tithi;
      }
      return month ? t('line.full', { month, paksha, tithi }) : t('line.pakshaTithi', { paksha, tithi });
    };
    const text = <T extends Record<string, unknown>>(obj: T, base: string) => localized(obj, base, locale);
    return { t, locale, tithiName, pakshaName, typeName, lunarLine, text };
  }, [t, locale]);
}
