import { el, view, topbar, esc } from '../ui.js';

function row(num, title, sub, hash, ctx) {
  return el('button', { class: 'topic-row lib-row', onclick: () => ctx.go(hash) },
    el('span', { class: 'bar', style: 'background:var(--gold)' }), el('span', { class: 'num' }, num),
    el('span', {}, el('div', { class: 'row-title' }, title), sub && el('div', { class: 'row-sub' }, sub)), el('span', { class: 'pct' }, '›'));
}

function wrapTables(node) {
  node.querySelectorAll('table').forEach((t) => { const w = el('div', { class: 'tblwrap' }); t.replaceWith(w); w.append(t); });
}

// Turn the guide's blank cells and write-in box into inputs saved on this device.
function bindFields(node, key, store) {
  const fields = store.get().fields;
  if (key === 'coc') {
    node.querySelectorAll('table').forEach((t, ti) => t.querySelectorAll('tr').forEach((tr, ri) => tr.querySelectorAll('td.blank').forEach((td, ci) => {
      const name = `coc.t${ti}.r${ri}.c${ci}`;
      const label = (tr.querySelector('td')?.textContent || 'Name').trim();
      const input = el('input', { type: 'text', name, value: fields[name] || '', placeholder: 'Confirmed name', 'aria-label': label });
      input.addEventListener('input', () => store.setField(name, input.value));
      td.replaceChildren(input);
    })));
  }
  if (key === 'nco') {
    const card = [...node.querySelectorAll('.card')].find((c) => /Write your version here/.test(c.textContent));
    const lines = card && card.querySelector('div[style]');
    if (lines) {
      const ta = el('textarea', { name: 'intro', placeholder: 'Specialist ___, 11B, Team Leader in 2nd Platoon, C Company, 2-12 Infantry...', 'aria-label': 'About yourself' });
      ta.value = fields.intro || '';
      ta.addEventListener('input', () => store.setField('intro', ta.value));
      lines.replaceWith(ta);
    }
  }
}

function page(root, ctx, title, body) {
  view(root, 'library-page', topbar('Library'),
    el('button', { class: 'chip', style: 'margin-bottom:12px', onclick: () => ctx.go('#/library') }, '‹ Library'),
    title && el('h2', { style: 'margin-bottom:12px' }, title), body);
}

export function render(root, ctx, key) {
  const { library, store } = ctx;
  if (!key) {
    return view(root, 'library', topbar(),
      el('h2', {}, 'Library'), el('div', { class: 'eyebrow' }, 'Read the source. Know the answers.'),
      row('★', 'Must know review', `${library.must.length} items for 19 Nov`, '#/library/must', ctx),
      row('0', 'Start Here', 'Board format and corrections', '#/library/start', ctx),
      library.sections.map((s) => row(String(s.num), s.title, s.category === 'Library' ? 'Reference' : s.category, `#/library/${s.key}`, ctx)),
      row('§', 'Official publications', `${library.pubs.length} pubs · armypubs.army.mil`, '#/library/pubs', ctx));
  }
  if (key === 'must') {
    const titleOf = Object.fromEntries(library.sections.map((s) => [s.key, `${s.num} · ${s.title}`]));
    return page(root, ctx, 'Must know review', el('div', { class: 'lib' },
      library.must.map((m) => el('div', { class: 'must-block' }, el('div', { class: 'eyebrow', style: 'margin:14px 0 4px' }, titleOf[m.section]), el('div', { html: m.html })))));
  }
  if (key === 'pubs') {
    return page(root, ctx, 'Official publications', el('div', { class: 'lib' },
      el('p', { class: 'small' }, 'Check every fact against the current version on ', el('a', { href: 'https://armypubs.army.mil/', target: '_blank', rel: 'noopener' }, 'armypubs.army.mil'), '.'),
      el('div', { class: 'tblwrap' }, el('table', { html: '<tr><th>Pub</th><th>Title</th><th>Date</th></tr>' + library.pubs.map((p) => `<tr><td><b>${esc(p.id)}</b></td><td>${esc(p.title)}</td><td>${esc(p.date)}</td></tr>`).join('') }))));
  }
  const sec = key === 'start' ? library.start : library.sections.find((s) => s.key === key);
  if (!sec) return ctx.go('#/library');
  const body = el('div', { class: 'lib', html: sec.html });
  wrapTables(body);
  bindFields(body, key, store);
  page(root, ctx, null, body);
}
