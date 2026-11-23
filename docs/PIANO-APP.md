# Piano per completare JustDoIT

Scritto il 23 novembre 2026 a partire dalle richieste fatte nella prima chat (17–20 novembre).

## Cosa avevi chiesto (la visione)
1. **Un'app sola** per allenarti: prima la gara BJJ (gennaio 2027), poi circa 2 anni di Ironman. Android, solo uso personale.
2. **Il piano dentro l'app**, con 3 volumi Basso/Medio/Alto per ogni seduta, scelti da te (anche con il check-in di 30″).
3. **In palestra**: seduta del giorno, serie con kg/ripetizioni/RPE, timer automatico, carichi suggeriti.
4. **Esercizi spiegati bene**: per tutti i 71 esercizi un personaggio a fumetto che esegue il movimento corretto, con i muscoli che lavorano colorati (rosso = principali, arancio = secondari), le fasi del movimento e i punti chiave presi dalla ricerca. "Una cosa completa, anche se ci vuole tempo."
5. **Peso e categoria**: pesata del mattino, media, semaforo per la categoria IBJJF, niente tagli d'acqua.
6. **Dolore > 3/10**: l'app ti propone la versione più facile.
7. **Data della gara modificabile**: il calendario si ricalcola (piani B già scritti).
8. **Parte Ironman**: registri nuoto, bici e corsa a mano, e il piano si adatta ai risultati.
9. **Tutto su GitHub/online**, niente sul Mac; i dati non devono perdersi cambiando telefono.

## Dove siamo (v0.1, già fatto)
Oggi + check-in, seduta guidata con serie e timer, piano completo, peso con semaforo, storico,
animazioni approvate per 13 esercizi su 71. Dati solo nel telefono (localStorage). Non ancora pubblicata.

## Il piano rapido (approvato il 23 novembre 2026)
Si procede veloce, a pezzi pubblicati subito: ogni pezzo con build verde viene unito su `main` e Vercel lo mette online.

**Decisioni prese:** progetto Supabase nuovo `justdoit` · accesso con link via email · merge su main a ogni pezzo · gara sabato 23 gennaio 2027, IBJJF (modificabile in app).

### Passo 0 — Salvare su GitHub (subito)
- Commit di `docs/PIANO-APP.md` (aggiornato con questo piano rapido) sul ramo, push, merge su main.

### Passo 1 — Personaggio: proposta nuova vs attuale (prima di estendere le animazioni)
Proposta da zero, "**Atleta flat**", ispirata alle app di esercizi in stile vettoriale piatto e ai rig "cutout" (Rive/Spine):
- Corpo diviso in **pezzi rigidi** (busto, bacino, coscia, gamba, piede, braccio, avambraccio, mano, testa) disegnati come tracciati curvi, ruotati sui perni dello scheletro esistente (`skel()` in `app/src/engine/figure.js`): niente più arti ricostruiti a contorno.
- **Nessun contorno nero spesso**: pelle a 2 toni (luce/ombra), maglietta e pantaloncini in pezzo unico sul bacino, proporzioni atletiche ~8 teste.
- **Muscoli dentro i pezzi con `clipPath`** (non escono mai dalla sagoma), rosso principali / arancio secondari, che si accendono nella fase di sforzo (concentrica).
- Riusa **le stesse pose `FIG`** e la stessa mappa muscoli → nessun lavoro perso, si cambia solo il "disegnatore".
- Consegna: pagina di confronto (`docs/prototipi/confronto-personaggi.html`, pubblicata anche come Artifact) con **stacco rumeno, affondo bulgaro, Copenhagen** affiancati: attuale (fumetto) vs nuova (flat). Matteo sceglie; il vincitore diventa `hero()` nel motore.

### Passo 2 — In palestra e online (giorno 1–2)
- Vercel: Matteo importa il repo (Root Directory `app`) — gli do i passi; aggiungo le variabili `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- Supabase: creo il progetto `justdoit` (regione eu), tabelle `sessions`, `weights`, `settings` (jsonb + `user_id`, RLS `auth.uid() = user_id`), via migrazioni MCP.
- `app/src/lib/store.ts`: stessa interfaccia, ma cache locale (localStorage) + sincronizzazione con Supabase in coda → funziona **offline** (palestra, Messico) e si allinea al ritorno della rete. Schermata login con magic link. Esporta/importa backup JSON.
- **Test di calibrazione carichi** nella prima settimana (dal piano RPE/RIR → kg di partenza).

### Passo 3 — Funzioni che mancano (giorno 2–3)
- **Dolore > 3/10** → volume Basso per il resto della seduta + proposta della regressione (`exercises` in `piano.json`).
- **Carico consigliato** per la volta dopo (doppia progressione su RIR), basato su `store.lastFor()`.
- **Data gara modificabile** (impostazioni) → ricalcolo date fasi in `app/src/lib/plan.ts` (`START`, `currentPhaseId`); dal 15/1 (gara −8 gg) niente volume Alto.
- Grafici semplici in SVG a mano: carico per esercizio, peso (media 7 gg) vs limite categoria.
- Vista **settimana gara**.

### Passo 4 — Libreria esercizi + 71 animazioni (giorno 3–7, a gruppi)
- Estraggo da `docs/ricerca/2-*.md` per ogni esercizio: muscoli p/s, fasi (partenza/discesa/basso/risalita), punti chiave, errori, regressioni, fonti → in `piano.json` (`exercises`) e `app/src/data/figures.ts`.
- Animazioni a **gruppi di ~10** in ordine: blocco gara attuale → kit Messico → riscaldamento/mobilità → Ironman. Vista frontale per Pallof, Y-T-W, band pull-apart.
- Ogni gruppo: controllo io con screenshot (Playwright, 390 px), pagina di revisione per Matteo, entra in app **solo se approvato** (regola CLAUDE.md: meglio nessuna figura che una sbagliata).

### Passo 5 — Ironman (dopo, ma pronto prima di febbraio)
- Ricerca su nuoto/bici/corsa e realismo sub-10h → `docs/ricerca/5-endurance.md`.
- Registro nuoto/bici/corsa, test (CSS, FTP, soglia corsa), zone, settimana proposta che si adatta.

### Fuori dall'app, ma da ricordare
- Il risultato in gara dipende soprattutto dal tatami (game plan, sparring, regolamento): eventualmente una sezione a parte.
- Verificare limiti di peso e federazione della tua gara; scelta categoria con le condizioni già decise (misura grassa, controllo al 20 dicembre).

## Decisioni ancora aperte
- Personaggio: fumetto attuale o nuova proposta "Atleta flat" (si decide dalla pagina di confronto).
- Categoria: Médio gi / Leve gi con le condizioni.
