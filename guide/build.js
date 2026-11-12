const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'study_guide.html'), { waitUntil: 'networkidle' });
  await page.pdf({
    path: path.resolve(__dirname, '..', '2026_E5_Board_Study_Guide_C-2-12IN.pdf'),
    format: 'Letter', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font-family:Inter,sans-serif;font-size:7px;color:#8a8f88;padding:0 0.6in;display:flex;justify-content:space-between"><span>E-5 BATTALION BOARD · C CO, 2-12 IN · 20 NOV 2026</span><span class="pageNumber"></span></div>',
  });
  await browser.close();
})();
