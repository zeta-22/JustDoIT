import { useMemo, useState } from "react";
import { addDays, exercise, isoToday, phase } from "../lib/plan";
import { DIVISIONS, store, type EnduranceLog, type SessionLog, type Sport } from "../lib/store";
import { findSession, sessionStats } from "../lib/session";
import { mondayOf } from "../lib/today";
import { completeWeeks, e1rmSeries, liftList, monthGym, monthRecords, topKgSeries, weekLoad, weekMuscles, weightTrend } from "../lib/stats";
import { dayShort, dec, intStr, kgStr, minutes, parseNum } from "../lib/format";
import { VL, raceDate } from "../lib/labels";
import LineChart from "../components/LineChart";
import BarChart from "../components/BarChart";
import MuscleMap from "../components/MuscleMap";
import Icon from "../components/Icon";
import Empty from "../components/Empty";
import { useToast } from "../components/Toast";

export type ProgMode = "insieme" | "palestra" | "tatami" | "endurance" | "peso";
const MODES: [ProgMode, string][] = [["insieme", "Insieme"], ["palestra", "Palestra"], ["tatami", "Tatami"], ["endurance", "Nuoto, bici, corsa"], ["peso", "Peso"]];
const weeksBack = (n: number) => { const wk = mondayOf(isoToday()); return Array.from({ length: n }, (_, i) => addDays(wk, -7 * (n - 1 - i))); };
const monthName = () => new Date(isoToday() + "T12:00:00").toLocaleDateString("it-IT", { month: "long" });

export default function ProgressView({ mode, onMode, onTatami, sport }: { mode: ProgMode; onMode: (m: ProgMode) => void; onTatami: () => void; sport?: Sport }) {
  return <section className="stack">
    <header className="top"><div><span className="over">Storico e grafici</span><h1>Progressi</h1></div></header>
    <div className="hscroll chips nowrap" role="group" aria-label="Sezione">{MODES.map(([m, l]) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => onMode(m)}>{l}</button>)}</div>
    {mode === "insieme" ? <Overview onMode={onMode} /> : mode === "palestra" ? <Gym /> : mode === "tatami" ? <Tatami onAdd={onTatami} /> : mode === "endurance" ? <Endurance initial={sport} /> : <Weight />}
  </section>;
}

function Spark({ pts }: { pts: { y: number }[] }) {
  if (pts.length < 2) return <svg className="spark" viewBox="0 0 70 24" aria-hidden="true" />;
  const ys = pts.map(p => p.y); const lo = Math.min(...ys), hi = Math.max(...ys) || lo + 1;
  const d = pts.map((p, i) => `${(2 + i / (pts.length - 1) * 66).toFixed(1)},${(21 - (hi === lo ? 9 : (p.y - lo) / (hi - lo) * 18)).toFixed(1)}`).join(" ");
  return <svg className="spark" viewBox="0 0 70 24" aria-hidden="true"><polyline points={d} /></svg>;
}

/* ---------------- insieme ---------------- */
function Overview({ onMode }: { onMode: (m: ProgMode) => void }) {
  const race = raceDate(); const today = isoToday(); const mn = monthName();
  const mg = monthGym(race); const cw = completeWeeks(race); const recs = monthRecords(today.slice(0, 7));
  const wt = weightTrend(race); const st = store.settings(); const div = DIVISIONS[st.division];
  const loads = weeksBack(8).map(w => { const l = weekLoad(w); return { x: w, parts: [l.gym, l.tatami, l.endurance] }; });
  const lifts = liftList().slice(0, 4); const mus = weekMuscles(mondayOf(today));
  const margin = wt ? div.limit - (wt.avg + st.uniformKg) : null;
  return <>
    <div className="kpis">
      <div><b className="num">{mg.done}{mg.planned ? `/${mg.planned}` : ""}</b><span>sedute di palestra a {mn}</span></div>
      <div><b className="num">{cw}</b><span>{cw === 1 ? "settimana completa" : "settimane complete"} di fila</span></div>
      <div><b className="num">{recs}</b><span>record a {mn}</span></div>
    </div>
    {wt && <button type="button" className="card pad stack-s tapcard" onClick={() => onMode("peso")}>
      <div className="row between"><div><span className="over">Peso · media 7 giorni</span><p className="bignum num" style={{ fontSize: "2rem" }}>{dec(wt.avg)} kg</p></div>
        {margin !== null && <span className={"pill" + (margin < 0 ? " bad" : margin < 1 ? " warn" : "")}>margine {dec(margin)} kg</span>}</div>
      <span className="small muted">{wt.perWeek === null ? "Servono più pesate per la tendenza." : `${Math.abs(wt.perWeek) < 0.05 ? "Stabile" : wt.perWeek > 0 ? "In salita" : "In discesa"} (${wt.perWeek > 0 ? "+" : "−"}${dec(Math.abs(wt.perWeek))} kg a settimana).`}
        {wt.atRace !== null && ` Alla gara, a questo ritmo: ≈ ${dec(wt.atRace)} kg, margine ${dec(div.limit - wt.atRace - st.uniformKg)} kg.`}</span>
    </button>}
    <div className="card pad stack-s"><h3>Carico della settimana</h3>
      <BarChart bars={loads} names={["Palestra", "Tatami", "Nuoto, bici, corsa"]} colors={["var(--accent)", "var(--tatami)", "var(--ironman)"]} label="Minuti × fatica" unit="" fmt={v => intStr(v)} empty="Ancora nessun dato: segna quanto è stata dura nel riepilogo della seduta, nel tatami e negli allenamenti di resistenza." />
      <p className="small muted">Conta solo le voci con la fatica segnata (in palestra, l'RPE della seduta nel riepilogo). È un'informazione: il volume lo decide sempre il check-in.</p></div>
    {lifts.length > 0 && <div className="card pad"><h3 style={{ marginBottom: 6 }}>Forza</h3>
      {lifts.map(l => { const s = l.pts.length ? l.pts : l.kg; const last = s[s.length - 1].y, first = s[0].y;
        return <button key={l.ex} type="button" className="lift" onClick={() => onMode("palestra")}><span>{l.name}<small className="muted">{l.pts.length ? "1RM stimato" : "carico massimo"}</small></span><Spark pts={s} />
          <span className="lv"><b className="num">{kgStr(last)} kg</b>{s.length > 1 && last !== first && <small className={last > first ? "up" : "down"}>{last > first ? "+" : "−"}{kgStr(Math.abs(last - first))}</small>}</span></button>; })}</div>}
    {mus.list.length > 0 && <div className="card pad stack-s"><h3>Muscoli della settimana</h3><MuscleMap p={mus.p} s={mus.s} />
      <p className="small muted">Serie (mezza per i secondari): {mus.list.slice(0, 7).map(([m, n]) => `${m} ${dec(n, n % 1 ? 1 : 0)}`).join(" · ")}</p></div>}
  </>;
}

/* ---------------- palestra: grafico per esercizio + sedute ---------------- */
function Gym() {
  const toast = useToast();
  const [all, setAll] = useState(() => store.sessions().filter(s => s.finished).reverse());
  const refresh = () => setAll(store.sessions().filter(s => s.finished).reverse());
  const lifts = useMemo(() => liftList(), [all]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ex, setEx] = useState<string | null>(null); const [what, setWhat] = useState<"1rm" | "kg">("1rm");
  if (!all.length) return <Empty fig="trap_bar" title="Ancora nessuna seduta salvata." text="Quando finisci una seduta, qui trovi i carichi, il 1RM stimato e lo storico." />;
  const cur = lifts.find(x => x.ex === ex) ?? lifts[0];
  const pts = cur ? (what === "1rm" ? e1rmSeries(cur.ex) : topKgSeries(cur.ex)) : [];
  return <>
    {cur && <div className="card pad stack-s">
      <h3>Per esercizio</h3>
      <label className="field" htmlFor="pex">Esercizio<select id="pex" value={cur.ex} onChange={e => setEx(e.target.value)}>
        {lifts.map(x => <option key={x.ex} value={x.ex}>{x.name} ({x.kg.length})</option>)}</select></label>
      <div className="seg" role="group" aria-label="Valore"><button type="button" aria-pressed={what === "1rm"} onClick={() => setWhat("1rm")}>1RM stimato</button><button type="button" aria-pressed={what === "kg"} onClick={() => setWhat("kg")}>Carico massimo</button></div>
      {pts.length ? <LineChart label={what === "1rm" ? "1RM stimato (Epley)" : "Carico più alto della seduta"} unit="kg" points={pts} fmt={v => kgStr(v)} /> : <p className="small muted">Per il 1RM stimato servono kg e ripetizioni (da 1 a 12).</p>}
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

/* ---------------- tatami ---------------- */
function Tatami({ onAdd }: { onAdd: () => void }) {
  const toast = useToast(); const [list, setList] = useState(store.tatami());
  const wk = mondayOf(isoToday());
  const sum = (from: string, to: string) => list.filter(t => t.date >= from && t.date < to).reduce((a, t) => ({ n: a.n + 1, min: a.min + t.min, rounds: a.rounds + (t.rounds ?? 0) }), { n: 0, min: 0, rounds: 0 });
  const cur = sum(wk, addDays(wk, 7)), prev = sum(addDays(wk, -7), wk);
  const bars = weeksBack(8).map(w => { const ws = list.filter(t => t.date >= w && t.date < addDays(w, 7));
    return { x: w, parts: [ws.filter(t => t.kind === "gi").reduce((a, t) => a + t.min, 0) / 60, ws.filter(t => t.kind === "nogi").reduce((a, t) => a + t.min, 0) / 60] }; });
  return <div className="stack">
    <button type="button" className="primary big" onClick={onAdd}><Icon n="plus" size={20} />Registra il tatami</button>
    {list.length === 0 ? <Empty fig="copenhagen" title="Ancora niente tatami registrato." text={'Segna gi o no-gi, minuti, round e quanto è stato duro: il check-in del giorno dopo lo usa per "botte del tatami".'} /> : <>
      <div className="card pad stack-s"><h3>Questa settimana</h3>
        <div className="kpis"><div><b className="num">{cur.n}</b><span>allenamenti</span></div><div><b className="num">{minutes(cur.min)}</b><span>sul tatami</span></div><div><b className="num">{cur.rounds}</b><span>round di sparring</span></div></div>
        <p className="small muted">Settimana scorsa: {prev.n} allenamenti, {minutes(prev.min)}, {prev.rounds} round.</p>
        <BarChart bars={bars} names={["Gi", "No-gi"]} colors={["var(--accent)", "var(--tatami)"]} label="Ore a settimana" unit="h" fmt={v => dec(v)} />
      </div>
      <div className="card pad"><h3>Ultimi allenamenti</h3>
        <ul className="plain">{list.slice(-20).reverse().map(t => <li key={t.id}>
          <span>{dayShort(t.date)} · {t.kind === "gi" ? "Gi" : "No-gi"}{t.note ? <span className="small muted"> · {t.note}</span> : null}</span>
          <b>{minutes(t.min)}{t.rounds ? ` · ${t.rounds} round` : ""}{t.rpe ? ` · RPE ${t.rpe}` : ""}
            <button type="button" className="xbtn" aria-label="Elimina" onClick={() => { store.deleteTatami(t.id); setList(store.tatami()); toast("Tatami eliminato", () => { store.saveTatami(t); setList(store.tatami()); }); }}><Icon n="x" size={16} /></button></b></li>)}</ul></div>
    </>}
  </div>;
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
function Endurance({ initial }: { initial?: Sport }) {
  const toast = useToast();
  const [list, setList] = useState(store.endurance());
  const [sport, setSport] = useState<Sport>(initial ?? "corsa"); const [date, setDate] = useState(isoToday());
  const [min, setMin] = useState(""); const [km, setKm] = useState(""); const [rpe, setRpe] = useState(""); const [note, setNote] = useState("");
  const save = () => { const m = parseNum(min); if (!m || m <= 0) return;
    store.saveEndurance({ id: `${Date.now()}`, date, sport, min: m, km: parseNum(km) ?? undefined, rpe: parseNum(rpe) ?? undefined, note: note.trim() || undefined });
    setList(store.endurance()); setMin(""); setKm(""); setRpe(""); setNote(""); toast("Allenamento salvato"); };
  const wk = mondayOf(isoToday()), prev = addDays(wk, -7);
  const sum = (from: string, to: string) => { const r = { nuoto: 0, bici: 0, corsa: 0, tot: 0, km: { nuoto: 0, bici: 0, corsa: 0 } };
    list.filter(e => e.date >= from && e.date < to).forEach(e => { r[e.sport] += e.min; r.tot += e.min; r.km[e.sport] += e.km ?? 0; }); return r; };
  const cur = sum(wk, addDays(wk, 7)), last = sum(prev, wk);
  const jump = last.tot > 0 && cur.tot > last.tot * 1.1;
  const bars = weeksBack(10).map(w => { const r = sum(w, addDays(w, 7)); return { x: w, parts: [r.nuoto / 60, r.bici / 60, r.corsa / 60] }; });
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
      {list.length > 0 && <BarChart bars={bars} names={["Nuoto", "Bici", "Corsa"]} colors={["var(--ironman)", "color-mix(in srgb, var(--ironman) 55%, var(--surface))", "color-mix(in srgb, var(--ironman) 28%, var(--surface))"]} label="Ore a settimana" unit="h" fmt={v => dec(v)} />}
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
  const div = DIVISIONS[st.division]; const wt = weightTrend(raceDate());
  const last7 = ws.slice(-7); const avg = last7.length ? last7.reduce((a, w) => a + w.kg, 0) / last7.length : null;
  const margin = avg !== null ? div.limit - (avg + st.uniformKg) : null;
  const light = margin === null ? "" : margin >= 1 ? "verde" : margin >= 0 ? "giallo" : "rosso";
  return <div className="stack">
    {avg !== null && <div className={"card pad light " + light}>
      <span className="over">Media ultimi {last7.length} giorni · {div.label.split("(")[0].trim()}</span>
      <p className="bignum num">{dec(avg)} kg</p>
      <p>Con la divisa: <b>{dec(avg + st.uniformKg)} kg</b> · limite {dec(div.limit)} kg · margine <b>{dec(margin!)} kg</b></p>
      {wt?.perWeek != null && <p className="small">Tendenza: {wt.perWeek > 0 ? "+" : "−"}{dec(Math.abs(wt.perWeek))} kg a settimana{wt.atRace !== null ? ` · alla gara ≈ ${dec(wt.atRace)} kg (con la divisa ${dec(wt.atRace + st.uniformKg)})` : ""}.</p>}
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
