import { useMemo, useState } from "react";
import { PLAN, currentPhaseId, isoToday, phase } from "../lib/plan";
import { FIGS } from "../data/figures";
import { LIB } from "../data/library";
import Thumb from "../components/Thumb";
import Icon from "../components/Icon";
import { raceDate } from "../lib/labels";

/* Libreria dei 71 esercizi: ricerca per nome o muscolo, filtri per gruppo, miniatura, dove compare nella fase attuale. */
const GROUPS: [string, (id: string) => boolean][] = [
  ["Tutti", () => true],
  ["Gambe", id => has(id, ["quadricipiti", "glutei", "femorali", "adduttori", "polpacci", "tibiale"])],
  ["Tirate", id => has(id, ["dorsali", "bicipiti"])],
  ["Spinte", id => has(id, ["pettorali", "tricipiti", "deltoidi"])],
  ["Core", id => has(id, ["addominali", "obliqui", "erettori"])],
  ["Collo e presa", id => has(id, ["trapezi", "avambracci"])],
  ["Condizionamento", id => LIB[id]?.kind === "cond"],
];
const mus = (id: string) => FIGS[id] ?? LIB[id] ?? { p: [], s: [] };
const has = (id: string, m: string[]) => mus(id).p.some(x => m.includes(x));

export default function Library({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState(""); const [g, setG] = useState(0); const [anim, setAnim] = useState(false);
  const where = useMemo(() => { const ph = phase(currentPhaseId(isoToday(), raceDate())); const m = new Map<string, string[]>();
    const sess = ph.program === "bjj" ? [...ph.sessions, ...phase("bjj_domenica").sessions] : ph.sessions;
    sess.forEach(s => s.items.forEach(it => { const d = s.day.slice(0, 3).toLowerCase(); m.set(it.ex, [...(m.get(it.ex) ?? []), `${it.code} ${d}`]); })); return m; }, []);
  const ids = Object.keys(PLAN.exercises).sort((a, b) => PLAN.exercises[a].name.localeCompare(PLAN.exercises[b].name, "it"));
  const nq = q.trim().toLowerCase();
  const list = ids.filter(id => GROUPS[g][1](id) && (!anim || FIGS[id]) &&
    (!nq || PLAN.exercises[id].name.toLowerCase().includes(nq) || [...mus(id).p, ...mus(id).s].some(m => m.includes(nq))));
  const nAnim = ids.filter(id => FIGS[id]).length;
  return <section className="stack">
    <header className="top"><div><span className="over">{ids.length} esercizi · {nAnim} animati</span><h1>Esercizi</h1></div></header>
    <label className="search" htmlFor="lq"><Icon n="search" size={20} /><input id="lq" type="search" placeholder="Cerca un esercizio o un muscolo" value={q} onChange={e => setQ(e.target.value)} /></label>
    <div className="hscroll chips nowrap">{GROUPS.map(([l], i) => <button key={l} type="button" aria-pressed={g === i} onClick={() => setG(i)}>{l}</button>)}
      <button type="button" aria-pressed={anim} onClick={() => setAnim(!anim)}>Solo animati</button></div>
    {list.length === 0 ? <div className="empty"><Icon n="search" size={32} /><p className="small muted">Nessun esercizio trovato.</p></div> :
      <div className="card list">{list.map(id => { const m = mus(id); const w = where.get(id);
        return <button key={id} type="button" className="lrow" onClick={() => onOpen(id)}>
          <Thumb ex={id} />
          <span className="imain"><span className="iname">{PLAN.exercises[id].name}</span>
            <span className="mu">{m.p.length ? <><i className="mdot" />{m.p.join(", ")}</> : LIB[id]?.kind === "cond" ? "tutto il corpo" : ""}</span></span>
          {w && <span className="where">{w.slice(0, 2).join(" · ")}</span>}
        </button>; })}</div>}
  </section>;
}
