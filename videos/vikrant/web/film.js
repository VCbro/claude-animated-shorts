// INS Vikrant — 2D documentary (engine: ./engine.js). Language from /out/lang.txt ("hi" | "en").
import { add, start, A, K, R, win, eio, eob, ss, lerp, clamp, rnd, ctx, cam, camKeys, screen, studio, text, label, chapter, panel, line, flow,
         arrow, glowDot, fillRR, rr, lin, rad, TAU, END, W, H, scr, CAM } from './engine.js';
const LANG = await fetch('/out/lang.txt').then((r) => (r.ok ? r.text() : 'hi')).then((s) => s.trim() || 'hi').catch(() => 'hi');
const L = (hi, en) => (LANG === 'en' ? en : hi);
const T = (n) => A(n);

// ================================================================== the sea
const SEA = 720;
function sky(t, mood = 'dusk') {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = { dusk: [['#101a36', 0], ['#3c3f74', 0.45], ['#e07a5f', 0.8], ['#f2b880', 1]], day: [['#3f74b8', 0], ['#7fb0de', 0.6], ['#cfe3f2', 1]], night: [['#03060f', 0], ['#0b1630', 0.7], ['#1b2a4a', 1]] }[mood];
  ctx.fillStyle = lin(0, 0, 0, H * 0.7, g.map(([c, o]) => [o, c])); ctx.fillRect(0, 0, W, H);
  if (mood === 'dusk') { ctx.fillStyle = rad(1400 - CAM.x * 0.05, 640, 0, 520, [[0, 'rgba(255,200,140,.85)'], [0.12, 'rgba(255,190,130,.55)'], [1, 'rgba(255,190,130,0)']]); ctx.fillRect(0, 0, W, H); }
  if (mood === 'night') for (let i = 0; i < 150; i++) { ctx.globalAlpha = 0.3 + 0.7 * rnd(i); ctx.fillStyle = '#fff'; ctx.fillRect(rnd(i + 1) * W, rnd(i + 2) * 640, 2, 2); }
  ctx.globalAlpha = 1; ctx.restore();
}
function sea(t, mood = 'dusk') {
  const top = SEA, c = { dusk: ['#2c3c5c', '#0d1626'], day: ['#2a6fa3', '#0e3557'], night: ['#0b1628', '#03070f'] }[mood];
  ctx.fillStyle = lin(0, top, 0, top + 900, [[0, c[0]], [1, c[1]]]); ctx.fillRect(-3000, top, 9000, 2000);
  for (let i = 0; i < 70; i++) { const y = top + 6 + Math.pow(i / 70, 1.6) * 700, w = 40 + 140 * (i / 70), x = ((rnd(i) * 4800 - t * (20 + i * 2)) % 4800 + 4800) % 4800 - 1500;
    ctx.fillStyle = `rgba(255,${mood === 'dusk' ? 210 : 240},${mood === 'dusk' ? 170 : 255},${0.12 + 0.2 * rnd(i + 5)})`; ctx.fillRect(x, y, w, 2 + i / 25); }
}

// ================================================================== the carrier (side elevation, bow to the right)
// metres -> px with origin at the stern waterline
const CL = 262;
function carrier(x0, y0, s, t, o = {}) {
  const P = (xm, ym) => [x0 + xm * s, y0 - ym * s];
  const hullC = o.sepia ? '#7a6a55' : '#6c7580', deckC = o.sepia ? '#5b4e3e' : '#3c4350';
  ctx.save();
  // hull
  ctx.beginPath(); ctx.moveTo(...P(0, -8)); ctx.lineTo(...P(8, 22)); ctx.lineTo(...P(250, 22)); ctx.lineTo(...P(CL, 26)); ctx.lineTo(...P(CL - 6, 4)); ctx.lineTo(...P(CL - 22, -8)); ctx.closePath();
  ctx.fillStyle = lin(0, y0 - 26 * s, 0, y0 + 8 * s, [[0, hullC], [1, o.sepia ? '#4a3f33' : '#454c57']]); ctx.fill();
  ctx.fillStyle = o.sepia ? '#5a3a30' : '#7a2f2a'; ctx.beginPath(); ctx.moveTo(...P(2, 0)); ctx.lineTo(...P(CL - 14, 0)); ctx.lineTo(...P(CL - 22, -8)); ctx.lineTo(...P(0, -8)); ctx.closePath(); ctx.fill();
  // portholes / hangar band
  ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 40; i++) ctx.fillRect(...P(14 + i * 5.8, 12), 1.6 * s, 1.2 * s);
  if (!o.sepia) { ctx.fillStyle = '#e8ecf0'; ctx.font = `800 ${10 * s}px M`; ctx.fillText('R11', ...P(CL - 46, 8)); }
  // flight deck + ski-jump at the bow
  const ski = o.ski ?? 1;
  ctx.fillStyle = deckC; ctx.beginPath(); ctx.moveTo(...P(-4, 22)); ctx.lineTo(...P(CL - 46, 22)); ctx.lineTo(...P(CL, 22 + 11 * ski)); ctx.lineTo(...P(CL, 25 + 11 * ski)); ctx.lineTo(...P(-4, 25)); ctx.closePath(); ctx.fill();
  if (o.hlSki) { ctx.save(); ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = 30 * o.hlSki; line([P(CL - 46, 25.5), P(CL, 25.5 + 11 * ski)], `rgba(255,207,90,${o.hlSki})`, 6); ctx.restore(); }
  // island
  ctx.fillStyle = hullC; ctx.fillRect(...P(150, 60), 30 * s, 35 * s); ctx.fillRect(...P(160, 78), 14 * s, 18 * s);
  ctx.fillStyle = 'rgba(20,30,40,.8)'; for (let i = 0; i < 4; i++) ctx.fillRect(...P(152 + i * 7, 56), 5 * s, 3 * s);
  line([P(167, 78), P(167, 98)], '#9aa3ae', 2 * s); ctx.save(); ctx.translate(...P(167, 96)); ctx.rotate(t * 2); ctx.fillStyle = '#c9cfd8'; ctx.fillRect(-7 * s, -1 * s, 14 * s, 2 * s); ctx.restore();
  // wake
  if (o.wake !== false) for (let i = 0; i < 18; i++) { const [wx, wy] = P(-10 - i * 14, -2); ctx.fillStyle = `rgba(255,255,255,${0.35 - i * 0.018})`; ctx.beginPath(); ctx.ellipse(wx, wy, 10 * s + i * 2 * s, 2 * s, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  return P;
}
function jet(x, y, s, ang = 0, o = {}) { // generic twin-tail fighter, nose to the right
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  if (o.ab) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const L2 = 40 + 30 * o.ab; ctx.fillStyle = lin(-30, 0, -30 - L2, 0, [[0, 'rgba(255,240,200,.95)'], [0.4, 'rgba(255,150,60,.7)'], [1, 'rgba(255,90,40,0)']]); ctx.beginPath(); ctx.moveTo(-28, -4); ctx.lineTo(-30 - L2, 0); ctx.lineTo(-28, 4); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = o.col || '#8e98a6';
  ctx.beginPath(); ctx.moveTo(42, 0); ctx.quadraticCurveTo(30, -6, 14, -6); ctx.lineTo(-26, -5); ctx.lineTo(-30, 0); ctx.lineTo(-26, 4); ctx.lineTo(16, 4); ctx.quadraticCurveTo(32, 4, 42, 0); ctx.fill();
  ctx.fillStyle = '#6f7887'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-18, 12); ctx.lineTo(-24, 12); ctx.lineTo(-14, 0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-14, -5); ctx.lineTo(-24, -20); ctx.lineTo(-28, -20); ctx.lineTo(-24, -5); ctx.fill();
  ctx.fillStyle = '#1d2a3a'; ctx.beginPath(); ctx.ellipse(20, -6, 8, 3.2, 0, 0, TAU); ctx.fill();
  if (o.hook !== undefined) { line([[-20, 4], [-20 - 10 * Math.cos(o.hook), 4 + 10 * Math.sin(o.hook)]], o.hookCol || '#ffcf5a', 2); }
  ctx.restore();
}
function speedHud(t, v, secs, a, ttl) {
  if (a <= 0.01) return;
  panel(1430, 70, 420, 230, a, 'rgba(6,12,24,.85)');
  text(ttl || L('रफ़्तार', 'SPEED'), 1640, 112, { size: 26, a, color: '#9fc3e6' });
  text(`<span class="big" style="color:${v > 30 ? '#ffcf5a' : '#7dffb0'}">${Math.round(v)}</span> km/h`, 1640, 185, { size: 70, a });
  if (secs !== null) text(`⏱ <span class="big">${secs.toFixed(1)}</span> s`, 1640, 262, { size: 40, a, color: '#ff8f7f' });
}
function chip(html, x, y, a, o = {}) { text(`<span style="display:inline-block;padding:12px 32px 6px;border-radius:16px;background:rgba(8,14,28,.82);box-shadow:0 0 0 2px ${o.ring || 'rgba(255,207,90,.55)'}">${html}</span>`, x, y, { size: o.size || 44, a, scale: eob(clamp(a)) }); }
function bigNum(v, unit, x, y, a, col = '#ffcf5a', size = 130) { text(`<span class="big" style="color:${col}">${v}</span> <span style="font-size:.42em">${unit}</span>`, x, y, { size, a, cls: 'ttl' }); }
const fmt = (n) => Math.round(n).toLocaleString('en-IN');

// ================================================================== SCENES
// ---------- hook: a jet comes in, stops in ~3 s
add(0, T('h_go'), (t) => {
  sky(t, 'dusk');
  camKeys(t, [[0, 960, 560, 1.0], [T('h_stop'), 1000, 600, 1.15], [T('h_this'), 960, 560, 0.95], [T('h_city'), 960, 600, 0.9], [T('h_go'), 960, 560, 1.0]]);
  sea(t, 'dusk');
  const P = carrier(150, SEA + 30, 6, t);
  // approach and trap
  const ta = T('h_stop') - 1.6, tl = T('h_stop'), te = tl + 3.0;
  let jx, jy, ang = 0.06, v;
  if (t < tl) { const u = clamp((t - 0.3) / (tl - 0.3)); jx = lerp(-300, P(40, 0)[0], u); jy = lerp(260, P(0, 27)[1], eio(u)); v = 250; }
  else { const u = clamp((t - tl) / 3.0); const d = 1 - Math.pow(1 - u, 3); [jx, jy] = P(40 + 90 * d, 27); ang = 0; v = 250 * (1 - u) ** 1.8; }
  jet(jx, jy, 1.6, ang, { hook: 0.9, ab: t < tl ? 0.3 : 0 });
  if (t > tl) { const [wx, wy] = P(46, 25.5); line([[wx, wy], [jx - 30, jy + 10]], 'rgba(255,207,90,.9)', 3, 10); }
  screen();
  speedHud(t, v, t > tl ? Math.min(3, t - tl) : 0, win(t, T('h_speed'), T('h_this') + 0.5, 0.4));
  const ttl = win(t, T('h_this'), T('h_city') + 0.6, 0.5);
  text('INS विक्रांत'.replace('विक्रांत', L('विक्रांत', 'VIKRANT')), 960, 170, { size: 140, cls: 'ttl', a: ttl, scale: 0.94 + 0.06 * ttl });
  chip(L('भारत में डिज़ाइन · भारत में बना', 'Designed in India · Built in India'), 960, 290, ttl, { ring: 'rgba(255,153,51,.7)' });
  bigNum('262', L('मीटर', 'metres'), 960, 200, win(t, T('h_city'), T('h_how'), 0.4));
  text(L('इतने छोटे रनवे से <span style="color:#ffcf5a">उड़ान? लैंडिंग?</span>', 'Take off and land on <span style="color:#ffcf5a">such a short runway?</span>'), 960, 200, { size: 64, cls: 'ttl', a: win(t, T('h_how'), T('h_go') + 0.2, 0.4) });
});
add(T('h_go'), T('c1'), (t) => {
  sky(t, 'dusk'); cam(960, 560, 1.0); sea(t, 'dusk'); carrier(150, SEA + 30, 6, t);
  screen(); const v = R(t, T('h_go') + 0.2, 0.7); ctx.fillStyle = `rgba(4,6,14,${0.4 * v})`; ctx.fillRect(0, 0, W, H);
  text(`<span class="chap" style="font-size:34px">${L('एक डॉक्यूमेंट्री', 'A DOCUMENTARY')}</span>`, 960, 380, { size: 34, a: v });
  text(L('INS विक्रांत', 'INS VIKRANT'), 960, 490, { size: 150, cls: 'ttl', a: v, color: '#ffcf5a', scale: 0.93 + 0.07 * v });
  text(L('समंदर पर तैरता शहर', 'A City Floating on the Sea'), 960, 615, { size: 62, cls: 'ttl', a: v });
});

// ---------- ch1: the name that came back
add(T('c1'), T('c2'), (t) => {
  const old = t < T('c1_2022') - 0.3;
  sky(t, old ? 'day' : 'dusk'); cam(960, 560, 1.0); sea(t, old ? 'day' : 'dusk');
  if (old) {
    carrier(300, SEA + 30, 4.8, t, { sepia: true, ski: 0 });
    screen(); ctx.fillStyle = 'rgba(112,80,40,.35)'; ctx.fillRect(0, 0, W, H);
    chip(L('पहला विक्रांत', 'The first Vikrant'), 960, 170, R(t, T('c1_old'), 0.4), { ring: 'rgba(230,200,150,.6)' });
    bigNum('1971', '', 960, 300, win(t, T('c1_1971'), T('c1_retire') + 0.3, 0.4), '#f3e3c3', 150);
    text(L('रिटायर', 'Retired'), 960, 300, { size: 90, cls: 'ttl', a: R(t, T('c1_retire'), 0.5), color: '#d9c7a3' });
  } else {
    const P = carrier(150, SEA + 30, 6, t);
    screen();
    bigNum('2022', '', 960, 180, R(t, T('c1_2022'), 0.5), '#ffcf5a', 150);
    label(L('कोचीन शिपयार्ड', 'Cochin Shipyard'), ...P(130, 20), -120, -150, win(t, T('c1_cochin'), T('c1_club') + 0.3, 0.4), L('डिज़ाइन: भारतीय नौसेना', 'Design: Indian Navy'));
    chip(L('भारत: अपना विमानवाहक पोत <b style="color:#ffcf5a">ख़ुद डिज़ाइन + निर्माण</b>', 'India: designs <b style="color:#ffcf5a">and builds</b> its own carrier'), 960, 300, R(t, T('c1_club'), 0.5), { ring: 'rgba(255,153,51,.7)' });
  }
  chapter(t, T('c1'), 1, L('एक नाम, जो लौट आया', 'A name that came back'));
});

// ---------- ch2: a city on the sea (cutaway)
const ZONES = [ // [x0,x1,y0,y1 in metres, name hi, name en, anchor]
  [60, 110, 2, 12, 'रसोई', 'Galley', 'c2_kitchen', '#ffb347'], [120, 160, 2, 12, 'अस्पताल', 'Hospital', 'c2_hosp', '#ff6b6b'], [20, 60, -6, 4, 'इंजन रूम', 'Engine room', 'c2_turb', '#59d6ff']];
add(T('c2'), T('c3'), (t) => {
  studio('#0b1630', '#04070f', 'rgba(80,140,255,.12)');
  camKeys(t, [[T('c2'), 960, 520, 0.9], [T('c2_rooms'), 1000, 600, 1.15], [T('c2_power'), 960, 560, 0.9], [T('c3'), 960, 560, 0.9]]);
  const s = 6, x0 = 170, y0 = 700;
  const P = (xm, ym) => [x0 + xm * s, y0 - ym * s];
  // football fields comparison
  const ff = win(t, T('c2_fields'), T('c2_weight') + 0.6, 0.4);
  if (ff > 0) { ctx.save(); ctx.globalAlpha = ff; for (let k = 0; k < 2; k++) { const [a, b] = P(k * 115 + 5, 70), [c] = P(k * 115 + 110, 0); fillRR(a, b, c - a, 70 * s * 0.55, 10, 'rgba(60,170,90,.75)'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(a + 10, b + 10, c - a - 20, 70 * s * 0.55 - 20); line([[(a + c) / 2, b + 10], [(a + c) / 2, b + 70 * s * 0.55 - 10]], '#fff', 3); } ctx.restore(); }
  // cutaway hull with deck grid
  carrier(x0, y0, s, t, { wake: false });
  const cut = R(t, T('c2_rooms') - 0.6, 0.8);
  if (cut > 0) {
    ctx.save(); ctx.globalAlpha = cut;
    ctx.beginPath(); ctx.moveTo(...P(8, 21)); ctx.lineTo(...P(250, 21)); ctx.lineTo(...P(CL - 22, -7)); ctx.lineTo(...P(2, -7)); ctx.closePath(); ctx.fillStyle = '#121a2a'; ctx.fill();
    for (let d = 0; d < 6; d++) { const ym = -6 + d * 4.6; line([P(4, ym), P(246, ym)], 'rgba(150,180,220,.35)', 2); }
    for (let i = 0; i < 60; i++) { const xm = 6 + i * 4; line([P(xm, -6), P(xm, 21)], 'rgba(150,180,220,.12)', 1.5); }
    // rooms lighting up
    const lit = clamp((t - T('c2_rooms')) / 2.0);
    for (let i = 0; i < 240; i++) { if (rnd(i) > lit) continue; const xm = 6 + (i % 60) * 4, ym = -6 + Math.floor(i / 60) * 4.6; const [a, b] = P(xm + 0.4, ym + 4.2), [c, d] = P(xm + 3.6, ym + 0.4); ctx.fillStyle = `rgba(255,${200 + 40 * rnd(i + 1)},140,${0.25 + 0.35 * rnd(i + 2)})`; ctx.fillRect(a, b, c - a, d - b); }
    // people dots walking the corridors
    const pa = R(t, T('c2_people'), 0.5);
    for (let i = 0; i < 60; i++) { const ym = -6 + (i % 5) * 4.6 + 0.8, xm = 6 + ((rnd(i) * 240 + t * (4 + 6 * rnd(i + 1)) * (i % 2 ? 1 : -1)) % 240 + 240) % 240; glowDot(...P(xm, ym), 3, '#7fd8ff', pa); }
    ZONES.forEach(([a0, a1, b0, b1, nh, ne, k, c]) => { const z = win(t, T(k), T(k) + 4.5, 0.4); if (z <= 0) return; const [x1, y1] = P(a0, b1), [x2, y2] = P(a1, b0); ctx.save(); ctx.globalAlpha = z; ctx.shadowColor = c; ctx.shadowBlur = 30; ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.strokeRect(x1, y1, x2 - x1, y2 - y1); ctx.fillStyle = c + '44'; ctx.fillRect(x1, y1, x2 - x1, y2 - y1); ctx.restore(); label(L(nh, ne), (x1 + x2) / 2, y1, 60, -140, z); });
    ctx.restore();
  }
  // a small town lighting up (power)
  const pw = win(t, T('c2_power'), T('c2_turb') + 0.3, 0.4);
  if (pw > 0) for (let i = 0; i < 18; i++) { const x = 1450 + i * 26, h = 40 + 80 * rnd(i); ctx.save(); ctx.globalAlpha = pw; ctx.fillStyle = '#1a2233'; ctx.fillRect(x, 980 - h, 22, h); for (let k = 0; k < 6; k++) if (rnd(i * 7 + k) < clamp((t - T('c2_power')) / 1.5)) { ctx.fillStyle = '#ffd27a'; ctx.fillRect(x + 4 + (k % 2) * 8, 980 - h + 8 + Math.floor(k / 2) * 18, 6, 8); } ctx.restore(); }
  screen();
  bigNum('2', L('फ़ुटबॉल मैदान', 'football fields'), 960, 140, ff, '#7dffb0', 110);
  bigNum(fmt(45000 * eio((t - T('c2_weight')) / 1.3)), L('टन', 'tonnes'), 960, 140, win(t, T('c2_weight'), T('c2_rooms') + 0.2, 0.3) * (1 - ff * 0), '#ffcf5a', 120);
  bigNum(`${fmt(2000 * eio((t - T('c2_rooms')) / 1.3))}+`, L('कमरे', 'compartments'), 960, 140, win(t, T('c2_rooms'), T('c2_people'), 0.3), '#ffcf5a', 120);
  bigNum(`~${fmt(1600 * eio((t - T('c2_people')) / 1.3))}`, L('लोग', 'people'), 960, 140, win(t, T('c2_people'), T('c2_kitchen') + 0.3, 0.3), '#7fd8ff', 120);
  chip(L('इतनी बिजली, कि एक छोटा शहर रोशन हो', 'Enough power to light a small town'), 960, 140, win(t, T('c2_power'), T('c2_turb'), 0.4));
  chip(L('4 गैस टर्बाइन · <b style="color:#ffcf5a">30+ km/h</b>', '4 gas turbines · <b style="color:#ffcf5a">30+ km/h</b>'), 960, 140, win(t, T('c2_turb'), T('c2_steel'), 0.4), { ring: 'rgba(89,214,255,.6)' });
  chip(L('ख़ास स्टील · <b style="color:#ff9933">भारत में विकसित</b>', 'Special steel · <b style="color:#ff9933">developed in India</b>'), 960, 140, R(t, T('c2_steel'), 0.4), { ring: 'rgba(255,153,51,.7)' });
  chapter(t, T('c2'), 2, L('समंदर पर तैरता शहर', 'A city on the sea'));
});

// ---------- ch3: ski-jump take-off
add(T('c3'), T('c4'), (t) => {
  sky(t, 'day');
  camKeys(t, [[T('c3'), 960, 560, 0.85], [T('c3_ramp'), 1500, 520, 1.6], [T('c3_hold'), 1400, 540, 1.6], [T('c3_go') + 0.8, 1550, 480, 1.3], [T('c4'), 1500, 500, 1.2]]);
  sea(t, 'day');
  const P = carrier(150, SEA + 30, 6, t, { hlSki: win(t, T('c3_ramp'), T('c3_hold') + 0.5, 0.4) });
  // land runway comparison
  const lr = win(t, T('c3_land'), T('c3_ramp'), 0.4);
  if (lr > 0) { ctx.save(); ctx.globalAlpha = lr; fillRR(-500, 300, 2900, 60, 8, '#3a3f48'); for (let i = 0; i < 40; i++) ctx.fillStyle = '#fff', ctx.fillRect(-480 + i * 72, 326, 40, 8); ctx.restore(); }
  // take-off run: from a held position to off the ramp and climbing
  const hold = T('c3_hold'), go = T('c3_go');
  let jx, jy, ang = 0, ab = 0;
  const startM = CL - 150;
  if (t < go) { [jx, jy] = P(startM, 28); ab = R(t, hold + 0.4, 1.2); jx += (rnd(Math.floor(t * 30)) - 0.5) * 2 * ab; }
  else {
    const u = (t - go);
    if (u < 2.2) { const d = Math.pow(u / 2.2, 2); const xm = lerp(startM, CL, d); const ym = xm > CL - 46 ? 28 + 11 * (xm - (CL - 46)) / 46 : 28; [jx, jy] = P(xm, ym); ang = xm > CL - 46 ? -0.24 : 0; ab = 1; }
    else { const v = u - 2.2; [jx, jy] = P(CL + v * 60, 39 + v * 22 + v * v * 4); ang = -0.3 + v * 0.04; ab = 1; }
  }
  if (t > go - 0.2) { const pts = []; for (let k = 0; k <= 30; k++) { const v = k / 30 * 4; pts.push(P(CL + v * 60, 39 + v * 22 + v * v * 4)); } ctx.save(); ctx.globalAlpha = win(t, T('c3_lift'), T('c4') + 0.3, 0.4); line(pts, '#ffcf5a', 4, 14, [12, 10]); ctx.restore(); }
  jet(jx, jy, 1.6, ang, { ab });
  if (t < go) { const [cx, cy] = P(startM - 6, 26); ctx.save(); ctx.globalAlpha = win(t, hold, go + 0.2, 0.3); fillRR(cx - 6, cy - 4, 12, 8, 2, '#ffcf5a'); ctx.restore(); }
  label(L('स्की-जंप', 'Ski-jump'), ...P(CL - 20, 31), 80, -140, win(t, T('c3_ramp'), T('c3_hold') + 0.3, 0.4), L('ऊपर की ओर मुड़ा रनवे', 'runway curving upward'));
  label(L('विमान को रोककर रखा', 'Jet held in place'), ...P(startM - 6, 28), -80, -150, win(t, hold, go + 0.3, 0.4), L('इंजन → पूरी ताक़त', 'engine → full power'));
  label(L('ऊपर की ओर उछाल', 'Upward throw'), ...P(CL + 120, 39 + 2 * 22 + 16), 100, -100, win(t, T('c3_lift'), T('c4') + 0.3, 0.4), L('पंख हवा पकड़ते हैं', 'wings grip the air'));
  screen();
  text(L('ज़मीन पर: <span style="color:#ffcf5a">लंबा रनवे</span>', 'On land: <span style="color:#ffcf5a">a long runway</span>'), 960, 160, { size: 60, cls: 'ttl', a: win(t, T('c3_land'), T('c3_space'), 0.4) });
  text(L('जहाज़ पर: <span style="color:#ff8f7f">जगह कम</span>', 'On a ship: <span style="color:#ff8f7f">not enough space</span>'), 960, 160, { size: 60, cls: 'ttl', a: win(t, T('c3_space'), T('c3_ramp'), 0.4) });
  chapter(t, T('c3'), 3, L('स्की-जंप से उड़ान', 'Ski-jump take-off'));
});

// ---------- ch4: the arrested landing
add(T('c4'), T('c5'), (t) => {
  sky(t, 'dusk');
  camKeys(t, [[T('c4'), 960, 560, 0.85], [T('c4_hook'), 520, 600, 1.6], [T('c4_wires'), 640, 620, 1.5], [T('c4_snag'), 760, 610, 1.4], [T('c4_bolter'), 900, 560, 1.05], [T('c5'), 960, 560, 1.0]]);
  sea(t, 'dusk');
  const P = carrier(150, SEA + 30, 6, t);
  const WIRES = [42, 52, 62, 72];
  const wa = R(t, T('c4_wires'), 0.5);
  WIRES.forEach((xm, i) => { const [x, y] = P(xm, 25.4); ctx.save(); ctx.globalAlpha = 0.4 + 0.6 * wa; ctx.shadowColor = '#ffcf5a'; ctx.shadowBlur = 20 * wa; fillRR(x - 5, y - 4, 10, 6, 2, '#ffcf5a'); ctx.restore(); });
  // approach -> trap (at snag) -> stop; then a bolter demo
  const snag = T('c4_snag'), bol = T('c4_bolter');
  let jx, jy, ang = 0.07, v = 250, hookCol = '#ffcf5a';
  if (t < snag) { const u = clamp((t - T('c4')) / (snag - T('c4'))); const a = P(-40, 80), b = P(50, 27.5); jx = lerp(a[0], b[0], eio(u)); jy = lerp(a[1], b[1], eio(u)); }
  else if (t < bol - 0.2) { const u = clamp((t - snag) / 3.0); const d = 1 - Math.pow(1 - u, 3); [jx, jy] = P(52 + 78 * d, 27.5); ang = 0; v = 250 * (1 - u) ** 1.8;
    const [wx, wy] = P(52, 25.4); line([[wx, wy - 4], [jx - 34, jy + 12]], '#ffcf5a', 3, 14); line([[wx, wy], [wx, wy + 60 + 80 * d]], 'rgba(255,207,90,.6)', 3); }
  else { const u = t - bol; const [a0, a1] = P(30 + u * 40, 27.5 + Math.max(0, u - 1.2) * 18); jx = a0; jy = a1; ang = u > 1.2 ? -0.18 : 0; hookCol = '#ff6b5b'; v = 250; }
  jet(jx, jy, 1.6, ang, { hook: 0.9, hookCol, ab: t > bol ? 1 : 0 });
  // glide slope
  ctx.save(); ctx.globalAlpha = win(t, T('c4'), T('c4_hook') + 0.5, 0.4); line([P(-60, 92), P(50, 27.5)], '#7fd8ff', 3, 10, [12, 10]); ctx.restore();
  label(L('टेलहुक', 'Tailhook'), jx - 30 * 1.6, jy + 12, -80, 150, win(t, T('c4_hook'), T('c4_wires') + 0.3, 0.4));
  label(L('अरेस्टर वायर', 'Arrestor wires'), ...P(57, 25.4), 60, -150, win(t, T('c4_wires'), T('c4_snag') + 0.3, 0.4), L('डेक के आर-पार', 'across the deck'));
  label(L('नीचे की मशीनें', 'Machines below deck'), ...P(52, 12), 80, 140, win(t, snag + 0.4, T('c4_stop') + 1.0, 0.4), L('खिंचाव को धीरे-धीरे रोकती हैं', 'absorb the pull, little by little'));
  screen();
  speedHud(t, v, t > snag && t < bol ? Math.min(3, t - snag) : null, win(t, snag - 0.3, bol - 0.2, 0.3));
  chip(L('<span style="color:#ff8f7f">तार छूटा?</span> → फिर पूरी ताक़त, दोबारा उड़ान', '<span style="color:#ff8f7f">Missed the wires?</span> → full power, go around'), 960, 170, R(t, bol + 0.3, 0.4), { ring: 'rgba(255,107,91,.7)' });
  text(L('ढाई सौ से ज़ीरो… <span style="color:#7dffb0">लगभग 3 सेकंड</span>', '250 to zero… <span style="color:#7dffb0">in about 3 seconds</span>'), 960, 170, { size: 60, cls: 'ttl', a: win(t, T('c4_stop'), bol, 0.4) });
  chapter(t, T('c4'), 4, L('तीन सेकंड का जादू', 'The three-second miracle'));
});

// ---------- ch5: guardian of the seas (top view, radar)
add(T('c5'), T('n0'), (t) => {
  studio('#06182c', '#020810', 'rgba(60,140,220,.15)'); cam(960, 540, 1.0);
  ctx.save(); ctx.translate(960, 560); ctx.rotate(-0.12);
  // deck top view
  ctx.fillStyle = '#3c4350'; ctx.beginPath(); ctx.moveTo(-640, -70); ctx.lineTo(520, -90); ctx.quadraticCurveTo(660, -40, 680, 0); ctx.quadraticCurveTo(660, 40, 520, 90); ctx.lineTo(-640, 110); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6c7580'; ctx.fillRect(40, 90, 90, 40);
  line([[-640, 20], [520, -10]], 'rgba(255,255,255,.4)', 3, 0, [20, 16]);
  const n = Math.round(30 * clamp((t - T('c5_30')) / 2.5));
  for (let i = 0; i < n; i++) { const x = -560 + (i % 10) * 100, y = -50 + Math.floor(i / 10) * 55; ctx.save(); ctx.translate(x, y); ctx.rotate(0.6); ctx.fillStyle = i < 22 ? '#9aa3ae' : '#c9cfd8'; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(-14, -16); ctx.lineTo(-10, 0); ctx.lineTo(-14, 16); ctx.closePath(); ctx.fill(); ctx.restore(); }
  ctx.restore();
  // radar rings
  const ra = R(t, T('c5_eyes'), 0.5);
  if (ra > 0) for (let k = 1; k <= 4; k++) { ctx.save(); ctx.globalAlpha = ra * (0.5 - k * 0.08); ctx.strokeStyle = '#59d6ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(960, 560, k * 220 + ((t * 80) % 220), 0, TAU); ctx.stroke(); ctx.restore(); }
  screen();
  bigNum(`~${n}`, L('विमान + हेलीकॉप्टर', 'jets + helicopters'), 960, 160, win(t, T('c5_30'), T('c5_base') + 0.3, 0.4), '#ffcf5a', 120);
  chip(L('जहाँ जाए, साथ में <b style="color:#ffcf5a">पूरा हवाई अड्डा</b>', 'Wherever it goes, <b style="color:#ffcf5a">a whole airbase</b> goes too'), 960, 160, win(t, T('c5_base'), T('c5_eyes') + 0.2, 0.4));
  chapter(t, T('c5'), 5, L('समंदर का पहरेदार', 'Guardian of the seas'));
});

// ---------- end
add(T('n0'), END + 1, (t) => {
  sky(t, 'dusk'); camKeys(t, [[T('n0'), 1000, 600, 1.15], [T('n_title'), 960, 560, 0.92], [END, 960, 560, 0.88]]); sea(t, 'dusk'); carrier(150, SEA + 30, 6, t);
  for (let i = 0; i < 3; i++) { const u = (t - T('n_guard') - i * 0.4) * 300; if (u < 0) continue; jet(-200 + u, 300 + i * 40, 1.2, -0.03, { ab: 0.5 }); }
  screen(); const v = R(t, T('n_title'), 0.8);
  ctx.fillStyle = `rgba(4,6,14,${0.3 * v})`; ctx.fillRect(0, 0, W, H);
  text(L('INS विक्रांत', 'INS VIKRANT'), 960, 420, { size: 160, cls: 'ttl', a: v, color: '#ffcf5a', scale: 0.93 + 0.07 * v });
  text(L('समंदर पर भारत', 'India on the sea'), 960, 550, { size: 70, cls: 'ttl', a: v });
  ctx.save(); ctx.globalAlpha = v; const w = 520 * v; fillRR(960 - w / 2, 610, w / 3, 10, 4, '#ff9933'); ctx.fillStyle = '#fff'; ctx.fillRect(960 - w / 6, 610, w / 3, 10); fillRR(960 + w / 6, 610, w / 3, 10, 4, '#138808'); ctx.restore();
  chip(L('सबसे हैरान करने वाली बात? <b style="color:#ffcf5a">कमेंट करें</b>', 'What surprised you most? <b style="color:#ffcf5a">Comment below</b>'), 960, 760, R(t, T('n_cta'), 0.5), { size: 38 });
});

await start();
