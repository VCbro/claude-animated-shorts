// "The captain outside the plane" (BA 5390, 1990): cinematic story style, 1080x1920.
import { add, start, A, R, win, eio, eob, lerp, clamp, rnd, ctx, cam, camKeys, screen, text, label, fillRR, lin, rad, line, glowDot, TAU, END, W, H } from './engine.js';

const GOLD = '#ffcf8a', RED = '#ff6b57', SKYB = '#7fb8e8';
const title = (html, y, a, size = 96, col = '#fff7ee') => text(`<span style="color:${col};text-shadow:0 4px 30px rgba(0,0,0,.8)">${html}</span>`, W / 2, y, { size, a, cls: 'ttl' });
const card = (html, y, a) => text(`<span style="font-family:B;font-weight:600;letter-spacing:6px;padding:10px 28px;border:2px solid rgba(255,207,138,.7);color:#ffcf8a">${html}</span>`, W / 2, y, { size: 34, a });

function sky(t, top = '#2b4a78', mid = '#d98a5a', bot = '#f2c48a') {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, top], [0.55, mid], [1, bot]]); ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 10; i++) { const x = ((rnd(i) * 1600 - t * 60 * (0.5 + rnd(i + 1))) % 1700 + 1700) % 1700 - 300, y = 300 + rnd(i + 2) * 1300, r = 120 + 140 * rnd(i + 3);
    ctx.fillStyle = rad(x, y, 0, r, [[0, 'rgba(255,240,225,.35)'], [1, 'rgba(255,240,225,0)']]); ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * 0.6, 0, 0, TAU); ctx.fill(); }
}
function speedLines(t, a = 1, col = 'rgba(255,255,255,.5)') {
  screen(); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) { const y = rnd(i) * H, x = ((rnd(i + 3) * W - t * 2600) % (W + 400) + W + 400) % (W + 400) - 200; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 180 + 200 * rnd(i + 5), y); ctx.stroke(); }
  ctx.restore();
}
// twin-jet with rear engines and a T-tail, facing right. origin = nose tip. s scale
function jet(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = lin(0, -60, 0, 60, [[0, '#f4f6f8'], [0.6, '#c9d0d8'], [1, '#8b95a3']]);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, -48, -110, -52); ctx.lineTo(-820, -52); ctx.quadraticCurveTo(-900, -50, -930, -10); ctx.lineTo(-930, 20); ctx.lineTo(-110, 40); ctx.quadraticCurveTo(-20, 35, 0, 0); ctx.fill();
  ctx.fillStyle = '#1e3a6b'; ctx.fillRect(-830, -14, 700, 14);                                       // cheatline
  ctx.fillStyle = '#c9d0d8'; ctx.beginPath(); ctx.moveTo(-840, -50); ctx.lineTo(-900, -230); ctx.lineTo(-950, -230); ctx.lineTo(-920, -50); ctx.fill();  // fin
  ctx.beginPath(); ctx.moveTo(-990, -235); ctx.lineTo(-850, -235); ctx.lineTo(-860, -218); ctx.lineTo(-990, -218); ctx.fill();                       // T-tail
  ctx.fillStyle = '#aeb7c2'; ctx.beginPath(); ctx.roundRect(-800, -110, 180, 50, 25); ctx.fill();                                                  // rear engine
  ctx.fillStyle = '#9aa4b0'; ctx.beginPath(); ctx.moveTo(-430, 20); ctx.lineTo(-560, 120); ctx.lineTo(-610, 120); ctx.lineTo(-520, 20); ctx.fill(); // wing
  ctx.fillStyle = '#29384d'; for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.roundRect(-170 - i * 38, -30, 18, 22, 6); ctx.fill(); }          // windows
  // cockpit windscreen
  ctx.fillStyle = o.broken ? '#0b0f16' : '#3b5a80'; ctx.beginPath(); ctx.moveTo(-40, -28); ctx.lineTo(-95, -44); ctx.lineTo(-110, -22); ctx.lineTo(-60, -14); ctx.fill();
  if (o.captain) {          // captain pulled out over the nose, legs inside
    const fl = Math.sin((o.t || 0) * 18) * 0.06;
    ctx.save(); ctx.translate(-70, -38); ctx.rotate(-0.25 + fl);
    ctx.fillStyle = '#1a2230'; ctx.beginPath(); ctx.roundRect(0, -14, 130, 30, 14); ctx.fill();                                  // torso along the roof
    ctx.beginPath(); ctx.arc(140, 0, 16, 0, TAU); ctx.fill();                                                                   // head
    ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(110, 0); ctx.lineTo(170 + 10 * Math.sin((o.t || 0) * 22), -26); ctx.moveTo(110, 4); ctx.lineTo(175, 22 + 8 * Math.sin((o.t || 0) * 19)); ctx.stroke();  // arms flailing
    ctx.restore();
  }
  ctx.restore();
}
function cockpit(t, o = {}) {                 // view from inside: two pilots, windscreen frames, sky beyond
  sky(t, '#3a5f94', '#9cc0e0', '#e9d7b8'); cam(540, 960, 1);
  const broken = o.broken || 0;
  ctx.fillStyle = '#0d1118'; ctx.fillRect(0, 0, W, 520); ctx.fillRect(0, 1180, W, 740);
  ctx.beginPath(); ctx.moveTo(0, 520); ctx.lineTo(260, 600); ctx.lineTo(260, 1180); ctx.lineTo(0, 1180); ctx.fill(); ctx.beginPath(); ctx.moveTo(W, 520); ctx.lineTo(820, 600); ctx.lineTo(820, 1180); ctx.lineTo(W, 1180); ctx.fill();
  ctx.fillRect(520, 520, 40, 660);                                                                  // centre post
  if (broken > 0) { ctx.fillStyle = `rgba(255,255,255,${0.15 * broken})`; ctx.fillRect(260, 600, 260, 580); }
  // instrument panel glow
  ctx.fillStyle = '#151a22'; ctx.fillRect(0, 1180, W, 120); for (let i = 0; i < 9; i++) glowDot(120 + i * 105, 1240, 14, i % 3 ? '#7fd8ff' : '#ffcf8a', 0.7);
  // pilots (backs of heads + shoulders)
  for (const [px, hidden] of [[380, o.capOut], [720, false]]) { if (hidden) continue;
    ctx.fillStyle = '#0a0d12'; ctx.beginPath(); ctx.arc(px, 1330, 70, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(px, 1520, 170, 120, 0, Math.PI, 0); ctx.fill(); }
}

// ------------------------------------------------------------------ S1: hook — captain outside at 17,000 ft
const hook = (t) => {
  sky(t); camKeys(t, [[0, 700, 880, 2.3], [A('date'), 690, 880, 2.1]]);
  jet(820, 920, 1.0, { broken: true, captain: true, t });
  speedLines(t, 0.7);
  title('17,000 फ़ीट', 300, 1, 120, GOLD); title('कैप्टन… बाहर!', 450, R(t, 0.8, 0.3), 96, RED);
};
add(0, A('date'), (t) => hook(t));
// ------------------------------------------------------------------ S2: 10 June 1990, England -> Spain
add(A('date'), A('calm'), (t) => {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#14202e'], [1, '#05080c']]); ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  // route card: Birmingham -> Malaga, dashed arc with a little plane travelling along it
  const k = eio((t - A('date') - 0.8) / 4.2), P0 = [270, 760], P1 = [810, 1180], C = [700, 640];
  const q = (u) => [(1 - u) ** 2 * P0[0] + 2 * (1 - u) * u * C[0] + u * u * P1[0], (1 - u) ** 2 * P0[1] + 2 * (1 - u) * u * C[1] + u * u * P1[1]];
  const arc = []; for (let i = 0; i <= 40; i++) arc.push(q(i / 40 * k));
  if (arc.length > 1) line(arc, GOLD, 5, 14, [16, 12]);
  glowDot(P0[0], P0[1], 14, GOLD, 1); glowDot(P1[0], P1[1], 14, GOLD, R(t, A('date') + 4.6, 0.3));
  const pp = q(k), pq = q(Math.min(1, k + 0.02)); ctx.save(); ctx.translate(pp[0], pp[1]); ctx.rotate(Math.atan2(pq[1] - pp[1], pq[0] - pp[0])); ctx.scale(0.09, 0.09); jet(500, 0, 1, {}); ctx.restore();
  text('<span style="color:#cfd8e3">बर्मिंघम, इंग्लैंड</span>', 270, 840, { size: 42, a: R(t, A('date') + 0.6, 0.3), cls: 'ttl' });
  text('<span style="color:#cfd8e3">मलागा, स्पेन</span>', 810, 1260, { size: 42, a: R(t, A('date') + 4.4, 0.3), cls: 'ttl' });
  screen(); title('10 जून 1990', 300, R(t, A('date') + 0.1, 0.4), 104, GOLD); card('BRITISH AIRWAYS 5390', 430, R(t, A('date') + 0.8, 0.4));
});
// ------------------------------------------------------------------ S3: calm cockpit -> BANG
add(A('calm'), A('pulled'), (t) => {
  const bang = A('bang'), b = R(t, bang, 0.08);
  cockpit(t, { broken: b, capOut: false });
  if (t > bang) { const e = t - bang; for (let i = 0; i < 60; i++) { const a = rnd(i) * TAU, v = 300 + 900 * rnd(i + 1);           // glass shards
      ctx.fillStyle = `rgba(220,235,255,${Math.max(0, 1 - e * 0.8)})`; const x = 390 + Math.cos(a) * v * e, y = 880 + Math.sin(a) * v * e - 200 * e;
      ctx.save(); ctx.translate(x, y); ctx.rotate(e * 8 + i); ctx.fillRect(-8, -3, 16, 6); ctx.restore(); }
    for (let i = 0; i < 8; i++) { const e2 = (t - bang) * 1.4; ctx.fillStyle = `rgba(245,240,225,${Math.max(0, 1 - e2 * 0.5)})`; ctx.save(); ctx.translate(400 + 200 * rnd(i) - 600 * e2, 1100 - 500 * e2 * rnd(i + 2)); ctx.rotate(e2 * 5 + i); ctx.fillRect(-30, -20, 60, 40); ctx.restore(); }  // papers
    screen(); ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 1 - (t - bang) / 0.25)})`; ctx.fillRect(0, 0, W, H); speedLines(t, R(t, bang, 0.2)); }
  screen(); title('सब कुछ ठीक था…', 300, win(t, A('calm'), bang, 0.2), 88);
  title('धड़ाम!', 330, win(t, bang, A('pulled'), 0.05), 170, RED);
});
// ------------------------------------------------------------------ S4: pulled out (outside view)
add(A('pulled'), A('grab'), (t) => {
  sky(t, '#2b4a78', '#7aa6d8', '#d8c3a0'); camKeys(t, [[A('pulled'), 640, 860, 2.0], [A('grab'), 620, 860, 2.2]]);
  jet(700, 900, 1.0, { broken: true, captain: true, t }); speedLines(t, 0.9);
  label('कैप्टन टिम लैंकेस्टर', 760, 780, -360, -260, R(t, A('pulled') + 1.0, 0.4), 'आधा शरीर बाहर');
  screen(); title('हवा ने खींच लिया', 300, R(t, A('pulled') + 0.2, 0.3), 92, SKYB);
});
// ------------------------------------------------------------------ S5-S7: the crew holds on (inside)
add(A('grab'), A('copilot'), (t) => {
  cockpit(t, { broken: 1, capOut: true }); speedLines(t, 0.5);
  // the captain's legs through the windscreen + crew hands gripping
  const slip = win(t, A('cold'), A('dead'), 0.4) * 14 * Math.sin(t * 9);
  ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(380, 760); ctx.lineTo(330 + slip, 1060); ctx.moveTo(420, 760); ctx.lineTo(430 + slip, 1060); ctx.stroke();
  ctx.fillStyle = '#d7b08c'; for (const hx of [300, 360, 440, 500]) { ctx.beginPath(); ctx.ellipse(hx + slip, 1040, 34, 24, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#2b3d52'; ctx.lineWidth = 60; ctx.beginPath(); ctx.moveTo(150, 1500); ctx.lineTo(320, 1060); ctx.moveTo(700, 1500); ctx.lineTo(480, 1060); ctx.stroke();
  // cold + dead mood
  const cold = win(t, A('cold'), A('copilot'), 0.5);
  if (cold > 0) { screen(); ctx.fillStyle = `rgba(150,200,255,${0.18 * cold})`; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) glowDot(rnd(i) * W, ((rnd(i + 2) * H + t * 400) % H), 3, '#ffffff', 0.6 * cold); }
  const dead = win(t, A('dead'), A('copilot'), 0.6);
  if (dead > 0) { screen(); ctx.fillStyle = `rgba(0,0,0,${0.45 * dead})`; ctx.fillRect(0, 0, W, H); }
  screen();
  title('पैर कसकर पकड़े', 300, win(t, A('grab') + 0.2, A('cold'), 0.3), 92, GOLD);
  card('बर्फ़ीली हवा · सैकड़ों km/h', 300, win(t, A('cold') + 0.4, A('dead'), 0.3));
  title('फिर भी… पकड़ नहीं छोड़ी', 300, win(t, A('dead') + 1.6, A('copilot'), 0.4), 80);
});
// ------------------------------------------------------------------ S8-S9: the co-pilot brings her down
add(A('copilot'), A('alive'), (t) => {
  const land = A('landed');
  sky(t, '#3a6aa0', '#a9cde8', '#f0e2c2'); cam(540, 960, 1);
  const k = eio((t - A('copilot')) / (land - A('copilot')));
  ctx.fillStyle = '#4c6a3e'; ctx.fillRect(0, 1250, W, 700); ctx.fillStyle = '#2b2f36'; ctx.fillRect(0, 1250, W, 70);
  for (let x = 0; x < W; x += 140) { ctx.fillStyle = '#f1f1f1'; ctx.fillRect(x, 1282, 70, 6); }
  jet(lerp(1250, 900, k), lerp(500, 1246, k), lerp(0.45, 0.6, k), {});
  const alt = Math.round(lerp(17000, 0, k) / 100) * 100;
  screen(); card(`ऊँचाई: ${alt.toLocaleString('en-IN')} फ़ीट`, 300, win(t, A('copilot') + 0.5, land + 0.3, 0.3));
  title('को-पायलट, अकेले', 420, win(t, A('copilot') + 0.3, land, 0.3), 80, SKYB);
  title('~20 मिनट बाद… ज़मीन!', 300, R(t, land + 0.2, 0.4), 84, GOLD);
});
// ------------------------------------------------------------------ S10: alive, flying again in five months
add(A('alive'), A('cause'), (t) => {
  sky(t, '#2b4a78', '#d98a5a', '#f2c48a'); cam(540, 960, 1);
  const up = eio((t - A('months')) / 3); jet(lerp(200, 1300, up), lerp(1250, 700, up), 0.5, {});
  screen(); title('ज़िंदा!', 330, win(t, A('alive') + 0.1, A('months'), 0.2), 170, GOLD);
  card('कुछ हड्डियाँ टूटीं · शीतदंश', 520, win(t, A('alive') + 1.6, A('months'), 0.3));
  title('5 महीने में… फिर उड़ान', 300, R(t, A('months') + 0.2, 0.4), 84);
});
// ------------------------------------------------------------------ S11: the cause — bolts a hair too thin
add(A('cause'), A('ask'), (t) => {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#1a1410'], [1, '#050403']]); ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  const bolt = (x, r, col) => { ctx.fillStyle = col; ctx.fillRect(x - 70, 640, 140, 50); ctx.fillRect(x - r, 690, 2 * r, 520);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4; for (let y = 760; y < 1200; y += 26) { ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y + 12); ctx.stroke(); } };
  bolt(360, 40, '#b9bec4'); bolt(720, 34, '#d8b26a');
  text('<span style="color:#cfd8e3">सही बोल्ट</span>', 360, 1280, { size: 44, a: 1, cls: 'ttl' });
  text(`<span style="color:${GOLD}">लगाया गया</span>`, 720, 1280, { size: 44, a: 1, cls: 'ttl' });
  const m = R(t, A('cause') + 1.6, 0.4); ctx.strokeStyle = `rgba(255,107,87,${m})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(720, 900, 120, 0, TAU); ctx.stroke();
  screen(); title('ज़रा-सा पतला', 300, m, 104, RED); card('90 में से 84 बोल्ट', 430, R(t, A('cause') + 2.4, 0.4));
});
// ------------------------------------------------------------------ S12: the question (then back to the hook frame)
add(A('ask'), END, (t) => {
  if (t > END - 0.45) { hook(0); return; }
  screen(); ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  ctx.fillStyle = '#d7b08c'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(430 + i * 220, 980, 90, 60, 0, 0, TAU); ctx.fill(); }
  screen(); title('आप होते…<br>तो क्या पकड़ छोड़ देते?', 520, R(t, A('ask') + 0.1, 0.5), 84, GOLD);
});
start();
