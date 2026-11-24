/* Avanzamento della fase disegnato come una cintura: il tessuto si riempie con i giorni passati,
   sulla barra nera c'è un nastro per ogni settimana della fase (pieno = settimana finita, a metà = in corso). */
export default function Belt({ weeks, week, frac }: { weeks: number; week: number; frac: number }) {
  const n = Math.min(weeks, 8);
  return <div className="belt" role="img" aria-label={`Settimana ${week} di ${weeks} della fase`}>
    <span className="cloth"><i style={{ width: `${Math.round(Math.min(1, Math.max(0, frac)) * 100)}%` }} /></span>
    <span className="rank">{Array.from({ length: n }, (_, i) => <s key={i} className={i + 1 < week ? "on" : i + 1 === week ? "half" : ""} />)}</span>
  </div>;
}
