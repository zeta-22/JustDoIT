import { useEffect, useState } from "react";
import { PLAN, SCORE, addDays, currentPhaseId, daysBetween, isoToday, noAltoFrom, phase, phaseDates, planB, planWeek, setCount, volFor, type Session, type Vol } from "../lib/plan";
import { DIVISIONS, store, type SessionLog } from "../lib/store";
import { durationFor, mondayOf, phaseProgress, sessionsFor, weekLabels, weekday } from "../lib/today";
import { newLog } from "../lib/session";
import { useSync } from "../lib/useSync";
import { cap, dayLong, dec, parseNum } from "../lib/format";
import SessionPreview from "../components/SessionPreview";
import Thumb, { hasThumb } from "../components/Thumb";
import Icon from "../components/Icon";
import Belt from "../components/Belt";
import { VL, VOLS, raceDate } from "../lib/labels";


/** running: seduta già aperta (ridotta): al posto di "Inizia" c'è "Riprendi", così non se ne apre una seconda. */
export default function Today({ onStart, onOpen, onAccount, onEndurance, running, onResume }: { onStart: (l: SessionLog) => void; onOpen: (id: string) => void; onAccount: () => void; onEndurance: () => void; running: SessionLog | null; onResume: () => void }) {
  const sy = useSync();
  const race = raceDate(); const today = isoToday();
  const pid = currentPhaseId(today, race); const ph = phase(pid);
  const program = ph.program === "bjj" ? "bjj" : "ironman";
  const noAlto = ph.program === "bjj" && today >= noAltoFrom(race);
  const toRace = daysBetween(today, race); const pb = planB(race);
  const week = planWeek(pid, today, race);
  const [ck, setCk] = useState(() => store.checkin(today));
  const [vol, setVolRaw] = useState<Vol>(ck?.vol ?? "medio");
  const setVol = (v: Vol) => setVolRaw(noAlto && v === "alto" ? "medio" : v);
  const todays = sessionsFor(ph, today);
  const all = ph.program === "bjj" ? [...ph.sessions, ...phase("bjj_domenica").sessions] : ph.sessions;
  const [sid, setSid] = useState<string | null>(todays[0]?.id ?? null);
  const [pick, setPick] = useState(false); const [list, setList] = useState(false);
  const sess = sid ? all.find(x => x.id === sid) ?? null : null;
  const labels = weekLabels(ph);

  return <section className="stack">
    <header className="top">
      <div><span className="over">{cap(dayLong(today))}</span><h1>Oggi</h1></div>
      <button type="button" className="iconbtn sync-ic" onClick={onAccount} aria-label={sy.status === "ok" ? "Dati salvati online" : "Stato dei dati"}>
        <Icon n={sy.status === "ok" ? "cloud" : sy.status === "syncing" || sy.status === "init" ? "sync" : sy.status === "error" ? "alert" : "cloudOff"} className={"s-" + sy.status} /></button>
    </header>
    {(sy.status === "anon" || sy.status === "error") && <button type="button" className={"notice " + sy.status} onClick={onAccount}>
      <Icon n={sy.status === "error" ? "alert" : "cloudOff"} size={20} />
      <span><b>{sy.status === "anon" ? "Dati solo su questo telefono" : "Errore di sincronizzazione"}</b>
        <span className="small">{sy.status === "anon" ? "Accedi per salvarli anche online." : "I dati sono al sicuro sul telefono. Tocca per vedere."}</span></span>
      <Icon n="right" size={18} /></button>}

    <PhaseCard pid={pid} race={race} today={today} toRace={toRace} />
    {toRace >= 0 && toRace <= 14 && <RaceWeek race={race} days={toRace} />}
    {pb && toRace >= 0 && <p className="card pad small"><b>Piano B per la tua data.</b> {pb}</p>}

    <WeekStrip today={today} labels={labels} />

    <MorningCheck program={program} noAlto={noAlto} race={race} ck={ck} onDone={c => { setCk(c); if (c) setVol(c.vol); }} />

    {sess ? <div className="card hero">
      <div className="row between"><span className="over">{todays.some(x => x.id === sess.id) ? "Seduta di oggi" : "Seduta scelta"}</span>
        <button type="button" className="link" onClick={() => setPick(!pick)}>{pick ? "Chiudi" : "Cambia"}</button></div>
      {pick && <SessionChips all={all} sid={sess.id} onPick={id => { setSid(id); setPick(false); }} />}
      <div><h2 className="hero-t">{shortTitle(sess)}</h2><p className="small muted">{restTitle(sess)}</p></div>
      <SessionMeta s={sess} vol={vol} week={week} />
      <div className="thumbs">{sess.items.filter(it => hasThumb(it.ex)).slice(0, 4).map(it => <button key={it.code} type="button" onClick={() => onOpen(it.ex)} aria-label={it.ex}><Thumb ex={it.ex} /></button>)}
        {sess.items.length > 4 && <span className="more">+{sess.items.length - Math.min(4, sess.items.filter(it => hasThumb(it.ex)).length)}</span>}</div>
      <div className="seg" role="group" aria-label="Volume">{VOLS.map(v => <button key={v} type="button" aria-pressed={vol === v} disabled={noAlto && v === "alto"} onClick={() => setVol(v)}>{VL[v]}</button>)}</div>
      {noAlto && <p className="small muted">Meno di 8 giorni alla gara: niente volume Alto.</p>}
      {running ? <button type="button" className="primary big" onClick={onResume}><Icon n="play" size={18} />Riprendi la seduta in corso</button>
        : <button type="button" className="primary big" onClick={() => onStart(newLog(pid, sess, vol, race))}><Icon n="play" size={18} />Inizia la seduta</button>}
      <button type="button" className="link center" onClick={() => setList(!list)} aria-expanded={list}>{list ? "Nascondi gli esercizi" : `Vedi i ${sess.items.length} esercizi`}</button>
    </div> : <div className="card hero">
      <span className="over">{cap(dayLong(today).split(" ")[0])}</span>
      <h2 className="hero-t">{restDayTitle(labels[weekday(today)])}</h2>
      <p className="small muted">{restDayText(labels[weekday(today)])}</p>
      <span className="over">Vuoi fare comunque una seduta?</span>
      <SessionChips all={all} sid={null} onPick={setSid} />
    </div>}
    {sess && list && <SessionPreview s={sess} vol={vol} week={week} onOpen={onOpen} head={false} />}

    <div className="quick">
      <button type="button" className="chipbtn" onClick={onEndurance}><Icon n="wave" size={18} className="c-ironman" />Nuoto, bici, corsa</button>
    </div>
  </section>;
}

const shortTitle = (s: Session) => s.title.split("—")[0].trim();
const restTitle = (s: Session) => s.title.includes("—") ? cap(s.title.split("—").slice(1).join("—").trim()) : s.day;
const restDayTitle = (l: string | null) => !l ? "Niente palestra" : /riposo/i.test(l) ? "Riposo" : /gi|tatami|sparring/i.test(l) ? `Tatami: ${l}` : cap(l);
const restDayText = (l: string | null) => !l ? "Il piano non ha una seduta di palestra per oggi." : /riposo/i.test(l) ? "Oggi si recupera: sonno, cibo e una camminata se ti va." : "Oggi il piano non prevede palestra.";

function SessionChips({ all, sid, onPick }: { all: Session[]; sid: string | null; onPick: (id: string) => void }) {
  return <div className="chips">{all.map(x => <button key={x.id} type="button" aria-pressed={x.id === sid} onClick={() => onPick(x.id)}>
    {x.day.length > 24 || x.day === "Domenica" ? x.title.split("—")[0].trim().replace(/^Opzione/, "Dom · opz.") : `${x.day.split(" ")[0]} · ${shortTitle(x)}`}</button>)}</div>;
}
function SessionMeta({ s, vol, week }: { s: Session; vol: Vol; week: number | null }) {
  const n = s.items.filter(it => setCount(volFor(it, vol, week)) > 0).length;
  const sets = s.items.reduce((a, it) => a + setCount(volFor(it, vol, week)), 0); const d = durationFor(s, vol);
  return <p className="meta num">{[d, `${n} esercizi`, `${sets} serie`].filter(Boolean).join(" · ")}</p>;
}

/* ---------- fase, conto alla rovescia, cintura ---------- */
function PhaseCard({ pid, race, today, toRace }: { pid: string; race: string; today: string; toRace: number }) {
  const ph = phase(pid); const pr = phaseProgress(pid, today, race); const div = DIVISIONS[store.settings().division];
  const [open, setOpen] = useState(false);
  const bjj = ph.program === "bjj" && toRace >= 0;
  return <div className="card pad stack-s phase" style={{ ["--pc" as string]: `var(--${ph.program})` }}>
    {bjj && <div className="row between"><div className="row base gap-s"><span className="bignum">{toRace}</span><span className="small muted">{toRace === 1 ? "giorno" : "giorni"} alla gara</span></div>
      <span className="pill">{div.label.split("(")[0].trim()}</span></div>}
    {pr && <Belt weeks={pr.weeks} frac={pr.frac} week={pr.week} />}
    <button type="button" className="phase-row" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span><b>{ph.name.replace(/^BJJ\s*(\d+)\s*—\s*/, "Fase $1 · ")}</b>{pr && !pr.before && <span className="muted"> · settimana {pr.week} di {pr.weeks}</span>}{pr?.before && <span className="muted"> · si parte il {phaseDates(pid, race).split("–")[0].trim()}</span>}</span>
      <Icon n={open ? "up" : "down"} size={18} /></button>
    {open && <div className="stack-s small"><p className="muted">{phaseDates(pid, race)}</p><p>{ph.goal}</p><p><b>Settimana tipo.</b> {ph.weekly}</p></div>}
  </div>;
}

function WeekStrip({ today, labels }: { today: string; labels: (string | null)[] }) {
  const mon = mondayOf(today); const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const done = new Set([...store.sessions().filter(s => s.finished).map(s => s.date), ...store.endurance().map(e => e.date)]);
  return <div className="week" aria-label="Questa settimana">{days.map(d => { const wd = weekday(d); const l = labels[wd];
    return <span key={d} className={(d === today ? "today " : "") + (done.has(d) ? "done " : "") + (d < today ? "past" : "")}>
      <i>{"DLMMGVS"[wd]}</i><b>{+d.slice(8)}</b><s className="dot" aria-label={done.has(d) ? "fatto" : undefined} /><em>{l ?? ""}</em></span>; })}</div>;
}

/* ---------- check-in del mattino: pesata + 4 domande → volume ---------- */
function MorningCheck({ program, noAlto, race, ck, onDone }: { program: "bjj" | "ironman"; noAlto: boolean; race: string; ck: ReturnType<typeof store.checkin>; onDone: (c: ReturnType<typeof store.checkin>) => void }) {
  const today = isoToday(); const cfg = SCORE[program];
  const w0 = store.weights().find(w => w.date === today);
  const [open, setOpen] = useState(false); const [ans, setAns] = useState<(number | undefined)[]>(ck?.ans ?? []);
  const [kg, setKg] = useState(w0 ? String(w0.kg).replace(".", ",") : "");
  useEffect(() => { setOpen(false); }, [ck]);
  const done = cfg.qs.every((_, i) => ans[i] !== undefined); const tot = ans.reduce<number>((a, b) => a + (b ?? 0), 0);
  const lvl0 = done ? cfg.range.find(r => tot >= r[0] && tot <= r[1])![2] : null; const lvl = lvl0 === "alto" && noAlto ? "medio" : lvl0;
  const w = store.weights().find(x => x.date === today);
  if (!open && !ck) return <button type="button" className="card checkdone todo" onClick={() => setOpen(true)}>
    <Icon n="scale" className="c-accent" />
    <span><b>Check-in del mattino</b><span className="small muted">Pesata e 4 domande: scelgo il volume di oggi</span></span>
    <span className="link">Fai</span></button>;
  if (!open && ck) return <button type="button" className="card checkdone" onClick={() => setOpen(true)}>
    <Icon n="check" className="c-accent" />
    <span><b>Check-in fatto</b><span className="small muted">{w ? `${dec(w.kg)} kg · ` : ""}{ck.ans.reduce((a, b) => a + b, 0)} punti · volume {VL[ck.vol]}</span></span>
    <span className="link">Rivedi</span></button>;
  return <div className="card pad stack-s">
    <div className="row between"><h3>Check-in del mattino</h3><button type="button" className="link" onClick={() => setOpen(false)}>Chiudi</button></div>
    <label className="field inline" htmlFor="ckkg"><span><Icon n="scale" size={18} /> Pesata <span className="muted small">(dopo il bagno, prima di mangiare)</span></span>
      <span className="unit"><input id="ckkg" inputMode="decimal" placeholder={store.weights().slice(-1)[0] ? String(store.weights().slice(-1)[0].kg).replace(".", ",") : "78,0"} value={kg} onChange={e => setKg(e.target.value)} />kg</span></label>
    {cfg.qs.map(([q, opts], i) => <div key={q} className="q"><span className="qt">{q}</span>
      <div className="seg3">{opts.map((o, j) => <button key={o} type="button" aria-pressed={ans[i] === j} onClick={() => { const a = [...ans]; a[i] = j; setAns(a); }}>{o}</button>)}</div></div>)}
    <p className="small muted">Un dolore articolare o tendineo sopra 3/10 vince sul punteggio: Basso e togli l’esercizio che lo provoca.{program === "bjj" ? ` Dal ${dayLong(noAltoFrom(race))} niente Alto.` : ""}</p>
    <button type="button" className="primary" disabled={!done} onClick={() => {
      const n = parseNum(kg); if (n !== null && n > 30 && n < 200) store.saveWeight({ date: today, kg: n });
      const c = { date: today, program, ans: ans as number[], vol: lvl! }; store.saveCheckin(c); onDone(c); }}>
      {done ? `${tot} punti → volume ${VL[lvl!]}` : "Rispondi a tutte le voci"}</button>
  </div>;
}

/* ---------- settimana gara ---------- */
function RaceWeek({ race, days }: { race: string; days: number }) {
  const st = store.settings(); const div = DIVISIONS[st.division];
  const ws = store.weights().slice(-7); const avg = ws.length ? ws.reduce((a, w) => a + w.kg, 0) / ws.length : null;
  const margin = avg !== null ? div.limit - (avg + st.uniformKg) : null;
  const food = PLAN.nutrition.find(n => /settimana gara/i.test(n.phase));
  const t = isoToday();
  const items: [string, boolean][] = [
    [`Ultima seduta pesante entro ${dayLong(addDays(race, -8))}; da lì niente volume Alto e niente esercizi nuovi.`, t > addDays(race, -8)],
    [`Prove generali del peso con la divisa: ${dayLong(addDays(race, -10))} e ${dayLong(addDays(race, -6))}, dopo la colazione tipo.`, t > addDays(race, -6)],
    ["Pesa il gi e la divisa no-gi che userai in gara e scrivi il peso in Profilo.", false],
    ["Iscrizione: la categoria non si cambia il giorno della gara. Niente tagli d'acqua.", false],
    ["Due giorni prima: carboidrati 5–7 g/kg, la sera prima poche fibre, niente cibi nuovi.", t >= addDays(race, -2)],
  ];
  return <div className="card pad stack-s race">
    <span className="over">Settimana gara · {dayLong(race)}</span>
    <h2>{days === 0 ? "Oggi è il giorno della gara" : days === 1 ? "Gara domani" : `Gara tra ${days} giorni`}</h2>
    {avg !== null && <p className="small">Peso: media {dec(avg)} kg + divisa {dec(st.uniformKg)} kg = <b>{dec(avg + st.uniformKg)} kg</b> · limite {dec(div.limit)} kg · margine <b>{dec(margin!)} kg</b></p>}
    <ul className="check">{items.map(([tx, d], i) => <li key={i} className={d ? "done" : ""}>{tx}</li>)}</ul>
    {food && <p className="small muted"><b>Alimentazione.</b> {food.text}</p>}
  </div>;
}

