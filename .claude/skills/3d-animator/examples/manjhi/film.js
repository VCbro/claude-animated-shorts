// DASHRATH MANJHI — "एक आदमी, एक हथौड़ी, और 22 साल". Vertical 1080x1920 cinematic short (3d-animator kit).
// One world: the Gehlaur ridge between a village (south, +z) and the hospital town (north, -z). A 110 m cut through the
// saddle grows with "progress" p(t). Every frame is a pure function of t.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { W, H, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, halton, hash } from './lib.js';

for (const [fam, f] of [['BalooD', 'devanagari'], ['BalooL', 'latin']]) {
  const ff = new FontFace(fam, `url(node_modules/@fontsource/baloo-2/files/baloo-2-${f}-800-normal.woff2)`, { weight: '800' });
  await ff.load(); document.fonts.add(ff);
}
const FONT = (px) => `800 ${px}px BalooD, BalooL, sans-serif`;
const WORDS = await (await fetch('out/words.json')).json();

export const total = 72.5;
const SHUTTER = 0.5 / 30;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

// ---------- renderer ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const RS = +(new URLSearchParams(location.search).get('rs') || 0.72), RW = Math.round(W * RS), RH = Math.round(H * RS);
const rt = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, samples: 4 });
const accum = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, depthBuffer: false });
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x888888, 0.004);

// ---------- noise ----------
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h2(ix, iy), h2(ix + 1, iy), sx), lerp(h2(ix, iy + 1), h2(ix + 1, iy + 1), sx), sy); }
function fbm(x, y, o = 5) { let a = 0.5, s = 0, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= 0.5; } return s; }

// ---------- terrain ----------
const zFof = (p) => 55 - 110 * p;
function ridgeH(x, z) {
  const ends = smooth(clamp((135 - Math.abs(x)) / 45));
  const mask = Math.exp(-Math.pow(z / (24 + 8 * fbm(x * 0.01, 3, 2)), 2)) * ends;
  const saddle = 1 - 0.74 * Math.exp(-Math.pow(x / 42, 2));
  const big = 36 * mask * saddle * (0.75 + 0.5 * fbm(x * 0.015, z * 0.015, 4));
  const rg = 1 - Math.abs(2 * fbm(x * 0.05 + 11, z * 0.05, 4) - 1), rg2 = 1 - Math.abs(2 * fbm(x * 0.16, z * 0.16 + 3, 3) - 1);
  const crag = (fbm(x * 0.09, z * 0.09, 4) - 0.5) * 5 * mask + rg * rg * 9 * mask + rg2 * rg2 * rg2 * 2.5 * mask;
  const ground = 1.4 * fbm(x * 0.012 + 40, z * 0.012, 3) + 0.25 * fbm(x * 0.2, z * 0.2, 2);
  return Math.max(ground, ground + big + crag);
}
const FLOOR = (x, z) => 0.35 + 0.18 * fbm(x * 0.6, z * 0.6, 2);
function terrainH(x, z, p) {
  const h = ridgeH(x, z);
  if (p <= 0 || Math.abs(z) > 62) return h;
  const zF = zFof(p) - 0.2;
  if (z < zF) return h;
  const wall = 4.55 + 0.7 * (fbm(z * 0.35, x * 0.2 + 7, 3) - 0.5) + 0.25 * Math.max(0, 1 - Math.abs(x) / 9);
  const inside = 1 - smooth(clamp((Math.abs(x) - wall) / 0.9));
  return lerp(h, Math.min(h, FLOOR(x, z)), inside);
}
const NX = 300, NZ = 300;
const tGeo = new THREE.PlaneGeometry(2, 2, NX, NZ); tGeo.rotateX(-Math.PI / 2);
const TP = tGeo.attributes.position.array, TCount = TP.length / 3;
const tCol = new Float32Array(TCount * 3); tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 3));
const cutIdx = [];
for (let i = 0; i < TCount; i++) {
  const u = TP[i * 3], v = TP[i * 3 + 2];
  const x = 230 * (0.12 * u + 0.88 * u * u * u), z = 230 * (0.3 * v + 0.7 * v * v * v);
  TP[i * 3] = x; TP[i * 3 + 2] = z;
  if (Math.abs(x) < 7.5 && Math.abs(z) < 64) cutIdx.push(i);
}
function colorAt(x, z, y, carved) {
  const n = fbm(x * 0.05, z * 0.05, 3), rock = smooth(clamp((y - 2.5) / 6)), g = smooth(clamp((n - 0.45) * 4)) * (1 - rock) * smooth(clamp((Math.abs(z) - 25) / 20));
  const n2 = fbm(x * 0.35, z * 0.35 + y * 0.3, 3); let r = lerp(0.36, 0.25 + 0.12 * n2, rock), gg = lerp(0.28, 0.21 + 0.1 * n2, rock), b = lerp(0.18, 0.17 + 0.08 * n2, rock);
  r = lerp(r, 0.24, g * 0.8); gg = lerp(gg, 0.33, g * 0.8); b = lerp(b, 0.13, g * 0.8);
  const k = 0.75 + 0.5 * fbm(x * 0.4, z * 0.4, 2);
  if (carved) { r = 0.42 + 0.1 * n2; gg = 0.36 + 0.08 * n2; b = 0.3 + 0.06 * n2; }
  return [r * k, gg * k, b * k];
}
let lastP = -1;
function setTerrain(p) {
  if (p === lastP) return;
  const all = lastP < 0; lastP = p;
  const list = all ? null : cutIdx, n = all ? TCount : cutIdx.length;
  for (let j = 0; j < n; j++) {
    const i = all ? j : list[j], x = TP[i * 3], z = TP[i * 3 + 2], y = terrainH(x, z, p), base = all ? 0 : ridgeH(x, z);
    TP[i * 3 + 1] = y;
    const c = colorAt(x, z, y, !all && base - y > 0.5);
    tCol[i * 3] = c[0]; tCol[i * 3 + 1] = c[1]; tCol[i * 3 + 2] = c[2];
  }
  tGeo.attributes.position.needsUpdate = true; tGeo.attributes.color.needsUpdate = true; tGeo.computeVertexNormals();
  if (all) setTerrain.done = true;
}
const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
const terrain = new THREE.Mesh(tGeo, terrainMat); terrain.receiveShadow = true; terrain.castShadow = true; scene.add(terrain);
setTerrain(0); lastP = -2;

// rock face being cut (high detail, close-ups)
const FW = 11, FHh = 14, faceG = new THREE.PlaneGeometry(FW, FHh, 140, 180); faceG.translate(0, FHh / 2, 0);
const FP = faceG.attributes.position.array, faceBase = FP.slice();
const faceMat = new THREE.MeshStandardMaterial({ color: 0x7a6a58, roughness: 0.95 });
const face = new THREE.Mesh(faceG, faceMat); face.castShadow = face.receiveShadow = true; scene.add(face);
let faceP = -1;
function setFace(p) {
  const zF = zFof(p); face.position.set(0, 0, zF + 1.0);
  if (p === faceP) return; faceP = p;
  for (let i = 0; i < FP.length; i += 3) {
    const x = faceBase[i], y = faceBase[i + 1];
    const top = ridgeH(x, zF - 1.2);
    const yy = Math.min(y, top);
    const chip = Math.pow(fbm(x * 3 + p * 40, yy * 3, 4), 2), big = fbm(x * 0.5 + p * 9, yy * 0.5, 3);
    FP[i] = x; FP[i + 1] = yy; FP[i + 2] = -0.25 - 0.6 * big - 0.22 * chip - 0.05 * fbm(x * 12, yy * 12, 2) - Math.max(0, Math.abs(x) - 4.4) * 3;
  }
  faceG.attributes.position.needsUpdate = true; faceG.computeVertexNormals();
}

// sky dome
const skyU = { zen: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: V(0, 1, 0) }, sunCol: { value: new THREE.Color() }, night: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 zen, hor, sunDir, sunCol; uniform float night; varying vec3 vD;
    float hh(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
    void main(){ vec3 d = normalize(vD); float y = max(d.y, -0.1);
      vec3 c = mix(hor, zen, pow(clamp(y,0.0,1.0), 0.55));
      float s = max(dot(d, sunDir), 0.0); c += sunCol * (pow(s, 900.0) * 25.0 + pow(s, 14.0) * 0.3 + pow(s, 3.0) * 0.06);
      vec3 q = floor(d * 380.0); float st = step(0.9965, hh(q)) * night * smoothstep(0.05, 0.3, d.y); c += vec3(st * 1.4);
      gl_FragColor = vec4(c, 1.0); }` }));
scene.add(sky);

const mat = (color, roughness = 0.8, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
function add(geo, material, x, y, z, parent = scene) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }

// ---------- village (south) and hospital town (north) ----------
const mud = mat(0x9a6b45, 0.95), thatch = mat(0x8a7444, 0.95), leaf = mat(0x3d5a24, 0.9), bark = mat(0x4a3424, 0.9);
for (let i = 0; i < 16; i++) {
  const x = -45 + 90 * hash(i + 3) , z = 70 + 40 * hash(i + 9), r = 2.2 + 1.2 * hash(i + 5), y0 = ridgeH(x, z);
  if (Math.abs(x) < 8 && z < 90) continue;
  const g = new THREE.Group(); g.position.set(x, y0 - 0.1, z); g.rotation.y = hash(i) * 6; scene.add(g);
  add(new THREE.BoxGeometry(r * 1.6, 2.2, r * 1.3), mud, 0, 1.1, 0, g);
  add(new THREE.ConeGeometry(r * 1.35, 2.0, 4, 1), thatch, 0, 3.15, 0, g).rotation.y = Math.PI / 4;
}
for (let i = 0; i < 40; i++) {
  const x = -90 + 180 * hash(i + 41), z = 62 + 70 * hash(i + 77); if (Math.abs(x) < 10) continue;
  const y0 = ridgeH(x, z), s = 0.8 + 0.7 * hash(i + 2);
  add(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 4 * s, 7), bark, x, y0 + 2 * s, z);
  add(new THREE.IcosahedronGeometry(2.6 * s, 1), leaf, x, y0 + 5 * s, z).scale.y = 0.8;
}
const town = new THREE.Group(); scene.add(town);
for (let i = 0; i < 12; i++) { const x = -40 + 80 * hash(i + 200), z = -140 - 30 * hash(i + 300), w = 6 + 6 * hash(i + 3), h = 4 + 8 * hash(i + 9);
  add(new THREE.BoxGeometry(w, h, w * 0.8), mat(0xb8b2a6, 0.85), x, ridgeH(x, z) + h / 2, z, town); }
const HOSP = V(8, ridgeH(8, -150), -150);
add(new THREE.BoxGeometry(22, 10, 12), mat(0xeae6dc, 0.7), HOSP.x, HOSP.y + 5, HOSP.z, town);
const redX = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 0.3, 0.3) });
add(new THREE.BoxGeometry(1.2, 4, 0.3), redX, HOSP.x, HOSP.y + 13, HOSP.z + 6, town); add(new THREE.BoxGeometry(4, 1.2, 0.3), redX, HOSP.x, HOSP.y + 13, HOSP.z + 6, town);
const VILLAGE = V(0, ridgeH(0, 85), 85);

// ---------- people ----------
const skinM = mat(0x5e3b26, 0.6), dhotiM = mat(0xd9d0bd, 0.85), whiteM = mat(0xe8e4da, 0.8), steel = mat(0x8a8d92, 0.35, 0.85), wood = mat(0x6b4a2b, 0.7);
function person({ cloth = dhotiM, top = skinM, s = 1, female = false, beard = false, turban = true }) {
  const g = new THREE.Group(); g.scale.setScalar(s); scene.add(g);
  const legs = [-1, 1].map((k) => { const p = new THREE.Group(); p.position.set(k * 0.09, 0.9, 0); g.add(p); add(new THREE.CylinderGeometry(0.055, 0.045, 0.9, 10), skinM, 0, -0.45, 0, p); return p; });
  if (female) add(new THREE.CylinderGeometry(0.17, 0.3, 1.0, 16), cloth, 0, 0.55, 0, g);
  else add(new THREE.CylinderGeometry(0.17, 0.21, 0.5, 14), cloth, 0, 0.7, 0, g);
  const torso = add(new THREE.CylinderGeometry(0.16, 0.14, 0.52, 14), top, 0, 1.16, 0, g); torso.scale.z = 0.7;
  add(new THREE.SphereGeometry(0.1, 16, 12), skinM, 0, 1.56, 0, g);
  if (turban) add(new THREE.TorusGeometry(0.085, 0.035, 8, 16), whiteM, 0, 1.63, 0, g).rotation.x = Math.PI / 2;
  if (female) add(new THREE.SphereGeometry(0.125, 16, 10, 0, TAU, 0, Math.PI * 0.62), cloth, 0, 1.56, 0.01, g);
  if (beard) add(new THREE.SphereGeometry(0.07, 12, 8), whiteM, 0, 1.5, -0.06, g).scale.set(1, 0.8, 0.7);
  const arms = [-1, 1].map((k) => { const p = new THREE.Group(); p.position.set(k * 0.21, 1.4, 0); g.add(p);
    add(new THREE.CylinderGeometry(0.045, 0.038, 0.62, 10), skinM, 0, -0.31, 0, p); add(new THREE.SphereGeometry(0.048, 10, 8), skinM, 0, -0.64, 0, p); return p; });
  return { g, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1] };
}
const man = person({ beard: true });
// hammer in the right hand, chisel held by the left
add(new THREE.CylinderGeometry(0.014, 0.016, 0.26, 8), wood, 0, -0.76, 0, man.armR);
const hHead = add(new THREE.BoxGeometry(0.06, 0.06, 0.14), steel, 0, -0.88, 0, man.armR);
const REST = 1.2, RAISE = 2.9;
const BUTT = V(0.21, 1.4 - 0.88 * Math.cos(REST), -0.88 * Math.sin(REST) - 0.05), TIPL = BUTT.clone().add(V(0, 0, -0.22));
const chisel = new THREE.Group(); man.g.add(chisel);
{ const c = add(new THREE.CylinderGeometry(0.012, 0.004, 0.22, 8), steel, 0, 0, 0, chisel); c.rotation.x = Math.PI / 2; chisel.position.copy(BUTT).lerp(TIPL, 0.5); }
{ const d = BUTT.clone().add(V(0, -0.02, 0.06)).sub(man.armL.position); man.armL.quaternion.setFromUnitVectors(V(0, -1, 0), d.clone().normalize()); man.armL.scale.y = d.length() / 0.66; }
const MAN_DZ = -TIPL.z;   // man.z = face z + this
const woman = person({ cloth: mat(0xb8322a, 0.8), top: mat(0xb8322a, 0.8), female: true, turban: false });
const potG = new THREE.LatheGeometry([[0, 0], [0.1, 0.02], [0.16, 0.12], [0.15, 0.22], [0.08, 0.3], [0.07, 0.34], [0.09, 0.36]].map(([a, b]) => new THREE.Vector2(a, b)), 24);
const potM = mat(0xa0522d, 0.75);
const pot = add(potG, potM, 0, 0, 0);
const villagers = [0, 1, 2, 3, 4].map((i) => person({ cloth: [dhotiM, mat(0x5a6b8a, 0.8), mat(0xc9a14a, 0.8), dhotiM, mat(0x7a3b2a, 0.8)][i], top: i % 2 ? mat(0xcfc6b0, 0.8) : skinM, s: 0.95 + 0.08 * hash(i) }));
const kidCols = [0x3f6fb5, 0xc04a3a, 0x3a8a5a, 0xd9a13a];
const kids = kidCols.map((c, i) => { const k = person({ cloth: mat(0x2a3a5a, 0.8), top: mat(0xf0f0f0, 0.8), s: 0.62, turban: false });
  add(new THREE.BoxGeometry(0.28, 0.32, 0.12), mat(c, 0.7), 0, 1.15, 0.16, k.g); return k; });
// hero tools (product shot)
const TOOLS = V(3.2, 0, 60); TOOLS.y = ridgeH(TOOLS.x, TOOLS.z) + 0.55;
const tools = new THREE.Group(); tools.position.copy(TOOLS); scene.add(tools);
add(new THREE.DodecahedronGeometry(0.55, 1), mat(0x7d6c5a, 0.95), 0, -0.3, 0, tools).scale.set(1.4, 0.6, 1);
{ const hm = new THREE.Group(); hm.position.set(-0.05, 0.03, 0.05); hm.rotation.set(0, 0.5, Math.PI / 2 - 0.05); tools.add(hm);
  add(new THREE.CylinderGeometry(0.016, 0.018, 0.34, 10), wood, 0, 0, 0, hm); add(new THREE.BoxGeometry(0.065, 0.065, 0.15), steel, 0, 0.19, 0, hm).rotation.x = Math.PI / 2;
  const ch = add(new THREE.CylinderGeometry(0.013, 0.004, 0.24, 10), steel, 0.12, 0.02, -0.1, tools); ch.rotation.set(Math.PI / 2, 0, 0.9); }

// sparks, chips, dust (per strike)
const SP = 64, spPos = new Float32Array(SP * 2 * 3), spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: new THREE.Color(6, 2.4, 0.6), size: 0.014, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(sparks);
const DU = 40, duPos = new Float32Array(DU * 2 * 3), duGeo = new THREE.BufferGeometry(); duGeo.setAttribute('position', new THREE.BufferAttribute(duPos, 3));
const dustM = new THREE.PointsMaterial({ color: new THREE.Color(0.9, 0.8, 0.65), size: 0.07, transparent: true, opacity: 0.25, depthWrite: false }); const dustP = new THREE.Points(duGeo, dustM); dustP.visible = false; scene.add(dustP);
const chips = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.012, 0), mat(0x9c8a74, 0.9), 40); chips.castShadow = true; scene.add(chips);
const flash = new THREE.PointLight(0xff9a40, 0, 3, 2); scene.add(flash);
// pot shards + splash
const shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.05, 0), potM, 22); shards.castShadow = true; scene.add(shards);
const SPL = 220, splPos = new Float32Array(SPL * 3), splGeo = new THREE.BufferGeometry(); splGeo.setAttribute('position', new THREE.BufferAttribute(splPos, 3));
const splash = new THREE.Points(splGeo, new THREE.PointsMaterial({ color: new THREE.Color(1.4, 1.6, 1.9), size: 0.025, transparent: true, opacity: 0.8, depthWrite: false })); scene.add(splash);
// rain
const RN = 1800, rnPos = new Float32Array(RN * 6), rnGeo = new THREE.BufferGeometry(); rnGeo.setAttribute('position', new THREE.BufferAttribute(rnPos, 3));
const rain = new THREE.LineSegments(rnGeo, new THREE.LineBasicMaterial({ color: new THREE.Color(0.7, 0.75, 0.85), transparent: true, opacity: 0.35, depthWrite: false })); scene.add(rain);
// map routes
function route(pts, color) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => V(x, ridgeH(x, z) + 4, z)));
  const ps = curve.getPoints(400); ps.forEach((p) => { p.y = Math.max(p.y, ridgeH(p.x, p.z) + 4); });
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps), 400, 2.2, 8, false);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, fog: false })); m.visible = false; scene.add(m); m.userData.n = g.index.count; return m;
}
const R55 = route([[0, 85], [45, 78], [100, 55], [128, 10], [126, -40], [95, -95], [45, -140], [8, -150]], new THREE.Color(5, 0.5, 0.35));
const R15 = route([[0, 85], [0, 40], [0, 0], [0, -60], [3, -120], [8, -150]], new THREE.Color(0.5, 5, 1.2));

// ---------- lights ----------
const sun = new THREE.DirectionalLight(0xffffff, 3); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
const hemi = new THREE.HemisphereLight(0x8899bb, 0x3a2a1a, 0.6); scene.add(hemi);

// ---------- timeline helpers ----------
const STRIKES = [[-0.08, 0.45], [1.74, 0.45], [3.62, 0.45], [38.3, 1], [39.98, 1], [40.5, 1], [41.0, 1], [67.05, 0.45], [68.76, 0.45], [70.6, 0.45], [72.42, 0.45]];
for (let s = 41.75; s < 47.9; s += 0.27) STRIKES.push([s, 1.6]);
STRIKES.sort((a, b) => a[0] - b[0]);
function progressAt(t) {
  if (t < 4.2 || t >= 67) return 0.35;
  if (t < 36.7) return 0;
  if (t < 41.7) return t < 39.1 ? 0.0 : 0.04;
  if (t < 47.96) return lerp(0.04, 1, smooth(seg(t, 41.7, 47.6)));
  return 1;
}
const inWork = (t) => t < 4.2 || (t >= 36.7 && t < 47.96) || t >= 67;
function armAngle(t) {
  let a = REST;
  for (const [s, sl] of STRIKES) {
    const d = (t - s) * sl;
    if (d > -0.5 && d < 0) { const up = smooth(seg(d, -0.5, -0.16)), down = Math.pow(seg(d, -0.16, 0), 2); a = REST + (RAISE - REST) * (up - up * down); }
    if (d >= 0 && d < 0.6) a = REST - 0.08 * spring(d, 0, 4, 7) * 3;
  }
  return a;
}
function lastStrike(t) { let best = null; for (const st of STRIKES) if (st[0] <= t) best = st; return best; }

// sun / time of day: [from, elev(deg), az(rad)]
const SUNS = [[-9, 14, 2.6], [4.2, 5, 2.5], [14.0, 24, 0.7], [19.8, 55, 2.3], [24.6, -12, 2.3], [26.7, 3, Math.PI], [31.18, 12, 2.2], [34.44, 16, 0.9],
  [39.1, 20, 2.5], [41.7, 0, 0], [47.96, 4, Math.PI], [51.28, 30, 2.4], [54.77, 55, 2.3], [58.72, 14, Math.PI + 0.35], [63.94, 4, -2.45], [67.0, 14, 2.6]];
function sunAt(t) {
  let s = SUNS[0]; for (const x of SUNS) if (x[0] <= t) s = x;
  let e = s[1], az = s[2];
  if (s[0] === 41.7) { const ph = (t - 41.7) * 1.05; e = 62 * Math.sin(TAU * ph - 0.3); az = 1.6 + 0.8 * Math.sin(ph); }
  if (s[0] === 24.6) e = lerp(40, -12, smooth(seg(t, 24.6, 25.6)));
  if (s[0] === 4.2) e = lerp(9, 4, seg(t, 4.2, 14));
  return { e, az };
}
const C = (r, g, b) => new THREE.Color(r, g, b);
function skyColors(e) {
  const day = smooth(clamp((e - 4) / 22)), gold = smooth(clamp((e + 4) / 8)) * (1 - day), night = 1 - smooth(clamp((e + 6) / 8));
  const zen = C(0.12, 0.28, 0.75).multiplyScalar(day).add(C(0.22, 0.25, 0.5).multiplyScalar(gold)).add(C(0.008, 0.012, 0.035).multiplyScalar(night));
  const hor = C(0.7, 0.78, 0.92).multiplyScalar(day).add(C(1.5, 0.62, 0.28).multiplyScalar(gold)).add(C(0.03, 0.04, 0.09).multiplyScalar(night));
  const sc = C(1.0, 0.95, 0.88).lerp(C(1.0, 0.55, 0.25), 1 - day);
  return { zen, hor, sc, day, gold, night };
}

// ---------- pose ----------
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = V(1, 1, 1), tv = V(0, 0, 0), tv2 = V(0, 0, 0);
const POT0 = V(9, 0, 6); POT0.y = ridgeH(9, 6) + 1.72;
const POTV = V(0.8, 1.4, 2.6), G = -9.8, POT_SLOW = 0.42;
let potHit = 0; { for (let s = 0; s < 4; s += 0.002) { const x = POT0.x + POTV.x * s, z = POT0.z + POTV.z * s, y = POT0.y + POTV.y * s + 0.5 * G * s * s; if (y <= ridgeH(x, z) + 0.15) { potHit = s; break; } } }
const POT_T0 = 17.55, POT_HIT_T = POT_T0 + potHit / POT_SLOW;
const potHitPos = V(POT0.x + POTV.x * potHit, 0, POT0.z + POTV.z * potHit); potHitPos.y = ridgeH(potHitPos.x, potHitPos.z) + 0.15;
function walk(p, ph, amt = 1) { p.legL.rotation.x = 0.45 * Math.sin(ph) * amt; p.legR.rotation.x = -0.45 * Math.sin(ph) * amt; p.armL.rotation.x = -0.35 * Math.sin(ph) * amt; p.armR.rotation.x = 0.35 * Math.sin(ph) * amt; }
function placeOn(o, x, z, ry = 0) { o.position.set(x, terrainH(x, z, curP), z); o.rotation.y = ry; }
let curP = 0;

function pose(t) {
  const p = progressAt(t); curP = p; setTerrain(p); setFace(p);
  face.visible = p > 0 && p < 1;
  // man
  man.g.visible = inWork(t) || (t >= 26.7 && t < 31.18) || (t >= 34.44 && t < 36.7) || (t >= 63.94 && t < 67);
  man.armL.visible = true; man.armR.rotation.set(0, 0, 0); man.legL.rotation.x = man.legR.rotation.x = 0; chisel.visible = true; hHead.visible = true;
  if (inWork(t)) {
    const zF = zFof(p) + 1.0; man.g.position.set(-0.21, FLOOR(0, zF + MAN_DZ), zF + MAN_DZ); man.g.rotation.set(0, 0, 0);
    man.armR.rotation.x = armAngle(t);
    const d = BUTT.clone().add(V(0, -0.02, 0.06)).sub(man.armL.position); man.armL.quaternion.setFromUnitVectors(V(0, -1, 0), d.normalize());
    if (t >= 36.7 && t < 39.1) man.g.position.y += 0;
  } else {
    man.armL.quaternion.identity(); man.armL.rotation.set(0.1, 0, 0.1); man.armR.rotation.set(0.15, 0, -0.1); chisel.visible = false;
    if (t >= 26.7 && t < 31.18) { placeOn(man.g, 0, 0.5, Math.PI); man.armR.rotation.set(0.25, 0, -0.15); }
    if (t >= 34.44 && t < 36.7) { const z = lerp(73, 60, seg(t, 34.44, 36.7)); placeOn(man.g, 0.4, z, 0); walk(man, (t - 34.44) * 7.5); man.armR.rotation.x = -0.3 + 0.3 * Math.sin((t - 34.44) * 7.5); }
    if (t >= 63.94 && t < 67) { placeOn(man.g, 6.6, 0.5, -0.9); man.armR.rotation.set(0.2, 0, -0.1); }
  }
  // woman + pot
  woman.g.visible = t >= 14 && t < 17.5;
  if (woman.g.visible) { const z = lerp(14, 7.5, seg(t, 14, 17.5)); placeOn(woman.g, 9, z, 0.1); walk(woman, (t - 14) * 5.5, 0.8); woman.armR.rotation.set(Math.PI - 0.15, 0, -0.25); }
  pot.visible = t >= 14 && t < POT_HIT_T + 0.02;
  if (t < 17.55) { const z = lerp(14, 7.5, seg(t, 14, 17.5)); pot.position.set(9 + 0.02, terrainH(9, z, 0) + 1.68, z); pot.rotation.set(0, 0, 0); }
  else { const s = Math.min(potHit, (t - POT_T0) * POT_SLOW); pot.position.set(POT0.x + POTV.x * s, POT0.y + POTV.y * s + 0.5 * G * s * s, POT0.z + POTV.z * s); pot.rotation.set(s * 3.5, 0, s * 2.2); }
  const sa = (t - POT_HIT_T) * POT_SLOW; shards.visible = sa >= 0 && t < 26;
  if (shards.visible) for (let i = 0; i < 22; i++) {
    const a = hash(i + 400) * TAU, v = 1.2 + 2.0 * hash(i + 401), up = 1 + 2.5 * hash(i + 402);
    const tt = Math.min(sa, 0.9); let y = potHitPos.y + up * tt + 0.5 * G * tt * tt; y = Math.max(y, ridgeH(potHitPos.x + Math.cos(a) * v * tt, potHitPos.z + Math.sin(a) * v * tt) + 0.03);
    tv.set(potHitPos.x + Math.cos(a) * v * tt, y, potHitPos.z + Math.sin(a) * v * tt); tmpQ.setFromEuler(new THREE.Euler(tt * 9 * hash(i), tt * 7, i));
    tmpS.setScalar(0.6 + 0.8 * hash(i + 403)); tmpM.compose(tv, tmpQ, tmpS); shards.setMatrixAt(i, tmpM);
  }
  shards.instanceMatrix.needsUpdate = true;
  splash.visible = sa >= 0 && sa < 0.9; splash.material.opacity = 0.8 * (1 - seg(sa, 0.4, 0.9));
  for (let i = 0; i < SPL; i++) { const a = hash(i + 500) * TAU, v = 0.6 + 2.2 * hash(i + 501), up = 0.8 + 3 * hash(i + 502), tt = Math.max(0, sa);
    splPos[i * 3] = potHitPos.x + Math.cos(a) * v * tt; splPos[i * 3 + 1] = Math.max(potHitPos.y, potHitPos.y + up * tt + 0.5 * G * tt * tt); splPos[i * 3 + 2] = potHitPos.z + Math.sin(a) * v * tt; }
  splGeo.attributes.position.needsUpdate = true;
  // villagers watching (laugh)
  villagers.forEach((v, i) => { v.g.visible = t >= 36.7 && t < 39.1; if (v.g.visible) { placeOn(v.g, -3.5 + i * 1.7 + 0.4 * hash(i), 64 + 1.5 * hash(i + 9), Math.PI + 0.3 * (hash(i + 4) - 0.5));
    const lg = Math.sin(t * 14 + i) * 0.08; v.g.rotation.x = lg; v.armR.rotation.set(-0.4 - (i % 2) * 0.9 + lg * 2, 0, -0.2); } });
  // kids walking through the path
  kids.forEach((k, i) => { k.g.visible = t >= 58.72 && t < 63.94; if (k.g.visible) { const z = lerp(21 - i * 1.6, -2 - i * 1.6, seg(t, 58.72, 63.94)); placeOn(k.g, (i % 2 ? 1.1 : -0.9) + 0.2 * Math.sin(i), z, 0); walk(k, t * 8 + i * 1.7); } });
  tools.visible = t >= 31.18 && t < 34.44;
  // sparks / chips / dust from the last two strikes
  const tip = man.g.visible && inWork(t) ? man.g.localToWorld(tv2.copy(TIPL)) : null;
  let si = 0; const recent = STRIKES.filter(([s]) => s <= t && t - s < 1.6).slice(-2);
  spPos.fill(0); duPos.fill(0); flash.intensity = 0;
  for (let r = 0; r < 2; r++) {
    const st = recent[r]; for (let i = 0; i < SP; i++) { const o = (r * SP + i) * 3;
      if (!st || !tip) { spPos[o + 1] = -999; continue; }
      const [s, sl] = st, age = (t - s) * sl, life = 0.25 + 0.35 * hash(i + s);
      if (age > life) { spPos[o + 1] = -999; continue; }
      const a = hash(i * 3 + s) * TAU, el = 0.2 + 1.2 * hash(i * 7 + s), v = 2 + 4 * hash(i * 11 + s);
      spPos[o] = tip.x + Math.cos(a) * Math.cos(el) * v * age; spPos[o + 1] = tip.y + Math.sin(el) * v * age * 0.7 + 0.5 * G * age * age; spPos[o + 2] = tip.z + (0.4 + Math.abs(Math.sin(a))) * v * age * 0.6; }
    for (let i = 0; i < DU; i++) { const o = (r * DU + i) * 3; if (!st || !tip) { duPos[o + 1] = -999; continue; }
      const [s, sl] = st, age = (t - s) * sl; const a = hash(i + 70) * TAU, v = 0.15 + 0.4 * hash(i + 71);
      duPos[o] = tip.x + Math.cos(a) * v * age; duPos[o + 1] = tip.y - 0.05 + 0.25 * age * hash(i + 72); duPos[o + 2] = tip.z + 0.05 + Math.abs(Math.sin(a)) * v * age; }
    if (st && tip) { const age = (t - st[0]) * st[1]; flash.intensity = Math.max(flash.intensity, 4 * Math.exp(-age * 14) * (age >= 0 ? 1 : 0)); }
  }
  dustM.opacity = 0.22; spGeo.attributes.position.needsUpdate = true; duGeo.attributes.position.needsUpdate = true;
  if (tip) flash.position.copy(tip).add(V(0, 0, 0.12));
  const lsx = lastStrike(t);
  for (let i = 0; i < 40; i++) {
    if (!lsx || !tip || (t - lsx[0]) * lsx[1] > 1.2) { tmpM.makeScale(0, 0, 0); chips.setMatrixAt(i, tmpM); continue; }
    const age = (t - lsx[0]) * lsx[1], a = hash(i + 90 + lsx[0]) * TAU, v = 0.6 + 1.6 * hash(i + 91), up = 0.5 + 1.8 * hash(i + 92);
    let y = tip.y + up * age + 0.5 * G * age * age; const fl = FLOOR(0, tip.z) + 0.01; y = Math.max(y, fl);
    tv.set(tip.x + Math.cos(a) * v * age * 0.6, y, tip.z + (0.2 + Math.abs(Math.sin(a))) * v * age * 0.7); tmpQ.setFromEuler(new THREE.Euler(age * 20 * hash(i), age * 13, 0));
    tmpS.setScalar(0.6 + 1.4 * hash(i + 93)); tmpM.compose(tv, tmpQ, tmpS); chips.setMatrixAt(i, tmpM);
  }
  chips.instanceMatrix.needsUpdate = true;
  // rain
  const rOn = smooth(seg(t, 42.35, 42.55)) * (1 - smooth(seg(t, 43.3, 43.5)));
  rain.visible = rOn > 0.01; rain.material.opacity = 0.35 * rOn;
  if (rain.visible) for (let i = 0; i < RN; i++) { const x = (hash(i + 1) - 0.5) * 160, z = (hash(i + 2) - 0.5) * 160 + 20, y = 90 - ((hash(i + 3) * 90 + t * 60) % 90);
    rnPos[i * 6] = x; rnPos[i * 6 + 1] = y; rnPos[i * 6 + 2] = z; rnPos[i * 6 + 3] = x + 0.3; rnPos[i * 6 + 4] = y + 2.2; rnPos[i * 6 + 5] = z; }
  rnGeo.attributes.position.needsUpdate = true;
  // routes
  R55.visible = (t >= 19.8 && t < 26.7) || (t >= 54.77 && t < 58.72);
  R55.geometry.setDrawRange(0, Math.floor(R55.userData.n * (t < 30 ? easeInOut(seg(t, 20.6, 23.4)) : 1) / 3) * 3);
  R55.material.color.setRGB(5, 0.5, 0.35).multiplyScalar(t < 30 ? lerp(1, 0.15, smooth(seg(t, 24.6, 25.4))) : lerp(1, 0.2, smooth(seg(t, 56.6, 57.4))));
  R15.visible = t >= 54.77 && t < 58.72; R15.geometry.setDrawRange(0, Math.floor(R15.userData.n * easeInOut(seg(t, 56.6, 57.6)) / 3) * 3);
  // time of day
  const { e, az } = sunAt(t); const er = e * Math.PI / 180;
  const sd = V(Math.sin(az) * Math.cos(er), Math.sin(er), Math.cos(az) * Math.cos(er));
  const sc = skyColors(e);
  skyU.zen.value.copy(sc.zen); skyU.hor.value.copy(sc.hor); skyU.sunDir.value.copy(sd); skyU.sunCol.value.copy(sc.sc).multiplyScalar(e > -2 ? 1 : 0); skyU.night.value = sc.night;
  scene.fog.color.copy(sc.hor).multiplyScalar(0.55); scene.fog.density = t >= 19.8 && t < 26.7 || (t >= 54.77 && t < 58.72) ? 0.0002 : 0.0013;
  sun.userData.dir = e > -3 ? sd : V(-sd.x, 0.5, -sd.z).normalize();
  sun.color.copy(e > -3 ? sc.sc : C(0.55, 0.65, 1.0)); sun.intensity = e > -3 ? 2.9 * smooth(clamp((e + 2) / 10)) : 0.4;
  hemi.color.copy(sc.zen).lerp(sc.hor, 0.55).multiplyScalar(0.9).add(C(0.04, 0.04, 0.05)); hemi.groundColor.setRGB(0.22, 0.16, 0.1).multiplyScalar(0.3 + 0.7 * (1 - sc.night)); hemi.intensity = 0.3 + 0.35 * sc.day;
  terrainMat.color.setRGB(1, 1, 1).lerp(C(0.82, 1.08, 0.78), t > 41.7 && t < 47.96 ? 0.5 + 0.5 * Math.sin((t - 41.7) * 1.05 * TAU / 4) : 0);
}

// ---------- camera keys: [from, to(glide end), eye, look, fov, up] ----------
const zH = zFof(0.35) + 1.0, zT = zFof(0.04) + 1.0, Hc = ridgeH(0, 0.5), Hr = ridgeH(6.6, 0.5);
const UP = V(0, 1, 0), NUP = V(0, 0, -1);
const HOOK = [V(3.4, 1.75, zH + 3.5), V(-0.3, 1.45, zH + 0.6), 38, UP];
const KEYS = [
  [-9, -9, ...HOOK],
  [4.2, 4.2, V(-25, 26, 140), V(0, 6, 80), 42, UP],
  [4.3, 10.6, V(-8, 42, 140), V(0, 12, 20), 42, UP],
  [10.76, 13.9, V(22, 135, 175), V(0, 4, -45), 46, UP],
  [14.0, 14.0, V(34, ridgeH(9, 10) + 7, 30), V(9, ridgeH(9, 10) + 1.4, 9), 34, UP],
  [14.1, 17.45, V(28, ridgeH(9, 8) + 6, 22), V(9, ridgeH(9, 8) + 1.4, 7.5), 34, UP],
  [17.5, 17.5, POT0.clone().add(V(2.6, -0.4, 3.4)), POT0.clone().add(V(0.4, -0.5, 1.0)), 30, UP],
  [17.6, 19.7, potHitPos.clone().add(V(2.4, 1.3, 2.6)), potHitPos.clone().add(V(0, 0.2, 0)), 30, UP],
  [19.8, 21.0, V(10, 470, -32), V(10, 0, -32.01), 60, NUP],
  [26.7, 26.7, V(2.4, Hc + 0.25, 8.5), V(0, Hc + 2.4, 0.5), 30, UP],
  [26.8, 31.0, V(1.5, Hc + 0.5, 5.2), V(0, Hc + 1.9, 0.5), 30, UP],
  [31.18, 31.18, TOOLS.clone().add(V(0.55, 0.22, 0.45)), TOOLS.clone().add(V(0, 0.02, 0)), 26, UP],
  [31.3, 34.3, TOOLS.clone().add(V(-0.45, 0.3, 0.55)), TOOLS.clone().add(V(0, 0.02, 0)), 26, UP],
  [34.44, 34.44, V(3.5, ridgeH(3, 80) + 1.6, 82), V(0, 4.5, 55), 36, UP],
  [34.5, 36.6, V(2.5, ridgeH(2, 78) + 1.9, 78), V(0, 5, 55), 36, UP],
  [36.7, 36.7, V(-1.5, ridgeH(-1.5, 70) + 1.5, 70.5), V(0, 2.4, 56), 36, UP],
  [36.8, 39.0, V(-0.6, ridgeH(-0.6, 69) + 1.4, 69), V(0, 2.2, 56.5), 34, UP],
  [39.1, 39.1, V(2.4, 1.9, zT + 3.2), V(-0.1, 1.4, zT + 0.6), 34, UP],
  [39.98, 39.98, V(0.95, 2.1, zT + 2.5), V(-0.05, 1.45, zT + 0.25), 30, UP],
  [40.5, 40.5, V(-1.5, 0.6, zT + 1.7), V(0, 1.5, zT + 0.7), 32, UP],
  [41.0, 41.0, V(0.6, 2.2, zT + 5.2), V(-0.1, 1.5, zT + 0.5), 34, UP],
  [41.7, 41.7, V(70, 62, 120), V(0, 6, 8), 40, UP],
  [41.8, 47.9, V(-55, 75, 105), V(0, 6, 4), 40, UP],
  [47.96, 47.96, V(0, 3.5, 95), V(0, 3, 40), 38, UP],
  [48.0, 51.2, V(0, 2.2, -28), V(0, 2.4, -80), 38, UP],
  [51.28, 52.5, V(32, 62, 46), V(0, 2, 2), 40, UP],
  [54.77, 55.9, V(10, 470, -32), V(10, 0, -32.01), 60, NUP],
  [58.72, 58.72, V(1.8, 1.25, 26), V(0, 1.1, 10), 34, UP],
  [58.8, 63.8, V(1.0, 1.5, 15), V(0, 1.2, 0), 34, UP],
  [63.94, 63.94, V(15, Hr - 1.2, 11), V(6.6, Hr + 1.4, 0.5), 30, UP],
  [64.0, 66.9, V(11.5, Hr - 0.6, 6.5), V(6.6, Hr + 1.2, 0.5), 30, UP],
  [67.0, 67.0, ...HOOK],
];
const camera = new THREE.PerspectiveCamera(36, W / H, 0.02, 2500);
const eye = V(0, 0, 0), look = V(0, 0, 0), right = V(0, 0, 0), up = V(0, 0, 0), upv = V(0, 1, 0);
let fov = 36;
function camAt(t) {
  let i = 0; while (i + 1 < KEYS.length && t >= KEYS[i + 1][0]) i++;
  const [a, b, e1, l1, f1, u1] = KEYS[i];
  const pv = KEYS[Math.max(0, i - 1)], k = b > a ? easeInOut(seg(t, a, b)) : 1;
  eye.copy(pv[2]).lerp(e1, k); look.copy(pv[3]).lerp(l1, k); fov = lerp(pv[4], f1, k); upv.copy(pv[5]).lerp(u1, k).normalize();
  const dist = eye.distanceTo(look), dr = Math.min(1, dist * 0.02);
  const ph = TAU * t / total;
  eye.x += dr * 0.25 * Math.sin(ph * 7); eye.y += dr * 0.15 * Math.sin(ph * 5 + 1);
  let j = 0; for (const [s, sl] of STRIKES) if (sl < 1.5) j += spring(t, s, 9, 7) * (sl < 1 ? 0.006 : 0.012);
  j += spring(t, POT_HIT_T, 8, 6) * 0.04;
  eye.y += j; look.y += j * 0.5;
}
function shoot(t, k, n) {
  camAt(t);
  face.visible = face.visible && eye.distanceTo(look) < 25;
  camera.fov = fov; camera.position.copy(eye); camera.up.copy(upv); camera.lookAt(look); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  if (n === 1) return;
  const F = eye.distanceTo(look), lens = Math.min(0.02, 0.006 * F) * (F > 60 ? 0.2 : 1);
  const a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * TAU, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
  right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
  camera.position.addScaledVector(right, lx).addScaledVector(up, ly); camera.updateMatrixWorld();
  const e = camera.projectionMatrix.elements, jx = halton(k + 1, 5) - 0.5, jy = halton(k + 1, 7) - 0.5;
  e[8] += -e[0] * lx / F + 2 * jx / RW; e[9] += -e[5] * ly / F + 2 * jy / RH;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
function jitterLights(k, n) {
  const F = eye.distanceTo(look), S = clamp(F * 0.9, 3, 260);
  const d = sun.userData.dir, s = n > 1 ? 0.012 : 0;
  sun.target.position.copy(look);
  sun.position.copy(look).addScaledVector(d, S * 2 + 20);
  sun.position.x += (halton(k + 1, 11) - 0.5) * s * S * 4; sun.position.z += (halton(k + 1, 13) - 0.5) * s * S * 4;
  const c = sun.shadow.camera; c.left = -S; c.right = S; c.top = S; c.bottom = -S; c.near = 1; c.far = S * 4 + 60; c.updateProjectionMatrix();
  sun.shadow.bias = -0.0002 * Math.max(1, S / 8);
}

// ---------- overlay ----------
const cap = Object.assign(document.createElement('canvas'), { width: W, height: H }), cg = cap.getContext('2d');
const capTex = new THREE.CanvasTexture(cap); capTex.colorSpace = THREE.SRGBColorSpace;
// captions: groups of up to 4 words, broken after punctuation
const GROUPS = []; { let cur = [];
  WORDS.forEach((w, i) => { cur.push({ w: w.w.replace(/[।…,!]/g, ''), t: w.t }); if (cur.length >= 4 || /[।…,!?]$/.test(w.w) || i === WORDS.length - 1) { GROUPS.push(cur); cur = []; } });
  GROUPS.forEach((g, i) => { g.t0 = g[0].t - 0.05; g.t1 = i + 1 < GROUPS.length ? GROUPS[i + 1][0].t - 0.05 : total; }); }
const TITLES = [  // [from, to, text, px, color, y, sub]
  [-1, 4.15, '22 साल. अकेले.', 112, '#ffd24a', 300, 'हथौड़ी + छेनी'],
  [5.82, 10.6, 'गहलौर, बिहार', 96, '#ffffff', 300, '1959'],
  [24.64, 26.6, 'देर हो गई…', 100, '#c9d2e0', 300],
  [26.75, 31.1, 'एक क़सम', 110, '#ffb35a', 300],
  [31.2, 34.4, 'पूरी पूँजी: 2 औज़ार', 84, '#ffffff', 300],
  [47.96, 51.2, 'रास्ता!', 140, '#ffd24a', 320],
  [58.75, 63.9, 'दशरथ मांझी पथ', 92, '#ffffff', 300, 'आज भी रोज़ इस्तेमाल'],
  [63.94, 67.0, 'MOUNTAIN MAN', 112, '#ffd24a', 300, 'दशरथ मांझी'],
  [67.0, 99, '22 साल. अकेले.', 112, '#ffd24a', 300, 'हथौड़ी + छेनी'],
];
const LABELS = [  // [from, to, text, world point, dx, dy, color]
  [11.2, 13.95, 'गाँव', VILLAGE.clone().add(V(0, 6, 0)), -120, 140, '#ffd24a'],
  [11.6, 13.95, 'अस्पताल', HOSP.clone().add(V(0, 12, 0)), 150, -90, '#ff8a80'],
  [11.9, 13.95, 'पहाड़', V(-30, ridgeH(-30, 0) + 4, 0), -40, -170, '#ffffff'],
  [15.3, 17.4, 'फाल्गुनी देवी', V(9, ridgeH(9, 10) + 2.1, 10), -200, -170, '#ffb3a8'],
  [20.4, 24.5, 'गाँव', VILLAGE, -150, 100, '#ffd24a'],
  [20.6, 24.5, 'अस्पताल', HOSP, 140, 60, '#ff8a80'],
  [31.5, 34.4, 'हथौड़ी', TOOLS.clone().add(V(-0.05, 0.05, 0.05)), -190, -260, '#ffd24a'],
  [32.9, 34.4, 'छेनी', TOOLS.clone().add(V(0.12, 0.03, -0.1)), 160, -200, '#ffd24a'],
  [54.9, 58.6, 'गाँव', VILLAGE, -150, 100, '#ffd24a'],
  [54.9, 58.6, 'अस्पताल', HOSP, 140, 60, '#ff8a80'],
];
const BUBBLES = [[37.0, 'पागल है!', 250, 640, -0.08], [37.5, 'हा हा हा', 790, 520, 0.07], [38.0, 'पहाड़ कटेगा?', 330, 860, 0.05], [38.4, 'नहीं होगा!', 760, 760, -0.06]];
const THAK = [39.98, 40.5, 41.0];
const proj = (v) => { tv.copy(v).project(camera); return [(tv.x * 0.5 + 0.5) * W, (-tv.y * 0.5 + 0.5) * H, tv.z]; };
function txt(s, x, y, px, color, alpha = 1, scale = 1, stroke = 10, rot = 0) {
  if (alpha <= 0.001) return;
  cg.save(); cg.globalAlpha = Math.min(1, alpha); cg.translate(x, y); cg.rotate(rot); cg.scale(scale, scale); cg.font = FONT(px); cg.textAlign = 'center'; cg.textBaseline = 'middle';
  cg.lineJoin = 'round'; if (stroke) { cg.lineWidth = stroke; cg.strokeStyle = 'rgba(0,0,0,0.85)'; cg.shadowColor = 'rgba(0,0,0,0.6)'; cg.shadowBlur = 20; cg.strokeText(s, 0, 0); }
  cg.shadowBlur = 0; cg.fillStyle = color; cg.fillText(s, 0, 0); cg.restore();
}
function pill(s, x, y, col, alpha, px = 46) {
  cg.save(); cg.font = FONT(px); const w = cg.measureText(s).width + 44; cg.globalAlpha = alpha; cg.fillStyle = 'rgba(8,8,10,0.72)'; cg.strokeStyle = col; cg.lineWidth = 3;
  cg.beginPath(); cg.roundRect(x - w / 2, y - px * 0.75, w, px * 1.5, px * 0.75); cg.fill(); cg.stroke(); cg.restore(); txt(s, x, y + 3, px, col, alpha, 1, 0);
}
function drawOverlay(t) {
  cg.clearRect(0, 0, W, H);
  // letterbox-feel top/bottom gradient for text legibility
  const gt = cg.createLinearGradient(0, 0, 0, 520); gt.addColorStop(0, 'rgba(0,0,0,0.45)'); gt.addColorStop(1, 'rgba(0,0,0,0)'); cg.fillStyle = gt; cg.fillRect(0, 0, W, 520);
  const gb = cg.createLinearGradient(0, H - 700, 0, H); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,0.5)'); cg.fillStyle = gb; cg.fillRect(0, H - 700, W, 700);
  for (const [a, b, s, px, col, y, sub] of TITLES) {
    if (t < a - 0.05 || t > b + 0.2) continue;
    const kin = a < 0 ? 1 : seg(t, a - 0.05, a + 0.25), kout = b > 90 ? 1 : 1 - seg(t, b, b + 0.2);
    txt(s, W / 2, y, px, col, Math.min(1, kin * 3) * kout, a < 0 ? 1 : backOut(kin, 2), 12);
    if (sub) txt(sub, W / 2, y + px * 0.6 + 18, 48, '#ffffff', (a < 0 ? 1 : seg(t, a + 0.15, a + 0.45)) * kout, 1, 8);
  }
  for (const [a, b, s, at, dx, dy, col] of LABELS) {
    if (t < a || t > b + 0.2) continue;
    const k = seg(t, a, a + 0.35), out = 1 - seg(t, b, b + 0.2), [x, y, z] = proj(at); if (z > 1) continue;
    cg.font = FONT(46); const hw = cg.measureText(s).width / 2 + 40; const lx = clamp(x + dx, hw, W - hw), ly = clamp(y + dy, 480, H - 560);
    cg.save(); cg.globalAlpha = out; cg.strokeStyle = col; cg.fillStyle = col; cg.lineWidth = 4; cg.shadowColor = 'rgba(0,0,0,.8)'; cg.shadowBlur = 8;
    cg.beginPath(); cg.arc(x, y, 9 * easeOut(k), 0, 7); cg.fill(); cg.beginPath(); cg.moveTo(x, y); cg.lineTo(lerp(x, lx, easeOut(k)), lerp(y, ly, easeOut(k))); cg.stroke(); cg.restore();
    pill(s, lx, ly, col, out * seg(t, a + 0.2, a + 0.45));
  }
  // 55 km counter (map)
  if (t > 20.6 && t < 26.6) { const k = easeInOut(seg(t, 20.6, 23.4)), o = seg(t, 20.6, 20.9) * (1 - seg(t, 26.3, 26.6)) * (t > 24.6 ? lerp(1, 0.5, seg(t, 24.6, 25.2)) : 1);
    txt(Math.round(55 * k) + ' km', W / 2, 330, 150, '#ff6a50', o, 1, 12); txt('घूमकर', W / 2, 440, 54, '#ffffff', o, 1, 8); }
  if (t > 54.9 && t < 58.7) { const k = smooth(seg(t, 56.7, 57.6)), o = seg(t, 54.9, 55.2) * (1 - seg(t, 58.4, 58.7));
    const n = Math.round(lerp(55, 15, k)); txt(n + ' km', W / 2, 330, 160, k > 0.5 ? '#5dff8a' : '#ff6a50', o, 1 + 0.08 * spring(t, 57.6, 4, 5), 12);
    txt(k > 0.98 ? '40 km कम!' : 'पहाड़ के बीच से', W / 2, 450, 56, '#ffffff', o, 1, 8); }
  // years counter (time-lapse)
  if (t > 41.7 && t < 48.1) { const k = smooth(seg(t, 41.7, 47.6)), o = seg(t, 41.7, 41.9) * (1 - seg(t, 47.9, 48.1));
    txt(String(Math.round(lerp(1960, 1982, k))), W / 2, 330, 190, '#ffd24a', o, 1, 14);
    txt('हर दिन • ' + Math.round(k * 22) + ' साल', W / 2, 470, 54, '#ffffff', o, 1, 8);
    const bw = 620, bx = W / 2 - bw / 2; cg.save(); cg.globalAlpha = o; cg.fillStyle = 'rgba(255,255,255,0.18)'; cg.fillRect(bx, 530, bw, 14); cg.fillStyle = '#ffd24a'; cg.fillRect(bx, 530, bw * progressAt(t), 14); cg.restore(); }
  // dimensions
  if (t > 51.6 && t < 54.7) { const o = seg(t, 51.6, 51.9) * (1 - seg(t, 54.4, 54.7));
    const [ax, ay] = proj(V(0, 1.0, 55)), [bx2, by2] = proj(V(0, 1.0, -55)), k = easeOut(seg(t, 51.7, 52.6));
    cg.save(); cg.globalAlpha = o; cg.strokeStyle = '#ffd24a'; cg.lineWidth = 5; cg.setLineDash([18, 12]); cg.beginPath(); cg.moveTo(ax, ay); cg.lineTo(lerp(ax, bx2, k), lerp(ay, by2, k)); cg.stroke(); cg.restore();
    pill('110 मीटर', lerp(ax, bx2, 0.5) + 150, lerp(ay, by2, 0.5), '#ffd24a', o * seg(t, 52.3, 52.6), 54);
    const [cx1, cy1] = proj(V(-4.6, 9, 20)), [cx2, cy2] = proj(V(4.6, 9, 20)), k2 = easeOut(seg(t, 53.1, 53.6)), o2 = o * seg(t, 53.1, 53.3);
    cg.save(); cg.globalAlpha = o2; cg.strokeStyle = '#8fdcff'; cg.lineWidth = 6; cg.beginPath(); cg.moveTo(lerp((cx1 + cx2) / 2, cx1, k2), lerp((cy1 + cy2) / 2, cy1, k2)); cg.lineTo(lerp((cx1 + cx2) / 2, cx2, k2), lerp((cy1 + cy2) / 2, cy2, k2)); cg.stroke(); cg.restore();
    pill('30 फ़ुट चौड़ा', (cx1 + cx2) / 2, Math.min(cy1, cy2) - 90, '#8fdcff', o2 * seg(t, 53.3, 53.6), 50);
  }
  // laugh bubbles
  for (const [a, s, x, y, r] of BUBBLES) if (t > a && t < 39.1) { const k = seg(t, a, a + 0.25), o = 1 - seg(t, 38.9, 39.1); pill(s, x, y + 20 * (1 - backOut(k)), '#ffffff', o * Math.min(1, k * 2), 54); }
  // THAK pops
  for (const a of THAK) if (t > a - 0.03 && t < a + 0.45) { const k = seg(t, a - 0.03, a + 0.1); txt('ठक!', W / 2 + (a === 40.5 ? 160 : a === 41.0 ? -150 : 0), 760, 170, '#ffffff', 1 - seg(t, a + 0.3, a + 0.45), backOut(k, 3), 14, (a === 40.5 ? 0.08 : -0.06)); }
  // captions: small, lower third
  const g = GROUPS.find((x) => t >= x.t0 && t < x.t1 + 0.1);
  if (g && t < total - 0.05) {
    cg.font = FONT(52); const sp = cg.measureText(' ').width, ws = g.map((w) => cg.measureText(w.w).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (g.length - 1);
    let x = W / 2 - tw / 2;
    g.forEach((w, i) => { const on = t >= w.t - 0.03, nx = g[i + 1] ? g[i + 1].t : g.t1, act = on && t < nx, k = seg(t, w.t - 0.03, w.t + 0.08);
      txt(w.w, x + ws[i] / 2, 1468 + 6 * (1 - backOut(k)), 52, act ? '#ffd24a' : '#ffffff', on ? 1 : 0.35, 1, 9); x += ws[i] + sp; });
  }
  capTex.needsUpdate = true;
}

// ---------- post ----------
const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), 0.28, 0.5, 1.0);
const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, cap: { value: capTex }, seed: { value: 0 }, exposure: { value: 1 }, warm: { value: 0 } }, vertexShader: vert,
  fragmentShader: `uniform sampler2D tex, cap; uniform float seed, exposure, warm; varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() {
      vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.01;
      vec3 c = vec3(texture2D(tex, vUv + d * ca).r, texture2D(tex, vUv).g, texture2D(tex, vUv - d * ca).b) * exposure;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(c, c * vec3(1.06, 1.0, 0.9), warm);                       // warm film tint
      c = mix(vec3(l), c, 1.08);
      c = aces(c);
      c *= mix(1.0, 0.5, smoothstep(0.3, 0.95, length(d * vec2(0.85, 1.0)) * 1.45));
      c = srgb(c);
      c += (h(vUv * 1000.0) - 0.5) * 0.035 * (1.0 - 0.5 * dot(c, vec3(0.33)));
      vec4 k = texture2D(cap, vUv); c = c * (1.0 - k.a) + k.rgb;
      gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false }));

export function renderAt(t, n = 1) {
  pose(t); shoot(t, 0, 1); drawOverlay(t);
  renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear();
  for (let k = 0; k < n; k++) {
    const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * SHUTTER;
    pose(ts); shoot(ts, k, n); jitterLights(k, n);
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true;
  }
  bloom.render(renderer, accum, accum, 0, false);
  const { e } = sunAt(t);
  grade.material.uniforms.seed.value = (t * 30) % 97;
  grade.material.uniforms.exposure.value = lerp(2.2, 0.85, smooth(clamp((e + 8) / 22)));
  grade.material.uniforms.warm.value = 0.6;
  renderer.setRenderTarget(null); grade.render(renderer);
}
window.renderAt = renderAt; window.total = total;
