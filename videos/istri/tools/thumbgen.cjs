// node thumbgen.cjs <config.json>  — vertical (1080x1920) + wide (1280x720) thumbnails from a 3D still + Hindi text
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const C = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const FD = path.resolve(__dirname, '../node_modules/@fontsource/baloo-2/files');
const font = (n) => 'data:font/woff2;base64,' + fs.readFileSync(FD + '/' + n).toString('base64');
const img = (p) => 'data:image/jpeg;base64,' + fs.readFileSync(p).toString('base64');
const css = `@font-face{font-family:B;font-weight:800;src:url(${font('baloo-2-devanagari-800-normal.woff2')})}
@font-face{font-family:B;font-weight:800;src:url(${font('baloo-2-latin-800-normal.woff2')});unicode-range:U+0000-00FF}
*{margin:0;box-sizing:border-box} body{background:#05060a;font-family:B,sans-serif;font-weight:800;overflow:hidden;position:relative}
.big{color:${C.titleColor};paint-order:stroke fill;-webkit-text-stroke:18px #0b0600;filter:drop-shadow(0 10px 18px rgba(0,0,0,.8))}
.wh{color:#fff;paint-order:stroke fill;-webkit-text-stroke:14px #000;filter:drop-shadow(0 8px 14px rgba(0,0,0,.8))}
.ban{display:inline-block;background:${C.banner};color:#fff;border-radius:24px;border:6px solid #fff;box-shadow:0 10px 30px rgba(0,0,0,.6),0 0 40px ${C.banner}}`;
const V = `<html><head><style>${css}</style></head><body style="width:1080px;height:1920px">
<img src="${img(C.image)}" style="position:absolute;left:${C.vx ?? -150}px;top:${C.vy ?? -80}px;width:${C.vw ?? 1300}px;object-fit:cover">
<div style="position:absolute;top:0;left:0;right:0;height:620px;background:linear-gradient(#05060a 55%,rgba(5,6,10,0))"></div>
<div style="position:absolute;bottom:0;left:0;right:0;height:520px;background:linear-gradient(rgba(5,6,10,0),#05060a 70%)"></div>
<div style="position:absolute;top:90px;width:100%;text-align:center"><div class="big" style="font-size:${C.titleSize ?? 180}px;line-height:1.05">${C.title}</div></div>
<div style="position:absolute;bottom:190px;width:100%;text-align:center"><div class="ban" style="font-size:${C.banSize ?? 88}px;padding:20px 42px 4px">${C.ban}</div></div>
<div style="position:absolute;bottom:70px;width:100%;text-align:center"><div class="wh" style="font-size:64px">${C.sub}</div></div>
${C.arrow ? `<svg style="position:absolute;left:${C.arrow[0]}px;top:${C.arrow[1]}px" width="260" height="200" viewBox="0 0 260 200"><path d="M250 30 L90 120 L110 70 L10 150 L95 175 L80 140 Z" fill="#ff2a2a" stroke="#fff" stroke-width="8" stroke-linejoin="round"/></svg>` : ''}
</body></html>`;
const Wd = `<html><head><style>${css}</style></head><body style="width:1280px;height:720px">
<img src="${img(C.image)}" style="position:absolute;left:${C.wx ?? 340}px;top:${C.wy ?? -300}px;width:${C.ww ?? 620}px">
${C.image2 ? `<img src="${img(C.image2)}" style="position:absolute;left:${C.w2x ?? 760}px;top:${C.w2y ?? -300}px;width:620px">` : ''}
<div style="position:absolute;left:0;right:0;top:0;height:250px;background:linear-gradient(rgba(5,6,10,.92),rgba(5,6,10,0))"></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(rgba(5,6,10,0),rgba(5,6,10,.92) 60%)"></div>
<div style="position:absolute;top:14px;width:100%;text-align:center"><div class="big" style="font-size:${C.wTitleSize ?? 110}px;-webkit-text-stroke:14px #0b0600">${C.wTitle ?? C.title.replace(/<br>/g, ' ')}</div></div>
<div style="position:absolute;bottom:36px;width:100%;text-align:center"><div class="ban" style="font-size:64px;padding:14px 34px 2px;border-width:5px">${C.ban}</div></div>
</body></html>`;
(async () => {
  const b = await chromium.launch();
  for (const [html, w, h, out] of [[V, 1080, 1920, C.out + '_1080x1920.jpg'], [Wd, 1280, 720, C.out + '_1280x720.jpg']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: out, type: 'jpeg', quality: 92 }); await p.close();
  }
  await b.close();
})();
