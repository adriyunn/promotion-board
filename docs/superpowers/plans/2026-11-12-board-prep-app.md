# Board Prep App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone-first study web app (GitHub Pages and a single offline HTML file) that drills the user on their 26-section E-5 board guide with multiple-choice and self-graded typed questions, weak-spot tracking and progress.

**Architecture:** A Node build script extracts the question bank and library content from `guide/sections/*.html` into JSON under `docs/data/`. The app is vanilla ES-module JavaScript in `docs/` with no runtime dependencies: pure logic modules (store, quiz engine) are unit-tested with `node:test`, and views are plain render functions behind a hash router, tested with Playwright. A second script inlines everything into one self-contained HTML file.

**Tech Stack:** Node 22 (`node:test`, no npm deps), vanilla JS/CSS/HTML, Playwright (pre-installed, `require('playwright')`), service worker and web app manifest.

**Spec:** `docs/superpowers/specs/2026-11-12-board-prep-app-design.md`

## Global Constraints

- Board date: **2026-11-20**. Countdown and the plan use it.
- App name: **"STEADFAST · Board Prep"** (from the PDF cover). Never "Next Rank" or that app's branding.
- Colors: black `#121412` background, gold `#f2c200`, ivy `#2f5d3a` / `#1d3b25`. Fonts: `Inter`, `Inter Display`, falling back to `system-ui, sans-serif`.
- Tag colors as in `guide/style.css` (`.t-must` gold, `.t-know` ivy, `.t-bonus` gray, `.t-verify` amber, `.t-local` blue, `.t-fixed` red, `.t-new` light green). Reuse those class names.
- Tabs: **Home · Topics · Test · Library · Progress**.
- No audio, no AI or keyword grading, no backend, no accounts, no npm runtime dependencies.
- Every answer shown in the app is text from the guide. Items with a *Verify* or *Local* tag in the guide show that tag in the app.
- All user state lives in `localStorage` under the single key `steadfast.v1`.
- Phone-first: designed at a 390 px width. Tap targets are at least 44 px.
- Categories (exact labels and section keys):
  - `Board & Basics`: creeds, board, coc, nco, basics
  - `Leadership & Policy`: leadership, regs, sharp, wear, promo, benefits
  - `Fitness & Training`: h2f, training
  - `Soldier Skills`: tactics, acronyms, weapons, systems, comms, firstaid, landnav, drill
  - `Unit & History`: unit, wars
  - `Situational`: scenarios
  - `Corrections`: corrections (from `start.html`)

## Review Focus

1. **Storage unavailable** (iOS `file://`, private mode, quota): the app must still run with in-memory state, showing a one-line banner "Progress won't be saved on this device." → test in Task 3.
2. **Empty or short pools** (Missed or Favorites is empty, or the count is larger than what's available): start with what exists, or show "Nothing here yet" with no blank session → test in Task 4.
3. **Typed answer left blank:** Check still reveals the model answer and the self-grade buttons → test in Task 6.
4. **Leaving mid-session or reloading:** each answer is saved when it's graded, not at the end → test in Task 6.
5. **Guide markup inside answers:** tag spans (`VERIFY`, `LOCAL`) must become item tags, not answer text, and no HTML or `{{REF:…}}` tokens may leak into choices → test in Task 1.

---

### Task 1: Question bank extractor

**Files:**
- Create: `guide/order.js`: exports the section `ORDER` array (move it from `guide/build.js`, which then `require`s it)
- Create: `app/build-data.js`: CLI that writes `docs/data/bank.json`
- Create: `app/extract.js`: pure functions
- Test: `app/test/extract.test.js`

**Interfaces:**
- Produces: `extractQAs(html: string, section: string) -> Item[]`, `extractScenarios(html) -> Item[]`, `extractCorrections(html) -> Item[]`, `stripTags(html) -> {text: string, tags: string[]}`
- `Item = { id: string, section: string, category: string, q: string, a: string, tags: string[], mc: boolean, choices?: string[] }`. `id` = `${section}-${nn}` (two-digit, in document order, e.g. `sharp-01`). Scenarios: `scenarios-${nn}`, `mc:false`. Corrections: `corrections-${nn}`, where q = "Correct this: <old note>", a = correct answer text.
- `{{REF:key}}` tokens resolve to section numbers using `guide/order.js`.

- [ ] **Step 1: Write failing tests:** `stripTags('AR 600-52. <span class="tag t-verify">Verify</span>')` → `{text:'AR 600-52.', tags:['verify']}`. `extractQAs` on `guide/sections/sharp.html` returns items where `[0]` = `{id:'sharp-01', q:'What regulation covers SHARP?', a:'AR 600-52.'}`, and the count equals the number of `class="qa"` in that file. `extractCorrections(start.html).length === 13`, and `[1].a` contains `Unit`. `extractScenarios(scenarios.html).length === 21` and all have `mc === false`. Across all sections, no `q`/`a` contains `<`, `{{` or `VERIFY`.
- [ ] **Step 2:** `node --test app/test` → FAIL (module missing).
- [ ] **Step 3:** Implement with regexes over the known markup (`<div class="qa"><div class="q">…</div><div class="a">…</div></div>`, scenario table rows `<tr><td>…</td><td>…</td></tr>`, and correction rows starting with `t-fixed`). Decode `&amp;`, `&nbsp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`.
- [ ] **Step 4:** `node --test app/test` → PASS. `node app/build-data.js` writes `docs/data/bank.json` (about 198 items). `node guide/build.js` still renders the PDF.
- [ ] **Step 5:** Commit `feat: extract question bank from guide`.

### Task 2: Multiple-choice wrong answers

**Files:**
- Create: `app/distractors.json`: `{ "<item id>": ["wrong 1", "wrong 2", "wrong 3"] }`
- Modify: `app/build-data.js`: merge them in (`mc:true` and `choices` = answer + 3 wrong, unshuffled, correct answer first) for ids in the file. Other items get `mc:false`.
- Test: `app/test/distractors.test.js`

- [ ] **Step 1: Write failing tests:** every id in `distractors.json` exists in the bank. Each entry has exactly 3 strings, all non-empty, distinct from each other and from the item's `a` (case-insensitive). At least 85% of non-scenario items have `mc:true`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Write wrong answers by hand for each Q&A and correction. Rules: same shape and length as the real answer; real confusions from the guide (other AR numbers, other forms, neighboring list items, reordered sequences); never a joke or obviously false answer. For long list answers (TLPs, Prep Drill), the wrong answers are the same list with one item swapped or the order changed. Skip items where no fair wrong answer exists; those stay typed-only.
- [ ] **Step 4:** Run → PASS. Rebuild the bank.
- [ ] **Step 5:** Commit `feat: add multiple-choice distractors`.

### Task 3: Library data and the store

**Files:**
- Modify: `app/build-data.js`: also write `docs/data/library.json`
- Create: `docs/js/store.js`
- Test: `app/test/library.test.js`, `app/test/store.test.js`

**Interfaces:**
- `library.json = { sections: [{key, num, title, category, html}], must: [{section, html}], plan: [{date:'YYYY-MM-DD', sections:[key], also:string}], pubs: [{id, title, date}] }`. `html` is the section fragment with `{{N}}`/`{{REF}}` resolved. `must` = each `.fact`, `.card` or `.callout` block containing `t-must`. `plan` comes from `plan.html` rows (Thu 12 Nov → `2026-11-12`, …, Fri 20 Nov) with the `Sec N` numbers mapped back to keys. `pubs` comes from the index tables.
- `createStore(storage = globalThis.localStorage) -> Store`, where `Store` has `{ persistent: boolean, get(): State, record(id: string, correct: boolean): void, toggleFav(id): boolean, setField(name: string, value: string): void, reset(): void }`
- `State = { items: {[id]: {seen:number, right:number, wrong:number, streak:number, missed:boolean, last:boolean}}, favs: string[], fields: {[name]: string} }`
- Rules: a wrong answer sets `missed=true, streak=0`. A right answer increments `streak`. When `streak >= 3`, set `missed=false`. Saved to key `steadfast.v1` on every call.

- [ ] **Step 1: Write failing tests:** `library.sections.length === 26`. `plan[0].date === '2026-11-12'`, and `plan` includes `'2026-11-20'`. `must.length > 20`. Store: record wrong → `missed` true. Then 3 rights → `missed` false. Data persists across two `createStore(fakeStorage)` instances. A storage whose `setItem` throws → `persistent === false` and no exception.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. The store is an ES module that also works under Node, because the tests pass a fake storage.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: library data and progress store`.

### Task 4: Quiz engine

**Files:**
- Create: `docs/js/quiz.js`
- Test: `app/test/quiz.test.js`

**Interfaces:**
- `pickQuestions(bank: Item[], state: State, opts: {sections?: string[], source: 'all'|'missed'|'favs', mode: 'mc'|'typed'|'mixed', count: number|'all'}, rand = Math.random) -> Turn[]`
- `Turn = { item: Item, kind: 'mc'|'typed', choices?: string[] }`. MC choices are shuffled with `rand`.
- `mode:'mc'` keeps only `mc` items. `mixed` uses MC when available, otherwise typed. `typed` uses all items as typed.
- `gradeMC(turn: Turn, choice: string) -> boolean`
- `sectionProgress(bank, state) -> {[section]: {total, seen, mastered}}`, where mastered = `last === true`.
- `daysUntil(dateISO: string, now: Date) -> number` (whole days, minimum 0)

- [ ] **Step 1: Write failing tests:** filtering by `sections:['sharp']` returns only sharp items. `source:'missed'` with an empty state returns `[]`. `count:10` with only 4 eligible returns 4. `mode:'mc'` never returns a scenarios item. A seeded `rand` gives deterministic choice order, and the correct answer is in `choices`. `daysUntil('2026-11-20', new Date('2026-11-12T13:00:00'))` = 8. On the 20th it returns 0.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: quiz engine`.

### Task 5: App shell, Home and Topics

**Files:**
- Create: `docs/index.html`, `docs/css/app.css`, `docs/js/app.js` (hash router: `#/home`, `#/topics`, `#/topic/:key`, `#/test`, `#/session`, `#/results`, `#/library`, `#/library/:key`, `#/progress`), `docs/js/views/home.js`, `docs/js/views/topics.js`
- Create: `app/serve.js`: a static server on port 4173 for tests
- Test: `app/test/ui.spec.js` (Playwright, runs with `node app/test/ui.spec.js`, exits non-zero on failure)

**Interfaces:**
- Each view: `render(root: HTMLElement, ctx: {bank, library, store, go(hash: string), session})`
- `app.js` loads `data/bank.json` and `data/library.json` with `fetch`, or uses `window.__BANK__` / `window.__LIBRARY__` when present (single file, Task 8).
- Home shows: the app name, "N DAYS ▸ 20 NOV", **Quick 10** (→ MC, all sections, 10), **Full Session** (→ `#/test`), **Missed (n)**, **Favorites (n)**, today's plan from `library.plan` (the matching date, or the next upcoming one), and a progress bar for each of the 24 study sections plus Corrections (Plan and Index are Library-only). A storage banner shows when `store.persistent` is false.
- Topics: category tabs (All plus the 7 categories), with each section row showing a color bar, its number, title, question count and mastered %. Tapping a row → `#/topic/:key`, which offers "Multiple choice" / "Type answers" / "Read section."

- [ ] **Step 1: Write failing Playwright test:** at a 390×844 viewport, `#/home` shows the text `20 NOV` and the button `Quick 10`. `#/topics` lists 25 section rows (24 study sections + Corrections). Tapping the "Fitness & Training" tab shows exactly 2 rows.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement the shell, bottom tab bar, Home and Topics, styled with the Global Constraints colors and tags.
- [ ] **Step 4:** Run → PASS. Screenshot `#/home` at 390 px and look at it.
- [ ] **Step 5:** Commit `feat: app shell, home and topics`.

### Task 6: Session and results

**Files:**
- Create: `docs/js/views/session.js`, `docs/js/views/results.js`
- Modify: `docs/js/app.js`
- Test: extend `app/test/ui.spec.js`

**Behavior:**
- The header shows `Q i/n · <section title>` and an elapsed timer (display only), plus a ☆ favorite toggle.
- MC: 4 buttons. Tapping one locks the choice, colors the right answer green and a wrong pick red, shows the model answer with its tags, calls `store.record`, then shows **Next →**.
- Typed: a textarea and **Check answer**, which works even when the box is empty. It reveals "You wrote" next to the "Model answer" with tags, then **✅ I got it** / **❌ I missed it**, which call `store.record`, then advance.
- Results: score, the list of missed questions with answers, **Retry missed**, and **Home**.

- [ ] **Step 1: Write failing tests:** start Quick 10 and answer every question by clicking the first choice; the results page shows `/ 10`. Start a typed session for `sharp`, click Check with an empty box, then "I missed it"; reload the page and Home shows `Missed (1)`. Toggle ☆ in a session, and Home shows `Favorites (1)`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: quiz session and results`.

### Task 7: Test setup, Library and Progress

**Files:**
- Create: `docs/js/views/test.js`, `docs/js/views/library.js`, `docs/js/views/progress.js`
- Modify: `docs/css/app.css`: include the guide's section styles (`.fact`, `.qa`, `.callout`, `.card`, tables), scoped under `.lib` and adapted to a single column
- Test: extend `app/test/ui.spec.js`

**Behavior:**
- Test setup, as in the reference: Format (Multiple choice / Typed / Mixed), Source (All / Missed / Favorites), Topics (all, or a multi-select by category), Questions (10 / 20 / 30 / All, plus the available count), **Begin test →**. If the pool is empty, show "Nothing here yet" and disable Begin.
- Library: a list with "Must know review" first, then the 26 sections (and Start Here) in order. Section pages render `library.sections[].html`. On the `coc` page, every `td.blank` becomes an `<input>` bound to `store.setField('coc.<row>.<col>')`. On the `nco` page, the "Write your version here" box becomes a `<textarea>` bound to `store.setField('intro')`. Then "Official publications" from `library.pubs`.
- Progress: overall seen and mastered, a per-section table, missed count, and **Reset progress** (with a confirm prompt).

- [ ] **Step 1: Write failing tests:** Test setup with Source = Missed on a fresh state disables Begin and shows "Nothing here yet." In the Library, typing `MG Ellis` into the first CoC input and reloading keeps the value. The Library Must-know page has more than 20 blocks. Progress shows 25 rows.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: test setup, library, progress`.

### Task 8: Offline, installable, single file

**Files:**
- Create: `docs/manifest.webmanifest` (name "STEADFAST · Board Prep", short_name "Steadfast", theme `#121412`, display `standalone`), `docs/icons/icon-192.png`, `docs/icons/icon-512.png` and `apple-touch-icon.png` (gold ivy-leaf on black, rendered with Playwright from an inline SVG), `docs/sw.js` (cache-first for app shell and data, versioned cache name, old caches deleted on activate), and `docs/.nojekyll`
- Create: `app/build-single.js` → writes `Steadfast_Board_Prep_offline.html` at the repo root, with CSS, JS (modules bundled in dependency order into one script) and both JSON files inlined as `window.__BANK__` / `window.__LIBRARY__`. No service worker in that file.
- Modify: `docs/index.html`: register `sw.js` only when `location.protocol` starts with `http`
- Create: `README.md`: what the app is, the live URL pattern `https://adriyunn.github.io/promotion-board/`, how to enable Pages (Settings → Pages → branch `claude/beautiful-cannon-hpowk0`, folder `/docs`), how to rebuild (`node app/build-data.js && node app/build-single.js`), and how to add the app to the home screen
- Test: extend `app/test/ui.spec.js`

- [ ] **Step 1: Write failing tests:** open `file://…/Steadfast_Board_Prep_offline.html`; Home shows `Quick 10`, and a Quick 10 session reaches results. Over http, after the first load, `context.setOffline(true)` and reload, and Home still renders.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `node --test app/test && node app/test/ui.spec.js` → all PASS. Check the size of the single file (it should be under 1.5 MB).
- [ ] **Step 5:** Commit `feat: offline PWA and single-file build` and push the branch.

---

## Amendments (2026-11-13, approved): fold into the tasks named

**Task 3 (store): spaced review replaces "3 right in a row."**
- `record(id: string, correct: boolean, today: string /* 'YYYY-MM-DD' */)`. The item gains `box: 0..3` and `due: string|null`.
- Wrong → `missed=true, box=1, due=today+1`. Right while `missed` → `box++`. The interval after a right answer is `{2: +2 days, 3: +3 days}`. When `box` passes 3 → `missed=false, due=null, box=0`. Right while not missed → no scheduling change.
- Add `dueIds(state, today) -> string[]` (missed items with `due <= today`).
- Tests: wrong on 11-13 → due 11-14. Right on 11-14 → due 11-16. Right on 11-16 → due 11-19. Right on 11-19 → cleared. Wrong at any step → back to box 1, due tomorrow.

**Task 4 (quiz): interleaving and new sources.**
- `opts.source` adds `'due'`. Shuffled output must avoid the same `section` back to back whenever another section remains (greedy re-order after shuffle).
- Add `pickBoardSim(bank, rand) -> Turn[]`: 15 typed turns = 13 non-scenario items from at least 8 different sections + 2 scenario items, interleaved.
- Tests: with 3 sections × 5 items and `count:'all'`, no two adjacent turns share a section. `pickBoardSim` returns 15 typed turns with exactly 2 `scenarios-*` and at least 8 distinct sections.

**Task 5 (Home):** add a **Due today (n)** button (→ session with `source:'due'`, mixed) above Missed, and a **Board Sim** button (→ `#/board`). The countdown uses today's date (on 2026-11-13 it shows `7 DAYS`).

**Task 6 (session):** typed questions show the line **"Say it out loud first, then type or tap Check."** above the textarea. Add the `#/board` view (`docs/js/views/board.js`): a question card with a textarea and **Next →** only, no answer shown. After Q15, the review screen lists each question with "You wrote" and the model answer plus ✅/❌ buttons, which call `store.record`. Then results.
- Tests: Board Sim shows 15 questions with no "Model answer" text before the review. The review shows 15 rows. Marking one ❌ makes Home show `Due today (0)` and `Missed (1)`.
