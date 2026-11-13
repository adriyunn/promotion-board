// Pure functions that turn guide section HTML into question-bank items.
const { ORDER } = require('../guide/order');
const { categoryOf } = require('./categories');

const NUM = Object.fromEntries(ORDER.map(([k], i) => [k, i + 1]));
const ENTITIES = { '&amp;': '&', '&nbsp;': ' ', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const TAG_RE = /<span class="tag t-(\w+)">[^<]*<\/span>/g;

function stripTags(html) {
  const tags = [];
  let s = html.replace(TAG_RE, (_, t) => { if (!tags.includes(t)) tags.push(t); return ' '; });
  s = s.replace(/\{\{REF:(\w+)\}\}/g, (_, k) => String(NUM[k] ?? ''));
  s = s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '');
  s = s.replace(/&(amp|nbsp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]);
  s = s.replace(/\s+/g, ' ').replace(/\s+([.,;:)])/g, '$1').trim();
  return { text: s, tags };
}

const pad = (n) => String(n).padStart(2, '0');

function makeItem(section, n, qHtml, aHtml, extra = {}) {
  const q = stripTags(qHtml), a = stripTags(aHtml);
  const tags = [...new Set([...q.tags, ...a.tags])];
  return { id: `${section}-${pad(n)}`, section, category: categoryOf(section), q: q.text, a: a.text, tags, mc: false, ...extra };
}

function extractQAs(html, section) {
  const re = /<div class="qa"><div class="q">([\s\S]*?)<\/div><div class="a">([\s\S]*?)<\/div><\/div>/g;
  return [...html.matchAll(re)].map((m, i) => makeItem(section, i + 1, m[1], m[2]));
}

function extractScenarios(html) {
  const re = /<tr><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g;
  return [...html.matchAll(re)].map((m, i) => makeItem('scenarios', i + 1, m[1], m[2]));
}

function extractCorrections(html) {
  const re = /<tr><td><span class="tag t-fixed">Fixed<\/span>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><td>[\s\S]*?<\/td><\/tr>/g;
  return [...html.matchAll(re)].map((m, i) => {
    const it = makeItem('corrections', i + 1, m[1], m[2]);
    it.q = 'Correct this: ' + it.q;
    it.tags = it.tags.filter((t) => t !== 'fixed');
    return it;
  });
}

module.exports = { stripTags, extractQAs, extractScenarios, extractCorrections, NUM };
