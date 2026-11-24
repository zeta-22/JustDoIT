import { useEffect, useMemo, useState } from "react";
import { PLAN, RACE_DEFAULT, SCORE, START, addDays, currentPhaseId, daysBetween, exercise, isoToday, noAltoFrom, phase, phaseDates, planB, restSeconds, setCount, type Item, type Phase, type Session, type Vol } from "./lib/plan";
import { DIVISIONS, setPassword, signIn, signInPassword, signOut, store, sync, syncState, type ItemLog, type SessionLog, type Settings } from "./lib/store";
import { FIGS } from "./data/figures";
import { LIB } from "./data/library";
import { suggest, targetRpe } from "./lib/progress";
import Figure from "./components/Figure";
import MuscleMap from "./components/MuscleMap";
import { TimerProvider, useRest } from "./components/Timer";

type Tab = "oggi" | "piano" | "peso" | "storico" | "altro";
const VOLS: Vol[] = ["basso", "medio", "alto"];
const VL: Record<Vol, string> = { basso: "Basso", medio: "Medio", alto: "Alto" };
const PROG_LABEL = { bjj: "Gara BJJ", transizione: "Transizione", ironman: "Ironman" };
const raceDate = () => store.settings().raceDate || RACE_DEFAULT;
const fmtDate = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

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
            {tab === "oggi" && <Today onStart={l => { store.saveSession(l); setRunning(l); }} onOpen={setSheet} onAccount={() => setTab("altro")} />}
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
function Today({ onStart, onOpen, onAccount }: { onStart: (l: SessionLog) => void; onOpen: (id: string) => void; onAccount: () => void }) {
  const sy = useSync();
  const race = raceDate(); const today = isoToday();
  const pid = currentPhaseId(today, race); const ph = phase(pid);
  const before = today < START.bjj1_accumulo;
  const noAlto = ph.program === "bjj" && today >= noAltoFrom(race);
  const toRace = daysBetween(today, race); const pb = planB(race);
  const [sid, setSid] = useState(ph.sessions[0].id);
  const [vol, setVol] = useState<Vol>("medio");
  const s = ph.sessions.find(x => x.id === sid) ?? ph.sessions[0];
  const sundays = ph.program === "bjj" ? phase("bjj_domenica") : null;
  const all = sundays ? [...ph.sessions, ...sundays.sessions] : ph.sessions;
  const sess = all.find(x => x.id === sid) ?? s;
  return <section className="stack">
    {(sy.status === "anon" || sy.status === "error") && <button type="button" className={"card pad syncbanner " + sy.status} onClick={onAccount}>
      <b>{sy.status === "anon" ? "Collegati per salvare online" : "Errore di sincronizzazione"}</b>
      <span className="small">{sy.status === "anon" ? "Ora i dati restano solo su questo telefono. Tocca qui per accedere con la tua email." : "I dati sono al sicuro sul telefono. Tocca qui per vedere cosa succede."}</span>
    </button>}
    <div className="hero-card" style={{ ["--pc" as string]: `var(--${ph.program})` }}>
      <span className="lab">{before ? "Si parte lunedì 23 novembre" : "Fase attuale"} · {PROG_LABEL[ph.program]}</span>
      <h1>{ph.name}</h1>
      <p className="muted">{phaseDates(pid, race)}</p>
      <p>{ph.goal}</p>
    </div>
    {toRace >= 0 && toRace <= 14 && <RaceWeek race={race} days={toRace} />}
    {pb && toRace >= 0 && <p className="card pad small"><b>Piano B per la tua data.</b> {pb}</p>}
    <div className="card pad">
      <h2>Settimana tipo</h2><p className="small">{ph.weekly}</p>
    </div>
    <div className="stack-s">
      <h2>Che seduta fai?</h2>
      <div className="chips">{all.map(x => <button key={x.id} type="button" aria-pressed={x.id === sess.id} onClick={() => setSid(x.id)}>{x.day.length > 24 || x.day === "Domenica" ? x.title.split("—")[0].trim().replace(/^Opzione/, "Dom · opz.") : x.day}</button>)}</div>
    </div>
    <CheckIn program={ph.program === "bjj" ? "bjj" : "ironman"} vol={vol} onVol={v => setVol(noAlto && v === "alto" ? "medio" : v)} noAlto={noAlto} race={race} />
    <SessionPreview s={sess} vol={vol} onOpen={onOpen} />
    <button type="button" className="primary big" onClick={() => onStart(newLog(pid, sess, vol))}>Inizia la seduta · volume {VL[vol]}</button>
  </section>;
}
function newLog(phaseId: string, s: Session, vol: Vol): SessionLog {
  return { id: `${Date.now()}`, date: isoToday(), phaseId, sessionId: s.id, vol, finished: false,
    items: s.items.map(it => { const n = setCount(it.vol[vol]); const last = store.lastFor(it.ex); const adv = suggest(it.ex, it.vol[vol], it.intensity, last);
      const kg = adv ? String(adv.kg).replace(".", ",") : last?.[0]?.kg ?? "";
      return { code: it.code, ex: it.ex, sets: Array.from({ length: n }, () => ({ kg, reps: "", rpe: "", done: false })) }; }) };
}
function CheckIn({ program, vol, onVol, noAlto, race }: { program: "bjj" | "ironman"; vol: Vol; onVol: (v: Vol) => void; noAlto: boolean; race: string }) {
  const cfg = SCORE[program]; const [ans, setAns] = useState<(number | undefined)[]>([]); const [open, setOpen] = useState(false);
  const done = cfg.qs.every((_, i) => ans[i] !== undefined); const tot = ans.reduce<number>((a, b) => a + (b ?? 0), 0);
  const lvl = done ? cfg.range.find(r => tot >= r[0] && tot <= r[1])![2] : null;
  useEffect(() => { if (lvl) onVol(lvl); }, [lvl]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="card pad stack-s">
    <div className="row between"><h2>Volume di oggi</h2><button type="button" className="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Chiudi" : "Check-in 30″"}</button></div>
    <div className="seg">{VOLS.map(v => <button key={v} type="button" aria-pressed={vol === v} disabled={noAlto && v === "alto"} onClick={() => onVol(v)}>{VL[v]}</button>)}</div>
    {noAlto && <p className="small muted">Sei a meno di 8 giorni dalla gara: niente volume Alto.</p>}
    {open && <div className="stack-s">
      {cfg.qs.map(([q, opts], i) => <div key={q} className="q"><span className="qt">{q}</span>
        <div className="chips">{opts.map((o, j) => <button key={o} type="button" aria-pressed={ans[i] === j} onClick={() => { const a = [...ans]; a[i] = j; setAns(a); }}>{o}</button>)}</div></div>)}
      <p className="result">{done ? `${tot} punti → ${VL[lvl!]}` : "Rispondi a tutte le voci"}</p>
      <p className="small muted">Un dolore articolare o tendineo sopra 3/10 vince sul punteggio: Basso e togli l’esercizio che lo provoca.{program === "bjj" ? ` Dal ${fmtDate(noAltoFrom(race))} niente Alto.` : ""}</p>
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
  /** Dolore > 3/10: fermo l'esercizio che fa male e porto a Basso tutto quello che non è ancora iniziato. */
  const toBasso = (i: number) => upd({ ...log, vol: "basso", items: log.items.map((x, j) => {
    if (j === i) return { ...x, pain: true, sets: x.sets.filter(z => z.done) };
    if (x.sets.some(z => z.done)) return x;
    const n = setCount(s.items[j].vol.basso); return { ...x, sets: x.sets.slice(0, n) };
  }) });
  const total = log.items.reduce((a, it) => a + it.sets.length, 0), done = log.items.reduce((a, it) => a + it.sets.filter(z => z.done).length, 0);
  return <section className="stack">
    <div className="row between"><div><span className="lab">Seduta in corso · {VL[log.vol]}</span><h1 className="h1s">{s.title}</h1></div>
      <span className="count">{done}/{total}</span></div>
    {s.warmup && <p className="card warm">{s.warmup}</p>}
    {s.items.map((it, i) => <RunItem key={i} it={it} vol={log.vol} log={log.items[i]} onChange={x => setItem(i, x)} onOpen={onOpen} onRest={() => rest(restSeconds(it.rest))} onBasso={() => toBasso(i)} />)}
    <textarea className="note" placeholder="Note sulla seduta (sensazioni, dolori, cosa cambiare)" value={log.note ?? ""} onChange={e => upd({ ...log, note: e.target.value })} />
    <div className="row gap">
      <button type="button" className="primary big" onClick={() => { upd({ ...log, finished: true }); onExit(); }}>Termina e salva</button>
      <button type="button" className="ghost" onClick={() => { store.deleteSession(log.id); onChange(null as unknown as SessionLog); onExit(); }}>Annulla</button>
    </div>
  </section>;
}
function RunItem({ it, vol, log, onChange, onOpen, onRest, onBasso }: { it: Item; vol: Vol; log: ItemLog; onChange: (l: ItemLog) => void; onOpen: (id: string) => void; onRest: () => void; onBasso: () => void }) {
  const ex = exercise(it.ex); const last = useMemo(() => store.lastFor(it.ex), [it.ex]);
  const adv = useMemo(() => suggest(it.ex, it.vol[vol], it.intensity, last), [it, vol, last]);
  const lib = LIB[it.ex]; const trpe = targetRpe(it.intensity);
  const set = (i: number, k: "kg" | "reps" | "rpe", v: string) => onChange({ ...log, sets: log.sets.map((z, j) => j === i ? { ...z, [k]: v } : z) });
  return <div className={"card run" + (log.sets.length && log.sets.every(z => z.done) ? " ok" : "")}>
    <button type="button" className="irow" onClick={() => onOpen(it.ex)}>
      <span className="code">{it.code}</span>
      <span><span className="iname">{ex.name}{FIGS[it.ex] ? " ▶" : ""}</span><span className="isub">{it.vol[vol]} · {it.intensity}{it.tempo ? ` · ${it.tempo}` : ""}{it.rest && it.rest !== "—" ? ` · rec. ${it.rest}` : ""}</span></span>
      <span />
    </button>
    {it.note && <p className="inote">{it.note}</p>}
    {last && <p className="small muted pad-x">Ultima volta: {last.map(z => `${z.kg || "–"} kg × ${z.reps || "–"}${z.rpe ? ` @${z.rpe}` : ""}`).join(" · ")}</p>}
    {adv && <p className="advice pad-x"><b>Consiglio: {String(adv.kg).replace(".", ",")} kg{adv.reps ? ` × ${adv.reps}` : ""}.</b> {adv.why}</p>}
    {!last && log.sets.length > 0 && lib?.kind !== "cond" && trpe !== null && <p className="advice pad-x"><b>Prima volta: trova il carico.</b> Fai 2–3 serie di avvicinamento salendo di peso finché la serie ti sembra RPE {trpe} (ne restano {Math.max(0, 10 - trpe)}): quello è il carico di partenza. Segna kg, ripetizioni e RPE: dalla prossima volta il carico te lo consiglio io.</p>}
    {log.sets.length === 0 ? <p className="small muted pad-x pad-b">Con questo volume l’esercizio si salta.</p> :
      <div className="sets">{log.sets.map((z, i) => <div key={i} className="setrow">
        <span className="sn">{i + 1}</span>
        <label>kg<input inputMode="decimal" value={z.kg} onChange={e => set(i, "kg", e.target.value)} /></label>
        <label>rip<input inputMode="numeric" value={z.reps} onChange={e => set(i, "reps", e.target.value)} /></label>
        <label>RPE<input inputMode="decimal" value={z.rpe} onChange={e => set(i, "rpe", e.target.value)} /></label>
        <button type="button" className="tick" aria-pressed={z.done} aria-label={`Serie ${i + 1} fatta`} onClick={() => { const d = !z.done; onChange({ ...log, sets: log.sets.map((y, j) => j === i ? { ...y, done: d } : y) }); if (d) onRest(); }}>✓</button>
      </div>)}</div>}
    <label className="pain"><input type="checkbox" checked={!!log.pain} onChange={e => onChange({ ...log, pain: e.target.checked })} /> Dolore sopra 3/10</label>
    {log.pain && <div className="warnbox stack-s">
      <p><b>Fermati con questo esercizio.</b> Il dolore sopra 3/10 vince su tutto: oggi volume Basso.</p>
      {lib?.reg && <p><b>Versione più facile, se non fa male:</b> {lib.reg}</p>}
      {(vol !== "basso" || log.sets.some(z => !z.done)) && <button type="button" className="primary" onClick={onBasso}>Ferma l'esercizio e passa a Basso</button>}
      <p className="small">Se il dolore dura più di una settimana, fisioterapista.</p>
    </div>}
  </div>;
}

/* ---------------- Settimana gara ---------------- */
function RaceWeek({ race, days }: { race: string; days: number }) {
  const st = store.settings(); const div = DIVISIONS[st.division];
  const ws = store.weights().slice(-7); const avg = ws.length ? ws.reduce((a, w) => a + w.kg, 0) / ws.length : null;
  const margin = avg !== null ? div.limit - (avg + st.uniformKg) : null;
  const food = PLAN.nutrition.find(n => /settimana gara/i.test(n.phase));
  const items: [string, boolean][] = [
    [`Ultima seduta pesante entro ${fmtDate(addDays(race, -8))}; da lì niente volume Alto e niente esercizi nuovi.`, isoToday() > addDays(race, -8)],
    [`Prove generali del peso con la divisa: ${fmtDate(addDays(race, -10))} e ${fmtDate(addDays(race, -6))}, dopo la colazione tipo.`, isoToday() > addDays(race, -6)],
    ["Pesa il gi e la divisa no-gi che userai in gara e scrivi il peso in Peso.", false],
    ["Iscrizione: la categoria non si cambia il giorno della gara. Niente tagli d'acqua.", false],
    ["Due giorni prima: carboidrati 5–7 g/kg, la sera prima poche fibre, niente cibi nuovi.", isoToday() >= addDays(race, -2)],
  ];
  return <div className="card pad stack-s race">
    <span className="lab">Settimana gara · {fmtDate(race)}</span>
    <h2>{days === 0 ? "Oggi è il giorno della gara" : days === 1 ? "Gara domani" : `Gara tra ${days} giorni`}</h2>
    {avg !== null && <p className="small">Peso: media {avg.toFixed(1)} kg + divisa {st.uniformKg} kg = <b>{(avg + st.uniformKg).toFixed(1)} kg</b> · limite {div.limit} kg · margine <b>{margin!.toFixed(1)} kg</b> ({div.label.split("(")[0].trim()})</p>}
    <ul className="check">{items.map(([t, done], i) => <li key={i} className={done ? "done" : ""}>{t}</li>)}</ul>
    {food && <p className="small muted"><b>Alimentazione.</b> {food.text}</p>}
  </div>;
}

/* ---------------- Piano ---------------- */
function PlanView({ onOpen }: { onOpen: (id: string) => void }) {
  const race = raceDate(); const cid = currentPhaseId(isoToday(), race);
  const [prog, setProg] = useState<Phase["program"]>(phase(cid).program);
  const [pid, setPid] = useState(cid);
  const [vol, setVol] = useState<Vol>("medio");
  const list = PLAN.phases.filter(p => p.program === prog);
  const ph = PLAN.phases.find(p => p.id === pid && p.program === prog) ?? list[0];
  return <section className="stack">
    <div className="seg">{(["bjj", "transizione", "ironman"] as const).map(p => <button key={p} type="button" aria-pressed={prog === p} onClick={() => { setProg(p); setPid(PLAN.phases.find(x => x.program === p)!.id); }}>{PROG_LABEL[p]}</button>)}</div>
    <div className="hscroll">{list.map(p => <button key={p.id} type="button" className="pchip" aria-pressed={p.id === ph.id} onClick={() => setPid(p.id)}>{p.id === cid && <span className="now">Ora · </span>}<span>{p.name.replace(/^(BJJ|Ironman)\s*/, "")}</span><small>{phaseDates(p.id, race).split("(")[0]}</small></button>)}</div>
    <div className="stack-s"><h1 className="h1s">{ph.name}</h1><p className="muted">{phaseDates(ph.id, race)}</p><p>{ph.goal}</p><p className="card pad small"><b>Settimana tipo.</b> {ph.weekly}</p></div>
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
const SYNC_LABEL = { init: "Controllo l'accesso…", anon: "Non collegato: i dati restano solo su questo telefono", syncing: "Sincronizzo…", ok: "Dati salvati online", offline: "Senza rete: salvo sul telefono e invio appena torna", error: "Errore di sincronizzazione" };
function More() {
  const st = useSync(); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [newPw, setNewPw] = useState(""); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
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
        <form className="stack-s" onSubmit={async e => { e.preventDefault(); setBusy(true); setMsg(null);
            try { await setPassword(newPw); setNewPw(""); setMsg("Password salvata: d'ora in poi puoi accedere con email e password."); }
            catch (err) { setMsg(err instanceof Error ? err.message : "Non riuscito."); } finally { setBusy(false); } }}>
          <label className="field" htmlFor="npw">Imposta o cambia la password<input id="npw" type="password" minLength={8} required autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="almeno 8 caratteri" /></label>
          <button type="submit" className="ghost" disabled={busy}>Salva password</button>
        </form>
      </> : <form className="stack-s" onSubmit={async e => { e.preventDefault(); setBusy(true); setMsg(null);
          try { await signInPassword(email.trim(), pw); setMsg(null); }
          catch (err) { setMsg(err instanceof Error ? err.message : "Accesso non riuscito."); } finally { setBusy(false); } }}>
        <label className="field" htmlFor="em">La tua email<input id="em" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@esempio.it" /></label>
        <label className="field" htmlFor="pw">Password<input id="pw" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="la tua password" /></label>
        <button type="submit" className="primary" disabled={busy || !pw}>{busy ? "Accesso…" : "Accedi"}</button>
        <button type="button" className="ghost" disabled={busy || !email} onClick={async () => { setBusy(true); setMsg(null);
          try { await signIn(email.trim()); setMsg(`Ti ho mandato un link a ${email.trim()}. Aprilo da questo telefono, in Chrome.`); }
          catch (err) { setMsg(err instanceof Error ? err.message : "Invio non riuscito."); } finally { setBusy(false); } }}>Senza password: mandami un link via email</button>
        <p className="small muted">Accedi una volta sola: poi resti collegato anche chiudendo l'app.</p>
      </form>}
      {msg && <p className="small">{msg}</p>}
    </div>
    <RaceSetting />
    <div className="card pad stack-s">
      <h2>Backup</h2>
      <p className="small muted">Un file con tutte le sedute, le pesate e le impostazioni. Utile come copia di sicurezza in più.</p>
      <div className="row gap"><button type="button" className="ghost" onClick={exportFile}>Scarica backup</button>
        <label className="ghost filebtn">Importa backup<input type="file" accept="application/json,.json" onChange={e => void importFile(e.target.files?.[0])} /></label></div>
    </div>
  </section>;
}

function RaceSetting() {
  const [st, setSt] = useState<Settings>(store.settings()); const race = st.raceDate || RACE_DEFAULT; const pb = planB(race);
  return <div className="card pad stack-s">
    <h2>Data della gara</h2>
    <label className="field" htmlFor="race">Giorno della gara BJJ<input id="race" type="date" value={race} min="2026-12-01" max="2027-06-30"
      onChange={e => { if (!e.target.value) return; const s = { ...st, raceDate: e.target.value }; setSt(s); store.saveSettings(s); }} /></label>
    <p className="small muted">Se cambia, si spostano la settimana gara, la transizione e tutto l'Ironman (la prima settimana Ironman è sempre quella dopo la gara). Niente volume Alto da {fmtDate(noAltoFrom(race))}.</p>
    {race !== RACE_DEFAULT && <button type="button" className="ghost" onClick={() => { const s = { ...st, raceDate: RACE_DEFAULT }; setSt(s); store.saveSettings(s); }}>Torna al 23 gennaio</button>}
    {pb && <p className="small warnbox">{pb}</p>}
  </div>;
}

/* ---------------- Scheda esercizio ---------------- */
function ExerciseSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const ex = exercise(id); const fi = FIGS[id]; const lib = LIB[id]; const [sp, setSp] = useState(1);
  const mus = fi ?? (lib && lib.p.length ? lib : null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return <div className="sheet-bg" onClick={onClose}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label={ex.name} onClick={e => e.stopPropagation()}>
      <div className="row between"><h2>{ex.name}</h2><button type="button" className="ghost" onClick={onClose} aria-label="Chiudi">✕</button></div>
      {fi ? <>
        <div className="stage"><Figure info={fi} speed={sp} />
          <div className="speed">{[0.5, 1, 0].map(v => <button key={v} type="button" aria-pressed={sp === v} onClick={() => setSp(v)}>{v === 0 ? "Pausa" : `${String(v).replace(".", ",")}×`}</button>)}</div></div>
      </> : <p className="small muted">{lib?.kind === "cond" ? "Lavoro di condizionamento: coinvolge tutto il corpo." : "Animazione in arrivo per questo esercizio."}</p>}
      {mus && <>
        <div className="row gap wrap-row">{mus.p.map(m => <span key={m} className="tag p">{m}</span>)}{mus.s.map(m => <span key={m} className="tag s">{m}</span>)}</div>
        <MuscleMap p={mus.p} s={mus.s} />
      </>}
      {ex.how.length > 0 && <ol>{ex.how.map((h, i) => <li key={i}>{h}</li>)}</ol>}
      {ex.why && <p><b>Perché:</b> {ex.why}</p>}
      {ex.mistake && <p className="muted"><b>Errore tipico:</b> {ex.mistake}</p>}
      {lib?.reg && <p className="regbox"><b>Versione più facile</b> (se fa male o sei stanco): {lib.reg}</p>}
    </div>
  </div>;
}
