// कोहरे में प्लेन कैसे उतरता है? (ILS / CAT-III) — KAISECHALTAHAI3D #2. 1 unit = 1 m.
// Runway threshold at z=0, runway runs towards -z; the glide path is 3° with its origin at z = -150.
import { THREE, V, TAU, W, H, film, scene, renderer, sun, mat, add, group, rod, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 52.0;
sun.visible = false; sun.castShadow = false;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.3, 'rgba(255,255,255,0.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const TAN3 = Math.tan(3 * Math.PI / 180), GSZ = -150;
const gsY = (z) => Math.max(0, (z - GSZ) * TAN3);

const skyS = add(new THREE.SphereGeometry(2600, 32, 16), new THREE.MeshBasicMaterial({ color: 0xc9cdd3, side: THREE.BackSide, fog: false }), 0, 0, 0, scene, false);
const key = new THREE.DirectionalLight(0xfff4ea, 1.6); key.position.set(300, 800, 600); scene.add(key);
// ================================================================ ground, runway, markings
add(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), mat(0x3a4a2e, 0.95), 0, -0.05, -1000, scene, false).receiveShadow = true;
const rwTex = (() => { const c = cv(256, 4096), g = c.getContext('2d'); g.fillStyle = '#2c2d30'; g.fillRect(0, 0, 256, 4096);
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(${hash(i) < 0.5 ? 255 : 0},${hash(i) < 0.5 ? 255 : 0},${hash(i) < 0.5 ? 255 : 0},0.03)`; g.fillRect(hash(i * 3) * 256, hash(i * 7) * 4096, 3, 3); }
  g.fillStyle = '#f2f2f2'; for (let i = 0; i < 12; i++) g.fillRect(14 + i * 19.5, 4096 - 170, 11, 150);               // threshold piano keys
  g.font = '800 120px BalooL, sans-serif'; g.textAlign = 'center'; g.save(); g.translate(128, 4096 - 240); g.fillText('28', 0, 0); g.restore();
  for (let y = 4096 - 340; y > 0; y -= 70) g.fillRect(124, y - 36, 8, 36);                                               // centreline dashes
  for (const y of [4096 - 520, 4096 - 640, 4096 - 760]) { g.fillRect(40, y, 30, 60); g.fillRect(186, y, 30, 60); }     // touchdown-zone bars
  g.fillRect(52, 4096 - 960, 40, 140); g.fillRect(164, 4096 - 960, 40, 140);                                           // aiming point
  g.fillRect(4, 0, 5, 4096); g.fillRect(247, 0, 5, 4096); return tex(c); })();
const RW_LEN = 3000, RW_W = 45;
add(new THREE.PlaneGeometry(RW_W, RW_LEN).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: rwTex, roughness: 0.75 }), 0, 0.01, -RW_LEN / 2, scene, false).receiveShadow = true;
// lights: approach (ALS) bars + sequenced flashers, threshold (green), edge (white), centreline, touchdown zone
const lightPts = [], lightCol = [], flashers = [];
const L = (x, z, c) => { lightPts.push(x, 0.35, z); lightCol.push(c.r, c.g, c.b); };
const WH = HDR(2.2, 2.0, 1.7), GR = HDR(0.4, 2.4, 0.8), RD = HDR(2.4, 0.3, 0.3);
for (let z = 30; z <= 900; z += 30) { for (let k = -2; k <= 2; k++) L(k * 1.0, z, WH); if (z === 300) for (let k = -10; k <= 10; k++) L(k * 1.5, z, WH); flashers.push(z); }
for (let k = -11; k <= 11; k++) L(k * 2, 0.5, GR);
for (let z = 0; z >= -RW_LEN; z -= 60) { L(-RW_W / 2 - 1, z, WH); L(RW_W / 2 + 1, z, WH); }
for (let z = -15; z >= -RW_LEN; z -= 15) L(0.6, z, z < -RW_LEN + 900 ? RD : WH);
for (let z = -30; z >= -900; z -= 30) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) L(s * (9 + k * 1.5), z, WH);
const lightsGeo = new THREE.BufferGeometry(); lightsGeo.setAttribute('position', new THREE.Float32BufferAttribute(lightPts, 3)); lightsGeo.setAttribute('color', new THREE.Float32BufferAttribute(lightCol, 3));
const lights = new THREE.Points(lightsGeo, new THREE.PointsMaterial({ size: 2.2, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(lights);
const flashG = new THREE.BufferGeometry(); flashG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(flashers.length * 3), 3));
const flashP = new THREE.Points(flashG, new THREE.PointsMaterial({ size: 5, map: dotTex, color: HDR(4, 4, 4.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(flashP);
// ILS antennas: localizer array beyond the far end, glide-slope mast abeam the touchdown zone
const LOCZ = -RW_LEN - 300, metal = mat(0xc8ccd2, 0.4, 0.7), red = mat(0xd03030, 0.5);
const locArr = group(0, 0, LOCZ);
add(new THREE.BoxGeometry(44, 0.3, 0.3), metal, 0, 2.6, 0, locArr); add(new THREE.BoxGeometry(44, 0.3, 0.3), metal, 0, 0.8, 0, locArr);
for (let i = 0; i < 16; i++) { const x = -21 + i * 2.8; add(new THREE.BoxGeometry(0.15, 3.4, 0.15), metal, x, 1.7, 0, locArr); for (let k = 0; k < 6; k++) add(new THREE.BoxGeometry(0.06, 0.06, 1.2 - k * 0.15), i % 3 ? metal : red, x, 2.9 + k * 0.08, 0.5, locArr); }
const gsMast = group(120, 0, GSZ);
add(new THREE.CylinderGeometry(0.25, 0.35, 16, 12), metal, 0, 8, 0, gsMast); for (const y of [6, 10, 14]) add(new THREE.BoxGeometry(1.6, 1.0, 0.4), mat(0xf0f0f0, 0.5), -0.6, y, 0, gsMast);
add(new THREE.BoxGeometry(3, 2.5, 2.5), mat(0xd8d8d8, 0.6), 2, 1.25, 0, gsMast);
// a terminal + tower far away, silhouettes in the fog
add(new THREE.BoxGeometry(300, 18, 60), mat(0x8a8e96, 0.8), -260, 9, -900, scene, false);
add(new THREE.CylinderGeometry(4, 6, 60, 16), mat(0x9a9ea6, 0.7), -170, 30, -700, scene, false); add(new THREE.CylinderGeometry(9, 7, 8, 16), mat(0x5a8ab0, 0.2, 0.3), -170, 63, -700, scene, false);

// ================================================================ the airliner (procedural, generic livery)
function airliner() {
  const g = new THREE.Group(); scene.add(g);
  const liv = (() => { const c = cv(1024, 512), x = c.getContext('2d'); x.fillStyle = '#f4f5f7'; x.fillRect(0, 0, 1024, 512);
    x.fillStyle = '#1f4fa8'; x.fillRect(0, 300, 1024, 26); x.fillStyle = '#f2a81d'; x.fillRect(0, 330, 1024, 8);
    x.fillStyle = '#1a2230'; for (let i = 0; i < 46; i++) { x.fillRect(80 + i * 19, 210, 9, 14); }                   // windows (one side; mirrored by UV)
    x.fillStyle = '#9aa0a8'; x.fillRect(0, 470, 1024, 42); return tex(c); })();
  const body = mat(0xf4f5f7, 0.35, 0.1, { map: liv, envMap: ENV, envMapIntensity: 0.5 });
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, z = u * 37; let r = 1.98;
    if (u < 0.1) r = 1.98 * Math.sqrt(Math.max(0, 1 - Math.pow((0.1 - u) / 0.1, 2))) + 0.001; if (u > 0.72) r = 1.98 * (1 - (u - 0.72) / 0.28 * 0.82); pts.push(new THREE.Vector2(r, z)); }
  const fus = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), body); fus.rotation.x = Math.PI / 2; fus.position.z = -18.5; fus.castShadow = true; g.add(fus);
  add(new THREE.BoxGeometry(2.4, 0.6, 1.2), mat(0x10141c, 0.1, 0.3, { envMap: ENV, envMapIntensity: 1 }), 0, 0.9, -16.2, g, false).rotation.x = 0.5;      // cockpit glass
  const wingShape = (span, root, tip, sweep) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(span, sweep); s.lineTo(span, sweep + tip); s.lineTo(0, root); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.1, bevelSegments: 2 }); geo.rotateX(Math.PI / 2); return geo; };
  const wingM = mat(0xdfe2e6, 0.4, 0.2, { envMap: ENV, envMapIntensity: 0.5 });
  for (const s of [-1, 1]) { const w = add(wingShape(16, 6.5, 1.6, 7.5), wingM, s * 1.4, -1.0, -3.5, g); w.scale.x = s; w.rotation.z = s * 0.09;
    const st = add(wingShape(6.2, 3.4, 1.2, 3.2), wingM, s * 0.8, 1.2, 14.5, g); st.scale.x = s; st.rotation.z = s * 0.05;
    const eng = group(s * 5.8, -2.1, -4.5, g); add(new THREE.CylinderGeometry(1.15, 0.95, 4.4, 28).rotateX(Math.PI / 2), mat(0xe6e8ec, 0.3, 0.4, { envMap: ENV, envMapIntensity: 0.6 }), 0, 0, 0, eng);
    add(new THREE.CircleGeometry(1.0, 28), mat(0x15171c, 0.6), 0, 0, -2.21, eng).rotation.y = Math.PI; add(new THREE.BoxGeometry(0.4, 1.0, 2.0), wingM, 0, 1.2, 0.5, eng);
    const gear = group(s * 2.6, -2.0, 1.5, g); add(new THREE.CylinderGeometry(0.15, 0.15, 2.4, 10), metal, 0, -1.2, 0, gear); for (const dz of [-0.5, 0.5]) add(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 20).rotateZ(Math.PI / 2), mat(0x111111, 0.8), 0, -2.4, dz, gear); }
  { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(4.6, 0); s.lineTo(8.6, 6.4); s.lineTo(6.6, 6.4); s.closePath(); const geo = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 });
    const fin = new THREE.Mesh(geo, mat(0x1f4fa8, 0.35, 0.1, { envMap: ENV, envMapIntensity: 0.5 })); fin.rotation.y = -Math.PI / 2; fin.position.set(0.15, 1.2, 10.8); fin.castShadow = true; g.add(fin); }
  const ng = group(0, -1.6, -13.5, g); add(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 10), metal, 0, -0.9, 0, ng); add(new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16).rotateZ(Math.PI / 2), mat(0x111111, 0.8), 0, -1.9, 0, ng);
  // landing lights + beams that read in fog
  const ll = new THREE.SpotLight(0xfff4e0, 0, 400, 0.22, 0.5, 1.1); ll.position.set(0, -1.2, -12); ll.target.position.set(0, -12, -120); g.add(ll, ll.target);
  const beamG = new THREE.ConeGeometry(7, 90, 32, 1, true); beamG.translate(0, -45, 0); beamG.rotateX(-Math.PI / 2 + 0.12);
  const beamM = new THREE.MeshBasicMaterial({ color: HDR(1.0, 0.95, 0.85), transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const b = new THREE.Mesh(beamG, beamM); b.position.set(s * 3.5, -1.5, -6); g.add(b); }
  const strobe = []; for (const [x, y, z, c] of [[-17.2, -0.4, 2.2, HDR(4, 0.4, 0.4)], [17.2, -0.4, 2.2, HDR(0.4, 4, 0.6)], [0, 2.3, 4, HDR(4, 0.5, 0.3)], [0, -2.2, 0, HDR(4, 0.5, 0.3)]]) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.position.set(x, y, z); sp.scale.setScalar(2.5); g.add(sp); strobe.push(sp); }
  return { g, ll, strobe };
}
const AC = airliner();
const smoke = particles(240, new THREE.Color(0.85, 0.85, 0.88), 0.9, { additive: false, opacity: 0.5 }); smoke.p.material.map = dotTex; smoke.p.material.transparent = true;

// ================================================================ the ILS made visible: localizer curtain, glide-slope sheet, the "rails"
const bandMat = (col) => new THREE.ShaderMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, uniforms: { c: { value: col }, a: { value: 0 }, t: { value: 0 } },
  vertexShader: 'varying vec3 vP; varying vec2 vUv; void main(){ vUv = uv; vP = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP,1.0); }',
  fragmentShader: 'uniform vec3 c; uniform float a, t; varying vec3 vP; varying vec2 vUv; void main(){ float band = 0.5 + 0.5 * sin(vP.z * 0.06 + t * 8.0); float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(0.0, 0.05, vUv.y) * smoothstep(1.0, 0.9, vUv.y);\n    gl_FragColor = vec4(c * (0.12 + 0.25 * band) * edge * a, 1.0); }' });
const locG = new THREE.PlaneGeometry(1, 1); const locCurtain = new THREE.Mesh(locG, bandMat(HDR(0.3, 0.7, 1.8)));
locCurtain.rotation.y = Math.PI / 2; locCurtain.scale.set(LOCZ * -1 + 2600, 260, 1); locCurtain.position.set(0, 130, (LOCZ + 2600) / 2); scene.add(locCurtain);
const gsG = new THREE.PlaneGeometry(1, 1); const gsSheet = new THREE.Mesh(gsG, bandMat(HDR(1.8, 0.8, 0.2)));
{ const L2 = 2600 - GSZ; gsSheet.scale.set(140, L2 / Math.cos(3 * Math.PI / 180), 1); gsSheet.rotation.x = -Math.PI / 2 - 3 * Math.PI / 180; gsSheet.position.set(0, (L2 / 2) * TAN3, GSZ + L2 / 2); } scene.add(gsSheet);
const railMat = new THREE.MeshBasicMaterial({ color: HDR(2.4, 2.2, 1.6), transparent: true, opacity: 0 });
const rails = new THREE.Group(); scene.add(rails);
{ for (const s of [-1, 1]) { const c = new THREE.LineCurve3(V(s * 1.6, gsY(2600) - 3.2, 2600), V(s * 1.6, -3.2, GSZ)); rails.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, 0.12, 6), railMat)); }
  for (let z = 2600; z > GSZ; z -= 6) { const m = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.5), railMat); m.position.set(0, gsY(z) - 3.25, z); m.rotation.x = 3 * Math.PI / 180; rails.add(m); } }
const waves = Array.from({ length: 5 }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 6, 64, Math.PI), new THREE.MeshBasicMaterial({ color: HDR(0.6, 1.5, 2.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(m); return m; });
const angleArc = new THREE.Mesh(new THREE.RingGeometry(60, 61.5, 48, 1, 0, 3 * Math.PI / 180 * 1.0), new THREE.MeshBasicMaterial({ color: HDR(2.4, 1.4, 0.3), side: THREE.DoubleSide, transparent: true }));
angleArc.rotation.y = -Math.PI / 2; angleArc.position.set(0, 0.2, GSZ); scene.add(angleArc);

// ================================================================ cockpit (attached to the camera in the cockpit shots)
const pfdC = cv(512, 512), pfdT = tex(pfdC);
function drawPFD(loc, gs) { const g = pfdC.getContext('2d'); g.fillStyle = '#0a0d12'; g.fillRect(0, 0, 512, 512);
  g.save(); g.beginPath(); g.rect(40, 40, 432, 432); g.clip(); g.fillStyle = '#2f6fd0'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#8a5a2a'; g.fillRect(0, 256, 512, 256); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke(); g.restore();
  g.fillStyle = '#ffd24a'; g.fillRect(196, 250, 120, 12); g.strokeStyle = '#fff'; g.lineWidth = 3;
  for (let i = -2; i <= 2; i++) { if (i) { g.beginPath(); g.arc(256 + i * 60, 486, 7, 0, TAU); g.stroke(); g.beginPath(); g.arc(486, 256 + i * 60, 7, 0, TAU); g.stroke(); } }
  g.fillStyle = '#ff4ad8'; const lx = 256 + clamp(loc, -2.4, 2.4) * 60, gy = 256 + clamp(gs, -2.4, 2.4) * 60;
  g.beginPath(); g.moveTo(lx, 472); g.lineTo(lx + 14, 486); g.lineTo(lx, 500); g.lineTo(lx - 14, 486); g.fill(); g.beginPath(); g.moveTo(472, gy); g.lineTo(486, gy - 14); g.lineTo(500, gy); g.lineTo(486, gy + 14); g.fill();
  g.fillStyle = '#5dff8a'; g.font = '800 30px BalooL, sans-serif'; g.fillText('LOC  G/S  LAND 3', 120, 30); pfdT.needsUpdate = true; }
const cockpit = new THREE.Group(); scene.add(cockpit);
add(new THREE.BoxGeometry(2.6, 0.7, 1.0), mat(0x22262e, 0.8), 0, -0.72, -1.0, cockpit, false);
for (const x of [-0.5, 0.5]) add(new THREE.PlaneGeometry(0.4, 0.34), new THREE.MeshBasicMaterial({ map: pfdT, color: HDR(0.9, 0.9, 0.9) }), x, -0.3, -0.47, cockpit, false).rotation.x = -0.35;
for (const x of [-1.1, 0, 1.1]) add(new THREE.BoxGeometry(x ? 0.07 : 0.035, 1.4, 0.05), mat(0x15171c, 0.8), x, 0.2, -1.3, cockpit, false).rotation.z = x * 0.12;
add(new THREE.BoxGeometry(2.8, 0.1, 0.1), mat(0x15171c, 0.8), 0, 0.62, -1.25, cockpit, false);
const cockLight = new THREE.PointLight(0x9fc8ff, 0.6, 3, 1.5); cockLight.position.set(0, -0.3, -0.4); cockpit.add(cockLight);

// ================================================================ HD real photos + cartoon pilot (drawn in the overlay at full res)
const PH = {}; for (const k of ['localizer', 'glideslope', 'approach_lights']) PH[k] = await img(`img/${k}.jpg`);
const pilotSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700" viewBox="0 0 500 700"><defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#e2ad82"/><stop offset="1" stop-color="#c78e62"/></linearGradient></defs>
  <path d="M90 700 Q80 470 250 450 Q420 470 410 700 Z" fill="#1c2a4a" stroke="#26160c" stroke-width="8"/><path d="M200 452 L250 520 L300 452" fill="#fff" stroke="#26160c" stroke-width="6"/><path d="M236 470 L250 560 L264 470 Z" fill="#1f2a44"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${104 + i * 0}" y="${520 + i * 14}" width="70" height="8" fill="#e8b23a"/>`).join('')}
  <ellipse cx="250" cy="300" rx="115" ry="130" fill="url(#s)" stroke="#26160c" stroke-width="8"/>
  <path d="M120 230 Q250 120 380 230 L390 250 L110 250 Z" fill="#1c2a4a" stroke="#26160c" stroke-width="8"/><rect x="104" y="244" width="292" height="26" rx="12" fill="#111" stroke="#26160c" stroke-width="6"/><circle cx="250" cy="196" r="16" fill="#e8b23a" stroke="#26160c" stroke-width="5"/>
  <ellipse cx="205" cy="315" rx="22" ry="18" fill="#fff" stroke="#26160c" stroke-width="5"/><ellipse cx="295" cy="315" rx="22" ry="18" fill="#fff" stroke="#26160c" stroke-width="5"/><circle cx="208" cy="316" r="10" fill="#2a1a0c"/><circle cx="292" cy="316" r="10" fill="#2a1a0c"/>
  <path d="M215 380 Q250 410 285 380" fill="none" stroke="#7a1e24" stroke-width="8" stroke-linecap="round"/>
  <path d="M380 560 Q440 540 430 470 Q420 430 400 450 L400 500 Q380 500 370 520 Z" fill="url(#s)" stroke="#26160c" stroke-width="7"/></svg>`;
const PILOT = await img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pilotSVG));
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 30px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); } g.restore();
}

// ---------------------------------------------------------------- the aircraft choreography per shot
const pose = { p: V(0, 0, 0), pitch: 0, roll: 0, yaw: 0, flare: 0 };
function plane(t) {
  let z, dx = 0, dy = 0, pitch = -0.02, roll = 0, yaw = 0;
  if (t < 4.46) { z = 170 - 70 * t; if (z < -40) z = -40 - 30 * (t - (210 / 70)); }
  else if (t < 8.86) { z = 640 - 75 * (t - 4.46); }
  else if (t < 17.62) { z = 1900 - 75 * (t - 8.86); }
  else if (t < 21.3) { z = 1500 - 75 * (t - 17.62); const k = smooth(seg(t, 19.9, 21.0)); dx = -26 * (1 - k); roll = 0.12 * Math.sin(seg(t, 19.9, 21.0) * Math.PI); yaw = 0.05 * (1 - k); }
  else if (t < 26.0) { z = 1300 - 75 * (t - 21.3); const k = smooth(seg(t, 23.4, 24.8)); dy = 14 * (1 - k); pitch = -0.02 - 0.03 * Math.sin(seg(t, 23.4, 24.8) * Math.PI); }
  else if (t < 30.6) { z = 900 - 75 * (t - 26.0); }
  else if (t < 33.55) { z = 330 - 70 * (t - 30.6); }
  else if (t < 39.4) { z = 200 - 62 * (t - 33.55); }
  else if (t < 44.5) { z = -170 - 45 * (t - 39.4) * (1 - 0.1 * (t - 39.4)); }
  else { z = -420 - 14 * (t - 44.5); }
  let y = gsY(z) + dy;
  // flare + touchdown in the hook and in the autoland shot
  const fl = t < 4.46 ? seg(t, 2.4, 3.1) : (t >= 33.55 && t < 39.4) ? seg(t, 35.78, 38.0) : 0;
  if (fl > 0) { pitch = lerp(-0.02, 0.09, smooth(Math.min(1, fl * 1.6))); }
  const onGround = (t < 4.46 && t > 3.1) || (t >= 38.0 && t < 39.4) || t >= 39.4;
  if (t < 4.46 && t >= 2.4) y = Math.max(0, gsY(z) * (1 - smooth(seg(t, 2.4, 3.1))));
  if (t >= 33.55 && t < 39.4 && t >= 35.78) y = Math.max(0, gsY(z) * (1 - smooth(seg(t, 35.78, 38.0))));
  if (onGround) { y = 0; if (t >= 39.4) pitch = 0; }
  pose.p.set(dx, y + 4.3, z); pose.pitch = pitch; pose.roll = roll; pose.yaw = yaw; pose.ground = onGround;
  return pose;
}
// ---------------------------------------------------------------- camera
const FOGGY = { sky: false, sun: 0, ambI: 0.42, amb: '#b8bcc4', fog: 0.0085, fogCol: '#c9cdd3', exposure: 1.0, dof: 0.4 };
const THICK = { ...FOGGY, fog: 0.012 };
const XRAY = { sky: false, sun: 0, ambI: 0.45, amb: '#8090b0', fog: 0.00045, fogCol: '#1a2232', exposure: 1.0, dof: 0.12 };
const COCK = { ...FOGGY, fog: 0.011, dof: 0.05 };
const P = (t) => plane(t).p.clone();
const KEYS = [
  [0, 0, V(0, 0, 0), V(0, 0, -1), 62, COCK], [4.46, 4.46, V(14, 3, 250), V(0, 20, 520), 38, FOGGY], [4.56, 8.8, V(12, 3.5, 230), V(0, 18, 330), 40, FOGGY],
  [8.86, 8.86, V(300, 170, 900), V(0, 0, -700), 42, XRAY], [8.96, 13.1, V(240, 130, 650), V(0, 0, -800), 44, XRAY],
  [13.2, 13.2, V(18, 5, LOCZ + 26), V(0, 2, LOCZ), 40, XRAY], [13.3, 15.4, V(12, 4, LOCZ + 18), V(0, 2.4, LOCZ), 38, XRAY],
  [15.5, 15.5, V(520, 300, 1600), V(0, 40, -600), 44, XRAY], [15.6, 17.5, V(460, 260, 1300), V(0, 30, -700), 44, XRAY],
  [17.62, 17.62, V(0, 0, 0), V(0, 0, 0), 46, XRAY], [21.36, 21.36, V(260, 50, 1200), V(0, 60, 1150), 40, XRAY], [21.46, 26.0, V(250, 45, 1060), V(0, 45, 1000), 40, XRAY],
  [26.1, 26.1, V(0, 0, 0), V(0, 0, 0), 50, XRAY], [30.7, 30.7, V(10, 2.2, 110), V(0, 14, 300), 40, THICK], [30.8, 33.5, V(9, 2.4, 90), V(0, 10, 260), 40, THICK],
  [33.6, 33.6, V(34, 2.2, -120), V(0, 8, 60), 42, FOGGY], [33.7, 39.3, V(32, 2.4, -150), V(0, 5, -60), 40, FOGGY],
  [39.42, 39.42, V(70, 40, -120), V(0, 2, -300), 42, FOGGY], [39.52, 44.5, V(60, 34, -220), V(0, 2, -360), 42, FOGGY],
  [44.6, 44.6, V(-8, 3, -530), V(0, 5, -420), 40, THICK], [44.7, 50.3, V(-6, 3.2, -520), V(0, 5, -440), 40, THICK],
  [50.4, 50.4, V(0, 0, 0), V(0, 0, -1), 62, COCK], [50.5, 52.0, V(0, 0, 0), V(0, 0, -1), 62, COCK],
];
const F = film({ total, keys: KEYS, exposure: 1.0, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' }, hits: [[3.1, 0.015], [9.98, 0.01], [32.71, 0.012], [38.0, 0.02]],
  titles: [[-1, 4.4, 'रनवे दिखा ही नहीं… फिर भी लैंडिंग!', 72, '#ffd24a', 300, 'कोहरे में प्लेन कैसे उतरता है?'], [9.98, 13.1, 'ILS', 150, '#9fd0ff', 300, 'इंस्ट्रूमेंट लैंडिंग सिस्टम'],
    [24.7, 26.0, '3° का ढलान', 110, '#ffb03a', 300], [32.71, 33.55, 'CAT-III', 150, '#ffd24a', 300, 'सबसे घना कोहरा'], [38.44, 39.4, 'टच-डाउन!', 120, '#5dff8a', 300],
    [50.6, 999, 'रनवे दिखा ही नहीं… फिर भी लैंडिंग!', 72, '#ffd24a', 300, 'कोहरे में प्लेन कैसे उतरता है?']],
  pills: [[4.6, 8.8, 'घना कोहरा • सामने सफ़ेद दीवार', 1300, '#f3f3f3'], [17.7, 21.3, 'लोकलाइज़र: बाएँ-दाएँ', 330, '#9fd0ff'], [21.4, 24.6, 'ग्लाइड-स्लोप: ऊपर-नीचे', 330, '#ffb03a'],
    [26.2, 30.6, 'ऑटोपायलट: LOC + G/S लॉक', 330, '#ffffff'], [35.6, 37.0, 'फ़्लेयर: नाक ऊपर', 330, '#ffffff']],
  overlay: (g, t, { txt, pill }) => {
    // ILS indicator inset during the localizer / glide-slope demos
    if (t >= 17.62 && t < 26.0) { const x0 = 540, y0 = 1180, r = 120, a = seg(t, 17.62, 17.9) * (1 - seg(t, 25.7, 26.0));
      const lo = t < 21.3 ? -2.2 * (1 - smooth(seg(t, 19.9, 21.0))) : 0, gsv = t >= 21.3 ? -2.0 * (1 - smooth(seg(t, 23.4, 24.8))) : 0;
      g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(8,12,20,0.82)'; g.beginPath(); g.roundRect(x0 - r - 30, y0 - r - 30, 2 * r + 60, 2 * r + 60, 30); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3;
      for (let i = -2; i <= 2; i++) { if (!i) continue; g.beginPath(); g.arc(x0 + i * 44, y0 + r - 8, 8, 0, TAU); g.stroke(); g.beginPath(); g.arc(x0 + r - 8, y0 + i * 44, 8, 0, TAU); g.stroke(); }
      g.fillStyle = '#ffd24a'; g.fillRect(x0 - 60, y0 - 5, 120, 10); g.fillStyle = '#ff4ad8'; const lx = x0 + lo * 44, gy = y0 + gsv * 44;
      g.beginPath(); g.moveTo(lx, y0 + r - 22); g.lineTo(lx + 14, y0 + r - 8); g.lineTo(lx, y0 + r + 6); g.lineTo(lx - 14, y0 + r - 8); g.fill(); g.beginPath(); g.moveTo(x0 + r - 22, gy); g.lineTo(x0 + r - 8, gy - 14); g.lineTo(x0 + r + 6, gy); g.lineTo(x0 + r - 8, gy + 14); g.fill(); g.restore(); }
    // three conditions with ticks + cartoon pilot
    if (t >= 40.3 && t < 44.5) { const items = [['रनवे — ख़ास लाइट्स', 40.66], ['प्लेन — ऑटोलैंड सिस्टम', 41.26], ['पायलट — ख़ास ट्रेनिंग', 41.76]];
      items.forEach(([s, a], i) => { if (t >= a) pill('✓ ' + s, 400, 520 + i * 110, '#5dff8a', seg(t, a, a + 0.3) * (1 - seg(t, 44.2, 44.5)), 46); });
      if (t >= 41.76 && PILOT) { const k = backOut(seg(t, 41.76, 42.2), 1.6) * (1 - seg(t, 44.2, 44.5)); g.save(); g.translate(880, 900); g.scale(k * 0.42, k * 0.42); g.drawImage(PILOT, -250, -700); g.restore(); } }
    const card = (k, a, b, x, y, w, rot, cap) => { if (t < a || t > b) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b - 0.3, b)); paper(g, PH[k], x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card('localizer', 13.9, 16.6, 560, 1060, 700, -0.04, 'ILS लोकलाइज़र एंटीना • हीथ्रो (असली)');
    card('glideslope', 22.1, 24.5, 760, 900, 360, 0.05, 'ग्लाइड-स्लोप एंटीना (असली)');
    card('approach_lights', 40.4, 41.2, 540, 1150, 0.0001, 0, '');
  } });
const { on, onCam } = F;

// ---------------------------------------------------------------- animation
on((t) => {
  const pl = plane(t); AC.g.position.copy(pl.p); AC.g.rotation.set(pl.pitch, pl.yaw, pl.roll, 'YXZ');
  AC.ll.intensity = 2000; AC.strobe.forEach((s, i) => { const on2 = i < 2 ? ((t * 1.1 + i * 0.5) % 1 < 0.08) : ((t * 1.0 + 0.3 * i) % 1 < 0.15); s.visible = on2 || i < 2 && false; s.scale.setScalar(on2 ? 3 : 0.001); });
  // sequenced flashers run towards the threshold twice a second
  { const p = flashG.attributes.position.array, ph = (t * 2) % 1; flashers.forEach((z, i) => { const k = 1 - i / flashers.length, on2 = Math.abs(ph - k) < 0.035; p[i * 3] = 0; p[i * 3 + 1] = on2 ? 0.6 : -999; p[i * 3 + 2] = z; }); flashG.attributes.position.needsUpdate = true; }
  // beams / rails / waves visibility by beat
  const showBeams = t >= 15.5 && t < 30.6, ba = smooth(seg(t, 15.5, 16.4));
  locCurtain.visible = showBeams && t < 21.3 || (t >= 26.1 && t < 30.6) || (t >= 15.5 && t < 17.6); gsSheet.visible = showBeams && (t < 17.6 || t >= 21.3);
  locCurtain.material.uniforms.a.value = ba * 1.4; gsSheet.material.uniforms.a.value = ba * 1.4; locCurtain.material.uniforms.t.value = gsSheet.material.uniforms.t.value = t;
  rails.visible = t >= 28.6 && t < 30.6; railMat.opacity = smooth(seg(t, 28.6, 29.4));
  angleArc.visible = t >= 24.5 && t < 26.0; angleArc.scale.setScalar(Math.max(0.001, easeOut(seg(t, 24.6, 25.3))));
  waves.forEach((w, i) => { const k = ((t - 13.2) * 0.6 + i / 5) % 1, v = t >= 13.2 && t < 15.5; w.visible = v; w.position.set(0, 2.6, LOCZ + 1); w.rotation.set(0, 0, 0); w.scale.setScalar(2 + 30 * k); w.material.opacity = (1 - k) * 0.9; });
  // tyre smoke at touchdown (hook + autoland)
  for (let i = 0; i < smoke.n; i++) { let y = -999, x = 0, z = 0; for (const [td, on2] of [[3.1, t < 4.46], [38.0, t >= 38 && t < 40]]) { if (!on2 || t < td) continue; const k = (t - td) / 1.4; if (k > 1) continue;
      const s = i % 2 ? 1 : -1; x = s * 2.6 + (hash(i) - 0.5) * 2 * k; z = pl.p.z + 2 + 18 * k * hash(i * 3); y = 0.4 + 1.6 * k * hash(i * 5); }
    smoke.pos[i * 3] = x; smoke.pos[i * 3 + 1] = y; smoke.pos[i * 3 + 2] = z; } smoke.geo.attributes.position.needsUpdate = true;
  cockpit.visible = t < 4.46 || t >= 50.4;
  const lo = 0.05 * Math.sin(t * 1.3), gs = 0.05 * Math.cos(t * 1.1); drawPFD(lo, gs);
});
// cockpit + chase cameras ride with the aircraft
onCam((t, cam) => {
  if (t < 4.46 || t >= 50.4) { const tt = t < 4.46 ? t : 0.25 + (t - 50.4) * 0.2; const pl = plane(tt); const eye = pl.p.clone().add(V(-0.55, 1.6, -14.5));
    cam.position.copy(eye); cam.quaternion.setFromEuler(new THREE.Euler(pl.pitch - 0.08 + 0.004 * Math.sin(t * 9) * (pl.ground ? 3 : 1), 0, pl.roll * 0.5, 'YXZ'));
    if (t > 3.1 && t < 3.6) cam.position.y += 0.06 * Math.sin((t - 3.1) * 60) * (3.6 - t);
    cam.updateMatrixWorld(); cockpit.position.copy(cam.position); cockpit.quaternion.copy(cam.quaternion); }
  skyS.material.color.copy(scene.fog.color);
  const track = (off, lookOff) => { const pl = plane(t); cam.position.copy(pl.p).add(off); cam.lookAt(pl.p.clone().add(lookOff)); cam.updateMatrixWorld(); };
  if (t >= 4.46 && t < 8.86) { const k = seg(t, 4.46, 8.86); track(V(22 - 6 * k, -7 + 2 * k, -70 + 30 * k), V(0, 0, 4)); }
  if (t >= 30.7 && t < 33.55) track(V(16, -5, -42), V(0, 0, 8));
  if (t >= 33.55 && t < 39.42) { const pl = plane(t); cam.position.set(30, 2.6, pl.p.z - 16); cam.lookAt(pl.p.clone().add(V(0, 0, 4))); cam.updateMatrixWorld(); }
  if (t >= 39.42 && t < 44.6) track(V(42, 20, -28), V(0, 0, -10));
  if (t >= 44.6 && t < 50.4) { const k = seg(t, 44.6, 50.4); track(V(-12 + 6 * k, -1.6, -46 + 8 * k), V(0, 0.5, 0)); }
  if (t >= 17.62 && t < 21.36) { const pl = plane(t); cam.position.copy(pl.p).add(V(6, 14, 70)); cam.lookAt(pl.p.clone().add(V(0, -6, -200))); cam.updateMatrixWorld(); }
  if (t >= 26.1 && t < 30.7) { const pl = plane(t); cam.position.copy(pl.p).add(V(3, 7, 46)); cam.lookAt(pl.p.clone().add(V(0, -4, -120))); cam.updateMatrixWorld(); }
});
