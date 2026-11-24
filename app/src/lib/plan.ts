import raw from "../data/piano.json";

export type Vol = "basso" | "medio" | "alto";
export interface Item { code: string; ex: string; vol: Record<Vol, string>; intensity: string; tempo: string; rest: string; note?: string }
export interface Session { id: string; day: string; title: string; duration: string; warmup: string; items: Item[]; notes: string }
export interface Phase { id: string; program: "bjj" | "ironman" | "transizione"; name: string; dates: string; goal: string; weekly: string; sessions: Session[] }
/** Scheda testuale dell'esercizio. Animazioni e muscoli NON stanno qui: vedi data/figures.ts e data/library.ts. */
export interface Exercise { name: string; how: string[]; why: string; mistake: string }

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

/* ---------- data della gara ---------- */
export const RACE_DEFAULT = "2027-01-23";
const toD = (iso: string) => new Date(iso + "T12:00:00");
export const addDays = (iso: string, n: number) => { const d = toD(iso); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const daysBetween = (a: string, b: string) => Math.round((toD(b).getTime() - toD(a).getTime()) / 86400000);
/** Fasi che seguono la gara: la settimana gara (inizia il lunedì prima), la transizione e tutto l'Ironman. */
const FOLLOW_RACE = ["bjj5_gara", "transizione", "im_f1", "im_f2", "im_f3", "im_f4", "im_f5", "im_f6", "im_f7", "im_f8", "im_f9", "im_f10", "im_f11"];

/** Date di inizio delle fasi per una data di gara: se la gara si sposta, si spostano la settimana gara e tutto quello che viene dopo. */
export function phaseStarts(race = RACE_DEFAULT): Record<string, string> {
  const off = daysBetween(RACE_DEFAULT, race); const out = { ...START };
  if (off) FOLLOW_RACE.forEach(id => { out[id] = addDays(START[id], off); });
  // la settimana gara non può iniziare prima del rientro dal Messico
  if (out.bjj5_gara <= START.bjj4_rientro) out.bjj5_gara = addDays(START.bjj4_rientro, 1);
  return out;
}
export function currentPhaseId(today = isoToday(), race = RACE_DEFAULT): string {
  const st = phaseStarts(race); const ids = Object.keys(st); let cur = ids[0];
  for (const id of ids) if (st[id] <= today && (!cur || st[id] >= st[cur])) cur = id;
  return cur;
}
const fmtDay = (iso: string) => toD(iso).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
/** Date della fase da mostrare: quelle del piano, o ricalcolate se la gara è stata spostata. */
export function phaseDates(id: string, race = RACE_DEFAULT): string {
  const ph = phase(id); if (race === RACE_DEFAULT || !FOLLOW_RACE.includes(id)) return ph.dates;
  const st = phaseStarts(race); const ids = Object.keys(st).filter(k => st[k] > st[id]).sort((a, b) => st[a].localeCompare(st[b]));
  const end = ids.length ? addDays(st[ids[0]], -1) : null;
  return `${fmtDay(st[id])}${end ? ` – ${fmtDay(end)}` : ""} (ricalcolate sulla gara del ${fmtDay(race)})`;
}
/** Dal giorno gara − 8 niente volume Alto (regola del piano: 15 gennaio per la gara del 23). */
export const noAltoFrom = (race = RACE_DEFAULT) => addDays(race, -8);
/** Piani B già scritti nella ricerca (docs/ricerca/4-piano-finale.md §6.4). */
export const PLAN_B: Record<string, string> = {
  "2026-12-12": "Gara sab 12 dic: S1 accumulo · S2: mar 1 Forza A di intensificazione Basso/Medio (ultimo Nordic), ven 4 ultima pesante, sab 5 ultimo sparring duro, dom 6 P4 · S3: lun 7 gi tecnico, mar 8 attivazione, gio 10 tatami leggero, ven 11 riposo, sab 12 gara. Poi scarico, Natale e Messico libero (kit Medio).",
  "2026-12-19": "Gara sab 19 dic: S1–S2 accumulo · S3: mar 8 Forza A intensificazione Medio (ultimo Nordic), ven 11 ultima pesante, sab 12 ultimo sparring duro, dom 13 P4 · S4: lun 14 gi tecnico, mar 15 attivazione, gio 17 tatami leggero, ven 18 riposo, sab 19 gara.",
  "2027-01-16": "Gara sab 16 gen: S1–S5 come il piano (mar 22 dic = ultima pesante) · S6 kit, ultimo Nordic · S7 sempre Basso/Medio, niente Nordic (glute bridge a una gamba 2 × 5), round da 6' in ogni sessione · lun 11 gi moderato, mar 12 attivazione, mer 13 prova peso, gio 14 tatami leggero, ven 15 riposo, sab 16 gara.",
};
export function planB(race: string): string | null {
  if (PLAN_B[race]) return PLAN_B[race];
  if (toD(race).getDay() === 0 && PLAN_B[addDays(race, -1)] !== undefined) return PLAN_B[addDays(race, -1)] + " Gara di domenica: tutto uguale fino al giovedì, venerdì riposo, sabato 15' di mobilità e attivazione.";
  if (toD(race).getDay() === 0) return "Gara di domenica: tutto uguale fino al giovedì; venerdì riposo; sabato 15' di mobilità + attivazione; domenica gara.";
  if (race < START.bjj3_viaggio) return "Gara prima del Messico: il calendario dell'app non basta. Segui il piano B più vicino in docs/ricerca/4-piano-finale.md §6.4 (12 o 19 dicembre).";
  return null;
}
export const phase = (id: string) => PLAN.phases.find(p => p.id === id)!;
export const exercise = (id: string): Exercise => PLAN.exercises[id] ?? { name: id, how: [], why: "", mistake: "" };

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
