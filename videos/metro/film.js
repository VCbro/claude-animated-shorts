// बिना ड्राइवर की मेट्रो कैसे चलती है? (CBTC) — KAISECHALTAHAI3D #6. 1 unit = 1 m. Elevated viaduct along x (deck top y = 10).
import { THREE, V, TAU, W, H, film, scene, renderer, sun, mat, add, group, rod, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const total = 52.4;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const svgURL = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const DY = 10, GAUGE = 1.435;

// ================================================================ city + viaduct + track
add(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), mat(0x6a7a5a, 0.95), 0, 0, 0, scene, false).receiveShadow = true;
const conc = mat(0xc9c6bf, 0.8);
add(new THREE.BoxGeometry(2400, 1.2, 9), conc, 0, DY - 0.6, 0); for (const s of [-1, 1]) add(new THREE.BoxGeometry(2400, 1.0, 0.25), conc, 0, DY + 0.5, s * 4.4);
for (let x = -1200; x <= 1200; x += 30) { add(new THREE.CylinderGeometry(0.9, 1.1, DY - 1.2, 16), conc, x, (DY - 1.2) / 2, 0); add(new THREE.BoxGeometry(2.4, 1.0, 7), conc, x, DY - 1.6, 0); }
const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 0.14, 2.5), mat(0x9a9690, 0.9), 3600); { const m = new THREE.Matrix4(); for (let i = 0; i < 3600; i++) { m.makeTranslation(-1200 + i * 0.66, DY + 0.07, 0); sleepers.setMatrixAt(i, m); } } scene.add(sleepers);
const railM = new THREE.MeshStandardMaterial({ color: 0xc0c4ca, metalness: 0.9, roughness: 0.3, envMap: ENV, envMapIntensity: 0.6 });
for (const s of [-1, 1]) add(new THREE.BoxGeometry(2400, 0.15, 0.07), railM, 0, DY + 0.2, s * GAUGE / 2, scene, false);
for (let x = -1200; x <= 1200; x += 45) { rod(V(x, DY, -4.2), V(x, DY + 7, -4.2), 0.12, mat(0x8a8e94, 0.5, 0.5)); rod(V(x, DY + 6.6, -4.2), V(x, DY + 6.4, 0.2), 0.05, mat(0x8a8e94, 0.5, 0.5)); }
add(new THREE.BoxGeometry(2400, 0.03, 0.03), mat(0x5a4a3a, 0.5, 0.8), 0, DY + 5.4, 0, scene, false);
for (let i = 0; i < 160; i++) { const x = (hash(i) - 0.5) * 2200, side = hash(i * 3) < 0.5 ? -1 : 1, z = side * (40 + 300 * hash(i * 7)), h = 12 + 60 * hash(i * 9) ** 2, w = 14 + 20 * hash(i * 11);
  add(new THREE.BoxGeometry(w, h, w * 0.8), mat([0xd8d2c4, 0xc4ccd4, 0xe0d0b8, 0xb8c0c8][i % 4], 0.85), x, h / 2, z, scene, false); }
for (let i = 0; i < 120; i++) { const x = (hash(i * 5) - 0.5) * 2000, z = (hash(i * 13) < 0.5 ? -1 : 1) * (12 + 25 * hash(i * 17)); add(new THREE.SphereGeometry(3 + 2 * hash(i), 10, 8), mat(0x3a6a2a, 0.9), x, 4, z, scene, false); }
// beacons between the rails, wayside radio masts
const BEAC = []; for (let x = -1180; x < 1200; x += 25) BEAC.push(x);
const beacM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.12, 0.35), new THREE.MeshStandardMaterial({ color: 0xf2c21a, emissive: 0x3a2a00, emissiveIntensity: 0.4 }), BEAC.length); { const m = new THREE.Matrix4(); BEAC.forEach((x, i) => { m.makeTranslation(x, DY + 0.18, 0); beacM.setMatrixAt(i, m); }); } scene.add(beacM);
const beacGlow = BEAC.map((x) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: HDR(2.6, 2.0, 0.4), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.position.set(x, DY + 0.4, 0); s.scale.setScalar(0.001); scene.add(s); return s; });
const RADIO = []; for (let x = -1150; x < 1200; x += 150) { rod(V(x, DY, 4.2), V(x, DY + 5.5, 4.2), 0.08, mat(0xe0e0e0, 0.5)); add(new THREE.BoxGeometry(0.4, 0.9, 0.3), mat(0xf0f0f0, 0.5), x, DY + 5.8, 4.2); RADIO.push(x); }
// station (platform, canopy, platform screen doors)
const SX = 200, PLAT_Z = 4.4 + 2.6;
add(new THREE.BoxGeometry(150, 1.1, 5), mat(0xb8b4ac, 0.7), SX, DY + 0.55, PLAT_Z); add(new THREE.BoxGeometry(160, 0.4, 16), mat(0xe8e8ea, 0.5, 0.3), SX, DY + 8.5, 2.5);
for (let x = SX - 70; x <= SX + 70; x += 14) rod(V(x, DY + 1, 9), V(x, DY + 8.3, 9), 0.25, mat(0x6a7078, 0.5, 0.5));
add(new THREE.PlaneGeometry(150, 0.25).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: HDR(2.4, 2.0, 0.2) }), SX, DY + 1.12, PLAT_Z - 2.1, scene, false);
const stopMark = add(new THREE.PlaneGeometry(1.4, 1.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: (() => { const c = cv(128, 128), g = c.getContext('2d'); g.fillStyle = '#d02a2a'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#fff'; g.font = '800 34px BalooL, sans-serif'; g.textAlign = 'center'; g.fillText('STOP', 64, 76); return tex(c); })() }), SX + 41.5, DY + 1.13, PLAT_Z - 1.2, scene, false);
const CAR_L = 21, NCAR = 4, DOORS = [-7.4, -2.4, 2.4, 7.4];
const psd = []; for (let c = 0; c < NCAR; c++) for (const dx of DOORS) { const x = SX + 41.5 - c * (CAR_L + 0.8) - CAR_L / 2 + dx;
  const left = add(new THREE.BoxGeometry(0.75, 2.0, 0.05), new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1, envMap: ENV }), x - 0.38, DY + 2.1, PLAT_Z - 2.3, scene, false);
  const right = add(new THREE.BoxGeometry(0.75, 2.0, 0.05), left.material, x + 0.38, DY + 2.1, PLAT_Z - 2.3, scene, false); psd.push({ left, right, x }); }
for (let x = SX - 72; x <= SX + 72; x += 2.3) add(new THREE.BoxGeometry(0.12, 2.3, 0.12), mat(0x9aa2aa, 0.4, 0.7), x, DY + 2.25, PLAT_Z - 2.3, scene, false);
add(new THREE.BoxGeometry(150, 0.35, 0.15), mat(0x9aa2aa, 0.4, 0.7), SX, DY + 3.35, PLAT_Z - 2.3, scene, false);

// ================================================================ the train (4 cars, stainless + magenta stripe, rounded nose)
const carTex = (() => { const c = cv(1024, 256), g = c.getContext('2d'); g.fillStyle = '#c9cdd2'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#c2187a'; g.fillRect(0, 26, 1024, 26); g.fillRect(0, 196, 1024, 14);
  g.fillStyle = '#1a2230'; for (let x = 30; x < 1000; x += 100) g.fillRect(x, 70, 70, 74); g.fillStyle = '#9aa0a8'; for (const x of [150, 395, 630, 875]) g.fillRect(x - 32, 60, 64, 150); return tex(c); })();
const carM = new THREE.MeshPhysicalMaterial({ map: carTex, metalness: 0.5, roughness: 0.3, clearcoat: 0.6, envMap: ENV, envMapIntensity: 0.8 });
const TRAINS = [];
function train() { const g = new THREE.Group(); scene.add(g); const leds = [];
  for (let c = 0; c < NCAR; c++) { const car = add(new THREE.BoxGeometry(CAR_L, 3.3, 2.9), carM, -c * (CAR_L + 0.8) - CAR_L / 2, DY + 2.05, 0, g); car.castShadow = true;
    for (const bx of [-7, 7]) for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16).rotateX(Math.PI / 2), mat(0x3a3c40, 0.5, 0.7), -c * (CAR_L + 0.8) - CAR_L / 2 + bx, DY + 0.6, s * GAUGE / 2, g); }
  const noseParts = []; noseParts.push(add(new RoundedBoxGeometry(1.6, 3.3, 2.9, 4, 0.55), new THREE.MeshPhysicalMaterial({ color: 0xe8eaee, metalness: 0.3, roughness: 0.25, clearcoat: 1, envMap: ENV }), 0.1, DY + 2.05, 0, g));
  noseParts.push(add(new RoundedBoxGeometry(0.4, 1.4, 2.5, 3, 0.18), new THREE.MeshPhysicalMaterial({ color: 0x0c1018, metalness: 0.4, roughness: 0.05, clearcoat: 1, envMap: ENV, envMapIntensity: 1.2 }), 0.78, DY + 2.75, 0, g));
  noseParts.push(add(new THREE.BoxGeometry(0.1, 0.25, 2.92), new THREE.MeshBasicMaterial({ color: HDR(1.6, 0.2, 0.9) }), 0.86, DY + 1.85, 0, g, false));
  add(new THREE.BoxGeometry(0.4, 0.5, 2.6), mat(0xf2f2f2, 0.4), 0.9, DY + 1.0, 0, g);
  for (const z of [-0.95, 0.95]) add(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: HDR(3, 2.9, 2.5) }), 1.1, DY + 1.2, z, g, false);
  // sensor points (lit up at the end)
  const sp = particles(260, HDR(0.4, 2.2, 3), 0.25); sp.p.material.map = dotTex; sp.p.material.transparent = true; scene.remove(sp.p); g.add(sp.p);
  for (let i = 0; i < sp.n; i++) { sp.pos[i * 3] = -hash(i) * (NCAR * (CAR_L + 0.8)); sp.pos[i * 3 + 1] = DY + 0.4 + 3.4 * hash(i * 3); sp.pos[i * 3 + 2] = (hash(i * 7) < 0.5 ? -1 : 1) * 1.5; } sp.geo.attributes.position.needsUpdate = true;
  const zone = add(new THREE.BoxGeometry(1, 3.6, 3.3), new THREE.MeshBasicMaterial({ color: HDR(0.3, 1.4, 2.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, DY + 2.0, 0, g, false);
  const T = { g, sp, zone, noseParts }; TRAINS.push(T); return T; }
const T1 = train(), T2 = train(), T3 = train();
// fixed blocks (old system) as coloured track segments
const blocks = []; for (let k = 0; k < 8; k++) { const m = add(new THREE.BoxGeometry(58, 0.06, 2.6), new THREE.MeshBasicMaterial({ color: HDR(0.3, 1.6, 0.4), transparent: true, opacity: 0.0 }), -300 + k * 60, DY + 0.25, 0, scene, false); blocks.push(m); }
const waves = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 48), new THREE.MeshBasicMaterial({ color: HDR(0.6, 1.6, 2.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(m); return m; });
const sparks = particles(200, HDR(3, 2, 0.6), 0.15); sparks.p.material.map = dotTex; sparks.p.material.transparent = true;
// cab interior (attached to the camera in the cab shots): console with levers, the empty seat
const cab = new THREE.Group(); scene.add(cab);
add(new THREE.BoxGeometry(2.4, 0.5, 0.8), mat(0x2a2e36, 0.6), 0, -0.62, -1.35, cab, false);
const lever = add(new THREE.BoxGeometry(0.07, 0.34, 0.07), mat(0xd02a2a, 0.4), 0.42, -0.2, -1.1, cab, false);
const seat = group(0.62, -0.72, -1.45, cab); add(new THREE.BoxGeometry(0.6, 0.14, 0.55), mat(0x2a6ad8, 0.6), 0, 0, 0, seat); add(new THREE.BoxGeometry(0.6, 0.8, 0.12), mat(0x2a6ad8, 0.6), 0, 0.45, 0.28, seat);
const scrC = cv(256, 160), scrT = tex(scrC); add(new THREE.PlaneGeometry(0.5, 0.31), new THREE.MeshBasicMaterial({ map: scrT }), -0.42, -0.24, -1.05, cab, false).rotation.x = -0.5;
for (const x of [-1.1, 1.1]) add(new THREE.BoxGeometry(0.08, 1.6, 0.06), mat(0x15171c, 0.8), x, 0.2, -1.4, cab, false);
add(new THREE.BoxGeometry(2.4, 0.1, 0.1), mat(0x15171c, 0.8), 0, 0.85, -1.35, cab, false);
// OCC controller (2D cartoon) for the overlay
const ctrlSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="520" viewBox="0 0 600 520"><defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#d9a074"/><stop offset="1" stop-color="#b98058"/></linearGradient></defs>
  <rect x="10" y="10" width="580" height="250" rx="20" fill="#0a1222" stroke="#26160c" stroke-width="8"/><path d="M40 140 L560 140" stroke="#c2187a" stroke-width="10"/>
  ${[90, 210, 330, 450].map((x) => `<circle cx="${x}" cy="140" r="14" fill="#5dff8a"/>`).join('')}<rect x="160" y="128" width="50" height="24" rx="6" fill="#ffd24a"/><rect x="380" y="128" width="50" height="24" rx="6" fill="#ffd24a"/>
  <path d="M120 520 Q120 360 300 340 Q480 360 480 520 Z" fill="#2a4a8a" stroke="#26160c" stroke-width="8"/>
  <ellipse cx="300" cy="300" rx="80" ry="88" fill="url(#s)" stroke="#26160c" stroke-width="8"/><path d="M222 270 Q300 200 378 270 Q360 230 300 226 Q240 230 222 270 Z" fill="#1d1612"/>
  <path d="M215 300 Q205 250 230 236 M385 300 Q395 250 370 236" fill="none" stroke="#111" stroke-width="12"/><circle cx="214" cy="306" r="16" fill="#111"/><circle cx="386" cy="306" r="16" fill="#111"/>
  <circle cx="272" cy="296" r="8" fill="#2a1a0c"/><circle cx="328" cy="296" r="8" fill="#2a1a0c"/><path d="M276 336 Q300 350 324 336" fill="none" stroke="#7a1e24" stroke-width="7" stroke-linecap="round"/></svg>`;
const CTRL = await img(svgURL(ctrlSVG));
const PH = { train: await img('img/magenta_train.jpg'), platform: await img('img/magenta_platform.jpg') };
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 28px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); } g.restore();
}

// ================================================================ choreography (front x of each train)
const STOPX = SX + 41.5;
function brakeTo(x0, v, t0, t1, t) { const T = t1 - t0, k = clamp((t - t0) / T); return x0 + v * T * (k - 0.5 * k * k); }      // decel to rest at t1
function trains(t) {
  const r = { a: null, b: null, c: null, aStop: false };
  if (t < 4.4) { r.a = brakeTo(STOPX - 61.2, 34, 0, 3.6, t); r.aStop = t > 3.5; }
  else if (t < 8.84) r.a = -400 + 22 * (t - 4.4);
  else if (t < 18.28) r.a = -150 + 18 * (t - 8.84);
  else if (t < 24.46) r.a = 20 + 18 * (t - 18.28);
  else if (t < 38.16) { r.a = -60 + 16 * (t - 24.46); r.b = r.a - (t < 30.68 ? 180 : 180 - 95 * smooth(seg(t, 30.68, 33.0))); if (t >= 34.42) r.c = r.b - 95; }
  else if (t < 43.9) { r.a = brakeTo(STOPX - 66.6, 30, 38.16, 42.6, t); r.aStop = t > 42.5; }
  else if (t < 48.1) r.a = brakeTo(-200, 22, 45.4, 46.6, t) - (t < 45.4 ? 22 * (45.4 - t) : 0);
  else r.a = -260 + 18 * (t - 48.1);
  return r;
}
// ---------------------------------------------------------------- camera envs
const DAY = { sky: true, e: 30, az: 2.2, sun: 2.8, ambI: 0.55, fog: 0.0012, exposure: 1.0, dof: 0.5 };
const z0 = V(0, 0, 0);
const KEYS = [[0, 0, z0, V(1, 0, 0), 40, DAY]];
const LOCK = (t) => (t < 4.4 || t >= 50.6);
const F = film({ total, keys: KEYS, exposure: 1.0, lens: false, shutter: 0.2 / 30, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' }, hits: [[3.6, 0.01], [9.6, 0.01], [30.96, 0.01], [42.6, 0.01], [46.6, 0.015]],
  titles: [[-1, 1.7, 'ड्राइवर… है ही नहीं!', 100, '#ffd24a', 300, 'बिना ड्राइवर की मेट्रो कैसे चलती है?'], [2.4, 4.3, 'फिर भी ठीक निशान पर!', 86, '#5dff8a', 300],
    [9.6, 12.2, 'CBTC', 150, '#7fd8ff', 300, 'रेडियो से चलने वाला कंट्रोल'], [24.46, 27.6, 'असली कमाल 👇', 100, '#ffd24a', 300], [27.82, 30.6, 'पुराना: तय ब्लॉक', 92, '#ff9a6a', 300],
    [30.68, 34.3, 'नया: चलता ब्लॉक', 96, '#5dff8a', 300, 'दूरी हर पल नापी जाती है'], [43.9, 47.9, 'गड़बड़ → तुरंत ब्रेक!', 90, '#ff4a4a', 300], [48.1, 50.5, 'हज़ारों सेंसर', 110, '#7fd8ff', 300],
    [50.6, 999, 'ड्राइवर… है ही नहीं!', 100, '#ffd24a', 300, 'बिना ड्राइवर की मेट्रो कैसे चलती है?']],
  pills: [[4.6, 8.1, 'दिल्ली मेट्रो • मैजेंटा लाइन • 2020 से', 1300, '#ff8ad0'], [13.3, 17.7, 'पटरी पर बीकन + पहियों के सेंसर', 1300, '#ffd24a'], [34.42, 37.5, 'पास-पास… पर पूरी सुरक्षा', 1300, '#5dff8a']],
  overlay: (g, t, { txt, pill }) => {
    if (t >= 15.4 && t < 18.2) txt(`स्थान: ${(1248.6 + (t - 15.4) * 18).toFixed(1)} m`, 540, 520, 60, '#ffffff', seg(t, 15.4, 15.7), 1, 10);
    if (t >= 18.28 && t < 24.4 && CTRL) { const a = seg(t, 18.4, 18.7) * (1 - seg(t, 24.1, 24.4)); g.save(); g.globalAlpha = a; g.translate(540, 1130); g.scale(0.85, 0.85); g.drawImage(CTRL, -300, -260); g.restore();
      txt('कंट्रोल सेंटर', 540, 860, 48, '#7fd8ff', a, 1, 8); if (t > 22.5) { pill('तेज़: 60 km/h', 380, 760, '#5dff8a', seg(t, 22.54, 22.8) * a, 42); pill('रुको: अगला स्टेशन', 720, 760, '#ffd24a', seg(t, 23.56, 23.8) * a, 42); } }
    const card = (im, a, b2, x, y, w, rot, cap) => { if (t < a || t > b2) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b2 - 0.3, b2)); paper(g, im, x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card(PH.train, 5.0, 8.1, 540, 1080, 900, -0.02, 'मैजेंटा लाइन, दिल्ली मेट्रो (असली)');
    card(PH.platform, 40.4, 43.6, 540, 1100, 860, 0.02, 'प्लेटफ़ॉर्म स्क्रीन डोर — मैजेंटा लाइन (असली)');
  } });
const { on, onCam } = F;
function drawScr(t) { const g = scrC.getContext('2d'); g.fillStyle = '#081020'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#5dff8a'; g.font = '800 26px BalooL, sans-serif'; g.fillText('ATO  AUTO', 14, 34);
  g.fillStyle = '#fff'; g.font = '800 54px BalooL, sans-serif'; g.fillText(String(Math.max(0, Math.round(34 * 3.6 * (1 - seg(t, 0, 3.6))))), 14, 100); g.font = '800 22px BalooL, sans-serif'; g.fillText('km/h', 120, 100); scrT.needsUpdate = true; }
// ---------------------------------------------------------------- animation
on((t) => {
  const r = trains(t);
  [[T1, r.a], [T2, r.b], [T3, r.c]].forEach(([T, x]) => { T.g.visible = x !== null; if (x !== null) T.g.position.x = x; T.sp.p.visible = t >= 48.1; T.zone.material.opacity = 0; });
  // moving-block bubbles behind leading trains (30.7-38)
  if (t >= 30.68 && t < 38.16) { for (const [T, x] of [[T1, r.a], [T2, r.b]]) { if (x === null) continue; const L = 60; T.zone.scale.set(L, 1, 1); T.zone.position.x = -NCAR * (CAR_L + 0.8) - L / 2; T.zone.material.opacity = 0.22 * smooth(seg(t, 30.7, 31.2)); } }
  // fixed blocks (27.8-30.6): occupied red behind train, yellow, green
  blocks.forEach((b, k) => { const on2 = t >= 27.82 && t < 30.68; const bx = -300 + k * 60, occ = r.a !== null && bx - 30 < r.a && bx + 30 > r.a - 86; b.material.opacity = on2 ? 0.55 : 0;
    b.material.color.copy(occ ? HDR(2.4, 0.3, 0.2) : (r.a !== null && bx + 30 < r.a - 86 && bx + 90 > r.a - 86 ? HDR(2.4, 2.0, 0.2) : HDR(0.3, 2.0, 0.4))); });
  // beacons glow under the train front; radio waves train <-> mast
  beacGlow.forEach((s, i) => { const k = r.a !== null ? Math.max(0, 1 - Math.abs(BEAC[i] - (r.a - 3)) / 4) : 0; s.scale.setScalar(Math.max(0.001, 2.2 * k * (t >= 8.84 && t < 18.28 ? 1 : 0.4))); });
  waves.forEach((w, i) => { const k = ((t * 0.8) + i / waves.length) % 1, v = (t >= 9.6 && t < 12.2) || (t >= 18.28 && t < 22.5); w.visible = v && r.a !== null;
    if (w.visible) { const m = RADIO.reduce((p, x) => Math.abs(x - r.a) < Math.abs(p - r.a) ? x : p, RADIO[0]), from = V(r.a - 4, DY + 3.8, 0), to = V(m, DY + 5.8, 4.2), p = i % 2 ? from.clone().lerp(to, k) : to.clone().lerp(from, k);
      w.position.copy(p); w.lookAt(i % 2 ? to : from); w.scale.setScalar(0.4 + 1.6 * Math.sin(k * Math.PI)); w.material.opacity = 0.9 * Math.sin(k * Math.PI); } });
  // platform screen doors open together with the train doors (42.9)
  const od = smooth(seg(t, 42.9, 43.4)) * (t < 43.9 ? 1 : 1 - seg(t, 43.9, 44.2)); psd.forEach(({ left, right, x }) => { left.position.x = x - 0.38 - 0.7 * od; right.position.x = x + 0.38 + 0.7 * od; });
  // emergency sparks (45.4-46.6)
  for (let i = 0; i < sparks.n; i++) { let y = -999, x = 0, z = 0; if (t >= 45.4 && t < 46.7 && r.a !== null) { const k = (t * 3 + hash(i)) % 1; x = r.a - 7 - 3 * k - (i % 4) * 22; y = DY + 0.4 + 0.6 * k * hash(i * 3) - 0.5 * k * k; z = (i % 2 ? 1 : -1) * GAUGE / 2; }
    sparks.pos[i * 3] = x; sparks.pos[i * 3 + 1] = y; sparks.pos[i * 3 + 2] = z; } sparks.geo.attributes.position.needsUpdate = true;
  cab.visible = LOCK(t); T1.noseParts.forEach((m) => (m.visible = !LOCK(t))); lever.rotation.x = -0.4 + 0.5 * smooth(seg(t, 2.0, 3.4)) + 0.05 * Math.sin(t * 2); drawScr(t);
  stopMark.material.color.setScalar(1 + 0.6 * (0.5 + 0.5 * Math.sin(t * 6)));
});
onCam((t, cam) => {
  const r = trains(t), set = (p, l) => { cam.position.copy(p); cam.lookAt(l); cam.updateMatrixWorld(); };
  if (LOCK(t)) { const tt = t < 4.4 ? t : 0.2 + (t - 50.6) * 0.3, rr = trains(tt); const x = (rr.a ?? 0) - 1.6;
    cam.position.set(x - 1.8, DY + 2.75, -0.55); cam.lookAt(x + 30, DY + 1.4, 0.8); cam.fov = 66; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); cab.position.copy(cam.position); cab.quaternion.copy(cam.quaternion); return; }
  if (t < 8.84) { const k = seg(t, 4.4, 8.84); set(V(r.a - 30 + 10 * k, DY + 6 - 3 * k, 34), V(r.a - 30, DY + 1, 0)); }
  else if (t < 13.0) set(V(r.a + 14, DY + 7, 18), V(r.a - 20, DY + 3, 0));
  else if (t < 18.28) { const nx = BEAC.find((x) => x > r.a - 2) || 0; set(V(r.a + 6, DY + 1.0, 3.6), V(r.a - 4, DY + 0.3, 0)); }
  else if (t < 24.46) set(V(r.a + 30, DY + 16, 36), V(r.a - 10, DY + 3, 0));
  else if (t < 34.42) { const mid = r.b !== null ? (r.a + r.b) / 2 - 40 : r.a; set(V(mid + 10, DY + 70, 120), V(mid - 10, DY, 0)); }
  else if (t < 38.16) { const mid = (r.a + (r.c ?? r.a)) / 2 - 40; set(V(mid + 20, DY + 85, 150), V(mid - 20, DY, 0)); }
  else if (t < 43.9) { const k = seg(t, 38.16, 43.9); set(V(STOPX - 30 - 12 * k, DY + 2.4, PLAT_Z + 1.2), V(STOPX - 40 - 20 * k, DY + 2.0, 0)); }
  else if (t < 48.1) set(V(r.a + 22, DY + 5, 16), V(r.a - 10, DY + 2, 0));
  else { const k = seg(t, 48.1, 50.6); set(V(r.a + 20 - 6 * k, DY + 6, 22), V(r.a - 30, DY + 2, 0)); }
});
