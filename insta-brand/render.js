const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1080,height:1080}});
  const fs=require('fs'); const svg=fs.readFileSync(process.argv[2],'utf8');
  await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet"></head><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.waitForTimeout(1500); await p.evaluate(()=>document.fonts.ready); await p.screenshot({path:process.argv[3], omitBackground:true, clip:{x:0,y:0,width:1080,height:1080}});
  await b.close();
})();
