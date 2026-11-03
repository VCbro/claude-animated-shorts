const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const FD = path.resolve('node_modules/@fontsource/baloo-2/files');
const font = (n) => 'data:font/woff2;base64,' + fs.readFileSync(FD + '/' + n).toString('base64');
const IMG = (n) => 'data:image/jpeg;base64,' + fs.readFileSync(path.resolve('out/' + n)).toString('base64');
const css = `
@font-face{font-family:B;font-weight:800;src:url(${font('baloo-2-devanagari-800-normal.woff2')})}
@font-face{font-family:B;font-weight:800;src:url(${font('baloo-2-latin-800-normal.woff2')});unicode-range:U+0000-00FF}
*{margin:0;box-sizing:border-box} body{background:#05060a;font-family:B;font-weight:800;overflow:hidden}
.o{-webkit-text-stroke:0; text-shadow: 0 0 0 #000}
.big{color:#ffd23a;paint-order:stroke fill;-webkit-text-stroke:18px #120a00;filter:drop-shadow(0 10px 18px rgba(0,0,0,.8))}
.wh{color:#fff;paint-order:stroke fill;-webkit-text-stroke:14px #000;filter:drop-shadow(0 8px 14px rgba(0,0,0,.8))}
.red{display:inline-block;background:#e01414;color:#fff;border-radius:24px;border:6px solid #fff;box-shadow:0 10px 30px rgba(0,0,0,.6),0 0 40px rgba(255,40,40,.6)}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,200,90,.55),rgba(255,160,40,0) 70%)}
`;
const vertical = `<html><head><style>${css}</style></head><body style="width:1080px;height:1920px;position:relative">
<img src="${IMG('th_0330.jpg')}" style="position:absolute;left:-150px;top:-80px;width:1300px;height:2311px;object-fit:cover">
<div class="glow" style="left:180px;top:1130px;width:600px;height:420px;opacity:.6"></div>
<div style="position:absolute;top:0;left:0;right:0;height:640px;background:linear-gradient(#05060a 55%,rgba(5,6,10,0))"></div>
<div style="position:absolute;bottom:0;left:0;right:0;height:520px;background:linear-gradient(rgba(5,6,10,0),#05060a 70%)"></div>
<div style="position:absolute;top:90px;width:100%;text-align:center">
 <div class="big" style="font-size:190px;line-height:1.05">घड़ी के<br>अंदर क्या है?</div>
</div>
<div style="position:absolute;bottom:190px;width:100%;text-align:center">
 <div class="red" style="font-size:92px;padding:20px 42px 4px">1 सेकंड में 32,768 बार!</div>
</div>
<div style="position:absolute;bottom:70px;width:100%;text-align:center"><div class="wh" style="font-size:66px">मैकेनिकल vs क्वार्ट्ज़ ⚙️</div></div>
<svg style="position:absolute;left:560px;top:1250px" width="260" height="200" viewBox="0 0 260 200"><path d="M250 30 L90 120 L110 70 L10 150 L95 175 L80 140 Z" fill="#ff2a2a" stroke="#fff" stroke-width="8" stroke-linejoin="round"/></svg>
</body></html>`;
const wide = `<html><head><style>${css}</style></head><body style="width:1280px;height:720px;position:relative">
<img src="${IMG('th_0330.jpg')}" style="position:absolute;left:600px;top:-210px;width:700px;height:1244px;object-fit:cover">
<img src="${IMG('th_0100.jpg')}" style="position:absolute;left:-40px;top:-260px;width:620px;height:1102px;object-fit:cover;opacity:.95">
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,6,10,.15),rgba(5,6,10,.0) 40%,rgba(5,6,10,.0) 60%,rgba(5,6,10,.15))"></div>
<div style="position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(rgba(5,6,10,0),rgba(5,6,10,.92) 60%)"></div>
<div style="position:absolute;left:0;right:0;top:0;height:230px;background:linear-gradient(rgba(5,6,10,.9),rgba(5,6,10,0))"></div>
<div style="position:absolute;top:18px;width:100%;text-align:center"><div class="big" style="font-size:118px;-webkit-text-stroke:14px #120a00">घड़ी के अंदर क्या है?</div></div>
<div style="position:absolute;bottom:40px;width:100%;text-align:center"><div class="red" style="font-size:66px;padding:14px 34px 2px;border-width:5px">1 सेकंड में 32,768 बार!</div></div>
</body></html>`;
(async () => {
  const b = await chromium.launch();
  for (const [html, w, h, out] of [[vertical, 1080, 1920, 'thumbnail_1080x1920.jpg'], [wide, 1280, 720, 'thumbnail_1280x720.jpg']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: 'out/' + out, type: 'jpeg', quality: 92 }); await p.close();
  }
  await b.close();
})();
