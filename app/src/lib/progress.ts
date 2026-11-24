/* Carico consigliato con la doppia progressione: prima aumenti le ripetizioni dentro l'intervallo del piano,
   quando le fai tutte senza superare l'RPE previsto aumenti il carico e riparti dal basso dell'intervallo.
   Se l'ultima volta era più faticoso del previsto, tieni o riduci. */
import type { SetLog } from "./store";
import { BIG_LIFTS } from "../data/library";

const num = (s: string) => { const n = parseFloat(String(s).replace(",", ".")); return isNaN(n) ? null : n; };

/** "4 × 3" → [3,3]; "3 × 6–8" → [6,8]; "3 × 8/lato" → [8,8]; "2 × 20\"" (a tempo) → null. */
export function targetReps(vol: string): [number, number] | null {
  const m = vol.match(/[×x]\s*(\d+)(?:\s*[–-]\s*(\d+))?(?!\s*(?:["″'′]|\d|\s*s\b|\s*sec))/);
  if (!m) return null;
  const lo = +m[1], hi = m[2] ? +m[2] : lo;
  return lo > 0 && hi >= lo && hi <= 30 ? [lo, hi] : null;
}
/** "RPE 8 (~82–88%)" → 8; "RPE 7–8" → 8; "70–80%" → null. */
export function targetRpe(intensity: string): number | null {
  const m = intensity.match(/RPE\s*(\d+(?:[.,]\d)?)(?:\s*[–-]\s*(\d+(?:[.,]\d)?))?/i);
  if (!m) return null; return num(m[2] ?? m[1]);
}

export interface Advice { kg: number; reps: string; why: string }

export function suggest(ex: string, vol: string, intensity: string, last: SetLog[] | null): Advice | null {
  if (!last) return null;
  const sets = last.filter(z => num(z.kg) !== null && num(z.kg)! > 0);
  if (!sets.length) return null;
  const top = Math.max(...sets.map(z => num(z.kg)!));
  const atTop = sets.filter(z => num(z.kg) === top);
  const reps = atTop.map(z => num(z.reps)).filter((x): x is number => x !== null);
  const rpes = atTop.map(z => num(z.rpe)).filter((x): x is number => x !== null);
  const rpe = rpes.length ? Math.max(...rpes) : null;
  const tr = targetReps(vol), trpe = targetRpe(intensity);
  const inc = top < 12 ? 1 : BIG_LIFTS.has(ex) ? 5 : 2.5;
  const fmt = (k: number) => String(Math.round(k * 2) / 2).replace(".", ",");
  if (trpe !== null && rpe !== null && rpe >= trpe + 1.5) {
    const k = Math.max(0, Math.round(top * 0.95 * 2) / 2);
    return { kg: k, reps: tr ? `${tr[0]}` : "", why: `L'ultima volta era molto più dura del previsto (RPE ${rpe} contro ${trpe}): scendi a ${fmt(k)} kg.` };
  }
  if (trpe !== null && rpe !== null && rpe > trpe) return { kg: top, reps: tr ? (tr[0] === tr[1] ? `${tr[0]}` : `${tr[0]}–${tr[1]}`) : "", why: `Stesso carico: l'ultima volta era un po' più pesante del previsto (RPE ${rpe}).` };
  if (tr && reps.length && reps.every(r => r >= tr[1])) return { kg: top + inc, reps: `${tr[0]}`, why: `Hai fatto tutte le ripetizioni: sali di ${fmt(inc)} kg.` };
  if (tr) { const r = reps.length ? Math.min(tr[1], Math.min(...reps) + 1) : tr[0]; return { kg: top, reps: `${r}`, why: `Stesso carico, prova ad arrivare a ${r} ripetizioni.` }; }
  return { kg: top, reps: "", why: "Stesso carico dell'ultima volta." };
}
