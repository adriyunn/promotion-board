import { el, view, topbar, esc, tagHTML, tap } from '../ui.js';
import { gradeMC } from '../quiz.js';
import { todayISO } from '../store.js';

const LETTERS = 'ABCD';

function header(ctx, turn, i, n, title) {
  const favs = ctx.store.get().favs;
  const on = favs.includes(turn.item.id);
  const btn = el('button', { class: 'fav-btn', 'aria-label': on ? 'Remove favorite' : 'Add favorite', 'aria-pressed': String(on) }, on ? '★' : '☆');
  btn.onclick = () => { const now = ctx.store.toggleFav(turn.item.id); btn.textContent = now ? '★' : '☆'; btn.setAttribute('aria-pressed', String(now)); btn.setAttribute('aria-label', now ? 'Remove favorite' : 'Add favorite'); };
  return el('div', { class: 'qhead' }, el('span', {}, `Q ${i + 1}/${n} · ${title}`), btn);
}

export function sectionTitle(ctx, key) {
  if (key === 'corrections') return 'Corrections';
  return ctx.library.sections.find((s) => s.key === key)?.title || key;
}

export const modelAnswer = (item) => el('div', { class: 'ans model', html: `<h4>Model answer</h4>${esc(item.a)} ${tagHTML(item.tags)}` });

export function render(root, ctx) {
  const s = ctx.session;
  if (!s.turns.length) {
    return view(root, 'session', topbar(s.label), el('div', { class: 'empty' }, 'Nothing here yet.'), el('button', { class: 'btn', onclick: () => ctx.go('#/home') }, 'Home'));
  }
  const turn = s.turns[s.i];
  const last = s.i === s.turns.length - 1;
  const next = () => { if (last) ctx.go('#/results'); else { s.i++; render(root, ctx); } };
  const record = (ok) => { ctx.store.record(turn.item.id, ok, todayISO()); s.results.push({ item: turn.item, ok }); };
  const nextBtn = () => el('button', { class: 'btn gold', onclick: tap(next) }, last ? 'See results →' : 'Next →');

  const card = el('div', { class: 'qcard' }, el('div', { class: 'qtext' }, turn.item.q));
  const after = el('div', {});

  if (turn.kind === 'mc') {
    const buttons = turn.choices.map((c, k) => el('button', { class: 'btn choice', html: `<b>${LETTERS[k]}</b> ${esc(c)}` }));
    buttons.forEach((b, k) => b.addEventListener('click', () => {
      if (after.childElementCount) return;
      const ok = gradeMC(turn, turn.choices[k]);
      buttons.forEach((x, j) => { x.disabled = true; if (turn.choices[j] === turn.item.a) x.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      record(ok);
      after.append(el('div', { class: 'reveal' }, el('div', { class: `verdict ${ok ? 'ok' : 'bad'}` }, ok ? 'Correct' : 'Not quite'), modelAnswer(turn.item)), el('div', { class: 'actions' }, nextBtn()));
    }));
    card.append(el('div', { class: 'choices' }, buttons));
  } else {
    const box = el('textarea', { placeholder: 'Type your answer (or leave blank and say it out loud)', 'aria-label': 'Your answer' });
    const check = el('button', { class: 'btn gold' }, 'Check answer');
    check.onclick = tap(() => {
      box.readOnly = true; check.remove();
      const grade = (ok) => { record(ok); next(); };
      after.append(el('div', { class: 'reveal' },
        el('div', { class: 'ans', html: `<h4>You wrote</h4>${esc(box.value.trim() || '(said it out loud)')}` }),
        modelAnswer(turn.item)),
        el('div', { class: 'actions two' },
          el('button', { class: 'btn ok', onclick: tap(() => grade(true)) }, '✅ I got it'),
          el('button', { class: 'btn bad', onclick: tap(() => grade(false)) }, '❌ I missed it')));
    });
    card.append(el('div', { class: 'say' }, 'Say it out loud first, then type or tap Check.'), box, el('div', { class: 'actions' }, check));
  }
  card.append(after);
  view(root, 'session', topbar(s.label), header(ctx, turn, s.i, s.turns.length, sectionTitle(ctx, turn.item.section)), card);
}
