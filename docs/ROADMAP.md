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
- Scheda "Altro": stato della sincronizzazione, accesso/uscita, backup su file (scarica/importa)

## Prossimi passi
0. Piano rapido approvato: vedi `docs/PIANO-APP.md`
1. **Pubblicazione su Vercel** e installazione sul telefono
3. **Libreria esercizi completa**: muscoli principali/secondari, indicazioni per fase (partenza/discesa/basso/risalita), regressioni, fonti — estratti da `docs/ricerca/2-*.md`
4. **Animazioni per tutti i 71 esercizi** (pose in `engine/figure.js` → `FIG`), a gruppi, con revisione; vista frontale per Pallof, Y-T-W, band pull-apart
5. Ritocchi personaggio: busto più pieno di profilo, meno linee sugli arti, glutei più leggibili sui pantaloncini
6. Progressione suggerita (doppia progressione su RIR) e grafici dei carichi
7. Parte Ironman: registro nuoto / bici / corsa, piano che si adatta ai risultati
8. Data della gara modificabile → ricalcolo del calendario (piani B in `docs/ricerca/4-piano-finale.md`)
