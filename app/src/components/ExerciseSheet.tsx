import { useEffect, useMemo, useState } from "react";
import { exercise } from "../lib/plan";
import { store } from "../lib/store";
import { FIGS } from "../data/figures";
import { LIB } from "../data/library";
import { e1rm } from "../lib/session";
import { dayMonth, kgStr, parseNum } from "../lib/format";
import Figure from "./Figure";
import MuscleMap from "./MuscleMap";
import Icon from "./Icon";

/** Scheda esercizio a foglio dal basso: animazione, muscoli, come si fa, versione più facile, le ultime volte. */
export default function ExerciseSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const ex = exercise(id); const fi = FIGS[id]; const lib = LIB[id]; const [sp, setSp] = useState(1);
  const mus = fi ?? (lib && lib.p.length ? lib : null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const hist = useMemo(() => store.sessions().filter(s => s.finished).flatMap(s => s.items.filter(x => x.ex === id && x.sets.some(z => z.done))
    .map(x => ({ date: s.date, sets: x.sets.filter(z => z.done) }))).reverse(), [id]);
  const best = useMemo(() => { let b: { kg: number; reps: number; e: number } | null = null;
    hist.forEach(h => h.sets.forEach(z => { const k = parseNum(z.kg) ?? 0, r = parseNum(z.reps) ?? 0; if (k > 0 && (!b || e1rm(k, r) > b.e)) b = { kg: k, reps: r, e: e1rm(k, r) }; })); return b as { kg: number; reps: number; e: number } | null; }, [hist]);
  return <div className="sheet-bg" onClick={onClose}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label={ex.name} onClick={e => e.stopPropagation()}>
      <span className="grab" aria-hidden="true" />
      <div className="row between"><h2>{ex.name}</h2><button type="button" className="iconbtn" onClick={onClose} aria-label="Chiudi"><Icon n="x" /></button></div>
      {fi ? <div className="stage"><Figure info={fi} speed={sp} />
        <div className="speed">{[0.5, 1, 0].map(v => <button key={v} type="button" aria-pressed={sp === v} onClick={() => setSp(v)}>{v === 0 ? "Pausa" : `${String(v).replace(".", ",")}×`}</button>)}</div></div>
        : <p className="small muted">{lib?.kind === "cond" ? "Lavoro di condizionamento: coinvolge tutto il corpo." : "Animazione in arrivo per questo esercizio."}</p>}
      {mus && <>
        <div className="row gap wrap-row">{mus.p.map(m => <span key={m} className="tag p">{m}</span>)}{mus.s.map(m => <span key={m} className="tag s">{m}</span>)}</div>
        <MuscleMap p={mus.p} s={mus.s} />
      </>}
      {ex.how.length > 0 && <ol className="how">{ex.how.map((h, i) => <li key={i}>{h}</li>)}</ol>}
      {ex.why && <p><b>Perché:</b> {ex.why}</p>}
      {ex.mistake && <p className="muted"><b>Errore tipico:</b> {ex.mistake}</p>}
      {lib?.reg && <p className="regbox"><b>Versione più facile</b> (se fa male o sei stanco): {lib.reg}</p>}
      {hist.length > 0 && <div className="stack-s">
        <div className="row between"><span className="over">Le tue ultime volte</span>{best && best.reps > 0 && <span className="small muted">1RM stimato <b className="num">{kgStr(best.e)} kg</b></span>}</div>
        <ul className="plain">{hist.slice(0, 4).map((h, i) => <li key={i}><span>{dayMonth(h.date)}</span>
          <b className="num">{h.sets.map(z => `${z.kg || "–"}×${z.reps || "–"}${z.rpe ? ` @${z.rpe}` : ""}`).join(" · ")}</b></li>)}</ul>
      </div>}
    </div>
  </div>;
}
