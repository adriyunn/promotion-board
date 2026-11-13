// Quiz engine: choose questions, shuffle choices, interleave topics, grade, and summarize progress.
import { dueIds, todayISO } from './store.js';

export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reorders so no two neighbors share a section whenever another section still has items.
// Always takes from the section with the most items left (ties: earliest in the given order).
export function interleave(items, sectionOf = (x) => x.section) {
  const groups = new Map();
  items.forEach((x) => { const k = sectionOf(x); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); });
  const out = [];
  let last = null;
  while (out.length < items.length) {
    let best = null;
    for (const [k, g] of groups) {
      if (!g.length || k === last) continue;
      if (!best || g.length > groups.get(best).length) best = k;
    }
    if (best === null) best = last; // only the last section has items left
    out.push(groups.get(best).shift());
    last = best;
  }
  return out;
}

const toTurn = (item, kind, rand) => (kind === 'mc' ? { item, kind, choices: shuffle(item.choices, rand) } : { item, kind });

export function pickQuestions(bank, state, opts, rand = Math.random) {
  const { sections, source = 'all', mode = 'mixed', count = 10, today = todayISO() } = opts;
  let pool = bank;
  if (sections) pool = pool.filter((i) => sections.includes(i.section));
  if (source === 'missed') pool = pool.filter((i) => state.items[i.id]?.missed);
  if (source === 'favs') pool = pool.filter((i) => state.favs.includes(i.id));
  if (source === 'due') { const due = new Set(dueIds(state, today)); pool = pool.filter((i) => due.has(i.id)); }
  if (mode === 'mc') pool = pool.filter((i) => i.mc);
  let picked = shuffle(pool, rand);
  if (count !== 'all') picked = picked.slice(0, count);
  return interleave(picked, (i) => i.section).map((i) => toTurn(i, mode === 'typed' || !i.mc ? 'typed' : 'mc', rand));
}

export function pickBoardSim(bank, rand = Math.random) {
  const regular = shuffle(bank.filter((i) => i.section !== 'scenarios'), rand);
  const chosen = [];
  const used = new Set();
  for (const it of regular) {
    if (chosen.length === 13) break;
    if (!used.has(it.section)) { chosen.push(it); used.add(it.section); }
  }
  const scen = shuffle(bank.filter((i) => i.section === 'scenarios'), rand).slice(0, 2);
  return interleave(shuffle([...chosen, ...scen], rand), (i) => i.section).map((item) => ({ item, kind: 'typed' }));
}

export const gradeMC = (turn, choice) => choice === turn.item.a;

export function sectionProgress(bank, state) {
  const out = {};
  for (const i of bank) {
    const p = out[i.section] || (out[i.section] = { total: 0, seen: 0, mastered: 0, answers: 0, right: 0 });
    p.total++;
    const s = state.items[i.id];
    if (s && s.seen) p.seen++;
    if (s && s.last === true) p.mastered++;
    if (s) { p.answers += s.seen || 0; p.right += s.right || 0; }
  }
  return out;
}

export function daysUntil(dateISO, now = new Date()) {
  const [y, m, d] = todayISO(now).split('-').map(Number);
  const [ty, tm, td] = dateISO.split('-').map(Number);
  return Math.max(0, Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000));
}
