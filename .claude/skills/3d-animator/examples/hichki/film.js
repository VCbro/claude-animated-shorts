// HICCUP (हिचकी) — vertical 1080x1920 cinematic short. Night desk, moonlight through blinds, warm lamp,
// a glass anatomy torso (lungs, diaphragm, windpipe, glottis lid), a glass of water that jumps on every hic.
// Pure function of t. Overlays (titles, labels, captions) are drawn on a 2D canvas and composited in the grade.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { W, H, clamp, lerp, seg, smooth, easeOut, easeInOut, backOut, spring, halton, hash } from './lib.js';

// ---------- fonts + timings ----------
for (const [fam, f] of [['BalooD', 'devanagari'], ['BalooL', 'latin']]) {
  const ff = new FontFace(fam, `url(node_modules/@fontsource/baloo-2/files/baloo-2-${f}-800-normal.woff2)`, { weight: '800' });
  await ff.load(); document.fonts.add(ff);
}
const FONT = (px) => `800 ${px}px BalooD, BalooL, sans-serif`;
const CAPS = await (await fetch('out/captions.json')).json();

export const total = 49.4;
const SHUTTER = 0.5 / 30;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- renderer ----------
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas: stage, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping; renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const RS = +(new URLSearchParams(location.search).get('rs') || 0.72), RW = Math.round(W * RS), RH = Math.round(H * RS);
const rt = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, samples: 4 });
const accum = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, depthBuffer: false });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020309);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.14;

const mat = (color, roughness = 0.7, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
function add(geo, material, x, y, z, parent = scene, shadow = true) { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; }
const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const glassMat = (color = 0xcfe2ff, opacity = 0.16) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.04, metalness: 0, transparent: true, opacity, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2.2, specularIntensity: 1 });

// room
add(new THREE.PlaneGeometry(8, 5), mat(0x47505e, 0.95), 0, 1.3, -0.9);                 // wall
add(boxG(2.8, 0.05, 1.3), mat(0x3a2416, 0.45), 0, -0.025, 0);                             // desk (y=0 top)
add(new THREE.PlaneGeometry(8, 6), mat(0x15110e, 0.9), 0, -0.75, 0).rotation.x = -Math.PI / 2;
// a few books + pen holder for scale and depth
add(boxG(0.22, 0.04, 0.16), mat(0x2b3f5c, 0.6), -0.6, 0.02, -0.45); add(boxG(0.2, 0.035, 0.15), mat(0x7a2b26, 0.6), -0.6, 0.0575, -0.45).rotation.y = 0.15;
add(boxG(0.21, 0.03, 0.15), mat(0xb59a63, 0.6), -0.6, 0.09, -0.45).rotation.y = -0.1;

// lamp (warm practical, left-back)
function rod(a, b, r, material, parent) { const d = b.clone().sub(a), m = add(new THREE.CylinderGeometry(r, r, d.length(), 12), material, 0, 0, 0, parent); m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m; }
const lampMat = mat(0x1d1d22, 0.35, 0.6), lamp = new THREE.Group(); lamp.position.set(-0.42, 0, -0.42); scene.add(lamp);
const ELBOW = V(-0.05, 0.36, 0.0), HEADP = V(0.17, 0.52, 0.12);
add(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 32), lampMat, 0, 0.01, 0, lamp);
rod(V(0, 0.02, 0), ELBOW, 0.008, lampMat, lamp); rod(ELBOW, HEADP, 0.008, lampMat, lamp);
const lhead = add(new THREE.ConeGeometry(0.065, 0.11, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x1d1d22, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide }), HEADP.x, HEADP.y, HEADP.z, lamp);
lhead.rotation.set(-0.5, 0, 0.75);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4.5, 2.6) })); bulb.position.set(0, -0.035, 0); lhead.add(bulb);

// blinds -> moon stripes on the wall
const MOON_POS = V(-3.0, 2.4, 1.6), MOON_AT = V(0.15, 0.5, -0.9);
const blinds = new THREE.Group(); blinds.position.copy(MOON_AT).lerp(MOON_POS, 0.5); blinds.lookAt(MOON_AT); scene.add(blinds);
for (let i = 0; i < 18; i++) { const s = new THREE.Mesh(boxG(2.6, 0.05, 0.01), mat(0xffffff)); s.position.y = (i - 8.5) * 0.1; s.castShadow = true; blinds.add(s); }

// ---------- the glass torso ----------
const torso = new THREE.Group(); torso.position.set(0, 0, -0.1); scene.add(torso);
add(new THREE.CylinderGeometry(0.13, 0.15, 0.03, 48), mat(0x161412, 0.3, 0.4), 0, 0.015, 0, torso);   // plinth
const PROF = [[0.0, 0.03], [0.105, 0.035], [0.11, 0.08], [0.118, 0.16], [0.13, 0.25], [0.142, 0.33], [0.15, 0.4], [0.148, 0.445], [0.12, 0.475], [0.07, 0.495], [0.042, 0.51], [0.04, 0.58], [0.0, 0.585]];
const shellG = new THREE.LatheGeometry(PROF.map(([r, y]) => new THREE.Vector2(r, y)), 64);
const shell = add(shellG, glassMat(0xbfd6ff, 0.08), 0, 0, 0, torso, false); shell.scale.set(1.3, 1, 0.68); shell.renderOrder = 5;
const rimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.6, 1.2), transparent: true, opacity: 0.07, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending });
const rim = new THREE.Mesh(shellG, rimMat); rim.scale.set(1.32, 1.005, 0.7); rim.renderOrder = 4; torso.add(rim);

const organ = (c, e, r = 0.45) => mat(c, r, 0, { emissive: new THREE.Color(e), emissiveIntensity: 0.6 });
const lungMat = organ(0xe07f86, 0x2a0608, 0.5);
const lungs = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.072, 0.335, 0); torso.add(g);
  const m = add(new THREE.SphereGeometry(1, 40, 28), lungMat, 0, 0, 0, g); m.scale.set(0.058, 0.098, 0.055); return g; });
const heart = add(new THREE.SphereGeometry(0.034, 32, 24), organ(0xa3202a, 0x300408, 0.35), 0.022, 0.29, 0.03, torso); heart.scale.set(1, 1.15, 0.9);
const tubeMat = organ(0xeedad2, 0x1a1210, 0.4);
add(new THREE.CylinderGeometry(0.012, 0.012, 0.17, 24), tubeMat, 0, 0.495, 0, torso);                       // windpipe 0.41..0.58
rod(V(0, 0.415, 0), V(-0.05, 0.37, 0), 0.009, tubeMat, torso); rod(V(0, 0.415, 0), V(0.05, 0.37, 0), 0.009, tubeMat, torso);
// glottis lid: hinged at the back wall of the windpipe, near the top
const lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.545, -0.012); torso.add(lidPivot);
const lidMat = organ(0xff9f5a, 0x5a2000, 0.35);
const lid = add(new THREE.CylinderGeometry(0.0135, 0.0135, 0.003, 32), lidMat, 0, 0, 0.012, lidPivot);   // closed = flat
// diaphragm dome
const diaG = new THREE.SphereGeometry(1, 64, 20, 0, Math.PI * 2, 0, Math.PI / 2);
const dia = add(diaG, mat(0xc8343a, 0.45, 0, { emissive: new THREE.Color(0x3a0606), side: THREE.DoubleSide }), 0, 0.215, 0, torso);
const DIA_S = V(0.165, 0.06, 0.088); dia.scale.copy(DIA_S);
add(new THREE.SphereGeometry(1, 32, 20), organ(0xd8a066, 0x24140a, 0.5), -0.045, 0.14, 0.005, torso).scale.set(0.068, 0.05, 0.05);   // stomach
const gutMat = organ(0xc98a74, 0x1a0c08, 0.55);
for (let i = 0; i < 5; i++) add(new THREE.TorusGeometry(0.03, 0.012, 12, 24), gutMat, -0.04 + (i % 3) * 0.04, 0.06 + Math.floor(i / 3) * 0.035, 0.0, torso).rotation.x = 1.3;

// air particles: mouth -> windpipe -> lungs
const AIR = 140, airPos = new Float32Array(AIR * 3), airGeo = new THREE.BufferGeometry();
airGeo.setAttribute('position', new THREE.BufferAttribute(airPos, 3));
const air = new THREE.Points(airGeo, new THREE.PointsMaterial({ color: new THREE.Color(0.6, 1.6, 3.2), size: 0.0055, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
torso.add(air); air.renderOrder = 6;

// ---------- the water glass (hook) ----------
const G = V(0.32, 0, 0.18);
const glass = new THREE.Group(); glass.position.copy(G); scene.add(glass);
const gl1 = add(new THREE.CylinderGeometry(0.036, 0.03, 0.125, 64, 1, true), glassMat(0xe0ecff, 0.14), 0, 0.0625, 0, glass, false); gl1.renderOrder = 5;
add(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 48), glassMat(0xe0ecff, 0.35), 0, 0.004, 0, glass, false).renderOrder = 5;
const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x5fa8e6, roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false, envMapIntensity: 1.5 });
const water = add(new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), waterMat, 0, 0, 0, glass, false); water.renderOrder = 4;
const surfG = new THREE.CircleGeometry(1, 96, 0, Math.PI * 2); // displaced per frame
const surfBase = surfG.attributes.position.array.slice();
const surface = add(surfG, new THREE.MeshPhysicalMaterial({ color: 0x8fc6ff, roughness: 0.02, transparent: true, opacity: 0.55, envMapIntensity: 3, side: THREE.DoubleSide, depthWrite: false }), 0, 0, 0, glass, false);
surface.rotation.x = -Math.PI / 2; surface.renderOrder = 6;
// hiccup times: the glass hops on each one (first and last make the loop seamless)
const HICS = [-0.1, 1.45, 3.0, 25.96, 47.74, 49.3];

// ---------- triggers (pop in during "causes") ----------
const plate = new THREE.Group(); plate.position.set(-0.37, 0, 0.16); scene.add(plate);
add(new THREE.CylinderGeometry(0.075, 0.06, 0.01, 48), mat(0xf2efe8, 0.25), 0, 0.005, 0, plate);
const bun = mat(0xc8843a, 0.6);
add(new THREE.CylinderGeometry(0.046, 0.046, 0.016, 40), bun, 0, 0.018, 0, plate);
add(new THREE.CylinderGeometry(0.049, 0.049, 0.016, 40), mat(0x4a2b1a, 0.7), 0, 0.034, 0, plate);
add(boxG(0.08, 0.004, 0.08), mat(0xf2b72f, 0.4), 0, 0.044, 0, plate).rotation.y = 0.4;
add(new THREE.TorusGeometry(0.045, 0.006, 8, 32), mat(0x5aa83a, 0.6), 0, 0.048, 0, plate).rotation.x = Math.PI / 2;
add(new THREE.SphereGeometry(0.048, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), bun, 0, 0.05, 0, plate).scale.y = 0.62;
const soda = new THREE.Group(); soda.position.set(-0.2, 0, 0.22); scene.add(soda);
add(new THREE.CylinderGeometry(0.032, 0.028, 0.115, 48, 1, true), glassMat(0xe0ecff, 0.16), 0, 0.0575, 0, soda, false).renderOrder = 5;
add(new THREE.CylinderGeometry(0.029, 0.026, 0.085, 40), new THREE.MeshPhysicalMaterial({ color: 0x5a2410, roughness: 0.1, transparent: true, opacity: 0.85, envMapIntensity: 1.5 }), 0, 0.045, 0, soda, false);
const BUB = 70, bubPos = new Float32Array(BUB * 3), bubGeo = new THREE.BufferGeometry(); bubGeo.setAttribute('position', new THREE.BufferAttribute(bubPos, 3));
soda.add(new THREE.Points(bubGeo, new THREE.PointsMaterial({ color: new THREE.Color(1.6, 1.3, 1.0), size: 0.0035, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));
const cup = new THREE.Group(); cup.position.set(-0.06, 0, 0.27); scene.add(cup);
add(new THREE.CylinderGeometry(0.03, 0.025, 0.06, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xd9452e, roughness: 0.35, side: THREE.DoubleSide }), 0, 0.03, 0, cup);
add(new THREE.CylinderGeometry(0.028, 0.028, 0.004, 32), mat(0x3a1c0c, 0.15), 0, 0.052, 0, cup);
add(new THREE.TorusGeometry(0.016, 0.004, 8, 20, Math.PI), mat(0xd9452e, 0.35), 0.031, 0.03, 0, cup).rotation.z = -Math.PI / 2;
const STEAM = 60, steamPos = new Float32Array(STEAM * 3), steamGeo = new THREE.BufferGeometry(); steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
cup.add(new THREE.Points(steamGeo, new THREE.PointsMaterial({ color: new THREE.Color(0.9, 0.9, 1.0), size: 0.009, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })));
const ice = new THREE.Group(); ice.position.set(-0.15, 0, 0.33); scene.add(ice);
const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xdff2ff, roughness: 0.15, transparent: true, opacity: 0.55, envMapIntensity: 3, emissive: new THREE.Color(0.05, 0.12, 0.2) });
[[0, 0.011, 0, 0.3], [0.024, 0.011, 0.008, -0.4], [0.01, 0.033, 0.004, 0.9]].forEach(([x, y, z, r]) => add(boxG(0.022, 0.022, 0.022), iceMat, x, y, z, ice).rotation.set(r, r * 1.7, r * 0.5));
const TRIG = [[plate, 27.9], [soda, 28.68], [cup, 30.62], [ice, 30.75]];

// ---------- desk calendar (record) ----------
const cal = new THREE.Group(); cal.position.set(0.62, 0, -0.22); cal.rotation.y = -0.35; scene.add(cal);
add(boxG(0.19, 0.025, 0.1), mat(0x22252b, 0.4, 0.3), 0, 0.0125, 0, cal);
const back = add(boxG(0.17, 0.2, 0.006), mat(0x22252b, 0.4, 0.3), 0, 0.12, -0.035, cal); back.rotation.x = -0.18;
function pageCanvas() { const c = Object.assign(document.createElement('canvas'), { width: 512, height: 600 }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return [c, t]; }
const [pc0, pt0] = pageCanvas(), [pc1, pt1] = pageCanvas();
function drawPage(c, tex, year) {
  const g = c.getContext('2d'); g.fillStyle = '#f3efe6'; g.fillRect(0, 0, 512, 600);
  g.fillStyle = '#c8282c'; g.fillRect(0, 0, 512, 150); g.fillStyle = '#fff'; g.font = FONT(64); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('हिचकी', 256, 80);
  g.fillStyle = '#16181d'; g.font = FONT(190); g.fillText(String(year), 256, 380);
  g.fillStyle = '#8a8579'; g.font = FONT(44); g.fillText('साल ' + (year - 1921), 256, 540);
  for (let i = 0; i < 6; i++) { g.fillStyle = '#555'; g.beginPath(); g.arc(70 + i * 75, 18, 9, 0, 7); g.fill(); }
  tex.needsUpdate = true;
}
const pageG = new THREE.PlaneGeometry(0.15, 0.176); pageG.translate(0, -0.088, 0);   // hinge on top edge
const pageUnder = new THREE.Group(); pageUnder.position.set(0, 0.212, -0.03); pageUnder.rotation.x = -0.18; cal.add(pageUnder);
const pu = add(pageG, new THREE.MeshStandardMaterial({ map: pt1, roughness: 0.8, emissive: 0xffffff, emissiveMap: pt1, emissiveIntensity: 0.06 }), 0, 0, 0.002, pageUnder, false);
const pageFlip = new THREE.Group(); pageFlip.position.set(0, 0.212, -0.03); cal.add(pageFlip);
add(pageG, new THREE.MeshStandardMaterial({ map: pt0, roughness: 0.8, emissive: 0xffffff, emissiveMap: pt0, emissiveIntensity: 0.06 }), 0, 0, 0.004, pageFlip, false);
add(pageG, new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9, side: THREE.BackSide }), 0, 0, 0.004, pageFlip, false);
let shownYears = [0, 0];
const yearAt = (t) => 1922 + 68 * Math.pow(smooth(seg(t, 40.95, 42.75)), 1.15);

// dust
const DUST = 220, dustPos = new Float32Array(DUST * 3), dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: new THREE.Color(0.9, 1.1, 1.6), size: 0.0026, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })));

// ---------- lights ----------
const moon = new THREE.DirectionalLight(0x9ab6ff, 3.2); moon.target.position.copy(MOON_AT); scene.add(moon, moon.target);
moon.castShadow = true; moon.shadow.mapSize.set(1536, 1536); Object.assign(moon.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 0.5, far: 9 }); moon.shadow.bias = -0.0004;
const sky = new THREE.DirectionalLight(0x6f86c8, 0.25); sky.target.position.set(0, 0.2, 0); scene.add(sky, sky.target);
const lampLight = new THREE.SpotLight(0xffb36b, 3.2, 3, 0.85, 0.65, 2); scene.add(lampLight, lampLight.target);
lampLight.castShadow = true; lampLight.shadow.mapSize.set(1024, 1024); lampLight.shadow.bias = -0.0005;
const inner = new THREE.PointLight(0xff8a70, 0.12, 0.5, 2); inner.position.set(0, 0.32, 0.06); torso.add(inner);   // a soft glow inside the chest
scene.add(new THREE.AmbientLight(0x30364a, 0.18));

// ---------- animation ----------
function hopAt(t) {   // vertical hop + ripple strength of the glass
  let y = 0, rip = 0, tilt = 0;
  for (const h of HICS) { const d = t - h; if (d >= 0 && d < 0.34) { const s = Math.sin(Math.PI * d / 0.34); y += s * 0.024; tilt += s * 0.06 * (hash(h) - 0.5) * 2; }
    if (d >= 0) rip = Math.max(rip, Math.exp(-d * 2.2) * smooth(clamp(d / 0.05))); }
  return { y, rip, tilt };
}
// diaphragm displacement (negative = pulled down)
function diaAt(t) {
  const breath = (t > 5 && t < 16.4) ? -0.011 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (t - 5) / 3.0)) : 0;
  const jerk = -0.036 * backOut(seg(t, 16.45, 16.6), 2.5) * (1 - smooth(seg(t, 23.6, 25.2)));
  const hic = -0.03 * Math.exp(-Math.pow(t - 25.9, 2) / 0.004) - 0.022 * (seg(t, 25.8, 25.88) - seg(t, 26.4, 27.0)) * (t < 27 ? 1 : 0);
  let hook = 0; for (const h of HICS) hook += -0.02 * Math.exp(-Math.pow(t - h - 0.03, 2) / 0.003);
  return breath + jerk + hic + (t < 5 || t > 44 ? hook : 0);
}
// lid: 0 open, 1 closed
const lidAt = (t) => clamp(backOut(seg(t, 22.5, 22.6), 2.2) * (1 - seg(t, 25.2, 25.45)) + backOut(seg(t, 25.9, 25.98), 2.2) * (1 - seg(t, 26.8, 27.2)), 0, 1.15);
const airAt = (t) => smooth(seg(t, 18.5, 18.8)) * (1 - smooth(seg(t, 22.4, 22.7))) + smooth(seg(t, 25.5, 25.6)) * (1 - smooth(seg(t, 25.95, 26.1)));

function pose(t) {
  const d = diaAt(t);
  dia.position.y = 0.215 + d; dia.scale.set(DIA_S.x, DIA_S.y * (1 + d * 9), DIA_S.z);
  const inflate = 1 - d * 5;
  for (const l of lungs) l.scale.set(inflate, 1 - d * 3, inflate);
  heart.scale.setScalar(1 + 0.04 * Math.pow(Math.max(0, Math.sin(t * 7.5)), 8));
  heart.scale.y *= 1.15;
  lidPivot.rotation.x = lerp(-1.45, 0, lidAt(t));        // open: lid folded up against the back wall
  // air: particles stream down; slow-motion between 18.7 and 20.2
  const a = airAt(t); air.material.opacity = a;
  for (let i = 0; i < AIR; i++) {
    const sp = t < 22 ? 0.55 : 2.2, u = ((hash(i) + (t - 18.5) * sp * (0.7 + 0.6 * hash(i + 7))) % 1 + 1) % 1;
    const r = 0.009 * Math.sqrt(hash(i + 3)), th = hash(i + 4) * 6.283 + t * 2;
    let x, y, z;
    if (u < 0.65) { const k = u / 0.65; y = 0.66 - k * 0.25; x = Math.cos(th) * r * (k < 0.25 ? 3 : 1); z = Math.sin(th) * r * (k < 0.25 ? 3 : 1); }
    else { const k = (u - 0.65) / 0.35, s = hash(i + 9) < 0.5 ? -1 : 1; x = s * (0.05 * k + 0.03 * k * hash(i + 11)); y = 0.41 - 0.06 * k - 0.04 * k * hash(i + 12); z = (hash(i + 13) - 0.5) * 0.04 * k; }
    if (lidAt(t) > 0.6 && y < 0.545 && t > 22.4) y = 0.56 + hash(i) * 0.08;   // after the slam nothing passes
    airPos[i * 3] = x; airPos[i * 3 + 1] = y; airPos[i * 3 + 2] = z;
  }
  airGeo.attributes.position.needsUpdate = true;
  // glass hop + water
  const { y, rip, tilt } = hopAt(t);
  glass.position.y = y; glass.rotation.z = tilt;
  const lvl = lerp(0.085, 0.052, smooth(seg(t, 35.6, 38.6))) * (t < 45 ? 1 : 0) + (t >= 45 ? 0.085 : 0);
  water.scale.set(lerp(0.0302, 0.0345, (lvl - 0.008) / 0.125) - 0.0012, lvl - 0.008, lerp(0.0302, 0.0345, (lvl - 0.008) / 0.125) - 0.0012); water.position.y = 0.008 + (lvl - 0.008) / 2;
  const rr = lerp(0.0302, 0.0345, lvl / 0.125) - 0.0012; surface.scale.set(rr, rr, rr); surface.position.y = lvl;
  const P = surfG.attributes.position.array, last = HICS.filter((h) => h <= t).pop() ?? -10, dt = t - last;
  const sip = smooth(seg(t, 35.6, 36.0)) * (1 - smooth(seg(t, 38.6, 39.0)));
  for (let i = 0; i < P.length; i += 3) {
    const px = surfBase[i], py = surfBase[i + 1], r = Math.hypot(px, py);
    P[i + 2] = (rip * 0.12 * Math.sin(r * 22 - dt * 30) * Math.exp(-r * 0.5) + sip * 0.03 * Math.sin(r * 14 - t * 6)) ;
  }
  surfG.attributes.position.needsUpdate = true;
  // triggers pop in
  for (const [g, at] of TRIG) { const k = seg(t, at - 0.05, at + 0.3); g.visible = k > 0; g.scale.setScalar(Math.max(0.001, backOut(k, 2.2))); }
  for (let i = 0; i < BUB; i++) { const u = (hash(i + 30) + t * (0.35 + 0.4 * hash(i + 31))) % 1; bubPos[i * 3] = (hash(i + 32) - 0.5) * 0.04; bubPos[i * 3 + 1] = 0.006 + u * 0.08; bubPos[i * 3 + 2] = (hash(i + 33) - 0.5) * 0.04; }
  bubGeo.attributes.position.needsUpdate = true;
  for (let i = 0; i < STEAM; i++) { const u = (hash(i + 50) + t * (0.12 + 0.1 * hash(i + 51))) % 1; steamPos[i * 3] = Math.sin(u * 9 + hash(i) * 6) * 0.012 * (1 + u * 2); steamPos[i * 3 + 1] = 0.055 + u * 0.16; steamPos[i * 3 + 2] = Math.cos(u * 7 + hash(i + 2) * 6) * 0.01 * (1 + u * 2); }
  steamGeo.attributes.position.needsUpdate = true;
  // calendar pages
  const yf = yearAt(t), y0 = Math.floor(yf + 1e-6), f = yf - y0;
  if (shownYears[0] !== y0) { drawPage(pc0, pt0, Math.min(1990, y0)); shownYears[0] = y0; }
  if (shownYears[1] !== y0 + 1) { drawPage(pc1, pt1, Math.min(1990, y0 + 1)); shownYears[1] = y0 + 1; }
  pageFlip.rotation.x = -0.18 + (y0 >= 1990 ? 0 : -f * 2.9);
  pageFlip.visible = y0 < 1990 || true;
  // dust
  for (let i = 0; i < DUST; i++) {
    const a2 = hash(i) * 6.28, s = 0.15 + 0.2 * hash(i + 99), dir = hash(i + 5) < 0.33 ? -1 : 1;
    dustPos[i * 3] = -0.8 + 1.7 * hash(i + 1) + 0.03 * Math.sin(t * s + a2);
    dustPos[i * 3 + 1] = 0.03 + 1.1 * hash(i + 2) + ((dir * t * 0.024 * (0.5 + hash(i + 3))) % 0.4);
    dustPos[i * 3 + 2] = -0.8 + 1.3 * hash(i + 4) + 0.03 * Math.cos(t * s * 0.8 + a2);
  }
  dustGeo.attributes.position.needsUpdate = true;
}

// ---------- camera: shot keys, eased glides between them ----------
const HOOK = [V(0.43, 0.135, 0.6), V(0.32, 0.075, 0.18)];
const KEYS = [
  [-1, 0, ...HOOK],
  [4.5, 6.9, V(0.24, 0.38, 1.34), V(0.05, 0.29, -0.08)],     // reveal: torso + glass
  [7.0, 12.5, V(0.07, 0.33, 0.8), V(0, 0.3, -0.1)],           // chest
  [14.2, 15.8, V(0.05, 0.26, 0.5), V(0, 0.235, -0.1)],        // diaphragm close
  [18.2, 20.6, V(0.035, 0.57, 0.36), V(0, 0.545, -0.1)],      // throat
  [24.0, 25.3, V(0.24, 0.34, 1.12), V(0.13, 0.24, -0.02)],    // hic wide
  [27.2, 28.4, V(-0.2, 0.3, 1.0), V(-0.2, 0.07, 0.2)],        // triggers
  [32.8, 34.3, V(0.41, 0.165, 0.6), V(0.32, 0.08, 0.18)],     // cure glass
  [38.6, 40.1, V(0.5, 0.22, 0.42), V(0.6, 0.12, -0.22)],      // calendar
  [44.9, 46.5, ...HOOK],                                      // home (loop)
];
const camera = new THREE.PerspectiveCamera(40, W / H, 0.01, 30);
const eye = V(0, 0, 0), look = V(0, 0, 0), right = V(0, 0, 0), up = V(0, 0, 0), tmpA = V(0, 0, 0), tmpB = V(0, 0, 0);
function camAt(t) {
  let i = 0; while (i + 1 < KEYS.length && t >= KEYS[i + 1][0]) i++;
  const [, , e1, l1] = KEYS[i]; const nx = KEYS[i + 1];
  eye.copy(e1); look.copy(l1);
  if (i > 0) { const [a, b, e0, l0] = KEYS[i]; const pv = KEYS[i - 1]; const k = easeInOut(seg(t, a, b)); eye.copy(pv[2]).lerp(e0, k); look.copy(pv[3]).lerp(l0, k); }
  // slow breathing drift during holds
  eye.x += 0.006 * Math.sin(t * 0.37); eye.y += 0.004 * Math.sin(t * 0.29 + 1);
  // jolts
  const j = spring(t, 16.5, 9, 7) * 0.006 + spring(t, 22.56, 10, 8) * 0.004 + spring(t, 25.96, 9, 6) * 0.01 + spring(t, 47.74, 9, 6) * 0.006 + spring(t, 1.45, 9, 8) * 0.003 + spring(t, 3.0, 9, 8) * 0.003;
  eye.y += j; look.y += j * 0.6;
  void nx;
}
function shoot(t, k, n) {
  camAt(t);
  camera.position.copy(eye); camera.up.set(0, 1, 0); camera.lookAt(look); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  if (n === 1) return;
  const F = eye.distanceTo(look), lens = 0.0065 * F;
  const a = Math.sqrt(halton(k + 1, 2)) * lens, b = halton(k + 1, 3) * Math.PI * 2, lx = Math.cos(b) * a, ly = Math.sin(b) * a;
  right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
  camera.position.addScaledVector(right, lx).addScaledVector(up, ly); camera.updateMatrixWorld();
  const e = camera.projectionMatrix.elements, jx = halton(k + 1, 5) - 0.5, jy = halton(k + 1, 7) - 0.5;
  e[8] += -e[0] * lx / F + 2 * jx / RW; e[9] += -e[5] * ly / F + 2 * jy / RH;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
function jitterLights(k, n) {
  const s = n > 1 ? 0.2 : 0;
  moon.position.set(MOON_POS.x + (halton(k + 1, 11) - 0.5) * s, MOON_POS.y + (halton(k + 1, 13) - 0.5) * s, MOON_POS.z + (halton(k + 1, 17) - 0.5) * s);
  const h1 = n > 1 ? halton(k + 1, 19) : 0.5, h2 = n > 1 ? halton(k + 1, 23) : 0.3, phi = h2 * Math.PI * 2, c = Math.sqrt(h1), r = Math.sqrt(1 - h1);
  sky.position.set(Math.cos(phi) * r * 4, c * 4 + 0.3, Math.sin(phi) * r * 4 + 1.0);
  bulb.getWorldPosition(lampLight.position); const j = n > 1 ? 0.025 : 0;
  lampLight.position.x += (halton(k + 1, 29) - 0.5) * j; lampLight.position.z += (halton(k + 1, 31) - 0.5) * j;
  lampLight.target.position.set(0.05, 0.25, -0.1);
}

// ---------- overlay: titles, labels, counter, captions ----------
const cap = Object.assign(document.createElement('canvas'), { width: W, height: H }), cg = cap.getContext('2d');
const capTex = new THREE.CanvasTexture(cap); capTex.colorSpace = THREE.SRGBColorSpace;
const TITLES = [
  [0, 4.75, '68 साल!', 230, '#ffd24a', 360, '1922  →  1990'],
  [4.86, 6.9, 'असली वजह अंदर है', 104, '#ffffff', 330],
  [6.98, 15.1, 'साँस का पंप', 120, '#8fdcff', 330],
  [15.22, 18.55, 'झटका!', 210, '#ff5a4a', 360],
  [18.66, 20.15, '35 मिलीसेकंड', 112, '#8fdcff', 330, 'हवा अंदर…'],
  [20.18, 24.35, 'ढक्कन बंद!', 150, '#ffd24a', 340],
  [27.62, 33.0, 'ट्रिगर', 150, '#ffb35a', 340],
  [33.14, 38.9, 'लय तोड़ो', 150, '#6dffb0', 340],
  [39.0, 44.9, 'वर्ल्ड रिकॉर्ड', 120, '#ffd24a', 330, 'चार्ल्स ऑसबर्न • USA'],
  [44.98, 99, '68 साल!', 230, '#ffd24a', 360, '1922  →  1990'],
];
const POPS = [[25.96, 27.3], [47.74, 49.2]];   // giant "हिक!"
const LABELS = [   // [from, to, text, anchor (world), dx, dy, color]
  [7.6, 15.0, 'फेफड़े', V(0.1, 0.37, -0.1), 170, -120, '#ffb3b8'],
  [10.4, 18.4, 'डायाफ्राम', V(0.18, 0.22, -0.1), 120, 150, '#ff7a6e'],
  [18.7, 20.6, 'हवा', V(0.0, 0.6, -0.1), -230, -30, '#8fdcff'],
  [20.7, 24.3, 'ढक्कन (ग्लॉटिस)', V(0.0, 0.548, -0.1), 60, -230, '#ffb35a'],
  [27.95, 33.0, 'जल्दबाज़ी', V(-0.37, 0.07, 0.16), -10, -260, '#ffd24a'],
  [28.75, 33.0, 'गैस', V(-0.2, 0.12, 0.22), 30, -330, '#ffd24a'],
  [30.7, 33.0, 'ठंडा + गरम', V(-0.09, 0.07, 0.29), 60, -170, '#ffd24a'],
  [35.6, 38.9, 'धीरे-धीरे घूँट', V(0.32, 0.12, 0.18), -60, -300, '#6dffb0'],
];
const proj = (v) => { tmpA.copy(v).project(camera); return [(tmpA.x * 0.5 + 0.5) * W, (-tmpA.y * 0.5 + 0.5) * H, tmpA.z]; };
function txt(s, x, y, px, color, alpha = 1, scale = 1, stroke = 10) {
  cg.save(); cg.globalAlpha = alpha; cg.translate(x, y); cg.scale(scale, scale); cg.font = FONT(px); cg.textAlign = 'center'; cg.textBaseline = 'middle';
  cg.lineJoin = 'round'; cg.lineWidth = stroke; cg.strokeStyle = 'rgba(0,0,0,0.85)'; cg.shadowColor = 'rgba(0,0,0,0.7)'; cg.shadowBlur = 24; cg.strokeText(s, 0, 0);
  cg.shadowBlur = 0; cg.fillStyle = color; cg.fillText(s, 0, 0); cg.restore();
}
const indian = (n) => { const s = String(Math.floor(n)); if (s.length <= 3) return s; const last = s.slice(-3); let rest = s.slice(0, -3); const parts = []; while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); } if (rest) parts.unshift(rest); return parts.join(',') + ',' + last; };
function drawOverlay(t) {
  cg.clearRect(0, 0, W, H);
  // red flash on the jerk
  const fl = Math.exp(-Math.pow(t - 16.52, 2) / 0.006) * 0.3 + Math.exp(-Math.pow(t - 25.98, 2) / 0.004) * 0.2;
  if (fl > 0.01) { const gr = cg.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75); gr.addColorStop(0, 'rgba(255,40,30,0)'); gr.addColorStop(1, `rgba(255,40,30,${fl})`); cg.fillStyle = gr; cg.fillRect(0, 0, W, H); }
  // titles
  for (const [a, b, s, px, col, y, sub] of TITLES) {
    if (t < a - 0.05 || t > b + 0.2) continue;
    const kin = a <= 0.01 ? 1 : seg(t, a - 0.05, a + 0.25), kout = 1 - seg(t, b, b + 0.2);
    const sc = (a <= 0.01 ? 1 : backOut(kin, 2.2)) * (1 + 0.025 * Math.sin(t * 6) * (px > 200 ? 1 : 0));
    txt(s, W / 2, y, px * 0.78, col, Math.min(1, kin * 3) * kout, sc, 12);
    if (sub) txt(sub, W / 2, y + px * 0.5 + 16, 50, '#ffffff', seg(t, a + 0.1, a + 0.4) * kout * (a <= 0.01 ? 0 : 1) + (a <= 0.01 ? kout : 0), 1, 8);
  }
  // giant HIC pops
  for (const [a, b] of POPS) if (t > a - 0.04 && t < b) {
    const k = seg(t, a - 0.04, a + 0.14), out = 1 - seg(t, b - 0.3, b);
    txt('हिक!', W / 2, 860, 240, '#ffffff', out, backOut(k, 3) * (1 + 0.06 * spring(t, a, 6, 5)), 18);
  }
  // labels with leader lines
  for (const [a, b, s, at, dx, dy, col] of LABELS) {
    if (t < a || t > b + 0.2) continue;
    const k = seg(t, a, a + 0.35), out = 1 - seg(t, b, b + 0.2), [x, y] = proj(at); cg.font = FONT(48); const hw = cg.measureText(s).width / 2 + 40; const lx = clamp(x + dx, hw, W - hw), ly = clamp(y + dy, 220, H - 520);
    cg.save(); cg.globalAlpha = out; cg.strokeStyle = col; cg.lineWidth = 4; cg.shadowColor = 'rgba(0,0,0,.8)'; cg.shadowBlur = 8;
    cg.beginPath(); cg.arc(x, y, 9 * easeOut(k), 0, 7); cg.fillStyle = col; cg.fill();
    cg.beginPath(); cg.moveTo(x, y); cg.lineTo(lerp(x, lx, easeOut(k)), lerp(y, ly, easeOut(k))); cg.stroke(); cg.restore();
    if (k > 0.5) {
      cg.save(); cg.font = FONT(48); const w = cg.measureText(s).width + 44; cg.restore();
      const kk = seg(t, a + 0.18, a + 0.45);
      cg.save(); cg.globalAlpha = out * kk; cg.fillStyle = 'rgba(8,10,16,0.78)'; cg.strokeStyle = col; cg.lineWidth = 3;
      cg.beginPath(); cg.roundRect(lx - w / 2, ly - 36, w, 72, 36); cg.fill(); cg.stroke(); cg.restore();
      txt(s, lx, ly + 3, 48, col, out * kk, 1, 0);
    }
  }
  // breath-hold ring (cure)
  if (t > 33.3 && t < 35.8) {
    const k = seg(t, 33.4, 35.4), o = seg(t, 33.3, 33.6) * (1 - seg(t, 35.5, 35.8)), cx = W / 2, cy = 640;
    cg.save(); cg.globalAlpha = o; cg.lineWidth = 16; cg.strokeStyle = 'rgba(255,255,255,0.18)'; cg.beginPath(); cg.arc(cx, cy, 120, 0, 7); cg.stroke();
    cg.strokeStyle = '#6dffb0'; cg.lineCap = 'round'; cg.beginPath(); cg.arc(cx, cy, 120, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); cg.stroke(); cg.restore();
    txt(String(Math.max(1, 10 - Math.floor(k * 10))), cx, cy + 6, 120, '#ffffff', o, 1, 8);
    txt('साँस रोको', cx, cy + 190, 64, '#6dffb0', o, 1, 8);
  }
  // record counter
  if (t > 42.6 && t < 45.1) {
    const k = smooth(seg(t, 42.7, 44.4)), o = seg(t, 42.6, 42.9) * (1 - seg(t, 44.85, 45.1));
    txt(indian(430000000 * k), W / 2, 560, 130, '#ffffff', o, 1, 12);
    txt('हिचकियाँ (अनुमान)', W / 2, 670, 60, '#ffd24a', o, 1, 8);
  }
  // word captions (lower third, above the Shorts UI)
  const c = CAPS.find((g) => t >= g.t0 && t < g.t1 + 0.12);
  if (c && !POPS.some(([a]) => t > a - 0.1 && t < a + 1.0)) {
    cg.font = FONT(56); const ws = c.words.map((w) => w.w.replace(/[।…,?!]/g, '')); const sp = cg.measureText(' ').width;
    const widths = ws.map((w) => cg.measureText(w).width), totalW = widths.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    let x = W / 2 - totalW / 2;
    ws.forEach((w, i) => { const on = t >= c.words[i].t - 0.03; const k = seg(t, c.words[i].t - 0.03, c.words[i].t + 0.1);
      const next = c.words[i + 1] ? c.words[i + 1].t : c.t1, active = on && t < next;
      txt(w, x + widths[i] / 2, 1450 + 8 * (1 - backOut(k)), 56, active ? '#ffd24a' : '#ffffff', on ? 1 : 0.0, 1, 10); x += widths[i] + sp; });
  }
  capTex.needsUpdate = true;
}

// ---------- post ----------
const vert = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const addPass = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: null }, w: { value: 1 } }, vertexShader: vert,
  fragmentShader: 'uniform sampler2D tex; uniform float w; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * w, 1.0); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation, depthTest: false, depthWrite: false, transparent: true }));
const bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), 0.22, 0.45, 1.1);
const grade = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { tex: { value: accum.texture }, cap: { value: capTex }, seed: { value: 0 }, exposure: { value: 1 } }, vertexShader: vert,
  fragmentShader: `uniform sampler2D tex, cap; uniform float seed, exposure; varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }
    vec3 aces(vec3 x) { return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    void main() {
      vec2 d = vUv - 0.5; float ca = dot(d, d) * 0.008;
      vec3 c = vec3(texture2D(tex, vUv + d * ca).r, texture2D(tex, vUv).g, texture2D(tex, vUv - d * ca).b) * exposure;
      c = aces(c);
      c *= mix(1.0, 0.55, smoothstep(0.35, 0.95, length(d * vec2(0.9, 1.0)) * 1.45));
      c = srgb(c);
      c += (h(vUv * 1000.0) - 0.5) * 0.03 * (1.0 - 0.55 * dot(c, vec3(0.33)));
      vec4 k = texture2D(cap, vUv); c = c * (1.0 - k.a) + k.rgb;
      gl_FragColor = vec4(c, 1.0); }`, depthTest: false, depthWrite: false }));

export function renderAt(t, n = 1) {
  pose(t); shoot(t, 0, 1); drawOverlay(t);
  renderer.setRenderTarget(accum); renderer.setClearColor(0x000000, 1); renderer.clear();
  for (let k = 0; k < n; k++) {
    const ts = n === 1 ? t : t + ((k + 0.5) / n - 0.5) * SHUTTER;
    pose(ts); shoot(ts, k, n); jitterLights(k, n);
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    addPass.material.uniforms.tex.value = rt.texture; addPass.material.uniforms.w.value = 1 / n;
    renderer.setRenderTarget(accum); renderer.autoClear = false; addPass.render(renderer); renderer.autoClear = true;
  }
  bloom.render(renderer, accum, accum, 0, false);
  grade.material.uniforms.seed.value = (t * 30) % 97;
  grade.material.uniforms.exposure.value = 0.82;
  renderer.setRenderTarget(null); grade.render(renderer);
}
window.renderAt = renderAt; window.total = total;
