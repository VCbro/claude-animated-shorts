// THAM LUANG 2018 — cinematic 3D (cine.js). Real photos (paper cards) only at fact beats.
import { THREE, V, TAU, film, scene, mat, add, rod, group, terrain, rock, person, walk, photoCard, particles, fbm, pop, rise,
  clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';

const total = 68.0;
// ---------- the cave (one long flooded passage ending at the ledge) ----------
const CV = V(1000, 0, 0);
const path = new THREE.CatmullRomCurve3([V(0, 2, 12), V(1.5, 2.1, -8), V(-2, 2.4, -26), V(1.2, 2.2, -44), V(0, 2.6, -62), V(-0.5, 2.8, -70)].map((p) => p.add(CV)));
const tubeG = new THREE.TubeGeometry(path, 260, 4.2, 48, false); { const p = tubeG.attributes.position.array; for (let i = 0; i < p.length; i += 3) { const n = fbm(p[i] * 0.3 + 3, p[i + 1] * 0.4 + p[i + 2] * 0.3, 4) - 0.5; const c = path.getPointAt(clamp((CV.z + 12 - p[i + 2]) / 82, 0, 1));
  p[i] = c.x + (p[i] - c.x) * (1 + 0.35 * n); p[i + 1] = c.y + (p[i + 1] - c.y) * (0.75 + 0.3 * n); } tubeG.computeVertexNormals(); }
const caveMat = new THREE.MeshStandardMaterial({ color: 0x55605a, roughness: 0.9, side: THREE.BackSide });
const caveMesh = add(tubeG, caveMat); caveMesh.castShadow = false;
const LEDGE = CV.clone().add(V(0, 0, -60));
const ledge = rock(3.2, 0x5a6058, 7, scene, 3); ledge.scale.set(1.2, 0.35, 0.9); ledge.position.copy(LEDGE).add(V(0, -0.2, -1.5));
const LEDGE_Y = LEDGE.y + 1.2;
const waterG = new THREE.PlaneGeometry(14, 96, 40, 220); waterG.rotateX(-Math.PI / 2); const wBase = waterG.attributes.position.array.slice();
const water = add(waterG, new THREE.MeshPhysicalMaterial({ color: 0x2a5a52, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.85, side: THREE.DoubleSide, envMapIntensity: 1 }), CV.x, 0, CV.z - 30, scene, false);
const drips = particles(80, new THREE.Color(0.6, 0.9, 1.1), 0.03, { additive: false, opacity: 0.9 });
function kid(i) { const p = person({ cloth: mat(0x1a2a3a, 0.85), top: mat([0xc8282c, 0xd9d4c8][i % 2], 0.8), s: 0.78, hair: 0x111111 }); return p; }
const kids = Array.from({ length: 12 }, (_, i) => kid(i));
const coach = person({ cloth: mat(0x2a2a2a, 0.85), top: mat(0x3a5a3a, 0.8), s: 0.95, hair: 0x111111 });
const team = [...kids, coach];
const caveLight = new THREE.PointLight(0x9fd8ff, 5, 20, 1.4); scene.add(caveLight);
const runLight = new THREE.PointLight(0xffe0b0, 0, 12, 1.5); scene.add(runLight);
const fill = new THREE.PointLight(0x7fd6ff, 0, 10, 1.4); scene.add(fill);
// divers
function diver() { const p = person({ cloth: mat(0x111111, 0.4), top: mat(0x111111, 0.4), s: 1 });
  add(new THREE.CylinderGeometry(0.11, 0.11, 0.6, 16), mat(0xe0a81a, 0.4, 0.5), 0.0, 1.35, 0.2, p.g); add(new THREE.BoxGeometry(0.2, 0.1, 0.05), mat(0x7fd6ff, 0.1, 0.5), 0, 1.72, -0.11, p.g);
  const L = new THREE.SpotLight(0xfff2c8, 0, 18, 0.32, 0.4, 1.3); L.position.set(0.1, 1.7, -0.2); L.target.position.set(0, 1.0, -6); p.g.add(L, L.target); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); p.torch = L;
  add(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 9, 7) }), 0.1, 1.7, -0.22, p.g, false); return p; }
const D1 = diver(), D2 = diver();
const towBoy = person({ cloth: mat(0x1a2a3a, 0.85), top: mat(0xc8282c, 0.8), s: 0.78 });
const bubbles = particles(260, new THREE.Color(0.8, 1.1, 1.3), 0.03, { additive: true, opacity: 0.8 });
// ---------- jungle outside ----------
const JX = V(3000, 0, 0);
const hJ = (x, z) => { const dx = x - JX.x, dz = z - JX.z; return 28 * smooth(clamp((-dz - 6) / 40)) * (0.7 + 0.5 * fbm(dx * 0.02, dz * 0.02, 3)) + 2 * fbm(dx * 0.05, dz * 0.05, 3); };
terrain(hJ, (x, z, y) => { const n = fbm(x * 0.08, z * 0.08, 3); return [0.16 + 0.08 * n, 0.26 + 0.1 * n, 0.12 + 0.04 * n]; }, { size: 600, seg: 220, cx: JX.x, cz: JX.z });
const G = (x, z) => V(JX.x + x, hJ(JX.x + x, JX.z + z), JX.z + z);
const MOUTH = G(0, -12).add(V(0, 0, 0));
add(new THREE.CircleGeometry(3.2, 40, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x020303 }), MOUTH.x, MOUTH.y - 0.5, MOUTH.z + 0.6, scene, false);
const arch = add(new THREE.TorusGeometry(3.6, 0.9, 10, 30, Math.PI), mat(0x4a4a40, 0.95), MOUTH.x, MOUTH.y - 0.5, MOUTH.z + 0.6);
const leafM = [0x2f5a2a, 0x3d6b30, 0x24481f].map((c) => mat(c, 0.9));
for (let i = 0; i < 90; i++) { const x = -60 + 120 * hash(i + 1), z = -40 + 70 * hash(i + 2); if (Math.abs(x) < 8 && z > -16 && z < 14) continue; const p = G(x, z), s = 0.8 + 0.8 * hash(i);
  add(new THREE.CylinderGeometry(0.2 * s, 0.3 * s, 6 * s, 7), mat(0x4a3424, 0.9), p.x, p.y + 3 * s, p.z); for (let k = 0; k < 3; k++) add(new THREE.IcosahedronGeometry(2.0 * s, 1), leafM[(i + k) % 3], p.x + (k - 1) * 0.9 * s, p.y + 6 * s + k * 0.6, p.z + (hash(i + k) - 0.5) * s); }
function bike(x, z, r) { const p = G(x, z), g = group(p.x, p.y, p.z); g.rotation.y = r; const fm = mat([0xc8282c, 0x2f6fd9, 0x222222, 0xe0a81a][Math.floor(hash(x) * 4)], 0.5, 0.3);
  for (const dx of [-0.5, 0.5]) add(new THREE.TorusGeometry(0.32, 0.03, 8, 24), mat(0x111111, 0.6), dx, 0.33, 0, g); rod(V(-0.5, 0.33, 0), V(0, 0.75, 0), 0.025, fm, g); rod(V(0, 0.75, 0), V(0.5, 0.33, 0), 0.025, fm, g); rod(V(0, 0.75, 0), V(0.45, 0.95, 0), 0.025, fm, g); rod(V(-0.1, 0.33, 0), V(0, 0.75, 0), 0.025, fm, g); return g; }
for (let i = 0; i < 11; i++) bike(-5 + i * 0.75, -6.5 + 0.6 * hash(i), 0.3 * (hash(i + 3) - 0.5) + Math.PI / 2);
const ball = add(new THREE.SphereGeometry(0.11, 20, 14), mat(0xf2f2f2, 0.5), 0, 0, 0);
const extWater = add(new THREE.PlaneGeometry(14, 12), new THREE.MeshPhysicalMaterial({ color: 0x5a4a30, roughness: 0.2, transparent: true, opacity: 0.9 }), MOUTH.x, 0, MOUTH.z + 3, scene, false); extWater.rotation.x = -Math.PI / 2;
const rain = particles(2500, new THREE.Color(0.75, 0.8, 0.9), 0.05, { additive: false, opacity: 0.55 });
// rescue camp: pumps, pipes, work lights, crowd
const CAMP = G(16, 6);
for (let i = 0; i < 4; i++) { add(new THREE.BoxGeometry(1.6, 1.1, 1.0), mat(0x2f6fd9, 0.5, 0.3), CAMP.x + i * 2.2, CAMP.y + 0.55, CAMP.z); rod(V(CAMP.x + i * 2.2, CAMP.y + 0.3, CAMP.z - 0.5), V(MOUTH.x + 1 + i * 0.3, MOUTH.y - 0.3, MOUTH.z + 1), 0.12, mat(0x1a5a9a, 0.5)); }
const workL = []; for (let i = 0; i < 3; i++) { const p = G(6 + i * 6, -2 + i * 2), l = new THREE.SpotLight(0xfff0d8, 50, 40, 0.6, 0.5, 1.4); l.position.set(p.x, p.y + 6, p.z); l.target.position.copy(MOUTH); scene.add(l, l.target); workL.push(l);
  rod(p, p.clone().add(V(0, 6, 0)), 0.06, mat(0x888888, 0.5, 0.6)); add(new THREE.BoxGeometry(0.6, 0.4, 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 8.5, 7) }), p.x, p.y + 6, p.z, scene, false); }
const crowd = Array.from({ length: 22 }, (_, i) => { const p = person({ cloth: mat([0x2a3a2a, 0x3a3a4a, 0xd9b23a, 0x8a2a2a][i % 4], 0.85), helmet: i % 3 ? null : 0xe0a81a, s: 0.95 + 0.1 * hash(i) });
  p.g.position.copy(G(6 + 16 * hash(i + 5), 4 + 10 * hash(i + 6))); p.g.rotation.y = Math.atan2(MOUTH.x - p.g.position.x, MOUTH.z - p.g.position.z) + Math.PI; return p; });
// memorial
const MEM = G(-20, 14);
add(new THREE.BoxGeometry(3.4, 0.9, 1.2), mat(0xf2f0ea, 0.7), MEM.x, MEM.y + 0.45, MEM.z);
for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 18), mat(0xe0a81a, 0.35, 0.6), MEM.x - 1.2 + i * 0.6, MEM.y + 1.35, MEM.z - 0.2);
const flames = []; for (let i = 0; i < 9; i++) { const x = MEM.x - 1.5 + i * 0.37, z = MEM.z + 0.35; add(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 10), mat(0xf4efe2, 0.6), x, MEM.y + 0.98, z);
  flames.push(add(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 4.5, 1.4) }), x, MEM.y + 1.09, z, scene, false)); }
const memL = new THREE.PointLight(0xffa040, 4, 6, 2); memL.position.set(MEM.x, MEM.y + 1.5, MEM.z + 0.8); scene.add(memL);
for (let i = 0; i < 14; i++) add(new THREE.SphereGeometry(0.05, 8, 6), mat([0xf2f2f2, 0xf2c230, 0xd9342b][i % 3], 0.6), MEM.x - 1.5 + 3 * hash(i + 2), MEM.y + 0.93, MEM.z + 0.45 + 0.1 * hash(i));

// ---------- real photo cards ----------
const [cMap, cDiv, cPump, cCountry, cGov] = await Promise.all(['img/map.png', 'img/divers.jpg', 'img/pumping.jpg', 'img/countries.jpg', 'img/governor.jpg'].map((s) => photoCard(s, { w: 1 })));
const CARDS = [[cMap, 19.0, 21.1, 0, 0.14, 0.85, -0.04], [cDiv, 34.6, 38.6, 0.0, 0.14, 0.95, 0.04], [cCountry, 45.9, 47.6, 0, 0.12, 1.0, -0.03], [cPump, 47.7, 49.0, 0, 0.12, 0.95, 0.04], [cGov, 61.2, 63.1, 0, 0.12, 0.95, -0.03]];

// ---------- camera ----------
const CAVE = { sky: false, sun: 0, ambI: 0.24, amb: '#3a6a6a', exposure: 1.7, fog: 0.035, fogCol: '#020606', dof: 1.0 };
const UNDER = { sky: false, sun: 0, ambI: 0.3, amb: '#1a6a7a', exposure: 1.6, fog: 0.07, fogCol: '#06303a', dof: 0.6 };
const JUN = { e: 22, az: 2.0, fog: 0.004 }, STORM = { e: 10, az: 2.0, fog: 0.012, ambI: 0.35, sunCol: '#8a9aaa', sun: 0.6, exposure: 1.4 }, NIGHT = { e: -14, az: 2.0, fog: 0.008, ambI: 0.2, exposure: 1.6 };
const L = LEDGE;
const HOOK = [L.clone().add(V(2.2, 2.6, 6.2)), L.clone().add(V(0, 1.2, -1.8)), 40, CAVE];
const KEYS = [
  [-9, -9, ...HOOK],
  [3.3, 3.3, G(14, 26).add(V(0, 7, 0)), MOUTH.clone().add(V(0, 1, 6)), 40, JUN],
  [3.4, 11.9, G(6, 13).add(V(0, 2.5, 0)), MOUTH.clone().add(V(0, 0.8, 2)), 38, JUN],
  [12.06, 12.06, G(-6, 14).add(V(0, 2.2, 0)), MOUTH.clone().add(V(0, 0.5, 2)), 40, STORM],
  [12.2, 17.0, G(-3, 9).add(V(0, 1.4, 0)), MOUTH.clone().add(V(0, 0.4, 1)), 38, STORM],
  [17.1, 17.1, path.getPointAt(0.42).add(V(0.6, -0.2, 3)), path.getPointAt(0.55).add(V(0, -1.2, 0)), 42, CAVE],
  [17.2, 21.1, path.getPointAt(0.6).add(V(0.4, -0.3, 2)), path.getPointAt(0.78).add(V(0, -1.2, 0)), 42, CAVE],
  [21.22, 21.22, L.clone().add(V(-3.0, 2.4, 7.0)), L.clone().add(V(0, 0.6, -1.5)), 40, { ...CAVE, ambI: 0.08, exposure: 1.9 }],
  [21.3, 26.1, L.clone().add(V(-1.6, 1.9, 5.4)), L.clone().add(V(0, 0.6, -1.5)), 38, { ...CAVE, ambI: 0.08, exposure: 1.9 }],
  [26.26, 26.26, L.clone().add(V(1.6, 0.9, 8.0)), L.clone().add(V(0, 0.8, -1.0)), 40, { ...CAVE, ambI: 0.08, exposure: 1.9 }],
  [26.4, 30.2, L.clone().add(V(1.1, 0.8, 6.6)), L.clone().add(V(0, 0.9, -1.0)), 40, { ...CAVE, ambI: 0.08, exposure: 1.9 }],
  [30.3, 30.3, L.clone().add(V(3.4, 1.8, 8.0)), L.clone().add(V(0, 1.0, -1.0)), 40, CAVE],
  [30.4, 32.9, L.clone().add(V(2.6, 1.6, 6.8)), L.clone().add(V(0, 1.0, -1.0)), 40, CAVE],
  [33.0, 33.0, path.getPointAt(0.5).add(V(0.5, -2.0, 4)), path.getPointAt(0.55).add(V(0, -2.2, 0)), 44, UNDER],
  [33.1, 38.7, path.getPointAt(0.56).add(V(0.4, -2.0, 3)), path.getPointAt(0.62).add(V(0, -2.2, 0)), 44, UNDER],
  [38.8, 38.8, MEM.clone().add(V(2.4, 1.6, 4.2)), MEM.clone().add(V(0, 1.1, 0)), 36, NIGHT],
  [38.9, 45.6, MEM.clone().add(V(1.2, 1.35, 2.8)), MEM.clone().add(V(0, 1.15, 0)), 34, NIGHT],
  [45.7, 45.7, CAMP.clone().add(V(10, 8, 18)), MOUTH.clone().add(V(4, 0, 4)), 40, NIGHT],
  [45.8, 49.0, CAMP.clone().add(V(4, 4, 12)), MOUTH.clone().add(V(4, 0.5, 4)), 40, NIGHT],
  [49.06, 49.06, path.getPointAt(0.3).add(V(1.0, -1.8, -3.0)), path.getPointAt(0.2).add(V(0, -2.0, 0)), 44, UNDER],
  [49.2, 56.0, path.getPointAt(0.22).add(V(1.0, -1.8, -2.5)), path.getPointAt(0.12).add(V(0, -2.0, 0)), 44, UNDER],
  [56.12, 56.12, G(4, 10).add(V(0, 1.6, 0)), MOUTH.clone().add(V(0, 0.8, 2)), 38, { e: 10, az: 0.8, fog: 0.008 }],
  [56.2, 59.4, G(2.5, 6).add(V(0, 1.4, 0)), MOUTH.clone().add(V(0, 0.8, 2)), 38, { e: 10, az: 0.8, fog: 0.008 }],
  [59.46, 59.46, G(12, 20).add(V(0, 6, 0)), CAMP.clone().add(V(-6, 1, -2)), 40, { e: 14, az: 0.8, fog: 0.005 }],
  [59.6, 63.1, G(8, 14).add(V(0, 3, 0)), CAMP.clone().add(V(-6, 1.2, -2)), 40, { e: 14, az: 0.8, fog: 0.005 }],
  [63.18, 63.18, L.clone().add(V(4.6, 1.8, 8.5)), L.clone().add(V(0, 1.0, -1.2)), 40, CAVE],
  [63.3, 67.6, ...HOOK],
];
const F = film({ total, keys: KEYS, exposure: 1.0, hits: [[0.84, 0.02], [16.38, 0.03], [28.36, 0.02], [31.16, 0.03], [58.82, 0.03]],
  titles: [[-1, 3.2, 'पानी बढ़ रहा है', 104, '#8fdcff', 300, '12 बच्चे + 1 कोच'], [3.4, 11.9, '23 जून 2018', 104, '#ffffff', 300, 'थाम लुआंग गुफा, थाईलैंड'],
    [14.7, 17.0, 'रास्ता बंद!', 130, '#ff6a50', 300], [17.2, 21.1, '~4 km अंदर', 120, '#ffd24a', 300], [26.3, 30.2, 'दिन 10', 130, '#ffd24a', 300],
    [36.5, 38.7, 'तैरना नहीं आता', 100, '#ffffff', 300], [38.9, 45.6, 'समन कुनान', 110, '#ffd9a0', 300, 'पूर्व थाई नेवी SEAL • 6 जुलाई 2018'],
    [59.6, 63.1, '13 / 13', 150, '#5dff8a', 300, '18 दिन बाद • सब ज़िंदा'], [63.3, 999, 'पानी बढ़ रहा है', 104, '#8fdcff', 300, '12 बच्चे + 1 कोच']],
  pills: [[6.6, 11.9, 'वाइल्ड बोअर्स • 11–16 साल • कोच 25', 1300], [45.9, 49.0, '10,000+ लोग • कई देशों के गोताखोर', 1300], [49.3, 56.0, '8 – 10 जुलाई', 300, '#8fdcff']],
  labels: [[4.5, 11.8, 'बाहर खड़ी साइकिलें', G(-1, -6.5).add(V(0, 1, 0)), -160, -260, '#ffd24a']],
  overlay: (g, t, { txt, pill }) => {
    if (t > 21.3 && t < 26.2) { const d = Math.min(9, 1 + Math.floor(lerp(0, 8.99, seg(t, 21.3, 25.9)))); txt('दिन ' + d, 540, 330, 130, '#c9d2e0', seg(t, 21.3, 21.6), 1 + 0.05 * Math.max(0, 1 - ((t - 21.3) * 1.9 % 1) * 4), 12); }
    if (t > 30.3 && t < 32.9) { pill('"कितने हो?"', 360, 560, '#ffffff', seg(t, 30.3, 30.6), 60); pill('"13!"', 720, 700, '#5dff8a', seg(t, 31.1, 31.4), 70); }
    if (t > 50.6 && t < 56.0) { const n = Math.min(13, Math.max(1, Math.ceil(seg(t, 50.6, 55.8) * 13))); txt(n + ' / 13', 540, 470, 130, n === 13 ? '#5dff8a' : '#ffffff', seg(t, 50.6, 50.9), 1, 12); }
  } });
const { on, onCam } = F;
const fw = V(0, 0, 0);
on((t) => {
  const u = t < 30 ? t : t - total;
  // water level in the cave: rising in the hook/loop, steady later
  const wl = t < 3.3 || t > 63 ? rise(u, -5, 3.3, LEDGE_Y - 1.5, LEDGE_Y - 0.35, (k) => k) : LEDGE_Y - 0.9;
  const P = waterG.attributes.position.array; for (let i = 0; i < P.length; i += 3) P[i + 1] = 0.06 * Math.sin(wBase[i] * 1.3 + t * 1.6) * Math.sin(wBase[i + 2] * 0.9 - t * 1.2);
  waterG.attributes.position.needsUpdate = true; water.position.y = wl;
  // the team on the ledge (or running deeper)
  team.forEach((p, i) => { const run = t > 17.1 && t < 21.2, out = t > 56 && t < 63.2;
    if (run) { const q = clamp(0.5 + (t - 17.1) * 0.07 - i * 0.012, 0, 1); p.g.position.copy(path.getPointAt(q)).add(V((i % 3 - 1) * 0.6, -2.4 + 0.0, 0)); p.g.position.y = LEDGE_Y - 0.6; p.g.rotation.set(0, 0, 0); walk(p, t * 9 + i, 1); return; }
    if (out) { p.g.position.copy(G(-3 + (i % 7) * 0.9, 3 + Math.floor(i / 7) * 1.2 + (t - 56) * 0.4)); p.g.rotation.set(0, Math.PI, 0); walk(p, t * 6 + i, 0.6); p.armR.rotation.set(0, 0, t > 58.8 ? 2.4 + 0.3 * Math.sin(t * 8 + i) : 0); return; }
    if (t > 3.3 && t < 17.1) { p.g.position.copy(G(-4 + (i % 7) * 1.1, 2 - Math.floor(i / 7) * 1.4 - (t > 8.6 ? (t - 8.6) * 2.2 : 0))); p.g.rotation.set(0, Math.PI, 0); walk(p, t * 7 + i, t > 8.6 ? 1 : 0.3); p.g.visible = t < 12.5; return; }
    p.g.visible = true; const a = (i / 12 - 0.5) * 2.4, rr = i % 2 ? 1.2 : 2.0; p.g.position.set(LEDGE.x + Math.sin(a) * rr, LEDGE_Y, LEDGE.z - 2.4 + Math.cos(a) * rr * 0.6); p.g.rotation.set(0, Math.PI + a * 0.4, 0);
    p.legL.rotation.x = p.legR.rotation.x = -1.4; p.g.position.y = LEDGE_Y - 0.25; p.armL.rotation.set(-0.8, 0, 0); p.armR.rotation.set(-0.8, 0, 0);
    if (t > 26.2 && t < 33) { p.legL.rotation.x = p.legR.rotation.x = 0; p.g.position.y = LEDGE_Y; p.armR.rotation.set(0, 0, t > 31.2 ? 2.5 + 0.3 * Math.sin(t * 9 + i) : 0.2); }
  });
  caveLight.position.copy(LEDGE).add(V(0, 3, 2)); caveLight.intensity = t > 21 && t < 28 ? 1.4 : 5;
  runLight.intensity = t > 17.1 && t < 21.2 ? 6 : 0; runLight.position.copy(team[12].g.position).add(V(0, 1.8, 0.5));
  for (let i = 0; i < drips.n; i++) { const f = (hash(i) + t * 0.7) % 1; drips.pos[i * 3] = LEDGE.x - 4 + 8 * hash(i + 1); drips.pos[i * 3 + 1] = LEDGE.y + 5 - f * 5; drips.pos[i * 3 + 2] = LEDGE.z - 4 + 7 * hash(i + 2); }
  drips.geo.attributes.position.needsUpdate = true;
  // divers: surface at the ledge (day 10), and the tow (8-10 July)
  const meet = t > 26.26 && t < 33;
  D1.g.visible = meet || (t > 33 && t < 38.8) || (t > 49 && t < 56.1); D2.g.visible = meet;
  if (meet) { const k = smooth(seg(t, 26.3, 28.2)); D1.g.position.copy(LEDGE).add(V(0.6, lerp(-1.6, -0.6, k), lerp(4.5, 2.2, k))); D2.g.position.copy(LEDGE).add(V(-0.9, lerp(-1.8, -0.7, k), lerp(5.0, 2.6, k)));
    for (const d of [D1, D2]) { d.g.rotation.set(0, 0, 0); d.torch.intensity = 70 * smooth(seg(t, 27.6, 28.4)); d.torch.target.position.set(0, 1.4, -3); } }
  const swim = (d, q, dy = -2.0) => { d.g.position.copy(path.getPointAt(clamp(q, 0, 1))).add(V(0, dy, 0)); d.g.rotation.set(-Math.PI / 2, 0, 0); d.g.lookAt(path.getPointAt(clamp(q - 0.01, 0, 1)).add(V(0, dy, 0))); d.g.rotateX(-Math.PI / 2); d.torch.intensity = 30; walk(d, t * 5, 0.6); };
  if (t > 33 && t < 38.8) swim(D1, 0.62 - (t - 33) * 0.008);
  towBoy.g.visible = t > 49 && t < 56.1;
  if (towBoy.g.visible) { const q = 0.24 - ((t - 49.06) * 0.03 % 0.2); swim(D1, q); towBoy.g.position.copy(path.getPointAt(clamp(q + 0.025, 0, 1))).add(V(0.2, -2.0, 0)); towBoy.g.quaternion.copy(D1.g.quaternion); }
  const bc = D1.g.position;
  for (let i = 0; i < bubbles.n; i++) { const f = (hash(i) + t * 0.5) % 1; bubbles.pos[i * 3] = bc.x - 0.6 + 1.2 * hash(i + 1) + 0.1 * Math.sin(t * 3 + i); bubbles.pos[i * 3 + 1] = bc.y + f * 2.5; bubbles.pos[i * 3 + 2] = bc.z - 0.6 + 1.2 * hash(i + 2); }
  bubbles.geo.attributes.position.needsUpdate = true; fill.intensity = (t > 33 && t < 38.8) || (t > 49 && t < 56.1) ? 8 : 0; fill.position.copy(bc).add(V(1.5, 1.2, 2)); bubbles.p.visible = (t > 33 && t < 38.8) || (t > 49 && t < 56.1);
  // outside: rain + rising flood at the mouth, ball
  const rOn = t > 12 && t < 17.1 ? 1 : 0; rain.p.visible = rOn > 0;
  if (rOn) for (let i = 0; i < rain.n; i++) { const f = (hash(i) + t * 1.6) % 1; rain.pos[i * 3] = MOUTH.x - 20 + 40 * hash(i + 1); rain.pos[i * 3 + 1] = MOUTH.y + 14 - f * 16; rain.pos[i * 3 + 2] = MOUTH.z - 6 + 30 * hash(i + 2); }
  rain.geo.attributes.position.needsUpdate = true;
  extWater.position.y = MOUTH.y - 1.4 + 1.3 * smooth(seg(t, 13.0, 16.4)) * (t < 30 ? 1 : 0.3); extWater.visible = t > 12;
  ball.position.copy(G(1.5 + Math.sin(t * 2) * 0.5, 4)).add(V(0, 0.11 + Math.abs(Math.sin(t * 5)) * 0.3, 0)); ball.visible = t > 3.3 && t < 9;
  // memorial flames, crowd
  flames.forEach((f, i) => f.scale.setScalar(1 + 0.25 * Math.sin(t * 17 + i * 2) * Math.sin(t * 7 + i))); memL.intensity = 3.5 + 0.8 * Math.sin(t * 11) * Math.sin(t * 6.3);
  crowd.forEach((p, i) => { const c = t > 59.4 ? 1 : 0; p.armL.rotation.set(0, 0, c ? -2.5 + 0.3 * Math.sin(t * 8 + i) : 0.1); p.armR.rotation.set(0, 0, c ? 2.5 + 0.3 * Math.sin(t * 8 + i + 1) : -0.1); });
});
onCam((t, cam) => {
  const shown = new Set();
  for (const [c, a, b, dx, dy, s, rz] of CARDS) { if (t < a || t > b) continue; shown.add(c);
    const k = backOut(seg(t, a, a + 0.4), 1.8), out = smooth(seg(t, b - 0.3, b)); cam.getWorldDirection(fw); const d = 2.2;
    c.position.copy(cam.position).addScaledVector(fw, d); c.quaternion.copy(cam.quaternion); c.translateX(dx * d * 0.4); c.translateY(dy * d * 0.4 + (1 - k) * -1.2 + out * -1.6); c.rotateZ(rz + 0.05 * Math.sin(t * 1.3));
    c.scale.setScalar(Math.max(0.001, s * 0.72 * k)); c.visible = true; }
  for (const c of [cMap, cDiv, cPump, cCountry, cGov]) if (!shown.has(c)) c.visible = false;
});
