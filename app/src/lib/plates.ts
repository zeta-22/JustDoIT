/* Dischi da caricare e serie di avvicinamento in kg.
   Il peso del bilanciere, della trap bar e i dischi disponibili si scelgono in Profilo → Attrezzi. */
import type { Settings } from "./store";

/** Esercizi con bilanciere o trap bar (quelli per cui ha senso contare i dischi). */
export const BAR_OF: Record<string, "bar" | "trap"> = {
  trap_bar: "trap", rdl: "bar", zercher: "bar", front_squat: "bar", back_squat: "bar", hip_thrust: "bar", panca: "bar", hang_clean: "bar",
};
export const DEF_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 2, 1.25, 1, 0.5];

export function barFor(ex: string, st: Settings): number | null {
  const t = BAR_OF[ex]; if (!t) return null;
  return t === "trap" ? st.trapKg ?? 25 : st.barKg ?? 20;
}

/** Dischi per lato, dal più pesante (i dischi si caricano a coppie, uno per lato).
 *  rest = kg totali che non si riescono a fare con i dischi che hai. null se il carico è meno del bilanciere. */
export function platesFor(total: number, bar: number, avail: number[] = DEF_PLATES): { side: number[]; rest: number } | null {
  let side = (total - bar) / 2; if (side < -1e-9) return null;
  const out: number[] = [];
  for (const p of [...avail].sort((a, b) => b - a)) while (side >= p - 1e-9) { out.push(p); side -= p; }
  return { side: out, rest: Math.round(side * 2 * 100) / 100 };
}

/** Al carico più vicino che si può fare: bilanciere + coppie del disco più piccolo. */
export function roundLoad(kg: number, bar: number, avail: number[] = DEF_PLATES): number {
  const step = 2 * Math.min(...avail);
  return Math.max(bar, bar + Math.round((kg - bar) / step) * step);
}

/** Avvicinamento scritto nel riscaldamento del piano: "(50%×5, 70%×3, 85%×1–2)" → [{pct:50, reps:"5"}, …]. */
export function ramp(text: string): { pct: number; reps: string }[] {
  return [...text.matchAll(/(\d+)\s*%\s*[×x]\s*(\d+(?:\s*[–-]\s*\d+)?)/g)].map(m => ({ pct: +m[1], reps: m[2].replace(/\s/g, "") }));
}
/** Avvicinamento standard del piano, usato nella scheda esercizio fuori dalla seduta. */
export const DEF_RAMP = [{ pct: 50, reps: "5" }, { pct: 70, reps: "3" }, { pct: 85, reps: "1–2" }];
