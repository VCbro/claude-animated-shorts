// 2D documentary engine: canvas scenes as pure functions of time, DOM layer for shaped Hindi text,
// crossfades, grain, vignette, word-highlight captions. A film module calls add(a, b, draw) for each scene
// and then start(). Anchors (word times) come from out/anchors.json, captions from out/captions.json.
import { loadTheme } from './themes.js';
export const THEME = await loadTheme();     // look: out/theme.txt (see themes.js)
export const K = await (await fetch('/out/anchors.json')).json();
const CAPS = await (await fetch('/out/captions.json')).json();
export const END = K.END;
export const W = 1920, H = 1080;
const cv = document.getElementById('c');
// render at devicePixelRatio (2 -> 4K) while all drawing code keeps using 1920x1080 coordinates
export const DPR = window.devicePixelRatio || 1;
const _st = CanvasRenderingContext2D.prototype.setTransform;
CanvasRenderingContext2D.prototype.setTransform = function (a, b, c, d, e, f) {
  if (typeof a === 'object' || a === undefined) return _st.call(this, a);
  return _st.call(this, a * DPR, b * DPR, c * DPR, d * DPR, e * DPR, f * DPR);
};
cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
const main = cv.getContext('2d');
const bufs = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR; return c; });
export let ctx = main;
const UIel = document.getElementById('ui'), LNel = document.getElementById('lines'), CAPel = document.getElementById('cap');

// ------------------------------------------------------------------ utils
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eob = (x) => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const lerp = (a, b, u) => a + (b - a) * u;
export const R = (t, a, d = 0.5) => ss((t - a) / d);
export const win = (t, a, b, f = 0.3) => R(t, a, f) * (1 - R(t, b - f, f));
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const A = (n) => { if (!(n in K)) throw new Error('anchor ' + n); return K[n]; };
export const TAU = Math.PI * 2;

// ------------------------------------------------------------------ camera + UI
export let CAM = { x: W / 2, y: H / 2, z: 1 };
let SA = 1; // scene alpha for UI
let UI = [], LINES = [];
export function cam(x, y, z) { CAM = { x, y, z }; ctx.setTransform(z, 0, 0, z, W / 2 - x * z, H / 2 - y * z); }
export function camKeys(t, keys) { // keys: [[t, x, y, z], ...]
  if (t <= keys[0][0]) return cam(keys[0][1], keys[0][2], keys[0][3]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) { const u = eio((t - a[0]) / (b[0] - a[0])); return cam(lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)); }
  }
  const k = keys[keys.length - 1]; cam(k[1], k[2], k[3]);
}
export const scr = (x, y) => [(x - CAM.x) * CAM.z + W / 2, (y - CAM.y) * CAM.z + H / 2];
export function label(text, wx, wy, dx, dy, a, sub) {
  if (a <= 0.01) return;
  const [x, y] = scr(wx, wy); const bx = x + dx, by = y + dy;
  a *= SA;
  LINES.push(`<g opacity="${a.toFixed(3)}"><line x1="${x}" y1="${y}" x2="${bx}" y2="${by}" stroke="#fff" stroke-width="3"/>` +
    `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#ffd166" stroke-width="4"/><circle cx="${x}" cy="${y}" r="3.5" fill="#fff"/></g>`);
  const left = dx < 0;
  UI.push(`<div class="t lab" style="left:${bx}px;top:${by}px;transform:translate(${left ? '-100%' : '0'},-50%) scale(${0.85 + 0.15 * a});transform-origin:${left ? 'right' : 'left'} center;opacity:${a.toFixed(3)}">${text}${sub ? `<i>${sub}</i>` : ''}</div>`);
}
export function text(html, x, y, o = {}) {
  const a = (o.a ?? 1) * SA; if (a <= 0.01) return;
  const al = o.align ?? 'center', tx = al === 'center' ? '-50%' : al === 'right' ? '-100%' : '0';
  UI.push(`<div class="t ${o.cls || ''}" style="left:${x}px;top:${y}px;font-size:${o.size || 40}px;color:${o.color || '#fff'};opacity:${a.toFixed(3)};` +
    `transform:translate(${tx},-50%) scale(${o.scale ?? 1});${o.style || ''}">${html}</div>`);
}
export function chapter(t, a, num, title) { // chapter card in the top-left corner, ~3 s
  const u = win(t, a - 0.1, a + 3.2, 0.4);
  if (u <= 0) return;
  text(`<span class="chap">अध्याय ${num}</span>`, 90, 92, { align: 'left', a: u, size: 30 });
  text(title, 90, 142, { align: 'left', a: u, size: 54, cls: 'ttl', style: `text-align:left;transform:translate(${-30 * (1 - u)}px,-50%)` });
}

// ------------------------------------------------------------------ drawing primitives
export function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function fillRR(x, y, w, h, r, f) { rr(x, y, w, h, r); ctx.fillStyle = f; ctx.fill(); }
export function lin(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
export function rad(x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
export function line(pts, col, w, glow = 0, dash = null) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (glow) { ctx.shadowColor = col; ctx.shadowBlur = glow; }
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
}
export function glowDot(x, y, r, col, a = 1) {
  if (col.length === 4) col = '#' + col[1] + col[1] + col[2] + col[2] + col[3] + col[3];
  if (r <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rad(x, y, 0, r * 3, [[0, col], [0.25, col + 'aa'], [1, col + '00']]);
  ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill(); ctx.restore();
}
export function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
export function polyAt(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0);
    if (s <= l) { const u = l ? s / l : 0; return [lerp(x0, x1, u), lerp(y0, y1, u), Math.atan2(y1 - y0, x1 - x0)]; }
    s -= l;
  }
  const n = pts.length; return [pts[n - 1][0], pts[n - 1][1], 0];
}
export function flow(pts, t, col, o = {}) { // glowing particles running along a polyline
  const L = polyLen(pts), gap = o.gap ?? 46, spd = o.speed ?? 260, r = o.r ?? 5, a = o.a ?? 1;
  if (a <= 0.01) return;
  const off = ((t * spd) % gap + gap) % gap;
  const n = Math.floor(L / gap) + 1;
  for (let i = 0; i < n; i++) {
    const s = o.reverse ? L - (i * gap + off) : i * gap + off;
    if (s < 0 || s > L) continue;
    const head = o.upto !== undefined ? (o.reverse ? L - o.upto * L : o.upto * L) : null;
    if (head !== null && (o.reverse ? s < head : s > head)) continue;
    const [x, y] = polyAt(pts, s); glowDot(x, y, r, col, a);
  }
}
export function arrow(x0, y0, x1, y1, col, w = 6, a = 1) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.shadowColor = col; ctx.shadowBlur = 14;
  const ang = Math.atan2(y1 - y0, x1 - x0), hl = w * 3.2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(ang) * hl * 0.8, y1 - Math.sin(ang) * hl * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(ang - 0.45) * hl, y1 - Math.sin(ang - 0.45) * hl);
  ctx.lineTo(x1 - Math.cos(ang + 0.45) * hl, y1 - Math.sin(ang + 0.45) * hl); ctx.closePath(); ctx.fill(); ctx.restore();
}
export function sine(x, y, w, amp, cycles, phase, col, lw = 5, a = 1) {
  if (a <= 0.01) return;
  const pts = []; for (let i = 0; i <= 120; i++) { const u = i / 120; pts.push([x + u * w, y - amp * Math.sin(u * cycles * TAU + phase)]); }
  ctx.save(); ctx.globalAlpha *= a; line(pts, col, lw, 16); ctx.restore();
}
export function panel(x, y, w, h, a = 1, col = 'rgba(12,20,36,.78)') {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  fillRR(x, y, w, h, 26, col); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; rr(x, y, w, h, 26); ctx.stroke(); ctx.restore();
}


export function studio(c1 = THEME.studio[0], c2 = THEME.studio[1], glow = THEME.studio[2]) { // theme gradient + soft glow + faint grid
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = lin(0, 0, 0, H, [[0, c1], [1, c2]]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rad(W * 0.5, H * 0.42, 0, 1100, [[0, glow], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
  if (THEME.studio[3]) {
    ctx.strokeStyle = THEME.studio[3]; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  ctx.restore();
}
export const screen = () => ctx.setTransform(1, 0, 0, 1, 0, 0); // draw in screen pixels again (after a camera)

// ------------------------------------------------------------------ scenes
export const XF = 0.45; // crossfade seconds
const S = [];
export const add = (a, b, draw) => S.push({ a, b, draw });

// ------------------------------------------------------------------ grain + vignette + captions
const grain = document.createElement('canvas'); grain.width = grain.height = 256;
{ const g = grain.getContext('2d'), im = g.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const v = rnd(i) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }

function captions(t) {
  const c = CAPS.find((c) => t >= c.t0 && t < c.t1);
  if (!c || t > (K.CAP_END ?? END)) { CAPel.innerHTML = ''; return; }
  CAPel.innerHTML = '<span class="box">' + c.words.map((w, i) => {
    const on = t >= w.t - 0.03 && (i === c.words.length - 1 || t < c.words[i + 1].t - 0.03);
    return `<span class="${on ? 'on' : ''}">${w.w}</span>`;
  }).join(' ') + '</span>';
  CAPel.style.opacity = Math.min(1, (t - c.t0) / 0.06, (c.t1 - t) / 0.06);
}

export function renderAt(t) {
  UI = []; LINES = [];
  const act = S.filter((s) => t >= s.a - XF && t < s.b);
  main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = 1; main.fillStyle = '#05080f'; main.fillRect(0, 0, W, H);
  act.forEach((s, i) => {
    const a = clamp((t - (s.a - XF)) / XF);
    const c = bufs[i % 2]; ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    SA = s.a <= 0 ? 1 : a;
    s.draw(t);
    main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = s.a <= 0 ? 1 : a; main.drawImage(c, 0, 0, W, H);
  });
  ctx = main; main.globalAlpha = 1;
  main.save(); main.globalCompositeOperation = 'overlay'; main.globalAlpha = THEME.grain;
  const ox = Math.floor(rnd(Math.floor(t * 30)) * 256), oy = Math.floor(rnd(Math.floor(t * 30) + 5) * 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) main.drawImage(grain, x, y);
  main.restore();
  main.fillStyle = rad(W / 2, H / 2, H * 0.45, H * 1.05, [[0, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${THEME.vig})`]]); main.fillRect(0, 0, W, H);
  if (THEME.flicker) { main.fillStyle = `rgba(0,0,0,${THEME.flicker * rnd(Math.floor(t * 24) + 77)})`; main.fillRect(0, 0, W, H); }
  if (THEME.letterbox) { main.fillStyle = '#000'; main.fillRect(0, 0, W, THEME.letterbox); main.fillRect(0, H - THEME.letterbox, W, THEME.letterbox); }
  const fade = Math.min(1, t / 0.6, (END + 0.8 - t) / 0.8);
  if (fade < 1) { main.fillStyle = `rgba(0,0,0,${1 - Math.max(0, fade)})`; main.fillRect(0, 0, W, H); }
  UIel.innerHTML = UI.join(''); LNel.innerHTML = LINES.join('');
  UIel.style.opacity = LNel.style.opacity = Math.max(0, fade);
  captions(t);
}
export async function start() {
  window.__renderAt = renderAt;
  window.__END = END;
  await document.fonts.ready;
  renderAt(0);
  window.__ready = true;
}
