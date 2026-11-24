import { useEffect, useState } from "react";
import { isoToday } from "../lib/plan";
import { store, type TatamiLog } from "../lib/store";
import { parseNum } from "../lib/format";
import Icon from "./Icon";
import { useToast } from "./Toast";

/** Registra un allenamento sul tatami: gi o no-gi, minuti, round di sparring, quanto è stato duro. */
export default function TatamiSheet({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const last = store.tatami().slice(-1)[0];
  const [date, setDate] = useState(isoToday()); const [kind, setKind] = useState<TatamiLog["kind"]>(last?.kind ?? "gi");
  const [min, setMin] = useState(String(last?.min ?? 90)); const [rounds, setRounds] = useState(last?.rounds ?? 5);
  const [rpe, setRpe] = useState<number | undefined>(); const [note, setNote] = useState("");
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const m = parseNum(min);
  const save = () => { if (!m || m <= 0) return;
    store.saveTatami({ id: `tat-${Date.now()}`, date, kind, min: m, rounds: rounds || undefined, rpe, note: note.trim() || undefined });
    toast("Tatami registrato"); onClose(); };
  return <div className="sheet-bg" onClick={onClose}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Registra il tatami" onClick={e => e.stopPropagation()}>
      <span className="grab" aria-hidden="true" />
      <div className="row between"><h2>Tatami</h2><button type="button" className="iconbtn" onClick={onClose} aria-label="Chiudi"><Icon n="x" /></button></div>
      <div className="seg" role="group" aria-label="Tipo"><button type="button" aria-pressed={kind === "gi"} onClick={() => setKind("gi")}>Gi</button><button type="button" aria-pressed={kind === "nogi"} onClick={() => setKind("nogi")}>No-gi</button></div>
      <div className="grid2">
        <label className="field" htmlFor="td">Data<input id="td" type="date" value={date} max={isoToday()} onChange={e => setDate(e.target.value || isoToday())} /></label>
        <label className="field" htmlFor="tm">Minuti<input id="tm" inputMode="numeric" value={min} onChange={e => setMin(e.target.value)} /></label>
      </div>
      <div className="row between"><span className="qt">Round di sparring</span>
        <span className="stepper"><button type="button" aria-label="Un round in meno" onClick={() => setRounds(Math.max(0, rounds - 1))}><Icon n="minus" size={18} /></button>
          <b className="num" aria-live="polite">{rounds}</b>
          <button type="button" aria-label="Un round in più" onClick={() => setRounds(rounds + 1)}><Icon n="plus" size={18} /></button></span></div>
      <div className="stack-s"><span className="qt">Quanto è stato duro?</span>
        <div className="rpe" role="group" aria-label="RPE da 1 a 10">{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <button key={n} type="button" aria-pressed={rpe === n} onClick={() => setRpe(n)}>{n}</button>)}</div>
        <p className="small muted">3–4 tecnica e drilling · 5–7 sparring normale · 8–10 guerra. Domani il check-in lo usa per "botte del tatami".</p></div>
      <label className="field" htmlFor="tn">Note<input id="tn" value={note} onChange={e => setNote(e.target.value)} placeholder="posizioni, botte, fastidi…" /></label>
      <button type="button" className="primary big" disabled={!m} onClick={save}>Salva</button>
    </div>
  </div>;
}
