# Board Prep App — Design

Date: 2026-11-12 · Owner: the user (SPC, 11B, C Co 2-12 IN, 4ID) · Board: battalion E-5 board, **20 Nov 2026**

## Intent

A personal phone study app that drills the user for their 20 Nov 2026 battalion promotion board. It is built only from the user's own study guide (`guide/sections/*.html`, 26 sections, rendered to `2026_E5_Board_Study_Guide_C-2-12IN.pdf`). The user studies in both short bursts (about 5 minutes) and long sessions, so every screen needs a fast way in and support for long runs.

Why their own app instead of an existing one (Promotion Ready, PROmote, Next Rank): those apps don't cover the user's unit (2-12 IN lineage, the Dockery Medal of Honor, 4ID/IVY standards) or the 2026 changes (CFT/AD 2026-07, waist-to-height/AD 2026-13, ATP 4-02.11), and they aren't tied to the user's guide.

The user sent screenshots of the "Next Rank" app as the reference for structure: a home dashboard with stats, topics grouped by category with color-coded tags, a test-mode setup (format, topics, question count 10/20/30/all, Begin), a regulation library, and a bottom tab bar (Home, Topics, Library, Test, Progress). **Borrow the structure, not the branding.** Use our own name and the PDF's look.

## Goals

1. **Multiple-choice mode (A–D).** Auto-scored. For quick runs.
2. **Typed-answer mode.** The user types an answer, taps Check, sees the model answer and reference, then **grades themselves** (✅ / ❌). No automated grading of typed text.
3. **Topics.** All 26 guide sections, grouped by category with a colored tag. Each section can be studied by itself.
4. **Test setup**, as in the reference: format (MC / Typed / Mixed), topics (all or chosen sections), question count (10 / 20 / 30 / All), shuffled.
5. **Quick 10.** One tap from Home starts 10 mixed MC questions from the whole bank.
6. **Weak spots.** Every miss is saved. A "Missed" practice queue brings those questions back. A question leaves the queue after 3 correct answers in a row.
7. **Favorites.** Star any question and drill the starred ones.
8. **Progress.** Percent correct and questions seen, per section and overall.
9. **Home dashboard.** A countdown to 20 Nov 2026, Quick 10, Full Session, Missed (count), Favorites (count), today's sections from the 8-day plan, and per-section progress bars.
10. **Library.** Read each guide section in the app (the same content as the PDF), plus the official publication list with links.
11. **Situational questions** (Section 24) are included as typed-only items, since they have no single answer to pick.
12. **Delivered two ways:** a public website (GitHub Pages) and a single self-contained HTML file for offline backup.

## Non-goals

- Audio or text-to-speech of any kind (the user said no audio for now).
- AI or keyword grading of typed answers.
- Accounts, a backend, sync between devices, an App Store listing, sharing with other Soldiers.
- Thousands of questions. The bank comes from the guide, about 185 items.

## Anti-goals (it fails if...)

- **It teaches a wrong fact.** Every item must match the guide. Items the guide tags *Verify* or *Local* show that tag in the app too.
- It looks like a copy of Next Rank (name, logo, branding).
- It takes days to build. The user needs to start using it within about a day, and every hour spent building is study time lost.
- Personal information ends up in the public code (see Constraints).

## Constraints

- **Public hosting:** the user chose GitHub Pages, which requires making the repo `adriyunn/promotion-board` public. The user makes that visibility change and enables Pages in repo settings. The app must contain **no personal info**: no user name, and the chain-of-command and board-member blanks stay blank in the public code. Anything the user enters, and all progress, is kept only on the phone (localStorage).
- **Offline:** the website should work offline after the first load (a service worker caches the app shell and data). The single-file version must work fully from a downloaded file. Known risk: iOS may not keep localStorage for `file://` pages, so progress may reset there. Tell the user. It's a backup.
- **Phone-first:** a single-column layout for an iPhone-width screen. Large tap targets. It can be added to the home screen (web app manifest and icons).
- **Single source of truth:** questions and library text come from the guide content in this repo. If the guide changes, rebuilding the app updates it.
- Branch: work on `claude/beautiful-cannon-hpowk0`. Pages serves from that branch's `/docs` folder unless the user picks otherwise.

## Approaches considered

**Grading typed answers**
1. Key-term matching (each item has required terms, typos forgiven). Offline and automatic, but checks *what* was said, not how. *Not chosen.*
2. AI grading. Judges full sentences, but needs internet, an API key, setup, and costs money per answer. *Not chosen.*
3. **Self-grade (chosen by the user).** Show the model answer, and the user marks right or wrong. Simplest. The risk is going easy on yourself, so the model answer shows clearly next to what the user typed.

**Hosting**
1. Private Claude page. Private, auto-updating, saves progress, but needs a signal and a Claude login. *Not chosen.*
2. **Single HTML file (chosen as a backup).** Works with no signal. Updates need a new download, and iOS may drop progress.
3. **Public GitHub Pages (chosen as the main site).** A normal link, offline after the first load, auto-updating on push. The repo becomes public, which is acceptable because the app holds no personal info.

## Look

Match the PDF: black background, Army gold (`#f2c200`), ivy green (`#2f5d3a` / `#1d3b25`), Inter / Inter Display (falling back to system sans), the same tag styles (Must know = gold, Know = green, Bonus = gray, Verify = amber, Local = blue, Fixed = red, New = light green). Bottom tab bar: **Home · Topics · Test · Library · Progress**.

Categories for the topics list (color bar per category, like the reference):

| Category | Guide sections |
|---|---|
| Board & Basics | 1 Creeds, 2 Board Procedure, 3 Chain of Command, 4 NCO History/Personal, 5 Army Basics |
| Leadership & Policy | 6 Leadership, 7 Regulations, 8 SHARP/EO, 9 Wear, 10 Promotions/ABCP, 12 Benefits |
| Fitness & Training | 11 H2F, 13 Training/Risk/CBRN |
| Soldier Skills | 14 Tactics, 15 Acronyms, 16 Weapons, 17 Weapon Systems, 18 Comms/Maintenance, 19 First Aid, 20 Land Nav, 21 Drill |
| Unit & History | 22 4ID/2-12 IN, 23 Wars |
| Situational | 24 Situational Questions |

(Sections 25 Plan and 26 Publication Index go in the Library, not in Topics.)

## Question bank

Each item has: `id`, `section`, `category`, `question`, `answer` (the model answer, from the guide), `ref` (publication, if the guide gives one), `tags` (verify / local / must), `modes` (mc+typed, or typed-only), and for MC items, `choices` with **3 hand-written wrong answers** that are real confusions (for example AR 600-20 vs AR 600-52 vs AR 600-8-22), never obvious fakes. Sources: every guide Q&A (`.qa` blocks, about 164) and the 21 situational scenarios (typed-only). Items whose answer is too long for a clean MC option (e.g. the full TLP list) can be offered as MC with short options or as typed-only. That's the builder's call.

## Left to the builder

- Framework and file layout. Vanilla HTML/CSS/JS with no build-time dependencies is fine. The single file must inline everything.
- How question data is pulled from the guide (extracted by script, or a hand-curated JSON checked against the guide).
- Writing the MC wrong answers, the session/results screens, the timer (optional, shown but not enforced), animations, and the app name (avoid "Next Rank").
- Service worker caching strategy.
