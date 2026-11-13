import { el, view, topbar, esc } from '../ui.js';
import { modelAnswer } from './session.js';

export function render(root, ctx) {
  const s = ctx.session;
  const res = s.results;
  const right = res.filter((r) => r.ok).length;
  const missed = res.filter((r) => !r.ok);
  view(root, 'results', topbar(s.label),
    el('div', { class: 'score' }, el('b', {}, right), el('span', {}, ` / ${res.length}`), el('div', { class: 'eyebrow' }, `${s.label} · ${res.length ? Math.round((right / res.length) * 100) : 0}%`)),
    missed.length ? el('div', { class: 'eyebrow' }, `Missed (${missed.length}) · back tomorrow for review`) : el('div', { class: 'empty' }, 'Clean sweep. 🎖️'),
    el('div', { class: 'missed-list' }, missed.map((r) => el('div', { class: 'card', style: 'margin-bottom:8px' }, el('div', { class: 'row-title', html: esc(r.item.q) }), modelAnswer(r.item)))),
    el('div', { class: 'actions' },
      missed.length && el('button', { class: 'btn gold', onclick: () => ctx.startSession(missed.map((r) => ({ item: r.item, kind: 'typed' })), 'Retry missed') }, 'Retry missed'),
      el('button', { class: 'btn', onclick: () => ctx.go('#/home') }, 'Home')));
}
