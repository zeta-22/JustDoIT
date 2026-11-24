import { useState } from "react";
import { PLAN, currentPhaseId, isoToday, phaseDates, planWeek, type Phase, type Vol } from "../lib/plan";
import SessionPreview from "../components/SessionPreview";
import { PROG_LABEL, VL, VOLS, raceDate } from "../lib/labels";

export default function PlanView({ onOpen }: { onOpen: (id: string) => void }) {
  const race = raceDate(); const cid = currentPhaseId(isoToday(), race);
  const [prog, setProg] = useState<Phase["program"]>(PLAN.phases.find(p => p.id === cid)!.program);
  const [pid, setPid] = useState(cid);
  const [vol, setVol] = useState<Vol>("medio");
  const list = PLAN.phases.filter(p => p.program === prog);
  const ph = PLAN.phases.find(p => p.id === pid && p.program === prog) ?? list[0];
  return <section className="stack">
    <header className="top"><div><span className="over">Il piano</span><h1>Piano</h1></div></header>
    <div className="seg" role="group" aria-label="Programma">{(["bjj", "transizione", "ironman"] as const).map(p => <button key={p} type="button" aria-pressed={prog === p} onClick={() => { setProg(p); setPid(PLAN.phases.find(x => x.program === p)!.id); }}>{PROG_LABEL[p]}</button>)}</div>
    <div className="hscroll">{list.map(p => <button key={p.id} type="button" className="pchip" aria-pressed={p.id === ph.id} onClick={() => setPid(p.id)}>{p.id === cid && <span className="now">Ora · </span>}<span>{p.name.replace(/^(BJJ|Ironman)\s*/, "")}</span><small>{phaseDates(p.id, race).split("(")[0]}</small></button>)}</div>
    <div className="stack-s"><h2>{ph.name}</h2><p className="small muted">{phaseDates(ph.id, race)}</p><p>{ph.goal}</p><p className="card pad small"><b>Settimana tipo.</b> {ph.weekly}</p></div>
    <div className="seg" role="group" aria-label="Volume">{VOLS.map(v => <button key={v} type="button" aria-pressed={vol === v} onClick={() => setVol(v)}>{VL[v]}</button>)}</div>
    {ph.sessions.map(s => <SessionPreview key={s.id} s={s} vol={vol} week={ph.id === cid ? planWeek(cid, isoToday(), race) : undefined} onOpen={onOpen} />)}
    <details className="card pad"><summary>Regole del volume</summary><ul>{PLAN.volume_rules.map(r => <li key={r.id}>{r.text}</li>)}</ul></details>
    <details className="card pad"><summary>Alimentazione</summary>{PLAN.nutrition.map((n, i) => <p key={i}><b>{n.phase}.</b> {n.text}</p>)}</details>
    <details className="card pad"><summary>Segnali di allarme</summary>{PLAN.warnings.map((w, i) => <p key={i} className={"wl " + w.level}><b>{w.signal}</b><br />{w.action}</p>)}</details>
  </section>;
}
