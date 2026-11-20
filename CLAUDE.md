# JustDoIT — istruzioni per Claude

## Chi e cosa
App personale di Matteo (cintura blu avanzata BJJ, ~78 kg). Obiettivo 1: vincere una gara gi IBJJF a metà/fine gennaio 2027 (anche no-gi). Obiettivo 2: Ironman sotto le 10 ore in circa 2 anni. La palestra è 2 sedute/settimana da ~90'. Uso personale, non distribuita. Usa l'app da Android.
Comunica in italiano, in modo semplice; spiega le scelte (vuole capire, non subire automatismi).

## Stack
- `app/`: React 18 + TypeScript + Vite + vite-plugin-pwa. Niente librerie UI: CSS a mano in `src/index.css` con i token in `:root`.
- Dati: `src/lib/store.ts` (localStorage). Ogni accesso ai dati passa da lì: quando arriva Supabase si cambia solo quel file.
- Piano: `src/data/piano.json` (fonte unica per fasi/sedute/esercizi). Tipi e utility in `src/lib/plan.ts`.
- Animazioni: `src/engine/figure.js` (JS, `@ts-nocheck`).
  - `FIG[key]` = `{ poses:[A,B], t1,t2,h1,h2 | loop, props }`. Una posa: `hip`, `t` (inclinazione busto, gradi), `hd`, `legs:[{f:[x,y], b:[bx,by], fa}]` (IK verso il piede), `arms:[{h:[x,y], b} | {u,f}]`. Indice 0 = arti vicini (scuri), 1 = lontani. Suolo a y=130, viewBox 200×140, personaggio rivolto a destra.
  - `hero(s, {p,s}, opacità)` disegna il personaggio stile fumetto con i muscoli colorati. Muscoli supportati: glutei, femorali, quadricipiti, adduttori, polpacci, tibiale, erettori, addominali, obliqui, dorsali, pettorali, deltoidi, tricipiti, bicipiti, avambracci, trapezi.
  - `src/data/figures.ts` collega un esercizio del piano alla sua animazione e ai muscoli. Mostra un'animazione SOLO se è stata controllata: una figura sbagliata è peggio di nessuna.
- Stile del personaggio approvato da Matteo: fumetto, contorno nero spesso, fisico atletico, muscoli disegnati, rosso = principali, arancio = secondari. Prototipo di riferimento: `docs/prototipi/personaggio-stacco-rumeno.html`.

## Regole del dominio (non cambiarle senza chiedere)
- Ogni seduta ha 3 volumi Basso/Medio/Alto: cambia solo il numero di serie/esercizi, MAI l'RPE/RIR.
- Dal 15 gennaio 2027 niente volume Alto. Dolore > 3/10 vince su tutto: volume Basso e via l'esercizio che lo provoca.
- Peso: mai tagli d'acqua (pesata subito prima del primo incontro). Limiti IBJJF con divisa.
- La ricerca e le fonti sono in `docs/ricerca/`; prima di cambiare dosaggi o esercizi, controlla lì.

## Lavoro
- `cd app && npm install && npm run build` deve passare prima di ogni commit.
- Prova le schermate a 390 px di larghezza (telefono).
- Roadmap in `docs/ROADMAP.md`: aggiornala quando chiudi un punto.
