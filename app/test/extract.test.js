const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { extractQAs, extractScenarios, extractCorrections, stripTags } = require('../extract');
const { ORDER } = require('../../guide/order');

const sec = (n) => fs.readFileSync(path.join(__dirname, '../../guide/sections', n + '.html'), 'utf8');

test('stripTags pulls tag spans out of text', () => {
  assert.deepStrictEqual(stripTags('AR 600-52. <span class="tag t-verify">Verify</span>'), { text: 'AR 600-52.', tags: ['verify'] });
});

test('stripTags decodes entities and drops markup', () => {
  assert.deepStrictEqual(stripTags('<b>Sit</b> &amp; <i>wait</i>&nbsp;now'), { text: 'Sit & wait now', tags: [] });
});

test('extractQAs reads sharp section in order', () => {
  const html = sec('sharp');
  const items = extractQAs(html, 'sharp');
  assert.strictEqual(items.length, (html.match(/class="qa"/g) || []).length);
  assert.strictEqual(items[0].id, 'sharp-01');
  assert.strictEqual(items[0].q, 'What regulation covers SHARP?');
  assert.strictEqual(items[0].a, 'AR 600-52.');
  assert.strictEqual(items[0].category, 'Leadership & Policy');
});

test('extractCorrections returns the 13 fixes', () => {
  const items = extractCorrections(sec('start'));
  assert.strictEqual(items.length, 13);
  assert.match(items[1].a, /Unit/);
  assert.match(items[1].q, /^Correct this: /);
  assert.strictEqual(items[0].id, 'corrections-01');
  assert.strictEqual(items[0].category, 'Corrections');
});

test('extractScenarios returns 21 typed-only items', () => {
  const items = extractScenarios(sec('scenarios'));
  assert.strictEqual(items.length, 21);
  assert.ok(items.every((i) => i.mc === false));
  assert.strictEqual(items[0].id, 'scenarios-01');
});

test('no markup, template tokens or tag words leak into any item', () => {
  const all = [];
  for (const [n] of ORDER) {
    if (n === 'scenarios') all.push(...extractScenarios(sec(n)));
    else all.push(...extractQAs(sec(n), n));
  }
  all.push(...extractCorrections(sec('start')));
  assert.ok(all.length > 150);
  for (const it of all) {
    for (const s of [it.q, it.a]) {
      assert.ok(!/[<>]|\{\{|VERIFY|\bVerify\b$/.test(s), `${it.id}: ${s}`);
      assert.ok(s.trim().length > 0, `${it.id} empty`);
    }
  }
});
