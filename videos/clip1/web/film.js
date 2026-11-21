// "What happened?" — vertical motivational animation timed to the supplied audio (engine: ./engine.js)
import { add, start, A, K, R, win, eio, eob, ss, lerp, clamp, rnd, ctx, cam, camKeys, screen, text, line, flow, glowDot, fillRR, rr, lin, rad, TAU, END, W, H } from './engine.js';
const T = (n) => A(n);
const ONS = await (await fetch('/out/onsets.json')).json();
const beat = (t) => { let b = 0; for (const o of ONS) { if (o > t) break; b = Math.max(b, Math.exp(-(t - o) * 9)); } return b; };

// ================================================================== the figure (stylised silhouette with rim light)
function limb(x0, y0, a, L, w, col) { const x1 = x0 + Math.sin(a) * L, y1 = y0 + Math.cos(a) * L; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); return [x1, y1]; }
function figure(x, y, s, pose, t, o = {}) {
  const col = o.col || '#0b0e15', rim = o.rim || '#ffb347';
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s); if (o.rot) ctx.rotate(o.rot);
  ctx.shadowColor = rim; ctx.shadowBlur = o.glow ?? 22;
  const leg = (hx, hy, a1, a2) => { const [kx, ky] = limb(hx, hy, a1, 96, 40, col); limb(kx, ky, a2, 96, 34, col); };
  const arm = (sx, sy, a1, a2) => { const [ex, ey] = limb(sx, sy, a1, 72, 30, col); limb(ex, ey, a2, 68, 25, col); };
  let hip = [0, -190], lean = 0, head = 0;
  if (pose === 'run') {
    const p = t * (o.speed ?? 9), bob = -8 * Math.abs(Math.sin(p)); hip = [0, -190 + bob]; lean = 0.18;
    for (const off of [0, Math.PI]) { const a = 0.75 * Math.sin(p + off); leg(hip[0], hip[1], a, a - 0.25 - 1.1 * Math.max(0, Math.sin(p + off + 1.2))); }
  } else if (pose === 'sit') { hip = [0, -10]; lean = 0.45; head = 0.5; leg(0, -10, 1.45, 0.05); leg(12, -12, 1.4, -0.1); }
  else { const sp = o.wide ? 0.16 : 0.07; leg(-4, -190, sp, sp * 0.4); leg(4, -190, -sp, -sp * 0.4); }
  // torso
  const nx = hip[0] + Math.sin(lean) * 130, ny = hip[1] - Math.cos(lean) * 130;
  ctx.strokeStyle = col; ctx.lineWidth = 62; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(nx, ny); ctx.stroke();
  // arms
  if (pose === 'run') { const p = t * (o.speed ?? 9); for (const off of [0, Math.PI]) { const a = -0.8 * Math.sin(p + off); arm(nx, ny + 10, a, a + 1.4); } }
  else if (pose === 'sit') { arm(nx, ny + 10, 1.1, 1.9); arm(nx - 6, ny + 12, 1.0, 2.0); }
  else if (pose === 'power') { arm(nx, ny + 10, 0.5, 0.2); arm(nx, ny + 10, -0.5, -0.2); }
  else if (pose === 'arms') { const r = o.raise ?? 1; arm(nx, ny + 10, lerp(0.15, 2.6, r), lerp(0.1, 2.9, r)); arm(nx, ny + 10, lerp(-0.15, -2.6, r), lerp(-0.1, -2.9, r)); }
  else { arm(nx, ny + 10, 0.12, 0.05); arm(nx, ny + 10, -0.12, -0.05); }
  // head
  const hx = nx + Math.sin(lean + head) * 46, hy = ny - Math.cos(lean + head) * 46;
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(hx, hy, 40, 0, TAU); ctx.fill();
  ctx.restore();
}
// ================================================================== backdrops
function grad(c1, c2, c3) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = lin(0, 0, 0, H, [[0, c1], [0.6, c2], [1, c3]]); ctx.fillRect(0, 0, W, H); ctx.restore(); }
function city(t, y0, a = 1) {
  for (let i = 0; i < 26; i++) { const w = 60 + rnd(i) * 110, h = 200 + rnd(i + 5) * 520, x = -60 + i * 46 + rnd(i + 2) * 20;
    ctx.fillStyle = `rgba(14,18,32,${a})`; ctx.fillRect(x, y0 - h, w, h + 400);
    for (let k = 0; k < 18; k++) if (rnd(i * 31 + k) > 0.58) { ctx.fillStyle = `rgba(255,${190 + 40 * rnd(k)},120,${0.5 * a * (0.6 + 0.4 * Math.sin(t * (1 + rnd(k)) + k))})`; ctx.fillRect(x + 10 + (k % 3) * (w / 3.4), y0 - h + 20 + Math.floor(k / 3) * 46, 10, 16); } }
}
function bokeh(t, n, cols, a = 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const x = (rnd(i) * W + t * 10 * (rnd(i + 1) - 0.5) + W) % W, y = rnd(i + 3) * H, r = 20 + 60 * rnd(i + 4); const c = cols[i % cols.length];
    ctx.fillStyle = rad(x, y, 0, r, [[0, c.replace('A', String(0.35 * a))], [1, c.replace('A', '0')]]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); } ctx.restore(); }
function particles(t, n, col, up = 1, a = 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const x = (rnd(i) * W + Math.sin(t + i) * 30), y = ((rnd(i + 2) * H - t * 160 * up * (0.4 + rnd(i + 3))) % H + H) % H; glowDot(x, y, 2 + 3 * rnd(i + 4), col, a * (0.4 + 0.6 * rnd(i + 5))); } ctx.restore(); }
function track(t, y0, speed, col1 = '#7b2f22', col2 = '#5b2018') {
  ctx.fillStyle = lin(0, y0, 0, H, [[0, col1], [1, col2]]); ctx.fillRect(-200, y0, W + 400, H);
  for (let k = 1; k < 5; k++) line([[-200, y0 + k * 60 + k * k * 18], [W + 200, y0 + k * 60 + k * k * 18]], 'rgba(255,255,255,.55)', 4 + k);
  for (let i = 0; i < 12; i++) { const x = ((i * 220 - t * speed) % 2640 + 2640) % 2640 - 200; line([[x, y0 + 20], [x - 60, H]], 'rgba(255,255,255,.08)', 30); }
}
function sun(x, y, r, a = 1, col = '255,190,110') { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = rad(x, y, 0, r * 4, [[0, `rgba(${col},.95)`], [0.25, `rgba(${col},.5)`], [1, `rgba(${col},0)`]]); ctx.beginPath(); ctx.arc(x, y, r * 4, 0, TAU); ctx.fill(); ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); }
function bigWord(s, y, a, col = '#fff', size = 150, o = {}) { text(`<span class="big" style="color:${col};${o.style || ''}">${s}</span>`, W / 2, y, { size, a, scale: o.scale ?? (0.85 + 0.15 * eob(clamp(a))) }); }
function hindiWord(s, y, a, col = '#ffcf5a', size = 120) { text(s, W / 2, y, { size, a, cls: 'ttl', color: col, scale: 0.85 + 0.15 * eob(clamp(a)) }); }

// ================================================================== SCENES
// A — alone on a rooftop at night
add(0, T('l2'), (t) => {
  grad('#070a18', '#141c3a', '#2a2140'); cam(540, 960, 1);
  sun(820, 360, 46, 0.9, '230,235,255'); bokeh(t, 22, ['rgba(255,190,120,A)', 'rgba(120,170,255,A)']);
  city(t, 1180, 1);
  ctx.fillStyle = '#05070d'; ctx.fillRect(0, 1180, W, 760); fillRR(120, 1160, 840, 30, 6, '#10131c');
  camKeys(t, [[0, 540, 1000, 1.0], [T('l2'), 540, 1040, 1.12]]);
  figure(540, 1162, 1.25, 'sit', t, { rim: '#7fb4ff' });
  // phone glow on the face
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(600, 1080, 0, 90, [[0, 'rgba(140,200,255,.45)'], [1, 'rgba(140,200,255,0)']]); ctx.beginPath(); ctx.arc(600, 1080, 90, 0, TAU); ctx.fill(); ctx.restore();
});
// B — the dream: a stage, a spotlight, the crowd
add(T('l2'), T('l3'), (t) => {
  grad('#14070a', '#2a0f12', '#0a0507'); camKeys(t, [[T('l2'), 540, 960, 1.15], [T('l3'), 540, 920, 1.0]]);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [x, a] of [[300, -0.25], [780, 0.25], [540, 0]]) { ctx.save(); ctx.translate(x, -100); ctx.rotate(a); ctx.fillStyle = lin(0, 0, 0, 1400, [[0, 'rgba(255,230,170,.5)'], [1, 'rgba(255,230,170,0)']]); ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(40, 0); ctx.lineTo(260, 1400); ctx.lineTo(-260, 1400); ctx.fill(); ctx.restore(); } ctx.restore();
  fillRR(140, 1220, 800, 70, 10, '#2b1a14'); ctx.fillStyle = lin(0, 1290, 0, 1500, [[0, '#1a0e0b'], [1, '#080404']]); ctx.fillRect(100, 1290, 880, 300);
  figure(540, 1222, 1.3, 'arms', t, { rim: '#ffcf5a', raise: eio((t - T('l2') - 0.6) / 1.2), glow: 40 });
  for (let i = 0; i < 40; i++) { const x = (i % 20) * 58 + 10, y = 1600 + Math.floor(i / 20) * 70 + 8 * Math.sin(t * 6 + i); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill(); ctx.fillRect(x - 34, y + 20, 68, 120); }
  particles(t, 70, '#ffcf5a', -1, R(t, T('l2') + 0.8, 0.6));
  screen(); bigWord('BIG', 520, R(t, T('l2') + 0.4, 0.3) * (1 - R(t, T('l3') - 0.4, 0.3)), '#ffcf5a', 230, { style: 'text-shadow:0 0 50px rgba(255,200,80,.8)' });
});
// C — potential: aura + meter filling
add(T('l3'), T('l4'), (t) => {
  grad('#030914', '#06203a', '#020509'); cam(540, 960, 1);
  const u = eio((t - T('l3') - 0.3) / 2.2);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { ctx.strokeStyle = `rgba(80,200,255,${0.25 * u})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(540, 1000, 160 + k * 70 + 20 * Math.sin(t * 3 + k), 0, TAU); ctx.stroke(); } ctx.restore();
  particles(t, 90, '#59d6ff', 1, u);
  figure(540, 1240, 1.3, 'power', t, { rim: '#59d6ff', glow: 30 + 40 * u });
  screen();
  fillRR(190, 1300, 700, 46, 23, 'rgba(255,255,255,.12)'); ctx.save(); ctx.shadowColor = '#59d6ff'; ctx.shadowBlur = 30; fillRR(190, 1300, 700 * u, 46, 23, '#59d6ff'); ctx.restore();
  bigWord(`POTENTIAL ${Math.round(100 * u)}%`, 1240, R(t, T('l3'), 0.4), '#bfefff', 66);
});
// D — what happened: glitch, the meter cracks and drains
add(T('l4'), T('l5'), (t) => {
  grad('#0a0a0a', '#1a1a1a', '#050505'); cam(540, 960, 1);
  const g = R(t, T('l4') + 0.2, 0.3);
  figure(540 + (rnd(Math.floor(t * 20)) - 0.5) * 30 * g, 1240, 1.3, 'stand', t, { rim: '#888', glow: 10 });
  screen();
  const left = lerp(1, 0.08, eio((t - T('l4') - 0.4) / 1.6));
  fillRR(190, 1300, 700, 46, 23, 'rgba(255,255,255,.12)'); fillRR(190, 1300, 700 * left, 46, 23, '#ff4b3e');
  line([[520, 1295], [560, 1330], [530, 1350]], '#000', 6);
  // glitch slices
  for (let i = 0; i < 7; i++) { if (rnd(Math.floor(t * 15) + i) < 0.5) continue; const y = rnd(i + Math.floor(t * 15)) * H; ctx.fillStyle = i % 2 ? 'rgba(255,0,80,.25)' : 'rgba(0,255,220,.2)'; ctx.fillRect(0, y, W, 10 + 40 * rnd(i)); }
hindiWord('क्या हो गया?', 620, g, '#ff6b5b', 120);
});
// E — days slipping: bed, phone, rain, clock, calendar
add(T('l5'), T('l6'), (t) => {
  grad('#05070f', '#0d1426', '#04050a'); cam(540, 960, 1);
  // window with rain
  fillRR(160, 300, 760, 560, 10, '#0a1020'); ctx.save(); ctx.beginPath(); ctx.rect(170, 310, 740, 540); ctx.clip(); city(t, 900, 0.6);
  for (let i = 0; i < 120; i++) { const x = 170 + rnd(i) * 740, y = 310 + ((rnd(i + 1) * 540 + t * 900 * (0.7 + rnd(i + 2))) % 540); line([[x, y], [x - 6, y + 30]], 'rgba(180,210,255,.35)', 2); } ctx.restore();
  ctx.strokeStyle = '#1b2236'; ctx.lineWidth = 16; ctx.strokeRect(160, 300, 760, 560); line([[540, 300], [540, 860]], '#1b2236', 12);
  // bed + figure lying, phone light
  fillRR(80, 1300, 920, 120, 20, '#1c2135'); fillRR(100, 1250, 260, 70, 30, '#2a3150');
  figure(520, 1250, 1.05, 'stand', t, { rot: -Math.PI / 2, rim: '#59d6ff', glow: 14 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(330, 1150, 0, 140, [[0, 'rgba(120,190,255,.6)'], [1, 'rgba(120,190,255,0)']]); ctx.beginPath(); ctx.arc(330, 1150, 140, 0, TAU); ctx.fill(); ctx.restore();
  // clock spinning
  const cx = 800, cy = 1060, sp = (t - T('l5')) * 6;
  ctx.save(); ctx.globalAlpha = R(t, T('l5') + 0.3, 0.4); ctx.strokeStyle = '#e8ecf4'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, 90, 0, TAU); ctx.stroke(); line([[cx, cy], [cx + Math.sin(sp) * 70, cy - Math.cos(sp) * 70]], '#ffcf5a', 8); line([[cx, cy], [cx + Math.sin(sp / 12) * 45, cy - Math.cos(sp / 12) * 45]], '#fff', 10); ctx.restore();
  // calendar pages flying
  for (let i = 0; i < 10; i++) { const p = (t - T('l5') - i * 0.35); if (p < 0 || p > 2.5) continue; ctx.save(); ctx.translate(240 + p * 340 + i * 10, 1650 - p * 520); ctx.rotate(p * 2 + i); fillRR(-50, -60, 100, 120, 8, '#f3efe6'); fillRR(-50, -60, 100, 28, 8, '#d64531'); text('', 0, 0); ctx.fillStyle = '#222'; ctx.font = '800 46px M'; ctx.textAlign = 'center'; ctx.fillText(String(1 + ((i * 7) % 28)), 0, 40); ctx.restore(); }
});
// F — WHAT HAPPENED? stand up
add(T('l6'), T('s1'), (t) => {
  grad('#000', '#0b0b0b', '#000'); cam(540, 960, 1);
  const hb = Math.max(beat(t), 0.4 * Math.exp(-((t - T('l6')) % 0.8) * 5));
  figure(540, 1360, 1.4, 'stand', t, { rim: '#ff4b3e', glow: 30 + 40 * hb });
  screen();
  bigWord('WHAT', 520, R(t, T('l6'), 0.15), '#fff', 190); bigWord('HAPPENED?', 720, R(t, T('l6') + 0.35, 0.15), '#ff4b3e', 150);
});
// G — dawn run, chains of habits break
add(T('s1'), T('s2'), (t) => {
  grad('#1a1430', '#c9634a', '#f2a36b'); cam(540, 960, 1);
  sun(540, 1020, 90, R(t, T('s1'), 1.5));
  ctx.fillStyle = '#2a1b22'; ctx.beginPath(); ctx.moveTo(0, 1180); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 1140 - 60 * Math.abs(Math.sin(x * 0.006))); ctx.lineTo(W, 1300); ctx.lineTo(0, 1300); ctx.fill();
  track(t, 1250, 900);
  const brk = R(t, T('s1') + 1.6, 0.2);
  figure(520, 1500, 1.35, 'run', t, { rim: '#ffcf5a', speed: lerp(4, 10, brk) });
  // chains around the legs, then shards
  if (brk < 1) for (let k = 0; k < 7; k++) { ctx.save(); ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 10; ctx.beginPath(); ctx.ellipse(470 + k * 18, 1400 + k * 8, 26, 16, 0.6, 0, TAU); ctx.stroke(); ctx.restore(); }
  for (let i = 0; i < 22; i++) { const p = t - T('s1') - 1.6; if (p < 0 || p > 1.5) continue; const a = rnd(i) * TAU, d = 200 * p * (0.5 + rnd(i + 1)); ctx.save(); ctx.globalAlpha = 1 - p / 1.5; ctx.fillStyle = '#b8bec8'; ctx.translate(500 + Math.cos(a) * d, 1420 + Math.sin(a) * d); ctx.rotate(p * 6 + i); ctx.fillRect(-12, -5, 24, 10); ctx.restore(); }
  screen(); hindiWord('आदतें', 420, win(t, T('s1') + 0.2, T('s1') + 2.6, 0.3), '#d9dde3', 140); bigWord('BREAK', 600, R(t, T('s1') + 1.6, 0.2) * (1 - R(t, T('s2') - 0.4, 0.3)), '#ffcf5a', 170);
});
// H — running through excuse bubbles
add(T('s2'), T('s3'), (t) => {
  grad('#3a1d2c', '#e07a52', '#f6b479'); cam(540, 960, 1); sun(760, 900, 80, 1); track(t, 1250, 1100);
  const ex = ['कल से', 'मूड नहीं', 'थक गया', 'बाद में', 'Sunday से'];
  ex.forEach((w, i) => { const tb = T('s2') + 0.3 + i * 0.55, p = t - tb; if (p < -0.6) return; const x = 980 - (t - tb + 0.6) * 520, y = 760 + (i % 2) * 200; const pop = R(t, tb + 0.6, 0.12);
    if (pop < 1) { ctx.save(); ctx.globalAlpha = 1 - pop; fillRR(x - 150, y - 60, 300, 110, 55, 'rgba(255,255,255,.88)'); ctx.restore(); text(`<span style="color:#3a1d2c">${w}</span>`, x, y - 5, { size: 46, a: 1 - pop, cls: 'ttl' }); }
    else for (let k = 0; k < 10; k++) glowDot(x + Math.cos(k) * 120 * (1 + pop), y + Math.sin(k) * 60, 4, '#ffffff', Math.max(0, 1 - (t - tb - 0.7) * 2)); });
  figure(420, 1500, 1.35, 'run', t, { rim: '#fff3d6', speed: 11 });
  screen(); hindiWord('बहाने? <span style="color:#ffcf5a">नहीं।</span>', 380, R(t, T('s2') + 0.2, 0.3), '#fff', 110);
});
// I — headphones / sound waves, carefree stride
add(T('s3'), T('s4'), (t) => {
  grad('#ff9a5a', '#ffc98a', '#ffe2b8'); cam(540, 960, 1); sun(540, 700, 120, 1, '255,240,210'); track(t, 1250, 1300, '#9c3d2a', '#6e281b');
  const b = beat(t);
  for (let k = 0; k < 5; k++) { ctx.save(); ctx.globalAlpha = 0.5 - k * 0.08; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(560, 1180, 120 + k * 60 + 40 * b, -2.4, -0.7); ctx.stroke(); ctx.restore(); }
  figure(540, 1500, 1.35 + 0.03 * b, 'run', t, { rim: '#fff', speed: 12 });
  screen(); hindiWord('बेफ़िक्री', 420, R(t, T('s3') + 0.1, 0.3), '#fff', 150);
});
// J — the whole sky
add(T('s4'), T('s5'), (t) => {
  grad('#0b1230', '#3b3f8a', '#f08a5d'); cam(540, 960, 1);
  for (let i = 0; i < 160; i++) { ctx.globalAlpha = 0.4 + 0.6 * rnd(i); ctx.fillStyle = '#fff'; ctx.fillRect(rnd(i + 1) * W, rnd(i + 2) * 1100, 2.5, 2.5); } ctx.globalAlpha = 1;
  sun(540, 1250, 140, 1);
  const s = lerp(1.2, 2.0, eio((t - T('s4')) / 3));
  ctx.fillStyle = '#05060a'; ctx.fillRect(0, 1360, W, 600);
  figure(540, 1370, s, 'arms', t, { rim: '#ffcf5a', raise: eio((t - T('s4') - 0.4) / 1.0), glow: 50 });
  particles(t, 80, '#ffcf5a', 1, 0.8);
  screen(); hindiWord('पूरा आसमान', 380, R(t, T('s4') + 0.2, 0.3), '#fff', 140);
});
// K — finish line + end card
add(T('s5'), END + 1, (t) => {
  const f = T('s5');
  grad('#120a08', '#2a120c', '#050303'); cam(540, 960, 1);
  if (t < f + 2.4) {
    track(t, 1250, 500); const x = lerp(-100, 640, eio((t - f) / 1.8));
    const brk = R(t, f + 1.2, 0.15);
    line([[600, 1180], [600 + (brk ? -80 : 0), 1290]], '#fff', 8); line([[1000, 1180], [1000 + (brk ? 80 : 0), 1290]], '#fff', 8);
    if (brk < 1) line([[600, 1220], [1000, 1220]], '#ff4b3e', 10, 20); else { line([[600, 1220], [520, 1300]], '#ff4b3e', 8); line([[1000, 1220], [1080, 1300]], '#ff4b3e', 8); }
    figure(x, 1500, 1.35, 'run', t, { rim: '#ffcf5a', speed: 6 });
  }
  screen();
  const e = R(t, f + 2.2, 0.6);
  ctx.fillStyle = `rgba(0,0,0,${0.75 * e})`; ctx.fillRect(0, 0, W, H);
  bigWord('WHAT HAPPENED?', 760, e, '#ff4b3e', 88);
  hindiWord('जवाब तू देगा।', 900, R(t, f + 2.8, 0.5), '#fff', 120);
  hindiWord('आज से शुरू कर।', 1050, R(t, f + 3.6, 0.5), '#ffcf5a', 80);
});
await start();
