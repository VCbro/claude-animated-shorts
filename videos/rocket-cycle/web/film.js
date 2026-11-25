// "India's first rocket went on a bicycle" (Thumba, 1963): cinematic story style, 1080x1920.
import { add, start, A, R, win, eio, eob, lerp, clamp, rnd, ctx, cam, camKeys, screen, text, label, fillRR, lin, rad, line, glowDot, TAU, END, W, H } from './engine.js';

const GOLD = '#ffcf8a', SAFF = '#ff9933', GRN = '#3fae49', SEPIA = '#e8d3b0';
const title = (html, y, a, size = 96, col = '#fff7ee') => text(`<span style="color:${col};text-shadow:0 4px 30px rgba(0,0,0,.8)">${html}</span>`, W / 2, y, { size, a, cls: 'ttl' });
const card = (html, y, a) => text(`<span style="font-family:B;font-weight:600;letter-spacing:6px;padding:10px 28px;border:2px solid rgba(255,207,138,.7);color:#ffcf8a">${html}</span>`, W / 2, y, { size: 34, a });
function sepia(a) { screen(); if (a > 0) { ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = `rgba(150,110,60,${0.75 * a})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  ctx.fillStyle = lin(0, 0, 0, 620, [[0, 'rgba(10,6,2,.85)'], [0.7, 'rgba(10,6,2,.45)'], [1, 'rgba(10,6,2,0)']]); ctx.fillRect(0, 0, W, 620); }   // title band
function tricolour(y, a) { if (a <= 0) return; screen(); ctx.save(); ctx.globalAlpha = a; const w = 420; ctx.fillStyle = SAFF; ctx.fillRect(W / 2 - w / 2, y, w / 3, 8); ctx.fillStyle = '#fff'; ctx.fillRect(W / 2 - w / 6, y, w / 3, 8); ctx.fillStyle = GRN; ctx.fillRect(W / 2 + w / 6, y, w / 3, 8); ctx.restore(); }

// ------------------------------------------------------------------ props
function moonScene(t) {
  screen(); ctx.fillStyle = '#020306'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) glowDot(rnd(i) * W, rnd(i + 1) * H * 0.6, 1 + 2 * rnd(i + 2), '#ffffff', 0.4 + 0.5 * rnd(i + 3));
  ctx.fillStyle = rad(540, 2200, 600, 1500, [[0, '#9a9a96'], [0.7, '#5c5c5a'], [1, '#2a2a29']]); ctx.beginPath(); ctx.arc(540, 2400, 1300, 0, TAU); ctx.fill();
  for (let i = 0; i < 14; i++) { const x = rnd(i + 9) * W, y = 1180 + rnd(i + 10) * 600, r = 20 + 60 * rnd(i + 11); ctx.fillStyle = 'rgba(40,40,40,.35)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.35, 0, 0, TAU); ctx.fill(); }
  // lander (gold foil box on four legs) + rover
  const lx = 540, ly = 1240; ctx.save(); ctx.translate(lx, ly); ctx.scale(1.6, 1.6); ctx.translate(-lx, -ly);
  ctx.strokeStyle = '#c9c9c9'; ctx.lineWidth = 8; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(lx + d * 80, ly - 70); ctx.lineTo(lx + d * 140, ly); ctx.stroke(); }
  ctx.fillStyle = lin(lx - 100, 0, lx + 100, 0, [[0, '#a8761f'], [0.5, '#f2c255'], [1, '#9a6a18']]); ctx.fillRect(lx - 100, ly - 200, 200, 140);
  ctx.fillStyle = '#2b3d6b'; ctx.fillRect(lx - 120, ly - 230, 240, 34);
  ctx.fillStyle = '#d8d8d8'; ctx.fillRect(lx + 180, ly - 40, 90, 34); for (const wx of [190, 225, 260]) { ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(lx + wx, ly - 4, 10, 0, TAU); ctx.fill(); }
  glowDot(lx, ly - 200, 30 + 6 * Math.sin(t * 2), '#ffe0a0', 0.25); ctx.restore();
}
function bicycle(x, y, s, t, load = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 6;
  for (const wx of [-120, 120]) { ctx.beginPath(); ctx.arc(wx, 0, 70, 0, TAU); ctx.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 6; ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx + Math.cos(a) * 70, Math.sin(a) * 70); ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 6; } }
  ctx.beginPath(); ctx.moveTo(-120, 0); ctx.lineTo(-20, -90); ctx.lineTo(90, -90); ctx.lineTo(120, 0); ctx.moveTo(-20, -90); ctx.lineTo(0, 0); ctx.lineTo(90, -90); ctx.moveTo(90, -90); ctx.lineTo(100, -150); ctx.stroke();
  if (load) {           // rocket nose cone strapped across the carrier
    ctx.fillStyle = lin(-200, -170, 200, -110, [[0, '#d7d3c8'], [1, '#8c867a']]); ctx.beginPath(); ctx.moveTo(-230, -150); ctx.lineTo(120, -150); ctx.quadraticCurveTo(230, -130, 260, -120); ctx.quadraticCurveTo(230, -110, 120, -95); ctx.lineTo(-230, -95); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 4; for (const sx of [-140, -40]) { ctx.beginPath(); ctx.moveTo(sx, -155); ctx.lineTo(sx, -90); ctx.stroke(); }
  }
  // the man walking it
  const ph = Math.sin(t * 5);
  ctx.strokeStyle = '#1b140e'; ctx.lineWidth = 16; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-260, -40); ctx.lineTo(-260, -190); ctx.stroke();
  ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-260, -40); ctx.lineTo(-260 + 30 * ph, 40); ctx.moveTo(-260, -40); ctx.lineTo(-260 - 30 * ph, 40); ctx.moveTo(-260, -170); ctx.lineTo(-160, -130); ctx.stroke();
  ctx.fillStyle = '#1b140e'; ctx.beginPath(); ctx.arc(-260, -220, 26, 0, TAU); ctx.fill();
  ctx.restore();
}
function bullockCart(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(-60, -110, 260, 70); ctx.fillStyle = '#8c8577'; ctx.fillRect(-40, -190, 220, 80);       // cart + crate
  ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(70, -20, 60, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-60, -80); ctx.lineTo(-200, -90); ctx.stroke();
  ctx.fillStyle = '#4b3a2a'; ctx.beginPath(); ctx.ellipse(-300, -110, 110, 55, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-420, -140, 45, 32, -0.3, 0, TAU); ctx.fill();   // bullock
  ctx.strokeStyle = '#4b3a2a'; ctx.lineWidth = 14; const ph = Math.sin(t * 4); for (const lx of [-370, -340, -260, -230]) { ctx.beginPath(); ctx.moveTo(lx, -70); ctx.lineTo(lx + 14 * ph * (lx % 2 ? 1 : -1), 10); ctx.stroke(); }
  ctx.restore();
}
function village(t) {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#f2c28a'], [0.45, '#e8a46a'], [0.62, '#5a8aa0'], [1, '#c9a874']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,240,200,.8)'; ctx.beginPath(); ctx.arc(780, 640, 90, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4f7f95'; ctx.fillRect(0, 870, W, 300); for (let i = 0; i < 12; i++) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; const y = 900 + i * 22, x = ((i * 130 + t * 30) % 1200) - 100; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 120, y); ctx.stroke(); }
  ctx.fillStyle = '#d8b884'; ctx.fillRect(0, 1160, W, 800);
  for (let i = 0; i < 6; i++) {           // coconut palms
    const x = 60 + i * 190, h = 520 + 80 * rnd(i), lean = (rnd(i + 3) - 0.5) * 0.4;
    ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x, 1200); ctx.quadraticCurveTo(x + lean * 200, 1200 - h / 2, x + lean * 300, 1200 - h); ctx.stroke();
    ctx.strokeStyle = '#2f5a2a'; ctx.lineWidth = 10; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + 0.05 * Math.sin(t + i); ctx.beginPath(); ctx.moveTo(x + lean * 300, 1200 - h); ctx.quadraticCurveTo(x + lean * 300 + Math.cos(a) * 90, 1200 - h + Math.sin(a) * 40 - 30, x + lean * 300 + Math.cos(a) * 160, 1200 - h + Math.abs(Math.sin(a)) * 90); ctx.stroke(); }
  }
  ctx.fillStyle = '#3e2c1d'; for (const bx of [150, 520]) { ctx.beginPath(); ctx.moveTo(bx, 1110); ctx.lineTo(bx + 220, 1110); ctx.lineTo(bx + 180, 1150); ctx.lineTo(bx + 40, 1150); ctx.closePath(); ctx.fill(); }   // boats
}
function church(t) {
  const cx = 540, by = 1240;
  ctx.fillStyle = lin(0, 600, 0, by, [[0, '#fbf3e4'], [1, '#d9c9ad']]); ctx.fillRect(cx - 260, 760, 520, by - 760);
  ctx.beginPath(); ctx.moveTo(cx - 280, 760); ctx.lineTo(cx, 560); ctx.lineTo(cx + 280, 760); ctx.fill();
  ctx.fillRect(cx - 60, 440, 120, 200); ctx.beginPath(); ctx.moveTo(cx - 70, 440); ctx.lineTo(cx, 360); ctx.lineTo(cx + 70, 440); ctx.fill();
  ctx.fillStyle = '#7a5a3a'; ctx.fillRect(cx - 6, 290, 12, 80); ctx.fillRect(cx - 26, 310, 52, 12);                                         // cross
  ctx.fillStyle = '#5b3d26'; ctx.beginPath(); ctx.moveTo(cx - 70, by); ctx.lineTo(cx - 70, 1040); ctx.quadraticCurveTo(cx, 960, cx + 70, 1040); ctx.lineTo(cx + 70, by); ctx.fill();
  ctx.fillStyle = '#6e9ab8'; for (const wx of [-170, 170]) { ctx.beginPath(); ctx.moveTo(cx + wx - 40, 1000); ctx.lineTo(cx + wx - 40, 880); ctx.quadraticCurveTo(cx + wx, 830, cx + wx + 40, 880); ctx.lineTo(cx + wx + 40, 1000); ctx.fill(); }
}
function rocket(x, y, s, flame = 0, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (flame > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(255,${180 - i * 50},${80 - i * 30},${0.8 * flame})`; ctx.beginPath(); ctx.moveTo(-18 + i * 4, 0); ctx.quadraticCurveTo(0, 180 + 60 * Math.sin(t * 30 + i) - i * 40, 18 - i * 4, 0); ctx.fill(); } }
  ctx.fillStyle = lin(-20, 0, 20, 0, [[0, '#9aa0a8'], [0.5, '#f2f2f0'], [1, '#8a9098']]); ctx.fillRect(-20, -420, 40, 420);
  ctx.beginPath(); ctx.moveTo(-20, -420); ctx.quadraticCurveTo(0, -520, 20, -420); ctx.fill();
  ctx.fillStyle = '#9b2a22'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 20, -60); ctx.lineTo(d * 60, 0); ctx.lineTo(d * 20, 0); ctx.fill(); }
  ctx.fillStyle = '#1c1c1c'; ctx.fillRect(-20, -240, 40, 10);
  ctx.restore();
}

// ------------------------------------------------------------------ S1: hook — on the moon (then the loop end returns here)
const hook = (t) => { moonScene(t); title('चाँद पर भारत', 300, 1, 116, GOLD); tricolour(390, 1); };
const _moon = moonScene;
add(0, A('cycle'), (t) => { hook(t); title('दक्षिणी ध्रुव · सबसे पहले', 470, R(t, 1.2, 0.4), 52, '#cfd8e3'); });
// ------------------------------------------------------------------ S2: ...its first rocket went on a bicycle (sepia flashback)
add(A('cycle'), A('date'), (t) => {
  village(t); cam(540, 960, 1);
  bicycle(lerp(-200, 620, eio((t - A('cycle')) / 2.2)), 1230, 1.5, t);
  sepia(1); title('साइकिल पर<br>रॉकेट?!', 330, R(t, A('cycle') + 0.1, 0.25), 120, GOLD);
});
// ------------------------------------------------------------------ S3: 21 November 1963, Thumba
add(A('date'), A('church'), (t) => {
  village(t); camKeys(t, [[A('date'), 540, 960, 1.1], [A('church'), 540, 980, 1.0]]);
  sepia(0.55);
  title('21 नवंबर 1963', 300, R(t, A('date') + 0.1, 0.4), 104, GOLD);
  card('थुम्बा · केरल', 430, R(t, A('thumba'), 0.4));
});
// ------------------------------------------------------------------ S4-S5: a church becomes India's first space centre
add(A('church'), A('parts'), (t) => {
  village(t); church(t); cam(540, 960, 1);
  const lab = R(t, A('church') + 2.6, 0.5);
  if (lab > 0) { ctx.fillStyle = `rgba(20,14,8,${0.75 * lab})`; ctx.fillRect(0, 0, W, H);      // inside: lab benches
    ctx.save(); ctx.globalAlpha = lab; for (let i = 0; i < 3; i++) { fillRR(170 + i * 260, 1060, 220, 30, 6, '#8a6a46'); glowDot(280 + i * 260, 1020, 16, '#ffcf8a', 0.8); }
    rocket(540, 1020, 0.9); ctx.restore(); }
  const bish = win(t, A('bishop'), A('parts'), 0.4);
  if (bish > 0) { ctx.save(); ctx.globalAlpha = bish; ctx.fillStyle = '#2a1e14'; ctx.beginPath(); ctx.arc(360, 1090, 34, 0, TAU); ctx.fill(); ctx.fillRect(320, 1124, 80, 160);
    ctx.fillStyle = rad(560, 1100, 0, 260, [[0, 'rgba(255,207,138,.5)'], [1, 'rgba(255,207,138,0)']]); ctx.fillRect(300, 840, 520, 520); ctx.restore(); }
  sepia(0.4);
  title('एक पुराना चर्च', 300, win(t, A('church') + 0.2, A('church') + 2.8, 0.3), 100);
  title('= अंतरिक्ष केंद्र', 300, win(t, A('church') + 3.0, A('bishop'), 0.3), 96, GOLD);
  card('सेंट मैरी मैग्डलीन चर्च', 430, win(t, A('church') + 3.2, A('bishop'), 0.3));
  title('जगह… विज्ञान को', 300, R(t, A('bishop') + 0.3, 0.4), 96, GOLD);
});
// ------------------------------------------------------------------ S6: parts on bicycles, heavy load on a bullock cart
add(A('parts'), A('count'), (t) => {
  village(t); cam(540, 960, 1);
  bicycle(lerp(1300, 420, eio((t - A('parts')) / 2.4)), 1220, 1.0, t);
  bullockCart(lerp(1500, 780, eio((t - A('cart')) / 2.0)), 1250, 0.8, t);
  sepia(0.7);
  title('साइकिल 🚲'.replace(' 🚲', '') + ' + बैलगाड़ी', 300, R(t, A('parts') + 0.2, 0.3), 100, GOLD);
});
// ------------------------------------------------------------------ S7-S8: countdown and launch
add(A('count'), A('kalam'), (t) => {
  const L = A('launch'), up = Math.max(0, t - L);
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#1a2440'], [0.6, '#c2694a'], [1, '#2a1a14']]); ctx.fillRect(0, 0, W, H);
  camKeys(t, [[A('count'), 540, 1100, 1.0], [L, 540, 1100, 1.0], [L + 3.5, 540, 300, 0.85]]);
  ctx.fillStyle = '#1b1410'; ctx.fillRect(-400, 1300, 1900, 900);
  ctx.strokeStyle = '#2a1e16'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(470, 1300); ctx.lineTo(500, 820); ctx.moveTo(610, 1300); ctx.lineTo(580, 820); ctx.stroke();   // launch rail
  for (let i = 0; i < 26; i++) { const r = up * (80 + 60 * rnd(i)), a = rnd(i + 1) * Math.PI; ctx.fillStyle = `rgba(220,210,200,${0.5 * clamp(1 - up / 4)})`; ctx.beginPath(); ctx.arc(540 + Math.cos(a) * r * 2, 1300 - Math.sin(a) * r * 0.4, 40 + r * 0.6, 0, TAU); ctx.fill(); }
  rocket(540, 1300 - 900 * up * up * 0.35, 1.0, t > L ? 1 : 0, t);
  if (t > L) line([[540, 1300], [540, 1300 - 900 * up * up * 0.35]], 'rgba(255,220,180,.35)', 18, 30);
  screen();
  const n = 5 - Math.floor((t - A('count') - 0.3) / ((L - A('count')) / 5));
  if (t < L) title(`${clamp(n, 1, 5)}`, 330, R(t, A('count') + 0.2, 0.2), 220, GOLD);
  title('भारत का पहला रॉकेट!', 300, R(t, L + 0.2, 0.3), 100, GOLD); tricolour(390, R(t, L + 0.4, 0.3));
});
// ------------------------------------------------------------------ S9: a young engineer in the team
add(A('kalam'), A('moon'), (t) => {
  village(t); cam(540, 960, 1);
  ctx.fillStyle = rad(540, 1150, 0, 420, [[0, 'rgba(255,207,138,.45)'], [1, 'rgba(255,207,138,0)']]); ctx.fillRect(0, 700, W, 900);
  ctx.fillStyle = '#1b140e'; ctx.beginPath(); ctx.arc(540, 1000, 70, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(540, 1260, 190, 170, 0, Math.PI, 0); ctx.fill();   // silhouette
  sepia(0.6);
  title('एक नौजवान इंजीनियर…', 300, R(t, A('kalam') + 0.2, 0.3), 88);
  title('ए पी जे अब्दुल कलाम', 440, R(t, A('kalam') + 2.0, 0.4), 92, GOLD);
});
// ------------------------------------------------------------------ S10: sixty years later — the moon
add(A('moon'), A('dream'), (t) => {
  moonScene(t); cam(540, 960, 1);
  title('60 साल बाद…', 300, R(t, A('moon') + 0.1, 0.3), 104, GOLD); card('1963 → 2023', 430, R(t, A('moon') + 0.8, 0.4)); tricolour(500, R(t, A('moon') + 1.2, 0.3));
});
// ------------------------------------------------------------------ S11: small start, big dream + CTA (then back to the hook)
add(A('dream'), END, (t) => {
  if (t > END - 0.45) { hook(0); return; }
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#0c1424'], [1, '#03050a']]); ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  bicycle(330, 1250, 0.6, t); ctx.globalAlpha = 0.9; ctx.fillStyle = '#d8d8d8'; ctx.save(); ctx.translate(760, 1260); ctx.scale(0.5, 0.5); ctx.fillRect(-100, -200, 200, 140); ctx.restore(); ctx.globalAlpha = 1;
  line([[460, 1180], [660, 1180]], GOLD, 5, 12, [14, 10]);
  title('शुरुआत छोटी थी…', 330, R(t, A('dream') + 0.1, 0.4), 96);
  title('सपना नहीं।', 480, R(t, A('dream') + 1.3, 0.4), 120, GOLD);
  card('कमेंट करें 👇'.replace(' 👇', ''), 640, R(t, A('cta') + 0.3, 0.4));
});
start();
