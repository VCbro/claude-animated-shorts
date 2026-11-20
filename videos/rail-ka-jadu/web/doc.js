// भारतीय रेल का जादू — 2D motion-graphics documentary, drawn on a canvas as a pure function of time.
// window.__renderAt(t) draws the frame at t seconds. Anchors (word times) come from out/anchors.json.
const K = await (await fetch('/out/anchors.json')).json();
const CAPS = await (await fetch('/out/captions.json')).json();
const END = K.END;
const W = 1920, H = 1080;
const cv = document.getElementById('c');
const main = cv.getContext('2d');
const bufs = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
let ctx = main;
const UIel = document.getElementById('ui'), LNel = document.getElementById('lines'), CAPel = document.getElementById('cap');

// ------------------------------------------------------------------ utils
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eob = (x) => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, u) => a + (b - a) * u;
const R = (t, a, d = 0.5) => ss((t - a) / d);
const win = (t, a, b, f = 0.3) => R(t, a, f) * (1 - R(t, b - f, f));
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const A = (n) => { if (!(n in K)) throw new Error('anchor ' + n); return K[n]; };
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ camera + UI
let CAM = { x: W / 2, y: H / 2, z: 1 };
let SA = 1; // scene alpha for UI
let UI = [], LINES = [];
function cam(x, y, z) { CAM = { x, y, z }; ctx.setTransform(z, 0, 0, z, W / 2 - x * z, H / 2 - y * z); }
function camKeys(t, keys) { // keys: [[t, x, y, z], ...]
  if (t <= keys[0][0]) return cam(keys[0][1], keys[0][2], keys[0][3]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) { const u = eio((t - a[0]) / (b[0] - a[0])); return cam(lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)); }
  }
  const k = keys[keys.length - 1]; cam(k[1], k[2], k[3]);
}
const scr = (x, y) => [(x - CAM.x) * CAM.z + W / 2, (y - CAM.y) * CAM.z + H / 2];
function label(text, wx, wy, dx, dy, a, sub) {
  if (a <= 0.01) return;
  const [x, y] = scr(wx, wy); const bx = x + dx, by = y + dy;
  a *= SA;
  LINES.push(`<g opacity="${a.toFixed(3)}"><line x1="${x}" y1="${y}" x2="${bx}" y2="${by}" stroke="#fff" stroke-width="3"/>` +
    `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#ffd166" stroke-width="4"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/></g>`);
  const left = dx < 0;
  UI.push(`<div class="t lab" style="left:${bx}px;top:${by}px;transform:translate(${left ? '-100%' : '0'},-50%) scale(${0.85 + 0.15 * a});transform-origin:${left ? 'right' : 'left'} center;opacity:${a.toFixed(3)}">${text}${sub ? `<i>${sub}</i>` : ''}</div>`);
}
function text(html, x, y, o = {}) {
  const a = (o.a ?? 1) * SA; if (a <= 0.01) return;
  const al = o.align ?? 'center', tx = al === 'center' ? '-50%' : al === 'right' ? '-100%' : '0';
  UI.push(`<div class="t ${o.cls || ''}" style="left:${x}px;top:${y}px;font-size:${o.size || 40}px;color:${o.color || '#fff'};opacity:${a.toFixed(3)};` +
    `transform:translate(${tx},-50%) scale(${o.scale ?? 1});${o.style || ''}">${html}</div>`);
}
function chapter(t, a, num, title) { // chapter card in the top-left corner, ~3 s
  const u = win(t, a - 0.1, a + 3.2, 0.4);
  if (u <= 0) return;
  text(`<span class="chap">अध्याय ${num}</span>`, 90, 92, { align: 'left', a: u, size: 30 });
  text(title, 90, 142, { align: 'left', a: u, size: 54, cls: 'ttl', style: `text-align:left;transform:translate(${-30 * (1 - u)}px,-50%)` });
}

// ------------------------------------------------------------------ drawing primitives
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillRR(x, y, w, h, r, f) { rr(x, y, w, h, r); ctx.fillStyle = f; ctx.fill(); }
function lin(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rad(x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function line(pts, col, w, glow = 0, dash = null) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (glow) { ctx.shadowColor = col; ctx.shadowBlur = glow; }
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
}
function glowDot(x, y, r, col, a = 1) {
  if (col.length === 4) col = '#' + col[1] + col[1] + col[2] + col[2] + col[3] + col[3];
  if (r <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rad(x, y, 0, r * 3, [[0, col], [0.25, col + 'aa'], [1, col + '00']]);
  ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill(); ctx.restore();
}
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function polyAt(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0);
    if (s <= l) { const u = l ? s / l : 0; return [lerp(x0, x1, u), lerp(y0, y1, u), Math.atan2(y1 - y0, x1 - x0)]; }
    s -= l;
  }
  const n = pts.length; return [pts[n - 1][0], pts[n - 1][1], 0];
}
function flow(pts, t, col, o = {}) { // glowing particles running along a polyline
  const L = polyLen(pts), gap = o.gap ?? 46, spd = o.speed ?? 260, r = o.r ?? 5, a = o.a ?? 1;
  if (a <= 0.01) return;
  const off = ((t * spd) % gap + gap) % gap;
  const n = Math.floor(L / gap) + 1;
  for (let i = 0; i < n; i++) {
    const s = o.reverse ? L - (i * gap + off) : i * gap + off;
    if (s < 0 || s > L) continue;
    const head = o.upto !== undefined ? (o.reverse ? L - o.upto * L : o.upto * L) : null;
    if (head !== null && (o.reverse ? s < head : s > head)) continue;
    const [x, y] = polyAt(pts, s); glowDot(x, y, r, col, a);
  }
}
function arrow(x0, y0, x1, y1, col, w = 6, a = 1) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.shadowColor = col; ctx.shadowBlur = 14;
  const ang = Math.atan2(y1 - y0, x1 - x0), hl = w * 3.2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(ang) * hl * 0.8, y1 - Math.sin(ang) * hl * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(ang - 0.45) * hl, y1 - Math.sin(ang - 0.45) * hl);
  ctx.lineTo(x1 - Math.cos(ang + 0.45) * hl, y1 - Math.sin(ang + 0.45) * hl); ctx.closePath(); ctx.fill(); ctx.restore();
}
function sine(x, y, w, amp, cycles, phase, col, lw = 5, a = 1) {
  if (a <= 0.01) return;
  const pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120; pts.push([x + u * w, y - amp * Math.sin(u * cycles * TAU + phase)]); }
  ctx.save(); ctx.globalAlpha *= a; line(pts, col, lw, 16); ctx.restore();
}
function panel(x, y, w, h, a = 1, col = 'rgba(12,20,36,.78)') {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  fillRR(x, y, w, h, 26, col); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; rr(x, y, w, h, 26); ctx.stroke(); ctx.restore();
}

// ------------------------------------------------------------------ rolling stock (side view, facing right; y = rail top)
function wheel(cx, cy, r, ang, o = {}) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = lin(0, -r, 0, r, [[0, '#3a414c'], [1, '#14171c']]); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = o.rim || '#a9b3bf'; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, TAU); ctx.stroke();
  ctx.rotate(ang); ctx.strokeStyle = '#6b7581'; ctx.lineWidth = r * 0.12;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * TAU / 6) * r * 0.78, Math.sin(i * TAU / 6) * r * 0.78); ctx.stroke(); }
  ctx.fillStyle = '#c4ccd6'; ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, TAU); ctx.fill();
  ctx.restore();
}
function brakeBlock(cx, cy, r, on) { // shoe that presses on the tread
  const gap = lerp(12, 0, on);
  ctx.save(); ctx.translate(cx, cy);
  fillRR(r + gap, -r * 0.55, 12, r * 1.1, 4, on > 0.5 ? '#ff8a3d' : '#59616c');
  if (on > 0.5) { ctx.shadowColor = '#ff8a3d'; ctx.shadowBlur = 20; fillRR(r + gap, -r * 0.55, 12, r * 1.1, 4, '#ffb070'); }
  ctx.restore();
}
function bogie(cx, n, r, ang, o = {}) {
  const sp = r * 2.6, w = sp * (n - 1) + r * 2.6;
  fillRR(cx - w / 2, -r - 34, w, 22, 6, '#2b313b');
  for (let i = 0; i < n; i++) {
    const x = cx + (i - (n - 1) / 2) * sp;
    fillRR(x - 14, -r - 36, 28, 18, 5, '#475161');
    for (let k = 0; k < 4; k++) line([[x - 10, -r - 38 - k * 6], [x + 10, -r - 41 - k * 6]], '#8f9aa8', 3);
    wheel(x, -r, r, ang + i * 0.7, o);
    if (o.brake !== undefined) brakeBlock(x, -r, r, o.brake);
  }
}
function locoSide(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const B = -64, T = -236, ang = o.ang || 0, cut = o.cut || 0;
  bogie(120, 3, 25, ang, o); bogie(440, 3, 25, ang, o);
  fillRR(-6, B - 2, 572, 18, 4, '#20252d');
  // body
  ctx.save(); ctx.globalAlpha *= 1 - 0.82 * cut;
  ctx.beginPath(); ctx.moveTo(0, B); ctx.lineTo(0, T + 34); ctx.lineTo(26, T); ctx.lineTo(522, T); ctx.lineTo(560, T + 52); ctx.lineTo(560, B); ctx.closePath();
  ctx.fillStyle = lin(0, T, 0, B, [[0, '#e8543c'], [0.5, '#c63a27'], [1, '#8f2418']]); ctx.fill();
  ctx.fillStyle = '#f3efe6'; ctx.fillRect(0, -128, 560, 14); ctx.fillStyle = '#1d3f7a'; ctx.fillRect(0, -114, 560, 8);
  for (let i = 0; i < 14; i++) fillRR(130 + i * 21, T + 46, 10, 62, 3, 'rgba(0,0,0,.28)');
  ctx.beginPath(); ctx.moveTo(524, T + 8); ctx.lineTo(552, T + 52); ctx.lineTo(552, T + 92); ctx.lineTo(512, T + 92); ctx.lineTo(512, T + 8); ctx.closePath();
  ctx.fillStyle = lin(512, T, 552, T + 92, [[0, '#9fd3ff'], [0.35, '#1f3b5c'], [1, '#0b1626']]); ctx.fill();
  fillRR(452, T + 22, 40, 52, 6, '#16273d'); fillRR(36, T + 22, 40, 52, 6, '#16273d');
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; rr(424, T + 18, 22, 150, 4); ctx.stroke();
  fillRR(70, T - 12, 120, 14, 4, '#59616c'); fillRR(330, T - 12, 130, 14, 4, '#59616c');
  ctx.restore();
  if (cut > 0.01) locoInternals(o, cut);
  // pantograph (single arm) at x=250, head at height o.pantoTop (loco coords, negative up)
  const px = 250, top = o.pantoTop ?? T - 40, kneeY = lerp(T - 6, top, 0.55);
  fillRR(px - 60, T - 10, 120, 12, 4, '#3a414c');
  line([[px - 50, T - 6], [px + 34, kneeY], [px - 6, top + 8]], '#c9d1da', 7);
  line([[px - 50, T - 6], [px + 34, kneeY]], '#8f9aa8', 3);
  fillRR(px - 56, top, 100, 9, 3, '#2a2f37'); fillRR(px - 52, top - 4, 92, 5, 2, '#121417');
  if (o.headlight !== false) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rad(556, T + 132, 0, 120, [[0, 'rgba(255,240,200,.9)'], [0.15, 'rgba(255,220,150,.35)'], [1, 'rgba(255,220,150,0)']]);
    ctx.beginPath(); ctx.arc(556, T + 132, 120, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function locoInternals(o, a) {
  ctx.save(); ctx.globalAlpha *= a;
  const T = -236, hl = o.hl || {};
  const box = (x, y, w, h, c, name) => {
    const g = hl[name] || 0;
    ctx.save(); if (g) { ctx.shadowColor = c; ctx.shadowBlur = 30 * g; }
    fillRR(x, y, w, h, 10, lin(x, y, x, y + h, [[0, c], [1, '#1b2230']])); ctx.restore();
    ctx.strokeStyle = g ? '#ffffff' : 'rgba(255,255,255,.25)'; ctx.lineWidth = 2 + 2 * g; rr(x, y, w, h, 10); ctx.stroke();
  };
  box(200, T + 70, 150, 120, '#3d6fb5', 'tr');       // transformer
  for (let i = 0; i < 5; i++) line([[214 + i * 28, T + 86], [214 + i * 28, T + 174]], '#e3a14a', 6);
  box(370, T + 60, 110, 130, '#6a4fb0', 'cv');       // converter
  for (let i = 0; i < 4; i++) fillRR(384, T + 76 + i * 28, 82, 16, 4, '#2a1f45');
  box(70, T + 70, 110, 120, '#3b8f78', 'aux');      // blowers / aux
  ctx.restore();
}
function wagonSide(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const ang = o.ang || 0;
  bogie(70, 2, 21, ang, o); bogie(290, 2, 21, ang, o);
  fillRR(-4, -62, 368, 14, 3, '#20252d');
  ctx.fillStyle = lin(0, -210, 0, -60, [[0, o.c1 || '#8a4a2c'], [1, o.c2 || '#57301d']]); ctx.fillRect(0, -206, 360, 146);
  for (let i = 1; i < 10; i++) ctx.fillStyle = 'rgba(0,0,0,.22)', ctx.fillRect(i * 36 - 3, -206, 6, 146);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, -206, 360, 8);
  ctx.beginPath(); ctx.moveTo(2, -206);
  for (let i = 0; i <= 18; i++) ctx.lineTo(2 + i * 20, -214 - 10 * rnd(i + (o.seed || 0) * 31));
  ctx.lineTo(358, -206); ctx.fillStyle = '#1c1c20'; ctx.fill();
  ctx.restore();
}
function train(x, y, s, nWag, o = {}) { // loco front at x; wagons to the left
  const L = 560 * s, Wg = 368 * s;
  for (let i = 0; i < nWag; i++) {
    const wx = x - L - (i + 1) * Wg - (o.gapAt === i ? o.gap || 0 : 0) - (o.gapAt !== undefined && i > o.gapAt ? o.gap || 0 : 0);
    if (wx > W / CAM.z + CAM.x + 50 || wx + Wg < CAM.x - W / 2 / CAM.z - 50) continue;
    wagonSide(wx, y, s, { ...o, seed: i });
  }
  locoSide(x - L, y, s, o);
}

// ------------------------------------------------------------------ night world (side view)
const RAIL = 820, WIRE = 392;
function skyNight(D, warm = 0.6) {
  ctx.fillStyle = lin(0, -200, 0, RAIL, [[0, '#060b1a'], [0.55, '#10224a'], [0.86, '#2a3a6a'], [1, `rgba(255,140,90,${0.55 * warm})`]]);
  ctx.fillRect(-2000, -2000, 6000, RAIL + 2000);
  for (let i = 0; i < 140; i++) {
    const x = ((rnd(i) * 4200 - D * 0.02) % 4200 + 4200) % 4200 - 1100, y = rnd(i + 99) * 520 - 120;
    ctx.globalAlpha = 0.25 + 0.6 * rnd(i + 7); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = rad(1500, 120, 0, 260, [[0, 'rgba(255,245,220,.95)'], [0.12, 'rgba(255,240,210,.85)'], [0.14, 'rgba(255,240,210,.18)'], [1, 'rgba(255,240,210,0)']]);
  ctx.beginPath(); ctx.arc(1500, 120, 260, 0, TAU); ctx.fill();
  // far city
  for (let i = 0; i < 70; i++) {
    const w = 60 + rnd(i) * 120, h = 60 + rnd(i + 3) * 230, x = ((i * 95 - D * 0.12) % 6650 + 6650) % 6650 - 1600;
    ctx.fillStyle = '#0d1630'; ctx.fillRect(x, RAIL - 40 - h, w, h + 40);
    for (let k = 0; k < 10; k++) if (rnd(i * 13 + k) > 0.55) { ctx.fillStyle = 'rgba(255,200,120,.55)'; ctx.fillRect(x + 8 + (k % 3) * (w / 3.2), RAIL - 40 - h + 14 + Math.floor(k / 3) * 26, 8, 10); }
  }
  // hills/trees silhouettes
  ctx.fillStyle = '#081024'; ctx.beginPath(); ctx.moveTo(-1200, RAIL + 10);
  for (let i = 0; i <= 160; i++) { const x = -1200 + i * 40; const u = (x + D * 0.35) * 0.004; ctx.lineTo(x, RAIL - 30 - 30 * Math.sin(u) - 22 * Math.sin(u * 2.7 + 1) - 10 * rnd(Math.floor((x + D * 0.35) / 40))); }
  ctx.lineTo(5200, RAIL + 10); ctx.fill();
}
function trackSide(D) {
  ctx.fillStyle = lin(0, RAIL, 0, RAIL + 120, [[0, '#3b3a3d'], [1, '#121214']]); ctx.fillRect(-2000, RAIL + 4, 7000, 300);
  for (let i = 0; i < 160; i++) { const x = ((i * 48 - D) % 7680 + 7680) % 7680 - 2000; fillRR(x, RAIL + 6, 30, 10, 2, '#5a4a3c'); }
  ctx.fillStyle = lin(0, RAIL - 8, 0, RAIL + 6, [[0, '#e6edf5'], [0.4, '#8d97a3'], [1, '#3b424b']]); ctx.fillRect(-2000, RAIL - 8, 7000, 14);
}
function catenary(D, o = {}) {
  const sp = 620, base = RAIL + 40, top = 300;
  const x0 = -((D % sp) + sp) % sp - sp * 2;
  ctx.save();
  for (let x = x0; x < 4600; x += sp) {
    fillRR(x - 9, top, 18, base - top, 3, lin(x - 9, 0, x + 9, 0, [[0, '#59616c'], [0.5, '#a5afbb'], [1, '#48505a']]));
    fillRR(x - 6, 350, 300, 8, 3, '#8f9aa8'); line([[x, 330], [x + 280, 354]], '#8f9aa8', 4);
  }
  for (let x = x0; x < 4600; x += sp) {
    const pts = []; for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push([x + 270 + u * sp, 352 + 30 * 4 * u * (1 - u)]); }
    line(pts, '#9aa4b1', 3);
    for (let k = 1; k < 8; k++) { const u = k / 8, xx = x + 270 + u * sp; line([[xx, 352 + 30 * 4 * u * (1 - u)], [xx, WIRE]], '#7c8794', 2); }
  }
  line([[-2000, WIRE], [5000, WIRE]], o.wireCol || '#c6cfd9', o.wireW || 4, o.wireGlow || 0);
  ctx.restore();
}
function nightRun(t, D, o = {}) {
  skyNight(D, o.warm ?? 0.6);
  catenary(D, o);
  trackSide(D);
  train(o.trainX ?? 1420, RAIL, o.s ?? 1, o.nWag ?? 7, { ang: D / 25, pantoTop: WIRE - RAIL + 2, ...o.loco });
  // sparks at the contact
  const cx = (o.trainX ?? 1420) - 560 * (o.s ?? 1) + 250 * (o.s ?? 1);
  for (let i = 0; i < 6; i++) {
    const k = Math.floor(t * 30) * 7 + i, a = rnd(k) > 0.72 ? 1 : 0;
    if (!a) continue; const ang = -Math.PI * rnd(k + 1), r = 10 + 40 * rnd(k + 2);
    glowDot(cx - 6 + Math.cos(ang) * r, WIRE + 4 - Math.sin(ang) * r * 0.5, 2.5, '#9fe6ff', 0.9);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rad(cx - 6, WIRE + 2, 0, 60, [[0, 'rgba(160,230,255,.8)'], [1, 'rgba(160,230,255,0)']]); ctx.beginPath(); ctx.arc(cx - 6, WIRE + 2, 60, 0, TAU); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ backgrounds for diagram scenes
function studio(c1 = '#0b1630', c2 = '#04070f', glow = 'rgba(80,140,255,.18)') {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = lin(0, 0, 0, H, [[0, c1], [1, c2]]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rad(W * 0.5, H * 0.42, 0, 1100, [[0, glow], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120,170,255,.06)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

// ================================================================== SCENES
// each: { a, b, draw(t) } — a/b absolute seconds; drawn with crossfades of XF seconds
const XF = 0.45;
const S = [];
const add = (a, b, draw) => S.push({ a, b, draw });

// ---------- HOOK: night freight run
add(0, A('h_how') + 0.1, (t) => {
  const D = t * 520;
  camKeys(t, [[0, 960, 540, 1.0], [A('h_how'), 1000, 560, 1.06]]);
  nightRun(t, D);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const u = R(t, A('h_5000') - 0.1, 0.4) * (1 - R(t, A('h_steer') - 0.2, 0.3));
  const n = Math.round(5000 * eio((t - A('h_5000')) / 1.2));
  text(`<span class="big">${n.toLocaleString('en-IN')}</span> <span style="font-size:.5em">टन</span>`, 960, 230, { size: 150, a: u, scale: 0.9 + 0.1 * u });
  const items = [['स्टीयरिंग', 'h_steer'], ['गियर', 'h_gear'], ['क्लच', 'h_clutch']];
  items.forEach(([w, k], i) => {
    const a = R(t, A(k) - 0.05, 0.25) * (1 - R(t, A('h_run') - 0.1, 0.4));
    text(`<span style="display:inline-block;padding:10px 34px 4px;border-radius:18px;background:rgba(10,16,30,.8);box-shadow:0 0 0 2px rgba(255,90,90,.6)">न ${w} <span style="color:#ff6464">✕</span></span>`,
      560 + i * 400, 230, { size: 58, a, scale: eob(R(t, A(k) - 0.05, 0.35)) });
  });
  const q = [['दौड़ती है', 'h_run'], ['मुड़ती है', 'h_turn'], ['पटरी बदलती है', 'h_track'], ['रुकती है', 'h_stop']];
  q.forEach(([w, k], i) => {
    const a = R(t, A(k), 0.3) * (1 - R(t, A('h_how') - 0.1, 0.3));
    text(w, 300 + i * 440, 200, { size: 56, a, cls: 'ttl', color: '#ffd166', scale: eob(R(t, A(k), 0.4)) });
  });
});
add(A('h_how') + 0.1, A('p0'), (t) => {
  // title card over a slow push on the loco
  const D = t * 300;
  camKeys(t, [[A('h_how'), 1000, 560, 1.06], [A('p0'), 1080, 520, 1.25]]);
  nightRun(t, D, { warm: 0.9 });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(3,6,14,.45)'; ctx.fillRect(0, 0, W, H);
  const u = R(t, A('h_how') + 0.15, 0.6);
  text('आख़िर कैसे?', 960, 380, { size: 120, cls: 'ttl', a: u * (1 - R(t, A('h_go') - 0.1, 0.4)), scale: 0.9 + 0.1 * u });
  const v = R(t, A('h_go'), 0.7);
  text('<span class="chap" style="font-size:34px">एक डॉक्यूमेंट्री</span>', 960, 345, { a: v, size: 34 });
  text('भारतीय रेल का जादू', 960, 470, { size: 132, cls: 'ttl', a: v, scale: 0.92 + 0.08 * v, color: '#ffd166' });
  ctx.save(); ctx.globalAlpha = v; line([[700, 580], [700 + 520 * v, 580]], '#7fd8ff', 4, 18); ctx.restore();
});

// ---------- POWER
add(A('p0'), A('p_zig'), (t) => {
  // close on the pantograph touching the wire
  const D = t * 260;
  camKeys(t, [[A('p0'), 1080, 520, 1.25], [A('p_wire'), 1110, 470, 2.0], [A('p_panto'), 1110, 470, 2.4], [A('p_zig'), 1100, 480, 2.6]]);
  nightRun(t, D, { warm: 0.9, wireCol: '#bfe9ff', wireW: 4, wireGlow: 14 * R(t, A('p_wire'), 0.6) });
  const px = 1420 - 560 + 250;
  flow([[px - 600, WIRE], [px - 6, WIRE]], t, '#59d6ff', { a: R(t, A('p_25k'), 0.5), speed: 300, gap: 34, r: 3.5 });
  flow([[px - 6, WIRE], [px + 10, WIRE + 60], [px - 10, WIRE + 150]], t, '#59d6ff', { a: R(t, A('p_panto') + 0.6, 0.5), speed: 160, gap: 26, r: 3 });
  const sp = R(t, A('p_panto') + 0.4, 0.4);
  for (const dx of [-40, 30]) arrow(px + dx, WIRE + 170, px + dx, WIRE + 110 - 10 * Math.sin(t * 6), '#ffd166', 5, sp);
  label('पैंटोग्राफ़', px - 6, WIRE + 30, 120, 90, win(t, A('p_panto'), A('p_zig') + 0.5, 0.3), 'स्प्रिंग से ऊपर दबता है');
  label('ओवरहेड तार', px - 260, WIRE, -60, -110, win(t, A('p_wire'), A('p_panto'), 0.3));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const u = win(t, A('p_25k'), A('p_panto') + 0.2, 0.35);
  text(`<span class="big" style="color:#7fe3ff;text-shadow:0 0 30px #2bb8ff">25,000</span> <span style="font-size:.45em">वोल्ट</span>`, 960, 200, { size: 140, a: u, scale: 0.9 + 0.1 * u });
  chapter(t, A('p0'), 1, 'बिजली कहाँ से आती है?');
});
add(A('p_zig'), A('p_return') - 0.2, (t) => {
  // top view: zig-zag contact wire sweeping across the pantograph strip
  studio('#0a1730', '#03060d');
  cam(960, 540, 1);
  const D = (t - A('p_zig')) * 420;
  // rails (top view)
  const rail = (y) => { fillRR(-50, y - 7, W + 100, 14, 4, lin(0, y - 7, 0, y + 7, [[0, '#cfd7e1'], [1, '#5b6470']])); };
  for (let i = 0; i < 50; i++) { const x = ((i * 64 - D) % 3200 + 3200) % 3200 - 100; fillRR(x, 330, 28, 420, 4, '#3a2f27'); }
  rail(400); rail(680);
  // pantograph strip (fixed) at x=960, across y 300..780
  const sx = 960;
  fillRR(sx - 22, 290, 44, 500, 10, '#2a2f37'); fillRR(sx - 12, 296, 24, 488, 8, '#151719');
  // wear heat along strip (accumulates where the wire touches)
  const zig = (x) => { const p = 900, u = (((x + D) % p) + p) % p / p; return 540 + 150 * (u < 0.5 ? (u * 4 - 1) : (3 - u * 4)); };
  const heatA = R(t, A('p_zig') + 1.0, 1.5);
  for (let y = 300; y < 780; y += 6) {
    const h = clamp(1 - Math.abs(y - 540) / 170) * heatA;
    if (h > 0) { ctx.fillStyle = `rgba(255,${180 - 80 * h},60,${0.55 * h})`; ctx.fillRect(sx - 12, y, 24, 6); }
  }
  const pts = []; for (let x = -40; x <= W + 40; x += 20) pts.push([x, zig(x)]);
  line(pts, '#bfe9ff', 6, 20);
  const cy = zig(sx); glowDot(sx, cy, 9, '#9fe6ff');
  for (let x = ((-D) % 900 + 900) % 900 - 900; x < W + 900; x += 450) { glowDot(x, zig(x), 0, '#fff', 0); fillRR(x - 10, zig(x) - 10, 20, 20, 4, '#8f9aa8'); }
  label('पैंटोग्राफ़ पट्टी', sx, 300, 60, -110, R(t, A('p_zig') + 0.2, 0.4));
  label('टेढ़ा-मेढ़ा तार', 360, zig(360), -40, -150, R(t, A('p_zig') + 0.4, 0.4));
  // inset: straight wire wears one spot
  const ia = R(t, A('p_zig') + 1.6, 0.5);
  panel(1400, 640, 420, 330, ia);
  if (ia > 0.01) {
    ctx.save(); ctx.globalAlpha = ia;
    fillRR(1590, 690, 40, 230, 8, '#151719');
    ctx.fillStyle = rad(1610, 805, 0, 40, [[0, 'rgba(255,70,50,.95)'], [1, 'rgba(255,70,50,0)']]); ctx.fillRect(1590, 760, 40, 90);
    line([[1420, 805], [1800, 805]], '#bfe9ff', 5, 12);
    ctx.restore();
    text('सीधा तार = एक जगह घिसाई', 1610, 945, { size: 30, a: ia, color: '#ffb0a0' });
    text('✕', 1790, 680, { size: 48, a: ia, color: '#ff6464' });
  }
});
add(A('p_return') - 0.2, A('p_but'), (t) => {
  // circuit: substation -> wire -> loco -> wheels -> rail -> back
  const D = 0;
  cam(960, 560, 0.62);
  skyNight(D, 0.4);
  catenary(D, { wireCol: '#bfe9ff', wireGlow: 10 });
  trackSide(D);
  locoSide(860, RAIL, 1, { ang: 0, pantoTop: WIRE - RAIL + 2, headlight: true });
  // substation
  fillRR(-420, 560, 300, 260, 16, '#1b2a40'); for (let i = 0; i < 3; i++) fillRR(-390 + i * 90, 600, 60, 120, 8, '#e3a14a');
  text('', 0, 0);
  const px = 860 + 250;
  const out = [[-270, 560], [-270, WIRE], [px - 6, WIRE], [px - 6, WIRE + 140], [px + 40, RAIL - 120], [px + 40, RAIL - 26]];
  const back = [[px + 40, RAIL - 4], [-270, RAIL - 4], [-270, 820]];
  flow(out, t, '#59d6ff', { speed: 420, gap: 40, r: 6 });
  flow(back, t, '#ffb347', { speed: 420, gap: 40, r: 6, a: R(t, A('p_return') - 0.3, 0.5) });
  label('सबस्टेशन', -270, 560, 120, -150, R(t, A('p_return') - 0.2, 0.4));
  label('पहिए → पटरी', px + 40, RAIL - 4, 160, 120, R(t, A('p_return'), 0.4), 'बिजली वापस लौटती है');
});
add(A('p_but'), A('e0'), (t) => {
  // loco cutaway: transformer
  studio('#0b1630', '#04070f');
  camKeys(t, [[A('p_but'), 960, 600, 1.35], [A('p_trans'), 900, 560, 1.75], [A('e0'), 900, 560, 1.8]]);
  const cut = R(t, A('p_trans') - 0.6, 0.8);
  trackSide(0);
  locoSide(680, RAIL, 1, { pantoTop: WIRE - RAIL + 2, cut, hl: { tr: R(t, A('p_trans'), 0.4) }, headlight: false });
  line([[-200, WIRE], [2200, WIRE]], '#bfe9ff', 4, 14);
  const px = 680 + 250;
  const T = RAIL - 236;
  flow([[px - 6, WIRE], [px - 6, T - 10], [680 + 275, T + 90]], t, '#59d6ff', { speed: 220, gap: 30, r: 4 });
  // big wave -> small wave
  label('ट्रांसफ़ॉर्मर', 680 + 275, T + 70, -170, -120, R(t, A('p_trans'), 0.4));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ua = R(t, A('p_trans') + 0.3, 0.5);
  panel(1150, 330, 560, 300, ua);
  sine(1180, 430, 230, 70, 2, t * 8, '#59d6ff', 5, ua);
  arrow(1425, 430, 1475, 430, '#ffffff', 5, ua);
  sine(1480, 430, 200, 22, 2, t * 8, '#7dffb0', 5, ua);
  text('25,000 V', 1295, 560, { size: 34, a: ua, color: '#7fd8ff' });
  text('काम लायक', 1580, 560, { size: 34, a: ua, color: '#7dffb0' });
  const lu = win(t, A('p_but'), A('p_trans'), 0.3);
  text(`<span class="big" style="color:#ff6b6b">25,000 V</span> → मोटर? <span style="color:#ff6464">✕</span>`, 960, 160, { size: 70, a: lu });
});

// ---------- ENGINE
add(A('e0'), A('e_motors'), (t) => {
  studio('#0b1630', '#04070f');
  camKeys(t, [[A('e0'), 900, 560, 1.8], [A('e0') + 1.2, 980, 540, 1.6], [A('e_motors'), 960, 600, 1.35]]);
  trackSide(0);
  locoSide(680, RAIL, 1, { pantoTop: WIRE - RAIL + 2, cut: 1, hl: { cv: R(t, A('e_conv'), 0.4) }, headlight: false });
  const T = RAIL - 236;
  flow([[680 + 350, T + 130], [680 + 370, T + 125]], t, '#59d6ff', { speed: 120, gap: 10, r: 4 });
  line([[-200, WIRE], [2200, WIRE]], '#bfe9ff', 4, 14);
  label('कन्वर्टर', 680 + 425, T + 60, 130, -140, R(t, A('e_conv'), 0.4));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const ua = R(t, A('e_conv') + 0.6, 0.5);
  panel(1210, 250, 600, 360, ua);
  const f = 1 + 2.2 * R(t, A('e_accel') - 0.3, 1.6);
  ['#ff6b6b', '#7dffb0', '#59d6ff'].forEach((c, i) => sine(1240, 400, 540, 55, f * 1.5, t * 3 * f + i * TAU / 3, c, 4, ua));
  // accelerator dial
  const da = R(t, A('e_accel') - 0.2, 0.4);
  ctx.save(); ctx.globalAlpha = da;
  ctx.beginPath(); ctx.arc(1510, 545, 46, Math.PI, TAU); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 10; ctx.stroke();
  const p = R(t, A('e_accel') - 0.3, 1.6);
  ctx.beginPath(); ctx.arc(1510, 545, 46, Math.PI, Math.PI + Math.PI * p); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 10; ctx.stroke();
  ctx.restore();
  text('रफ़्तार + ताक़त', 1510, 290, { size: 34, a: ua, color: '#c9d6ff' });
  text('एक्सीलरेटर जैसा', 1510, 600, { size: 30, a: da, color: '#ffd166' });
});
add(A('e_motors'), A('e_hp'), (t) => {
  // motors on the bogies drive the wheels through gears
  studio('#0b1630', '#04070f');
  camKeys(t, [[A('e_motors'), 960, 600, 1.35], [A('e_six'), 960, 690, 1.25], [A('e_gear'), 1170, 730, 2.3], [A('e_hp'), 1175, 735, 2.4]]);
  const spin = (t - A('e_motors')) * 4;
  trackSide(0); line([[-200, WIRE], [2200, WIRE]], '#bfe9ff', 4, 14);
  locoSide(680, RAIL, 1, { pantoTop: WIRE - RAIL + 2, cut: 1, ang: spin, headlight: false });
  const T = RAIL - 236;
  // traction motors (6) next to each axle
  const axles = []; for (const bx of [120, 440]) for (let i = 0; i < 3; i++) axles.push(680 + bx + (i - 1) * 65);
  axles.forEach((x, i) => {
    const on = R(t, A('e_six') + i * 0.18, 0.25);
    ctx.save(); ctx.shadowColor = '#ffb347'; ctx.shadowBlur = 24 * on;
    fillRR(x - 22, RAIL - 100, 44, 30, 8, on > 0.5 ? '#ffb347' : '#6b7581'); ctx.restore();
    text(String(i + 1), ...scr(x, RAIL - 120), { size: 30, a: on * (1 - R(t, A('e_gear') - 0.3, 0.3)), color: '#ffd166' });
  });
  flow([[680 + 425, T + 190], [680 + 425, RAIL - 100], [680 + 440 - 65, RAIL - 100]], t, '#59d6ff', { speed: 160, gap: 20, r: 3, a: R(t, A('e_motors'), 0.4) });
  // gear close-up (pinion + bull gear) drawn at the third axle when zoomed
  const ga = R(t, A('e_gear') - 0.2, 0.5);
  if (ga > 0.01) {
    const gx = 680 + 440 + 65, gy = RAIL - 25;
    const gear = (x, y, r, n, ang, col) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath();
      for (let i = 0; i < n * 2; i++) { const rr_ = i % 2 ? r : r * 1.14, a0 = (i / (n * 2)) * TAU; ctx.lineTo(Math.cos(a0) * rr_, Math.sin(a0) * rr_); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.fillStyle = '#1b1f26'; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.fill(); ctx.restore();
    };
    ctx.save(); ctx.globalAlpha = ga;
    gear(gx, gy, 20, 22, spin, '#e3b552');
    gear(gx - 34, gy - 26, 8, 9, -spin * 2.5, '#ffd27a');
    ctx.restore();
    label('गियर', gx - 34, gy - 26, -90, -70, ga);
  }
  label('मोटर', 680 + 440 - 65, RAIL - 85, -110, -120, win(t, A('e_motors') + 0.2, A('e_gear') - 0.2, 0.3), 'एक इंजन में 6');
});
add(A('e_hp'), A('t0'), (t) => {
  studio('#0c1a36', '#04070f', 'rgba(255,180,80,.12)');
  cam(960, 540, 1);
  const u = R(t, A('e_hp'), 0.4);
  const hp = Math.round(12000 * eio((t - A('e_hp')) / 1.4));
  text(`<span class="big" style="color:#ffd166">${hp.toLocaleString('en-IN')}</span>`, 520, 430, { size: 190, a: u, scale: 0.9 + 0.1 * u });
  text('हॉर्सपावर', 520, 580, { size: 64, a: u, cls: 'ttl' });
  // 100 cars grid
  const ca = A('e_cars');
  for (let i = 0; i < 100; i++) {
    const a = R(t, ca - 0.6 + i * 0.012, 0.18);
    if (a <= 0) continue;
    const x = 1060 + (i % 10) * 74, y = 230 + Math.floor(i / 10) * 62;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(eob(a), eob(a));
    fillRR(-26, -8, 52, 16, 6, '#59d6ff'); fillRR(-15, -20, 30, 14, 6, '#59d6ff');
    ctx.fillStyle = '#0b1630'; ctx.beginPath(); ctx.arc(-14, 9, 6, 0, TAU); ctx.arc(14, 9, 6, 0, TAU); ctx.fill(); ctx.restore();
  }
  text('= लगभग <b style="color:#59d6ff">100 कारें</b>', 1395, 900, { size: 54, a: R(t, ca, 0.4), cls: 'ttl' });
  chapter(t, A('e0'), 2, 'इंजन के अंदर');
});

// ---------- TURNING (the conical wheel)
function railProfile(x, y, s = 1) { // rail cross-section, head at y
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = lin(0, 0, 0, 150, [[0, '#e6edf5'], [0.2, '#9aa4b1'], [1, '#4b535e']]);
  ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(36, 0); ctx.lineTo(36, 34); ctx.lineTo(10, 46); ctx.lineTo(10, 110); ctx.lineTo(60, 128); ctx.lineTo(60, 146); ctx.lineTo(-60, 146); ctx.lineTo(-60, 128);
  ctx.lineTo(-10, 110); ctx.lineTo(-10, 46); ctx.lineTo(-36, 34); ctx.closePath(); ctx.fill(); ctx.restore();
}
function wheelsetFront(cx, y, shift, o = {}) {
  // front view of a wheelset on two rails; wheels are cones: big near the flange (inside), small outside
  const g = 640; // rail centre distance on screen
  const lx = cx - g / 2, rxx = cx + g / 2;
  railProfile(lx, y); railProfile(rxx, y);
  ctx.save(); ctx.translate(shift, 0);
  // axle
  fillRR(lx - 40, y - 150, g + 80, 34, 12, lin(0, y - 150, 0, y - 116, [[0, '#d8dee6'], [1, '#6d7682']]));
  const wheelX = (side) => {
    const x = side < 0 ? lx : rxx, sgn = side; // flange on the inner side (towards the centre)
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath();
    // tread from inner edge (x=-sgn*40 big radius) to outer edge (x=+sgn*60 smaller)
    ctx.moveTo(-sgn * 60, -300); ctx.lineTo(sgn * 70, -300); ctx.lineTo(sgn * 70, -38); ctx.lineTo(-sgn * 40, 0);
    ctx.lineTo(-sgn * 48, 34); ctx.lineTo(-sgn * 62, 36); ctx.lineTo(-sgn * 62, -300); ctx.closePath();
    ctx.fillStyle = lin(-60, 0, 60, 0, [[0, '#59616c'], [0.5, '#b4bec9'], [1, '#59616c']]); ctx.fill();
    if (o.flangeGlow) { ctx.save(); ctx.shadowColor = '#ff6b6b'; ctx.shadowBlur = 30 * o.flangeGlow; ctx.strokeStyle = `rgba(255,107,107,${o.flangeGlow})`; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-sgn * 40, 0); ctx.lineTo(-sgn * 48, 34); ctx.lineTo(-sgn * 62, 36); ctx.stroke(); ctx.restore(); }
    if (o.coneGlow) { ctx.save(); ctx.strokeStyle = `rgba(255,209,102,${o.coneGlow})`; ctx.lineWidth = 7; ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.moveTo(-sgn * 40, 0); ctx.lineTo(sgn * 70, -38); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(0, -150); ctx.fillStyle = '#3a414c'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 60, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.restore();
  };
  wheelX(-1); wheelX(1);
  ctx.restore();
}
add(A('t0'), A('t_slope'), (t) => {
  // question: top view train on a curve
  studio('#0a1a2e', '#03060d', 'rgba(255,209,102,.10)');
  cam(960, 540, 1);
  const cx = 960, cy = 1800, r1 = 1110, r2 = 1170;
  ctx.save(); ctx.lineWidth = 3;
  for (let a = -0.75; a < 0.75; a += 0.035) { const x0 = cx + Math.sin(a) * (r1 - 30), y0 = cy - Math.cos(a) * (r1 - 30), x1 = cx + Math.sin(a) * (r2 + 30), y1 = cy - Math.cos(a) * (r2 + 30); line([[x0, y0], [x1, y1]], '#3a2f27', 12); }
  for (const r of [r1, r2]) { ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2 - 0.8, -Math.PI / 2 + 0.8); ctx.strokeStyle = '#c9d1da'; ctx.lineWidth = 8; ctx.stroke(); }
  ctx.restore();
  const p = (t - A('t0')) * 0.09 - 0.5;
  for (let i = 0; i < 5; i++) {
    const a = p - i * 0.13; if (a < -0.8) continue;
    ctx.save(); ctx.translate(cx + Math.sin(a) * 1140, cy - Math.cos(a) * 1140); ctx.rotate(a);
    fillRR(-62, -32, 124, 64, 10, i === 0 ? '#d64531' : '#7a4029'); ctx.restore();
  }
  // crossed steering wheel
  const u = R(t, A('t_q'), 0.4);
  ctx.save(); ctx.globalAlpha = u; ctx.translate(960, 300); ctx.scale(eob(u), eob(u));
  ctx.strokeStyle = '#e6edf5'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(90, 0); ctx.moveTo(0, 0); ctx.lineTo(0, 90); ctx.stroke();
  line([[-120, -120], [120, 120]], '#ff6464', 16, 20); ctx.restore();
  text('?', 1180, 280, { size: 160, a: u, color: '#ffd166', cls: 'big' });
  const v = R(t, A('t_secret'), 0.4);
  text('राज़: <span style="color:#ffd166">पहियों का आकार</span>', 960, 850, { size: 70, a: v, cls: 'ttl' });
  chapter(t, A('t0'), 3, 'स्टीयरिंग नहीं, फिर मुड़ती कैसे?');
});
add(A('t_slope'), A('t_curve'), (t) => {
  studio('#0a1a2e', '#03060d', 'rgba(255,209,102,.10)');
  camKeys(t, [[A('t_slope'), 960, 560, 1.0], [A('t_axle'), 960, 520, 0.95]]);
  wheelsetFront(960, 760, 0, { coneGlow: win(t, A('t_slope') + 0.2, A('t_axle') + 0.6, 0.3) });
  const u = R(t, A('t_slope') + 0.6, 0.4);
  label('अंदर मोटा', 960 - 320 + 40, 760, 120, -230, u);
  label('बाहर पतला', 960 - 320 - 66, 728, -120, -230, u);
  const ax = R(t, A('t_axle'), 0.4);
  ctx.save(); ctx.globalAlpha = ax; ctx.strokeStyle = '#59d6ff'; ctx.lineWidth = 5; ctx.setLineDash([16, 12]); ctx.shadowColor = '#59d6ff'; ctx.shadowBlur = 16;
  rr(960 - 380, 760 - 160, 760, 54, 20); ctx.stroke(); ctx.restore();
  text('एक ही धुरी पर जुड़े', 960, 520, { size: 46, a: ax, color: '#59d6ff' });
  // zoomed inset of the cone profile
  const ia = R(t, A('t_slope') + 0.2, 0.4) * (1 - R(t, A('t_axle') - 0.2, 0.3));
  if (ia > 0.01) {
    panel(1320, 120, 480, 300, ia);
    ctx.save(); ctx.globalAlpha = ia;
    line([[1380, 340], [1740, 300]], '#ffd166', 8, 18); line([[1380, 340], [1380, 380]], '#ff6b6b', 8, 10);
    ctx.restore();
    text('ढलानदार पहिया', 1560, 170, { size: 36, a: ia, color: '#ffd166' });
  }
});
add(A('t_curve'), A('t_self') + 0.6, (t) => {
  // curve: wheelset shifts outward; outer wheel rides big radius, inner small; unrolled distance
  studio('#0a1a2e', '#03060d', 'rgba(255,209,102,.10)');
  cam(960, 540, 0.82);
  const sh = 34 * R(t, A('t_curve') + 0.3, 0.8);
  wheelsetFront(960, 900, sh, {});
  const ca = R(t, A('t_curve') + 0.6, 0.4);
  arrow(700, 560, 1150, 560, '#ffd166', 8, ca * (1 - R(t, A('t_outer'), 0.3)));
  text('मोड़ → ट्रेन बाहर खिसकती है', 960, 480, { size: 44, a: ca * (1 - R(t, A('t_outer'), 0.3)) });
  // contact points
  const ou = R(t, A('t_outer'), 0.4);
  const rx = 960 + 320 + sh, lx = 960 - 320 + sh;
  ctx.save(); ctx.globalAlpha = ou;
  glowDot(rx - 36, 900, 8, '#ffd166'); glowDot(lx + 60, 868, 8, '#59d6ff'); ctx.restore();
  label('बाहर वाला: मोटा हिस्सा', rx - 36, 900, 140, -280, ou);
  label('अंदर वाला: पतला हिस्सा', lx + 60, 868, -140, -280, ou);
  // unrolled distance bars (one turn)
  const da = R(t, A('t_dist') - 0.3, 0.5), grow = eio((t - A('t_dist') + 0.2) / 1.6);
  panel(240, 130, 1440, 260, da);
  if (da > 0.01) {
    ctx.save(); ctx.globalAlpha = da;
    line([[300, 210], [300 + 1300 * grow, 210]], '#ffd166', 18, 20);
    line([[300, 310], [300 + 1100 * grow, 310]], '#59d6ff', 18, 20);
    wheel(300 + 1300 * grow, 175, 30, grow * 9); wheel(300 + 1100 * grow, 275, 26, grow * 9);
    ctx.restore();
    text('एक चक्कर में ज़्यादा दूरी', 980, 160, { size: 34, a: da, color: '#ffd166' });
  }
  const sa = R(t, A('t_self'), 0.4);
  text('…और ट्रेन <span style="color:#ffd166">अपने आप</span> मुड़ जाती है', 960, 680, { size: 64, a: sa, cls: 'ttl' });
});
add(A('t_self') + 0.6, A('pt0'), (t) => {
  // top view: wheelset steering itself through a curve, then the flange as the last guard
  studio('#0a1a2e', '#03060d', 'rgba(255,209,102,.10)');
  camKeys(t, [[A('t_self') + 0.6, 960, 560, 1.0], [A('t_flange') - 0.3, 960, 640, 1.0], [A('pt0'), 960, 700, 1.15]]);
  const cx = 960, cy = 1700, rm = 1250, g = 160;
  for (let a = -0.7; a < 0.7; a += 0.03) line([[cx + Math.sin(a) * (rm - g / 2 - 40), cy - Math.cos(a) * (rm - g / 2 - 40)], [cx + Math.sin(a) * (rm + g / 2 + 40), cy - Math.cos(a) * (rm + g / 2 + 40)]], '#3a2f27', 10);
  for (const r of [rm - g / 2, rm + g / 2]) { ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2 - 0.75, -Math.PI / 2 + 0.75); ctx.strokeStyle = '#c9d1da'; ctx.lineWidth = 9; ctx.stroke(); }
  const a = -0.55 + ((t - A('t_self') - 0.6) * 0.12) % 1.1;
  const trail = [], trail2 = [];
  for (let k = 0; k < 40; k++) { const b = a - k * 0.01; trail.push([cx + Math.sin(b) * (rm + g / 2), cy - Math.cos(b) * (rm + g / 2)]); trail2.push([cx + Math.sin(b) * (rm - g / 2), cy - Math.cos(b) * (rm - g / 2)]); }
  line(trail, 'rgba(255,209,102,.8)', 10, 18); line(trail2, 'rgba(89,214,255,.8)', 6, 14);
  ctx.save(); ctx.translate(cx + Math.sin(a) * rm, cy - Math.cos(a) * rm); ctx.rotate(a);
  fillRR(-g / 2 - 30, -10, g + 60, 20, 8, '#c9d1da');
  fillRR(-g / 2 - 22, -40, 36, 80, 10, '#ffd166'); fillRR(g / 2 - 14, -40, 36, 80, 10, '#59d6ff');
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const fa = R(t, A('t_flange') - 0.2, 0.5);
  panel(1250, 160, 560, 520, fa);
  if (fa > 0.01) {
    ctx.save(); ctx.globalAlpha = fa; ctx.translate(-410, 0); ctx.scale(1, 1);
    // side profile: wheel with flange on rail
    railProfile(1940, 520, 1.1);
    ctx.beginPath(); ctx.moveTo(1880, 520); ctx.lineTo(2000, 506); ctx.lineTo(2000, 260); ctx.lineTo(1860, 260); ctx.lineTo(1860, 556); ctx.lineTo(1876, 556); ctx.closePath();
    ctx.fillStyle = lin(1860, 0, 2000, 0, [[0, '#59616c'], [0.5, '#b4bec9'], [1, '#59616c']]); ctx.fill();
    const gl = 0.5 + 0.5 * Math.sin(t * 7);
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 8; ctx.shadowColor = '#ff6b6b'; ctx.shadowBlur = 30 * gl;
    ctx.beginPath(); ctx.moveTo(1880, 520); ctx.lineTo(1876, 556); ctx.lineTo(1860, 556); ctx.stroke();
    ctx.restore();
    text('फ़्लैंज = आख़िरी सुरक्षा', 1530, 620, { size: 40, a: fa, color: '#ff8a8a' });
  }
});

// ---------- POINTS
add(A('pt0'), A('s0'), (t) => {
  studio('#0b1a2a', '#03060d', 'rgba(120,255,180,.08)');
  camKeys(t, [[A('pt0'), 960, 560, 0.9], [A('pt_blades'), 820, 600, 1.25], [A('pt_machine'), 760, 640, 1.35], [A('pt_turn'), 960, 560, 0.95], [A('s0'), 960, 560, 0.95]]);
  const y0 = 660, g = 110;
  // diverging track: from x=900 curving up to y0-420 at x=1900
  const div = (x) => x < 820 ? null : y0 - 420 * Math.pow((x - 820) / 1080, 1.8);
  for (let x = -200; x < 2200; x += 40) { fillRR(x, y0 - g / 2 - 26, 16, g + 52, 3, '#3a2f27'); }
  for (let x = 840; x < 2100; x += 40) { const y = div(x); fillRR(x, y - g / 2 - 26, 16, g + 52, 3, '#3a2f27'); }
  const railY = (y) => line([[-200, y], [2200, y]], '#c9d1da', 9);
  railY(y0 - g / 2); railY(y0 + g / 2);
  const dpts = (off) => { const p = []; for (let x = 820; x < 2200; x += 20) p.push([x, div(x) + off]); return p; };
  line(dpts(-g / 2), '#c9d1da', 9); line(dpts(g / 2), '#c9d1da', 9);
  // switch blades (pivot at x=1060), tips at x=760
  const set = R(t, A('pt_blades') + 0.3, 0.6); // 0 straight, 1 diverging
  const tipUp = lerp(0, -1, set);
  const blade = (yRail, side) => { // side: -1 upper rail, 1 lower rail
    const closed = side < 0 ? set : 1 - set; // which blade touches its stock rail
    const tipY = yRail + side * (closed ? 0 : 0) + (side < 0 ? 1 : -1) * (1 - closed) * 26 * -1;
    line([[760, yRail + (side < 0 ? (1 - set) * 24 : -set * 24)], [1060, yRail]], '#ffd166', 8, 16 * R(t, A('pt_blades'), 0.3));
  };
  blade(y0 - g / 2, -1); blade(y0 + g / 2, 1);
  // point machine with rod
  const mx = 780, my = y0 + 200;
  fillRR(mx - 70, my - 40, 140, 80, 12, '#2c3a52'); fillRR(mx - 56, my - 26, 112, 52, 8, '#1b2536');
  const rodY = lerp(y0 + g / 2 - 2, y0 + g / 2 - 26, set);
  line([[mx, my - 40], [mx, rodY]], '#9aa4b1', 8);
  const ma = R(t, A('pt_machine'), 0.4);
  if (ma > 0) { ctx.save(); ctx.globalAlpha = ma; ctx.shadowColor = '#59d6ff'; ctx.shadowBlur = 30; fillRR(mx - 70, my - 40, 140, 80, 12, 'rgba(89,214,255,.25)'); ctx.restore(); }
  flow([[mx - 900, my + 120], [mx, my + 120], [mx, my + 40]], t, '#59d6ff', { a: ma * (1 - R(t, A('pt_turn'), 0.4)), speed: 260, gap: 30, r: 4 });
  label('नुकीले हिस्से (स्विच)', 820, y0 - g / 2 + 10, 40, -210, win(t, A('pt_blades'), A('pt_turn'), 0.3));
  label('पॉइंट मशीन', mx, my, -120, 140, win(t, A('pt_machine'), A('pt_turn') + 0.5, 0.3), 'कंट्रोल रूम से');
  // train (top view) takes the route
  const tu = (t - A('pt_turn') + 0.4) * 520;
  const along = (s) => { // path: straight until 820 then diverging
    const x = -900 + s; if (x < 820) return [x, y0, 0];
    let px = 820, py = y0; let rem = x - 820, xx = 820;
    while (rem > 0 && xx < 2400) { const nx = xx + 4, ny = div(nx); const d = Math.hypot(nx - xx, ny - div(xx)); rem -= d; xx = nx; }
    const yy = div(xx); return [xx, yy, Math.atan2(div(xx + 4) - yy, 4)];
  };
  if (t > A('pt_turn') - 0.4) for (let i = 0; i < 6; i++) {
    const [x, y, ang] = along(tu - i * 190);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); fillRR(-86, -50, 172, 100, 14, i === 0 ? '#d64531' : '#7a4029');
    if (i === 0) { fillRR(40, -40, 40, 80, 8, '#9fd3ff'); fillRR(-60, -10, 80, 20, 6, '#3a414c'); }
    ctx.restore();
  }
  // lock + signal
  const la = R(t, A('pt_lock') - 0.1, 0.4);
  const sgx = 420, sgy = y0 - 250;
  fillRR(sgx - 10, sgy, 20, 200, 4, '#59616c'); fillRR(sgx - 36, sgy - 120, 72, 140, 18, '#111');
  const green = R(t, A('pt_green'), 0.3);
  glowDot(sgx, sgy - 85, 16, green > 0.5 ? '#3dff7a' : '#ff3b3b');
  ctx.save(); ctx.globalAlpha = 0.2; glowDot(sgx, sgy - 40, 12, '#3dff7a'); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const lockA = la * (1 - R(t, A('s0') - 0.3, 0.3));
  text(`🔒 पॉइंट लॉक ${green > 0.5 ? '→ <span style="color:#3dff7a">सिग्नल हरा</span>' : '?'}`, 960, 150, { size: 54, a: lockA, cls: 'ttl' });
  chapter(t, A('pt0'), 4, 'पटरी कैसे बदलती है?');
});

// ---------- SIGNALS
add(A('s0'), A('b0'), (t) => {
  studio('#081426', '#03060d', 'rgba(120,180,255,.10)');
  camKeys(t, [[A('s0'), 960, 560, 1.0], [A('s_sensor'), 760, 600, 1.5], [A('s_aspects') - 0.4, 960, 560, 1.0]]);
  const y = 640, bl = 380, nb = 6, x0 = 2;
  const ts = t - A('s0');
  const xa = 1100 + ts * 30; // lead train front
  const xb = 200 + ts * 30 - 14 * Math.max(0, t - A('s_behind'));
  // blocks
  for (let i = 0; i < nb; i++) {
    const bx = x0 + i * bl;
    const occ = (xa - 520 < bx + bl && xa > bx) || (xb - 520 < bx + bl && xb > bx);
    fillRR(bx + 6, y + 70, bl - 12, 18, 9, occ ? 'rgba(255,90,90,.7)' : 'rgba(89,214,255,.25)');
    text(`ब्लॉक ${i + 1}`, ...scr(bx + bl / 2, y + 120), { size: 26, a: R(t, A('s0'), 0.5) * 0.85, color: '#9fb8d6' });
  }
  line([[-100, y - 22], [2400, y - 22]], '#c9d1da', 7); line([[-100, y + 22], [2400, y + 22]], '#c9d1da', 7);
  for (let x = -100; x < 2400; x += 32) fillRR(x, y - 38, 12, 76, 2, '#3a2f27');
  const drawTrain = (xf, col, wc) => { for (let i = 0; i < 4; i++) fillRR(xf - (i + 1) * 130, y - 34, 122, 68, 12, i === 0 ? col : wc); };
  drawTrain(xa, '#d64531', '#7a4029'); drawTrain(xb, '#3f77c9', '#2c4a72');
  // axle counters at boundaries
  for (let i = 0; i <= nb; i++) {
    const bx = x0 + i * bl; const near = Math.min(Math.abs(xa - 260 - bx), Math.abs(xb - 260 - bx));
    const p = clamp(1 - near / 240) * R(t, A('s_sensor') - 0.2, 0.4);
    fillRR(bx - 14, y + 26, 28, 18, 5, '#2c3a52'); if (p > 0) glowDot(bx, y + 35, 6, '#ffd166', p);
  }
  // signals at each block entry (for trains moving right): aspect from blocks ahead
  const occBlock = (i) => (xa - 520 < x0 + (i + 1) * bl && xa > x0 + i * bl);
  for (let i = 0; i < nb; i++) {
    const bx = x0 + i * bl;
    let asp = 'G';
    if (occBlock(i)) asp = 'R'; else if (occBlock(i + 1)) asp = 'Y'; else if (occBlock(i + 2)) asp = 'YY';
    const sa = R(t, A('s_aspects') - 0.3, 0.4);
    ctx.save(); ctx.globalAlpha = 0.4 + 0.6 * sa;
    fillRR(bx - 8, y - 260, 16, 200, 4, '#59616c'); fillRR(bx - 30, y - 400, 60, 150, 14, '#0c0c0e');
    const lamps = [['#3dff7a', asp === 'G'], ['#ffcc33', asp === 'Y' || asp === 'YY'], ['#ff3b3b', asp === 'R'], ['#ffcc33', asp === 'YY']];
    lamps.forEach(([c, on], k) => { if (on) glowDot(bx, y - 380 + k * 34, 10, c); else { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(bx, y - 380 + k * 34, 10, 0, TAU); ctx.fill(); } });
    ctx.restore();
  }
  label('सेंसर: पहिए गिनता है', x0 + 3 * bl, y + 35, 60, 170, win(t, A('s_sensor'), A('s_aspects') - 0.3, 0.3));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  text('एक ब्लॉक = <span style="color:#ffd166">एक ही ट्रेन</span>', 960, 140, { size: 60, a: win(t, A('s_rule'), A('s_sensor'), 0.3), cls: 'ttl' });
  const leg = R(t, A('s_aspects'), 0.4);
  panel(560, 800, 800, 110, leg);
  [['#ff3b3b', 'रुको'], ['#ffcc33', 'संभलो'], ['#ffcc33', 'दो पीले'], ['#3dff7a', 'चलो']].forEach(([c, w], i) => {
    if (leg > 0) { ctx.save(); ctx.globalAlpha = leg; glowDot(620 + i * 195, 855, 9, c); if (i === 2) glowDot(640 + i * 195, 855, 9, c); ctx.restore(); }
    text(w, 700 + i * 195, 857, { size: 32, a: leg, align: 'left' });
  });
  const ba = R(t, A('s_behind'), 0.4);
  text('पीछे वाली ट्रेन पहले से धीमी', 960, 220, { size: 46, a: ba, color: '#9fd3ff' });
  chapter(t, A('s0'), 5, 'सिग्नल का खेल');
});

// ---------- BRAKES
add(A('b0'), A('b_km') - 0.3, (t) => {
  studio('#0b1426', '#03060d', 'rgba(255,140,60,.08)');
  camKeys(t, [[A('b0'), 960, 760, 0.62], [A('b_pipe'), 820, 780, 0.75], [A('b_apply'), 820, 780, 0.75], [A('b_break'), 700, 760, 0.6]]);
  const apply = R(t, A('b_apply') + 0.3, 0.3);
  const brk = A('b_break');
  const gap = 180 * eio((t - brk - 0.3) / 1.0);
  trackSide(0);
  const s = 1, front = 1900;
  const cars = 5;
  // pipe pressure: wave from loco backwards after apply; everywhere after break
  const waveX = front - (t - A('b_apply') - 0.3) * 1400;
  const braked = (x) => (t > brk + 0.4 ? 1 : (apply > 0 && x > waveX ? 1 : 0));
  // draw wagons + loco with per-vehicle brake state
  for (let i = cars - 1; i >= 0; i--) {
    const wx = front - 560 * s - (i + 1) * 368 * s - (i >= 2 ? gap : 0);
    wagonSide(wx, RAIL, s, { brake: braked(wx + 180), seed: i });
  }
  locoSide(front - 560 * s, RAIL, s, { brake: braked(front - 300), pantoTop: WIRE - RAIL + 2 });
  // brake pipe line along the underframe
  const py = RAIL - 52;
  const xL = front - 560 - cars * 368 - gap, xR = front;
  const pcol = (x) => braked(x) ? '#ff8a3d' : '#59d6ff';
  for (let x = xL; x < xR; x += 20) {
    if (x > front - 560 - 2 * 368 - gap - 10 && x < front - 560 - 2 * 368 + 10 && gap > 2) continue;
    line([[x, py], [x + 20, py]], pcol(x + 10), 8, 12);
  }
  if (t > brk + 0.25) { for (let i = 0; i < 26; i++) { const k = i * 7 + Math.floor(t * 30); const xx = front - 560 - 2 * 368 - gap / 2 + (rnd(k) - 0.5) * gap; glowDot(xx, py - 60 * rnd(k + 2), 3, '#d6f3ff', 0.5 * (1 - R(t, brk + 1.4, 0.8))); } }
  label('हवा का पाइप', xL + 500, py, -40, 200, win(t, A('b_pipe'), A('b_apply') + 0.6, 0.3));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // gauge
  const press = (1 - apply) * (t > brk + 0.4 ? 0 : 1);
  const ga = R(t, A('b_pipe') + 0.3, 0.4);
  panel(1500, 90, 340, 340, ga);
  if (ga > 0) {
    ctx.save(); ctx.globalAlpha = ga; ctx.translate(1670, 280);
    ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(0, 0, 110, Math.PI * 0.8, Math.PI * 2.2); ctx.stroke();
    ctx.strokeStyle = press > 0.5 ? '#59d6ff' : '#ff8a3d'; ctx.beginPath(); ctx.arc(0, 0, 110, Math.PI * 0.8, Math.PI * (0.8 + 1.4 * press)); ctx.stroke();
    ctx.rotate(Math.PI * (0.8 + 1.4 * press)); line([[0, 0], [92, 0]], '#fff', 6); ctx.restore();
    text('दबाव', 1670, 140, { size: 32, a: ga, color: '#c9d6ff' });
    text(press > 0.5 ? 'ब्रेक खुले' : 'ब्रेक लगे', 1670, 370, { size: 40, a: ga, color: press > 0.5 ? '#59d6ff' : '#ff8a3d' });
  }
  const ba = R(t, brk + 0.3, 0.4);
  text('ट्रेन टूटी → पाइप टूटा → <span style="color:#ff8a3d">अपने आप ब्रेक</span>', 760, 170, { size: 52, a: ba, cls: 'ttl' });
  chapter(t, A('b0'), 6, 'रुकने में 1 किलोमीटर क्यों?');
});
add(A('b_km') - 0.3, A('b_regen'), (t) => {
  // stopping distance + danger
  studio('#120c14', '#05030a', 'rgba(255,90,60,.12)');
  cam(960, 540, 1);
  const y = 640;
  line([[80, y], [1840, y]], '#c9d1da', 8);
  for (let x = 80; x < 1840; x += 30) fillRR(x, y - 18, 12, 36, 2, '#3a2f27');
  for (let k = 0; k <= 10; k++) { const x = 160 + k * 160; line([[x, y + 40], [x, y + 60 + (k % 5 ? 0 : 16)]], '#9fb8d6', 3); }
  text('0', 160, y + 110, { size: 30, color: '#9fb8d6' }); text('1 किमी', 1760, y + 110, { size: 34, color: '#ffd166' });
  const u = (t - A('b_km') + 0.3) / 2.6; const p = 1 - Math.pow(1 - clamp(u), 2);
  const x = 160 + 1600 * p;
  for (let i = 0; i < 4; i++) fillRR(x - (i + 1) * 110 + 10, y - 40, 100, 80, 12, i === 0 ? '#d64531' : '#7a4029');
  if (u < 1) for (let i = 0; i < 8; i++) glowDot(x - 60 - 110 * (i % 4) + rnd(i + Math.floor(t * 30)) * 20, y + 34, 3, '#ffb347', 0.8);
  text(`<span class="big" style="color:#ffd166">≈ 1 किमी</span>`, 960, 330, { size: 110, a: R(t, A('b_km'), 0.4) });
  const da = R(t, A('b_danger') - 0.3, 0.4);
  if (da > 0) {
    ctx.save(); ctx.globalAlpha = da; ctx.translate(1520, 330); ctx.scale(eob(da), eob(da));
    ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(120, 90); ctx.lineTo(-120, 90); ctx.closePath(); ctx.fillStyle = '#ffcc33'; ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = '#1b1b1b'; ctx.stroke(); ctx.restore();
    text('!', 1520, 345, { size: 130, a: da, color: '#1b1b1b', cls: 'big' });
    text('पटरी पर खड़े न हों • फाटक बंद हो तो रुकें', 960, 900, { size: 50, a: da, color: '#ff8a8a', cls: 'ttl' });
  }
});
add(A('b_regen'), A('n0'), (t) => {
  studio('#0b1630', '#04070f', 'rgba(125,255,176,.10)');
  cam(900, 560, 1.35);
  trackSide(0);
  const spin = (t - A('b_regen')) * 3;
  locoSide(680, RAIL, 1, { pantoTop: WIRE - RAIL + 2, cut: 1, ang: spin, headlight: false, hl: { cv: 0.6, tr: 0.6 } });
  line([[-200, WIRE], [2200, WIRE]], '#bfe9ff', 4, 14);
  const T = RAIL - 236, px = 680 + 250;
  const path = [[680 + 375, RAIL - 90], [680 + 425, T + 190], [680 + 350, T + 130], [680 + 275, T + 90], [px - 6, T - 10], [px - 6, WIRE], [px + 600, WIRE]];
  flow(path, t, '#7dffb0', { speed: 260, gap: 30, r: 5, a: R(t, A('b_regen') + 0.4, 0.5) });
  label('ब्रेक लगाते वक़्त', 680 + 375, RAIL - 90, -100, 120, R(t, A('b_regen') + 0.2, 0.4), 'मोटर बन जाती है जनरेटर');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  text('बिजली <span style="color:#7dffb0">वापस तार में</span> ↑', 960, 150, { size: 60, a: R(t, A('b_regen') + 0.8, 0.4), cls: 'ttl' });
});

// ---------- END
add(A('n0'), END + 1, (t) => {
  const D = t * 520;
  camKeys(t, [[A('n0'), 1080, 520, 1.25], [A('n_recap'), 960, 540, 1.0], [END, 900, 560, 0.92]]);
  nightRun(t, D, { warm: 0.8 });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const items = [['⚡ 25,000 V', 'n_r1'], ['◢ ढलानदार पहिए', 'n_r2'], ['● सिग्नल', 'n_r3'], ['〰 हवा का पहरा', 'n_r4']];
  items.forEach(([w, k], i) => {
    const a = R(t, A(k), 0.3) * (1 - R(t, A('n_title') - 0.3, 0.4));
    text(`<span style="display:inline-block;padding:12px 32px 6px;border-radius:18px;background:rgba(8,14,28,.8);box-shadow:0 0 0 2px rgba(127,216,255,.4)">${w}</span>`,
      330 + i * 420, 200, { size: 46, a, scale: eob(R(t, A(k), 0.4)) });
  });
  const v = R(t, A('n_title'), 0.7);
  ctx.fillStyle = `rgba(3,6,14,${0.45 * v})`; ctx.fillRect(0, 0, W, H);
  text('भारतीय रेल का', 960, 400, { size: 90, cls: 'ttl', a: v });
  text('असली जादू', 960, 520, { size: 150, cls: 'ttl', a: v, color: '#ffd166', scale: 0.92 + 0.08 * v });
});

// ------------------------------------------------------------------ grain + vignette + captions
const grain = document.createElement('canvas'); grain.width = grain.height = 256;
{ const g = grain.getContext('2d'), im = g.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const v = rnd(i) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }

function captions(t) {
  const c = CAPS.find((c) => t >= c.t0 && t < c.t1);
  if (!c || t > A('n_title')) { CAPel.innerHTML = ''; return; }
  CAPel.innerHTML = '<span class="box">' + c.words.map((w, i) => {
    const on = t >= w.t - 0.03 && (i === c.words.length - 1 || t < c.words[i + 1].t - 0.03);
    return `<span class="${on ? 'on' : ''}">${w.w}</span>`;
  }).join(' ') + '</span>';
  CAPel.style.opacity = Math.min(1, (t - c.t0) / 0.06, (c.t1 - t) / 0.06);
}

function renderAt(t) {
  UI = []; LINES = [];
  const act = S.filter((s) => t >= s.a - XF && t < s.b);
  main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.fillStyle = '#05080f'; main.fillRect(0, 0, W, H);
  act.forEach((s, i) => {
    const a = clamp((t - (s.a - XF)) / XF);
    const c = bufs[i % 2]; ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    SA = s.a <= 0 ? 1 : a;
    s.draw(t);
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = s.a <= 0 ? 1 : a; main.drawImage(c, 0, 0);
  });
  ctx = main; main.globalAlpha = 1;
  main.save(); main.globalCompositeOperation = 'overlay'; main.globalAlpha = 0.07;
  const ox = Math.floor(rnd(Math.floor(t * 30)) * 256), oy = Math.floor(rnd(Math.floor(t * 30) + 5) * 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) main.drawImage(grain, x, y);
  main.restore();
  main.fillStyle = rad(W / 2, H / 2, H * 0.45, H * 1.05, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.55)']]); main.fillRect(0, 0, W, H);
  const fade = Math.min(1, t / 0.6, (END + 0.8 - t) / 0.8);
  if (fade < 1) { main.fillStyle = `rgba(0,0,0,${1 - Math.max(0, fade)})`; main.fillRect(0, 0, W, H); }
  UIel.innerHTML = UI.join(''); LNel.innerHTML = LINES.join('');
  UIel.style.opacity = LNel.style.opacity = Math.max(0, fade);
  captions(t);
}
window.__renderAt = renderAt;
window.__END = END;
await document.fonts.ready;
renderAt(0);
window.__ready = true;
