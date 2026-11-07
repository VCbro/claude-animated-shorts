// =====================================================================
//  SCENES — how DNS works. World coords 1080x1920; the stage holds still (no camera), TT on 1s.
//  Colour code: "." / root purple, "com" green, "example" red, the answer yellow, the resolver blue,
//  the cache / TTL teal, the question (query dot) white.
// =====================================================================
const QR = MC.purple, QC = MC.green, QE = MC.red, QA = MC.yellow, QV = MC.blue, QT = MC.teal, QQ = MC.white;
const IP = '203.0.113.7';                     // a documentation address (RFC 5737): shown as illustrative
const BAR = { x0: 80, x1: 920, y: 400 };      // the address bar; the name sits in it
const NAME_SIZE = 76, ANS_Y = 512;            // the answer line under the bar
const RES = [250, 900], RES_R = 78;           // the resolver
const LAP = [250, 1200];                      // your device (the screen's centre)
const SV = [                                   // the three servers, top to bottom = the order they are asked
  { p: [770, 670], c: QR, inner: '.', size: 96, name: 'root server' },
  { p: [770, 925], c: QC, inner: 'com', size: 44, name: '.com server' },
  { p: [770, 1180], c: QE, inner: 'example', size: 34, name: "example's server" },
];
const SV_R = 80;
const CARD = { x: 250, y: 1048, w: 300, h: 84 };             // the copy of the answer at the resolver (bridge object)
const CACHE = { x: 655, y: 1000, w: 520, h: 300 };           // the cache record in the last scene
const HERO = [565, 1395];

// ---- small helpers
const at = (t0, d = 0.6) => runS(t0, d);
function edge(A, rA, B, rB) { const d = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / d, uy = (B[1] - A[1]) / d; return [[A[0] + ux * rA, A[1] + uy * rA], [B[0] - ux * rB, B[1] - uy * rB]]; }
function roundBox(cx, cy, w, h, r, c, lw, p = 1, fill = 0) {
  if (p <= 0) return;
  const P = rrectPts(cx - w / 2, cy - h / 2, w, h, r, 6);
  showCreation(P, p, { c, w: lw, closed: true, fill });
}
function boxPts(b, r = 22) { return rrectPts(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, r, 6); }

// the name in the bar: "example" "." "com" and the trailing "." the resolver adds; each label takes its colour when lit
function nameLayout(withDot) {
  const parts = [['example', QE], ['.', MC.white], ['com', QC]];
  if (withDot) parts.push(['.', QR]);
  const ws = parts.map(([s]) => textW(s, NAME_SIZE)), tw = ws.reduce((a, b) => a + b, 0);
  let x = (BAR.x0 + BAR.x1) / 2 - textW('example.com.', NAME_SIZE) / 2;
  return parts.map(([s, c], i) => { const o = { s, c, x, w: ws[i] }; x += ws[i]; return o; });
}
// lit: { ex, com, dot } colour progress 0..1; wp: Write progress of the name; dotP: Write progress of the trailing dot
function drawName(wp, lit, dotP = 0, al = 1) {
  ctx.save(); ctx.globalAlpha = 1;
  roundBox((BAR.x0 + BAR.x1) / 2, BAR.y - 26, BAR.x1 - BAR.x0, 116, 20, MC.greyD, 3);
  ctx.restore();
  const L = nameLayout(true);
  const cols = [mixHex(MC.white, QE, lit.ex || 0), MC.white, mixHex(MC.white, QC, lit.com || 0), QR];
  const segs = L.slice(0, 3).map((g, i) => ({ s: g.s, c: cols[i] }));
  writeText(segs, L[0].x, BAR.y, NAME_SIZE, wp, { align: 'left', alpha: al });
  if (dotP > 0) writeText([{ s: '.', c: QR }], L[3].x, BAR.y, NAME_SIZE, dotP, { align: 'left', alpha: al });
  return L;
}
// the coloured underlines under each label, drawn right to left (the reading order of a name)
function drawUnderlines(L, p, al = 1) {
  const order = [[3, QR], [2, QC], [0, QE]];
  order.forEach(([i, c], k) => { const g = L[i], u = lagged(p, k, 3, 0.7); if (u > 0) segLine(g.x + g.w, BAR.y + 18, g.x + g.w - g.w * u, BAR.y + 18, c, 5, 1, al); });
}
// the answer line under the bar: "→ ?" or "→ 203.0.113.7"
// an arrow drawn as a stroke (system fonts here lack a reliable → glyph), then the tokens after it
function arrowTex(toks, x, y, size, p, o = {}) {
  const L = texLayout(toks, size), aw = size * 0.9, gap = size * 0.3, x0 = x - (aw + gap + L.w) / 2, al = o.alpha ?? 1;
  if (p > 0 && al > 0) mArrow(x0, y - size * 0.3, x0 + aw, y - size * 0.3, MC.white, Math.max(3, size * 0.06), smoothM(p * 1.6), al);
  return writeTex(toks, x0 + aw + gap, y, size, p, { align: 'left', alpha: al });
}
function drawAnswer(qP, ipP, al = 1) {
  // "?" fades out over the first half of ipP; the address is Written over the second half (never both at once)
  if (qP > 0 && ipP < 0.5) arrowTex([mn('?', QA)], CX, ANS_Y, 60, qP, { alpha: al * (1 - smoothM(ipP * 2)) });
  const wp = clamp(ipP * 2 - 1);
  if (wp > 0) {
    arrowTex([mn(IP, QA)], CX, ANS_Y, 60, wp, { alpha: al });
    writeText('(an illustrative address)', CX, ANS_Y + 44, 28, wp, { color: MC.greyC, it: true, alpha: al });
  }
}
function drawLaptop(p = 1) {
  if (p <= 0) return;
  const [x, y] = LAP;
  showCreation(rrectPts(x - 95, y - 62, 190, 124, 12, 5), p, { c: MC.grey, w: 4, closed: true });
  showCreation([[x - 125, y + 76], [x + 125, y + 76]], p, { c: MC.grey, w: 5 });
  writeText('your device', x, y + 126, 34, p, { color: MC.greyC, it: true });
}
function drawResolver(p = 1) {
  if (p <= 0) return;
  showCreation(ellipsePts(RES[0], RES[1], RES_R, RES_R, 0, 72), p, { c: QV, w: 5, closed: true, fill: 0.16 });
  writeText('resolver', RES[0], RES[1] + 12, 34, p, { color: QV, it: true });
}
function drawServer(i, p = 1, shake = 0) {
  if (p <= 0) return;
  const s = SV[i], dx = shake > 0 && shake < 1 ? Math.sin(shake * TAU * 3) * 10 * (1 - shake) : 0;
  ctx.save(); ctx.translate(dx, 0);
  showCreation(ellipsePts(s.p[0], s.p[1], SV_R, SV_R, 0, 72), p, { c: s.c, w: 5, closed: true, fill: 0.16 });
  writeText([{ s: s.inner, c: s.c }], s.p[0], s.p[1] + (s.inner === '.' ? 6 : s.size * 0.34), s.size, p);
  ctx.restore();
  writeText(s.name, s.p[0], s.p[1] + SV_R + 44, 32, p, { color: MC.greyC, it: true });
  if (i === 0) writeText('one of 13 root identities, A–M', s.p[0] - 10, s.p[1] + SV_R + 84, 28, p, { color: MC.greyC, it: true });
}
// a faint dashed guide between two nodes
function guide(A, rA, B, rB, p, c = MC.greyD) {
  if (p <= 0) return;
  const [a, b] = edge(A, rA, B, rB);
  ctx.save(); ctx.setLineDash([10, 12]); segLine(a[0], a[1], b[0], b[1], c, 3, p); ctx.restore();
}
// a trip of the dot from node A to node B: visible only while it travels; a small Flash on arrival
function trip(t0, d, A, rA, B, rB, c) {
  const u = (TT - t0) / d;
  const [a, b] = edge(A, rA, B, rB);
  if (u > 0 && u < 1) { const s = smoothM(u); trackDot(lerp(a[0], b[0], s), lerp(a[1], b[1], s), c, { r: 13 }); return [lerp(a[0], b[0], s), lerp(a[1], b[1], s)]; }
  flashAt(b[0], b[1], (TT - t0 - d) / 0.4, c, 18, 3);
  return null;
}
// a reply arrow from a server back to the resolver, in the colour of who to ask next, with its words
function reply(i, t0, c, words) {
  const s = SV[i], p = at(t0, 0.6);
  if (p <= 0) return;
  const [a, b] = edge(s.p, SV_R + 6, RES, RES_R + 6), off = [0, -18];
  mArrow(a[0] + off[0], a[1] + off[1], b[0] + off[0], b[1] + off[1], c, 4, p);
  writeText(words, 545, s.p[1] - (i === 0 ? 30 : 58), 34, at(t0 + 0.2, 0.7), { it: true });
}
// captions: the one whose time has come, Written on at its time (drawn last, at screen size)
function captions(list) {
  let cur = null; for (const c of list) if (TT >= c[0]) cur = c;
  if (!cur) return;
  DEFER.push(() => mathCard(cur[1], CX, 1460, 48, runS(cur[0], 0.8)));
}
function hops(n, p = 1) { if (p > 0) readout([mn('hops', MC.greyA)], n, 0, 70, 1418, 42, { c: MC.white, p }); }

// ---- era 1: the question. A name, no number; your device asks a resolver; the name is read right to left.
function sceneAsk() {
  const cu = CU;
  fillAll(MC.bg);
  const L = drawName(at(cu.type - 0.05, 0.9), {}, at(cu.trick + 0.15, 0.5));
  drawUnderlines(L, at(cu.right, (cu.left - cu.right) + 0.6));
  drawAnswer(at(cu.number + 0.1, 0.6), 0);
  drawLaptop(1);
  drawResolver(at(cu.resolver - 0.1, 0.8));
  guide(LAP, 70, RES, RES_R, at(cu.resolver + 0.2, 0.6));
  const qd = trip(cu.asks + 0.1, 0.7, LAP, 70, RES, RES_R, QQ);
  // the trailing "." leaves the name and grows into the root server (the bridge object)
  const g = L[3], d0 = [g.x + g.w / 2, BAR.y - 6], gu = at(cu.left + 0.05, Math.max(0.35, CU.m1 - 0.45 - (cu.left + 0.05)));
  if (gu > 0) {
    const s = SV[0], x = lerp(d0[0], s.p[0], gu), y = lerp(d0[1], s.p[1], gu), r = lerp(7, SV_R, gu);
    showCreation(ellipsePts(x, y, r, r, 0, 72), 1, { c: QR, w: lerp(2, 5, gu), closed: true, fill: lerp(1, 0.16, gu) });
  }
  hops(0, at(cu.asks + 0.6, 0.5));
  const look = qd || (TT < cu.number ? [CX, BAR.y] : TT < cu.resolver ? [CX, ANS_Y] : TT < cu.trick ? RES : [g.x, BAR.y]);
  piHero(HERO[0], HERO[1], 0.7, { key: 'pi', look, mood: TT >= cu.number + 0.3 && TT < cu.resolver ? 'wow' : 'calm' });
  mathTag('how DNS works');
  captions([
    [cu.number, [{ s: 'computers need a ' }, { s: 'number', c: QA }]],
    [cu.resolver, [{ s: 'a ' }, { s: 'resolver', c: QV }, { s: ' looks it up' }]],
    [cu.trick + 0.3, 'read the name right to left'],
  ]);
}

// ---- era 2: the hops. Root -> .com -> example's server; the answer comes back.
function sceneChain() {
  const cu = CU;
  fillAll(MC.bg);
  const lit = { com: at(cu.rootCom, 0.5), ex: at(cu.tldEx, 0.5) };
  const L = drawName(1, lit, 1);
  drawUnderlines(L, 1, 0.5);
  const ipP = at(cu.backBack + 0.75, 0.7);
  drawAnswer(1, ipP);
  drawLaptop(1);
  drawResolver(1);
  guide(LAP, 70, RES, RES_R, 1);
  // the servers appear as they are asked
  drawServer(0, 1, (TT - cu.rootNo) / 0.6);
  drawServer(1, at(cu.tld - 0.35, 0.6), (TT - cu.tldNo) / 0.6);
  drawServer(2, at(cu.auth - 0.3, 0.6));
  guide(RES, RES_R, SV[0].p, SV_R, 1);
  guide(RES, RES_R, SV[1].p, SV_R, at(cu.tld - 0.2, 0.5));
  guide(RES, RES_R, SV[2].p, SV_R, at(cu.auth - 0.15, 0.5));
  // the question goes out three times; two referrals come back
  let dot = trip(cu.root + 0.15, 0.7, RES, RES_R, SV[0].p, SV_R, QQ);
  reply(0, cu.rootCom - 0.1, QC, [{ s: 'ask ' }, { s: '.com', c: QC }]);
  dot = trip(cu.tld + 0.15, 0.7, RES, RES_R, SV[1].p, SV_R, QQ) || dot;
  reply(1, cu.tldEx - 0.1, QE, [{ s: 'ask ' }, { s: 'example', c: QE }]);
  dot = trip(cu.auth + 0.1, 0.75, RES, RES_R, SV[2].p, SV_R, QQ) || dot;
  const n = TT >= cu.auth + 0.85 ? 3 : TT >= cu.tld + 0.85 ? 2 : TT >= cu.root + 0.85 ? 1 : 0;
  hops(n);
  // the payoff: the answer, at example's own server
  const ap = at(cu.hit, 0.35), S3 = SV[2].p, AC = [525, S3[1] + 5];
  if (ap > 0) {
    const k = indicateS((TT - cu.hit) / 0.5, 0.18);
    ctx.save(); ctx.translate(AC[0], AC[1]); ctx.scale(k, k);
    roundBox(0, 0, 300, 84, 18, QA, 4, Math.min(1, ap * 1.5), 0.14);
    writeTex([mn(IP, QA)], 0, 14, 44, ap);
    ctx.restore();
    flashAt(AC[0], AC[1], (TT - cu.hit) / 0.45, MC.yellowP, 120, 5);
  }
  // the answer travels back: server -> resolver -> your device; a copy stays at the resolver
  dot = trip(cu.back + 0.1, 0.75, S3, SV_R, RES, RES_R, QA) || dot;
  dot = trip(cu.backBack + 0.05, 0.65, RES, RES_R, LAP, 70, QA) || dot;
  const cp = at(cu.back + 0.75, 0.6);
  if (cp > 0) { roundBox(CARD.x, CARD.y, CARD.w, CARD.h, 18, QA, 4, cp, 0.14); writeTex([mn(IP, QA)], CARD.x, CARD.y + 14, 40, cp); }
  // your device connects: its screen lights with the site
  const on = at(cu.connects, 0.5);
  if (on > 0) { ctx.save(); ctx.globalAlpha = 0.2 * on; ctx.fillStyle = QA; ctx.fillRect(LAP[0] - 89, LAP[1] - 56, 178, 112); ctx.restore(); writeText('✓', LAP[0], LAP[1] + 20, 58, on, { color: QA }); }
  const look = dot || (TT < cu.hit ? S3 : TT < cu.back ? AC : LAP);
  const mood = TT >= cu.hit && TT < cu.back ? 'wow' : TT >= cu.connects ? 'happy' : 'calm';
  piHero(HERO[0], HERO[1], 0.7, { key: 'pi', look, mood, hop: (TT - cu.connects) / 0.5 });
  mathTag('how DNS works');
  captions([
    [cu.root, [{ s: 'root', c: QR }, { s: ': ask ' }, { s: '.com', c: QC }]],
    [cu.tld, [{ s: '.com', c: QC }, { s: ': ask ' }, { s: 'example', c: QE }]],
    [cu.hit, [{ s: 'example', c: QE }, { s: ' knows the ' }, { s: 'answer', c: QA }]],
    [cu.back, [{ s: 'the ' }, { s: 'answer', c: QA }, { s: ' comes back' }]],
  ]);
}

// ---- era 3: the cache. The resolver keeps the record for its TTL; asked again, it answers with zero hops.
function sceneCache() {
  const cu = CU;
  fillAll(MC.bg);
  const again = at(cu.end + 0.05, 0.9), cleared = at(cu.end - 0.25, 0.3);
  const L = drawName(1, { com: 1, ex: 1 }, 1, 1);
  drawUnderlines(L, 1, 0.5);
  drawAnswer(again, 1 - cleared + at(cu.end + 1.55, 0.6) * cleared);
  drawLaptop(1);
  // the device stays connected; it clears when you ask again, and reconnects as the cached answer arrives
  const on = 1 - cleared + at(cu.end + 1.55, 0.5) * cleared;
  if (on > 0) { ctx.save(); ctx.globalAlpha = 0.2 * on; ctx.fillStyle = QA; ctx.fillRect(LAP[0] - 89, LAP[1] - 56, 178, 112); ctx.restore(); mText('✓', LAP[0], LAP[1] + 20, 58, { color: QA, alpha: on }); }
  drawResolver(1);
  guide(LAP, 70, RES, RES_R, 1);
  // the cache record, linked to the resolver
  guide(RES, RES_R, [CACHE.x - CACHE.w / 2, CACHE.y], 0, 1, QT);
  showCreation(boxPts(CACHE), 1, { c: QT, w: 4, closed: true, fill: 0.12 });
  writeText('cache', CACHE.x - CACHE.w / 2 + 24, CACHE.y - CACHE.h / 2 + 52, 36, 1, { align: 'left', it: true, color: QT });
  mText([{ s: 'example.com', c: MC.white }], CACHE.x, CACHE.y - 10, 44);
  arrowTex([mn(IP, QA)], CACHE.x, CACHE.y + 52, 44, 1);
  // the time to live counts down, one second per second, from the moment it is named
  const ttl = 3600 - Math.max(0, Math.floor(TT - cu.ttl));
  const tl = readout([mn('TTL', QT)], ttl, 0, CACHE.x - 120, CACHE.y + 116, 40, { c: QT, p: at(cu.ttl - 0.1, 0.6) });
  writeText('s', tl.x0 + tl.w + 12, CACHE.y + 116, 40, at(cu.ttl + 0.2, 0.4), { color: QT, align: 'left', it: true });
  writeText('(illustrative)', CACHE.x + 150, CACHE.y + CACHE.h / 2 + 40, 28, at(cu.ttl + 0.3, 0.5), { color: MC.greyC, it: true });
  // asked again: straight to the resolver, answered from the cache
  let dot = trip(cu.end + 0.6, 0.45, LAP, 70, RES, RES_R, QQ);
  flashAt(CACHE.x - CACHE.w / 2, CACHE.y, (TT - cu.end - 1.05) / 0.4, QT, 30, 4);
  dot = trip(cu.end + 1.1, 0.45, RES, RES_R, LAP, 70, QA) || dot;
  hops(TT >= cu.end + 0.6 ? 0 : 3);
  const look = dot || (TT < cu.end ? [CACHE.x, CACHE.y] : [CX, ANS_Y]);
  piHero(HERO[0], HERO[1], 0.7, { key: 'pi', look, mood: TT >= cu.already ? 'happy' : 'calm', hop: (TT - cu.already - 0.2) / 0.5 });
  mathTag('how DNS works');
  captions([
    [cu.cache, [{ s: 'kept for its ' }, { s: 'time to live', c: QT }]],
    [cu.end, [{ s: 'next time: ' }, { s: '0', c: MC.white }, { s: ' hops' }]],
  ]);
}
