import { useMemo, useState } from "react";
import { PLAN, addDays, currentPhaseId, isoToday, phaseDates, planWeek, type Phase, type Vol } from "../lib/plan";
import { store } from "../lib/store";
import { findSession, sessionStats } from "../lib/session";
import { mondayOf } from "../lib/today";
import { plannedGym } from "../lib/stats";
import { cap, dayLong, minutes } from "../lib/format";
import Icon from "../components/Icon";
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
    <Calendar />
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

/* ---------- calendario: sedute di palestra previste e fatte, tatami e resistenza ---------- */
const shiftMonth = (ym: string, d: number) => { const t = new Date(ym + "-01T12:00:00"); t.setMonth(t.getMonth() + d); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`; };
/** "Forza A — …" → "A", "Forza B + potenza — …" → "B", "Seduta R" → "R", "A3" → "A3". */
const short = (title: string) => { const t = title.split("—")[0].trim(); const m = t.match(/(?:^|\s)([A-Z]\d{0,2})(?=\s|$)/); return m ? m[1] : t.slice(0, 1); };
function Calendar() {
  const race = raceDate(); const today = isoToday();
  const [ym, setYm] = useState(today.slice(0, 7)); const [sel, setSel] = useState<string>(today);
  const data = useMemo(() => ({ gym: store.sessions().filter(s => s.finished), tat: store.tatami(), end: store.endurance() }), []);
  const start = mondayOf(ym + "-01"); const days: string[] = [];
  for (let d = start; d < shiftMonth(ym, 1) + "-01" || days.length % 7; d = addDays(d, 1)) days.push(d);
  const info = (d: string) => { const plan = plannedGym(d, race); const done = data.gym.filter(s => s.date === d);
    return { plan, done, tat: data.tat.filter(t => t.date === d), end: data.end.filter(e => e.date === d),
      st: done.length ? "done" : plan.length ? (d < today ? "miss" : "plan") : "" }; };
  const si = info(sel);
  const title = new Date(ym + "-01T12:00:00").toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  return <div className="card pad stack-s cal">
    <div className="row between"><h3>{cap(title)}</h3><span className="row">
      <button type="button" className="iconbtn" aria-label="Mese prima" onClick={() => setYm(shiftMonth(ym, -1))}><Icon n="right" className="flip" /></button>
      <button type="button" className="iconbtn" aria-label="Mese dopo" onClick={() => setYm(shiftMonth(ym, 1))}><Icon n="right" /></button></span></div>
    <div className="calgrid" role="grid" aria-label={`Calendario di ${title}`}>
      {["L", "M", "M", "G", "V", "S", "D"].map((l, i) => <span key={i} className="calh">{l}</span>)}
      {days.map(d => { const x = info(d); const out = !d.startsWith(ym);
        return <button key={d} type="button" className={"cald " + x.st + (out ? " out" : "") + (d === today ? " today" : "") + (d === sel ? " sel" : "")} onClick={() => setSel(d)}
          aria-label={`${dayLong(d)}${x.st === "done" ? ", palestra fatta" : x.st === "miss" ? ", palestra saltata" : x.st === "plan" ? ", palestra prevista" : ""}`}>
          <span className="n">{+d.slice(8)}</span>
          <span className="mk">{x.plan.length || x.done.length ? short((x.done[0] ? findSession(x.done[0])?.title : x.plan[0].title) ?? "") : ""}</span>
          <span className="dots">{x.tat.length > 0 && <i className="t" />}{x.end.length > 0 && <i className="e" />}</span>
        </button>; })}
    </div>
    <div className="legend"><span><i className="lg done" />fatta</span><span><i className="lg plan" />prevista</span><span><i className="lg miss" />saltata</span><span><i className="lg t" />tatami</span><span><i className="lg e" />nuoto, bici, corsa</span></div>
    <div className="calsel small"><b>{cap(dayLong(sel))}</b>
      {si.done.map(s => { const st = sessionStats(s); return <span key={s.id}>Palestra fatta: {findSession(s)?.title.split("—")[0].trim()} · {st.done}/{st.total} serie{s.end ? ` · ${minutes(st.min)}` : ""}{s.srpe ? ` · RPE ${s.srpe}` : ""}</span>; })}
      {!si.done.length && si.plan.map(p => <span key={p.id} className={si.st === "miss" ? "c-bad" : ""}>{si.st === "miss" ? "Saltata" : "Prevista"}: {p.title}</span>)}
      {si.tat.map(t => <span key={t.id}>Tatami: {t.kind === "gi" ? "gi" : "no-gi"} · {minutes(t.min)}{t.rounds ? ` · ${t.rounds} round` : ""}{t.rpe ? ` · RPE ${t.rpe}` : ""}</span>)}
      {si.end.map(e => <span key={e.id}>{cap(e.sport)} · {minutes(e.min)}{e.km ? ` · ${String(e.km).replace(".", ",")} km` : ""}</span>)}
      {!si.done.length && !si.plan.length && !si.tat.length && !si.end.length && <span className="muted">Niente palestra prevista.</span>}
    </div>
  </div>;
}
