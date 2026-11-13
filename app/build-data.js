// CLI: builds docs/data/bank.json from the guide sections.
const fs = require('fs');
const path = require('path');
const { ORDER } = require('../guide/order');
const { extractQAs, extractScenarios, extractCorrections, stripTags, NUM } = require('./extract');
const { categoryOf, CATEGORIES } = require('./categories');

const root = path.join(__dirname, '..');
const sec = (n) => fs.readFileSync(path.join(root, 'guide/sections', n + '.html'), 'utf8');
const LIBRARY_ONLY = ['plan', 'index'];

function buildBank() {
  const bank = [];
  for (const [n] of ORDER) {
    if (LIBRARY_ONLY.includes(n)) continue;
    bank.push(...(n === 'scenarios' ? extractScenarios(sec(n)) : extractQAs(sec(n), n)));
  }
  bank.push(...extractCorrections(sec('start')));
  const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'distractors.json'), 'utf8'));
  for (const it of bank) {
    if (D[it.id] && it.section !== 'scenarios') { it.mc = true; it.choices = [it.a, ...D[it.id]]; }
  }
  return bank;
}

const MONTHS = { Nov: '11', Dec: '12' };

function fillTemplate(html, key) {
  return html
    .replace(/\{\{N\}\}/g, key ? String(NUM[key]) : '')
    .replace(/\{\{REF:(\w+)\}\}/g, (_, k) => String(NUM[k]))
    .replace('{{TOC}}', '');
}

// Returns each balanced <div ...> block whose opening tag matches openRe.
function divBlocks(html, openRe) {
  const out = [];
  const re = new RegExp(openRe.source, 'g');
  let m;
  while ((m = re.exec(html))) {
    let depth = 0, i = m.index;
    const tagRe = /<\/?div\b[^>]*>/g;
    tagRe.lastIndex = i;
    let t;
    while ((t = tagRe.exec(html))) {
      depth += t[0][1] === '/' ? -1 : 1;
      if (depth === 0) { out.push(html.slice(i, tagRe.lastIndex)); re.lastIndex = tagRe.lastIndex; break; }
    }
  }
  return out;
}

function buildLibrary() {
  const sections = ORDER.map(([key]) => {
    const html = fillTemplate(sec(key), key);
    return { key, num: NUM[key], title: stripTags((html.match(/<h2>(.*?)<\/h2>/) || [, ''])[1]).text, category: categoryOf(key) || 'Library', html };
  });
  const start = { key: 'start', num: 0, title: 'Start Here', html: fillTemplate(sec('start')) };

  const must = [];
  for (const s of sections) {
    for (const b of divBlocks(s.html, /<div class="(?:fact|card[^"]*|callout[^"]*|creed[^"]*)">/)) {
      if (/t-must/.test(b) && !must.some((x) => x.html.includes(b) || b.includes(x.html))) must.push({ section: s.key, html: b });
    }
  }

  const keyByNum = Object.fromEntries(Object.entries(NUM).map(([k, n]) => [n, k]));
  const plan = [];
  for (const m of sec('plan').matchAll(/<tr><td>(?:<b>)?\w{3} (\d{1,2}) (\w{3})(?:<\/b>)?<\/td><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g)) {
    const sections = [];
    if (/Sec 0\b/.test(m[3])) sections.push('corrections');
    for (const r of m[3].matchAll(/\{\{REF:(\w+)\}\}/g)) sections.push(r[1]);
    const focus = stripTags(fillTemplate(m[3])).text;
    plan.push({ date: `2026-${MONTHS[m[2]]}-${m[1].padStart(2, '0')}`, sections, focus, also: stripTags(fillTemplate(m[4])).text });
  }

  const idx = sec('index');
  const pubs = [...idx.slice(idx.indexOf('<h3>Publication types')).matchAll(/<tr><td>([^<]+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g)]
    .map((m) => ({ id: stripTags(m[1]).text, title: stripTags(m[2]).text, date: stripTags(m[3]).text }));

  const categories = CATEGORIES.map(([name, keys]) => ({ name, sections: keys }));
  return { sections, start, must, plan, pubs, categories };
}

function writeJSON(rel, data) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(data));
}

if (require.main === module) {
  const bank = buildBank();
  writeJSON('docs/data/bank.json', bank);
  const library = buildLibrary();
  writeJSON('docs/data/library.json', library);
  console.log(`bank.json: ${bank.length} items · library.json: ${library.sections.length} sections, ${library.must.length} must-know, ${library.plan.length} plan days, ${library.pubs.length} pubs`);
}

module.exports = { buildBank, buildLibrary, writeJSON, sec, root };
