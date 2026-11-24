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

## Prossimi passi
1. Ritocchi ai piccoli difetti visivi del gruppo 1 (segnalati da Matteo, da dettagliare)
2. **Animazioni mancanti** (~45): vista frontale per extrarotazioni, Y-T-W, band pull-apart, Pallof; poi kit Messico, mobilità, Ironman
3. Correggere i campi `fig` sbagliati in `piano.json` (es. panca → lm): non usati dall'app ma fuorvianti
4. Ironman vero (dopo la gara): ricerca nuoto/bici/corsa e valutazione sub-10 h, piano settimanale che si adatta al diario (oggi c'è solo il registro)
5. Notifiche/promemoria (pesata del mattino, timer a schermo spento) — da valutare
