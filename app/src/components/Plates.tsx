import { store } from "../lib/store";
import { DEF_PLATES, barFor, platesFor, ramp as rampOf, roundLoad } from "../lib/plates";
import { kgStr } from "../lib/format";

/** Dischi da mettere per lato per un carico, disegnati come dischi veri (più alti = più pesanti). */
export function PlateLine({ ex, kg }: { ex: string; kg: number }) {
  const st = store.settings(); const bar = barFor(ex, st); if (bar === null || !(kg > 0)) return null;
  const pl = platesFor(kg, bar, st.plates?.length ? st.plates : DEF_PLATES); if (!pl) return <p className="small muted">{kgStr(kg)} kg è meno del bilanciere ({kgStr(bar)} kg).</p>;
  const max = Math.max(25, ...pl.side);
  return <div className="plates-row">
    <span className="plates" aria-hidden="true"><span className="bar" /><span className="sleeve" />{pl.side.map((p, i) => <i key={i} style={{ height: `${14 + 30 * Math.sqrt(p / max)}px` }}>{kgStr(p)}</i>)}</span>
    <span className="small"><b>{kgStr(kg)} kg</b> = {BAR_NAME(ex)} {kgStr(bar)} + per lato {pl.side.length ? pl.side.map(kgStr).join(" · ") : "niente"}{pl.rest ? ` (mancano ${kgStr(pl.rest)} kg con i tuoi dischi)` : ""}</span>
  </div>;
}
const BAR_NAME = (ex: string) => ex === "trap_bar" ? "trap bar" : "bilanciere";

/** Serie di avvicinamento in kg dalle percentuali del piano, arrotondate a un carico che si può fare. */
export function RampChips({ ex, kg, text }: { ex: string; kg: number; text?: string }) {
  const st = store.settings(); const bar = barFor(ex, st) ?? 0; const r = text ? rampOf(text) : [];
  const steps = r.length ? r : [{ pct: 50, reps: "5" }, { pct: 70, reps: "3" }, { pct: 85, reps: "1–2" }];
  if (!(kg > bar)) return null;
  return <div className="stack-s"><span className="over">Avvicinamento verso {kgStr(kg)} kg</span>
    <div className="chips">{steps.map(s => <span key={s.pct} className="chipv"><b className="num">{kgStr(roundLoad(kg * s.pct / 100, bar, st.plates?.length ? st.plates : DEF_PLATES))}</b> × {s.reps}<small>{s.pct}%</small></span>)}</div></div>;
}
