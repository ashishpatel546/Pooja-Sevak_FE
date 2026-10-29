// Shapes of GET /v1/muhurat/dates (backend src/muhurat). Shared by the finder and the server page.
export type Bilingual = { en: string; hi: string };
export type MuhuratKind = 'vivah' | 'griha_pravesh';
type Iso = { start: string; end: string };

export type MuhuratDay = {
  date: string;
  weekday: number;
  tithi_name: Bilingual;
  nakshatra_name: Bilingual;
  lunar_month: Bilingual;
  windows: (Iso & { tithi_name: Bilingual; nakshatra_name: Bilingual })[];
};
export type MuhuratBlocked = {
  reason: 'chaturmas' | 'kharmas' | 'adhik' | 'guru_asta' | 'shukra_asta';
  from: string;
  to: string;
};
export type MuhuratSearch = { kind: MuhuratKind; from: string; to: string; days: MuhuratDay[]; blocked: MuhuratBlocked[] };
