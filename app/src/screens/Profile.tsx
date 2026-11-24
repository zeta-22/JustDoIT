import { useState } from "react";
import { RACE_DEFAULT, isoToday, noAltoFrom, planB } from "../lib/plan";
import { ALL_PLATES, DEF_PLATES } from "../lib/plates";
import { DIVISIONS, setPassword, signIn, signInPassword, signOut, store, sync, type Settings } from "../lib/store";
import { SYNC_LABEL, useSync } from "../lib/useSync";
import { dayLong, dec, parseNum } from "../lib/format";
import Icon from "../components/Icon";
import { useToast } from "../components/Toast";

/* Profilo: gara (data, categoria, divisa), account e sincronizzazione, backup. */
export default function Profile() {
  return <section className="stack">
    <header className="top"><div><span className="over">Impostazioni e dati</span><h1>Profilo</h1></div></header>
    <RaceSetting />
    <Category />
    <Gear />
    <Account />
    <Backup />
    <p className="small muted center">JustDoIT · uso personale</p>
  </section>;
}

function RaceSetting() {
  const [st, setSt] = useState<Settings>(store.settings()); const race = st.raceDate || RACE_DEFAULT; const pb = planB(race);
  return <div className="card pad stack-s">
    <h3>Data della gara</h3>
    <label className="field" htmlFor="race">Giorno della gara BJJ<input id="race" type="date" value={race} min="2026-12-01" max="2027-06-30"
      onChange={e => { if (!e.target.value) return; const s = { ...st, raceDate: e.target.value }; setSt(s); store.saveSettings(s); }} /></label>
    <p className="small muted">Se cambia, si spostano la settimana gara, la transizione e tutto l'Ironman (la prima settimana Ironman è sempre quella dopo la gara). Niente volume Alto da {dayLong(noAltoFrom(race))}.</p>
    {race !== RACE_DEFAULT && <button type="button" className="ghost" onClick={() => { const s = { ...st, raceDate: RACE_DEFAULT }; setSt(s); store.saveSettings(s); }}>Torna al 23 gennaio</button>}
    {pb && <p className="small warnbox">{pb}</p>}
  </div>;
}

function Category() {
  const [st, setSt] = useState<Settings>(store.settings()); const div = DIVISIONS[st.division];
  const [u, setU] = useState(dec(st.uniformKg));
  return <div className="card pad stack-s">
    <h3>Categoria</h3>
    <label className="field" htmlFor="div">Categoria obiettivo<select id="div" value={st.division} onChange={e => { const s = { ...st, division: e.target.value as Settings["division"] }; setSt(s); store.saveSettings(s); }}>
      {Object.entries(DIVISIONS).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}</select></label>
    <label className="field" htmlFor="unif">Peso del {div.uniform === "gi" ? "kimono" : "rashguard e pantaloncini"} (kg)<input id="unif" inputMode="decimal" value={u}
      onChange={e => { setU(e.target.value); const n = parseNum(e.target.value); if (n !== null && n >= 0 && n < 6) { const s = { ...st, uniformKg: n }; setSt(s); store.saveSettings(s); } }} /></label>
    <p className="small muted">Limiti IBJJF, pesata con la divisa subito prima del primo incontro. Verifica sul regolamento della tua gara.</p>
  </div>;
}

/** Attrezzi della tua palestra: servono al calcolo dei dischi e dell'avvicinamento. */
function Gear() {
  const [st, setSt] = useState<Settings>(store.settings()); const plates = st.plates?.length ? st.plates : DEF_PLATES;
  const save = (s: Settings) => { setSt(s); store.saveSettings(s); };
  const [bar, setBar] = useState(dec(st.barKg ?? 20, 0)); const [trap, setTrap] = useState(dec(st.trapKg ?? 25, 0));
  return <div className="card pad stack-s">
    <h3>Attrezzi</h3>
    <div className="grid2">
      <label className="field" htmlFor="barkg">Bilanciere (kg)<input id="barkg" inputMode="decimal" value={bar} onChange={e => { setBar(e.target.value); const n = parseNum(e.target.value); if (n && n > 0 && n < 50) save({ ...store.settings(), barKg: n }); }} /></label>
      <label className="field" htmlFor="trapkg">Trap bar (kg)<input id="trapkg" inputMode="decimal" value={trap} onChange={e => { setTrap(e.target.value); const n = parseNum(e.target.value); if (n && n > 0 && n < 50) save({ ...store.settings(), trapKg: n }); }} /></label>
    </div>
    <span className="field">Dischi che ci sono in palestra</span>
    <div className="chips">{ALL_PLATES.map(p => <button key={p} type="button" aria-pressed={plates.includes(p)} onClick={() => {
      const next = plates.includes(p) ? plates.filter(x => x !== p) : [...plates, p].sort((a, b) => b - a); if (next.length) save({ ...store.settings(), plates: next }); }}>{dec(p, p % 1 ? (p * 100 % 10 ? 2 : 1) : 0)}</button>)}</div>
    <p className="small muted">Servono per dirti quali dischi mettere per lato e per le serie di avvicinamento.</p>
  </div>;
}

function Account() {
  const st = useSync(); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [newPw, setNewPw] = useState(""); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  return <div className={"card pad stack-s sync " + st.status}>
    <div className="row gap-s"><Icon n={st.status === "ok" ? "cloud" : st.status === "error" ? "alert" : "cloudOff"} className={"s-" + st.status} /><h3>Dati online</h3></div>
    <p><b>{SYNC_LABEL[st.status]}</b>{st.status === "ok" && st.last ? ` · ultima alle ${st.last}` : ""}</p>
    {st.pending > 0 && st.status !== "anon" && <p className="small muted">{st.pending} modifiche in attesa di invio.</p>}
    {st.status === "error" && st.error && <p className="small warnbox">{st.error}</p>}
    {st.email ? <>
      <p className="small muted">Collegato come {st.email}</p>
      <div className="row gap"><button type="button" className="primary" onClick={() => void sync()}>Sincronizza ora</button>
        <button type="button" className="ghost" onClick={() => void signOut()}>Esci</button></div>
      <form className="stack-s" onSubmit={async e => { e.preventDefault(); setBusy(true); setMsg(null);
          try { await setPassword(newPw); setNewPw(""); setMsg("Password salvata: d'ora in poi puoi accedere con email e password."); }
          catch (err) { setMsg(err instanceof Error ? err.message : "Non riuscito."); } finally { setBusy(false); } }}>
        <label className="field" htmlFor="npw">Imposta o cambia la password<input id="npw" type="password" minLength={8} required autoComplete="new-password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="almeno 8 caratteri" /></label>
        <button type="submit" className="ghost" disabled={busy}>Salva password</button>
      </form>
    </> : <form className="stack-s" onSubmit={async e => { e.preventDefault(); setBusy(true); setMsg(null);
        try { await signInPassword(email.trim(), pw); setMsg(null); }
        catch (err) { setMsg(err instanceof Error ? err.message : "Accesso non riuscito."); } finally { setBusy(false); } }}>
      <label className="field" htmlFor="em">La tua email<input id="em" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@esempio.it" /></label>
      <label className="field" htmlFor="pw">Password<input id="pw" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} placeholder="la tua password" /></label>
      <button type="submit" className="primary" disabled={busy || !pw}>{busy ? "Accesso…" : "Accedi"}</button>
      <button type="button" className="ghost" disabled={busy || !email} onClick={async () => { setBusy(true); setMsg(null);
        try { await signIn(email.trim()); setMsg(`Ti ho mandato un link a ${email.trim()}. Aprilo da questo telefono, in Chrome.`); }
        catch (err) { setMsg(err instanceof Error ? err.message : "Invio non riuscito."); } finally { setBusy(false); } }}>Senza password: mandami un link via email</button>
      <p className="small muted">Accedi una volta sola: poi resti collegato anche chiudendo l'app.</p>
    </form>}
    {msg && <p className="small">{msg}</p>}
  </div>;
}

function Backup() {
  const toast = useToast();
  const exportFile = () => {
    const blob = new Blob([store.exportAll()], { type: "application/json" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `justdoit-backup-${isoToday()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const importFile = async (f: File | undefined) => { if (!f) return; try { toast(store.importAll(await f.text())); } catch (e) { toast(e instanceof Error ? e.message : "File non valido."); } };
  return <div className="card pad stack-s">
    <h3>Backup</h3>
    <p className="small muted">Un file con tutte le sedute, le pesate e le impostazioni. Utile come copia di sicurezza in più.</p>
    <div className="row gap"><button type="button" className="ghost" onClick={exportFile}>Scarica backup</button>
      <label className="ghost filebtn">Importa backup<input type="file" accept="application/json,.json" onChange={e => void importFile(e.target.files?.[0])} /></label></div>
  </div>;
}
