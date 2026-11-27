// कवच: ट्रेन की टक्कर कैसे रुकती है? — KAISECHALTAHAI3D #4. 1 unit = 1 m. Track along x, broad gauge 1.676 m.
import { THREE, V, TAU, W, H, film, scene, renderer, sun, mat, add, group, rod, particles, terrain, fbm, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 52.4;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const GAUGE = 1.676, XMIN = -1500, XMAX = 1500;

// ================================================================ land, track, OHE
// ---- Indian fields: plots of wheat / tall grass / mustard / ploughed earth, earthen bunds (mendh) between them
const PLOT_W = 70, PLOT_D = 34;
const plotOf = (x, z) => { const side = z < 0 ? -1 : 1, az = Math.abs(z) - 6.5; if (az < 0 || az > 170) return null; const i = Math.floor((x + 5000) / PLOT_W), j = Math.floor(az / PLOT_D);
  const h = hash(i * 7.31 + j * 13.7 + side * 3.1), type = h < 0.34 ? 'wheat' : h < 0.58 ? 'grass' : h < 0.82 ? 'mustard' : 'earth'; const lx = (x + 5000) - i * PLOT_W, lz = az - j * PLOT_D;
  return { type, bund: lx < 1.2 || lz < 1.2, i, j, side }; };
const GROUND = { wheat: [0.36, 0.44, 0.18], grass: [0.24, 0.42, 0.14], mustard: [0.3, 0.44, 0.14], earth: [0.42, 0.3, 0.2] };
terrain((x, z) => { const az = Math.abs(z); if (az < 200) return -0.6 + (az < 8 ? 0 : 0.04 * Math.sin(x * 0.7) * (plotOf(x, z) && plotOf(x, z).type === 'earth' ? 1 : 0)); return -0.6 + (fbm(x * 0.003, z * 0.003, 4) - 0.35) * 10 * smooth(clamp((az - 220) / 300)); },
  (x, z) => { if (Math.abs(z) < 6.5) return [0.42, 0.38, 0.33]; const p = plotOf(x, z); if (!p) return [0.36, 0.46, 0.22]; if (p.bund) return [0.48, 0.36, 0.24];
    const c = GROUND[p.type], n = 0.04 * (fbm(x * 0.05, z * 0.05, 2) - 0.5); return [c[0] + n, c[1] + n, c[2] + n]; }, { size: 3600, seg: 420, warp: 0.6 });
// crop clumps (instanced, sway in the wind)
const windU = { value: 0 };
function bladeClump(n, hgt) { const pos = [], col = []; for (let b = 0; b < n; b++) { const a = b / n * TAU + hash(b * 3.3), lean = 0.25 + 0.2 * hash(b), h = hgt * (0.75 + 0.5 * hash(b * 7)), w = 0.05;
    const bx = Math.cos(a) * 0.08, bz = Math.sin(a) * 0.08, tx = bx + Math.cos(a) * lean * h * 0.5, tz = bz + Math.sin(a) * lean * h * 0.5;
    pos.push(bx - w * Math.sin(a), 0, bz + w * Math.cos(a), bx + w * Math.sin(a), 0, bz - w * Math.cos(a), tx, h, tz); col.push(0.55, 0.55, 0.55, 0.55, 0.55, 0.55, 1.15, 1.15, 1.15); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g; }
const swayMat = (opts) => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85, ...opts });
  m.onBeforeCompile = (sh) => { sh.uniforms.uTime = windU; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vec4 ip = instanceMatrix[3]; transformed.x += sin(uTime * 1.7 + ip.x * 0.13 + ip.z * 0.09) * 0.13 * position.y; transformed.z += cos(uTime * 1.3 + ip.x * 0.07) * 0.06 * position.y;'); }; return m; };
const CROPS = { wheat: { g: bladeClump(9, 1.05), c: new THREE.Color(0.78, 0.74, 0.34) }, grass: { g: bladeClump(7, 1.6), c: new THREE.Color(0.34, 0.62, 0.22) }, mustard: { g: bladeClump(6, 1.15), c: new THREE.Color(0.36, 0.58, 0.2) } };
const cropPos = { wheat: [], grass: [], mustard: [] };
for (let k = 0; k < 52000; k++) { const x = -720 + 1440 * hash(k * 1.37 + 0.11), side = hash(k * 2.71) < 0.5 ? -1 : 1, z = side * (7 + 108 * Math.pow(hash(k * 3.91 + 0.7), 1.25)); const p = plotOf(x, z); if (!p || p.bund || p.type === 'earth') continue; cropPos[p.type].push([x, z, k]); }
const mustardTops = [];
for (const [type, list] of Object.entries(cropPos)) { const im = new THREE.InstancedMesh(CROPS[type].g, swayMat({ color: CROPS[type].c }), list.length), m = new THREE.Matrix4(), q = new THREE.Quaternion();
  list.forEach(([x, z, k], i) => { const sc = 0.8 + 0.5 * hash(k * 5.1); q.setFromAxisAngle(V(0, 1, 0), hash(k * 6.7) * TAU); m.compose(V(x, -0.6, z), q, V(sc, sc, sc)); im.setMatrixAt(i, m); if (type === 'mustard') mustardTops.push([x, z, sc]); });
  im.frustumCulled = false; scene.add(im); }
{ const g = new THREE.IcosahedronGeometry(0.11, 0), im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: 0xffd21a, emissive: 0x5a4000, emissiveIntensity: 0.35, roughness: 0.6 }), mustardTops.length * 2), m = new THREE.Matrix4();
  mustardTops.forEach(([x, z, sc], i) => { for (let r = 0; r < 2; r++) { m.makeTranslation(x + (hash(i * 3 + r) - 0.5) * 0.4, -0.6 + 1.05 * sc + 0.1 * r, z + (hash(i * 7 + r) - 0.5) * 0.4); im.setMatrixAt(i * 2 + r, m); } }); im.frustumCulled = false; scene.add(im); }
// desi cows (zebu: hump, dewlap, curved horns) grazing in the fields
const COWS = [];
function cow(colHex, x, z, yaw) {
  const g = new THREE.Group(), cm = mat(colHex, 0.75), dk = mat(0x2a2420, 0.7); g.position.set(x, -0.6, z); g.rotation.y = yaw; g.scale.setScalar(1.1); scene.add(g);
  const body = add(new THREE.CapsuleGeometry(0.5, 1.3, 6, 16).rotateZ(Math.PI / 2), cm, 0, 1.25, 0, g); body.scale.set(1, 1, 0.82);
  add(new THREE.SphereGeometry(0.3, 14, 10), cm, 0.55, 1.75, 0, g);                                   // hump
  const neck = new THREE.Group(); neck.position.set(0.95, 1.45, 0); g.add(neck);
  add(new THREE.CapsuleGeometry(0.22, 0.5, 4, 10).rotateZ(-0.9), cm, 0.25, -0.15, 0, neck);
  const head = new THREE.Group(); head.position.set(0.55, -0.42, 0); neck.add(head);
  add(new THREE.CapsuleGeometry(0.17, 0.42, 4, 10).rotateZ(Math.PI / 2 - 0.6), cm, 0.12, -0.08, 0, head); add(new THREE.SphereGeometry(0.13, 10, 8), mat(0x3a2a24, 0.6), 0.36, -0.28, 0, head);
  for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.035, 0.32, 8).rotateX(s * 0.7), mat(0xd8cfc0, 0.5), -0.05, 0.12, s * 0.14, head); add(new THREE.SphereGeometry(0.07, 8, 6), cm, -0.06, -0.02, s * 0.2, head).scale.set(0.6, 0.4, 1.4); }
  add(new THREE.BoxGeometry(0.5, 0.35, 0.08), cm, 0.75, 0.95, 0, g);                                      // dewlap
  for (const [lx, lz] of [[0.6, 0.25], [0.6, -0.25], [-0.6, 0.25], [-0.6, -0.25]]) { add(new THREE.CylinderGeometry(0.08, 0.06, 0.95, 8), cm, lx, 0.5, lz, g); add(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 8), dk, lx, 0.04, lz, g); }
  const tail = new THREE.Group(); tail.position.set(-1.1, 1.45, 0); g.add(tail); add(new THREE.CylinderGeometry(0.025, 0.02, 0.9, 6), cm, 0, -0.45, 0, tail); add(new THREE.SphereGeometry(0.07, 8, 6), dk, 0, -0.92, 0, tail);
  COWS.push({ g, neck, tail, ph: hash(x + z) * 6 }); return g;
}
for (const [c, x, z, yaw] of [[0xf3efe6, -120, 14, 0.4], [0xc9a27a, -96, -16, 2.6], [0xe9e4da, -62, 20, -0.9], [0xf3efe6, -30, -13, 1.8], [0xb9845a, 20, 15, 3.0], [0xf3efe6, 60, -18, 0.2],
  [0xe9e4da, 150, 12, -1.2], [0xc9a27a, 215, -14, 2.2], [0xf3efe6, 245, 16, 0.9], [0xe9e4da, 300, -20, -2.4], [0xf3efe6, -190, 18, 1.4], [0xc9a27a, -230, -15, -0.6], [0xf3efe6, -160, -24, 2.9], [0xe9e4da, 110, 26, 0.6],
  [0xf3efe6, -136, 10.5, 0.64], [0xc9a27a, -72, 12, 0.8], [0xf3efe6, -42, -11, -2.0], [0xe9e4da, 86, 13, 2.7], [0xf3efe6, 98, 18.5, -0.4], [0xc9a27a, 214, 12.5, 1.1], [0xf3efe6, -118, 25, 2.0], [0xe9e4da, -101, 23, -0.7]]) cow(c, x, z, yaw);
add(new THREE.BoxGeometry(XMAX - XMIN, 0.5, 4.2), mat(0x6f6a64, 0.95), 0, -0.25, 0, scene, false).receiveShadow = true;
const sleeperG = new THREE.BoxGeometry(0.25, 0.16, 2.8), NS = Math.floor((XMAX - XMIN) / 0.65);
const sleepers = new THREE.InstancedMesh(sleeperG, mat(0x8a8580, 0.9), NS); { const m = new THREE.Matrix4(); for (let i = 0; i < NS; i++) { m.makeTranslation(XMIN + i * 0.65, 0.05, 0); sleepers.setMatrixAt(i, m); } } sleepers.receiveShadow = true; scene.add(sleepers);
const railM = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.9, roughness: 0.3, envMap: ENV, envMapIntensity: 0.6 });
for (const s of [-1, 1]) add(new THREE.BoxGeometry(XMAX - XMIN, 0.16, 0.08), railM, 0, 0.21, s * GAUGE / 2, scene, false);
for (let x = XMIN; x <= XMAX; x += 60) { rod(V(x, 0, -3.4), V(x, 7.2, -3.4), 0.13, mat(0x7a7f86, 0.6, 0.4)); rod(V(x, 6.8, -3.4), V(x, 6.6, 0.3), 0.05, mat(0x7a7f86, 0.6, 0.4)); }
add(new THREE.BoxGeometry(XMAX - XMIN, 0.03, 0.03), mat(0x5a4a3a, 0.5, 0.8), 0, 5.6, 0, scene, false); add(new THREE.BoxGeometry(XMAX - XMIN, 0.03, 0.03), mat(0x5a4a3a, 0.5, 0.8), 0, 6.6, 0, scene, false);
for (let i = 0; i < 40; i++) { const x = (hash(i) - 0.5) * 2600, z = (hash(i * 3) < 0.5 ? -1 : 1) * (60 + 140 * hash(i * 7)), y = -0.6; const tr = group(x, y, z);
  add(new THREE.CylinderGeometry(0.3, 0.45, 3.2, 8), mat(0x5a3a22, 0.9), 0, 1.6, 0, tr); for (const [dx, dy, r] of [[0, 4.6, 2.8], [-1.6, 3.9, 2.0], [1.7, 4.0, 2.1]]) add(new THREE.SphereGeometry(r + hash(i * 9), 12, 10), mat(0x2f5a22, 0.9), dx, dy, 0, tr); }
// RFID tags between the rails (every 40 m here, real spacing is larger)
const TAGS = []; for (let x = XMIN + 20; x < XMAX; x += 40) TAGS.push(x);
const tagM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.1, 0.3), new THREE.MeshStandardMaterial({ color: 0xf2c21a, roughness: 0.5, emissive: 0x3a2a00, emissiveIntensity: 0.4 }), TAGS.length);
{ const m = new THREE.Matrix4(); TAGS.forEach((x, i) => { m.makeTranslation(x, 0.16, 0); tagM.setMatrixAt(i, m); }); } scene.add(tagM);
const tagGlow = TAGS.map((x) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: HDR(2.6, 2.0, 0.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.position.set(x, 0.4, 0); s.scale.setScalar(0.001); scene.add(s); return s; });
// tower + station TCAS hut + signal
const TW = V(120, 0, -26);
{ const leg = mat(0x9aa0a8, 0.5, 0.6); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) rod(V(TW.x + dx, 0, TW.z + dz), V(TW.x + dx * 0.2, 34, TW.z + dz * 0.2), 0.12, leg);
  for (let y = 3; y < 33; y += 3) { const k = 1 - y / 40; for (const [a, b] of [[[-2, -2], [2, 2]], [[2, -2], [-2, 2]]]) rod(V(TW.x + a[0] * k, y, TW.z + a[1] * k), V(TW.x + b[0] * k, y + 3, TW.z + b[1] * k), 0.05, leg); }
  for (const dx of [-0.8, 0.8]) add(new THREE.BoxGeometry(0.3, 2.2, 0.5), mat(0xe8e8e8, 0.5), TW.x + dx, 34.5, TW.z, scene, false);
  add(new THREE.BoxGeometry(6, 3.2, 4), mat(0xd8a05a, 0.8), TW.x + 10, 1.6, TW.z + 2); add(new THREE.BoxGeometry(6.6, 0.4, 4.6), mat(0xb03a2a, 0.7), TW.x + 10, 3.4, TW.z + 2); }
const SIG = V(260, 0, -2.8);
const sigPost = group(SIG.x, 0, SIG.z); add(new THREE.CylinderGeometry(0.12, 0.15, 5, 10), mat(0x30343a, 0.6), 0, 2.5, 0, sigPost); add(new THREE.BoxGeometry(0.6, 1.9, 0.45), mat(0x15171a, 0.6), 0, 5.6, 0, sigPost);
const lamps = [[HDR(4, 0.3, 0.2), 6.2], [HDR(4, 3, 0.3), 5.6], [HDR(0.3, 4, 0.8), 5.0]].map(([c, y]) => { const m = add(new THREE.SphereGeometry(0.17, 14, 10), new THREE.MeshBasicMaterial({ color: c }), 0.25, y, 0, sigPost, false); m.userData.c = c; return m; });
const sigGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: HDR(3, 0.3, 0.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sigGlow.scale.setScalar(2.2); scene.add(sigGlow);

// ================================================================ locomotives + coaches
const livery = (() => { const c = cv(1024, 256), g = c.getContext('2d'); g.fillStyle = '#b8202a'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#f1e6c8'; g.fillRect(0, 150, 1024, 40); g.fillStyle = '#1a1a1a'; g.fillRect(0, 230, 1024, 26);
  g.fillStyle = '#f2c21a'; for (let x = 0; x < 1024; x += 64) g.fillRect(x, 232, 32, 22); return tex(c); })();
const coachTex = (() => { const c = cv(1024, 256), g = c.getContext('2d'); g.fillStyle = '#1f3a7a'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#e8dcc0'; g.fillRect(0, 60, 1024, 10);
  g.fillStyle = '#0d1420'; for (let x = 40; x < 1000; x += 58) g.fillRect(x, 80, 38, 60); g.fillStyle = '#2a2a2a'; g.fillRect(0, 230, 1024, 26); return tex(c); })();
function loco() {
  const g = new THREE.Group(); const bodyM = new THREE.MeshStandardMaterial({ map: livery, roughness: 0.45, metalness: 0.2, envMap: ENV, envMapIntensity: 0.4 });
  add(new THREE.BoxGeometry(15.5, 2.9, 3.1), bodyM, 0, 2.95, 0, g); add(new THREE.BoxGeometry(15.5, 0.25, 3.0), mat(0x6a6e74, 0.6, 0.4), 0, 4.5, 0, g);
  for (const s of [-1, 1]) { const nose = add(new THREE.BoxGeometry(1.6, 2.9, 3.1), bodyM, s * 8.55, 2.95, 0, g); nose.scale.set(1, 1, 1);
    add(new THREE.BoxGeometry(0.1, 1.1, 2.6), new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.05, metalness: 0.3, envMap: ENV, envMapIntensity: 1.2 }), s * 9.36, 3.55, 0, g, false);
    for (const z of [-1.0, 1.0]) add(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 14).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: HDR(6, 5.6, 4.6) }), s * 9.4, 2.2, z, g, false);
    add(new THREE.BoxGeometry(0.5, 0.5, 2.9), mat(0x2a2a2a, 0.7), s * 9.55, 1.35, 0, g); }
  for (const bx of [-4.8, 4.8]) { add(new THREE.BoxGeometry(4.2, 0.7, 2.4), mat(0x2b2d31, 0.7), bx, 0.95, 0, g); for (const ax of [-1.5, 0, 1.5]) for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 20).rotateX(Math.PI / 2), mat(0x3a3c40, 0.5, 0.7), bx + ax, 0.62, s * GAUGE / 2, g); }
  const pan = group(-3, 4.65, 0, g); rod(V(-1, 0, 0), V(0, 1.0, 0), 0.05, mat(0x8a8e94, 0.5, 0.6), pan); rod(V(1, 0, 0), V(0, 1.0, 0), 0.05, mat(0x8a8e94, 0.5, 0.6), pan); add(new THREE.BoxGeometry(0.2, 0.08, 1.8), mat(0x8a8e94, 0.5, 0.6), 0, 1.02, 0, pan);
  for (const x of [5.5, 6.2]) rod(V(x, 4.62, 0.9), V(x, 5.4, 0.9), 0.03, mat(0xdddddd, 0.5));
  const reader = add(new THREE.BoxGeometry(0.6, 0.18, 0.5), mat(0x222428, 0.5), 7.6, 0.32, 0, g, false);
  const rLed = add(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: HDR(0.3, 2, 3) }), 7.6, 0.2, 0.3, g, false);
  const head = new THREE.SpotLight(0xfff4e0, 0, 160, 0.35, 0.5, 1.2); head.position.set(9.6, 2.4, 0); head.target.position.set(60, 0, 0); g.add(head, head.target);
  scene.add(g); return { g, reader, rLed, head };
}
function coach() { const g = new THREE.Group(); add(new THREE.BoxGeometry(22, 3.0, 3.1), new THREE.MeshStandardMaterial({ map: coachTex, roughness: 0.5, metalness: 0.2, envMap: ENV, envMapIntensity: 0.3 }), 0, 2.9, 0, g);
  add(new THREE.CylinderGeometry(1.6, 1.6, 22, 20, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), mat(0x8a8e96, 0.6), 0, 4.35, 0, g).scale.set(1, 0.3, 1);
  for (const bx of [-8, 8]) for (const ax of [-1.2, 1.2]) for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 18).rotateX(Math.PI / 2), mat(0x3a3c40, 0.5, 0.7), bx + ax, 0.55, s * GAUGE / 2, g); scene.add(g); return g; }
function train() { const L = loco(), C = [coach(), coach()], grp = new THREE.Group(); scene.add(grp); grp.add(L.g); C.forEach((c, i) => { c.position.x = -9.8 - 11.5 - i * 22.6; grp.add(c); }); return { grp, L, C }; }
const A = train(), B = train();
const beam = add(new THREE.CylinderGeometry(0.05, 0.35, 0.3, 16), new THREE.MeshBasicMaterial({ color: HDR(0.5, 2.5, 3.5), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.2, 0, scene, false);
const sparks = particles(400, HDR(3, 2, 0.6), 0.18); sparks.p.material.map = dotTex; sparks.p.material.transparent = true;
// kavach shield (hex grid bubble) + radio waves
const hexTex = (() => { const c = cv(512, 512), g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 4; const r = 30;
  for (let y = -r; y < 560; y += r * 1.5) for (let x = -r; x < 560; x += r * Math.sqrt(3)) { const ox = (Math.round(y / (r * 1.5)) % 2) * r * Math.sqrt(3) / 2; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; g.lineTo(x + ox + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2); return t; })();
const shield = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, TAU, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: hexTex, color: HDR(0.5, 1.6, 2.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
shield.scale.set(14, 7, 5); scene.add(shield);
const waves = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 48), new THREE.MeshBasicMaterial({ color: HDR(0.6, 1.6, 2.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(m); return m; });
const gapLine = new THREE.Group(); scene.add(gapLine);
const gapBar = add(new THREE.BoxGeometry(1, 0.25, 0.25), new THREE.MeshBasicMaterial({ color: HDR(2.6, 2.2, 0.4) }), 0, 0, 0, gapLine, false);

// ================================================================ choreography
// returns the front x of train A (moving +x) and train B (moving -x, mirrored) and their speeds (m/s)
function stops(x0, v, tStart, tBrake, tStop, t) { // constant speed then uniform braking to rest
  if (t < tBrake) return x0 + v * (t - tStart); const xb = x0 + v * (tBrake - tStart), d = Math.min(t, tStop) - tBrake, T = tStop - tBrake; return xb + v * d - 0.5 * (v / T) * d * d; }
function scene_(t) {
  // default: both off-stage
  let a = { x: -9999, on: false, v: 0 }, b = { x: 9999, on: false, v: 0 };
  if (t < 9.62) { a = { x: stops(-150, 22, 0, 3.3, 5.0, t), on: true }; b = { x: -stops(-150, 22, 0, 3.3, 5.0, t) + 40, on: true }; a.v = t < 5 ? 1 : 0; }
  else if (t < 24.6) { a = { x: -80 + 20 * (t - 9.62), on: true, v: 1 }; }
  else if (t < 34.0) { a = { x: stops(SIG.x - 260, 26, 24.64, 32.5, 34.6, t), on: true, v: t < 34.0 ? 1 : 0 }; }
  else if (t < 41.42) { a = { x: stops(-260, 24, 34.02, 38.6, 40.7, t), on: true }; b = { x: -stops(-260, 24, 34.02, 38.6, 40.7, t) + 520 - 380 + 0, on: true }; }
  else if (t < 47.9) { a = { x: -190, on: true }; b = { x: 190, on: true }; }
  else { a = { x: -200 + 20 * (t - 47.96), on: true, v: 1 }; }
  return { a, b };
}
// HD photo + cartoon loco pilot + DMI (overlay)
const TCAS = await img('img/tcas.jpg');
const pilotSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="560" viewBox="0 0 520 560"><defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#d9a074"/><stop offset="1" stop-color="#b98058"/></linearGradient></defs>
  <path d="M70 560 Q70 390 260 370 Q450 390 450 560 Z" fill="#e9eef5" stroke="#26160c" stroke-width="8"/><path d="M220 372 L260 430 L300 372" fill="#1f3a7a"/>
  <ellipse cx="260" cy="250" rx="100" ry="112" fill="url(#s)" stroke="#26160c" stroke-width="8"/>
  <path d="M150 180 Q260 110 370 180 L378 200 L142 200 Z" fill="#1f3a7a" stroke="#26160c" stroke-width="8"/><rect x="140" y="192" width="240" height="20" rx="9" fill="#111"/><circle cx="260" cy="160" r="14" fill="#f2c21a" stroke="#26160c" stroke-width="5"/>
  <path d="M190 300 Q260 280 330 300 Q300 318 260 312 Q220 318 190 300 Z" fill="#1d1612"/>
  <ellipse cx="222" cy="252" rx="18" ry="15" fill="#fff" stroke="#26160c" stroke-width="5"/><ellipse cx="298" cy="252" rx="18" ry="15" fill="#fff" stroke="#26160c" stroke-width="5"/><circle cx="224" cy="254" r="8" fill="#2a1a0c"/><circle cx="296" cy="254" r="8" fill="#2a1a0c"/>
  <path d="M232 336 Q260 352 288 336" fill="none" stroke="#7a1e24" stroke-width="8" stroke-linecap="round"/></svg>`;
const PILOT = await img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pilotSVG));
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 28px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); } g.restore();
}
function dmi(g, t, x, y, a) {
  if (a <= 0.01) return; const v = t < 32.48 ? 98 : Math.max(0, Math.round(98 * (1 - seg(t, 32.48, 34.6)))), state = t < 29.42 ? 0 : t < 32.48 ? 1 : 2;
  g.save(); g.globalAlpha = a; g.translate(x, y); g.fillStyle = 'rgba(8,10,16,0.92)'; g.strokeStyle = state === 2 ? '#ff3a3a' : state === 1 ? '#ffd24a' : '#5a6a8a'; g.lineWidth = 6; g.beginPath(); g.roundRect(-230, -150, 460, 300, 26); g.fill(); g.stroke();
  g.fillStyle = '#9fb0d0'; g.font = '800 26px BalooL, BalooD, sans-serif'; g.textAlign = 'left'; g.fillText('KAVACH', -205, -110);
  g.strokeStyle = '#2a3a5a'; g.lineWidth = 16; g.beginPath(); g.arc(-90, 20, 90, Math.PI * 0.8, Math.PI * 2.2); g.stroke(); g.strokeStyle = state === 2 ? '#ff3a3a' : '#5dff8a'; g.beginPath(); g.arc(-90, 20, 90, Math.PI * 0.8, Math.PI * 0.8 + Math.PI * 1.4 * v / 130); g.stroke();
  g.fillStyle = '#fff'; g.font = '800 64px BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(String(v), -90, 40); g.font = '800 22px BalooL, sans-serif'; g.fillText('km/h', -90, 72);
  const d = Math.max(0, Math.round(t < 24.64 ? 900 : 900 - 650 * seg(t, 24.64, 33.4))); g.fillStyle = '#9fb0d0'; g.font = '800 24px BalooD, BalooL, sans-serif'; g.fillText('लाल सिग्नल', 120, -50); g.fillStyle = '#fff'; g.font = '800 48px BalooL, sans-serif'; g.fillText(d + ' m', 120, 10);
  if (state > 0) { const blink = state === 2 || Math.sin(t * 14) > 0; if (blink) { g.fillStyle = state === 2 ? '#ff3a3a' : '#ffd24a'; g.beginPath(); g.roundRect(20, 50, 200, 70, 14); g.fill(); g.fillStyle = '#111'; g.font = '800 36px BalooD, BalooL, sans-serif'; g.fillText(state === 2 ? 'ब्रेक!' : 'चेतावनी', 120, 98); } }
  g.restore();
}
// ---------------------------------------------------------------- camera envs
const DAY = { sky: true, e: 26, az: 2.0, sun: 2.6, ambI: 0.55, fog: 0.0016, exposure: 1.0, dof: 0.5 };
const z0 = V(0, 0, 0);
const KEYS = [[0, 0, z0, V(1, 0, 0), 40, DAY]];
const F = film({ total, keys: KEYS, exposure: 1.0, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' }, hits: [[4.56, 0.015], [8.62, 0.012], [32.48, 0.015], [40.26, 0.015]],
  titles: [[-1, 3.1, 'एक पटरी… आमने-सामने!', 92, '#ff6a4a', 300, 'कवच: टक्कर कैसे रुकती है?'], [3.62, 5.6, 'खुद-ब-खुद रुक गईं!', 92, '#5dff8a', 300],
    [8.62, 9.55, 'कवच 🇮🇳', 140, '#7fd8ff', 300, 'भारत का अपना सिस्टम'], [11.64, 13.1, 'RFID टैग', 120, '#ffd24a', 300], [16.2, 18.1, '"मैं यहाँ हूँ"', 100, '#7fd8ff', 300],
    [25.6, 28.1, 'लाल सिग्नल!', 120, '#ff4a4a', 300], [37.42, 40.0, 'कवच ↔ कवच', 110, '#7fd8ff', 300, 'दोनों इंजन आपस में बात करते हैं'],
    [41.42, 47.8, 'टेस्ट: 2022', 110, '#ffd24a', 300, 'दोनों ट्रेनें 380 m पहले रुकीं'], [50.6, 52.4, 'डिजिटल कवच', 120, '#7fd8ff', 300]],
  pills: [[13.2, 15.9, 'इंजन के नीचे: RFID रीडर', 1300, '#ffd24a'], [18.3, 19.5, 'पटरी किनारे: रेडियो टावर', 1300, '#7fd8ff']],
  overlay: (g, t, { txt }) => {
    if (t >= 15.3 && t < 18.2) { const km = (124.38 + (t - 15.3) * 0.02).toFixed(2); txt(`स्थान: किमी ${km}`, 540, 520, 60, '#ffffff', seg(t, 15.3, 15.6), 1, 10); }
    // the pilot + DMI during the red-signal beat
    if (t >= 24.6 && t < 34.0) { const a = seg(t, 24.6, 24.9) * (1 - seg(t, 33.7, 34.0)); dmi(g, t, 540, 1000, a);
      if (PILOT) { g.save(); g.globalAlpha = a; g.translate(860, 1250); g.scale(0.34, 0.34); g.drawImage(PILOT, -260, -280); g.restore(); if (t > 26.56 && t < 28.6) txt('…?', 900, 1100, 60, '#ffffff', 1, 1, 8); } }
    if (t >= 41.42 && t < 47.8) { const k = seg(t, 46.4, 46.9); txt('← 380 m →', 540, 860, 84, '#ffd24a', k, 1, 12); }
    const card = (im, a, b2, x, y, w, rot, cap) => { if (t < a || t > b2) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b2 - 0.3, b2)); paper(g, im, x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card(TCAS, 19.6, 24.2, 540, 1100, 960, -0.02, 'कवच (TCAS) का काम — रेल मंत्रालय का चित्र (असली)');
  } });
const { on, onCam } = F;

// ---------------------------------------------------------------- animation
on((t) => {
  windU.value = t; COWS.forEach(({ neck, tail, ph }) => { neck.rotation.z = -0.25 - 0.18 * (0.5 + 0.5 * Math.sin(t * 0.9 + ph)); tail.rotation.x = 0.35 * Math.sin(t * 2.3 + ph); });
  const S = scene_(t);
  A.grp.visible = S.a.on; B.grp.visible = S.b.on;
  A.grp.position.set(S.a.x - 9.8, 0, 0); A.grp.rotation.y = 0;
  B.grp.position.set(S.b.x + 9.8, 0, 0); B.grp.rotation.y = Math.PI;
  for (const T of [A, B]) T.L.head.intensity = 900;
  // tags glow as the loco front passes; reader LED flashes
  let read = 0; tagGlow.forEach((s, i) => { const dx = Math.abs(TAGS[i] - (S.a.x - 1.8)); const k = A.grp.visible ? Math.max(0, 1 - dx / 6) : 0; const wave = t >= 9.62 && t < 13.2 ? Math.max(0, 1 - Math.abs(((t - 9.62) * 120) % 600 - (TAGS[i] + 300) % 600) / 30) : 0;
    s.scale.setScalar(Math.max(0.001, 2.4 * Math.max(k, wave))); if (k > 0.6) read = 1; });
  A.L.rLed.material.color.copy(read ? HDR(0.6, 3, 4) : HDR(0.2, 0.6, 0.9)); beam.position.set(S.a.x - 2.2, 0.22, 0); beam.material.opacity = read && t >= 13.2 && t < 18.3 ? 0.8 : 0;
  // signal: green -> red at 25.34
  const red = t >= 25.34 && t < 34.6; lamps.forEach((l, i) => { const on2 = (i === 0 && red) || (i === 2 && !red); l.material.color.copy(on2 ? l.userData.c : HDR(0.08, 0.08, 0.08)); });
  sigGlow.position.set(SIG.x + 0.3, red ? 6.2 : 5.0, SIG.z); sigGlow.material.color.copy(red ? HDR(3, 0.3, 0.2) : HDR(0.3, 3, 0.8)); sigGlow.visible = t >= 24.6 && t < 34.6;
  // shield bubble
  const sh = (t >= 8.62 && t < 9.62) ? smooth(seg(t, 8.62, 8.9)) : (t >= 50.6 ? smooth(seg(t, 50.6, 51.0)) : 0); shield.visible = sh > 0.01; shield.material.opacity = 0.55 * sh; shield.position.set((t < 9.62 ? S.a.x : S.a.x) - 2, 0, 0); shield.material.map.offset.x = t * 0.05;
  // radio waves: tower -> loco (18.3-24) and loco <-> loco (35.8-40.3)
  waves.forEach((w, i) => { let v = false; const k = ((t * 0.7) + i / waves.length) % 1;
    if (t >= 18.3 && t < 24.0) { v = true; const from = V(TW.x, 34.6, TW.z), to = V(S.a.x - 4, 5.2, 0); w.position.copy(from).lerp(to, k); w.lookAt(to); w.scale.setScalar(0.6 + 2.4 * Math.sin(k * Math.PI)); }
    if (t >= 35.8 && t < 40.4) { v = true; const s = i % 2 ? 1 : -1, from = V(s > 0 ? S.a.x - 4 : S.b.x + 4, 5.2, 0), to = V(s > 0 ? S.b.x + 4 : S.a.x - 4, 5.2, 0); w.position.copy(from).lerp(to, k); w.lookAt(to); w.scale.setScalar(0.5 + 2 * Math.sin(k * Math.PI)); }
    w.visible = v; w.material.opacity = v ? 0.9 * Math.sin(k * Math.PI) : 0; });
  // sparks at the wheels while braking hard
  const braking = (t >= 3.3 && t < 5.0) || (t >= 32.5 && t < 34.6) || (t >= 38.6 && t < 40.7);
  for (let i = 0; i < sparks.n; i++) { let y = -999, x = 0, z = 0; if (braking) { const T = (i % 2 && t < 34 ? A : (i % 2 ? A : B)); const k = (t * 3 + hash(i)) % 1, base = (i % 2 ? S.a.x - 6.5 : S.b.x + 6.5);
      x = base - (i % 2 ? 1 : -1) * 4 * k; y = 0.4 + 0.8 * k * hash(i * 3) - 0.6 * k * k; z = (i % 4 < 2 ? 1 : -1) * GAUGE / 2 + (hash(i * 5) - 0.5) * 0.6 * k; if (t >= 24 && t < 35 && i % 2 === 0) y = -999; }
    sparks.pos[i * 3] = x; sparks.pos[i * 3 + 1] = y; sparks.pos[i * 3 + 2] = z; } sparks.geo.attributes.position.needsUpdate = true;
  // 380 m measure bar between the stopped engines
  gapLine.visible = t >= 46.4 && t < 47.9; const gx0 = S.a.x, gx1 = S.b.x, k2 = smooth(seg(t, 46.4, 46.9)); gapBar.position.set((gx0 + gx1) / 2, 6.5, 0); gapBar.scale.set(Math.max(0.01, (gx1 - gx0) * k2), 1, 1);
});
onCam((t, cam) => {
  const S = scene_(t), set = (p, l) => { cam.position.copy(p); cam.lookAt(l); cam.updateMatrixWorld(); };
  if (t < 1.6) set(V(S.a.x + 30 - 4 * t, 1.8, 7), V(S.a.x - 2, 2.6, 0));
  else if (t < 3.1) set(V(S.b.x - 30 + 4 * (t - 1.6), 1.8, -7), V(S.b.x + 2, 2.6, 0));
  else if (t < 5.7) set(V(S.a.x - 34, 22, 12), V(S.b.x - 20, 0, 0));
  else if (t < 9.62) { const k = seg(t, 5.7, 9.62); set(V(S.a.x - 30 + 10 * k, 8 + 10 * k, 30 - 4 * k), V(S.a.x + 5, 2, 0)); }
  else if (t < 13.2) { const nx = TAGS.find((x) => x > S.a.x + 14) || 0; set(V(nx - 5, 0.75, 1.1), V(nx + 3, 0.1, 0)); }
  else if (t < 18.3) { set(V(S.a.x + 1.2, 0.55, 3.8), V(S.a.x - 2.2, 0.3, 0)); }
  else if (t < 24.6) { const k = seg(t, 18.3, 24.6); set(V(S.a.x + 40 + 10 * k, 18, 46), V(lerp(S.a.x, TW.x, 0.5), 12, -10)); }
  else if (t < 34.6) { const k = seg(t, 24.64, 34.6); set(V(S.a.x - 14, 7, 12), V(S.a.x + 40, 2, -1)); if (t > 31.5) set(V(SIG.x - 22, 3.2, 10), V(SIG.x - 50, 2.5, 0)); }
  else if (t < 41.42) { set(V(S.a.x - 36, 20, 22), V(S.a.x + 150, 0, 0)); }
  else if (t < 47.9) { const k = seg(t, 41.42, 47.9); set(V(-236 - 10 * k, 40 + 10 * k, 30), V(120, 0, 0)); }
  else { const k = seg(t, 47.96, 52.4); set(V(S.a.x + 30 - 6 * k, 6 + 3 * k, 20), V(S.a.x - 6, 2.5, 0)); }
});
