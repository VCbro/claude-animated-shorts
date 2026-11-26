// हनुमान और राम की हज़ारों अंगूठियाँ — a folk telling recorded by A.K. Ramanujan ("Three Hundred Rāmāyaṇas").
// The divine figures are never modelled in 3D: they are real paintings (Raja Ravi Varma, Pahari) cut out as paper.
// 3D carries only what 3D does well: marble, gold, light, the crack, the shaft, the netherworld, thousands of rings.
import { THREE, V, TAU, W, H, film, scene, renderer, mat, add, rod, group, rock, photoCard, particles, fbm, pop, rise,
  clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rama, hanuman } from './toon.js';

const total = 63.2;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const easeIn = (k) => k * k * k;
const HDR = (r, g, b) => new THREE.Color(r, g, b);

// ---------------------------------------------------------------- materials
const gold = new THREE.MeshStandardMaterial({ color: 0xffc35a, metalness: 1, roughness: 0.3, envMap: ENV, envMapIntensity: 0.18 });
const goldDim = new THREE.MeshStandardMaterial({ color: 0xc98a34, metalness: 0.85, roughness: 0.45, envMap: ENV, envMapIntensity: 0.12 });
const brass = new THREE.MeshStandardMaterial({ color: 0xb07a38, metalness: 0.9, roughness: 0.4, envMap: ENV, envMapIntensity: 0.12 });

function marbleTex() {
  const c = cv(1024, 1024), g = c.getContext('2d');
  g.fillStyle = '#efe6d6'; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(150,130,110,${0.05 + 0.08 * hash(i)})`; g.lineWidth = 1 + 3 * hash(i + 9); g.beginPath(); let x = hash(i * 3) * 1024, y = hash(i * 7) * 1024; g.moveTo(x, y);
    for (let k = 0; k < 14; k++) { x += (hash(i * 31 + k) - 0.3) * 120; y += (hash(i * 17 + k) - 0.5) * 120; g.lineTo(x, y); } g.stroke(); }
  // inlay: gold lotus border on a 4 m tile
  g.strokeStyle = '#b8862e'; g.lineWidth = 10; g.strokeRect(14, 14, 996, 996); g.lineWidth = 4; g.strokeRect(40, 40, 944, 944);
  g.save(); g.translate(512, 512); g.strokeStyle = '#a9792a'; g.lineWidth = 6;
  for (let k = 0; k < 16; k++) { g.rotate(TAU / 16); g.beginPath(); g.ellipse(0, -130, 34, 110, 0, 0, TAU); g.stroke(); }
  g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 250, 0, TAU); g.stroke(); g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const MARBLE = marbleTex(); MARBLE.repeat.set(1 / 4, 1 / 4);
const floorMat = new THREE.MeshStandardMaterial({ map: MARBLE, roughness: 0.2, metalness: 0, envMap: ENV, envMapIntensity: 0.08 });
const stone = mat(0xd9c7a8, 0.6), stoneDark = mat(0x8a7558, 0.7);

// ---------------------------------------------------------------- paper cut-outs from real paintings
const svgURL = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
async function cutout(src, { h = 3, border = 12, res = 0, variants = null } = {}) {
  const im = await img(src), iw = im.naturalWidth, ih = im.naturalHeight, sc = res ? res / ih : Math.min(1, 2048 / Math.max(iw, ih));
  const w = Math.round(iw * sc) + border * 4, hh = Math.round(ih * sc) + border * 4, o = border * 2;
  const s = cv(w, hh), sg = s.getContext('2d');
  for (let a = 0; a < 28; a++) sg.drawImage(im, o + Math.cos(a / 28 * TAU) * border, o + Math.sin(a / 28 * TAU) * border, iw * sc, ih * sc);
  sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#f6f0e1'; sg.fillRect(0, 0, w, hh);
  const c = cv(w, hh), g = c.getContext('2d'); g.drawImage(s, 0, 0); g.drawImage(im, o, o, iw * sc, ih * sc);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const alt = [];
  for (const v of variants || []) { const im2 = await img(v), c2 = cv(w, hh), g2 = c2.getContext('2d'); g2.drawImage(s, 0, 0); g2.drawImage(im2, o, o, iw * sc, ih * sc);
    const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; t2.anisotropy = 8; alt.push(t2); }
  const ww = h * w / hh, geo = new THREE.PlaneGeometry(ww, h); geo.translate(0, h / 2, 0);
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.75, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.1 }));
  const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, color: 0x1a1008, alphaTest: 0.5 }));
  back.position.z = -h * 0.008; back.scale.setScalar(1.004);
  front.castShadow = true; front.receiveShadow = true; front.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const grp = new THREE.Group(); grp.add(back, front); scene.add(grp);
  // pixel of the source image -> local point on the card
  grp.userData.at = (px, py) => V(((px * sc + o) / w - 0.5) * ww, (1 - (py * sc + o) / hh) * h, 0.01);
  grp.userData.front = front; grp.userData.tex = [tex, ...alt];
  grp.userData.set = (i) => { const t = grp.userData.tex[i] || tex; if (front.material.map !== t) { front.material.map = t; front.material.emissiveMap = t; front.material.needsUpdate = true; } };
  return grp;
}

// ---------------------------------------------------------------- AYODHYA: the palace
const DAIS_Z = -7.6, DAIS_Y = 0.6;
const HP = V(0.15, 0, -5.6);                       // where the ring touches the floor and the hole opens
const HOLE_R = 0.16;
{ const sh = new THREE.Shape(); sh.moveTo(-30, -30); sh.lineTo(30, -30); sh.lineTo(30, 30); sh.lineTo(-30, 30);
  const hole = new THREE.Path(); hole.absarc(HP.x, -HP.z, HOLE_R, 0, TAU, true); sh.holes.push(hole);
  const g = new THREE.ShapeGeometry(sh, 48); g.rotateX(-Math.PI / 2); const f = add(g, floorMat, 0, 0, 0, scene, false); f.receiveShadow = true; }
// lid: the piece of floor that breaks (same world-UVs as the floor)
const lidShape = new THREE.Shape(); lidShape.absarc(HP.x, -HP.z, HOLE_R, 0, TAU, false);
const lidG = new THREE.ShapeGeometry(lidShape, 32); lidG.rotateX(-Math.PI / 2);
const lid = add(lidG, floorMat, 0, 0.0005, 0, scene, false);
const shards = Array.from({ length: 7 }, (_, i) => { const a0 = i / 7 * TAU + 0.2 * hash(i), a1 = (i + 1) / 7 * TAU + 0.2 * hash(i + 1), s = new THREE.Shape();
  s.moveTo(HP.x, -HP.z); for (let k = 0; k <= 6; k++) { const a = lerp(a0, a1, k / 6), r = HOLE_R * (0.92 + 0.1 * hash(i * 9 + k)); s.lineTo(HP.x + Math.cos(a) * r, -HP.z + Math.sin(a) * r); }
  const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); const c = V(HP.x + Math.cos((a0 + a1) / 2) * HOLE_R * 0.55, 0, HP.z - Math.sin((a0 + a1) / 2) * HOLE_R * 0.55); g.translate(-c.x, 0, -c.z);
  const m = add(g, floorMat, c.x, 0.0005, c.z, scene, false); m.userData.c = c; m.visible = false; return m; });
// glowing crack (shader decal, grows outward)
const crackTex = (() => { const c = cv(1024, 1024), g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineCap = 'round';
  const br = (x, y, a, len, w, d, s) => { if (d > 5 || len < 6) return; let k = 0; g.lineWidth = w; g.beginPath(); g.moveTo(x, y);
    while (k < len) { a += (hash(s + k) - 0.5) * 0.7; x += Math.cos(a) * 8; y += Math.sin(a) * 8; g.lineTo(x, y); k += 8;
      if (hash(s * 3 + k) < 0.05) { g.stroke(); br(x, y, a + (hash(s + k * 7) - 0.5) * 2.2, len * 0.55, w * 0.65, d + 1, s * 7 + k); g.lineWidth = w; g.beginPath(); g.moveTo(x, y); } } g.stroke(); };
  for (let i = 0; i < 9; i++) br(512, 512, i / 9 * TAU + hash(i), 300 + 160 * hash(i + 4), 9, 0, i * 101 + 7);
  const t = new THREE.CanvasTexture(c); return t; })();
const crackU = { map: { value: crackTex }, prog: { value: 0 }, glow: { value: 0 } };
const crack = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.ShaderMaterial({ uniforms: crackU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D map; uniform float prog, glow; varying vec2 vUv;
    void main(){ float a = texture2D(map, vUv).r; float d = length(vUv - 0.5) * 2.0; float m = a * smoothstep(prog + 0.02, prog - 0.06, d);
      vec3 c = mix(vec3(0.5, 0.35, 1.6), vec3(2.2, 1.3, 0.5), smoothstep(0.0, 0.6, d)); gl_FragColor = vec4(c * m * glow, 1.0); }` }));
crack.rotation.x = -Math.PI / 2; crack.position.copy(HP).add(V(0, 0.002, 0)); scene.add(crack);
// the hole and the shaft below it
const SHAFT_BOTTOM = -37;
const shaftG = new THREE.CylinderGeometry(HOLE_R, 2.2, -SHAFT_BOTTOM, 40, 90, true);
{ const p = shaftG.attributes.position.array, col = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) { const y = p[i + 1], a = Math.atan2(p[i + 2], p[i]), n = fbm(a * 3 + 5, y * 0.6, 4) - 0.5, k = 1 + 0.4 * n;
    p[i] *= k; p[i + 2] *= k; const d = clamp((-SHAFT_BOTTOM / 2 - y) / -SHAFT_BOTTOM); const v = 0.25 + 0.3 * fbm(a * 6, y * 2, 3);
    col[i] = v * lerp(0.55, 0.3, d); col[i + 1] = v * lerp(0.42, 0.3, d); col[i + 2] = v * lerp(0.32, 0.55, d); }
  shaftG.setAttribute('color', new THREE.BufferAttribute(col, 3)); shaftG.computeVertexNormals(); }
const shaft = add(shaftG, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.BackSide }), HP.x, SHAFT_BOTTOM / 2, HP.z, scene, false);
const holeGlow = new THREE.PointLight(0x8a6bff, 0, 3, 1.5); holeGlow.position.copy(HP).add(V(0, -0.4, 0)); scene.add(holeGlow);

// pillars, walls, dais, drapes, lamps
function pillar(x, z, h = 6) {
  const pts = [[0.42, 0], [0.42, 0.18], [0.34, 0.24], [0.3, 0.5], [0.27, h - 0.9], [0.33, h - 0.7], [0.3, h - 0.55], [0.46, h - 0.35], [0.5, h - 0.12], [0.5, h]].map(([r, y]) => new THREE.Vector2(r, y));
  const m = add(new THREE.LatheGeometry(pts, 32), stone, x, 0, z); m.castShadow = true;
  for (const y of [0.5, h - 0.9, h - 0.6]) add(new THREE.TorusGeometry(y < 1 ? 0.31 : 0.29, 0.025, 8, 40), goldDim, x, y, z).rotation.x = Math.PI / 2;
}
for (const z of [-1, -4.2, -7.4, -10.6]) { pillar(-3.6, z); pillar(3.6, z); }
const back = add(new THREE.PlaneGeometry(14, 8), new THREE.MeshStandardMaterial({ color: 0xcdb894, roughness: 0.8 }), 0, 4, -11.4);
// jharokha arches with warm sky behind
const arch = (() => { const c = cv(1024, 1024), g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024); g.fillStyle = '#fff';
  for (const x of [170, 512, 854]) { g.beginPath(); g.moveTo(x - 110, 900); g.lineTo(x - 110, 420); g.quadraticCurveTo(x - 110, 250, x, 170); g.quadraticCurveTo(x + 110, 250, x + 110, 420); g.lineTo(x + 110, 900); g.fill(); }
  const t = new THREE.CanvasTexture(c); return t; })();
const skyWin = new THREE.MeshBasicMaterial({ color: HDR(0.6, 0.36, 0.18), alphaMap: arch, transparent: true, depthWrite: false });
const win = add(new THREE.PlaneGeometry(9, 6), skyWin, 0, 3.6, -11.35, scene, false);
for (let s = 0; s < 3; s++) add(new THREE.BoxGeometry(5.2 - s * 0.7, 0.2, 2.6 - s * 0.5), s === 2 ? brass : stone, 0, 0.1 + s * 0.2, DAIS_Z - 0.2 + s * 0.12);
for (const x of [-4.6, 4.6]) { const g = new THREE.PlaneGeometry(1.8, 7, 18, 1), p = g.attributes.position.array; for (let i = 0; i < p.length; i += 3) p[i + 2] = 0.12 * Math.sin(p[i] * 9);
  g.computeVertexNormals(); add(g, mat(0x8a1a16, 0.55, 0, { side: THREE.DoubleSide }), x, 3.6, -11.1); }
// diyas
const flames = [];
function diya(x, y, z, k = 1) {
  const pts = [[0, 0], [0.05, 0.005], [0.07, 0.025], [0.075, 0.04], [0.06, 0.035], [0, 0.03]].map(([r, h]) => new THREE.Vector2(r * k, h * k));
  add(new THREE.LatheGeometry(pts, 20), mat(0x8a4a2a, 0.8), x, y, z);
  const f = add(new THREE.SphereGeometry(0.012 * k, 10, 8), new THREE.MeshBasicMaterial({ color: HDR(9, 5, 1.6) }), x, y + 0.05 * k, z, scene, false); f.scale.set(1, 2.2, 1);
  const L = new THREE.PointLight(0xffa850, 0.35 * k, 3.2 * k, 1.6); L.position.set(x, y + 0.09 * k, z); scene.add(L); flames.push({ f, L, s: x * 3 + z, k }); return f;
}
for (const x of [-2.4, -1.6, 1.6, 2.4]) diya(x, 0.62, DAIS_Z + 1.05, 1.4);
for (const x of [-1.2, 1.2]) diya(x, 0.0, DAIS_Z + 1.9, 1.2);
for (const z of [-2.6, -5.8, -9]) { diya(-3.2, 0, z, 1.2); diya(3.2, 0, z, 1.2); }
const palKey = new THREE.SpotLight(0xffd7a0, 0, 30, 0.5, 0.6, 1.2); palKey.position.set(2.5, 9, -1.5); palKey.target.position.set(0, 1.6, DAIS_Z); palKey.castShadow = true; palKey.shadow.mapSize.set(2048, 2048);
scene.add(palKey, palKey.target);
// god-rays for "time to return" (soft additive cone from above the throne)
const rays = add(new THREE.ConeGeometry(2.4, 9, 40, 1, true), new THREE.MeshBasicMaterial({ color: HDR(1.0, 0.75, 0.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 0, 4.6, DAIS_Z + 0.1, scene, false);

// ---------------------------------------------------------------- the ring (Rama's mudrika, "राम" on the bezel)
const nameTex = (() => { const c = cv(256, 256), g = c.getContext('2d'); g.fillStyle = '#c8902e'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#5a3a0a'; g.font = "800 120px BalooD, sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('राम', 128, 140);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const RS = 0.026;                                     // ring radius (m)
function ringParts(seg = 1) {
  const band = new THREE.TorusGeometry(RS, RS * 0.2, 10 * seg, 28 * seg);
  const bez = new THREE.CylinderGeometry(RS * 0.42, RS * 0.48, RS * 0.25, 18 * seg); bez.rotateX(Math.PI / 2); bez.rotateX(-Math.PI / 2); bez.translate(0, RS * 1.12, 0);
  const plate = new THREE.CircleGeometry(RS * 0.38, 18 * seg); plate.rotateX(-Math.PI / 2); plate.translate(0, RS * 1.25 + 0.0003, 0);
  return { metal: mergeGeometries([band, bez]), plate };
}
const heroParts = ringParts(2);
const hero = new THREE.Group(); scene.add(hero);
add(heroParts.metal, gold, 0, 0, 0, hero); add(heroParts.plate, new THREE.MeshStandardMaterial({ map: nameTex, metalness: 0.9, roughness: 0.35, envMap: ENV }), 0, 0, 0, hero);

// ---------------------------------------------------------------- PATALA: the netherworld
const C = V(HP.x, -62, HP.z);                           // cavern centre (sphere)
const PY = -80;                                          // cavern floor
{ const g = new THREE.SphereGeometry(30, 96, 64), p = g.attributes.position.array, col = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) { const x = p[i], y = p[i + 1], z = p[i + 2], n = fbm(x * 0.12 + 3, y * 0.14 + z * 0.12, 5), k = 0.8 + 0.4 * n;
    p[i] = x * k; p[i + 1] = Math.max(y * k, PY - C.y - 0.5); p[i + 2] = z * k; const v = 0.12 + 0.25 * fbm(x * 0.4, z * 0.4 + y * 0.3, 3);
    col[i] = v * 0.55; col[i + 1] = v * 0.45; col[i + 2] = v * 0.85; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  add(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.BackSide }), C.x, C.y, C.z, scene, false); }
const pfloor = add(new THREE.CircleGeometry(34, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x241c30, roughness: 0.55, metalness: 0.1, envMap: ENV, envMapIntensity: 0.15 }), C.x, PY, C.z, scene, false);
pfloor.receiveShadow = true;
for (let i = 0; i < 40; i++) { const a = hash(i) * TAU, r = 6 + 20 * hash(i + 50), l = 2 + 7 * hash(i + 9);
  const st = add(new THREE.ConeGeometry(0.3 + 0.6 * hash(i + 3), l, 10), mat(0x2a2236, 0.9), C.x + Math.cos(a) * r, C.y + 26 - l / 2 - 2 * hash(i + 7), C.z + Math.sin(a) * r, scene, false); st.rotation.x = Math.PI; }
// river of light
const riverTex = (() => { const c = cv(64, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 512); return new THREE.CanvasTexture(c); })();
const riverCurve = new THREE.CatmullRomCurve3([V(-26, 0, 8), V(-12, 0, 2), V(-2, 0, 10), V(10, 0, 6), V(24, 0, 12)].map((p) => p.add(V(C.x, PY + 0.03, C.z))));
{ const n = 200, pos = [], uv = [], idx = []; for (let i = 0; i <= n; i++) { const t = i / n, p = riverCurve.getPointAt(t), tg = riverCurve.getTangentAt(t), sd = V(-tg.z, 0, tg.x).normalize().multiplyScalar(1.4);
    pos.push(p.x - sd.x, p.y, p.z - sd.z, p.x + sd.x, p.y, p.z + sd.z); uv.push(0, t, 1, t); if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  add(g, new THREE.MeshBasicMaterial({ color: HDR(0.5, 0.9, 2.4), map: riverTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, 0, scene, false); }
const caveFill = new THREE.PointLight(0x7a64ff, 260, 70, 1.6); caveFill.position.set(C.x - 8, PY + 14, C.z + 8); scene.add(caveFill);
const riverLight = new THREE.PointLight(0x5ab8ff, 90, 40, 1.6); riverLight.position.set(C.x, PY + 2, C.z + 7); scene.add(riverLight);
// the King of Spirits: never shown, only a vast dark throne and two eyes
const KZ = C.z - 16;
add(new THREE.BoxGeometry(9, 1.2, 5), mat(0x15111c, 0.9), C.x, PY + 0.6, KZ);
add(new THREE.BoxGeometry(8, 12, 1.4), mat(0x15111c, 0.9), C.x, PY + 7, KZ - 2);
for (const x of [-4, 4]) add(new THREE.BoxGeometry(1.2, 4, 4.4), mat(0x15111c, 0.9), C.x + x, PY + 3, KZ);
const kingBody = add(new THREE.CapsuleGeometry(2.4, 5.5, 8, 24), mat(0x07060a, 1), C.x, PY + 6.2, KZ - 0.4, scene, false);
const kingHead = add(new THREE.SphereGeometry(1.6, 24, 16), mat(0x07060a, 1), C.x, PY + 11.4, KZ - 0.2, scene, false);
const eyeM = new THREE.MeshBasicMaterial({ color: HDR(8, 3.6, 0.8) });
const eyes = [-0.6, 0.6].map((x) => { const e = add(new THREE.SphereGeometry(0.17, 16, 10), eyeM, C.x + x, PY + 11.6, KZ + 1.3, scene, false); e.scale.set(1.6, 0.0001, 1); return e; });
const rim = new THREE.SpotLight(0x9a7aff, 0, 40, 0.5, 0.7, 1.4); rim.position.set(C.x, PY + 22, KZ - 10); rim.target.position.set(C.x, PY + 8, KZ); scene.add(rim, rim.target);
const torches = [];
for (const [x, z] of [[-6, -10], [6, -10], [-9, -4], [9, -4]]) { const p = V(C.x + x, PY, C.z + z); add(new THREE.CylinderGeometry(0.08, 0.12, 2.6, 10), mat(0x2a2018, 0.8), p.x, PY + 1.3, p.z);
  const f = add(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshBasicMaterial({ color: HDR(10, 4.5, 1.2) }), p.x, PY + 2.75, p.z, scene, false); f.scale.set(1, 1.8, 1);
  const L = new THREE.PointLight(0xff8a3a, 22, 20, 1.6); L.position.set(p.x, PY + 3.0, p.z); scene.add(L); torches.push({ f, L, s: x + z }); }
// the table and the thali
const TABLE = V(C.x, PY, C.z - 7);
add(new THREE.CylinderGeometry(1.25, 1.4, 1.0, 40), mat(0x2a2232, 0.8), TABLE.x, PY + 0.5, TABLE.z);
const TH = V(TABLE.x, PY + 1.0, TABLE.z);
const thali = group(TH.x, TH.y, TH.z);
{ const pts = [[0, 0], [0.62, 0.0], [0.7, 0.03], [0.74, 0.07], [0.76, 0.08], [0.72, 0.06], [0.64, 0.02], [0, 0.015]].map(([r, y]) => new THREE.Vector2(r, y));
  add(new THREE.LatheGeometry(pts, 96), brass, 0, 0, 0, thali); }
const thaliKey = new THREE.SpotLight(0xffe2b0, 0, 8, 0.45, 0.6, 1.3); thaliKey.position.set(TH.x + 0.8, TH.y + 3.2, TH.z + 1.6); thaliKey.target.position.copy(TH);
thaliKey.castShadow = true; thaliKey.shadow.mapSize.set(2048, 2048); thaliKey.shadow.bias = -0.0004; scene.add(thaliKey, thaliKey.target);
// thousands of rings: heap on the thali, then a spiral rising into the dark
const N = 2400, parts = ringParts(1);
const ringsM = new THREE.InstancedMesh(parts.metal, gold, N), platesM = new THREE.InstancedMesh(parts.plate, new THREE.MeshStandardMaterial({ map: nameTex, metalness: 0.9, roughness: 0.35, envMap: ENV }), N);
ringsM.receiveShadow = true; platesM.receiveShadow = true; ringsM.frustumCulled = platesM.frustumCulled = false; scene.add(ringsM, platesM);
const mound = (r) => 0.12 * Math.pow(Math.max(0, 1 - r / 0.62), 1.4);
const HEAP = [], SPIRAL = [];
for (let i = 0; i < N; i++) {
  const r = 0.6 * Math.sqrt(hash(i * 1.7 + 0.3)), a = hash(i * 2.9 + 1.1) * TAU, y = 0.02 + mound(r) * hash(i * 0.77 + 5) ** 0.5;
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((hash(i + 0.4) - 0.5) * 1.4 + Math.PI / 2 * (hash(i * 5) < 0.75 ? 1 : 0.3), hash(i * 3.3) * TAU, (hash(i * 4.1) - 0.5) * 1.2));
  HEAP.push({ p: V(TH.x + Math.cos(a) * r, TH.y + y, TH.z + Math.sin(a) * r), q });
  const k = i / N, ang = i * 0.37, rad = 0.9 + 2.2 * k + 0.25 * Math.sin(i * 0.11), hgt = 0.6 + 26 * k;
  SPIRAL.push({ p: V(TH.x + Math.cos(ang) * rad, TH.y + hgt, TH.z + Math.sin(ang) * rad), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + 0.3 * Math.sin(i), ang, 0.2 * Math.cos(i * 1.3))) });
}
const _m = new THREE.Matrix4(), _p = V(0, 0, 0), _q = new THREE.Quaternion(), _s = V(1, 1, 1);
function rings(t) {
  // 43.3 -> 47.5 rise into the spiral; 59.2 -> 61.8 come back down to the heap (so the film loops)
  for (let i = 0; i < N; i++) {
    const d = (i / N) * 2.6, up = easeInOut(seg(t, 43.3 + d * 0.6, 44.9 + d * 0.6)), dn = easeInOut(seg(t, 59.2 + (1 - i / N) * 1.2, 60.4 + (1 - i / N) * 1.2));
    const k = (i % 4 === 0 ? 0 : up * (1 - dn)); const a = HEAP[i], b = SPIRAL[i];
    _p.copy(a.p).lerp(b.p, k); _p.y += Math.sin(k * Math.PI) * 0.6 * hash(i + 2); if (k > 0.98) _p.y += 0.05 * Math.sin(t * 1.3 + i);
    _q.copy(a.q).slerp(b.q, k); if (k > 0.01) _q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), t * 0.6 * k + i));
    _s.setScalar(1 + 1.8 * k); _m.compose(_p, _q, _s); ringsM.setMatrixAt(i, _m); platesM.setMatrixAt(i, _m);
  }
  ringsM.instanceMatrix.needsUpdate = true; platesM.instanceMatrix.needsUpdate = true;
}
const ringGlow = new THREE.PointLight(0xffb84a, 0, 14, 1.4); scene.add(ringGlow);
const spiralL = [4, 10, 16, 22].map((h) => { const L = new THREE.PointLight(0xffc870, 0, 16, 1.3); L.position.set(TH.x + 2, TH.y + h, TH.z + 2); scene.add(L); return L; });

// ---------------------------------------------------------------- the essay on a desk (real source)
const DK = V(-300, 0, 0);
add(new THREE.BoxGeometry(4, 0.12, 2.6), new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.55 }), DK.x, DK.y - 0.06, DK.z);
diya(DK.x + 0.55, DK.y, DK.z - 0.35, 1.3);
const essayT = await photoCard('img/essay_title.png', { w: 0.62, tape: false });
essayT.rotation.x = -Math.PI / 2; essayT.position.set(DK.x - 0.1, DK.y + 0.004, DK.z + 0.05); essayT.rotation.z = 0.06;
const essayRing = new THREE.Group(); scene.add(essayRing); add(heroParts.metal, gold, 0, 0, 0, essayRing); add(heroParts.plate, new THREE.MeshStandardMaterial({ map: nameTex, metalness: 0.9, roughness: 0.35, envMap: ENV }), 0, 0, 0, essayRing);
essayRing.position.set(DK.x + 0.26, DK.y + 0.006, DK.z + 0.2); essayRing.rotation.set(Math.PI / 2 - 0.12, 0, 0.4);
const deskKey = new THREE.SpotLight(0xffd8a8, 0, 6, 0.6, 0.7, 1.2); deskKey.position.set(DK.x - 0.6, 2.2, DK.z + 0.8); deskKey.target.position.copy(DK); deskKey.castShadow = true; scene.add(deskKey, deskKey.target);

// ---------------------------------------------------------------- paintings as paper cut-outs
// 3D throne + chhatra (royal umbrella); the cartoon Rama sits on it
const SEAT_Y = DAIS_Y + 0.5;
add(new THREE.BoxGeometry(1.5, 0.5, 0.9), goldDim, 0, DAIS_Y + 0.25, DAIS_Z - 0.35);
add(new THREE.BoxGeometry(1.42, 0.12, 0.84), mat(0xa0202a, 0.6), 0, SEAT_Y + 0.05, DAIS_Z - 0.35);
add(new THREE.BoxGeometry(0.9, 0.12, 0.5), mat(0x2a8a4a, 0.7), 0, DAIS_Y + 0.06, DAIS_Z + 0.35);
{ const sh = new THREE.Shape(); sh.moveTo(-0.85, 0); sh.lineTo(-0.85, 1.6); sh.quadraticCurveTo(-0.85, 2.5, 0, 2.75); sh.quadraticCurveTo(0.85, 2.5, 0.85, 1.6); sh.lineTo(0.85, 0);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 }); add(g, goldDim, 0, SEAT_Y, DAIS_Z - 0.85);
  const inner = new THREE.Shape(); inner.moveTo(-0.62, 0.1); inner.lineTo(-0.62, 1.55); inner.quadraticCurveTo(-0.62, 2.25, 0, 2.45); inner.quadraticCurveTo(0.62, 2.25, 0.62, 1.55); inner.lineTo(0.62, 0.1);
  add(new THREE.ShapeGeometry(inner), mat(0x8a1a22, 0.5), 0, SEAT_Y, DAIS_Z - 0.69); }
rod(V(0.95, DAIS_Y, DAIS_Z - 0.6), V(0.25, 3.55, DAIS_Z - 0.4), 0.025, goldDim);
{ const ch = add(new THREE.ConeGeometry(0.95, 0.42, 32, 1, true), mat(0xb3202a, 0.6, 0, { side: THREE.DoubleSide }), 0.2, 3.72, DAIS_Z - 0.35); ch.castShadow = true;
  add(new THREE.TorusGeometry(0.95, 0.03, 8, 48), goldDim, 0.2, 3.51, DAIS_Z - 0.35).rotation.x = Math.PI / 2; add(new THREE.SphereGeometry(0.07, 12, 10), gold, 0.2, 3.97, DAIS_Z - 0.35); }
const ramT = await cutout(svgURL(rama({})), { h: 1.62, res: 1600, border: 10, variants: [svgURL(rama({ mouth: 1 }))] });
ramT.position.set(0, DAIS_Y, DAIS_Z + 0.08);
const HAND = ramT.userData.at(274, 394).add(ramT.position);          // the ring on the raised (abhaya) hand
const HB = V(HP.x - 0.6, 0, HP.z + 0.05);                            // Hanuman stands by the spot where the hole will open
const hanu = await cutout(svgURL(hanuman({ pose: 'namaste' })), { h: 1.45, res: 1600, border: 10 });
const tinyLook = await cutout(svgURL(hanuman({ pose: 'look' })), { h: 1, res: 900, border: 12 });
const tinyFly = await cutout(svgURL(hanuman({ pose: 'fly' })), { h: 1, res: 900, border: 12 });
const auraTex = (() => { const c = cv(256, 256), g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, 'rgba(255,220,140,1)'); r.addColorStop(0.35, 'rgba(255,170,60,0.45)'); r.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex, color: HDR(1.2, 0.8, 0.35), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); scene.add(aura);
const hanuLight = new THREE.PointLight(0xffb060, 0, 2, 1.5); scene.add(hanuLight);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.4, 'rgba(255,255,255,0.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const sparks = particles(260, HDR(3, 2, 0.8), 0.012);
const dust = particles(300, new THREE.Color(0.9, 0.82, 0.7), 0.006, { additive: false, opacity: 0.7 });
const motes = particles(500, HDR(0.5, 0.6, 1.6), 0.03);
for (const q of [sparks, dust, motes]) { q.p.material.map = dotTex; q.p.material.transparent = true; q.p.material.needsUpdate = true; }

// Ramayanas of many lands (paper cards) + Brahma
const CARDS = {};
for (const [k, src, w] of [['ramakien', 'img/ramakien04.jpg', 1.3], ['lacma', 'img/coronation_lacma.jpg', 1.2], ['darbarC', 'img/ramdarbar.jpg', 1.1], ['essayC', 'img/essay_title.png', 1.3], ['rings', 'img/essay_rings.png', 1.5]])
  CARDS[k] = await photoCard(src, { w, tape: k !== 'rings' });
for (const c of Object.values(CARDS)) c.visible = false;
const ORBIT = ['ramakien', 'lacma', 'essayC'];

// ---------------------------------------------------------------- camera
const PAL = { sky: false, e: 14, az: 0.5, sun: 0.25, sunCol: '#ffd2a0', ambI: 0.16, amb: '#c89a6a', fog: 0.012, fogCol: '#2a1a10', exposure: 0.85, dof: 1 };
const DUSK = { ...PAL, sun: 0.9, sunCol: '#ff9a50', amb: '#a8704a', ambI: 0.28, exposure: 1.2 };
const MACRO = { ...PAL, dof: 0.25, exposure: 0.95 };
const DESK = { sky: false, sun: 0, ambI: 0.06, amb: '#5a3a24', fog: 0.0, exposure: 1.0, dof: 0.6 };
const SHAFT = { sky: false, sun: 0, ambI: 0.7, amb: '#4a3a6a', fog: 0.05, fogCol: '#0a0614', exposure: 1.1, dof: 0.4 };
const PAT = { sky: false, sun: 0, ambI: 0.3, amb: '#4a3a78', fog: 0.018, fogCol: '#0c0818', exposure: 1.0, dof: 1 };
const PATM = { ...PAT, dof: 0.22, fog: 0.01, exposure: 0.8 };
const at = (o, x, y, z) => V(o.x + x, o.y + y, o.z + z);
const TINY = at(TH, 0.02, 0, 0.16); const HOOK_E = at(TINY, 0.1, 0.17, 0.3), HOOK_L = at(TINY, 0, 0.12, 0);
const KEYS = [
  [0, 0, HOOK_E, HOOK_L, 34, PATM], [0.1, 7.9, at(TH, 0.55, 0.62, 1.05), at(TH, 0, 0.05, 0), 36, PATM],
  [8.0, 8.0, at(DK, 0.05, 0.62, 0.55), at(DK, -0.06, 0, 0.02), 34, DESK], [8.1, 12.9, at(DK, 0.02, 0.42, 0.34), at(DK, -0.02, 0, 0.1), 32, DESK],
  [13.0, 13.0, V(0, 1.7, 3.5), V(0, 1.9, DAIS_Z), 38, PAL], [13.1, 15.9, V(0.1, 1.85, -2.4), V(0, 2.0, DAIS_Z), 36, PAL],
  [16.0, 17.1, HAND.clone().add(V(0.25, 0.05, 1.15)), HAND.clone().add(V(0, -0.05, 0)), 30, MACRO],
  [17.2, 18.15, HAND.clone().add(V(0.45, -0.75, 1.5)), HAND.clone().add(V(0, -1.2, 0.6)), 34, MACRO],
  [18.2, 18.2, at(HP, 0.42, 0.07, 0.62), at(HP, 0, 0.02, 0), 32, MACRO], [18.3, 22.9, at(HP, 0.26, 0.14, 0.42), at(HP, 0, 0.0, 0), 30, MACRO],
  [23.0, 23.0, V(0.9, 1.25, -2.4), V(-0.3, 1.15, -6.6), 36, PAL], [23.1, 26.6, V(0.5, 1.2, -3.3), V(-0.25, 1.15, -6.6), 32, PAL],
  [26.7, 26.7, at(HB, 1.2, 0.95, 2.4), at(HB, 0, 0.72, 0), 34, PAL], [26.8, 28.0, at(HB, 0.95, 0.85, 2.0), at(HB, 0, 0.7, 0), 34, PAL], [28.1, 28.85, at(HB, 0.55, 0.14, 0.8), at(HB, 0.1, 0.04, 0), 32, MACRO],
  [28.8, 30.3, at(HP, 0.12, 0.3, 0.35), at(HP, 0, -0.1, 0), 34, MACRO],
  [30.4, 30.4, at(HP, 0, -0.4, 0.02), at(HP, 0, -3.4, 0), 70, SHAFT], [30.5, 32.9, at(HP, 0, -33, 0.02), at(HP, 0, -38, 0), 74, SHAFT],
  [33.0, 33.0, at(C, 0, 23, 0), at(C, 0, -14, -12), 60, PAT], [33.1, 34.95, at(C, 4, 2, 14), at(C, 0, -10, -12), 48, PAT],
  [35.0, 35.0, at(TH, 2.6, 2.2, 6), at(C, 0, -8, -16), 40, PAT], [35.1, 36.6, at(TH, 1.8, 1.6, 4.6), at(C, 0, -9, -14), 38, PAT], [36.7, 37.8, at(TH, 1.0, 1.1, 2.6), at(TH, 0, 0.3, -0.6), 38, PAT],
  [37.9, 37.9, at(TH, 0, 1.9, 1.3), at(TH, 0, 0, 0), 38, PATM], [38.0, 39.9, at(TH, 0.1, 1.0, 0.75), at(TH, 0, 0.02, 0), 36, PATM],
  [40.0, 40.0, at(TH, 0.2, 0.26, 0.34), at(TH, 0.02, 0.06, 0), 32, PATM], [40.1, 42.85, at(TH, 0.12, 0.22, 0.26), at(TH, 0.01, 0.07, 0), 30, PATM],
  [42.9, 42.9, at(TH, 0, 0.7, 2.4), at(TH, 0, 0.8, 0), 40, PAT], [43.0, 48.4, at(TH, 0.3, 2.6, 3.0), at(TH, 0, 6, 0), 50, PAT],
  [48.5, 50.4, at(TH, 0.35, 0.55, 1.3), at(TH, 0, 0.1, 0), 40, PAT],
  [51.0, 51.0, V(2.2, 1.0, -1.4), V(0.2, 2.1, DAIS_Z), 36, DUSK], [51.1, 56.6, V(0.6, 1.5, -4.0), V(0, 2.1, DAIS_Z), 34, DUSK],
  [56.7, 56.7, at(TH, 5, 3, 5), at(TH, 0, 7, 0), 44, PAT], [56.8, 60.0, at(TH, -3.6, 10, 4.2), at(TH, 0, 12, 0), 46, PAT],
  [60.1, 63.15, HOOK_E, HOOK_L, 34, PATM],
];
const S = (w) => w;                                    // readability marker for word-synced times
const F = film({ total, keys: KEYS, exposure: 1.0, hits: [[18.98, 0.01], [20.36, 0.015], [22.0, 0.02], [32.94, 0.03], [36.8, 0.01], [50.18, 0.015]],
  titles: [[-1, 3.25, '1 खोई… मिलीं हज़ारों!', 100, '#ffd24a', 300, 'हनुमान और राम की अंगूठियाँ'],
    [32.95, 34.9, 'पाताल लोक', 120, '#b8a8ff', 300, 'भूतों के राजा का लोक'], [38.8, 39.9, 'हज़ारों अंगूठियाँ', 104, '#ffd24a', 300],
    [57.6, 60.0, 'जितने राम… उतनी रामायण', 92, '#ffd24a', 300], [60.4, 62.55, 'रामकथा कभी ख़त्म नहीं होती', 76, '#ffffff', 300],
    [62.6, 999, '1 खोई… मिलीं हज़ारों!', 100, '#ffd24a', 300, 'हनुमान और राम की अंगूठियाँ']],
  pills: [[8.2, 12.9, 'लोककथा • ए.के. रामानुजन, "Three Hundred Rāmāyaṇas"', 1300, '#f3e3c0'], [13.2, 15.8, 'अयोध्या • राजा राम का दरबार', 300, '#ffd24a'],
    [45.0, 48.4, 'हर अंगूठी = राम का एक अवतार', 300, '#ffd24a'], [51.2, 56.6, 'उसी वक़्त • अयोध्या', 300, '#ffd9a0'],
    [58.3, 60.0, 'थाई • बाली • तमिल • बांग्ला • कश्मीरी • तिब्बती…', 1300, '#f3e3c0']],
  overlay: (g, t, { txt }) => {
    if (t > 40.95 && t < 42.9) txt('सब एक जैसी… सब राम की', 540, 330, 82, '#ffffff', seg(t, 40.95, 41.25), 1, 12);
  } });
const { on, onCam } = F;

// ---------------------------------------------------------------- animation
on((t) => {
  // flames flicker (deterministic)
  for (const { f, L, s, k } of flames) { const fl = 0.85 + 0.15 * Math.sin(t * 17 + s) * Math.sin(t * 11.3 + s * 2); f.scale.set(1, 2.2 * fl, 1); L.intensity = 0.35 * k * fl; }
  for (const { f, L, s } of torches) { const fl = 0.8 + 0.2 * Math.sin(t * 13 + s) * Math.sin(t * 7.7 + s); f.scale.set(1, 1.8 * fl, 1); L.intensity = 22 * fl; }
  const inPal = (t >= 13 && t < 30.4) || (t >= 51 && t < 56.7);
  palKey.intensity = inPal ? (t >= 51 ? 5 : 7) : 0; deskKey.intensity = t >= 8 && t < 13 ? 2.5 : 0;
  thaliKey.intensity = (t < 8 || (t >= 35 && t < 51) || t >= 56.7) ? (t >= 35 && t < 37.9 ? 4 : 1.3) : 0;
  skyWin.color.copy(t >= 51 ? HDR(0.75, 0.3, 0.12) : HDR(0.6, 0.36, 0.18));
  rays.material.opacity = t >= 51 ? 0.02 + 0.06 * smooth(seg(t, 54.9, 56.2)) : 0;

  // the hero ring: on Rama's finger -> slips -> dais -> floor -> rolls -> into the hole
  let rp = HAND.clone().add(V(0.0, -0.01, 0.05)), rq = new THREE.Euler(0, 0.3, 0), vis = t >= 13 && t < 22.1;
  if (t >= 17.22) { const k = seg(t, 17.22, 17.95); rp = HAND.clone().add(V(0.05 * k, -(HAND.y - DAIS_Y - 0.4 - RS) * easeIn(k) - 0.0, 0.25 * k)); rq = new THREE.Euler(k * 4, 0.3, k * 2.5); }
  if (t >= 17.95) { const k = seg(t, 17.95, 18.98), from = V(HAND.x + 0.05, DAIS_Y + 0.4 + RS, HAND.z + 0.25), to = V(HP.x - 0.05, RS * 0.3, HP.z + 0.04);
    rp = from.clone().lerp(to, k); rp.y = lerp(from.y, to.y, k) + 0.35 * Math.sin(k * Math.PI) * (1 - k * 0.3); rq = new THREE.Euler(4 + k * 6, 0.3 + k, 2.5 + k * 3); }
  if (t >= 18.98) { const k = seg(t, 18.98, 19.7), b = Math.abs(Math.sin(k * Math.PI * 2.5)) * 0.03 * (1 - k); rp = V(HP.x - 0.05 + 0.05 * easeOut(k), RS * 0.3 + b, HP.z + 0.04 - 0.04 * easeOut(k));
    rq = new THREE.Euler(Math.PI / 2 - 0.2 * (1 - k) * Math.sin(k * 20), 0.3 + k * 2, 0); }
  if (t >= 19.7) { const w = seg(t, 19.7, 21.2); rp = V(HP.x, RS * 0.3, HP.z); rq = new THREE.Euler(Math.PI / 2 - 0.08 * Math.sin(t * 9) * (1 - w), 2.3 + w * 3, 0); }
  if (t >= 21.26) { const k = seg(t, 21.26, 22.0); rp = V(HP.x, RS * 0.3 - 0.5 * easeIn(k), HP.z); rq = new THREE.Euler(Math.PI / 2 + k * 2, 5.3, k); }
  hero.visible = vis; hero.position.copy(rp); hero.rotation.copy(rq);
  hero.scale.setScalar(t < 17.22 ? 1.7 : t < 17.95 ? lerp(1.7, 1, seg(t, 17.22, 17.95)) : 1);

  // crack, lid, shards, hole glow
  crackU.prog.value = smooth(seg(t, 19.76, 20.6)) * 0.9; crackU.glow.value = (t >= 19.7 && t < 30.4) ? 0.6 + 0.4 * smooth(seg(t, 19.76, 20.4)) : 0;
  const broken = t >= 20.36 && t < 30.6; lid.visible = !broken || t >= 30.6;
  shards.forEach((s, i) => { s.visible = broken && t < 21.4; const k = seg(t, 20.36, 21.3), c = s.userData.c; s.position.set(c.x, -2.2 * easeIn(k), c.z); s.rotation.set(k * (2 + hash(i)), 0, k * (hash(i + 3) - 0.5) * 4); });
  holeGlow.intensity = broken ? 1.2 + 0.5 * Math.sin(t * 3) : 0;

  // darbar (Ram Panchayatan) visible in the palace; Hanuman solo cut-out for the "tiny form" beat
  ramT.visible = inPal; ramT.userData.set((t > 24.3 && t < 26.4 && Math.sin(t * 15) > -0.2) ? 1 : 0);
  const hk = seg(t, 27.88, 28.62), hScale = lerp(1, 0.04, easeInOut(hk)), hop = seg(t, 29.3, 29.9);
  hanu.visible = t >= 13 && t < 30.0;
  hanu.position.copy(HB).lerp(HP, easeInOut(hop)); hanu.position.y = Math.sin(hop * Math.PI) * 0.1 - 0.25 * easeIn(seg(t, 29.65, 29.95));
  hanu.scale.setScalar(Math.max(0.0001, hScale)); hanu.rotation.y = 0.25;
  // tiny Hanuman: on the ring heap (hook + ending), falling down the shaft, on the thali in Patala
  const tinyOnHeap = t < 7.95 || t >= 61.4, tinyFall = t >= 30.4 && t < 32.95;
  tinyLook.visible = tinyOnHeap; tinyFly.visible = tinyFall; const tinyH = tinyFall ? tinyFly : tinyLook;
  if (tinyOnHeap) { tinyLook.position.copy(TINY).add(V(0, mound(0.16) * 0.8 + 0.006, 0)); tinyLook.scale.setScalar(0.09); tinyLook.rotation.set(0, 0.35 + 0.05 * Math.sin(t), 0); }
  if (tinyFall) { const ey = t < 30.5 ? -0.4 : lerp(-0.4, -33, easeInOut(seg(t, 30.5, 32.9))); tinyFly.position.set(HP.x + 0.05 * Math.sin(t * 2), ey - 0.75, HP.z + 0.05); tinyFly.scale.setScalar(0.22); tinyFly.rotation.set(-Math.PI / 2 + 0.15 * Math.sin(t * 3), 0.15 * Math.sin(t * 2), 0.6 * Math.sin(t * 1.4)); }
  // aura + glow on Hanuman in the shrink / fall / hook
  const aOn = (t >= 27.6 && t < 32.95) || tinyOnHeap;
  aura.visible = aOn; aura.material.color.copy(HDR(1.2, 0.8, 0.35)); hanuLight.intensity = aOn ? (tinyOnHeap ? 0.05 : tinyFall ? 2.5 : 0.4) : 0; hanuLight.distance = tinyFall ? 8 : 2;
  if (t >= 27.6 && t < 30.0) { const p = hanu.position.clone().add(V(0, 0.9 * hScale, 0)); aura.position.copy(p); aura.scale.setScalar(lerp(2.2, 0.25, hk) * (1 + 0.1 * Math.sin(t * 8))); hanuLight.position.copy(p); }
  if (tinyFall) { aura.position.copy(tinyH.position).add(V(0, 0.0, 0)); hanuLight.position.copy(tinyH.position).add(V(0, 0.4, 0)); aura.scale.setScalar(0.3); aura.material.color.copy(HDR(0.35, 0.22, 0.1)); aura.position.y -= 0.06; }
  if (tinyOnHeap) { aura.position.copy(tinyH.position).add(V(0, 0.04, -0.01)); aura.scale.setScalar(0.16); hanuLight.position.copy(aura.position).add(V(0, 0.05, 0.05)); }

  // sparks (shrink spiral) and dust (crack)
  for (let i = 0; i < sparks.n; i++) { let x = 0, y = -999, z = 0;
    if (t >= 27.6 && t < 29.4) { const k = (t - 27.6 + hash(i) * 1.8) % 1.8 / 1.8, a = hash(i * 3) * TAU + k * 8, r = lerp(0.6, 0.05, hk) * (1 - k * 0.4);
      x = HB.x + Math.cos(a) * r; z = HB.z + Math.sin(a) * r; y = lerp(1.8, 0.05, hk) * k; }
    if (t >= 49.2 && t < 50.9) { const k = seg(t, 50.18, 50.9), a = hash(i * 7) * TAU, r = 0.6 * k * hash(i + 1); x = TH.x + Math.cos(a) * r; z = TH.z + Math.sin(a) * r; y = TH.y + 0.1 + 0.4 * k * hash(i + 5) - 0.6 * k * k; if (t < 50.18) y = -999; }
    sparks.pos[i * 3] = x; sparks.pos[i * 3 + 1] = y; sparks.pos[i * 3 + 2] = z; }
  sparks.geo.attributes.position.needsUpdate = true;
  for (let i = 0; i < dust.n; i++) { let y = -999, x = 0, z = 0;
    const burst = (t0) => { const k = seg(t, t0, t0 + 1.6), a = hash(i * 1.3) * TAU, r = HOLE_R + 0.35 * easeOut(k) * hash(i + 7); x = HP.x + Math.cos(a) * r; z = HP.z + Math.sin(a) * r; y = 0.01 + 0.18 * hash(i + 3) * Math.sin(k * Math.PI) ; };
    if (t >= 20.36 && t < 22.0) burst(20.36); if (t >= 22.0 && t < 23.0) burst(21.4);
    dust.pos[i * 3] = x; dust.pos[i * 3 + 1] = y; dust.pos[i * 3 + 2] = z; }
  dust.geo.attributes.position.needsUpdate = true;
  // spirit motes rising in shaft and cavern
  for (let i = 0; i < motes.n; i++) { const k = (hash(i) + t * 0.08 * (0.5 + hash(i + 2))) % 1, a = hash(i * 5) * TAU;
    let x, y, z; if (i < 160) { const r = 0.3 + 1.6 * hash(i + 9) * (1 - k); x = HP.x + Math.cos(a) * r; z = HP.z + Math.sin(a) * r; y = SHAFT_BOTTOM + 36 * k; }
    else { const r = 2 + 24 * hash(i + 9); x = C.x + Math.cos(a) * r; z = C.z + Math.sin(a) * r; y = PY + 0.5 + 18 * k; }
    motes.pos[i * 3] = x; motes.pos[i * 3 + 1] = y; motes.pos[i * 3 + 2] = z; }
  motes.geo.attributes.position.needsUpdate = true;

  // the King: eyes open at "राजा", the thali slides in at "थाल मँगवाया"
  const eo = smooth(seg(t, 35.86, 36.15)) * (1 - 0.95 * smooth(seg(t, 56.6, 57.2))) * (t < 63 ? 1 : 0);
  const blink = 1 - 0.9 * Math.max(0, Math.sin((t - 44) * 2.1) > 0.995 ? 1 : 0);
  eyes.forEach((e) => e.scale.set(1.6, Math.max(0.0001, eo * blink), 1)); rim.intensity = t >= 35 && t < 51 ? 220 : 90;
  const slide = easeOut(seg(t, 36.8, 37.5)), ts = (t >= 35 && t < 36.8) ? 0 : 1;
  thali.position.set(TH.x, TH.y, TH.z - 3.5 * (1 - (t >= 36.8 && t < 37.5 ? slide : ts)));
  rings(t);
  const off = thali.position.z - TH.z; if (Math.abs(off) > 0.0001) { for (let i = 0; i < N; i++) { ringsM.getMatrixAt(i, _m); _m.elements[14] += off; ringsM.setMatrixAt(i, _m); platesM.setMatrixAt(i, _m); } }
  ringsM.visible = platesM.visible = t < 13 ? t < 8 : t >= 33;
  // one ring falls into the heap at "उसकी अंगूठी यहाँ गिरती है"
  spiralL.forEach((L, j) => { L.intensity = (t >= 43.3 && t < 60.5) ? 5 * smooth(seg(t, 43.5 + j * 0.6, 45 + j * 0.6)) * (1 - seg(t, 59.4, 60.4)) : 0; });
  ringGlow.position.copy(at(TH, 0, 3, 0)); ringGlow.intensity = (t >= 43.3 && t < 60.5) ? 1.5 * smooth(seg(t, 44, 46)) * (1 - seg(t, 59.5, 60.5)) : 0;
  if (t >= 48.9 && t < 50.9) { hero.visible = true; const k = seg(t, 48.9, 50.18); hero.position.copy(at(TH, 0.05, 0.12 + 6 * (1 - easeIn(k)), 0.02)); hero.rotation.set(Math.PI / 2 + t * 3, t, 0); if (t >= 50.18) { hero.position.copy(at(TH, 0.05, 0.12, 0.02)); hero.rotation.set(Math.PI / 2 - 0.3, 1, 0); } }
});

// paper cards in front of the lens (real sources) and orbiting cards
const fw = V(0, 0, 0);
const FRONT = [[CARDS.rings, 41.6, 45.2, 0, -0.05, 0.98, -0.02]];
onCam((t, cam) => {
  const shown = new Set();
  for (const [c, a, b, dx, dy, s, rz] of FRONT) { if (t < a || t > b) continue; shown.add(c);
    const k = backOut(seg(t, a, a + 0.4), 1.8), out = smooth(seg(t, b - 0.3, b)); cam.getWorldDirection(fw); const d = 2.2;
    c.position.copy(cam.position).addScaledVector(fw, d); c.quaternion.copy(cam.quaternion); c.translateX(dx * d * 0.4); c.translateY(dy * d * 0.4 + (1 - k) * -1.2 + out * -1.6); c.rotateZ(rz + 0.04 * Math.sin(t * 1.3));
    c.scale.setScalar(Math.max(0.001, s * 0.72 * k)); c.visible = true; }
  if (t >= 56.5 && t < 60.2) ORBIT.forEach((key, i) => { const c = CARDS[key]; shown.add(c); const a = i / ORBIT.length * TAU + t * 0.35, k = backOut(seg(t, 56.8 + i * 0.15, 57.3 + i * 0.15), 1.6);
    c.position.set(TH.x + Math.cos(a) * 4.2, TH.y + 10 + 2.2 * Math.sin(a * 2 + i), TH.z + Math.sin(a) * 4.2); c.lookAt(cam.position); c.scale.setScalar(Math.max(0.001, k * 1.25)); c.visible = true; });
  for (const c of Object.values(CARDS)) if (!shown.has(c)) c.visible = false;
});
