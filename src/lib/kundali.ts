// Types for /v1/kundali (backend src/kundali/engine). Names arrive in both languages.
import type { Locale } from '@/i18n/config';

export type Bilingual = { en: string; hi: string };
export type GrahaKey = 'su' | 'mo' | 'ma' | 'me' | 'ju' | 've' | 'sa' | 'ra' | 'ke';
export type Dignity = 'exalted' | 'debilitated' | 'own' | 'friend' | 'neutral' | 'enemy';
export type KundaliKind = 'kundali' | 'milan';
export type Gender = 'male' | 'female' | 'other';

export type BirthDetails = {
  name: string; // empty for a newborn not yet named
  /** The name in Devanagari, shown beside it on Hindi reports. */
  name_hi?: string;
  newborn?: boolean;
  gender: Gender;
  date: string;
  time: string;
  place: { label: string; lat: number; lng: number; tz: string };
};

export type KundaliInput = { person: BirthDetails } | { boy: BirthDetails; girl: BirthDetails };

export type SignPoint = {
  longitude: number;
  sign: number;
  sign_name: Bilingual;
  degree: number;
  nakshatra: number;
  nakshatra_name: Bilingual;
  pada: number;
  nakshatra_lord: GrahaKey;
  navamsa_sign: number;
};

export type GrahaPosition = SignPoint & {
  key: GrahaKey;
  name: Bilingual;
  short: Bilingual;
  house: number;
  retrograde: boolean;
  combust: boolean;
  dignity: Dignity | null;
  dignity_name: Bilingual | null;
  speed: number;
};

export type ManglikInfo = {
  house_from_lagna: number;
  house_from_moon: number;
  from_lagna: boolean;
  from_moon: boolean;
  mitigated: boolean;
  level: 'none' | 'partial' | 'present';
};

export type DashaPeriod = { lord: GrahaKey; start: string; end: string };
export type Antardasha = DashaPeriod & { pratyantardashas: DashaPeriod[] };
export type Mahadasha = DashaPeriod & { antardashas: Antardasha[] };

export type DoshaKey =
  | 'mangal'
  | 'kaal_sarp'
  | 'pitra'
  | 'grahan'
  | 'guru_chandal'
  | 'angarak'
  | 'shrapit'
  | 'vish'
  | 'kemadruma';
export type Dosha = {
  key: DoshaKey;
  present: boolean;
  cancelled: boolean;
  grahas: GrahaKey[];
  house: number | null;
  kind: Bilingual | null;
};

export type YogaKey = 'gajakesari' | 'budhaditya' | 'chandra_mangal' | 'ruchaka' | 'bhadra' | 'hamsa' | 'malavya' | 'shasha';
export type Yoga = { key: YogaKey; grahas: GrahaKey[]; house: number };

export type VargaKey = 'd2' | 'd3' | 'd7' | 'd9' | 'd10' | 'd12';
export type Varga = { lagna: number; grahas: Record<GrahaKey, number> };

export type Bhava = { house: number; sign: number; lord: GrahaKey; lord_house: number; grahas: GrahaKey[] };

export type Shubh = {
  rashi_lord: GrahaKey;
  lagna_lord: GrahaKey;
  ank: number;
  moolank: number;
  bhagyank: number;
  vaar: Bilingual;
  rang: Bilingual;
  dhatu: Bilingual;
  devta: Bilingual;
  disha: Bilingual;
  ratna: Bilingual;
};

export type ShaniPeriod = {
  kind: 'sade_sati' | 'kantak' | 'ashtam';
  start: string;
  end: string;
  phases: { phase: 'rising' | 'peak' | 'setting'; start: string; end: string }[];
};

export type Kundali = {
  birth: {
    instant: string;
    date: string;
    time: string;
    tz: string;
    utc_offset_minutes: number;
    lat: number;
    lng: number;
  };
  ayanamsa: number;
  lagna: SignPoint;
  grahas: GrahaPosition[];
  houses: { house: number; sign: number; grahas: GrahaKey[] }[];
  panchang: {
    vaar: Bilingual;
    tithi: number;
    tithi_name: Bilingual;
    paksha: 'shukla' | 'krishna';
    nakshatra: number;
    nakshatra_name: Bilingual;
    pada: number;
    yoga: Bilingual;
    karana: Bilingual;
    lunar_month: Bilingual;
    vikram_samvat: number;
    sunrise: string | null;
    sunset: string | null;
  };
  avakahada: {
    rashi: Bilingual;
    rashi_lord: Bilingual;
    nakshatra: Bilingual;
    pada: number;
    nakshatra_lord: Bilingual;
    lagna: Bilingual;
    lagna_lord: Bilingual;
    varna: Bilingual;
    vashya: Bilingual;
    yoni: Bilingual;
    gana: Bilingual;
    nadi: Bilingual;
    tatva: Bilingual;
    namakshar: string;
    namakshar_all: string[];
    paya: Bilingual;
    paya_nakshatra: Bilingual;
  };
  manglik: ManglikInfo;
  dasha: {
    birth_lord: GrahaKey;
    balance_years: number;
    mahadashas: Mahadasha[];
  };
  bhavas: Bhava[];
  vargas: Record<VargaKey, Varga>;
  doshas: Dosha[];
  yogas: Yoga[];
  shubh: Shubh;
  shani: ShaniPeriod[];
};

export type KootaKey = 'varna' | 'vashya' | 'tara' | 'yoni' | 'graha_maitri' | 'gana' | 'bhakoot' | 'nadi';

export type Koota = {
  key: KootaKey;
  max: number;
  score: number;
  boy: Bilingual;
  girl: Bilingual;
  dosha: boolean;
  cancelled: boolean;
};

export type MoonSummary = {
  rashi: number;
  rashi_name: Bilingual;
  nakshatra: number;
  nakshatra_name: Bilingual;
  pada: number;
};

export type MilanReport = {
  kootas: Koota[];
  total: number;
  max: 36;
  verdict: 'excellent' | 'good' | 'average' | 'low';
  boy: MoonSummary;
  girl: MoonSummary;
  manglik: { boy: ManglikInfo; girl: ManglikInfo; match: 'none' | 'balanced' | 'mild' | 'attention' };
  boy_kundali: Kundali;
  girl_kundali: Kundali;
};

export type KundaliReportSummary = {
  id: string;
  kind: KundaliKind;
  title: string;
  language: Locale;
  created_at: string;
  /** Null until first opened; only opened reports count against the free quota. */
  delivered_at: string | null;
  input: KundaliInput;
};

export type KundaliReportView = KundaliReportSummary & { result: Kundali | MilanReport };

export type KindQuota = { used: number; limit: number | null; remaining: number | null };
export type KundaliQuota = { unlimited: boolean; resets_on: string; kundali: KindQuota; milan: KindQuota };

/** API error code when the month's free reports are used up. */
export const QUOTA_EXHAUSTED = 'kundali_quota_exhausted';

export function isMilan(r: Kundali | MilanReport): r is MilanReport {
  return 'kootas' in r;
}

export function pickName(b: Bilingual, lang: Locale): string {
  return lang === 'hi' ? b.hi : b.en;
}

/** 12.3456° → 12°20′44″. */
/** A person's name as a report shows it: on Hindi reports with the Devanagari spelling beside it. */
export function displayName(p: { name: string; name_hi?: string }, lang: Locale): string {
  return lang === 'hi' && p.name && p.name_hi && p.name_hi !== p.name ? `${p.name} (${p.name_hi})` : p.name;
}

export function dms(deg: number): string {
  const total = Math.round(deg * 3600);
  const d = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
}
