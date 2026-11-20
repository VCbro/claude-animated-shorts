// चिनाब ब्रिज — 2D motion-graphics documentary (engine: ./engine.js, rendered at 4K via devicePixelRatio)
import { add, start, A, K, R, win, eio, eob, ss, lerp, clamp, rnd, ctx, cam, camKeys, screen, studio, text, label, chapter, panel, line, flow,
         arrow, sine, glowDot, fillRR, rr, lin, rad, TAU, END, W, H, scr, CAM } from './engine.js';
const T = (n) => A(n);

// ================================================================== world: side elevation in metres -> px
// x: metres along the bridge (0 = arch crown), y: metres above the river
const S = 1.6, X0 = 960, Y0 = 1000;
const P = (x, y) => [X0 + x * S, Y0 - y * S];
const HALF = 233.5, SPRING = 110, CROWN = 345, DECK = 359, BL = -650, BR = 665;
const archB = (x) => SPRING + (CROWN - SPRING) * (1 - (x / HALF) ** 2);          // bottom chord
const archT = (x) => archB(x) + 14 + 12 * (x / HALF) ** 2;                         // top chord
const ground = (x) => { // gorge profile (both banks), river at 0
  const ax = Math.abs(x), side = x < 0 ? -1 : 1;
  let y;
  if (ax < 45) y = -2;
  else if (ax < HALF + 10) y = 110 * Math.pow((ax - 45) / (HALF + 10 - 45), 0.8);
  else if (ax < 540) y = 110 + (DECK - 18 - 110) * Math.pow((ax - HALF - 10) / (540 - HALF - 10), 1.1);
  else y = DECK - 18 + (ax - 540) * 0.06;
  return y + 6 * Math.sin(x * 0.05 + side) + 4 * Math.sin(x * 0.13);
};

// ================================================================== scenery
function sky(t, o = {}) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const warm = o.warm ?? 1;
  ctx.fillStyle = lin(0, 0, 0, H, [[0, '#1d2a4a'], [0.45, '#5a5f8a'], [0.75, `rgba(${240 * warm + 90 * (1 - warm)},${150 * warm + 110 * (1 - warm)},${120},1)`], [1, '#f2c38f']]);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rad(W * 0.72, H * 0.62, 0, 700, [[0, `rgba(255,214,150,${0.55 * warm})`], [1, 'rgba(255,214,150,0)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function peaks(layer, t) { // parallax mountain ranges (layer 0 far .. 2 near), drawn in screen space
  const cfg = [[0.15, 520, 220, '#7d86a6', '#e9eef7', 1.2], [0.35, 640, 200, '#56607f', null, 2.0], [0.6, 760, 170, '#3a4260', null, 3.1]][layer];
  const [par, base, amp, col, snow, f] = cfg;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const off = (CAM.x - 960) * par;
  const yAt = (x) => base - amp * (0.55 * Math.abs(Math.sin((x + off) * 0.0021 * f + layer)) + 0.3 * Math.abs(Math.sin((x + off) * 0.0057 * f + 2 * layer)) + 0.15 * rnd(Math.floor((x + off) / 60) + layer * 99));
  ctx.beginPath(); ctx.moveTo(-10, H);
  for (let x = -10; x <= W + 10; x += 12) ctx.lineTo(x, yAt(x));
  ctx.lineTo(W + 10, H); ctx.closePath();
  ctx.fillStyle = lin(0, base - amp, 0, H, [[0, col], [1, '#1b2034']]); ctx.fill();
  if (snow) { ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(240,245,255,.55)'; for (let x = -10; x <= W; x += 12) { const y = yAt(x); if (y < base - amp * 0.62) ctx.fillRect(x, y, 13, 26); } ctx.restore(); }
  ctx.restore();
}
function fog(t, y0, a = 1, n = 9, sp = 12) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < n; i++) {
    const x = ((rnd(i) * 2600 + t * sp * (0.6 + rnd(i + 3))) % 2600) - 340, y = y0 + rnd(i + 7) * 160, w = 380 + rnd(i + 9) * 520;
    ctx.fillStyle = rad(x, y, 0, w, [[0, `rgba(245,240,235,${0.32 * a})`], [1, 'rgba(245,240,235,0)']]);
    ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.28, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function gorge(t, o = {}) { // valley walls + river in world space
  const pts = []; for (let x = -1100; x <= 1100; x += 10) pts.push(P(x, ground(x)));
  ctx.beginPath(); ctx.moveTo(...P(-1100, -200)); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(...P(1100, -200)); ctx.closePath();
  ctx.fillStyle = lin(0, Y0 - 420 * S, 0, Y0 + 80, [[0, '#4b4a3c'], [0.5, '#3a3a30'], [1, '#22231f']]); ctx.fill();
  // strata + scrub
  ctx.save(); ctx.clip();
  for (let i = 0; i < 26; i++) { ctx.strokeStyle = `rgba(20,20,15,${0.18 + 0.1 * rnd(i)})`; ctx.lineWidth = 3; const yy = 20 + i * 15; ctx.beginPath(); for (let x = -1100; x <= 1100; x += 25) { const [px, py] = P(x, yy + 4 * Math.sin(x * 0.02 + i)); x === -1100 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke(); }
  for (let i = 0; i < 160; i++) { const x = -1100 + rnd(i * 3) * 2200, g = ground(x), y = g - rnd(i * 3 + 1) * 60; if (y < 0) continue; const [px, py] = P(x, y); ctx.fillStyle = `rgba(${60 + 30 * rnd(i)},${80 + 30 * rnd(i + 1)},50,.8)`; ctx.beginPath(); ctx.arc(px, py, 4 + 6 * rnd(i + 2), 0, TAU); ctx.fill(); }
  ctx.restore();
  // river
  const [rx0, ry] = P(-45, 0), [rx1] = P(45, 0);
  ctx.fillStyle = lin(0, ry - 6, 0, ry + 30, [[0, '#6fa6b8'], [1, '#2c5463']]); ctx.fillRect(rx0, ry - 6, rx1 - rx0, 40);
  for (let i = 0; i < 6; i++) { const x = rx0 + ((t * 40 + i * 30) % (rx1 - rx0)); line([[x, ry + 4 + i * 4], [x + 18, ry + 4 + i * 4]], 'rgba(230,245,255,.6)', 2); }
}

// ================================================================== the bridge
const COLS = []; for (let x = -HALF + 20; x <= HALF - 20; x += 33.4) COLS.push(x);
const PIERS = [-610, -545, -480, -415, -350, -290, 290, 350, 410, 470, 530, 595, 650];
function bridge(t, o = {}) {
  const prog = o.arch ?? 1, deck = o.deck ?? 1, glow = o.glow || 0;
  const steel = o.steel || '#c9ced6', dark = '#7d8591';
  // piers (concrete) on the approaches
  for (const x of PIERS) {
    if (deck <= 0) break; const g = ground(x); if (g > DECK - 10) continue;
    const [px, py] = P(x, g), [, dy] = P(x, DECK - 8), w = 12 * S;
    ctx.fillStyle = lin(px - w, 0, px + w, 0, [[0, '#8e8a80'], [0.5, '#c8c3b8'], [1, '#7a766c']]); ctx.fillRect(px - w / 2, dy, w, py - dy + 8);
  }
  // arch: built from both springings towards the crown (prog 0..1)
  const lim = HALF * (1 - prog);
  const seg = (x0, x1) => {
    const top = [], bot = [];
    for (let x = x0; x <= x1 + 0.01; x += 4) { top.push(P(x, archT(x))); bot.push(P(x, archB(x))); }
    ctx.beginPath(); top.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); bot.reverse().forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath();
    ctx.fillStyle = 'rgba(30,34,42,.35)'; ctx.fill();
    line(top.map((p) => p), steel, 7, glow * 30); line(bot.reverse(), steel, 7, glow * 30);
    for (let x = Math.ceil(x0 / 16.7) * 16.7; x <= x1; x += 16.7) { const k = Math.round(x / 16.7);
      line([P(x, archB(x)), P(x + (k % 2 ? 16.7 : -16.7) * 0.5, archT(x + (k % 2 ? 8 : -8)))], dark, 3); line([P(x, archB(x)), P(x, archT(x))], dark, 3); }
  };
  if (prog > 0.001) { seg(-HALF, -lim); seg(lim, HALF); }
  if (o.fill) { // concrete filling of the hollow chords
    ctx.save(); ctx.globalAlpha = o.fill; const pts = []; for (let x = -HALF; x <= HALF; x += 4) pts.push(P(x, archB(x) + 3)); line(pts, '#b5b0a5', 6); ctx.restore();
  }
  // spandrel columns on the arch
  if (deck > 0) for (const x of COLS) { const [cx, cy] = P(x, archT(x)), [, dy] = P(x, DECK - 8); ctx.globalAlpha = clamp(deck * 1.2); ctx.fillStyle = dark; ctx.fillRect(cx - 4, dy, 8, cy - dy); ctx.globalAlpha = 1; }
  // deck truss girder
  if (deck > 0) {
    const xr = lerp(BL, BR, clamp(deck));
    const [lx, ty] = P(BL, DECK), [rxx] = P(xr, DECK), [, by] = P(BL, DECK - 9);
    ctx.fillStyle = lin(0, ty, 0, by, [[0, '#d7dbe1'], [1, '#8f97a3']]); ctx.fillRect(lx, ty, rxx - lx, by - ty);
    ctx.strokeStyle = 'rgba(60,66,78,.6)'; ctx.lineWidth = 2; for (let x = lx; x < rxx - 10; x += 22) { ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + 11, ty); ctx.lineTo(x + 22, by); ctx.stroke(); }
    line([[lx, ty - 1], [rxx, ty - 1]], '#e8ecf0', 3);
  }
}
function trainOn(xm, o = {}) { // a modern train on the deck, front at xm (metres), moving right
  const cars = o.cars ?? 8, len = 23;
  for (let i = 0; i < cars; i++) {
    const x1 = xm - i * (len + 1), x0 = x1 - len; if (x1 < BL - 5 || x0 > BR + 5) continue;
    const [a, y] = P(x0, DECK + 1), [b] = P(x1, DECK + 1), hgt = 4.2 * S;
    ctx.save(); ctx.beginPath();
    if (i === 0) { ctx.moveTo(a, y); ctx.lineTo(b - hgt * 0.4, y); ctx.quadraticCurveTo(b + hgt * 0.6, y, b - hgt * 0.2, y - hgt); ctx.lineTo(a, y - hgt); ctx.closePath(); }
    else ctx.rect(a + 1, y - hgt, b - a - 2, hgt);
    ctx.fillStyle = lin(0, y - hgt, 0, y, [[0, '#ffffff'], [0.6, '#e9edf3'], [1, '#9aa4b2']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#1f4fa3'; ctx.fillRect(a + 1, y - hgt * 0.42, b - a - 2, hgt * 0.16);
    ctx.fillStyle = '#27344a'; for (let k = 0; k < 4; k++) ctx.fillRect(a + 4 + k * (b - a - 8) / 4, y - hgt * 0.85, (b - a - 8) / 4 - 3, hgt * 0.3);
    if (i === 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(b, y - hgt * 0.4, 0, 60, [[0, 'rgba(255,240,200,.8)'], [1, 'rgba(255,240,200,0)']]); ctx.beginPath(); ctx.arc(b, y - hgt * 0.4, 60, 0, TAU); ctx.fill(); ctx.restore(); }
  }
}
function dim(x0, y0, x1, y1, txt, a, o = {}) { // dimension line in world px with label (screen text)
  if (a <= 0.01) return; const u = eio(a);
  const xe = lerp(x0, x1, u), ye = lerp(y0, y1, u);
  ctx.save(); ctx.globalAlpha = a; line([[x0, y0], [xe, ye]], o.col || '#ffd166', 4, 14);
  const ang = Math.atan2(y1 - y0, x1 - x0);
  for (const [x, y] of [[x0, y0], [xe, ye]]) line([[x - Math.sin(ang) * 16, y + Math.cos(ang) * 16], [x + Math.sin(ang) * 16, y - Math.cos(ang) * 16]], o.col || '#ffd166', 4);
  ctx.restore();
  const [sx, sy] = scr((x0 + x1) / 2 + (o.dx || 0), (y0 + y1) / 2 + (o.dy || 0));
  text(txt, sx, sy, { size: (o.size || 54) * Math.min(1.3, CAM.z), a: R(a, 0.6, 0.4), cls: 'ttl', color: o.col || '#ffd166', style: 'text-shadow:0 3px 18px rgba(0,0,0,.8)' });
}
function eiffel(xm, a) { // silhouette, 330 m, standing at river level
  if (a <= 0.01) return; const h = 330 * eio(a);
  const [bx, by] = P(xm, 0), [, ty] = P(xm, h), w = 125 * S * 0.5;
  ctx.save(); ctx.globalAlpha = 0.85 * a; ctx.fillStyle = 'rgba(30,26,40,.9)';
  ctx.beginPath(); ctx.moveTo(bx - w, by); ctx.quadraticCurveTo(bx - w * 0.25, by - (by - ty) * 0.45, bx - 6, ty + 30); ctx.lineTo(bx, ty);
  ctx.lineTo(bx + 6, ty + 30); ctx.quadraticCurveTo(bx + w * 0.25, by - (by - ty) * 0.45, bx + w, by); ctx.lineTo(bx + w * 0.45, by); ctx.quadraticCurveTo(bx, by - (by - ty) * 0.18, bx - w * 0.45, by); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function wind(t, a, strength = 1, yTop = 200, yBot = 700) {
  if (a <= 0.01) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  for (let i = 0; i < 26; i++) {
    const y = yTop + rnd(i) * (yBot - yTop), sp = (700 + 500 * rnd(i + 1)) * strength, x = ((t * sp + rnd(i + 2) * 2400) % 2400) - 300, L = 160 + 220 * rnd(i + 3);
    const pts = []; for (let k = 0; k <= 12; k++) { const u = k / 12; pts.push([x - L * u, y + 10 * Math.sin((x - L * u) * 0.01 + t * 3 + i)]); }
    line(pts, `rgba(220,240,255,${0.35 + 0.3 * rnd(i + 4)})`, 3);
  }
  ctx.restore();
}
function snow(t, a) { if (a <= 0.01) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.fillStyle = '#fff';
  for (let i = 0; i < 180; i++) { const x = (rnd(i) * W + t * 30 * (0.5 + rnd(i + 1))) % W, y = (rnd(i + 2) * H + t * 90 * (0.6 + rnd(i + 3))) % H; ctx.beginPath(); ctx.arc(x, y, 1.5 + 2.5 * rnd(i + 4), 0, TAU); ctx.fill(); } ctx.restore(); }
function shake(t, amp) { if (amp <= 0) return [0, 0]; return [amp * Math.sin(t * 53) * Math.sin(t * 7.3), amp * Math.cos(t * 47) * Math.sin(t * 5.1)]; }
function chip(html, x, y, a, o = {}) { text(`<span style="display:inline-block;padding:12px 32px 6px;border-radius:16px;background:rgba(10,16,30,.82);box-shadow:0 0 0 2px ${o.ring || 'rgba(255,209,102,.55)'}">${html}</span>`, x, y, { size: o.size || 44, a, scale: eob(clamp(a)) }); }
function valley(t, o = {}) { sky(t, o); peaks(0, t); peaks(1, t); fog(t, 620, 0.6 * (o.fog ?? 1), 6, 8); }

// ================================================================== SCENES
// ---------- hook: dawn, fog, train above the clouds
add(0, T('h_go'), (t) => {
  valley(t);
  camKeys(t, [[0, 960, 640, 1.25], [T('h_this'), 960, 560, 0.86], [T('h_359'), 960, 700, 0.8], [T('h_world'), 960, 560, 0.86], [T('h_go'), 960, 560, 0.9]]);
  peaks(2, t); gorge(t); bridge(t);
  trainOn(BL + (t - 0.5) * 32, { cars: 8 });
  fog(t, 760, 1.0, 10, 14);
  dim(...P(-80, 0), ...P(-80, DECK), '359 मीटर', win(t, T('h_359'), T('h_world') + 0.6, 0.4), { dx: -120 });
  eiffel(80, R(t, T('h_eiffel'), 1.2) * (1 - R(t, T('h_world') + 0.4, 0.5)));
  label('एफ़िल टावर ~330 m', ...P(80, 330), 140, -90, win(t, T('h_eiffel') + 0.8, T('h_world') + 0.4, 0.3));
  screen();
  const ta = win(t, T('h_this'), T('h_359') - 0.2, 0.5);
  text('चिनाब ब्रिज', 960, 190, { size: 140, cls: 'ttl', a: ta, scale: 0.94 + 0.06 * ta });
  chip('दुनिया का सबसे ऊँचा <b style="color:#ffd166">रेलवे आर्च पुल</b>', 960, 170, win(t, T('h_world'), T('h_q'), 0.4));
  chip('जम्मू-कश्मीर · भारत', 960, 260, win(t, T('h_india'), T('h_q'), 0.4), { size: 38, ring: 'rgba(127,216,255,.55)' });
  const q = win(t, T('h_q'), T('h_go') + 0.2, 0.4);
  wind(t, q * 0.8, 1.0);
  text('आँधी? भूकंप? <span style="color:#ffd166">फिर भी खड़ा कैसे?</span>', 960, 190, { size: 76, cls: 'ttl', a: q });
});
add(T('h_go'), T('c1'), (t) => {
  valley(t, { fog: 1.2 }); camKeys(t, [[T('h_go'), 960, 560, 0.9], [T('c1'), 960, 520, 0.95]]); peaks(2, t); gorge(t); bridge(t); trainOn(BL + (t - 0.5) * 32); fog(t, 700, 1.2, 12, 14);
  screen(); const v = R(t, T('h_go') + 0.2, 0.7);
  ctx.fillStyle = `rgba(5,8,18,${0.35 * v})`; ctx.fillRect(0, 0, W, H);
  text('<span class="chap" style="font-size:34px">एक डॉक्यूमेंट्री</span>', 960, 360, { size: 34, a: v });
  text('चिनाब ब्रिज', 960, 480, { size: 160, cls: 'ttl', a: v, color: '#ffd166', scale: 0.92 + 0.08 * v });
  text('बादलों के ऊपर दौड़ती ट्रेन', 960, 610, { size: 62, cls: 'ttl', a: v });
});

// ---------- ch1: the dream, the gorge, the arch
const ROUTE = [['उधमपुर', 180, 760], ['कटड़ा', 420, 700], ['चिनाब ब्रिज', 760, 600], ['बनिहाल', 1080, 520], ['श्रीनगर', 1420, 380], ['बारामूला', 1700, 300]];
add(T('c1'), T('c1_piers'), (t) => {
  studio('#0d1830', '#05080f', 'rgba(120,180,255,.10)'); cam(960, 540, 1);
  // stylised mountain backdrop for the route
  ctx.save(); for (let i = 0; i < 14; i++) { const x = 60 + i * 140, h = 160 + 140 * rnd(i); ctx.fillStyle = `rgba(90,110,150,${0.18 + 0.1 * rnd(i + 1)})`; ctx.beginPath(); ctx.moveTo(x - 160, 860); ctx.lineTo(x, 860 - h - 300 * (i / 14)); ctx.lineTo(x + 160, 860); ctx.fill(); } ctx.restore();
  const u = clamp((t - T('c1_dream') - 0.3) / 3.5);
  const pts = ROUTE.map(([, x, y]) => [x, y]);
  const L = []; let acc = 0; for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(acc); }
  const upto = u * acc, drawn = [pts[0]]; for (let i = 1; i < pts.length; i++) { if (upto >= L[i - 1]) drawn.push(pts[i]); else { const prev = i > 1 ? L[i - 2] : 0, f = (upto - prev) / (L[i - 1] - prev); drawn.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; } }
  line(drawn, '#ffd166', 8, 20);
  ROUTE.forEach(([n, x, y], i) => { const a = R(t, T('c1_dream') + 0.3 + i * 0.6, 0.3); const key = i === 2;
    if (a > 0) { glowDot(x, y, key ? 14 : 9, key ? '#ff6b5b' : '#ffd166', a); text(n, x, y - 52, { size: key ? 46 : 38, a, cls: 'ttl', color: key ? '#ff8f7f' : '#fff' }); } });
  const ga = R(t, T('c1_gorge'), 0.4);
  if (ga > 0) { ctx.save(); ctx.globalAlpha = ga; ctx.strokeStyle = '#ff6b5b'; ctx.lineWidth = 5; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.arc(760, 600, 80 + 6 * Math.sin(t * 4), 0, TAU); ctx.stroke(); ctx.restore(); }
  text('गहरी खाई', 760, 720, { size: 40, a: ga, color: '#ff8f7f', cls: 'ttl' });
  text('रेल लाइन: उधमपुर → श्रीनगर → बारामूला', 960, 1000 - 70, { size: 40, a: R(t, T('c1_line'), 0.4) * 0.9, cls: 'ttl' });
  chapter(t, T('c1'), 1, 'कश्मीर तक रेल का सपना');
});
add(T('c1_piers'), T('c2'), (t) => {
  valley(t, { fog: 0.5 });
  camKeys(t, [[T('c1_piers'), 960, 620, 0.95], [T('c1_arch'), 960, 600, 0.9], [T('c1_467'), 960, 640, 0.86], [T('c1_km'), 960, 620, 0.78], [T('c2'), 960, 620, 0.78]]);
  peaks(2, t); gorge(t);
  // failed idea: tall piers from the river
  const pa = win(t, T('c1_piers'), T('c1_arch') + 0.2, 0.4);
  if (pa > 0) { ctx.save(); ctx.globalAlpha = pa; for (const x of [-120, 0, 120]) { const [px, py] = P(x, ground(x)), [, ty] = P(x, DECK - 8); ctx.fillStyle = 'rgba(200,200,200,.5)'; ctx.fillRect(px - 12, ty, 24, py - ty); } ctx.restore();
    const [cx, cy] = P(0, 200); text('✕', cx * 1, cy, { size: 0, a: 0 }); }
  ['खड़ी ढलान', 'कमज़ोर चट्टान', 'तेज़ नदी'].forEach((w, i) => { const a = win(t, T('c1_piers') + 0.6 + i * 0.7, T('c1_arch') + 0.2, 0.3); const [x, y] = scr(...P(-300 + i * 300, [200, 120, 10][i])); text(`<span style="color:#ff8f7f">✕</span> ${w}`, x, y, { size: 40, a, cls: 'ttl' }); });
  const ar = clamp((t - T('c1_arch')) / 2.4);
  bridge(t, { arch: eio(ar), deck: clamp((t - T('c1_arch') - 2.0) / 2.5), glow: win(t, T('c1_arch'), T('c1_467'), 0.5) });
  // load path arrows into the banks
  const la = win(t, T('c1_load'), T('c1_467') + 0.4, 0.4);
  if (la > 0) for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 30; k++) { const x = s * HALF * k / 30; pts.push(P(x, (archB(x) + archT(x)) / 2)); } flow(pts, t, '#ffd166', { a: la, speed: 260, gap: 40, r: 6 }); const [ex, ey] = P(s * HALF, SPRING); glowDot(ex, ey, 18, '#ff9f43', la); }
  dim(...P(-HALF, SPRING - 30), ...P(HALF, SPRING - 30), '≈ 467 मीटर', win(t, T('c1_467'), T('c2') + 0.3, 0.4), { dy: 50 });
  dim(...P(BL, DECK + 40), ...P(BR, DECK + 40), '1 किलोमीटर से ज़्यादा', win(t, T('c1_km'), T('c2') + 0.3, 0.4), { dy: -50, col: '#7fd8ff' });
  screen();
  text('मेहराब <span style="color:#ffd166">(आर्च)</span>', 960, 150, { size: 80, cls: 'ttl', a: win(t, T('c1_arch'), T('c1_467'), 0.4) });
  text('वज़न → दोनों तरफ़ की पहाड़ियों पर', 960, 240, { size: 46, cls: 'ttl', a: la });
});

// ---------- ch2: built in the air — cable crane, cantilevered halves, the closing
const TW = 560; // tower positions (metres from crown)
add(T('c2'), T('c3'), (t) => {
  valley(t, { fog: 0.4 });
  camKeys(t, [[T('c2'), 960, 600, 0.8], [T('c2_cable'), 960, 520, 0.72], [T('c2_trolley'), 760, 520, 1.05], [T('c2_both'), 960, 600, 0.82], [T('c2_meet'), 960, 470, 1.6], [T('c2_2021') + 0.6, 960, 560, 0.86], [T('c3'), 960, 560, 0.86]]);
  peaks(2, t); gorge(t);
  const ca = R(t, T('c2_towers'), 0.6);
  // pylons + cable
  const towers = [-TW, TW].map((x) => { const g = ground(x); return [x, g, g + 230]; });
  ctx.save(); ctx.globalAlpha = ca;
  for (const [x, g, top] of towers) { const [bx, by] = P(x, g), [, ty] = P(x, top); ctx.fillStyle = '#c0392b'; ctx.fillRect(bx - 10, ty, 20, by - ty); for (let k = 0; k < 12; k++) line([[bx - 10, ty + k * (by - ty) / 12], [bx + 10, ty + (k + 1) * (by - ty) / 12]], '#e8e2d6', 2); }
  const cab = []; for (let k = 0; k <= 40; k++) { const u = k / 40, x = lerp(-TW, TW, u); cab.push(P(x, lerp(towers[0][2], towers[1][2], u) - 60 * 4 * u * (1 - u))); }
  line(cab, '#e8ecf0', 3); line(cab.map(([x, y]) => [x, y + 8]), '#cfd5dd', 2);
  ctx.restore();
  // arch growing from both sides
  const grow = t < T('c2_both') ? 0.18 : lerp(0.18, 1, clamp((t - T('c2_both')) / (T('c2_meet') + 1.2 - T('c2_both'))));
  bridge(t, { arch: eio(grow), deck: 0, glow: R(t, T('c2_rainbow'), 0.8) * 0.9 });
  // back-stay cables holding the halves
  const st = win(t, T('c2_stays') - 0.3, T('c2_2021') + 0.5, 0.4);
  if (st > 0) for (const s of [-1, 1]) { const tip = s * HALF * (1 - grow); const [tx, ty] = P(tip, archT(tip)); for (const k of [0.2, 0.5, 0.8]) { const x = s * HALF * (1 - grow * k); const [ax, ay] = P(x, archT(x)); ctx.save(); ctx.globalAlpha = st; line([[ax, ay], P(s * (HALF + 160), ground(s * (HALF + 160)) + 40)], '#7fd8ff', 2.5, 8); ctx.restore(); } }
  // trolley carrying a segment
  const tr = clamp(((t - T('c2_trolley')) % 6) / 6), tA = win(t, T('c2_trolley') - 0.2, T('c2_meet') + 0.5, 0.3);
  if (tA > 0) { const k = Math.round(lerp(0, 40, tr <= 0.5 ? tr * 2 * 0.45 : 0.45 - (tr - 0.5) * 2 * 0.45)); const [x, y] = cab[clamp(k, 0, 40)];
    ctx.save(); ctx.globalAlpha = tA; fillRR(x - 16, y - 6, 32, 14, 4, '#ffd166'); line([[x, y + 8], [x, y + 90 + 30 * Math.sin(t * 2)]], '#e8ecf0', 2); fillRR(x - 40, y + 90 + 30 * Math.sin(t * 2), 80, 26, 3, '#9aa3ae'); ctx.restore(); }
  const meet = R(t, T('c2_meet') + 0.9, 0.3) * (1 - R(t, T('c2_2021') + 1.0, 1.0));
  if (meet > 0) { const [mx, my] = P(0, archT(0)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(mx, my, 0, 160, [[0, `rgba(255,220,140,${meet})`], [1, 'rgba(255,220,140,0)']]); ctx.beginPath(); ctx.arc(mx, my, 160, 0, TAU); ctx.fill(); ctx.restore(); }
  label('केबल क्रेन', ...cab[20], 120, -110, win(t, T('c2_cable'), T('c2_trolley') + 1.0, 0.4), 'दो टावर, बीच में स्टील की रस्सियाँ');
  label('ट्रॉली + स्टील का डिब्बा', ...cab[14], -130, -120, win(t, T('c2_trolley') + 0.5, T('c2_both'), 0.4));
  label('सहारा देते केबल', ...P(-HALF * 0.6, archT(-HALF * 0.6)), -140, -150, win(t, T('c2_stays'), T('c2_meet'), 0.4));
  screen();
  text('नीचे से क्रेन? <span style="color:#ff8f7f">नामुमकिन</span>', 960, 150, { size: 64, cls: 'ttl', a: win(t, T('c2_q'), T('c2_cable'), 0.4) });
  text('<span class="big" style="color:#ffd166">2021</span> · मेहराब जुड़ गई', 960, 150, { size: 80, cls: 'ttl', a: R(t, T('c2_2021'), 0.5) });
  chapter(t, T('c2'), 2, 'हवा में बना पुल');
});

// ---------- ch3: wind
add(T('c3'), T('c4'), (t) => {
  valley(t, { warm: 0.4, fog: 0.3 });
  const stop = R(t, T('c3_stop'), 0.5);
  camKeys(t, [[T('c3'), 960, 560, 0.86], [T('c3_sensor'), 960, 420, 1.3], [T('c3_stop'), 760, 420, 1.15], [T('c4'), 760, 420, 1.15]]);
  peaks(2, t); gorge(t);
  const sway = 3 * Math.sin(t * 2.2) * win(t, T('c3_enemy'), T('c3_tunnel'), 0.5);
  ctx.save(); ctx.translate(0, sway); bridge(t); ctx.restore();
  // a train waits before the bridge when the wind is dangerous
  const tx = t < T('c3_stop') ? BL + (t - T('c3')) * 30 : Math.min(BL + (T('c3_stop') - T('c3')) * 30, BL - 40);
  trainOn(t > T('c3_stop') ? BL - 40 : tx, { cars: 6 });
  // anemometers on the deck
  const sa = R(t, T('c3_sensor'), 0.4);
  for (const x of [-300, 0, 300]) { const [ax, ay] = P(x, DECK + 6); ctx.save(); ctx.globalAlpha = sa; line([[ax, ay], [ax, ay - 40]], '#e8ecf0', 3); ctx.translate(ax, ay - 42); ctx.rotate(t * 12); for (let k = 0; k < 3; k++) { ctx.rotate(TAU / 3); fillRR(0, -3, 18, 6, 3, '#e8ecf0'); } ctx.restore(); }
  screen();
  wind(t, win(t, T('c3_enemy'), T('c3_tunnel') + 0.2, 0.5) + 0.5 * R(t, T('c3_stop'), 0.5), 1.3, 150, 800);
  const g = R(t, T('c3_260') - 0.1, 0.4) * (1 - R(t, T('c3_tunnel'), 0.3));
  panel(1440, 80, 420, 260, g);
  if (g > 0) { ctx.save(); ctx.globalAlpha = g; ctx.translate(1650, 270); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(0, 0, 120, Math.PI, TAU); ctx.stroke();
    const p = eio((t - T('c3_260')) / 1.4); ctx.strokeStyle = '#ff6b5b'; ctx.beginPath(); ctx.arc(0, 0, 120, Math.PI, Math.PI + Math.PI * p); ctx.stroke(); ctx.restore();
    text(`<span class="big">${Math.round(260 * eio((t - T('c3_260')) / 1.4))}</span> km/h`, 1650, 240, { size: 54, a: g }); text('हवा झेलने की क्षमता', 1650, 120, { size: 28, a: g, color: '#c9d6ff' }); }
  // wind tunnel inset
  const wt = win(t, T('c3_tunnel'), T('c3_sensor') + 0.3, 0.4);
  panel(1180, 620, 680, 300, wt);
  if (wt > 0) { ctx.save(); ctx.globalAlpha = wt; ctx.beginPath(); ctx.rect(1200, 640, 640, 260); ctx.clip();
    for (let i = 0; i < 9; i++) { const y = 660 + i * 26; const pts = []; for (let x = 1200; x <= 1840; x += 10) { const d = Math.exp(-(((x - 1520) / 80) ** 2)); pts.push([x, y - d * 22 * (i < 5 ? 1 : -1) + 3 * Math.sin(x * 0.05 + t * 8)]); } line(pts, 'rgba(200,230,255,.8)', 2); }
    ctx.beginPath(); ctx.moveTo(1440, 860); ctx.quadraticCurveTo(1520, 700, 1600, 860); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    text('हवा की सुरंग में मॉडल', 1520, 880, { size: 30, a: wt, color: '#ffd166' }); }
  const sv = R(t, T('c3_sensor') + 0.4, 0.4);
  text(`हवा: <span class="big" style="color:${stop > 0.5 ? '#ff6b5b' : '#7dffb0'}">${Math.round(lerp(42, 95, stop) + 4 * Math.sin(t * 3))}</span> km/h`, 960, 140, { size: 56, cls: 'ttl', a: sv });
  chip('<span style="color:#ff6b5b">ख़तरनाक हवा</span> → ट्रेन पुल पर नहीं जाएगी', 960, 950 - 60, stop * (1 - R(t, T('c4') - 0.3, 0.3)), { ring: 'rgba(255,107,91,.7)' });
  chapter(t, T('c3'), 3, 'आँधी से जंग');
});

// ---------- ch4: earthquake, concrete-filled chords, redundancy, blast, 120 years
add(T('c4'), T('c5'), (t) => {
  valley(t, { warm: 0.6, fog: 0.3 });
  const quake = win(t, T('c4_zone'), T('c4_concrete') - 0.2, 0.3);
  const [sx, sy] = shake(t, 10 * quake);
  camKeys(t, [[T('c4'), 960, 560, 0.86], [T('c4_concrete'), 960, 470, 2.0], [T('c4_redund'), 960, 560, 0.9], [T('c4_120'), 960, 560, 0.86], [T('c5'), 960, 560, 0.86]]);
  ctx.translate(sx, sy);
  peaks(2, t); gorge(t);
  bridge(t, { fill: R(t, T('c4_concrete') + 0.6, 1.5) });
  // redundancy: one member damaged, load re-routes
  const rd = win(t, T('c4_redund'), T('c4_blast') + 0.2, 0.4);
  if (rd > 0) { const [ax, ay] = P(-90, archT(-90)), [bx, by] = P(-90, archB(-90)); ctx.save(); ctx.globalAlpha = rd; line([[ax, ay], [bx, by]], '#ff6b5b', 9, 20); ctx.restore();
    const pts = []; for (let k = 0; k <= 30; k++) { const x = -HALF + k * (2 * HALF / 30); pts.push(P(x, archT(x))); } flow(pts, t, '#7dffb0', { a: rd, speed: 300, gap: 34, r: 5 }); }
  screen();
  if (quake > 0) { panel(1360, 80, 500, 200, quake); const pts = []; for (let i = 0; i <= 120; i++) { const x = 1390 + i * 3.7; pts.push([x, 190 + 60 * quake * Math.sin(i * 0.9 + t * 30) * Math.exp(-((i - 60) / 40) ** 2)]); } ctx.save(); ctx.globalAlpha = quake; line(pts, '#ff6b5b', 3, 10); ctx.restore(); text('भूकंप-संवेदनशील इलाक़ा', 1610, 110, { size: 28, a: quake, color: '#ffb0a8' }); }
  // chord cross-section inset: hollow steel box filling with concrete
  const cs = win(t, T('c4_concrete'), T('c4_redund') + 0.2, 0.4);
  panel(1260, 560, 600, 380, cs);
  if (cs > 0) { ctx.save(); ctx.globalAlpha = cs; const x = 1400, y = 610, w = 320, h = 260; fillRR(x, y, w, h, 10, '#8f97a3'); fillRR(x + 22, y + 22, w - 44, h - 44, 6, '#1b2230');
    const f = eio((t - T('c4_concrete') - 0.8) / 2.5); fillRR(x + 22, y + 22 + (h - 44) * (1 - f), w - 44, (h - 44) * f, 6, '#b5b0a5'); ctx.restore();
    text('स्टील का खोखला हिस्सा + <span style="color:#ffd166">कंक्रीट</span>', 1560, 910, { size: 30, a: cs }); }
  text('एक हिस्सा कमज़ोर हो, तब भी <span style="color:#7dffb0">पूरा पुल एकदम न गिरे</span>', 960, 150, { size: 52, cls: 'ttl', a: rd });
  chip('धमाकों का सामना करने लायक डिज़ाइन', 960, 260, win(t, T('c4_blast'), T('c4_120'), 0.4), { ring: 'rgba(127,216,255,.6)' });
  const ya = R(t, T('c4_120'), 0.5);
  text(`<span class="big" style="color:#ffd166">${Math.round(120 * eio((t - T('c4_120')) / 1.4))}</span> साल`, 960, 190, { size: 130, cls: 'ttl', a: ya });
  text('तक चलने का डिज़ाइन', 960, 300, { size: 46, cls: 'ttl', a: ya });
  chapter(t, T('c4'), 4, 'भूकंप से जंग');
});

// ---------- ch5: two decades of work, opening, the window view
add(T('c5'), T('n0'), (t) => {
  if (t < T('c5_2025') - 0.2) {
    valley(t, { warm: 0.3, fog: 0.6 });
    camKeys(t, [[T('c5'), 960, 600, 0.8], [T('c5_roads'), 900, 640, 0.8]]);
    peaks(2, t); gorge(t); bridge(t, { arch: 0.85, deck: 0 });
    // winding access road
    const ra = clamp((t - T('c5_roads') - 0.2) / 2.5);
    if (ra > 0) { const pts = []; for (let k = 0; k <= 80; k++) { const u = k / 80, x = -1000 + u * 700, y = ground(x) + 10 + 12 * Math.sin(u * 30); pts.push(P(x, y)); } line(pts.slice(0, Math.max(2, Math.round(ra * 80))), '#e6d2a8', 5, 8); }
    screen();
    snow(t, win(t, T('c5_cold'), T('c5_roads') + 0.5, 0.5));
    // timeline bar
    const tl = R(t, T('c5') + 0.3, 0.5);
    panel(260, 820, 1400, 130, tl);
    if (tl > 0) { ctx.save(); ctx.globalAlpha = tl; line([[320, 885], [1600, 885]], 'rgba(255,255,255,.25)', 10); const p = clamp((t - T('c5') - 0.3) / (T('c5_2025') - T('c5') - 0.5));
      line([[320, 885], [lerp(320, 1600, p), 885]], '#ffd166', 10, 12);
      const pz = win(t, T('c5_pause'), T('c5_cold'), 0.4); if (pz > 0) { ctx.globalAlpha = tl * pz; fillRR(560, 860, 220, 50, 10, 'rgba(255,107,91,.85)'); } ctx.restore();
      text('शुरुआत', 320, 925 + 10, { size: 26, a: tl, color: '#c9d6ff' }); text('काम रुका', 670, 885, { size: 26, a: tl * win(t, T('c5_pause'), T('c5_cold'), 0.4), color: '#fff' });
      text('2021 · मेहराब', 1240, 925 + 10, { size: 26, a: tl, color: '#c9d6ff' }); text('2025 · ट्रेनें', 1600, 925 + 10, { size: 26, a: tl, color: '#ffd166' }); }
    chapter(t, T('c5'), 5, 'बीस साल की मेहनत');
    return;
  }
  if (t < T('c5_window') - 0.2) {
    valley(t); camKeys(t, [[T('c5_2025') - 0.2, 960, 560, 0.86], [T('c5_window'), 1000, 560, 0.95]]); peaks(2, t); gorge(t); bridge(t, { glow: 0.3 });
    trainOn(BL + (t - T('c5_2025') + 2) * 70, { cars: 8 }); fog(t, 760, 0.9, 10, 14);
    screen(); text('<span class="big" style="color:#ffd166">2025</span> · कश्मीर घाटी के लिए नियमित ट्रेनें', 960, 160, { size: 64, cls: 'ttl', a: R(t, T('c5_2025'), 0.5) });
    return;
  }
  // train-window view: the valley far below, clouds drifting
  valley(t, { fog: 1.6 }); cam(960 + (t - T('c5_window')) * 30, 520, 1.25); peaks(2, t); gorge(t); fog(t, 640, 1.4, 14, 40);
  screen();
  ctx.fillStyle = '#2a2f38'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.roundRect(260, 150, 1400, 760, 90); ctx.fill('evenodd');
  ctx.strokeStyle = '#59616c'; ctx.lineWidth = 18; rr(260, 150, 1400, 760, 90); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.beginPath(); ctx.moveTo(300, 180); ctx.lineTo(700, 180); ctx.lineTo(380, 880); ctx.lineTo(300, 880); ctx.fill();
});

// ---------- end
add(T('n0'), END + 1, (t) => {
  valley(t, { fog: 1.1 });
  camKeys(t, [[T('n0'), 960, 600, 1.15], [T('n_title'), 960, 560, 0.84], [END, 960, 560, 0.8]]);
  peaks(2, t); gorge(t); bridge(t, { glow: R(t, T('n_proud'), 1.0) * 0.4 }); trainOn(BL + (t - T('n0')) * 34, { cars: 8 }); fog(t, 760, 1.1, 10, 14);
  screen();
  const v = R(t, T('n_title'), 0.8);
  ctx.fillStyle = `rgba(5,8,18,${0.3 * v})`; ctx.fillRect(0, 0, W, H);
  text('चिनाब ब्रिज', 960, 420, { size: 160, cls: 'ttl', a: v, color: '#ffd166', scale: 0.93 + 0.07 * v });
  text('बादलों के ऊपर भारत', 960, 550, { size: 70, cls: 'ttl', a: v });
  ctx.save(); ctx.globalAlpha = v; const w = 520 * v; fillRR(960 - w / 2, 610, w / 3, 10, 4, '#ff9933'); ctx.fillStyle = '#fff'; ctx.fillRect(960 - w / 6, 610, w / 3, 10); fillRR(960 + w / 6, 610, w / 3, 10, 4, '#138808'); ctx.restore();
  chip('आपको सबसे हैरान करने वाली बात क्या लगी? <b style="color:#ffd166">कमेंट करें</b>', 960, 760, R(t, T('n_cta'), 0.5), { size: 38 });
});

await start();
