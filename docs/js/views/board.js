import { el, view, topbar, esc } from '../ui.js';
import { todayISO } from '../store.js';
import { modelAnswer, sectionTitle } from './session.js';

export function render(root, ctx) {
  const s = ctx.session;
  if (s.i >= s.turns.length) return review(root, ctx);
  const turn = s.turns[s.i];
  const last = s.i === s.turns.length - 1;
  const box = el('textarea', { placeholder: 'Answer like you would to the board', 'aria-label': 'Your answer' });
  box.value = s.answers[s.i] || '';
  view(root, 'board', topbar('Board Simulation'),
    el('div', { class: 'qhead' }, el('span', {}, `${s.i + 1} / ${s.turns.length} · ${sectionTitle(ctx, turn.item.section)}`)),
    el('div', { class: 'qcard' },
      el('div', { class: 'qtext' }, turn.item.q),
      el('div', { class: 'say' }, 'Say it out loud first, then type or tap Next. No answers until the end.'),
      box,
      el('div', { class: 'actions' }, el('button', { class: 'btn gold', onclick: () => { s.answers[s.i] = box.value; s.i++; render(root, ctx); } }, last ? 'Finish →' : 'Next →'))));
}

function review(root, ctx) {
  const s = ctx.session;
  s.results = s.results || [];
  const graded = new Map();
  const done = el('button', { class: 'btn gold', disabled: true, onclick: () => {
    s.results = s.turns.map((t, i) => ({ item: t.item, ok: graded.get(i) }));
    ctx.go('#/results');
  } }, 'See results →');
  const rows = s.turns.map((t, i) => {
    const btns = el('div', { class: 'actions two' });
    const grade = (ok) => {
      if (!graded.has(i)) ctx.store.record(t.item.id, ok, todayISO());
      else if (graded.get(i) !== ok) ctx.store.record(t.item.id, ok, todayISO());
      graded.set(i, ok);
      btns.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ok === String(ok))));
      done.disabled = graded.size < s.turns.length;
    };
    btns.append(el('button', { class: 'btn ok', 'data-ok': 'true', onclick: () => grade(true) }, '✅ I got it'), el('button', { class: 'btn bad', 'data-ok': 'false', onclick: () => grade(false) }, '❌ I missed it'));
    return el('div', { class: 'card review-row', style: 'margin-bottom:10px' },
      el('div', { class: 'qhead' }, el('span', {}, `${i + 1} · ${sectionTitle(ctx, t.item.section)}`)),
      el('div', { class: 'row-title' }, t.item.q),
      el('div', { class: 'reveal' }, el('div', { class: 'ans', html: `<h4>You wrote</h4>${esc((s.answers[i] || '').trim() || '(said it out loud)')}` }), modelAnswer(t.item)),
      btns);
  });
  view(root, 'board-review', topbar('Board Simulation'), el('h2', {}, 'Review your answers'), el('div', { class: 'eyebrow' }, 'Grade each one honestly'), rows, el('div', { class: 'actions' }, done));
}
