// MRI मशीन के अंदर क्या होता है? — KAISECHALTAHAI3D #7. 1 unit = 1 m. Magnet centre C0, bore axis along z (front face +z).
import { THREE, V, TAU, W, H, film, scene, renderer, mat, add, group, rod, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 52.2;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const svgURL = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const C0 = V(0, 1.15, 0), M = V(200, 0, 0), up = V(0, 1, 0);

// ================================================================ the MRI room (moderate colours)
const tile = (() => { const c = cv(512, 512), g = c.getContext('2d'); g.fillStyle = '#d9dde2'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#c3c8cf'; g.lineWidth = 3; for (let i = 0; i <= 512; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,130,140,${0.05 * hash(i)})`; g.fillRect(512 * hash(i * 3), 512 * hash(i * 7), 3, 3); } const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t; })();
add(new THREE.PlaneGeometry(14, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.35, envMap: ENV, envMapIntensity: 0.3 }), 0, 0, 1, scene, false).receiveShadow = true;
const wallM = mat(0xb9c6d3, 0.85);
add(new THREE.PlaneGeometry(14, 3.4), wallM, 0, 1.7, -4, scene, false);
add(new THREE.PlaneGeometry(14, 3.4).rotateY(Math.PI), wallM, 0, 1.7, 7, scene, false);
add(new THREE.PlaneGeometry(11, 3.4).rotateY(-Math.PI / 2), wallM, 5, 1.7, 1.5, scene, false);
// left wall with a control-room window (x = -5)
for (const [z0, z1] of [[-4, -0.2], [2.6, 7]]) add(new THREE.PlaneGeometry(z1 - z0, 3.4).rotateY(Math.PI / 2), wallM, -5, 1.7, (z0 + z1) / 2, scene, false);
add(new THREE.PlaneGeometry(2.8, 0.9).rotateY(Math.PI / 2), wallM, -5, 0.45, 1.2, scene, false); add(new THREE.PlaneGeometry(2.8, 1.2).rotateY(Math.PI / 2), wallM, -5, 2.8, 1.2, scene, false);
add(new THREE.PlaneGeometry(2.8, 1.3).rotateY(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0x9fc4d8, transparent: true, opacity: 0.18, roughness: 0.02, envMap: ENV, envMapIntensity: 0.8, depthWrite: false }), -4.98, 1.55, 1.2, scene, false);
for (const y of [0.9, 2.2]) add(new THREE.BoxGeometry(0.14, 0.06, 2.92), mat(0x8a96a3, 0.5, 0.4), -5, y, 1.2, scene, false); for (const z of [-0.2, 2.6]) add(new THREE.BoxGeometry(0.14, 1.36, 0.06), mat(0x8a96a3, 0.5, 0.4), -5, 1.55, z, scene, false);
// control room behind the window: desk, monitor (scan builds up here), keyboard
add(new THREE.PlaneGeometry(4, 6).rotateX(-Math.PI / 2), mat(0x7a7e86, 0.7), -7, 0.001, 1.2, scene, false);
add(new THREE.PlaneGeometry(6, 3.4).rotateY(Math.PI / 2), mat(0x3a4250, 0.9), -8.6, 1.7, 1.2, scene, false);
add(new THREE.BoxGeometry(1.0, 0.06, 2.6), mat(0xe8e2d6, 0.6), -6.0, 0.95, 1.2, scene, false);
const scanC = cv(512, 512), scanT = tex(scanC);
const monitor = group(-6.25, 1.42, 1.2); monitor.rotation.y = Math.PI / 2;
add(new THREE.BoxGeometry(0.98, 0.78, 0.05), mat(0x15171c, 0.5), 0, 0, -0.03, monitor, false); add(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ map: scanT }), 0, 0, 0.001, monitor, false);
add(new THREE.BoxGeometry(0.08, 0.45, 0.08), mat(0x15171c, 0.5), 0, -0.45, -0.05, monitor, false);
add(new THREE.BoxGeometry(0.22, 0.02, 0.5), mat(0x2a2e36, 0.6), -5.75, 0.99, 1.2, scene, false);
// ceiling + light panels (no shadows from the ceiling)
add(new THREE.PlaneGeometry(14, 14).rotateX(Math.PI / 2), mat(0xe8ecf0, 0.9), 0, 3.4, 1, scene, false);
for (const [x, z] of [[-1.6, -1], [1.6, -1], [-1.6, 2.6], [1.6, 2.6], [0, 0.8]]) add(new THREE.PlaneGeometry(1.2, 1.2).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: HDR(2.2, 2.3, 2.5) }), x, 3.39, z, scene, false);
// warning sign on the back wall
const signC = cv(512, 360), sg = signC.getContext('2d'); sg.fillStyle = '#ffd21a'; sg.fillRect(0, 0, 512, 360); sg.strokeStyle = '#111'; sg.lineWidth = 16; sg.strokeRect(8, 8, 496, 344);
sg.fillStyle = '#111'; sg.beginPath(); sg.moveTo(256, 40); sg.lineTo(330, 170); sg.lineTo(182, 170); sg.closePath(); sg.fill(); sg.fillStyle = '#ffd21a'; sg.font = '900 90px sans-serif'; sg.textAlign = 'center'; sg.fillText('!', 256, 158);
sg.fillStyle = '#111'; sg.font = '800 50px BalooD, BalooL, sans-serif'; sg.fillText('चुंबक हमेशा चालू', 256, 240); sg.font = '800 40px BalooD, BalooL, sans-serif'; sg.fillText('धातु अंदर मना', 256, 300);
add(new THREE.PlaneGeometry(0.9, 0.63), new THREE.MeshStandardMaterial({ map: tex(signC), roughness: 0.6 }), 2.6, 1.9, -3.98, scene, false);

// ================================================================ the MRI machine (bold: glossy white + teal front + glowing bore ring)
const LEN = 1.7, R_IN = 0.36, R_OUT = 1.08;
const prof = [V(R_IN, -LEN / 2, 0), V(R_IN + 0.06, -LEN / 2 - 0.04, 0), V(R_OUT - 0.08, -LEN / 2 - 0.04, 0), V(R_OUT, -LEN / 2 + 0.05, 0), V(R_OUT + 0.02, 0, 0), V(R_OUT, LEN / 2 - 0.05, 0), V(R_OUT - 0.08, LEN / 2, 0), V(R_IN + 0.1, LEN / 2, 0), V(R_IN, LEN / 2 - 0.08, 0), V(R_IN, -LEN / 2, 0)].map((p) => new THREE.Vector2(p.x, p.y));
const shellM = new THREE.MeshPhysicalMaterial({ color: 0xf4f6f8, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, envMap: ENV, envMapIntensity: 0.9, transparent: true, opacity: 1 });
const mri = group(C0.x, C0.y, C0.z);
const shell = add(new THREE.LatheGeometry(prof, 96).rotateX(Math.PI / 2), shellM, 0, 0, 0, mri); shell.castShadow = true;
// teal front bezel + coloured band
const bezelM = new THREE.MeshPhysicalMaterial({ color: 0x0fb5c9, roughness: 0.25, clearcoat: 1, envMap: ENV, envMapIntensity: 0.8, transparent: true });
const bezel = add(new THREE.RingGeometry(R_IN + 0.04, R_OUT - 0.04, 96), bezelM, 0, 0, LEN / 2 + 0.005, mri, false);
const band = add(new THREE.CylinderGeometry(R_OUT + 0.035, R_OUT + 0.035, 0.12, 96, 1, true).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.4, transparent: true, side: THREE.DoubleSide }), 0, 0, 0.35, mri, false);
const ringGlow = add(new THREE.TorusGeometry(R_IN + 0.015, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: HDR(0.6, 2.4, 3.2), transparent: true }), 0, 0, LEN / 2 - 0.02, mri, false);
const boreLight = add(new THREE.CylinderGeometry(R_IN - 0.005, R_IN - 0.005, LEN - 0.1, 64, 1, true).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: HDR(0.55, 0.75, 0.95), side: THREE.BackSide, transparent: true }), 0, 0, 0, mri, false);
// control panel buttons on the bezel
for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.16, 0.1, 0.02), mat(0x1a2230, 0.4), s * 0.62, 0.55, LEN / 2 + 0.02, mri, false); for (let i = 0; i < 3; i++) add(new THREE.CircleGeometry(0.012, 12), new THREE.MeshBasicMaterial({ color: [HDR(0.3, 2.4, 0.6), HDR(2.4, 1.6, 0.2), HDR(0.4, 1.4, 2.6)][i] }), s * 0.62 - 0.045 + i * 0.045, 0.55, LEN / 2 + 0.031, mri, false); }
add(new THREE.BoxGeometry(1.5, 0.55, 1.4), mat(0xe6e9ec, 0.5), 0, -0.85, 0, mri);           // plinth
// inner parts (shown in x-ray): main magnet coils, helium vessel, gradient coils, RF cage
const inner = group(0, 0, 0, mri); inner.visible = false;
const copper = new THREE.MeshStandardMaterial({ color: 0xd8742a, metalness: 0.9, roughness: 0.3, envMap: ENV, emissive: 0x401800 });
const mainCoils = [-0.66, -0.4, -0.14, 0.14, 0.4, 0.66].map((z) => add(new THREE.TorusGeometry(0.82, 0.07, 16, 96), copper, 0, 0, z, inner, false));
const heM = new THREE.MeshPhysicalMaterial({ color: 0x7fb8ff, transparent: true, opacity: 0.18, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false, emissive: 0x0a2a5a });
for (const r of [0.68, 0.96]) add(new THREE.CylinderGeometry(r, r, LEN - 0.15, 64, 1, true).rotateX(Math.PI / 2), heM, 0, 0, 0, inner, false);
const gradM = new THREE.MeshStandardMaterial({ color: 0x2ad06a, emissive: 0x0a6a2a, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.3 });
const gradParts = [];
for (const z of [-0.5, 0.5]) gradParts.push(add(new THREE.TorusGeometry(0.5, 0.025, 8, 80), gradM, 0, 0, z, inner, false));
for (let i = 0; i < 4; i++) { const m = add(new THREE.TorusGeometry(0.47, 0.022, 8, 40, Math.PI * 0.75), gradM, 0, 0, 0, inner, false); m.rotation.set(Math.PI / 2, 0, i * Math.PI / 2 + 0.4); m.position.z = (i % 2 ? 0.28 : -0.28); gradParts.push(m); }
const rfM = new THREE.MeshStandardMaterial({ color: 0x4a8aff, emissive: 0x1a3a9a, emissiveIntensity: 0.6, roughness: 0.4 });
for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; add(new THREE.CylinderGeometry(0.008, 0.008, 1.1, 6).rotateX(Math.PI / 2), rfM, Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0, inner, false); }
for (const z of [-0.55, 0.55]) add(new THREE.TorusGeometry(0.4, 0.012, 6, 64), rfM, 0, 0, z, inner, false);
const frost = particles(500, HDR(1.6, 2.2, 3.0), 0.022); frost.p.material.map = dotTex; scene.remove(frost.p); inner.add(frost.p);
for (let i = 0; i < frost.n; i++) { const a = hash(i) * TAU, r = 0.7 + 0.25 * hash(i * 3); frost.pos[i * 3] = Math.cos(a) * r; frost.pos[i * 3 + 1] = Math.sin(a) * r; frost.pos[i * 3 + 2] = (hash(i * 7) - 0.5) * 1.5; } frost.geo.attributes.position.needsUpdate = true;
// patient table (slides along z)
const table = group(0, 0, 0); add(new THREE.BoxGeometry(0.62, 0.62, 2.0), mat(0xe6e9ec, 0.5), 0, 0.31, 2.0, scene);
const bed = group(0, 0, 0, table); add(new THREE.BoxGeometry(0.5, 0.06, 2.1), mat(0xdfe5ea, 0.45), 0, 0.9, 1.9, bed); add(new THREE.BoxGeometry(0.46, 0.04, 2.0), mat(0x4aa0d8, 0.7), 0, 0.945, 1.9, bed);

// ---------------------------------------------------------------- magnetic field lines (flowing dashes through the bore and around)
const dashC = cv(256, 16), dg = dashC.getContext('2d'); dg.fillStyle = '#000'; dg.fillRect(0, 0, 256, 16); const gr = dg.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, 256, 16);
const dashT = new THREE.CanvasTexture(dashC); dashT.wrapS = THREE.RepeatWrapping; dashT.repeat.set(10, 1);
const fieldLines = [];
for (let i = 0; i < 12; i++) { const ph = i / 12 * TAU, rc = 1.45 + 0.25 * (i % 3), ra = rc - 0.12 - 0.07 * (i % 3), Lz = 2.2 + 0.5 * (i % 3);
  const pts = []; for (let k = 0; k <= 96; k++) { const th = k / 96 * TAU, r = rc - ra * Math.cos(th), z = Lz * Math.sin(th); pts.push(V(Math.cos(ph) * r, Math.sin(ph) * r, z)); }
  const col = i % 2 ? HDR(0.4, 1.8, 3.0) : HDR(2.6, 0.5, 2.2);
  const m = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 192, 0.012, 6, true), new THREE.MeshBasicMaterial({ color: col, map: dashT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, 0, mri, false); fieldLines.push(m); }

// ---------------------------------------------------------------- cartoon patient (2D cut-out, lying, ear protection)
async function cutout(svgStr, { h = 1.7, border = 10, res = 1200 } = {}) {
  const im = await img(svgURL(svgStr)), iw = im.naturalWidth, ih = im.naturalHeight, sc = res / ih, w = Math.round(iw * sc) + border * 4, hh = Math.round(ih * sc) + border * 4, o = border * 2;
  const st = cv(w, hh), s2 = st.getContext('2d'); for (let a = 0; a < 24; a++) s2.drawImage(im, o + Math.cos(a / 24 * TAU) * border, o + Math.sin(a / 24 * TAU) * border, iw * sc, ih * sc);
  s2.globalCompositeOperation = 'source-in'; s2.fillStyle = '#f6f0e1'; s2.fillRect(0, 0, w, hh);
  const c = cv(w, hh), g = c.getContext('2d'); g.drawImage(st, 0, 0); g.drawImage(im, o, o, iw * sc, ih * sc); const t = tex(c);
  const geo = new THREE.PlaneGeometry(h * w / hh, h); geo.translate(0, h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.2, side: THREE.DoubleSide })); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 }); const grp = new THREE.Group(); grp.add(m); scene.add(grp); return grp;
}
const patientSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1700" height="420" viewBox="0 0 1700 420"><defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#d9a074"/><stop offset="1" stop-color="#c08a60"/></linearGradient></defs>
  <path d="M120 300 Q100 250 150 236 L460 226 Q470 300 440 330 L150 332 Q118 330 120 300 Z" fill="url(#s)" stroke="#26160c" stroke-width="9"/>
  <path d="M90 318 Q70 290 96 262 L150 250 L160 330 Z" fill="#f0f0f0" stroke="#26160c" stroke-width="8"/>
  <path d="M420 200 Q600 150 1230 170 Q1300 180 1300 260 Q1300 338 1230 342 L430 346 Q390 300 420 200 Z" fill="#6fb4e8" stroke="#26160c" stroke-width="9"/>
  ${[560, 700, 840, 980, 1120].map((x) => `<circle cx="${x}" cy="${230 + (x % 3) * 30}" r="9" fill="#ffffff" opacity="0.8"/>`).join('')}
  <path d="M700 250 Q860 236 1000 262" fill="none" stroke="#26160c" stroke-width="7" stroke-linecap="round"/><ellipse cx="1010" cy="262" rx="38" ry="24" fill="url(#s)" stroke="#26160c" stroke-width="7"/>
  <ellipse cx="1450" cy="232" rx="128" ry="118" fill="url(#s)" stroke="#26160c" stroke-width="9"/>
  <path d="M1360 150 Q1450 70 1560 150 Q1590 200 1570 250 Q1530 150 1450 140 Q1390 150 1360 210 Z" fill="#1d1612"/>
  <path d="M1478 216 Q1494 226 1510 216" fill="none" stroke="#2a1a0c" stroke-width="7" stroke-linecap="round"/><path d="M1408 216 Q1424 226 1440 216" fill="none" stroke="#2a1a0c" stroke-width="7" stroke-linecap="round"/>
  <path d="M1440 282 Q1462 296 1484 282" fill="none" stroke="#7a1e24" stroke-width="7" stroke-linecap="round"/>
  <path d="M1350 130 Q1450 40 1560 120" fill="none" stroke="#2a4a8a" stroke-width="22" stroke-linecap="round"/><ellipse cx="1452" cy="96" rx="58" ry="40" fill="#ff7a1a" stroke="#26160c" stroke-width="8"/>
  <path d="M1290 250 L1330 250" stroke="#26160c" stroke-width="8"/></svg>`;
const patient = await cutout(patientSVG, { h: 0.42, res: 600 }); patient.rotation.y = Math.PI / 2; bed.add(patient); patient.position.set(0, 0.95, 1.95);

// ---------------------------------------------------------------- scissors (metal thrown by the magnet)
const scis = group(0, 0, 0); const steel = new THREE.MeshStandardMaterial({ color: 0xd0d4da, metalness: 1, roughness: 0.2, envMap: ENV });
for (const s of [-1, 1]) { const b = group(0, 0, 0, scis); b.rotation.z = s * 0.25; add(new THREE.BoxGeometry(0.02, 0.17, 0.006), steel, 0, 0.09, 0, b, false); add(new THREE.TorusGeometry(0.03, 0.008, 6, 20), new THREE.MeshStandardMaterial({ color: 0xff3a3a, roughness: 0.5 }), 0, -0.04, 0, b, false); }
scis.visible = false;

// ================================================================ micro world (hydrogen "tops" in water)
const microBg = add(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { pulse: { value: 0 } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform float pulse; varying vec3 vP; void main(){ float y = vP.y * 0.5 + 0.5; vec3 c = mix(vec3(0.01,0.03,0.09), vec3(0.03,0.12,0.22), y); c += vec3(0.25,0.05,0.25) * pulse; gl_FragColor = vec4(c, 1.0); }' }), M.x, M.y, M.z, scene, false);
const micro = group(M.x, M.y, M.z);
const oM = new THREE.MeshPhysicalMaterial({ color: 0xe0303a, roughness: 0.25, clearcoat: 1, envMap: ENV, envMapIntensity: 0.6 });
const hM = new THREE.MeshPhysicalMaterial({ color: 0xf4f6ff, roughness: 0.2, clearcoat: 1, envMap: ENV, envMapIntensity: 0.6, emissive: 0xffd24a, emissiveIntensity: 0 });
const mols = []; for (let i = 0; i < 30; i++) { const g = group((hash(i) - 0.5) * 5, -1.2 + 6 * hash(i * 3), (hash(i * 7) - 0.5) * 4 - 1, micro); add(new THREE.SphereGeometry(0.3, 24, 16), oM, 0, 0, 0, g, false);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.19, 20, 14), hM, s * 0.26, 0.2, 0, g, false); g.rotation.set(hash(i * 11) * 6, hash(i * 13) * 6, 0); mols.push(g); }
const topTex = (() => { const c = cv(256, 128), g = c.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffb21a' : '#ff5a1a'; g.fillRect(i * 32, 0, 32, 128); } g.fillStyle = '#fff3c0'; g.fillRect(0, 56, 256, 16); return tex(c); })();
const topM = new THREE.MeshPhysicalMaterial({ map: topTex, roughness: 0.25, clearcoat: 1, envMap: ENV, envMapIntensity: 0.7, emissive: 0xffffff, emissiveMap: topTex, emissiveIntensity: 0.15 });
const arrowM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7fd8ff, emissiveIntensity: 0.9, roughness: 0.4 });
const TOPS = []; for (let i = 0; i < 24; i++) { const c = i % 4, r = Math.floor(i / 4); const home = V(-1.65 + c * 1.1 + (hash(i * 5) - 0.5) * 0.3, -1 + r * 1.0 + (hash(i * 9) - 0.5) * 0.25, (hash(i * 17) - 0.5) * 1.4);
  const g = group(home.x, home.y, home.z, micro), spin = group(0, 0, 0, g); add(new THREE.SphereGeometry(0.22, 32, 16), topM, 0, 0, 0, spin, false);
  add(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), arrowM, 0, 0.3, 0, g, false); add(new THREE.ConeGeometry(0.06, 0.14, 12), arrowM, 0, 0.6, 0, g, false); add(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), arrowM, 0, -0.3, 0, g, false);
  const rd = V(hash(i * 21) - 0.5, hash(i * 23) - 0.5, hash(i * 29) - 0.5).normalize(); TOPS.push({ g, spin, home, rd, ph: hash(i * 31) * TAU }); }
const rfRing = add(new THREE.TorusGeometry(1, 0.05, 8, 96), new THREE.MeshBasicMaterial({ color: HDR(2.8, 0.6, 2.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 1.5, 1.5, micro, false);
const coil = group(0.6, 5.1, -1.2, micro); coil.rotation.x = 1.1; add(new THREE.TorusGeometry(1.0, 0.07, 12, 96), copper, 0, 0, 0, coil, false);
const coilGlow = add(new THREE.TorusGeometry(1.0, 0.11, 8, 96), new THREE.MeshBasicMaterial({ color: HDR(2.4, 1.4, 0.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0, 0, coil, false);
const sig = particles(24 * 3, HDR(0.6, 2.6, 1.4), 0.16); sig.p.material.map = dotTex; scene.remove(sig.p); micro.add(sig.p);

// ================================================================ photos (paper cut, drawn crisp in the overlay)
const PH = { scan: await img('img/mri_scan.jpg'), machine: await img('img/mri_machine.jpg') };
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 28px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); } g.restore();
}
function drawScan(t) { const g = scanC.getContext('2d'), k = smooth(seg(t, 28.0, 32.6)); g.fillStyle = '#02040a'; g.fillRect(0, 0, 512, 512);
  if (PH.scan) { const iw = PH.scan.naturalWidth, ih = PH.scan.naturalHeight, s = Math.min(480 / iw, 480 / ih), w = iw * s, h = ih * s, x = 256 - w / 2, y = 256 - h / 2;
    g.save(); g.beginPath(); g.rect(0, 0, 512, y + h * k); g.clip(); g.drawImage(PH.scan, x, y, w, h); g.restore(); if (k < 1) { g.fillStyle = 'rgba(120,230,255,0.9)'; g.fillRect(x, y + h * k - 3, w, 6); } }
  g.fillStyle = '#5dff8a'; g.font = '700 22px sans-serif'; g.fillText(`MRI  ${Math.round(k * 100)}%`, 14, 30); scanT.needsUpdate = true; }

// ================================================================ cameras
const ROOM = { sky: false, e: 72, az: 2.5, sun: 1.7, ambI: 1.0, amb: '#d8e6ff', fog: 0.0, exposure: 1.0, dof: 0.5 };
const XR = { ...ROOM, exposure: 0.78, ambI: 0.8, dof: 0.35 };
const MIC = { sky: false, e: 55, az: 2.0, sun: 2.2, ambI: 0.8, amb: '#9ab8ff', fog: 0.0, exposure: 1.05, dof: 0.25 };
const m = (x, y, z) => V(M.x + x, M.y + y, M.z + z);
const KEYS = [
  [0, 0, V(2.3, 1.75, 4.4), V(0, 1.1, 0), 40, ROOM], [0.05, 3.8, V(1.45, 1.45, 3.3), V(0, 1.12, 0), 40, ROOM],
  [3.88, 3.88, V(3.7, 1.9, 3.7), V(0, 1.0, 1.0), 40, ROOM], [3.9, 8.0, V(3.2, 1.65, 2.6), V(0, 1.05, 0.5), 38, ROOM],
  [8.1, 8.1, V(1.3, 1.35, 2.5), V(0, 1.08, 0.3), 44, ROOM], [8.15, 9.6, V(0.04, 1.17, 1.05), V(0, 1.12, -1.0), 58, ROOM],
  [9.7, 9.7, m(0, 1.8, 11), m(0, 1.6, 0), 40, MIC], [9.75, 12.8, m(0.9, 2.0, 8.6), m(0, 1.5, 0), 42, MIC],
  [12.92, 12.92, m(-0.8, 2.3, 8.2), m(0, 1.5, 0), 44, MIC], [12.95, 17.0, m(0.8, 1.9, 8.8), m(0, 1.5, 0), 44, MIC],
  [17.1, 19.9, m(0, 1.7, 9.4), m(0, 1.5, 0), 44, MIC], [19.94, 23.9, m(-1.2, 2.4, 9.0), m(0, 1.7, 0), 46, MIC],
  [24.08, 24.08, m(0.6, 2.6, 10.2), m(0, 2.5, 0), 48, MIC], [24.1, 27.5, m(-0.4, 2.8, 9.6), m(0, 2.6, 0), 48, MIC],
  [27.64, 27.64, V(-2.3, 1.65, 2.3), V(-6.25, 1.35, 1.2), 38, ROOM], [27.7, 33.2, V(-2.9, 1.55, 1.75), V(-6.25, 1.38, 1.2), 36, ROOM],
  [33.38, 33.38, V(2.55, 1.95, 2.65), V(0, 1.12, 0), 40, XR], [33.4, 39.8, V(3.05, 1.45, 0.7), V(0, 1.12, 0), 38, XR],
  [39.98, 39.98, V(1.9, 1.5, 3.5), V(0, 1.15, 0.4), 44, XR], [40.0, 46.4, V(2.5, 1.55, 3.05), V(0, 1.15, 0.2), 42, XR],
  [46.58, 46.58, V(0, 1.4, 4.3), V(0, 1.15, 0), 40, ROOM], [46.6, 50.3, V(0.7, 1.38, 3.3), V(0, 1.15, 0), 40, ROOM],
  [50.4, 52.2, V(2.3, 1.75, 4.4), V(0, 1.1, 0), 40, ROOM]];
const KN = []; for (const [a, b] of [[4.5, 7.9], [34.2, 35.6], [36.4, 37.8]]) for (let t = a; t < b; t += 0.22) if (((t - a) / 0.22 | 0) % 6 < 4) KN.push(+t.toFixed(2));   // knock rhythm
const LOOP = (t) => t < 3.88 || t >= 50.4;
const F = film({ total, keys: KEYS, exposure: 1.0, shutter: 0.3 / 30, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' },
  hits: [...KN.filter((t) => t < 8).map((t) => [t, 0.004]), [20.5, 0.01], [40.0, 0.008]],
  titles: [[-1, 3.7, 'धरती से हज़ारों गुना ताक़तवर!', 86, '#ffd24a', 300, 'MRI मशीन के अंदर क्या होता है?'], [3.95, 6.4, 'ये आवाज़ क्या है?', 96, '#7fd8ff', 300],
    [9.7, 12.7, 'शरीर ≈ 60% पानी', 104, '#7fd8ff', 300], [12.95, 16.9, 'हर कण = छोटा लट्टू', 96, '#ffb21a', 300], [17.1, 19.8, 'चुंबक ने लाइन में खड़ा किया!', 82, '#5dff8a', 300],
    [20.3, 23.9, 'रेडियो पल्स!', 120, '#ff7ae0', 300, 'कण डगमगाए'], [24.3, 27.5, 'लौटते हुए… सिग्नल!', 96, '#5dff8a', 300],
    [33.5, 36.0, 'खट! खट! खट!', 120, '#5dff8a', 300, 'ग्रेडिएंट कॉइल'], [40.1, 43.6, '−269 °C', 150, '#9fd8ff', 300, 'लिक्विड हीलियम से ठंडा'], [43.8, 46.4, 'धातु अंदर? सख़्त मना!', 88, '#ff4a4a', 300],
    [46.7, 50.2, 'X-ray नहीं!', 120, '#ffd24a', 300, 'बस चुंबक + रेडियो लहरें'], [50.4, 999, 'धरती से हज़ारों गुना ताक़तवर!', 86, '#ffd24a', 300, 'MRI मशीन के अंदर क्या होता है?']],
  pills: [[0.5, 3.7, '1.5–3 टेस्ला  •  धरती ≈ 0.00005 टेस्ला', 1300, '#ffd24a'], [36.2, 39.7, 'सिग्नल कहाँ से आया — ये बताती हैं', 1300, '#5dff8a']],
  labels: [[34.0, 39.6, 'मुख्य चुंबक (कॉइल)', V(0.82 * 0.7, 1.15 + 0.82 * 0.7, 0.66), 200, -260, '#ff9a4a'], [34.6, 39.6, 'ग्रेडिएंट कॉइल', V(0.5, 1.15, 0.5), -60, 300, '#5dff8a'],
    [10.6, 12.7, 'हाइड्रोजन', m(-0.6, 3.0, 0), -120, -200, '#ffd24a']],
  overlay: (g, t, { txt, pill, proj }) => {
    for (const k of KN) if (t >= k && t < k + 0.2 && t < 8) { const a = 1 - (t - k) / 0.2, i = Math.round(k * 7) % 3; txt('खट!', 300 + i * 240, 620 + (i % 2) * 90, 74, '#7fd8ff', a, 0.9 + 0.3 * a, 9, (i - 1) * 0.12); }
    if (t >= 17.1 && t < 27.6) { const a = seg(t, 17.2, 17.6) * (1 - seg(t, 27.3, 27.6)); g.save(); g.globalAlpha = a; g.strokeStyle = '#5dff8a'; g.fillStyle = '#5dff8a'; g.lineWidth = 14; g.lineCap = 'round';
      g.beginPath(); g.moveTo(90, 1300); g.lineTo(90, 700); g.stroke(); g.beginPath(); g.moveTo(90, 640); g.lineTo(50, 720); g.lineTo(130, 720); g.closePath(); g.fill(); g.restore(); txt('चुंबक', 96, 1350, 40, '#5dff8a', a, 1, 8); }
    if (t >= 28.4 && t < 33.3) { const a = seg(t, 28.4, 28.7) * (1 - seg(t, 33.0, 33.3)); ['हड्डी', 'मांस', 'चर्बी'].forEach((s, i) => pill(s, 240 + i * 300, 1270, ['#ffffff', '#ff8a8a', '#ffd24a'][i], a * seg(t, 28.5 + i * 0.5, 28.8 + i * 0.5), 46)); txt('हर ऊतक का सिग्नल अलग → तस्वीर', 540, 520, 50, '#7fd8ff', a, 1, 8); }
    if (t >= 46.6 && t < 50.3) { const a = seg(t, 46.7, 47.0) * (1 - seg(t, 50.0, 50.3)); g.save(); g.globalAlpha = a; g.translate(540, 1040); g.fillStyle = '#ffd21a'; g.beginPath(); g.arc(0, 0, 120, 0, 7); g.fill(); g.fillStyle = '#111';
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 100, i * TAU / 3 - 0.5, i * TAU / 3 + 0.5); g.closePath(); g.fill(); } g.fillStyle = '#ffd21a'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(0, 0, 20, 0, 7); g.fill();
      g.strokeStyle = '#ff2a2a'; g.lineWidth = 22; g.beginPath(); g.arc(0, 0, 140, 0, 7); g.moveTo(-99, -99); g.lineTo(99, 99); g.stroke(); g.restore(); }
    const card = (im, a, b2, x, y, w, rot, cap) => { if (t < a || t > b2) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b2 - 0.3, b2)); paper(g, im, x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card(PH.scan, 30.0, 33.3, 540, 1000, 640, 0.03, 'असली MRI स्कैन');
    card(PH.machine, 47.6, 50.3, 540, 1180, 880, -0.02, 'असली MRI मशीन (अस्पताल)');
  } });
const { on } = F;

// ================================================================ animation
const ax = V(0, 0, 0), q = new THREE.Quaternion();
on((t) => {
  // table slides the patient in during the knock beat; out by the end
  const slide = smooth(seg(t, 4.1, 6.8)) * (1 - smooth(seg(t, 46.6, 49.6)));
  bed.position.z = -1.95 * slide; bed.position.y = 0.0;
  // field lines: hook, align recall, end
  const fl = Math.max(LOOP(t) ? 1 : 0, t >= 3.88 && t < 8.1 ? 0.45 : 0, t >= 33.38 && t < 46.58 ? 0.18 : 0);
  fieldLines.forEach((l) => { l.material.opacity = fl; }); dashT.offset.x = -t * 0.6;
  // x-ray (inner parts) 33.4 - 46.4
  const xr = smooth(seg(t, 33.5, 34.3)) * (1 - smooth(seg(t, 46.0, 46.6)));
  inner.visible = xr > 0.01; shellM.opacity = 1 - 0.82 * xr; shellM.depthWrite = xr < 0.01; bezelM.opacity = 1 - 0.75 * xr; band.material.opacity = 1 - 0.7 * xr;
  let flash = 0; for (const k of KN) if (t >= k && t < k + 0.15) flash = 1 - (t - k) / 0.15;
  gradM.emissiveIntensity = 0.5 + 3.5 * (t >= 33 ? flash : 0); gradParts.forEach((p, i) => { p.scale.setScalar(1 + 0.03 * (t >= 33 ? flash : 0) * (i % 2 ? 1 : -1)); });
  const cold = smooth(seg(t, 40.0, 41.5)); heM.opacity = 0.18 + 0.4 * cold; heM.emissive.setRGB(0.04 + 0.3 * cold, 0.16 + 0.5 * cold, 0.35 + 0.9 * cold);
  frost.p.visible = cold > 0.01; frost.p.material.opacity = cold; for (let i = 0; i < frost.n; i++) frost.pos[i * 3 + 2] = ((hash(i * 7) - 0.5) * 1.5 + t * 0.05 * (hash(i) - 0.5) + 0.75) % 1.5 - 0.75; frost.geo.attributes.position.needsUpdate = true;
  ringGlow.material.color.setRGB(0.6, 2.4, 3.2).multiplyScalar(1 + 0.8 * flash * (t < 8 ? 1 : 0));
  // scissors fly into the bore (43.8-44.9)
  scis.visible = t >= 43.6 && t < 45.6; if (scis.visible) { const k = clamp((t - 43.6) / 1.1), kk = k * k * k, p = V(2.3, 1.7, 3.0).lerp(V(0.0, 1.2, 0.6), kk); scis.position.copy(p); scis.rotation.set(t * 3, t * 5, 0); if (k >= 1) { scis.position.set(0.0, 1.2 + 0.32 * 0, 0.62); scis.rotation.set(1.2, 0.3, 0); } }
  // micro world
  const mic = t >= 9.6 && t < 27.64; micro.visible = mic; microBg.visible = mic;
  const molK = 1 - smooth(seg(t, 12.5, 13.2)); mols.forEach((g2, i) => { g2.visible = molK > 0.01; g2.scale.setScalar(Math.max(0.001, molK)); g2.rotation.y = hash(i * 13) * 6 + t * 0.4; g2.position.y += 0; });
  hM.emissiveIntensity = t > 10.4 && t < 12.9 ? 0.6 + 0.4 * Math.sin(t * 8) : 0;
  const topK = smooth(seg(t, 12.8, 13.5)), w = TAU * 0.8;
  TOPS.forEach((T, i) => { T.g.visible = topK > 0.01; T.g.scale.setScalar(Math.max(0.001, backOut(topK, 1.6)));
    const al = smooth(seg(t, 17.2, 18.5)), tip = smooth(seg(t, 20.4, 21.1)) * (1 - smooth(seg(t, 24.2, 26.6))), sync = smooth(seg(t, 20.4, 21.0)), phase = lerp(T.ph, 0, sync);
    const th = lerp(0.18, Math.PI / 2, tip), ang = w * t + phase;
    const aligned = V(Math.sin(th) * Math.cos(ang), Math.cos(th), Math.sin(th) * Math.sin(ang)), wob = T.rd.clone().add(V(0.25 * Math.cos(w * t + T.ph), 0, 0.25 * Math.sin(w * t + T.ph))).normalize();
    ax.copy(wob).lerp(aligned, al).normalize(); q.setFromUnitVectors(up, ax); T.g.quaternion.copy(q); T.spin.rotation.y = t * 9 + i;
    T.g.position.copy(T.home).add(V(0, 0.05 * Math.sin(t * 1.3 + i), 0)); });
  const rk = clamp((t - 20.45) / 0.9); rfRing.material.opacity = t > 20.45 && t < 21.5 ? 0.95 * (1 - rk) : 0; rfRing.scale.setScalar(0.3 + 5 * easeOut(rk));
  microBg.material.uniforms.pulse.value = t > 20.45 ? Math.max(0, 1 - (t - 20.45) / 0.6) : 0;
  // signal dots: from tops to the coil while they relax (24.1-27.5)
  const cp = coil.position;
  for (let j = 0; j < sig.n; j++) { const T = TOPS[j % 24], k = ((t - 24.1) * 0.9 + hash(j) ) % 1, on2 = t > 24.2 && t < 27.5; const p = on2 ? T.home.clone().lerp(cp, easeInOut(k)) : V(0, -999, 0); sig.pos[j * 3] = p.x; sig.pos[j * 3 + 1] = p.y; sig.pos[j * 3 + 2] = p.z; }
  sig.geo.attributes.position.needsUpdate = true; coilGlow.material.opacity = t > 24.6 && t < 27.6 ? 0.5 + 0.4 * Math.sin(t * 14) : 0;
  drawScan(t);
});
