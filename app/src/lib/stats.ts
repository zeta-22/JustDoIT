/* Numeri per Progressi e Piano: 1RM stimato, record del mese, settimane complete, carico della settimana,
   tendenza del peso con previsione al giorno della gara, muscoli allenati nella settimana, calendario fatto/previsto.
   Tutto è solo informazione: nessun numero qui cambia volumi o dosi del piano. */
import { addDays, currentPhaseId, daysBetween, exercise, isoToday, phase, START } from "./plan";
import { store, type SessionLog } from "./store";
import { e1rm, sessionRecords, sessionStats } from "./session";
import { mondayOf, sessionsFor, weekday } from "./today";
import { parseNum } from "./format";
import { FIGS } from "../data/figures";
import { LIB, BIG_LIFTS } from "../data/library";
import { BAR_OF } from "./plates";

export const finished = () => store.sessions().filter(s => s.finished);

/** Miglior 1RM stimato di ogni seduta per un esercizio (serie da 1 a 12 ripetizioni con kg > 0). */
export function e1rmSeries(ex: string, sessions = finished()) {
  const out: { x: string; y: number }[] = [];
  for (const s of sessions) {
    const best = Math.max(0, ...s.items.filter(it => it.ex === ex).flatMap(it => it.sets.filter(z => z.done))
      .map(z => { const k = parseNum(z.kg) ?? 0, r = parseNum(z.reps) ?? 0; return k > 0 && r >= 1 && r <= 12 ? e1rm(k, r) : 0; }));
    if (best > 0) { const prev = out.find(p => p.x === s.date); if (prev) prev.y = Math.max(prev.y, best); else out.push({ x: s.date, y: best }); }
  }
  return out.sort((a, b) => a.x.localeCompare(b.x));
}
/** Carico più alto di ogni seduta per un esercizio. */
export function topKgSeries(ex: string, sessions = finished()) {
  const m = new Map<string, number>();
  sessions.forEach(s => s.items.filter(it => it.ex === ex).forEach(it => it.sets.forEach(z => { const k = parseNum(z.kg);
    if (z.done && k && k > 0) m.set(s.date, Math.max(m.get(s.date) ?? 0, k)); })));
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([x, y]) => ({ x, y }));
}
/** Esercizi con carico registrato, i principali prima: per il riepilogo della forza. */
export function liftList(sessions = finished()) {
  const ids = new Set(sessions.flatMap(s => s.items.filter(it => it.sets.some(z => z.done && (parseNum(z.kg) ?? 0) > 0)).map(it => it.ex)));
  return [...ids].map(ex => ({ ex, name: exercise(ex).name, pts: e1rmSeries(ex, sessions), kg: topKgSeries(ex, sessions) }))
    .filter(l => l.kg.length > 0)
    .sort((a, b) => (+(BIG_LIFTS.has(b.ex) || !!BAR_OF[b.ex]) - +(BIG_LIFTS.has(a.ex) || !!BAR_OF[a.ex])) || b.kg.length - a.kg.length);
}

/** Record fatti nelle sedute di un mese ("2026-11"). */
export const monthRecords = (month: string, sessions = finished()) =>
  sessions.filter(s => s.date.startsWith(month)).reduce((a, s) => a + sessionRecords(s).length, 0);

/** Sedute di palestra previste in un giorno (le opzioni della domenica sono facoltative: non contano). */
export function plannedGym(day: string, race: string) {
  const ph = phase(currentPhaseId(day, race)); if (day < START.bjj1_accumulo) return [];
  return sessionsFor(ph, day).filter(s => !(weekday(day) === 0 && s.id.startsWith("dom_")));
}

/** Sedute di palestra previste tra due date (to esclusa). Per settimana: i giorni con una seduta, ma non più
 *  delle sedute della fase (in viaggio la stessa seduta è scritta su più giorni a scelta). */
export function plannedInRange(from: string, to: string, race: string) {
  let n = 0;
  for (let wk = mondayOf(from); wk < to; wk = addDays(wk, 7)) {
    let days = 0; for (let i = 0; i < 7; i++) { const d = addDays(wk, i); if (d >= from && d < to && plannedGym(d, race).length) days++; }
    if (days) n += Math.min(days, phase(currentPhaseId(wk < from ? from : wk, race)).sessions.length);
  }
  return n;
}
/** Sedute di palestra fatte / previste nel mese fino a oggi. */
export function monthGym(race: string, today = isoToday()) {
  const m1 = today.slice(0, 8) + "01"; const first = m1 < START.bjj1_accumulo ? START.bjj1_accumulo : m1; // si conta dall'inizio del piano
  return { done: finished().filter(s => s.date >= first && s.date <= today).length, planned: plannedInRange(first, addDays(today, 1), race) };
}

/** Settimane complete di fila: tutte le sedute di palestra previste nella settimana sono state fatte.
 *  La settimana in corso conta solo se è già completa (altrimenti non interrompe la serie). */
export function completeWeeks(race: string, today = isoToday()) {
  const sess = finished(); let n = 0; let wk = mondayOf(today); let first = true;
  while (wk >= mondayOf(START.bjj1_accumulo)) {
    const planned = plannedInRange(wk, addDays(wk, 7), race);
    const done = sess.filter(s => s.date >= wk && s.date < addDays(wk, 7)).length;
    if (planned > 0 && done >= planned) n++; else if (!first) break;
    first = false; wk = addDays(wk, -7);
  }
  return n;
}

/** Carico di una settimana come minuti × fatica (RPE), per palestra, tatami e resistenza.
 *  Conta solo le voci con la fatica segnata; la palestra usa la durata registrata e l'RPE della seduta. */
export function weekLoad(monday: string) {
  const to = addDays(monday, 7); const r = { gym: 0, tatami: 0, endurance: 0, min: { gym: 0, tatami: 0, endurance: 0 } };
  finished().filter(s => s.date >= monday && s.date < to).forEach(s => { const st = sessionStats(s); if (s.end && st.min > 0) { r.min.gym += st.min; if (s.srpe) r.gym += st.min * s.srpe; } });
  store.tatami().filter(t => t.date >= monday && t.date < to).forEach(t => { r.min.tatami += t.min; if (t.rpe) r.tatami += t.min * t.rpe; });
  store.endurance().filter(e => e.date >= monday && e.date < to).forEach(e => { r.min.endurance += e.min; if (e.rpe) r.endurance += e.min * e.rpe; });
  return r;
}

/** Tendenza del peso: media degli ultimi 7 giorni, variazione a settimana (retta sulle pesate degli ultimi 28 giorni),
 *  previsione al giorno della gara se si continua così. null con meno di 6 pesate. */
export function weightTrend(race: string, today = isoToday()) {
  const ws = store.weights(); if (!ws.length) return null;
  const last7 = ws.slice(-7); const avg = last7.reduce((a, w) => a + w.kg, 0) / last7.length;
  const recent = ws.filter(w => daysBetween(w.date, today) <= 28);
  if (recent.length < 6) return { avg, perWeek: null, atRace: null };
  const xs = recent.map(w => daysBetween(recent[0].date, w.date)), ys = recent.map(w => w.kg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0); const slope = den ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den : 0;
  const toRace = daysBetween(today, race);
  return { avg, perWeek: slope * 7, atRace: toRace > 0 ? avg + slope * toRace : null };
}

/** Serie fatte per muscolo in una settimana: un punto ai muscoli principali, mezzo ai secondari. */
export function weekMuscles(monday: string) {
  const to = addDays(monday, 7); const m = new Map<string, number>(); const prim = new Set<string>();
  const sessions: SessionLog[] = store.sessions().filter(s => s.date >= monday && s.date < to);
  for (const s of sessions) for (const it of s.items) {
    const n = it.sets.filter(z => z.done).length; if (!n) continue; const mu = FIGS[it.ex] ?? LIB[it.ex]; if (!mu) continue;
    mu.p.forEach(x => { m.set(x, (m.get(x) ?? 0) + n); prim.add(x); }); mu.s.forEach(x => m.set(x, (m.get(x) ?? 0) + n / 2));
  }
  const list = [...m.entries()].sort((a, b) => b[1] - a[1]);
  return { list, p: [...prim], s: list.map(([x]) => x).filter(x => !prim.has(x)) };
}
