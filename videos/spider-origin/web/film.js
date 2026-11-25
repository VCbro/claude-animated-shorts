// THE BITE: the origin of Spider-Man as a 1962 mockumentary (archive theme). Original drawings only:
// silhouettes, city, documents, diagrams. No Marvel artwork, logos or costume designs.
import { add, start, A, R, win, eio, eob, ss, lerp, clamp, rnd, ctx, cam, camKeys, screen, text, label, fillRR, lin, rad,
         line, glowDot, flow, arrow, TAU, END, W, H } from './engine.js';

const SEPIA = '#e9dcc0', INK = '#1b140c', PAPER = '#efe4cc', RED = '#b8402e';
const ser = (s, size, a, x = W / 2, y = 120, o = {}) => text(s, x, y, { size, a, cls: 'ttl', ...o });

// ------------------------------------------------------------------ helpers
function chap(t, a, n, title) {
  const u = win(t, a - 0.1, a + 3.4, 0.4); if (u <= 0) return;
  screen(); ctx.save(); ctx.globalAlpha = u * 0.85; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  text(`<span class="chap">CHAPTER ${n}</span>`, W / 2, H / 2 - 70, { a: u, size: 30 });
  text(title, W / 2, H / 2 + 10, { a: u, size: 92, cls: 'ttl' });
  ctx.save(); ctx.globalAlpha = u; ctx.fillStyle = SEPIA; ctx.fillRect(W / 2 - 180 * u, H / 2 + 80, 360 * u, 2); ctx.restore();
}
function scratches(t) {                          // old-film scratches and dust
  screen(); const f = Math.floor(t * 24);
  ctx.save();
  for (let i = 0; i < 3; i++) if (rnd(f * 7 + i) > 0.55) { ctx.globalAlpha = 0.25 * rnd(f + i * 3); ctx.fillStyle = rnd(f + i) > 0.5 ? '#fff' : '#000';
    ctx.fillRect(rnd(f * 3 + i) * W, 0, 1.5, H); }
  for (let i = 0; i < 6; i++) if (rnd(f * 11 + i) > 0.7) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(rnd(f + i * 5) * W, rnd(f * 2 + i) * H, 1 + 3 * rnd(f + i), 0, TAU); ctx.fill(); }
  ctx.restore();
}
function sky(top = '#2a3446', bot = '#7b6a55') { screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, top], [1, bot]]); ctx.fillRect(0, 0, W, H); }
// 1962 skyline: deterministic blocks with lit windows, an art-deco spire
function skyline(x0, base, n, seed, col = '#141821', lit = 0.5, scale = 1) {
  let x = x0;
  for (let i = 0; i < n; i++) {
    const w = (60 + 120 * rnd(seed + i)) * scale, h = (140 + 380 * rnd(seed + i * 3)) * scale * (i % 7 === 3 ? 1.7 : 1);
    ctx.fillStyle = col; ctx.fillRect(x, base - h, w, h);
    if (i % 7 === 3) { ctx.beginPath(); ctx.moveTo(x + w * 0.3, base - h); ctx.lineTo(x + w * 0.5, base - h - 160 * scale); ctx.lineTo(x + w * 0.7, base - h); ctx.fill(); }
    for (let wy = base - h + 14 * scale; wy < base - 10; wy += 22 * scale) for (let wx = x + 8 * scale; wx < x + w - 10; wx += 18 * scale)
      if (rnd(wx * 0.37 + wy * 0.91 + seed) < lit * 0.35) { ctx.fillStyle = 'rgba(255,214,140,.75)'; ctx.fillRect(wx, wy, 7 * scale, 10 * scale); }
    x += w + 6 * scale;
  }
}
// generic human silhouette. pose: {lean, armL, armR, legL, legR, glasses}
function person(x, y, s, col = INK, p = {}) {
  const { lean = 0, armL = 0.2, armR = -0.2, legL = 0.15, legR = -0.15, glasses = false, head = 1 } = p;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(lean);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(0, -95); ctx.lineTo(0, -40); ctx.stroke();          // torso
  ctx.lineWidth = 11;
  const limb = (ox, oy, ang, len) => { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.sin(ang) * len, oy + Math.cos(ang) * len); ctx.stroke(); };
  limb(0, -88, armL, 50); limb(0, -88, armR, 50); limb(0, -40, legL, 55); limb(0, -40, legR, 55);
  ctx.beginPath(); ctx.arc(0, -115 * head, 16, 0, TAU); ctx.fill();
  if (glasses) { ctx.strokeStyle = SEPIA; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-6, -117, 5, 0, TAU); ctx.arc(7, -117, 5, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
function spider(x, y, s, t, col = INK, glow = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (glow > 0) { ctx.fillStyle = rad(0, 0, 0, 60, [[0, `rgba(255,230,160,${0.8 * glow})`], [1, 'rgba(255,200,120,0)']]); ctx.beginPath(); ctx.arc(0, 0, 60, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  for (let side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const a = (-0.9 + i * 0.6) + 0.12 * Math.sin(t * 9 + i), kx = side * 14, ky = (i - 1.5) * 5;
    ctx.beginPath(); ctx.moveTo(side * 4, ky * 0.5); ctx.lineTo(kx, ky - 8 + 4 * Math.sin(a)); ctx.lineTo(side * 22, ky + 10 * Math.sin(a + 0.6)); ctx.stroke();
  }
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 4, 6, 8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -6, 4, 0, TAU); ctx.fill();
  ctx.restore();
}
function paper(x, y, w, h, rot, a, mast, head, sub, seed = 1) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = PAPER; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(120,90,40,.12)'; for (let i = 0; i < 40; i++) ctx.fillRect(-w / 2 + rnd(seed + i) * w, -h / 2 + rnd(seed * 3 + i) * h, 30 * rnd(i), 2);
  ctx.fillStyle = INK; ctx.font = `700 ${w * 0.06}px Cormorant Garamond, serif`; ctx.textAlign = 'center'; ctx.fillText(mast, 0, -h / 2 + w * 0.08);
  ctx.fillRect(-w / 2 + 20, -h / 2 + w * 0.1, w - 40, 2);
  ctx.font = `800 ${Math.min(w * 0.11, (w - 40) / (head.length * 0.68))}px Montserrat, sans-serif`; ctx.fillText(head, 0, -h / 2 + w * 0.24);
  if (sub) { ctx.font = `600 ${w * 0.04}px Montserrat, sans-serif`; ctx.fillText(sub, 0, -h / 2 + w * 0.31); }
  ctx.fillStyle = 'rgba(27,20,12,.28)';
  for (let r = 0; r < 14; r++) for (let c = 0; c < 2; c++) ctx.fillRect(-w / 2 + 24 + c * (w / 2 - 10), -h / 2 + w * 0.38 + r * 16, (w / 2 - 50) * (0.7 + 0.3 * rnd(r * 3 + c + seed)), 6);
  ctx.restore();
}
function stamp(x, y, txt, a, rot = -0.18, col = RED) {
  if (a <= 0.01) return;
  const k = 1 + 0.6 * (1 - eob(a)); ctx.save(); ctx.globalAlpha *= clamp(a * 2); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.strokeRect(-150, -48, 300, 96);
  ctx.fillStyle = col; ctx.font = '800 54px Montserrat, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 4);
  ctx.restore();
}
function rowHouses(x0, base, n, seed) {
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 300, w = 260, h = 220 + 30 * rnd(seed + i);
    ctx.fillStyle = i % 2 ? '#4a3f33' : '#5a4c3c'; ctx.fillRect(x, base - h, w, h);
    ctx.beginPath(); ctx.moveTo(x - 20, base - h); ctx.lineTo(x + w / 2, base - h - 110); ctx.lineTo(x + w + 20, base - h); ctx.fillStyle = '#2b241d'; ctx.fill();
    ctx.fillStyle = 'rgba(255,214,140,.7)'; ctx.fillRect(x + 40, base - h + 50, 60, 70); ctx.fillRect(x + 160, base - h + 50, 60, 70);
    ctx.fillStyle = '#2b241d'; ctx.fillRect(x + 105, base - 110, 50, 110);
  }
}
function frameOval(x, y, rx, ry, a, who, cap) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = '#6b5532'; ctx.beginPath(); ctx.ellipse(x, y, rx + 16, ry + 16, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d9c9a6'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.clip(); who(); ctx.restore();
  ctx.restore();
  if (cap) text(cap, x, y + ry + 46, { size: 30, a, cls: 'ttl' });
}
function bust(x, y, s, col = '#3b3226', hair = 0) {     // head-and-shoulders portrait silhouette
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y - 30 * s, 42 * s, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + 70 * s, 95 * s, 60 * s, 0, Math.PI, 0); ctx.fill();
  if (hair) { ctx.beginPath(); ctx.ellipse(x, y - 52 * s, 46 * s, 26 * s, 0, Math.PI, 0); ctx.fill(); }
}

// ------------------------------------------------------------------ S1: New York, 1962 (hook)
add(0, A('h_police'), (t) => {
  sky('#1a2130', '#5d5244');
  camKeys(t, [[0, 960, 560, 1.0], [A('h_walls'), 1000, 520, 1.12], [A('h_police'), 1180, 360, 1.5]]);
  ctx.globalAlpha = 0.6; skyline(-300, 820, 26, 11, '#262c38', 0.3, 0.8); ctx.globalAlpha = 1;
  skyline(-200, 1000, 20, 3, '#10131a', 0.55);
  // exhibition building with banner, the boy walking in
  ctx.fillStyle = '#2a2620'; ctx.fillRect(560, 700, 520, 300);
  fillRR(600, 730, 440, 70, 6, '#cbb98f'); ctx.fillStyle = INK; ctx.font = '800 30px Montserrat'; ctx.textAlign = 'center'; ctx.fillText('SCIENCE EXHIBITION', 820, 776);
  ctx.fillStyle = 'rgba(255,214,140,.85)'; ctx.fillRect(780, 860, 80, 140);
  const wk = clamp((t - A('h_teen')) / 4.5);
  if (t > A('h_teen') - 0.5) person(lerp(380, 820, wk), 1000, 0.9, INK, { armL: 0.35 * Math.sin(t * 6), armR: -0.35 * Math.sin(t * 6), legL: 0.3 * Math.sin(t * 6), legR: -0.3 * Math.sin(t * 6), glasses: true });
  // the climber on a tall tower (hand over hand)
  const cl = clamp((t - A('h_walls')) / 6);
  if (t > A('h_walls') - 0.3) {
    const y = lerp(760, 380, cl), ph = Math.sin(t * 5);
    person(1262, y, 0.55, '#05070a', { armL: Math.PI - 0.5 + 0.35 * ph, armR: Math.PI + 0.5 - 0.35 * ph, legL: 0.5 - 0.3 * ph, legR: -0.5 + 0.3 * ph });
  }
  screen();
  text('NEW YORK · 1962', W / 2, 140, { size: 64, a: win(t, 0.3, A('h_teen') + 1.5, 0.5), cls: 'ttl' });
  text('<span style="font-size:22px;opacity:.85">A fictional mockumentary based on Marvel\'s 1962 comic. Spider-Man © Marvel.</span>', W / 2, 60, { size: 22, a: win(t, 0.4, A('h_walls') - 0.5, 0.5) });
  scratches(t);
});

// ------------------------------------------------------------------ S2: police report + newspapers + the question
add(A('h_police'), A('c1'), (t) => {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#3a2e22'], [1, '#1e1710']]); ctx.fillRect(0, 0, W, H);
  camKeys(t, [[A('h_police'), 900, 540, 1.0], [A('h_q'), 980, 520, 1.08], [A('c1'), 1000, 540, 1.12]]);
  // police report (typed card)
  const pa = R(t, A('h_police'), 0.5);
  ctx.save(); ctx.globalAlpha = pa; ctx.translate(620, 520); ctx.rotate(-0.05);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 30; ctx.fillStyle = '#e8dfc8'; ctx.fillRect(-300, -340, 600, 680); ctx.shadowColor = 'transparent';
  ctx.fillStyle = INK; ctx.font = '700 34px Courier New, monospace'; ctx.textAlign = 'left';
  ctx.fillText('POLICE DEPT. — CITY OF NEW YORK', -270, -280); ctx.font = '600 26px Courier New, monospace';
  ['INCIDENT REPORT  No. 62-1184', '', 'Witnesses state a figure', 'climbed the face of the', 'building without ropes or', 'ladder.', '', 'Officer\'s note: not possible.'].forEach((l, i) => ctx.fillText(l, -270, -220 + i * 44));
  ctx.restore();
  stamp(700, 760, 'IMPOSSIBLE', R(t, A('h_police') + 1.2, 0.35));
  paper(1320, 500, 560, 700, 0.06, R(t, A('h_news'), 0.4) * (1 - 0.3 * R(t, A('h_q'), 0.5)), 'THE EVENING HERALD', 'WALL-CRAWLER', 'Experts: "A hoax, nothing more"', 4);
  stamp(1360, 300, 'HOAX?', R(t, A('h_news') + 0.8, 0.35), 0.12);
  screen();
  const q = R(t, A('h_q'), 0.6);
  if (q > 0) { ctx.fillStyle = `rgba(0,0,0,${0.55 * q})`; ctx.fillRect(0, 0, W, H); }
  text('What really happened<br>that evening?', W / 2, 470, { size: 96, a: q, cls: 'ttl' });
  scratches(t);
});

// ------------------------------------------------------------------ S3: chapter 1, Queens
add(A('c1'), A('c2'), (t) => {
  sky('#7d6a50', '#c9b48c');
  camKeys(t, [[A('c1'), 960, 540, 1.0], [A('c1_name'), 900, 600, 1.2], [A('c1_parents'), 960, 540, 1.0], [A('c2'), 960, 540, 1.05]]);
  rowHouses(-100, 930, 8, 7); ctx.fillStyle = '#3a3027'; ctx.fillRect(-200, 930, 2400, 300);
  const walk = Math.sin(t * 5) * R(t, A('c1_name'), 0.3) * (1 - R(t, A('c1_parents'), 0.3));
  person(lerp(700, 860, clamp((t - A('c1_name')) / 5)), 930, 1.2, INK, { glasses: true, armL: 0.3 * walk, armR: -0.3 * walk, legL: 0.25 * walk, legR: -0.25 * walk });
  label('PETER PARKER', 860, 760, 160, -160, win(t, A('c1_name') + 0.3, A('c1_parents'), 0.3), 'Forest Hills, Queens');
  screen();
  // family photos
  const fp = win(t, A('c1_parents'), A('c1_school'), 0.4);
  if (fp > 0) { ctx.fillStyle = `rgba(30,22,14,${0.8 * fp})`; ctx.fillRect(0, 0, W, H); }
  frameOval(720, 500, 170, 220, fp, () => bust(720, 520, 1.5, '#4a3d2d', 1), 'AUNT MAY');
  frameOval(1200, 500, 170, 220, fp, () => bust(1200, 520, 1.5, '#3b3226'), 'UNCLE BEN');
  // school notebook
  const nb = win(t, A('c1_school'), A('c2') + 0.5, 0.4);
  if (nb > 0) {
    ctx.fillStyle = `rgba(30,22,14,${0.85 * nb})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = nb; ctx.translate(960, 560); ctx.rotate(-0.03);
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(-520, -330, 1040, 660);
    ctx.strokeStyle = 'rgba(80,110,160,.35)'; ctx.lineWidth = 2; for (let y = -280; y < 320; y += 40) { ctx.beginPath(); ctx.moveTo(-500, y); ctx.lineTo(500, y); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(-250, -40, 150, 50, i * 1.05 + t * 0.2, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(-250, -40, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.font = 'italic 44px Cormorant Garamond, serif'; ctx.textAlign = 'left';
    ctx.fillText('E = mc²', 80, -150); ctx.fillText('F = m · a', 80, -60); ctx.fillText('λ = h / p', 80, 30);
    ctx.fillStyle = RED; ctx.font = '800 90px Cormorant Garamond, serif'; ctx.fillText('A+', 330, 230);
    ctx.restore();
    const lg = win(t, A('c1_laugh'), A('c1_sci') + 0.2, 0.3);
    ['BOOKWORM', 'NERD', 'WALLFLOWER'].forEach((w, i) => text(`<span style="color:#f3e2c0">${w}</span>`, 360 + i * 600, 220 + (i % 2) * 640, { size: 60, a: lg * R(t, A('c1_laugh') + i * 0.6, 0.3), cls: 'ttl' }));
    const sc = R(t, A('c1_sci'), 0.5); if (sc > 0) glowDot(710, 520, 30 + 20 * Math.sin(t * 3), '#ffd38a', sc);
  }
  chap(t, A('c1'), 1, 'The Quiet Boy from Queens');
  scratches(t);
});

// ------------------------------------------------------------------ S4: chapter 2, the exhibition and the bite
add(A('c2'), A('c3'), (t) => {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#2b241d'], [1, '#14100b']]); ctx.fillRect(0, 0, W, H);
  const bite = A('c2_bite');
  if (t < bite - 0.2) {
    camKeys(t, [[A('c2'), 960, 540, 1.0], [A('c2_spider'), 980, 470, 1.25], [A('c2_dose'), 960, 520, 1.6], [bite, 960, 540, 1.9]]);
    fillRR(260, 220, 1400, 90, 8, '#cbb98f'); ctx.fillStyle = INK; ctx.font = '800 40px Montserrat'; ctx.textAlign = 'center';
    ctx.fillText('RADIOACTIVITY · A PUBLIC DEMONSTRATION', 960, 280);
    // two machines
    for (const mx of [560, 1360]) { fillRR(mx - 110, 520, 220, 300, 14, '#5b5146'); fillRR(mx - 70, 480, 140, 60, 10, '#7a6d5d');
      ctx.fillStyle = '#2b241d'; for (let i = 0; i < 4; i++) ctx.fillRect(mx - 80, 560 + i * 55, 160, 18); }
    // audience silhouettes
    for (let i = 0; i < 9; i++) person(220 + i * 190, 1080, 1.1, '#0b0906', { armL: 0.1, armR: -0.1, head: 1 });
    person(960, 1080, 1.1, '#0b0906', { glasses: true });
    const beam = R(t, A('c2_beam'), 0.6);
    if (beam > 0) { line([[670, 560], [1250, 560]], `rgba(255,236,170,${beam})`, 10, 30); line([[670, 560], [1250, 560]], `rgba(255,255,235,${beam})`, 3, 0); }
    // spider on its thread
    const sd = clamp((t - A('c2_spider')) / 5.5), sy = lerp(330, 560, eio(sd)), sx = 960;
    if (t > A('c2_spider') - 0.3) {
      line([[sx, 300], [sx, sy - 8]], 'rgba(240,230,210,.75)', 1.4);
      const g = R(t, A('c2_dose'), 0.8);
      spider(sx, sy, 1.4, t, INK, g * (0.7 + 0.3 * Math.sin(t * 12)));
      if (g > 0) for (let i = 0; i < 4; i++) { const r = ((t * 60 + i * 30) % 120); ctx.strokeStyle = `rgba(255,220,150,${(1 - r / 120) * g})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.stroke(); }
    }
    screen();
    label('A single thread', 960, 420, -260, -100, win(t, A('c2_spider') + 1.5, A('c2_dose'), 0.3));
  } else {
    // close-up: the hand and the bite
    cam(960, 540, 1 + 0.08 * (t - bite));
    ctx.fillStyle = '#c9ab86'; ctx.beginPath(); ctx.ellipse(960, 640, 420, 230, -0.1, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(700 + i * 150, 420 - (i === 1 || i === 2 ? 40 : 0), 55, 170, -0.15 + i * 0.05, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(1340, 640, 70, 160, 0.9, 0, TAU); ctx.fill();
    const flash = Math.max(0, 1 - (t - bite) / 0.5);
    spider(980, 620, 2.2, t, INK, 0.4 * (1 - R(t, bite + 1, 1)));
    if (t > bite + 0.3) { ctx.fillStyle = '#7a1e14'; ctx.beginPath(); ctx.arc(1010, 650, 5, 0, TAU); ctx.arc(1030, 646, 5, 0, TAU); ctx.fill(); }
    const pn = win(t, A('c2_pain'), A('c2_night'), 0.3);
    if (pn > 0) for (let i = 0; i < 5; i++) { const r = ((t * 140 + i * 70) % 340); ctx.strokeStyle = `rgba(255,180,120,${(1 - r / 340) * pn})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(1020, 648, r, 0, TAU); ctx.stroke(); }
    screen();
    if (flash > 0) { ctx.fillStyle = `rgba(255,250,235,${flash})`; ctx.fillRect(0, 0, W, H); }
    const nt = R(t, A('c2_night'), 0.8);
    if (nt > 0) { ctx.fillStyle = `rgba(8,6,4,${0.9 * nt})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = nt; ctx.fillStyle = 'rgba(255,214,140,.8)'; ctx.fillRect(860, 420, 200, 360);
      person(lerp(960, 1300, clamp((t - A('c2_night')) / 3)), 780, 1.3, '#000', { lean: 0.12 * Math.sin(t * 2), armL: 0.3 * Math.sin(t * 5), armR: -0.3 * Math.sin(t * 5), legL: 0.3 * Math.sin(t * 5), legR: -0.3 * Math.sin(t * 5) });
      ctx.globalAlpha = 1; }
  }
  chap(t, A('c2'), 2, 'The Exhibition');
  scratches(t);
});

// ------------------------------------------------------------------ S5: chapter 3, the change
add(A('c3'), A('c4'), (t) => {
  const P = A('c3_pass');
  if (t < P) {
    sky('#141a26', '#4a4234');
    camKeys(t, [[A('c3'), 960, 560, 1.0], [A('c3_jump'), 1000, 520, 1.05], [A('c3_stick'), 1320, 430, 1.9], [A('c3_pipe'), 1320, 430, 1.9], [P, 900, 560, 1.0]]);
    skyline(-200, 820, 24, 21, '#1a1e27', 0.4, 0.8);
    ctx.fillStyle = '#26211b'; ctx.fillRect(-300, 820, 2600, 400);
    // brick wall
    ctx.fillStyle = '#4c3a2c'; ctx.fillRect(1180, 200, 340, 620);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
    for (let y = 210; y < 820; y += 26) for (let x = 1180 + ((y / 26) % 2) * 25; x < 1520; x += 50) ctx.strokeRect(x, y, 50, 26);
    // car with headlights
    const cx = lerp(-400, 1500, clamp((t - A('c3_car')) / 4.2));
    if (t > A('c3_car') - 0.2 && t < A('c3_stick')) {
      fillRR(cx - 200, 700, 400, 100, 30, '#1b1813'); fillRR(cx - 120, 650, 220, 70, 24, '#1b1813');
      glowDot(cx + 195, 745, 18, '#ffe7a8', 1); ctx.fillStyle = 'rgba(255,231,168,.12)'; ctx.beginPath(); ctx.moveTo(cx + 195, 735); ctx.lineTo(cx + 800, 640); ctx.lineTo(cx + 800, 860); ctx.fill();
    }
    // the jump: arc from the street onto the wall
    const j = clamp((t - A('c3_jump')) / 1.4);
    let px = 860, py = 820, pose = { glasses: true };
    if (t >= A('c3_jump')) { px = lerp(860, 1300, j); py = 820 - Math.sin(j * Math.PI) * 360 - j * 260; pose = { armL: Math.PI - 0.4, armR: Math.PI + 0.4, legL: 0.9, legR: -0.4, lean: -0.3 * (1 - j) }; }
    if (t > A('c3_stick')) { px = 1300; py = 560 - 40 * clamp((t - A('c3_stick')) / 4); const ph = Math.sin(t * 4); pose = { armL: Math.PI - 0.5 + 0.3 * ph, armR: Math.PI + 0.5 - 0.3 * ph, legL: 0.5, legR: -0.5 }; }
    person(px, py, 1.0, '#000', pose);
    if (t > A('c3_pipe') - 0.2) { // pipe bending in his hand
      const b = eio(clamp((t - A('c3_pipe')) / 1.2));
      ctx.strokeStyle = '#8b8577'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(1390, 330);
      ctx.quadraticCurveTo(1440, 420 - 80 * b, 1390 + 100 * b, 480); ctx.stroke();
    }
    screen();
    label('Fingers stuck to the brick', 1300, 470, -260, -140, win(t, A('c3_stick') + 0.4, A('c3_pipe'), 0.3));
    label('Steel pipe', 1420, 400, 160, 80, win(t, A('c3_pipe') + 0.6, P, 0.3), 'bent like paper');
  } else if (t < A('c3_web')) {
    // spider -> human: strength, balance, grip; then a scientist's mind
    screen(); ctx.fillStyle = '#1f1912'; ctx.fillRect(0, 0, W, H); cam(960, 540, 1);
    spider(520, 520, 6, t, '#d8c7a4', 0.35); person(1400, 760, 2.3, '#d8c7a4', { glasses: true });
    arrow(760, 520, 1150, 520, '#e3b56a', 8, R(t, P + 0.3, 0.5));
    ['STRENGTH', 'BALANCE', 'GRIP'].forEach((w, i) => { const tt = P + 2.6 + i * 1.1;
      text(`<span style="font-family:Montserrat;font-weight:800;letter-spacing:4px;color:#f2d8a0">${w}</span>`, 955, 380 + i * 90, { size: 40, a: win(t, tt, A('c3_mind') + 0.2, 0.25) }); });
    const m = win(t, A('c3_mind'), A('c3_web') + 0.3, 0.4);
    if (m > 0) { ctx.fillStyle = `rgba(20,15,10,${0.85 * m})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = m; ctx.strokeStyle = '#e3c78f'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(960, 520, 230, 180, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 14; i++) { const a = rnd(i) * TAU, r = 60 + 140 * rnd(i + 5); line([[960, 520], [960 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.75]], 'rgba(255,214,140,.7)', 2, 6); }
      ctx.globalAlpha = 1; screen(); text("A scientist's mind", 960, 820, { size: 70, a: m, cls: 'ttl' }); }
  } else {
    // web-shooter blueprint, then the swing
    const sw = A('c3_swing');
    screen(); ctx.fillStyle = '#1d2c40'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(220,235,255,.12)'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const bp = win(t, A('c3_web'), sw + 0.2, 0.4);
    ctx.save(); ctx.globalAlpha = bp; ctx.strokeStyle = '#e7f0ff'; ctx.lineWidth = 4;
    ctx.strokeRect(560, 420, 640, 160); ctx.beginPath(); ctx.arc(560, 500, 80, Math.PI / 2, -Math.PI / 2); ctx.stroke();
    ctx.strokeRect(1200, 470, 120, 60); ctx.beginPath(); ctx.moveTo(1320, 500); ctx.lineTo(1400, 500); ctx.stroke();
    ctx.setLineDash([12, 10]); ctx.strokeRect(700, 440, 280, 120); ctx.setLineDash([]);
    ctx.restore();
    label('Fluid cartridge', 840, 440, -120, -170, bp * R(t, A('c3_web') + 1, 0.3), 'his own formula');
    label('Nozzle', 1380, 500, 120, -150, bp * R(t, A('c3_web') + 2, 0.3));
    label('Trigger', 1260, 530, 140, 150, bp * R(t, A('c3_web') + 3, 0.3), 'two-finger tap');
    text('WEB SHOOTERS', 960, 200, { size: 80, a: bp * R(t, A('c3_shoot'), 0.3), cls: 'ttl' });
    const s2 = R(t, sw, 0.5);
    if (s2 > 0) {
      sky('#1a2130', '#5d5244'); ctx.globalAlpha = s2; cam(960, 540, 1);
      skyline(-300 - (t - sw) * 120, 1080, 30, 9, '#10131a', 0.5, 1.1);
      const ang = Math.sin((t - sw) * 2.2) * 0.8, ax = 960, ay = 80, L = 560, bx = ax + Math.sin(ang) * L, by = ay + Math.cos(ang) * L;
      line([[ax, ay], [bx, by]], 'rgba(240,232,215,.9)', 2.5);
      person(bx, by + 120, 1.0, '#000', { armL: Math.PI - 0.2, armR: Math.PI + 0.3, legL: 0.6, legR: -0.2, lean: -ang * 0.6 });
      ctx.globalAlpha = 1;
    }
  }
  chap(t, A('c3'), 3, 'The Change');
  scratches(t);
});

// ------------------------------------------------------------------ S6: chapter 4, the masked star and the thief
add(A('c4'), A('c5'), (t) => {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#2a221a'], [1, '#100c08']]); ctx.fillRect(0, 0, W, H);
  if (t < A('c4_star')) {
    camKeys(t, [[A('c4'), 960, 540, 1.0], [A('c4_wrestle'), 960, 600, 1.1], [A('c4_star'), 960, 560, 1.2]]);
    // coins / bills for the family
    const mo = win(t, A('c4_money'), A('c4_wrestle') + 0.2, 0.4);
    for (let i = 0; i < 12; i++) { const y = lerp(-80, 760 + 20 * rnd(i), eob(clamp((t - A('c4_money') - i * 0.15) / 0.9)));
      ctx.globalAlpha = mo; ctx.fillStyle = i % 3 ? '#b59a5a' : '#8fa07a'; if (i % 3) { ctx.beginPath(); ctx.ellipse(500 + i * 80, y, 38, 14, 0, 0, TAU); ctx.fill(); } else fillRR(480 + i * 80, y - 30, 120, 60, 6, '#8fa07a'); }
    ctx.globalAlpha = 1;
    text('Rent. Bills. Aunt May.', 960, 300, { size: 64, a: mo, cls: 'ttl' });
    // wrestling ring under spotlights
    const wr = R(t, A('c4_wrestle'), 0.4);
    if (wr > 0) { ctx.globalAlpha = wr;
      ctx.fillStyle = rad(960, 300, 0, 900, [[0, 'rgba(255,236,190,.35)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#5a4a38'; ctx.beginPath(); ctx.moveTo(400, 820); ctx.lineTo(1520, 820); ctx.lineTo(1400, 700); ctx.lineTo(520, 700); ctx.fill();
      for (let r = 0; r < 3; r++) line([[460, 640 - r * 40], [1460, 640 - r * 40]], '#d8c7a4', 3);
      const k = clamp((t - A('c4_wrestle') - 1) / 2);
      person(860, 760, 1.2, '#000', { armL: 1.2, armR: 0.5, legL: 0.3, legR: -0.4, lean: 0.1 });
      person(lerp(1080, 1260, k), 760 - 80 * Math.sin(k * Math.PI), 1.6, '#3a3027', { lean: 1.2 * k, armL: 2, armR: -2 });
      ctx.globalAlpha = 1; }
    screen(); paper(1500, 380, 380, 480, 0.08, wr * win(t, A('c4_wrestle') + 0.5, A('c4_star'), 0.3), 'FIGHT NIGHT', '$100', 'last 3 minutes in the ring', 9);
  } else if (t < A('c4_thief')) {
    cam(960, 540, 1 + 0.03 * (t - A('c4_star')));
    fillRR(560, 260, 800, 600, 50, '#3b3226'); fillRR(620, 310, 680, 460, 36, '#b7ab92');
    ctx.save(); ctx.beginPath(); ctx.roundRect(620, 310, 680, 460, 36); ctx.clip();
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(0,0,0,${0.05 * rnd(i + Math.floor(t * 20))})`; ctx.fillRect(620, 310 + i * 12, 680, 6); }
    person(960, 740, 1.6, '#111', { armL: 2.4, armR: -2.4, legL: 0.35, legR: -0.35 });
    ctx.restore();
    screen(); paper(400, 620, 520, 560, -0.08, R(t, A('c4_star') + 0.8, 0.4), 'DAILY GAZETTE', 'MASKED SENSATION', 'TV\'s newest star', 12);
  } else {
    // studio corridor: the thief runs past; freeze; he steps aside
    const tf = A('c4_thief'), tc = A('c4_could'), freeze = t > tc && t < A('c4_aside');
    const tt = freeze ? tc : t;
    cam(960, 540, 1);
    ctx.fillStyle = '#4a3f33'; ctx.fillRect(0, 300, W, 520); ctx.fillStyle = '#2a231b'; ctx.fillRect(0, 820, W, 260);
    for (let i = 0; i < 6; i++) fillRR(80 + i * 320, 380, 160, 300, 6, '#3a3128');
    const run = clamp((tt - tf) / 6.5), sx = lerp(-100, 2100, run), ph = Math.sin(tt * 10);
    person(sx, 820, 1.4, '#000', { lean: 0.25, armL: 0.9 * ph, armR: -0.9 * ph, legL: 0.7 * ph, legR: -0.7 * ph });
    person(sx - 420, 820, 1.4, '#2e2820', { lean: 0.2, armL: 2.6, armR: -0.8 * ph, legL: 0.7 * ph, legR: -0.7 * ph });
    const asd = clamp((t - A('c4_aside')) / 0.8);
    person(1100 + 120 * eio(asd), 820, 1.45, '#111', { glasses: true, armL: 0.1, armR: -0.1 });
    screen();
    if (freeze) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H); const [x, y] = [lerp(-100, 2100, clamp((tc - tf) / 6.5)), 700];
      ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 150, 0, TAU * R(t, tc, 0.6)); ctx.stroke(); }
    text('"STOP HIM!"', 420, 260, { size: 60, a: win(t, tf + 0.6, tc, 0.2), cls: 'ttl' });
    text('One move.', 960, 180, { size: 72, a: win(t, tc + 0.5, A('c4_aside'), 0.3), cls: 'ttl' });
    text('"Not my problem."', 960, 200, { size: 84, a: R(t, A('c4_not'), 0.4), cls: 'ttl' });
  }
  chap(t, A('c4'), 4, 'The Masked Star');
  scratches(t);
});

// ------------------------------------------------------------------ S7: chapter 5, the night that changed everything
add(A('c5'), A('n0'), (t) => {
  if (t < A('c5_chase')) {
    sky('#0b0f18', '#2a2a2e'); cam(960, 540, 1 + 0.02 * (t - A('c5')));
    rowHouses(260, 900, 4, 31); ctx.fillStyle = '#1a1712'; ctx.fillRect(0, 900, W, 200);
    // police car + flashing light
    if (t > A('c5_police') - 0.3) { fillRR(700, 830, 420, 90, 28, '#1d1d1f'); fillRR(780, 780, 240, 70, 22, '#e9e3d6');
      const f = Math.sin(t * 12) > 0; glowDot(870, 772, 22, f ? '#ff5544' : '#5577ff', 1);
      ctx.fillStyle = f ? 'rgba(255,80,60,.10)' : 'rgba(80,110,255,.10)'; ctx.fillRect(0, 0, W, H); }
    screen();
    const bn = win(t, A('c5_ben'), A('c5_chase') + 0.3, 0.5);
    if (bn > 0) { ctx.fillStyle = `rgba(10,8,6,${0.88 * bn})`; ctx.fillRect(0, 0, W, H);
      frameOval(960, 470, 190, 240, bn, () => bust(960, 500, 1.7, '#3b3226'), 'BENJAMIN PARKER');
      ctx.save(); ctx.globalAlpha = bn; ctx.strokeStyle = '#000'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(810, 260); ctx.lineTo(900, 230); ctx.stroke(); ctx.restore();
      glowDot(1260, 760, 10 + 2 * Math.sin(t * 9), '#ffcf7a', bn); fillRR(1250, 770, 20, 90, 4, `rgba(230,220,200,${bn})`); }
  } else if (t < A('c5_corner')) {
    sky('#24304a', '#6a6470'); const sp = (t - A('c5_chase'));
    cam(960, 540, 1);
    glowDot(1500, 220, 70, '#f4ecd8', 0.9);
    ctx.fillStyle = '#05070b'; for (let i = 0; i < 12; i++) { const x = ((i * 260 - sp * 520) % 3120 + 3120) % 3120 - 400; ctx.fillRect(x, 760 - 120 * rnd(i), 220, 600); }
    for (let i = 0; i < 18; i++) { ctx.fillStyle = 'rgba(220,210,190,.18)'; ctx.fillRect(((i * 211 - sp * 1500) % 2200 + 2200) % 2200 - 100, 120 + i * 50, 160, 2); }
    const ang = Math.sin(sp * 2.6) * 0.9, bx = 960 + Math.sin(ang) * 480, by = 60 + Math.cos(ang) * 480;
    line([[960, 60], [bx, by]], 'rgba(240,232,215,.9)', 2.5);
    person(bx, by + 120, 1.0, '#000', { armL: Math.PI - 0.2, armR: Math.PI + 0.3, legL: 0.7, legR: -0.1, lean: -ang * 0.7 });
    screen(); text('ACME WAREHOUSE · WATERFRONT', 960, 140, { size: 40, a: R(t, A('c5_chase') + 3.5, 0.4), cls: 'ttl' });
  } else {
    screen(); ctx.fillStyle = '#060504'; ctx.fillRect(0, 0, W, H); cam(960, 540, 1 + 0.05 * (t - A('c5_corner')));
    // moonlight through a window, two silhouettes
    ctx.fillStyle = 'rgba(200,210,230,.24)'; ctx.beginPath(); ctx.moveTo(1300, 0); ctx.lineTo(1500, 0); ctx.lineTo(1200, 1080); ctx.lineTo(700, 1080); ctx.fill();
    ctx.fillStyle = '#1a1814'; ctx.fillRect(-200, 900, 2400, 300);
    person(760, 900, 1.8, '#000', { armL: 0.8, armR: -0.8, legL: 0.4, legR: -0.4, lean: 0.1 });
    const rv = R(t, A('c5_corner') + 2.2, 0.6);
    person(1180, 900, 1.8, '#2a2620', { armL: -0.4, armR: 0.6, legL: 0.2, legR: -0.2, lean: -0.1 });
    if (rv > 0) { ctx.fillStyle = rad(1180, 700, 0, 260, [[0, `rgba(230,225,210,${0.5 * rv})`], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(900, 450, 560, 500); }
    screen();
    const sm = R(t, A('c5_same'), 0.5);
    if (sm > 0) { ctx.fillStyle = `rgba(0,0,0,${0.6 * sm})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = sm; fillRR(300, 260, 560, 460, 6, '#d9c9a6'); fillRR(1060, 260, 560, 460, 6, '#d9c9a6');
      ctx.save(); ctx.beginPath(); ctx.rect(300, 260, 560, 460); ctx.clip(); bust(580, 560, 2, '#2a231b', 1); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(1060, 260, 560, 460); ctx.clip(); bust(1340, 560, 2, '#2a231b', 1); ctx.restore(); ctx.restore();
      text('THE STUDIO', 580, 760, { size: 34, a: sm, cls: 'ttl' }); text('THE WAREHOUSE', 1340, 760, { size: 34, a: sm, cls: 'ttl' });
      stamp(960, 880, 'SAME MAN', R(t, A('c5_same') + 1.2, 0.35), -0.06); }
  }
  chap(t, A('c5'), 5, 'The Night That Changed Everything');
  scratches(t);
});

// ------------------------------------------------------------------ S8: the lesson, the name
add(A('n0'), A('n_cta'), (t) => {
  sky('#2a2638', '#c48b5a');
  camKeys(t, [[A('n0'), 960, 600, 1.15], [A('n_quote'), 960, 560, 1.0], [A('n_cta'), 960, 540, 0.95]]);
  ctx.fillStyle = rad(960, 900, 0, 700, [[0, 'rgba(255,200,130,.45)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(-200, 0, 2400, 1200);
  skyline(-300, 1080, 30, 17, '#0e0f14', 0.25, 1.05);
  ctx.fillStyle = '#0a0a0e'; ctx.fillRect(820, 820, 300, 260);
  person(970, 820, 1.2, '#000', { armL: 0.15, armR: -0.15, legL: 0.12, legR: -0.12 });
  screen();
  const q = R(t, A('n_quote'), 0.4), qs = 'With great power, there must also come great responsibility.';
  const n = Math.floor(qs.length * clamp((t - A('n_quote')) / 3.6));
  text(`“${qs.slice(0, n)}${n < qs.length ? '' : '”'}`, W / 2, 330, { size: 66, a: q * (1 - R(t, A('n_name') - 0.2, 0.4)), cls: 'ttl' });
  const nm = R(t, A('n_spider') - 0.15, 0.5);
  text('<span style="font-family:Montserrat;font-weight:800;letter-spacing:14px">SPIDER-MAN</span>', W / 2, 330, { size: 120 + 20 * (1 - nm), a: nm });
  text('The world would come to know him by another name', W / 2, 220, { size: 40, a: win(t, A('n_name'), A('n_spider'), 0.3), cls: 'ttl' });
  scratches(t);
});

// ------------------------------------------------------------------ S9: CTA + disclaimer
add(A('n_cta'), END, (t) => {
  sky('#1c1812', '#0b0907');
  spider(960, 420, 3.2, t, '#d8c7a4', 0.3); line([[960, 0], [960, 395]], 'rgba(240,232,215,.6)', 1.5);
  screen();
  text('What would <i>you</i> have done<br>that night at the studio?', W / 2, 650, { size: 64, a: R(t, A('n_cta'), 0.4), cls: 'ttl' });
  text('<span style="font-family:Montserrat;font-weight:800;padding:10px 26px;border:2px solid #e9dcc0;border-radius:6px">TELL US IN THE COMMENTS</span>', W / 2, 820, { size: 30, a: R(t, A('n_cta') + 1.5, 0.4) });
  text('<span style="font-size:20px;opacity:.8">A fictional mockumentary based on Marvel\'s 1962 comic Amazing Fantasy #15. Spider-Man © Marvel. Fan-made, not affiliated with Marvel.</span>', W / 2, 1010, { size: 20, a: R(t, A('n_cta') + 2, 0.5) });
  scratches(t);
});

start();
