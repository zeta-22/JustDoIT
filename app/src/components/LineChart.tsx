import { useRef, useState } from "react";

/* Grafico a linea semplice, una sola scala (y), date sull'asse x.
   - points: i valori registrati (punti); line: linea principale (es. media 7 giorni) — opzionale, altrimenti unisce i punti
   - ref: linea orizzontale di riferimento (es. limite di peso), tratteggiata e con etichetta
   Tocco/hover: mostra il valore del punto più vicino sopra il grafico. */
export interface Pt { x: string; y: number }
const W = 340, H = 170, L = 34, R = 10, T = 14, B = 24;
const t = (iso: string) => new Date(iso + "T12:00:00").getTime();
const short = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });

export default function LineChart({ points, line, refLine, unit, label, fmt = v => v.toFixed(1) }: {
  points: Pt[]; line?: Pt[]; refLine?: { y: number; label: string }; unit: string; label: string; fmt?: (v: number) => string;
}) {
  const [hi, setHi] = useState<number | null>(null); const svg = useRef<SVGSVGElement>(null);
  if (points.length < 2) return <p className="small muted">Servono almeno 2 valori per il grafico.</p>;
  const xs = points.map(p => t(p.x)); const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const ys = [...points.map(p => p.y), ...(line ?? []).map(p => p.y), ...(refLine ? [refLine.y] : [])];
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const pad = Math.max(.5, (y1 - y0) * .12); y0 -= pad; y1 += pad;
  const step = niceStep((y1 - y0) / 4); y0 = Math.floor(y0 / step) * step; y1 = Math.ceil(y1 / step) * step;
  const X = (iso: string) => L + (x1 === x0 ? (W - L - R) / 2 : (t(iso) - x0) / (x1 - x0) * (W - L - R));
  const Y = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  const ticks: number[] = []; for (let v = y0; v <= y1 + 1e-9; v += step) ticks.push(+v.toFixed(2));
  const main = line && line.length > 1 ? line : points;
  const d = main.map((p, i) => `${i ? "L" : "M"}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(" ");
  const sel = hi !== null ? points[hi] : points[points.length - 1];
  const onMove = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W;
    let best = 0; points.forEach((p, i) => { if (Math.abs(X(p.x) - px) < Math.abs(X(points[best].x) - px)) best = i; }); setHi(best);
  };
  return <figure className="chart">
    <figcaption><span className="small muted">{label}</span><b>{fmt(sel.y)} {unit}</b><span className="small muted">{short(sel.x)}</span></figcaption>
    <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${points.length} valori, ultimo ${fmt(points[points.length - 1].y)} ${unit}`}
      onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHi(null)}>
      {ticks.map(v => <g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} className="grid" />
        <text x={L - 5} y={Y(v) + 3} textAnchor="end" className="axis">{fmt(v)}</text></g>)}
      <text x={L} y={H - 6} className="axis">{short(points[0].x)}</text>
      <text x={W - R} y={H - 6} textAnchor="end" className="axis">{short(points[points.length - 1].x)}</text>
      {refLine && refLine.y >= y0 && refLine.y <= y1 && <g>
        <line x1={L} x2={W - R} y1={Y(refLine.y)} y2={Y(refLine.y)} className="refline" />
        <text x={W - R} y={Y(refLine.y) - 4} textAnchor="end" className="reflabel">{refLine.label}</text></g>}
      <path d={d} className="cline" />
      {points.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={hi === i ? 5 : 3.2} className={"cdot" + (line ? " soft" : "")} />)}
      {hi !== null && <line x1={X(sel.x)} x2={X(sel.x)} y1={T} y2={H - B} className="cross" />}
    </svg>
  </figure>;
}
function niceStep(raw: number) { const p = 10 ** Math.floor(Math.log10(raw || 1)); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
