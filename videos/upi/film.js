// UPI: 2 सेकंड में पैसा कैसे पहुँचता है? — KAISECHALTAHAI3D #5. A chai stall (3D street + cartoon people) and a glowing
// "relay race" world where the request runs phone -> NPCI -> your bank -> NPCI -> chai-wala's bank -> "ting!". No real logos.
import { THREE, V, TAU, W, H, film, scene, renderer, sun, mat, add, group, rod, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 52.4;
sun.visible = false; sun.castShadow = false;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const svgURL = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const glow = (col, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); m.scale.setScalar(s); scene.add(m); return m; };
const label = (text, col = '#ffffff', bg = 'rgba(10,14,28,0.85)', w = 4.0, h = 0.94) => { const c = cv(768, 180), g = c.getContext('2d'); g.fillStyle = bg; g.beginPath(); g.roundRect(6, 6, 756, 168, 60); g.fill(); g.strokeStyle = col; g.lineWidth = 8; g.stroke();
  g.fillStyle = col; g.font = '800 86px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 384, 96); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(c), transparent: true, depthWrite: false })); s.scale.set(w, h, 1); scene.add(s); return s; };

// ---------------------------------------------------------------- cartoon cut-outs
async function cutout(svgStr, { h = 1.7, border = 10, res = 1200 } = {}) {
  const im = await img(svgURL(svgStr)), iw = im.naturalWidth, ih = im.naturalHeight, sc = res / ih, w = Math.round(iw * sc) + border * 4, hh = Math.round(ih * sc) + border * 4, o = border * 2;
  const st = cv(w, hh), sg = st.getContext('2d'); for (let a = 0; a < 24; a++) sg.drawImage(im, o + Math.cos(a / 24 * TAU) * border, o + Math.sin(a / 24 * TAU) * border, iw * sc, ih * sc);
  sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#f6f0e1'; sg.fillRect(0, 0, w, hh);
  const c = cv(w, hh), g = c.getContext('2d'); g.drawImage(st, 0, 0); g.drawImage(im, o, o, iw * sc, ih * sc); const t = tex(c);
  const geo = new THREE.PlaneGeometry(h * w / hh, h); geo.translate(0, h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.18 })); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 }); const grp = new THREE.Group(); grp.add(m); scene.add(grp); return grp;
}
const OL = '#26160c', st = (f, w = 7) => `fill="${f}" stroke="${OL}" stroke-width="${w}" stroke-linejoin="round"`;
const face = (cx, cy, { mus = false, smile = 1 } = {}) => `<ellipse cx="${cx}" cy="${cy}" rx="95" ry="108" ${st('#d9a074')}/>
  <ellipse cx="${cx - 36}" cy="${cy - 8}" rx="17" ry="14" fill="#fff" stroke="${OL}" stroke-width="5"/><ellipse cx="${cx + 36}" cy="${cy - 8}" rx="17" ry="14" fill="#fff" stroke="${OL}" stroke-width="5"/>
  <circle cx="${cx - 34}" cy="${cy - 6}" r="8" fill="#2a1a0c"/><circle cx="${cx + 34}" cy="${cy - 6}" r="8" fill="#2a1a0c"/>
  ${mus ? `<path d="M${cx - 50} ${cy + 40} Q${cx} ${cy + 14} ${cx + 50} ${cy + 40} Q${cx + 20} ${cy + 34} ${cx} ${cy + 38} Q${cx - 20} ${cy + 34} ${cx - 50} ${cy + 40} Z" fill="#1d1612"/>` : ''}
  <path d="M${cx - 26} ${cy + 56} Q${cx} ${cy + 56 + 20 * smile} ${cx + 26} ${cy + 56}" fill="none" stroke="#7a1e24" stroke-width="7" stroke-linecap="round"/>`;
const chaiwalaSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="760" viewBox="0 0 500 760">
  <path d="M90 760 Q90 470 250 450 Q410 470 410 760 Z" ${st('#f2efe8')}/><path d="M120 470 Q250 520 380 470 L390 640 Q250 660 110 640 Z" ${st('#c8553a')}/>
  <path d="M330 470 Q380 560 360 700" fill="none" stroke="#e8c24a" stroke-width="26" stroke-linecap="round"/>
  ${face(250, 330, { mus: true })}<path d="M158 260 Q250 190 342 260 Q330 220 250 214 Q170 220 158 260 Z" fill="#1d1612"/></svg>`;
const customerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="900" viewBox="0 0 500 900">
  <path d="M150 900 L170 640 L330 640 L350 900 Z" ${st('#2f3a5a')}/><path d="M100 660 Q100 460 250 440 Q400 460 400 660 Z" ${st('#3aa0a0')}/>
  <path d="M360 500 Q440 470 430 380 L400 372 Q400 440 340 470 Z" ${st('#3aa0a0')}/><rect x="372" y="300" width="64" height="100" rx="12" ${st('#1a1a22', 6)}/><rect x="380" y="310" width="48" height="76" rx="6" fill="#5ad8ff"/>
  ${face(250, 320)}<path d="M152 290 Q160 200 250 196 Q340 200 348 290 Q330 240 250 238 Q170 240 152 290 Z" fill="#2a1a12"/></svg>`;
const copSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="820" viewBox="0 0 560 820">
  <path d="M130 820 Q120 500 280 470 Q440 500 430 820 Z" ${st('#c8a86a')}/><path d="M280 480 L280 820" stroke="${OL}" stroke-width="5"/><rect x="250" y="600" width="60" height="16" fill="#5a3a1a"/>
  <path d="M420 520 Q520 440 530 330 L490 320 Q480 420 400 470 Z" ${st('#c8a86a')}/><circle cx="510" cy="310" r="28" ${st('#d9a074')}/>
  <path d="M140 520 Q60 560 70 650 L110 650 Q110 580 170 560 Z" ${st('#c8a86a')}/>
  ${face(280, 340, { mus: true })}<path d="M160 260 Q280 170 400 260 L410 280 L150 280 Z" ${st('#fbfbfb')}/><rect x="146" y="272" width="268" height="24" rx="10" fill="#1a1a1a"/><circle cx="280" cy="232" r="16" ${st('#e8b23a', 5)}/>
  <path d="M190 560 L230 560 L230 600 L190 600 Z" fill="#e8b23a"/></svg>`;

// ================================================================ A. THE CHAI STALL (dusk street)
const ST = V(0, 0, 0);
add(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), mat(0x5a5650, 0.9), 0, 0, 0, scene, false).receiveShadow = true;
const wood = mat(0x8a5a32, 0.7), tin = mat(0x9aa4ac, 0.4, 0.6);
add(new THREE.BoxGeometry(2.6, 1.0, 1.0), wood, 0, 0.5, -0.6); add(new THREE.BoxGeometry(2.8, 0.06, 1.15), mat(0x6a4224, 0.6), 0, 1.03, -0.6);
for (const x of [-1.3, 1.3]) add(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), wood, x, 1.2, -1.05);
add(new THREE.BoxGeometry(3.0, 0.05, 1.6), tin, 0, 2.42, -0.5).rotation.x = -0.12;
add(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 20), mat(0x2a2a2a, 0.5, 0.5), -0.75, 1.12, -0.75);
const kettle = add(new THREE.CylinderGeometry(0.16, 0.19, 0.3, 20), new THREE.MeshStandardMaterial({ color: 0xc0c4c8, metalness: 0.9, roughness: 0.25, envMap: ENV }), -0.75, 1.33, -0.75);
for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.035, 0.03, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0xc8823a, transparent: true, opacity: 0.85, roughness: 0.1 }), -0.1 + (i % 3) * 0.12, 1.11, -0.55 + Math.floor(i / 3) * 0.12);
// QR standee (generic pattern) + the soundbox
const qrC = cv(256, 320), qg = qrC.getContext('2d'); qg.fillStyle = '#fff'; qg.fillRect(0, 0, 256, 320); qg.fillStyle = '#1f3a7a'; qg.fillRect(0, 0, 256, 50); qg.fillStyle = '#fff'; qg.font = '800 30px BalooL, sans-serif'; qg.textAlign = 'center'; qg.fillText('SCAN & PAY', 128, 36);
qg.fillStyle = '#111'; for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { const fin = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); const on = fin ? (x % 6 === 0 || y % 6 === 0 || (x % 6 > 1 && x % 6 < 5 && y % 6 > 1 && y % 6 < 5)) && !(x > 13 && y < 7 && false) : hash(x * 31 + y * 7) < 0.5; if (on) qg.fillRect(23 + x * 10, 70 + y * 10, 10, 10); }
qg.fillStyle = '#333'; qg.font = '800 24px BalooD, sans-serif'; qg.fillText('चाय वाला • UPI', 128, 305);
const qr = add(new THREE.PlaneGeometry(0.28, 0.35), new THREE.MeshStandardMaterial({ map: tex(qrC), roughness: 0.6, emissive: 0xffffff, emissiveMap: tex(qrC), emissiveIntensity: 0.25 }), 0.55, 1.25, -0.3, scene, false); qr.rotation.x = -0.25;
const sbox = add(new THREE.BoxGeometry(0.16, 0.18, 0.16), mat(0x1c1c22, 0.5), 0.92, 1.15, -0.4); const sled = add(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshBasicMaterial({ color: HDR(0.2, 1, 0.3) }), 0.92, 1.2, -0.31, scene, false);
const bulb = add(new THREE.SphereGeometry(0.07, 12, 10), new THREE.MeshBasicMaterial({ color: HDR(6, 4.6, 2.6) }), 0.1, 2.15, -0.5, scene, false);
const bulbL = new THREE.PointLight(0xffc27a, 4, 9, 1.6); bulbL.position.set(0.1, 2.1, -0.4); bulbL.castShadow = true; scene.add(bulbL);
// street: shop fronts with Hindi signs, lamps, a scooter
const signs = ['किराना स्टोर', 'पान भंडार', 'मोबाइल रिचार्ज', 'मिठाई', 'दर्ज़ी'];
for (let i = 0; i < 5; i++) { const x = -9 + i * 4.5; add(new THREE.BoxGeometry(4.2, 3.6, 2), mat([0xd8b08a, 0xb8c8d8, 0xe0c890, 0xc8a0a0, 0xa8c8a8][i], 0.85), x, 1.8, -6);
  const c = cv(512, 128), g = c.getContext('2d'); g.fillStyle = ['#b03a2a', '#2a6a3a', '#2a4a9a', '#c86a1a', '#6a2a7a'][i]; g.fillRect(0, 0, 512, 128); g.fillStyle = '#fff'; g.font = '800 62px BalooD, sans-serif'; g.textAlign = 'center'; g.fillText(signs[i], 256, 84);
  add(new THREE.PlaneGeometry(3.8, 0.9), new THREE.MeshBasicMaterial({ map: tex(c), color: HDR(1.1, 1.1, 1.1) }), x, 3.1, -4.98, scene, false);
  add(new THREE.PlaneGeometry(3.0, 1.9), new THREE.MeshBasicMaterial({ color: HDR(0.6, 0.46, 0.28) }), x, 1.2, -4.98, scene, false); }
for (const x of [-6, 6]) { rod(V(x, 0, -3.6), V(x, 4.2, -3.6), 0.06, mat(0x3a3a3a, 0.5)); add(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: HDR(5, 4, 2.4) }), x, 4.25, -3.4, scene, false); const L = new THREE.PointLight(0xffc88a, 3, 14, 1.5); L.position.set(x, 4.1, -3.3); scene.add(L); }
{ const sc = group(-3.2, 0, 1.2); add(new THREE.BoxGeometry(1.5, 0.45, 0.4), mat(0xc8282a, 0.4, 0.3), 0, 0.6, 0, sc); for (const x of [-0.6, 0.6]) add(new THREE.TorusGeometry(0.22, 0.07, 8, 20), mat(0x151515, 0.8), x, 0.25, 0, sc); add(new THREE.BoxGeometry(0.5, 0.12, 0.3), mat(0x222222, 0.6), -0.1, 0.9, 0, sc); sc.rotation.y = 0.5; }
const chaiwala = await cutout(chaiwalaSVG, { h: 1.95 }); chaiwala.position.set(-0.15, 0.45, -1.25);
const customer = await cutout(customerSVG, { h: 1.75 }); customer.position.set(1.35, 0, 0.15); customer.rotation.y = -0.35;
const steam = particles(80, new THREE.Color(0.9, 0.9, 0.92), 0.12, { additive: false, opacity: 0.35 }); steam.p.material.map = dotTex; steam.p.material.transparent = true;

// ================================================================ B. THE RELAY WORLD (night grid, glowing roads)
const NW = V(400, 0, 0);
const gridC = cv(512, 512), gg = gridC.getContext('2d'); gg.fillStyle = '#060a18'; gg.fillRect(0, 0, 512, 512); gg.strokeStyle = '#1a3a7a'; gg.lineWidth = 3; for (let i = 0; i <= 512; i += 64) { gg.beginPath(); gg.moveTo(i, 0); gg.lineTo(i, 512); gg.stroke(); gg.beginPath(); gg.moveTo(0, i); gg.lineTo(512, i); gg.stroke(); }
const gridT = tex(gridC); gridT.wrapS = gridT.wrapT = THREE.RepeatWrapping; gridT.repeat.set(30, 30);
add(new THREE.PlaneGeometry(300, 300).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: gridT, roughness: 0.4, metalness: 0.3, envMap: ENV, envMapIntensity: 0.15 }), NW.x, 0, NW.z, scene, false);
const NODES = { phone: V(NW.x - 16, 0, NW.z + 14), npci: V(NW.x, 0, NW.z), bankA: V(NW.x - 18, 0, NW.z - 16), bankB: V(NW.x + 18, 0, NW.z - 14), shop: V(NW.x + 16, 0, NW.z + 14) };
const pad = (p, col) => { add(new THREE.CylinderGeometry(4.2, 4.4, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x0d1430, emissive: col, emissiveIntensity: 0.35, roughness: 0.4 }), p.x, 0.25, p.z, scene, false);
  const r = add(new THREE.TorusGeometry(4.3, 0.08, 6, 6), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2.5) }), p.x, 0.52, p.z, scene, false); r.rotation.x = Math.PI / 2; return r; };
const padRings = { phone: pad(NODES.phone, HDR(0.2, 0.7, 1.0)), npci: pad(NODES.npci, HDR(1.0, 0.7, 0.1)), bankA: pad(NODES.bankA, HDR(0.3, 1.0, 0.5)), bankB: pad(NODES.bankB, HDR(0.3, 1.0, 0.5)), shop: pad(NODES.shop, HDR(1.0, 0.4, 0.6)) };
// giant phone, bank buildings, the shop's soundbox, the NPCI roundabout with a cartoon traffic cop
{ const p = NODES.phone; add(new THREE.BoxGeometry(2.6, 5.2, 0.35), mat(0x15151c, 0.3, 0.5), p.x, 3.2, p.z); add(new THREE.PlaneGeometry(2.3, 4.7), new THREE.MeshBasicMaterial({ color: HDR(0.3, 0.9, 1.4) }), p.x, 3.2, p.z + 0.18, scene, false); }
function bank(p, name) { const g = group(p.x, 0.5, p.z); const stone = mat(0xe8e2d4, 0.6); add(new THREE.BoxGeometry(6, 0.5, 4), stone, 0, 0.25, 0, g); for (let k = 0; k < 5; k++) add(new THREE.CylinderGeometry(0.28, 0.3, 3.2, 14), stone, -2.4 + k * 1.2, 2.1, 1.6, g);
  add(new THREE.BoxGeometry(6, 3.4, 3), mat(0xd6cfbd, 0.7), 0, 2.2, -0.2, g); const r = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.4, 4), mat(0xc8b890, 0.6)); r.rotation.y = Math.PI / 4; r.position.y = 4.6; r.scale.z = 0.7; g.add(r);
  const l = label(name, '#5dff8a'); l.position.set(p.x, 6.2, p.z + 1.5); return { g, l }; }
const BA = bank(NODES.bankA, 'आपका बैंक'), BB = bank(NODES.bankB, 'चाय वाले का बैंक');
const npciL = label('NPCI', '#ffd24a', 'rgba(10,14,28,0.85)', 4.4, 1.3); npciL.position.set(NODES.npci.x, 8.6, NODES.npci.z);
const phoneL = label('आपका फ़ोन', '#7fd8ff'); phoneL.position.set(NODES.phone.x, 7.4, NODES.phone.z);
const shopL = label('चाय की दुकान', '#ff8ab0'); shopL.position.set(NODES.shop.x, 6.2, NODES.shop.z);
{ const p = NODES.shop; add(new THREE.BoxGeometry(1.6, 1.8, 1.6), mat(0x1c1c22, 0.5), p.x, 1.4, p.z); }
const shopLed = add(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: HDR(0.3, 1.5, 0.4) }), NODES.shop.x, 2.1, NODES.shop.z + 0.85, scene, false);
const cop = await cutout(copSVG, { h: 4.4, res: 1100 }); cop.position.set(NODES.npci.x, 0.5, NODES.npci.z);
// glowing roads between the nodes
const ROUTE = [['phone', 'npci'], ['npci', 'bankA'], ['npci', 'bankB'], ['npci', 'shop'], ['phone', 'bankA'], ['shop', 'bankB']];
const roadMat = new THREE.MeshBasicMaterial({ color: HDR(0.25, 0.5, 1.2) });
for (const [a, b] of ROUTE) { const pa = NODES[a].clone().setY(0.55), pb = NODES[b].clone().setY(0.55); scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pa, pb), 8, 0.12, 6), roadMat)); }
// the runner (request / money) + the locked PIN box
const runner = glow(HDR(1.4, 1.1, 0.35), 1.2); const runnerCore = add(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color: HDR(1.6, 1.3, 0.5) }), 0, 0, 0, scene, false);
const lockBox = group(0, 0, 0); add(new THREE.BoxGeometry(1.1, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.7, roughness: 0.3, envMap: ENV }), 0, 0, 0, lockBox); add(new THREE.TorusGeometry(0.3, 0.07, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.9, roughness: 0.2, envMap: ENV }), 0, 0.42, 0, lockBox);
const lockLabel = label('🔒 PIN ****', '#ffd24a', 'rgba(10,14,28,0.9)', 3.4, 0.8);
const trails = particles(1400, HDR(0.6, 1.2, 2.4), 0.5); trails.p.material.map = dotTex; trails.p.material.transparent = true;
const coins = particles(60, HDR(2.6, 2.0, 0.5), 0.6); coins.p.material.map = dotTex; coins.p.material.transparent = true;
// many far nodes for the scale beat
const farN = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 6), new THREE.MeshBasicMaterial({ color: HDR(0.4, 0.9, 1.6) }), 180); { const m = new THREE.Matrix4(); for (let i = 0; i < 180; i++) { m.makeTranslation(NW.x + (hash(i) - 0.5) * 260, 0.3, NW.z + (hash(i * 3) - 0.5) * 260); farN.setMatrixAt(i, m); } } scene.add(farN);
const nightL = new THREE.HemisphereLight(0x6a8aff, 0x101018, 0.6); scene.add(nightL);

// ---------------------------------------------------------------- the relay timeline
const LEGS = [[9.12, 12.46, 'phone', 'npci'], [19.0, 21.0, 'npci', 'bankA'], [29.36, 31.4, 'bankA', 'npci'], [32.18, 34.9, 'npci', 'bankB'], [35.78, 37.4, 'bankB', 'shop']];
function runnerAt(t) { for (const [a, b, f, to] of LEGS) if (t >= a && t <= b) { const k = easeInOut(seg(t, a, b)); const p = NODES[f].clone().lerp(NODES[to], k); p.y = 1.6 + 2.2 * Math.sin(k * Math.PI); return { p, k, f, to }; }
  // between legs: park at the last node
  let last = 'phone'; for (const [a, b, f, to] of LEGS) if (t > b) last = to; return { p: NODES[last].clone().add(V(0, 1.6, 3.2)), k: 1, f: last, to: last }; }
// ---------------------------------------------------------------- phone UI (overlay inset)
function phoneUI(g, t, x, y, s, a) { if (a <= 0.01) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#121218'; g.beginPath(); g.roundRect(-150, -290, 300, 580, 40); g.fill(); g.fillStyle = '#f4f6fb'; g.beginPath(); g.roundRect(-136, -270, 272, 540, 26); g.fill();
  const state = t < 5.66 ? 0 : t < 6.6 ? 1 : 2; g.textAlign = 'center';
  if (state === 0) { g.fillStyle = '#1a1a22'; g.fillRect(-110, -170, 220, 220); g.strokeStyle = '#5dff8a'; g.lineWidth = 6; g.strokeRect(-96, -156, 192, 192); const yy = -150 + 180 * ((t * 1.4) % 1); g.fillStyle = 'rgba(93,255,138,0.6)'; g.fillRect(-96, yy, 192, 6);
    g.fillStyle = '#333'; g.font = '800 30px BalooD, BalooL, sans-serif'; g.fillText('QR स्कैन करें', 0, 120); }
  if (state === 1) { g.fillStyle = '#333'; g.font = '800 30px BalooD, BalooL, sans-serif'; g.fillText('₹10 • UPI पिन डालें', 0, -170); const n = Math.min(4, Math.floor(seg(t, 5.7, 6.5) * 5));
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-75 + i * 50, -100, 14, 0, TAU); i < n ? (g.fillStyle = '#1f3a7a', g.fill()) : (g.strokeStyle = '#1f3a7a', g.lineWidth = 4, g.stroke()); }
    g.fillStyle = '#ddd'; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { g.beginPath(); g.roundRect(-110 + c * 76, -40 + r * 66, 66, 54, 12); g.fill(); } }
  if (state === 2) { const k = backOut(seg(t, 6.6, 6.9)); g.fillStyle = '#2ab05a'; g.beginPath(); g.arc(0, -60, 80 * k, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 14; g.beginPath(); g.moveTo(-36, -60); g.lineTo(-8, -30); g.lineTo(40, -92); g.stroke();
    g.fillStyle = '#1a1a1a'; g.font = '800 40px BalooD, BalooL, sans-serif'; g.fillText('₹10 भेजे', 0, 90); }
  g.restore(); }
// ---------------------------------------------------------------- camera
const DUSK = { sky: true, e: 2, az: 2.6, sun: 0.4, sunCol: '#ff9a5a', ambI: 0.3, amb: '#6a7aa8', fog: 0.02, exposure: 0.95, dof: 0.6 };
const NET = { sky: false, sun: 0, ambI: 0.3, amb: '#4a5a9a', fog: 0.006, fogCol: '#050814', exposure: 1.0, dof: 0.3 };
const z0 = V(0, 0, 0);
const KEYS = [[0, 0, z0, V(0, 0, -1), 38, DUSK], [1.66, 1.66, z0, V(0, 0, -1), 42, NET], [5.0, 5.0, z0, V(0, 0, -1), 38, DUSK], [9.12, 9.12, z0, V(0, 0, -1), 42, NET], [38.6, 38.6, z0, V(0, 0, -1), 38, DUSK], [39.52, 39.52, z0, V(0, 0, -1), 44, NET], [46.58, 46.58, z0, V(0, 0, -1), 38, DUSK]];
const LOC = (t) => (t < 1.66 || (t >= 5.0 && t < 9.12) || (t >= 38.6 && t < 39.52) || t >= 46.58) ? 'stall' : 'net';
const F = film({ total, keys: KEYS, exposure: 1.0, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' }, hits: [[1.66, 0.012], [6.72, 0.01], [9.12, 0.01], [38.84, 0.015]],
  titles: [[-1, 1.6, '₹10 का पेमेंट…', 96, '#ffd24a', 300, 'UPI: 2 सेकंड में पैसा कैसे पहुँचता है?'], [3.36, 4.9, '5 कंप्यूटर जागे!', 100, '#7fd8ff', 300],
    [6.72, 7.4, 'टिंग!', 150, '#5dff8a', 300], [7.46, 9.0, 'बीच में क्या हुआ?', 92, '#ffffff', 300], [13.12, 15.2, 'NPCI = UPI की ट्रैफ़िक-पुलिस', 70, '#ffd24a', 300],
    [22.8, 28.8, 'राज़ की बात 🤫', 100, '#ffd24a', 300, 'PIN सिर्फ़ आपका बैंक देखता है'], [29.76, 31.5, 'हाँ ✓  −₹10', 100, '#5dff8a', 300], [34.82, 35.6, '"जमा करो!"', 100, '#ff8ab0', 300],
    [36.1, 38.5, '+₹10 ✓', 120, '#5dff8a', 300], [38.84, 39.5, 'टिंग!', 150, '#5dff8a', 300], [40.36, 42.0, '⏱ ~2 सेकंड', 110, '#ffd24a', 300],
    [43.46, 46.5, '2,000 करोड़+ बार', 96, '#7fd8ff', 300, 'हर महीने'], [50.4, 52.4, 'रिले-रेस 🏃', 110, '#ffd24a', 300]],
  overlay: (g, t, { txt }) => {
    if (t >= 5.0 && t < 7.4) phoneUI(g, t, 540, 1020, 0.95, seg(t, 5.0, 5.2) * (1 - seg(t, 7.2, 7.4)));
    if (t >= 15.38 && t < 18.8) { txt('chaiwala@bank → ?', 540, 520, 54, '#ffffff', seg(t, 15.4, 15.7), 1, 10); if (t > 17.8) txt('→ चाय वाले का बैंक ✓', 540, 600, 50, '#5dff8a', seg(t, 17.8, 18.1), 1, 10); }
    if (t >= 20.2 && t < 22.4) { txt('"पैसे हैं?"', 380, 520, 60, '#ffffff', seg(t, 20.7, 20.9), 1, 10); txt('"पिन सही है?"', 700, 600, 60, '#ffffff', seg(t, 21.6, 21.8), 1, 10); }
    if (t >= 38.84 && t < 39.52) txt('🔊 "₹10 प्राप्त हुए"', 540, 520, 58, '#ffffff', seg(t, 38.84, 39.0), 1, 10);
  } });
const { on, onCam } = F;

// ---------------------------------------------------------------- animation
on((t) => {
  const loc = LOC(t); bulbL.visible = loc === 'stall'; nightL.visible = loc === 'net';
  // steam from the kettle
  for (let i = 0; i < steam.n; i++) { const k = (t * 0.5 + hash(i)) % 1; steam.pos[i * 3] = -0.75 + (hash(i * 3) - 0.5) * 0.2 + 0.15 * Math.sin(t + i) * k; steam.pos[i * 3 + 1] = loc === 'stall' ? 1.5 + 0.9 * k : -999; steam.pos[i * 3 + 2] = -0.75 + (hash(i * 7) - 0.5) * 0.2; } steam.geo.attributes.position.needsUpdate = true;
  sled.material.color.copy((t > 6.72 && t < 7.3) || (t > 38.84 && t < 39.5) ? HDR(0.6, 4, 0.8) : HDR(0.15, 0.6, 0.2));
  // relay world: node rings light up in the hook (5 computers), runner + lock box legs
  const order = ['phone', 'npci', 'bankA', 'npci', 'bankB'], wake = ['phone', 'shop', 'npci', 'bankA', 'bankB'];
  Object.entries(padRings).forEach(([k, r]) => { let on2 = 0.25; const wi = wake.indexOf(k); if (t >= 1.66 && t < 5) on2 = t > 2.3 + wi * 0.45 ? 1 : 0.15; const R = runnerAt(t); if (t >= 9.12 && (R.f === k || R.to === k)) on2 = 1; r.material.color.setScalar(0.6 + 2.4 * on2); });
  const R = runnerAt(t), showR = loc === 'net' && t >= 9.12 && t < 38.6; runner.visible = runnerCore.visible = showR; runner.position.copy(R.p); runnerCore.position.copy(R.p); runner.scale.setScalar(1.2 + 0.2 * Math.sin(t * 9));
  const lockOn = loc === 'net' && t >= 19.0 && t < 28.8; lockBox.visible = lockLabel.visible = lockOn; lockBox.position.copy(t < 21 ? R.p.clone().add(V(0, 1.1, 0)) : NODES.bankA.clone().add(V(0, 2.2 + 0.2 * Math.sin(t * 2), 3.2))); lockBox.rotation.y = t * 0.8;
  lockLabel.position.copy(lockBox.position).add(V(0, 1.2, 0)); if (t > 28.04) lockBox.scale.setScalar(Math.max(0.001, 1 - seg(t, 28.04, 28.6)));
  cop.children[0].rotation.y = 0; cop.rotation.y = 0.35 * Math.sin(t * 1.5) * (t > 12.4 && t < 15.3 ? 1 : 0.2);
  // coins leave bank A (29.8-31.5) and land at bank B (35.8-37.2)
  for (let i = 0; i < coins.n; i++) { let p = null; const k = (t * 1.2 + i / coins.n) % 1;
    if (t >= 29.8 && t < 31.5) p = NODES.bankA.clone().add(V((hash(i) - 0.5) * 2, 3 + 3 * k, (hash(i * 3) - 0.5) * 2));
    if (t >= 35.8 && t < 37.4) p = NODES.bankB.clone().add(V((hash(i) - 0.5) * 2, 6 - 4 * k, (hash(i * 3) - 0.5) * 2));
    coins.pos[i * 3] = p ? p.x : 0; coins.pos[i * 3 + 1] = p ? p.y : -999; coins.pos[i * 3 + 2] = p ? p.z : 0; } coins.geo.attributes.position.needsUpdate = true;
  shopLed.material.color.copy(t > 37.2 && t < 38.6 ? HDR(0.6, 4, 0.8) : HDR(0.3, 1.5, 0.4));
  // replay trails (39.5-42) and the national-scale trails (42-46.5)
  for (let i = 0; i < trails.n; i++) { let p = null; const k = (t * 0.9 + hash(i)) % 1;
    if (t >= 39.52 && t < 42.06 && i < 300) { const leg = LEGS[i % LEGS.length], a = NODES[leg[2]], b = NODES[leg[3]]; p = a.clone().lerp(b, k); p.y = 1.2 + 2 * Math.sin(k * Math.PI); }
    if (t >= 42.06 && t < 46.58) { const a = V(NW.x + (hash(i) - 0.5) * 240, 0.6, NW.z + (hash(i * 3) - 0.5) * 240), b = V(NW.x + (hash(i * 5) - 0.5) * 240, 0.6, NW.z + (hash(i * 7) - 0.5) * 240); p = a.lerp(b, k); p.y = 0.6 + 6 * Math.sin(k * Math.PI); }
    trails.pos[i * 3] = p ? p.x : 0; trails.pos[i * 3 + 1] = p ? p.y : -999; trails.pos[i * 3 + 2] = p ? p.z : 0; } trails.geo.attributes.position.needsUpdate = true;
  farN.visible = t >= 42.06 && t < 46.58;
});
onCam((t, cam) => {
  const set = (p, l) => { cam.position.copy(p); cam.lookAt(l); cam.updateMatrixWorld(); };
  const R = runnerAt(t);
  if (t < 1.66) set(V(3.4 - 0.2 * t, 1.75, 3.6), V(0.45, 1.25, -0.55));
  else if (t < 5.0) { const k = seg(t, 1.66, 5.0); set(V(NW.x + 30 - 6 * k, 22 - 4 * k, NW.z + 40 - 6 * k), V(NW.x, 0, NW.z)); }
  else if (t < 9.12) { const k = seg(t, 5.0, 9.12); set(V(3.1 - 0.4 * k, 1.7, 3.3 - 0.3 * k), V(0.6, 1.25, -0.45)); }
  else if (t < 13.12) set(R.p.clone().add(V(9, 5, 12)), R.p.clone().add(V(0, 0.5, 0)));
  else if (t < 15.38) set(V(NODES.npci.x + 6, 4.2, NODES.npci.z + 9), V(NODES.npci.x, 2.6, NODES.npci.z));
  else if (t < 19.0) set(V(NW.x + 4, 16, NW.z + 26), V(NW.x + 4, 0, NW.z - 6));
  else if (t < 22.8) set(R.p.clone().add(V(8, 5, 11)), R.p.clone().add(V(0, 0.8, 0)));
  else if (t < 29.36) set(NODES.bankA.clone().add(V(4.5, 3.6, 10)), NODES.bankA.clone().add(V(0, 2.6, 2)));
  else if (t < 35.78) set(R.p.clone().add(V(8, 6, 12)), R.p.clone().add(V(0, 0.5, 0)));
  else if (t < 38.6) set(NODES.bankB.clone().add(V(6, 5, 12)), NODES.bankB.clone().add(V(0, 2.5, 0)));
  else if (t < 39.52) set(V(1.2, 1.35, 0.45), V(0.92, 1.15, -0.4));
  else if (t < 42.06) set(V(NW.x + 20, 26, NW.z + 34), V(NW.x, 0, NW.z));
  else if (t < 46.58) { const k = seg(t, 42.06, 46.58); set(V(NW.x + 40 + 60 * k, 40 + 60 * k, NW.z + 60 + 80 * k), V(NW.x, 0, NW.z)); }
  else { const k = seg(t, 46.58, 52.4); set(V(3.6 - 0.4 * k, 1.75, 3.8 - 0.2 * k), V(0.45, 1.25, -0.55)); }
});
