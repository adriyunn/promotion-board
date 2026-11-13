// UI tests (Playwright). Run: node app/test/ui.spec.js  — exits non-zero on failure.
const { chromium } = require('playwright');
const assert = require('node:assert');
const { serve } = require('../serve');

const BASE = 'http://localhost:4173/';
const NOW = new Date('2026-11-13T12:00:00');
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

async function open(browser, hash = '#/home', ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...ctxOpts });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(NOW);
  await page.goto(BASE + hash);
  await page.waitForSelector('[data-view]');
  return { ctx, page };
}

// ---------- Task 5: shell, Home, Topics ----------
test('home shows countdown, quick 10, due, board sim', async (b) => {
  const { ctx, page } = await open(b);
  const text = await page.textContent('body');
  assert.match(text, /20 NOV/);
  assert.match(text, /7 DAYS/);
  assert.ok(await page.getByRole('button', { name: 'Quick 10' }).isVisible());
  assert.ok(await page.getByRole('button', { name: /Due today \(0\)/ }).isVisible());
  assert.ok(await page.getByRole('button', { name: /Board Sim/ }).isVisible());
  assert.ok(await page.getByRole('button', { name: /Missed \(0\)/ }).isVisible());
  assert.ok(await page.getByRole('button', { name: /Favorites \(0\)/ }).isVisible());
  assert.strictEqual(await page.locator('.prog-row').count(), 25);
  await ctx.close();
});

test('topics lists 25 rows and filters by category', async (b) => {
  const { ctx, page } = await open(b, '#/topics');
  assert.strictEqual(await page.locator('.topic-row').count(), 25);
  await page.getByRole('tab', { name: 'Fitness & Training' }).click();
  assert.strictEqual(await page.locator('.topic-row').count(), 2);
  await page.locator('.topic-row', { hasText: 'H2F' }).click();
  await page.waitForSelector('[data-view="topic"]');
  assert.ok(await page.getByRole('button', { name: 'Multiple choice' }).isVisible());
  assert.ok(await page.getByRole('button', { name: 'Type answers' }).isVisible());
  await ctx.close();
});

test('tab bar navigates between the five tabs', async (b) => {
  const { ctx, page } = await open(b);
  for (const [name, view] of [['Topics', 'topics'], ['Test', 'test'], ['Library', 'library'], ['Progress', 'progress'], ['Home', 'home']]) {
    await page.locator('nav.tabs a', { hasText: name }).click();
    await page.waitForSelector(`[data-view="${view}"]`);
  }
  await ctx.close();
});

module.exports = { test, open, BASE, NOW };

if (require.main === module) {
  (async () => {
    const server = await serve(4173);
    const browser = await chromium.launch();
    let failed = 0;
    for (const t of tests) {
      try { await t.fn(browser); console.log('ok   ' + t.name); }
      catch (e) { failed++; console.log('FAIL ' + t.name + '\n     ' + String(e.message).split('\n').slice(0, 4).join('\n     ')); }
    }
    await browser.close(); server.close();
    console.log(`\n${tests.length - failed}/${tests.length} passed`);
    process.exit(failed ? 1 : 0);
  })();
}
