import raw from "../data/piano.json";

export type Vol = "basso" | "medio" | "alto";
export interface Item { code: string; ex: string; vol: Record<Vol, string>; intensity: string; tempo: string; rest: string; note?: string }
export interface Session { id: string; day: string; title: string; duration: string; warmup: string; items: Item[]; notes: string }
export interface Phase { id: string; program: "bjj" | "ironman" | "transizione"; name: string; dates: string; goal: string; weekly: string; sessions: Session[] }
export interface Exercise { name: string; how: string[]; why: string; mistake: string; fig: string | null }

export const PLAN = raw as unknown as {
  meta: { hypotheses: string };
  exercises: Record<string, Exercise>;
  phases: Phase[];
  volume_rules: { id: string; text: string; phase?: string }[];
  weight: Record<string, unknown>;
  nutrition: { phase: string; text: string }[];
  warnings: { level: string; signal: string; action: string }[];
  corrections: { id: string; where: string; what: string; fix: string }[];
};

/** Data di inizio di ogni fase (la domenica BJJ è trasversale e non compare). */
export const START: Record<string, string> = {
  bjj1_accumulo: "2026-11-23", bjj2_intens: "2026-12-07", bjj2b_natale: "2026-12-21", bjj3_viaggio: "2026-12-27",
  bjj4_rientro: "2027-01-10", bjj5_gara: "2027-01-18", transizione: "2027-01-24", im_f1: "2027-02-08", im_f2: "2027-03-08",
  im_f3: "2027-05-03", im_f4: "2027-10-11", im_f5: "2027-11-01", im_f6: "2028-02-21", im_f7: "2028-05-08", im_f8: "2028-06-05",
  im_f9: "2028-07-31", im_f10: "2028-09-11", im_f11: "2028-10-02",
};

export const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function currentPhaseId(today = isoToday()): string {
  const ids = Object.keys(START); let cur = ids[0];
  for (const id of ids) if (START[id] <= today) cur = id;
  return cur;
}
export const phase = (id: string) => PLAN.phases.find(p => p.id === id)!;
export const exercise = (id: string): Exercise => PLAN.exercises[id] ?? { name: id, how: [], why: "", mistake: "", fig: null };

/** "3 × 8" → 3 serie; "2 × Cl (10)" → 2; "—" → 0; altro → 1. */
export function setCount(v: string): number {
  if (!v || /^\s*—/.test(v)) return 0;
  const m = v.match(/^\s*(\d+)\s*[×x]/); return m ? Math.min(8, +m[1]) : 1;
}
/** "90\"" → 90; "2–3'" → 120; "60–180\"" → 60; "—" → 0. */
export function restSeconds(r: string): number {
  if (!r) return 0;
  const m = r.match(/(\d+(?:[.,]\d+)?)/); if (!m) return 0;
  const n = parseFloat(m[1].replace(",", "."));
  return /'/.test(r) && !/"/.test(r) ? Math.round(n * 60) : Math.round(n);
}

/** Punteggio per scegliere il volume (dalle regole del piano). */
export const SCORE = {
  bjj: { range: [[0, 3, "basso"], [4, 6, "medio"], [7, 8, "alto"]] as [number, number, Vol][], qs: [
    ["Sonno (ultime 2 notti)", ["< 6 h", "6–7 h", "≥ 7 h, buono"]],
    ["Botte del tatami (24–48 h)", ["Guerra", "Normale", "Tecnica / leggero"]],
    ["Dolori", ["Articolare o cambia il movimento", "Indolenzimento", "Niente"]],
    ["Energia e stress", ["A terra", "Normale", "Carico"]]] as [string, string[]][] },
  ironman: { range: [[0, 4, "basso"], [5, 7, "medio"], [8, 10, "alto"]] as [number, number, Vol][], qs: [
    ["Sonno (ultime 2 notti)", ["< 6 h", "6–7 h", "≥ 7 h, buono"]],
    ["Gambe", ["Pesanti", "Un po’ stanche", "Fresche"]],
    ["Fatica e motivazione", ["A terra", "Normale", "Carico"]],
    ["Ultime 24 h", ["Lungo o intenso", "Seduta media", "Facile o riposo"]],
    ["Domani", ["Seduta chiave", "Seduta media", "Facile o riposo"]]] as [string, string[]][] },
};
