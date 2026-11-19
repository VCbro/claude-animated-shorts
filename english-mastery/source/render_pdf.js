// Renders the built HTML to an A4 PDF with page numbers, clickable links and PDF bookmarks (outline).
// Usage: node render_pdf.js in.html out.pdf "footer text"
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [inHtml, outPdf, footer] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(inHtml), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: outPdf,
    format: 'A4',
    printBackground: true,
    outline: true,
    tagged: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;font-size:8px;font-family:Arial;color:#78909c;padding:0 13mm;display:flex;justify-content:space-between">
      <span>${footer || 'English Mastery Notebook'}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' },
  });
  await browser.close();
  console.log('pdf:', outPdf);
})();
