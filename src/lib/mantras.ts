/**
 * Sacred mantras, always rendered in Devanagari Sanskrit (lang="sa") whatever
 * the UI locale. Deliberately NOT in the i18n message files: a mantra is never
 * translated or transliterated.
 *
 * Each mantra is a list of lines; each line a list of half-verses (padas) that
 * may wrap onto their own row on narrow screens but are never broken inside.
 */

export type Mantra = readonly (readonly string[])[];

export const SHUBHAM_BHAVATU = '॥ शुभं भवतु ॥';

/** Gayatri Mantra (Rigveda 3.62.10) with the vyahriti opening. */
export const GAYATRI_MANTRA: Mantra = [
  ['ॐ भूर्भुवः स्वः ।', 'तत्सवितुर्वरेण्यं'],
  ['भर्गो देवस्य धीमहि ।', 'धियो यो नः प्रचोदयात् ॥'],
];

/** Shri Ganesh vandana — invoked before beginning any work. */
export const VAKRATUNDA_MANTRA: Mantra = [
  ['वक्रतुण्ड महाकाय', 'सूर्यकोटि समप्रभ ।'],
  ['निर्विघ्नं कुरु मे देव', 'सर्वकार्येषु सर्वदा ॥'],
];
