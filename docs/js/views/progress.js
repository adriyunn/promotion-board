import { el, view, topbar, studySections, meter } from '../ui.js';
import { sectionProgress } from '../quiz.js';
import { dueIds, todayISO } from '../store.js';

export function render(root, ctx) {
  const { bank, library, store } = ctx;
  const state = store.get();
  const prog = sectionProgress(bank, state);
  const seen = Object.values(prog).reduce((a, p) => a + p.seen, 0);
  const mastered = Object.values(prog).reduce((a, p) => a + p.mastered, 0);
  const answers = Object.values(prog).reduce((a, p) => a + p.answers, 0);
  const right = Object.values(prog).reduce((a, p) => a + p.right, 0);
  const missed = Object.values(state.items).filter((i) => i.missed).length;
  const due = dueIds(state, todayISO()).length;
  const stat = (label, value) => el('div', { class: 'card' }, el('div', { class: 'eyebrow', style: 'margin:0' }, label), el('div', { class: 'row-title', style: 'font-size:24px' }, value));

  view(root, 'progress', topbar(),
    el('h2', {}, 'Progress'),
    !store.persistent && el('div', { class: 'banner', style: 'margin-top:10px' }, "Progress won't be saved on this device."),
    el('div', { class: 'grid2' }, stat('Seen', `${seen} / ${bank.length}`), stat('Correct', answers ? `${Math.round((right / answers) * 100)}%` : '—'), stat('Mastered', `${mastered}`), stat('Missed', `${missed}`), stat('Due today', `${due}`)),
    el('div', { class: 'eyebrow' }, 'By section · mastered = last answer right'),
    studySections(library).map((s) => {
      const p = prog[s.key] || { total: 0, seen: 0, mastered: 0 };
      return el('button', { class: 'topic-row progress-row', 'data-cat': s.category, onclick: () => ctx.go(`#/topic/${s.key}`) },
        el('span', { class: 'bar' }), el('span', { class: 'num' }, s.num || '0'),
        el('span', {}, el('div', { class: 'row-title' }, s.title), el('div', { class: 'row-sub' }, `${p.seen}/${p.total} seen · ${p.mastered} mastered${p.answers ? ` · ${Math.round((p.right / p.answers) * 100)}% correct` : ''}`)),
        meter(p.total ? p.mastered / p.total : 0));
    }),
    el('div', { class: 'actions', style: 'margin:18px 0' },
      el('button', { class: 'btn bad', onclick: () => { if (confirm('Reset all progress, favorites and saved names?')) { store.reset(); render(root, ctx); } } }, 'Reset progress')));
}
