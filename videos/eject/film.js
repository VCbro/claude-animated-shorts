// फ़ाइटर जेट की इजेक्शन सीट — KAISECHALTAHAI3D #9. 1 unit = 1 m. Jet nose +x. Sky scene at J (300 m up), runway at R, landing field at L.
import { THREE, V, TAU, W, H, film, scene, renderer, mat, add, group, rod, particles, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const total = 49.6;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const svgURL = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const puffTex = (() => { const c = cv(256, 256), g = c.getContext('2d'); for (let i = 0; i < 22; i++) { const x = 128 + (hash(i) - 0.5) * 120, y = 140 + (hash(i * 3) - 0.5) * 60, r = 40 + 40 * hash(i * 5), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); } return new THREE.CanvasTexture(c); })();
const J = V(0, 300, 0), R = V(900, 0, 0), L = V(-400, 0, 300);

// ================================================================ ground (fields, moderate) + runway + clouds
const fieldTex = (() => { const c = cv(1024, 1024), g = c.getContext('2d'); const C = ['#6f8a3a', '#7d9444', '#8a8a3c', '#5f7e36', '#9a9a52', '#6a8040'];
  for (let i = 0; i < 160; i++) { g.fillStyle = C[i % 6]; g.save(); g.translate(1024 * hash(i), 1024 * hash(i * 3)); g.rotate(0.2 * (hash(i * 5) - 0.5)); g.fillRect(0, 0, 80 + 120 * hash(i * 7), 60 + 100 * hash(i * 9)); g.restore(); }
  g.strokeStyle = 'rgba(80,70,50,0.5)'; g.lineWidth = 2; for (let i = 0; i < 30; i++) { g.beginPath(); g.moveTo(0, 1024 * hash(i * 11)); g.lineTo(1024, 1024 * hash(i * 13)); g.stroke(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 20); return t; })();
add(new THREE.PlaneGeometry(8000, 8000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: fieldTex, roughness: 0.95 }), 0, 0, 0, scene, false).receiveShadow = true;
const rwTex = (() => { const c = cv(256, 2048), g = c.getContext('2d'); g.fillStyle = '#3c3e42'; g.fillRect(0, 0, 256, 2048); g.fillStyle = '#eee'; for (let y = 0; y < 2048; y += 120) g.fillRect(122, y, 12, 60); g.fillRect(8, 0, 6, 2048); g.fillRect(242, 0, 6, 2048); return tex(c); })();
add(new THREE.PlaneGeometry(45, 600).rotateX(-Math.PI / 2).rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ map: rwTex, roughness: 0.8 }), R.x, 0.03, R.z, scene, false).receiveShadow = true;
for (let i = 0; i < 10; i++) add(new THREE.BoxGeometry(14, 6 + 4 * hash(i), 12), mat(0xb8b2a4, 0.85), R.x - 120 + i * 26, 3, R.z - 60, scene, false);
const trees = []; for (let i = 0; i < 70; i++) { const x = L.x + (hash(i) - 0.5) * 160, z = L.z - 40 - 60 * hash(i * 3); add(new THREE.SphereGeometry(2.2 + 1.5 * hash(i * 5), 10, 8), mat(0x3a5a2a, 0.9), x, 2.5, z, scene, false); }
const clouds = []; for (let i = 0; i < 90; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
  const sc = 30 + 40 * hash(i * 3); s.scale.set(sc * 1.6, sc, 1); s.userData = { x: (hash(i) - 0.5) * 800, y: 200 + 90 * hash(i * 5) * (hash(i * 9) < 0.7 ? 0.4 : 1.4), z: (hash(i * 7) - 0.5) * 500 }; scene.add(s); clouds.push(s); }

// ================================================================ the fighter jet (moderate: grey-blue; accents)
const jetM = new THREE.MeshPhysicalMaterial({ color: 0x7a8794, metalness: 0.5, roughness: 0.38, clearcoat: 0.4, envMap: ENV, envMapIntensity: 0.6 });
const darkM = mat(0x2a2e34, 0.6, 0.3);
const jet = group(J.x, J.y, J.z);
const fp = [[0, 7.6], [0.22, 7.1], [0.55, 5.9], [0.82, 4.4], [0.95, 2.6], [1.0, 0], [0.98, -4], [0.88, -6.6], [0.72, -7.5]].map(([r, x]) => new THREE.Vector2(r, x));
add(new THREE.LatheGeometry(fp, 48).rotateZ(-Math.PI / 2), jetM, 0, 0, 0, jet);
add(new THREE.ConeGeometry(0.22, 0.7, 24).rotateZ(-Math.PI / 2), darkM, 7.75, 0, 0, jet);
const wing = new THREE.Shape(); wing.moveTo(2.2, 0); wing.lineTo(-5.2, 5.0); wing.lineTo(-6.6, 5.0); wing.lineTo(-6.8, 0); wing.closePath();
for (const s of [1, -1]) { const m = add(new THREE.ExtrudeGeometry(wing, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }).rotateX(s * Math.PI / 2), jetM, 0, -0.2 + (s < 0 ? 0.12 : 0), 0, jet); m.scale.z = 1; }
const fin = new THREE.Shape(); fin.moveTo(-3.6, 0.7); fin.lineTo(-6.9, 4.2); fin.lineTo(-7.7, 4.2); fin.lineTo(-7.5, 0.7); fin.closePath(); add(new THREE.ExtrudeGeometry(fin, { depth: 0.1, bevelEnabled: false }).translate(0, 0, -0.05), jetM, 0, 0, 0, jet);
for (const s of [1, -1]) add(new THREE.BoxGeometry(3.2, 0.8, 0.5), jetM, 1.2, -0.25, s * 0.95, jet);
add(new THREE.CylinderGeometry(0.72, 0.62, 0.7, 32).rotateZ(Math.PI / 2), darkM, -7.7, 0, 0, jet);
const burner = add(new THREE.CircleGeometry(0.55, 32).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: HDR(2.6, 1.2, 0.4) }), -8.06, 0, 0, jet, false);
// accent stripes (bold) + cockpit tub, instrument panel
add(new THREE.BoxGeometry(0.14, 3.6, 0.13), new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.5 }), -6.5, 2.35, 0, jet, false).rotation.z = -0.82;
add(new THREE.BoxGeometry(2.0, 0.3, 0.6), mat(0x1a1d22, 0.8), 4.1, -0.2, 0, jet, false);
const panelC = cv(256, 128), pg = panelC.getContext('2d'); pg.fillStyle = '#0c0f14'; pg.fillRect(0, 0, 256, 128); for (let i = 0; i < 3; i++) { pg.fillStyle = ['#2a8a4a', '#1a5a9a', '#2a8a4a'][i]; pg.fillRect(14 + i * 82, 20, 70, 60); }
add(new THREE.PlaneGeometry(0.85, 0.42).rotateY(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex(panelC) }), 5.3, 0.95, 0, jet, false);
const gear = group(0, 0, 0, jet); for (const [x, z] of [[5.2, 0], [-1.6, 1.4], [-1.6, -1.4]]) { add(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 8), darkM, x, -1.2, z, gear, false); add(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 20).rotateX(Math.PI / 2), mat(0x111214, 0.9), x, -1.85, z, gear); }
// canopy + explosive cord + shards
const canM = new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, metalness: 0.1, roughness: 0.03, transparent: true, opacity: 0.35, envMap: ENV, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false });
const canopy = group(4.2, 0.9, 0, jet); add(new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2).scale(1.7, 0.66, 0.6), canM, 0, 0, 0, canopy, false); add(new THREE.TorusGeometry(1, 0.03, 6, 48).rotateX(Math.PI / 2).scale(1.7, 1, 0.6), darkM, 0, 0, 0, canopy, false);
const cordPts = []; for (let i = 0; i <= 60; i++) { const a = i / 60, th = (a - 0.5) * 2.6, zz = 0.42 * Math.sin(i * 1.6) ; cordPts.push(V(1.6 * Math.sin(th), 0.62 * Math.cos(th) * Math.sqrt(Math.max(0, 1 - (zz / 0.6) ** 2)), zz)); }
const cordM = new THREE.MeshBasicMaterial({ color: HDR(2.8, 1.4, 0.3), transparent: true, opacity: 0 });
add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 200, 0.025, 6), cordM, 0, 0.01, 0, canopy, false);
const shardM = new THREE.MeshPhysicalMaterial({ color: 0xd8ecff, roughness: 0.05, transparent: true, opacity: 0.6, envMap: ENV, side: THREE.DoubleSide, depthWrite: false });
const shards = Array.from({ length: 40 }, (_, i) => { const g2 = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0.2 + 0.2 * hash(i), 0.05, 0.1), V(0.05, 0.25 * hash(i * 3) + 0.1, 0.1)]); g2.computeVertexNormals(); const m = new THREE.Mesh(g2, shardM); scene.add(m); m.visible = false;
  return { m, d: V(hash(i * 5) - 0.5, 0.6 + hash(i * 7), hash(i * 9) - 0.5).normalize(), o: V(4.2 + (hash(i * 11) - 0.5) * 2.4, 1.2 + 0.4 * hash(i * 13), (hash(i * 17) - 0.5) * 0.9) }; });
const flash = particles(80, HDR(3, 2.4, 1.0), 0.18); flash.p.material.map = dotTex;
const jsmoke = particles(220, new THREE.Color(0.25, 0.25, 0.27), 3.0, { additive: false, opacity: 0.5 }); jsmoke.p.material.map = puffTex;

// ================================================================ the ejection seat (bold) + pilot cut-outs + parachutes
const seat = group(0, 0, 0);
const frameM = mat(0x6a7480, 0.5, 0.6), cushM = mat(0xd8361a, 0.7);
add(new THREE.BoxGeometry(0.62, 0.12, 0.62), cushM, 0, 0, 0, seat); add(new THREE.BoxGeometry(0.12, 1.15, 0.62), cushM, -0.36, 0.58, 0, seat);
add(new THREE.BoxGeometry(0.3, 0.4, 0.66), frameM, -0.36, 1.32, 0, seat); for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.1, 1.6, 0.06), frameM, -0.44, 0.65, s * 0.34, seat);
add(new THREE.BoxGeometry(0.4, 0.22, 0.5), frameM, -0.1, -0.17, 0, seat);
const stripeT = (() => { const c = cv(256, 32), g = c.getContext('2d'); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#111' : '#ffd21a'; g.fillRect(i * 16, 0, 16, 32); } return tex(c); })();
const handle = add(new THREE.TorusGeometry(0.11, 0.028, 10, 32, Math.PI * 1.4), new THREE.MeshStandardMaterial({ map: stripeT, roughness: 0.5, emissive: 0xffd21a, emissiveIntensity: 0.15 }), 0.3, 0.12, 0, seat, false); handle.rotation.set(Math.PI / 2, 0, Math.PI * 0.8);
add(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 20), mat(0x8a9098, 0.4, 0.8), -0.25, -0.4, 0, seat);
const plume = particles(260, HDR(3, 1.6, 0.5), 0.25); plume.p.material.map = dotTex;
const psmoke = particles(160, new THREE.Color(0.7, 0.7, 0.72), 1.6, { additive: false, opacity: 0.45 }); psmoke.p.material.map = puffTex;
async function cutout(svgStr, { h = 1.7, border = 10, res = 1200 } = {}) {
  const im = await img(svgURL(svgStr)), iw = im.naturalWidth, ih = im.naturalHeight, sc = res / ih, w = Math.round(iw * sc) + border * 4, hh = Math.round(ih * sc) + border * 4, o = border * 2;
  const st = cv(w, hh), s2 = st.getContext('2d'); for (let a = 0; a < 24; a++) s2.drawImage(im, o + Math.cos(a / 24 * TAU) * border, o + Math.sin(a / 24 * TAU) * border, iw * sc, ih * sc);
  s2.globalCompositeOperation = 'source-in'; s2.fillStyle = '#f6f0e1'; s2.fillRect(0, 0, w, hh);
  const c = cv(w, hh), g = c.getContext('2d'); g.drawImage(st, 0, 0); g.drawImage(im, o, o, iw * sc, ih * sc); const t = tex(c);
  const geo = new THREE.PlaneGeometry(h * w / hh, h); geo.translate(0, h / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.8, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.2, side: THREE.DoubleSide })); m.castShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 }); const grp = new THREE.Group(); grp.add(m); scene.add(grp); return grp;
}
const HEAD = `<ellipse cx="330" cy="200" rx="92" ry="98" fill="#ffffff" stroke="#26160c" stroke-width="9"/><path d="M250 150 Q330 90 410 150" fill="none" stroke="#ff7a1a" stroke-width="20"/>
  <path d="M300 210 Q380 196 420 230 Q420 290 350 290 Q300 286 300 210 Z" fill="#d9a074" stroke="#26160c" stroke-width="8"/><path d="M330 196 L430 196 Q440 230 410 236 L320 236 Z" fill="#1a3a6a" stroke="#26160c" stroke-width="8"/>
  <path d="M360 260 Q385 276 410 262" fill="none" stroke="#7a1e24" stroke-width="7" stroke-linecap="round"/><path d="M300 270 Q330 300 380 300" fill="none" stroke="#5a6a4a" stroke-width="14"/>`;
const seatedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="780" viewBox="0 0 720 780">
  <path d="M250 320 Q330 300 400 330 L420 560 L240 560 Z" fill="#5a6e46" stroke="#26160c" stroke-width="9"/><path d="M250 380 L300 380 L300 560 L250 560 Z" fill="#ff7a1a" opacity="0.8"/>
  <path d="M240 540 L560 540 Q590 560 560 600 L250 610 Z" fill="#5a6e46" stroke="#26160c" stroke-width="9"/><path d="M540 560 L580 770 L640 770 L600 560 Z" fill="#5a6e46" stroke="#26160c" stroke-width="9"/>
  <path d="M570 740 L690 740 Q700 770 690 776 L570 776 Z" fill="#1a1a1a" stroke="#26160c" stroke-width="8"/>
  <path d="M380 360 Q460 430 500 500 L470 520 Q420 460 360 410 Z" fill="#5a6e46" stroke="#26160c" stroke-width="8"/><ellipse cx="498" cy="520" rx="28" ry="26" fill="#3a3a3a" stroke="#26160c" stroke-width="7"/>${HEAD}</svg>`;
const hangSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="660" height="1260" viewBox="0 0 660 1260">
  <path d="M230 330 Q330 300 430 330 L440 760 L220 760 Z" fill="#5a6e46" stroke="#26160c" stroke-width="9"/><path d="M240 360 L420 360 M250 560 L410 560" stroke="#ff7a1a" stroke-width="16"/>
  <path d="M230 760 L250 1180 L320 1180 L330 790 L340 1180 L410 1180 L430 760 Z" fill="#5a6e46" stroke="#26160c" stroke-width="9"/>
  <path d="M230 1170 L330 1170 L330 1220 L215 1220 Z M335 1170 L430 1170 L445 1220 L335 1220 Z" fill="#1a1a1a" stroke="#26160c" stroke-width="8"/>
  <path d="M240 350 Q150 250 150 120 L190 110 Q200 230 270 320 Z" fill="#5a6e46" stroke="#26160c" stroke-width="8"/><path d="M420 350 Q510 250 510 120 L470 110 Q460 230 390 320 Z" fill="#5a6e46" stroke="#26160c" stroke-width="8"/>
  <ellipse cx="170" cy="100" rx="28" ry="26" fill="#3a3a3a" stroke="#26160c" stroke-width="7"/><ellipse cx="490" cy="100" rx="28" ry="26" fill="#3a3a3a" stroke="#26160c" stroke-width="7"/>
  <g transform="translate(0,70)">${HEAD.replace(/330/g, '330')}</g></svg>`;
const seated = await cutout(seatedSVG, { h: 1.25, res: 700 }); seat.add(seated); seated.position.set(-0.42, -0.05, 0.36);
const pilotG = group(0, 0, 0); const hang = await cutout(hangSVG, { h: 1.85, res: 900 }); pilotG.add(hang); hang.position.set(0, 0, 0);
// parachutes
const gores = (() => { const c = cv(1024, 256), g = c.getContext('2d'); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#ff6a1a'; g.fillRect(i * 64, 0, 64, 256); } return tex(c); })();
const chuteM = new THREE.MeshStandardMaterial({ map: gores, roughness: 0.8, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: gores, emissiveIntensity: 0.1 });
const main = group(0, 0, 0, pilotG); const R_C = 3.6, CH = 6.2;
add(new THREE.SphereGeometry(R_C, 48, 16, 0, TAU, 0, Math.PI * 0.42).scale(1, 0.55, 1), chuteM, 0, CH, 0, main, false);
{ const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = R_C * Math.sin(Math.PI * 0.42); pts.push(V(Math.cos(a) * rr, CH + R_C * 0.55 * Math.cos(Math.PI * 0.42), Math.sin(a) * rr), V((i % 2 ? 0.25 : -0.25), 1.75, 0)); }
  main.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xeeeeee }))); }
const drogue = group(0, 0, 0, seat); add(new THREE.SphereGeometry(0.55, 24, 10, 0, TAU, 0, Math.PI * 0.45), chuteM, 0, 3.0, 0, drogue, false);
{ const pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; pts.push(V(Math.cos(a) * 0.5, 3.1, Math.sin(a) * 0.5), V(-0.36, 1.5, 0)); } drogue.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xdddddd }))); }

// ================================================================ photo
const PH = { seat: await img('img/seat.jpg'), test: await img('img/test.jpg') };
function paper(g, im, x, y, w, rot, a, cap) {
  if (!im || a <= 0.001) return; const iw = im.naturalWidth, ih = im.naturalHeight, h = w * ih / iw, b = w * 0.04, ch = cap ? 54 : 0;
  g.save(); g.globalAlpha = Math.min(1, a); g.translate(x, y); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 40; g.shadowOffsetY = 18;
  g.fillStyle = '#f5f0e3'; g.beginPath(); g.moveTo(-w / 2 - b, -h / 2 - b); g.lineTo(w / 2 + b, -h / 2 - b); for (let i = 0; i <= 40; i++) g.lineTo(w / 2 + b - i / 40 * (w + 2 * b), h / 2 + b + ch + 8 * hash(i * 3.1)); g.closePath(); g.fill();
  g.shadowColor = 'transparent'; g.imageSmoothingQuality = 'high'; g.drawImage(im, -w / 2, -h / 2, w, h);
  if (cap) { g.fillStyle = '#2a2622'; g.font = '800 28px BalooD, BalooL, sans-serif'; g.textAlign = 'center'; g.fillText(cap, 0, h / 2 + b + 36); }
  g.fillStyle = 'rgba(238,224,170,0.85)'; for (const s of [-1, 1]) { g.save(); g.translate(s * w * 0.36, -h / 2 - b * 0.6); g.rotate(s * 0.5); g.fillRect(-46, -14, 92, 28); g.restore(); } g.restore();
}

// ================================================================ the story state (pure function of t)
const SEAT0 = V(4.05, 0.05, 0);
function state(t) {
  const s = { jet: J.clone(), pitch: 0, roll: 0, can: 1, canK: 0, cord: 0, shat: -1, seatW: null, seatLocal: null, sRot: 0, rocket: 0, drogue: 0, main: 0, pilot: null, sep: false, smoke: 0, gear: false, speed: 1 };
  const te = t < 3 ? 18.7 + t * 0.48 : t;                                     // hook = slow-motion replay of 18.7-20.1
  if (t < 20.52) {
    if (t >= 3 && t < 6.24) { const u = t - 3; s.pitch = -0.12 - 0.05 * u; s.roll = 0.35 * Math.sin(u * 0.9); s.smoke = 1; }
    if (te >= 14.26) { s.canK = clamp((te - 14.26) / 1.0); s.can = te < 15.3 ? 2 : 1; }
    if (te >= 15.3) { s.can = 1; s.canK = 0; s.cord = smooth(seg(te, 15.4, 16.0)); }
    if (te >= 16.9) { s.can = 0; s.shat = te - 16.9; s.cord = 0; }
    if (te >= 18.1) s.shat = -1;
    const k = clamp((te - 19.6) / 0.92); s.seatLocal = SEAT0.clone().add(V(-0.3 * k * k, 3.3 * k * k, 0)); s.rocket = te >= 19.55 ? 1 : 0;
  } else if (t < 30.58) {
    const u = t - 20.52; s.can = 0; s.jet.y = J.y - 3.2 * u * u; s.jet.x = J.x + 2 * u; s.pitch = -0.04 * u;
    const ap = 4.2, y = u < ap ? 3.75 + 12.5 * u - 1.49 * u * u : 3.75 + 12.5 * ap - 1.49 * ap * ap - 2.2 * (u - ap);
    s.seatW = V(J.x + SEAT0.x - 3.0 * u, J.y + SEAT0.y + y, 0); s.rocket = u < 0.45 ? 1 : 0; s.drogue = smooth(seg(t, 25.0, 25.5)); s.sRot = 0.45 * Math.sin(u * 3.2) * (1 - s.drogue);
    if (t >= 28.0) { const v = t - 28.0; s.sep = true; s.pilot = s.seatW.clone().add(V(0.3 * v, 0.2 - 1.6 * v, 0.2)); s.seatW.y -= 4.9 * v * v; s.seatW.x -= 1.5 * v; s.sRot = -1.2 * v; s.main = backOut(seg(t, 29.35, 30.05), 1.4); }
  } else if (t < 38.24) {                                                                     // zero-zero on the runway
    s.jet = R.clone().add(V(0, 2.05, 0)); s.gear = true; s.speed = 0;
    if (t >= 31.3) { s.canK = clamp((t - 31.3) / 1.0); s.can = 2; } if (t >= 32.4) s.can = 0;
    const v = Math.max(0, t - 31.6), h = 46 * (1 - Math.exp(-v * 1.7)) - 1.2 * v; s.rocket = v > 0 && v < 0.5 ? 1 : 0;
    s.seatW = V(R.x + SEAT0.x - 2.2 * v, R.y + 2.05 + SEAT0.y + h, 0); s.drogue = smooth(seg(t, 33.0, 33.4)); s.sRot = 0.3 * Math.sin(v * 3) * (1 - s.drogue);
    if (t < 31.6) { s.seatW = null; s.seatLocal = SEAT0.clone(); }
    if (t >= 33.8) { const w2 = t - 33.8; s.sep = true; s.pilot = s.seatW.clone().add(V(0.4 * w2, 0.2, 0.2)); s.pilot.y -= 4.2 * w2 * Math.min(1, w2) * 0.6 + (w2 > 1 ? 3.6 * (w2 - 1) : 0); s.seatW.y -= 4.9 * w2 * w2; s.seatW.x -= 1.2 * w2; s.sRot = -1.2 * w2; s.main = backOut(seg(t, 34.0, 34.7), 1.4); }
  } else {                                                                                    // descent + safe landing
    s.jet = null; s.sep = true; const hgt = Math.max(0, (46.0 - t) * 4.6); s.pilot = L.clone().add(V(-0.8 * Math.min(t, 46) + 0.8 * 46, hgt, 0)); s.main = 1; s.seatW = null;
  }
  return s;
}

// ================================================================ cameras (onCam, lens off: everything moves)
const SKY = { e: 34, az: 2.1, sun: 2.7, ambI: 0.7, fog: 0.0007, exposure: 1.0 };
const GND = { e: 28, az: 2.4, sun: 2.8, ambI: 0.65, fog: 0.0012, exposure: 1.0 };
const KEYS = [[0, 0, V(J.x + 20, J.y + 6, 25), J, 40, SKY], [30.58, 30.58, V(R.x - 20, 10, 40), V(R.x, 15, 0), 40, GND], [38.24, 38.24, V(L.x + 10, 20, 30), V(L.x, 15, 0), 40, GND]];
const ttl = (a, b, s, px, col, sub) => [a, b, s, px, col, 300, sub];
const F = film({ total, keys: KEYS, exposure: 1.0, lens: false, shutter: 0.25 / 30, brand: { handle: '@KaiseChaltaHai3D', color: '#ffd24a' },
  hits: [[7.46, 0.004], [14.26, 0.006], [16.9, 0.008], [19.6, 0.012], [31.6, 0.01], [38.7, 0.02]],
  titles: [ttl(-1, 2.8, '1 सेकंड से भी कम!', 104, '#ffd24a', 'पायलट जेट से बाहर'), ttl(3.1, 6.1, 'जेट गिर रहा है…', 96, '#ff7a5a', 'पायलट कैसे निकले?'),
    ttl(7.5, 10.9, 'हैंडल खींचा!', 110, '#ffd21a'), ttl(13.0, 15.2, '1. कैनोपी उड़ी', 96, '#7fd8ff'), ttl(15.4, 18.0, 'या… विस्फोटक तार', 90, '#ffb21a', 'शीशा तोड़ देती है'),
    ttl(19.4, 20.5, '2. रॉकेट फ़ायर!', 110, '#ff7a1a'), ttl(20.6, 24.0, 'ज़बरदस्त ताक़त से ऊपर!', 84, '#ffd24a'), ttl(24.3, 26.7, '3. छोटा पैराशूट', 96, '#ff9a4a', 'सीट को सीधा रखता है'),
    ttl(27.0, 30.4, '4. पायलट अलग…', 96, '#7fd8ff', 'बड़ा पैराशूट खुला!'), ttl(30.7, 34.5, 'ज़ीरो-ज़ीरो सीट', 104, '#5dff8a'), ttl(38.4, 41.0, 'झटका बेहद तेज़!', 104, '#ff5a4a'),
    ttl(44.0, 999, 'सबसे क़ीमती हिस्सा…', 92, '#ffd24a', 'इंजन नहीं — पायलट!')],
  pills: [[33.0, 38.0, 'ऊँचाई: 0  •  रफ़्तार: 0', 1300, '#5dff8a'], [40.8, 43.4, 'इसीलिए ख़ास ट्रेनिंग', 1300, '#7fd8ff']],
  overlay: (g, t, { txt, pill }) => {
    if (t < 3) { const v = Math.min(0.9, 0.2 + t * 0.24); txt(`${v.toFixed(1)} सेकंड`, 540, 1250, 110, '#ffffff', seg(t, 0.2, 0.5), 1, 12); }
    if (t >= 8.3 && t < 11.0) { const a = 1 - seg(t, 10.7, 11.0); ['1 कैनोपी', '2 रॉकेट', '3 पैराशूट'].forEach((s2, i) => pill(s2, 230 + i * 310, 1250, ['#7fd8ff', '#ff7a1a', '#ffd24a'][i], a * seg(t, 8.5 + i * 0.45, 8.8 + i * 0.45), 44)); }
    if (t >= 20.6 && t < 24.0) { g.save(); g.globalAlpha = 0.35 * (1 - seg(t, 23.6, 24.0)); g.strokeStyle = '#ffffff'; g.lineWidth = 4; for (let i = 0; i < 26; i++) { const x = 1080 * hash(i * 3), y0 = ((hash(i) * 1920 + t * 2600) % 2300) - 200; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + 160); g.stroke(); } g.restore(); }
    const card = (im, a, b2, x, y, w, rot, cap) => { if (t < a || t > b2) return; const kk = backOut(seg(t, a, a + 0.4), 1.6), o = 1 - smooth(seg(t, b2 - 0.3, b2)); paper(g, im, x, y + 60 * (1 - kk) + 120 * (1 - o), w * kk, rot + 0.02 * Math.sin(t), o, cap); };
    card(PH.seat, 35.2, 38.1, 540, 1060, 640, -0.03, 'असली इजेक्शन सीट');
    card(PH.test, 41.0, 43.5, 540, 1000, 860, 0.02, 'असली इजेक्शन टेस्ट');
  } });
const { on, onCam } = F;

// ================================================================ animation
const tmp = new THREE.Object3D(); let ST = state(0);
on((t) => {
  const s = ST = state(t);
  jet.visible = !!s.jet; if (s.jet) { jet.position.copy(s.jet); jet.rotation.set(s.roll, 0, s.pitch); } gear.visible = s.gear; burner.visible = !s.gear;
  jet.updateMatrixWorld(true);
  canopy.visible = s.can > 0; canopy.position.set(4.2, 0.9, 0); canopy.rotation.set(0, 0, 0);
  if (s.can === 2) { const k = s.canK; canopy.position.set(4.2 - 9 * k * k, 0.9 + 7 * k - 3 * k * k, 0); canopy.rotation.set(0.4 * k, 0, 2.6 * k); }
  cordM.opacity = s.cord; cordM.color.setRGB(2.8, 1.4, 0.3).multiplyScalar(0.6 + 0.6 * Math.sin(t * 30) ** 2);
  shards.forEach((sh) => { sh.m.visible = s.shat >= 0 && s.shat < 1.2 && !!s.jet; if (sh.m.visible) { const p = sh.o.clone().addScaledVector(sh.d, 6 * s.shat).add(V(-4 * s.shat * s.shat, -2 * s.shat * s.shat, 0)); sh.m.position.copy(p).applyMatrix4(jet.matrixWorld); sh.m.rotation.set(s.shat * 9, s.shat * 7, 0); } });
  for (let i = 0; i < flash.n; i++) { const on2 = s.shat >= 0 && s.shat < 0.35 && s.jet; const p = on2 ? V(4.2 + (hash(i) - 0.5) * 3, 1.3 + 0.5 * hash(i * 3), (hash(i * 5) - 0.5) * 1.2).applyMatrix4(jet.matrixWorld) : V(0, -999, 0); flash.pos.set([p.x, p.y, p.z], i * 3); } flash.geo.attributes.position.needsUpdate = true;
  // seat
  seat.visible = !!(s.seatW || s.seatLocal); if (s.seatLocal) { seat.position.copy(s.seatLocal).applyMatrix4(jet.matrixWorld); seat.quaternion.copy(jet.quaternion); } else if (s.seatW) { seat.position.copy(s.seatW); seat.rotation.set(0, 0, s.sRot); }
  seated.visible = !s.sep; drogue.visible = s.drogue > 0.01; drogue.scale.set(Math.max(0.01, s.drogue), Math.max(0.01, s.drogue), Math.max(0.01, s.drogue)); drogue.rotation.z = -s.sRot * 0.8;
  // rocket plume (world space, below the seat)
  seat.updateMatrixWorld(true); const base = V(-0.25, -0.7, 0).applyMatrix4(seat.matrixWorld);
  for (let i = 0; i < plume.n; i++) { const k = (t * 3.5 + hash(i)) % 1, on2 = s.rocket && seat.visible; plume.pos[i * 3] = on2 ? base.x + (hash(i * 3) - 0.5) * 0.3 * (1 + 3 * k) : 0; plume.pos[i * 3 + 1] = on2 ? base.y - 3.5 * k : -999; plume.pos[i * 3 + 2] = on2 ? base.z + (hash(i * 5) - 0.5) * 0.3 * (1 + 3 * k) : 0; } plume.geo.attributes.position.needsUpdate = true;
  for (let i = 0; i < psmoke.n; i++) { const k = (t * 0.8 + hash(i * 7)) % 1, on2 = (s.rocket || (t > 20.5 && t < 22.5) || (t > 31.6 && t < 33.5)) && seat.visible; psmoke.pos[i * 3] = on2 ? base.x + 4 * k + (hash(i) - 0.5) * 2 * k : 0; psmoke.pos[i * 3 + 1] = on2 ? base.y - 9 * k : -999; psmoke.pos[i * 3 + 2] = on2 ? base.z + (hash(i * 3) - 0.5) * 2 * k : 0; } psmoke.geo.attributes.position.needsUpdate = true;
  // jet smoke (damaged jet) + burner flicker
  const tail = V(-8.2, 0, 0).applyMatrix4(jet.matrixWorld);
  for (let i = 0; i < jsmoke.n; i++) { const k = (t * 0.9 + hash(i * 5)) % 1, on2 = s.smoke && jet.visible; jsmoke.pos[i * 3] = on2 ? tail.x - 30 * k : 0; jsmoke.pos[i * 3 + 1] = on2 ? tail.y + 8 * k + (hash(i) - 0.5) * 2 : -999; jsmoke.pos[i * 3 + 2] = on2 ? tail.z + (hash(i * 3) - 0.5) * 3 * k : 0; } jsmoke.geo.attributes.position.needsUpdate = true;
  burner.material.color.setRGB(2.6, 1.2, 0.4).multiplyScalar(0.8 + 0.2 * Math.sin(t * 40));
  // pilot + main chute
  pilotG.visible = !!(s.sep && s.pilot); if (pilotG.visible) { pilotG.position.copy(s.pilot); pilotG.rotation.set(0, 0, 0.06 * Math.sin(t * 1.3)); }
  main.visible = s.main > 0.01; main.scale.set(Math.max(0.01, s.main), Math.max(0.01, 0.3 + 0.7 * s.main), Math.max(0.01, s.main));
  if (t > 46.0) { const c = smooth(seg(t, 46.0, 47.6)); main.scale.set(1 - 0.2 * c, Math.max(0.05, 1 - 0.95 * c), 1 - 0.2 * c); main.position.set(-3.5 * c, -1.0 * c, 0); main.rotation.z = 1.2 * c; } else { main.position.set(0, 0, 0); main.rotation.z = 0; }
  // clouds stream past while flying (speed), drift slowly otherwise
  const flying = t < 30.58, dx = flying ? -70 * t : -4 * t, rise = t >= 3 && t < 6.24 ? 30 * (t - 3) : 0;
  clouds.forEach((c) => { const u = c.userData; c.position.set(((u.x + dx) % 800 + 1200) % 800 - 400 + J.x, u.y + rise, u.z); c.visible = flying || t >= 38.24; if (t >= 38.24) c.position.y = u.y + 40; });
});
onCam((t, cam) => {
  const s = ST, set = (p, l, f) => { cam.position.copy(p); cam.lookAt(l); cam.fov = f; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); };
  const J2 = s.jet || J, sp = seat.position;
  if (t < 3) set(V(J.x + 11, J.y + 3.6, 14 - 1.2 * t), V(J.x + 2.5, J.y + 1.0 + 0.5 * Math.max(0, sp.y - J.y - 0.05), 0), 40);
  else if (t < 6.24) { const u = t - 3; set(V(J.x - 26 + 2 * u, J.y + 7, 22 - u), V(J.x, J.y, 0), 38); }
  else if (t < 11.0) { const u = seg(t, 6.24, 11.0); set(V(J.x + 5.4, J.y + 2.2 - 0.3 * u, 5.0 - 0.9 * u), V(J.x + 4.0, J.y + 0.9, 0), 42); }
  else if (t < 15.3) set(V(J.x - 2, J.y + 5, 14), V(J.x + 2.0, J.y + 2.6, 0), 44);
  else if (t < 18.1) set(V(J.x + 8.5, J.y + 3.4, 6.0), V(J.x + 4.0, J.y + 1.0, 0), 40);
  else if (t < 20.52) set(V(J.x + 11, J.y + 2.6, 13), V(J.x + 3.5, J.y + 1.2 + 0.5 * (sp.y - J.y - 0.05), 0), 40);
  else if (t < 28.0) set(V(sp.x + 7, sp.y - 2.5, 13), V(sp.x, sp.y + 1.0 + 1.2 * s.drogue, 0), 44);
  else if (t < 30.58) { const p = pilotG.visible ? pilotG.position : sp; set(V(p.x + 9, p.y - 1.5, 18), V(p.x, p.y + 3.0 * s.main, 0), 46); }
  else if (t < 38.24) { const p = pilotG.visible ? pilotG.position : sp, y = Math.max(4, p.y * 0.7); set(V(R.x - 26, 4 + y * 0.7, 50), V(R.x + 2, Math.max(6, y * 0.85), 0), 50); }
  else { const p = pilotG.position; set(V(p.x + 9, Math.max(2.2, p.y - 1.0), p.z + 17), V(p.x, p.y + (t < 46 ? 3.2 : 1.6), p.z), 44); }
});
