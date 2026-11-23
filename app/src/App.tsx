import { useEffect, useMemo, useState } from "react";
import { PLAN, SCORE, START, currentPhaseId, exercise, isoToday, phase, restSeconds, setCount, type Item, type Phase, type Session, type Vol } from "./lib/plan";
import { DIVISIONS, signIn, signOut, store, sync, syncState, type ItemLog, type SessionLog, type Settings } from "./lib/store";
import { FIGS } from "./data/figures";
import Figure from "./components/Figure";
import MuscleMap from "./components/MuscleMap";
import { TimerProvider, useRest } from "./components/Timer";

type Tab = "oggi" | "piano" | "peso" | "storico" | "altro";
const VOLS: Vol[] = ["basso", "medio", "alto"];
const VL: Record<Vol, string> = { basso: "Basso", medio: "Medio", alto: "Alto" };
const PROG_LABEL = { bjj: "Gara BJJ", transizione: "Transizione", ironman: "Ironman" };

export default function App() {
  const [tab, setTab] = useState<Tab>("oggi");
  const [running, setRunning] = useState<SessionLog | null>(() => store.sessions().find(s => !s.finished) ?? null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [rev, setRev] = useState(0); // cambia quando arrivano dati da un altro dispositivo
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail?.changed) setRev(r => r + 1); };
    window.addEventListener("jdi:sync", on); return () => window.removeEventListener("jdi:sync", on);
  }, []);
  return <TimerProvider>
    <div className="wrap">
      {running
        ? <Runner log={running} onChange={setRunning} onOpen={setSheet} onExit={() => { setRunning(null); setTab("storico"); }} />
        : <>
          <nav className="tabs" aria-label="Sezioni">
            {(["oggi", "piano", "peso", "storico", "altro"] as Tab[]).map(t => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>{{ oggi: "Oggi", piano: "Piano", peso: "Peso", storico: "Storico", altro: "Altro" }[t]}</button>)}
          </nav>
          <div key={rev} className="stack">
            {tab === "oggi" && <Today onStart={l => { store.saveSession(l); setRunning(l); }} onOpen={setSheet} />}
            {tab === "piano" && <PlanView onOpen={setSheet} />}
            {tab === "peso" && <Weight />}
            {tab === "storico" && <History />}
            {tab === "altro" && <More />}
          </div>
        </>}
    </div>
    {sheet && <ExerciseSheet id={sheet} onClose={() => setSheet(null)} />}
  </TimerProvider>;
}

/* ---------------- Oggi ---------------- */
function Today({ onStart, onOpen }: { onStart: (l: SessionLog) => void; onOpen: (id: string) => void }) {
  const pid = currentPhaseId(); const ph = phase(pid);
  const before = isoToday() < START.bjj1_accumulo;
  const [sid, setSid] = useState(ph.sessions[0].id);
  const [vol, setVol] = useState<Vol>("medio");
  const s = ph.sessions.find(x => x.id === sid) ?? ph.sessions[0];
  const sundays = ph.program === "bjj" ? phase("bjj_domenica") : null;
  const all = sundays ? [...ph.sessions, ...sundays.sessions] : ph.sessions;
  const sess = all.find(x => x.id === sid) ?? s;
  return <section className="stack">
    <div className="hero-card" style={{ ["--pc" as string]: `var(--${ph.program})` }}>
      <span className="lab">{before ? "Si parte lunedì 23 novembre" : "Fase attuale"} · {PROG_LABEL[ph.program]}</span>
      <h1>{ph.name}</h1>
      <p className="muted">{ph.dates}</p>
      <p>{ph.goal}</p>
    </div>
    <div className="card pad">
      <h2>Settimana tipo</h2><p className="small">{ph.weekly}</p>
    </div>
    <div className="stack-s">
      <h2>Che seduta fai?</h2>
      <div className="chips">{all.map(x => <button key={x.id} type="button" aria-pressed={x.id === sess.id} onClick={() => setSid(x.id)}>{x.day.length > 24 || x.day === "Domenica" ? x.title.split("—")[0].trim().replace(/^Opzione/, "Dom · opz.") : x.day}</button>)}</div>
    </div>
    <CheckIn program={ph.program === "bjj" ? "bjj" : "ironman"} vol={vol} onVol={setVol} />
    <SessionPreview s={sess} vol={vol} onOpen={onOpen} />
    <button type="button" className="primary big" onClick={() => onStart(newLog(pid, sess, vol))}>Inizia la seduta · volume {VL[vol]}</button>
  </section>;
}
function newLog(phaseId: string, s: Session, vol: Vol): SessionLog {
  return { id: `${Date.now()}`, date: isoToday(), phaseId, sessionId: s.id, vol, finished: false,
    items: s.items.map(it => { const n = setCount(it.vol[vol]); const last = store.lastFor(it.ex);
      return { code: it.code, ex: it.ex, sets: Array.from({ length: n }, (_, i) => ({ kg: last?.[i]?.kg ?? last?.[0]?.kg ?? "", reps: "", rpe: "", done: false })) }; }) };
}
function CheckIn({ program, vol, onVol }: { program: "bjj" | "ironman"; vol: Vol; onVol: (v: Vol) => void }) {
  const cfg = SCORE[program]; const [ans, setAns] = useState<(number | undefined)[]>([]); const [open, setOpen] = useState(false);
  const done = cfg.qs.every((_, i) => ans[i] !== undefined); const tot = ans.reduce<number>((a, b) => a + (b ?? 0), 0);
  const lvl = done ? cfg.range.find(r => tot >= r[0] && tot <= r[1])![2] : null;
  useEffect(() => { if (lvl) onVol(lvl); }, [lvl]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="card pad stack-s">
    <div className="row between"><h2>Volume di oggi</h2><button type="button" className="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Chiudi" : "Check-in 30″"}</button></div>
    <div className="seg">{VOLS.map(v => <button key={v} type="button" aria-pressed={vol === v} onClick={() => onVol(v)}>{VL[v]}</button>)}</div>
    {open && <div className="stack-s">
      {cfg.qs.map(([q, opts], i) => <div key={q} className="q"><span className="qt">{q}</span>
        <div className="chips">{opts.map((o, j) => <button key={o} type="button" aria-pressed={ans[i] === j} onClick={() => { const a = [...ans]; a[i] = j; setAns(a); }}>{o}</button>)}</div></div>)}
      <p className="result">{done ? `${tot} punti → ${VL[lvl!]}` : "Rispondi a tutte le voci"}</p>
      <p className="small muted">Un dolore articolare o tendineo sopra 3/10 vince sul punteggio: Basso e togli l’esercizio che lo provoca.{program === "bjj" ? " Dal 15 gennaio niente Alto." : ""}</p>
    </div>}
  </div>;
}
function SessionPreview({ s, vol, onOpen }: { s: Session; vol: Vol; onOpen: (id: string) => void }) {
  return <div className="card">
    <div className="pad"><h2>{s.title}</h2><p className="small muted">{s.day} · {s.duration}</p></div>
    {s.warmup && <p className="warm"><b>Riscaldamento.</b> {s.warmup}</p>}
    {s.items.map((it, i) => <ItemRow key={i} it={it} vol={vol} onOpen={onOpen} />)}
    {s.notes && <p className="pad small muted">{s.notes}</p>}
  </div>;
}
function ItemRow({ it, vol, onOpen }: { it: Item; vol: Vol; onOpen: (id: string) => void }) {
  const ex = exercise(it.ex); const v = it.vol[vol]; const skip = setCount(v) === 0;
  return <button type="button" className="irow" onClick={() => onOpen(it.ex)}>
    <span className="code">{it.code}</span>
    <span><span className="iname">{ex.name}{FIGS[it.ex] ? " ▶" : ""}</span><span className="isub">{it.intensity}{it.tempo ? ` · tempo ${it.tempo}` : ""}{it.rest && it.rest !== "—" ? ` · rec. ${it.rest}` : ""}</span></span>
    <span className={"ivol" + (skip ? " skip" : "")}>{skip ? "salta" : v}</span>
  </button>;
}

/* ---------------- Seduta in corso ---------------- */
function Runner({ log, onChange, onOpen, onExit }: { log: SessionLog; onChange: (l: SessionLog) => void; onOpen: (id: string) => void; onExit: () => void }) {
  const rest = useRest();
  const ph = phase(log.phaseId);
  const s = [...ph.sessions, ...phase("bjj_domenica").sessions].find(x => x.id === log.sessionId)!;
  const upd = (l: SessionLog) => { store.saveSession(l); onChange(l); };
  const setItem = (i: number, it: ItemLog) => upd({ ...log, items: log.items.map((x, j) => j === i ? it : x) });
  const total = log.items.reduce((a, it) => a + it.sets.length, 0), done = log.items.reduce((a, it) => a + it.sets.filter(z => z.done).length, 0);
  return <section className="stack">
    <div className="row between"><div><span className="lab">Seduta in corso · {VL[log.vol]}</span><h1 className="h1s">{s.title}</h1></div>
      <span className="count">{done}/{total}</span></div>
    {s.warmup && <p className="card warm">{s.warmup}</p>}
    {s.items.map((it, i) => <RunItem key={i} it={it} vol={log.vol} log={log.items[i]} onChange={x => setItem(i, x)} onOpen={onOpen} onRest={() => rest(restSeconds(it.rest))} />)}
    <textarea className="note" placeholder="Note sulla seduta (sensazioni, dolori, cosa cambiare)" value={log.note ?? ""} onChange={e => upd({ ...log, note: e.target.value })} />
    <div className="row gap">
      <button type="button" className="primary big" onClick={() => { upd({ ...log, finished: true }); onExit(); }}>Termina e salva</button>
      <button type="button" className="ghost" onClick={() => { store.deleteSession(log.id); onChange(null as unknown as SessionLog); onExit(); }}>Annulla</button>
    </div>
  </section>;
}
function RunItem({ it, vol, log, onChange, onOpen, onRest }: { it: Item; vol: Vol; log: ItemLog; onChange: (l: ItemLog) => void; onOpen: (id: string) => void; onRest: () => void }) {
  const ex = exercise(it.ex); const last = useMemo(() => store.lastFor(it.ex), [it.ex]);
  const set = (i: number, k: "kg" | "reps" | "rpe", v: string) => onChange({ ...log, sets: log.sets.map((z, j) => j === i ? { ...z, [k]: v } : z) });
  return <div className={"card run" + (log.sets.length && log.sets.every(z => z.done) ? " ok" : "")}>
    <button type="button" className="irow" onClick={() => onOpen(it.ex)}>
      <span className="code">{it.code}</span>
      <span><span className="iname">{ex.name}{FIGS[it.ex] ? " ▶" : ""}</span><span className="isub">{it.vol[vol]} · {it.intensity}{it.tempo ? ` · ${it.tempo}` : ""}{it.rest && it.rest !== "—" ? ` · rec. ${it.rest}` : ""}</span></span>
      <span />
    </button>
    {it.note && <p className="inote">{it.note}</p>}
    {last && <p className="small muted pad-x">Ultima volta: {last.map(z => `${z.kg || "–"} kg × ${z.reps || "–"}`).join(" · ")}</p>}
    {log.sets.length === 0 ? <p className="small muted pad-x pad-b">Con questo volume l’esercizio si salta.</p> :
      <div className="sets">{log.sets.map((z, i) => <div key={i} className="setrow">
        <span className="sn">{i + 1}</span>
        <label>kg<input inputMode="decimal" value={z.kg} onChange={e => set(i, "kg", e.target.value)} /></label>
        <label>rip<input inputMode="numeric" value={z.reps} onChange={e => set(i, "reps", e.target.value)} /></label>
        <label>RPE<input inputMode="decimal" value={z.rpe} onChange={e => set(i, "rpe", e.target.value)} /></label>
        <button type="button" className="tick" aria-pressed={z.done} aria-label={`Serie ${i + 1} fatta`} onClick={() => { const d = !z.done; onChange({ ...log, sets: log.sets.map((y, j) => j === i ? { ...y, done: d } : y) }); if (d) onRest(); }}>✓</button>
      </div>)}</div>}
    <label className="pain"><input type="checkbox" checked={!!log.pain} onChange={e => onChange({ ...log, pain: e.target.checked })} /> Dolore sopra 3/10</label>
    {log.pain && <p className="warnbox">Fermati con questo esercizio: passa alla versione più facile indicata nella scheda o saltalo oggi. Se dura più di una settimana, fisioterapista.</p>}
  </div>;
}

/* ---------------- Piano ---------------- */
function PlanView({ onOpen }: { onOpen: (id: string) => void }) {
  const cid = currentPhaseId();
  const [prog, setProg] = useState<Phase["program"]>(phase(cid).program);
  const [pid, setPid] = useState(cid);
  const [vol, setVol] = useState<Vol>("medio");
  const list = PLAN.phases.filter(p => p.program === prog);
  const ph = PLAN.phases.find(p => p.id === pid && p.program === prog) ?? list[0];
  return <section className="stack">
    <div className="seg">{(["bjj", "transizione", "ironman"] as const).map(p => <button key={p} type="button" aria-pressed={prog === p} onClick={() => { setProg(p); setPid(PLAN.phases.find(x => x.program === p)!.id); }}>{PROG_LABEL[p]}</button>)}</div>
    <div className="hscroll">{list.map(p => <button key={p.id} type="button" className="pchip" aria-pressed={p.id === ph.id} onClick={() => setPid(p.id)}>{p.id === cid && <span className="now">Ora · </span>}<span>{p.name.replace(/^(BJJ|Ironman)\s*/, "")}</span><small>{p.dates.split("(")[0]}</small></button>)}</div>
    <div className="stack-s"><h1 className="h1s">{ph.name}</h1><p className="muted">{ph.dates}</p><p>{ph.goal}</p><p className="card pad small"><b>Settimana tipo.</b> {ph.weekly}</p></div>
    <div className="seg">{VOLS.map(v => <button key={v} type="button" aria-pressed={vol === v} onClick={() => setVol(v)}>{VL[v]}</button>)}</div>
    {ph.sessions.map(s => <SessionPreview key={s.id} s={s} vol={vol} onOpen={onOpen} />)}
    <details className="card pad"><summary>Regole del volume</summary><ul>{PLAN.volume_rules.map(r => <li key={r.id}>{r.text}</li>)}</ul></details>
    <details className="card pad"><summary>Alimentazione</summary>{PLAN.nutrition.map((n, i) => <p key={i}><b>{n.phase}.</b> {n.text}</p>)}</details>
    <details className="card pad"><summary>Segnali di allarme</summary>{PLAN.warnings.map((w, i) => <p key={i} className={"wl " + w.level}><b>{w.signal}</b><br />{w.action}</p>)}</details>
  </section>;
}

/* ---------------- Peso ---------------- */
function Weight() {
  const [ws, setWs] = useState(store.weights()); const [st, setSt] = useState<Settings>(store.settings()); const [kg, setKg] = useState("");
  const div = DIVISIONS[st.division];
  const last7 = ws.slice(-7); const avg = last7.length ? last7.reduce((a, w) => a + w.kg, 0) / last7.length : null;
  const margin = avg !== null ? div.limit - (avg + st.uniformKg) : null;
  const light = margin === null ? "" : margin >= 1 ? "verde" : margin >= 0 ? "giallo" : "rosso";
  return <section className="stack">
    <h1 className="h1s">Peso e categoria</h1>
    <div className="card pad stack-s">
      <label className="field">Categoria obiettivo<select value={st.division} onChange={e => { const s = { ...st, division: e.target.value as Settings["division"] }; setSt(s); store.saveSettings(s); }}>
        {Object.entries(DIVISIONS).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}</select></label>
      <label className="field">Peso del {div.uniform === "gi" ? "kimono" : "rashguard e pantaloncini"} (kg)<input inputMode="decimal" value={st.uniformKg} onChange={e => { const s = { ...st, uniformKg: parseFloat(e.target.value.replace(",", ".")) || 0 }; setSt(s); store.saveSettings(s); }} /></label>
      <p className="small muted">Limiti IBJJF, pesata con la divisa subito prima del primo incontro. Verifica sul regolamento della tua gara.</p>
    </div>
    <div className="card pad stack-s">
      <h2>Pesata di oggi</h2><p className="small muted">Al mattino, dopo il bagno, senza vestiti e prima di mangiare.</p>
      <div className="row gap"><input className="big-in" inputMode="decimal" placeholder="78,0" value={kg} onChange={e => setKg(e.target.value)} />
        <button type="button" className="primary" onClick={() => { const n = parseFloat(kg.replace(",", ".")); if (n > 30 && n < 200) { store.saveWeight({ date: isoToday(), kg: n }); setWs(store.weights()); setKg(""); } }}>Salva</button></div>
    </div>
    {avg !== null && <div className={"card pad light " + light}>
      <span className="lab">Media ultimi {last7.length} giorni</span>
      <p className="bignum">{avg.toFixed(1)} kg</p>
      <p>Con la divisa: <b>{(avg + st.uniformKg).toFixed(1)} kg</b> · limite {div.limit.toFixed(1)} kg · margine <b>{margin!.toFixed(1)} kg</b></p>
      <p className="small">{light === "verde" ? "Sei dentro con margine: mangia per allenarti." : light === "giallo" ? "Dentro ma al limite: niente extra, porzioni un po’ più piccole nei giorni di riposo." : "Fuori categoria con la media attuale. Niente tagli d’acqua: valuta la categoria sopra."}</p>
    </div>}
    {ws.length > 0 && <div className="card pad"><h2>Ultime pesate</h2><ul className="plain">{ws.slice(-14).reverse().map(w => <li key={w.date}><span>{w.date}</span><b>{w.kg.toFixed(1)} kg</b></li>)}</ul></div>}
  </section>;
}

/* ---------------- Storico ---------------- */
function History() {
  const [all, setAll] = useState(store.sessions().filter(s => s.finished).reverse());
  if (!all.length) return <p className="muted pad">Ancora nessuna seduta salvata.</p>;
  return <section className="stack">
    <h1 className="h1s">Storico</h1>
    {all.map(l => { const ph = phase(l.phaseId); const s = [...ph.sessions, ...phase("bjj_domenica").sessions].find(x => x.id === l.sessionId);
      return <details key={l.id} className="card pad"><summary><b>{l.date}</b> · {s?.title ?? l.sessionId} · {VL[l.vol]}</summary>
        {l.items.filter(it => it.sets.some(z => z.done)).map((it, i) => <p key={i} className="small"><b>{exercise(it.ex).name}:</b> {it.sets.filter(z => z.done).map(z => `${z.kg || "–"}×${z.reps || "–"}${z.rpe ? ` @${z.rpe}` : ""}`).join(" · ")}{it.pain ? " · dolore" : ""}</p>)}
        {l.note && <p className="small muted">{l.note}</p>}
        <button type="button" className="ghost" onClick={() => { store.deleteSession(l.id); setAll(store.sessions().filter(s => s.finished).reverse()); }}>Elimina</button>
      </details>; })}
  </section>;
}

/* ---------------- Altro: account, sincronizzazione, backup ---------------- */
function useSync() {
  const [, set] = useState(0);
  useEffect(() => { const on = () => set(x => x + 1); window.addEventListener("jdi:sync", on); return () => window.removeEventListener("jdi:sync", on); }, []);
  return syncState;
}
const SYNC_LABEL = { anon: "Non collegato: i dati restano solo su questo telefono", syncing: "Sincronizzo…", ok: "Dati salvati online", offline: "Senza rete: salvo sul telefono e invio appena torna", error: "Errore di sincronizzazione" };
function More() {
  const st = useSync(); const [email, setEmail] = useState(""); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const exportFile = () => {
    const blob = new Blob([store.exportAll()], { type: "application/json" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `justdoit-backup-${isoToday()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const importFile = async (f: File | undefined) => { if (!f) return; try { setMsg(store.importAll(await f.text())); } catch (e) { setMsg(e instanceof Error ? e.message : "File non valido."); } };
  return <section className="stack">
    <h1 className="h1s">Account e dati</h1>
    <div className={"card pad stack-s sync " + st.status}>
      <span className="lab">Sincronizzazione</span>
      <p><b>{SYNC_LABEL[st.status]}</b>{st.status === "ok" && st.last ? ` · ultima alle ${st.last}` : ""}</p>
      {st.pending > 0 && st.status !== "anon" && <p className="small muted">{st.pending} modifiche in attesa di invio.</p>}
      {st.status === "error" && st.error && <p className="small warnbox">{st.error}</p>}
      {st.email ? <>
        <p className="small muted">Collegato come {st.email}</p>
        <div className="row gap"><button type="button" className="primary" onClick={() => void sync()}>Sincronizza ora</button>
          <button type="button" className="ghost" onClick={() => void signOut()}>Esci</button></div>
      </> : <form className="stack-s" onSubmit={async e => { e.preventDefault(); setBusy(true); setMsg(null);
          try { await signIn(email.trim()); setMsg(`Ti ho mandato un link a ${email.trim()}. Aprilo da questo telefono: l'app si collega da sola.`); }
          catch (err) { setMsg(err instanceof Error ? err.message : "Invio non riuscito."); } finally { setBusy(false); } }}>
        <label className="field" htmlFor="em">La tua email<input id="em" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@esempio.it" /></label>
        <button type="submit" className="primary" disabled={busy}>{busy ? "Invio…" : "Mandami il link di accesso"}</button>
        <p className="small muted">Niente password: ricevi un link via email una volta sola, poi resti collegato.</p>
      </form>}
      {msg && <p className="small">{msg}</p>}
    </div>
    <div className="card pad stack-s">
      <h2>Backup</h2>
      <p className="small muted">Un file con tutte le sedute, le pesate e le impostazioni. Utile come copia di sicurezza in più.</p>
      <div className="row gap"><button type="button" className="ghost" onClick={exportFile}>Scarica backup</button>
        <label className="ghost filebtn">Importa backup<input type="file" accept="application/json,.json" onChange={e => void importFile(e.target.files?.[0])} /></label></div>
    </div>
  </section>;
}

/* ---------------- Scheda esercizio ---------------- */
function ExerciseSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const ex = exercise(id); const fi = FIGS[id]; const [sp, setSp] = useState(1);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return <div className="sheet-bg" onClick={onClose}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label={ex.name} onClick={e => e.stopPropagation()}>
      <div className="row between"><h2>{ex.name}</h2><button type="button" className="ghost" onClick={onClose} aria-label="Chiudi">✕</button></div>
      {fi ? <>
        <div className="stage"><Figure info={fi} speed={sp} />
          <div className="speed">{[0.5, 1, 0].map(v => <button key={v} type="button" aria-pressed={sp === v} onClick={() => setSp(v)}>{v === 0 ? "Pausa" : `${String(v).replace(".", ",")}×`}</button>)}</div></div>
        <div className="row gap wrap-row">{fi.p.map(m => <span key={m} className="tag p">{m}</span>)}{fi.s.map(m => <span key={m} className="tag s">{m}</span>)}</div>
        <MuscleMap p={fi.p} s={fi.s} />
      </> : <p className="small muted">Animazione in arrivo per questo esercizio.</p>}
      {ex.how.length > 0 && <ol>{ex.how.map((h, i) => <li key={i}>{h}</li>)}</ol>}
      {ex.why && <p><b>Perché:</b> {ex.why}</p>}
      {ex.mistake && <p className="muted"><b>Errore tipico:</b> {ex.mistake}</p>}
    </div>
  </div>;
}
