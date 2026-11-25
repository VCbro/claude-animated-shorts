// ARUNIMA SINHA — cinematic 3D (cine.js). Real photos (paper cards) only at fact beats: her portrait, Padma Shri, Everest.
import { THREE, V, TAU, film, scene, mat, add, rod, group, terrain, rock, person, walk, photoCard, particles, fbm, pop, rise,
  clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';

const total = 63.5;
const steel = mat(0x9aa0a6, 0.3, 0.9), orange = mat(0xe8642a, 0.6), snowM = mat(0xf4f7fb, 0.6);
// ---------- Himalaya ----------
const hM = (x, z) => {
  const d = Math.hypot(x, z), peak = 60 * Math.exp(-Math.pow(d / 38, 1.6));
  const rg = 1 - Math.abs(2 * fbm(x * 0.012 + 7, z * 0.012, 5) - 1);
  return peak + rg * rg * 70 * smooth(clamp((d - 30) / 120)) + 8 * fbm(x * 0.05, z * 0.05, 4) - 6;
};
terrain(hM, (x, z, y) => { const n = fbm(x * 0.08, z * 0.08, 3), s = smooth(clamp((y - 8 + 10 * n) / 6));
  return [lerp(0.28, 0.95, s), lerp(0.27, 0.96, s), lerp(0.3, 1.0, s)]; }, { size: 1000, seg: 300 });
const SUM = V(0, hM(0, 0), 0);
const G = (x, z) => V(x, hM(x, z), z);
// prayer flags on the summit
const pcol = [0x2f6fd9, 0xf2f2f2, 0xd9342b, 0x2f9a4a, 0xf2c230];
for (let i = 0; i < 26; i++) { const a = V(-4, 0, -1).lerp(V(4, 0, 1.5), i / 25), p = G(a.x, a.z); add(new THREE.PlaneGeometry(0.28, 0.36), new THREE.MeshStandardMaterial({ color: pcol[i % 5], side: THREE.DoubleSide, roughness: 0.8 }), p.x, Math.max(p.y, SUM.y - 1.2) + 0.8 - 0.4 * Math.sin(i / 25 * Math.PI), p.z); }
function flagIN() { const c = Object.assign(document.createElement('canvas'), { width: 300, height: 200 }), g = c.getContext('2d'); g.fillStyle = '#ff9933'; g.fillRect(0, 0, 300, 67); g.fillStyle = '#fff'; g.fillRect(0, 67, 300, 66); g.fillStyle = '#138808'; g.fillRect(0, 133, 300, 67);
  g.strokeStyle = '#000080'; g.lineWidth = 4; g.beginPath(); g.arc(150, 100, 26, 0, TAU); g.stroke(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.beginPath(); g.moveTo(150, 100); g.lineTo(150 + Math.cos(a) * 26, 100 + Math.sin(a) * 26); g.lineWidth = 1.5; g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.8 }); }
const FL = flagIN();
// climber (her): orange suit, prosthetic left leg, flag
function climber(s = 1) { const p = person({ cloth: orange, female: true, helmet: 0xf2f2f2, s });
  add(new THREE.BoxGeometry(0.34, 0.45, 0.2), mat(0x2a3a5a, 0.7), 0, 1.35, 0.2, p.g);
  p.legL.children.forEach((m) => { if (m.geometry.type === 'CylinderGeometry') { m.material = steel; m.scale.set(0.45, 1, 0.45); } });
  add(new THREE.SphereGeometry(0.06, 12, 8), mat(0x111111, 0.3), 0, 1.68, -0.1, p.g).scale.set(1.4, 0.8, 0.6);   // oxygen mask
  return p; }
const her = climber(); her.g.position.copy(SUM); her.g.rotation.y = 0.6;
const flagPole = group(0, 0, 0, her.armR); rod(V(0, -0.6, 0), V(0, -2.2, 0), 0.02, mat(0x888888, 0.5, 0.6), flagPole);
const fGeo = new THREE.PlaneGeometry(0.9, 0.6, 12, 4); fGeo.translate(0.45, 0, 0); const flag = add(fGeo, FL, 0, -1.95, 0, flagPole); const fBase = fGeo.attributes.position.array.slice();
// climbing line on the ridge
const ROUTE = [V(-60, 0, 70), V(-40, 0, 48), V(-24, 0, 30), V(-12, 0, 16), V(-4, 0, 5)].map((p) => G(p.x, p.z).add(V(0, 0.05, 0)));
const route = new THREE.CatmullRomCurve3(ROUTE);
add(new THREE.TubeGeometry(route, 200, 0.02, 6, false), mat(0xd9342b, 0.6), 0, 1, 0);
const team = [0, 1, 2, 3].map((i) => { const p = person({ cloth: mat([0x2f6fd9, 0xd9b23a, 0x3a3a3a, 0x8a2a2a][i], 0.6), helmet: 0xf2f2f2 }); add(new THREE.BoxGeometry(0.34, 0.45, 0.2), mat(0x3a3a3a, 0.7), 0, 1.35, 0.2, p.g); return p; });
const climbHer = climber();
const snow = particles(900, new THREE.Color(1.2, 1.25, 1.35), 0.06, { additive: false, opacity: 0.85 });

// ---------- night plains + Padmavati Express ----------
const TX = 3000;
terrain((x, z) => 1.5 * fbm(x * 0.01, z * 0.01, 3) + (Math.abs(z) < 7 ? -0.3 : 0), (x, z, y) => [0.18, 0.2, 0.12], { size: 800, seg: 160, cx: TX, cz: 0, warp: 0.7 });
for (const z of [0, 4.2]) { for (const dz of [-0.72, 0.72]) add(new THREE.BoxGeometry(800, 0.12, 0.08), steel, TX, 0.25, z + dz);
  const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 0.12, 2.2), mat(0x3a2a1e, 0.9), 900); const M = new THREE.Matrix4(); for (let i = 0; i < 900; i++) { M.makeTranslation(TX - 400 + i * 0.9, 0.12, z); sl.setMatrixAt(i, M); } sl.receiveShadow = true; scene.add(sl); }
add(new THREE.BoxGeometry(800, 0.25, 12), mat(0x4a4038, 0.95), TX, 0, 2.1);
for (let i = 0; i < 60; i++) { const x = TX - 300 + 600 * hash(i), z = (hash(i + 1) < 0.5 ? -1 : 1) * (14 + 60 * hash(i + 2)); add(new THREE.ConeGeometry(2 + 2 * hash(i + 3), 6 + 4 * hash(i), 7), mat(0x0f1a12, 0.9), x, 3, z); }
const moonM = add(new THREE.SphereGeometry(14, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.9, 2.6), fog: false }), TX - 150, 140, -500, scene, false);
function trainCars(n, color, lit = 3) { const g = group(TX, 0, 0); const cars = [];
  for (let i = 0; i < n; i++) { const c = group(i * 23.5, 0, 0, g); add(new THREE.BoxGeometry(22.5, 3.6, 3.1), mat(color, 0.6, 0.2), 0, 2.5, 0, c);
    add(new THREE.BoxGeometry(22.5, 0.3, 3.2), mat(0x1a1a1a, 0.6), 0, 4.4, 0, c);
    for (let w = 0; w < 9; w++) for (const s of [-1, 1]) add(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ color: new THREE.Color(lit, lit * 0.8, lit * 0.45) }), -9.6 + w * 2.4, 2.9, s * 1.56, c, false).rotation.y = s > 0 ? 0 : Math.PI;
    for (const x of [-8, 8]) add(new THREE.BoxGeometry(2.4, 0.8, 2.4), mat(0x111111, 0.7), x, 0.6, 0, c); cars.push(c); }
  return { g, cars }; }
const T1 = trainCars(6, 0x2d3e5c, 1.6), T2 = trainCars(5, 0x6a2a30, 1.2);
const doorLight = new THREE.PointLight(0xffc870, 2, 8, 2); T1.cars[1].add(doorLight); doorLight.position.set(0, 2.6, 2.2);
const headL = new THREE.SpotLight(0xfff4d0, 0, 120, 0.35, 0.5, 1.2); scene.add(headL, headL.target);
const headBulb = add(new THREE.SphereGeometry(0.35, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(20, 18, 14) }), 0, 0, 0, scene, false);
const fallen = person({ cloth: mat(0x8a2a4a, 0.8), female: true, hair: 0x111111 });

// ---------- coach interior ----------
const CI = V(5000, 0, 0);
add(new THREE.BoxGeometry(3.0, 2.8, 20), new THREE.MeshStandardMaterial({ color: 0x6a7a8a, roughness: 0.8, side: THREE.BackSide }), CI.x, CI.y + 1.4, CI.z).castShadow = false;
for (let z = -8; z <= 8; z += 2) { for (const x of [-0.95, 0.95]) { add(new THREE.BoxGeometry(0.9, 0.5, 0.6), mat(0x2a4a7a, 0.8), CI.x + x, CI.y + 0.45, CI.z + z); add(new THREE.BoxGeometry(0.9, 0.8, 0.12), mat(0x2a4a7a, 0.8), CI.x + x, CI.y + 1.0, CI.z + z - 0.3); } }
for (let z = -9; z <= 9; z += 3) { const l = new THREE.PointLight(0xffe0a8, 3, 6, 2); l.position.set(CI.x, CI.y + 2.6, CI.z + z); scene.add(l); add(new THREE.BoxGeometry(0.5, 0.05, 0.15), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.4, 4) }), CI.x, CI.y + 2.78, CI.z + z, scene, false); }
const sitHer = person({ cloth: mat(0xc9374a, 0.8), female: true, hair: 0x111111 }); sitHer.g.position.set(CI.x + 0.95, CI.y - 0.35, CI.z + 0.3); sitHer.g.rotation.y = Math.PI;
const ball = add(new THREE.SphereGeometry(0.11, 24, 16), mat(0xf2f2f2, 0.5), CI.x + 0.55, CI.y + 0.82, CI.z + 0.4);
const robbers = [0, 1, 2].map((i) => { const p = person({ cloth: mat(0x151515, 0.9), top: mat([0x2a2a2a, 0x3a2a1a, 0x1a2a2a][i], 0.9) }); p.g.position.set(CI.x - 0.2 + i * 0.3, CI.y, CI.z - 6 - i); return p; });

// ---------- hospital room ----------
const HR = V(6000, 0, 0);
add(new THREE.BoxGeometry(6, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0xc8d2d8, roughness: 0.9, side: THREE.BackSide }), HR.x, HR.y + 1.6, HR.z).castShadow = false;
add(new THREE.BoxGeometry(1.1, 0.5, 2.1), mat(0xeeeeee, 0.7), HR.x, HR.y + 0.55, HR.z); add(new THREE.BoxGeometry(1.1, 0.12, 2.1), mat(0xbfd4e6, 0.7), HR.x, HR.y + 0.86, HR.z);
const bedHer = person({ cloth: mat(0x9fb8cc, 0.8), female: true, hair: 0x111111 }); bedHer.g.position.set(HR.x, HR.y + 0.9, HR.z + 0.95); bedHer.g.rotation.x = -Math.PI / 2;
const win = add(new THREE.PlaneGeometry(1.8, 1.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.4, 2.8) }), HR.x - 2.98, HR.y + 1.8, HR.z, scene, false); win.rotation.y = Math.PI / 2;
const poster = add(new THREE.PlaneGeometry(1.0, 0.7), new THREE.MeshStandardMaterial({ map: (() => { const c = Object.assign(document.createElement('canvas'), { width: 400, height: 280 }), g = c.getContext('2d');
  g.fillStyle = '#6fa0d8'; g.fillRect(0, 0, 400, 280); g.fillStyle = '#f4f7fb'; g.beginPath(); g.moveTo(0, 280); g.lineTo(170, 50); g.lineTo(230, 110); g.lineTo(260, 80); g.lineTo(400, 280); g.fill(); g.fillStyle = '#1a2a4a'; g.font = '800 40px BalooD, BalooL'; g.textAlign = 'center'; g.fillText('8,848 मी', 200, 260);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), roughness: 0.8, emissive: 0xffffff, emissiveIntensity: 0 }), HR.x + 0.5, HR.y + 1.8, HR.z - 2.97);
const roomL = new THREE.PointLight(0xfff4e0, 6, 10, 1.6); roomL.position.set(HR.x + 0.8, HR.y + 2.8, HR.z + 0.5); scene.add(roomL);

// ---------- real photo cards ----------
const [cPort, cPadma, cEv] = await Promise.all(['img/portrait.jpg', 'img/padmashri.jpg', 'img/summit.jpg'].map((s) => photoCard(s, { w: 1 })));
const CARDS = [[cPort, 10.4, 15.4, 0, 0.12, 0.9, -0.04], [cPadma, 55.2, 59.3, 0, 0.1, 0.85, -0.03]];

// ---------- camera ----------
const SUN = { e: 8, az: 1.0, fog: 0.0015, dof: 0.6 }, NIGHT = { e: -16, az: 2.5, fog: 0.004, ambI: 0.22, exposure: 1.5, amb: '#3a4a78' };
const INSIDE = { sky: false, sun: 0, ambI: 0.35, amb: '#c8b89a', exposure: 1.1, fog: 0 };
const HOOK = [SUM.clone().add(V(6.5, 1.2, 9.5)), SUM.clone().add(V(0, 2.3, 0)), 36, SUN];
const P1 = route.getPoint(0.55);
const KEYS = [
  [-9, -9, ...HOOK],
  [4.66, 4.66, V(TX + 60, 6, 30), V(TX + 10, 3, 0), 40, NIGHT],
  [4.8, 9.9, V(TX + 18, 3.2, 14), V(TX - 6, 2.6, 0), 40, NIGHT],
  [10.26, 10.26, CI.clone().add(V(-0.6, 1.6, 3.2)), CI.clone().add(V(0.8, 1.0, 0)), 38, INSIDE],
  [10.4, 15.4, CI.clone().add(V(-0.3, 1.5, 2.4)), CI.clone().add(V(0.8, 1.1, 0)), 38, INSIDE],
  [15.5, 15.5, CI.clone().add(V(0.9, 1.6, 2.8)), CI.clone().add(V(0, 1.4, -4)), 40, INSIDE],
  [15.6, 20.6, CI.clone().add(V(0.6, 1.5, 2.2)), CI.clone().add(V(0.2, 1.3, -1)), 38, INSIDE],
  [20.76, 20.76, V(TX + 20, 1.2, 10), V(TX + 27, 2, 1.6), 36, NIGHT],
  [20.8, 22.7, V(TX + 23, 0.8, 9), V(TX + 28, 1.2, 2.5), 36, NIGHT],
  [22.84, 22.84, V(TX - 2, 0.9, 7.5), V(TX + 40, 1.6, 4.2), 40, NIGHT],
  [22.9, 27.2, V(TX - 1, 0.7, 6.8), V(TX + 30, 1.4, 4.2), 40, NIGHT],
  [28.64, 28.64, V(TX + 24, 6, 14), V(TX + 28, 0.5, 6.0), 36, NIGHT],
  [28.7, 33.3, V(TX + 26, 3.5, 10.5), V(TX + 28, 0.5, 6.0), 36, { e: -4, az: 0.5, fog: 0.005, ambI: 0.25, exposure: 1.7 }],
  [33.38, 33.38, HR.clone().add(V(2.2, 1.8, 2.4)), HR.clone().add(V(0, 0.9, 0.3)), 40, { ...INSIDE, ambI: 0.25, exposure: 1.2 }],
  [33.5, 37.8, HR.clone().add(V(1.6, 1.5, 1.8)), HR.clone().add(V(0, 1.0, 0.3)), 38, { ...INSIDE, ambI: 0.25, exposure: 1.2 }],
  [37.9, 37.9, HR.clone().add(V(-1.2, 1.3, 1.6)), HR.clone().add(V(0.5, 1.6, -2.9)), 38, INSIDE],
  [38.0, 41.1, HR.clone().add(V(-0.4, 1.4, 0.6)), HR.clone().add(V(0.5, 1.75, -2.9)), 36, INSIDE],
  [41.2, 41.2, P1.clone().add(V(14, 6, 10)), P1.clone().add(V(0, 1.5, 0)), 40, { e: 14, az: 1.4, fog: 0.003 }],
  [41.3, 47.9, P1.clone().add(V(7, 3, 6)), route.getPoint(0.75).add(V(0, 1.6, 0)), 40, { e: 10, az: 1.4, fog: 0.006 }],
  [47.98, 47.98, SUM.clone().add(V(-30, 6, 40)), SUM.clone().add(V(0, 2, 0)), 38, { e: 2, az: 1.0, fog: 0.002 }],
  [48.1, 54.9, SUM.clone().add(V(-7, 1.2, 10)), SUM.clone().add(V(0, 1.9, 0)), 36, { e: 8, az: 1.0, fog: 0.0015 }],
  [55.06, 55.06, SUM.clone().add(V(6, 2.5, 8)), SUM.clone().add(V(0, 1.8, 0)), 38, SUN],
  [55.2, 59.3, SUM.clone().add(V(4.5, 1.5, 6.5)), SUM.clone().add(V(0, 1.9, 0)), 38, SUN],
  [59.4, 59.4, SUM.clone().add(V(9, 3, 13)), SUM.clone().add(V(0, 1.6, 0)), 38, SUN],
  [59.5, 63.2, ...HOOK],
];
const F = film({ total, keys: KEYS, exposure: 1.0, hits: [[0.4, 0.02], [22.02, 0.04], [26.4, 0.08], [52.12, 0.03]],
  titles: [[-1, 4.5, '8,848 मीटर', 120, '#ffd24a', 300, 'एक पैर के साथ'], [4.8, 10.1, '12 अप्रैल 2011', 96, '#ffffff', 300, 'लखनऊ → दिल्ली'],
    [46.2, 47.9, '52 दिन', 140, '#ffffff', 300], [49.9, 54.9, '21 मई 2013', 100, '#ffd24a', 300, 'सुबह 10:55'], [55.2, 59.3, 'दुनिया में पहली', 104, '#ffffff', 300, 'पैर गँवाकर एवरेस्ट'],
    [59.5, 999, '8,848 मीटर', 120, '#ffd24a', 300, 'एक पैर के साथ']],
  pills: [[10.6, 15.3, 'अरुणिमा सिन्हा • नेशनल वॉलीबॉल खिलाड़ी', 300], [5.2, 9.8, 'पद्मावत एक्सप्रेस', 1300, '#ffd24a'], [23.0, 28.4, 'बायाँ पैर • घुटने के नीचे से कटा', 300, '#ff8a80'],
    [42.44, 46.0, 'ट्रेनर: बछेंद्री पाल', 300], [55.4, 59.3, 'पद्मश्री 2015 • तेनज़िंग नोर्गे अवॉर्ड', 1300, '#5dff8a']],
  labels: [[0.0, 4.5, 'कृत्रिम पैर', SUM.clone().add(V(0.15, 0.4, 0.05)), 220, 120, '#8fdcff'], [59.5, 99, 'कृत्रिम पैर', SUM.clone().add(V(0.15, 0.4, 0.05)), 220, 120, '#8fdcff']],
  overlay: (g, t, { txt, pill }) => {
    if (t > 34.2 && t < 37.7) [['सब ख़त्म', 260, 620, 34.3], ['बेचारी…', 800, 760, 34.8], ['नामुमकिन', 330, 980, 35.4]].forEach(([s, x, y, a]) => pill(s, x, y, '#c9d2e0', seg(t, a, a + 0.3) * (1 - seg(t, 37.4, 37.7)), 50));
    if (t > 26.0 && t < 27.2) { g.fillStyle = `rgba(255,30,30,${0.45 * Math.exp(-Math.pow(t - 26.4, 2) / 0.03)})`; g.fillRect(0, 0, 1080, 1920); }
    if (t > 38.6 && t < 41.1) txt('लक्ष्य: एवरेस्ट', 540, 330, 110, '#ff6a50', seg(t, 38.6, 38.9), 1, 12);
  } });
const { on, onCam } = F;

const fw = V(0, 0, 0);
on((t) => {
  const u = t < 30 ? t : t - total;
  // summit: flag raise + wind
  her.armR.rotation.set(0, 0, 2.5 + 0.1 * Math.sin(u * 3)); her.armL.rotation.set(0, 0, -0.3);
  const fp = fGeo.attributes.position.array; for (let i = 0; i < fp.length; i += 3) fp[i + 2] = Math.sin(fBase[i] * 6 - t * 9) * 0.07 * fBase[i] * 2; fGeo.attributes.position.needsUpdate = true;
  her.g.visible = t < 4.66 || t > 47.9;
  her.g.position.copy(t > 47.9 && t < 52.12 ? route.getPoint(lerp(0.88, 1, seg(t, 47.98, 52.1))).add(V(0, 0, 0)) : SUM);
  if (t > 47.9 && t < 52.12) { walk(her, t * 4, 0.8); her.armR.rotation.set(0.3, 0, 0); flagPole.visible = false; } else flagPole.visible = true;
  // the climb
  const k = seg(t, 41.2, 47.9);
  climbHer.g.visible = t > 41.1 && t < 47.98; climbHer.g.position.copy(route.getPoint(lerp(0.5, 0.78, k))); climbHer.g.lookAt(route.getPoint(lerp(0.5, 0.78, k) + 0.01).setY(climbHer.g.position.y)); walk(climbHer, t * 4.5, 0.8);
  team.forEach((p, i) => { p.g.visible = climbHer.g.visible; const q = lerp(0.5, 0.78, k) - 0.018 * (i + 1) * (i % 2 ? 1 : -1.2); p.g.position.copy(route.getPoint(clamp(q, 0, 1))); p.g.lookAt(route.getPoint(clamp(q + 0.01, 0, 1)).setY(p.g.position.y)); walk(p, t * 4.5 + i, 0.8); });
  // snow (around the camera's subject)
  const storm = t > 44.0 && t < 47.9 ? 1 : 0.35, c = t > 41 && t < 48 ? climbHer.g.position : SUM;
  for (let i = 0; i < snow.n; i++) { const f = (hash(i) + t * (0.3 + 0.4 * hash(i + 1)) * (1 + storm)) % 1;
    snow.pos[i * 3] = c.x - 12 + 24 * hash(i + 2) + f * 10 * storm; snow.pos[i * 3 + 1] = c.y + 10 - f * 12; snow.pos[i * 3 + 2] = c.z - 12 + 24 * hash(i + 3); }
  snow.geo.attributes.position.needsUpdate = true; snow.p.visible = t < 4.7 || t > 41;
  // trains
  T1.g.position.x = TX + 60 - (t - 4.66) * 16; if (t > 20.7) T1.g.position.x = TX + 24 - (t - 20.76) * 4;
  T1.g.visible = t > 4.6 && t < 22.8;
  const x2 = TX + 80 - (t - 22.84) * 30; T2.g.position.set(x2, 0, 4.2); T2.g.visible = t > 22.8 && t < 27.3;
  headL.position.set(x2 - 1, 3, 4.2); headL.target.position.set(x2 - 30, 0.5, 4.2); headL.intensity = T2.g.visible ? 140 : 0; headBulb.position.set(x2 - 11.4, 3, 4.2); headBulb.visible = T2.g.visible;
  // she falls from the door (slow motion), then lies by the track through the night
  const fa = Math.max(0, t - 21.9) * 0.45;
  fallen.g.visible = t > 21.8 && t < 33.4;
  if (t < 22.84) { fallen.g.position.set(T1.g.position.x + 23.5 + 0.6, 1.2 + fa * 1.2 - 4.9 * fa * fa, 1.7 + fa * 3.2); fallen.g.position.y = Math.max(0.3, fallen.g.position.y); fallen.g.rotation.set(fa * 2.2, 0, fa * 1.5); }
  else { fallen.g.position.set(TX + 28, 0.3, 6.0); fallen.g.rotation.set(-Math.PI / 2, 0, 0.3); }
  // coach: robbers come, the struggle
  robbers.forEach((p, i) => { const z = rise(t, 15.9 + i * 0.3, 17.5, -6 - i, -0.6 - i * 0.6, easeOut); p.g.position.z = CI.z + z; p.g.position.x = CI.x + 0.1 + i * 0.25; walk(p, t * 7, t < 17.5 ? 1 : 0);
    if (t > 17.0) { p.armR.rotation.set(-1.4 + 0.3 * Math.sin(t * 12 + i), 0, 0); } });
  sitHer.g.position.y = CI.y - 0.35 + (t > 18.7 ? 0.35 : 0); sitHer.armL.rotation.set(t > 18.7 ? -1.6 + 0.4 * Math.sin(t * 13) : 0.2, 0, 0); sitHer.armR.rotation.set(t > 18.7 ? -1.4 + 0.4 * Math.sin(t * 11) : 0.2, 0, 0);
  sitHer.g.visible = t < 20.7;
  // hospital: she sits up and looks at Everest
  bedHer.g.rotation.x = -Math.PI / 2 + smooth(seg(t, 37.9, 39.0)) * 1.1; poster.material.emissiveIntensity = 0.12 * smooth(seg(t, 38.2, 39.0));
});
onCam((t, cam) => {
  const shown = new Set();
  for (const [c, a, b, dx, dy, s, rz] of CARDS) { if (t < a || t > b) continue; shown.add(c);
    const k = backOut(seg(t, a, a + 0.4), 1.8), out = smooth(seg(t, b - 0.3, b)); cam.getWorldDirection(fw); const d = 2.2;
    c.position.copy(cam.position).addScaledVector(fw, d); c.quaternion.copy(cam.quaternion); c.translateX(dx * d * 0.4); c.translateY(dy * d * 0.4 + (1 - k) * -1.2 + out * -1.6); c.rotateZ(rz + 0.05 * Math.sin(t * 1.3));
    c.scale.setScalar(Math.max(0.001, s * 0.72 * k)); c.visible = true; }
  for (const c of [cPort, cPadma, cEv]) if (!shown.has(c)) c.visible = false;
});
