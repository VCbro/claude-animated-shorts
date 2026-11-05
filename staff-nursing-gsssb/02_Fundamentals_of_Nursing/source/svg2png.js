// Converts every SVG in ../images/svg to a PNG in ../images/png (2x scale).
// Usage: node svg2png.js [name-filter]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const svgDir = path.join(__dirname, '..', 'images', 'svg');
  const pngDir = path.join(__dirname, '..', 'images', 'png');
  fs.mkdirSync(pngDir, { recursive: true });
  const filter = process.argv[2] || '';
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const f of fs.readdirSync(svgDir).filter(f => f.endsWith('.svg') && f.includes(filter))) {
    const svg = fs.readFileSync(path.join(svgDir, f), 'utf8');
    const vb = svg.match(/viewBox="([\d.\s-]+)"/)[1].split(/\s+/).map(Number);
    const w = Math.round(vb[2]), h = Math.round(vb[3]);
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${w}" height="${h}" `)}</body></html>`);
    await page.screenshot({ path: path.join(pngDir, f.replace('.svg', '.png')), clip: { x: 0, y: 0, width: w, height: h }, omitBackground: true });
    console.log('png:', f);
  }
  await browser.close();
})();
