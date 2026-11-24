import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "./Icon";
import { clock } from "../lib/format";

/* Timer di recupero. Compare solo quando parte un recupero: foglio in basso con l'anello, −15″/+15″, "Salta"
   e la prossima serie; si riduce a pillola. Alla fine suona e vibra, poi sparisce da solo. */
type Start = (sec: number, next?: string) => void;
const Ctx = createContext<{ start: Start; stop: () => void; running: boolean }>({ start: () => {}, stop: () => {}, running: false });
export const useRest = () => useContext(Ctx).start;
export const useRestRunning = () => useContext(Ctx).running;
export const useRestStop = () => useContext(Ctx).stop;

let actx: AudioContext | null = null;
function beep() { try { if (!actx) return; const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
  g.gain.setValueAtTime(.001, actx.currentTime); g.gain.exponentialRampToValueAtTime(.3, actx.currentTime + .02); g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + .5); o.start(); o.stop(actx.currentTime + .55); } catch { /* audio non disponibile */ } }

export function TimerProvider({ children }: { children: ReactNode }) {
  const [end, setEnd] = useState(0); const [total, setTotal] = useState(0); const [left, setLeft] = useState(0);
  const [next, setNext] = useState<string | undefined>(); const [small, setSmall] = useState(false); const [ready, setReady] = useState(false);
  const tick = useRef(0); const hide = useRef(0);
  const start: Start = (sec, nx) => {
    try { actx = actx || new AudioContext(); if (actx.state === "suspended") void actx.resume(); } catch { /* */ }
    if (sec <= 0) return;
    clearTimeout(hide.current); setReady(false); setTotal(sec); setEnd(Date.now() + sec * 1000); setLeft(sec); setNext(nx);
  };
  const add = (d: number) => { setEnd(e => Math.max(Date.now() + 1000, e + d * 1000)); setTotal(t => Math.max(1, t + d)); };
  const stop = () => { setEnd(0); setReady(false); };
  useEffect(() => {
    clearInterval(tick.current); if (!end) return;
    tick.current = window.setInterval(() => { const r = (end - Date.now()) / 1000; setLeft(Math.max(0, r));
      if (r <= 0) { beep(); try { navigator.vibrate?.([200, 100, 200]); } catch { /* */ } setEnd(0); setReady(true); hide.current = window.setTimeout(() => setReady(false), 6000); } }, 250);
    return () => clearInterval(tick.current);
  }, [end]);
  const run = end > 0; const frac = total ? left / total : 0; const C = 2 * Math.PI * 40;
  return <Ctx.Provider value={{ start, stop, running: run }}>
    {children}
    {run && small && <button type="button" className="rest-pill" onClick={() => setSmall(false)} aria-label="Apri il timer di recupero">
      <Icon n="timer" size={18} /><b>{clock(left)}</b></button>}
    {(run && !small || ready) && <div className={"rest" + (ready ? " ready" : "")} role="region" aria-label="Timer di recupero">
      <div className="ring" aria-hidden="true"><svg viewBox="0 0 92 92"><circle className="bgc" cx="46" cy="46" r="40" />
        <circle className="fgc" cx="46" cy="46" r="40" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} /></svg>
        <b>{ready ? <Icon n="check" size={30} /> : clock(left)}</b></div>
      <div className="rest-info">
        <span className="over" aria-live="polite">{ready ? "Pronto" : `Recupero · ${clock(total)}`}</span>
        {next && <span className="rest-next">{ready ? "Ora: " : "Poi: "}<b>{next}</b></span>}
        {ready ? <div className="rest-btns one"><button type="button" onClick={() => setReady(false)}>Ok</button></div>
          : <div className="rest-btns"><button type="button" onClick={() => add(-15)}>−15″</button><button type="button" onClick={() => add(15)}>+15″</button><button type="button" className="sk" onClick={stop}>Salta</button></div>}
      </div>
      {!ready && <button type="button" className="rest-min" aria-label="Riduci il timer" onClick={() => setSmall(true)}><Icon n="down" size={20} /></button>}
    </div>}
  </Ctx.Provider>;
}
