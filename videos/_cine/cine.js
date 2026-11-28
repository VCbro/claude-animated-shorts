// CINEMATIC 3D STORY TOOLKIT (3d-animator kit): linear HDR, sub-frame accumulation (motion blur, DOF, soft shadows, AA),
// one ACES grade, sky dome with a time-of-day sun, terrain from a height function, simple people, real photos as paper cards,
// camera keys (cuts and glides), word captions + pills + labels overlay. Every frame is a pure function of t.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { W, H, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, halton, hash } from './lib.js';
export { THREE, W, H, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash };
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const TAU = Math.PI * 2;

for (const [fam, f] of [['BalooD', 'devanagari'], ['BalooL', 'latin']]) {
  const ff = new FontFace(fam, `url(node_modules/@fontsource/baloo-2/files/baloo-2-${f}-800-normal.woff2)`, { weight: '800' });
  await ff.load(); document.fonts.add(ff);
}
export const FONT = (px) => `800 ${px}px BalooD, BalooL, sans-serif`;
const WORDS = await (await fetch('out/words.json')).json();

const stage = document.getElementById('stage');
export const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const RS = +(new URLSearchParams(location.search).get('rs') || 0.72), RW = Math.round(W * RS), RH = Math.round(H * RS);
const rt = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, samples: 4 });
const accum = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, depthBuffer: false });
export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.002);

// ---------- noise ----------
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
export function vnoise(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(h2(ix, iy), h2(ix + 1, iy), sx), lerp(h2(ix, iy + 1), h2(ix + 1, iy + 1), sx), sy); }
export function fbm(x, y, o = 5) { let a = 0.5, s = 0, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= 0.5; } return s; }

// ---------- materials / meshes ----------
export const mat = (color, roughness = 0.8, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
export function add(geo, material, x = 0, y = 0, z = 0, parent = scene, shadow = true) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; }
export function rod(a, b, r, material, parent = scene) { const d = b.clone().sub(a), m = add(new THREE.CylinderGeometry(r, r, d.length(), 12), material, 0, 0, 0, parent); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m; }
export function group(x = 0, y = 0, z = 0, parent = scene) { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; }

// terrain from a height function h(x,z) and colour function col(x,z,y)->[r,g,b]
export function terrain(hf, col, { size = 400, seg: n = 260, cx = 0, cz = 0, warp = 0.85 } = {}) {
  const geo = new THREE.PlaneGeometry(2, 2, n, n); geo.rotateX(-Math.PI / 2);
  const P = geo.attributes.position.array, C = new Float32Array(P.length);
  for (let i = 0; i < P.length; i += 3) { const u = P[i], v = P[i + 2];
    const x = cx + size / 2 * ((1 - warp) * u + warp * u * u * u), z = cz + size / 2 * ((1 - warp) * v + warp * v * v * v);
    const y = hf(x, z); P[i] = x; P[i + 1] = y; P[i + 2] = z; const c = col(x, z, y); C[i] = c[0]; C[i + 1] = c[1]; C[i + 2] = c[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); m.receiveShadow = m.castShadow = true; scene.add(m); return m;
}
// rough rock blob (displaced icosphere)
export function rock(r, color, seed = 1, parent = scene, detail = 2) {
  const g = new THREE.IcosahedronGeometry(r, detail), p = g.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) { const k = 0.75 + 0.5 * fbm(p[i] * 3 / r + seed, p[i + 1] * 3 / r + p[i + 2] * 2 / r, 3); p[i] *= k; p[i + 1] *= k * 0.8; p[i + 2] *= k; }
  g.computeVertexNormals(); return add(g, mat(color, 0.95), 0, 0, 0, parent);
}

// ---------- people (stylised, read best as silhouettes / mid shots) ----------
const skinM = mat(0x8a5a3c, 0.6);
export function person({ cloth = mat(0x3a4a5a, 0.85), top = null, skin = skinM, s = 1, helmet = null, lamp = false, hair = null, female = false } = {}) {
  const g = new THREE.Group(); g.scale.setScalar(s); scene.add(g);
  const legs = [-1, 1].map((k) => { const p = new THREE.Group(); p.position.set(k * 0.09, 0.9, 0); g.add(p); add(new THREE.CylinderGeometry(0.065, 0.055, 0.9, 10), cloth, 0, -0.45, 0, p); add(new THREE.BoxGeometry(0.1, 0.06, 0.2), mat(0x1a1a1a, 0.7), 0, -0.88, -0.04, p); return p; });
  add(new THREE.CylinderGeometry(0.16, 0.17, 0.32, 14), cloth, 0, 0.98, 0, g);
  if (female) add(new THREE.CylinderGeometry(0.16, 0.26, 0.6, 14), top || cloth, 0, 0.75, 0, g);
  const torso = add(new THREE.CylinderGeometry(0.17, 0.15, 0.5, 14), top || cloth, 0, 1.33, 0, g); torso.scale.z = 0.72;
  add(new THREE.SphereGeometry(0.1, 16, 12), skin, 0, 1.7, 0, g);
  if (hair) add(new THREE.SphereGeometry(0.105, 16, 10, 0, TAU, 0, Math.PI * 0.55), mat(hair, 0.8), 0, 1.71, 0.01, g);
  if (helmet) { add(new THREE.SphereGeometry(0.12, 16, 10, 0, TAU, 0, Math.PI / 2), mat(helmet, 0.4), 0, 1.74, 0, g); add(new THREE.CylinderGeometry(0.15, 0.15, 0.015, 20), mat(helmet, 0.4), 0, 1.74, 0, g); }
  let light = null;
  if (lamp) { add(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 7, 5) }), 0, 1.79, -0.12, g).rotation.x = Math.PI / 2;
    light = new THREE.SpotLight(0xfff0d0, 6, 9, 0.5, 0.6, 1.6); light.position.set(0, 1.79, -0.14); light.target.position.set(0, 1.4, -2); g.add(light, light.target); }
  const arms = [-1, 1].map((k) => { const p = new THREE.Group(); p.position.set(k * 0.22, 1.55, 0); g.add(p);
    add(new THREE.CylinderGeometry(0.05, 0.042, 0.62, 10), top || cloth, 0, -0.31, 0, p); add(new THREE.SphereGeometry(0.05, 10, 8), skin, 0, -0.64, 0, p); return p; });
  return { g, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1], light };
}
export function walk(p, ph, amt = 1) { p.legL.rotation.x = 0.45 * Math.sin(ph) * amt; p.legR.rotation.x = -0.45 * Math.sin(ph) * amt; p.armL.rotation.x = -0.35 * Math.sin(ph) * amt; p.armR.rotation.x = 0.35 * Math.sin(ph) * amt; }

// ---------- real photo as a paper card (the only paper-cut element) ----------
function cv(w, h) { return Object.assign(document.createElement('canvas'), { width: w, height: h }); }
export async function photoCard(src, { w = 1, tape = true, caption = null } = {}) {
  const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const iw = img ? img.naturalWidth : 4, ih = img ? img.naturalHeight : 3, asp = ih / iw, px = 1024, b = px * 0.045, capH = caption ? px * 0.1 : 0;
  const ch = Math.round((px - 2 * b) * asp + 2 * b + capH + 12), c = cv(px, ch), g = c.getContext('2d');
  g.fillStyle = '#f3efe4'; g.beginPath(); g.moveTo(0, 0); g.lineTo(px, 0); for (let x = px; x >= 0; x -= 8) g.lineTo(x, ch - 4 - 10 * hash(x * 0.37)); g.closePath(); g.fill();
  if (img) g.drawImage(img, b, b, px - 2 * b, (px - 2 * b) * asp); else { g.fillStyle = '#444'; g.fillRect(b, b, px - 2 * b, (px - 2 * b) * asp); }
  if (caption) { g.fillStyle = '#2a2622'; g.font = FONT(Math.round(capH * 0.55)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(caption, px / 2, b + (px - 2 * b) * asp + capH * 0.55); }
  if (tape) { g.fillStyle = 'rgba(235,220,170,0.8)'; for (const x of [0.14, 0.86]) { g.save(); g.translate(px * x, b * 0.5); g.rotate(x < 0.5 ? -0.5 : 0.5); g.fillRect(-px * 0.08, -b * 0.6, px * 0.16, b * 1.3); g.restore(); } }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const hh = w * ch / px, geo = new THREE.PlaneGeometry(w, hh, 12, 1);
  { const p = geo.attributes.position.array; for (let i = 0; i < p.length; i += 3) p[i + 2] = -0.02 * w * Math.pow(p[i] / (w / 2), 2); }   // slight paper curl
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.85, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12 }));
  m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  const grp = new THREE.Group(); grp.add(m); scene.add(grp); grp.userData.h = hh; return grp;
}

// ---------- sky + lights ----------
const skyU = { zen: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: V(0, 1, 0) }, sunCol: { value: new THREE.Color() }, night: { value: 0 } };
export const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), new THREE.ShaderMaterial({ uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 zen, hor, sunDir, sunCol; uniform float night; varying vec3 vD;
    float hh(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
    void main(){ vec3 d = normalize(vD); float y = max(d.y, -0.1); vec3 c = mix(hor, zen, pow(clamp(y,0.0,1.0), 0.55));
      float s = max(dot(d, sunDir), 0.0); c += sunCol * (pow(s, 900.0) * 25.0 + pow(s, 14.0) * 0.3 + pow(s, 3.0) * 0.06);
      vec3 q = floor(d * 380.0); c += vec3(step(0.9965, hh(q)) * night * smoothstep(0.05, 0.3, d.y) * 1.4); gl_FragColor = vec4(c, 1.0); }` }));
scene.add(sky);
export const sun = new THREE.DirectionalLight(0xffffff, 3); scene.add(sun, sun.target);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.normalBias = 0.02;
export const hemi = new THREE.HemisphereLight(0x8899bb, 0x3a2a1a, 0.5); scene.add(hemi);
const C = (r, g, b) => new THREE.Color(r, g, b);
function skyColors(e) {
  const day = smooth(clamp((e - 4) / 22)), gold = smooth(clamp((e + 4) / 8)) * (1 - day), night = 1 - smooth(clamp((e + 6) / 8));
  const zen = C(0.12, 0.28, 0.75).multiplyScalar(day).add(C(0.22, 0.25, 0.5).multiplyScalar(gold)).add(C(0.008, 0.012, 0.035).multiplyScalar(night));
  const hor = C(0.7, 0.78, 0.92).multiplyScalar(day).add(C(1.5, 0.62, 0.28).multiplyScalar(gold)).add(C(0.03, 0.04, 0.09).multiplyScalar(night));
  const sc = C(1.0, 0.95, 0.88).lerp(C(1.0, 0.55, 0.25), 1 - day);
  return { zen, hor, sc, day, night };
}

// ---------- film ----------
export function film(CFG) {
  const { total } = CFG; const anims = [], camHooks = [];
  const on = (f) => anims.push(f); const onCam = (f) => camHooks.push(f);
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.02, 3000);
  const eye = V(0, 0, 0), look = V(0, 0, 0), right = V(0, 0, 0), up = V(0, 0, 0), tv = V(0, 0, 0);
  let fov = 36, envNow = {};
  // KEYS: [from, to, eye, look, fov, env]; to > from = glide from the previous key, to == from = cut
  function camAt(t) {
    const K = CFG.keys; let i = 0; while (i + 1 < K.length && t >= K[i + 1][0]) i++;
    const [a, b, e1, l1, f1, env1] = K[i], pv = K[Math.max(0, i - 1)], k = b > a ? easeInOut(seg(t, a, b)) : 1;
    eye.copy(pv[2]).lerp(e1, k); look.copy(pv[3]).lerp(l1, k); fov = lerp(pv[4], f1, k); envNow = env1 || {};
    const dist = eye.distanceTo(look), dr = Math.min(1, dist * 0.02), ph = TAU * t / total;
    eye.x += dr * 0.25 * Math.sin(ph * 7); eye.y += dr * 0.15 * Math.sin(ph * 5 + 1);
    let j = 0; for (const [h, amp] of CFG.hits || []) j += spring(t, h, 9, 7) * (amp ?? 0.03) * Math.max(1, dist * 0.05); eye.y += j; look.y += j * 0.5;
  }
  function env(t) {
    const E = envNow, e = E.e ?? 20, az = E.az ?? 2.5, er = e * Math.PI / 180, sd = V(Math.sin(az) * Math.cos(er), Math.sin(er), Math.cos(az) * Math.cos(er));
    const sc = skyColors(e);
    skyU.zen.value.copy(sc.zen); skyU.hor.value.copy(sc.hor); skyU.sunDir.value.copy(sd); skyU.sunCol.value.copy(sc.sc).multiplyScalar(e > -2 ? 1 : 0); skyU.night.value = sc.night;
    sky.visible = E.sky !== false;
    scene.fog.color.copy(E.fogCol ? new THREE.Color(E.fogCol) : sc.hor.clone().multiplyScalar(0.55)); scene.fog.density = E.fog ?? 0.002;
    sun.userData.dir = e > -3 ? sd : V(-sd.x, 0.5, -sd.z).normalize();
    sun.color.copy(E.sunCol ? new THREE.Color(E.sunCol) : (e > -3 ? sc.sc : C(0.55, 0.65, 1.0))); sun.intensity = E.sun ?? (e > -3 ? 2.9 * smooth(clamp((e + 2) / 10)) : 0.4);
    hemi.color.copy(E.amb ? new THREE.Color(E.amb) : sc.zen.clone().lerp(sc.hor, 0.55).multiplyScalar(0.9)); hemi.groundColor.setRGB(0.2, 0.15, 0.1); hemi.intensity = E.ambI ?? (0.3 + 0.35 * sc.day);
    return E.exposure ?? lerp(2.2, 0.85, smooth(clamp((e + 8) / 22)));
  }
  function shoot(t, k, n) {
    camAt(t); const kk = k;
    camera.fov = fov; camera.position.copy(eye); camera.lookAt(look); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    if (n > 1) {
      const F = eye.distanceTo(look), lens = CFG.lens === false ? 0 : Math.min(0.02, 0.006 * F) * (F > 60 ? 0.2 : 1) * (envNow.dof ?? 1);
      const a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * TAU, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
      right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
      camera.position.addScaledVector(right, lx).addScaledVector(up, ly); camera.updateMatrixWorld();
      const e = camera.projectionMatrix.elements, jx = halton(k + 1, 5) - 0.5, jy = halton(k + 1, 7) - 0.5;
      e[8] += -e[0] * lx / F + 2 * jx / RW; e[9] += -e[5] * ly / F + 2 * jy / RH;
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    }
    for (const f of camHooks) f(t, camera, eye, look);
    const F = eye.distanceTo(look), S = clamp(F * 0.9, 3, 260), d = sun.userData.dir || V(0, 1, 0), s = n > 1 ? 0.012 : 0;
    sun.target.position.copy(look); sun.position.copy(look).addScaledVector(d, S * 2 + 20);
    sun.position.x += (halton(k + 1, 11) - 0.5) * s * S * 4; sun.position.z += (halton(k + 1, 13) - 0.5) * s * S * 4;
    const c = sun.shadow.camera; c.left = -S; c.right = S; c.top = S; c.bottom = -S; c.near = 1; c.far = S * 4 + 60; c.updateProjectionMatrix(); sun.shadow.bias = -0.0002 * Math.max(1, S / 8);
  }
  // overlay
  const cap = cv(W, H), cg = cap.getContext('2d'), capTex = new THREE.CanvasTexture(cap); capTex.colorSpace = THREE.SRGBColorSpace;
  const GROUPS = []; { let cur = [];
    WORDS.forEach((w, i) => { cur.push({ w: w.w.replace(/[।…,!"—]/g, ''), t: w.t }); if (cur.length >= 4 || /[।…,!?"]$/.test(w.w) || i === WORDS.length - 1) { const c2 = cur.filter((x) => x.w); if (c2.length) GROUPS.push(c2); cur = []; } });
    GROUPS.forEach((g, i) => { g.t0 = g[0].t - 0.05; g.t1 = i + 1 < GROUPS.length ? GROUPS[i + 1][0].t - 0.05 : total; }); }
  const proj = (v) => { tv.copy(v).project(camera); return [(tv.x * 0.5 + 0.5) * W, (-tv.y * 0.5 + 0.5) * H, tv.z]; };
  function txt(s, x, y, px, color, alpha = 1, scale = 1, stroke = 10, rot = 0) {
    if (alpha <= 0.001) return; cg.save(); cg.globalAlpha = Math.min(1, alpha); cg.translate(x, y); cg.rotate(rot); cg.scale(scale, scale); cg.font = FONT(px); cg.textAlign = 'center'; cg.textBaseline = 'middle';
    cg.lineJoin = 'round'; if (stroke) { cg.lineWidth = stroke; cg.strokeStyle = 'rgba(0,0,0,0.85)'; cg.shadowColor = 'rgba(0,0,0,0.6)'; cg.shadowBlur = 18; cg.strokeText(s, 0, 0); }
    cg.shadowBlur = 0; cg.fillStyle = color; cg.fillText(s, 0, 0); cg.restore();
  }
  function pill(s, x, y, col, alpha, px = 46) {
    if (alpha <= 0.001) return; cg.save(); cg.font = FONT(px); const w = cg.measureText(s).width + 48; cg.globalAlpha = alpha; cg.fillStyle = 'rgba(10,8,8,0.75)'; cg.strokeStyle = col; cg.lineWidth = 3;
    cg.beginPath(); cg.roundRect(x - w / 2, y - px * 0.78, w, px * 1.56, px * 0.78); cg.fill(); cg.stroke(); cg.restore(); txt(s, x, y + 3, px, col, alpha, 1, 0);
  }
  function drawOverlay(t) {
    cg.clearRect(0, 0, W, H);
    const gt = cg.createLinearGradient(0, 0, 0, 560); gt.addColorStop(0, 'rgba(0,0,0,0.4)'); gt.addColorStop(1, 'rgba(0,0,0,0)'); cg.fillStyle = gt; cg.fillRect(0, 0, W, 560);
    const gb = cg.createLinearGradient(0, H - 650, 0, H); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(0,0,0,0.5)'); cg.fillStyle = gb; cg.fillRect(0, H - 650, W, 650);
    for (const [a, b, s, px, col, y, sub] of CFG.titles || []) {
      if (t < a - 0.05 || t > b + 0.2) continue; const kin = a < 0 ? 1 : seg(t, a - 0.05, a + 0.25), kout = b > 900 ? 1 : 1 - seg(t, b, b + 0.2);
      txt(s, W / 2, y, px, col, Math.min(1, kin * 3) * kout, a < 0 ? 1 : backOut(kin, 2), 12);
      if (sub) txt(sub, W / 2, y + px * 0.6 + 18, 48, '#ffffff', (a < 0 ? 1 : seg(t, a + 0.15, a + 0.45)) * kout, 1, 8);
    }
    for (const [a, b, s, at, dx, dy, col] of CFG.labels || []) {
      if (t < a || t > b + 0.2) continue; const k = seg(t, a, a + 0.35), out = 1 - seg(t, b, b + 0.2), [x, y, z] = proj(at); if (z > 1) continue;
      cg.font = FONT(46); const hw = cg.measureText(s).width / 2 + 40, lx = clamp(x + dx, hw, W - hw), ly = clamp(y + dy, 480, H - 560);
      cg.save(); cg.globalAlpha = out; cg.strokeStyle = col; cg.fillStyle = col; cg.lineWidth = 4; cg.shadowColor = 'rgba(0,0,0,.8)'; cg.shadowBlur = 8;
      cg.beginPath(); cg.arc(x, y, 9 * easeOut(k), 0, 7); cg.fill(); cg.beginPath(); cg.moveTo(x, y); cg.lineTo(lerp(x, lx, easeOut(k)), lerp(y, ly, easeOut(k))); cg.stroke(); cg.restore();
      pill(s, lx, ly, col, out * seg(t, a + 0.2, a + 0.45));
    }
    for (const [a, b, s, y, col] of CFG.pills || []) { if (t < a || t > b + 0.2) continue; const k = seg(t, a, a + 0.3); pill(s, W / 2, y + 16 * (1 - backOut(k)), col || '#ffd24a', Math.min(1, k * 2) * (1 - seg(t, b, b + 0.2))); }
    if (CFG.overlay) CFG.overlay(cg, t, { txt, pill, proj, W, H });
    if (CFG.brand) {          // channel handle (top-left) + thin progress bar (top edge)
      const B = CFG.brand, col = B.color || '#ffd24a';
      cg.save(); cg.fillStyle = 'rgba(255,255,255,0.18)'; cg.fillRect(0, 0, W, 8); cg.fillStyle = col; cg.fillRect(0, 0, W * clamp(t / total), 8);
      cg.font = FONT(B.px || 36); cg.textAlign = 'left'; cg.textBaseline = 'middle'; cg.lineJoin = 'round'; cg.lineWidth = 7; cg.strokeStyle = 'rgba(0,0,0,0.75)';
      const hx = 44, hy = 62; cg.globalAlpha = 0.92; cg.strokeText(B.handle, hx + 52, hy); cg.fillStyle = '#ffffff'; cg.fillText(B.handle, hx + 52, hy);
      cg.fillStyle = col; cg.beginPath(); cg.arc(hx + 20, hy, 20, 0, 7); cg.fill(); cg.fillStyle = '#111'; cg.font = FONT(24); cg.textAlign = 'center'; cg.fillText('3D', hx + 20, hy + 2); cg.restore();
    }
    const g = GROUPS.find((x) => t >= x.t0 && t < x.t1 + 0.1);
    if (g && t < total - 0.05) {
      cg.font = FONT(52); const sp = cg.measureText(' ').width, ws = g.map((w) => cg.measureText(w.w).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (g.length - 1);
      let x = W / 2 - tw / 2;
      g.forEach((w, i) => { const on2 = t >= w.t - 0.03, nx = g[i + 1] ? g[i + 1].t : g.t1, act = on2 && t < nx, k = seg(t, w.t - 0.03, w.t + 0.08);
        txt(w.w, x + ws[i] / 2, 1468 + 6 * (1 - backOut(k)), 52, act ? '#ffd24a' : '#ffffff', on2 ? 1 : 0.35, 1, 9); x += ws[i] + sp; });
    }
    capTex.needsUpdate = true;
  }
  // post
  const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
    fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), 0.3, 0.5, 1.0);
  const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, cap: { value: capTex }, seed: { value: 0 }, exposure: { value: 1 }, warm: { value: 0.5 } }, vertexShader: vert,
    fragmentShader: `uniform sampler2D tex, cap; uniform float seed, exposure, warm; varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
      vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
      vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      void main() { vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.01;
        vec3 c = vec3(texture2D(tex, vUv + d * ca).r, texture2D(tex, vUv).g, texture2D(tex, vUv - d * ca).b) * exposure;
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); c = mix(c, c * vec3(1.06, 1.0, 0.9), warm); c = mix(vec3(l), c, 1.08);
        c = aces(c); c *= mix(1.0, 0.5, smoothstep(0.3, 0.95, length(d * vec2(0.85, 1.0)) * 1.45)); c = srgb(c);
        c += (h(vUv * 1000.0) - 0.5) * 0.035 * (1.0 - 0.5 * dot(c, vec3(0.33)));
        vec4 k = texture2D(cap, vUv); c = c * (1.0 - k.a) + k.rgb; gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false }));
  const SHUTTER = CFG.shutter ?? 0.5 / 30;
  function pose(t) { for (const f of anims) f(t); }
  function renderAt(t, n = 1) {
    pose(t); shoot(t, 0, 1); const ex = env(t); drawOverlay(t);
    renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear();
    for (let k = 0; k < n; k++) {
      const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * SHUTTER;
      pose(ts); shoot(ts, k, n);
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = 1 / n;
      renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true;
    }
    bloom.render(renderer, accum, accum, 0, false);
    grade.material.uniforms.seed.value = (t * 30) % 97; grade.material.uniforms.exposure.value = ex * (CFG.exposure || 1);
    renderer.setRenderTarget(null); grade.render(renderer);
  }
  window.renderAt = renderAt; window.total = total;
  return { on, onCam, camera, renderAt };
}
export const pop = (t, at, d = 0.35) => (t < at ? 0.0001 : Math.max(0.0001, backOut(clamp((t - at) / d), 2.2)));
export const rise = (t, a, b, from, to, ease = easeOut) => lerp(from, to, ease(clamp((t - a) / (b - a))));
// spark / particle burst helper: returns Points + update(t, origin, times, slow)
export function particles(n, color, size, { additive = true, opacity = 1 } = {}) {
  const pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, transparent: true, opacity, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false })); scene.add(p);
  return { p, pos, geo, n };
}
