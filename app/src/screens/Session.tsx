import { useEffect, useMemo, useRef, useState } from "react";
import { exercise, planWeek, restSeconds, setCount, volFor, type Item, type Vol } from "../lib/plan";
import { store, type ItemLog, type SessionLog } from "../lib/store";
import { adviceFor, findSession, groups, nextSet, proposals, sessionRecords, sessionStats, workedMuscles } from "../lib/session";
import { targetRpe } from "../lib/progress";
import { LIB } from "../data/library";
import { dayLong, elapsed, intStr, kgStr, minutes } from "../lib/format";
import { useRest } from "../components/Timer";
import Thumb from "../components/Thumb";
import Icon from "../components/Icon";
import MuscleMap from "../components/MuscleMap";
import { PlateLine, RampChips } from "../components/Plates";
import { BAR_OF, ramp as rampOf } from "../lib/plates";
import { parseNum } from "../lib/format";
import { VL, raceDate } from "../lib/labels";
import { prefs } from "../lib/prefs";

/** Schermo sempre acceso durante la seduta (se il telefono lo permette): il timer resta visibile tra una serie e l'altra. */
function useWakeLock() {
  useEffect(() => {
    if (!prefs().wake) return;
    let lock: { release: () => Promise<void> } | null = null; let alive = true;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const get = async () => { try { if (alive && nav.wakeLock && document.visibilityState === "visible") lock = await nav.wakeLock.request("screen"); } catch { /* non concesso: pazienza */ } };
    const onVis = () => { if (document.visibilityState === "visible") void get(); };
    void get(); document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; document.removeEventListener("visibilitychange", onVis); void lock?.release().catch(() => {}); };
  }, []);
}
const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch { /* */ } };
function useNow(ms = 1000) { const [n, setN] = useState(Date.now()); useEffect(() => { const t = window.setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]); return n; }

export function Runner({ log, onChange, onOpen, onFinish, onMinimize }: { log: SessionLog; onChange: (l: SessionLog) => void; onOpen: (id: string) => void; onFinish: () => void; onMinimize: () => void }) {
  const rest = useRest(); useWakeLock(); const now = useNow();
  const s = findSession(log); const week = planWeek(log.phaseId, log.date, raceDate());
  const [over, setOver] = useState<Record<number, boolean>>({});
  if (!s) return <section className="stack"><p className="card pad">Seduta non trovata nel piano.</p><button type="button" className="primary big" onClick={onFinish}>Vai al riepilogo</button></section>;
  const upd = (l: SessionLog) => { store.saveSession(l); onChange(l); };
  /** Dolore > 3/10: fermo l'esercizio che fa male e porto a Basso tutto quello che non è ancora iniziato. */
  const toBasso = (i: number) => upd({ ...log, vol: "basso", items: log.items.map((x, j) => {
    if (j === i) return { ...x, pain: true, sets: x.sets.filter(z => z.done) };
    if (x.sets.some(z => z.done)) return x;
    return { ...x, sets: x.sets.slice(0, setCount(volFor(s.items[j], "basso", week))) };
  }) });
  const st = sessionStats(log, now); const nx = nextSet(log); const gs = groups(log.items);
  const nextLabel = (l: SessionLog) => { const n = nextSet(l); if (!n) return "fine della seduta"; const it = s.items[n.i];
    return `${it.code} · ${exercise(it.ex).name}, serie ${n.j + 1}`; };
  const warm = s.warmup ? splitWarm(s.warmup) : null;
  const firstBar = s.warmup && rampOf(s.warmup).length ? s.items.findIndex(x => BAR_OF[x.ex]) : -1;
  return <section className="stack run">
    <div className="runbar">
      <button type="button" className="iconbtn" onClick={onMinimize} aria-label="Riduci la seduta"><Icon n="down" /></button>
      <div className="rt"><b>{s.title.split("—")[0].trim()} · {VL[log.vol]}</b><span className="num">{elapsed((now - (log.start ?? +log.id)) / 1000)}</span></div>
      <button type="button" className="iconbtn" aria-label="Fai partire il recupero" onClick={() => { const n = nx ? s.items[nx.i] : null; rest(n ? restSeconds(n.rest) || 90 : 90, nextLabel(log)); }}><Icon n="timer" /></button>
      <button type="button" className="finebtn" onClick={onFinish}>Fine</button>
      <div className="prog" role="progressbar" aria-valuemin={0} aria-valuemax={st.total} aria-valuenow={st.done} aria-label={`${st.done} serie su ${st.total}`}><i style={{ width: `${st.total ? st.done / st.total * 100 : 0}%` }} /></div>
    </div>
    {warm && <details className="card pad warmup" open={st.done === 0}>
      <summary><span>Riscaldamento{warm.head ? ` · ${warm.head}` : ""}</span><span className="small muted num">{(log.warm ?? []).filter(Boolean).length}/{warm.items.length}</span></summary>
      <ul className="ticks">{warm.items.map((w, i) => <li key={i}><label><input type="checkbox" checked={!!log.warm?.[i]} onChange={e => { const a = [...(log.warm ?? [])]; a[i] = e.target.checked; upd({ ...log, warm: a }); }} />{w}</label></li>)}</ul>
    </details>}
    {gs.map((g, gi) => {
      const sets = g.reduce((a, i) => a + log.items[i].sets.length, 0); const done = g.reduce((a, i) => a + log.items[i].sets.filter(z => z.done).length, 0);
      const active = nx ? g.includes(nx.i) : false; const open = over[gi] ?? active;
      const toggle = () => setOver({ ...over, [gi]: !open });
      if (!open) return <button key={gi} type="button" className={"grow" + (sets && done === sets ? " ok" : sets === 0 ? " skip" : "")} onClick={toggle}>
        {g.map(i => <span key={i} className="grow-i"><span className={"code" + (sets && done === sets ? " ok" : "")}>{s.items[i].code}</span>
          <span className="iname">{exercise(s.items[i].ex).name}</span>
          <span className="small muted num">{log.items[i].sets.length === 0 ? "salta" : `${log.items[i].sets.filter(z => z.done).length}/${log.items[i].sets.length}${topKg(log.items[i])}`}</span></span>)}
      </button>;
      return <div key={gi} className={"card exg" + (g.length > 1 ? " superset" : "")}>
        {g.length > 1 && <button type="button" className="ss-lab" onClick={toggle}><Icon n="link" size={14} />Superserie {s.items[g[0]].code.replace(/\d+$/, "")} · alterna gli esercizi<Icon n="up" size={16} /></button>}
        {g.map(i => <RunItem key={i} it={s.items[i]} vol={log.vol} v={volFor(s.items[i], log.vol, week)} log={log.items[i]} cur={nx?.i === i ? nx.j : -1} rampText={i === firstBar ? s.warmup : undefined}
          onChange={x => {
            const ticked = x.sets.filter(z => z.done).length > log.items[i].sets.filter(z => z.done).length;
            const nl = { ...log, items: log.items.map((y, j) => j === i ? x : y) }; upd(nl);
            if (ticked) { if (prefs().vibrate) buzz(); if (prefs().autoRest) rest(restSeconds(s.items[i].rest), nextLabel(nl)); }
          }}
          onOpen={onOpen} onBasso={() => toBasso(i)} onToggle={g.length === 1 ? toggle : undefined} />)}
      </div>;
    })}
    <textarea className="note" placeholder="Note sulla seduta (sensazioni, dolori, cosa cambiare)" value={log.note ?? ""} onChange={e => upd({ ...log, note: e.target.value })} />
    <button type="button" className="primary big" onClick={onFinish}>Termina la seduta</button>
  </section>;
  function topKg(it: ItemLog) { const k = it.sets.filter(z => z.done).map(z => parseFloat(String(z.kg).replace(",", "."))).filter(x => x > 0); return k.length ? ` · ${kgStr(Math.max(...k))} kg` : ""; }
}

/** "R-MAR ~12': 3' bike · dorsiflessione 2×20″ · …" → titolo "R-MAR ~12'" e le voci da spuntare. */
function splitWarm(w: string) {
  const m = w.match(/^([^:·]{1,24}):\s*(.*)$/); const body = m ? m[2] : w;
  return { head: m ? m[1].trim() : "", items: body.split(/\s·\s/).map(x => x.trim()).filter(Boolean) };
}

function RunItem({ it, vol, v, log, cur, rampText, onChange, onOpen, onBasso, onToggle }: { it: Item; vol: Vol; v: string; log: ItemLog; cur: number; rampText?: string; onChange: (l: ItemLog) => void; onOpen: (id: string) => void; onBasso: () => void; onToggle?: () => void }) {
  const ex = exercise(it.ex); const last = useMemo(() => store.lastFor(it.ex), [it.ex]);
  const adv = useMemo(() => adviceFor(it, v, last), [it, v, last]);
  const lib = LIB[it.ex]; const trpe = targetRpe(it.intensity);
  const prop = proposals(it, v, last, adv, log.sets.length);
  const [menu, setMenu] = useState(false); const [showReg, setShowReg] = useState(false); const mref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!menu) return; const f = (e: PointerEvent) => { if (!mref.current?.contains(e.target as Node)) setMenu(false); }; document.addEventListener("pointerdown", f); return () => document.removeEventListener("pointerdown", f); }, [menu]);
  const set = (i: number, k: "kg" | "reps" | "rpe", val: string) => onChange({ ...log, sets: log.sets.map((z, j) => j === i ? { ...z, [k]: val } : z) });
  const tick = (i: number) => { const z = log.sets[i]; const d = !z.done; const p = prop[i];
    onChange({ ...log, sets: log.sets.map((y, j) => j !== i ? y : d ? { kg: y.kg || p.kg, reps: y.reps || p.reps, rpe: y.rpe || p.rpe, done: true } : { ...y, done: false }) }); };
  const addSet = () => { const z = log.sets[log.sets.length - 1]; onChange({ ...log, sets: [...log.sets, { kg: z?.kg ?? "", reps: "", rpe: "", done: false }] }); };
  const dropSet = () => { const k = log.sets.map(z => z.done).lastIndexOf(false); if (k >= 0) onChange({ ...log, sets: log.sets.filter((_, j) => j !== k) }); };
  return <div className={"ex" + (log.pain ? " pain" : "")}>
    <div className="ex-h">
      <button type="button" className="ex-open" onClick={() => onOpen(it.ex)} aria-label={`Scheda: ${ex.name}`}><Thumb ex={it.ex} /></button>
      <button type="button" className="ex-t" onClick={onToggle ?? (() => onOpen(it.ex))}>
        <b><span className="code">{it.code}</span>{ex.name}</b>
        <span className="small muted">{v} · {it.intensity}{it.tempo && it.tempo !== "—" ? ` · ${it.tempo}` : ""}{it.rest && it.rest !== "—" ? ` · rec. ${it.rest}` : ""}</span></button>
      <div className="menu-wrap" ref={mref}>
        <button type="button" className="iconbtn" aria-label="Altre azioni" aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon n="more" /></button>
        {menu && <div className="menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setMenu(false); onOpen(it.ex); }}><Icon n="info" size={18} />Scheda esercizio</button>
          {lib?.reg && <button type="button" role="menuitem" onClick={() => { setMenu(false); setShowReg(!showReg); }}><Icon n="down" size={18} />Versione più facile</button>}
          <button type="button" role="menuitem" onClick={() => { setMenu(false); addSet(); }}><Icon n="plus" size={18} />Aggiungi una serie</button>
          {log.sets.some(z => !z.done) && <button type="button" role="menuitem" onClick={() => { setMenu(false); dropSet(); }}><Icon n="minus" size={18} />Togli una serie</button>}
          <button type="button" role="menuitem" className="danger" onClick={() => { setMenu(false); onChange({ ...log, pain: !log.pain }); }}><Icon n="alert" size={18} />{log.pain ? "Togli la segnalazione di dolore" : "Dolore sopra 3/10"}</button>
        </div>}
      </div>
    </div>
    {it.note && <p className="inote">{it.note}</p>}
    {showReg && lib?.reg && <p className="regbox small"><b>Versione più facile:</b> {lib.reg}</p>}
    {adv && <p className="advice"><b>{kgStr(adv.kg)} kg{adv.reps ? ` × ${adv.reps}` : ""}.</b> {adv.why}</p>}
    {BAR_OF[it.ex] && (() => { const j = cur >= 0 ? cur : Math.max(0, log.sets.findIndex(z => !z.done)); const k = parseNum(log.sets[j]?.kg) ?? parseNum(prop[j]?.kg);
      return k ? <>{rampText && !log.sets.some(z => z.done) && <RampChips ex={it.ex} kg={k} text={rampText} />}<PlateLine ex={it.ex} kg={k} /></> : null; })()}
    {!last && log.sets.length > 0 && lib?.kind !== "cond" && trpe !== null && <p className="advice"><b>Prima volta: trova il carico.</b> 2–3 serie di avvicinamento salendo di peso finché la serie ti sembra RPE {trpe} (ne restano {Math.max(0, 10 - trpe)}). Segna kg, ripetizioni e RPE: dalla prossima volta il carico te lo propongo io.</p>}
    {log.sets.length === 0 ? <p className="small muted">Con questo volume l’esercizio si salta.</p> :
      <div className="sets" role="table" aria-label={`Serie di ${ex.name}`}>
        <div className="sr h" role="row"><span>Serie</span><span>Prima</span><span>Kg</span><span>Rip</span><span>RPE</span><span /></div>
        {log.sets.map((z, i) => { const p = prop[i]; const l = last?.[i];
          return <div key={i} role="row" className={"sr" + (z.done ? " done" : "") + (i === cur ? " cur" : "")}>
            <span className="sn">{i + 1}</span>
            <span className="pv">{l ? `${l.kg || "–"}×${l.reps || "–"}` : "—"}</span>
            <input aria-label={`Serie ${i + 1}, kg`} inputMode="decimal" value={z.kg} placeholder={p.kg} onChange={e => set(i, "kg", e.target.value)} />
            <input aria-label={`Serie ${i + 1}, ripetizioni`} inputMode="numeric" value={z.reps} placeholder={p.reps} onChange={e => set(i, "reps", e.target.value)} />
            <input aria-label={`Serie ${i + 1}, RPE`} inputMode="decimal" value={z.rpe} placeholder={p.rpe} onChange={e => set(i, "rpe", e.target.value)} />
            <button type="button" className="tick" aria-pressed={z.done} aria-label={`Serie ${i + 1} fatta`} onClick={() => tick(i)}><Icon n="check" size={20} /></button>
          </div>; })}
      </div>}
    {log.pain && <div className="warnbox stack-s">
      <p><b>Fermati con questo esercizio.</b> Il dolore sopra 3/10 vince su tutto: oggi volume Basso.</p>
      {lib?.reg && <p><b>Versione più facile, se non fa male:</b> {lib.reg}</p>}
      {(vol !== "basso" || log.sets.some(z => !z.done)) && <button type="button" className="primary" onClick={onBasso}>Ferma l'esercizio e passa a Basso</button>}
      <p className="small">Se il dolore dura più di una settimana, fisioterapista.</p>
    </div>}
  </div>;
}

/* ---------------- Riepilogo di fine seduta ---------------- */
export function Summary({ log, onBack, onSave, onDelete }: { log: SessionLog; onBack: () => void; onSave: (l: SessionLog) => void; onDelete: () => void }) {
  const [end] = useState(() => log.end ?? Date.now());
  const [srpe, setSrpe] = useState<number | undefined>(log.srpe); const [note, setNote] = useState(log.note ?? ""); const [ask, setAsk] = useState(false);
  const s = findSession(log); const st = sessionStats({ ...log, end }); const recs = useMemo(() => sessionRecords(log), [log]); const mus = workedMuscles(log);
  return <section className="stack summary">
    <div className="sum-head"><span className="okc"><Icon n="check" size={30} /></span>
      <h1>{st.done === st.total ? "Seduta completata" : "Fine della seduta"}</h1>
      {recs.length > 0 && <span className="pill recpill"><Icon n="trophy" size={16} />{recs.length === 1 ? "Nuovo record" : `${recs.length} nuovi record`}</span>}
      <p className="small muted">{s?.title.split("—")[0].trim()} · {VL[log.vol]} · {dayLong(log.date)}</p></div>
    <div className="tiles">
      <div className="tile"><span>Durata</span><b>{minutes(st.min)}</b></div>
      <div className="tile"><span>Serie</span><b className="num">{st.done}/{st.total}</b></div>
      <div className="tile"><span>Kg sollevati</span><b className="num">{st.tonnage ? intStr(st.tonnage) : "—"}</b></div>
      <div className="tile"><span>Record</span><b className="num">{recs.length}</b></div>
    </div>
    {recs.length > 0 && <div className="card pad stack-s">{recs.map(r => <div key={r.ex} className="pr"><Icon n="trophy" className="c-accent" />
      <span><b>{r.name} · {kgStr(r.kg)} kg{r.reps ? ` × ${r.reps}` : ""}</b>
        <span className="small muted">{r.what === "1rm" ? `1RM stimato ≈ ${kgStr(r.e1)} kg (prima ${kgStr(r.prev!)})` : `Carico più alto finora (prima ${kgStr(r.prev!)} kg)`}</span></span></div>)}</div>}
    <div className="card pad stack-s">
      <b>Quanto è stata dura la seduta?</b>
      <div className="rpe" role="group" aria-label="RPE della seduta da 1 a 10">{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <button key={n} type="button" aria-pressed={srpe === n} onClick={() => setSrpe(n)}>{n}</button>)}</div>
      <p className="small muted">1 = passeggiata, 10 = massimo. Servirà a sommare palestra, tatami e resistenza nel carico della settimana.</p>
    </div>
    {(mus.p.length > 0) && <div className="card pad stack-s"><b>Muscoli lavorati</b><MuscleMap p={mus.p} s={mus.s} /></div>}
    <textarea className="note" placeholder="Note sulla seduta (sensazioni, dolori, cosa cambiare)" value={note} onChange={e => setNote(e.target.value)} />
    <button type="button" className="primary big" onClick={() => onSave({ ...log, finished: true, end, srpe, note: note || undefined })}>Salva la seduta</button>
    <div className="row gap between">
      <button type="button" className="ghost" onClick={onBack}>Torna alla seduta</button>
      {!ask ? <button type="button" className="ghost danger" onClick={() => setAsk(true)}><Icon n="trash" size={18} />Elimina</button>
        : <span className="row gap"><span className="small">Eliminare la seduta?</span><button type="button" className="danger-fill" onClick={onDelete}>Elimina</button><button type="button" className="ghost" onClick={() => setAsk(false)}>No</button></span>}
    </div>
  </section>;
}
