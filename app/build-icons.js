// Renders the app icons (gold ivy leaf on black) to PNG with Playwright.
const { chromium } = require('playwright');
const path = require('path');
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#121412"/><rect x="0" y="182" width="200" height="18" fill="#f2c200"/>
<g fill="#f2c200" transform="translate(100 92) scale(0.62) translate(-100 -100)"><path d="M100 100 C 70 70, 60 30, 100 10 C 140 30, 130 70, 100 100Z"/><path d="M100 100 C 130 70, 170 60, 190 100 C 170 140, 130 130, 100 100Z"/><path d="M100 100 C 130 130, 140 170, 100 190 C 60 170, 70 130, 100 100Z"/><path d="M100 100 C 70 130, 30 140, 10 100 C 30 60, 70 70, 100 100Z"/></g></svg>`;
(async () => {
  const b = await chromium.launch();
  for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(`<style>html,body{margin:0}</style>${SVG.replace('<svg ', `<svg width="${size}" height="${size}" `)}`);
    await p.screenshot({ path: path.join(__dirname, '..', 'docs', 'icons', name) });
    await p.close();
  }
  await b.close();
  console.log('icons written');
})();
