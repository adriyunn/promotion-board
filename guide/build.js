// Assembles sections/*.html into study_guide.html (auto-numbered, with TOC) and renders the PDF.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = __dirname;
const ORDER = [
  // [file, short TOC subtitle]
  ['creeds', 'NCO Creed, Soldier\'s Creed, Army Profession'],
  ['board', 'Reporting script, AGSU checklist'],
  ['coc', 'Fill-in sheet'],
  ['nco', 'NCO history, why you, why now'],
  ['basics', 'Mission, organization, ranks, flag'],
  ['leadership', 'ADP 6-22, ATP 6-22.1, NCOER'],
  ['regs', 'AR series, key regs, UCMJ, programs'],
  ['sharp', 'AR 600-52, AR 600-20 Ch 6, AR 600-92'],
  ['wear', 'AR 670-1, grooming directives'],
  ['promo', 'AR 600-8-19, waist-to-height'],
  ['h2f', 'AD 2026-07, AFT, CFT, PRT drills'],
  ['benefits', 'TA, BRS, SGLI, resources, MRT'],
  ['training', '8-step model, AAR, risk, OPSEC, MOPP'],
  ['tactics', 'TLPs, OPORD, team leader, ICVV'],
  ['acronyms', 'Control measures, orders, reports'],
  ['weapons', 'Shot process, safety, M4/ACOG'],
  ['systems', 'Every infantry weapon + Stryker family'],
  ['comms', 'Phonetics, prowords, PMCS, property'],
  ['firstaid', 'ATP 4-02.11, MARCH, 9-line'],
  ['landnav', 'Terrain, map colors, compass'],
  ['drill', 'TC 3-21.5, AR 600-25'],
  ['unit', 'Lineage, Medal of Honor, IVY standards'],
  ['wars', 'U.S. wars, 4ID and 12th Infantry in combat'],
  ['scenarios', '"What would you do" with model answers'],
  ['plan', 'Day by day to 20 Nov'],
  ['index', 'ADP vs AR, index, sources'],
];

const read = (n) => fs.readFileSync(path.join(dir, 'sections', n + '.html'), 'utf8');
const num = {};
ORDER.forEach(([n], i) => { num[n] = i + 1; });

const title = (html) => (html.match(/<h2>(.*?)<\/h2>/) || [, ''])[1];
const toc = '<div class="toc">\n' + ORDER.map(([n, sub]) =>
  `    <div><b>${num[n]}</b><span>${title(read(n))}<small>${sub}</small></span></div>`).join('\n') + '\n  </div>';

const fill = (html, n) => html
  .replace(/\{\{N\}\}/g, n === undefined ? '' : String(num[n]))
  .replace(/\{\{REF:(\w+)\}\}/g, (_, k) => { if (!num[k]) throw new Error('bad ref ' + k); return String(num[k]); })
  .replace('{{TOC}}', toc);

let body = fill(read('cover')) + '\n' + fill(read('start'));
for (const [n] of ORDER) body += '\n' + fill(read(n), n);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>2026 E-5 Battalion Board Study Guide | C Co, 2-12 IN</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(dir, 'study_guide.html'), html);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(dir, 'study_guide.html'), { waitUntil: 'networkidle' });
  await page.pdf({
    path: path.resolve(dir, '..', '2026_E5_Board_Study_Guide_C-2-12IN.pdf'),
    format: 'Letter', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-family:Inter,sans-serif;font-size:7px;color:#8a8f88;padding:0 0.5in;display:flex;justify-content:space-between"><span>E-5 BATTALION BOARD · C CO, 2-12 IN · 20 NOV 2026</span><span class="pageNumber"></span></div>',
  });
  await browser.close();
  console.log('built');
})();
