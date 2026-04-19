# 🎼 Notenlesen lernen

Eine Web-App zum Notenlesen-Üben für Kinder. Optimiert für Tablets, komplett auf Deutsch.

## Funktionen

- **Violinschlüssel**, **Bassschlüssel** oder **gemischt**
- Optional **mit Vorzeichen** (♯ und ♭)
- Eingabe per **Klavier** oder **Notenbutton** (C, Cis, D, Es, E, F, Fis, G, As, A, B, H)
- Audio-Feedback: bei richtiger Antwort erklingt die Note, bei falscher ein leiser Fehlerton
- Punktezähler, Fortschrittsbalken, Sterne-Bewertung und Konfetti am Ende
- Modi: 10, 20, 30 Noten oder ∞ Endlos
- Tabletfreundliche, scroll-freie Vollbild-Ansicht

## Entwicklung

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
```

## Tests (Playwright)

```bash
npx playwright install chromium  # einmalig
npm test
```

## Stack

- Vite + React + TypeScript
- [VexFlow](https://www.vexflow.com/) für die Notendarstellung
- [Tone.js](https://tonejs.github.io/) für den Klavierklang
- [Playwright](https://playwright.dev/) für End-to-End-Tests

## Notennamen (Deutsch ↔ Englisch)

| Deutsch | Englisch |
|---------|----------|
| H       | B        |
| B       | B♭       |
| Cis     | C♯       |
| Es      | E♭       |

(VexFlow rendert intern in englischer Notation, die App-Oberfläche ist durchgehend deutsch.)
