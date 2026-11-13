// CLI: builds docs/data/bank.json from the guide sections.
const fs = require('fs');
const path = require('path');
const { ORDER } = require('../guide/order');
const { extractQAs, extractScenarios, extractCorrections } = require('./extract');

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

function writeJSON(rel, data) {
  const out = path.join(root, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(data));
}

if (require.main === module) {
  const bank = buildBank();
  writeJSON('docs/data/bank.json', bank);
  console.log(`bank.json: ${bank.length} items`);
}

module.exports = { buildBank, writeJSON, sec, root };
