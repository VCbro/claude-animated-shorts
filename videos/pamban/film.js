// पंबन ब्रिज: समुद्र पर उठने वाला पुल — KAISECHALTAHAI3D #10. 1 unit = 1 m. New bridge along x (mainland -x, Pamban island +x), lift span centred at x = 0. Old bridge at z = -60.
import { THREE, V, TAU, W, H, film, scene, renderer, mat, add, group, rod, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 49.8;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const DECK = 6.5, OLD_Z = -60, OLD_DECK = 4.2, SPAN = 72.5, HALF = SPAN / 2;

// ================================================================ sea (animated waves; storm makes them bigger)
const waveU = { uTime: { value: 0 }, uAmp: { value: 0.35 } };
const seaM = new THREE.MeshPhysicalMaterial({ color: 0x157f96, roughness: 0.18, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.2, envMap: ENV, envMapIntensity: 0.35 });
seaM.onBeforeCompile = (sh) => { sh.uniforms.uTime = waveU.uTime; sh.uniforms.uAmp = waveU.uAmp;
  sh.vertexShader = 'uniform float uTime, uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = position;
    float w1 = sin(position.x * 0.06 + uTime * 1.3) * cos(position.y * 0.05 + uTime * 0.9), w2 = sin(position.x * 0.17 - position.y * 0.13 + uTime * 2.1);
    transformed.z += uAmp * (w1 * 1.2 + w2 * 0.5);`).replace('#include <beginnormal_vertex>', `vec3 objectNormal = normalize(vec3(-uAmp * 0.08 * cos(position.x * 0.06 + uTime * 1.3), -uAmp * 0.06 * cos(position.y * 0.05), 1.0));`); };
add(new THREE.PlaneGeometry(5000, 5000, 400, 400).rotateX(-Math.PI / 2), seaM, 0, 0, 0, scene, false).receiveShadow = true;
// land at both ends (sand + palms)
const sandM = mat(0xd8c79a, 0.95);
for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(260, 300, 3, 48), sandM, s * 1260, 0.2, 40, scene, false).receiveShadow = true;
  for (let i = 0; i < 60; i++) { const x = s * (1060 + 260 * hash(i * 3 + (s > 0 ? 1 : 0))), z = 40 + (hash(i * 5 + s) - 0.5) * 420, h = 8 + 5 * hash(i * 7);
    add(new THREE.CylinderGeometry(0.25, 0.35, h, 6), mat(0x7a5a3a, 0.9), x, h / 2 + 1.5, z, scene, false); add(new THREE.ConeGeometry(3.5, 2.2, 7), mat(0x3a7a2a, 0.85), x, h + 2, z, scene, false); }
  for (let i = 0; i < 14; i++) add(new THREE.BoxGeometry(8 + 6 * hash(i), 5 + 4 * hash(i * 3), 8), mat([0xe8e0d0, 0xf0d8b0, 0xd0e0e8][i % 3], 0.85), s * (1080 + 140 * hash(i * 11)), 4, -140 + 60 * hash(i * 13), scene, false); }

// ================================================================ new bridge: piers, deck, rails (moderate concrete)
const conc = mat(0xbdb8ae, 0.8);
const PIERS = []; for (let x = HALF; x < 1000; x += 18.3) PIERS.push(x, -x);
const pier = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.9, 1.0, DECK + 6, 14), conc, PIERS.length * 2), cap = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 1.0, 6.4), conc, PIERS.length);
{ const m = new THREE.Matrix4(); PIERS.forEach((x, i) => { for (const s of [0, 1]) { m.makeTranslation(x, (DECK - 6) / 2 - 1.5, s ? 1.9 : -1.9); pier.setMatrixAt(i * 2 + s, m); } m.makeTranslation(x, DECK - 1.3, 0); cap.setMatrixAt(i, m); }); }
pier.castShadow = true; scene.add(pier, cap);
for (const s of [-1, 1]) { const L = 1000 - HALF; add(new THREE.BoxGeometry(L, 1.3, 5.2), conc, s * (HALF + L / 2), DECK - 0.35, 0); for (const z of [-2.5, 2.5]) add(new THREE.BoxGeometry(L, 0.9, 0.18), conc, s * (HALF + L / 2), DECK + 0.75, z, scene, false); }
const railM = new THREE.MeshStandardMaterial({ color: 0xc0c4ca, metalness: 0.9, roughness: 0.3, envMap: ENV, envMapIntensity: 0.6 });
for (const s of [-1, 1]) for (const z of [-0.84, 0.84]) add(new THREE.BoxGeometry(1000 - HALF, 0.16, 0.08), railM, s * (500 + HALF / 2), DECK + 0.45, z, scene, false);
for (const z of [-2.0, 2.0]) for (const x0 of [-1, 1]) { const N = 40; for (let i = 0; i < N; i++) { const x = x0 * (HALF + 8 + i * 24); rod(V(x, DECK + 0.4, z * 1.25), V(x, DECK + 7, z * 1.25), 0.1, mat(0x8a8e94, 0.5, 0.5)); } }

// ================================================================ the lift span (BOLD: red-orange truss) + towers
const trussM = new THREE.MeshStandardMaterial({ color: 0xe8401a, metalness: 0.35, roughness: 0.38, envMap: ENV, envMapIntensity: 0.6 });
const lift = group(0, 0, 0); const TH = 8.5;
for (const z of [-2.7, 2.7]) { add(new THREE.BoxGeometry(SPAN, 0.7, 0.6), trussM, 0, DECK - 0.2, z, lift); add(new THREE.BoxGeometry(SPAN - 9, 0.6, 0.6), trussM, 0, DECK + TH, z, lift);
  rod(V(-HALF, DECK, z), V(-HALF + 4.5, DECK + TH, z), 0.32, trussM, lift); rod(V(HALF, DECK, z), V(HALF - 4.5, DECK + TH, z), 0.32, trussM, lift);
  for (let i = 0; i <= 8; i++) { const x = -HALF + 4.5 + i * (SPAN - 9) / 8; rod(V(x, DECK, z), V(x, DECK + TH, z), 0.2, trussM, lift); if (i < 8) { const x2 = x + (SPAN - 9) / 8; rod(i % 2 ? V(x, DECK, z) : V(x, DECK + TH, z), i % 2 ? V(x2, DECK + TH, z) : V(x2, DECK, z), 0.16, trussM, lift); } } }
for (let i = 0; i <= 8; i++) { const x = -HALF + 4.5 + i * (SPAN - 9) / 8; add(new THREE.BoxGeometry(0.3, 0.3, 5.4), trussM, x, DECK + TH, 0, lift, false); }
add(new THREE.BoxGeometry(SPAN, 0.5, 5.0), mat(0x4a4e54, 0.6, 0.4), 0, DECK - 0.1, 0, lift); for (const z of [-0.84, 0.84]) add(new THREE.BoxGeometry(SPAN, 0.16, 0.08), railM, 0, DECK + 0.45, z, lift, false);
const towerM = mat(0xeaeae6, 0.55, 0.2), machM = new THREE.MeshStandardMaterial({ color: 0xffc21a, roughness: 0.5, emissive: 0x000000 });
const TOW_H = 36, cws = [];
for (const sx of [-1, 1]) { const x = sx * (HALF + 3.2); for (const z of [-4.2, 4.2]) { add(new THREE.BoxGeometry(2.6, TOW_H, 2.6), towerM, x, TOW_H / 2 - 2, z); for (let y = 4; y < TOW_H - 4; y += 6) add(new THREE.BoxGeometry(2.7, 0.3, 2.7), mat(0xb8bcc2, 0.5), x, y, z, scene, false); }
  add(new THREE.BoxGeometry(4.2, 4.0, 11.6), machM, x, TOW_H - 0.5, 0); add(new THREE.BoxGeometry(4.4, 0.4, 11.8), mat(0x8a8e94, 0.5), x, TOW_H + 1.7, 0);
  for (const z of [-4.2, 4.2]) { const cw = add(new THREE.BoxGeometry(1.6, 4, 1.6), mat(0x5a5e64, 0.6, 0.5), x + sx * 0.0, 20, z + Math.sign(z) * 1.6, scene, false); cws.push(cw); } }
const cables = []; for (const sx of [-1, 1]) for (const z of [-2.7, 2.7]) { const c = add(new THREE.CylinderGeometry(0.06, 0.06, 1, 6), mat(0x222222, 0.5, 0.8), sx * (HALF - 1), 0, z, scene, false); cables.push({ c, sx, z }); }
const motorGlow = particles(80, HDR(3, 2.2, 0.4), 0.9); motorGlow.p.material.map = dotTex;

// ================================================================ old 1914 bridge (muted) with a double-leaf (scissor) span
const oldM = mat(0x8a6a52, 0.85, 0.2), leafM = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6, metalness: 0.4 });
const OPIERS = []; for (let x = 34; x < 1000; x += 12.2) OPIERS.push(x, -x);
const opier = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.0, 1.2, OLD_DECK + 6, 10), mat(0x9a9488, 0.9), OPIERS.length); { const m = new THREE.Matrix4(); OPIERS.forEach((x, i) => { m.makeTranslation(x, (OLD_DECK - 6) / 2 - 1.5, OLD_Z); opier.setMatrixAt(i, m); }); } scene.add(opier);
for (const s of [-1, 1]) { add(new THREE.BoxGeometry(966, 1.0, 3.6), oldM, s * (34 + 483), OLD_DECK - 0.4, OLD_Z); for (const z of [-1.7, 1.7]) add(new THREE.BoxGeometry(966, 1.6, 0.25), oldM, s * (34 + 483), OLD_DECK + 0.5, OLD_Z + z, scene, false); }
const leaves = []; for (const s of [-1, 1]) { const pivot = group(s * 33, OLD_DECK, OLD_Z); const leaf = group(-s * 16.5, 0, 0, pivot);
  add(new THREE.BoxGeometry(33, 0.8, 3.6), leafM, 0, -0.4, 0, leaf); for (const z of [-1.7, 1.7]) { add(new THREE.BoxGeometry(33, 2.4, 0.3), leafM, 0, 0.9, z, leaf); for (let i = 0; i < 6; i++) rod(V(-15 + i * 6, 0, z), V(-12 + i * 6, 2.1, z), 0.1, leafM, leaf); }
  add(new THREE.CylinderGeometry(4, 4, 4.2, 24, 1, false, 0, Math.PI).rotateX(Math.PI / 2), mat(0x6a5a4a, 0.7, 0.3), s * 16.5, 0, 0, leaf); add(new THREE.BoxGeometry(6, 5, 4), mat(0x5a5048, 0.8), s * 18, 3.5, 0, leaf); leaves.push({ pivot, s }); }

// ================================================================ train (blue coaches) + ship
const coachT = (() => { const c = cv(1024, 256), g = c.getContext('2d'); g.fillStyle = '#1d4f9a'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#f2f2f2'; g.fillRect(0, 150, 1024, 14);
  g.fillStyle = '#0c1a30'; for (let x = 40; x < 990; x += 72) g.fillRect(x, 70, 46, 54); g.fillStyle = '#c8ccd2'; for (const x of [12, 980]) g.fillRect(x, 60, 32, 150); return tex(c); })();
const locoT = (() => { const c = cv(1024, 256), g = c.getContext('2d'); g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, 1024, 256); g.fillStyle = '#c8281a'; g.fillRect(0, 120, 1024, 70); g.fillStyle = '#1a1a1a'; g.fillRect(860, 40, 120, 60); return tex(c); })();
const train = group(0, 0, 0); const CL = 22, NC = 7;
for (let i = 0; i < NC; i++) { const L = i === 0 ? 19 : CL, m = new THREE.MeshStandardMaterial({ map: i === 0 ? locoT : coachT, roughness: 0.45, metalness: 0.2, envMap: ENV, envMapIntensity: 0.4 });
  add(new THREE.BoxGeometry(L, 3.6, 3.1), m, -i * (CL + 0.8) - L / 2, DECK + 2.5, 0, train); add(new THREE.BoxGeometry(L, 0.25, 3.0), mat(0x2a2c30, 0.6), -i * (CL + 0.8) - L / 2, DECK + 4.4, 0, train, false); }
add(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: HDR(3, 3, 2.6) }), 0.1, DECK + 3.4, 0, train, false);
const ship = group(0, 0, 0); { const hull = new THREE.Shape(); hull.moveTo(-26, 0); hull.lineTo(22, 0); hull.lineTo(30, 3); hull.lineTo(-28, 3); hull.closePath();
  add(new THREE.ExtrudeGeometry(hull, { depth: 8, bevelEnabled: false }).translate(0, -0.5, -4), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 }), 0, 0, 0, ship);
  add(new THREE.BoxGeometry(58, 0.8, 8.2), mat(0xc8281a, 0.6), 1, 0.3, 0, ship, false); add(new THREE.BoxGeometry(18, 5, 6.5), mat(0xf6f6f4, 0.5), -6, 5, 0, ship); add(new THREE.BoxGeometry(9, 3, 6), mat(0xf6f6f4, 0.5), -5, 9, 0, ship);
  add(new THREE.BoxGeometry(9.2, 0.8, 6.2), mat(0x1a2a3a, 0.3), -5, 9.4, 0, ship, false); rod(V(-5, 10, 0), V(-5, 17.5, 0), 0.18, mat(0xdddddd, 0.4), ship); add(new THREE.BoxGeometry(0.2, 0.2, 4), mat(0xdddddd, 0.4), -5, 16, 0, ship, false);
  ship.rotation.y = Math.PI / 2; }
const wake = particles(220, HDR(1.4, 1.5, 1.5), 1.6, { additive: false, opacity: 0.7 }); wake.p.material.map = dotTex;
// storm: rain + spray
const rain = particles(2500, HDR(0.8, 0.85, 0.95), 0.16, { additive: false, opacity: 0.6 });
const spray = particles(300, HDR(1.3, 1.4, 1.4), 1.0, { additive: false, opacity: 0.6 }); spray.p.material.map = dotTex;
const shine = particles(120, HDR(3, 3, 2.6), 0.7); shine.p.material.map = dotTex;

// ================================================================ photos
const PH = { nw: await img('img/new_bridge.jpg'), old: await img('img/old_bridge.jpg') };
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 28px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); } g.restore();
}

// ================================================================ timeline
const LIFT = (t) => t < 3.24 ? 17 : t < 30 ? 17 * smooth(seg(t, 20.9, 23.5)) * (1 - smooth(seg(t, 24.7, 26.2))) : 17 * smooth(seg(t, 44.1, 45.4)) * (1 - smooth(seg(t, 46.5, 47.5)));
const SHIPZ = (t) => t < 3.24 ? -18 + 12 * t : (t >= 17.3 && t < 28.4) ? -130 + 26 * (t - 18) : (t >= 44.06) ? -60 + 28 * (t - 44.06) : null;
const TRAINX = (t) => (t >= 26.2 && t < 28.4) ? -20 + 22 * (t - 26.2) : (t >= 37.64 && t < 44.06) ? -90 + 22 * (t - 37.64) : (t >= 47.55) ? -30 + 22 * (t - 47.55) : (t >= 7.92 && t < 13.2) ? -420 + 22 * (t - 7.92) : null;
const OPEN = (t) => t >= 28.4 && t < 37.64 ? smooth(seg(t, 31.2, 33.0)) * (1 - smooth(seg(t, 34.2, 35.4))) : 0;
const STORM = (t) => t >= 34.06 && t < 37.64 ? smooth(seg(t, 34.06, 34.6)) : 0;

const DAY = { e: 40, az: 2.3, sun: 2.9, ambI: 0.6, fog: 0.00025, exposure: 1.0 };
const GOLD = { e: 20, az: 3.6, sun: 2.8, ambI: 0.7, fog: 0.0005, exposure: 1.1 };
const STM = { e: 40, az: 3.6, sun: 0.5, ambI: 0.6, amb: '#8090a0', fog: 0.005, fogCol: '#56606a', exposure: 0.75 };
const KEYS = [
  [0, 0, V(62, 14, 74), V(0, 16, 0), 44, DAY], [0.05, 3.2, V(44, 12, 60), V(0, 15, 0), 44, DAY],
  [3.24, 3.24, V(-1260, 240, 250), V(200, 0, 0), 40, DAY], [3.3, 7.8, V(-1200, 190, 190), V(250, 0, 0), 40, DAY],
  [7.92, 7.92, V(-330, 12, 34), V(-200, 7, 0), 44, DAY], [7.95, 13.1, V(-150, 14, 40), V(0, 10, 0), 44, DAY],
  [13.2, 13.2, V(56, 9, 52), V(0, 11, 0), 44, DAY], [13.25, 16.3, V(48, 11, 46), V(0, 12, 0), 44, DAY],
  [16.4, 16.4, V(115, 20, 112), V(0, 13, 0), 46, DAY], [16.45, 24.3, V(100, 17, 104), V(0, 14, 0), 46, DAY],
  [24.36, 24.36, V(88, 12, 72), V(-8, 9, 0), 44, DAY], [24.4, 28.3, V(80, 11, 64), V(-2, 9, 0), 44, DAY],
  [28.4, 28.4, V(72, 13, -170), V(0, 8, OLD_Z), 44, GOLD], [28.45, 34.0, V(58, 11, -150), V(0, 9, OLD_Z), 44, GOLD],
  [34.06, 34.06, V(48, 5, -118), V(-6, 6, OLD_Z), 46, STM], [34.1, 37.55, V(40, 6, -110), V(-4, 6, OLD_Z), 46, STM],
  [37.64, 37.64, V(84, 17, 84), V(0, 10, 0), 44, DAY], [37.7, 44.0, V(56, 13, 64), V(0, 10, 0), 44, DAY],
  [44.06, 44.06, V(96, 17, 98), V(0, 14, 0), 46, DAY], [44.1, 49.8, V(80, 14, 86), V(0, 13, 0), 46, DAY]];
const F = film({ total, keys: KEYS, exposure: 1.0, lens: false, shutter: 0.25 / 30, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' },
  hits: [[23.5, 0.01], [26.2, 0.01], [36.0, 0.02]],
  titles: [[-1, 3.1, 'ट्रेन का पुल… हवा में!', 100, '#ffd24a', 300, 'जहाज़ के लिए ऊपर उठता है'], [3.3, 7.8, 'नया पंबन ब्रिज', 110, '#7fd8ff', 300, 'रामेश्वरम, तमिलनाडु'],
    [10.5, 13.1, 'भारत का पहला', 96, '#ffd24a', 300, 'वर्टिकल-लिफ़्ट समुद्री पुल'], [13.3, 16.3, '72 मीटर स्टील', 104, '#ff7a4a', 300, 'बीच का उठने वाला हिस्सा'],
    [21.0, 24.2, '↑ 17 मीटर!', 130, '#5dff8a', 300], [26.3, 28.3, 'ट्रेन के लिए तैयार', 96, '#7fd8ff', 300], [28.5, 31.1, '1914 का पुराना पुल', 96, '#ffb21a', 300],
    [31.4, 33.9, 'कैंची की तरह खुलता था', 86, '#ffb21a', 300], [34.2, 37.5, '100+ साल', 120, '#ffffff', 300, 'लहरें और तूफ़ान झेले'], [37.8, 40.2, '2025 से शुरू', 110, '#5dff8a', 300],
    [44.2, 999, 'पुल भी रास्ता देता है…', 86, '#ffd24a', 300, 'जहाज़ को भी, ट्रेन को भी!']],
  pills: [[8.4, 10.3, 'लंबाई ≈ 2 किलोमीटर', 1300, '#7fd8ff'], [19.0, 20.8, 'टावरों में मोटरें', 1300, '#ffc21a'], [40.5, 43.9, 'खारे पानी से लड़ने वाला स्टील + पेंट', 1300, '#5dff8a']],
  labels: [[3.6, 7.7, 'मंडपम (मुख्य भूमि)', V(-1050, 3, 40), 120, -200, '#ffd24a'], [4.2, 7.7, 'रामेश्वरम (पंबन द्वीप)', V(1100, 3, 40), -40, -180, '#5dff8a']],
  overlay: (g, t, { txt, pill }) => {
    if (t >= 20.9 && t < 24.4) txt(`${LIFT(t).toFixed(1)} m`, 540, 1250, 90, '#5dff8a', seg(t, 20.9, 21.2) * (1 - seg(t, 24.1, 24.4)), 1, 10);
    if (t >= 35.2 && t < 36.0) { g.save(); g.fillStyle = `rgba(230,240,255,${0.5 * (1 - seg(t, 35.25, 35.6))})`; g.fillRect(0, 0, W, H); g.restore(); }
    const card = (im, a, b2, x, y, w, rot, cap) => { if (t < a || t > b2) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b2 - 0.3, b2)); paper(g, im, x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card(PH.nw, 5.0, 7.8, 540, 1140, 900, -0.02, 'नया पंबन ब्रिज (असली)');
    card(PH.old, 29.2, 31.3, 540, 1120, 880, 0.02, 'पुराना पंबन ब्रिज, 1914 (असली)');
  } });
const { on } = F;

on((t) => {
  waveU.uTime.value = t; const st = STORM(t); waveU.uAmp.value = 0.35 + 1.4 * st;
  const h = LIFT(t); lift.position.y = h; cws.forEach((c) => (c.position.y = 30 - h * 1.3)); cables.forEach(({ c, sx, z }) => { const top = TOW_H - 2, bot = DECK + TH + h; c.position.set(sx * (HALF - 1), (top + bot) / 2, z); c.scale.y = Math.max(0.01, top - bot); });
  const motors = (t >= 19.8 && t < 23.6) || (t >= 44.06 && t < 45.5) || (t >= 24.7 && t < 26.2) || (t >= 46.5 && t < 47.5); machM.emissive.setRGB(motors ? 0.6 + 0.3 * Math.sin(t * 20) : 0, motors ? 0.35 : 0, 0);
  for (let i = 0; i < motorGlow.n; i++) { const on2 = motors && t >= 19.8 && t < 21; const sx = i % 2 ? 1 : -1; motorGlow.pos.set(on2 ? [sx * (HALF + 3.2) + (hash(i) - 0.5) * 4, TOW_H - 0.5 + (hash(i * 3) - 0.5) * 3, (hash(i * 5) - 0.5) * 11] : [0, -999, 0], i * 3); } motorGlow.geo.attributes.position.needsUpdate = true;
  const sz = SHIPZ(t); ship.visible = sz !== null; if (sz !== null) { ship.position.set(-6, 0.2 + 0.25 * Math.sin(t * 1.4), sz); ship.rotation.z = 0.02 * Math.sin(t * 1.1); }
  for (let i = 0; i < wake.n; i++) { const k = (t * 0.5 + hash(i)) % 1; wake.pos.set(sz !== null ? [-6 + (hash(i * 3) - 0.5) * 9 * (1 + 2 * k), 0.6, sz - 28 - 70 * k] : [0, -999, 0], i * 3); } wake.geo.attributes.position.needsUpdate = true;
  const tx = TRAINX(t); train.visible = tx !== null; if (tx !== null) train.position.x = tx;
  const o = OPEN(t); leaves.forEach(({ pivot, s }) => (pivot.rotation.z = -s * 1.05 * o));
  for (let i = 0; i < rain.n; i++) { const k = (t * 1.6 + hash(i)) % 1; rain.pos.set(st > 0.01 ? [-40 + 110 * hash(i * 3), 40 - 44 * k, -150 + 120 * hash(i * 5)] : [0, -999, 0], i * 3); } rain.geo.attributes.position.needsUpdate = true;
  for (let i = 0; i < spray.n; i++) { const k = (t * 0.9 + hash(i * 7)) % 1, x = OPIERS[(i * 7) % 40] * (i % 2 ? 1 : -1); spray.pos.set(st > 0.01 ? [x + (hash(i) - 0.5) * 4, 1 + 7 * Math.sin(k * Math.PI), OLD_Z + 2 + 4 * k] : [0, -999, 0], i * 3); } spray.geo.attributes.position.needsUpdate = true;
  for (let i = 0; i < shine.n; i++) { const on2 = t >= 40.4 && t < 44.0, k = (t * 0.7 + hash(i)) % 1; shine.pos.set(on2 ? [-HALF + SPAN * hash(i * 3), DECK + 0.5 + TH * hash(i * 5), (hash(i * 7) < 0.5 ? -2.8 : 2.8)] : [0, -999, 0], i * 3); } shine.geo.attributes.position.needsUpdate = true;
  shine.p.material.opacity = 0.5 + 0.5 * Math.sin(t * 9);
});
