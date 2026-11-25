/* Aggiornamenti dell'app installata.
   Quando Vercel pubblica main, il service worker nuovo prende il controllo appena scaricato, ma la pagina aperta
   continua col codice vecchio finché non si ricarica: per questo a volte servivano due aperture.
   Qui l'app cerca la versione nuova anche quando torna in primo piano (non solo quando si apre da zero) e,
   appena l'ha scaricata, si ricarica da sola. Mai durante una seduta o mentre stai scrivendo: in quel caso
   aspetta la fine della seduta o il prossimo passaggio in secondo piano. */
const KEY = "jdi.updated";
let pending = false;
let busy: () => boolean = () => false;

function reload() { try { sessionStorage.setItem(KEY, "1"); } catch { /* niente */ } location.reload(); }
/** Ricarica se c'è una versione nuova già scaricata e non sei in seduta. */
export function maybeReload() { if (pending && !busy()) reload(); }

export function startUpdates(isBusy: () => boolean) {
  busy = isBusy;
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
  const sw = navigator.serviceWorker;
  const had = !!sw.controller; // alla primissima installazione non serve ricaricare
  sw.addEventListener("controllerchange", () => { if (had) { pending = true; maybeReload(); } });
  sw.register("/sw.js", { scope: "/" }).then(reg => {
    const check = () => { if (navigator.onLine) reg.update().catch(() => { /* offline o sito irraggiungibile */ }); };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); else maybeReload(); });
    window.setInterval(() => { if (document.visibilityState === "visible") check(); }, 30 * 60 * 1000);
  }).catch(() => { /* senza service worker l'app funziona lo stesso, solo non offline */ });
}

/** true una volta sola, subito dopo il ricaricamento dovuto a un aggiornamento. */
export function justUpdated() { try { const v = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY); return v === "1"; } catch { return false; } }
