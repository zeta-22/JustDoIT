# Roadmap

## v0.1 — fatto
- Oggi: fase attuale dal calendario, scelta seduta, check-in del volume (punteggio), anteprima seduta
- Seduta guidata: serie con kg / ripetizioni / RPE, carichi precompilati dall'ultima volta, timer di recupero automatico, segnalazione dolore > 3/10, note
- Piano: tutte le fasi BJJ, transizione e Ironman, con volume Basso/Medio/Alto, regole, alimentazione, segnali di allarme
- Peso: pesata del mattino, media 7 giorni, semaforo categoria (gi/no-gi, peso della divisa)
- Storico sedute
- Scheda esercizio con animazione e mappa muscoli per 13 esercizi
- Dati salvati sul telefono (localStorage), installabile come app

## v0.2 — fatto (23 novembre)
- Personaggio "Atleta flat" approvato e usato nell'app (`engine/flat.js`): corpo grigio semplice, muscoli unico colore
- Dati online su Supabase (`supabase/schema.sql`, tabella `records` con RLS), accesso con link via email, funziona offline e sincronizza al ritorno della rete
- Scheda "Altro": stato della sincronizzazione, accesso con email e password (o link), backup su file (scarica/importa)
- Collegamento verificato il 24/11: pesate e impostazioni arrivano su Supabase (progetto JustDoIt, app su just-do-it-psi.vercel.app)

## v0.3 — fatto (24 novembre)
- Libreria esercizi (`data/library.ts`): muscoli principali/secondari e versione più facile per tutti i 71 esercizi; mappa muscoli in ogni scheda
- Dolore > 3/10: ferma l'esercizio, porta a Basso il resto della seduta, propone la versione più facile
- Carico consigliato (doppia progressione su RPE, `lib/progress.ts`) e istruzioni per trovare il carico la prima volta
- Data gara modificabile (Altro): fasi ricalcolate, niente Alto da gara−8, piani B; scheda "Settimana gara" negli ultimi 14 giorni
- Grafici: peso (pesate, media 7 giorni, limite) e progressi per esercizio
- Diario nuoto/bici/corsa: registro, passo, riepilogo settimanale, avviso +10%, ore/settimana (sincronizzato)
- 10 animazioni nuove approvate e nell'app (`docs/prototipi/revisione-animazioni-1.html`): Nordic, trap bar, hip thrust, single-leg RDL, swing, front squat, jump squat, mid-thigh pull, panca, trazioni

## v0.4 — fatto (25 novembre)
- Vista da dietro (`engine/back.js`, figure con `view: "back"` in figures.ts) per i movimenti che di profilo non si capiscono
- Gruppo 2 di animazioni approvato e nell'app, 34 esercizi animati su 71 (`docs/prototipi/revisione-animazioni-2.html`): extrarotazioni e band pull-apart (da dietro), rematore col gi, chest-supported row, Zercher, hang clean, box jump, rollout, corda, Spanish squat
- Ritocchi gruppo 1: trazioni (viso libero), hip thrust (glutei visibili), swing (kettlebell in linea con il braccio)
- Schermo sempre acceso durante la seduta (Wake Lock, se il telefono lo permette)
- Tolti da piano.json i campi `fig` (inutilizzati e in parte sbagliati): le animazioni stanno solo in figures.ts
- Estensioni delle dita: niente animazione (movimento della sola mano), restano testo e mappa muscoli

## Rinnovo grafica e UX — approvato tutto il 24 novembre (D1–D6 come consigliato)
- Analisi e confronto con Hevy, Strong, Fitbod, TrainingPeaks, Whoop; mockup delle schermate nuove: `docs/prototipi/rinnovo-ux.html` (schermate attuali in `docs/prototipi/rinnovo/`)
- Sei decisioni da approvare (D1–D6), poi 3 fasi: 1 fondamenta + seduta (prima della prova in palestra), 2 progressi + libreria esercizi + diario tatami (dicembre), 3 rifiniture e promemoria (dopo la gara)
- Fatto subito (24/11): conteggio delle serie (`setCount`, `volFor`, `planWeek` in `lib/plan.ts`): "3 giri", "2 tenute", "4 round", "3 × 8 + 1 × 15", piramidi "5-3-1", "P1 … / P2 …", "come MEDIO" e le voci per settimana "S1 … · S2 …" (Nordic, Copenhagen, collo). Pulsante "+ Aggiungi serie" in ogni esercizio
- **Fase 1 — fatta sul ramo `claude/loving-fermi-tjov7d`, da provare prima di main** (24/11):
  - colori nuovi (blu cintura per le azioni, verde acqua nel blocco Ironman, rosso/arancio solo muscoli), icone (`components/Icon.tsx`), formati italiani (`lib/format.ts`)
  - barra in basso Oggi · Piano · Esercizi · Progressi · Profilo; il tasto Indietro chiude la scheda, riduce la seduta, torna a Oggi (`App.tsx`)
  - Oggi: giorno della settimana → seduta del giorno (`lib/today.ts`), conto alla rovescia e barra della fase a forma di cintura, settimana con i pallini, check-in del mattino con la pesata
  - Seduta: si apre in cima, esercizi fatti chiusi, superserie in un blocco, colonna "Prima", valori proposti accettati con ✓, menu ⋯ (scheda, versione più facile, serie in più/in meno, dolore), riscaldamento da spuntare, vibrazione (`screens/Session.tsx`, `lib/session.ts`)
  - Timer: compare solo nel recupero, recupero del piano, −15″/+15″/Salta, prossima serie, si riduce a pillola
  - Riepilogo: durata, serie, kg totali, record (1RM stimato), RPE della seduta, muscoli lavorati; "Elimina" chiede conferma; nel diario si annulla per 5″
  - Esercizi: libreria dei 71 con ricerca, filtri e miniature; la scheda mostra le ultime volte
  - Progressi (palestra, resistenza, peso) e Profilo (gara, categoria, account, backup) prendono il posto di Diario, Peso e Altro

## Prossimi passi
1. **Analisi generale di grafica e UX** e rinnovo (in una chat nuova): confronto con le migliori app di allenamento, prototipo da approvare, rinnovo a pezzi
2. **Gruppo 3** entro il 20 dicembre: kit Messico (piegamenti, inverted row, pistol, broad jump), mobilità (90/90, dorsiflessione, McGill, open book/couch), adductor squeeze, snapdown; poi Y-T-W da dietro ed esercizi Ironman
3. Prova sul campo: una settimana in palestra + prova in modalità aereo prima del Messico
4. Ironman vero (dopo la gara): ricerca nuoto/bici/corsa e valutazione sub-10 h, piano settimanale che si adatta al diario (oggi c'è solo il registro)
5. Notifiche/promemoria (pesata del mattino, timer a schermo spento) — da valutare
