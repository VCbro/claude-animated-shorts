const { chromium } = require('playwright');
const fs = require('fs');
const FD = __dirname + '/fonts';
const font = (n) => 'data:font/woff2;base64,' + fs.readFileSync(FD + '/' + n).toString('base64');
const css = `@font-face{font-family:B;font-weight:800;src:url(${font('baloo-2-devanagari-800-normal.woff2')})}
@font-face{font-family:B;font-weight:800;src:url(${font('baloo-2-latin-800-normal.woff2')});unicode-range:U+0000-00FF}
*{margin:0}body{overflow:hidden;font-family:B;font-weight:800}`;
// gear path
const gear = (cx, cy, R, r, n, tooth) => { let d = ''; for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, p = (Math.PI * 2) / n;
  const pts = [[R, a0], [R + tooth, a0 + p * 0.18], [R + tooth, a0 + p * 0.45], [R, a0 + p * 0.63]];
  pts.forEach(([rr, a], j) => d += (i === 0 && j === 0 ? 'M' : 'L') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1)); }
  return d + 'Z'; };
const logoSVG = (s) => `<svg width="${s}" height="${s}" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
<defs>
 <radialGradient id="bg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#22417c"/><stop offset="0.6" stop-color="#0f1f45"/><stop offset="1" stop-color="#060c1f"/></radialGradient>
 <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c2"/><stop offset="0.35" stop-color="#ffc94d"/><stop offset="0.7" stop-color="#e09a1f"/><stop offset="1" stop-color="#ffd978"/></linearGradient>
 <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff0ff"/><stop offset="1" stop-color="#3fa9ff"/></linearGradient>
 <filter id="sh"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.55"/></filter>
</defs>
<rect width="800" height="800" fill="url(#bg)"/>
<g opacity="0.12" fill="none" stroke="#9fc4ff" stroke-width="3">${[160,250,340].map(r=>`<circle cx="400" cy="400" r="${r}"/>`).join('')}</g>
<g filter="url(#sh)">
 <path d="${gear(400, 400, 250, 0, 14, 58)}" fill="url(#gold)" stroke="#7a4a08" stroke-width="6"/>
 <circle cx="400" cy="400" r="205" fill="#0d1b3d" stroke="#7a4a08" stroke-width="6"/>
 <path d="${gear(585, 600, 70, 0, 9, 24)}" fill="url(#blue)" stroke="#0b4a80" stroke-width="5"/>
 <circle cx="585" cy="600" r="30" fill="#0d1b3d"/>
 <text x="400" y="505" text-anchor="middle" font-family="B" font-weight="800" font-size="330" fill="url(#gold)" stroke="#3a2205" stroke-width="10" paint-order="stroke">?</text>
 <path d="M300 232 a150 150 0 0 1 200 0" stroke="#ffe59a" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.65"/>
</g></svg>`;
const logo = `<html><head><style>${css}</style></head><body style="width:800px;height:800px">${logoSVG(800)}</body></html>`;
const banner = `<html><head><style>${css}</style></head><body style="width:2560px;height:1440px;background:radial-gradient(ellipse at 50% 50%,#1c3a73 0%,#0b1733 55%,#040814 100%);position:relative">
<svg width="2560" height="1440" style="position:absolute;left:0;top:0">
 ${[[250,300,180,0.18],[2300,1150,220,0.15],[2200,250,130,0.12],[380,1180,150,0.12]].map(([x,y,r,o])=>`<path d="${gear(x,y,r,0,16,r*0.22)}" fill="none" stroke="#ffc94d" stroke-width="6" opacity="${o}"/>`).join('')}
 ${Array.from({length:40},(_,i)=>`<circle cx="${(i*263)%2560}" cy="${(i*397)%1440}" r="${3+(i%5)}" fill="#ffd978" opacity="${0.15+(i%4)*0.08}"/>`).join('')}
</svg>
<div style="position:absolute;left:507px;top:508px;width:1546px;height:423px;display:flex;align-items:center;gap:50px">
 <div style="width:360px;height:360px;border-radius:50%;overflow:hidden;flex:none;box-shadow:0 0 60px #ffc94d66">${logoSVG(360)}</div>
 <div>
  <div style="font-size:150px;line-height:1.0;background:linear-gradient(100deg,#fff1c2,#ffc94d 45%,#e09a1f 75%,#ffd978);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 8px 0 #2a1804)">कैसे चलता है?</div>
  <div style="font-size:64px;color:#ffffff;margin-top:14px">हर चीज़ के अंदर का राज़ – 3D में!</div>
  <div style="font-size:46px;color:#8fd6ff;margin-top:10px">⚙️ मशीनें • 🔌 घर की चीज़ें • 🔬 विज्ञान — हर हफ्ते नई वीडियो</div>
 </div>
</div></body></html>`;
(async () => { const b = await chromium.launch();
 for (const [h, w, ht, out] of [[logo, 800, 800, 'logo_800.png'], [banner, 2560, 1440, 'banner_2560x1440.png']]) {
  const p = await b.newPage({ viewport: { width: w, height: ht } }); await p.setContent(h, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: out }); await p.close(); }
 await b.close(); })();
