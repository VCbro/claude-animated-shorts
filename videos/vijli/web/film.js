// हाजी कासम की वीजळी — image-led historical documentary (engine: ./engine.js)
import { add, start, A, K, R, win, eio, eob, ss, lerp, clamp, rnd, ctx, cam, camKeys, screen, text, label, panel, line, flow,
         glowDot, fillRR, rr, lin, rad, TAU, END, W, H, scr, CAM } from './engine.js';

// ================================================================== images
const NAMES = {
  1: '01_Vaitarna.png', 2: '02_Mandvi_Harbor_Departure_1888.png', 3: '03_Inquiry.jpg', 4: '04_Blue-and-Gold_Teacups_in_1880s_Bombay.png',
  5: '05_Gujarati_wedding_courtyard_awaiting_the_procession.png', 6: '06_Ropework_on_the_Scottish_Docks.png', 7: '07_Steam_Engine_Crank_and_Flywheel.png',
  8: '08_Kutch_travelers_luggage_beside_the_boat.png', 9: '09_Sailboat_Beyond_the_Saurashtra_Coast.png', 10: '10_Charcoal_Clouds_Over_the_Arabian_Sea.png',
  11: '11_Windblown_Salt_Spray_Over_Arabian_Swells.png', 12: '12_Distant_Steamer_Through_Rain.png', 13: '13_Dawn_Silence_Over_the_Arabian_Sea.png',
  14: '14_Empty_Chairs_by_the_Teak_Door.png', 15: '15_Kutch_wedding_preparations.png', 16: '16_Ravanhatta_Song_by_Lamplight.png' };
const IMG = {};
await Promise.all(Object.entries(NAMES).map(([k, f]) => new Promise((res) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.src = '/images/' + f; })));

const KIND = { 1: 'मूल तस्वीर · 1885', 3: 'मूल दस्तावेज़ · 1888–89', 4: 'पारिवारिक स्मृति · प्रतीकात्मक चित्र', 14: 'पारिवारिक स्मृति · प्रतीकात्मक चित्र',
  5: 'लोकगीत का दृश्यांकन', 15: 'लोकगीत का दृश्यांकन', 16: 'लोकगीत का दृश्यांकन', 12: 'दृश्य पुनर्निर्माण · प्रतीकात्मक' };
const tagOf = (k) => KIND[k] || 'दृश्य पुनर्निर्माण';

// Ken Burns: cover-fit image k, zoom z0->z1 and focus (fx,fy in 0..1) moving f0->f1 over [a,b]
function kb(k, t, a, b, o = {}) {
  const im = IMG[k], u = eio((t - a) / Math.max(0.1, b - a));
  const z = lerp(o.z0 ?? 1.04, o.z1 ?? 1.12, u);
  const f0 = o.f0 || [0.5, 0.5], f1 = o.f1 || f0;
  const fx = lerp(f0[0], f1[0], u), fy = lerp(f0[1], f1[1], u);
  const s = Math.max(W / im.width, H / im.height) * z, w = im.width * s, h = im.height * s;
  const x = clamp(W / 2 - fx * w, W - w, 0), y = clamp(H / 2 - fy * h, H - h, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(im, x, y, w, h);
  // gentle warm grade + bottom shade for captions
  ctx.fillStyle = 'rgba(60,35,10,.10)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = lin(0, H * 0.62, 0, H, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.55)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (o.tag !== false) tag(tagOf(k), t, a);
}
function tag(s, t, a) { text(`<span class="tag">${s}</span>`, 48, 52, { align: 'left', size: 22, a: R(t, a + 0.3, 0.6) * 0.95 }); }
function shade(a) { if (a > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(8,6,4,${a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
// image sequence inside one scene: [[k, from, to, opts], ...] with 0.8 s crossfades
function seq(t, items) {
  items.forEach(([k, a, b, o], i) => {
    const fadeIn = i === 0 ? 1 : R(t, a - 0.4, 0.8);
    if (t < a - 0.4 || t > b + 0.4) return;
    ctx.save(); ctx.globalAlpha = fadeIn; kb(k, t, a - 0.4, b + 0.4, o || {}); ctx.restore();
  });
}

// ---------- paper + desk backgrounds
const PAPER = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d'), im = g.createImageData(512, 512);
  for (let i = 0; i < im.data.length; i += 4) { const v = 225 + 25 * rnd(i * 0.37) - 10 * rnd(i * 1.7); im.data[i] = v; im.data[i + 1] = v * 0.93; im.data[i + 2] = v * 0.80; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); return c; })();
function desk() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = lin(0, 0, W, H, [[0, '#2a1d12'], [1, '#120c07']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rad(W * 0.5, H * 0.45, 0, 1000, [[0, 'rgba(255,200,130,.16)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function paperRect(x, y, w, h, o = {}) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = ctx.createPattern(PAPER, 'repeat'); ctx.fillRect(x, y, w, h); ctx.restore();
  ctx.save(); ctx.fillStyle = rad(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, Math.max(w, h) * 0.75, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(110,70,20,.28)']]); ctx.fillRect(x, y, w, h); ctx.restore();
}

// ---------- archive card for photo 01 (aspect kept)
const P1 = { w: 900 };
function card01(t, a, o = {}) {
  desk();
  const im = IMG[1], pw = P1.w, ph = pw * im.height / im.width;
  const cw = pw + 90, chh = ph + 190;
  camKeys(t, o.cam || [[a, 960, 540, 1.0], [a + 12, 960, 540, 1.06]]);
  const cx = 960 - cw / 2, cy = 470 - chh / 2;
  paperRect(cx, cy, cw, chh);
  ctx.save(); ctx.fillStyle = '#1a140e'; ctx.fillRect(cx + 45 - 3, cy + 45 - 3, pw + 6, ph + 6);
  ctx.filter = 'sepia(.25) contrast(1.05)'; ctx.drawImage(im, cx + 45, cy + 45, pw, ph); ctx.filter = 'none'; ctx.restore();
  // photo corners
  for (const [x, y, r] of [[cx + 45, cy + 45, 0], [cx + 45 + pw, cy + 45, 1], [cx + 45 + pw, cy + 45 + ph, 2], [cx + 45, cy + 45 + ph, 3]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(r * Math.PI / 2); ctx.fillStyle = '#3b2a1a'; ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(36, -14); ctx.lineTo(-14, 36); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const P = (u, v) => [cx + 45 + u / 320 * pw, cy + 45 + v / 214 * ph]; // photo pixel -> world
  const [lx, ly] = scr(cx + 60, cy + 45 + ph + 70);
  text('<span style="font-family:T;font-style:italic;color:#3a2614">SS Vaitarna · Grangemouth Docks, 1885</span>', lx, ly, { align: 'left', size: 40, a: R(t, a + 0.4, 0.6) * (o.capA ?? 1) });
  text('<span style="font-family:B;font-weight:600;color:#5b4128">Falkirk Collections, P09431 · अज्ञात फोटोग्राफर · Wikimedia Commons (Public Domain)</span>', lx, ly + 48 * CAM.z, { align: 'left', size: 22, a: R(t, a + 0.8, 0.6) * (o.capA ?? 1) });
  tag(tagOf(1), t, a);
  return P;
}

// ---------- report page 03
function report(t, a, keys, hl = {}) {
  desk();
  camKeys(t, keys);
  const im = IMG[3], h = 1000, w = h * im.width / im.height, x = 960 - w / 2, y = 40;
  paperRect(x - 6, y - 6, w + 12, h + 12);
  ctx.drawImage(im, x, y, w, h);
  const Q = (u, v) => [x + u / 860 * w, y + v / 1200 * h];
  const box = (u0, v0, u1, v1, a2, col = 'rgba(214,150,40,') => {
    if (a2 <= 0.01) return; const [x0, y0] = Q(u0, v0), [x1, y1] = Q(u1, v1);
    ctx.save(); ctx.fillStyle = col + (0.22 * a2) + ')'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = col + (0.9 * a2) + ')'; ctx.lineWidth = 2.5 / CAM.z; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
  };
  const under = (u0, u1, v, a2) => { if (a2 <= 0.01) return; const [x0, y0] = Q(u0, v), [x1] = Q(u0 + (u1 - u0) * clamp(a2), v);
    ctx.save(); ctx.strokeStyle = 'rgba(200,40,30,.85)'; ctx.lineWidth = 3 / CAM.z; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke(); ctx.restore(); };
  // dim everything except row 3 when focused
  if (hl.dim) { ctx.save(); ctx.fillStyle = `rgba(20,12,4,${0.45 * hl.dim})`; const [x0, y0] = Q(296, 350), [x1, y1] = Q(790, 400);
    ctx.fillRect(x, y, w, y0 - y); ctx.fillRect(x, y1, w, y + h - y1); ctx.fillRect(x, y0, x0 - x, y1 - y0); ctx.fillRect(x1, y0, x + w - x1, y1 - y0); ctx.restore(); }
  box(360, 126, 505, 150, hl.head || 0); box(255, 150, 705, 180, hl.head || 0);
  box(298, 351, 788, 399, hl.row || 0);
  box(392, 354, 474, 369, hl.name || 0, 'rgba(200,40,30,');
  under(525, 782, 365.5, hl.cyc || 0);
  under(528, 782, 375, hl.sup || 0); under(528, 782, 384.5, hl.sup2 || 0); under(528, 652, 393.5, hl.sup3 || 0);
  tag(tagOf(3), t, a);
  return Q;
}

// ---------- code-drawn map of the Kutch / Saurashtra coast
const PX = (lon, lat) => [300 + (lon - 68) * 330, 120 + (24.2 - lat) * 330];
const LAND = [[68.2, 23.6], [68.4, 23.9], [68.75, 24.25], [70.5, 24.25], [71.2, 24.2], [73.6, 24.2], [73.6, 18.6], [72.85, 18.6], [72.82, 18.95], [72.85, 19.3], [72.72, 19.97],
  [72.83, 20.41], [72.85, 20.9], [72.7, 21.15], [72.62, 21.6], [72.6, 21.95], [72.65, 22.25], [72.4, 22.3], [72.2, 22.1], [72.15, 21.76], [71.95, 21.35], [71.76, 21.09],
  [71.4, 20.9], [70.98, 20.71], [70.37, 20.9], [70.12, 21.12], [69.8, 21.4], [69.6, 21.64], [69.25, 21.95], [68.97, 22.24], [69.07, 22.47], [69.4, 22.42], [69.75, 22.42],
  [70.06, 22.5], [70.35, 22.75], [70.45, 22.95], [70.2, 23.03], [69.72, 22.84], [69.35, 22.83], [69.0, 22.9], [68.72, 23.22], [68.55, 23.5], [68.2, 23.6]];
const RANN = [[69.0, 24.0], [70.8, 24.12], [71.25, 23.65], [70.6, 23.3], [69.8, 23.7], [69.0, 23.62]];
const PORT = { mandvi: [69.35, 22.83], dwarka: [68.97, 22.24], porbandar: [69.6, 21.64], mangrol: [70.12, 21.12], mahuva: [71.76, 21.09], bombay: [72.82, 18.95], okha: [69.07, 22.47] };
const ROUTE1 = [[69.35, 22.8], [69.2, 22.7], [69.02, 22.56], [68.88, 22.4], [68.93, 22.26]];
const ROUTE2 = [[68.93, 22.22], [68.86, 22.0], [69.3, 21.58], [69.9, 21.02], [70.6, 20.6], [71.3, 20.52], [72.1, 20.38], [72.58, 19.9], [72.74, 19.2], [72.8, 18.98]];
function sub(pts, u) { const P = pts.map((p) => PX(...p)); let L = 0; const seg = []; for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(l); L += l; }
  let s = clamp(u) * L; const out = [P[0]]; for (let i = 1; i < P.length; i++) { if (s >= seg[i - 1]) { out.push(P[i]); s -= seg[i - 1]; } else { const f = s / seg[i - 1]; out.push([lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]); break; } } return out; }
function mapBase() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#1a130c'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const [x0, y0] = PX(66.0, 25.6), [x1, y1] = PX(75.5, 17.0);
  ctx.save(); ctx.fillStyle = ctx.createPattern(PAPER, 'repeat'); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = 'rgba(86,120,118,.32)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);                       // sea tint
  for (let i = 0; i < 26; i++) { ctx.strokeStyle = 'rgba(60,90,90,.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0 + i * 80); ctx.bezierCurveTo(x0 + 600, y0 + i * 80 - 20, x0 + 1200, y0 + i * 80 + 20, x1, y0 + i * 80); ctx.stroke(); }
  ctx.beginPath(); LAND.forEach(([lo, la], i) => { const [x, y] = PX(lo, la); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
  ctx.fillStyle = ctx.createPattern(PAPER, 'repeat'); ctx.fill(); ctx.fillStyle = 'rgba(170,120,60,.22)'; ctx.fill();
  ctx.strokeStyle = '#4a3218'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); RANN.forEach(([lo, la], i) => { const [x, y] = PX(lo, la); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fillStyle = 'rgba(255,250,235,.45)'; ctx.fill();
  // graticule
  ctx.strokeStyle = 'rgba(74,50,24,.15)'; ctx.lineWidth = 1.5; for (let lo = 68; lo <= 74; lo++) { const [x] = PX(lo, 0); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
  for (let la = 19; la <= 24; la++) { const [, y] = PX(68, la); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
  ctx.restore();
}
function mapLabel(s, lon, lat, size, a, o = {}) {
  const [x, y] = scr(...PX(lon, lat));
  text(`<span style="font-family:T;${o.italic ? 'font-style:italic;' : ''}color:${o.color || '#3b2614'};text-shadow:0 0 12px rgba(255,240,215,.8)">${s}</span>`, x, y, { size: size * CAM.z, a, align: o.align || 'center' });
}
function portDot(key, a, name, o = {}) {
  if (a <= 0.01) return; const [x, y] = PX(...PORT[key]);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#7a1f12'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#f3e3c3'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  const [sx, sy] = scr(x + (o.dx ?? 18), y + (o.dy ?? -6));
  text(`<span style="font-family:T;color:#3b2614;text-shadow:0 0 10px rgba(255,240,215,.9)">${name}</span>`, sx, sy, { size: 40 * CAM.z, a, align: o.align || 'left' });
}
function route(pts, u, col, w, dash) { if (u <= 0.005) return; line(sub(pts, u), col, w, 0, dash); }
function zone(lon, lat, r, a, t) {
  if (a <= 0.01) return; const [x, y] = PX(lon, lat), p = 1 + 0.06 * Math.sin(t * 2);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rad(x, y, 0, r * p, [[0, 'rgba(160,40,20,.35)'], [1, 'rgba(160,40,20,0)']]); ctx.beginPath(); ctx.arc(x, y, r * p, 0, TAU); ctx.fill();
  ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(122,31,18,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, TAU); ctx.stroke(); ctx.restore();
}

// ---------- ledger card
function ledger(t, a, rows, o = {}) {
  desk(); screen();
  const x = 470, y = 140, w = 980, h = 760;
  paperRect(x, y, w, h);
  text('<span class="paper" style="font-size:44px">यात्रियों का प्रकाशित हिसाब</span>', 960, y + 70, { size: 44, a: R(t, a, 0.5) });
  ctx.save(); ctx.strokeStyle = 'rgba(60,35,15,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 80, y + 120); ctx.lineTo(x + w - 80, y + 120); ctx.stroke(); ctx.restore();
  rows.forEach(([lab, val, at, style], i) => {
    const al = R(t, at, 0.5); const yy = y + 190 + i * 92;
    if (style === 'rule') { ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = 'rgba(60,35,15,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 560, yy - 46); ctx.lineTo(x + w - 90, yy - 46); ctx.stroke(); ctx.restore(); }
    text(`<span class="paper" style="color:${style === 'sum' ? '#7a1f12' : '#2b1d10'}">${lab}</span>`, x + 100, yy, { size: 40, a: al, align: 'left' });
    text(`<span class="big" style="color:${style === 'sum' ? '#7a1f12' : '#2b1d10'}">${val}</span>`, x + w - 100, yy, { size: 52, a: al, align: 'right' });
  });
  if (o.note) text(`<span style="font-family:B;font-weight:600;color:#7a1f12">${o.note[0]}</span>`, 960, y + h - 60, { size: 30, a: R(t, o.note[1], 0.5) });
}

// ================================================================== SCENES
const T = (n) => A(n);
const PI_ = K.pause_intro, PS = K.pause_storm, PM = K.pause_mukhda2, OUT = K.outro;
function mukhda(t, a, b, y = 760) {
  const u = win(t, a + 0.6, b - 0.3, 0.8);
  text('<span class="tag">पारंपरिक गुजराती लोकगीत · मुखड़ा</span>', 960, y - 80, { size: 22, a: u });
  text('<span class="guj">હાજી કાસમ, તારી વીજળી રે</span>', 960, y, { size: 74, a: u, style: 'text-shadow:0 4px 30px rgba(0,0,0,.85)' });
  text('<span class="guj">મધદરિયે વેરણ થઈ.</span>', 960, y + 92, { size: 74, a: u, style: 'text-shadow:0 4px 30px rgba(0,0,0,.85)' });
  text('हाजी कासम, तुम्हारी वीजळी बीच समंदर में उजड़ गई', 960, y + 182, { size: 34, a: u * R(t, a + 1.6, 0.8), color: '#f5d79b', cls: 'ttl' });
}

// ---------- intro: the song
add(0, T('h0'), (t) => { kb(16, t, -0.5, T('h0') + 1, { z0: 1.12, z1: 1.04, f0: [0.35, 0.55], f1: [0.42, 0.5] }); shade(0.25); mukhda(t, PI_, T('h0'), 700); });
// ---------- hook
add(T('h0'), T('g_old'), (t) => {
  kb(13, t, T('h0') - 0.5, T('g_old') + 0.5, { z0: 1.0, z1: 1.1, f0: [0.5, 0.55] }); shade(0.2);
  const a1 = win(t, T('h0'), T('h_song') - 0.1, 0.6);
  text('<span class="big" style="letter-spacing:4px">1888</span>', 960, 300, { size: 150, a: a1, cls: 'ttl' });
  text('700 से ज़्यादा लोग · मंज़िल: बंबई', 960, 430, { size: 54, a: a1 * R(t, T('h0') + 2.0, 0.6), cls: 'ttl' });
  text('<span style="color:#f5d79b">कभी नहीं पहुँचा</span>', 960, 520, { size: 64, a: a1 * R(t, T('h_never'), 0.6), cls: 'ttl' });
  const a2 = R(t, T('h_song'), 0.9);
  text('<span class="chap">एक जहाज़ · एक सरकारी रिपोर्ट · एक लोकगीत</span>', 960, 330, { size: 26, a: a2 });
  text('हाजी कासम की वीजळी', 960, 440, { size: 124, a: a2, cls: 'ttl', color: '#f5d79b', scale: 0.96 + 0.04 * a2 });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a2; line([[960 - 300 * a2, 535], [960 + 300 * a2, 535]], '#e8c88c', 2); ctx.restore();
});
// ---------- the song + waiting
add(T('g_old'), T('p_photo'), (t) => {
  seq(t, [[16, T('g_old'), T('g_elder') + 1.5, { z0: 1.05, z1: 1.14, f0: [0.3, 0.5], f1: [0.25, 0.42] }],
          [5, T('g_elder') + 1.5, T('p_photo'), { z0: 1.12, z1: 1.04, f0: [0.62, 0.5], f1: [0.6, 0.48] }]]);
  text('हाजी कासम', 300, 840, { size: 70, cls: 'ttl', a: win(t, T('g_haji'), T('g_elder'), 0.5), color: '#f5d79b', align: 'left' });
  text('…उसकी <span style="color:#f5d79b">वीजळी</span>', 300, 930, { size: 56, cls: 'ttl', a: win(t, T('g_vijli'), T('g_elder'), 0.5), align: 'left' });
});
// ---------- photo 01
add(T('p_photo'), T('b_1885'), (t) => {
  const P = card01(t, T('p_photo'), { cam: [[T('p_photo'), 960, 540, 0.95], [T('p_masts') - 0.3, 960, 500, 1.15], [T('p_name'), 1180, 560, 1.35], [T('b_1885'), 1180, 560, 1.38]] });
  label('दो मस्तूल', ...P(56, 35), -90, -110, win(t, T('p_masts'), T('p_last'), 0.4));
  label('चिमनी', ...P(103, 80), -120, 90, win(t, T('p_chim'), T('p_last'), 0.4));
  label('डेक पर लोग', ...P(205, 118), 130, -120, win(t, T('p_deck'), T('p_last') + 0.5, 0.4));
  label('VAITARNA', ...P(258, 152), 120, 110, R(t, T('p_name') - 0.2, 0.4), 'जहाज़ बनाने वालों के रिकॉर्ड का नाम: वैतरणा');
  screen();
  const la = win(t, T('p_last'), T('p_name') + 0.8, 0.5); panel(610, 70, 700, 90, la, 'rgba(20,14,8,.85)');
  text('आखिरी यात्रा से पहले की तस्वीर', 960, 115, { size: 44, cls: 'ttl', a: la });
});
// ---------- 1885, Grangemouth
add(T('b_1885'), T('b_light'), (t) => {
  seq(t, [[6, T('b_1885'), T('b_steam'), { z0: 1.04, z1: 1.14, f0: [0.45, 0.5], f1: [0.6, 0.55] }], [7, T('b_steam'), T('b_light'), { z0: 1.15, z1: 1.04, f0: [0.7, 0.5], f1: [0.45, 0.5] }]]);
  const a = win(t, T('b_1885'), T('b_light'), 0.5);
  text('<span class="big">1885</span>', 120, 820, { size: 96, cls: 'ttl', a, align: 'left' });
  text('ग्रेंजमाउथ डॉकयार्ड कंपनी · स्कॉटलैंड', 120, 910, { size: 44, cls: 'ttl', a: a * R(t, T('b_yard'), 0.5), align: 'left' });
  text('यात्री + माल · भाप से चलने वाला स्टीमर', 120, 970, { size: 34, cls: 'ttl', a: a * R(t, T('b_steam'), 0.5), align: 'left', color: '#f5d79b' });
});
// ---------- electric light -> Vijli
add(T('b_light'), T('d_date'), (t) => {
  card01(t, T('b_light'), { cam: [[T('b_light'), 960, 540, 1.0], [T('d_date'), 960, 520, 1.08]], capA: 0.5 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = R(t, T('b_light') + 0.5, 1.2) * (0.85 + 0.15 * Math.sin(t * 3));
  for (const [u, v] of [[140, 112], [180, 112], [220, 114], [100, 118]]) { const x = 960 - (900 + 90) / 2 + 45 + u / 320 * 900, y = 470 - (900 * 214 / 320 + 190) / 2 + 45 + v / 214 * (900 * 214 / 320);
    ctx.fillStyle = rad(x, y, 0, 70, [[0, `rgba(255,230,160,${0.55 * g})`], [1, 'rgba(255,230,160,0)']]); ctx.beginPath(); ctx.arc(x, y, 70, 0, TAU); ctx.fill(); }
  ctx.restore();
  screen();
  const a = R(t, T('b_why'), 0.6);
  shade(0.35 * a);
  text('<span class="guj">વીજળી</span>', 760, 470, { size: 150, a, style: 'text-shadow:0 0 40px rgba(255,210,120,.6)' });
  text('=', 960, 470, { size: 90, a: R(t, T('b_means'), 0.4), cls: 'ttl' });
  text('बिजली', 1180, 470, { size: 130, a: R(t, T('b_means'), 0.4), cls: 'ttl', color: '#f5d79b' });
  text('नाम की एक प्रचलित व्याख्या: जहाज़ की बिजली की रोशनी', 960, 640, { size: 36, a: a, cls: 'ttl' });
});
// ---------- date card + Mandvi
add(T('d_date'), T('d_dwarka'), (t) => {
  seq(t, [[2, T('d_date') - 0.4, T('d_dwarka'), { z0: 1.08, z1: 1.0, f0: [0.4, 0.5], f1: [0.55, 0.5] }]]);
  const a = win(t, T('d_date'), T('d_mandvi') + 0.6, 0.6); shade(0.55 * a);
  text('<span class="chap">तीन साल बाद</span>', 960, 380, { size: 28, a });
  text('गुरुवार, 8 नवंबर 1888', 960, 480, { size: 104, cls: 'ttl', a, color: '#f5d79b' });
  text('मांडवी बंदरगाह, कच्छ', 120, 900, { size: 54, cls: 'ttl', a: R(t, T('d_mandvi') + 0.5, 0.6), align: 'left' });
});
// ---------- map: Mandvi -> Dwarka -> (planned) Bombay
add(T('d_dwarka'), T('n_q'), (t) => {
  const [mx, my] = PX(...PORT.mandvi), [dx, dy] = PX(...PORT.dwarka), [bx, by] = PX(...PORT.bombay);
  camKeys(t, [[T('d_dwarka'), (mx + dx) / 2, (my + dy) / 2, 1.5], [T('d_bombay'), 1300, 900, 0.62], [T('m_map') + 0.5, 1300, 900, 0.62],
              [T('m_gulf'), (mx + dx) / 2 + 60, my + 40, 1.6], [T('m_kutch') + 2, (mx + dx) / 2 + 150, my + 60, 1.25], [T('m_coast') + 0.4, 1150, 950, 0.66], [T('n_q'), 1200, 950, 0.64]]);
  mapBase();
  route(ROUTE1, (t - T('d_dwarka') - 0.3) / 2.2, '#7a1f12', 7);
  route(ROUTE2, (t - T('d_bombay') - 0.2) / 3.0, 'rgba(122,31,18,.85)', 5, [16, 12]);
  if (t > T('m_coast')) route(ROUTE2, 1, `rgba(214,150,40,${0.9 * R(t, T('m_coast'), 0.5)})`, 9, [16, 12]);
  const ga = win(t, T('m_gulf'), T('m_coast'), 0.4);
  if (ga > 0) { const [ox, oy] = PX(...PORT.okha); ctx.save(); ctx.globalAlpha = ga; line([[ox - 10, oy - 30], [mx - 40, my + 20]], '#2c5a66', 4, 0, [10, 10]); ctx.restore(); }
  portDot('mandvi', R(t, T('d_dwarka') - 0.4, 0.5), 'मांडवी', { dx: 18, dy: -20 });
  portDot('dwarka', R(t, T('d_dwarka') + 1.2, 0.5), 'द्वारका', { dx: -18, dy: 10, align: 'right' });
  portDot('bombay', R(t, T('d_bombay'), 0.5), 'बंबई (मुंबई)', { dx: -18, dy: 0, align: 'right' });
  mapLabel('कच्छ', 69.6, 23.35, 64, R(t, T('m_kutch') - 0.2, 0.5));
  mapLabel('सौराष्ट्र', 70.7, 21.9, 64, R(t, T('m_kutch') + 1.0, 0.5));
  mapLabel('कच्छ की खाड़ी', 69.75, 22.66, 32, ga + R(t, T('m_kutch'), 0.5) * 0.6, { italic: true, color: '#2c5a66' });
  mapLabel('मुहाना', 69.05, 22.66, 30, ga, { italic: true, color: '#2c5a66' });
  mapLabel('अरब सागर', 69.3, 20.4, 60, R(t, T('d_bombay'), 0.6) * 0.8, { italic: true, color: '#2c5a66' });
  mapLabel('नियोजित रास्ता', 71.1, 20.25, 40, R(t, T('d_bombay') + 1.5, 0.5), { italic: true, color: '#7a1f12' });
  screen(); tag('नक्शा · कोड से बनाया गया, अनुमानित तटरेखा', t, T('d_dwarka'));
});
// ---------- passengers: luggage, then the ledger
add(T('n_q'), T('x_never'), (t) => {
  if (t < T('n_520') + 0.4) { seq(t, [[8, T('n_q') - 0.4, T('n_520') + 0.4, { z0: 1.04, z1: 1.14, f0: [0.5, 0.6], f1: [0.42, 0.58] }]]);
    text('सिर्फ़ यात्री?  या चालक-दल भी?', 960, 220, { size: 60, cls: 'ttl', a: win(t, T('n_some'), T('n_520') + 0.3, 0.5) }); return; }
  ledger(t, T('n_520'), [['मांडवी से चढ़े यात्री', '520', T('n_520')], ['द्वारका में चढ़े यात्री', '+ 183', T('n_183')],
    ['कुल यात्री', '703', T('n_703'), 'rule'], ['चालक-दल', '+ 43', T('n_746')], ['कुल लोग', '746', T('n_746') + 1.4, 'sum']],
    { note: ['उस दौर की प्रकाशित खबर: 703 यात्री  ·  मूल यात्री-सूची इस पैकेज में उपलब्ध नहीं', T('n_news')] });
  text('<span class="tag">स्रोत: The Chilian Times (प्रकाशित संदर्भ) · पारिवारिक वृत्तांत</span>', 48, 52, { align: 'left', size: 22, a: R(t, T('n_520'), 0.5) });
});
// ---------- "did not reach" + storm interlude (no narration)
add(T('x_never'), T('r_page'), (t) => {
  seq(t, [[10, T('x_never') - 0.4, PS + 1.6, { z0: 1.0, z1: 1.08, f0: [0.5, 0.45] }], [11, PS + 1.6, PS + 5.2, { z0: 1.06, z1: 1.14, f0: [0.35, 0.5], f1: [0.5, 0.5] }],
          [12, PS + 5.2, PS + 8.8, { z0: 1.12, z1: 1.04, f0: [0.7, 0.5], f1: [0.66, 0.5] }], [13, PS + 8.8, T('r_page'), { z0: 1.0, z1: 1.06, f0: [0.5, 0.5] }]]);
  text('वैतरणा बंबई नहीं पहुँची', 960, 520, { size: 92, cls: 'ttl', a: win(t, T('x_never') + 0.2, PS + 2.0, 0.6), color: '#f3e9d6' });
});
// ---------- the inquiry report
add(T('r_page'), T('w_where'), (t) => {
  const Q0 = 960;
  const keys = [[T('r_page'), 960, 540, 1.0], [T('r_head') + 0.2, 960, 170, 1.9], [T('r_row') - 0.2, 960, 200, 1.7], [T('r_row') + 0.8, 1050, 352, 2.3],
                [T('r_court'), 1090, 350, 2.8], [T('r_next'), 1090, 356, 2.8], [T('r_future'), 1100, 356, 2.4], [T('w_where'), 1060, 356, 2.2]];
  report(t, T('r_page'), keys, { head: win(t, T('r_head'), T('r_row'), 0.4), row: R(t, T('r_row'), 0.4), dim: R(t, T('r_row') + 0.4, 0.8),
    name: win(t, T('r_spell'), T('r_court') + 0.6, 0.3), cyc: (t - T('r_cyclone')) / 1.2, sup: (t - T('r_super') - 0.3) / 1.4, sup2: (t - T('r_super') - 1.4) / 1.4, sup3: (t - T('r_super') - 2.6) / 1.0 });
  screen();
  text('Bombay Administration Report 1888–89 · Marine Courts of Inquiry', 960, 1000 - 0, { size: 26, a: win(t, T('r_page') + 0.5, T('r_head') + 1, 0.5), color: '#e8d4ad' });
  const cy = R(t, T('r_cyclone'), 0.5) * (1 - R(t, T('r_next') - 0.2, 0.4));
  panel(560, 760, 800, 150, cy, 'rgba(20,14,8,.85)');
  text('अदालत का निष्कर्ष: <span style="color:#f5d79b">स्टीमर चक्रवात में डूबा</span>', 960, 835, { size: 44, a: cy, cls: 'ttl' });
  const su = R(t, T('r_super') + 0.3, 0.5) * (1 - R(t, T('w_where') - 0.3, 0.4));
  panel(330, 760, 1260, 170, su, 'rgba(20,14,8,.85)');
  text('सुझाव: बंबई बंदरगाह के तटीय स्टीमरों पर निगरानी', 960, 815, { size: 42, a: su, cls: 'ttl' });
  text('ताकि यात्रियों की सुरक्षा बेहतर हो', 960, 875, { size: 38, a: su, cls: 'ttl', color: '#f5d79b' });
});
// ---------- where did it sink? uncertainty zones
add(T('w_where'), T('w_deck'), (t) => {
  camKeys(t, [[T('w_where'), 1250, 900, 0.62], [T('w_mang'), 1150, 960, 0.75], [T('w_none'), 1250, 920, 0.64]]);
  mapBase();
  route(ROUTE1, 1, '#7a1f12', 7); route(ROUTE2, 1, 'rgba(122,31,18,.5)', 5, [16, 12]);
  portDot('mandvi', 1, 'मांडवी', { dx: 18, dy: -20 }); portDot('dwarka', 1, 'द्वारका', { dx: -18, dy: 10, align: 'right' }); portDot('bombay', 1, 'बंबई', { dx: -18, align: 'right' });
  zone(69.45, 21.45, 90, R(t, T('w_porb'), 0.6), t); zone(69.95, 20.9, 90, R(t, T('w_mang'), 0.6), t + 1); zone(71.75, 20.85, 90, R(t, T('w_mahuva'), 0.6), t + 2);
  portDot('porbandar', R(t, T('w_porb'), 0.5), 'पोरबंदर', { dx: 18, dy: -10 });
  portDot('mangrol', R(t, T('w_mang'), 0.5), 'मांगरोल', { dx: 18, dy: -10 });
  portDot('mahuva', R(t, T('w_mahuva'), 0.5), 'महुवा', { dx: 18, dy: -10 });
  mapLabel('संग्रह-विवरण', 69.0, 21.2, 32, R(t, T('w_porb') + 0.4, 0.5), { italic: true, color: '#7a1f12', align: 'right' });
  mapLabel('पारिवारिक वृत्तांत', 69.9, 20.55, 32, R(t, T('w_mang') + 0.4, 0.5), { italic: true, color: '#7a1f12' });
  mapLabel('लोकसाहित्य की टिप्पणी', 71.75, 20.5, 32, R(t, T('w_mahuva') + 0.4, 0.5), { italic: true, color: '#7a1f12' });
  screen();
  text('डूबने की <span style="color:#f5d79b">ठीक जगह</span>: स्रोत अलग-अलग', 960, 110, { size: 54, cls: 'ttl', a: R(t, T('w_where') + 0.5, 0.5) * (1 - R(t, T('w_none') - 0.2, 0.4)) });
  text('सरकारी सारांश में ठीक जगह दर्ज नहीं', 960, 110, { size: 54, cls: 'ttl', a: R(t, T('w_none'), 0.5), color: '#f5d79b' });
  tag('नक्शा · कोई सटीक पिन नहीं, केवल स्रोतों के उल्लेख', t, T('w_where'));
});
// ---------- silence on deck -> family memory
add(T('w_deck'), T('s_report'), (t) => {
  seq(t, [[13, T('w_deck') - 0.4, T('f_shore'), { z0: 1.06, z1: 1.0, f0: [0.5, 0.5] }], [14, T('f_shore'), T('f_cup') + 0.5, { z0: 1.0, z1: 1.1, f0: [0.35, 0.55], f1: [0.42, 0.55] }],
          [4, T('f_cup') + 0.5, T('s_report'), { z0: 1.0, z1: 1.18, f0: [0.6, 0.6], f1: [0.64, 0.58] }]]);
  const lt = (s, sub, a, b) => { const al = win(t, a, b, 0.5); text(`${s}${sub ? `<div style="font-family:B;font-weight:600;font-size:26px;color:#e8d4ad;margin-top:6px">${sub}</div>` : ''}`, 110, 860, { size: 54, cls: 'ttl', a: al, align: 'left', style: 'text-align:left' }); };
  text('कोई पहचाना हुआ चश्मदीद नहीं', 960, 500, { size: 64, cls: 'ttl', a: win(t, T('w_deck') + 0.6, T('f_shore'), 0.6) });
  lt('सईद इब्राहिम', 'लेखक · The Week, 2022 · पारिवारिक कहानी', T('f_author'), T('f_parents') + 0.2);
  lt('जान मोहम्मद · हाजरा', 'लेखक के परदादा-परदादी · इस यात्रा पर थे', T('f_parents'), T('f_ayesha'));
  lt('आयशा, 16 वर्ष', 'बंबई में बेटी', T('f_ayesha'), T('f_set'));
  lt('चीनी मिट्टी का चाय का सेट', 'इंग्लैंड से मँगवाया · नीला और सुनहरा', T('f_set') + 0.3, T('f_think'));
});
// ---------- report vs song
add(T('s_report'), T('s_baraat'), (t) => {
  if (t < T('s_song') + 0.2) {
    report(t, T('s_report'), [[T('s_report'), 1050, 352, 2.0], [T('s_song'), 1050, 352, 2.1]], { row: 1, dim: 1 });
  } else seq(t, [[16, T('s_song') - 0.2, T('s_baraat'), { z0: 1.0, z1: 1.08, f0: [0.5, 0.5] }]]);
});
add(T('s_baraat'), T('k_calls'), (t) => {
  seq(t, [[15, T('s_baraat'), T('s_mandap'), { z0: 1.04, z1: 1.14, f0: [0.35, 0.45], f1: [0.42, 0.5] }], [5, T('s_mandap'), T('k_calls'), { z0: 1.0, z1: 1.12, f0: [0.62, 0.5], f1: [0.66, 0.48] }]]);
  text('भुज और अंजार की बारातें', 110, 880, { size: 58, cls: 'ttl', a: win(t, T('s_baraat'), T('s_13'), 0.5), align: 'left' });
  const c = win(t, T('s_13'), T('k_calls') + 0.2, 0.5); shade(0.5 * c);
  panel(260, 300, 640, 340, c, 'rgba(20,14,8,.86)'); panel(1020, 300, 640, 340, c, 'rgba(20,14,8,.86)');
  text('<span class="chap">लोकगीत में</span>', 580, 360, { size: 26, a: c }); text('<span class="chap">प्रकाशित यात्रा-विवरण में</span>', 1340, 360, { size: 26, a: c });
  text('<span class="big">13</span> बारातें', 580, 450, { size: 64, a: c, cls: 'ttl' }); text('<span class="big">1,300</span> लोग', 580, 545, { size: 64, a: c, cls: 'ttl', color: '#f5d79b' });
  text('<span class="big">703</span> यात्री', 1340, 450, { size: 64, a: c, cls: 'ttl' }); text('+ <span class="big">43</span> चालक-दल', 1340, 545, { size: 52, a: c, cls: 'ttl', color: '#f5d79b' });
  text('हर संख्या को उसके अपने संदर्भ में', 960, 720, { size: 42, a: R(t, T('s_context'), 0.5) * c, cls: 'ttl' });
});
// ---------- Haji Kasam, Meghani, the captain
add(T('k_calls'), T('u_again'), (t) => {
  seq(t, [[16, T('k_calls') - 0.4, T('u_again'), { z0: 1.14, z1: 1.04, f0: [0.3, 0.45], f1: [0.35, 0.5] }]]);
  const a = win(t, T('k_meghani'), T('u_again') + 0.3, 0.5); shade(0.5 * a);
  panel(460, 330, 1000, 330, a, 'rgba(20,14,8,.86)');
  text('झवेरचंद मेघाणी · संकलन <span class="guj">રઢિયાળી રાત</span>', 960, 400, { size: 44, a, cls: 'ttl' });
  text('टिप्पणी के अनुसार कप्तान: <span style="color:#f5d79b">फकीर महम्मद</span>', 960, 490, { size: 48, a, cls: 'ttl' });
  text('सरकारी सारांश: कप्तान के आखिरी शब्द दर्ज नहीं', 960, 580, { size: 34, a: a * R(t, T('k_report'), 0.5), cls: 'ttl', color: '#e8d4ad' });
  text('गीत की पुकार ≠ जहाज़ की कमान का प्रमाण', 960, 160, { size: 44, a: win(t, T('k_command'), T('k_meghani'), 0.5), cls: 'ttl' });
});
// ---------- the mukhda again
add(T('u_again'), T('e_road'), (t) => {
  seq(t, [[16, T('u_again') - 0.4, T('e_road'), { z0: 1.0, z1: 1.12, f0: [0.55, 0.5], f1: [0.6, 0.45] }]]);
  shade(0.3); mukhda(t, PM - 0.6, T('u_mean') + 0.2, 640);
  text('भाव: हाजी कासम, तुम्हारी वीजळी बीच समंदर में उजड़ गई', 960, 520, { size: 48, cls: 'ttl', a: win(t, T('u_mean'), T('e_road') + 0.3, 0.5), color: '#f5d79b' });
});
// ---------- the open road, the home, the photo, the report, the song
add(T('e_road'), T('outro'), (t) => {
  if (t < T('e_photo')) seq(t, [[5, T('e_road') - 0.4, T('e_home'), { z0: 1.0, z1: 1.15, f0: [0.66, 0.5], f1: [0.68, 0.45] }], [14, T('e_home'), T('e_photo'), { z0: 1.12, z1: 1.02, f0: [0.45, 0.55] }]]);
  else if (t < T('e_report')) card01(t, T('e_photo'), { cam: [[T('e_photo'), 960, 520, 1.12], [T('e_report'), 960, 540, 1.0]] });
  else if (t < T('e_guj')) report(t, T('e_report'), [[T('e_report'), 1050, 352, 2.0], [T('e_guj'), 1050, 352, 2.2]], { row: 1, dim: 1 });
  else seq(t, [[16, T('e_guj') - 0.4, T('outro'), { z0: 1.05, z1: 1.18, f0: [0.86, 0.6], f1: [0.86, 0.62] }]]);
});
// ---------- outro: last mukhda over the photo, then sources
const SRC = [
  ['सरकारी निष्कर्ष', 'Bombay Presidency Administration Report 1888–89, IOR/V/10/300, f.163v — British Library, India Office Records, via Qatar Digital Library'],
  ['जहाज़ का निर्माण', 'Grangemouth Dockyard Co., 1885, Official No. 90062, Yard No. 86 — clydeships.co.uk; ourstoriesfalkirk.com'],
  ['मूल तस्वीर', 'SS Vaitarna in Grangemouth Docks, Falkirk Collections P09431, अज्ञात फोटोग्राफर — Wikimedia Commons (Public Domain)'],
  ['आखिरी सफर', 'LiveHistoryIndia, “India’s Titanic”'],
  ['यात्री-संख्या', 'The Chilian Times (प्रकाशित संदर्भ) — Biblioteca Nacional Digital de Chile; पारिवारिक वृत्तांत'],
  ['पारिवारिक स्मृति', 'Saeed Ibrahim, The Week, 2022'],
  ['लोकगीत', 'संकलन: झवेरचंद मेघाणी, રઢિયાળી રાત — aksharnaad.com; gu.wikisource.org'],
];
add(T('outro'), END + 1, (t) => {
  const o = T('outro'), credits = o + 7.5;
  if (t < credits + 0.5) { card01(t, o, { cam: [[o, 960, 540, 1.0], [credits, 960, 540, 1.06]], capA: 0 }); shade(0.62); mukhda(t, o - 0.6, credits, 470); }
  if (t > credits - 0.5) {
    const a = R(t, credits - 0.5, 1.0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = '#100b07'; ctx.fillRect(0, 0, W, H); ctx.restore();
    text('स्रोत और श्रेय', 960, 110, { size: 64, cls: 'ttl', a, color: '#f5d79b' });
    SRC.forEach(([h, s], i) => {
      const al = a * R(t, credits + 0.3 + i * 0.25, 0.5);
      text(`<span style="font-family:B;font-weight:600;color:#e8c88c">${h}</span>`, 200, 220 + i * 102, { size: 30, a: al, align: 'left' });
      text(`<span style="font-family:T;color:#f3e9d6">${s}</span>`, 200, 258 + i * 102, { size: 28, a: al, align: 'left', style: 'white-space:normal;width:1520px' });
    });
    text('चित्र 01 (तस्वीर) और 03 (रिपोर्ट) के अलावा सभी चित्र AI द्वारा बनाए गए कलात्मक दृश्य हैं · नक्शा अनुमानित है', 960, 975, { size: 26, a, color: '#e8d4ad' });
  }
});

await start();
