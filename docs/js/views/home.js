import { el, view, topbar, studySections, meter } from '../ui.js';
import { daysUntil, sectionProgress, pickQuestions, pickBoardSim } from '../quiz.js';
import { dueIds, todayISO } from '../store.js';

export const BOARD_DATE = '2026-11-20';

function todaysPlan(plan, today) {
  return plan.find((d) => d.date === today) || plan.find((d) => d.date > today) || plan[plan.length - 1];
}

export function render(root, ctx) {
  const { bank, library, store } = ctx;
  const state = store.get();
  const today = todayISO();
  const days = daysUntil(BOARD_DATE);
  const due = dueIds(state, today).length;
  const missed = Object.values(state.items).filter((i) => i.missed).length;
  const favs = state.favs.length;
  const prog = sectionProgress(bank, state);
  const sections = studySections(library);
  const plan = todaysPlan(library.plan, today);
  const byKey = Object.fromEntries(sections.map((s) => [s.key, s]));

  const start = (opts, label) => ctx.startSession(pickQuestions(bank, state, { today, ...opts }), label);

  view(root, 'home',
    topbar(),
    !store.persistent && el('div', { class: 'banner' }, "Progress won't be saved on this device."),
    el('section', { class: 'hero' },
      el('div', { class: 'count' }, days === 0 ? 'BOARD DAY' : `${days} ${days === 1 ? 'DAY' : 'DAYS'}`, el('small', {}, '▸ 20 NOV')),
      el('p', {}, 'Battalion board · AGSU · Creed first, then questions.'),
      el('button', { class: 'btn primary', onclick: () => start({ source: 'all', mode: 'mc', count: 10 }, 'Quick 10') }, 'Quick 10'),
    ),
    el('div', { class: 'grid2' },
      el('button', { class: 'btn tile due', onclick: () => due && start({ source: 'due', mode: 'mixed', count: 'all' }, 'Due today'), disabled: !due }, el('b', {}, `Due today (${due})`), el('small', {}, 'Spaced review')),
      el('button', { class: 'btn tile', onclick: () => ctx.startBoard(pickBoardSim(bank)) }, el('b', {}, 'Board Sim'), el('small', {}, '15 Qs · no hints')),
      el('button', { class: 'btn tile missed', onclick: () => missed && start({ source: 'missed', mode: 'mixed', count: 'all' }, 'Missed'), disabled: !missed }, el('b', {}, `Missed (${missed})`), el('small', {}, 'Every miss so far')),
      el('button', { class: 'btn tile fav', onclick: () => favs && start({ source: 'favs', mode: 'mixed', count: 'all' }, 'Favorites'), disabled: !favs }, el('b', {}, `Favorites (${favs})`), el('small', {}, 'Starred questions')),
    ),
    el('button', { class: 'btn ghost', style: 'margin-top:10px', onclick: () => ctx.go('#/test') }, 'Full Session →'),
    plan && el('div', { class: 'eyebrow' }, `Today's plan · ${plan.date.slice(8)} Nov`),
    plan && el('div', { class: 'card' },
      el('div', { class: 'muted' }, plan.focus),
      el('div', { class: 'chips' }, plan.sections.filter((k) => byKey[k]).map((k) => el('button', { class: 'chip', onclick: () => ctx.go(`#/topic/${k}`) }, `${byKey[k].num || '0'} · ${byKey[k].title}`))),
      plan.also && el('div', { class: 'muted', style: 'margin-top:8px' }, '+ ' + plan.also),
    ),
    el('div', { class: 'eyebrow' }, 'Progress by section'),
    sections.map((s) => {
      const p = prog[s.key] || { total: 0, mastered: 0 };
      return el('button', { class: 'prog-row', 'data-cat': s.category, onclick: () => ctx.go(`#/topic/${s.key}`) },
        el('span', { class: 'bar' }), el('span', { class: 'num' }, s.num || '0'),
        el('span', {}, el('div', { class: 'row-title' }, s.title)),
        meter(p.total ? p.mastered / p.total : 0));
    }),
  );
}
