/* Libreria esercizi: muscoli (p = principali, s = secondari) e versione più facile (regressione).
   Muscoli e regressioni presi da docs/ricerca/2-bjj-dettagli.md e 2-ironman-dettagli.md (schede "Muscoli" e "Regressioni").
   Nomi dei muscoli: gli stessi del motore delle figure (engine/flat.js) e della mappa fronte/retro.
   kind "cond" = condizionamento o sport (lavora tutto il corpo: niente mappa). */
export interface LibInfo { p: string[]; s: string[]; reg?: string; kind?: "cond" }

export const LIB: Record<string, LibInfo> = {
  // riscaldamento e mobilità
  mob_90_90: { p: ["glutei", "adduttori"], s: [], reg: "90/90 con le mani appoggiate a terra dietro, ampiezza ridotta." },
  dorsiflessione: { p: ["polpacci"], s: ["tibiale"], reg: "Ampiezza ridotta: il ginocchio avanza solo finché il tallone resta giù." },
  mcgill: { p: ["addominali", "obliqui"], s: ["erettori", "glutei"], reg: "Curl-up con meno tenuta e side plank sulle ginocchia." },
  bird_dog: { p: ["erettori", "glutei"], s: ["addominali", "deltoidi"], reg: "Solo braccia o solo gambe, una alla volta." },
  cossack: { p: ["adduttori", "quadricipiti"], s: ["glutei"], reg: "Ampiezza ridotta tenendo un appoggio davanti (rack o panca)." },
  tgu: { p: ["deltoidi"], s: ["addominali", "obliqui", "glutei", "tricipiti"], reg: "Solo la prima metà (fino alla mano a terra) oppure senza peso, con una scarpa sul pugno." },
  snapdown: { p: ["dorsali", "trapezi"], s: ["addominali", "avambracci"], reg: "Più lento, con elastico leggero e ampiezza ridotta." },
  mobilita_im: { p: ["pettorali", "quadricipiti"], s: ["deltoidi", "obliqui"], reg: "Tenute più brevi, senza forzare l'ampiezza." },
  // forza gambe e catena posteriore
  trap_bar: { p: ["glutei", "quadricipiti", "femorali"], s: ["erettori", "trapezi", "avambracci"], reg: "Kettlebell deadlift o RDL con manubri." },
  rdl: { p: ["femorali", "glutei"], s: ["erettori", "avambracci"], reg: "Cerniera d'anca con un bastone lungo la schiena, RDL con kettlebell, ponte glutei." },
  sl_rdl: { p: ["femorali", "glutei"], s: ["adduttori", "erettori", "obliqui"], reg: "RDL a due gambe, o con la punta del piede dietro appoggiata (kickstand)." },
  zercher: { p: ["quadricipiti", "glutei"], s: ["erettori", "addominali", "bicipiti"], reg: "Goblet squat (più facile da tenere dritto) o box squat." },
  front_squat: { p: ["quadricipiti", "glutei"], s: ["addominali", "erettori", "adduttori"], reg: "Goblet squat o box squat." },
  back_squat: { p: ["quadricipiti", "glutei"], s: ["adduttori", "erettori"], reg: "Goblet squat, box squat su panca, oppure leg press se la schiena dà fastidio." },
  bulgaro: { p: ["quadricipiti", "glutei"], s: ["adduttori", "femorali"], reg: "Split squat statico a terra, con una mano su una sbarra per l'equilibrio." },
  spanish_squat: { p: ["quadricipiti"], s: ["glutei"], reg: "Meno profondo (ginocchio a circa 60°) e tenute più brevi." },
  nordic: { p: ["femorali"], s: ["glutei", "polpacci"], reg: "Nordic con elastico che assiste, ampiezza parziale, o slider hamstring curl." },
  copenhagen: { p: ["adduttori"], s: ["obliqui", "addominali"], reg: "Adductor squeeze con palla tra le ginocchia, o leva corta con il ginocchio appoggiato." },
  adductor_squeeze: { p: ["adduttori"], s: ["addominali"], reg: "Spinta al 50% con una palla più morbida." },
  mtp: { p: ["glutei", "quadricipiti", "femorali"], s: ["trapezi", "avambracci", "erettori"], reg: "Spinta al 60–70% invece che massimale." },
  hip_thrust: { p: ["glutei"], s: ["femorali", "quadricipiti"], reg: "Glute bridge a terra a corpo libero." },
  // spinta e tirata
  panca: { p: ["pettorali"], s: ["tricipiti", "deltoidi"], reg: "Panca con manubri più leggeri o piegamenti." },
  piegamenti: { p: ["pettorali"], s: ["tricipiti", "deltoidi", "addominali"], reg: "Piegamenti con le mani rialzate su una panca." },
  trazioni_gi: { p: ["dorsali", "avambracci"], s: ["bicipiti", "trapezi"], reg: "Trazioni con elastico, negative lente di 5\" al gi, o appeso al gi 20–30\"." },
  trazioni: { p: ["dorsali"], s: ["bicipiti", "trapezi", "avambracci"], reg: "Lat machine, rematore inverso agli anelli o appeso attivo 3 × 15–30\"." },
  rope: { p: ["dorsali", "avambracci"], s: ["bicipiti", "addominali"], reg: "Rematore inverso alla corda o salita aiutandoti con le gambe." },
  rematore_gi: { p: ["dorsali", "avambracci"], s: ["bicipiti", "trapezi", "deltoidi"], reg: "Rematore con presa normale o inverted row alla corda." },
  cs_row: { p: ["dorsali"], s: ["trapezi", "bicipiti", "deltoidi"], reg: "Manubri più leggeri con pausa in alto." },
  rematore_manubrio: { p: ["dorsali"], s: ["bicipiti", "deltoidi", "trapezi", "avambracci"], reg: "Carico più leggero con il petto appoggiato a una panca inclinata." },
  inverted_row: { p: ["dorsali"], s: ["bicipiti", "trapezi", "addominali"], reg: "Corpo più verticale (piedi più vicini al punto di presa)." },
  pulldown_bt: { p: ["dorsali"], s: ["tricipiti", "addominali"], reg: "Con elastico leggero." },
  face_pull: { p: ["deltoidi", "trapezi"], s: ["dorsali"], reg: "Pull-apart con elastico leggero." },
  band_pull_apart: { p: ["deltoidi", "trapezi"], s: [], reg: "Elastico più leggero, braccia un po' piegate." },
  ytw: { p: ["trapezi", "deltoidi"], s: ["erettori"], reg: "Y-T-W a corpo libero sul pavimento o wall slides con elastico." },
  extrarot: { p: ["deltoidi"], s: ["trapezi"], reg: "Isometria: spingi il dorso della mano contro un muro, 5 × 10\"." },
  collo: { p: ["trapezi"], s: [], reg: "Chin tuck senza resistenza, intensità 30–40%." },
  estensioni_dita: { p: ["avambracci"], s: [], reg: "Elastico più leggero." },
  // trasporti e core
  farmer: { p: ["avambracci", "trapezi"], s: ["addominali", "obliqui"], reg: "Carico più leggero e tratti più brevi." },
  suitcase: { p: ["obliqui", "avambracci"], s: ["trapezi", "addominali", "glutei"], reg: "Carico più leggero, passi corti." },
  dead_bug: { p: ["addominali"], s: ["obliqui"], reg: "Gambe più alte, solo gambe, o palla tra coscia e braccio." },
  rollout: { p: ["addominali"], s: ["dorsali", "obliqui"], reg: "Rollout dalle ginocchia con ampiezza corta, o hollow con ginocchia piegate." },
  pallof: { p: ["obliqui", "addominali"], s: ["pettorali"], reg: "Tenuta isometrica senza distendere le braccia." },
  side_plank: { p: ["obliqui"], s: ["glutei", "addominali"], reg: "Side plank sulle ginocchia." },
  // potenza
  box_jump: { p: ["quadricipiti", "glutei"], s: ["polpacci"], reg: "Box più basso, o squat jump con stop in basso." },
  kb_swing: { p: ["glutei", "femorali"], s: ["erettori", "avambracci", "addominali"], reg: "Hip hinge con bastone o kettlebell deadlift." },
  hang_clean: { p: ["glutei", "quadricipiti", "trapezi"], s: ["femorali", "polpacci", "deltoidi"], reg: "Clean pull (senza ricezione) o kettlebell swing." },
  jump_squat: { p: ["quadricipiti", "glutei"], s: ["polpacci"], reg: "Squat jump con stop in basso, carico più leggero." },
  broad_jump: { p: ["glutei", "quadricipiti"], s: ["femorali", "polpacci"], reg: "Salti più corti con atterraggio fermo." },
  pistol: { p: ["quadricipiti", "glutei"], s: ["adduttori", "addominali"], reg: "Step-up più basso o pistol sedendosi su una panca." },
  // condizionamento e sport
  solo_drill: { p: [], s: [], kind: "cond", reg: "Ritmo più lento e pause più lunghe." },
  p1_match: { p: [], s: [], kind: "cond", reg: "Round più corti (4') o recupero più lungo." },
  p2_franchini: { p: [], s: [], kind: "cond", reg: "Meno ripetizioni o 15\"/15\"." },
  p3_long_hiit: { p: [], s: [], kind: "cond", reg: "30\"/60\"." },
  p4_sprint: { p: [], s: [], kind: "cond", reg: "Meno sprint, recupero più lungo." },
  p6: { p: [], s: [], kind: "cond", reg: "Meno giri, pause più lunghe." },
  corsa_facile: { p: ["quadricipiti", "polpacci"], s: ["glutei", "femorali"], kind: "cond", reg: "Corsa-cammino (per esempio 2' corsa / 1' cammino)." },
  nuoto_tecnica: { p: ["dorsali", "deltoidi"], s: ["tricipiti", "pettorali"], kind: "cond", reg: "Con pull-buoy o pinne, vasche più brevi." },
  // caviglia, piede, polpaccio
  calf_seduto: { p: ["polpacci"], s: [], reg: "Senza carico (solo peso delle gambe) e ampiezza ridotta se il tendine è irritabile." },
  calf_mono: { p: ["polpacci"], s: [], reg: "A due piedi, senza deficit, o solo eccentrica (sali con due, scendi con uno)." },
  tibialis: { p: ["tibiale"], s: [], reg: "Meno inclinato rispetto al muro, ampiezza ridotta." },
  pogo: { p: ["polpacci"], s: ["tibiale", "quadricipiti"], reg: "Calf raise veloci senza staccare i piedi, su superficie morbida." },
  corda: { p: ["polpacci"], s: ["avambracci", "deltoidi"], reg: "Saltelli molto bassi, anche senza corda." },
  bounding: { p: ["glutei", "polpacci"], s: ["femorali", "quadricipiti"], reg: "Skip, ginocchia alte o pogo." },
  drop_jump: { p: ["polpacci", "quadricipiti"], s: ["glutei"], reg: "Box più basso o pogo." },
  // anca (prevenzione corsa)
  leg_press_mono: { p: ["quadricipiti", "glutei"], s: ["femorali"], reg: "A due gambe, ampiezza ridotta." },
  flex_anca: { p: ["quadricipiti"], s: ["addominali"], reg: "Gamba tesa sollevata da supino, o ginocchio al petto in piedi senza carico." },
  abduzione: { p: ["glutei"], s: ["obliqui"], reg: "Clamshell con elastico o abduzione in piedi con elastico." },
  pelvic_drop: { p: ["glutei"], s: ["obliqui"], reg: "Ampiezza ridotta con una mano al muro." },
  passi_laterali: { p: ["glutei"], s: ["quadricipiti"], reg: "Elastico più leggero, sopra le ginocchia." },
  short_foot: { p: [], s: [], reg: "Da seduto invece che in piedi." },
  step_up: { p: ["quadricipiti", "glutei"], s: ["adduttori"], reg: "Gradino più basso." },
};

/** Esercizi che lavorano di più le gambe pesanti: l'aumento consigliato è 5 kg invece di 2,5. */
export const BIG_LIFTS = new Set(["trap_bar", "rdl", "zercher", "front_squat", "back_squat", "hip_thrust", "mtp", "leg_press_mono"]);
