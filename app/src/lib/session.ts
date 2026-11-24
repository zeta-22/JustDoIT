/* Logica della seduta: creazione del registro, gruppi di superserie, prossima serie, proposte per riga,
   riepilogo finale (durata, kg totali, record con 1RM stimato), muscoli lavorati. */
import { exercise, isoToday, phase, planWeek, setCount, volFor, type Item, type Session, type Vol } from "./plan";
import { store, type SessionLog, type SetLog } from "./store";
import { suggest, targetReps, targetRpe, type Advice } from "./progress";
import { parseNum, kgStr } from "./format";
import { FIGS } from "../data/figures";
import { LIB } from "../data/library";

export const findSession = (log: Pick<SessionLog, "phaseId" | "sessionId">): Session | undefined =>
  [...phase(log.phaseId).sessions, ...phase("bjj_domenica").sessions].find(x => x.id === log.sessionId);

/** Nuovo registro: le righe sono vuote, i valori proposti si vedono in grigio e la spunta li accetta. */
export function newLog(phaseId: string, s: Session, vol: Vol, race: string): SessionLog {
  const week = planWeek(phaseId, isoToday(), race); const now = Date.now();
  return { id: `${now}`, start: now, date: isoToday(), phaseId, sessionId: s.id, vol, finished: false,
    items: s.items.map(it => ({ code: it.code, ex: it.ex, sets: Array.from({ length: setCount(volFor(it, vol, week)) }, () => ({ kg: "", reps: "", rpe: "", done: false })) })) };
}

/** Gruppi di esercizi: stessa lettera e numero (A1, A2) = superserie; "F" da solo = un esercizio. */
export function groups(items: { code: string }[]): number[][] {
  const out: number[][] = [];
  items.forEach((it, i) => {
    const m = it.code.match(/^([A-Z]+)\d+$/); const prev = out[out.length - 1];
    const pm = prev ? items[prev[0]].code.match(/^([A-Z]+)\d+$/) : null;
    if (m && pm && pm[1] === m[1]) prev.push(i); else out.push([i]);
  });
  return out;
}

/** Prossima serie da fare: primo gruppo non finito; nelle superserie si alterna (l'esercizio più indietro, a parità il primo). */
export function nextSet(log: SessionLog): { i: number; j: number } | null {
  for (const g of groups(log.items)) {
    const open = g.filter(i => log.items[i].sets.some(z => !z.done)); if (!open.length) continue;
    const done = (i: number) => log.items[i].sets.filter(z => z.done).length;
    const i = open.reduce((a, b) => done(b) < done(a) ? b : a);
    return { i, j: log.items[i].sets.findIndex(z => !z.done) };
  }
  return null;
}

export interface Proposal { kg: string; reps: string; rpe: string }
/** Valori proposti per ogni riga: carico consigliato (o quello dell'ultima volta), ripetizioni del piano, RPE della fase. */
export function proposals(it: Item, v: string, last: SetLog[] | null, adv: Advice | null, n: number): Proposal[] {
  const tr = targetReps(v); const trpe = targetRpe(it.intensity);
  const advReps = adv?.reps ? adv.reps.split(/[–-]/)[0] : "";
  return Array.from({ length: n }, (_, j) => ({
    kg: adv ? kgStr(adv.kg) : last?.[j]?.kg || last?.[0]?.kg || "",
    reps: advReps || (tr ? String(tr[0]) : last?.[j]?.reps || ""),
    rpe: trpe !== null ? String(trpe).replace(".", ",") : "",
  }));
}
export const adviceFor = (it: Item, v: string, last: SetLog[] | null) => suggest(it.ex, v, it.intensity, last);

/** 1RM stimato con la formula di Epley (affidabile fino a ~10 ripetizioni). */
export const e1rm = (kg: number, reps: number) => reps > 0 && reps <= 12 ? kg * (1 + reps / 30) : reps > 12 ? kg * (1 + 12 / 30) : kg;

export interface Record_ { ex: string; name: string; kg: number; reps: number; e1: number; prev: number | null; what: "1rm" | "kg" }
/** Record della seduta rispetto a tutte le sedute finite prima: 1RM stimato più alto, o carico più alto. */
export function sessionRecords(log: SessionLog): Record_[] {
  const before = store.sessions().filter(s => s.finished && s.id !== log.id && s.date <= log.date);
  const out: Record_[] = [];
  for (const it of log.items) {
    const sets = it.sets.filter(z => z.done).map(z => ({ kg: parseNum(z.kg) ?? 0, reps: parseNum(z.reps) ?? 0 })).filter(z => z.kg > 0);
    if (!sets.length) continue;
    const best = sets.reduce((a, b) => e1rm(b.kg, b.reps) > e1rm(a.kg, a.reps) ? b : a);
    const prevSets = before.flatMap(s => s.items.filter(x => x.ex === it.ex).flatMap(x => x.sets.filter(z => z.done)))
      .map(z => ({ kg: parseNum(z.kg) ?? 0, reps: parseNum(z.reps) ?? 0 })).filter(z => z.kg > 0);
    if (!prevSets.length) continue; // prima volta: non è un record, è il punto di partenza
    const prevE1 = Math.max(...prevSets.map(z => e1rm(z.kg, z.reps))), prevKg = Math.max(...prevSets.map(z => z.kg));
    const e1 = e1rm(best.kg, best.reps), topKg = Math.max(...sets.map(z => z.kg));
    if (best.reps > 0 && e1 > prevE1 + 0.01) out.push({ ex: it.ex, name: exercise(it.ex).name, kg: best.kg, reps: best.reps, e1, prev: prevE1, what: "1rm" });
    else if (topKg > prevKg) out.push({ ex: it.ex, name: exercise(it.ex).name, kg: topKg, reps: sets.find(z => z.kg === topKg)!.reps, e1, prev: prevKg, what: "kg" });
  }
  return out;
}

/** Numeri della seduta: serie fatte, kg totali (kg × ripetizioni), durata in minuti. */
export function sessionStats(log: SessionLog, now = Date.now()) {
  const total = log.items.reduce((a, it) => a + it.sets.length, 0); const done = log.items.reduce((a, it) => a + it.sets.filter(z => z.done).length, 0);
  const tonnage = log.items.reduce((a, it) => a + it.sets.filter(z => z.done).reduce((b, z) => b + (parseNum(z.kg) ?? 0) * (parseNum(z.reps) ?? 0), 0), 0);
  const start = log.start ?? parseNum(log.id) ?? now; const end = log.end ?? now;
  return { total, done, tonnage, min: Math.max(0, (end - start) / 60000) };
}

/** Muscoli lavorati: principali e secondari degli esercizi con almeno una serie fatta. */
export function workedMuscles(log: SessionLog) {
  const p = new Set<string>(), s = new Set<string>();
  for (const it of log.items) {
    if (!it.sets.some(z => z.done)) continue; const m = FIGS[it.ex] ?? LIB[it.ex]; if (!m) continue;
    m.p.forEach(x => p.add(x)); m.s.forEach(x => s.add(x));
  }
  return { p: [...p], s: [...s].filter(x => !p.has(x)) };
}
