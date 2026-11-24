import { useEffect, useRef } from "react";
import { FIG, PROP, skel, lerp } from "../engine/figure.js";
import { heroFlat } from "../engine/flat.js";
import { FIGB, renderBack } from "../engine/back.js";
import type { FigInfo } from "../data/figures";

const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);
type Ex = { poses: unknown[]; t1?: number; t2?: number; h1?: number; h2?: number; loop?: number; props?: { k: string; z?: string }[] };
function state(ex: Ex, time: number) {
  const P = ex.poses;
  if (ex.loop) { const n = P.length, seg = ex.loop, tt = (time % (n * seg)) / seg, i = Math.floor(tt); return { pose: lerp(P[i], P[(i + 1) % n], tt - i), act: .8 }; }
  const h1 = ex.h1 || 0, t1 = ex.t1 || 1, h2 = ex.h2 || 0, t2 = ex.t2 || 1; let x = time % (h1 + t1 + h2 + t2);
  if (x < h1) return { pose: P[0], act: .45 }; x -= h1;
  if (x < t1) return { pose: lerp(P[0], P[1], ease(x / t1)), act: .7 }; x -= t1;
  if (x < h2) return { pose: P[1], act: .85 }; x -= h2;
  return { pose: lerp(P[1], P[0], ease(x / t2)), act: 1 };
}

/** Personaggio animato con i muscoli dell'esercizio evidenziati. */
export default function Figure({ info, speed = 1 }: { info: FigInfo; speed?: number }) {
  const g = useRef<SVGGElement>(null);
  const sp = useRef(speed); sp.current = speed;
  useEffect(() => {
    const back = info.view === "back";
    const ex = (back ? FIGB[info.fig] : FIG[info.fig]) as Ex; if (!ex || !g.current) return;
    const mus = { p: info.p, s: info.s };
    const draw = (t: number) => {
      const st = state(ex, t);
      if (back) { g.current!.innerHTML = renderBack(ex, st.pose, mus, Math.min(.95, .45 + st.act * (.75 + .25 * Math.sin(t * 5)) * .5)); return; }
      const s = skel(st.pose);
      const op = Math.min(.95, .45 + st.act * (.75 + .25 * Math.sin(t * 5)) * .5);
      const pr = (front: boolean) => (ex.props || []).filter(p => (p.z === "front") === front).map(p => PROP[p.k](p, s, t)).join("");
      g.current!.innerHTML = `<line class="gnd" x1="0" y1="130" x2="200" y2="130"/>` + pr(false) + heroFlat(s, mus, op) + pr(true);
    };
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { draw((ex.h1 || 0) + (ex.t1 || 1) + .01); return; }
    let T = 0, prev = performance.now(), raf = 0;
    const loop = (now: number) => { T += (now - prev) / 1000 * sp.current; prev = now; draw(T); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [info]);
  return <svg className="fig" viewBox="10 -8 180 140" role="img" aria-label="Animazione dell'esercizio"><g ref={g} /></svg>;
}
