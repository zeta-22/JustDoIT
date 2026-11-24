# JustDoIT — istruzioni per Claude

## Chi e cosa
App personale di Matteo (cintura blu avanzata BJJ, ~78 kg). Obiettivo 1: vincere una gara gi IBJJF a metà/fine gennaio 2027 (anche no-gi). Obiettivo 2: Ironman sotto le 10 ore in circa 2 anni. La palestra è 2 sedute/settimana da ~90'. Uso personale, non distribuita. Usa l'app da Android.
Comunica in italiano, in modo semplice; spiega le scelte (vuole capire, non subire automatismi).

## Stack
- `app/`: React 18 + TypeScript + Vite + vite-plugin-pwa. Niente librerie UI: CSS a mano in `src/index.css` con i token in `:root`.
- Dati: `src/lib/store.ts`: scrive in localStorage e mette ogni modifica in coda; `sync()` la manda a Supabase (progetto JustDoIt, tabella `records` con RLS, `supabase/schema.sql`). Accesso con email e password. App online: https://just-do-it-psi.vercel.app (Vercel pubblica `main`).
- Libreria esercizi (muscoli e regressioni per tutti): `src/data/library.ts`. Carico consigliato: `src/lib/progress.ts`. Data gara e fasi: `src/lib/plan.ts`.
- Piano: `src/data/piano.json` (fonte unica per fasi/sedute/esercizi). Tipi e utility in `src/lib/plan.ts`.
- Schermate in `src/screens/` (Today, Session, Plan, Progress, Library, Profile), navigazione e tasto Indietro in `src/App.tsx`; logica della seduta (gruppi/superserie, prossima serie, proposte, record) in `src/lib/session.ts`; giorno e fase in `src/lib/today.ts`; formati italiani in `src/lib/format.ts`.
- Grafica approvata il 24/11 (`docs/prototipi/rinnovo-ux.html`): blu "cintura" per azioni e progresso (verde acqua nel blocco Ironman), **rosso e arancio solo per i muscoli**, icone a tratto in `components/Icon.tsx`, Barlow Condensed solo per numeri e titoli, niente librerie UI.
- Animazioni: `src/engine/figure.js` (JS, `@ts-nocheck`).
  - `FIG[key]` = `{ poses:[A,B], t1,t2,h1,h2 | loop, props }`. Una posa: `hip`, `t` (inclinazione busto, gradi), `hd`, `legs:[{f:[x,y], b:[bx,by], fa}]` (IK verso il piede), `arms:[{h:[x,y], b} | {u,f}]`. Indice 0 = arti vicini (scuri), 1 = lontani. Suolo a y=130, viewBox 200×140, personaggio rivolto a destra.
  - Personaggio in uso: `heroFlat` in `src/engine/flat.js` ("Atleta flat": corpo grigio semplice, muscoli unico colore). `hero` in figure.js è il vecchio stile fumetto.
  - `hero(s, {p,s}, opacità)` disegna il personaggio stile fumetto con i muscoli colorati. Muscoli supportati: glutei, femorali, quadricipiti, adduttori, polpacci, tibiale, erettori, addominali, obliqui, dorsali, pettorali, deltoidi, tricipiti, bicipiti, avambracci, trapezi.
  - `src/data/figures.ts` collega un esercizio del piano alla sua animazione e ai muscoli. Mostra un'animazione SOLO se è stata controllata: una figura sbagliata è peggio di nessuna.
- Stile del personaggio approvato da Matteo (24/11): "Atleta flat", corpo grigio con pochissimi dettagli così si vedono i muscoli; rosso = principali, arancio = secondari. Confronto: `docs/prototipi/confronto-personaggi.html`. Le animazioni nuove passano da una pagina di revisione (`docs/prototipi/src/build-confronto.mjs revisione ...`) prima di entrare in `figures.ts`.

## Regole del dominio (non cambiarle senza chiedere)
- Ogni seduta ha 3 volumi Basso/Medio/Alto: cambia solo il numero di serie/esercizi, MAI l'RPE/RIR.
- Dal 15 gennaio 2027 niente volume Alto. Dolore > 3/10 vince su tutto: volume Basso e via l'esercizio che lo provoca.
- Peso: mai tagli d'acqua (pesata subito prima del primo incontro). Limiti IBJJF con divisa.
- La ricerca e le fonti sono in `docs/ricerca/`; prima di cambiare dosaggi o esercizi, controlla lì.

## Lavoro
- `cd app && npm install && npm run build` deve passare prima di ogni commit.
- Prova le schermate a 390 px di larghezza (telefono).
- Roadmap in `docs/ROADMAP.md`: aggiornala quando chiudi un punto.
