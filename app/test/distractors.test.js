const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { buildBank } = require('../build-data');

const D = JSON.parse(fs.readFileSync(path.join(__dirname, '../distractors.json'), 'utf8'));
const bank = buildBank();
const byId = Object.fromEntries(bank.map((i) => [i.id, i]));

test('every distractor id exists in the bank', () => {
  for (const id of Object.keys(D)) assert.ok(byId[id], `unknown id ${id}`);
});

test('each entry has 3 distinct non-empty wrong answers that differ from the answer', () => {
  for (const [id, wrong] of Object.entries(D)) {
    assert.strictEqual(wrong.length, 3, id);
    const all = [byId[id].a, ...wrong].map((s) => s.trim().toLowerCase());
    assert.ok(wrong.every((w) => w.trim().length > 0), id);
    assert.strictEqual(new Set(all).size, 4, `${id} has duplicate choices`);
    assert.ok(wrong.every((w) => !/[<>]/.test(w)), `${id} markup`);
  }
});

test('at least 85% of non-scenario items are multiple choice', () => {
  const pool = bank.filter((i) => i.section !== 'scenarios');
  const mc = pool.filter((i) => D[i.id]);
  assert.ok(mc.length / pool.length >= 0.85, `${mc.length}/${pool.length}`);
});

test('buildBank merges choices with the correct answer first', () => {
  const id = Object.keys(D)[0];
  assert.strictEqual(byId[id].mc, true);
  assert.deepStrictEqual(byId[id].choices, [byId[id].a, ...D[id]]);
  assert.ok(bank.filter((i) => i.section === 'scenarios').every((i) => i.mc === false && !i.choices));
});
