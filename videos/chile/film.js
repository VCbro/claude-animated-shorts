// CHILE 2010 — "17 दिन बाद… ज़मीन के नीचे से एक पर्ची आई". Cinematic 3D (cine.js); real photos appear as paper cards only at fact beats.
import { THREE, V, TAU, film, scene, mat, add, rod, group, terrain, rock, person, walk, photoCard, particles, fbm, pop, rise,
  clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';

const total = 65.2;
// ---------- surface: Atacama desert ----------
const hS = (x, z) => {
  const big = 34 * Math.pow(fbm(x * 0.006 + 3, z * 0.006, 4), 2.2) * smooth(clamp((Math.hypot(x, z + 60) - 40) / 120));
  const rg = 1 - Math.abs(2 * fbm(x * 0.02, z * 0.02 + 5, 3) - 1);
  return big + rg * rg * 3 * smooth(clamp((Math.hypot(x, z) - 25) / 40)) + 0.6 * fbm(x * 0.1, z * 0.1, 2);
};
terrain(hS, (x, z, y) => { const n = fbm(x * 0.05, z * 0.05, 3), k = 0.8 + 0.4 * fbm(x * 0.4, z * 0.4, 2);
  return [lerp(0.62, 0.45, smooth(clamp(y / 25))) * k + 0.05 * n, lerp(0.46, 0.33, smooth(clamp(y / 25))) * k, lerp(0.3, 0.24, smooth(clamp(y / 25))) * k]; }, { size: 900, seg: 280 });
const G = (x, z) => V(x, hS(x, z), z);

// drill rig A (the probe that found them)
const A = G(0, 0);
const steel = mat(0x8a8d92, 0.4, 0.8), yellow = mat(0xe0a81a, 0.5, 0.2), red = mat(0xb8282c, 0.5), white = mat(0xe8e6e0, 0.6);
const rigA = group(A.x, A.y, A.z);
for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rod(V(x * 1.4, 0, z * 1.4), V(x * 0.3, 12, z * 0.3), 0.07, yellow, rigA);
for (let y = 2; y < 12; y += 2) { const r = 1.4 - y * 0.09; for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) rod(V(a[0] * r, y, a[1] * r), V(b[0] * r, y, b[1] * r), 0.04, yellow, rigA); }
add(new THREE.BoxGeometry(5, 2.2, 3), mat(0x2f5d7a, 0.5, 0.3), 3.8, 1.1, 0, rigA);
add(new THREE.CylinderGeometry(1.1, 1.3, 0.3, 24), mat(0x3a3a3a, 0.8), 0, 0.15, 0, rigA);
const rodA = add(new THREE.CylinderGeometry(0.07, 0.07, 14, 12), steel, 0, 7, 0, rigA);
const noteA = add(new THREE.PlaneGeometry(0.34, 0.22), new THREE.MeshStandardMaterial({ map: noteTex(), side: THREE.DoubleSide, roughness: 0.8 }), 0, 0, 0.09, rigA);
function noteTex() { const c = Object.assign(document.createElement('canvas'), { width: 512, height: 330 }), g = c.getContext('2d');
  g.fillStyle = '#f6f2e6'; g.fillRect(0, 0, 512, 330); g.fillStyle = '#c4161c'; g.font = '700 58px BalooL, sans-serif'; g.textAlign = 'center'; g.fillText('ESTAMOS BIEN EN', 256, 140); g.fillText('EL REFUGIO LOS 33', 256, 220);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
// crowd at rig A
const crowd = []; for (let i = 0; i < 18; i++) { const p = person({ cloth: mat([0x2a3a5a, 0x5a2a2a, 0x3a3a3a, 0x7a5a2a][i % 4], 0.85), helmet: i % 3 ? 0xf2f2f2 : 0xe0a81a, s: 0.95 + 0.1 * hash(i) });
  const a = -0.9 + 1.8 * (i / 17), r = 5 + 2.5 * hash(i + 3); p.g.position.copy(G(A.x + Math.sin(a) * r + 1, A.z + Math.cos(a) * r + 2)); p.g.rotation.y = Math.atan2(A.x - p.g.position.x, A.z - p.g.position.z) + Math.PI; crowd.push(p); }
// flags
function flagMat() { const c = Object.assign(document.createElement('canvas'), { width: 300, height: 200 }), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 300, 100); g.fillStyle = '#d52b1e'; g.fillRect(0, 100, 300, 100); g.fillStyle = '#0039a6'; g.fillRect(0, 0, 100, 100);
  g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; g.lineTo(50 + Math.cos(a) * r, 50 + Math.sin(a) * r); } g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.8 }); }
const FLAG = flagMat(), flags = [];
function flag(x, z, h = 3, s = 1) { const p = G(x, z), g = group(p.x, p.y, p.z); rod(V(0, 0, 0), V(0, h, 0), 0.03, mat(0x777777, 0.5, 0.6), g);
  const geo = new THREE.PlaneGeometry(1.2 * s, 0.8 * s, 12, 4); geo.translate(0.6 * s, 0, 0); const f = add(geo, FLAG, 0, h - 0.4 * s, 0, g); f.userData.base = geo.attributes.position.array.slice(); flags.push(f); return g; }
for (let i = 0; i < 6; i++) flag(A.x - 6 + i * 2.4, A.z + 9 + hash(i) * 2, 3.2);

// camp Esperanza (night)
const CAMP = G(-40, 45);
const tentCols = [0x2f5d9a, 0xc8562a, 0x3a7a4a, 0xd9b23a, 0x7a3a6a];
const campLights = [];
for (let i = 0; i < 22; i++) { const x = CAMP.x - 18 + 36 * hash(i + 1), z = CAMP.z - 12 + 24 * hash(i + 2), p = G(x, z);
  const t = add(new THREE.ConeGeometry(1.3, 1.6, 4), mat(tentCols[i % 5], 0.8), p.x, p.y + 0.8, p.z); t.rotation.y = hash(i) * 3; }
for (let i = 0; i < 14; i++) flag(CAMP.x - 16 + 32 * hash(i + 40), CAMP.z - 10 + 20 * hash(i + 41), 3.5);
for (let i = 0; i < 5; i++) { const p = G(CAMP.x - 10 + i * 5, CAMP.z + 2 * hash(i)); add(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12), mat(0x333333, 0.7), p.x, p.y + 0.4, p.z);
  const l = new THREE.PointLight(0xff8a30, 6, 12, 2); l.position.set(p.x, p.y + 1.1, p.z); scene.add(l); campLights.push(l);
  add(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 3.5, 1) }), p.x, p.y + 0.95, p.z, scene, false); }
const families = []; for (let i = 0; i < 16; i++) { const p = person({ cloth: mat([0x3a3a4a, 0x4a3a2a, 0x2a3a4a][i % 3], 0.85), s: 0.9 + 0.15 * hash(i), female: i % 2 === 0, hair: 0x1a1410 });
  p.g.position.copy(G(CAMP.x - 12 + 24 * hash(i + 60), CAMP.z + 8 + 4 * hash(i + 61))); p.g.rotation.y = Math.PI + (hash(i) - 0.5); families.push(p); }

// rescue rig B (Plan B drill, then the shaft head with the capsule)
const B = G(35, -25);
const rigB = group(B.x, B.y, B.z);
for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rod(V(x * 2.2, 0, z * 2.2), V(x * 0.5, 22, z * 0.5), 0.1, mat(0xd9d4c8, 0.5, 0.4), rigB);
for (let y = 3; y < 22; y += 3) { const r = 2.2 - y * 0.075; rod(V(-r, y, -r), V(r, y, -r), 0.05, steel, rigB); rod(V(r, y, -r), V(r, y, r), 0.05, steel, rigB); rod(V(r, y, r), V(-r, y, r), 0.05, steel, rigB); rod(V(-r, y, r), V(-r, y, -r), 0.05, steel, rigB); }
const wheel = add(new THREE.TorusGeometry(0.9, 0.08, 10, 40), mat(0xb8282c, 0.5, 0.4), 0, 22.6, 0, rigB);
add(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 32), mat(0x2a2a2a, 0.7), 0, 0.2, 0, rigB);
const rigLights = []; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; const l = new THREE.SpotLight(0xfff0d8, 60, 50, 0.5, 0.5, 1.4); l.position.set(Math.cos(a) * 7, 9, Math.sin(a) * 7); l.target.position.set(0, 0, 0); rigB.add(l, l.target); rigLights.push(l);
  add(new THREE.BoxGeometry(0.5, 0.35, 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8.5, 7) }), Math.cos(a) * 7, 9, Math.sin(a) * 7, rigB, false); rod(V(Math.cos(a) * 7, 0, Math.sin(a) * 7), V(Math.cos(a) * 7, 9, Math.sin(a) * 7), 0.05, steel, rigB); }
const cable = add(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), steel, 0, 0, 0, rigB);
// Fénix capsule (used at the shaft head and in the hero shot)
function capsule(parent) { const g = group(0, 0, 0, parent);
  add(new THREE.CylinderGeometry(0.27, 0.27, 2.5, 32), white, 0, 1.45, 0, g); add(new THREE.SphereGeometry(0.27, 24, 12, 0, TAU, 0, Math.PI / 2), white, 0, 2.7, 0, g);
  add(new THREE.CylinderGeometry(0.275, 0.275, 0.12, 32), red, 0, 2.1, 0, g); add(new THREE.CylinderGeometry(0.275, 0.275, 0.08, 32), mat(0x1f4fa8, 0.5), 0, 1.98, 0, g); add(new THREE.CylinderGeometry(0.275, 0.275, 0.12, 32), red, 0, 0.6, 0, g);
  add(new THREE.BoxGeometry(0.22, 0.55, 0.03), mat(0x222222, 0.3), 0, 1.55, 0.27, g);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10), mat(0x333333, 0.6), Math.cos(a) * 0.3, 2.4, Math.sin(a) * 0.3, g).rotation.z = Math.PI / 2; add(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10), mat(0x333333, 0.6), Math.cos(a) * 0.3, 0.35, Math.sin(a) * 0.3, g).rotation.z = Math.PI / 2; }
  add(new THREE.CylinderGeometry(0.2, 0.27, 0.2, 24), mat(0x555555, 0.5, 0.6), 0, 0.1, 0, g); rod(V(0, 2.95, 0), V(0, 3.3, 0), 0.03, steel, g); return g; }
const capB = capsule(rigB);
const rescued = []; for (let i = 0; i < 6; i++) { const p = person({ cloth: mat(0x1f3f2a, 0.85), helmet: 0xf2f2f2, s: 1 }); p.g.position.set(B.x - 4 + i * 1.6, B.y, B.z + 6); p.g.rotation.y = Math.PI; rescued.push(p); }

// ---------- underground: the refuge (with the drill breakthrough) ----------
const U = V(1000, 0, 0);
const caveG = new THREE.SphereGeometry(9, 96, 64); { const p = caveG.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const k = 1 + 0.18 * (fbm(p[i] * 0.35 + 3, p[i + 1] * 0.35 + p[i + 2] * 0.3, 4) - 0.5) * 2; p[i] *= k; p[i + 1] *= k * 0.5; p[i + 2] *= k; } caveG.computeVertexNormals(); }
const caveM = new THREE.MeshStandardMaterial({ color: 0x6a5240, roughness: 0.95, side: THREE.BackSide });
const cave = add(caveG, caveM, U.x, U.y, U.z); cave.castShadow = false;
add(new THREE.CircleGeometry(9, 48), mat(0x4a3a2c, 0.95), U.x, U.y + 0.01, U.z).rotation.x = -Math.PI / 2;
for (let i = 0; i < 26; i++) { const r = rock(0.3 + 0.6 * hash(i), 0x5a4636, i, scene, 1); const a = hash(i + 7) * TAU, d = 3 + 4.5 * hash(i + 9); r.position.set(U.x + Math.cos(a) * d, U.y + 0.1, U.z + Math.sin(a) * d); }
const miners = []; for (let i = 0; i < 9; i++) { const p = person({ cloth: mat([0x2a3a2a, 0x3a3020, 0x2a2a35][i % 3], 0.9), helmet: [0xf2f2f2, 0xe0a81a, 0xd9452e][i % 3], lamp: i < 5, s: 1 });
  const a = -0.6 + i * 0.32, d = 2.6 + 0.8 * hash(i); p.g.position.set(U.x + Math.sin(a) * d, U.y, U.z + Math.cos(a) * d); p.g.rotation.y = Math.atan2(-Math.sin(a), -Math.cos(a)); miners.push(p); }
const ceilY = U.y + 4.1;
const bit = group(U.x, ceilY + 2, U.z);
add(new THREE.ConeGeometry(0.16, 0.4, 16), mat(0x3e4246, 0.4, 0.9), 0, -0.2, 0, bit).rotation.x = Math.PI;
add(new THREE.CylinderGeometry(0.08, 0.08, 6, 12), steel, 0, 3, 0, bit);
const bitNote = add(new THREE.PlaneGeometry(0.34, 0.22), new THREE.MeshStandardMaterial({ map: noteTex(), side: THREE.DoubleSide, roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0.15 }), 0, 0.25, 0.1, bit);
const crate = add(new THREE.BoxGeometry(1.0, 0.6, 0.7), mat(0x6b4a2b, 0.8), U.x + 0.6, U.y + 0.3, U.z + 1.4);
const can = add(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 24), mat(0xb8bfc6, 0.3, 0.8), U.x + 0.35, U.y + 0.625, U.z + 1.5);
const spoon = group(U.x + 0.6, U.y + 0.61, U.z + 1.5); add(new THREE.SphereGeometry(0.025, 12, 8), mat(0xc9ced3, 0.2, 0.9), 0.1, 0, 0, spoon).scale.y = 0.3; rod(V(0.1, 0, 0), V(-0.08, 0.01, 0), 0.006, mat(0xc9ced3, 0.2, 0.9), spoon);
const milk = add(new THREE.CylinderGeometry(0.04, 0.035, 0.12, 20), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.45 }), U.x + 0.85, U.y + 0.66, U.z + 1.45);
add(new THREE.CylinderGeometry(0.036, 0.034, 0.03, 20), mat(0xfbfaf5, 0.5), U.x + 0.85, U.y + 0.615, U.z + 1.45);
const lampU = new THREE.PointLight(0xffb060, 5, 12, 1.8); lampU.position.set(U.x + 0.2, U.y + 1.6, U.z + 1.2); scene.add(lampU);
add(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 6, 3) }), U.x + 0.2, U.y + 1.6, U.z + 1.2, scene, false);
const chips = []; for (let i = 0; i < 28; i++) { const r = rock(0.05 + 0.08 * hash(i + 3), 0x7a6450, i + 50, scene, 0); chips.push(r); }
const spark = particles(160, new THREE.Color(6, 2.6, 0.7), 0.025), dust = particles(220, new THREE.Color(0.55, 0.48, 0.4), 0.09, { additive: false, opacity: 0.35 });
const BREAKS = [-0.12, 33.95, 65.08];

// ---------- the tunnel (collapse) ----------
const T = V(2000, 0, 0);
const tunG = new THREE.BoxGeometry(4.2, 3.6, 46, 24, 20, 120); { const p = tunG.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const k = fbm(p[i] * 0.6 + 4, p[i + 1] * 0.6 + p[i + 2] * 0.4, 4) - 0.5; p[i] *= 1 + 0.15 * k; p[i + 1] = p[i + 1] * (1 + 0.1 * k); } tunG.computeVertexNormals(); }
const tun = add(tunG, new THREE.MeshStandardMaterial({ color: 0x6a5240, roughness: 0.95, side: THREE.BackSide }), T.x, T.y + 1.8, T.z - 20); tun.castShadow = false;
for (let z = 0; z > -40; z -= 3.5) { const g = group(T.x, T.y, T.z + z); for (const x of [-1.7, 1.7]) add(new THREE.BoxGeometry(0.2, 3.2, 0.2), mat(0x7a5a38, 0.9), x, 1.6, 0, g); add(new THREE.BoxGeometry(3.6, 0.2, 0.22), mat(0x7a5a38, 0.9), 0, 3.15, 0, g);
  add(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 5, 2.5) }), 0, 2.95, 0.15, g, false); }
const tunLights = [0, -7, -14, -21].map((z) => { const l = new THREE.PointLight(0xffb060, 4, 9, 1.8); l.position.set(T.x, T.y + 2.8, T.z + z); scene.add(l); return l; });
const walkers = []; for (let i = 0; i < 5; i++) { const p = person({ cloth: mat(0x2a3a2a, 0.9), helmet: [0xf2f2f2, 0xe0a81a][i % 2], lamp: true }); p.g.position.set(T.x - 0.8 + 0.5 * (i % 3), T.y, T.z - 6 - i * 2.2); p.g.rotation.y = 0; walkers.push(p); }
const falling = []; for (let i = 0; i < 40; i++) { const r = rock(0.2 + 0.5 * hash(i + 11), 0x6a5240, i + 90, scene, 1); falling.push(r); }

// ---------- capsule studio (hero shot) ----------
const P = V(3000, 0, 0);
add(new THREE.PlaneGeometry(40, 40), mat(0x1a1d24, 0.5, 0.2), P.x, P.y, P.z).rotation.x = -Math.PI / 2;
const heroCap = capsule(group(P.x, P.y, P.z));
for (const [x, z, c] of [[-3, 3, 0xfff0e0], [3, 2, 0x9fc0ff]]) { const l = new THREE.SpotLight(c, 80, 20, 0.45, 0.6, 1.5); l.position.set(P.x + x, P.y + 5, P.z + z); l.target.position.set(P.x, P.y + 1.4, P.z); l.castShadow = true; scene.add(l, l.target); }

// ---------- real photo cards (paper) ----------
const [cNote, cMine, cCap, cAv, c33] = await Promise.all(['img/note.png', 'img/mine.jpg', 'img/capsule.jpg', 'img/avalos.jpg', 'img/the33.jpg'].map((s) => photoCard(s, { w: 1 })));
const CARDS = [[cNote, 4.55, 8.8, -0.0, 0.18, 1.05, -0.05], [cNote, 38.9, 40.9, 0.05, 0.2, 0.95, 0.06], [cMine, 9.6, 13.8, 0.0, 0.05, 1.0, -0.04],
  [cCap, 47.4, 51.6, -0.12, 0.2, 0.75, 0.05], [cAv, 53.5, 56.9, 0.1, 0.16, 0.8, -0.05], [c33, 57.2, 60.2, 0.0, 0.08, 1.05, 0.03]];

// ---------- camera keys ----------
const UND = { sky: false, sun: 0, ambI: 0.2, amb: '#5a4030', exposure: 1.5, fog: 0.012, fogCol: '#0a0604', dof: 1.2 };
const DUSK = { e: 7, az: 2.3, fog: 0.0025 }, DAY = { e: 24, az: 2.0, fog: 0.0018 }, NIGHT = { e: -14, az: 2.0, fog: 0.004, ambI: 0.18, exposure: 1.7 };
const HOOK = [U.clone().add(V(2.3, 1.15, 3.6)), U.clone().add(V(0, 3.3, 0)), 40, UND];
const KEYS = [
  [-9, -9, ...HOOK],
  [3.92, 3.92, A.clone().add(V(3.2, 2.0, 5)), A.clone().add(V(0, 2.4, 0)), 36, DUSK],
  [4.0, 8.8, A.clone().add(V(2.0, 1.8, 3.6)), A.clone().add(V(0, 2.0, 0)), 34, DUSK],
  [8.88, 8.88, V(90, 55, 140), V(-10, 8, 0), 42, { e: 9, az: 2.4, fog: 0.0016 }],
  [8.95, 13.7, V(50, 38, 95), V(-10, 6, -10), 40, { e: 9, az: 2.4, fog: 0.0016 }],
  [13.84, 13.84, T.clone().add(V(0.6, 1.6, 2.5)), T.clone().add(V(0, 1.5, -10)), 40, UND],
  [13.9, 18.4, T.clone().add(V(0.3, 1.5, 0.5)), T.clone().add(V(0, 1.4, -10)), 40, UND],
  [18.5, 18.5, CAMP.clone().add(V(14, 4, 26)), CAMP.clone().add(V(0, 1.5, 4)), 38, NIGHT],
  [18.6, 22.0, CAMP.clone().add(V(8, 2.6, 19)), CAMP.clone().add(V(0, 1.4, 4)), 36, NIGHT],
  [22.08, 22.08, U.clone().add(V(-3.2, 1.6, 5.2)), U.clone().add(V(0.3, 1.0, 0.5)), 40, UND],
  [22.2, 26.0, U.clone().add(V(-2.2, 1.4, 4.2)), U.clone().add(V(0.3, 1.0, 0.8)), 40, UND],
  [26.12, 26.12, U.clone().add(V(1.75, 1.05, 2.0)), U.clone().add(V(0.6, 0.62, 1.45)), 32, UND],
  [26.2, 32.4, U.clone().add(V(1.5, 0.95, 1.75)), U.clone().add(V(0.6, 0.64, 1.45)), 30, UND],
  [32.54, 32.54, U.clone().add(V(-2.6, 1.0, -2.2)), U.clone().add(V(0, 3.4, 0)), 40, UND],
  [32.6, 37.5, U.clone().add(V(-1.6, 1.3, -1.4)), U.clone().add(V(0, 2.7, 0)), 38, UND],
  [37.58, 37.58, A.clone().add(V(2.5, 1.4, 4.2)), A.clone().add(V(0, 2.5, 0)), 36, DAY],
  [38.4, 40.9, A.clone().add(V(4.5, 3.5, 10)), A.clone().add(V(0, 2.2, 2)), 38, DAY],
  [40.96, 40.96, B.clone().add(V(14, 4, 22)), B.clone().add(V(0, 9, 0)), 40, NIGHT],
  [41.0, 46.5, B.clone().add(V(9, 2.5, 15)), B.clone().add(V(0, 12, 0)), 40, NIGHT],
  [46.58, 46.58, P.clone().add(V(2.4, 1.6, 6.2)), P.clone().add(V(0, 1.5, 0)), 34, { sky: false, sun: 0, ambI: 0.15, exposure: 1.2, fog: 0, fogCol: '#000000' }],
  [46.7, 51.6, P.clone().add(V(-2.0, 2.2, 5.4)), P.clone().add(V(0, 1.6, 0)), 34, { sky: false, sun: 0, ambI: 0.15, exposure: 1.2, fog: 0, fogCol: '#000000' }],
  [51.68, 51.68, B.clone().add(V(4.5, 1.6, 7.5)), B.clone().add(V(0, 2.5, 0)), 38, NIGHT],
  [51.8, 56.8, B.clone().add(V(3.2, 1.3, 5.6)), B.clone().add(V(0, 2.2, 0)), 38, NIGHT],
  [56.96, 56.96, CAMP.clone().add(V(12, 5, 28)), CAMP.clone().add(V(0, 3, 0)), 40, { e: 3, az: 0.6, fog: 0.003 }],
  [57.0, 60.2, CAMP.clone().add(V(6, 3.5, 20)), CAMP.clone().add(V(0, 3, 0)), 38, { e: 5, az: 0.6, fog: 0.003 }],
  [60.26, 60.26, U.clone().add(V(-3.6, 1.0, 5.0)), U.clone().add(V(0, 2.4, 0)), 40, UND],
  [60.4, 64.6, ...HOOK],
];

const F = film({ total, keys: KEYS, exposure: 1.0,
  hits: [[-0.12, 0.04], [3.92, 0.02], [14.86, 0.08], [15.3, 0.05], [33.95, 0.05], [37.6, 0.03], [56.42, 0.03], [65.08, 0.04]],
  titles: [[-1, 3.85, '17 दिन बाद…', 110, '#ffd24a', 300, '700 मीटर नीचे से'], [8.95, 13.7, 'चिली • 2010', 96, '#ffffff', 300, 'सैन होज़े खदान'],
    [16.35, 18.4, '33 फँसे', 130, '#ff6a50', 300], [40.96, 46.4, '~2 महीने', 120, '#ffffff', 300, '700 मीटर ड्रिलिंग'], [46.62, 51.6, 'FÉNIX', 120, '#e9eef5', 300],
    [57.0, 60.1, '69 दिन', 150, '#ffd24a', 300, '33 में से 33 ज़िंदा'], [60.4, 999, '17 दिन बाद…', 110, '#ffd24a', 300, '700 मीटर नीचे से']],
  pills: [[18.7, 21.9, '17 दिन • कोई ख़बर नहीं', 300, '#c9d2e0'], [26.3, 32.3, 'हर 48 घंटे: 2 चम्मच टूना + 1 घूँट दूध', 300]],
  labels: [[4.7, 8.6, 'असली पर्ची', A.clone().add(V(0, 2.4, 0)), 0, -340, '#ffd24a']],
  overlay: (g, t, { txt, pill }) => {
    if (t > 24.9 && t < 32.45) { const d = Math.min(17, 1 + Math.floor(lerp(0, 16.99, seg(t, 24.9, 32.3)))); txt('दिन ' + d, 540, 470, 120, d >= 17 ? '#5dff8a' : '#ffd24a', 1, 1 + 0.06 * Math.max(0, 1 - ((t - 24.9) * 2.2 % 1) * 4), 12); }
    if (t > 32.54 && t < 37.5) txt('दिन 17', 540, 300, 120, '#5dff8a', seg(t, 32.54, 32.8), 1, 12);
    if (t > 49.4 && t < 51.6) pill('चौड़ाई: 54 cm', 540, 470, '#ffd24a', seg(t, 49.4, 49.7));
    if (t > 53.4 && t < 56.9) { const n = Math.min(33, Math.max(1, Math.ceil(seg(t, 53.5, 56.4) * 33))); txt(n + ' / 33', 540, 330, 140, n === 33 ? '#5dff8a' : '#ffffff', seg(t, 53.4, 53.7), 1, 12); }
    if (t > 53.5 && t < 56.9) pill('पहले बाहर: फ़्लोरेन्सियो अवालोस', 540, 1300, '#ffd24a', seg(t, 53.5, 53.8));
  } });
const { on, onCam } = F;

// ---------- animation ----------
const tv = V(0, 0, 0), fw = V(0, 0, 0);
const M = new THREE.Matrix4(), q = new THREE.Quaternion();
on((t) => {
  // flags wave
  for (const f of flags) { const p = f.geometry.attributes.position.array, b = f.userData.base; for (let i = 0; i < p.length; i += 3) { const x = b[i]; p[i + 2] = Math.sin(x * 4 - t * 6 + f.id) * 0.08 * x; } f.geometry.attributes.position.needsUpdate = true; }
  // rig A: rod pulled up with the note (hook + day 17)
  const upA = t < 30 ? rise(t, 3.92, 5.2, 0, 2.6, easeOut) : rise(t, 37.58, 38.8, 0, 2.6, easeOut);
  rodA.position.y = 7 + upA; noteA.position.y = upA - 0.1; noteA.visible = (t > 3.9 && t < 9) || (t > 37.5 && t < 41); noteA.rotation.y = 0.2 * Math.sin(t * 2);
  crowd.forEach((p, i) => { const cheer = t > 38.3 && t < 41 ? 1 : t > 4.2 && t < 9 ? 0.5 : 0; const ph = t * 9 + i * 1.3;
    p.armL.rotation.set(0, 0, cheer ? -2.6 + 0.3 * Math.sin(ph) : 0.08); p.armR.rotation.set(0, 0, cheer ? 2.6 + 0.3 * Math.sin(ph + 1) : -0.08); p.g.position.y = G(p.g.position.x, p.g.position.z).y + cheer * 0.12 * Math.max(0, Math.sin(ph * 0.7)); });
  // camp
  campLights.forEach((l, i) => (l.intensity = 5 + 1.5 * Math.sin(t * 11 + i) * Math.sin(t * 7.3 + i)));
  families.forEach((p, i) => { const c = t > 57 ? 1 : 0; p.armL.rotation.set(0, 0, c ? -2.5 + 0.3 * Math.sin(t * 8 + i) : 0.1); p.armR.rotation.set(0, 0, c ? 2.5 + 0.3 * Math.sin(t * 8 + i + 1) : -0.1); });
  // underground: drill breakthrough at BREAKS, then the note goes up on day 17
  let by = ceilY + 2.0, age = 99;
  for (const b of BREAKS) { const d = t - b; if (d > -2.5 && d < 3.6) { age = d; by = ceilY + 0.6 - 1.1 * smooth(seg(d, -0.6, 0.6)); } }
  if (t > 34.1 && t < 37.6) by = rise(t, 34.1, 34.9, ceilY - 0.5, ceilY - 1.3, easeOut);
  if (t > 37.6 && t < 40) by = rise(t, 37.6, 38.6, ceilY - 1.3, ceilY + 3, easeInOut);
  bit.position.y = by; bit.rotation.y = t * 9; bitNote.visible = t > 36.4 && t < 40; bitNote.rotation.y = -t * 9;
  // sparks, dust, chips from the ceiling
  const sl = 0.55;
  for (let i = 0; i < spark.n; i++) { const a = age * sl, life = 0.3 + 0.5 * hash(i); if (a < 0 || a > life) { spark.pos[i * 3 + 1] = -999; continue; }
    const an = hash(i * 3) * TAU, v = 2 + 5 * hash(i * 7); spark.pos[i * 3] = U.x + Math.cos(an) * v * a; spark.pos[i * 3 + 1] = ceilY - 0.1 - 2 * a - 4.9 * a * a; spark.pos[i * 3 + 2] = U.z + Math.sin(an) * v * a; }
  spark.geo.attributes.position.needsUpdate = true;
  for (let i = 0; i < dust.n; i++) { const a = Math.max(0, age) * 0.4; if (age < 0 || age > 4) { dust.pos[i * 3 + 1] = -999; continue; } const an = hash(i + 33) * TAU, v = 0.4 + 1.4 * hash(i + 34);
    dust.pos[i * 3] = U.x + Math.cos(an) * v * a * 1.5; dust.pos[i * 3 + 1] = ceilY - 0.2 - 1.6 * a * hash(i + 35); dust.pos[i * 3 + 2] = U.z + Math.sin(an) * v * a * 1.5; }
  dust.geo.attributes.position.needsUpdate = true;
  chips.forEach((c, i) => { const a = age * 0.6; if (age < 0 || age > 3) { c.visible = false; return; } c.visible = true; const an = hash(i + 70) * TAU, v = 0.3 + 1.2 * hash(i + 71);
    c.position.set(U.x + Math.cos(an) * v * a, Math.max(U.y + 0.05, ceilY - 0.1 - 4.9 * a * a), U.z + Math.sin(an) * v * a); c.rotation.set(a * 7, a * 5, 0); });
  miners.forEach((p, i) => { const look = age > -0.5 && age < 3.6 ? 1 : 0; p.g.rotation.x = 0; p.armR.rotation.set(look && i % 3 === 0 ? -2.4 + 0.3 * Math.sin(t * 9 + i) : 0.1, 0, 0);
    if (p.light) p.light.target.position.set(0, 1.4 + look * 3, -2 + look * 1.6); });
  miners.forEach((p) => { if (p.light && t > 34 && t < 37.6) p.light.target.position.set(0, 3.2, -2.4); });
  lampU.intensity = 4.5 + Math.sin(t * 13) * Math.sin(t * 7.3) * 0.8;
  // rations appear
  can.visible = t > 29.5 || t < 22; spoon.visible = t > 29.9 || t < 22; milk.visible = t > 31.0 || t < 22;
  // tunnel collapse
  falling.forEach((r, i) => { const a = Math.max(0, t - 14.86 - 0.06 * i); const z0 = T.z - 9 - 6 * hash(i + 3);
    r.position.set(T.x - 1.6 + 3.2 * hash(i + 4), Math.max(T.y + 0.2 * hash(i), T.y + 3.4 - 4.9 * a * a), z0); r.rotation.set(a * 3, a * 2 * hash(i), 0); r.visible = t > 13.5 && t < 19; });
  walkers.forEach((p, i) => { walk(p, t * 7 + i, t < 14.86 ? 1 : 0); p.g.position.z = T.z - 6 - i * 2.2 - (t < 14.86 ? (t - 13.84) * 0.9 : 0.9); });
  tunLights.forEach((l, i) => (l.intensity = t > 14.86 && t < 18.5 ? (hash(Math.floor(t * 14) + i) > 0.5 ? 4 : 0.6) : 4));
  // rescue rig B: drill rotation at night (41-46), capsule trips (51.7-56.9)
  wheel.rotation.z = t * (t > 51.7 ? 4 : 0.5);
  const trips = seg(t, 53.5, 56.4) * 33, f = trips % 1, onCap = t > 51.68 && t < 57;
  capB.visible = onCap; capB.position.y = t < 53.5 ? rise(t, 51.7, 53.4, -3, 0.25, easeOut) : (f < 0.5 ? 0.25 : 0.25 - 3 * (f - 0.5) * 2);
  cable.visible = onCap; cable.position.set(0, (capB.position.y + 3.3 + 22.6) / 2, 0); cable.scale.y = 22.6 - capB.position.y - 3.3;
  rescued.forEach((p, i) => { p.g.visible = t > 53.5 + i * 0.5 && t < 57; p.armR.rotation.set(0, 0, 2.6 + 0.3 * Math.sin(t * 8 + i)); });
  heroCap.rotation.y = t * 0.5;
});
// paper cards in front of the lens
onCam((t, cam) => {
  for (const [c, a, b, dx, dy, s, rz] of CARDS) { /* reset */ }
  const shown = new Set();
  for (const [c, a, b, dx, dy, s, rz] of CARDS) {
    if (t < a || t > b) continue; shown.add(c);
    const k = backOut(seg(t, a, a + 0.4), 1.8), out = smooth(seg(t, b - 0.3, b));
    cam.getWorldDirection(fw); const d = 2.2;
    c.position.copy(cam.position).addScaledVector(fw, d); c.quaternion.copy(cam.quaternion);
    c.translateX(dx * d * 0.4); c.translateY(dy * d * 0.4 + (1 - k) * -1.2 + out * -1.6); c.rotateZ(rz + 0.05 * Math.sin(t * 1.3));
    c.scale.setScalar(Math.max(0.001, s * 0.72 * k)); c.visible = true;
  }
  for (const c of [cNote, cMine, cCap, cAv, c33]) if (!shown.has(c)) c.visible = false;
});
