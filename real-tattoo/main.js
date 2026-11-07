// One Line, For Life — a watercolor film about the craft of a real tattoo. 1080 x 1920, render(t) is a pure function of t.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
window.DUR = 47;

// ---------- voice table (start s, duration s, subtitle) — mix.py reads the same table from timeline.json ----------
const VO = [
  ['v01', 0.50, 3.578, 'Every real tattoo starts as a single line on paper.'],
  ['v02', 4.68, 4.337, 'The artist draws it, and redraws it, until every curve sits right.'],
  ['v03', 9.62, 3.432, 'A purple stencil carries the design onto clean skin.'],
  ['v04', 14.20, 4.823, 'Then, the machine. Its needles strike up to 3,000 times a minute.'],
  ['v05', 19.62, 4.329, 'Each stroke leaves ink about 1.5 millimeters below the surface.'],
  ['v06', 24.55, 3.465, 'Too shallow, and it fades. Too deep, and it blurs.'],
  ['v07', 28.62, 4.679, "Down here, the body's own cells catch the pigment, and hold it in place."],
  ['v08', 33.90, 2.868, 'Linework first. Then shading. Then color.'],
  ['v09', 37.37, 2.711, 'In about two weeks, the surface heals over.'],
  ['v10', 41.30, 3.003, 'And the line from that first page stays for life.'],
];
const SUB = VO.map(([id, s, d, txt]) => ({ id, t0: s - .15, t1: s + d + .45, txt }));

// ---------- colours ----------
const SKIN = '#e9c6a8', SKIN2 = '#cf9e7f', SKIN3 = '#b98466', DERM = '#efc4b0', EPI = '#e3ac90';
const FAT = '#f1d896', FAT2 = '#d6b064', OCHRE = '#b98a5a', OCHRE2 = '#a0714a';
const PURPLE = '#6a4f9e', TINK = '#22201f', BLUE = '#2f4f86', RED = '#c8442a', FERN = '#5f8a4a', GREY = '#5b5f66';
const STEEL = '#8a9099', CELL = '#b4a3cf', CELLN = '#76659c', DOT = '#262a36';

// ---------- timeline (all cue times live here) ----------
const T = {
  hook: [0.2, 2.4], draft1: [2.5, 3.5], draft2: [5.9, 7.2], ink: [7.25, 9.0], accent: 8.95, noteDraft: 7.4,
  craneArm: [9.6, 11.6], armPaint: [9.85, 11.8], stencil: [11.55, 12.55], noteStencil: 11.9,
  quiet1: [13.05, 13.7], machineIn: [13.55, 13.95], line: [13.95, 19.1], machineOut: [19.0, 19.6], noteSpeed: 16.2,
  craneSkin: [19.2, 21.0], proj: [18.9, 19.9], top: [19.55, 20.2], epi: [19.8, 20.4], derm: [20.0, 21.0], fat: [20.6, 21.5],
  ruler: [20.3, 21.3], labEpi: 20.7, labDerm: 21.1, labFat: 21.5, needle: [21.0, 24.3], dots: [21.15, 24.1], labInk: 22.2,
  toInsets: [24.2, 25.2], shallow: [24.55, 25.15], fade: [25.4, 26.9], deep: [25.8, 26.4], blur: [26.5, 27.8],
  pushCells: [28.2, 29.6], cells: [28.9, 30.5], drift: [30.0, 31.7], labCells: 30.4,
  craneUp: [33.0, 34.4], shade: [35.3, 35.9], color: [36.1, 36.9],
  day1: 37.4, day7: 38.4, day14: 39.4, quiet2: [40.1, 41.0],
  pullBack: [41.0, 43.8], lastLeaf: [43.3, 44.7], title: 42.6,
};

// ---------- camera: one world, one world → screen function ----------
const camX = monotone([[0, 590], [2.4, 590], [4.4, 540], [13.7, 540], [15.5, 556], [19.2, 556], [21, 540], [47, 540]]);
const camY = monotone([[0, 760], [2.4, 760], [4.4, 900], [9.6, 900], [11.6, 2900], [13.7, 2900], [15.5, 2875], [19.2, 2875], [21.0, 4700], [24.2, 4700], [25.2, 5100], [28.2, 5100], [29.6, 4650], [33.0, 4650], [34.4, 2900], [41.0, 2900], [43.8, 1960], [47, 1960]]);
const camZ = monotone([[0, 2.1], [2.4, 1.9], [4.4, 1.0], [9.0, 1.04], [9.6, 1.04], [11.6, 1.0], [13.7, 1.0], [15.5, 1.45], [19.2, 1.5], [21.0, 1.0], [24.2, 1.0], [25.2, .9], [28.2, .9], [29.6, 2.6], [33.0, 2.7], [34.4, 1.2], [41.0, 1.22], [43.8, .48], [47, .47]]);
let CAM = { x: 540, y: 900, z: 1 };
const S = (x, y) => [(x - CAM.x) * CAM.z + W / 2, (y - CAM.y) * CAM.z + H / 2];
const toWorld = () => ctx.setTransform(CAM.z, 0, 0, CAM.z, W / 2 - CAM.x * CAM.z, H / 2 - CAM.y * CAM.z);
const toScreen = () => ctx.setTransform(1, 0, 0, 1, 0, 0);

// ---------- placement of the design ----------
const PAGE = { x: 540, y: 900, sc: 1.05 }, ARM = { x: 540, y: 2870, sc: .82 };
const place = (pts, o) => pts.map(([x, y]) => [o.x + x * o.sc, o.y + y * o.sc]);
function wobble(pts, amp, seed) {           // a hand-sketched line: low-frequency wander + a little overshoot at both ends
  const n = pts.length, out = pts.map(([x, y], i) => [x + amp * (vnoise(seed + i * .35) * 2 - 1), y + amp * (vnoise(seed + 50 + i * .35) * 2 - 1)]);
  const ext = (a, b, k) => [a[0] + (a[0] - b[0]) * k, a[1] + (a[1] - b[1]) * k];
  if (n > 3) { out.unshift(ext(out[0], out[1], .9)); out.push(ext(out[n - 1], out[n - 2], .9)); }
  return out;
}

// ---------- washes (3 jittered passes: pooled edges) ----------
function washPoly(c, pts, col, a, passes = 3, jit = 5) {
  for (let p = 0; p < passes; p++) {
    c.beginPath();
    pts.forEach(([x, y], i) => { const X = x + rnd(-jit, jit), Y = y + rnd(-jit, jit); i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
    c.closePath(); c.fillStyle = rgba(col, a / passes * 1.6); c.fill();
  }
}
const blob = (cx, cy, rx, ry, n = 22, rough = .12, seed = 1) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, r = 1 + rough * (vnoise(seed + i * .7) * 2 - 1); return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]; });
function centroid(p) { let x = 0, y = 0; for (const q of p) { x += q[0]; y += q[1]; } return [x / p.length, y / p.length]; }
function radiusOf(p, c) { return Math.max(...p.map(q => Math.hypot(q[0] - c[0], q[1] - c[1]))); }

// sprite of a world region at 2x, built once
function worldSprite(x0, y0, w, h, fn, k = 2) {
  const c = document.createElement('canvas'); c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
  const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); fn(g);
  return { cv: c, x0, y0, w, h };
}
const drawSprite = (sp, am = 1) => { ctx.globalAlpha = am; ctx.drawImage(sp.cv, sp.x0, sp.y0, sp.w, sp.h); ctx.globalAlpha = 1; };
// brush-edge wipe: reveal what is above a wavy line that moves down
function wipeDown(yTop, yBot, p, x0, x1, seed, fn) {
  if (p <= 0) return; if (p >= 1) { fn(); return; }
  const y = lerp(yTop - 40, yBot + 40, p);
  ctx.save(); ctx.beginPath(); ctx.moveTo(x0, yTop - 60);
  for (let x = x0; x <= x1; x += 24) ctx.lineTo(x, y + 26 * (fbm(seed + x * .006) - .5) + 10 * Math.sin(x * .05 + seed));
  ctx.lineTo(x1, yTop - 60); ctx.closePath(); ctx.clip(); fn(); ctx.restore();
}
function wipeCircle(cx, cy, r, fn) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Math.max(.1, r), 0, 7); ctx.clip(); fn(); ctx.restore(); }

// ---------- hand notes, leaders, type ----------
let TXT = [];
function hand(id, txt, x, y, p, o = {}) {            // world coords; written left to right over a paper halo
  if (p <= 0) return;
  const size = o.size || 38, align = o.align || 'left';
  ctx.font = `${o.w || 600} ${size}px Caveat`; const tw = ctx.measureText(txt).width;
  const xl = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  ctx.save(); ctx.beginPath(); ctx.rect(xl - 10, y - size, (tw + 20) * eo(p), size * 1.5); ctx.clip();
  ctx.textAlign = 'left'; ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = 12;
  ctx.fillStyle = rgba(o.col || INK, (o.a ?? .9) * (o.am ?? 1));
  ctx.fillText(txt, xl, y); ctx.shadowBlur = 0; ctx.fillText(txt, xl, y); ctx.restore();
  if ((o.am ?? 1) > .5) { const [a, b] = S(xl, y - size * .8), [c2, d] = S(xl + tw, y + size * .25); TXT.push({ id, text: txt, x0: a, y0: b, x1: c2, y1: d }); }
}
function leader(x0, y0, x1, y1, p, am = 1, bend = 14) {
  if (p <= 0) return;
  const pts = qcurve(x0, y0, x1, y1, bend, 16), n = Math.max(2, Math.ceil(pts.length * clamp(p)));
  ctx.beginPath(); pts.slice(0, n).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = rgba(INK, .75 * am); ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();
  if (p >= 1) { ctx.beginPath(); ctx.arc(x1, y1, 3, 0, 7); ctx.fillStyle = rgba(INK, .8 * am); ctx.fill(); }
}
function mono(id, txt, x, y, a, size = 22) {
  if (a <= 0) return;
  ctx.font = `400 ${size}px "IBM Plex Mono"`; ctx.letterSpacing = '4px'; ctx.textAlign = 'left';
  ctx.fillStyle = rgba(INK, .78 * a); ctx.fillText(txt, x, y); const tw = ctx.measureText(txt).width; ctx.letterSpacing = '0px';
  if (a > .5) { const m = ctx.getTransform(); const X = v => m.a * v + m.e, Y = v => m.d * v + m.f; TXT.push({ id, text: txt, x0: X(x), y0: Y(y - size), x1: X(x + tw), y1: Y(y + 4) }); }
}

// ---------- built once ----------
let PAPER_IMG, D, HOOK, DRAFT1, DRAFT2, PINK, STEN, TLINE, LASTLEAF, ARMSP, TOPSP, EPISP, DERMSP, FATSP, INSETS, DOTS, CELLS, FLAKES, MACH, SHAD, COLR;
const segLens = L => L.map(s => { let d = 0; for (let i = 1; i < s.pts.length; i++) d += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); return d; });

function build() {
  D = swallowDesign();
  // page: the first wet line, two sketch drafts, the inked design
  HOOK = withSeed(11, () => mk(place(wobble(D.P.fwLead.concat(D.P.fwTrail.slice(1)), 2, 3), PAGE), 15, OCHRE2, { prof: 'brush', nb: 7, a: .82 }));
  DRAFT1 = withSeed(12, () => D.lines.filter(l => l.k !== 'fwLead').map((l, i) => mk(place(wobble(l.pts, 9, 100 + i * 7), PAGE), 4.2 * l.w, OCHRE, { prof: 'even', nb: 2, a: .5, rough: .4 })));
  DRAFT2 = withSeed(13, () => D.lines.map((l, i) => mk(place(wobble(l.pts, 4, 300 + i * 5), PAGE), 3.4 * l.w, OCHRE2, { prof: 'even', nb: 2, a: .6, rough: .3 })));
  PINK = withSeed(14, () => D.lines.map(l => mk(place(l.pts, PAGE), 4.6 * l.w, INK, { prof: l.leaf ? 'leaf' : 'brush', nb: 2, a: .9, rough: .18 })));
  const tip = D.P.stem[D.P.stem.length - 1];
  LASTLEAF = withSeed(15, () => mk(place(Q(tip[0], tip[1], tip[0] + 14, tip[1] + 26, tip[0] + 4, tip[1] + 52, 8), PAGE), 6, FERN, { prof: 'leaf', nb: 3, a: .85 }));
  // arm: stencil and tattoo line
  STEN = withSeed(16, () => D.lines.map((l, i) => mk(place(wobble(l.pts, 1.2, 500 + i), ARM), 2.6 * l.w, PURPLE, { prof: 'even', nb: 0, a: .55, rough: .35 })));
  TLINE = withSeed(17, () => D.lines.map(l => mk(place(l.pts, ARM), 5.6 * l.w, TINK, { prof: l.leaf ? 'leaf' : 'even', nb: 2, a: .93, rough: .12 })));
  TLINE.len = segLens(TLINE); TLINE.tot = TLINE.len.reduce((a, b) => a + b, 0);
  const R = k => place(D.R[k], ARM);
  SHAD = ['shFw', 'shNw', 'shBelly'].map(k => ({ p: R(k), col: GREY, a: .42 }));
  COLR = [['back', BLUE, .62], ['fw', BLUE, .55], ['nw', BLUE, .55], ['tailU', BLUE, .55], ['tailL', BLUE, .55], ['throat', RED, .78]].map(([k, col, a]) => ({ p: R(k), col, a }));
  COLR.leaves = withSeed(18, () => D.leaves.map(l => mk(place(l, ARM), 11, FERN, { prof: 'leaf', nb: 3, a: .8 })));
  [...SHAD, ...COLR].forEach((r, i) => { r.c = centroid(r.p); r.r = radiusOf(r.p, r.c) + 10; r.seed = 900 + i; });

  // the forearm, painted once at 2x
  ARMSP = withSeed(20, () => worldSprite(150, 1940, 780, 2000, g => {
    // a forearm study: muscle bulge below the elbow, narrowing to the wrist, the heel of the hand flaring out; soft ends
    const hwL = y => y < 2350 ? lerp(300, 330, ss(seg(y, 1990, 2350))) : y < 3650 ? lerp(330, 205, ss(seg(y, 2350, 3650))) : lerp(205, 262, ss(seg(y, 3650, 3900)));
    const hwR = y => y < 2350 ? lerp(296, 312, ss(seg(y, 1990, 2350))) : y < 3650 ? lerp(312, 196, ss(seg(y, 2350, 3650))) : lerp(196, 214, ss(seg(y, 3650, 3900)));
    const L = [], Rr = [];
    for (let y = 1990; y <= 3910; y += 24) { L.push([540 - hwL(y) + 8 * Math.sin(y * .004), y]); Rr.push([540 + hwR(y) + 6 * Math.sin(y * .0035 + 1), y]); }
    const poly = L.concat(rev(Rr));
    washPoly(g, poly, SKIN, .66, 3, 6);
    for (let k = 0; k < 5; k++) { const y = rnd(2100, 3700); washPoly(g, blob(540 + rnd(-120, 120), y, rnd(120, 220), rnd(180, 320), 24, .2, k), '#e2b596', .12, 2, 8); }
    for (const side of [-1, 1]) {
      const E = side < 0 ? L : Rr;
      drawS(g, mk(E.map(([x, y]) => [x - side * 40, y]), 80, SKIN2, { prof: 'even', nb: 8, a: .2, rough: .3 }));
      drawS(g, mk(E.map(([x, y]) => [x - side * 10, y]), 16, SKIN2, { prof: 'even', nb: 5, a: .35, rough: .35 }));
      drawS(g, mk(E.map(([x, y]) => [x - side * 2, y]), 3.5, SKIN3, { prof: 'even', nb: 2, a: .4, rough: .6 }));
    }
    drawS(g, mk(qctrl(560, 2060, 640, 2500, 600, 3000, 20), 60, SKIN2, { prof: 'leaf', nb: 6, a: .12 }));          // the line between two forearm muscles
    drawS(g, mk(qcurve(350, 3690, 735, 3694, 14, 14), 5, SKIN3, { prof: 'leaf', nb: 2, a: .35 }));              // wrist creases
    drawS(g, mk(qcurve(360, 3724, 725, 3728, 10, 14), 3.5, SKIN3, { prof: 'leaf', nb: 2, a: .25 }));
    g.globalCompositeOperation = 'destination-out';
    let gr = g.createLinearGradient(0, 1985, 0, 2160); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(150, 1940, 780, 220);
    gr = g.createLinearGradient(0, 3760, 0, 3915); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(150, 3760, 780, 180);
  }));

  // skin cross-section: top face, epidermis, dermis, fat (each its own sprite, painted in turn)
  const X0 = 150, X1 = 930, Y0 = 4200;
  TOPSP = withSeed(21, () => worldSprite(100, 4100, 900, 140, g => {
    washPoly(g, [[195, 4148], [975, 4148], [930, Y0], [150, Y0]], SKIN, .7, 3, 3);
    washPoly(g, [[565, 4148], [605, 4148], [560, Y0], [520, Y0]], TINK, .8, 3, 2);           // the tattoo line, seen from above
    drawS(g, mk([[195, 4148], [975, 4148]], 3, SKIN3, { prof: 'even', nb: 0, a: .7 }));
  }));
  EPISP = withSeed(22, () => worldSprite(100, 4180, 900, 120, g => {
    const top = [], bot = [];
    for (let x = X0; x <= X1; x += 20) { top.push([x, Y0 + 2 * Math.sin(x * .03)]); bot.push([x, Y0 + 34 + 9 * Math.sin(x * .045) + 5 * Math.sin(x * .11)]); }
    washPoly(g, top.concat(rev(bot)), EPI, .8, 3, 2);
    drawS(g, mk(top, 4, SKIN3, { prof: 'even', nb: 2, a: .8 }));
    drawS(g, mk(bot, 3, '#c98d74', { prof: 'even', nb: 0, a: .5, rough: .4 }));
  }));
  DERMSP = withSeed(23, () => worldSprite(100, 4200, 900, 840, g => {
    const top = []; for (let x = X0; x <= X1; x += 20) top.push([x, Y0 + 30 + 9 * Math.sin(x * .045)]);
    washPoly(g, top.concat([[X1, 5040], [X0, 5040]]), DERM, .66, 3, 4);
    for (let k = 0; k < 26; k++) { const y = rnd(4290, 4980), x = rnd(170, 800); drawS(g, mk(qcurve(x, y, x + rnd(80, 160), y + rnd(-14, 14), rnd(-12, 12), 10), rnd(2, 4), '#d79a8a', { prof: 'leaf', nb: 0, a: .35, rough: .5 })); }
    // a hair follicle and a small blood vessel, for scale and life
    drawS(g, mk(qcurve(800, 4205, 735, 4800, 20, 20), 26, '#d9a189', { prof: 'even', nb: 4, a: .55 }));
    drawS(g, mk(qcurve(800, 4205, 735, 4800, 20, 20), 4, '#6b4a3a', { prof: 'even', nb: 0, a: .6 }));
    washPoly(g, blob(735, 4815, 24, 20, 16, .15, 3), '#c98a73', .7, 3, 2);
    drawS(g, mk(qctrl(240, 4900, 330, 4830, 430, 4910, 16), 9, '#b0566a', { prof: 'even', nb: 2, a: .55 }));
    drawS(g, mk(qctrl(250, 4920, 340, 4860, 440, 4930, 16), 6, '#7e5a9a', { prof: 'even', nb: 2, a: .45 }));
    for (const x of [X0, X1]) drawS(g, mk([[x, Y0 + 4], [x, 5030]], 3, INK2, { prof: 'even', nb: 0, a: .35 }));
    g.globalCompositeOperation = 'destination-out'; const gr = g.createLinearGradient(0, 4980, 0, 5040); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gr; g.fillRect(100, 4980, 900, 60);
  }));
  FATSP = withSeed(24, () => worldSprite(100, 4960, 900, 330, g => {
    for (let k = 0; k < 120; k++) { const x = rnd(170, 910), y = rnd(5010, 5230), r = rnd(22, 38); const b = blob(x, y, r, r * rnd(.8, 1), 16, .1, k); washPoly(g, b, FAT, .5, 2, 1.5); g.beginPath(); b.forEach(([a, c], i) => i ? g.lineTo(a, c) : g.moveTo(a, c)); g.closePath(); g.strokeStyle = rgba(FAT2, .45); g.lineWidth = 2; g.stroke(); }
    g.globalCompositeOperation = 'destination-out'; const gr = g.createLinearGradient(0, 5170, 0, 5270); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gr; g.fillRect(100, 5170, 900, 120);
  }));
  // two small specimens: too shallow, too deep
  INSETS = [[165, 'shallow'], [575, 'deep']].map(([x, k], j) => {
    const sp = withSeed(30 + j, () => worldSprite(x - 10, 5370, 360, 420, g => {
      const xx = x, w = 340;
      washPoly(g, [[xx, 5410], [xx + w, 5410], [xx + w, 5650], [xx, 5650]], DERM, .66, 3, 3);
      washPoly(g, [[xx, 5380], [xx + w, 5380], [xx + w, 5412], [xx, 5412]], EPI, .8, 3, 2);
      drawS(g, mk([[xx, 5381], [xx + w, 5381]], 3, SKIN3, { prof: 'even', nb: 0, a: .8 }));
      for (let k2 = 0; k2 < 24; k2++) { const bx = rnd(xx + 20, xx + w - 20), by = rnd(5668, 5745), r = rnd(14, 22); washPoly(g, blob(bx, by, r, r, 12, .1, k2), FAT, .55, 2, 1); }
      g.globalCompositeOperation = 'destination-out'; const gr = g.createLinearGradient(0, 5720, 0, 5780); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gr; g.fillRect(xx - 10, 5720, 360, 70);
    }));
    const dots = withSeed(40 + j, () => Array.from({ length: 26 }, () => k === 'shallow' ? [rnd(x + 120, x + 220), rnd(5386, 5412), rnd(4, 7)] : [rnd(x + 130, x + 210), rnd(5684, 5728), rnd(4, 7)]));
    return { sp, x, k, dots };
  });
  // ink droplets under the needle, and the cells that come for them
  DOTS = withSeed(50, () => Array.from({ length: 72 }, (_, i) => { const a = rnd(0, 7), r = Math.sqrt(rnd()); return { x: 540 + Math.cos(a) * r * 58, y: 4655 + Math.sin(a) * r * 78, r: rnd(4, 8.5), t: lerp(T.dots[0], T.dots[1], i / 72) + rnd(-.05, .05), s: mk(polar(0, 0, rnd(0, 7), rnd(5, 12), rnd(-2, 2), 5), rnd(7, 12), DOT, { prof: 'leaf', nb: 0, a: .9, rough: .35 }) }; }));
  CELLS = withSeed(51, () => [[488, 4600], [585, 4592], [612, 4682], [534, 4732], [470, 4690], [545, 4655], [430, 4610], [650, 4610]].map(([x, y], i) => ({ x, y, r: rnd(30, 40), seed: i * 13 + 3 })));
  for (const d of DOTS) { let best = 0, bd = 1e9; CELLS.forEach((c, i) => { const dd = Math.hypot(c.x - d.x, c.y - d.y); if (dd < bd) { bd = dd; best = i; } }); d.cell = best; d.ox = withSeed(Math.round(d.x * 7), () => rnd(-.45, .45)); d.oy = withSeed(Math.round(d.y * 3), () => rnd(-.45, .45)); }
  FLAKES = withSeed(52, () => Array.from({ length: 70 }, () => { const x = ARM.x + rnd(-230, 230), y = ARM.y + rnd(-200, 180); return mk(polar(x, y, rnd(0, 7), rnd(8, 22), rnd(-4, 4), 5), rnd(5, 10), pick(['#f6e7da', '#efe0d2', '#d9c2b2']), { prof: 'leaf', nb: 2, a: .75, rough: .5 }); }));
  // the machine: grip tube + motor block, drawn in local coords, needle tip at (0,0), body toward upper right
  MACH = withSeed(53, () => {
    const L = [];
    L.push(mk(polar(0, 0, -1.05, 120, 0, 8), 8, '#3a3f47', { prof: 'tip', nb: 0, a: .9 }));
    L.push(mk(polar(Math.cos(-1.05) * 110, Math.sin(-1.05) * 110, -1.05, 330, 0, 12), 54, STEEL, { prof: 'even', nb: 8, a: .85 }));
    L.push(mk(polar(Math.cos(-1.05) * 130, Math.sin(-1.05) * 130, -1.05, 300, 0, 12), 10, '#5c636d', { prof: 'even', nb: 2, a: .6 }));
    L.push(mk(polar(Math.cos(-1.05) * 420, Math.sin(-1.05) * 420, -1.05, 150, 0, 8), 104, '#3e4a5a', { prof: 'even', nb: 9, a: .9 }));
    L.push(mk(polar(Math.cos(-1.05) * 560, Math.sin(-1.05) * 560, -1.05, 260, 40, 12), 12, '#2b2f36', { prof: 'even', nb: 2, a: .8 }));
    return { L, spr: sprite(L) };
  });
}

// ---------- the parts of the frame ----------
function pagePart(t) {
  drawS(ctx, HOOK, eio(seg(t, ...T.hook)));
  const a1 = 1 - .55 * seg(t, 5.9, 7.2);
  drawList(ctx, DRAFT1, seg(t, ...T.draft1), null, a1);
  drawList(ctx, DRAFT2, seg(t, ...T.draft2), null, 1 - .3 * seg(t, 7.3, 9));
  drawList(ctx, PINK, seg(t, ...T.ink));
  if (t > T.accent) withSeed(60, () => washPoly(ctx, place(D.R.throat, PAGE), RED, .7 * ss(seg(t, T.accent, T.accent + .5)), 3, 2));
  if (t > T.lastLeaf[0]) drawS(ctx, LASTLEAF, .7 * eo(seg(t, ...T.lastLeaf)));          // the brush lifts mid-stroke
  const pd = seg(t, T.noteDraft, T.noteDraft + .7);
  leader(860, 1160, 828, 1000, seg(t, T.noteDraft + .3, T.noteDraft + .9));
  hand('draft', 'draft 3, the one', 860, 1210, pd, { align: 'center', size: 40 });
}
function armPart(t) {
  const pa = seg(t, ...T.armPaint);
  wipeDown(1940, 3940, pa, 100, 980, 7, () => drawSprite(ARMSP));
  // healing veil + halo sit under the line
  const heal = seg(t, T.day1 - .3, T.day1 + .2), healed = ss(seg(t, T.day14 - .2, T.day14 + .7));
  if (heal > 0 && healed < 1) { const ha = .3 * heal * (1 - .55 * ss(seg(t, T.day7 - .2, T.day7 + .4))) * (1 - healed); withSeed(61, () => { for (let k = 0; k < 4; k++) washPoly(ctx, blob(ARM.x - 10 + rnd(-30, 30), ARM.y + rnd(-25, 25), 290 - k * 40, 255 - k * 35, 48, .1, 9 + k), '#d98a78', ha * .45, 3, 7); }); }
  // stencil, fading as the line covers it
  const ps = seg(t, ...T.stencil), sa = 1 - .75 * seg(t, T.line[1] - 1, T.line[1] + 1.5);
  if (ps > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, lerp(2560, 3200, eio(ps))); ctx.clip(); drawList(ctx, STEN, 1, null, sa); ctx.restore(); }
  // shading and colour, under the line
  for (const r of SHAD) { const p = seg(t, ...T.shade); if (p > 0) wipeCircle(r.c[0], r.c[1], r.r * eo(p), () => withSeed(r.seed, () => washPoly(ctx, r.p, r.col, r.a, 3, 3))); }
  const pc = seg(t, ...T.color);
  if (pc > 0) {
    for (const r of COLR) wipeCircle(r.c[0], r.c[1], r.r * eo(pc * 1.25), () => withSeed(r.seed, () => washPoly(ctx, r.p, r.col, r.a, 3, 3)));
    drawList(ctx, COLR.leaves, eo(pc));
  }
  // the tattoo line, drawn by the machine
  const pl = seg(t, ...T.line); let tip = null;
  if (pl > 0) {
    let L = pl * TLINE.tot;
    for (let i = 0; i < TLINE.length; i++) {
      if (L <= 0) break; const f = Math.min(1, L / TLINE.len[i]); drawS(ctx, TLINE[i], f);
      if (f < 1) { const P = TLINE[i].pts, m = (P.length - 1) * f, k = Math.floor(m); tip = [lerp(P[k][0], P[Math.min(k + 1, P.length - 1)][0], m - k), lerp(P[k][1], P[Math.min(k + 1, P.length - 1)][1], m - k)]; }
      L -= TLINE.len[i];
    }
    if (!tip) tip = TLINE[TLINE.length - 1].pts.at(-1);
  }
  // day 7: dry, flaking skin dulls the colour
  const fl = ss(seg(t, T.day7 - .25, T.day7 + .25)) * (1 - healed);
  if (fl > 0) { withSeed(62, () => washPoly(ctx, blob(ARM.x - 10, ARM.y - 10, 270, 240, 22, .1, 5), SKIN, .22 * fl, 2, 6)); for (const f of FLAKES) drawS(ctx, f, 1, null, fl); }
  // the machine
  if (t > T.machineIn[0] && t < T.machineOut[1]) {
    const tp = tip || TLINE[0].pts[0], fr = Math.floor(t * 24), jx = (hash(fr) - .5) * 3, jy = (hash(fr + 7) - .5) * 3;
    const off = 520 * (1 - eo(seg(t, ...T.machineIn))) + 520 * ei(seg(t, ...T.machineOut));
    ctx.save(); ctx.translate(tp[0] + jx + off * .5, tp[1] + jy - off * .87); ctx.drawImage(MACH.spr.cv, MACH.spr.x0, MACH.spr.y0); ctx.restore();
  }
  // notes
  leader(830, 2560, 690, 2662, seg(t, T.noteStencil + .2, T.noteStencil + .8), 1 - seg(t, 14, 14.5));
  hand('stencil', 'stencil', 830, 2540, seg(t, T.noteStencil, T.noteStencil + .5), { align: 'center', am: 1 - seg(t, 14, 14.5) });
  hand('speed', 'up to 3,000 strikes / min', 330, 3170, seg(t, T.noteSpeed, T.noteSpeed + .8), { size: 40, am: 1 - seg(t, 19.1, 19.6) });
  const dl = (id, txt, at, y) => hand(id, txt, 540, y, seg(t, at, at + .5), { align: 'center', size: 42, am: 1 - seg(t, T.pullBack[0] + .4, T.pullBack[0] + 1.2) });
  dl('d1', 'day 1 · tender', T.day1, 3190); dl('d7', 'day 7 · flaking', T.day7, 3245); dl('d14', 'day 14 · healed', T.day14, 3300);
}
function skinPart(t) {
  // projection lines from the arm down to the cut-away
  const pp = seg(t, ...T.proj);
  if (pp > 0) {
    const fade = 1 - seg(t, T.craneUp[0], T.craneUp[0] + .6);
    ctx.save(); ctx.strokeStyle = rgba(INK, .55 * fade); ctx.lineWidth = 2; ctx.setLineDash([10, 9]);
    ctx.strokeRect(527, 2905, 44, 44);
    for (const [x0, x1] of [[527, 195], [571, 975]]) { ctx.beginPath(); ctx.moveTo(x0, 2949); ctx.lineTo(lerp(x0, x1, eio(pp)), lerp(2949, 4148, eio(pp))); ctx.stroke(); }
    ctx.restore();
  }
  wipeDown(4100, 4240, seg(t, ...T.top), 100, 1000, 3, () => drawSprite(TOPSP));
  wipeDown(4180, 4300, seg(t, ...T.epi), 100, 1000, 4, () => drawSprite(EPISP));
  wipeDown(4230, 5040, seg(t, ...T.derm), 100, 1000, 5, () => drawSprite(DERMSP));
  wipeDown(4960, 5290, seg(t, ...T.fat), 100, 1000, 6, () => drawSprite(FATSP));
  // ruler: 1 mm = 300 px
  const pr = seg(t, ...T.ruler), lf = 1 - seg(t, T.craneUp[0], T.craneUp[0] + .5);
  if (pr > 0) {
    ctx.strokeStyle = rgba(INK, .7 * lf); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(960, 4200); ctx.lineTo(960, lerp(4200, 5100, eio(pr))); ctx.stroke();
    for (let k = 0; k <= 6; k++) { const y = 4200 + k * 150; if (y > lerp(4200, 5100, eio(pr))) break; ctx.beginPath(); ctx.moveTo(960, y); ctx.lineTo(k % 2 ? 972 : 982, y); ctx.stroke(); if (k % 2 === 0) { ctx.setTransform(CAM.z, 0, 0, CAM.z, W / 2 - CAM.x * CAM.z, H / 2 - CAM.y * CAM.z); mono('mm' + k, k ? `${k / 2}` : '0', 990, y + 8, lf * ss(seg(t, T.ruler[0] + k * .12, T.ruler[0] + k * .12 + .3)), 20); } }
    mono('mmu', 'MM', 984, 5150, lf * ss(seg(t, T.ruler[1], T.ruler[1] + .3)), 18);
  }
  // the needle in section: a grouping of three, striking faster than the eye
  if (t > T.needle[0] && t < T.needle[1] + .7) {
    const fr = Math.floor(t * 24), up = ei(seg(t, T.needle[1], T.needle[1] + .7)) * 700, inn = 1 - eo(seg(t, T.needle[0], T.needle[0] + .4));
    const depth = 4655 + 70 * (hash(fr) - .5) - 260 * hash(fr * 3 + 1) - up - inn * 600;
    for (const g of [.35, 1]) for (const dx of [-7, 0, 7]) {
      const d2 = g < 1 ? depth - 90 : depth;
      ctx.beginPath(); ctx.moveTo(540 + dx * 1.6, 3700); ctx.lineTo(540 + dx * .35, d2); ctx.strokeStyle = rgba(STEEL, .85 * g); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(540 + dx * 1.6 - 1.5, 3700); ctx.lineTo(540 + dx * .35 - 1, d2 - 6); ctx.strokeStyle = rgba('#e8ecf0', .5 * g); ctx.lineWidth = 1.4; ctx.stroke();
    }
  }
  // ink droplets; later each one is carried into a cell
  const dr = ss(seg(t, ...T.drift)), fadeOut = 1 - seg(t, T.pullBack[0], T.pullBack[0] + .8);
  for (const d of DOTS) {
    if (t < d.t) continue; const c = CELLS[d.cell];
    const x = lerp(d.x, c.x + d.ox * c.r * 1.0, dr * .85), y = lerp(d.y, c.y + d.oy * c.r * 1.0, dr * .85), pop = eo(seg(t, d.t, d.t + .12));
    ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop); drawS(ctx, d.s, 1, null, fadeOut); ctx.restore();
  }
  // cells
  CELLS.forEach((c, i) => {
    const p = ss(seg(t, T.cells[0] + i * .14, T.cells[0] + i * .14 + .7)); if (p <= 0) return;
    withSeed(c.seed, () => { washPoly(ctx, blob(c.x, c.y, c.r * p, c.r * p * .9, 20, .18, c.seed), CELL, .42 * fadeOut, 3, 2); washPoly(ctx, blob(c.x + c.r * .2, c.y - c.r * .15, c.r * .32 * p, c.r * .26 * p, 12, .2, c.seed + 1), CELLN, .5 * fadeOut, 2, 1); });
  });
  // labels
  const lab = (id, txt, at, x, y, lx, ly, o = {}) => { const am = (1 - seg(t, T.craneUp[0], T.craneUp[0] + .5)) * (o.am ?? 1); leader(x + (o.lx0 || 0), y + 12, lx, ly, seg(t, at + .3, at + .9), am); hand(id, txt, x, y, seg(t, at, at + .5), { size: o.size || 36, am }); };
  const zIn = 1 - seg(t, T.pushCells[0], T.pushCells[0] + .5);
  lab('lepi', 'epidermis, 0.1 mm', T.labEpi, 180, 4300, 330, 4224, { am: zIn });
  lab('lderm', 'dermis', T.labDerm, 180, 4440, 320, 4500, { am: zIn, lx0: 95 });
  lab('lfat', 'fat', T.labFat, 180, 5150, 260, 5110, { am: zIn, lx0: 30 });
  lab('link', 'ink, 1.5 mm deep', T.labInk, 180, 4580, 478, 4640, { am: zIn });
  lab('lcell', 'macrophages', T.labCells, 560, 4520, 590, 4560, { size: 26, am: 1 - seg(t, T.craneUp[0], T.craneUp[0] + .4) });
}
function insetPart(t) {
  const lf = 1 - seg(t, T.craneUp[0], T.craneUp[0] + .4);
  for (const ins of INSETS) {
    const [a, b] = ins.k === 'shallow' ? T.shallow : T.deep;
    wipeDown(5370, 5790, seg(t, a, b), ins.x - 10, ins.x + 350, ins.x, () => drawSprite(ins.sp));
    const pd = seg(t, a + .25, b + .2);
    for (const [x, y, r] of ins.dots) {
      if (pd <= 0) break;
      if (ins.k === 'shallow') { const al = .9 * (1 - .92 * ss(seg(t, ...T.fade))); ctx.beginPath(); ctx.arc(x, y, r * .7 * pd, 0, 7); ctx.fillStyle = rgba(DOT, al); ctx.fill(); }
      else { const bl = ss(seg(t, ...T.blur)); ctx.beginPath(); ctx.arc(lerp(x, ins.x + 170 + (x - ins.x - 170) * 1.9, bl), lerp(y, 5706 + (y - 5706) * 1.6, bl), r * .7 * pd * (1 + 2.2 * bl), 0, 7); ctx.fillStyle = rgba(DOT, .9 - .55 * bl); ctx.fill(); }
    }
    const at = ins.k === 'shallow' ? T.shallow[0] + .2 : T.deep[0] + .2;
    hand('in' + ins.k, ins.k === 'shallow' ? 'too shallow: fades' : 'too deep: blurs', ins.x + 170, 5840, seg(t, at, at + .5), { align: 'center', size: 40, am: lf * (1 - seg(t, T.pushCells[0], T.pushCells[0] + .5)) });
  }
}
function plate(t) {
  const P = [['p1', 'I · THE LINE', .8, 9.4], ['p2', 'II · STENCIL', 9.9, 13.3], ['p3', 'III · THE NEEDLE', 13.8, 19.2], ['p4', 'IV · UNDER THE SKIN', 19.7, 32.9], ['p5', 'V · SHADE AND COLOR', 33.6, 37.1], ['p6', 'VI · HEALING', 37.3, 40.9]];
  toScreen();
  for (const [id, txt, a, b] of P) { const al = ss(seg(t, a, a + .4)) * (1 - ss(seg(t, b - .4, b))); if (al > 0) { ctx.fillStyle = rgba(RED, .8 * al); ctx.fillRect(64, 98, 26, 4); mono(id, txt, 100, 110, al, 22); } }
}
function subtitles(t) {
  toScreen();
  for (const s of SUB) {
    const a = ss(seg(t, s.t0, s.t0 + .25)) * (1 - ss(seg(t, s.t1 - .35, s.t1))); if (a <= 0) continue;
    ctx.font = 'italic 500 46px "Cormorant Garamond"'; ctx.textAlign = 'center';
    const words = s.txt.split(' '), lines = []; let cur = '';
    for (const w of words) { const n = cur ? cur + ' ' + w : w; if (ctx.measureText(n).width > 880 && cur) { lines.push(cur); cur = w; } else cur = n; }
    lines.push(cur);
    if (lines.length === 2) { const all = s.txt.split(' '); let best = null; for (let i = 1; i < all.length; i++) { const A = all.slice(0, i).join(' '), B = all.slice(i).join(' '); const d = Math.abs(ctx.measureText(A).width - ctx.measureText(B).width); if (!best || d < best[0]) best = [d, A, B]; } lines.splice(0, 2, best[1], best[2]); }
    lines.forEach((l, i) => { const y = 1772 - (lines.length - 1 - i) * 56; ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = 18; ctx.fillStyle = rgba(INK, .78 * a); ctx.fillText(l, W / 2, y); ctx.shadowBlur = 0; ctx.fillText(l, W / 2, y); });
  }
}
function title(t) {
  const p = seg(t, T.title, T.title + 1.1); if (p <= 0) return;
  toScreen(); ctx.font = 'italic 500 92px "Cormorant Garamond"'; ctx.textAlign = 'center';
  const txt = 'One line, for life.', tw = ctx.measureText(txt).width, x = W / 2 - tw / 2, y = 812;
  ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 100, (tw + 40) * eo(p), 140); ctx.clip();
  ctx.shadowColor = rgba(PAPER, .95); ctx.shadowBlur = 20; ctx.fillStyle = rgba(INK, .9); ctx.fillText(txt, W / 2, y); ctx.shadowBlur = 0; ctx.fillText(txt, W / 2, y); ctx.restore();
  if (p > .4) TXT.push({ id: 'title', text: txt, x0: x, y0: y - 70, x1: x + tw, y1: y + 20 });
  withSeed(70, () => drawS(ctx, mk(qcurve(W / 2 - 120, y + 40, W / 2 + 120, y + 40, -4, 16), 6, RED, { prof: 'even', nb: 3, a: .8 }), seg(t, T.title + .8, T.title + 1.6)));
}

function render(t) {
  TXT = [];
  CAM = { x: camX(t), y: camY(t), z: camZ(t) };
  toScreen(); ctx.globalAlpha = 1; ctx.drawImage(PAPER_IMG, 0, 0, W, H);
  toWorld();
  const vy0 = CAM.y - H / 2 / CAM.z, vy1 = CAM.y + H / 2 / CAM.z;           // skip parts that are off screen
  if (vy0 < 1400) pagePart(t);
  if (vy1 > 1940 && vy0 < 3950) armPart(t);
  if (vy1 > 2900 && t > T.proj[0]) { skinPart(t); }
  if (vy1 > 5370 && t > T.shallow[0] - .1) insetPart(t);
  plate(t); subtitles(t); title(t);
  toScreen();
}
window.render = render;
window.TEXTS = t => { render(t); return TXT; };

// ---------- sound events (exported for the mixer) ----------
function events() {
  const E = [];
  E.push({ t: T.hook[0], type: 'brush', d: 2.2, pan: .2, v: 1 });
  E.push({ t: T.draft1[0], type: 'brush', d: 1.0, pan: -.2, v: .8 }, { t: T.draft2[0], type: 'pencil', d: 1.3, pan: .1, v: .7 }, { t: T.ink[0], type: 'brush', d: 1.7, pan: 0, v: .9 });
  E.push({ t: T.accent, type: 'dab', v: .7 }, { t: T.noteDraft, type: 'pencil', d: .7, pan: .5, v: .5 });
  E.push({ t: T.craneArm[0], type: 'whoosh', d: 1.6, v: .7 }, { t: T.armPaint[0] + .1, type: 'brush', d: 1.8, pan: 0, v: .9 });
  E.push({ t: T.stencil[0], type: 'thump', v: .8 }, { t: T.stencil[0] + .05, type: 'peel', d: .8, v: .6 }, { t: T.noteStencil, type: 'pencil', d: .5, pan: .5, v: .5 });
  E.push({ t: T.machineIn[0] + .15, type: 'buzz', d: T.line[1] - T.machineIn[0] + .2, v: 1 });
  E.push({ t: T.noteSpeed, type: 'pencil', d: .8, pan: -.4, v: .45 });
  E.push({ t: T.craneSkin[0], type: 'whoosh', d: 1.8, v: .7, low: true }, { t: T.top[0], type: 'wash', d: 1.9, v: .7 });
  E.push({ t: T.needle[0], type: 'buzz', d: T.needle[1] - T.needle[0] + .3, v: .55, muffled: true });
  for (const d of DOTS) if (hash(d.x) > .6) E.push({ t: d.t, type: 'drip', v: .35 + .3 * hash(d.y), pan: (d.x - 540) / 300 });
  E.push({ t: T.labEpi, type: 'pencil', d: .5, pan: -.5, v: .4 }, { t: T.labInk, type: 'pencil', d: .6, pan: -.5, v: .45 });
  E.push({ t: T.shallow[0], type: 'wash', d: .6, v: .5, pan: -.4 }, { t: T.deep[0], type: 'wash', d: .6, v: .5, pan: .4 });
  CELLS.forEach((c, i) => E.push({ t: T.cells[0] + i * .14 + .2, type: 'plink', v: .5, pan: (c.x - 540) / 200, n: i }));
  E.push({ t: T.craneUp[0], type: 'whoosh', d: 1.4, v: .8 }, { t: T.shade[0], type: 'brush', d: .6, v: .7 }, { t: T.color[0], type: 'bloom', d: .9, v: 1 });
  E.push({ t: T.day1, type: 'pencil', d: .5, v: .45 }, { t: T.day7, type: 'flake', d: .9, v: .6 }, { t: T.day14, type: 'pencil', d: .5, v: .45 });
  E.push({ t: T.lastLeaf[0], type: 'brush', d: 1.0, pan: -.3, v: .55 }, { t: T.lastLeaf[0] + .98, type: 'lift', v: .6 }, { t: T.title + .8, type: 'brush', d: .7, v: .5 });
  return E.sort((a, b) => a.t - b.t);
}

(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  await Promise.all(['600 40px Caveat', 'italic 500 46px "Cormorant Garamond"', '400 22px "IBM Plex Mono"'].map(f => document.fonts.load(f)));
  build();
  window.EV = events();
  window.VO = VO; window.SUBS = SUB; window.TL = T;
  window.READY = true;
})();
