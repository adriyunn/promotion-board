// App entry: load data, wire the store, route by hash.
import { createStore } from './store.js';
import * as home from './views/home.js';
import * as topics from './views/topics.js';
import * as test from './views/test.js';
import * as library from './views/library.js';
import * as progress from './views/progress.js';
import * as session from './views/session.js';
import * as results from './views/results.js';
import * as board from './views/board.js';

const root = document.getElementById('app');

async function loadData() {
  if (window.__BANK__ && window.__LIBRARY__) return [window.__BANK__, window.__LIBRARY__];
  const [b, l] = await Promise.all([fetch('data/bank.json'), fetch('data/library.json')]);
  return [await b.json(), await l.json()];
}

const ctx = {
  store: createStore(),
  session: null,
  go(hash) { if (location.hash === hash) route(); else location.hash = hash; },
  startSession(turns, label) { ctx.session = { turns, label, i: 0, results: [] }; ctx.go('#/session'); },
  startBoard(turns) { ctx.session = { turns, label: 'Board Sim', i: 0, answers: [], board: true }; ctx.go('#/board'); },
};

function route() {
  const [, name = 'home', arg] = location.hash.replace(/^#\/?/, '#/').split('/');
  const tab = { topic: 'topics', session: 'test', results: 'test', board: 'home' }[name] || name;
  document.querySelectorAll('nav.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  const needsSession = ['session', 'results', 'board'].includes(name);
  if (needsSession && !ctx.session) return ctx.go('#/home');
  switch (name) {
    case 'topics': return topics.render(root, ctx);
    case 'topic': return topics.renderTopic(root, ctx, arg);
    case 'test': return test.render(root, ctx);
    case 'library': return library.render(root, ctx, arg);
    case 'progress': return progress.render(root, ctx);
    case 'session': return session.render(root, ctx);
    case 'results': return results.render(root, ctx);
    case 'board': return board.render(root, ctx);
    default: return home.render(root, ctx);
  }
}

loadData().then(([bank, lib]) => {
  ctx.bank = bank;
  ctx.library = lib;
  window.addEventListener('hashchange', route);
  if (!location.hash) location.hash = '#/home'; else route();
});
