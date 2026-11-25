import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { startSync, store } from "./lib/store";
import { startUpdates } from "./lib/update";
import { applyTheme } from "./lib/prefs";
applyTheme();
startSync();
/* "occupato" = seduta in corso o un campo in cui stai scrivendo: l'aggiornamento aspetta */
startUpdates(() => store.sessions().some(s => !s.finished) || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? ""));
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
