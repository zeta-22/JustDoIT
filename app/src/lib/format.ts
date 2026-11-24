/* Formati italiani in tutta l'app: virgola nei decimali, date brevi ("mar 17 nov"), durate ("1 h 18′"). */
const D = (iso: string) => new Date(iso + "T12:00:00");

/** 78.14 → "78,1" (cifre decimali fisse). */
export const dec = (v: number, d = 1) => v.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
/** Carichi: 22.5 → "22,5", 130 → "130" (al mezzo chilo). */
export const kgStr = (v: number) => (Math.round(v * 2) / 2).toLocaleString("it-IT", { maximumFractionDigits: 1 });
/** Numeri grandi con il punto delle migliaia: 8450 → "8.450". */
export const intStr = (v: number) => Math.round(v).toLocaleString("it-IT");
/** "22,5" o "22.5" → 22.5; vuoto o non numero → null. */
export const parseNum = (s: string | number | undefined | null) => { const n = parseFloat(String(s ?? "").replace(",", ".")); return isNaN(n) ? null : n; };

/** "mar 17 nov" */
export const dayShort = (iso: string) => D(iso).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
/** "martedì 17 novembre" */
export const dayLong = (iso: string) => D(iso).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
/** "17 nov" */
export const dayMonth = (iso: string) => D(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
/** 78 → "1 h 18′", 42 → "42′" */
export const minutes = (min: number) => min >= 60 ? `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, "0")}′` : `${Math.round(min)}′`;
/** 72 → "1:12" */
export const clock = (sec: number) => { const s = Math.max(0, Math.ceil(sec)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
/** 1452 s → "24:12", 4000 s → "1:06:40" */
export const elapsed = (sec: number) => { const s = Math.max(0, Math.floor(sec)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`; };
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
