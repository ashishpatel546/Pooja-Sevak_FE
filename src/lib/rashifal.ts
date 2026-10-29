// Daily rashifal: the twelve moon signs, API shapes (backend src/rashifal) and the
// visitor's remembered rashi.

export type RashiSlug =
  | 'mesh'
  | 'vrishabh'
  | 'mithun'
  | 'kark'
  | 'singh'
  | 'kanya'
  | 'tula'
  | 'vrishchik'
  | 'dhanu'
  | 'makar'
  | 'kumbh'
  | 'meen';

export type Rashi = { slug: RashiSlug; index: number; hi: string; en: string; western: string; glyph: string };

/** Index 0 = Mesh, as in the panchang and kundali engines. */
export const RASHIS: Rashi[] = [
  { slug: 'mesh', index: 0, hi: 'मेष', en: 'Mesh', western: 'Aries', glyph: '♈' },
  { slug: 'vrishabh', index: 1, hi: 'वृषभ', en: 'Vrishabh', western: 'Taurus', glyph: '♉' },
  { slug: 'mithun', index: 2, hi: 'मिथुन', en: 'Mithun', western: 'Gemini', glyph: '♊' },
  { slug: 'kark', index: 3, hi: 'कर्क', en: 'Kark', western: 'Cancer', glyph: '♋' },
  { slug: 'singh', index: 4, hi: 'सिंह', en: 'Singh', western: 'Leo', glyph: '♌' },
  { slug: 'kanya', index: 5, hi: 'कन्या', en: 'Kanya', western: 'Virgo', glyph: '♍' },
  { slug: 'tula', index: 6, hi: 'तुला', en: 'Tula', western: 'Libra', glyph: '♎' },
  { slug: 'vrishchik', index: 7, hi: 'वृश्चिक', en: 'Vrishchik', western: 'Scorpio', glyph: '♏' },
  { slug: 'dhanu', index: 8, hi: 'धनु', en: 'Dhanu', western: 'Sagittarius', glyph: '♐' },
  { slug: 'makar', index: 9, hi: 'मकर', en: 'Makar', western: 'Capricorn', glyph: '♑' },
  { slug: 'kumbh', index: 10, hi: 'कुंभ', en: 'Kumbh', western: 'Aquarius', glyph: '♒' },
  { slug: 'meen', index: 11, hi: 'मीन', en: 'Meen', western: 'Pisces', glyph: '♓' },
];

export function rashiBySlug(slug: string | null | undefined): Rashi | undefined {
  return RASHIS.find((r) => r.slug === slug);
}

/** "मेष" / "Mesh (Aries)" */
export function rashiName(r: Rashi, lang: 'hi' | 'en'): string {
  return lang === 'hi' ? r.hi : `${r.en} (${r.western})`;
}

export type ShaniStatus =
  | 'sade_sati_rising'
  | 'sade_sati_peak'
  | 'sade_sati_setting'
  | 'dhaiya_kantak'
  | 'dhaiya_ashtam';

type SignRef = { index: number; slug: RashiSlug; name: string; western: string };

/** Shared day context: GET /rashifal/today and /rashifal/:sign. Strings are in the asked language. */
export type RashifalDayContext = {
  date: string;
  weekday: number;
  weekday_name: string;
  tithi: string;
  nakshatra: string;
  moon_sign: number;
  moon_sign_name: string;
  lang: 'hi' | 'en';
};

export type RashifalOverview = RashifalDayContext & {
  signs: {
    sign: SignRef;
    rating: number;
    moon_house: number;
    moon_favourable: boolean;
    headline: string;
    overall: string;
    shani: ShaniStatus | null;
  }[];
  method: string;
};

export type RashifalPlanet = {
  graha: 'su' | 'mo' | 'ma' | 'me' | 'ju' | 've' | 'sa' | 'ra' | 'ke';
  name: string;
  sign: number;
  sign_name: string;
  house: number;
  favourable: boolean;
  retrograde: boolean;
};

export type RashifalReading = RashifalDayContext & {
  sign: SignRef;
  moon_house: number;
  moon_favourable: boolean;
  rating: number;
  headline: string;
  overall: string;
  career: string;
  money: string;
  love: string;
  health: string;
  outlook: string;
  shani: { status: ShaniStatus; text: string } | null;
  remedy: string;
  lucky: { colour: string; number: number };
  moon_change: { at: string; sign_name: string; house: number; note: string } | null;
  planets: RashifalPlanet[];
  method: string;
};

export type RashifalWeek = {
  sign: SignRef;
  from: string;
  to: string;
  days: { date: string; weekday: number; moon_house: number; moon_favourable: boolean; rating: number; headline: string }[];
  best_days: string[];
  outlook: string;
  shani: { status: ShaniStatus; text: string } | null;
  method: string;
  lang: 'hi' | 'en';
};

/** GET /rashifal/me */
export type MyRashi = {
  sign: RashiSlug | null;
  source: 'preference' | 'kundali' | null;
  kundali_sign: RashiSlug | null;
  kundali_title: string | null;
};

// ───────────── the visitor's rashi, remembered in this browser ─────────────

const KEY = 'ps_rashi';
export const RASHI_EVENT = 'ps:rashi';

export function readSavedRashi(): RashiSlug | null {
  try {
    return rashiBySlug(localStorage.getItem(KEY))?.slug ?? null;
  } catch {
    return null;
  }
}

export function saveRashi(slug: RashiSlug | null) {
  try {
    if (slug) localStorage.setItem(KEY, slug);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  window.dispatchEvent(new CustomEvent(RASHI_EVENT, { detail: slug }));
}

/** Civil date (YYYY-MM-DD) in India. */
export function todayIst(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

/** Puja suggested on a sign page when Shani's Sade Sati or dhaiya is running. */
export const SHANI_PUJA_SLUG = 'shani-shanti-puja';

const ORDINAL_HI = ['पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे', 'सातवें', 'आठवें', 'नौवें', 'दसवें', 'ग्यारहवें', 'बारहवें'];
const ORDINAL_EN = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

/** House as it reads in a sentence: 'तीसरे' / '3rd'. */
export function houseOrdinal(n: number, lang: 'hi' | 'en'): string {
  return (lang === 'hi' ? ORDINAL_HI : ORDINAL_EN)[n - 1] ?? String(n);
}

/** '29 अक्टूबर 2026' / '29 October 2026' */
export function civilDateLabel(date: string, lang: 'hi' | 'en'): string {
  return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

/** YYYY-MM-DD plus `n` days. */
export function shiftDate(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
