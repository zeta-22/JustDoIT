# JustDoIT

App personale di allenamento: blocco palestra per la gara di BJJ (gennaio 2027), poi circa due anni di preparazione Ironman.
App web installabile su Android (PWA), React + TypeScript + Vite.

## Struttura
- `app/` — l'app (`npm install`, `npm run dev`, `npm run build`)
- `app/src/data/piano.json` — il piano completo (fasi, sedute, esercizi, regole), generato dalla ricerca
- `app/src/engine/figure.js` — motore delle animazioni (scheletro 2D + personaggio stile fumetto + mappa muscoli)
- `docs/ricerca/` — ricerca e programmi da cui nasce il piano, con le fonti
- `docs/prototipi/` — prototipi HTML del personaggio e della prima versione
- `docs/ROADMAP.md` — cosa c'è e cosa manca
- `CLAUDE.md` — istruzioni per Claude Code

## Pubblicazione (Vercel)
Importa il repository su vercel.com, imposta **Root Directory = `app`**. Framework: Vite (rilevato da solo).
Sul telefono: apri l'indirizzo in Chrome → menu ⋮ → "Installa app".
