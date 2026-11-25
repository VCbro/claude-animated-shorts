// Mosquito: the six needles. 2D premium motion graphics (night theme), 1080x1920.
import { add, start, A, R, win, eio, eob, lerp, clamp, rnd, ctx, cam, camKeys, screen, text, label, fillRR, lin, rad, line, glowDot, flow, TAU, END, W, H } from './engine.js';

const GOLD = '#ffd166', CYAN = '#7fd8ff', RED = '#ff5a45', GREEN = '#6dff9e', PINK = '#ff8fb1';
const big = (html, y, a, size = 104, col = '#fff') => text(`<span style="color:${col};-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.45)">${html}</span>`, W / 2, y, { size, a, cls: 'ttl' });
const chip = (html, y, a) => text(`<span style="padding:12px 30px 8px;border-radius:22px;background:rgba(8,12,22,.86);box-shadow:0 0 0 3px rgba(255,255,255,.16)">${html}</span>`, W / 2, y, { size: 50, a });
const NEED = [['#ffd166', 'आरी'], ['#ffd166', 'आरी'], ['#7fd8ff', 'पकड़'], ['#7fd8ff', 'पकड़'], ['#ff5a45', 'खून की नली'], ['#6dff9e', 'थूक की नली']];

function skin(t, y0 = 1180) {          // warm skin surface with pores and fine hairs
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#120d16'], [0.5, '#2a1620'], [1, '#090609']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = lin(0, y0 - 40, 0, H, [[0, '#d9a07e'], [0.2, '#c38866'], [1, '#6e4232']]); ctx.beginPath(); ctx.moveTo(0, y0);
  for (let x = 0; x <= W; x += 60) ctx.lineTo(x, y0 + 14 * Math.sin(x * 0.012)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  for (let i = 0; i < 70; i++) { const x = rnd(i) * W, y = y0 + 40 + rnd(i + 3) * (H - y0); ctx.fillStyle = 'rgba(110,60,40,.35)'; ctx.beginPath(); ctx.arc(x, y, 3 + 4 * rnd(i + 5), 0, TAU); ctx.fill(); }
  ctx.strokeStyle = 'rgba(60,30,20,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 18; i++) { const x = rnd(i + 40) * W, y = y0 + 20 + rnd(i + 41) * 300; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 60, x + 50, y - 90); ctx.stroke(); }
}
// side-view mosquito, facing left; origin at the proboscis base. s scale. o: {fly, glow, beak}
function mosquito(x, y, s, t, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const bob = o.fly ? 6 * Math.sin(t * 9) : 0; ctx.translate(0, bob);
  // legs (6, long and thin)
  ctx.strokeStyle = '#2b2620'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const bx = 40 + i * 18, ph = o.fly ? 0.2 * Math.sin(t * 6 + i) : 0;
    ctx.beginPath(); ctx.moveTo(bx, 20); ctx.lineTo(bx - 30 + i * 10, 80 + ph * 30); ctx.lineTo(bx - 50 + i * 18, 170); ctx.stroke(); }
  // wings (translucent, buzzing)
  const wa = o.fly ? 0.35 * Math.sin(t * 90) : 0.15;
  for (const k of [0, 1]) { ctx.save(); ctx.translate(90, -10); ctx.rotate(-0.5 - wa - k * 0.25);
    ctx.fillStyle = 'rgba(200,225,255,.28)'; ctx.strokeStyle = 'rgba(220,235,255,.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(70, 0, 80, 16, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  // abdomen (striped), thorax, head, eye
  ctx.fillStyle = lin(100, -20, 260, 40, [[0, '#4a3d30'], [1, '#2a221b']]); ctx.beginPath(); ctx.ellipse(190, 25, 95, 22, 0.22, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(230,220,200,.55)'; ctx.lineWidth = 4; for (let i = 0; i < 6; i++) { const sx = 130 + i * 24; ctx.beginPath(); ctx.moveTo(sx, 10 + i * 5); ctx.lineTo(sx + 4, 40 + i * 5); ctx.stroke(); }
  ctx.fillStyle = '#3b3128'; ctx.beginPath(); ctx.ellipse(70, 0, 46, 36, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2e261f'; ctx.beginPath(); ctx.arc(18, -4, 22, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7a1e1e'; ctx.beginPath(); ctx.arc(10, -8, 13, 0, TAU); ctx.fill(); glowDot(6, -12, 3, '#ffb0a0', 0.8);
  // antennae
  ctx.strokeStyle = '#2b2620'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -18); ctx.quadraticCurveTo(-30, -60, -50, -70); ctx.stroke();
  // proboscis: one sheath, or the six needles fanned out
  const fan = o.fan || 0;
  if (fan < 0.02) { ctx.strokeStyle = '#2b2620'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-150, 150); ctx.stroke(); }
  else for (let i = 0; i < 6; i++) { const ang = (i - 2.5) * 0.12 * fan; ctx.strokeStyle = NEED[i][0]; ctx.lineWidth = 4; ctx.shadowColor = NEED[i][0]; ctx.shadowBlur = 14 * fan;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-150 * Math.cos(ang) + 150 * Math.sin(ang), 150 * Math.cos(ang) + 150 * Math.sin(ang)); ctx.stroke(); ctx.shadowBlur = 0; }
  ctx.restore();
}

// ------------------------------------------------------------------ S1: the hook (and the loop end)
const hookScene = (t, fan) => {
  skin(t); camKeys(t, [[0, 600, 900, 1.0], [A('female') - 0.3, 560, 960, 1.2]]);
  mosquito(560, 1020, 2.0, t, { fan });
};
add(0, A('female'), (t) => {
  hookScene(t, R(t, 0.6, 0.6));
  screen(); big('6 सुइयाँ!', 300, 1, 150, GOLD);
  big('एक डंक नहीं…', 470, R(t, 1.0, 0.3), 80);
});
// ------------------------------------------------------------------ S2: only the female bites
add(A('female'), A('co2'), (t) => {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#0b1630'], [1, '#04070f']]); ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  const f = R(t, A('female') + 0.4, 0.5);
  ctx.save(); ctx.globalAlpha = 1 - 0.7 * f; mosquito(330, 700, 1.25, t, { fly: true }); ctx.restore();
  mosquito(330, 1110, 1.25, t, { fly: true });
  ctx.fillStyle = rad(560, 1170, 0, 300, [[0, `rgba(255,143,177,${0.35 * f})`], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(200, 900, 800, 600);
  screen();
  text(`<span style="color:#9fb6c9">नर</span> <span style="color:${RED}">✕</span>`, 760, 760, { size: 64, a: f, cls: 'ttl' });
  text(`<span style="color:${PINK}">मादा</span> <span style="color:${GREEN}">✓</span>`, 760, 1170, { size: 64, a: f, cls: 'ttl' });
  big('सिर्फ़ मादा काटती है', 300, R(t, A('female') + 0.2, 0.3), 92, PINK);
  chip('खून = अंडों के लिए प्रोटीन', 470, R(t, A('female') + 2.2, 0.4));
});
// ------------------------------------------------------------------ S3: CO2 from your breath, metres away
add(A('co2'), A('heat'), (t) => {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#0b1630'], [1, '#04070f']]); ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  // sleeping face (side) on the left
  ctx.fillStyle = '#c38866'; ctx.beginPath(); ctx.ellipse(170, 1000, 140, 170, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(300, 960); ctx.lineTo(340, 1010); ctx.lineTo(300, 1030); ctx.fill();
  ctx.strokeStyle = '#6e4232'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(260, 950, 18, 0.2, Math.PI - 0.2); ctx.stroke();
  // CO2 plume drifting right
  for (let i = 0; i < 70; i++) { const life = ((t * 0.35 + rnd(i)) % 1); const x = 320 + life * 650, y = 1060 + Math.sin(life * 7 + i) * 60 * life + (rnd(i + 2) - 0.5) * 120 * life;
    glowDot(x, y, 6 + 14 * life, CYAN, 0.55 * (1 - life)); }
  text('<b style="font-family:M;font-size:34px">CO₂</b>', 520, 1060, { size: 34, a: 0.9, color: CYAN });
  mosquito(820 + 10 * Math.sin(t * 2), 860, 1.0, t, { fly: true });
  // distance arrow
  const a = R(t, A('co2') + 1.6, 0.4); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = GOLD; ctx.lineWidth = 5; ctx.setLineDash([16, 12]);
  ctx.beginPath(); ctx.moveTo(330, 1300); ctx.lineTo(880, 1300); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  screen(); text(`<span style="color:${GOLD}">कई मीटर दूर से</span>`, 600, 1240, { size: 56, a, cls: 'ttl' });
  big('आपकी साँस = सिग्नल', 300, R(t, A('co2') + 0.2, 0.3), 88, CYAN);
});
// ------------------------------------------------------------------ S4: heat + sweat (thermal view)
add(A('heat'), A('open'), (t) => {
  screen(); ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  // thermal arm
  const g = lin(0, 700, 0, 1300, [[0, '#ffe066'], [0.35, '#ff7a1a'], [0.7, '#d8203a'], [1, '#3b0d4a']]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-50, 820); ctx.quadraticCurveTo(540, 700, 1130, 880); ctx.lineTo(1130, 1260); ctx.quadraticCurveTo(540, 1180, -50, 1300); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 26; i++) { const x = 60 + rnd(i) * 960, y = 900 + rnd(i + 1) * 220, p = 0.5 + 0.5 * Math.sin(t * 3 + i); glowDot(x, y, 6 + 5 * p, '#bfe6ff', 0.7); }
  for (let i = 0; i < 8; i++) { const life = ((t * 0.5 + i / 8) % 1); ctx.strokeStyle = `rgba(255,170,90,${0.5 * (1 - life)})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(200 + i * 100, 780 - life * 260); ctx.quadraticCurveTo(220 + i * 100, 740 - life * 260, 200 + i * 100, 700 - life * 260); ctx.stroke(); }
  const k = eio((t - A('heat') - 0.5) / 3); mosquito(lerp(860, 620, k), lerp(360, 600, k), 1.1, t, { fly: k < 0.95 });
  screen(); big('गर्मी + पसीना', 300, R(t, A('heat') + 0.2, 0.3), 100, '#ffb547');
  chip('= आपका पता 📍'.replace('📍', ''), 460, R(t, A('heat') + 1.6, 0.4));
});
// ------------------------------------------------------------------ S5: the six needles in the skin (cross-section)
add(A('open'), A('itch'), (t) => {
  screen(); ctx.fillStyle = '#0a0710'; ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  // skin layers
  const top = 760;
  ctx.fillStyle = lin(0, top, 0, top + 120, [[0, '#e2b293'], [1, '#c98f6f']]); ctx.fillRect(0, top, W, 120);
  ctx.fillStyle = lin(0, top + 120, 0, 1500, [[0, '#d9877f'], [1, '#8f3f45']]); ctx.fillRect(0, top + 120, W, 1500 - top - 120);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.arc(rnd(i) * W, top + 140 + rnd(i + 1) * 500, 10 + 20 * rnd(i + 2), 0, TAU); ctx.fill(); }
  // blood vessel
  ctx.fillStyle = lin(0, 1180, 0, 1300, [[0, '#ff4a4a'], [1, '#8a0f1d']]); ctx.beginPath(); ctx.roundRect(-40, 1180, W + 80, 120, 60); ctx.fill();
  for (let i = 0; i < 22; i++) { const x = ((rnd(i) * W + t * 120) % (W + 80)) - 40; ctx.fillStyle = 'rgba(160,10,25,.8)'; ctx.beginPath(); ctx.ellipse(x, 1210 + rnd(i + 3) * 60, 22, 12, 0, 0, TAU); ctx.fill(); }
  text('<span style="color:#ffd9d0">नस</span>', 960, 1240, { size: 40, a: 0.9, cls: 'ttl' });
  // mosquito head above, needles going down into the skin
  mosquito(575, 600, 1.2, t, {});
  const tip = 1170, sx = 545;
  const open = R(t, A('open'), 0.6);
  // sheath folds back
  ctx.strokeStyle = '#2b2620'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, 640); ctx.quadraticCurveTo(sx - 60 * open, 720, sx - 120 * open, 700 + 40 * open); ctx.stroke();
  const P = [[-40, 'saw'], [40, 'saw'], [-80, 'hold'], [80, 'hold'], [-10, 'suck'], [16, 'spit']];
  for (let i = 0; i < 6; i++) {
    const [dx, key] = P[i]; const go = R(t, A('open') + 0.2, 0.8), active = win(t, A(key), A('itch'), 0.3);
    const wiggle = key === 'saw' ? 6 * Math.sin(t * 30 + i) * win(t, A('saw'), A('hold'), 0.2) : 0;
    const spread = key === 'hold' ? 30 * R(t, A('hold'), 0.5) * Math.sign(dx) : 0;
    const ex = sx + dx * go + spread + wiggle, ey = lerp(660, tip, go);
    line([[sx + dx * 0.2, 650], [ex, ey]], NEED[i][0], 6 + 4 * active, 10 + 30 * active);
  }
  // blood up the straw, saliva down the other
  flow([[sx - 10, 1180], [sx - 10, 660]], t, RED, { speed: 260, gap: 24, r: 7, a: win(t, A('suck'), A('itch'), 0.3) });
  flow([[sx + 16, 660], [sx + 16, 1170]], t, GREEN, { speed: 260, gap: 28, r: 6, a: win(t, A('spit'), A('itch'), 0.3) });
  label('2 आरी', sx - 24, 900, -300, -60, win(t, A('saw'), A('itch'), 0.3), 'त्वचा काटती हैं');
  label('2 पकड़', sx + 48, 940, 260, -110, win(t, A('hold'), A('itch'), 0.3), 'त्वचा फैलाती हैं');
  label('खून की नली', sx - 6, 1100, -320, 120, win(t, A('suck'), A('itch'), 0.3), 'खून खींचती है');
  label('थूक की नली', sx + 10, 1060, 290, 150, win(t, A('spit'), A('itch'), 0.3), 'खून जमने नहीं देती');
  screen();
  big(`<span style="color:${GOLD}">${Math.min(6, 1 + Math.floor(6 * clamp((t - A('open')) / 1.0)))}</span> सुइयाँ`, 300, R(t, A('open'), 0.3), 110);
});
// ------------------------------------------------------------------ S6: the itch
add(A('itch'), A('next'), (t) => {
  skin(t, 1000); cam(540, 1100, 1 + 0.06 * (t - A('itch')));
  const s = R(t, A('itch') + 0.2, 1.0);
  ctx.fillStyle = rad(540, 1160, 0, 200, [[0, `rgba(230,90,90,${0.85 * s})`], [1, 'rgba(230,90,90,0)']]); ctx.beginPath(); ctx.arc(540, 1160, 200, 0, TAU); ctx.fill();
  ctx.fillStyle = `rgba(240,150,140,${s})`; ctx.beginPath(); ctx.ellipse(540, 1150, 90 * s, 40 * s, 0, Math.PI, 0); ctx.fill();
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 2, r = 150 + 20 * Math.sin(t * 9 + i); line([[540 + Math.cos(a) * r, 1120 + Math.sin(a) * r * 0.6], [540 + Math.cos(a) * (r + 40), 1120 + Math.sin(a) * (r + 40) * 0.6]], GOLD, 6, 10); }
  screen(); big('खुजली = थूक', 300, R(t, A('itch') + 0.2, 0.3), 110, GREEN);
  chip('शरीर उस थूक से लड़ता है', 460, R(t, A('itch') + 0.9, 0.3));
});
// ------------------------------------------------------------------ S7: next time it buzzes (then back to the hook frame)
add(A('next'), END, (t) => {
  if (t > END - 0.45) { hookScene(0, 0); screen(); big('6 सुइयाँ!', 300, 1, 150, GOLD); return; }
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#0b1630'], [1, '#04070f']]); ctx.fillRect(0, 0, W, H); cam(540, 960, 1);
  const x = 560 + 180 * Math.sin(t * 1.3), y = 900 + 100 * Math.sin(t * 2.1);
  mosquito(x, y, 1.4, t, { fly: true, fan: R(t, A('next') + 2.0, 0.5) });
  for (let i = 0; i < 4; i++) { const r = ((t * 220 + i * 80) % 320); ctx.strokeStyle = `rgba(255,209,102,${0.5 * (1 - r / 320)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 80, y, r, -0.6, 0.6); ctx.stroke(); }
  screen(); text('<span style="font-family:M;font-weight:900;letter-spacing:6px;color:#ffd166">bzzzz…</span>', W / 2, 480, { size: 60, a: R(t, A('next') + 0.3, 0.3) });
  big('6 सुइयाँ तैयार 😈'.replace(' 😈', ''), 300, R(t, A('next') + 2.0, 0.3), 104, RED);
});
start();
