import { useEffect, useRef, useState } from "react";
import { currentPhaseId, isoToday, phase } from "./lib/plan";
import { store, type SessionLog } from "./lib/store";
import { sessionStats } from "./lib/session";
import { TimerProvider, useRestStop } from "./components/Timer";
import { ToastProvider, useToast } from "./components/Toast";
import ExerciseSheet from "./components/ExerciseSheet";
import Icon, { type IconName } from "./components/Icon";
import Today from "./screens/Today";
import { raceDate } from "./lib/labels";
import { Runner, Summary } from "./screens/Session";
import PlanView from "./screens/Plan";
import ProgressView, { type ProgMode } from "./screens/Progress";
import Library from "./screens/Library";
import Profile from "./screens/Profile";

/* Navigazione: barra in basso con cinque sezioni; seduta e riepilogo a tutto schermo.
   Ogni passaggio entra nella cronologia del browser, così il tasto Indietro di Android chiude la scheda aperta,
   riduce la seduta o torna a Oggi invece di chiudere l'app. d = quanti passi sopra la base (Oggi). */
type Tab = "oggi" | "piano" | "esercizi" | "progressi" | "profilo";
type Nav = { tab: Tab; view?: "run" | "sum"; sheet?: string; d: number };
const TABS: [Tab, string, IconName][] = [["oggi", "Oggi", "home"], ["piano", "Piano", "cal"], ["esercizi", "Esercizi", "dumb"], ["progressi", "Progressi", "chart"], ["profilo", "Profilo", "user"]];

export default function App() {
  return <ToastProvider><TimerProvider><Shell /></TimerProvider></ToastProvider>;
}

function Shell() {
  const toast = useToast(); const stopRest = useRestStop();
  const [running, setRunning] = useState<SessionLog | null>(() => store.sessions().find(s => !s.finished) ?? null);
  const [nav, setNav] = useState<Nav>({ tab: "oggi", d: 0 });
  const [prog, setProg] = useState<ProgMode>("palestra");
  const [rev, setRev] = useState(0); // cambia quando arrivano dati da un altro dispositivo
  const after = useRef<(() => void) | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const base: Nav = { tab: "oggi", d: 0 }; history.replaceState(base, "");
    if (running) { const n: Nav = { ...base, view: "run", d: 1 }; history.pushState(n, ""); setNav(n); }
    const onPop = (e: PopStateEvent) => { setNav((e.state as Nav) ?? base); const f = after.current; after.current = null; f?.(); };
    const onSync = (e: Event) => { if ((e as CustomEvent).detail?.changed) setRev(r => r + 1); };
    window.addEventListener("popstate", onPop); window.addEventListener("jdi:sync", onSync);
    return () => { window.removeEventListener("popstate", onPop); window.removeEventListener("jdi:sync", onSync); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const push = (n: Omit<Nav, "d">) => { const m = { ...n, d: nav.d + 1 }; history.pushState(m, ""); setNav(m); };
  const toBase = (then?: () => void) => { if (nav.d > 0) { after.current = then ?? null; history.go(-nav.d); } else { const b: Nav = { tab: "oggi", d: 0 }; history.replaceState(b, ""); setNav(b); then?.(); } };
  const goTab = (t: Tab) => {
    if (t === nav.tab && !nav.view && !nav.sheet) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (t === "oggi") { toBase(); return; }
    if (nav.tab === "oggi" && nav.d === 0) push({ tab: t }); else { const m = { tab: t, d: nav.d }; history.replaceState(m, ""); setNav(m); }
  };
  const openSheet = (id: string) => push({ ...nav, sheet: id });

  const view = running ? nav.view : undefined;
  useEffect(() => { window.scrollTo(0, 0); }, [nav.tab, view]);
  const full = view === "run" || view === "sum";
  const program = phase(currentPhaseId(isoToday(), raceDate())).program;
  useEffect(() => { const r = document.documentElement; r.dataset.program = program; r.dataset.nav = full ? "0" : "1"; }, [program, full]);

  const finishSession = (msg: string) => { stopRest(); toBase(() => { setRunning(null); toast(msg); }); };
  const st = running ? sessionStats(running) : null;

  return <>
    <main className="wrap" key={rev}>
      {view === "sum" && running ? <Summary log={running} onBack={() => history.back()}
          onSave={l => { store.saveSession(l); finishSession("Seduta salvata"); }}
          onDelete={() => { store.deleteSession(running.id); finishSession("Seduta eliminata"); }} />
        : view === "run" && running ? <Runner log={running} onChange={setRunning} onOpen={openSheet} onFinish={() => push({ tab: nav.tab, view: "sum" })} onMinimize={() => history.back()} />
        : <>
          {nav.tab === "oggi" && <Today onStart={l => { store.saveSession(l); setRunning(l); push({ tab: "oggi", view: "run" }); }} onOpen={openSheet}
            onAccount={() => goTab("profilo")} onEndurance={() => { setProg("endurance"); goTab("progressi"); }} running={running} onResume={() => push({ tab: nav.tab, view: "run" })} />}
          {nav.tab === "piano" && <PlanView onOpen={openSheet} />}
          {nav.tab === "esercizi" && <Library onOpen={openSheet} />}
          {nav.tab === "progressi" && <ProgressView mode={prog} onMode={setProg} />}
          {nav.tab === "profilo" && <Profile />}
        </>}
    </main>
    {!full && running && st && <button type="button" className="runpill" onClick={() => push({ tab: nav.tab, view: "run" })}>
      <Icon n="dumb" size={20} /><span><b>Seduta in corso</b><span className="num"> · {st.done}/{st.total} serie</span></span><span className="go">Riprendi</span></button>}
    {!full && <nav className="bottomnav" aria-label="Sezioni">{TABS.map(([t, l, ic]) =>
      <button key={t} type="button" aria-current={nav.tab === t ? "page" : undefined} onClick={() => goTab(t)}><span className="ni"><Icon n={ic} /></span>{l}</button>)}</nav>}
    {nav.sheet && <ExerciseSheet id={nav.sheet} onClose={() => history.back()} />}
  </>;
}
