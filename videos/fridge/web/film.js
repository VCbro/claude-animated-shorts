// Fridge = heater: the refrigeration cycle. 2D premium motion graphics (night theme), 1080x1920.
import { add, start, A, R, win, eio, eob, lerp, clamp, rnd, ctx, cam, camKeys, screen, text, label, fillRR, lin, rad, line, glowDot, flow, TAU, END, W, H } from './engine.js';

const GOLD = '#ffd166', CYAN = '#7fd8ff', RED = '#ff5a45', GREEN = '#6dff9e', HOT = '#ff7a2a', COLD = '#59c8ff';
const big = (html, y, a, size = 104, col = '#fff') => text(`<span style="color:${col};-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 8px 0 rgba(0,0,0,.45)">${html}</span>`, W / 2, y, { size, a, cls: 'ttl' });
const chip = (html, y, a) => text(`<span style="padding:12px 30px 8px;border-radius:22px;background:rgba(8,12,22,.86);box-shadow:0 0 0 3px rgba(255,255,255,.16)">${html}</span>`, W / 2, y, { size: 50, a });

function room() {
  screen(); ctx.fillStyle = lin(0, 0, 0, H, [[0, '#0b1630'], [1, '#04070f']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = lin(0, 1250, 0, H, [[0, '#1a2233'], [1, '#080b12']]); ctx.fillRect(0, 1250, W, H);
}
// side cutaway of the fridge, door on the left, back (coil + compressor) on the right, wall at the far right.
// origin top-left of the cabinet; size 520x900
const FX = 200, FY = 340, FW = 520, FH = 900;
function fridge(t, o = {}) {
  const { cut = 1, heat = 0, cold = 0, gap = 0 } = o;
  const x = FX - gap * 0.6, y = FY;
  // wall
  ctx.fillStyle = lin(860, 0, 1080, 0, [[0, '#2a3346'], [1, '#1b2232']]); ctx.fillRect(860, 180, 220, 1070);
  // heat trapped between fridge and wall
  if (heat > 0) { ctx.fillStyle = rad(x + FW + 70, y + 600, 0, 360, [[0, `rgba(255,110,40,${0.55 * heat})`], [1, 'rgba(255,90,40,0)']]); ctx.fillRect(x + FW - 300, y + 150, 700, 900); }
  // cabinet shell
  ctx.fillStyle = lin(x, 0, x + FW, 0, [[0, '#f3f6fa'], [1, '#c9d2dc']]); ctx.beginPath(); ctx.roundRect(x, y, FW, FH, 30); ctx.fill();
  // cutaway interior
  if (cut > 0) {
    ctx.save(); ctx.globalAlpha = cut;
    ctx.fillStyle = lin(0, y, 0, y + FH, [[0, `rgba(${lerp(60, 40, cold)},${lerp(90, 130, cold)},${lerp(130, 200, cold)},1)`], [1, '#16243a']]);
    ctx.beginPath(); ctx.roundRect(x + 30, y + 30, FW - 110, FH - 160, 18); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; for (const sy of [y + 320, y + 560]) ctx.fillRect(x + 30, sy, FW - 110, 8);           // shelves
    // food: bottle, bowl, box
    ctx.fillStyle = '#6fbf73'; ctx.beginPath(); ctx.roundRect(x + 80, y + 180, 50, 140, 14); ctx.fill(); ctx.fillRect(x + 95, y + 150, 20, 40);
    ctx.fillStyle = '#ffb84d'; ctx.beginPath(); ctx.ellipse(x + 260, y + 300, 80, 20, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(x + 180, y + 270, 160, 30);
    ctx.fillStyle = '#e46a6a'; ctx.beginPath(); ctx.roundRect(x + 100, y + 470, 140, 90, 10); ctx.fill();
    ctx.fillStyle = '#d9e3ee'; ctx.beginPath(); ctx.roundRect(x + 270, y + 450, 110, 110, 10); ctx.fill();
    ctx.restore();
  }
  // back: condenser coil (zig-zag) + compressor
  const cx = x + FW - 40;
  const coilT = clamp(heat * 1.2);
  ctx.strokeStyle = `rgb(${lerp(120, 255, coilT)},${lerp(130, 110, coilT)},${lerp(150, 50, coilT)})`; ctx.lineWidth = 9; ctx.lineJoin = 'round';
  if (coilT > 0.1) { ctx.shadowColor = HOT; ctx.shadowBlur = 30 * coilT; }
  ctx.beginPath(); ctx.moveTo(cx, y + 80); for (let i = 0; i < 12; i++) ctx.lineTo(cx + (i % 2 ? 50 : 0), y + 80 + i * 55); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = lin(0, y + FH - 150, 0, y + FH, [[0, '#4a5466'], [1, '#262c38']]); ctx.beginPath(); ctx.roundRect(x + FW - 170, y + FH - 140, 160, 120, 40); ctx.fill();
  // door handle
  ctx.fillStyle = '#9aa6b4'; ctx.fillRect(x + 12, y + 120, 14, 160);
}
// the refrigerant loop (for flow particles), in screen coords
function loop(x) {
  const cx = x + FW - 40;
  return { evap: [[cx - 70, FY + FH - 200], [cx - 70, FY + 60], [FX + 60, FY + 60], [FX + 60, FY + 200], [cx - 120, FY + 200]],
           toComp: [[cx - 120, FY + 200], [cx - 90, FY + FH - 90], [FX + FW - 100, FY + FH - 80]],
           coil: [[FX + FW - 60, FY + FH - 120], [cx + 25, FY + FH - 160], [cx + 25, FY + 80]],
           back: [[cx + 25, FY + 80], [cx - 40, FY + 40], [cx - 70, FY + FH - 200]] };
}

// ------------------------------------------------------------------ S1: hook — the fridge's back glows like a heater
const hook = (t) => {
  room(); camKeys(t, [[0, 680, 860, 1.1], [A('steal'), 560, 920, 0.88]]);
  fridge(t, { cut: 0, heat: 1 });
  for (let i = 0; i < 9; i++) { const life = ((t * 0.6 + i / 9) % 1); ctx.strokeStyle = `rgba(255,150,70,${0.6 * (1 - life)})`; ctx.lineWidth = 6;
    const bx = FX + FW + 20 + (i % 3) * 30; ctx.beginPath(); ctx.moveTo(bx, FY + 700 - life * 500); ctx.quadraticCurveTo(bx + 30, FY + 650 - life * 500, bx, FY + 600 - life * 500); ctx.stroke(); }
  screen(); big('फ्रिज = हीटर?', 300, 1, 130, HOT);
};
add(0, A('steal'), (t) => hook(t));
// ------------------------------------------------------------------ S2: it steals heat from inside and throws it out the back
add(A('steal'), A('gas'), (t) => {
  room(); cam(560, 920, 0.88); fridge(t, { cut: R(t, A('steal'), 0.5), heat: 0.6 });
  for (let i = 0; i < 14; i++) { const life = ((t * 0.45 + rnd(i)) % 1); const sx = FX + 100 + rnd(i + 1) * 300, sy = FY + 200 + rnd(i + 2) * 400;
    glowDot(lerp(sx, 960, eio(life)), lerp(sy, FY + 400 + rnd(i + 3) * 300, life), 14, HOT, (1 - life) * R(t, A('steal') + 0.3, 0.4)); }
  screen(); big('गर्मी की चोरी', 300, R(t, A('steal') + 0.2, 0.3), 110, HOT);
  chip(`अंदर <span style="color:${COLD}">ठंडा</span> → बाहर <span style="color:${HOT}">गरम</span>`, 460, R(t, A('steal') + 1.2, 0.4));
});
// ------------------------------------------------------------------ S3-S6: the cycle
add(A('gas'), A('tip'), (t) => {
  room(); camKeys(t, [[A('gas'), 560, 920, 0.88], [A('comp'), 600, 980, 0.95], [A('coil'), 620, 920, 0.92], [A('tip'), 560, 920, 0.88]]);
  const cold = R(t, A('expand'), 0.8), coilHeat = R(t, A('hot'), 0.6);
  fridge(t, { cut: 1, cold, heat: coilHeat });
  const L = loop(FX);
  const ga = R(t, A('gas'), 0.4);
  flow(L.evap, t, cold > 0.3 ? COLD : '#c8d4e6', { speed: 220, gap: 30, r: 8, a: ga });
  flow(L.toComp, t, COLD, { speed: 220, gap: 30, r: 8, a: ga });
  flow(L.coil, t, t > A('hot') ? HOT : '#c8d4e6', { speed: 220, gap: 30, r: 9, a: ga });
  flow(L.back, t, t > A('hot') ? '#ffb070' : '#c8d4e6', { speed: 220, gap: 30, r: 8, a: ga });
  // food heat being absorbed (red -> blue dots moving into the evaporator)
  const ab = win(t, A('absorb'), A('coil'), 0.3);
  for (let i = 0; i < 10; i++) { const life = ((t * 0.6 + rnd(i)) % 1); glowDot(lerp(FX + 120 + rnd(i) * 250, FX + 70, life), lerp(FY + 250 + rnd(i + 1) * 300, FY + 70, life), 10, life < 0.5 ? HOT : COLD, ab * (1 - life)); }
  // compressor piston pump
  const pa = win(t, A('comp'), A('coil') + 0.5, 0.3);
  if (pa > 0) { const px = FX + FW - 90, py = FY + FH - 80 + 18 * Math.sin(t * 16); fillRR(px - 30, py - 40, 60, 30, 6, `rgba(255,209,102,${pa})`); }
  // outgoing heat waves from the coil
  const hw = R(t, A('coil'), 0.4);
  for (let i = 0; i < 8; i++) { const life = ((t * 0.7 + i / 8) % 1); ctx.strokeStyle = `rgba(255,130,60,${0.7 * (1 - life) * hw})`; ctx.lineWidth = 6;
    const bx = FX + FW + 40 + life * 160; ctx.beginPath(); ctx.moveTo(bx, FY + 250 + i * 60); ctx.quadraticCurveTo(bx + 25, FY + 220 + i * 60, bx + 50, FY + 250 + i * 60); ctx.stroke(); }
  label('ख़ास गैस', FX + 60, FY + 130, 0, -170, win(t, A('gas') + 0.4, A('expand'), 0.3), 'पाइपों में घूमती है');
  label('फैली → ठंडी', FX + FW - 110, FY + 300, -220, -230, win(t, A('expand'), A('comp'), 0.3), 'खाने की गर्मी सोखती है');
  label('कंप्रेसर', FX + FW - 90, FY + FH - 80, -300, -60, win(t, A('comp'), A('coil') + 0.3, 0.3), 'गैस को दबाता है');
  label('पीछे की जाली', FX + FW - 15, FY + 450, 60, -330, win(t, A('coil'), A('tip'), 0.3), 'गर्मी कमरे में');
  screen();
  big(`<span style="color:${COLD}">ठंडी</span> गैस`, 300, win(t, A('expand') + 0.2, A('comp'), 0.25), 110);
  big(`दबाव = <span style="color:${HOT}">गरम</span>`, 300, win(t, A('comp') + 0.4, A('coil'), 0.25), 110);
  big(`गर्मी <span style="color:${HOT}">कमरे में</span>`, 300, win(t, A('coil') + 0.2, A('tip'), 0.25), 104);
});
// ------------------------------------------------------------------ S7: keep it away from the wall
add(A('tip'), A('heater'), (t) => {
  room(); cam(560, 920, 0.88);
  const g = eio((t - A('tip') - 0.3) / 1.2) * (1 - R(t, A('bill'), 0.6));
  fridge(t, { cut: 0, heat: 0.5 + 0.5 * R(t, A('bill'), 0.5), gap: 260 * (1 - g) * 0 + 0, });
  const gapPx = lerp(40, 160, g);
  // moving the fridge: drawn as an offset arrow + gap marker
  ctx.strokeStyle = GOLD; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(FX + FW + 75, FY + 460); ctx.lineTo(850, FY + 460); ctx.moveTo(FX + FW + 95, FY + 440); ctx.lineTo(FX + FW + 75, FY + 460); ctx.lineTo(FX + FW + 95, FY + 480); ctx.moveTo(830, FY + 440); ctx.lineTo(850, FY + 460); ctx.lineTo(830, FY + 480); ctx.stroke();
  screen();
  big('दीवार से <span style="color:#ffd166">दूर</span>', 300, win(t, A('tip') + 0.2, A('bill'), 0.25), 110);
  chip(`<span style="color:${GOLD}">↔</span> थोड़ी जगह छोड़ें`, 460, win(t, A('tip') + 0.8, A('bill'), 0.3));
  const b = R(t, A('bill'), 0.4); const amt = Math.round(lerp(800, 1450, eio((t - A('bill')) / 2.2)));
  chip(`गर्मी फँसी → <span style="color:${RED}">बिल ₹${amt}</span> ↑`, 460, b);
});
// ------------------------------------------------------------------ S8: cold inside, heater outside (then back to the hook frame)
add(A('heater'), END, (t) => {
  if (t > END - 0.45) { hook(0); return; }
  room(); cam(560, 920, 0.88);
  fridge(t, { cut: 1, cold: 1, heat: 1 });
  ctx.fillStyle = rad(FX + 200, FY + 400, 0, 380, [[0, 'rgba(89,200,255,.35)'], [1, 'rgba(89,200,255,0)']]); ctx.fillRect(0, 0, 1080, 1400);
  screen();
  big(`<span style="color:${COLD}">अंदर ठंडा</span>`, 230, R(t, A('heater') + 0.2, 0.3), 100);
  big(`<span style="color:${HOT}">बाहर हीटर</span>`, 335, R(t, A('heater') + 1.2, 0.3), 100);
});
start();
