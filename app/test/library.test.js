const test = require('node:test');
const assert = require('node:assert');
const { buildLibrary } = require('../build-data');

const lib = buildLibrary();

test('library has all 26 numbered sections with resolved html', () => {
  assert.strictEqual(lib.sections.length, 26);
  assert.strictEqual(lib.sections[0].key, 'creeds');
  assert.strictEqual(lib.sections[0].num, 1);
  assert.strictEqual(lib.sections[0].title, 'Creeds & Army Values');
  for (const s of lib.sections) assert.ok(!/\{\{/.test(s.html), `${s.key} has template tokens`);
  assert.ok(lib.start && /Start Here/.test(lib.start.html) && !/\{\{/.test(lib.start.html));
});

test('must-know blocks are collected', () => {
  assert.ok(lib.must.length > 20, String(lib.must.length));
  assert.ok(lib.must.every((m) => /t-must/.test(m.html) && m.section));
});

test('plan maps days to section keys', () => {
  assert.strictEqual(lib.plan[0].date, '2026-11-12');
  assert.ok(lib.plan[0].sections.includes('creeds'));
  assert.ok(lib.plan[0].sections.includes('corrections'));
  assert.ok(lib.plan.some((d) => d.date === '2026-11-20'));
});

test('publication index is parsed', () => {
  const adp = lib.pubs.find((p) => p.id === 'ADP 6-22');
  assert.ok(adp, 'ADP 6-22 missing');
  assert.match(adp.title, /Army Leadership/);
  assert.ok(lib.pubs.length > 30);
});
