import { useEffect, useState } from "react";
import { syncState } from "./store";

/** Stato della sincronizzazione, aggiornato a ogni evento "jdi:sync". */
export function useSync() {
  const [, set] = useState(0);
  useEffect(() => { const on = () => set(x => x + 1); window.addEventListener("jdi:sync", on); return () => window.removeEventListener("jdi:sync", on); }, []);
  return syncState;
}
export const SYNC_LABEL = { init: "Controllo l'accesso…", anon: "Non collegato: i dati restano solo su questo telefono", syncing: "Sincronizzo…", ok: "Dati salvati online", offline: "Senza rete: salvo sul telefono e invio appena torna", error: "Errore di sincronizzazione" };
