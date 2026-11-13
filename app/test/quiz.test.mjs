import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { pickQuestions, pickBoardSim, gradeMC, sectionProgress, daysUntil } from '../../docs/js/quiz.js';

const realBank = JSON.parse(fs.readFileSync(new URL('../../docs/data/bank.json', import.meta.url)));
const emptyState = { items: {}, favs: [], fields: {} };
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const mk = (section, n, mc = true) => ({ id: `${section}-0${n}`, section, q: 'q', a: `${section}${n}`, tags: [], mc, choices: mc ? [`${section}${n}`, 'x', 'y', 'z'] : undefined });
const small = ['a', 'b', 'c'].flatMap((s) => [1, 2, 3, 4, 5].map((n) => mk(s, n)));

test('filters by section', () => {
  const t = pickQuestions(realBank, emptyState, { sections: ['sharp'], source: 'all', mode: 'mixed', count: 'all' }, seeded());
  assert.ok(t.length > 0 && t.every((x) => x.item.section === 'sharp'));
});

test('missed and favs sources are empty on fresh state', () => {
  assert.deepStrictEqual(pickQuestions(realBank, emptyState, { source: 'missed', mode: 'mixed', count: 10 }), []);
  assert.deepStrictEqual(pickQuestions(realBank, emptyState, { source: 'favs', mode: 'mixed', count: 10 }), []);
});

test('due source returns only due items', () => {
  const state = { items: { 'a-01': { missed: true, due: '2026-11-13' }, 'a-02': { missed: true, due: '2026-11-20' } }, favs: [], fields: {} };
  const t = pickQuestions(small, state, { source: 'due', mode: 'mixed', count: 'all', today: '2026-11-13' }, seeded());
  assert.deepStrictEqual(t.map((x) => x.item.id), ['a-01']);
});

test('count larger than pool returns the whole pool', () => {
  const state = { items: {}, favs: ['a-01', 'b-02', 'c-03', 'a-04'], fields: {} };
  assert.strictEqual(pickQuestions(small, state, { source: 'favs', mode: 'mixed', count: 10 }, seeded()).length, 4);
});

test('mc mode excludes typed-only items such as scenarios', () => {
  const t = pickQuestions(realBank, emptyState, { source: 'all', mode: 'mc', count: 'all' }, seeded());
  assert.ok(t.length > 100 && t.every((x) => x.kind === 'mc' && x.item.section !== 'scenarios'));
});

test('mixed uses mc when available, typed otherwise', () => {
  const bank = [mk('a', 1, true), mk('b', 1, false)];
  const t = pickQuestions(bank, emptyState, { source: 'all', mode: 'mixed', count: 'all' }, seeded());
  const kinds = Object.fromEntries(t.map((x) => [x.item.id, x.kind]));
  assert.deepStrictEqual(kinds, { 'a-01': 'mc', 'b-01': 'typed' });
});

test('typed mode makes every turn typed with no choices', () => {
  const t = pickQuestions(small, emptyState, { source: 'all', mode: 'typed', count: 5 }, seeded());
  assert.ok(t.every((x) => x.kind === 'typed' && !x.choices));
});

test('choices are shuffled deterministically and include the answer', () => {
  const opts = { sections: ['a'], source: 'all', mode: 'mc', count: 'all' };
  const t1 = pickQuestions(small, emptyState, opts, seeded(7));
  const t2 = pickQuestions(small, emptyState, opts, seeded(7));
  assert.deepStrictEqual(t1.map((x) => x.choices), t2.map((x) => x.choices));
  assert.ok(t1.every((x) => x.choices.includes(x.item.a) && x.choices.length === 4));
  assert.ok(t1.some((x) => x.choices[0] !== x.item.a));
});

test('interleaves: no two adjacent turns share a section when avoidable', () => {
  for (let seed = 1; seed < 30; seed++) {
    const t = pickQuestions(small, emptyState, { source: 'all', mode: 'mixed', count: 'all' }, seeded(seed));
    for (let i = 1; i < t.length; i++) assert.notStrictEqual(t[i].item.section, t[i - 1].item.section, `seed ${seed} at ${i}`);
  }
});

test('gradeMC compares to the item answer', () => {
  const turn = { item: mk('a', 1), kind: 'mc', choices: ['x', 'a1', 'y', 'z'] };
  assert.strictEqual(gradeMC(turn, 'a1'), true);
  assert.strictEqual(gradeMC(turn, 'x'), false);
});

test('pickBoardSim gives 15 typed turns, 2 scenarios, 8+ sections', () => {
  for (let seed = 1; seed < 10; seed++) {
    const t = pickBoardSim(realBank, seeded(seed));
    assert.strictEqual(t.length, 15);
    assert.ok(t.every((x) => x.kind === 'typed'));
    assert.strictEqual(t.filter((x) => x.item.section === 'scenarios').length, 2);
    assert.ok(new Set(t.map((x) => x.item.section)).size >= 8);
  }
});

test('sectionProgress counts total, seen and mastered', () => {
  const state = { items: { 'a-01': { seen: 2, last: true }, 'a-02': { seen: 1, last: false } }, favs: [], fields: {} };
  const p = sectionProgress(small, state);
  assert.deepStrictEqual([p.a.total, p.a.seen, p.a.mastered], [5, 2, 1]);
  assert.deepStrictEqual([p.b.total, p.b.seen, p.b.mastered], [5, 0, 0]);
});

test('daysUntil counts whole days and floors at 0', () => {
  assert.strictEqual(daysUntil('2026-11-20', new Date('2026-11-12T13:00:00')), 8);
  assert.strictEqual(daysUntil('2026-11-20', new Date('2026-11-13T23:59:00')), 7);
  assert.strictEqual(daysUntil('2026-11-20', new Date('2026-11-20T08:00:00')), 0);
  assert.strictEqual(daysUntil('2026-11-20', new Date('2026-11-25T08:00:00')), 0);
});

test('sectionProgress also reports answers and right answers for percent correct', () => {
  const state = { items: { 'a-01': { seen: 4, right: 3, last: true }, 'a-02': { seen: 2, right: 0, last: false } }, favs: [], fields: {} };
  const p = sectionProgress(small, state);
  assert.strictEqual(p.a.answers, 6);
  assert.strictEqual(p.a.right, 3);
  assert.strictEqual(p.b.answers, 0);
});

test('an explicit empty section list selects nothing', () => {
  assert.deepStrictEqual(pickQuestions(small, emptyState, { sections: [], source: 'all', mode: 'mixed', count: 'all' }), []);
});
