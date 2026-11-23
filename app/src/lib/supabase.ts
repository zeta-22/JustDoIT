import { createClient } from "@supabase/supabase-js";

/* Indirizzo e chiave pubblica (publishable) del progetto: sono fatti per stare nell'app,
   la protezione dei dati la fa la Row Level Security in supabase/schema.sql.
   Si possono cambiare con VITE_SUPABASE_URL / VITE_SUPABASE_KEY su Vercel. */
const URL = import.meta.env.VITE_SUPABASE_URL || "https://fnnzutaqckgfimijjcaj.supabase.co";
const KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_BPrk_GbwUk56qMWxZmSc_w_LswzJob-";

export const sb = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
