// =====================================================================
//  SCENES — a short history of the internet. Every era draws inside lowres(ERA_RES[e]) in its own pixels;
//  layout is written in world px (1080x1920) and converted with px()/py(), so things keep their screen place
//  while each era gains resolution. TT steps on 2s.
// =====================================================================
const Q = PAL16;
const GREEN = HANDHELD;
const AMBER = ['#1a0e04', '#5c3610', '#c47e22', '#f8cc66'];
const P8 = [PAL16.ink, PAL16.night, PAL16.slate, PAL16.grey, PAL16.white, PAL16.blue, PAL16.sky, PAL16.yellow, PAL16.orange, PAL16.red, PAL16.green, PAL16.lime];
const P12 = [...P8, PAL16.brown, PAL16.pink, PAL16.purple, PAL16.ice];
const ERA_PAL = [GREEN, AMBER, P8, P12, PAL16, PAL16, PAL16, PAL16];
let S = 20, EW = 54, EH = 96;                       // the current era's pixel size and resolution
const px = (x) => Math.round(x / S), pw = (v) => Math.max(1, Math.round(v / S));
const beatN = () => Math.floor(TT / BEAT + 1e-6);
const blinkOn = (k, n = 6, on = 3) => (B + k) % n < on;
const HERO_AMBER = { ink: AMBER[0], body: AMBER[2], light: AMBER[3], dark: AMBER[1], eye: AMBER[3], pupil: AMBER[0] };
const HERO_OF = [HERO_HH, HERO_AMBER, HERO_PAL, HERO_PAL, HERO_PAL, HERO_PAL, HERO_PAL, HERO_PAL];
const HERO_AT = [880, 1300];

// ---- shared bits
function yearCounter(e, fg, bg) {
  const t0 = ERA_T[e], u = clamp((TT - t0 - 0.1) / 0.6), sc = Math.max(1, Math.round(EW / 72));
  let label = YEARS[e];
  if (e > 0 && e < 7 && u < 1) label = String(Math.round(lerp(+YEARS[e - 1], +YEARS[e], Math.floor(u * 8) / 8)));
  if (e === 7 && u < 1) label = String(Math.round(lerp(2007, 2026, Math.floor(u * 8) / 8)));
  const tw = pixTextW(label, sc), x = px(CX) - Math.floor(tw / 2), y = px(300);
  pixBox(x - 2 * sc, y - 2 * sc, tw + 4 * sc, 11 * sc, { bg, edge: fg });
  pixText(label, x, y, fg, { scale: sc });
}
function hero(e, o = {}) {
  const r = Math.max(3, Math.round(EW * 0.055));
  const hx = e === 1 ? 520 : HERO_AT[0];   // 1971: between the two cabinets
  return pixHero(px(hx), px(HERO_AT[1]) - r, r, { pal: HERO_OF[e], key: 'hero', ...o });
}
function floor(c, y = 1390) { prect(0, px(y), EW, EH - px(y), c); }
// a caption at the era's resolution, but never coarser than 90x160 (so a word fits on a 20 px era)
function cap(str, e, fg, bg, edge, at = 0.5) {
  pixCaption(str, { fg, bg, edge, y: 1480, at, res: EW < 90 ? [90, 160] : EW > 135 ? [135, 240] : [EW, EH] });
}
// a dithered night sky of the era's own colours, with stars that blink
function sky(c0, c1, star, n = 20, k = 'sky') {
  pgrad(0, 0, EW, EH, [c0, c0, c1]);
  for (let i = 0; i < n; i++) { const R = RNG(k, i), x = R.i(1, EW - 2), y = R.i(1, Math.round(EH * 0.7)); if ((B + i * 5) % 11 > 2) pset(x, y, star); }
}

// ---- 1969: UCLA's teletype sends L, O to a screen at Stanford; the screen crashes (green phosphor, 54x96)
function era1969() {
  const [g0, g1, g2, g3] = GREEN, cu = CU;
  pfill(g0);
  for (let y = 0; y < EH; y += 4) prect(0, y, EW, 1, g1);                         // phosphor raster lines
  // the receiving screen (Stanford): a big CRT, the letters arrive big
  const sx = px(240), sy = px(520), sw = px(840) - sx, sh = px(960) - sy;
  pixBox(sx - 2, sy - 2, sw + 4, sh + 4, { bg: g1, edge: g2 });
  prect(sx, sy, sw, sh, g0);
  const crashed = TT >= cu.crash, glitch = crashed && TT < cu.crash + 0.6;
  if (glitch) for (let i = 0; i < 18; i++) { const R = RNG('gl', i, B); prect(sx + R.i(0, sw - 4), sy + R.i(0, sh - 2), R.i(2, 8), 1, R.f() < 0.5 ? g2 : g3); }
  const nL = TT >= cu.letL + 0.35, nO = TT >= cu.letO + 0.35;
  if (nL) pixText('L', 16, 33, crashed ? g2 : g3, { scale: 2 });
  if (nO) pixText('O', 28, 33, crashed ? g2 : g3, { scale: 2 });
  if (!crashed && TT >= cu.letL + 0.35 && B % 4 < 2) prect(nO ? 40 : 28, 33, 3, 14, g2);    // a block cursor waiting for the G
  // the sending teletype (UCLA): paper with LOGIN typed on it, a wire up to the screen
  const ty = px(1130);
  prect(2, ty, 30, 9, g3); prect(2, ty + 9, 30, 6, g1); prect(3, ty + 10, 28, 1, g2);
  const typed = Math.floor(clamp((TT - cu.login + 0.1) / 0.6) * 5 + 1e-6);
  pixText('LOGIN', 3, ty + 1, g0, { count: typed });
  pline(28, ty - 1, 28, sy + sh, g1);
  [[cu.letL], [cu.letO]].forEach(([t0]) => {   // each letter travels up the wire as a bright pixel
    const u = (TT - t0) / 0.35; if (u > 0 && u < 1) prect(27, Math.round(lerp(ty - 1, sy + sh, u)) - 1, 3, 3, g3);
  });
  hero(0, { look: TT < cu.letL ? [0, 0] : [-1, -1], mood: crashed ? 'wow' : 'smile', hop: crashed && TT < cu.crash + 0.5 ? 2 : 0 });
  yearCounter(0, g3, g0);
  cap(TT < cu.crash ? 'TO STANFORD' : 'LO... CRASH', 0, g3, g0, g2, 0.6);
}

// ---- 1971: two machines, a message hops between them, the @ (amber, 72x128)
function era1971() {
  const [a0, a1, a2, a3] = AMBER, cu = CU;
  pfill(a0);
  for (let y = 0; y < EH; y += 4) prect(0, y, EW, 1, a1);
  floor(a1, 1340);
  // two tall cabinets with tape reels and blinking lamps
  [[100, 'L'], [640, 'R']].forEach(([x0], k) => {
    const x = px(x0), y = px(1000), w = px(300), h = px(1340) - y;
    prect(x, y, w, h, a1); prect(x, y, w, 1, a2); prect(x, y, 1, h, a2);
    for (const rx of [0.3, 0.7]) { const cx = x + Math.round(w * rx), cy = y + 6; pcircle(cx, cy, 3, a0); pcircle(cx, cy, 3, a2, { ring: 1 }); const sp = (beatN() + k) % 2; pset(cx + (sp ? 1 : -1), cy, a3); }
    for (let i = 0; i < 6; i++) if (blinkOn(i * 3 + k * 7, 5, 2)) pset(x + 2 + i * 3, y + 13, a3); else pset(x + 2 + i * 3, y + 13, a0);
    prect(x + 2, y + 16, w - 4, 3, a0);
  });
  // the cable between them, and the message hopping across it (an envelope)
  const cy = px(1180), xa = px(400), xb = px(640);
  pline(xa, cy, xb, cy, a2);
  const u = clamp((TT - cu.email) / 0.8);
  if (u > 0 && u < 1) { const ex = Math.round(lerp(xa, xb - 7, u)), ey = cy - 6 - Math.round(4 * Math.sin(Math.PI * u)); prect(ex, ey, 7, 5, a3); pline(ex, ey, ex + 3, ey + 2, a1); pline(ex + 6, ey, ex + 3, ey + 2, a1); }
  // the big @ (born from the O): pops on "at"
  const k = TT >= cu.at && TT < cu.at + 0.25 ? 1 : 0, cx = px(KX), cyy = px(KY), r = px(170) + k;
  pcircle(cx, cyy, r, a3, { ring: 2 });
  pcircle(cx + 1, cyy, Math.round(r * 0.42), a3, { ring: 2 });
  prect(cx + Math.round(r * 0.42), cyy - 2, 2, Math.round(r * 0.55) + 2, a3);
  prect(cx + r - 2, cyy, 2, 4, a0);                                 // the gap where the tail leaves the ring
  if (TT >= cu.at) for (let i = 0; i < 4; i++) if (blinkOn(i * 2, 6, 3)) sprite(SPR.twinkle, { a: a2, b: a3 }, cx - r - 4 + (i % 2) * (2 * r + 6), cyy - r + Math.floor(i / 2) * 2 * r - 1);
  hero(1, { look: TT < cu.email ? [1, 0] : [0, -1], mood: TT >= cu.at ? 'happy' : 'smile' });
  yearCounter(1, a3, a0);
  cap('EMAIL', 1, a3, a0, a2);
}

// ---- 1991: the first website (a globe of links over a black cube computer; 90x160)
function era1991() {
  const cu = CU;
  sky(Q.ink, Q.night, Q.slate, 24, 's91');
  floor(Q.ink, 1360); prect(0, px(1360), EW, 1, Q.slate);
  // the globe: the web's links as meridians and parallels, nodes blinking along them
  const cx = px(KX), cy = px(KY), r = px(168);
  pcircle(cx, cy, r, Q.blue); pcircle(cx, cy, r, Q.sky, { ring: 1 });
  for (const f of [0.35, 0.75]) pellipse(cx, cy, Math.round(r * f), r, Q.sky, { ring: 1 });
  for (const v of [-0.5, 0, 0.5]) { const yy = cy + Math.round(r * v), hw = Math.round(r * Math.sqrt(1 - v * v)); prect(cx - hw, yy, 2 * hw + 1, 1, Q.sky); }
  for (let i = 0; i < 7; i++) { const R = RNG('node', i), a = R.f() * TAU, d = R.f() * 0.85; if (blinkOn(i * 4, 6, 4)) prect(cx + Math.round(Math.cos(a) * r * d) - 1, cy + Math.round(Math.sin(a) * r * d) - 1, 2, 2, Q.yellow); }
  // the computer: a black cube and its monitor, the page with underlined links
  const mx = px(250), my = px(1040), mw = px(520), mh = px(260);
  pixBox(mx, my, mw, mh, { bg: Q.ink, edge: Q.grey });
  prect(mx + 2, my + 2, mw - 4, mh - 4, Q.white);
  const lines = Math.floor(clamp((TT - cu.web + 0.6) / 0.8) * 5 + 1e-6);
  pixText('WWW', mx + 3, my + 3, Q.ink);
  for (let i = 0; i < lines; i++) { const y = my + 11 + i * 3, w = [30, 22, 34, 18, 26][i]; prect(mx + 3, y, Math.min(w, mw - 6), 1, i % 2 ? Q.blue : Q.slate); if (i % 2) prect(mx + 3, y + 1, Math.min(w, mw - 6), 1, Q.blue); }
  prect(px(100), px(1150), px(120), px(210), Q.ink); prect(px(100), px(1150), px(120), 1, Q.slate); prect(px(100), px(1150), 1, px(210), Q.slate);   // the cube
  if (blinkOn(3, 4, 2)) pset(px(120), px(1330), Q.lime);
  hero(2, { look: TT < cu.web ? [-1, -1] : [-1, 0], mood: TT >= cu.web ? 'happy' : 'smile' });
  yearCounter(2, Q.yellow, Q.ink);
  cap('FIRST WEBSITE', 2, Q.white, Q.ink, Q.yellow);
}

// ---- 1998: a 56k modem screeches, homes dial in (108x192)
function era1998() {
  const cu = CU;
  sky(Q.night, Q.purple, Q.grey, 30, 's98');
  // houses on the horizon, windows lighting as they dial in
  const hz = px(1360);
  for (let k = 0; k < 6; k++) {
    const x = k * 18 + 2, w = 14, h = 10 + (k % 3) * 3, y = hz - h;
    prect(x, y, w, h, Q.slate); ppoly([[x - 1, y], [x + w / 2, y - 6], [x + w + 1, y]], Q.brown);
    const lit = TT >= cu.dial + k * 0.12; prect(x + 3, y + 3, 3, 3, lit ? Q.yellow : Q.ink); prect(x + 8, y + 3, 3, 3, lit && k % 2 ? Q.yellow : Q.ink);
  }
  floor(Q.ink, 1360);
  // the modem (born from the globe): a beige box, LEDs, "56K"
  const x = px(KX - 200), y = px(KY - 80), w = px(400), h = px(160);
  prect(x, y + 2, w, h - 2, Q.grey); prect(x, y, w, 3, Q.white); prect(x, y + h - 2, w, 2, Q.slate);
  pixText('56K', x + 3, y + 5, Q.ink);
  for (let i = 0; i < 6; i++) { const on = TT >= cu.modem && (B + i * 3) % (3 + i % 3) < 2; prect(x + 4 + i * 6, y + h - 6, 3, 2, on ? (i % 3 ? Q.lime : Q.red) : Q.slate); }
  // the screech: a jagged waveform above the modem while it connects
  if (TT >= cu.modem - 0.2) for (let i = 0; i < 40; i++) { const R = RNG('wav', i, B), xx = x + i, amp = R.i(0, 6); prect(xx, y - 6 - amp, 1, 2 * amp + 1, i % 4 ? Q.sky : Q.white); }
  // the phone cord curling down to the wall jack
  for (let i = 0; i < 18; i++) { const yy = y + h + i, xx = x + 6 + Math.round(2 * Math.sin(i * 1.6)); pset(xx, yy, Q.white); }
  prect(x + 4, y + h + 18, 6, 4, Q.white);
  hero(3, { look: [-1, -1], mood: TT >= cu.dial ? 'happy' : 'wow', hop: TT >= cu.dial && TT < cu.dial + 0.4 ? 2 : 0 });
  yearCounter(3, Q.yellow, Q.ink);
  cap('HOMES DIAL IN', 3, Q.white, Q.ink, Q.yellow);
}

// ---- 1999: Wi-Fi (arcs radiate to a laptop; the cable is gone; 135x240)
function era1999() {
  const cu = CU;
  sky(Q.night, Q.blue, Q.white, 30, 's99');
  floor(Q.ink, 1360); prect(0, px(1360), EW, 1, Q.slate);
  const ax = px(KX), ay = px(KY + 170);
  // the arcs (born from the fan): three rings, pulsing outward one at a time
  for (let k = 0; k < 4; k++) {
    const r = px(80 + k * 82), on = TT < cu.wifi ? true : (beatN() + 3 - k) % 4 !== 0;
    if (!on) continue;
    for (let a = -0.74; a <= -0.26; a += 0.01) { const xx = ax + Math.round(Math.cos(a * Math.PI) * r), yy = ay + Math.round(Math.sin(a * Math.PI) * r); prect(xx, yy, 2, 2, k === 0 ? Q.white : Q.sky); }
  }
  prect(ax - 1, ay - 1, 3, 3, Q.yellow);
  // the router, the laptop on a low table, and the unplugged cable lying on the floor
  prect(ax - 6, ay + 1, 13, 4, Q.white); pset(ax - 4, ay + 2, blinkOn(1, 4, 2) ? Q.lime : Q.green);
  const lx = px(KX - 120), ly = px(1230);
  prect(lx, ly, px(240), px(10), Q.brown);
  prect(lx + 6, ly - 14, 20, 13, Q.grey); prect(lx + 7, ly - 13, 18, 11, TT >= cu.wifi ? Q.sky : Q.ink); prect(lx + 3, ly - 1, 26, 1, Q.white);
  if (TT >= cu.wifi) pixText('OK', lx + 10, ly - 11, Q.ink);
  for (let i = 0; i < 16; i++) pset(px(150) + i, px(1370) + Math.round(Math.sin(i * 0.7)), Q.grey);
  prect(px(150) + 16, px(1366), 3, 3, Q.grey);
  hero(4, { look: [-1, -1], mood: TT >= cu.wifi ? 'happy' : 'smile' });
  yearCounter(4, Q.yellow, Q.ink);
  cap('WIRELESS: WI-FI', 4, Q.white, Q.ink, Q.sky);
}

// ---- 2005: broadband, video streams (a player; the play button starts it; 180x320)
function era2005() {
  const cu = CU, x = px(KX - 320), y = px(KY - 180), w = px(640), h = px(360);
  sky(Q.ink, Q.night, Q.slate, 30, 's05');
  floor(Q.night, 1360);
  pixBox(x - 2, y - 2, w + 4, h + 4, { bg: Q.grey, edge: Q.white });
  // the video: a little world scrolling by (sun, hills, a running critter)
  const playing = TT >= cu.speed;
  prect(x, y, w, h, Q.sky);
  const off = playing ? Math.floor((TT - cu.speed) * 12) : 0;
  pcircle(x + w - 20, y + 16, 8, Q.yellow);
  for (let i = 0; i < w; i++) { const hh = Math.round(14 + 6 * Math.sin((i + off) * 0.08) + 4 * Math.sin((i + off) * 0.21)); prect(x + i, y + h - hh, 1, hh, Q.green); prect(x + i, y + h - hh, 1, 1, Q.lime); }
  if (playing) sprite(SPR.heart, { a: Q.pink, b: Q.white }, x + 40 + (off % 60), y + h - 32 - ((off >> 2) % 2) * 2);
  // the play button (born from the arcs) fades to the progress bar once it plays
  if (!playing) ppoly([[px(KX - 90), px(KY - 110)], [px(KX + 130), px(KY)], [px(KX - 90), px(KY + 110)]], Q.yellow);
  const prog = clamp((TT - cu.speed) / 3.2), buf = clamp((TT - cu.speed + 0.3) / 1.2);
  prect(x, y + h + 3, w, 3, Q.slate); prect(x, y + h + 3, Math.round(w * buf), 3, Q.grey); prect(x, y + h + 3, Math.round(w * prog), 3, Q.red);
  pixText('HIGH SPEED', x, y + h + 10, TT >= cu.speed ? Q.lime : Q.slate);
  hero(5, { look: [-1, -1], mood: playing ? 'happy' : 'smile', hop: playing && TT < cu.speed + 0.4 ? 3 : 0 });
  yearCounter(5, Q.yellow, Q.ink);
  cap('VIDEO STREAMS', 5, Q.white, Q.ink, Q.red);
}

// ---- the phone (2007 and today): a body, a screen, icons or a login form
function phone(e, mode) {
  const x = px(KX - 150), y = px(KY - 290), w = px(300), h = px(580), r = pw(30);
  prect(x + r, y, w - 2 * r, h, Q.slate); prect(x, y + r, w, h - 2 * r, Q.slate);
  pcircle(x + r, y + r, r, Q.slate); pcircle(x + w - r - 1, y + r, r, Q.slate); pcircle(x + r, y + h - r - 1, r, Q.slate); pcircle(x + w - r - 1, y + h - r - 1, r, Q.slate);
  const m = pw(16), sx = x + m, sy = y + pw(60), sw = w - 2 * m, sh = h - pw(120);
  prect(sx, sy, sw, sh, mode === 'icons' ? Q.night : Q.ink);
  prect(x + Math.round(w / 2) - pw(30), y + h - pw(40), pw(60), pw(10), Q.grey);
  return { sx, sy, sw, sh };
}
function era2007() {
  const cu = CU;
  sky(Q.night, Q.purple, Q.white, 40, 's07');
  floor(Q.ink, 1360);
  const { sx, sy, sw, sh } = phone(6, 'icons');
  const cols = [Q.red, Q.orange, Q.yellow, Q.lime, Q.sky, Q.pink, Q.blue, Q.green, Q.purple, Q.white, Q.ice, Q.brown];
  const g = pw(24), cw = Math.floor((sw - 4 * g) / 3), n = Math.min(12, Math.floor(clamp((TT - ERA_T[6] - 0.3) / 1.2) * 12 + 1e-6));
  for (let i = 0; i < n; i++) { const c = i % 3, rr = Math.floor(i / 3), xx = sx + g + c * (cw + g), yy = sy + g + rr * (cw + g); prect(xx, yy, cw, cw, cols[i]); prect(xx, yy, cw, 1, Q.white); }
  // a finger taps an icon on "pocket"
  const tap = TT >= cu.pocket - 0.3, fx = sx + g + cw + g + Math.floor(cw / 2), fy = sy + g + Math.floor(cw / 2) + (tap ? 0 : pw(40));
  const fb = fy + pw(150); prect(fx - pw(14), fy, pw(28), fb - fy, Q.pink); prect(fx - pw(14), fy, pw(28), 2, Q.white); prect(fx - pw(24), fb, pw(48), pw(70), Q.pink);
  if (tap && TT < cu.pocket + 0.4) for (let k = 0; k < 4; k++) sprite(SPR.twinkle, { a: Q.yellow, b: Q.white }, fx - 1 + Math.round(Math.cos(k * TAU / 4 + 0.8) * pw(50)), fy - 1 + Math.round(Math.sin(k * TAU / 4 + 0.8) * pw(50)));
  hero(6, { look: [-1, -1], mood: tap ? 'happy' : 'smile' });
  yearCounter(6, Q.yellow, Q.ink);
  cap('IN YOUR POCKET', 6, Q.white, Q.ink, Q.lime);
}
const ok0 = () => TT >= CU.hit;

// ---- today: the same phone, a crowd of phones around it; LOGI... silence ... N, and it gets through
function eraToday() {
  const cu = CU;
  sky(Q.night, Q.blue, Q.white, 60, 'st');
  floor(Q.ink, 1360);
  // the crowd: small phones held up around the frame, screens blinking on the beat
  for (let i = 0; i < 9; i++) {
    const R = RNG('crowd', i), side = i % 2 ? 1 : -1, xx = i < 4 ? R.i(4, 60) + (side > 0 ? EW - 70 : 0) : R.i(10, EW - 40), yy = i < 4 ? R.i(px(560), px(1200)) : px(1430) + R.i(0, 30);
    if (Math.abs(xx - px(KX)) < px(230) && yy < px(1300)) continue;
    prect(xx, yy, 18, 32, Q.slate); prect(xx + 2, yy + 3, 14, 24, blinkOn(i * 3, 8, 6) ? [Q.sky, Q.lime, Q.pink, Q.yellow][i % 4] : Q.night);
  }
  const { sx, sy, sw, sh } = phone(7, 'login');
  // the login form: the same five letters, typed, the last one after the silence
  const cx = sx + Math.floor(sw / 2), fy = sy + Math.floor(sh * 0.42);
  const lk = sy + pw(70); prect(cx - 8, lk + 6, 17, 13, ok0() ? Q.lime : Q.grey); pellipse(cx, lk + 5, 5, 6, ok0() ? Q.lime : Q.grey, { ring: 2 }); prect(cx - 1, lk + 10, 3, 5, Q.ink);
  pixBox(sx + pw(20), fy - 6, sw - 2 * pw(20), 26, { bg: Q.white, edge: Q.grey });
  const t0 = cu.carry - 0.2, n = TT >= cu.hit ? 5 : Math.min(4, Math.floor(clamp((TT - t0) / 1.0) * 4 + 1e-6));
  pixText('LOGIN', sx + pw(36), fy + 1, Q.ink, { scale: 2, count: n, cursor: TT < cu.hit ? Q.blue : false });
  const ok = TT >= cu.hit;
  if (ok) {
    const bx = cx - 20, by = fy + 36; pixBox(bx, by, 40, 24, { bg: Q.green, edge: Q.lime });
    for (let k = 0; k < 6; k++) prect(bx + 10 + k, by + 10 + k, 2, 2, Q.white);
    for (let k = 0; k < 11; k++) prect(bx + 16 + k, by + 15 - k, 2, 2, Q.white);
    const u = (TT - cu.hit) / 0.6;
    if (u < 1) for (let k = 0; k < 8; k++) { const a = k * TAU / 8, rr = Math.round(pw(60) + u * pw(220)); sprite(SPR.spark, { a: Q.yellow, b: Q.white }, cx - 2 + Math.round(Math.cos(a) * rr), fy + 8 - 2 + Math.round(Math.sin(a) * rr)); }
  }
  hero(7, { look: [-1, -1], mood: ok ? 'happy' : TT >= cu.silence ? 'wow' : 'smile', hop: ok && TT < cu.hit + 0.5 ? 6 : 0 });
  yearCounter(7, Q.yellow, Q.ink);
  if (ok) cap('LOGIN: OK', 7, Q.white, Q.ink, Q.lime, cu.hit - ERA_T[7] + 0.15);
}

const ERA_DRAW = [era1969, era1971, era1991, era1998, era1999, era2005, era2007, eraToday];
function sceneEra(e) {
  [EW, EH] = ERA_RES[e]; S = W / EW;
  lowres(ERA_RES[e], () => ERA_DRAW[e](), { fx: { pal: ERA_PAL[e] } });
}
