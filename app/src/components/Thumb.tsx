import { useLayoutEffect, useMemo, useRef } from "react";
import { FIG, PROP, skel, lerp } from "../engine/figure.js";
import { heroFlat } from "../engine/flat.js";
import { FIGB, renderBack } from "../engine/back.js";
import { FIGS } from "../data/figures";
import Icon from "./Icon";

/* Miniatura ferma dell'Atleta flat (a metà del movimento), ritagliata sulla figura.
   Solo per gli esercizi con animazione approvata in data/figures.ts: per gli altri non disegna niente. */
const boxes = new Map<string, string>();
type Ex = { poses: unknown[]; props?: { k: string; z?: string }[] };

function markup(id: string): string {
  const info = FIGS[id]; if (!info) return "";
  const mus = { p: info.p, s: info.s };
  try {
    if (info.view === "back") { const ex = FIGB[info.fig] as Ex; if (!ex) return ""; return renderBack(ex, lerp(ex.poses[0], ex.poses[1], .6), mus, .9); }
    const ex = FIG[info.fig] as Ex; if (!ex) return "";
    const s = skel(lerp(ex.poses[0], ex.poses[1], .6));
    const pr = (front: boolean) => (ex.props || []).filter(p => (p.z === "front") === front).map(p => PROP[p.k](p, s, 0)).join("");
    return pr(false) + heroFlat(s, mus, .9) + pr(true);
  } catch { return ""; }
}

export const hasThumb = (id: string) => !!FIGS[id];

export default function Thumb({ ex, className = "" }: { ex: string; className?: string }) {
  const html = useMemo(() => markup(ex), [ex]);
  const svg = useRef<SVGSVGElement>(null); const g = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    if (!svg.current || !g.current || !html) return;
    let vb = boxes.get(ex);
    if (!vb) {
      try { const b = g.current.getBBox(); if (b.width > 0) { const side = Math.max(b.width, b.height) * 1.08 + 6;
        vb = `${(b.x + b.width / 2 - side / 2).toFixed(1)} ${(b.y + b.height / 2 - side / 2).toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`; boxes.set(ex, vb); } } catch { /* non ancora visibile */ }
    }
    if (vb) svg.current.setAttribute("viewBox", vb);
  }, [ex, html]);
  if (!html) return <span className={"thumb none " + className} aria-hidden="true"><Icon n="dumb" size={20} /></span>;
  return <span className={"thumb " + className} aria-hidden="true"><svg ref={svg} viewBox="10 -8 180 140"><g ref={g} dangerouslySetInnerHTML={{ __html: html }} /></svg></span>;
}
