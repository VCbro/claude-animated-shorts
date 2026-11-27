// GPS आपको कैसे ढूँढता है — KAISECHALTAHAI3D. 3D: night city + phone, the Earth (NASA Blue Marble), 31 GPS satellites,
// the signal, four distance spheres, spacetime curvature, NavIC. Real photos are HD paper cut-outs drawn at full resolution
// in the overlay (never re-sampled through the 3D render). Cartoon Einstein for the ending.
import { THREE, V, TAU, W, H, film, scene, renderer, sun, mat, add, group, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 60.5;
sun.visible = false; sun.castShadow = false;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const at = (o, x, y, z) => V(o.x + x, o.y + y, o.z + z);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const glow = (col, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); m.scale.setScalar(s); scene.add(m); return m; };

// ================================================================ SPACE: Earth, GPS constellation (Earth radius = 1)
const E0 = V(0, 0, 0), RO = 26571 / 6371;            // GPS orbit radius in Earth radii
const earthTex = tex(await img('img/earth.jpg'));
const earth = add(new THREE.SphereGeometry(1, 128, 96), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.85, metalness: 0 }), 0, 0, 0, scene, false);
earth.rotation.y = -1.9;                               // India towards the camera side
const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.035, 96, 64), new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(vec3(0.35, 0.6, 1.4) * f * 1.6, 1.0); }' }));
scene.add(atmo);
const sunL = new THREE.DirectionalLight(0xfff4e6, 3.2); sunL.position.set(6, 2, 5); scene.add(sunL);
const stars = particles(2600, HDR(1, 1, 1.1), 0.9); stars.p.material.map = dotTex; stars.p.material.transparent = true; stars.p.material.sizeAttenuation = false; stars.p.material.size = 2.2;
for (let i = 0; i < stars.n; i++) { const a = hash(i) * TAU, e = Math.acos(2 * hash(i * 1.7) - 1), r = 400; stars.pos[i * 3] = r * Math.sin(e) * Math.cos(a); stars.pos[i * 3 + 1] = r * Math.cos(e); stars.pos[i * 3 + 2] = r * Math.sin(e) * Math.sin(a); }
// constellation: 6 planes x 5 satellites, inclination 55°
const SATS = [], orbitLines = [];
const goldFoil = new THREE.MeshStandardMaterial({ color: 0xe8b04a, metalness: 1, roughness: 0.35, envMap: ENV, envMapIntensity: 0.6 });
const panelTex = (() => { const c = cv(256, 128), g = c.getContext('2d'); g.fillStyle = '#16244a'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#4a6ab0'; g.lineWidth = 2;
  for (let x = 0; x <= 256; x += 21) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); } for (let y = 0; y <= 128; y += 21) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } return tex(c); })();
const panelM = new THREE.MeshStandardMaterial({ map: panelTex, metalness: 0.6, roughness: 0.3, envMap: ENV, envMapIntensity: 0.8 });
function satModel(s = 1) {
  const g = new THREE.Group(); g.scale.setScalar(s);
  add(new THREE.BoxGeometry(1, 1.2, 1), goldFoil, 0, 0, 0, g, false);
  for (const k of [-1, 1]) { add(new THREE.BoxGeometry(2.6, 0.03, 1.1), panelM, k * 1.95, 0, 0, g, false); add(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), mat(0xcccccc, 0.4, 0.8), k * 0.6, 0, 0, g, false).rotation.z = Math.PI / 2; }
  const arr = new THREE.Group(); arr.position.y = -0.75; g.add(arr); add(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 24), mat(0xdddddd, 0.4, 0.5), 0, 0, 0, arr, false);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; add(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8), mat(0xf4f4f4, 0.5), Math.cos(a) * 0.3, -0.18, Math.sin(a) * 0.3, arr, false); }
  scene.add(g); return g;
}
const orbitPos = (plane, k, t) => { const raan = plane / 6 * TAU, inc = 55 * Math.PI / 180, u = k / 5 * TAU + plane * 0.5 + t * 0.06;
  const p = V(Math.cos(u) * RO, 0, Math.sin(u) * RO); p.applyAxisAngle(V(1, 0, 0), inc); p.applyAxisAngle(V(0, 1, 0), raan); return p; };
for (let pl = 0; pl < 6; pl++) {
  const pts = []; for (let i = 0; i <= 160; i++) { const raan = pl / 6 * TAU, inc = 55 * Math.PI / 180, u = i / 160 * TAU; const p = V(Math.cos(u) * RO, 0, Math.sin(u) * RO); p.applyAxisAngle(V(1, 0, 0), inc); p.applyAxisAngle(V(0, 1, 0), raan); pts.push(p); }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: HDR(0.25, 0.5, 0.9), transparent: true, opacity: 0.45 })); scene.add(l); orbitLines.push(l);
  for (let k = 0; k < 5; k++) { const m = satModel(0.05), gl = glow(HDR(1.4, 1.6, 2.4), 0.35); SATS.push({ m, gl, pl, k }); }
}
const extra = satModel(0.05), extraGl = glow(HDR(1.4, 1.6, 2.4), 0.35);
// the target point (India, near Bhopal) and four chosen satellites
const ll = (lat, lon, r = 1) => { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180; return V(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)); };
const P_LOCAL = ll(23.2, 77.4, 1.0);
const toWorld = (v) => v.clone().applyEuler(earth.rotation);
const P = toWorld(P_LOCAL);
const up = P.clone().normalize(), tA = V(0, 1, 0).cross(up).normalize(), tB = up.clone().cross(tA).normalize();
const S4 = [[0.0, 0.0], [2.2, 0.4], [-1.4, 1.9], [-0.6, -2.3]].map(([a, b]) => P.clone().addScaledVector(up, 3.2).addScaledVector(tA, a).addScaledVector(tB, b).normalize().multiplyScalar(RO));
const hero = satModel(0.12); hero.position.copy(S4[0]); hero.lookAt(E0); hero.rotateX(Math.PI / 2);
const sphereMat = (col) => new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, uniforms: { c: { value: col }, a: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 c; uniform float a; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(c * (0.015 + f * 0.35) * a, 1.0); }' });
const COLS = [HDR(1.6, 0.6, 0.3), HDR(0.3, 1.2, 1.8), HDR(1.4, 1.2, 0.2), HDR(0.9, 0.4, 1.8)];
const SPH = S4.map((s, i) => { const r = s.distanceTo(P), m = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), sphereMat(COLS[i])); m.position.copy(s); scene.add(m); return { m, r }; });
// circle of spheres 1∩2, and the second crossing with sphere 3
const d12 = S4[1].distanceTo(S4[0]), u12 = S4[1].clone().sub(S4[0]).normalize(), a12 = (SPH[0].r ** 2 - SPH[1].r ** 2 + d12 * d12) / (2 * d12);
const cC = S4[0].clone().addScaledVector(u12, a12), cR = Math.sqrt(SPH[0].r ** 2 - a12 * a12);
const cA = P.clone().sub(cC).normalize(), cB = u12.clone().cross(cA).normalize();
const circAt = (th) => cC.clone().addScaledVector(cA, Math.cos(th) * cR).addScaledVector(cB, Math.sin(th) * cR);
const circle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 200 }, (_, i) => circAt(i / 200 * TAU)), true), 400, 0.012, 8, true), new THREE.MeshBasicMaterial({ color: HDR(2.5, 2.2, 1.2) }));
scene.add(circle);
let P2 = null; { let best = 1e9; for (let i = 1; i < 2000; i++) { const th = i / 2000 * TAU, x = circAt(th); if (x.distanceTo(P) < 0.2) continue; const e = Math.abs(x.distanceTo(S4[2]) - SPH[2].r); if (e < best) { best = e; P2 = x; } } }
const ptA = glow(HDR(3, 2.6, 1.4), 0.25), ptB = glow(HDR(3, 2.6, 1.4), 0.25); ptA.position.copy(P); ptB.position.copy(P2);
const pin = new THREE.Group(); scene.add(pin);
add(new THREE.SphereGeometry(0.035, 20, 14), new THREE.MeshStandardMaterial({ color: 0xe8282c, roughness: 0.35, emissive: 0x400000 }), 0, 0.09, 0, pin, false);
add(new THREE.ConeGeometry(0.022, 0.07, 18).rotateX(Math.PI), new THREE.MeshStandardMaterial({ color: 0xe8282c, roughness: 0.35 }), 0, 0.045, 0, pin, false);
const pinHalo = glow(HDR(2.6, 0.4, 0.4), 0.2);
// signal: expanding rings from the hero + a light pulse to P
const rings = Array.from({ length: 4 }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 80), new THREE.MeshBasicMaterial({ color: HDR(0.6, 1.6, 2.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(m); return m; });
const pulse = glow(HDR(1.6, 2.4, 3.2), 0.18);
const beamG = new THREE.BufferGeometry().setFromPoints([S4[0], P]); const beam = new THREE.Line(beamG, new THREE.LineDashedMaterial({ color: HDR(0.8, 1.6, 2.4), dashSize: 0.08, gapSize: 0.05, transparent: true })); beam.computeLineDistances(); scene.add(beam);
// NavIC: 7 satellites (3 GEO + 4 IGSO) over the Indian Ocean
const RG = 42164 / 6371;
const NAV = Array.from({ length: 7 }, (_, i) => { const lon = [32.5, 83, 131.5, 55, 55, 111.75, 111.75][i], lat = [0, 0, 0, 22, -22, 22, -22][i]; const m = satModel(0.06), gl = glow(HDR(2.4, 1.2, 0.3), 0.5); return { m, gl, p: toWorld(ll(lat, lon, RG)) }; });

// ================================================================ CITY at night + the phone
const CT = V(400, 0, 0);
const winTex = (() => { const c = cv(256, 512), g = c.getContext('2d'); g.fillStyle = '#0c0e18'; g.fillRect(0, 0, 256, 512);
  for (let y = 10; y < 512; y += 22) for (let x = 10; x < 256; x += 22) { if (hash(x * 7 + y * 13) < 0.42) { g.fillStyle = hash(x + y) < 0.5 ? '#ffd28a' : '#9fc4ff'; g.fillRect(x, y, 12, 14); } } return tex(c); })();
for (let i = 0; i < 70; i++) { const h = 3 + 14 * hash(i * 3.3) ** 1.6, w = 1.5 + 2 * hash(i), x = (hash(i * 1.9) - 0.5) * 60, z = -12 - 30 * hash(i * 2.7);
  const m = new THREE.MeshStandardMaterial({ color: 0x151824, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.9, roughness: 0.8 }); winTex.repeat.set(1, 1);
  add(new THREE.BoxGeometry(w, h, w), m, CT.x + x, h / 2 - 3, CT.z + z, scene, false); }
add(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), mat(0x0a0b10, 0.9), CT.x, -3, CT.z, scene, false);
const phone = new THREE.Group(); phone.position.copy(CT); scene.add(phone);
add(new RoundedBoxGeometry(0.75, 1.55, 0.08, 6, 0.09), new THREE.MeshStandardMaterial({ color: 0x141418, metalness: 0.6, roughness: 0.3, envMap: ENV, envMapIntensity: 0.6 }), 0, 0, 0, phone, false);
const mapC = cv(512, 1050), mapG = mapC.getContext('2d'), mapT = tex(mapC);
const screen = add(new THREE.PlaneGeometry(0.69, 1.45), new THREE.MeshBasicMaterial({ map: mapT, color: HDR(0.8, 0.8, 0.8) }), 0, 0, 0.042, phone, false);
const phoneGlow = new THREE.PointLight(0x9fc8ff, 0, 4, 1.5); phoneGlow.position.set(0, 0, 0.6); phone.add(phoneGlow);
const skySat = satModel(0.35); const skySatGl = glow(HDR(1.4, 1.6, 2.4), 1.6);
function drawMap(t) {
  const g = mapG; g.fillStyle = '#1b2233'; g.fillRect(0, 0, 512, 1050);
  g.fillStyle = '#1f3a2c'; g.fillRect(40, 120, 180, 220); g.fillRect(300, 640, 170, 200); g.fillStyle = '#16365a'; g.beginPath(); g.ellipse(380, 260, 90, 60, 0.4, 0, TAU); g.fill();
  g.strokeStyle = '#3a4560'; g.lineWidth = 26; g.lineCap = 'round'; for (const [a, b, c, d] of [[0, 520, 512, 470], [250, 0, 270, 1050], [0, 860, 512, 900], [90, 0, 120, 1050]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
  g.strokeStyle = '#b8862e'; g.lineWidth = 16; g.beginPath(); g.moveTo(0, 520); g.lineTo(512, 470); g.stroke();
  const drift = t > 43.7 && t < 48 ? seg(t, 44.8, 47.8) : 0, px = 262 + 200 * drift, py = 500 - 300 * drift;
  const r = 18 + 10 * (0.5 + 0.5 * Math.sin(t * 5)); g.fillStyle = 'rgba(40,120,255,0.25)'; g.beginPath(); g.arc(px, py, r * 2.2, 0, TAU); g.fill();
  g.fillStyle = '#2a7bff'; g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.arc(px, py, 18, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, 512, 60); g.fillStyle = '#fff'; g.font = '800 30px BalooL, sans-serif'; g.fillText('9:41', 24, 42); g.fillText('GPS ●', 380, 42);
  mapT.needsUpdate = true;
}
// cartoon Einstein (SVG) popping out of the phone at the end
const einsteinSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700">
  <defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#f2c9a0"/><stop offset="1" stop-color="#d9a87c"/></linearGradient></defs>
  <path d="M120 700 Q110 520 300 500 Q490 520 480 700 Z" fill="#6a6a78" stroke="#26160c" stroke-width="8"/>
  <path d="M250 500 L300 560 L350 500" fill="#f4f4f4" stroke="#26160c" stroke-width="6"/>
  ${Array.from({ length: 22 }, (_, i) => { const a = Math.PI * (0.95 + i / 21 * 1.1), r = 190 + (i % 3) * 30; return `<path d="M300 250 Q${300 + Math.cos(a) * r * 0.6} ${250 + Math.sin(a) * r * 0.6} ${300 + Math.cos(a) * r} ${250 + Math.sin(a) * r}" fill="none" stroke="#f4f4f4" stroke-width="34" stroke-linecap="round"/>`; }).join('')}
  <ellipse cx="300" cy="300" rx="130" ry="150" fill="url(#s)" stroke="#26160c" stroke-width="8"/>
  <path d="M200 170 Q300 120 400 170" fill="none" stroke="#f4f4f4" stroke-width="40" stroke-linecap="round"/>
  <ellipse cx="250" cy="290" rx="26" ry="20" fill="#fff" stroke="#26160c" stroke-width="6"/><ellipse cx="350" cy="290" rx="26" ry="20" fill="#fff" stroke="#26160c" stroke-width="6"/>
  <circle cx="254" cy="292" r="11" fill="#2a1a0c"/><circle cx="346" cy="292" r="11" fill="#2a1a0c"/>
  <path d="M218 252 Q250 236 282 254 M318 254 Q350 236 382 252" fill="none" stroke="#f4f4f4" stroke-width="16" stroke-linecap="round"/>
  <path d="M300 300 Q292 340 308 346" fill="none" stroke="#8a5a3a" stroke-width="6"/>
  <path d="M230 372 Q300 340 370 372 Q340 392 300 384 Q260 392 230 372 Z" fill="#f4f4f4" stroke="#26160c" stroke-width="6"/>
  <path d="M262 404 Q300 430 338 404" fill="none" stroke="#7a1e24" stroke-width="8" stroke-linecap="round"/>
  <path d="M260 440 Q300 470 340 440 L300 470 Z" fill="#e85a6a" stroke="#26160c" stroke-width="6"/></svg>`;
const einIm = await img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(einsteinSVG));
const einC = cv(640, 740), eg = einC.getContext('2d'); for (let a = 0; a < 24; a++) eg.drawImage(einIm, 20 + Math.cos(a / 24 * TAU) * 12, 20 + Math.sin(a / 24 * TAU) * 12); eg.globalCompositeOperation = 'source-in'; eg.fillStyle = '#f6f0e1'; eg.fillRect(0, 0, 640, 740); eg.globalCompositeOperation = 'source-over'; eg.drawImage(einIm, 20, 20);
const einT = tex(einC); const einMesh = add(new THREE.PlaneGeometry(0.62, 0.72).translate(0, 0.36, 0), new THREE.MeshBasicMaterial({ map: einT, alphaTest: 0.5 }), 0, 0, 0.05, phone, false);

// ================================================================ SPACETIME: a curved grid with Earth in the well and two clocks
const GR = V(800, 0, 0);
{ const n = 70, size = 14, pos = [];
  const hgt = (x, z) => -1.6 / Math.sqrt(1 + (x * x + z * z) / 1.2);
  for (let i = 0; i <= n; i++) for (let j = 0; j < n; j++) { const a = -size / 2 + i * size / n, b0 = -size / 2 + j * size / n, b1 = b0 + size / n;
    pos.push(a, hgt(a, b0), b0, a, hgt(a, b1), b1, b0, hgt(b0, a), a, b1, hgt(b1, a), a); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const grid = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: HDR(0.3, 0.8, 1.6), transparent: true, opacity: 0.6 })); grid.position.copy(GR); scene.add(grid); }
const smallEarth = add(new THREE.SphereGeometry(0.75, 64, 48), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.8 }), GR.x, GR.y - 1.0, GR.z, scene, false);
const gSat = satModel(0.12);
function clockFace() { const c = cv(256, 256), t = tex(c), m = new THREE.Mesh(new THREE.CircleGeometry(0.45, 48), new THREE.MeshBasicMaterial({ map: t, transparent: true })); scene.add(m); return { c, t, m }; }
const clkE = clockFace(), clkS = clockFace();
function drawClock(k, sec, label, col) { const g = k.c.getContext('2d'); g.clearRect(0, 0, 256, 256); g.fillStyle = '#fbf7ec'; g.beginPath(); g.arc(128, 128, 122, 0, TAU); g.fill(); g.lineWidth = 10; g.strokeStyle = col; g.stroke();
  g.strokeStyle = '#333'; g.lineWidth = 4; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); g.lineTo(128 + Math.sin(a) * 114, 128 - Math.cos(a) * 114); g.stroke(); }
  const a = sec / 60 * TAU; g.strokeStyle = '#d02828'; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); g.stroke();
  g.fillStyle = '#222'; g.font = '800 30px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(label, 128, 190); k.t.needsUpdate = true; }

// ---------------------------------------------------------------- HD paper photos (drawn in the overlay at full resolution)
const PH = {}; for (const k of ['gps3', 'clock', 'einstein', 'irnss']) PH[k] = await img(`img/${k}.jpg`);
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 32px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); }
  g.restore();
}

// ---------------------------------------------------------------- camera
const SPACE = { sky: false, sun: 0, ambI: 0.08, amb: '#4060a0', fog: 0, exposure: 1.0, dof: 0.15 };
const CITY = { sky: false, sun: 0, ambI: 0.25, amb: '#3a4a80', fog: 0.02, fogCol: '#070a14', exposure: 1.0, dof: 0.6 };
const GRID = { sky: false, sun: 0, ambI: 0.3, amb: '#6070a0', fog: 0.0, exposure: 1.0, dof: 0.2 };
const ph = CT, Hs = S4[0];
const pOut = P.clone().normalize();
const KEYS = [
  [0, 0, at(ph, 0.35, 0.25, 3.6), at(ph, 0, 0.15, 0), 34, CITY], [0.1, 4.7, at(ph, 0.15, 0.15, 3.1), at(ph, 0, 0.12, 0), 34, CITY],
  [4.76, 5.2, at(ph, 0, 3.5, 3.0), at(ph, 0, 6, -4), 50, CITY],
  [5.26, 5.26, V(0, 2.5, 13.5), V(0, 0.3, 0), 40, SPACE], [5.36, 9.9, V(3.5, 4.5, 12.5), V(0, 0, 0), 42, SPACE],
  [10.0, 10.0, Hs.clone().add(V(0.9, 0.5, 1.0)), Hs.clone(), 34, SPACE], [10.1, 15.9, Hs.clone().add(V(0.6, 0.15, 0.7)), Hs.clone().add(V(0, -0.05, 0)), 34, SPACE],
  [16.0, 16.0, Hs.clone().multiplyScalar(1.25).add(V(1.5, 1, 1.5)), P.clone(), 40, SPACE], [16.1, 24.7, P.clone().multiplyScalar(1.6).add(tA.clone().multiplyScalar(2.2)), Hs.clone().lerp(P, 0.55), 46, SPACE],
  [24.8, 24.8, P.clone().multiplyScalar(4).add(tA.clone().multiplyScalar(9)).add(V(0, 3, 0)), P.clone().multiplyScalar(2), 46, SPACE],
  [24.9, 33.1, P.clone().multiplyScalar(3).add(tA.clone().multiplyScalar(11)).add(V(0, 2, 0)), P.clone().multiplyScalar(1.5), 46, SPACE],
  [33.2, 37.3, pOut.clone().multiplyScalar(1.55).add(tB.clone().multiplyScalar(-0.25)), P.clone(), 38, SPACE],
  [37.4, 37.4, at(GR, 0, 3.6, 8.5), at(GR, 0, 0, 0), 40, GRID], [37.5, 43.4, at(GR, 2.2, 2.4, 6.6), at(GR, 0.2, -0.3, 0), 40, GRID],
  [43.5, 43.5, pOut.clone().multiplyScalar(1.9).add(tB.clone().multiplyScalar(-0.4)), P.clone(), 40, SPACE], [43.6, 48.1, pOut.clone().multiplyScalar(1.75).add(tB.clone().multiplyScalar(-0.3)), P.clone().addScaledVector(tA, 0.12), 38, SPACE],
  [48.2, 48.2, Hs.clone().add(V(0.8, 0.4, 1.1)), Hs.clone(), 34, SPACE], [48.3, 52.4, Hs.clone().add(V(0.5, 0.2, 0.8)), Hs.clone(), 34, SPACE],
  [52.5, 52.5, toWorld(ll(5, 80, 16)), E0, 40, SPACE], [52.6, 54.7, toWorld(ll(10, 80, 13)), toWorld(ll(5, 80, 0.5)), 44, SPACE],
  [54.8, 54.8, at(ph, 0.5, 1.0, 4.4), at(ph, 0, 0.2, 0), 36, CITY], [54.9, 60.5, at(ph, 0.35, 0.25, 3.6), at(ph, 0, 0.15, 0), 34, CITY],
];
const F = film({ total, keys: KEYS, exposure: 1.0, hits: [[4.76, 0.012], [21.56, 0.01], [36.68, 0.015], [37.4, 0.02], [47.38, 0.012]],
  titles: [[-1, 4.7, 'फ़ोन कुछ नहीं भेजता… फिर भी?', 78, '#ffd24a', 300, 'GPS आपको कैसे ढूँढता है'], [5.3, 9.9, '20,200 km ऊपर', 110, '#9fd0ff', 300, '30+ GPS सैटेलाइट'],
    [19.8, 21.4, '1/15 सेकंड', 120, '#ffd24a', 300], [36.68, 37.35, 'यहाँ हो!', 130, '#ff6a6a', 300], [37.4, 38.6, 'ट्विस्ट!', 140, '#ffd24a', 300],
    [41.5, 43.6, '+38 माइक्रोसेकंड/दिन', 88, '#ffd24a', 300], [45.4, 48.1, 'रोज़ ~10 km ग़लत!', 104, '#ff6a6a', 300],
    [54.18, 54.8, 'नाविक 🇮🇳', 120, '#ffb03a', 300, 'भारत का अपना GPS'], [59.4, 999, 'फ़ोन कुछ नहीं भेजता… फिर भी?', 78, '#ffd24a', 300, 'GPS आपको कैसे ढूँढता है']],
  pills: [[12.4, 15.9, '📍 मैं यहाँ हूँ • 🕐 10:42:07.000000001', 1300, '#9fd0ff'], [21.6, 24.7, 'दूरी = देरी × रोशनी की रफ़्तार', 1300, '#ffd24a'],
    [49.0, 52.4, 'घड़ी: 10.23 MHz → 10.22999999543 MHz', 1300, '#ffd24a']],
  overlay: (g, t, { txt, pill }) => {
    if (t >= 17.0 && t < 21.5) { const k = seg(t, 17.2, 19.9), ms = Math.round(67 * k); txt(`${ms} मिलीसेकंड`, 540, 420, 74, '#ffffff', seg(t, 17.0, 17.3), 1, 10); }
    const sp = [[24.84, 'गोला 1'], [27.58, 'गोला 2 → घेरा'], [30.14, 'गोला 3 → 2 पॉइंट'], [33.22, 'गोला 4 → घड़ी ठीक']];
    for (let i = 0; i < 4; i++) { const [a, s] = sp[i], b = sp[i + 1] ? sp[i + 1][0] : 36.6; if (t >= a && t < b) pill(s, 540, 330, ['#ff9a6a', '#7fd8ff', '#ffe07a', '#c8a0ff'][i], seg(t, a, a + 0.25), 52); }
    if (t > 44.8 && t < 48.1) { const d = Math.min(3, 1 + Math.floor(seg(t, 44.8, 47.9) * 3)); txt(`दिन ${d} → ${d * 10} km`, 540, 520, 66, '#ffffff', seg(t, 44.8, 45.1), 1, 10); }
    // HD paper photos at fact beats
    const card = (k, a, b, x, y, w, rot, cap) => { if (t < a || t > b) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b - 0.3, b)); paper(g, PH[k], x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card('gps3', 7.8, 9.9, 700, 1090, 470, 0.05, 'GPS III सैटेलाइट (असली)');
    card('clock', 11.0, 12.25, 360, 1080, 520, -0.05, 'एटॉमिक घड़ी (NIST-F2)');
    card('einstein', 38.6, 41.4, 760, 1020, 400, 0.05, 'अल्बर्ट आइंस्टीन');
    card('irnss', 52.6, 54.75, 540, 1130, 640, -0.03, 'IRNSS / NavIC • ISRO');
  } });
const { on } = F;

// ---------------------------------------------------------------- animation
on((t) => {
  const space = (t >= 5.26 && t < 37.4) || (t >= 43.5 && t < 54.8), city = t < 5.26 || t >= 54.8, grid = t >= 37.4 && t < 43.5;
  earth.visible = atmo.visible = space; sunL.visible = space || grid;
  earth.rotation.y = -1.9;                                       // fixed: all geometry is computed against this pose
  SATS.forEach(({ m, gl, pl, k }) => { const p = orbitPos(pl, k, t); m.position.copy(p); m.lookAt(E0); m.rotateX(Math.PI / 2); gl.position.copy(p); m.visible = gl.visible = space && t < 33.2 || (space && t >= 43.5 && t < 52.5); });
  { const p = orbitPos(2, 2.5, t); extra.position.copy(p); extraGl.position.copy(p); extra.visible = extraGl.visible = space && t < 33.2; }
  orbitLines.forEach((l) => { l.visible = space && t < 33.2; l.material.opacity = 0.45 * (t < 24.8 ? 1 : 0.25); });
  hero.visible = space && ((t >= 9.9 && t < 24.8) || (t >= 48.2 && t < 52.5));
  // signal rings + pulse
  rings.forEach((r, i) => { const k = ((t - 12.2) * 0.9 + i / 4) % 1; r.visible = space && t > 12.2 && t < 16; r.position.copy(Hs); r.lookAt(E0); r.scale.setScalar(0.05 + 0.6 * k); r.material.opacity = 1 - k; });
  const pk = seg(t, 17.2, 19.9); pulse.visible = space && t > 16.9 && t < 24.7; pulse.position.copy(Hs).lerp(P, pk);
  beam.visible = space && t > 16 && t < 24.8; beam.material.opacity = 0.9;
  // spheres and the narrowing
  const sA = [24.84, 27.58, 30.14, 33.22]; SPH.forEach(({ m }, i) => { m.visible = space && t >= sA[i] && t < 36.9; m.material.uniforms.a.value = smooth(seg(t, sA[i], sA[i] + 0.5)) * (1 - seg(t, 35.6, 36.6)) * 0.9; });
  circle.visible = space && t >= 28.3 && t < 33.4; circle.material.color.setScalar(2.4 * smooth(seg(t, 28.3, 28.8)));
  ptA.visible = ptB.visible = space && t >= 30.8 && t < 33.6; ptB.material.opacity = 1 - seg(t, 33.2, 33.6);
  pin.visible = pinHalo.visible = space && ((t >= 36.0 && t < 37.4) || (t >= 43.5 && t < 48.2));
  let pp = P.clone(); if (t >= 44.8 && t < 48.2) { const d = seg(t, 44.8, 47.9); pp = P.clone().addScaledVector(tA, 0.06 * d * 3).addScaledVector(tB, -0.03 * d * 3).normalize(); }
  pin.position.copy(pp); pin.quaternion.setFromUnitVectors(V(0, 1, 0), pp.clone().normalize()); pin.scale.setScalar(0.4 * (t < 43.5 ? Math.max(0.001, backOut(seg(t, 36.0, 36.5))) : 1)); pinHalo.position.copy(pp.clone().multiplyScalar(1.01)); pinHalo.scale.setScalar(0.2 + 0.05 * Math.sin(t * 6));
  // NavIC
  NAV.forEach(({ m, gl, p }, i) => { const v = space && t >= 52.5 && t < 54.8; m.visible = gl.visible = v; const k = backOut(seg(t, 52.6 + i * 0.12, 53.0 + i * 0.12)); m.position.copy(p); gl.position.copy(p); m.scale.setScalar(Math.max(0.001, 0.06 * k)); gl.scale.setScalar(Math.max(0.001, 0.5 * k)); m.lookAt(E0); });
  // city + phone
  phone.visible = city; skySat.visible = skySatGl.visible = city; phoneGlow.intensity = 1.2;
  phone.rotation.set(-0.08 + 0.03 * Math.sin(t * 0.8), 0.25 * Math.sin(t * 0.4) - 0.1, 0.03 * Math.sin(t * 0.6)); phone.position.set(CT.x, CT.y + 0.03 * Math.sin(t * 1.2), CT.z);
  skySat.position.copy(at(CT, -1.6 + 0.08 * t % 3, 4.6, -6)); skySatGl.position.copy(skySat.position); if (city) drawMap(t);
  einMesh.visible = city && t >= 58.0 && t < 60.5; einMesh.position.set(0.05, -0.05 + 0.5 * backOut(seg(t, 58.1, 58.6)), 0.06); einMesh.scale.setScalar(Math.max(0.001, backOut(seg(t, 58.1, 58.6))));
  // spacetime grid + clocks
  gSat.visible = clkE.m.visible = clkS.m.visible = smallEarth.visible = grid;
  if (grid) { const a = t * 0.9; gSat.position.set(GR.x + Math.cos(a) * 4.2, GR.y + 0.25, GR.z + Math.sin(a) * 4.2); gSat.lookAt(GR); gSat.rotateX(Math.PI / 2);
    clkE.m.position.set(GR.x - 1.4, GR.y + 0.9, GR.z + 1.5); clkS.m.position.copy(gSat.position).add(V(0, 0.9, 0)); clkE.m.lookAt(F.camera.position); clkS.m.lookAt(F.camera.position);
    const base = (t - 37.4) * 10, fast = seg(t, 41.5, 43.3) * 6; drawClock(clkE, base, 'धरती', '#3a8a3a'); drawClock(clkS, base + fast, 'सैटेलाइट', '#d08a1a'); }
});
