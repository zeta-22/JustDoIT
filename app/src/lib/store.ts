/* Archivio locale (localStorage). Interfaccia pensata per essere sostituita da Supabase senza toccare le schermate. */
import type { Vol } from "./plan";

export interface SetLog { kg: string; reps: string; rpe: string; done: boolean }
export interface ItemLog { code: string; ex: string; sets: SetLog[]; pain?: boolean }
export interface SessionLog { id: string; date: string; phaseId: string; sessionId: string; vol: Vol; items: ItemLog[]; note?: string; finished: boolean }
export interface WeightLog { date: string; kg: number }
export interface Settings { division: "gi_medio" | "gi_leve" | "nogi_medio" | "nogi_leve" | "nogi_meio_pesado"; uniformKg: number }

const K = { sessions: "jdi.sessions", weights: "jdi.weights", settings: "jdi.settings" };
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage pieno o bloccato */ } };

export const store = {
  sessions: () => read<SessionLog[]>(K.sessions, []),
  saveSession(s: SessionLog) { const all = store.sessions().filter(x => x.id !== s.id); all.push(s); all.sort((a, b) => a.date.localeCompare(b.date)); write(K.sessions, all); },
  deleteSession(id: string) { write(K.sessions, store.sessions().filter(x => x.id !== id)); },
  /** Ultima serie registrata per un esercizio: serve a precompilare i carichi. */
  lastFor(ex: string): SetLog[] | null {
    const all = store.sessions().filter(s => s.finished);
    for (let i = all.length - 1; i >= 0; i--) { const it = all[i].items.find(x => x.ex === ex && x.sets.some(z => z.done)); if (it) return it.sets.filter(z => z.done); }
    return null;
  },
  weights: () => read<WeightLog[]>(K.weights, []),
  saveWeight(w: WeightLog) { const all = store.weights().filter(x => x.date !== w.date); all.push(w); all.sort((a, b) => a.date.localeCompare(b.date)); write(K.weights, all); },
  settings: () => read<Settings>(K.settings, { division: "gi_medio", uniformKg: 2 }),
  saveSettings(s: Settings) { write(K.settings, s); },
};

export const DIVISIONS: Record<Settings["division"], { label: string; limit: number; uniform: "gi" | "nogi" }> = {
  gi_medio: { label: "Gi · Médio (≤ 82,3 kg con kimono)", limit: 82.3, uniform: "gi" },
  gi_leve: { label: "Gi · Leve (≤ 76,0 kg con kimono)", limit: 76.0, uniform: "gi" },
  nogi_medio: { label: "No-gi · Médio (≤ 79,5 kg con divisa)", limit: 79.5, uniform: "nogi" },
  nogi_leve: { label: "No-gi · Leve (≤ 73,5 kg con divisa)", limit: 73.5, uniform: "nogi" },
  nogi_meio_pesado: { label: "No-gi · Meio-pesado (≤ 85,5 kg con divisa)", limit: 85.5, uniform: "nogi" },
};
