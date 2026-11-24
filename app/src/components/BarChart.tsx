import { useState } from "react";
import { dayMonth } from "../lib/format";

/* Barre impilate per settimana (es. palestra + tatami + resistenza). Tocca una barra per leggere i valori.
   L'ultima barra può essere "in corso" (più chiara). */
export interface Bar { x: string; parts: number[] }
const W = 340, H = 160, L = 38, R = 8, T = 12, B = 22;
function niceStep(raw: number) { const p = 10 ** Math.floor(Math.log10(raw || 1)); const n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }

export default function BarChart({ bars, names, colors, label, unit, fmt = v => String(Math.round(v)), partialLast = true, empty = "Ancora nessun dato." }: {
  bars: Bar[]; names: string[]; colors: string[]; label: string; unit: string; fmt?: (v: number) => string; partialLast?: boolean; empty?: string;
}) {
  const [hi, setHi] = useState<number | null>(null);
  if (!bars.some(b => b.parts.some(v => v > 0))) return <p className="small muted">{empty}</p>;
  const tot = bars.map(b => b.parts.reduce((a, v) => a + v, 0)); const max = Math.max(1, ...tot);
  const step = niceStep(max / 3); const top = Math.ceil(max / step) * step;
  const ticks: number[] = []; for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
  const Y = (v: number) => T + (1 - v / top) * (H - T - B); const bw = (W - L - R) / bars.length;
  const sel = hi ?? bars.length - 1;
  return <figure className="chart">
    <figcaption><span className="small muted">{label}</span><b>{fmt(tot[sel])} {unit}</b><span className="small muted">settimana del {dayMonth(bars[sel].x)}{partialLast && sel === bars.length - 1 ? " (in corso)" : ""}</span></figcaption>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${bars.length} settimane, ultima ${fmt(tot[tot.length - 1])} ${unit}`}>
      {ticks.map(v => <g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} className="grid" /><text x={L - 5} y={Y(v) + 3} textAnchor="end" className="axis">{fmt(v)}</text></g>)}
      {bars.map((b, i) => { const x = L + i * bw + bw * .17, w = bw * .66; let base = 0;
        return <g key={b.x} onClick={() => setHi(i)} className={(partialLast && i === bars.length - 1 ? "curwk " : "") + (i === sel ? "sel" : "")} style={{ cursor: "pointer" }}>
          <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
          {b.parts.map((v, k) => { if (!v) return null; const y0 = Y(base), y1 = Y(base + v); base += v;
            return <rect key={k} x={x} y={y1} width={w} height={Math.max(0, y0 - y1)} rx={2} fill={colors[k]} />; })}
          {(i === 0 || i === bars.length - 1 || i === Math.floor(bars.length / 2)) && <text x={x + w / 2} y={H - 6} textAnchor="middle" className="axis">{dayMonth(b.x)}</text>}
        </g>; })}
    </svg>
    <div className="legend">{names.map((n, k) => <span key={n}><i style={{ background: colors[k] }} />{n}{sel !== null && bars[sel].parts[k] ? ` ${fmt(bars[sel].parts[k])}` : ""}</span>)}</div>
  </figure>;
}
