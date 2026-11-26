// DILJIT • PATIALA — Part 1, told in 3D: a concert stadium, the Met Gala steps, a 1911 palace hall, a museum gallery.
// People are flat cartoons (toon.js) standing in the 3D world as paper cut-outs; real photos appear only at fact beats.
import { THREE, V, TAU, W, H, film, scene, renderer, sun, mat, add, group, rod, particles, photoCard, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, hash } from './cine.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { diljit, maharaja } from './toon.js';
import { necklace3D } from './necklace.js';

const total = 46.8;
const pm = new THREE.PMREMGenerator(renderer), ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const HDR = (r, g, b) => new THREE.Color(r, g, b);
const svgURL = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const at = (o, x, y, z) => V(o.x + x, o.y + y, o.z + z);
sun.visible = false; sun.castShadow = false;
const dotTex = (() => { const c = cv(64, 64), g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, '#fff'); r.addColorStop(0.4, 'rgba(255,255,255,0.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const pts = (n, col, size) => { const p = particles(n, col, size); p.p.material.map = dotTex; p.p.material.transparent = true; return p; };

// ---------------------------------------------------------------- cartoon cut-outs
async function cutout(svgStr, { h = 1.95, border = 10, res = 1500, backSvg = null } = {}) {
  const make = async (s) => { const im = await img(svgURL(s)), iw = im.naturalWidth, ih = im.naturalHeight, sc = res / ih, w = Math.round(iw * sc) + border * 4, hh = Math.round(ih * sc) + border * 4, o = border * 2;
    const st = cv(w, hh), sg = st.getContext('2d'); for (let a = 0; a < 24; a++) sg.drawImage(im, o + Math.cos(a / 24 * TAU) * border, o + Math.sin(a / 24 * TAU) * border, iw * sc, ih * sc);
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#f6f0e1'; sg.fillRect(0, 0, w, hh);
    const c = cv(w, hh), g = c.getContext('2d'); g.drawImage(st, 0, 0); g.drawImage(im, o, o, iw * sc, ih * sc); return { c, w, hh, sc, o }; };
  const F = await make(svgStr), t = tex(F.c), ww = h * F.w / F.hh, geo = new THREE.PlaneGeometry(ww, h); geo.translate(0, h / 2, 0);
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.75, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 }));
  front.castShadow = true; front.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.5 });
  const dark = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: t, color: 0x140c06, alphaTest: 0.5 })); dark.position.z = -h * 0.006; dark.scale.setScalar(1.003);
  const grp = new THREE.Group(); grp.add(dark, front);
  if (backSvg) { const B = await make(backSvg), tb = tex(B.c), gb = new THREE.PlaneGeometry(h * B.w / B.hh, h); gb.translate(0, h / 2, 0);
    const back = new THREE.Mesh(gb, new THREE.MeshStandardMaterial({ map: tb, alphaTest: 0.5, roughness: 0.75, emissive: 0xffffff, emissiveMap: tb, emissiveIntensity: 0.12 }));
    back.rotation.y = Math.PI; back.position.z = -h * 0.012; grp.add(back); }
  scene.add(grp); grp.userData.at = (px, py) => V(((px * F.sc + F.o) / F.w - 0.5) * ww, (1 - (py * F.sc + F.o) / F.hh) * h, 0.02); grp.visible = false; return grp;
}

// ================================================================ A. AHMEDABAD STADIUM (night concert)
const ST = V(0, 0, 0), STAGE_Y = 1.2;
add(new THREE.BoxGeometry(14, STAGE_Y, 7), new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.4, metalness: 0.3 }), 0, STAGE_Y / 2, -1);
add(new THREE.BoxGeometry(14, 0.04, 0.1), new THREE.MeshBasicMaterial({ color: HDR(2.4, 1.6, 0.6) }), 0, STAGE_Y, 2.5, scene, false);
const ledTex = (() => { const c = cv(1024, 460), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 460); gr.addColorStop(0, '#2a0a3a'); gr.addColorStop(1, '#a02040'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 460);
  g.strokeStyle = '#ffcf6a'; g.lineWidth = 6; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(512, 520, 60 + i * 42, Math.PI, TAU); g.stroke(); }
  g.fillStyle = '#fff3d0'; g.font = "800 70px BalooL, BalooD, sans-serif"; g.textAlign = 'center'; g.fillText('AHMEDABAD', 512, 120); return tex(c); })();
const led = add(new THREE.PlaneGeometry(11, 4.95), new THREE.MeshBasicMaterial({ map: ledTex, color: HDR(1.3, 1.3, 1.3) }), 0, STAGE_Y + 3.0, -3.6, scene, false);
for (const x of [-7.6, 7.6]) add(new THREE.PlaneGeometry(3.2, 5.6), new THREE.MeshBasicMaterial({ map: ledTex, color: HDR(0.9, 0.9, 0.9) }), x, STAGE_Y + 3.4, -2.6, scene, false).rotation.y = -Math.sign(x) * 0.35;
const truss = mat(0x2a2a30, 0.5, 0.6); add(new THREE.BoxGeometry(16, 0.3, 0.3), truss, 0, 8.6, -1); for (const x of [-7.8, 7.8]) add(new THREE.BoxGeometry(0.3, 8.6, 0.3), truss, x, 4.3, -1);
const beamMat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const beams = Array.from({ length: 8 }, (_, i) => { const g = new THREE.ConeGeometry(1.1, 16, 24, 1, true); g.translate(0, -8, 0); const m = new THREE.Mesh(g, beamMat(i % 2 ? HDR(0.5, 0.6, 1.6) : HDR(1.6, 1.0, 0.5)));
  m.position.set(-7 + i * 2, 8.5, -1.2); scene.add(m); return m; });
// crowd + phone lights
const crowdG = new THREE.CapsuleGeometry(0.2, 0.55, 2, 6); const NC = 2600;
const crowd = new THREE.InstancedMesh(crowdG, mat(0x0c0c12, 0.9), NC); crowd.frustumCulled = false; scene.add(crowd);
const phones = pts(1400, HDR(1.6, 1.7, 2.2), 0.09);
{ const m = new THREE.Matrix4(); for (let i = 0; i < NC; i++) { const x = (hash(i) - 0.5) * 46, z = 4 + 40 * hash(i * 1.7) ** 0.8, y = 0.75 + 0.012 * z + 0.1 * hash(i * 3); m.makeTranslation(x, y, z); crowd.setMatrixAt(i, m); } }
const fw = pts(900, HDR(2.6, 1.7, 0.6), 0.16);
const stadiumKey = new THREE.SpotLight(0xfff0e0, 0, 30, 0.35, 0.5, 1.2); stadiumKey.position.set(1, 10, 7); stadiumKey.target.position.set(-0.5, 2.2, 0); stadiumKey.castShadow = true; stadiumKey.shadow.mapSize.set(2048, 2048); scene.add(stadiumKey, stadiumKey.target);
const fanSpot = new THREE.SpotLight(0xfff4e0, 0, 20, 0.16, 0.35, 1.2); fanSpot.position.set(1.4, 9.5, 3.5); fanSpot.target.position.set(1.0, 1.8, 0.3); fanSpot.castShadow = true; scene.add(fanSpot, fanSpot.target);
const stageWash = new THREE.PointLight(0xff4a8a, 0, 18, 1.4); stageWash.position.set(0, 4, -1); scene.add(stageWash);
const dilStage = await cutout(diljit({ look: 'stage' }), { h: 1.95 }); dilStage.position.set(-0.55, STAGE_Y, 0); dilStage.rotation.y = 0.12;
const fan = await cutout(diljit({}), { h: 1.12, res: 1100 }); fan.position.set(1.0, STAGE_Y, 0.3); fan.rotation.y = -0.15;

// ================================================================ B. MET GALA, NEW YORK (blue carpet, white flowers, steps, flashes)
const MG = V(300, 0, 0);
const carpetTex = (() => { const c = cv(1024, 1024), g = c.getContext('2d'); g.fillStyle = '#1f3f8c'; g.fillRect(0, 0, 1024, 1024); g.fillStyle = '#e9e2c8';
  for (let i = 0; i < 60; i++) { const x = hash(i) * 1024, y = hash(i * 7) * 1024, r = 8 + 10 * hash(i * 3); g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; })();
add(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.85 }), MG.x, 0, MG.z, scene, false).receiveShadow = true;
for (let s = 0; s < 9; s++) add(new THREE.BoxGeometry(12, 0.18, 0.5), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.85 }), MG.x, 0.09 + s * 0.18, MG.z - 3.2 - s * 0.5);
const NF = 2200, flowerM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 1), mat(0xfbf7ee, 0.8), NF); flowerM.frustumCulled = false; scene.add(flowerM);
const leafM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), mat(0x2f5a2a, 0.9), 1400); leafM.frustumCulled = false; scene.add(leafM);
{ const m = new THREE.Matrix4(); for (let i = 0; i < NF; i++) { const side = i % 2 ? 1 : -1, x = MG.x + side * (1.25 + 4.5 * hash(i)), y = 0.1 + 1.5 * hash(i * 2.3), z = MG.z - 2.6 + 2.0 * hash(i * 5.1); m.makeTranslation(x, y, z); flowerM.setMatrixAt(i, m); }
  for (let i = 0; i < 1400; i++) { const side = i % 2 ? 1 : -1, x = MG.x + side * (1.25 + 4.5 * hash(i + 99)), y = 0.05 + 1.45 * hash(i * 2.7), z = MG.z - 2.6 + 2.0 * hash(i * 4.3); m.makeTranslation(x, y, z); leafM.setMatrixAt(i, m); } }
const facadeTex = (() => { const c = cv(1024, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#2a3a6a'); gr.addColorStop(1, '#6a7ab0'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = 'rgba(240,236,220,0.85)'; for (let i = 0; i < 8; i++) g.fillRect(70 + i * 125, 120, 34, 392); g.fillRect(40, 90, 944, 30); g.beginPath(); g.moveTo(40, 90); g.lineTo(512, 20); g.lineTo(984, 90); g.fill();
  g.fillStyle = 'rgba(255,240,200,0.9)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(hash(i) * 1024, 20 + hash(i * 3) * 80, 2 + 2 * hash(i * 5), 0, 7); g.fill(); } return tex(c); })();
add(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: facadeTex, color: HDR(0.55, 0.55, 0.6) }), MG.x, 5.2, MG.z - 9, scene, false);
const photogs = [], flashSpr = [];
for (let i = 0; i < 10; i++) { const side = i % 2 ? 1 : -1, p = group(MG.x + side * (2.6 + 0.9 * (i >> 1) * 0.5), 1.25, MG.z + 1.2 + 0.7 * (i >> 1));
  add(new THREE.CapsuleGeometry(0.22, 0.7, 2, 8), mat(0x0c0c10, 0.9), 0, 0.55, 0, p); add(new THREE.SphereGeometry(0.15, 10, 8), mat(0x0c0c10, 0.9), 0, 1.15, 0, p); add(new THREE.BoxGeometry(0.22, 0.14, 0.14), mat(0x111111, 0.4, 0.4), -side * 0.18, 1.12, 0.05, p);
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: HDR(9, 9, 10), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); f.position.set(-side * 0.3, 1.14, 0.05); f.scale.setScalar(0.0001); p.add(f); flashSpr.push({ f, i }); photogs.push(p); }
const mgKey = new THREE.SpotLight(0xfff6ea, 0, 25, 0.4, 0.6, 1.2); mgKey.position.set(MG.x + 2.5, 7, MG.z + 6); mgKey.target.position.set(MG.x, 1.6, MG.z); mgKey.castShadow = true; mgKey.shadow.mapSize.set(2048, 2048); scene.add(mgKey, mgKey.target);
const mgFill = new THREE.PointLight(0x9ab4ff, 0, 20, 1.4); mgFill.position.set(MG.x - 3, 3, MG.z + 4); scene.add(mgFill);
const flashL = new THREE.PointLight(0xffffff, 0, 12, 1.5); flashL.position.set(MG.x, 2, MG.z + 3); scene.add(flashL);
const dilMet = await cutout(diljit({}), { h: 1.95, backSvg: diljit({ view: 'back' }) }); dilMet.position.set(MG.x, 0, MG.z);
// glowing Punjab-map overlay on the back + Gurmukhi letters that lift off the cape
const mapGlow = (() => { const c = cv(512, 512), g = c.getContext('2d'); g.translate(256, 256); g.scale(1.15, 1.15); g.translate(-355, -750);
  g.strokeStyle = '#ffd27a'; g.lineWidth = 14; g.shadowColor = '#ffb030'; g.shadowBlur = 30; g.beginPath(); g.moveTo(250, 670); g.quadraticCurveTo(300, 630, 380, 650); g.quadraticCurveTo(430, 700, 470, 750);
  g.quadraticCurveTo(440, 830, 470, 910); g.quadraticCurveTo(420, 1010, 360, 1050); g.quadraticCurveTo(300, 990, 250, 1010); g.quadraticCurveTo(220, 930, 240, 850); g.quadraticCurveTo(200, 770, 250, 670); g.stroke();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: HDR(2.2, 1.6, 0.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(m); return m; })();
const GL = 'ੳਅੲਸਹਕਖਗਘਙਚਛਜਝਞਟਠਡਢਣਤਥਦਧਨਪਫਬਭਮਯਰਲਵੜ';
const letters = [...GL].map((ch, i) => { const c = cv(128, 128), g = c.getContext('2d'); g.font = '800 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#ffb030'; g.shadowBlur = 16; g.fillStyle = '#ffe3a0'; g.fillText(ch, 64, 70);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: HDR(2, 1.5, 0.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.visible = false; scene.add(m); return m; });

// ================================================================ C. PATIALA PALACE, 1911
const PP = V(600, 0, 0);
add(new THREE.PlaneGeometry(26, 26).rotateX(-Math.PI / 2), mat(0x5a3a22, 0.4), PP.x, 0, PP.z, scene, false).receiveShadow = true;
add(new THREE.PlaneGeometry(2.6, 16).rotateX(-Math.PI / 2), mat(0x8a1a1a, 0.8), PP.x, 0.005, PP.z + 2, scene, false).receiveShadow = true;
const archTex = (() => { const c = cv(1024, 512), g = c.getContext('2d'); g.fillStyle = '#e2c99a'; g.fillRect(0, 0, 1024, 512); g.fillStyle = '#6a3a1e';
  for (const x of [128, 384, 640, 896]) { g.beginPath(); g.moveTo(x - 90, 512); g.lineTo(x - 90, 220); g.quadraticCurveTo(x - 90, 90, x, 50); g.quadraticCurveTo(x + 90, 90, x + 90, 220); g.lineTo(x + 90, 512); g.fill(); }
  g.strokeStyle = '#b8862e'; g.lineWidth = 10; g.strokeRect(10, 10, 1004, 492); return tex(c); })();
add(new THREE.PlaneGeometry(16, 8), new THREE.MeshStandardMaterial({ map: archTex, roughness: 0.8 }), PP.x, 4, PP.z - 4.5);
for (const x of [-4, -2, 2, 4]) { add(new THREE.CylinderGeometry(0.28, 0.32, 6, 24), mat(0xe8d4b0, 0.5), PP.x + x, 3, PP.z - 2.6); add(new THREE.TorusGeometry(0.3, 0.04, 8, 30), mat(0xc8962e, 0.35, 0.8), PP.x + x, 5.4, PP.z - 2.6).rotation.x = Math.PI / 2; }
add(new THREE.BoxGeometry(3, 0.35, 2), mat(0xc8962e, 0.35, 0.7), PP.x, 0.175, PP.z - 1.6);
const chand = []; for (const [x, z] of [[-2.5, 0], [2.5, 0], [0, -1.2]]) { const c = group(PP.x + x, 5.2, PP.z + z);
  for (let k = 0; k < 18; k++) { const a = k / 18 * TAU, r = 0.5 + 0.25 * (k % 2); add(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: HDR(6, 4.5, 2.4) }), Math.cos(a) * r, -0.2 * (k % 3), Math.sin(a) * r, c, false); }
  rod(V(c.position.x, 5.2, c.position.z), V(c.position.x, 7, c.position.z), 0.02, mat(0xc8962e, 0.4, 0.8));
  const L = new THREE.PointLight(0xffc880, 0, 9, 1.5); L.position.copy(c.position).add(V(0, -0.3, 0)); scene.add(L); chand.push(L); }
const ppKey = new THREE.SpotLight(0xffe0b0, 0, 22, 0.45, 0.6, 1.2); ppKey.position.set(PP.x + 2, 7, PP.z + 6); ppKey.target.position.set(PP.x, 1.6, PP.z - 1.5); ppKey.castShadow = true; ppKey.shadow.mapSize.set(2048, 2048); scene.add(ppKey, ppKey.target);
const mah = await cutout(maharaja(), { h: 2.05 }); mah.position.set(PP.x + 0.55, 0.35, PP.z - 1.5);
const dilPP = await cutout(diljit({}), { h: 1.95 }); dilPP.position.set(PP.x - 0.85, 0.35, PP.z - 1.5);

// ================================================================ D. MUSEUM GALLERY (three figures, the necklace)
const GA = V(900, 0, 0);
add(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x08080c, roughness: 0.15, metalness: 0.4, envMap: ENV, envMapIntensity: 0.15 }), GA.x, 0, GA.z, scene, false).receiveShadow = true;
add(new THREE.PlaneGeometry(30, 10), mat(0x14101c, 0.9), GA.x, 5, GA.z - 4);
const PED = [-1.12, 0, 1.12].map((x) => V(GA.x + x, 0.9, GA.z + (x === 0 ? 0.2 : -0.2)));
for (const p of PED) { add(new THREE.BoxGeometry(1.0, 0.9, 0.8), mat(0x1c1a22, 0.6), p.x, 0.45, p.z); add(new THREE.BoxGeometry(1.05, 0.04, 0.85), mat(0xc8962e, 0.35, 0.8), p.x, 0.9, p.z); }
const gSpots = PED.map((p, i) => { const L = new THREE.SpotLight(0xfff0d8, 0, 14, 0.3, 0.45, 1.2); L.position.set(p.x, 7.5, p.z + 2.5); L.target.position.set(p.x, 2, p.z); L.castShadow = i === 1; scene.add(L, L.target); return L; });
const gMah = await cutout(maharaja(), { h: 1.75 }); gMah.position.copy(PED[0]);
const gDil = await cutout(diljit({}), { h: 1.75 }); gDil.position.copy(PED[1]);
const gFan = await cutout(diljit({}), { h: 1.2, res: 1100 }); gFan.position.copy(PED[2]);
const HAAR = gDil.userData.at(350, 690).add(gDil.position);    // Diljit's necklace on the gallery cut-out
const NK = necklace3D(THREE, { envMap: ENV, scale: 2.4 }); scene.add(NK.group); NK.group.position.set(GA.x, 1.6, GA.z + 1.4); NK.group.visible = false;
const caseG = add(new THREE.BoxGeometry(1.4, 1.5, 0.6), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transmission: 0, transparent: true, opacity: 0.12, envMap: ENV, envMapIntensity: 0.6 }), GA.x, 1.45, GA.z + 1.4, scene, false);
const nkLight = new THREE.SpotLight(0xffffff, 0, 8, 0.3, 0.5, 1.2); nkLight.position.set(GA.x + 0.4, 4, GA.z + 3); nkLight.target.position.set(GA.x, 1.3, GA.z + 1.3); scene.add(nkLight, nkLight.target);
const sparkle = pts(160, HDR(3, 3, 3.4), 0.025);

// ---------------------------------------------------------------- real photos (fact beats; skipped when the file is missing)
const CARDS = {};
for (const [k, src, w] of [['front', 'img/metgala_front.jpg', 1.15], ['back', 'img/metgala_back.jpg', 1.25], ['emb', 'img/embroidery.jpg', 1.3], ['mah', 'img/maharaja_necklace.jpg', 1.1], ['ahm', 'img/ahmedabad.jpg', 1.3]]) {
  if (await img(src)) { CARDS[k] = await photoCard(src, { w }); CARDS[k].visible = false; } }

// ---------------------------------------------------------------- camera
const NIGHT = { sky: false, sun: 0, ambI: 0.12, amb: '#3a2a5a', fog: 0.012, fogCol: '#08040c', exposure: 1.0, dof: 0.8 };
const NY = { sky: false, sun: 0, ambI: 0.7, amb: '#a8b4d8', fog: 0.012, fogCol: '#1a2238', exposure: 1.0, dof: 0.7 };
const PAL = { sky: false, sun: 0, ambI: 0.35, amb: '#c89a6a', fog: 0.02, fogCol: '#2a1a10', exposure: 1.0, dof: 0.7 };
const GAL = { sky: false, sun: 0, ambI: 0.05, amb: '#3a3048', fog: 0.0, exposure: 1.0, dof: 0.6 };
const D = dilStage.position, M = dilMet.position;
const KEYS = [
  [0, 0, at(D, 0.4, 1.7, 2.6), at(D, 0.1, 1.55, 0), 34, NIGHT], [0.1, 1.95, at(D, 0.2, 1.75, 2.2), at(D, 0.1, 1.6, 0), 32, NIGHT],
  [2.0, 2.6, at(D, 0.9, 1.4, 4.8), at(D, 0.8, 1.2, 0), 36, NIGHT], [2.7, 7.9, at(D, 1.8, 2.6, 9.5), at(D, 0.6, 1.4, 0), 40, NIGHT],
  [8.0, 9.3, at(fan.position, 0.25, 0.75, 1.3), at(fan.position, 0, 0.6, 0), 32, NIGHT],
  [9.4, 9.4, at(M, 0.3, 1.2, 6.5), at(M, 0, 1.2, 0), 36, NY], [9.5, 13.4, at(M, 0.1, 1.4, 4.3), at(M, 0, 1.25, 0), 36, NY],
  [13.5, 15.6, at(M, 0.2, 1.95, 1.7), at(M, 0, 1.85, 0), 32, NY], [15.7, 17.9, at(M, 0.1, 1.45, 2.6), at(M, 0, 1.3, 0), 34, NY],
  [18.0, 22.9, at(M, -0.4, 1.4, 3.4), at(M, 0, 1.15, 0), 36, NY],
  [23.0, 26.3, at(M, 0.3, 1.7, 2.6), at(M, 0, 1.9, 0), 38, NY],
  [26.4, 26.4, at(M, 0.8, 1.1, 5.5), at(M, 0, 1.3, 0), 36, NY], [26.5, 28.6, at(M, 0.3, 1.2, 4.2), at(M, 0, 1.3, 0), 36, NY],
  [28.7, 28.7, at(PP, 2.5, 1.6, 6.5), at(PP, 0, 1.4, -1.5), 38, PAL], [28.8, 31.3, at(PP, 0.2, 1.4, 3.6), at(PP, -0.15, 1.35, -1.5), 36, PAL],
  [31.4, 31.4, at(GA, 0, 2.0, 9.5), at(GA, 0, 1.75, 0), 40, GAL], [31.5, 37.9, at(GA, 0, 1.9, 8.6), at(GA, 0, 1.75, 0), 40, GAL],
  [38.0, 42.2, at(GA, 0, 1.9, 5.0), at(GA, 0, 1.75, 0), 38, GAL],
  [42.3, 43.5, HAAR.clone().add(V(0, 0.05, 0.9)), HAAR, 30, GAL],
  [43.6, 43.6, at(GA, 0.35, 1.75, 3.6), at(GA, 0, 1.6, 1.4), 34, GAL], [43.7, 46.8, at(GA, 0.15, 1.65, 2.7), at(GA, 0, 1.55, 1.4), 32, GAL],
];
const F = film({ total, keys: KEYS, exposure: 1.0, hits: [[2.08, 0.012], [9.4, 0.01], [18.96, 0.01], [28.7, 0.01], [42.32, 0.012], [43.66, 0.01]],
  titles: [[-1, 1.95, 'दूसरा दिलजीत?', 120, '#ffd24a', 300], [21.6, 22.9, 'पूरा पंजाब!', 120, '#ffd24a', 300], [24.84, 26.3, 'गुरमुखी', 110, '#ffd24a', 300],
    [29.2, 31.3, 'महाराजा भूपिंदर सिंह', 88, '#ffd24a', 300, 'पटियाला • 1911'], [42.32, 43.5, 'दिलजीत का हार', 110, '#ffd24a', 300],
    [43.66, 999, 'असली पटियाला हार?', 100, '#ffd24a', 300, 'भाग 2 में…']],
  pills: [[3.3, 9.3, 'अहमदाबाद • 21 नवंबर', 1300, '#f3e3c0'], [9.4, 13.4, 'न्यूयॉर्क • मेट गाला 2025', 1300, '#f3e3c0'], [26.4, 28.6, 'डिज़ाइनर: प्रबल गुरंग', 1300, '#f3e3c0']],
  overlay: (g, t, { txt, pill, proj }) => {
    const lab = (s, a, b, card, px, py, dx, dy) => { if (t < a || t > b) return; const p = card.localToWorld(card.userData.at(px, py)), [x, y] = proj(p), k = seg(t, a, a + 0.3), o = 1 - seg(t, b - 0.2, b);
      g.save(); g.globalAlpha = o; g.strokeStyle = '#ffd24a'; g.fillStyle = '#ffd24a'; g.lineWidth = 4; g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 8; g.beginPath(); g.arc(x, y, 9 * k, 0, 7); g.fill();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx * k, y + dy * k); g.stroke(); g.restore(); pill(s, x + dx, y + dy, '#ffd24a', o * seg(t, a + 0.15, a + 0.4), 44); };
    lab('कलगी वाली पगड़ी', 14.96, 17.9, dilMet, 362, -30 + 110, 230, -60); lab('शेरवानी', 16.36, 17.9, dilMet, 300, 900 + 110, -240, 120); lab('हार', 17.62, 17.95, dilMet, 350, 560 + 110, 240, 40);
    if (t > 31.4 && t < 38) [['पटियाला • 1911', 32.12, -1], ['न्यूयॉर्क • 2025', 34.18, 0], ['अहमदाबाद • 2026', 36.42, 1]].forEach(([s, a, i]) => pill(s, 540 + i * 320, 1240, '#f3e3c0', seg(t, a, a + 0.3) * (1 - seg(t, 37.7, 38)), 34));
  } });
const { on, onCam } = F;

// ---------------------------------------------------------------- animation
const LOC = (t) => t < 9.4 ? 'st' : t < 28.7 ? 'mg' : t < 31.4 ? 'pp' : 'ga';
on((t) => {
  const loc = LOC(t);
  // lights per location (keeps the render fast)
  stadiumKey.visible = fanSpot.visible = stageWash.visible = loc === 'st'; mgKey.visible = mgFill.visible = flashL.visible = loc === 'mg';
  ppKey.visible = loc === 'pp'; chand.forEach((L) => (L.visible = loc === 'pp')); gSpots.forEach((L) => (L.visible = loc === 'ga')); nkLight.visible = loc === 'ga';
  stadiumKey.intensity = 9; stageWash.intensity = 6 + 3 * Math.sin(t * 2.3); fanSpot.intensity = 26 * smooth(seg(t, 2.08, 2.25));
  mgKey.intensity = 9; mgFill.intensity = 12; ppKey.intensity = 7; chand.forEach((L, i) => (L.intensity = 2.5 + 0.2 * Math.sin(t * 9 + i)));
  // stadium: LED pulse, beams sweep, fireworks, phone lights
  led.material.color.setScalar(1.1 + 0.25 * Math.sin(t * 3));
  beams.forEach((b, i) => { b.visible = loc === 'st'; b.rotation.set(0.35 * Math.sin(t * 0.9 + i), 0, 0.5 * Math.sin(t * 0.7 + i * 1.7)); });
  crowd.visible = loc === 'st';
  for (let i = 0; i < phones.n; i++) { const on2 = loc === 'st'; const x = (hash(i * 3.1) - 0.5) * 46, z = 4 + 40 * hash(i * 1.3) ** 0.8;
    phones.pos[i * 3] = on2 ? x + 0.1 * Math.sin(t * 2 + i) : 0; phones.pos[i * 3 + 1] = on2 ? 1.75 + 0.012 * z + 0.15 * Math.sin(t * 3 + i * 0.7) : -999; phones.pos[i * 3 + 2] = z; }
  phones.geo.attributes.position.needsUpdate = true;
  for (let i = 0; i < fw.n; i++) { const b = i % 9, t0 = (b * 1.05) % 9, k = ((t - t0) % 2.4 + 2.4) % 2.4 / 2.4, c = V((hash(b) - 0.5) * 22, 12 + 5 * hash(b * 3), -6 - 10 * hash(b * 7));
    const a = hash(i) * TAU, e = Math.acos(2 * hash(i * 1.7) - 1), r = 3.5 * easeOut(k); const on2 = loc === 'st' && k < 0.95;
    fw.pos[i * 3] = c.x + r * Math.sin(e) * Math.cos(a); fw.pos[i * 3 + 1] = on2 ? c.y + r * Math.cos(e) - 2.5 * k * k : -999; fw.pos[i * 3 + 2] = c.z + r * Math.sin(e) * Math.sin(a); }
  fw.geo.attributes.position.needsUpdate = true;
  dilStage.visible = fan.visible = loc === 'st'; dilStage.position.y = STAGE_Y + 0.02 * Math.abs(Math.sin(t * 4)); fan.position.y = STAGE_Y + 0.015 * Math.abs(Math.sin(t * 4 + 1));
  // Met Gala: flashes, the turn, the glowing map, the Gurmukhi letters
  flowerM.visible = leafM.visible = loc === 'mg'; photogs.forEach((p) => (p.visible = loc === 'mg'));
  let fl = 0; flashSpr.forEach(({ f, i }) => { const ph = (t * (0.9 + 0.3 * hash(i)) + hash(i * 3)) % 1, k = ph < 0.06 ? 1 - ph / 0.06 : 0; f.scale.setScalar(Math.max(0.0001, 0.7 * k)); fl = Math.max(fl, k); });
  flashL.intensity = 10 * fl * (loc === 'mg' ? 1 : 0);
  dilMet.visible = loc === 'mg'; const turn = easeInOut(seg(t, 18.96, 19.75)); dilMet.rotation.y = Math.PI * turn - 0.05 * (1 - turn);
  const mp = dilMet.userData.at(355, 750); mapGlow.visible = loc === 'mg' && t > 19.5; mapGlow.position.set(M.x + mp.x, mp.y, M.z + 0.05); mapGlow.rotation.y = 0; mapGlow.scale.setScalar(1.04 / 0.62 * 445 / 700);
  mapGlow.material.opacity = smooth(seg(t, 21.4, 21.9)) * (1 - seg(t, 25.8, 26.3)) * (0.8 + 0.2 * Math.sin(t * 6));
  letters.forEach((m, i) => { const a0 = 23.1 + i * 0.045, k = seg(t, a0, a0 + 2.4); m.visible = loc === 'mg' && t > a0 && t < 26.4;
    const ang = i * 0.55 + k * 3, r = 0.2 + 0.7 * k, y = 1.0 + 0.4 * hash(i) + 1.5 * k; m.position.set(M.x + Math.cos(ang) * r, y, M.z - 0.1 + Math.sin(ang) * r); m.lookAt(M.x, y, M.z + 5); });
  // palace
  mah.visible = dilPP.visible = loc === 'pp'; mah.scale.setScalar(Math.max(0.001, backOut(seg(t, 29.2, 29.6)))); dilPP.rotation.y = 0.12; mah.rotation.y = -0.12;
  // gallery: figures appear on their beats, side lights dim, the necklace rises
  const show = (c, a, s = 1) => { c.visible = loc === 'ga' && t >= a; c.scale.setScalar(Math.max(0.001, backOut(seg(t, a, a + 0.4)) * s)); };
  show(gMah, 32.12); show(gDil, 34.18); show(gFan, 36.42);
  const dim = smooth(seg(t, 38.6, 41.2));
  gSpots[0].intensity = 18 * smooth(seg(t, 32.0, 32.3)) * (1 - 0.92 * dim); gSpots[1].intensity = 18 * smooth(seg(t, 34.0, 34.3)); gSpots[2].intensity = 18 * smooth(seg(t, 36.3, 36.6)) * (1 - 0.92 * dim);
  NK.group.visible = caseG.visible = loc === 'ga' && t >= 43.6; const r = easeOut(seg(t, 43.66, 44.6)); NK.group.position.y = 1.2 + 0.45 * r; NK.group.rotation.y = 0.4 * Math.sin(t * 0.8); NK.setSparkle(t);
  nkLight.intensity = 14 * r;
  for (let i = 0; i < sparkle.n; i++) { const on2 = loc === 'ga' && t > 43.7; const a = hash(i) * TAU, rr = 0.5 * hash(i * 3); sparkle.pos[i * 3] = GA.x + Math.cos(a) * rr; sparkle.pos[i * 3 + 1] = on2 ? 1.0 + ((hash(i * 7) + t * 0.15) % 1) * 1.3 : -999; sparkle.pos[i * 3 + 2] = GA.z + 1.3 + Math.sin(a) * rr * 0.4; }
  sparkle.geo.attributes.position.needsUpdate = true;
});
// real photos pinned in front of the lens at fact beats
const fwd = V(0, 0, 0);
const FRONT = [['ahm', 5.4, 7.9, -0.35, -0.25, 0.8, -0.04], ['front', 11.6, 13.4, 0.42, -0.35, 0.72, 0.05], ['back', 22.0, 23.0, 0.42, -0.4, 0.66, 0.05], ['emb', 24.9, 26.3, -0.4, -0.45, 0.62, -0.05], ['mah', 30.0, 31.3, 0.45, -0.4, 0.66, 0.05]];
onCam((t, cam) => { const shown = new Set();
  for (const [k, a, b, dx, dy, s, rz] of FRONT) { const c = CARDS[k]; if (!c || t < a || t > b) continue; shown.add(c);
    const kk = backOut(seg(t, a, a + 0.4), 1.8), out = smooth(seg(t, b - 0.3, b)); cam.getWorldDirection(fwd); const d = 2.2;
    c.position.copy(cam.position).addScaledVector(fwd, d); c.quaternion.copy(cam.quaternion); c.translateX(dx * d * 0.4); c.translateY(dy * d * 0.4 + (1 - kk) * -1.2 + out * -1.6); c.rotateZ(rz);
    c.scale.setScalar(Math.max(0.001, s * 0.72 * kk)); c.visible = true; }
  for (const c of Object.values(CARDS)) if (!shown.has(c)) c.visible = false; });
