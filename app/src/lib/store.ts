/* Archivio dati. Le schermate leggono e scrivono sempre in locale (localStorage), quindi l'app funziona
   anche senza rete. Ogni modifica finisce in una coda ("outbox") che sync() manda a Supabase quando sei
   collegato; sync() scarica anche le modifiche fatte da altri dispositivi. Tabella: supabase/schema.sql. */
import type { Vol } from "./plan";
import { sb } from "./supabase";

export interface SetLog { kg: string; reps: string; rpe: string; done: boolean }
export interface ItemLog { code: string; ex: string; sets: SetLog[]; pain?: boolean }
export interface SessionLog { id: string; date: string; phaseId: string; sessionId: string; vol: Vol; items: ItemLog[]; note?: string; finished: boolean }
export interface WeightLog { date: string; kg: number }
export interface Settings { division: "gi_medio" | "gi_leve" | "nogi_medio" | "nogi_leve" | "nogi_meio_pesado"; uniformKg: number; raceDate?: string }

type Kind = "session" | "weight" | "settings";
const K = { sessions: "jdi.sessions", weights: "jdi.weights", settings: "jdi.settings", outbox: "jdi.outbox", pulled: "jdi.pulledAt" };
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage pieno o bloccato */ } };
const DEF_SETTINGS: Settings = { division: "gi_medio", uniformKg: 2 };

/* ---------- coda delle modifiche da mandare online ---------- */
/* chiave "tipo|id" → numero di modifiche: dopo l'invio tolgo solo le voci non cambiate nel frattempo */
type Outbox = Record<string, number>;
const box = (): Outbox => { const v = read<Outbox | string[]>(K.outbox, {}); return Array.isArray(v) ? Object.fromEntries(v.map(k => [k, 1])) : v; };
const outbox = () => Object.keys(box());
function mark(kind: Kind, id: string) {
  const o = box(); const key = `${kind}|${id}`; o[key] = (o[key] ?? 0) + 1; write(K.outbox, o);
  scheduleSync();
}

export const store = {
  sessions: () => read<SessionLog[]>(K.sessions, []),
  saveSession(s: SessionLog) { const all = store.sessions().filter(x => x.id !== s.id); all.push(s); all.sort((a, b) => a.date.localeCompare(b.date)); write(K.sessions, all); mark("session", s.id); },
  deleteSession(id: string) { write(K.sessions, store.sessions().filter(x => x.id !== id)); mark("session", id); },
  /** Ultima serie registrata per un esercizio: serve a precompilare i carichi. */
  lastFor(ex: string): SetLog[] | null {
    const all = store.sessions().filter(s => s.finished);
    for (let i = all.length - 1; i >= 0; i--) { const it = all[i].items.find(x => x.ex === ex && x.sets.some(z => z.done)); if (it) return it.sets.filter(z => z.done); }
    return null;
  },
  weights: () => read<WeightLog[]>(K.weights, []),
  saveWeight(w: WeightLog) { const all = store.weights().filter(x => x.date !== w.date); all.push(w); all.sort((a, b) => a.date.localeCompare(b.date)); write(K.weights, all); mark("weight", w.date); },
  deleteWeight(date: string) { write(K.weights, store.weights().filter(x => x.date !== date)); mark("weight", date); },
  settings: () => ({ ...DEF_SETTINGS, ...read<Partial<Settings>>(K.settings, {}) }),
  saveSettings(s: Settings) { write(K.settings, s); mark("settings", "main"); },

  /** Backup completo in un file JSON (paracadute, indipendente da Supabase). */
  exportAll: () => JSON.stringify({ app: "JustDoIT", v: 1, at: new Date().toISOString(), sessions: store.sessions(), weights: store.weights(), settings: store.settings() }, null, 1),
  importAll(json: string): string {
    const d = JSON.parse(json);
    if (d?.app !== "JustDoIT") throw new Error("Questo file non è un backup di JustDoIT.");
    (d.sessions as SessionLog[] ?? []).forEach(s => store.saveSession(s));
    (d.weights as WeightLog[] ?? []).forEach(w => store.saveWeight(w));
    if (d.settings) store.saveSettings({ ...DEF_SETTINGS, ...d.settings });
    return `${(d.sessions ?? []).length} sedute e ${(d.weights ?? []).length} pesate importate.`;
  },
};

/* ---------- sincronizzazione ---------- */
export type SyncStatus = "init" | "anon" | "syncing" | "ok" | "offline" | "error";
export const syncState: { status: SyncStatus; email: string | null; pending: number; last: string | null; error: string | null } =
  { status: "init", email: null, pending: outbox().length, last: null, error: null };
const emit = (changed = false) => { syncState.pending = outbox().length; window.dispatchEvent(new CustomEvent("jdi:sync", { detail: { changed } })); };

let timer = 0;
function scheduleSync() { syncState.pending = outbox().length; clearTimeout(timer); timer = window.setTimeout(() => { void sync(); }, 1500); }

function localData(kind: Kind, id: string): unknown | null {
  if (kind === "session") return store.sessions().find(s => s.id === id) ?? null;
  if (kind === "weight") return store.weights().find(w => w.date === id) ?? null;
  return read<Settings | null>(K.settings, null);
}
function applyRemote(kind: Kind, id: string, data: unknown, deleted: boolean) {
  if (kind === "session") {
    const all = read<SessionLog[]>(K.sessions, []).filter(s => s.id !== id);
    if (!deleted) { all.push(data as SessionLog); all.sort((a, b) => a.date.localeCompare(b.date)); }
    write(K.sessions, all);
  } else if (kind === "weight") {
    const all = read<WeightLog[]>(K.weights, []).filter(w => w.date !== id);
    if (!deleted) { all.push(data as WeightLog); all.sort((a, b) => a.date.localeCompare(b.date)); }
    write(K.weights, all);
  } else if (!deleted) write(K.settings, data);
}

/* Errori di Supabase → spiegazione in italiano (il testo originale resta visibile sotto). */
function explain(e: unknown): string {
  const o = (e ?? {}) as { code?: string; message?: string; status?: number };
  const m = o.message ?? String(e); const c = o.code ?? "";
  if (c === "42501" && /row-level security/i.test(m)) return `Le regole di sicurezza bloccano la scrittura: riesegui supabase/schema.sql. (${m})`;
  if (c === "42501" || /permission denied/i.test(m)) return `Manca il permesso sulla tabella: esegui i GRANT di supabase/schema.sql nel SQL Editor. (${m})`;
  if (c === "42P01" || c === "PGRST205" || /does not exist|schema cache/i.test(m)) return `La tabella "records" non esiste ancora: esegui supabase/schema.sql nel SQL Editor. (${m})`;
  if (/jwt|token|expired|401/i.test(m) || o.status === 401) return `Accesso scaduto: esci e rifai l'accesso. (${m})`;
  if (/fetch|network|load failed/i.test(m)) return `Supabase non raggiungibile: riprovo da solo appena c'è rete. (${m})`;
  return m;
}

let running = false;
export async function sync(): Promise<void> {
  if (running) return; running = true;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { syncState.status = "anon"; syncState.email = null; emit(); return; }
    syncState.email = session.user.email ?? null;
    if (!navigator.onLine) { syncState.status = "offline"; return; }
    syncState.status = "syncing"; emit();
    const uid = session.user.id;
    // 1. invio
    const snap = box(); const keys = Object.keys(snap);
    if (keys.length) {
      const rows = keys.map(k => { const [kind, id] = k.split("|") as [Kind, string]; const d = localData(kind, id);
        return { user_id: uid, kind, id, data: d ?? {}, deleted: d === null }; });
      const { error } = await sb.from("records").upsert(rows, { onConflict: "user_id,kind,id" });
      if (error) throw error;
      const now = box(); keys.forEach(k => { if (now[k] === snap[k]) delete now[k]; }); write(K.outbox, now);
    }
    // 2. ricezione (solo le righe cambiate dall'ultima volta)
    const since = read<string>(K.pulled, "1970-01-01T00:00:00Z");
    const { data, error } = await sb.from("records").select("kind,id,data,deleted,updated_at").gt("updated_at", since).order("updated_at").limit(1000);
    if (error) throw error;
    const pend = new Set(outbox()); let changed = false; let max = since;
    for (const r of data ?? []) {
      if (r.updated_at > max) max = r.updated_at;
      if (pend.has(`${r.kind}|${r.id}`)) continue; // la modifica locale più recente vince
      applyRemote(r.kind as Kind, r.id, r.data, r.deleted); changed = true;
    }
    write(K.pulled, max);
    syncState.status = "ok"; syncState.error = null; syncState.last = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    emit(changed);
  } catch (e) {
    syncState.status = navigator.onLine ? "error" : "offline";
    syncState.error = explain(e);
  } finally { running = false; emit(); }
}

export async function signIn(email: string) {
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}
export async function signOut() { await sb.auth.signOut(); syncState.status = "anon"; syncState.email = null; emit(); }

/** Avvio: sincronizza all'apertura, al ritorno della rete, quando torni sull'app e ogni 2 minuti. */
export function startSync() {
  sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN" || ev === "INITIAL_SESSION" || ev === "TOKEN_REFRESHED") void sync(); });
  window.addEventListener("online", () => void sync());
  window.addEventListener("offline", () => { syncState.status = syncState.email ? "offline" : "anon"; emit(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void sync(); });
  window.setInterval(() => void sync(), 120_000);
}

export const DIVISIONS: Record<Settings["division"], { label: string; limit: number; uniform: "gi" | "nogi" }> = {
  gi_medio: { label: "Gi · Médio (≤ 82,3 kg con kimono)", limit: 82.3, uniform: "gi" },
  gi_leve: { label: "Gi · Leve (≤ 76,0 kg con kimono)", limit: 76.0, uniform: "gi" },
  nogi_medio: { label: "No-gi · Médio (≤ 79,5 kg con divisa)", limit: 79.5, uniform: "nogi" },
  nogi_leve: { label: "No-gi · Leve (≤ 73,5 kg con divisa)", limit: 73.5, uniform: "nogi" },
  nogi_meio_pesado: { label: "No-gi · Meio-pesado (≤ 85,5 kg con divisa)", limit: 85.5, uniform: "nogi" },
};
