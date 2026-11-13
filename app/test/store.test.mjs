import test from 'node:test';
import assert from 'node:assert';
import { createStore, dueIds } from '../../docs/js/store.js';

const fakeStorage = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; };

test('wrong answer schedules review for tomorrow', () => {
  const s = createStore(fakeStorage());
  s.record('a', false, '2026-11-13');
  const it = s.get().items.a;
  assert.deepStrictEqual([it.missed, it.box, it.due, it.wrong, it.seen, it.last], [true, 1, '2026-11-14', 1, 1, false]);
});

test('spaced reviews 1, 2, 3 days then cleared', () => {
  const s = createStore(fakeStorage());
  s.record('a', false, '2026-11-13');
  s.record('a', true, '2026-11-14');
  assert.strictEqual(s.get().items.a.due, '2026-11-16');
  s.record('a', true, '2026-11-16');
  assert.strictEqual(s.get().items.a.due, '2026-11-19');
  s.record('a', true, '2026-11-19');
  const it = s.get().items.a;
  assert.deepStrictEqual([it.missed, it.due, it.box, it.last], [false, null, 0, true]);
});

test('wrong during review resets to box 1, due tomorrow', () => {
  const s = createStore(fakeStorage());
  s.record('a', false, '2026-11-13');
  s.record('a', true, '2026-11-14');
  s.record('a', false, '2026-11-16');
  const it = s.get().items.a;
  assert.deepStrictEqual([it.box, it.due, it.missed], [1, '2026-11-17', true]);
});

test('right answer on a fresh item changes no schedule', () => {
  const s = createStore(fakeStorage());
  s.record('b', true, '2026-11-13');
  const it = s.get().items.b;
  assert.deepStrictEqual([it.missed, it.due, it.right, it.last], [false, null, 1, true]);
});

test('dueIds lists missed items due on or before today', () => {
  const s = createStore(fakeStorage());
  s.record('a', false, '2026-11-13');
  s.record('b', false, '2026-11-14');
  assert.deepStrictEqual(dueIds(s.get(), '2026-11-13'), []);
  assert.deepStrictEqual(dueIds(s.get(), '2026-11-14'), ['a']);
  assert.deepStrictEqual(dueIds(s.get(), '2026-11-15').sort(), ['a', 'b']);
});

test('state persists across store instances', () => {
  const st = fakeStorage();
  const s1 = createStore(st);
  s1.record('a', false, '2026-11-13');
  assert.strictEqual(s1.toggleFav('a'), true);
  s1.setField('coc.0.2', 'MG Ellis');
  const s2 = createStore(st);
  assert.strictEqual(s2.get().items.a.missed, true);
  assert.deepStrictEqual(s2.get().favs, ['a']);
  assert.strictEqual(s2.get().fields['coc.0.2'], 'MG Ellis');
  assert.strictEqual(s2.toggleFav('a'), false);
  assert.ok(s1.persistent);
});

test('throwing storage falls back to memory without crashing', () => {
  const bad = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  const s = createStore(bad);
  assert.strictEqual(s.persistent, false);
  s.record('a', false, '2026-11-13');
  assert.strictEqual(s.get().items.a.missed, true);
});

test('missing storage (undefined) falls back to memory', () => {
  const s = createStore(undefined);
  assert.strictEqual(s.persistent, false);
  s.record('a', true, '2026-11-13');
  assert.strictEqual(s.get().items.a.right, 1);
});

test('reset clears everything', () => {
  const s = createStore(fakeStorage());
  s.record('a', false, '2026-11-13');
  s.reset();
  assert.deepStrictEqual(s.get(), { items: {}, favs: [], fields: {} });
});

test('a right answer before the item is due does not advance the box', () => {
  const s = createStore(fakeStorage());
  s.record('a', false, '2026-11-13');
  s.record('a', true, '2026-11-13');
  s.record('a', true, '2026-11-13');
  s.record('a', true, '2026-11-13');
  const it = s.get().items.a;
  assert.deepStrictEqual([it.missed, it.box, it.due, it.right], [true, 1, '2026-11-14', 3]);
});
