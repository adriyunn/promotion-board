import { el, view, topbar } from '../ui.js';
import { pickQuestions } from '../quiz.js';
import { todayISO } from '../store.js';

const seg = (options, value, onPick) => el('div', { class: 'seg' }, options.map(([v, label]) =>
  el('button', { 'aria-pressed': String(v === value), onclick: () => onPick(v) }, label)));

export function render(root, ctx) {
  const o = ctx.testOpts || (ctx.testOpts = { mode: 'mc', source: 'all', cats: null, count: 10 });
  const { bank, library, store } = ctx;
  const sectionsFor = (cats) => (cats ? library.categories.filter((c) => cats.includes(c.name)).flatMap((c) => c.sections) : null);
  const opts = () => ({ sections: sectionsFor(o.cats), source: o.source, mode: o.mode, count: 'all', today: todayISO() });
  const available = pickQuestions(bank, store.get(), opts()).length;
  const rerender = () => render(root, ctx);

  const allBox = el('input', { type: 'checkbox', id: 'cat-all', checked: !o.cats });
  allBox.onchange = () => { o.cats = allBox.checked ? null : []; rerender(); };
  const catBoxes = library.categories.map((c, i) => {
    const box = el('input', { type: 'checkbox', id: `cat-${i}`, checked: !o.cats || o.cats.includes(c.name), disabled: !o.cats });
    box.onchange = () => { o.cats = box.checked ? [...o.cats, c.name] : o.cats.filter((n) => n !== c.name); rerender(); };
    return el('label', { for: `cat-${i}`, 'data-cat': c.name }, box, el('span', { class: 'bar', style: 'height:18px' }), c.name);
  });

  const n = o.count === 'all' ? available : Math.min(o.count, available);
  view(root, 'test', topbar(),
    el('h2', {}, 'Test Mode'),
    el('div', { class: 'eyebrow' }, 'Simulate your promotion board'),
    el('div', { class: 'howto' }, el('b', {}, 'How it works'), 'Mixed topics, shuffled. Multiple choice is scored for you. Typed answers: say it out loud, then grade yourself honestly.'),
    el('div', { class: 'setrow' }, el('label', { class: 'eyebrow' }, 'Format'), seg([['mc', 'Multiple choice'], ['typed', 'Typed'], ['mixed', 'Mixed']], o.mode, (v) => { o.mode = v; rerender(); })),
    el('div', { class: 'setrow' }, el('label', { class: 'eyebrow' }, 'Source'), seg([['all', 'All'], ['due', 'Due'], ['missed', 'Missed'], ['favs', 'Favorites']], o.source, (v) => { o.source = v; rerender(); })),
    el('div', { class: 'setrow' }, el('label', { class: 'eyebrow' }, 'Topics'), el('div', { class: 'checks' }, el('label', { for: 'cat-all' }, allBox, el('b', {}, 'All topics')), catBoxes)),
    el('div', { class: 'setrow' }, el('label', { class: 'eyebrow' }, `Questions · ${available} available`), seg([[10, '10'], [20, '20'], [30, '30'], ['all', 'All']], o.count, (v) => { o.count = v; rerender(); })),
    !available && el('div', { class: 'empty' }, 'Nothing here yet.'),
    el('div', { class: 'actions' },
      el('button', { class: 'btn gold', disabled: !available, onclick: () => {
        const turns = pickQuestions(bank, store.get(), { ...opts(), count: o.count });
        ctx.startSession(turns, `Test · ${n} Qs`);
      } }, 'Begin test →'),
      el('button', { class: 'btn ghost', onclick: () => ctx.go('#/topics') }, 'Study by topic instead')));
}
