// चंद्रयान-3: चाँद तक का सफ़र — 2D documentary film module (engine: ./engine.js)
import { add, start, A, R, win, eio, eob, ss, lerp, clamp, rnd, ctx, cam, camKeys, screen, studio, text, label, chapter, panel, line, flow,
         arrow, glowDot, fillRR, rr, lin, rad, TAU, END, W, H, scr, CAM } from './engine.js';

// ================================================================== offscreen art (built once)
function off(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function noise2(x, y, s) { // cheap value noise
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => rnd(a * 57.3 + b * 131.7 + s * 17.1);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}
const fbm = (x, y, s) => { let a = 0, f = 1, w = 0.5; for (let i = 0; i < 5; i++) { a += w * noise2(x * f, y * f, s + i); f *= 2; w *= 0.5; } return a; };

const EARTH = off(600, 600, (g, w) => {
  const im = g.createImageData(w, w), r = w / 2;
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const dx = (x - r) / r, dy = (y - r) / r, d2 = dx * dx + dy * dy; if (d2 > 1) continue;
    const z = Math.sqrt(1 - d2);
    const lon = Math.atan2(dx, z) * 1.6 + 2.2, lat = Math.asin(dy);
    const n = fbm(lon * 1.6 + 5, lat * 2.6 + 5, 3);
    const cl = fbm(lon * 3 + 1, lat * 6 + 9, 7);
    const light = clamp(0.25 + 0.95 * (-dx * 0.55 - dy * 0.45 + z * 0.7));
    let c = n > 0.56 ? [70 + 60 * n, 120 + 40 * n, 60] : [18, 60 + 40 * n, 140 + 60 * n];
    if (Math.abs(lat) > 1.25) c = [235, 240, 245];
    if (cl > 0.6) { const k = clamp((cl - 0.6) * 4); c = c.map((v) => lerp(v, 245, k * 0.85)); }
    const i = (y * w + x) * 4; im.data[i] = c[0] * light; im.data[i + 1] = c[1] * light; im.data[i + 2] = c[2] * light; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
});
const MOON = off(900, 900, (g, w) => {
  const im = g.createImageData(w, w), r = w / 2;
  const craters = []; for (let i = 0; i < 160; i++) craters.push([rnd(i) * 2 - 1, rnd(i + 50) * 2 - 1, 0.015 + 0.09 * Math.pow(rnd(i + 99), 3)]);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const dx = (x - r) / r, dy = (y - r) / r, d2 = dx * dx + dy * dy; if (d2 > 1) continue;
    const z = Math.sqrt(1 - d2);
    let v = 0.62 + 0.25 * (fbm(dx * 3 + 2, dy * 3 + 2, 11) - 0.5);
    const mare = fbm(dx * 1.4 + 7, dy * 1.4 + 3, 21); if (mare > 0.58) v -= (mare - 0.58) * 1.1;
    for (const [cx, cy, cr] of craters) {
      const ex = dx - cx, ey = dy - cy, d = Math.sqrt(ex * ex + ey * ey) / cr;
      if (d < 1) v -= 0.12 * (1 - d) * (ex * 0.7 + ey * 0.7 < 0 ? 1 : -0.6); else if (d < 1.25) v += 0.05;
    }
    const light = clamp(0.18 + 0.95 * (-dx * 0.6 - dy * 0.35 + z * 0.75));
    const c = clamp(v) * light * 255;
    const i = (y * w + x) * 4; im.data[i] = c * 1.0; im.data[i + 1] = c * 0.98; im.data[i + 2] = c * 0.95; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
});
const STARS = []; for (let i = 0; i < 420; i++) STARS.push([rnd(i * 3) * 2400 - 240, rnd(i * 3 + 1) * 1400 - 160, rnd(i * 3 + 2)]);

// ================================================================== space + bodies
function space(t, o = {}) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = lin(0, 0, 0, H, [[0, '#02030a'], [1, '#060a1a']]); ctx.fillRect(0, 0, W, H);
  const neb = [[0.25, 0.3, 'rgba(110,60,190,.20)', 700], [0.78, 0.65, 'rgba(30,120,190,.18)', 800], [0.55, 0.1, 'rgba(190,60,120,.10)', 600]];
  for (const [x, y, c, r] of neb) { ctx.fillStyle = rad(W * x - CAM.x * 0.03, H * y - CAM.y * 0.03, 0, r, [[0, c], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H); }
  const px = (CAM.x - 960) * 0.06 * (o.par ?? 1), py = (CAM.y - 540) * 0.06 * (o.par ?? 1);
  for (let i = 0; i < STARS.length; i++) {
    const [x, y, m] = STARS[i]; const tw = 0.55 + 0.45 * Math.sin(t * (1 + m * 3) + i);
    ctx.globalAlpha = (0.25 + 0.75 * m) * tw * (o.a ?? 1); ctx.fillStyle = m > 0.92 ? '#cfe3ff' : '#ffffff';
    const s = m > 0.95 ? 2.6 : m > 0.7 ? 1.8 : 1.1; ctx.fillRect(((x - px * (0.5 + m)) % 2400 + 2400) % 2400 - 240, y - py * (0.5 + m), s, s);
  }
  ctx.restore();
}
function earth(x, y, r, o = {}) {
  ctx.save();
  ctx.fillStyle = rad(x, y, r * 0.9, r * 1.35, [[0, 'rgba(90,170,255,.45)'], [1, 'rgba(90,170,255,0)']]); ctx.beginPath(); ctx.arc(x, y, r * 1.35, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.drawImage(EARTH, -r, -r, 2 * r, 2 * r); ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(140,200,255,.65)'; ctx.lineWidth = Math.max(2, r * 0.03); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore();
}
function moon(x, y, r, o = {}) {
  ctx.save();
  if (o.glow !== false) { ctx.fillStyle = rad(x, y, r * 0.95, r * 1.25, [[0, 'rgba(255,250,235,.16)'], [1, 'rgba(255,250,235,0)']]); ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.drawImage(MOON, -r, -r, 2 * r, 2 * r);
  ctx.restore();
}
function ellipse(cx, cy, a, b, rot, col, w, o = {}) {
  ctx.save(); ctx.globalAlpha *= o.a ?? 1; ctx.strokeStyle = col; ctx.lineWidth = w; if (o.dash) ctx.setLineDash(o.dash);
  if (o.glow) { ctx.shadowColor = col; ctx.shadowBlur = o.glow; }
  ctx.beginPath(); ctx.ellipse(cx, cy, a, b, rot, o.a0 ?? 0, o.a1 ?? TAU); ctx.stroke(); ctx.restore();
}
function flame(x, y, len, wid, ang, t, a = 1) { // nozzle at (x,y), pointing along ang
  if (a <= 0.01 || len <= 1) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter';
  const fl = len * (0.9 + 0.12 * Math.sin(t * 40) + 0.06 * Math.sin(t * 73));
  const g = ctx.createLinearGradient(0, 0, fl, 0);
  g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, 'rgba(255,200,90,.9)'); g.addColorStop(0.7, 'rgba(255,110,40,.45)'); g.addColorStop(1, 'rgba(255,80,30,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -wid / 2); ctx.quadraticCurveTo(fl * 0.5, -wid * 0.9, fl, 0); ctx.quadraticCurveTo(fl * 0.5, wid * 0.9, 0, wid / 2); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function foil(x, y, w, h, r = 6) { // crinkled gold MLI foil
  fillRR(x, y, w, h, r, lin(x, y, x + w, y + h, [[0, '#ffe08a'], [0.35, '#d9a334'], [0.6, '#f5cf6a'], [1, '#a8741c']]));
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip(); ctx.strokeStyle = 'rgba(120,70,10,.35)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) { const yy = y + rnd(i + x) * h; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w * 0.4, yy + 6 * (rnd(i) - 0.5)); ctx.lineTo(x + w, yy + 8 * (rnd(i + 3) - 0.5)); ctx.stroke(); }
  ctx.restore();
}
function lander(x, y, s, o = {}) { // Vikram, feet at y
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.tilt || 0);
  if (o.fire) flame(0, -40, 120 * o.fire, 34, Math.PI / 2, o.t || 0, 1);
  // legs
  for (const sx of [-1, 1]) {
    line([[sx * 52, -70], [sx * 92, -8]], '#c9cfd8', 7); line([[sx * 30, -48], [sx * 92, -8]], '#9aa3ae', 4);
    fillRR(sx * 92 - 18, -10, 36, 10, 5, '#dfe5ec');
  }
  foil(-62, -150, 124, 96, 8);
  fillRR(-56, -168, 112, 20, 5, '#2b3240');                    // top deck
  ctx.fillStyle = lin(0, -168, 0, -148, [[0, '#2a4d8f'], [1, '#183361']]); for (let i = 0; i < 5; i++) ctx.fillRect(-52 + i * 21, -165, 18, 14);
  fillRR(62, -140, 16, 70, 4, lin(62, -140, 78, -70, [[0, '#2f5aa8'], [1, '#183361']]));   // side panel
  fillRR(-18, -56, 36, 18, 4, '#5b6472'); fillRR(-12, -40, 24, 10, 3, '#3a414c');           // engine
  fillRR(-6, -196, 12, 30, 3, '#c9cfd8'); glowDot(0, -198, 4, '#ff5555', 0.9 * (0.5 + 0.5 * Math.sin((o.t || 0) * 5)));
  if (o.ramp !== undefined) { // ramp unfolding from the right side
    ctx.save(); ctx.translate(62, -64); ctx.rotate(lerp(-1.4, 0.55, o.ramp)); fillRR(0, -4, 120, 8, 3, '#c9cfd8'); ctx.restore();
  }
  ctx.restore();
}
function propModule(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(o.rot || 0);
  fillRR(-60, -60, 120, 120, 10, lin(-60, -60, 60, 60, [[0, '#e9edf2'], [1, '#8f98a4']]));
  foil(-52, -52, 104, 40, 6);
  ctx.fillStyle = lin(0, -40, 0, 40, [[0, '#2f5aa8'], [1, '#132a55']]); ctx.fillRect(60, -26, 170, 52);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(60 + i * 28, -26); ctx.lineTo(60 + i * 28, 26); ctx.stroke(); }
  if (o.fire) flame(-60, 0, 110 * o.fire, 30, Math.PI, o.t || 0);
  ctx.restore();
}
function stack(x, y, s, o = {}) { // integrated spacecraft (PM + lander on top), pointing along o.rot
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  propModule(0, 0, 1, { fire: o.fire, t: o.t }); ctx.save(); ctx.rotate(Math.PI / 2); lander(0, -60 + 0, 0.75, { t: o.t }); ctx.restore();
  ctx.restore();
}
function rover(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = 0; i < 3; i++) { const wx = -42 + i * 42; ctx.save(); ctx.translate(wx, -14); ctx.rotate(o.ang || 0); ctx.fillStyle = '#3a414c'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a9b3bf'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * TAU / 4) * 13, Math.sin(k * TAU / 4) * 13); ctx.stroke(); } ctx.restore(); }
  line([[-56, -26], [56, -26]], '#c9cfd8', 5);
  foil(-50, -66, 100, 40, 6);
  ctx.save(); ctx.translate(-50, -66); ctx.rotate(-0.35); fillRR(0, -8, 96, 10, 2, lin(0, -8, 96, 2, [[0, '#2f5aa8'], [1, '#183361']]));
  if (o.sun) { ctx.shadowColor = '#7fd8ff'; ctx.shadowBlur = 24 * o.sun; fillRR(0, -8, 96, 10, 2, `rgba(127,216,255,${0.5 * o.sun})`); } ctx.restore();
  line([[38, -66], [38, -96]], '#c9cfd8', 4); fillRR(28, -106, 22, 12, 3, '#2b3240');
  ctx.restore();
}
function ground(y0, o = {}) { // grey lunar ground with craters + rocks, side view
  ctx.fillStyle = lin(0, y0 - 40, 0, y0 + 400, [[0, '#8d8a85'], [0.15, '#5f5c58'], [1, '#1d1c1b']]);
  ctx.beginPath(); ctx.moveTo(-2000, y0 + 400); ctx.lineTo(-2000, y0);
  for (let x = -2000; x <= 4000; x += 30) ctx.lineTo(x, y0 + 8 * Math.sin(x * 0.004) + 5 * (fbm(x * 0.01, 1, 3) - 0.5));
  ctx.lineTo(4000, y0 + 400); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 28; i++) {
    const x = -1800 + rnd(i * 7) * 5400, w = 60 + rnd(i * 7 + 1) * 220, yy = y0 + 30 + rnd(i * 7 + 2) * 260;
    ctx.fillStyle = 'rgba(20,20,22,.45)'; ctx.beginPath(); ctx.ellipse(x, yy, w, w * 0.16, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(200,196,188,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, yy, w, w * 0.16, 0, 0.1, Math.PI - 0.1); ctx.stroke();
  }
  for (let i = 0; i < 40; i++) { const x = -1800 + rnd(i * 3 + 400) * 5400, yy = y0 + 10 + rnd(i * 3 + 401) * 300, r = 4 + 14 * rnd(i * 3 + 402);
    ctx.fillStyle = '#4a4744'; ctx.beginPath(); ctx.ellipse(x, yy, r, r * 0.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(x + r * 1.6, yy + 2, r * 1.8, r * 0.3, 0, 0, TAU); ctx.fill(); }
}
function dust(x, y, t, t0, n = 60, spread = 500, a = 1) {
  const u = t - t0; if (u < 0 || u > 4) return;
  for (let i = 0; i < n; i++) {
    const dir = (rnd(i) - 0.5) * 2, sp = spread * (0.3 + rnd(i + 9));
    const px = x + dir * sp * (1 - Math.exp(-u * 1.6)), py = y - 40 * rnd(i + 3) * Math.exp(-u) - 4;
    ctx.fillStyle = `rgba(190,185,175,${0.5 * a * Math.exp(-u * 0.9) * (0.4 + 0.6 * rnd(i + 5))})`;
    ctx.beginPath(); ctx.arc(px, py, 6 + 18 * rnd(i + 7), 0, TAU); ctx.fill();
  }
}
function tricolor(x, y, w, a = 1) {
  if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a;
  const h = 10; fillRR(x - w / 2, y, w / 3, h, 4, '#ff9933'); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 6, y, w / 3, h); fillRR(x + w / 6, y, w / 3, h, 4, '#138808');
  ctx.restore();
}
function hud(x, y, rows, a = 1) { // screen-space data panel
  if (a <= 0.01) return;
  panel(x, y, 460, 70 + rows.length * 74, a, 'rgba(6,14,28,.82)');
  rows.forEach(([k, v, col], i) => {
    text(k, x + 30, y + 56 + i * 74, { size: 26, a, color: '#8fb3d9', align: 'left' });
    text(`<span class="big" style="letter-spacing:0">${v}</span>`, x + 430, y + 56 + i * 74, { size: 40, a, color: col || '#ffffff', align: 'right' });
  });
}
const fmt = (n) => Math.round(n).toLocaleString('en-IN');
const mmss = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`; };

// ================================================================== SCENES
const GY = 820; // lunar ground line in surface scenes

// ---------- HOOK: Vikram on the south pole at sunset light
add(0, A('h_how'), (t) => {
  space(t, { a: 0.9 });
  camKeys(t, [[0, 960, 600, 1.0], [A('h_how'), 1060, 640, 1.18]]);
  earth(330, 230, 70, { rot: 0.3 });
  ctx.save(); ctx.fillStyle = rad(1900, 700, 0, 900, [[0, 'rgba(255,220,160,.35)'], [1, 'rgba(255,220,160,0)']]); ctx.fillRect(-400, -300, 2800, 1600); ctx.restore();
  ground(GY);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(1080, GY + 4, 300, 18, 0, 0, TAU); ctx.fill();
  lander(1150, GY + 2, 1.35, { t });
  dust(1150, GY, t, -0.6, 50, 420, 0.8);
  screen();
  const a0 = win(t, 0.2, A('h_date') - 0.05, 0.4);
  text('चाँद का <span style="color:#ffd166">दक्षिणी ध्रुव</span>', 960, 200, { size: 72, cls: 'ttl', a: a0 });
  text('जहाँ आज तक कोई देश नहीं उतरा था', 960, 290, { size: 40, a: a0, color: '#c9d6ff' });
  const ad = R(t, A('h_date'), 0.4) * (1 - R(t, A('h_hist') - 0.1, 0.3));
  text(`<span class="big">23</span> अगस्त <span class="big">2023</span>`, 960, 200, { size: 96, a: ad, scale: 0.9 + 0.1 * ad });
  const at = R(t, A('h_time'), 0.3) * (1 - R(t, A('h_hist') - 0.1, 0.3));
  const mins = Math.min(4, Math.floor((t - A('h_time')) * 3));
  text(`शाम <span class="big" style="color:#7fe3ff">6:0${Math.max(0, mins)}</span>`, 960, 320, { size: 84, a: at });
  const ah = R(t, A('h_hist'), 0.5);
  text('भारत ने इतिहास रच दिया', 960, 230, { size: 100, cls: 'ttl', a: ah, color: '#ffffff', scale: 0.92 + 0.08 * ah });
  tricolor(960, 320, 520 * ah, ah);
});
add(A('h_how'), A('c2'), (t) => {
  space(t);
  camKeys(t, [[A('h_how'), 960, 540, 1.0], [A('c2'), 1000, 540, 1.08]]);
  earth(420, 600, 150, { rot: t * 0.02 });
  moon(1560, 470, 120);
  const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([lerp(570, 1440, u), 600 - 260 * Math.sin(u * Math.PI) + 130 * u]); }
  line(pts, 'rgba(127,216,255,.5)', 3, 10, [10, 12]);
  screen();
  const q = R(t, A('h_how') + 0.2, 0.4) * (1 - R(t, A('h_go') - 0.15, 0.3));
  text('आख़िर <span style="color:#ffd166">कैसे?</span>', 960, 880, { size: 110, cls: 'ttl', a: q });
  const v = R(t, A('h_go'), 0.7);
  ctx.fillStyle = `rgba(2,3,10,${0.35 * v})`; ctx.fillRect(0, 0, W, H);
  text('<span class="chap" style="font-size:34px">एक डॉक्यूमेंट्री</span>', 960, 380, { size: 34, a: v });
  text('चंद्रयान-3', 960, 490, { size: 170, cls: 'ttl', a: v, color: '#ffd166', scale: 0.92 + 0.08 * v });
  text('चाँद तक का सफ़र', 960, 620, { size: 64, cls: 'ttl', a: v });
  tricolor(960, 690, 460 * v, v);
});

// ---------- CH1: the 2019 failure
add(A('c2'), A('o0'), (t) => {
  space(t, { a: 0.8 });
  cam(960, 540, 1);
  moon(960, 1900, 1450, { rot: 0.4, glow: true });
  const plan = [], act = [];
  for (let i = 0; i <= 50; i++) { const u = i / 50; plan.push([lerp(260, 1240, u), lerp(170, 455, Math.pow(u, 1.6))]); }
  const devU = 0.62;
  for (let i = 0; i <= 50; i++) { const u = i / 50; const [px, py] = plan[Math.min(50, Math.round(u * 50))];
    act.push(u < devU ? [px, py] : [px - 260 * Math.pow((u - devU) / (1 - devU), 1.5), py + 70 * Math.pow((u - devU) / (1 - devU), 1.3)]); }
  const pa = R(t, A('c2_2019'), 0.5);
  ctx.save(); ctx.globalAlpha = pa; line(plan, 'rgba(61,255,122,.75)', 4, 10, [14, 12]); ctx.restore();
  // lander along the actual path
  const u = clamp((t - A('c2_2019') - 0.3) / (A('c2_crash') - A('c2_2019') - 0.1));
  const pathNow = act.slice(0, Math.max(2, Math.round(u * 50)) + 1);
  const red = R(t, A('c2_dev'), 0.4);
  ctx.save(); ctx.globalAlpha = pa; line(pathNow, red > 0.5 ? '#ff4b3e' : '#7fd8ff', 5, 16); ctx.restore();
  const [lx, ly] = pathNow[pathNow.length - 1];
  const crashed = t > A('c2_crash') + 0.15;
  if (!crashed) lander(lx, ly + 30, 0.45, { t, tilt: red * 1.3 * Math.sin(t * 2) + red * 0.6, fire: 0.6 });
  const fl = R(t, A('c2_crash') + 0.1, 0.12) * (1 - R(t, A('c2_crash') + 0.3, 0.9));
  if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rad(act[50][0], act[50][1] + 20, 0, 260, [[0, `rgba(255,220,160,${fl})`], [1, 'rgba(255,120,60,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  label('योजना', plan[38][0], plan[38][1], 120, -110, pa * (1 - R(t, A('c2_sad'), 0.3)));
  label('असल रास्ता', act[44][0], act[44][1], -130, -120, red * (1 - R(t, A('c2_sad'), 0.3)));
  screen();
  text('<span class="big">2019</span> • चंद्रयान-2', 960, 120, { size: 64, a: pa * (1 - R(t, A('c2_sad'), 0.3)) });
  const sad = win(t, A('c2_sad'), A('c2_isro') + 0.4, 0.4);
  if (sad > 0) { ctx.fillStyle = `rgba(10,10,14,${0.55 * sad})`; ctx.fillRect(0, 0, W, H); }
  text('पूरा देश उदास था', 960, 470, { size: 90, cls: 'ttl', a: sad, color: '#c9d0da' });
  const isro = R(t, A('c2_isro'), 0.5);
  text('लेकिन <span style="color:#ffd166">इसरो ने हार नहीं मानी</span>', 960, 460, { size: 80, cls: 'ttl', a: isro, scale: 0.94 + 0.06 * isro });
  ['ग़लती समझी', 'सुधार किया', 'फिर तैयार'].forEach((w, i) => {
    const a = R(t, A('c2_isro') + 0.8 + i * 0.35, 0.3);
    text(`<span style="display:inline-block;padding:8px 26px 2px;border-radius:14px;background:rgba(10,18,34,.85);box-shadow:0 0 0 2px rgba(61,255,122,.5)">✓ ${w}</span>`, 560 + i * 400, 600, { size: 40, a, scale: eob(a) });
  });
  chapter(t, A('c2'), 1, 'चार साल पहले की हार');
});

// ---------- CH2a: launch from Sriharikota
add(A('o0'), A('o_loops'), (t) => {
  const L = A('o_launch') + 0.6, up = Math.max(0, t - L);
  const climb = 160 * up * up;
  cam(960, 560 - Math.max(0, climb - 200), 1.0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sk = clamp(climb / 2200);
  ctx.fillStyle = lin(0, 0, 0, H, [[0, '#0b1636'], [0.6, sk > 0.5 ? '#0b1636' : '#3a3f7a'], [0.85, '#f08a5d'], [1, '#f6b26b']]); ctx.fillRect(0, 0, W, H); ctx.restore();
  if (sk > 0.3) space(t, { a: (sk - 0.3) / 0.7 });
  ctx.fillStyle = lin(0, 860, 0, 1600, [[0, '#2a4a7a'], [1, '#081428']]); ctx.fillRect(-500, 860, 3000, 1400);   // sea
  for (let i = 0; i < 20; i++) line([[-500, 880 + i * 14], [2500, 880 + i * 14]], `rgba(255,190,140,${0.12 - i * 0.005})`, 2);
  ctx.fillStyle = '#1a1f2a'; ctx.beginPath(); ctx.moveTo(-500, 900); ctx.lineTo(700, 880); ctx.lineTo(1400, 900); ctx.lineTo(1400, 1600); ctx.lineTo(-500, 1600); ctx.fill();
  // tower
  fillRR(1330, 380, 70, 520, 4, '#2c3340'); for (let i = 0; i < 16; i++) line([[1330, 390 + i * 32], [1400, 420 + i * 32]], '#4a5363', 3);
  // rocket
  const rx = 1250, ry = 880 - climb;
  const smokeA = R(t, L - 0.3, 0.4);
  for (let i = 0; i < 70; i++) {
    const k = rnd(i), age = (up - k * 3); if (age < 0 || smokeA <= 0) continue;
    const sx = rx + (rnd(i + 3) - 0.5) * (80 + age * 160), sy = 880 - Math.min(climb, 160 * Math.pow(Math.max(0, up - age), 2)) + age * 30;
    ctx.fillStyle = `rgba(235,225,215,${0.35 * smokeA * Math.exp(-age * 0.25)})`; ctx.beginPath(); ctx.arc(sx, sy + 40, 30 + age * 40, 0, TAU); ctx.fill();
  }
  if (t > L - 0.3) { flame(rx, ry + 10, 260 + 40 * Math.sin(t * 9), 70, Math.PI / 2, t); flame(rx - 46, ry - 20, 220, 50, Math.PI / 2, t + 1); flame(rx + 46, ry - 20, 220, 50, Math.PI / 2, t + 2); }
  // strap-ons + core + upper stage
  for (const sx of [-46, 46]) { fillRR(rx + sx - 20, ry - 230, 40, 210, 10, lin(rx + sx - 20, 0, rx + sx + 20, 0, [[0, '#c9ced6'], [0.5, '#ffffff'], [1, '#a8afb9']]));
    ctx.fillStyle = '#d7dbe1'; ctx.beginPath(); ctx.moveTo(rx + sx - 20, ry - 230); ctx.lineTo(rx + sx, ry - 280); ctx.lineTo(rx + sx + 20, ry - 230); ctx.fill(); }
  fillRR(rx - 26, ry - 420, 52, 400, 8, lin(rx - 26, 0, rx + 26, 0, [[0, '#b9c0ca'], [0.5, '#ffffff'], [1, '#9aa3ae']]));
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(rx - 30, ry - 420); ctx.quadraticCurveTo(rx - 30, ry - 520, rx, ry - 560); ctx.quadraticCurveTo(rx + 30, ry - 520, rx + 30, ry - 420); ctx.fill();
  tricolor(rx, ry - 330, 40, 1);
  screen();
  const ta = win(t, A('o_launch'), A('o_loops'), 0.4);
  text('<span class="big">14</span> जुलाई <span class="big">2023</span>', 520, 380, { size: 76, a: ta });
  text('श्रीहरिकोटा • LVM3 रॉकेट', 520, 470, { size: 46, a: ta, color: '#ffd166' });
  const na = R(t, A('o_not'), 0.3);
  text('सीधा चाँद की तरफ़? <span style="color:#ff4b3e">✕</span>', 520, 600, { size: 56, cls: 'ttl', a: na });
  chapter(t, A('o0'), 2, 'सीधा क्यों नहीं गए?');
});

// ---------- CH2b: orbit raising around the Earth, then to the Moon
const EX = 560, EY = 560, RP = 150;
const APO = [300, 470, 680, 920, 1240];
function orbitPt(k, E) { const ra = APO[k], a = (ra + RP) / 2, b = Math.sqrt(ra * RP), c = a - RP; return [EX + c - a * Math.cos(E), EY - b * Math.sin(E)]; }
add(A('o_loops'), A('m0'), (t) => {
  space(t);
  const tl = A('o_40') + 0.4;
  camKeys(t, [[A('o_loops'), 760, 560, 1.15], [A('o_fuel'), 900, 560, 0.85], [tl, 1100, 560, 0.72], [A('m0'), 1400, 560, 0.8]]);
  earth(EX, EY, 110, { rot: t * 0.03 });
  moon(EX + 1240 + 160, EY - 120, 70);
  const u0 = A('o_loops') + 0.3, per = (A('o_40') - u0) / 5.0;
  const k = clamp(Math.floor((t - u0) / per), 0, 4);
  for (let i = 0; i < 5; i++) {
    const ra = APO[i], a = (ra + RP) / 2, b = Math.sqrt(ra * RP), c = a - RP;
    const vis = R(t, u0 + i * per, 0.3);
    ellipse(EX + c, EY, a, b, 0, i === k ? '#7fd8ff' : 'rgba(127,216,255,.35)', i === k ? 4 : 2.5, { a: vis, glow: i === k ? 14 : 0 });
  }
  // spacecraft on the current orbit
  const ph = clamp(((t - u0) % per) / per), E = TAU * (ph - 0.12 * Math.sin(TAU * ph) / TAU * 6);
  let [sx, sy] = orbitPt(k, E);
  if (t > A('o_40')) { // translunar coast
    const v = eio((t - A('o_40')) / (A('m0') - A('o_40'))), [x0, y0] = orbitPt(4, Math.PI);
    sx = lerp(x0, EX + 1240 + 160 - 90, v); sy = lerp(y0, EY - 120, v);
  }
  // perigee burns
  const burnOn = t < A('o_40') && (ph < 0.06 || ph > 0.97);
  if (burnOn) glowDot(EX - RP, EY, 14, '#ffb347');
  stack(sx, sy, 0.22, { rot: 0, fire: burnOn ? 1 : 0, t });
  glowDot(sx, sy, 5, '#7fd8ff', 0.6);
  label('पृथ्वी', EX, EY - 110, -120, -120, win(t, A('o_loops'), A('o_burn'), 0.3));
  label('इंजन चालू: <span style="color:#ffb347">+ रफ़्तार</span>', EX - RP, EY, -140, 150, win(t, A('o_burn'), A('o_fuel'), 0.3));
  label('चाँद', EX + 1400, EY - 190, 120, -100, R(t, A('o_40'), 0.4));
  screen();
  const day = Math.round(lerp(1, 40, clamp((t - A('o_loops')) / (A('m0') - A('o_loops')))));
  hud(1400, 60, [['मिशन दिन', String(day), '#ffd166']], R(t, A('o_loops') + 0.4, 0.4));
  const fa = win(t, A('o_fuel'), A('o_40') + 0.4, 0.35);
  panel(80, 720, 820, 250, fa);
  if (fa > 0) {
    text('सीधा जाना', 150, 790, { size: 36, a: fa, align: 'left' }); text('चक्कर लगाकर', 150, 900, { size: 36, a: fa, align: 'left' });
    ctx.save(); ctx.globalAlpha = fa; fillRR(420, 772, 420 * eio((t - A('o_fuel')) / 1.2), 34, 12, '#ff4b3e'); fillRR(420, 882, 150 * eio((t - A('o_fuel')) / 1.2), 34, 12, '#3dff7a'); ctx.restore();
    text('ईंधन ज़्यादा', 860, 790, { size: 30, a: fa, align: 'right', color: '#ffb0a8' }); text('कम ईंधन', 600, 900, { size: 30, a: fa, align: 'left', color: '#a8ffc4' });
  }
  text(`<span class="big">≈ 40</span> दिन का सफ़र`, 960, 140, { size: 72, a: R(t, A('o_40'), 0.4), cls: 'ttl' });
});

// ---------- CH3: lunar capture, shrinking orbits, separation
add(A('m0'), A('l0'), (t) => {
  space(t);
  camKeys(t, [[A('m0'), 960, 540, 0.9], [A('m_shrink'), 960, 540, 1.0], [A('m_sep'), 980, 520, 1.25], [A('l0'), 1000, 520, 1.3]]);
  const MX = 960, MY = 560, MR = 230;
  moon(MX, MY, MR, { rot: 0.4 });
  const capT = A('m_aug5');
  // approach + capture ellipse -> circles
  const sh = clamp((t - A('m_shrink')) / (A('m_sep') - A('m_shrink')));
  const orbits = [[520, 330], [430, 305], [350, 285], [285, 270]];
  const k = Math.min(3, Math.floor(sh * 4));
  const [oa, ob] = t < A('m_shrink') ? orbits[0] : orbits[k];
  const oc = (oa - 280);
  for (let i = 0; i < 4; i++) { const [a, b] = orbits[i]; ellipse(MX + (a - 280) * (i === 3 ? 0 : 1), MY, a, b, 0, 'rgba(127,216,255,.3)', 2, { a: R(t, A('m_shrink') + i * 0.6, 0.3) * (i <= k ? 1 : 0) }); }
  let sx, sy, rot;
  if (t < capT) { const v = eio((t - A('m0')) / (capT - A('m0'))); sx = lerp(-200, MX - 700 + oc, v); sy = lerp(300, MY - 20, v); rot = 0.2; }
  else { const ang = (t - capT) * 0.9; sx = MX + oc * (k === 3 && t > A('m_shrink') ? 0 : 1) - oa * Math.cos(ang); sy = MY - ob * Math.sin(ang); rot = Math.atan2(-ob * Math.cos(ang), oa * Math.sin(ang)); }
  if (t < A('m_aug5') || (t > A('m_aug5') && t < A('m_aug5') + 2.4) ? true : true) {}
  const sep = R(t, A('m_sep') + 0.2, 1.2);
  const fire = win(t, A('m_aug5'), A('m_aug5') + 2.2, 0.2);
  if (sep < 0.01) stack(sx, sy, 0.3, { rot: rot + (fire ? Math.PI : 0), fire, t });
  else {
    propModule(sx - 120 * sep, sy - 100 * sep, 0.3, { rot: rot + sep, t });
    lander(sx + 80 * sep, sy + 60 * sep, 0.36, { t, tilt: rot });
  }
  arrow(sx, sy, lerp(sx, MX, 0.35), lerp(sy, MY, 0.35), '#ffd166', 5, win(t, A('m_grav'), A('m_shrink') + 0.5, 0.3));
  label('गुरुत्वाकर्षण', lerp(sx, MX, 0.3), lerp(sy, MY, 0.3), 100, 120, win(t, A('m_grav'), A('m_shrink') + 0.5, 0.3));
  label('इंजन उल्टा → धीमा', sx, sy, -140, 130, win(t, A('m_aug5'), A('m_grav'), 0.3));
  label('प्रोपल्शन मॉड्यूल', sx - 120 * sep, sy - 100 * sep, -120, -100, win(t, A('m_sep') + 0.4, A('l0') + 0.3, 0.3));
  label('लैंडर विक्रम', sx + 80 * sep, sy + 60 * sep, 120, 110, win(t, A('m_sep') + 0.6, A('l0') + 0.3, 0.3));
  screen();
  text('<span class="big">5</span> अगस्त', 960, 120, { size: 64, a: win(t, A('m_aug5'), A('m_shrink'), 0.3) });
  text('चाँद के चारों ओर गोल चक्कर', 960, 120, { size: 52, a: win(t, A('m_shrink') + 0.5, A('m_sep'), 0.3), color: '#7fd8ff' });
  chapter(t, A('m0'), 3, 'चाँद ने पकड़ लिया');
});

// ---------- CH4a: the last 15 minutes — descent profile with HUD
const T_TOUCH = () => A('l_hover') + 3.4;
function descent(t) { // 0 at l0 .. 1 at touchdown
  return clamp((t - A('l0')) / (T_TOUCH() - A('l0')));
}
function hudLanding(t) {
  const u = descent(t);
  const alt = 30 * Math.pow(1 - u, 1.7), spd = 6000 * Math.pow(1 - u, 1.25);
  const left = 15 * 60 * (1 - u);
  const landed = t >= T_TOUCH();
  hud(1400, 60, [['ऊँचाई', alt >= 1 ? `${alt.toFixed(1)} km` : `${Math.round(alt * 1000)} m`, '#ffffff'],
                 ['रफ़्तार', `${fmt(spd)} km/h`, spd > 1000 ? '#ff6b5b' : '#ffd166'],
                 ['बाक़ी समय', landed ? 'उतर गया!' : mmss(left), landed ? '#3dff7a' : '#ff4b3e']], R(t, A('l0') + 0.2, 0.4));
}
add(A('l0'), A('l_cam'), (t) => {
  space(t, { a: 0.8 });
  camKeys(t, [[A('l0'), 960, 560, 1.0], [A('l_auto'), 1000, 600, 1.05], [A('l_cam'), 1200, 700, 1.25]]);
  moon(960, 2900, 2300, { rot: 0.2 });
  const path = []; for (let i = 0; i <= 60; i++) { const u = i / 60; path.push([lerp(180, 1500, u), lerp(160, 640, 1 - Math.pow(1 - u, 2.2))]); }
  line(path, 'rgba(127,216,255,.4)', 3, 8, [10, 10]);
  const u = clamp(descent(t) * 1.25);
  const [lx, ly] = path[Math.round(u * 60)];
  const [nx, ny] = path[Math.min(60, Math.round(u * 60) + 1)];
  const ang = Math.atan2(ny - ly, nx - lx);
  lander(lx, ly, 0.42, { t, tilt: ang * 0.6 + 0.9 * (1 - u) });
  flame(lx + 18 * Math.cos(ang), ly - 10 + 18 * Math.sin(ang), 150 * R(t, A('l_retro'), 0.4) + 60, 40, ang, t, 1);
  label('इंजन उल्टी दिशा में', lx, ly - 30, 140, -130, win(t, A('l_retro'), A('l_auto') + 0.3, 0.3), 'रफ़्तार घटाने के लिए');
  screen();
  hudLanding(t);
  const air = win(t, A('l_air'), A('l_speed') + 0.4, 0.3);
  if (air > 0) {
    ctx.save(); ctx.globalAlpha = air; ctx.translate(380, 420);
    ctx.strokeStyle = '#e6edf5'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 90, Math.PI, TAU); ctx.stroke();
    for (const dx of [-90, -30, 30, 90]) line([[dx, 0], [0, 130]], '#e6edf5', 4);
    line([[-120, -100], [120, 150]], '#ff4b3e', 14, 16); ctx.restore();
    text('हवा नहीं = पैराशूट नहीं', 380, 640, { size: 48, cls: 'ttl', a: air });
  }
  const au = win(t, A('l_auto'), A('l_cam') + 0.3, 0.35);
  text(`<span style="display:inline-block;padding:10px 30px 4px;border-radius:18px;background:rgba(10,18,34,.88);box-shadow:0 0 0 2px #7fd8ff">पूरी तरह <span style="color:#7fd8ff">ऑटोमैटिक</span> • पृथ्वी से कोई कंट्रोल नहीं</span>`,
    800, 140, { size: 44, a: au });
  chapter(t, A('l0'), 4, 'आख़िरी पंद्रह मिनट');
});
// ---------- CH4b: hazard scan, improvements, hover, touchdown
add(A('l_cam'), A('r0'), (t) => {
  space(t, { a: 0.8 });
  const TT = T_TOUCH();
  camKeys(t, [[A('l_cam'), 960, 520, 1.0], [A('l_hover'), 1000, 560, 1.12], [TT + 0.6, 1000, 600, 1.2], [A('r0'), 980, 580, 1.08]]);
  earth(320, 160, 56);
  ground(GY);
  const lyTop = lerp(250, GY, eio((t - A('l_hover') - 0.6) / (TT - A('l_hover') - 0.6)));
  const hover = t < A('l_hover') + 0.6 ? 250 + 8 * Math.sin(t * 3) : lyTop;
  const lx = 1000 + 40 * Math.sin(Math.min(t, A('l_hover')) * 0.8) * (t < A('l_hover') ? 1 : 0);
  // hazard scan cone + markers
  const sc = win(t, A('l_cam'), A('l_hover') + 0.6, 0.4);
  if (sc > 0) {
    ctx.save(); ctx.globalAlpha = sc * 0.25; ctx.fillStyle = '#7fd8ff'; ctx.beginPath(); ctx.moveTo(lx, hover); ctx.lineTo(lx - 520, GY + 40); ctx.lineTo(lx + 520, GY + 40); ctx.closePath(); ctx.fill(); ctx.restore();
    const sweep = ((t - A('l_cam')) * 0.6) % 1;
    ctx.save(); ctx.globalAlpha = sc; line([[lx - 520 + 1040 * sweep, GY + 40], [lx, hover]], '#7fd8ff', 3, 14); ctx.restore();
    [[-360, 160], [-120, 230], [260, 140], [420, 260]].forEach(([dx, dy], i) => {
      const a = R(t, A('l_cam') + 0.5 + i * 0.4, 0.2) * sc;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ff4b3e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(lx + dx, GY + dy * 0.25 + 30, 70, 18, 0, 0, TAU); ctx.stroke();
      line([[lx + dx - 18, GY + dy * 0.25 + 12], [lx + dx + 18, GY + dy * 0.25 + 48]], '#ff4b3e', 5); ctx.restore();
    });
    const ga = R(t, A('l_cam') + 2.4, 0.3) * sc;
    ctx.save(); ctx.globalAlpha = ga; ctx.strokeStyle = '#3dff7a'; ctx.lineWidth = 5; ctx.shadowColor = '#3dff7a'; ctx.shadowBlur = 20; rr(lx - 130, GY - 20, 260, 50, 12); ctx.stroke(); ctx.restore();
    label('सुरक्षित जगह', lx + 130, GY + 5, 140, 120, ga * (1 - R(t, A('l_hover'), 0.3)));
    label('गड्ढे और पत्थर', lx - 360, GY + 70, -100, 150, R(t, A('l_cam') + 0.8, 0.3) * sc * (1 - R(t, A('l_legs'), 0.3)));
  }
  const landed = t >= TT;
  if (!landed) { flame(lx, hover - 40 * 1.0, 160, 46, Math.PI / 2, t, 1); }
  ctx.fillStyle = `rgba(0,0,0,${0.45 * clamp(1 - (GY - hover) / 500)})`; ctx.beginPath(); ctx.ellipse(lx, GY + 4, 220, 16, 0, 0, TAU); ctx.fill();
  lander(lx, landed ? GY + 2 : hover, 1.1, { t });
  dust(lx, GY, t, TT - 0.1, 90, 700, 1);
  if (!landed && GY - hover < 260) dust(lx, GY, t, t - 0.3, 30, 260 * (1 - (GY - hover) / 260), 0.6);
  screen();
  hudLanding(t);
  const la = win(t, A('l_legs'), A('l_hover') + 0.3, 0.3);
  panel(70, 210, 560, 300, la);
  ['ज़्यादा मज़बूत पैर', 'ज़्यादा ईंधन', 'बड़ा लैंडिंग इलाक़ा (4 km × 2.4 km)'].forEach((w, i) => {
    const a = R(t, A('l_legs') + i * 0.9, 0.3) * la;
    text(`<span style="color:#3dff7a">✓</span> ${w}`, 110, 280 + i * 78, { size: i === 2 ? 32 : 40, a, align: 'left' });
  });
  text('इस बार', 110, 236, { size: 28, a: la, align: 'left', color: '#8fb3d9' });
  const fa = R(t, A('l_first'), 0.5);
  if (fa > 0) { ctx.fillStyle = `rgba(2,4,10,${0.35 * fa})`; ctx.fillRect(0, 0, W, H); }
  text('भारत <span style="color:#ffd166">पहला!</span>', 960, 380, { size: 150, cls: 'ttl', a: fa, scale: 0.9 + 0.1 * eob(fa) });
  tricolor(960, 480, 560 * fa, fa);
  text('चाँद के दक्षिणी ध्रुव के पास उतरने वाला दुनिया का पहला देश', 960, 560, { size: 44, a: R(t, A('l_first') + 0.6, 0.5), cls: 'ttl' });
});

// ---------- CH5: Pragyan
add(A('r0'), A('s0'), (t) => {
  space(t, { a: 0.8 });
  camKeys(t, [[A('r0'), 980, 600, 1.05], [A('r_prints'), 1150, 650, 1.2], [A('r_laser'), 1350, 690, 1.45], [A('r_solar'), 1300, 650, 1.25], [A('r_hop'), 1050, 600, 1.0], [A('s0'), 1050, 600, 1.0]]);
  earth(320, 160, 56);
  ground(GY);
  const LX = 900;
  const hopU = clamp((t - A('r_hop') - 0.6) / 1.6), hopY = -90 * Math.sin(Math.PI * hopU), hopX = 60 * eio(hopU);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(LX + hopX, GY + 4, 220, 16, 0, 0, TAU); ctx.fill();
  const ramp = R(t, A('r_door') + 0.2, 0.9);
  lander(LX + hopX, GY + 2 + hopY, 1.1, { t, ramp, fire: hopU > 0 && hopU < 0.6 ? 0.8 : 0 });
  if (hopU > 0.98) dust(LX + hopX, GY, t, A('r_hop') + 2.2, 50, 400, 0.8);
  // rover: down the ramp then drive right
  const rd = clamp((t - A('r_door') - 1.2) / 1.6), drive = Math.max(0, t - A('r_door') - 2.8);
  const rx0 = LX + 62 * 1.1 + 120 * 1.1 * Math.cos(0.55) * rd, ry0 = GY - 64 * 1.1 + (64 * 1.1) * rd;
  const rx = rx0 + Math.min(520, drive * 70), ry = rd < 1 ? ry0 : GY;
  // tracks with imprint pattern
  if (rx > rx0 + 2) {
    for (let x = rx0; x < rx - 40; x += 34) {
      const k = Math.floor((x - rx0) / 34);
      ctx.fillStyle = 'rgba(40,38,36,.65)'; ctx.fillRect(x, GY + 14, 26, 8);
      const pa = R(t, A('r_prints'), 0.4);
      if (pa > 0 && k % 4 === 1) { ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + 13, GY + 18, 9, 0, TAU); ctx.stroke(); ctx.restore(); }
      if (pa > 0 && k % 4 === 3) { ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.5; for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(x + 6 + j * 7, GY + 26); ctx.lineTo(x + 6 + j * 7, GY + 10); ctx.stroke(); } ctx.restore(); }
    }
  }
  rover(rx, ry, 0.9, { ang: (rx - rx0) / 14, sun: R(t, A('r_solar'), 0.4) * (1 - R(t, A('r_hop') - 0.2, 0.4)) });
  label('प्रज्ञान रोवर', rx, ry - 90, 110, -110, win(t, A('r_door') + 1.0, A('r_prints') + 0.3, 0.3), '6 पहिए');
  label('पहियों की छाप', rx - 120, GY + 18, -90, 160, win(t, A('r_prints') + 0.3, A('r_laser'), 0.3), 'इसरो लोगो + अशोक स्तंभ');
  // laser
  const la = win(t, A('r_laser'), A('r_solar'), 0.2);
  if (la > 0) { line([[rx + 34, ry - 98], [rx + 120, GY + 30]], `rgba(255,60,60,${la})`, 4, 20); for (let i = 0; i < 10; i++) glowDot(rx + 120 + (rnd(i + Math.floor(t * 20)) - 0.5) * 30, GY + 26 - rnd(i * 3 + Math.floor(t * 20)) * 30, 3, '#ffd2a0', la); }
  screen();
  const sp = R(t, A('r_laser') + 0.6, 0.4) * (1 - R(t, A('r_solar') + 0.3, 0.4));
  panel(1180, 340, 640, 330, sp);
  if (sp > 0) {
    ctx.save(); ctx.globalAlpha = sp;
    const peaks = [[0.12, 0.5], [0.22, 0.3], [0.37, 0.95], [0.5, 0.45], [0.63, 0.7], [0.78, 0.35], [0.9, 0.55]];
    const pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120; let v = 0.04; for (const [p, h] of peaks) v += h * Math.exp(-Math.pow((u - p) / 0.012, 2)); pts.push([1220 + u * 560, 620 - 220 * v * eio((t - A('r_laser') - 0.6) / 1.0)]); }
    line(pts, '#7fd8ff', 3, 10); line([[1220, 622], [1780, 622]], 'rgba(255,255,255,.3)', 2);
    const s = R(t, A('r_sulfur') - 0.1, 0.3); ctx.strokeStyle = `rgba(255,209,102,${s})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(1220 + 0.37 * 560, 620 - 220 * 0.95 - 20, 26, 0, TAU); ctx.stroke(); ctx.restore();
    text('मिट्टी की जाँच (लेज़र)', 1500, 380, { size: 34, a: sp, color: '#c9d6ff' });
    text('S = सल्फ़र ✓', 1220 + 0.37 * 560 + 44, 400, { size: 36, a: R(t, A('r_sulfur') - 0.1, 0.3) * sp, color: '#ffd166', align: 'left' });
  }
  const da = win(t, A('r_day'), A('r_hop') + 0.2, 0.35);
  panel(80, 190, 720, 260, da);
  if (da > 0) {
    ctx.save(); ctx.globalAlpha = da; const u = clamp((t - A('r_day')) / 3.5);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(440, 420, 200, Math.PI, TAU); ctx.stroke();
    glowDot(440 - 200 * Math.cos(Math.PI * u), 420 - 200 * Math.sin(Math.PI * u), 16, '#ffd166'); ctx.restore();
    text('चाँद का <b style="color:#ffd166">1 दिन</b> = पृथ्वी के <b style="color:#7fd8ff">≈ 14 दिन</b>', 440, 400, { size: 40, a: da, cls: 'ttl' });
  }
  text('विक्रम की छोटी छलाँग', 960, 160, { size: 56, cls: 'ttl', a: win(t, A('r_hop') + 0.3, A('s0') + 0.3, 0.3) });
  chapter(t, A('r0'), 5, 'प्रज्ञान का काम');
});

// ---------- CH6: why the south pole
add(A('s0'), A('n0'), (t) => {
  space(t);
  camKeys(t, [[A('s0'), 960, 300, 0.9], [A('s_craters'), 960, 620, 1.35], [A('s_water'), 960, 560, 1.1], [A('n0'), 960, 560, 1.0]]);
  const MX = 960, MY = 260, MR = 520;
  moon(MX, MY, MR, { rot: 0.1 });
  // south-pole shadowed craters
  const cr = [[-170, 470, 70], [-30, 500, 54], [120, 480, 66], [250, 430, 44], [-300, 400, 40]];
  const ca = R(t, A('s_craters'), 0.5);
  cr.forEach(([dx, dy, r], i) => {
    ctx.save(); ctx.globalAlpha = ca; ctx.fillStyle = rad(MX + dx, MY + dy, 0, r, [[0, '#04060d'], [0.8, '#0b1530'], [1, 'rgba(11,21,48,0)']]);
    ctx.beginPath(); ctx.ellipse(MX + dx, MY + dy, r, r * 0.55, 0, 0, TAU); ctx.fill(); ctx.restore();
    const ia = R(t, A('s_ice') + i * 0.2, 0.4);
    for (let k = 0; k < 6; k++) glowDot(MX + dx + (rnd(i * 9 + k) - 0.5) * r, MY + dy + (rnd(i * 9 + k + 4) - 0.5) * r * 0.4, 2.5, '#bfefff', ia * (0.5 + 0.5 * Math.sin(t * 4 + k)));
  });
  label('सूरज की रोशनी कभी नहीं', MX - 170, MY + 470, -140, 140, win(t, A('s_craters') + 0.4, A('s_ice') + 0.2, 0.3));
  label('बर्फ़ (पानी)?', MX + 120, MY + 480, 140, 150, win(t, A('s_ice') + 0.3, A('s_water') + 0.2, 0.3));
  // future base
  const ba = R(t, A('s_home'), 0.6);
  if (ba > 0) {
    ctx.save(); ctx.globalAlpha = ba;
    for (const [dx, s] of [[-80, 1], [40, 0.7], [140, 0.85]]) {
      const x = MX + dx, y = MY + MR - 30 - Math.abs(dx) * 0.05;
      ctx.fillStyle = lin(x, y - 50 * s, x, y, [[0, '#e6edf5'], [1, '#8f98a4']]); ctx.beginPath(); ctx.arc(x, y, 50 * s, Math.PI, TAU); ctx.fill();
      glowDot(x, y - 22 * s, 4, '#ffd166');
    }
    ctx.restore();
  }
  screen();
  const ic = [['पीने का पानी', '#7fd8ff'], ['ऑक्सीजन', '#a8ffc4'], ['रॉकेट ईंधन', '#ffb347']];
  ic.forEach(([w, c], i) => {
    const a = R(t, A('s_water') + 0.6 + i * 0.9, 0.3) * (1 - R(t, A('n0') - 0.3, 0.3));
    text(`<span style="display:inline-block;padding:12px 34px 6px;border-radius:20px;background:rgba(8,14,28,.85);box-shadow:0 0 0 2px ${c}">${w}</span>`, 520 + i * 440, 170, { size: 46, a, scale: eob(a), color: c });
  });
  text('चाँद पर इंसानों के रहने का रास्ता', 960, 860, { size: 60, cls: 'ttl', a: R(t, A('s_home'), 0.5), color: '#ffd166' });
  chapter(t, A('s0'), 6, 'दक्षिणी ध्रुव ही क्यों?');
});

// ---------- END: recap and title
add(A('n0'), END + 1, (t) => {
  space(t);
  camKeys(t, [[A('n0'), 960, 560, 0.9], [END, 960, 540, 1.0]]);
  earth(380, 620, 140, { rot: t * 0.02 });
  moon(1540, 430, 120);
  const draw = clamp((t - A('n0')) / 4);
  for (let i = 0; i < 4; i++) { const ra = 200 + i * 90, a = (ra + 160) / 2, b = Math.sqrt(ra * 160); ellipse(380 + a - 160, 620, a, b, -0.25, 'rgba(127,216,255,.5)', 2.5, { a: R(t, A('n0') + i * 0.3, 0.4) }); }
  const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push([lerp(700, 1440, u), lerp(560, 450, u) - 120 * Math.sin(u * Math.PI)]); }
  ctx.save(); line(pts.slice(0, Math.max(2, Math.round(draw * 80))), '#ffd166', 4, 16); ctx.restore();
  for (let i = 0; i < 3; i++) ellipse(1540, 430, 170 - i * 18, 150 - i * 18, 0, 'rgba(255,209,102,.4)', 2, { a: R(t, A('n0') + 2.5 + i * 0.3, 0.4) });
  screen();
  [['40 दिन का सफ़र', 'n_r1'], ['आख़िरी 15 मिनट', 'n_r2'], ['दक्षिणी ध्रुव पर भारत', 'n_r3']].forEach(([w, k], i) => {
    const a = R(t, A(k), 0.3) * (1 - R(t, A('n_title') - 0.3, 0.4));
    text(`<span style="display:inline-block;padding:12px 32px 6px;border-radius:18px;background:rgba(8,14,28,.82);box-shadow:0 0 0 2px rgba(255,209,102,.5)">${w}</span>`, 480 + i * 480, 160, { size: 46, a, scale: eob(a) });
  });
  const v = R(t, A('n_title'), 0.7);
  ctx.fillStyle = `rgba(2,3,10,${0.4 * v})`; ctx.fillRect(0, 0, W, H);
  text('चंद्रयान-3', 960, 430, { size: 160, cls: 'ttl', a: v, color: '#ffd166', scale: 0.92 + 0.08 * v });
  text('की असली कहानी', 960, 560, { size: 70, cls: 'ttl', a: v });
  tricolor(960, 630, 480 * v, v);
});

await start();
