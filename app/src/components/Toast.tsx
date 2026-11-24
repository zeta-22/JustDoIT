import { createContext, useContext, useRef, useState, type ReactNode } from "react";

/* Avviso in basso per 5 secondi, con "Annulla" quando serve: le cancellazioni si fanno subito e si possono disfare. */
type Show = (msg: string, undo?: () => void) => void;
const Ctx = createContext<Show>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; undo?: () => void; k: number } | null>(null); const timer = useRef(0);
  const show: Show = (msg, undo) => { clearTimeout(timer.current); setT({ msg, undo, k: Date.now() }); timer.current = window.setTimeout(() => setT(null), 5000); };
  return <Ctx.Provider value={show}>
    {children}
    {t && <div key={t.k} className="toast" role="status"><span>{t.msg}</span>
      {t.undo && <button type="button" onClick={() => { t.undo!(); clearTimeout(timer.current); setT(null); }}>Annulla</button>}</div>}
  </Ctx.Provider>;
}
