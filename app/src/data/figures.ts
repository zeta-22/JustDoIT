/* Esercizi con animazione approvata: chiave della posa in engine/FIG + muscoli (p = principali, s = secondari).
   Gli esercizi non elencati qui mostrano solo la scheda testuale finché non viene creata la loro animazione. */
export interface FigInfo { fig: string; p: string[]; s: string[] }
export const FIGS: Record<string, FigInfo> = {
  rdl: { fig: "rdl", p: ["femorali", "glutei"], s: ["erettori", "avambracci"] },
  bulgaro: { fig: "bss", p: ["quadricipiti", "glutei"], s: ["adduttori", "femorali"] },
  copenhagen: { fig: "cop", p: ["adduttori"], s: ["obliqui", "addominali"] },
  rematore_manubrio: { fig: "row", p: ["dorsali"], s: ["bicipiti", "deltoidi", "trapezi", "avambracci"] },
  face_pull: { fig: "face", p: ["deltoidi", "trapezi"], s: ["dorsali"] },
  farmer: { fig: "farmer", p: ["avambracci", "trapezi"], s: ["addominali", "obliqui"] },
  pallof: { fig: "pallof", p: ["obliqui", "addominali"], s: ["pettorali"] },
  collo: { fig: "neck", p: ["trapezi"], s: [] },
  dead_bug: { fig: "deadbug", p: ["addominali"], s: ["obliqui"] },
  tgu: { fig: "tgu", p: ["deltoidi"], s: ["addominali", "obliqui", "glutei"] },
  calf_mono: { fig: "calf", p: ["polpacci"], s: [] },
  calf_seduto: { fig: "calf", p: ["polpacci"], s: [] },
  tibialis: { fig: "tib", p: ["tibiale"], s: [] },
  // gruppo 1, approvato da Matteo il 24/11 (docs/prototipi/revisione-animazioni-1.html)
  nordic: { fig: "nordic", p: ["femorali"], s: ["glutei", "polpacci"] },
  trap_bar: { fig: "trapbar", p: ["glutei", "quadricipiti", "femorali"], s: ["erettori", "trapezi", "avambracci"] },
  hip_thrust: { fig: "hipthrust", p: ["glutei"], s: ["femorali", "quadricipiti"] },
  sl_rdl: { fig: "slrdl", p: ["femorali", "glutei"], s: ["adduttori", "erettori", "obliqui"] },
  kb_swing: { fig: "swing", p: ["glutei", "femorali"], s: ["erettori", "avambracci", "addominali"] },
  front_squat: { fig: "fsquat", p: ["quadricipiti", "glutei"], s: ["addominali", "erettori", "adduttori"] },
  jump_squat: { fig: "jump", p: ["quadricipiti", "glutei"], s: ["polpacci"] },
  mtp: { fig: "mtp", p: ["glutei", "quadricipiti", "femorali"], s: ["trapezi", "avambracci", "erettori"] },
  panca: { fig: "bench", p: ["pettorali"], s: ["tricipiti", "deltoidi"] },
  trazioni_gi: { fig: "pullup", p: ["dorsali", "avambracci"], s: ["bicipiti", "trapezi"] },
  trazioni: { fig: "pullup", p: ["dorsali"], s: ["bicipiti", "trapezi", "avambracci"] },
};
