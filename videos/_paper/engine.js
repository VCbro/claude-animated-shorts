// PAPER-CUT 3D STORY ENGINE (3d-animator kit). A long paper diorama: one "station" per story beat, side by side in x.
// Each station is a little stage of cut-paper layers, real photos printed on card, 3D paper numbers and paper props,
// lit by one soft key light with real shadows. The camera holds with a slow push-in, then whip-pans to the next beat.
// Pure function of t. A film imports this, calls makeFilm(CONFIG).
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { W, H, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, halton, hash } from './lib.js';
export { THREE, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

for (const [fam, f] of [['BalooD', 'devanagari'], ['BalooL', 'latin']]) {
  const ff = new FontFace(fam, `url(node_modules/@fontsource/baloo-2/files/baloo-2-${f}-800-normal.woff2)`, { weight: '800' });
  await ff.load(); document.fonts.add(ff);
}
export const FONT = (px) => `800 ${px}px BalooD, BalooL, sans-serif`;
const WORDS = await (await fetch('out/words.json')).json();

// ---------- renderer ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const RS = +(new URLSearchParams(location.search).get('rs') || 0.75), RW = Math.round(W * RS), RH = Math.round(H * RS);
const rt = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, samples: 4 });
const accum = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, depthBuffer: false });
export const scene = new THREE.Scene();

// ---------- paper helpers ----------
function grain(cv, amt = 18, fibre = true) {
  const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height), a = d.data;
  let s = 1234567;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] === 0) continue;
    s = (s * 1103515245 + 12345) & 0x7fffffff; const n = ((s >> 8) % 1000) / 1000 - 0.5;
    const px = (i / 4) % cv.width, f = fibre ? Math.sin(px * 0.9 + (i / 4 / cv.width) * 0.13) * 0.25 : 0;
    const k = (n + f * 0.3) * amt; a[i] = clamp(a[i] + k, 0, 255); a[i + 1] = clamp(a[i + 1] + k, 0, 255); a[i + 2] = clamp(a[i + 2] + k, 0, 255);
  }
  g.putImageData(d, 0, 0);
}
const texOf = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
export function canvas(w, h) { return Object.assign(document.createElement('canvas'), { width: w, height: h }); }

// a cut-paper piece: a plane with an alpha cut-out and a darker "edge" copy behind it for thickness, casting real shadows
export function cut(draw, { w = 2, px = 512, aspect = 1, edge = 0.55, grainAmt = 16, emissive = 0, thick = 0.012, side = THREE.FrontSide } = {}) {
  const cw = px, ch = Math.round(px * aspect), cv = canvas(cw, ch), g = cv.getContext('2d');
  draw(g, cw, ch); grain(cv, grainAmt);
  const map = texOf(cv), hgt = w * aspect;
  const geo = new THREE.PlaneGeometry(w, hgt); geo.translate(0, hgt / 2, 0);    // origin at bottom-centre
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 0.92, metalness: 0, side: THREE.DoubleSide,
    emissive: emissive ? new THREE.Color(1, 1, 1) : new THREE.Color(0), emissiveMap: emissive ? map : null, emissiveIntensity: emissive });
  const front = new THREE.Mesh(geo, m); front.castShadow = front.receiveShadow = true;
  front.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
  const g0 = new THREE.Group(); g0.add(front);
  if (edge > 0) {
    const em = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 1, color: new THREE.Color(edge, edge, edge) });
    const back = new THREE.Mesh(geo, em); back.position.set(thick * 0.6, -thick * 0.6, -thick); back.receiveShadow = true; g0.add(back);
  }
  g0.userData = { w, h: hgt, map, mat: m };
  return g0;
}
const rnd = (s) => { let x = s; return () => { x = (x * 16807) % 2147483647; return x / 2147483647; }; };
export const n1 = (x, seed = 0) => { const i = Math.floor(x), f = x - i, a = hash(i + seed * 101), b = hash(i + 1 + seed * 101); return lerp(a, b, f * f * (3 - 2 * f)); };
const fb = (x, s) => n1(x, s) * 0.6 + n1(x * 2.3, s + 7) * 0.28 + n1(x * 5.1, s + 3) * 0.12;

// layer shapes (fill colour c): hills, peaks (with snow), strata, cave (frame with a hole), waves, jungle, clouds, ground
export function layer(kind, c, { w = 8, aspect = 0.6, seed = 1, rough = 1, top = 0.55, amp = 0.3, snow = null, hole = null, px = 1024 } = {}) {
  return cut((g, W2, H2) => {
    g.fillStyle = c;
    const ridge = (x) => H2 * (1 - (top + amp * (fb(x / W2 * 4 * rough, seed) - 0.5) * 2));
    if (kind === 'peaks') {
      const pts = []; const r = rnd(seed * 97 + 1); let x = -20; pts.push([x, H2]);
      while (x < W2 + 20) { const pk = H2 * (1 - top - amp * r()); x += W2 * (0.08 + 0.12 * r()); pts.push([x - W2 * 0.06 * r(), pk]); x += W2 * (0.05 + 0.1 * r()); pts.push([x, H2 * (1 - top * 0.55 - amp * 0.3 * r())]); }
      pts.push([W2 + 20, H2]); g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fill();
      if (snow) { g.save(); g.clip(); g.fillStyle = snow; for (let i = 1; i < pts.length - 1; i++) { const [a, b] = pts[i]; if (b < H2 * (1 - top * 0.8)) { g.beginPath(); g.moveTo(a, b); g.lineTo(a - W2 * 0.07, b + H2 * 0.16); g.lineTo(a - W2 * 0.02, b + H2 * 0.12); g.lineTo(a + W2 * 0.02, b + H2 * 0.17); g.lineTo(a + W2 * 0.07, b + H2 * 0.13); g.closePath(); g.fill(); } } g.restore(); }
      return;
    }
    if (kind === 'clouds') { const r = rnd(seed); for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(W2 * (0.1 + 0.8 * r()), H2 * (0.45 + 0.25 * r()), H2 * (0.18 + 0.2 * r()), 0, TAU); g.fill(); } g.fillRect(W2 * 0.12, H2 * 0.55, W2 * 0.76, H2 * 0.3); return; }
    if (kind === 'rect') { g.fillRect(0, 0, W2, H2); return; }
    g.beginPath(); g.moveTo(0, H2);
    for (let x = 0; x <= W2; x += 4) {
      let y = ridge(x);
      if (kind === 'waves') y = H2 * (1 - top) + Math.sin(x / W2 * TAU * 3 * rough + seed) * H2 * amp * 0.25 + Math.sin(x / W2 * TAU * 7.3 + seed * 2) * H2 * amp * 0.08;
      if (kind === 'strata') y = H2 * (1 - top) + (fb(x / W2 * 5 * rough, seed) - 0.5) * H2 * amp;
      g.lineTo(x, y);
    }
    g.lineTo(W2, H2); g.closePath(); g.fill();
    if (kind === 'jungle') { const r = rnd(seed * 3); for (let i = 0; i < 16; i++) { const x = W2 * r(), y = ridge(x); g.beginPath(); g.arc(x, y - H2 * 0.03, H2 * (0.05 + 0.08 * r()), 0, TAU); g.fill(); } }
    if (hole) { g.globalCompositeOperation = 'destination-out'; const [hx, hy, hw, hh] = hole; g.beginPath();
      for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, rr = 1 + 0.12 * (fb(i / 64 * 6, seed + 5) - 0.5) * 2; g.lineTo(W2 * (hx + hw * 0.5 * Math.cos(a) * rr), H2 * (hy + hh * 0.5 * Math.sin(a) * rr)); }
      g.fill(); g.globalCompositeOperation = 'source-over'; }
  }, { w, aspect, px });
}

// a real photo printed on card: white border, slight tear at the bottom, two bits of tape
export async function photo(src, { w = 3, border = 0.045, tape = true, tilt = 0, caption = null } = {}) {
  const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const iw = img ? img.naturalWidth : 4, ih = img ? img.naturalHeight : 3, asp = ih / iw;
  const px = 1024, b = px * border, capH = caption ? px * 0.11 : 0;
  return cut((g, cw, ch) => {
    g.fillStyle = '#f4f0e6'; g.beginPath(); g.moveTo(0, 0); g.lineTo(cw, 0);
    for (let x = cw; x >= 0; x -= 8) g.lineTo(x, ch - 6 - 10 * hash(x * 0.37));
    g.closePath(); g.fill();
    if (img) { g.drawImage(img, b, b, cw - 2 * b, (cw - 2 * b) * asp); g.fillStyle = 'rgba(80,50,20,0.10)'; g.fillRect(b, b, cw - 2 * b, (cw - 2 * b) * asp); }
    else { g.fillStyle = '#555'; g.fillRect(b, b, cw - 2 * b, (cw - 2 * b) * asp); }
    if (caption) { g.fillStyle = '#2a2622'; g.font = FONT(Math.round(capH * 0.55)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(caption, cw / 2, b + (cw - 2 * b) * asp + capH * 0.55); }
    if (tape) { g.fillStyle = 'rgba(235,220,170,0.75)'; for (const x of [0.12, 0.88]) { g.save(); g.translate(cw * x, b * 0.6); g.rotate(x < 0.5 ? -0.5 : 0.5); g.fillRect(-cw * 0.08, -b * 0.6, cw * 0.16, b * 1.3); g.restore(); } }
  }, { w, px, aspect: ((px - 2 * b) * asp + 2 * b + capH + 10) / px, grainAmt: 6, edge: 0.7 });
}

// 3D paper text (cut letters with an edge)
export function ptext(s, { size = 1, color = '#ffd24a', edge = '#7a4a10', px = 220, stroke = 0 } = {}) {
  const cv0 = canvas(10, 10).getContext('2d'); cv0.font = FONT(px); const tw = cv0.measureText(s).width + px * 0.3;
  const asp = px * 1.35 / tw;
  const grp = cut((g, cw, ch) => { g.font = FONT(px); g.textAlign = 'center'; g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = stroke; g.strokeStyle = color; g.lineJoin = 'round'; g.strokeText(s, cw / 2, ch * 0.55); }
    g.fillStyle = color; g.fillText(s, cw / 2, ch * 0.55); }, { w: size * tw / px, px: Math.round(tw), aspect: asp, edge: 0, grainAmt: 8 });
  const back = cut((g, cw, ch) => { g.font = FONT(px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = stroke + px * 0.05; g.lineJoin = 'round'; g.strokeStyle = edge; g.fillStyle = edge;
    g.strokeText(s, cw / 2, ch * 0.55); g.fillText(s, cw / 2, ch * 0.55); }, { w: size * tw / px, px: Math.round(tw), aspect: asp, edge: 0, grainAmt: 4 });
  back.position.set(0.03 * size, -0.04 * size, -0.05 * size); grp.add(back);
  return grp;
}

// icon library (drawn as paper cut-outs)
export const ICON = {
  person(g, w, h, c = '#222', helmet = null) { g.fillStyle = c; g.beginPath(); g.arc(w / 2, h * 0.16, w * 0.16, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(w * 0.28, h * 0.32); g.quadraticCurveTo(w / 2, h * 0.27, w * 0.72, h * 0.32); g.lineTo(w * 0.78, h * 0.62); g.lineTo(w * 0.62, h * 0.62); g.lineTo(w * 0.64, h); g.lineTo(w * 0.52, h); g.lineTo(w * 0.5, h * 0.68); g.lineTo(w * 0.48, h); g.lineTo(w * 0.36, h); g.lineTo(w * 0.38, h * 0.62); g.lineTo(w * 0.22, h * 0.62); g.closePath(); g.fill();
    if (helmet) { g.fillStyle = helmet; g.beginPath(); g.arc(w / 2, h * 0.14, w * 0.19, Math.PI, 0); g.fill(); g.fillRect(w * 0.27, h * 0.135, w * 0.46, h * 0.02); } },
  drill(g, w, h) { g.fillStyle = '#6d7277'; g.fillRect(w * 0.42, 0, w * 0.16, h * 0.78); g.fillStyle = '#9aa0a6'; for (let y = 0; y < h * 0.78; y += h * 0.06) g.fillRect(w * 0.4, y, w * 0.2, h * 0.012);
    g.fillStyle = '#3e4246'; g.beginPath(); g.moveTo(w * 0.3, h * 0.78); g.lineTo(w * 0.7, h * 0.78); g.lineTo(w * 0.5, h); g.closePath(); g.fill(); },
  capsule(g, w, h) { const r = w * 0.32; g.fillStyle = '#d9d4c8'; g.fillRect(w / 2 - r, h * 0.1, 2 * r, h * 0.8); g.beginPath(); g.arc(w / 2, h * 0.1, r, Math.PI, 0); g.fill(); g.beginPath(); g.arc(w / 2, h * 0.9, r, 0, Math.PI); g.fill();
    g.fillStyle = '#c8282c'; g.fillRect(w / 2 - r, h * 0.3, 2 * r, h * 0.05); g.fillRect(w / 2 - r, h * 0.62, 2 * r, h * 0.05); g.fillStyle = '#1f4fa8'; g.fillRect(w / 2 - r, h * 0.35, 2 * r, h * 0.03);
    g.fillStyle = '#2a2a2a'; g.fillRect(w / 2 - r * 0.35, h * 0.4, r * 0.7, h * 0.18); g.fillStyle = '#555'; g.fillRect(w * 0.48, 0, w * 0.04, h * 0.08); },
  can(g, w, h) { g.fillStyle = '#b8bfc6'; g.fillRect(w * 0.1, h * 0.25, w * 0.8, h * 0.6); g.beginPath(); g.ellipse(w / 2, h * 0.25, w * 0.4, h * 0.1, 0, 0, TAU); g.fill(); g.fillStyle = '#2f6db5'; g.fillRect(w * 0.1, h * 0.4, w * 0.8, h * 0.28); g.fillStyle = '#fff'; g.font = FONT(h * 0.16); g.textAlign = 'center'; g.fillText('TUNA', w / 2, h * 0.6); },
  spoon(g, w, h) { g.fillStyle = '#c9ced3'; g.beginPath(); g.ellipse(w / 2, h * 0.18, w * 0.25, h * 0.16, 0, 0, TAU); g.fill(); g.fillRect(w * 0.45, h * 0.3, w * 0.1, h * 0.68); },
  glass(g, w, h) { g.fillStyle = 'rgba(220,235,245,0.9)'; g.beginPath(); g.moveTo(w * 0.15, h * 0.05); g.lineTo(w * 0.85, h * 0.05); g.lineTo(w * 0.75, h); g.lineTo(w * 0.25, h); g.closePath(); g.fill(); g.fillStyle = '#fbfaf5'; g.beginPath(); g.moveTo(w * 0.2, h * 0.75); g.lineTo(w * 0.8, h * 0.75); g.lineTo(w * 0.75, h); g.lineTo(w * 0.25, h); g.closePath(); g.fill(); },
  rig(g, w, h) { g.strokeStyle = '#3a3a3a'; g.lineWidth = w * 0.035; g.beginPath(); g.moveTo(w * 0.15, h); g.lineTo(w * 0.5, 0); g.lineTo(w * 0.85, h); g.moveTo(w * 0.25, h * 0.7); g.lineTo(w * 0.75, h * 0.7); g.moveTo(w * 0.33, h * 0.45); g.lineTo(w * 0.67, h * 0.45); g.moveTo(w * 0.25, h * 0.7); g.lineTo(w * 0.67, h * 0.45); g.moveTo(w * 0.75, h * 0.7); g.lineTo(w * 0.33, h * 0.45); g.stroke();
    g.fillStyle = '#c8282c'; g.fillRect(w * 0.43, 0, w * 0.14, h * 0.06); g.fillStyle = '#e0a81a'; g.fillRect(w * 0.05, h * 0.88, w * 0.9, h * 0.12); },
  flagCL(g, w, h) { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#d52b1e'; g.fillRect(0, h / 2, w, h / 2); g.fillStyle = '#0039a6'; g.fillRect(0, 0, w / 3, h / 2); g.fillStyle = '#fff'; star(g, w / 6, h / 4, h * 0.13); },
  flagIN(g, w, h) { g.fillStyle = '#ff9933'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#fff'; g.fillRect(0, h / 3, w, h / 3); g.fillStyle = '#138808'; g.fillRect(0, 2 * h / 3, w, h / 3); g.strokeStyle = '#000080'; g.lineWidth = h * 0.02; g.beginPath(); g.arc(w / 2, h / 2, h * 0.13, 0, TAU); g.stroke(); },
  train(g, w, h, c = '#2d3e5c') { g.fillStyle = c; for (let i = 0; i < 4; i++) { const x = w * (0.02 + i * 0.245); g.beginPath(); g.roundRect(x, h * 0.2, w * 0.23, h * 0.6, h * 0.08); g.fill(); }
    g.fillStyle = '#ffd36a'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.fillRect(w * (0.04 + i * 0.245 + j * 0.05), h * 0.32, w * 0.03, h * 0.16);
    g.fillStyle = '#111'; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc(w * (0.05 + i * 0.061), h * 0.85, h * 0.07, 0, TAU); g.fill(); } },
  ball(g, w, h, c = '#f2f2f2') { g.fillStyle = c; g.beginPath(); g.arc(w / 2, h / 2, w * 0.46, 0, TAU); g.fill(); g.strokeStyle = '#2f5fae'; g.lineWidth = w * 0.05; g.beginPath(); g.arc(w * 0.2, h * 0.5, w * 0.45, -0.9, 0.9); g.stroke(); g.strokeStyle = '#f2c230'; g.beginPath(); g.arc(w * 0.8, h * 0.5, w * 0.45, Math.PI - 0.9, Math.PI + 0.9); g.stroke(); },
  football(g, w, h) { g.fillStyle = '#fafafa'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.46, 0, TAU); g.fill(); g.fillStyle = '#111'; poly(g, w / 2, h / 2, w * 0.15, 5); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; poly(g, w / 2 + Math.cos(a) * w * 0.34, h / 2 + Math.sin(a) * w * 0.34, w * 0.09, 5); } },
  bed(g, w, h) { g.fillStyle = '#e8e6df'; g.fillRect(w * 0.05, h * 0.45, w * 0.9, h * 0.18); g.fillStyle = '#7a8a99'; g.fillRect(w * 0.05, h * 0.2, w * 0.05, h * 0.8); g.fillRect(w * 0.9, h * 0.35, w * 0.05, h * 0.65); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w * 0.2, h * 0.42, w * 0.08, h * 0.06, 0, 0, TAU); g.fill(); },
  cross(g, w, h) { g.fillStyle = '#d42a2a'; g.fillRect(w * 0.38, h * 0.1, w * 0.24, h * 0.8); g.fillRect(w * 0.1, h * 0.38, w * 0.8, h * 0.24); },
  tank(g, w, h, c = '#e0a81a') { g.fillStyle = c; g.beginPath(); g.roundRect(w * 0.25, h * 0.15, w * 0.5, h * 0.82, w * 0.22); g.fill(); g.fillStyle = '#555'; g.fillRect(w * 0.42, 0, w * 0.16, h * 0.17); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(w * 0.32, h * 0.25, w * 0.06, h * 0.6); },
  climber(g, w, h, c = '#1d1d22') { g.fillStyle = c; g.beginPath(); g.arc(w * 0.5, h * 0.12, w * 0.12, 0, TAU); g.fill(); g.beginPath(); g.moveTo(w * 0.35, h * 0.25); g.lineTo(w * 0.62, h * 0.24); g.lineTo(w * 0.7, h * 0.55); g.lineTo(w * 0.62, h * 0.56); g.lineTo(w * 0.72, h); g.lineTo(w * 0.6, h); g.lineTo(w * 0.5, h * 0.66); g.lineTo(w * 0.36, h); g.lineTo(w * 0.24, h); g.lineTo(w * 0.36, h * 0.55); g.closePath(); g.fill();
    g.fillStyle = '#d9472b'; g.fillRect(w * 0.18, h * 0.24, w * 0.18, h * 0.3); g.strokeStyle = c; g.lineWidth = w * 0.04; g.beginPath(); g.moveTo(w * 0.7, h * 0.3); g.lineTo(w * 0.92, h * 0.05); g.moveTo(w * 0.92, h * 0.05); g.lineTo(w * 0.92, h); g.stroke(); },
  diver(g, w, h) { g.fillStyle = '#111'; g.beginPath(); g.ellipse(w * 0.45, h * 0.5, w * 0.3, h * 0.12, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(w * 0.8, h * 0.45, h * 0.11, 0, TAU); g.fill();
    g.fillStyle = '#e0a81a'; g.beginPath(); g.roundRect(w * 0.3, h * 0.28, w * 0.36, h * 0.12, h * 0.06); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.moveTo(w * 0.18, h * 0.5); g.lineTo(0, h * 0.35); g.lineTo(w * 0.03, h * 0.7); g.closePath(); g.fill();
    g.fillStyle = '#7fd6ff'; g.fillRect(w * 0.82, h * 0.4, w * 0.08, h * 0.07); },
  torch(g, w, h) { g.fillStyle = '#222'; g.fillRect(w * 0.1, h * 0.4, w * 0.6, h * 0.2); g.fillStyle = '#ffe9a8'; g.beginPath(); g.moveTo(w * 0.7, h * 0.35); g.lineTo(w * 0.9, h * 0.25); g.lineTo(w * 0.9, h * 0.75); g.lineTo(w * 0.7, h * 0.65); g.closePath(); g.fill(); },
  candle(g, w, h) { g.fillStyle = '#f4efe2'; g.fillRect(w * 0.35, h * 0.35, w * 0.3, h * 0.65); g.fillStyle = '#ffb02e'; g.beginPath(); g.moveTo(w / 2, 0); g.quadraticCurveTo(w * 0.7, h * 0.22, w / 2, h * 0.33); g.quadraticCurveTo(w * 0.3, h * 0.22, w / 2, 0); g.fill(); },
  note(g, w, h) { g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,120,200,0.35)'; g.lineWidth = 2; for (let y = h * 0.22; y < h; y += h * 0.16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#c4161c'; g.font = `700 ${Math.round(h * 0.17)}px BalooL, sans-serif`; g.textAlign = 'center'; g.fillText('ESTAMOS BIEN EN', w / 2, h * 0.4); g.fillText('EL REFUGIO LOS 33', w / 2, h * 0.62); },
  newspaper(g, w, h, head = 'NEWS') { g.fillStyle = '#efeadf'; g.fillRect(0, 0, w, h); g.fillStyle = '#222'; g.font = FONT(h * 0.13); g.textAlign = 'center'; g.fillText(head, w / 2, h * 0.17); g.fillRect(w * 0.05, h * 0.22, w * 0.9, h * 0.01);
    g.fillStyle = '#999'; for (let c = 0; c < 3; c++) for (let y = h * 0.3; y < h * 0.95; y += h * 0.05) g.fillRect(w * (0.06 + c * 0.31), y, w * 0.27 * (0.7 + 0.3 * hash(y + c)), h * 0.018); },
  bubble(g, w, h, text = '?') { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(w * 0.03, h * 0.03, w * 0.94, h * 0.72, h * 0.2); g.fill(); g.beginPath(); g.moveTo(w * 0.25, h * 0.7); g.lineTo(w * 0.18, h * 0.98); g.lineTo(w * 0.42, h * 0.72); g.fill();
    g.fillStyle = '#1a1a1a'; g.font = FONT(h * 0.36); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h * 0.4); },
  sun(g, w, h, c = '#ffcf5a') { g.fillStyle = c; g.beginPath(); g.arc(w / 2, h / 2, w * 0.3, 0, TAU); g.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(w / 2 + Math.cos(a - 0.1) * w * 0.34, h / 2 + Math.sin(a - 0.1) * w * 0.34); g.lineTo(w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * w * 0.48); g.lineTo(w / 2 + Math.cos(a + 0.1) * w * 0.34, h / 2 + Math.sin(a + 0.1) * w * 0.34); g.fill(); } },
  moon(g, w, h) { g.fillStyle = '#f3ecd2'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.45, 0, TAU); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(w * 0.68, h * 0.4, w * 0.4, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over'; },
  peak(g, w, h) { g.fillStyle = '#e9eef5'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.42, h * 0.05); g.lineTo(w * 0.55, h * 0.22); g.lineTo(w * 0.62, h * 0.15); g.lineTo(w, h); g.closePath(); g.fill(); g.fillStyle = '#b9c6d6'; g.beginPath(); g.moveTo(w * 0.42, h * 0.05); g.lineTo(w * 0.5, h); g.lineTo(w * 0.62, h * 0.15); g.lineTo(w * 0.55, h * 0.22); g.closePath(); g.fill(); },
  drop(g, w, h) { g.fillStyle = '#7fc8ff'; g.beginPath(); g.moveTo(w / 2, 0); g.bezierCurveTo(w * 0.9, h * 0.5, w * 0.85, h, w / 2, h); g.bezierCurveTo(w * 0.15, h, w * 0.1, h * 0.5, w / 2, 0); g.fill(); },
  tree(g, w, h, c = '#2f5a2a') { g.fillStyle = '#4a3424'; g.fillRect(w * 0.45, h * 0.6, w * 0.1, h * 0.4); g.fillStyle = c; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w * 0.1 + i * w * 0.05, h * (0.7 - i * 0.2)); g.lineTo(w / 2, h * (0.1 - i * 0.05 + 0.15 * 0)); g.lineTo(w * 0.9 - i * w * 0.05, h * (0.7 - i * 0.2)); g.fill(); } },
  palm(g, w, h) { g.strokeStyle = '#4a3424'; g.lineWidth = w * 0.06; g.beginPath(); g.moveTo(w * 0.5, h); g.quadraticCurveTo(w * 0.42, h * 0.5, w * 0.55, h * 0.2); g.stroke(); g.fillStyle = '#2f6a2a'; for (let i = 0; i < 7; i++) { const a = -Math.PI + i / 6 * Math.PI; g.save(); g.translate(w * 0.55, h * 0.2); g.rotate(a); g.beginPath(); g.ellipse(w * 0.22, 0, w * 0.24, h * 0.04, 0, 0, TAU); g.fill(); g.restore(); } },
};
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
function poly(g, x, y, r, n) { g.beginPath(); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i / n * TAU; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); }
export function icon(name, { w = 1, aspect = 1, args = [], px = 512, edge = 0.55, emissive = 0 } = {}) { return cut((g, cw, ch) => ICON[name](g, cw, ch, ...args), { w, aspect, px, edge, emissive }); }

// ---------- film ----------
export function makeFilm(CFG) {
  const { total, stations, palette } = CFG;
  const GAP = 20;
  const anims = [];
  const groups = [];
  scene.background = new THREE.Color(palette.bg || '#120d0a');
  const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02; scene.add(key, key.target);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x404040, 0.55); scene.add(hemi);
  stations.forEach((S, i) => {
    const g = new THREE.Group(); g.position.set(i * GAP, 0, 0); scene.add(g); groups.push(g);
    S.origin = g.position.clone(); S.i = i;
    // backdrop paper wall + floor card
    const wall = layer('rect', S.wall || palette.wall || '#2a1d14', { w: 19, aspect: 1.4, px: 256 }); wall.position.set(0, -3, -4.5); g.add(wall);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 8), new THREE.MeshStandardMaterial({ color: S.floor || palette.floor || '#3a2a1e', roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.001, 1); floor.receiveShadow = true; g.add(floor);
  });
  const E = {
    add(i, obj, x = 0, y = 0, z = 0, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; groups[i].add(obj); return obj; },
    on(fn) { anims.push(fn); },
    light(i, color, intensity, x, y, z, dist = 8) { const l = new THREE.PointLight(color, intensity, dist, 2); l.position.set(x, y, z); groups[i].add(l); return l; },
    station: (i) => stations[i], groups,
  };
  return { E, anims, key, hemi, groups, GAP };
}

// camera pose for a station at time t (hold with a slow push-in)
export function finish(CFG, F) {
  const { total, stations } = CFG; const { E, anims, key, hemi, groups } = F;
  const camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 200);
  const eye = V(0, 0, 0), look = V(0, 0, 0), right = V(0, 0, 0), up = V(0, 0, 0), a1 = V(0, 0, 0), a2 = V(0, 0, 0), b1 = V(0, 0, 0), b2 = V(0, 0, 0);
  let fov = 34;
  const WHIP = 0.42;
  function poseOf(i, t, e, l) {
    const S = stations[i], o = S.origin, c = S.cam || {}, t0 = S.t, t1 = i + 1 < stations.length ? stations[i + 1].t : total;
    const k = smooth(clamp((t - t0) / Math.max(0.5, t1 - t0)));
    const E0 = c.eye || [0, 3.6, 11], L0 = c.look || [0, 3.6, 0], E1 = c.eye1 || [E0[0] * 0.8, E0[1], E0[2] - (c.push ?? 2.2)], L1 = c.look1 || L0;
    e.set(o.x + lerp(E0[0], E1[0], k), o.y + lerp(E0[1], E1[1], k), o.z + lerp(E0[2], E1[2], k));
    l.set(o.x + lerp(L0[0], L1[0], k), o.y + lerp(L0[1], L1[1], k), o.z + lerp(L0[2], L1[2], k));
    return c.fov || 38;
  }
  function stationAt(t) { let i = 0; while (i + 1 < stations.length && t >= stations[i + 1].t) i++; return i; }
  function camAt(t) {
    // looping: the last beat whips back to station 0's opening pose
    const i = stationAt(t);
    const f1 = poseOf(i, t, a1, b1);
    const next = i + 1 < stations.length ? stations[i + 1].t : null;
    const prevStart = stations[i].t;
    eye.copy(a1); look.copy(b1); fov = f1;
    if (i > 0 && t < prevStart + WHIP * 0.55) {   // arriving: whip in from previous station's pose
      const k = easeInOut(clamp((t - (prevStart - WHIP * 0.45)) / WHIP)); const f0 = poseOf(i - 1, t, a2, b2);
      eye.copy(a2).lerp(a1, k); look.copy(b2).lerp(b1, k); fov = lerp(f0, f1, k);
    }
    if (next !== null && t > next - WHIP * 0.45) {   // leaving
      const k = easeInOut(clamp((t - (next - WHIP * 0.45)) / WHIP)); const f2 = poseOf(i + 1, next + 0.001, a2, b2);
      eye.copy(a1).lerp(a2, k); look.copy(b1).lerp(b2, k); fov = lerp(f1, f2, k);
    }
    if (CFG.loopFrom && t > CFG.loopFrom - WHIP * 0.45) {   // final whip home to station 0 at t=0
      const k = easeInOut(clamp((t - (CFG.loopFrom - WHIP * 0.45)) / WHIP)); const f0 = poseOf(0, 0, a2, b2);
      eye.lerp(a2, k); look.lerp(b2, k); fov = lerp(fov, f0, k);
    }
    // hand-held breathing + hits
    const ph = TAU * t / total;
    eye.x += 0.05 * Math.sin(ph * 9); eye.y += 0.035 * Math.sin(ph * 7 + 1);
    let j = 0; for (const h of CFG.hits || []) j += spring(t, h, 8, 7) * 0.06; eye.y += j; look.y += j * 0.4;
    return i;
  }
  function shoot(t, k, n) {
    const i = camAt(t);
    camera.fov = fov; camera.position.copy(eye); camera.lookAt(look); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    if (n > 1) {
      const F = eye.distanceTo(look), lens = 0.05;
      const a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * TAU, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
      right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
      camera.position.addScaledVector(right, lx).addScaledVector(up, ly); camera.updateMatrixWorld();
      const e = camera.projectionMatrix.elements, jx = halton(k + 1, 5) - 0.5, jy = halton(k + 1, 7) - 0.5;
      e[8] += -e[0] * lx / F + 2 * jx / RW; e[9] += -e[5] * ly / F + 2 * jy / RH;
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    }
    // key light follows the station being looked at
    const S = stations[stationAt(t)], L = S.light || CFG.light || {};
    const ld = L.dir || [-0.45, 0.75, 0.55];
    key.target.position.copy(look); key.position.copy(look).add(V(ld[0], ld[1], ld[2]).normalize().multiplyScalar(14));
    if (n > 1) { key.position.x += (halton(k + 1, 11) - 0.5) * 0.5; key.position.y += (halton(k + 1, 13) - 0.5) * 0.5; }
    key.color.set(L.color || '#fff1dc'); key.intensity = L.int ?? 2.6;
    hemi.color.set(L.sky || '#cfd8e8'); hemi.groundColor.set(L.ground || '#3a2a1e'); hemi.intensity = (L.amb ?? 0.55) * 1.35;
    const c = key.shadow.camera; c.left = -8; c.right = 8; c.top = 8; c.bottom = -8; c.near = 1; c.far = 40; c.updateProjectionMatrix();
    return i;
  }

  // ---------- overlay: captions, pills ----------
  const cap = canvas(W, H), cg = cap.getContext('2d'), capTex = texOf(cap);
  const GROUPS = []; { let cur = [];
    WORDS.forEach((w, i) => { cur.push({ w: w.w.replace(/[।…,!"—]/g, ''), t: w.t }); if (cur.length >= 4 || /[।…,!?"]$/.test(w.w) || i === WORDS.length - 1) { if (cur.some((x) => x.w)) GROUPS.push(cur.filter((x) => x.w)); cur = []; } });
    GROUPS.forEach((g, i) => { g.t0 = g[0].t - 0.05; g.t1 = i + 1 < GROUPS.length ? GROUPS[i + 1][0].t - 0.05 : total; }); }
  function txt(s, x, y, px, color, alpha = 1, scale = 1, stroke = 9) {
    if (alpha <= 0.001) return; cg.save(); cg.globalAlpha = Math.min(1, alpha); cg.translate(x, y); cg.scale(scale, scale); cg.font = FONT(px); cg.textAlign = 'center'; cg.textBaseline = 'middle';
    cg.lineJoin = 'round'; if (stroke) { cg.lineWidth = stroke; cg.strokeStyle = 'rgba(0,0,0,0.85)'; cg.strokeText(s, 0, 0); } cg.fillStyle = color; cg.fillText(s, 0, 0); cg.restore();
  }
  function pill(s, x, y, col, alpha, px = 46) {
    if (alpha <= 0.001) return; cg.save(); cg.font = FONT(px); const w = cg.measureText(s).width + 48; cg.globalAlpha = alpha; cg.fillStyle = 'rgba(14,10,8,0.8)'; cg.strokeStyle = col; cg.lineWidth = 3;
    cg.beginPath(); cg.roundRect(x - w / 2, y - px * 0.78, w, px * 1.56, px * 0.78); cg.fill(); cg.stroke(); cg.restore(); txt(s, x, y + 3, px, col, alpha, 1, 0);
  }
  function drawOverlay(t) {
    cg.clearRect(0, 0, W, H);
    const gb = cg.createLinearGradient(0, H - 650, 0, H); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,0.45)'); cg.fillStyle = gb; cg.fillRect(0, H - 650, W, 650);
    for (const P of CFG.pills || []) { const [a, b, s, y, col] = P; if (t < a || t > b + 0.2) continue; const k = seg(t, a, a + 0.3), o = Math.min(1, k * 2) * (1 - seg(t, b, b + 0.2)); pill(s, W / 2, y + 16 * (1 - backOut(k)), col || '#ffd24a', o); }
    const g = GROUPS.find((x) => t >= x.t0 && t < x.t1 + 0.1);
    if (g && t < total - 0.05) {
      cg.font = FONT(52); const sp = cg.measureText(' ').width, ws = g.map((w) => cg.measureText(w.w).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (g.length - 1);
      let x = W / 2 - tw / 2;
      g.forEach((w, i) => { const on = t >= w.t - 0.03, nx = g[i + 1] ? g[i + 1].t : g.t1, act = on && t < nx, k = seg(t, w.t - 0.03, w.t + 0.08);
        txt(w.w, x + ws[i] / 2, 1468 + 6 * (1 - backOut(k)), 52, act ? '#ffd24a' : '#ffffff', on ? 1 : 0.35, 1, 9); x += ws[i] + sp; });
    }
    if (CFG.overlay) CFG.overlay(cg, t, { txt, pill, W, H });
    capTex.needsUpdate = true;
  }

  // ---------- post ----------
  const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
    fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), 0.25, 0.5, 0.95);
  const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, cap: { value: capTex }, seed: { value: 0 }, exposure: { value: 1 } }, vertexShader: vert,
    fragmentShader: `uniform sampler2D tex, cap; uniform float seed, exposure; varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
      vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      void main() { vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.008;
        vec3 c = vec3(texture2D(tex, vUv + d * ca).r, texture2D(tex, vUv).g, texture2D(tex, vUv - d * ca).b) * exposure;
        c = aces(c); c *= mix(1.0, 0.55, smoothstep(0.3, 0.95, length(d * vec2(0.85, 1.0)) * 1.45)); c = srgb(c);
        c += (h(vUv * 1000.0) - 0.5) * 0.03; vec4 k = texture2D(cap, vUv); c = c * (1.0 - k.a) + k.rgb; gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false }));
  const SHUTTER = 0.5 / 30;
  function pose(t) { for (const f of anims) f(t); }
  function renderAt(t, n = 1) {
    pose(t); shoot(t, 0, 1); drawOverlay(t);
    renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear();
    for (let k = 0; k < n; k++) {
      const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * SHUTTER;
      pose(ts); shoot(ts, k, n);
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = 1 / n;
      renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true;
    }
    bloom.render(renderer, accum, accum, 0, false);
    grade.material.uniforms.seed.value = (t * 30) % 97; grade.material.uniforms.exposure.value = CFG.exposure || 1.0;
    renderer.setRenderTarget(null); grade.render(renderer);
  }
  window.renderAt = renderAt; window.total = total;
  return renderAt;
}

// common animation helpers (all pure functions of t)
export const pop = (t, at, d = 0.35) => (t < at ? 0.0001 : Math.max(0.0001, backOut(clamp((t - at) / d), 2.2)));
export const rise = (t, a, b, from, to, ease = easeOut) => lerp(from, to, ease(clamp((t - a) / (b - a))));
// paper confetti burst at time at (InstancedMesh), returns update(t)
export function confetti(group, at, { n = 80, x = 0, y = 6, spread = 4, colors = ['#ffd24a', '#e84b3c', '#3ca0e8', '#ffffff', '#5dd27a'] } = {}) {
  const geo = new THREE.PlaneGeometry(0.09, 0.14), mats = colors.map((c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.9 }));
  const meshes = mats.map((m) => { const im = new THREE.InstancedMesh(geo, m, Math.ceil(n / colors.length)); im.castShadow = true; group.add(im); return im; });
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = V(0, 0, 0), s = V(1, 1, 1), e = new THREE.Euler();
  return (t) => { const age = t - at; meshes.forEach((im, c) => { for (let i = 0; i < im.count; i++) { const id = i * colors.length + c;
    if (age < 0 || age > 6) { M.makeScale(0, 0, 0); im.setMatrixAt(i, M); continue; }
    const a = hash(id + at) * TAU, v = 2 + 3 * hash(id * 3 + at), up = 3 + 4 * hash(id * 7);
    p.set(x + Math.cos(a) * v * age * 0.5 + Math.sin(age * 3 + id) * 0.1, y + up * age - 4.9 * age * age * 0.35, Math.sin(a) * v * age * 0.25 + 0.5);
    e.set(age * 6 * hash(id), age * 9 * hash(id + 1), age * 4); q.setFromEuler(e); M.compose(p, q, s); im.setMatrixAt(i, M); } im.instanceMatrix.needsUpdate = true; }); };
}
