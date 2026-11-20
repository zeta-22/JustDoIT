import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const Ctx = createContext<(sec: number) => void>(() => {});
export const useRest = () => useContext(Ctx);
let actx: AudioContext | null = null;
function beep() { try { if (!actx) return; const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
  g.gain.setValueAtTime(.001, actx.currentTime); g.gain.exponentialRampToValueAtTime(.3, actx.currentTime + .02); g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + .5); o.start(); o.stop(actx.currentTime + .55); } catch { /* audio non disponibile */ } }

/** Timer di recupero sempre visibile in basso. start(sec) lo fa partire da qualsiasi schermata. */
export function TimerProvider({ children }: { children: ReactNode }) {
  const [end, setEnd] = useState(0); const [left, setLeft] = useState(0); const [msg, setMsg] = useState("Recupero");
  const tick = useRef<number>(0);
  const start = (sec: number) => {
    try { actx = actx || new AudioContext(); if (actx.state === "suspended") actx.resume(); } catch { /* */ }
    if (sec > 0) { setEnd(Date.now() + sec * 1000); setMsg("Recupero in corso"); }
  };
  useEffect(() => {
    clearInterval(tick.current); if (!end) return;
    tick.current = window.setInterval(() => { const r = (end - Date.now()) / 1000; setLeft(Math.max(0, r));
      if (r <= 0) { beep(); try { navigator.vibrate?.([200, 100, 200]); } catch { /* */ } setEnd(0); setMsg("Pronto: prossima serie"); } }, 250);
    return () => clearInterval(tick.current);
  }, [end]);
  const fmt = (s: number) => { s = Math.ceil(s); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  return <Ctx.Provider value={start}>
    {children}
    <div className="timer" role="region" aria-label="Timer di recupero">
      <span className={"clock" + (end ? " run" : "")} aria-live="polite">{fmt(end ? left : 0)}</span>
      <span className="tl">{msg}</span>
      {[60, 90, 180].map(s => <button key={s} type="button" className="tbtn" onClick={() => start(s)}>{s < 180 ? `${s}″` : "3′"}</button>)}
      <button type="button" className="tbtn stop" aria-label="Ferma timer" onClick={() => { setEnd(0); setMsg("Recupero"); }}>✕</button>
    </div>
  </Ctx.Provider>;
}
