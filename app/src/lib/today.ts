/* "Oggi" che sa che giorno è: seduta del giorno dalla colonna `day` del piano, etichette della settimana
   dalla "settimana tipo" della fase, avanzamento della fase in settimane (per la barra a forma di cintura). */
import { addDays, daysBetween, phase, phaseStarts, type Phase, type Session } from "./plan";

const WD = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const AB = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
export const weekday = (iso: string) => new Date(iso + "T12:00:00").getDay();
/** Lunedì della settimana di una data. */
export const mondayOf = (iso: string) => addDays(iso, -((weekday(iso) + 6) % 7));
export const dayLetter = (iso: string) => "DLMMGVS"[weekday(iso)];

/** Fasi BJJ in cui la domenica si sceglie tra le tre opzioni di bjj_domenica. */
const SUNDAY_OPTIONS = new Set(["bjj1_accumulo", "bjj2_intens", "bjj4_rientro"]);

/** Sedute del piano per quel giorno della settimana. La domenica del blocco gara: le tre opzioni. */
export function sessionsFor(ph: Phase, iso: string): Session[] {
  const d = weekday(iso);
  if (d === 0 && SUNDAY_OPTIONS.has(ph.id)) return phase("bjj_domenica").sessions;
  const full = WD[d], ab = new RegExp(`(^|[^a-zà-ù])${AB[d]}([^a-zà-ù]|$)`);
  return ph.sessions.filter(s => { const t = s.day.toLowerCase(); return t.includes(full) || ab.test(t); });
}

/** Etichetta breve di ogni giorno (0 = domenica) dalla "settimana tipo": "Lun gi · Mar Forza A · …".
 *  "Come la fase 1" prende quella della fase 1. Giorno non scritto → null. */
export function weekLabels(ph: Phase): (string | null)[] {
  let w = ph.weekly; if (/^\s*come la fase 1/i.test(w)) w = phase("bjj1_accumulo").weekly;
  const out: (string | null)[] = Array(7).fill(null);
  for (const part of w.split("·")) {
    const m = part.trim().match(/^(lun|mar|mer|gio|ven|sab|dom)\.?\s+(?:\d+\s+)?(.+)$/i); if (!m) continue;
    const d = AB.indexOf(m[1].toLowerCase()); if (out[d] !== null) continue;
    out[d] = m[2].split(/[(,:]/)[0].replace(/\s+/g, " ").trim() || null;
  }
  return out;
}

/** Durata della seduta per il volume scelto: "B ~55' · M ~80' · A ~90'" → "≈ 80′". */
export function durationFor(s: Session, vol: "basso" | "medio" | "alto"): string | null {
  const m = s.duration.match(new RegExp(`${vol[0].toUpperCase()}\\s*~?\\s*(\\d+)\\s*'`));
  if (m) return `≈ ${m[1]}′`;
  const any = s.duration.match(/(\d+)\s*['′]/); return any ? `≈ ${any[1]}′` : null;
}

/** Avanzamento della fase: quante settimane dura, in quale siamo, quanta parte è passata (0–1). */
export function phaseProgress(pid: string, today: string, race: string) {
  const st = phaseStarts(race); const start = st[pid];
  if (!start) return null;
  const next = Object.values(st).filter(v => v > start).sort()[0] ?? addDays(start, 28);
  const days = Math.max(1, daysBetween(start, next)); const weeks = Math.max(1, Math.round(days / 7));
  const gone = Math.min(days, Math.max(0, daysBetween(start, today) + 1));
  return { weeks, week: Math.min(weeks, Math.max(1, Math.ceil(gone / 7))), frac: gone / days, before: today < start };
}
