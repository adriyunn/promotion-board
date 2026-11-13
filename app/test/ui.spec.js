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
  ctx.setDefaultTimeout(5000);
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

// ---------- Task 6: session, results, board sim ----------
test('quick 10 multiple choice runs to a results page', async (b) => {
  const { ctx, page } = await open(b);
  await page.getByRole('button', { name: 'Quick 10' }).click();
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('[data-view="session"] .choice');
    await page.locator('.choice').first().click();
    await page.locator('.actions .btn.gold').click();
  }
  await page.waitForSelector('[data-view="results"]');
  assert.match(await page.textContent('[data-view="results"]'), /\/ 10/);
  await ctx.close();
});

test('typed answer: empty check reveals model answer; a miss survives reload', async (b) => {
  const { ctx, page } = await open(b, '#/topic/sharp');
  await page.getByRole('button', { name: 'Type answers' }).click();
  await page.waitForSelector('[data-view="session"] textarea');
  assert.match(await page.textContent('[data-view="session"]'), /Say it out loud first/);
  await page.getByRole('button', { name: 'Check answer' }).click();
  assert.match(await page.textContent('[data-view="session"]'), /Model answer/);
  await page.getByRole('button', { name: /I missed it/ }).click();
  await page.goto(BASE + '#/home');
  await page.waitForSelector('[data-view="home"]');
  assert.ok(await page.getByRole('button', { name: /Missed \(1\)/ }).isVisible());
  assert.ok(await page.getByRole('button', { name: /Due today \(0\)/ }).isVisible());
  await ctx.close();
});

test('favorite toggle in a session shows on home', async (b) => {
  const { ctx, page } = await open(b);
  await page.getByRole('button', { name: 'Quick 10' }).click();
  await page.waitForSelector('[data-view="session"]');
  await page.getByRole('button', { name: /favorite/i }).click();
  await page.locator('nav.tabs a', { hasText: 'Home' }).click();
  await page.waitForSelector('[data-view="home"]');
  assert.ok(await page.getByRole('button', { name: /Favorites \(1\)/ }).isVisible());
  await ctx.close();
});

test('board sim: 15 questions, no answers until review, review grades', async (b) => {
  const { ctx, page } = await open(b);
  await page.getByRole('button', { name: /Board Sim/ }).click();
  for (let i = 0; i < 15; i++) {
    await page.waitForSelector('[data-view="board"] textarea');
    const t = await page.textContent('[data-view="board"]');
    assert.ok(!/Model answer/.test(t), 'answer shown before review');
    assert.match(t, new RegExp(`${i + 1} / 15`));
    await page.fill('textarea', 'my answer ' + i);
    await page.getByRole('button', { name: /Next|Finish/ }).click();
  }
  await page.waitForSelector('[data-view="board-review"]');
  assert.strictEqual(await page.locator('.review-row').count(), 15);
  assert.match(await page.textContent('[data-view="board-review"]'), /my answer 0/);
  await page.locator('.review-row').first().getByRole('button', { name: /missed/i }).click();
  for (let i = 1; i < 15; i++) await page.locator('.review-row').nth(i).getByRole('button', { name: /got it/i }).click();
  await page.getByRole('button', { name: /See results/ }).click();
  await page.waitForSelector('[data-view="results"]');
  assert.match(await page.textContent('[data-view="results"]'), /14\s*\/ 15/);
  await page.goto(BASE + '#/home');
  await page.waitForSelector('[data-view="home"]');
  assert.ok(await page.getByRole('button', { name: /Missed \(1\)/ }).isVisible());
  await ctx.close();
});

// ---------- Task 7: test setup, library, progress ----------
test('test setup: empty missed pool disables Begin', async (b) => {
  const { ctx, page } = await open(b, '#/test');
  await page.getByRole('button', { name: 'Missed', exact: true }).click();
  assert.match(await page.textContent('[data-view="test"]'), /Nothing here yet/);
  assert.ok(await page.getByRole('button', { name: /Begin test/ }).isDisabled());
  await ctx.close();
});

test('test setup: typed, one category, 10 questions starts a session', async (b) => {
  const { ctx, page } = await open(b, '#/test');
  await page.getByRole('button', { name: 'Typed', exact: true }).click();
  await page.getByRole('button', { name: '10', exact: true }).click();
  await page.getByLabel('All topics').uncheck();
  await page.getByLabel('Soldier Skills').check();
  await page.getByRole('button', { name: /Begin test/ }).click();
  await page.waitForSelector('[data-view="session"] textarea');
  assert.match(await page.textContent('.qhead'), /Q 1\/10/);
  await ctx.close();
});

test('library: must-know list, sections, and publications', async (b) => {
  const { ctx, page } = await open(b, '#/library');
  const rows = page.locator('.lib-row');
  assert.match(await rows.first().textContent(), /Must know review/);
  assert.strictEqual(await rows.count(), 29); // must + start + 26 sections + publications
  await rows.first().click();
  await page.waitForSelector('[data-view="library-page"]');
  assert.ok(await page.locator('.must-block').count() > 20);
  await ctx.close();
});

test('library: chain of command fill-in survives reload', async (b) => {
  const { ctx, page } = await open(b, '#/library/coc');
  const first = page.locator('.lib td.blank input').first();
  await first.fill('MG Ellis');
  await page.reload();
  await page.waitForSelector('.lib td.blank input');
  assert.strictEqual(await page.locator('.lib td.blank input').first().inputValue(), 'MG Ellis');
  await ctx.close();
});

test('library: about-yourself box saves', async (b) => {
  const { ctx, page } = await open(b, '#/library/nco');
  await page.fill('textarea[name="intro"]', 'Specialist, 11B, Team Leader');
  await page.reload();
  await page.waitForSelector('textarea[name="intro"]');
  assert.strictEqual(await page.inputValue('textarea[name="intro"]'), 'Specialist, 11B, Team Leader');
  await ctx.close();
});

test('progress: 25 rows and reset clears misses', async (b) => {
  const { ctx, page } = await open(b, '#/topic/sharp');
  await page.getByRole('button', { name: 'Type answers' }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: /I missed it/ }).click();
  await page.locator('nav.tabs a', { hasText: 'Progress' }).click();
  await page.waitForSelector('[data-view="progress"]');
  assert.strictEqual(await page.locator('.progress-row').count(), 25);
  assert.match(await page.textContent('[data-view="progress"]'), /Missed\s*1/);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /Reset progress/ }).click();
  assert.match(await page.textContent('[data-view="progress"]'), /Missed\s*0/);
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
