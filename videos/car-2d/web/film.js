// Lightning hits a car: 2D premium motion-graphics version (night theme), 1080x1920.
import { add, start, A, R, win, eio, eob, lerp, clamp, rnd, ctx, cam, camKeys, screen, text, label, fillRR, lin, rad, line, glowDot, flow, TAU, END, W, H } from './engine.js';

const GOLD = '#ffd166', CYAN = '#7fd8ff', RED = '#ff5a45', GREEN = '#6dff9e';
const big = (html, y, a, size = 104, col = '#fff') => text(`<span style="color:${col};-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.45)">${html}</span>`, W / 2, y, { size, a, cls: 'ttl' });
const chip = (html, y, a) => text(`<span style="padding:12px 30px 8px;border-radius:22px;background:rgba(8,12,22,.86);box-shadow:0 0 0 3px rgba(255,255,255,.16)">${html}</span>`, W / 2, y, { size: 50, a });

// ------------------------------------------------------------------ world
function storm(t, flash = 0) {
  screen();
  ctx.fillStyle = lin(0, 0, 0, H, [[0, '#0a1430'], [0.55, '#14254a'], [1, '#05080f']]); ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 14; i++) {                         // cloud bank
    const x = (rnd(i) * 1400 - 160 + t * 8 * (rnd(i + 3) - 0.5)) , y = 90 + rnd(i + 1) * 260, r = 140 + 160 * rnd(i + 2);
    ctx.fillStyle = rad(x, y, 0, r, [[0, `rgba(60,80,120,${0.55 + 0.4 * flash})`], [1, 'rgba(20,30,60,0)']]); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  if (flash > 0) { ctx.fillStyle = `rgba(190,215,255,${0.55 * flash})`; ctx.fillRect(0, 0, W, H); }
}
function rain(t, a = 1) {
  screen(); ctx.save(); ctx.strokeStyle = `rgba(170,200,240,${0.35 * a})`; ctx.lineWidth = 2;
  for (let i = 0; i < 160; i++) { const x = rnd(i) * 1300 - 100, y = ((rnd(i + 7) * H + t * 1700) % (H + 200)) - 100;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 14, y + 48); ctx.stroke(); }
  ctx.restore();
}
function road(y = 1180) {
  ctx.fillStyle = lin(0, y, 0, y + 400, [[0, '#1a1f2a'], [1, '#07090d']]); ctx.fillRect(-2000, y, 5000, 900);
  ctx.fillStyle = 'rgba(220,210,170,.6)'; for (let x = -1600; x < 3000; x += 220) ctx.fillRect(x, y + 70, 120, 8);
}
// side-view sedan, front to the right. origin = ground under the car centre. o: {soft, xray, shell}
const CAR = { L: 760 };
function shellPath() {        // outline used for the x-ray glow and the current path (relative to car origin, scale 1)
  return [[-380, -60], [-372, -140], [-300, -160], [-220, -170], [-150, -290], [110, -290], [210, -175], [360, -150], [385, -95], [380, -60]];
}
function car(x, y, s = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  // shadow + wet reflection
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(0, 6, 420, 30, 0, 0, TAU); ctx.fill();
  const P = new Path2D(); P.moveTo(-380, -60); P.lineTo(-372, -140); P.quadraticCurveTo(-360, -165, -300, -165); P.lineTo(-215, -172);
  if (o.soft) { P.lineTo(-150, -282); for (let k = 0; k <= 6; k++) P.quadraticCurveTo(-130 + k * 40, -300 + (k % 2) * 14, -110 + k * 40, -290); P.lineTo(110, -290); }
  else { P.quadraticCurveTo(-170, -290, -120, -292); P.lineTo(90, -292); P.quadraticCurveTo(130, -290, 210, -178); }
  P.lineTo(210, -178); P.lineTo(350, -158); P.quadraticCurveTo(388, -150, 388, -100); P.lineTo(384, -60); P.closePath();
  if (!o.xray) {
    ctx.fillStyle = lin(0, -300, 0, -40, [[0, '#e0484e'], [0.5, '#a81f2a'], [1, '#5c0f16']]); ctx.fill(P);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-360, -128); ctx.lineTo(360, -118); ctx.stroke();
  } else { ctx.fillStyle = 'rgba(40,70,110,.35)'; ctx.fill(P); }
  // windows
  const Wn = new Path2D(); Wn.moveTo(-200, -180); Wn.quadraticCurveTo(-165, -270, -120, -272); Wn.lineTo(80, -272); Wn.quadraticCurveTo(110, -270, 180, -182); Wn.closePath();
  ctx.fillStyle = o.soft ? lin(0, -270, 0, -180, [[0, '#2a3040'], [1, '#141820']]) : lin(0, -270, 0, -180, [[0, 'rgba(160,200,240,.55)'], [1, 'rgba(40,60,90,.7)']]); ctx.fill(Wn);
  ctx.fillStyle = o.xray ? 'rgba(10,20,30,.4)' : '#a81f2a'; ctx.fillRect(-30, -275, 16, 95);           // B-pillar
  // driver silhouette
  ctx.fillStyle = '#0c0f16'; ctx.beginPath(); ctx.arc(-60, -232, 26, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-60, -180, 46, 34, 0, Math.PI, 0); ctx.fill();
  // wheels
  for (const wx of [-230, 240]) { ctx.fillStyle = '#0b0b0d'; ctx.beginPath(); ctx.arc(wx, -50, 62, 0, TAU); ctx.fill();
    ctx.fillStyle = lin(wx - 40, -90, wx + 40, -10, [[0, '#e6e9ee'], [1, '#7c8590']]); ctx.beginPath(); ctx.arc(wx, -50, 34, 0, TAU); ctx.fill(); }
  // lights
  glowDot(384, -112, 12, '#fff4d8', 1); glowDot(-378, -120, 10, '#ff3b2a', 0.9);
  if (o.shell) { ctx.strokeStyle = o.shell; ctx.lineWidth = 7; ctx.shadowColor = o.shell; ctx.shadowBlur = 30; ctx.stroke(P); ctx.shadowBlur = 0; }
  ctx.restore();
}
function bolt(x0, y0, x1, y1, seed, a, col = '#e8f1ff', w = 9) {
  if (a <= 0.01) return;
  const pts = [[x0, y0]]; const n = 14;
  for (let i = 1; i < n; i++) { const u = i / n; pts.push([lerp(x0, x1, u) + (rnd(seed + i) - 0.5) * 140 * Math.sin(u * Math.PI), lerp(y0, y1, u)]); }
  pts.push([x1, y1]);
  ctx.save(); ctx.globalAlpha = a;
  line(pts, 'rgba(120,170,255,.6)', w * 3.5, 60); line(pts, col, w, 30);
  for (let b = 0; b < 4; b++) { const k = 2 + Math.floor(rnd(seed + 30 + b) * 8), s = pts[k], bp = [s];
    for (let i = 1; i <= 4; i++) bp.push([s[0] + (rnd(seed + b * 9 + i) - 0.5) * 120 * i, s[1] + 70 * i]); line(bp, col, w * 0.4, 20); }
  ctx.restore();
}
const STRK = [0, 0.09, 0.2, A('inside') + 1.2, A('km') + 0.5, A('km') + 0.62, A('next') + 0.9, A('next') + 1.02, A('next') + 1.14];
const flashAt = (t) => { let f = 0; for (const s of STRK) { const d = t - s; if (d >= 0 && d < 0.4) f = Math.max(f, Math.exp(-d * 12)); } return f; };

// ------------------------------------------------------------------ S1: the strike (hook) + loop end
add(0, A('tyres'), (t) => {
  const f = flashAt(t); storm(t, f);
  camKeys(t, [[0, 540, 1000, 1.0], [A('inside'), 540, 1000, 1.0], [A('inside') + 0.8, 470, 850, 2.1], [A('tyres'), 480, 860, 2.2]]);
  road(); car(540, 1180, 1, {});
  bolt(330, -200, 520, 892, 11, f);
  screen(); rain(t);
  big('अंदर वाला ज़िंदा?', 300, 1 - R(t, A('inside') - 0.15, 0.25), 112, GOLD);
  chip(`<span style="color:${GREEN}">✓</span> एक खरोंच नहीं`, 1150, win(t, A('inside') + 1.0, A('tyres'), 0.25));
});
// ------------------------------------------------------------------ S2: tyres + "wrong"
add(A('tyres'), A('km'), (t) => {
  storm(t, 0); camKeys(t, [[A('tyres'), 760, 1110, 2.4], [A('km'), 780, 1120, 2.6]]);
  road(); car(540, 1180, 1, {});
  screen(); rain(t);
  big('टायर?', 300, 1, 140);
  const x = R(t, A('wrong'), 0.25);
  if (x > 0) { ctx.save(); ctx.globalAlpha = x; ctx.strokeStyle = RED; ctx.lineWidth = 28; ctx.lineCap = 'round'; const c = [W / 2 + 40, 1020], r = 240 * eob(x);
    ctx.beginPath(); ctx.moveTo(c[0] - r, c[1] - r); ctx.lineTo(c[0] + r, c[1] + r); ctx.moveTo(c[0] + r, c[1] - r); ctx.lineTo(c[0] - r, c[1] + r); ctx.stroke(); ctx.restore(); }
  big(`<span style="color:${RED}">रबर</span> ढाल नहीं`, 460, x, 96);
});
// ------------------------------------------------------------------ S3: kilometres of air vs inches of rubber
add(A('km'), A('body'), (t) => {
  const f = flashAt(t); storm(t, f * 0.6); cam(540, 960, 1);
  road(1700); car(540, 1700, 0.28, {});
  bolt(300, 80, 530, 1615, 31, Math.max(f, 0.85), '#e8f1ff', 12);
  screen(); rain(t, 0.6);
  // scale bar: kilometres
  const a = R(t, A('km') + 0.8, 0.4); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = GOLD; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(900, 120); ctx.lineTo(900, 1600); ctx.moveTo(870, 120); ctx.lineTo(930, 120); ctx.moveTo(870, 1600); ctx.lineTo(930, 1600); ctx.stroke(); ctx.restore();
  text(`<span style="color:${GOLD}">कई<br>किलोमीटर</span>`, 900, 860, { size: 56, a, cls: 'ttl' });
  chip(`हवा: कई km &nbsp;·&nbsp; रबर: <span style="color:${RED}">कुछ इंच</span>`, 300, R(t, A('km') + 2.6, 0.4));
});
// ------------------------------------------------------------------ S4: the metal body, the current, the ground
add(A('body'), A('tips'), (t) => {
  storm(t, 0); camKeys(t, [[A('body'), 540, 1020, 1.25], [A('ground'), 540, 1050, 1.3], [A('tips'), 540, 1040, 1.3]]);
  road();
  const xr = R(t, A('body') + 0.2, 0.6);
  car(540, 1180, 1, { xray: xr > 0.5, shell: `rgba(127,216,255,${0.35 + 0.65 * xr})` });
  // safe bubble inside
  const sa = win(t, A('current') + 0.6, A('tips') + 0.3, 0.4);
  if (sa > 0) { ctx.fillStyle = rad(500, 960, 0, 190, [[0, `rgba(109,255,158,${0.35 * sa})`], [1, 'rgba(109,255,158,0)']]); ctx.beginPath(); ctx.arc(500, 960, 190, 0, TAU); ctx.fill(); }
  // current: roof -> front pillar -> hood -> front wheel -> ground, and roof -> back -> rear wheel -> ground
  const fa = win(t, A('current'), A('tips') + 0.2, 0.3);
  if (fa > 0) {
    const toW = (p) => p.map(([x, y]) => [540 + x, 1180 + y]);
    const front = toW([[-20, -292], [90, -292], [210, -178], [350, -158], [300, -60], [240, 12], [240, 40]]);
    const back = toW([[-20, -292], [-120, -292], [-215, -172], [-300, -165], [-280, -60], [-230, 12], [-230, 40]]);
    flow(front, t, '#bfe6ff', { speed: 520, gap: 34, r: 9, a: fa }); flow(back, t + 0.3, '#bfe6ff', { speed: 520, gap: 34, r: 9, a: fa });
    const ga = win(t, A('ground') - 0.2, A('tips') + 0.2, 0.2);
    for (const gx of [780, 310]) for (let i = 0; i < 10; i++) { const e = ((t * 2 + rnd(i + gx)) % 1); glowDot(gx + (rnd(i) - 0.5) * 220 * e, 1222 + 40 * e * rnd(i + 3), 6 * (1 - e) + 2, '#bfe6ff', ga * (1 - e)); }
  }
  label('धातु की बॉडी', 680, 870, -40, -300, win(t, A('body') + 0.5, A('current'), 0.3), 'करंट इसी पर चलता है');
  label('Faraday cage', 600, 888, -190, -300, win(t, A('outer'), A('tips'), 0.3), 'अंदर कोई करंट नहीं');
  screen(); rain(t, 0.6);
  big('धातु की बॉडी', 300, win(t, A('body') + 0.2, A('current'), 0.25), 110, CYAN);
  chip(`<span style="color:${GREEN}">●</span> अंदर सुरक्षित`, 300, win(t, A('current') + 0.8, A('ground'), 0.3));
  chip(`<span style="color:${GOLD}">⚡</span> सीधा ज़मीन में`, 300, win(t, A('ground'), A('tips'), 0.3));
});
// ------------------------------------------------------------------ S5: three tips as cards
function card(i, a, title, draw) {
  if (a <= 0.01) return; const y = 430 + i * 280;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(-60 * (1 - eob(a)), 0);
  fillRR(140, y, 800, 260, 36, 'rgba(10,18,34,.88)'); ctx.strokeStyle = 'rgba(127,216,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(140, y, 800, 260, 36); ctx.stroke();
  draw(290, y + 130); ctx.restore();
  text(`<span style="color:${GOLD}">${i + 1}</span> &nbsp;${title}`, 620, y + 130, { size: 60, a, cls: 'ttl' });
}
add(A('tips'), A('roof'), (t) => {
  storm(t, 0); screen(); rain(t, 0.5);
  card(0, R(t, A('tips') + 0.3, 0.4), 'कार के अंदर', (x, y) => { ctx.save(); ctx.translate(x, y); ctx.scale(0.22, 0.22); ctx.translate(0, 120); car(0, 0, 1, {}); ctx.restore(); });
  card(1, R(t, A('windows'), 0.4), 'खिड़की बंद', (x, y) => { fillRR(x - 70, y - 70, 140, 140, 16, 'rgba(160,200,240,.5)'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.strokeRect(x - 70, y - 70, 140, 140);
    const u = clamp((t - A('windows')) / 0.8); ctx.fillStyle = '#a81f2a'; ctx.fillRect(x - 70, y + 70 - 140 * (1 - u) * 0 - 10, 140, 10); line([[x, y + 50], [x, y - 40 * eio(u)]], GOLD, 8); });
  card(2, R(t, A('windows') + 1.0, 0.4), 'धातु न छुएँ', (x, y) => { ctx.fillStyle = '#e8c9a8'; ctx.beginPath(); ctx.ellipse(x, y + 10, 46, 60, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x - 33 + k * 22, y - 55, 10, 30, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = RED; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(x, y, 90, 0, TAU); ctx.moveTo(x - 64, y - 64); ctx.lineTo(x + 64, y + 64); ctx.stroke(); });
  big('तूफ़ान में', 300, R(t, A('tips'), 0.3), 104);
});
// ------------------------------------------------------------------ S6: soft top -> danger, then back to the hook frame (loop)
add(A('roof'), END, (t) => {
  const f = flashAt(t); storm(t, f);
  const end = t > END - 0.45;
  camKeys(t, [[A('roof'), 540, 1000, 1.15], [A('next'), 540, 960, 1.25], [END - 0.45, 540, 980, 1.2], [END - 0.44, 540, 1000, 1.0]]);
  road(); car(540, 1180, 1, { soft: !end });
  if (!end) {
    const pa = 0.5 + 0.5 * Math.sin(t * 8);
    if (t < A('next') + 0.8) { ctx.fillStyle = `rgba(255,90,69,${0.25 * pa})`; ctx.beginPath(); ctx.ellipse(540, 890, 220, 40, 0, 0, TAU); ctx.fill(); }
    bolt(330, -200, 480, 1000, 77, f, '#ffd9d0');
    if (t > A('next') + 0.9) { screen(); ctx.fillStyle = `rgba(255,60,40,${0.35 * R(t, A('next') + 0.9, 0.2)})`; ctx.fillRect(0, 0, W, H); }
    label('कपड़े / प्लास्टिक की छत', 560, 905, -60, -280, win(t, A('roof') + 0.6, A('next') + 0.6, 0.3), 'धातु का घेरा नहीं');
  }
  screen(); rain(t);
  big('कपड़े की छत?', 300, win(t, A('roof') + 0.2, A('next') + 0.8, 0.25), 104, '#ff8a6b');
  big(`<span style="color:${RED}">ख़तरा!</span>`, 300, win(t, A('next') + 0.9, END - 0.45, 0.15), 150);
  big('अंदर वाला ज़िंदा?', 300, end ? 1 : 0, 112, GOLD);
});
start();
