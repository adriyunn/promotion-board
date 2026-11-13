// Assembles sections/*.html into study_guide.html (auto-numbered, with TOC) and renders the PDF.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const dir = __dirname;
const { ORDER } = require('./order');

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
