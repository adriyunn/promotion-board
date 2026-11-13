# Promotion Board Prep: C Co, 2-12 IN

Study material for the **20 Nov 2026** battalion E-5 promotion board.

| What | Where |
|---|---|
| Study guide (PDF, 26 sections) | `2026_E5_Board_Study_Guide_C-2-12IN.pdf` |
| Study app (website) | `docs/`, served by GitHub Pages at **https://adriyunn.github.io/promotion-board/** |
| Study app (offline backup, one file) | `Steadfast_Board_Prep_offline.html` |

## The app: STEADFAST · Board Prep

- **Quick 10**: 10 mixed multiple-choice questions.
- **Due today**: spaced review. A missed question comes back the next day, then 2 days later, then 3 days later.
- **Board Sim**: 15 mixed typed questions (2 situational), no answers until the end, then you grade yourself.
- **Topics**: all 24 study sections plus the corrections to old notes, as multiple choice or typed answers.
- **Test**: choose the format, source (all / due / missed / favorites), topics and question count.
- **Library**: the full guide, a Must-know review list, the official publication list, and fill-in fields for your chain of command and your "tell us about yourself" answer.
- **Progress**: per-section progress, plus a reset button.

Progress, favorites and the names you type in stay only on your phone (browser storage).

### Turn on the website (one time)

1. GitHub → this repo → **Settings → General → Danger Zone → Change visibility → Public**.
2. **Settings → Pages** → Source **Deploy from a branch** → Branch `claude/beautiful-cannon-hpowk0`, folder **`/docs`** → **Save**.
3. Wait about a minute, then open https://adriyunn.github.io/promotion-board/.

### Put it on your home screen

- **iPhone (Safari):** open the site → Share → **Add to Home Screen**.
- **Android (Chrome):** open the site → ⋮ menu → **Add to Home screen** / **Install app**.

After the first visit it works without signal.

**Add it to your home screen first, then study only from the home-screen icon.** On iPhone the home-screen app keeps its own storage, separate from the Safari tab, so progress made in Safari won't carry over.

### Offline backup file

Download `Steadfast_Board_Prep_offline.html` to your phone and open it in the browser. It needs no internet at all. On iPhone, progress may not be saved when it's opened as a file, so use the website as your main copy.

## Rebuild after editing the guide

The guide lives in `guide/sections/*.html`, and the app's questions and library come from the same files.

```bash
npm run build:pdf   # rebuild the PDF
npm run build       # rebuild app data, service worker and the offline file
npm test            # unit + browser tests
npm run serve       # preview the app at http://localhost:4173
```

Wrong answers for multiple choice are hand-written in `app/distractors.json`, keyed by question id (for example `sharp-01`).
