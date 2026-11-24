import { useMemo, useState } from "react";
import { addDays, exercise, isoToday, phase } from "../lib/plan";
import { DIVISIONS, store, type EnduranceLog, type SessionLog, type Sport } from "../lib/store";
import { findSession, sessionStats } from "../lib/session";
import { mondayOf } from "../lib/today";
import { dayShort, dec, kgStr, minutes, parseNum } from "../lib/format";
import LineChart from "../components/LineChart";
import Icon from "../components/Icon";
import { useToast } from "../components/Toast";
import { VL } from "../lib/labels";

export type ProgMode = "palestra" | "endurance" | "peso";
const MODES: [ProgMode, string][] = [["palestra", "Palestra"], ["endurance", "Resistenza"], ["peso", "Peso"]];

export default function ProgressView({ mode, onMode }: { mode: ProgMode; onMode: (m: ProgMode) => void }) {
  return <section className="stack">
    <header className="top"><div><span className="over">Storico e grafici</span><h1>Progressi</h1></div></header>
    <div className="seg" role="group" aria-label="Sezione">{MODES.map(([m, l]) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => onMode(m)}>{l}</button>)}</div>
    {mode === "palestra" ? <Gym /> : mode === "endurance" ? <><h2>Nuoto, bici, corsa</h2><Endurance /></> : <Weight />}
  </section>;
}

/* ---------------- palestra: grafico per esercizio + sedute ---------------- */
function Gym() {
  const toast = useToast();
  const [all, setAll] = useState(() => store.sessions().filter(s => s.finished).reverse());
  const refresh = () => setAll(store.sessions().filter(s => s.finished).reverse());
  const series = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    all.forEach(l => l.items.forEach(it => it.sets.forEach(z => { const k = parseNum(z.kg);
      if (!z.done || !(k! > 0)) return; const d = m.get(it.ex) ?? new Map(); d.set(l.date, Math.max(d.get(l.date) ?? 0, k!)); m.set(it.ex, d); })));
    return [...m.entries()].map(([ex, d]) => ({ ex, pts: [...d.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([x, y]) => ({ x, y })) })).sort((a, b) => b.pts.length - a.pts.length);
  }, [all]);
  const [ex, setEx] = useState<string | null>(null);
  if (!all.length) return <div className="empty"><Icon n="dumb" size={36} /><p><b>Ancora nessuna seduta salvata.</b></p><p className="small muted">Quando finisci una seduta, qui trovi i carichi e lo storico.</p></div>;
  const cur = series.find(x => x.ex === ex) ?? series[0];
  return <>
    {cur && <div className="card pad stack-s">
      <h3>Carico per esercizio</h3>
      <label className="field" htmlFor="pex">Esercizio<select id="pex" value={cur.ex} onChange={e => setEx(e.target.value)}>
        {series.map(x => <option key={x.ex} value={x.ex}>{exercise(x.ex).name} ({x.pts.length})</option>)}</select></label>
      <LineChart label="Carico più alto della seduta" unit="kg" points={cur.pts} fmt={v => kgStr(v)} />
    </div>}
    <div className="stack-s">{all.map(l => <SessionRow key={l.id} l={l} onDelete={() => { store.deleteSession(l.id); refresh(); toast("Seduta eliminata", () => { store.saveSession(l); refresh(); }); }} />)}</div>
  </>;
}
function SessionRow({ l, onDelete }: { l: SessionLog; onDelete: () => void }) {
  const s = findSession(l); const st = sessionStats(l);
  return <details className="card pad hist"><summary><span><b>{dayShort(l.date)}</b> · {s?.title.split("—")[0].trim() ?? l.sessionId}</span>
    <span className="small muted num">{VL[l.vol]} · {st.done}/{st.total}{l.end ? ` · ${minutes(st.min)}` : ""}{l.srpe ? ` · RPE ${l.srpe}` : ""}</span></summary>
    <div className="stack-s">
      {l.items.filter(it => it.sets.some(z => z.done)).map((it, i) => <p key={i} className="small"><b>{exercise(it.ex).name}:</b> {it.sets.filter(z => z.done).map(z => `${z.kg || "–"}×${z.reps || "–"}${z.rpe ? ` @${z.rpe}` : ""}`).join(" · ")}{it.pain ? " · dolore" : ""}</p>)}
      {l.note && <p className="small muted">{l.note}</p>}
      <p className="small muted">{phase(l.phaseId)?.name}</p>
      <button type="button" className="ghost danger" onClick={onDelete}><Icon n="trash" size={18} />Elimina</button>
    </div>
  </details>;
}

/* ---------------- nuoto, bici, corsa ---------------- */
const SPORTS: Record<Sport, string> = { nuoto: "Nuoto", bici: "Bici", corsa: "Corsa" };
function pace(e: EnduranceLog): string | null {
  if (!e.km || !e.min) return null;
  const mmss = (p: number) => `${Math.floor(p)}:${String(Math.round((p % 1) * 60)).padStart(2, "0")}`;
  if (e.sport === "corsa") return `${mmss(e.min / e.km)}/km`;
  if (e.sport === "nuoto") return `${mmss(e.min / (e.km * 10))}/100 m`;
  return `${dec(e.km / (e.min / 60))} km/h`;
}
function Endurance() {
  const toast = useToast();
  const [list, setList] = useState(store.endurance());
  const [sport, setSport] = useState<Sport>("corsa"); const [date, setDate] = useState(isoToday());
  const [min, setMin] = useState(""); const [km, setKm] = useState(""); const [rpe, setRpe] = useState(""); const [note, setNote] = useState("");
  const save = () => { const m = parseNum(min); if (!m || m <= 0) return;
    store.saveEndurance({ id: `${Date.now()}`, date, sport, min: m, km: parseNum(km) ?? undefined, rpe: parseNum(rpe) ?? undefined, note: note.trim() || undefined });
    setList(store.endurance()); setMin(""); setKm(""); setRpe(""); setNote(""); toast("Allenamento salvato"); };
  const wk = mondayOf(isoToday()), prev = addDays(wk, -7);
  const sum = (from: string, to: string) => { const r = { nuoto: 0, bici: 0, corsa: 0, tot: 0, km: { nuoto: 0, bici: 0, corsa: 0 } };
    list.filter(e => e.date >= from && e.date < to).forEach(e => { r[e.sport] += e.min; r.tot += e.min; r.km[e.sport] += e.km ?? 0; }); return r; };
  const cur = sum(wk, addDays(wk, 7)), last = sum(prev, wk);
  const jump = last.tot > 0 && cur.tot > last.tot * 1.1;
  const weeks = Array.from({ length: 10 }, (_, i) => addDays(wk, -7 * (9 - i))).map(w => ({ x: w, y: sum(w, addDays(w, 7)).tot / 60 }));
  return <div className="stack">
    <div className="card pad stack-s">
      <h3>Registra un allenamento</h3>
      <div className="seg" role="group" aria-label="Sport">{(Object.keys(SPORTS) as Sport[]).map(k => <button key={k} type="button" aria-pressed={sport === k} onClick={() => setSport(k)}>{SPORTS[k]}</button>)}</div>
      <div className="grid2">
        <label className="field" htmlFor="ed">Data<input id="ed" type="date" value={date} onChange={e => setDate(e.target.value || isoToday())} /></label>
        <label className="field" htmlFor="em2">Minuti<input id="em2" inputMode="decimal" value={min} onChange={e => setMin(e.target.value)} placeholder="es. 45" /></label>
        <label className="field" htmlFor="ek">Km{sport === "nuoto" ? " (1,5 = 1500 m)" : ""}<input id="ek" inputMode="decimal" value={km} onChange={e => setKm(e.target.value)} placeholder={sport === "nuoto" ? "es. 1,5" : sport === "bici" ? "es. 30" : "es. 8"} /></label>
        <label className="field" htmlFor="er">Fatica (RPE 1–10)<input id="er" inputMode="decimal" value={rpe} onChange={e => setRpe(e.target.value)} placeholder="es. 4" /></label>
      </div>
      <label className="field" htmlFor="en">Note<input id="en" value={note} onChange={e => setNote(e.target.value)} placeholder="sensazioni, fastidi, tecnica…" /></label>
      <button type="button" className="primary" disabled={!parseNum(min)} onClick={save}>Salva</button>
      <p className="small muted">Facile = RPE 3–4 (riesci a parlare in frasi intere). La maggior parte del lavoro Ironman è a questa intensità.</p>
    </div>
    <div className="card pad stack-s">
      <h3>Questa settimana</h3>
      <ul className="plain">{(Object.keys(SPORTS) as Sport[]).map(k => <li key={k}><span>{SPORTS[k]}</span><b>{minutes(cur[k])}{cur.km[k] ? ` · ${dec(cur.km[k])} km` : ""}</b></li>)}
        <li><span>Totale</span><b>{minutes(cur.tot)} <span className="small muted">(settimana scorsa {minutes(last.tot)})</span></b></li></ul>
      {jump && <p className="small warnbox">Stai aumentando più del 10% rispetto alla settimana scorsa: va bene ogni tanto, ma tieni d'occhio stinchi, polpacci e tendine d'Achille, soprattutto nella corsa.</p>}
      {list.length > 1 && <LineChart label="Ore a settimana" unit="h" points={weeks} fmt={v => dec(v)} />}
    </div>
    {list.length > 0 && <div className="card pad"><h3>Ultimi allenamenti</h3>
      <ul className="plain">{list.slice(-20).reverse().map(e => <li key={e.id}>
        <span>{dayShort(e.date)} · {SPORTS[e.sport]}{e.note ? <span className="small muted"> · {e.note}</span> : null}</span>
        <b>{minutes(e.min)}{e.km ? ` · ${dec(e.km)} km` : ""}{pace(e) ? ` · ${pace(e)}` : ""}{e.rpe ? ` · RPE ${e.rpe}` : ""}
          <button type="button" className="xbtn" aria-label="Elimina" onClick={() => { store.deleteEndurance(e.id); setList(store.endurance()); toast("Allenamento eliminato", () => { store.saveEndurance(e); setList(store.endurance()); }); }}><Icon n="x" size={16} /></button></b></li>)}</ul></div>}
  </div>;
}

/* ---------------- peso ---------------- */
function Weight() {
  const toast = useToast();
  const [ws, setWs] = useState(store.weights()); const st = store.settings(); const [kg, setKg] = useState("");
  const div = DIVISIONS[st.division];
  const last7 = ws.slice(-7); const avg = last7.length ? last7.reduce((a, w) => a + w.kg, 0) / last7.length : null;
  const margin = avg !== null ? div.limit - (avg + st.uniformKg) : null;
  const light = margin === null ? "" : margin >= 1 ? "verde" : margin >= 0 ? "giallo" : "rosso";
  return <div className="stack">
    {avg !== null && <div className={"card pad light " + light}>
      <span className="over">Media ultimi {last7.length} giorni · {div.label.split("(")[0].trim()}</span>
      <p className="bignum num">{dec(avg)} kg</p>
      <p>Con la divisa: <b>{dec(avg + st.uniformKg)} kg</b> · limite {dec(div.limit)} kg · margine <b>{dec(margin!)} kg</b></p>
      <p className="small">{light === "verde" ? "Sei dentro con margine: mangia per allenarti." : light === "giallo" ? "Dentro ma al limite: niente extra, porzioni un po’ più piccole nei giorni di riposo." : "Fuori categoria con la media attuale. Niente tagli d’acqua: valuta la categoria sopra (in Profilo)."}</p>
    </div>}
    <div className="card pad stack-s">
      <h3>Pesata</h3><p className="small muted">Al mattino, dopo il bagno, senza vestiti e prima di mangiare. Di solito la fai nel check-in di Oggi.</p>
      <div className="row gap"><input className="big-in" inputMode="decimal" aria-label="Peso di oggi in kg" placeholder="es. 78,0" value={kg} onChange={e => setKg(e.target.value)} />
        <button type="button" className="primary" onClick={() => { const n = parseNum(kg); if (n && n > 30 && n < 200) { store.saveWeight({ date: isoToday(), kg: n }); setWs(store.weights()); setKg(""); toast("Pesata salvata"); } }}>Salva</button></div>
    </div>
    {ws.length > 1 && <div className="card pad stack-s"><h3>Andamento</h3>
      <LineChart label="Peso del mattino" unit="kg" points={ws.slice(-60).map(w => ({ x: w.date, y: w.kg }))} fmt={v => dec(v)}
        line={ws.slice(-60).map((w, i, a) => { const b = a.slice(Math.max(0, i - 6), i + 1); return { x: w.date, y: b.reduce((x, z) => x + z.kg, 0) / b.length }; })}
        refLine={{ y: div.limit - st.uniformKg, label: `limite senza divisa ${dec(div.limit - st.uniformKg)}` }} />
      <p className="small muted">Punti: le pesate. Linea: media degli ultimi 7 giorni. Tratteggio: il limite della categoria meno il peso della divisa.</p>
    </div>}
    {ws.length > 0 && <div className="card pad"><h3>Ultime pesate</h3><ul className="plain">{ws.slice(-14).reverse().map(w => <li key={w.date}><span>{dayShort(w.date)}</span>
      <b className="num">{dec(w.kg)} kg<button type="button" className="xbtn" aria-label="Elimina" onClick={() => { store.deleteWeight(w.date); setWs(store.weights()); toast("Pesata eliminata", () => { store.saveWeight(w); setWs(store.weights()); }); }}><Icon n="x" size={16} /></button></b></li>)}</ul></div>}
  </div>;
}
