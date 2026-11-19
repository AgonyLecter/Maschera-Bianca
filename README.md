# Maschera Bianca

Gioco horror/stealth in un unico file HTML.

## Struttura

| File | Cosa contiene |
|---|---|
| `src/index.html` | **Sorgente leggibile.** Tutte le modifiche al gioco vanno fatte qui. |
| `index.html` | **File pubblicato**, generato dalla build: JavaScript minificato e cifrato, configurazione Firebase cifrata, blocco di tasto destro / F12 / Ctrl+U / strumenti per sviluppatori. Non modificarlo a mano. |
| `build.mjs` | Script di build (`src/index.html` → `index.html`). |
| `firebase/database.rules.json` | Regole di sicurezza consigliate per il Realtime Database (nodo `horrorGame`). |

## Build

```bash
npm install
npm run build
```

Ogni build usa chiavi di cifratura nuove, quindi `index.html` cambia anche se il sorgente non cambia.

## Sicurezza: cosa protegge davvero

La protezione lato browser (cifratura, blocco dell'ispezione) **scoraggia** i curiosi ma non può fermare chi è determinato: il browser deve comunque poter eseguire il codice. La `apiKey` di Firebase, inoltre, non è un segreto: identifica solo il progetto.

La vera protezione dei dati sono le **regole del database**. Per applicarle:
Firebase Console → Realtime Database → Regole → incolla il blocco `horrorGame` di `firebase/database.rules.json` dentro le regole esistenti (se nel progetto ci sono altre app, non sostituire le loro regole) → Pubblica.

Le regole limitano lunghezza dei nomi, valori dei punteggi, statistiche (solo +1) e impediscono di scrivere i contenuti (`content/motd`).
