// Small DOM helpers shared by views.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return n;
}

const TAG_LABEL = { must: 'Must know', know: 'Know', bonus: 'Bonus', verify: 'Verify', local: 'Local', fixed: 'Fixed', new: 'New' };
export const tagHTML = (tags = []) => tags.filter((t) => TAG_LABEL[t] && t !== 'new').map((t) => `<span class="tag t-${t}">${TAG_LABEL[t]}</span>`).join('');

export function view(root, name, ...kids) {
  root.replaceChildren(el('div', { 'data-view': name }, ...kids));
  window.scrollTo(0, 0);
}

export const topbar = (sub) => el('header', { class: 'topbar' }, el('div', { class: 'brand', html: 'STEAD<span>FAST</span>' }), el('small', {}, sub || 'Board Prep · 2-12 IN'));

// The study sections shown on Topics/Home/Progress: numbered guide sections except Library-only ones, plus Corrections.
export function studySections(library) {
  const list = library.sections.filter((s) => s.category !== 'Library').map(({ key, num, title, category }) => ({ key, num, title, category }));
  list.push({ key: 'corrections', num: 0, title: 'Corrections to old notes', category: 'Corrections' });
  return list;
}

export function meter(frac) {
  return el('span', { class: 'right' }, el('span', { class: 'meter' }, el('i', { style: `width:${Math.round(frac * 100)}%` })), el('span', { class: 'pct' }, `${Math.round(frac * 100)}%`));
}

// Click handler that ignores taps in the first 350 ms after the button is created,
// so a double-tap can't hit the button that replaces it on the next screen.
export function tap(fn, delay = 350) {
  const born = performance.now();
  return (e) => { if (performance.now() - born < delay) return; fn(e); };
}
