import { el, view, topbar, studySections, meter } from '../ui.js';
import { sectionProgress, pickQuestions } from '../quiz.js';
import { todayISO } from '../store.js';

export function render(root, ctx) {
  const { bank, library, store } = ctx;
  const prog = sectionProgress(bank, store.get());
  const sections = studySections(library);
  let active = ctx.topicsTab || 'All';
  const list = el('div', {});
  const tabs = el('div', { class: 'cat-tabs', role: 'tablist' });

  const draw = () => {
    tabs.replaceChildren(...['All', ...library.categories.map((c) => c.name)].map((name) =>
      el('button', { role: 'tab', 'aria-selected': String(name === active), onclick: () => { active = ctx.topicsTab = name; draw(); } }, name)));
    list.replaceChildren(...sections.filter((s) => active === 'All' || s.category === active).map((s) => {
      const p = prog[s.key] || { total: 0, mastered: 0 };
      return el('button', { class: 'topic-row', 'data-cat': s.category, onclick: () => ctx.go(`#/topic/${s.key}`) },
        el('span', { class: 'bar' }), el('span', { class: 'num' }, s.num || '0'),
        el('span', {}, el('div', { class: 'row-title' }, s.title), el('div', { class: 'row-sub' }, `${p.total} Qs · `, el('span', { class: 'cat-label' }, s.category))),
        meter(p.total ? p.mastered / p.total : 0));
    }));
  };
  draw();
  view(root, 'topics', topbar(), el('h2', {}, 'Study Topics'), el('div', { class: 'eyebrow' }, `${sections.length} topics · ${bank.length} questions`), tabs, list);
}

export function renderTopic(root, ctx, key) {
  const { bank, library, store } = ctx;
  const s = studySections(library).find((x) => x.key === key);
  if (!s) return ctx.go('#/topics');
  const items = bank.filter((i) => i.section === key);
  const mcCount = items.filter((i) => i.mc).length;
  const start = (mode) => ctx.startSession(pickQuestions(bank, store.get(), { sections: [key], source: 'all', mode, count: 'all', today: todayISO() }), s.title);
  view(root, 'topic', topbar(),
    el('div', { 'data-cat': s.category }, el('span', { class: 'cat-label' }, s.category)),
    el('h2', {}, `${s.num || '0'} · ${s.title}`),
    el('div', { class: 'eyebrow' }, `${items.length} questions · ${mcCount} multiple choice`),
    el('div', { class: 'actions' },
      el('button', { class: 'btn gold', onclick: () => start('mc'), disabled: !mcCount }, 'Multiple choice'),
      el('button', { class: 'btn', onclick: () => start('typed'), disabled: !items.length }, 'Type answers'),
      key !== 'corrections' && el('button', { class: 'btn ghost', onclick: () => ctx.go(`#/library/${key}`) }, 'Read section'),
      key === 'corrections' && el('button', { class: 'btn ghost', onclick: () => ctx.go('#/library/start') }, 'Read Start Here'),
    ));
}
