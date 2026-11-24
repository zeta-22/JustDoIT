import { exercise, setCount, volFor, type Item, type Session, type Vol } from "../lib/plan";
import Thumb from "./Thumb";
import Icon from "./Icon";

/** Elenco degli esercizi di una seduta. week: settimana del piano per scegliere la parte giusta di "S1 … · S2 …";
 *  senza, si vede la voce del piano così com'è. */
export default function SessionPreview({ s, vol, week, onOpen, head = true }: { s: Session; vol: Vol; week?: number | null; onOpen: (id: string) => void; head?: boolean }) {
  return <div className="card">
    {head && <div className="pad"><h3>{s.title}</h3><p className="small muted">{s.day} · {s.duration}</p></div>}
    {s.warmup && <p className="warm"><b>Riscaldamento.</b> {s.warmup}</p>}
    {s.items.map((it, i) => <ItemRow key={i} it={it} vol={vol} week={week} onOpen={onOpen} />)}
    {s.notes && <p className="pad small muted">{s.notes}</p>}
  </div>;
}
function ItemRow({ it, vol, week, onOpen }: { it: Item; vol: Vol; week?: number | null; onOpen: (id: string) => void }) {
  const ex = exercise(it.ex); const v = week === undefined ? it.vol[vol] : volFor(it, vol, week); const skip = setCount(v) === 0;
  return <button type="button" className={"irow" + (skip ? " skipped" : "")} onClick={() => onOpen(it.ex)}>
    <span className="code">{it.code}</span>
    <Thumb ex={it.ex} className="sm" />
    <span className="imain"><span className="iname">{ex.name}</span><span className="isub">{it.intensity}{it.tempo && it.tempo !== "—" ? ` · ${it.tempo}` : ""}{it.rest && it.rest !== "—" ? ` · rec. ${it.rest}` : ""}</span></span>
    <span className="ivol">{skip ? "salta" : v}</span>
    <Icon n="right" size={16} className="chev" />
  </button>;
}
