/* Preferenze di questo telefono (non si sincronizzano: ogni dispositivo ha le sue). */
export interface Prefs {
  theme: "auto" | "light" | "dark"; // tema dell'app; auto = come il telefono
  sound: boolean; vibrate: boolean;   // fine del recupero
  wake: boolean;                      // schermo sempre acceso durante la seduta
  autoRest: boolean;                  // il timer parte da solo quando spunti una serie
  notify: boolean;                    // avviso di fine recupero se l'app è in secondo piano
  remindAt: string;                   // ora del promemoria del mattino (calendario)
}
const KEY = "jdi.prefs";
const DEF: Prefs = { theme: "auto", sound: true, vibrate: true, wake: true, autoRest: true, notify: false, remindAt: "07:15" };
export function prefs(): Prefs { try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEF; } }
export function savePrefs(p: Prefs) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage bloccato */ } applyTheme(p.theme); window.dispatchEvent(new Event("jdi:prefs")); }
/** data-theme sulla radice: i colori in index.css lo seguono (auto = nessun attributo, decide il telefono). */
export function applyTheme(t: Prefs["theme"] = prefs().theme) {
  const r = document.documentElement; if (t === "auto") delete r.dataset.theme; else r.dataset.theme = t;
  const dark = t === "dark" || (t === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0b0e13" : "#10131a");
}
