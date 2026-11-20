// Car, engine bay and effects for "How a car starts".
// Units are metres. Engine local frame: crankshaft along +x, cylinders up +y.
import * as THREE from 'three';
import { materials } from './materials.js';
import { glowSprite, sparks } from './props.js';
import { rng, fabricTexture } from './textures.js';

export const GREEN = new THREE.Color(0x2bff7a);
const shadow = o => { o.traverse(c => { if (c.isMesh && !c.material.transparent) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const mesh = (geo, mat, p = [0, 0, 0], r = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); return m; };
const boxM = (w, h, d, mat, p, r) => mesh(new THREE.BoxGeometry(w, h, d), mat, p, r);
const cylX = (rad, len, mat, p, seg = 32) => mesh(new THREE.CylinderGeometry(rad, rad, len, seg), mat, p, [0, 0, Math.PI / 2]);

let K = null;
export function kit() {
  if (K) return K;
  const M = materials();
  K = {
    dark: new THREE.MeshPhysicalMaterial({ color: 0x2b2d31, metalness: 0.85, roughness: 0.38, clearcoat: 0.3 }),
    darker: new THREE.MeshStandardMaterial({ color: 0x161719, metalness: 0.6, roughness: 0.5 }),
    steel: M.steel, steelBright: M.steelBright,
    rubber: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.85 }),
    paint: new THREE.MeshPhysicalMaterial({ color: 0x27c862, metalness: 0.2, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0b1a14, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.75, clearcoat: 1 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xe6e8ec, metalness: 1, roughness: 0.12 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0xf1efe8, roughness: 0.25, clearcoat: 0.8 }),
    red: new THREE.MeshStandardMaterial({ color: 0xc8231e, roughness: 0.4 }),
    copper: new THREE.MeshPhysicalMaterial({ color: 0xc8703c, metalness: 1, roughness: 0.3 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.7, bumpMap: fabricTexture(5), bumpScale: 2.5 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xdfe8ef, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.2 }),
  };
  return K;
}

// glowing green "x-ray" material
export function greenGlass(op = 0.38, em = 0.5) {
  return new THREE.MeshPhysicalMaterial({ color: GREEN, emissive: GREEN, emissiveIntensity: em, transparent: true, opacity: op, roughness: 0.1, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
}
// a per-part material that can be blended toward glowing green: m.userData.hi(k)
export function hiMat(base) {
  const m = base.clone();
  const c0 = base.color.clone();
  m.emissive = GREEN.clone();
  m.userData.hi = k => { m.emissiveIntensity = 0.85 * k; m.color.copy(c0).lerp(GREEN, k * 0.7); };
  m.userData.hi(0);
  return m;
}

// ---------- gear ----------
export function gearGeo(R, teeth, depth, thick, hole = 0.2) {
  const s = new THREE.Shape();
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ph = i % 4;
    const r = ph === 1 || ph === 2 ? R : R - depth;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  if (hole > 0) { const h = new THREE.Path(); h.absarc(0, 0, R * hole, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.12, bevelSize: Math.min(depth * 0.2, 0.002), bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -thick / 2);
  return g;
}
// gear spinning about the x axis
function gearX(R, teeth, depth, thick, mat) {
  const m = new THREE.Mesh(gearGeo(R, teeth, depth, thick), mat);
  m.rotation.y = Math.PI / 2;
  const g = new THREE.Group(); g.add(m);
  return g;
}

function helix(r, h, turns, tube, mat) {
  const pts = [];
  for (let i = 0; i <= turns * 24; i++) { const a = i / 24 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, (i / (turns * 24)) * h, Math.sin(a) * r)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, tube, 6), mat);
}
const tube = (pts, r, mat, seg = 48) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, 12), mat);

// ---------- engine bay (inline four + flywheel + starter + battery) ----------
export const CYL_X = [-0.165, -0.055, 0.055, 0.165];
const CRANK_Y = 0.08, CR = 0.04, ROD = 0.15, CYL_R = 0.042, CYL_TOP = 0.38;
export const PHASE = [0, Math.PI, Math.PI, 0];
export const pistonY = th => CRANK_Y + CR * Math.cos(th) + Math.sqrt(ROD * ROD - (CR * Math.sin(th)) ** 2); // centre of piston
export const RING_R = 0.13, PIN_R = 0.022;
export const PINION = new THREE.Vector3(0.272, CRANK_Y - 0.064, -0.136);

export function engineBay() {
  const k = kit();
  const g = new THREE.Group();
  const P = {};

  // lower block, half see-through
  const blockMat = new THREE.MeshPhysicalMaterial({ color: 0x23262b, metalness: 0.8, roughness: 0.4, transparent: true, opacity: 0.55, depthWrite: false });
  const lower = boxM(0.5, 0.16, 0.16, blockMat, [0, 0.11, 0]); lower.renderOrder = 2; g.add(lower);
  for (const z of [-0.082, 0.082]) for (let i = 0; i < 6; i++) g.add(boxM(0.006, 0.15, 0.012, k.dark, [-0.22 + i * 0.088, 0.11, z]));
  // sump
  g.add(boxM(0.46, 0.05, 0.15, k.darker, [0, 0.015, 0]));

  // cylinders (green glass), pistons, rods
  P.cyl = []; P.pistons = []; P.rods = []; P.chamber = [];
  for (let i = 0; i < 4; i++) {
    const x = CYL_X[i];
    const glass = mesh(new THREE.CylinderGeometry(CYL_R + 0.004, CYL_R + 0.004, 0.2, 40, 1, true), greenGlass(0.32, 0.45), [x, 0.28, 0]);
    glass.renderOrder = 6; g.add(glass); P.cyl.push(glass);
    for (const yy of [0.185, 0.375]) g.add(mesh(new THREE.TorusGeometry(CYL_R + 0.006, 0.004, 8, 40), k.dark, [x, yy, 0], [Math.PI / 2, 0, 0]));
    const pm = hiMat(k.steelBright);
    const pis = new THREE.Group();
    pis.add(mesh(new THREE.CylinderGeometry(CYL_R, CYL_R, 0.055, 40), pm));
    for (const yy of [0.012, 0.02]) pis.add(mesh(new THREE.TorusGeometry(CYL_R, 0.0015, 6, 40), k.darker, [0, yy, 0], [Math.PI / 2, 0, 0]));
    pis.position.x = x; pis.userData.mat = pm; g.add(pis); P.pistons.push(pis);
    const rod = boxM(0.016, 1, 0.012, k.steel, [x, 0, 0]); g.add(rod); P.rods.push(rod);
    // combustion chamber volume (coloured by effects)
    const ch = mesh(new THREE.CylinderGeometry(CYL_R - 0.002, CYL_R - 0.002, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), [x, 0.34, 0]);
    ch.renderOrder = 5; g.add(ch); P.chamber.push(ch);
  }

  // head, valve springs, spark plugs, injectors
  g.add(boxM(0.5, 0.06, 0.17, k.dark, [0, 0.41, 0]));
  g.add(boxM(0.48, 0.03, 0.13, k.darker, [0, 0.455, 0]));
  P.plugs = []; P.injectors = [];
  for (let i = 0; i < 4; i++) {
    const x = CYL_X[i];
    for (const z of [-0.045, 0.045]) {
      const sp = helix(0.011, 0.05, 6, 0.0018, k.steelBright); sp.position.set(x + (z > 0 ? 0.022 : -0.022), 0.47, z * 0.6); g.add(sp);
      g.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16), k.steel, [x + (z > 0 ? 0.022 : -0.022), 0.523, z * 0.6]));
    }
    const pg = new THREE.Group(); pg.position.set(x, 0.47, 0);
    const pm = hiMat(k.ceramic);
    pg.add(mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.05, 16), pm, [0, 0.03, 0]));
    pg.add(mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.014, 6), k.chrome, [0, 0, 0]));
    pg.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 12), k.dark, [0, 0.065, 0]));
    pg.userData.mat = pm; g.add(pg); P.plugs.push(pg);
    // injector, angled into the chamber from the intake side (+z)
    const inj = new THREE.Group(); inj.position.set(x, 0.43, 0.075); inj.rotation.x = 0.75;
    const im = hiMat(k.dark);
    inj.add(mesh(new THREE.CylinderGeometry(0.008, 0.005, 0.06, 14), im, [0, 0.03, 0]));
    inj.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.02, 14), k.chrome, [0, 0.055, 0]));
    inj.userData.mat = im; g.add(inj); P.injectors.push(inj);
  }
  // fuel rail
  g.add(cylX(0.009, 0.46, k.chrome, [0, 0.48, 0.11]));
  // exhaust headers (-z, down)
  for (const x of CYL_X) g.add(tube([[x, 0.36, -0.085], [x, 0.33, -0.15], [x * 0.6, 0.22, -0.2], [0, 0.1, -0.22]], 0.014, k.steel, 24));

  // crankshaft
  const crank = new THREE.Group(); crank.position.y = CRANK_Y; g.add(crank); P.crank = crank;
  crank.add(cylX(0.014, 0.6, k.steelBright, [0, 0, 0]));
  for (let i = 0; i < 4; i++) {
    const a = PHASE[i];
    const pin = cylX(0.012, 0.03, k.steelBright, [CYL_X[i], CR * Math.cos(a), CR * Math.sin(a)]); crank.add(pin);
    for (const dx of [-0.022, 0.022]) {
      const web = boxM(0.012, 0.075, 0.04, k.steel, [CYL_X[i] + dx, 0, 0]);
      web.position.y = 0; web.rotation.x = -a; web.geometry.translate(0, 0.012, 0); crank.add(web);
    }
  }
  // timing gears and belt at the -x end
  P.camGears = [];
  const cg0 = gearX(0.028, 18, 0.005, 0.014, k.steel); cg0.position.set(-0.285, CRANK_Y, 0); g.add(cg0); P.crankGear = cg0;
  for (const z of [-0.035, 0.035]) { const cg = gearX(0.05, 30, 0.006, 0.014, k.steel); cg.position.set(-0.285, 0.5, z); g.add(cg); P.camGears.push(cg); }
  const belt = tube([[-0.285, 0.55, -0.06], [-0.285, 0.55, 0.06], [-0.285, 0.47, 0.09], [-0.285, CRANK_Y, 0.03], [-0.285, CRANK_Y - 0.03, 0], [-0.285, CRANK_Y, -0.03], [-0.285, 0.47, -0.09]].concat([[-0.285, 0.55, -0.06]]), 0.004, k.rubber, 64);
  g.add(belt);

  // flywheel with ring gear (+x end)
  const fly = new THREE.Group(); fly.position.set(0.272, CRANK_Y, 0); g.add(fly); P.fly = fly;
  const flyMat = hiMat(k.steel); P.flyMat = flyMat;
  const ring = new THREE.Mesh(gearGeo(RING_R, 72, 0.007, 0.02, 0.0), flyMat); ring.rotation.y = Math.PI / 2; fly.add(ring);
  for (let i = 0; i < 6; i++) { const h = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.024, 16), k.darker, [0, Math.cos(i * 1.047) * 0.07, Math.sin(i * 1.047) * 0.07], [0, 0, Math.PI / 2]); fly.add(h); }
  fly.add(cylX(0.03, 0.028, k.dark, [0, 0, 0]));

  // starter motor: pinion meshing the ring gear, body sticking out along +x
  const starter = new THREE.Group(); starter.position.copy(PINION); g.add(starter); P.starter = starter;
  const stMat = hiMat(k.dark); P.starterMat = stMat;
  const pin = gearX(PIN_R, 12, 0.006, 0.02, k.steelBright); starter.add(pin); P.pinion = pin;
  starter.add(cylX(0.006, 0.05, k.steel, [0.03, 0, 0]));
  starter.add(cylX(0.042, 0.13, stMat, [0.115, 0, 0], 40));
  starter.add(cylX(0.044, 0.012, k.steel, [0.06, 0, 0], 40));
  starter.add(cylX(0.022, 0.09, stMat, [0.11, 0.055, 0], 24)); // solenoid
  P.stTerm = new THREE.Vector3(0.16, 0.078, 0).add(PINION);

  // battery
  const bat = new THREE.Group(); bat.position.set(0.1, 0.34, -0.37); g.add(bat); P.battery = bat;
  const bm = hiMat(k.dark); P.batMat = bm;
  bat.add(boxM(0.24, 0.17, 0.15, bm, [0, 0, 0]));
  bat.add(boxM(0.245, 0.02, 0.155, k.darker, [0, 0.09, 0]));
  bat.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 16), k.red, [0.08, 0.11, 0]));
  bat.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 16), k.darker, [-0.08, 0.11, 0]));
  P.batPlus = new THREE.Vector3(0.18, 0.46, -0.37);
  // battery -> starter cable, with a travelling pulse
  const path = new THREE.CatmullRomCurve3([P.batPlus, new THREE.Vector3(0.24, 0.5, -0.3), new THREE.Vector3(0.36, 0.3, -0.2), new THREE.Vector3(0.38, 0.1, -0.15), P.stTerm.clone()]);
  const cableMat = hiMat(k.red); P.cableMat = cableMat;
  g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 64, 0.007, 10), cableMat));
  P.cablePath = path;
  // ignition wires to the plugs
  for (const x of CYL_X) g.add(tube([[x, 0.535, 0], [x, 0.58, -0.03], [x * 0.5 - 0.1, 0.62, -0.1], [-0.2, 0.6, -0.2]], 0.004, k.rubber, 24));

  shadow(g);

  // pose by crank angle
  P.setCrank = th => {
    crank.rotation.x = th;
    cg0.rotation.x = th; for (const c of P.camGears) c.rotation.x = th / 2;
    fly.rotation.x = th;
    P.pinion.rotation.x = -th * (RING_R / PIN_R);
    for (let i = 0; i < 4; i++) {
      const a = th + PHASE[i];
      const py = pistonY(a);
      P.pistons[i].position.y = py;
      const pinY = CRANK_Y + CR * Math.cos(a), pinZ = CR * Math.sin(a);
      const r = P.rods[i];
      r.position.set(CYL_X[i], (pinY + py) / 2, pinZ / 2);
      const L = Math.hypot(py - pinY, pinZ);
      r.scale.set(1, L, 1); r.rotation.x = Math.atan2(pinZ, py - pinY);
      const top = py + 0.0275;
      const ch = P.chamber[i]; ch.scale.y = Math.max(0.001, CYL_TOP - top); ch.position.y = (CYL_TOP + top) / 2;
    }
  };
  P.setCrank(0);
  P.chamberTop = i => new THREE.Vector3(CYL_X[i], CYL_TOP - 0.01, 0);
  g.userData.P = P;
  return g;
}

// ---------- the car (faces +x) ----------
export function car() {
  const k = kit();
  const g = new THREE.Group();
  const P = {};
  // side profile of the lower body (x along length, y up)
  const s = new THREE.Shape();
  s.moveTo(-2.2, 0.32);
  s.lineTo(-1.82, 0.32); s.absarc(-1.4, 0.36, 0.42, Math.PI, 0, true);
  s.lineTo(0.98, 0.32); s.absarc(1.4, 0.36, 0.42, Math.PI, 0, true);
  s.lineTo(2.18, 0.32);
  s.bezierCurveTo(2.3, 0.4, 2.3, 0.62, 2.18, 0.72);
  s.lineTo(0.9, 0.88); s.lineTo(-1.7, 0.92);
  s.bezierCurveTo(-2.1, 0.92, -2.25, 0.8, -2.22, 0.6);
  s.lineTo(-2.2, 0.32);
  const bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 1.62, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 4, curveSegments: 24 });
  bodyGeo.translate(0, 0, -0.81);
  const paint = k.paint.clone(); paint.transparent = true; P.paint = paint;
  const body = new THREE.Mesh(bodyGeo, paint); g.add(body); P.body = body; body.renderOrder = 8;
  // cabin (glass greenhouse)
  const c = new THREE.Shape();
  c.moveTo(0.85, 0.86); c.bezierCurveTo(0.4, 1.12, 0.1, 1.3, -0.25, 1.32);
  c.lineTo(-0.85, 1.3); c.bezierCurveTo(-1.25, 1.25, -1.55, 1.05, -1.75, 0.9); c.lineTo(0.85, 0.86);
  const cabGeo = new THREE.ExtrudeGeometry(c, { depth: 1.36, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4, curveSegments: 20 });
  cabGeo.translate(0, 0, -0.68);
  const glass = k.glass.clone(); P.glass = glass;
  const cab = new THREE.Mesh(cabGeo, glass); cab.renderOrder = 9; g.add(cab);
  // roof panel in paint
  const roof = boxM(0.85, 0.03, 1.3, paint, [-0.55, 1.37, 0]); roof.renderOrder = 8; g.add(roof);
  // wheels
  P.wheels = [];
  for (const x of [-1.4, 1.4]) for (const z of [-0.78, 0.78]) {
    const w = new THREE.Group(); w.position.set(x, 0.36, z);
    const tyre = mesh(new THREE.TorusGeometry(0.27, 0.085, 18, 48), k.rubber); w.add(tyre);
    const rim = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.16, 40), k.chrome, [0, 0, 0], [Math.PI / 2, 0, 0]); w.add(rim);
    for (let i = 0; i < 5; i++) { const sp = boxM(0.04, 0.2, 0.03, k.dark, [0, 0, z > 0 ? 0.085 : -0.085]); sp.rotation.z = i * 1.2566; sp.geometry.translate(0, 0.1, 0); w.add(sp); }
    w.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 20), k.dark, [0, 0, 0], [Math.PI / 2, 0, 0]));
    g.add(w); P.wheels.push(w);
  }
  // front: grille and lamps
  g.add(boxM(0.06, 0.16, 0.8, k.darker, [2.27, 0.5, 0]));
  P.lamps = [];
  for (const z of [-0.6, 0.6]) {
    const lm = k.lamp.clone();
    const l = boxM(0.08, 0.07, 0.34, lm, [2.22, 0.68, z], [0, 0, -0.3]); g.add(l); P.lamps.push(lm);
  }
  for (const z of [-0.6, 0.6]) g.add(boxM(0.06, 0.06, 0.3, new THREE.MeshStandardMaterial({ color: 0x8a0f12, emissive: 0x500000 }), [-2.29, 0.74, z]));
  // mirrors
  for (const z of [-0.92, 0.92]) g.add(boxM(0.14, 0.09, 0.12, paint, [0.65, 0.98, z]));
  // dark interior: seats and dash, visible in x-ray
  const seatM = k.leather;
  for (const z of [-0.38, 0.38]) { g.add(boxM(0.5, 0.12, 0.45, seatM, [-0.35, 0.55, z])); g.add(boxM(0.12, 0.55, 0.45, seatM, [-0.62, 0.85, z], [0, 0, 0.18])); }
  g.add(boxM(0.35, 0.25, 1.4, k.darker, [0.55, 0.78, 0]));
  const wheel = mesh(new THREE.TorusGeometry(0.17, 0.02, 10, 32), k.darker, [0.25, 0.92, -0.38], [0, Math.PI / 2, 0.5]); g.add(wheel);

  // engine bay
  const bay = engineBay(); bay.scale.setScalar(1.0); bay.rotation.y = Math.PI / 2; bay.position.set(1.45, 0.16, 0.05); g.add(bay);
  P.bay = bay; P.E = bay.userData.P;

  shadow(g);
  body.castShadow = true;
  // x-ray amount 0..1: paint turns to green glass
  P.xray = x => {
    paint.opacity = 1 - 0.45 * x;
    paint.depthWrite = x < 0.05;
    paint.color.set(0x27c862).lerp(GREEN, x * 0.4);
    paint.emissive = GREEN; paint.emissiveIntensity = 0.7 * x;
    glass.opacity = 0.75 - 0.55 * x;
    body.castShadow = x < 0.5;
  };
  P.xray(0);
  P.lights = k2 => { for (const m of P.lamps) m.emissiveIntensity = 3.5 * k2; };
  g.userData.P = P;
  return g;
}

// ---------- ignition: dashboard, lock cylinder and key ----------
export function ignition() {
  const k = kit();
  const g = new THREE.Group();
  const dash = boxM(1.2, 0.8, 0.1, k.leather, [0, 0, -0.06]); g.add(dash);
  g.add(mesh(new THREE.TorusGeometry(0.032, 0.008, 16, 48), k.chrome, [0, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 40), k.darker, [0, 0, -0.005], [Math.PI / 2, 0, 0]));
  const glowRing = mesh(new THREE.TorusGeometry(0.045, 0.003, 8, 64), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0, toneMapped: false })); g.add(glowRing);
  const key = new THREE.Group(); g.add(key);
  key.add(boxM(0.008, 0.004, 0.035, k.chrome, [0, 0, 0.015]));
  const head = mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.008, 40), k.rubber, [0, 0, 0.045], [Math.PI / 2, 0, 0]);
  head.scale.set(1.25, 1, 1); key.add(head);
  key.add(boxM(0.012, 0.012, 0.012, k.rubber, [0, 0, 0.032]));
  // pos markers
  for (let i = 0; i < 3; i++) { const a = Math.PI / 2 - i * 0.55; g.add(boxM(0.004, 0.012, 0.003, k.steelBright, [Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.002], [0, 0, a - Math.PI / 2])); }
  shadow(g);
  g.userData.P = { key, glowRing };
  return g;
}

// ---------- effects ----------
// blue curved rotation arrow around the x axis
export function spinArrow(r, color = 0x2f8cff) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false });
  for (let j = 0; j < 2; j++) {
    const a0 = j * Math.PI;
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.04, 8, 48, Math.PI * 0.7), mat);
    arc.rotation.z = a0;
    const head = new THREE.Mesh(new THREE.ConeGeometry(r * 0.1, r * 0.22, 16), mat);
    const a = a0 + Math.PI * 0.7;
    head.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); head.rotation.z = a;
    const sub = new THREE.Group(); sub.add(arc, head); g.add(sub);
  }
  g.rotation.y = Math.PI / 2;
  const outer = new THREE.Group(); outer.add(g); outer.userData.mat = mat; outer.renderOrder = 10;
  return outer;
}

// fuel mist: deterministic cone of droplets; update(t)
export function fuelSpray(seed = 2) {
  return sparks(360, { speed: 0.14, spread: 0.4, gravity: -0.02, life: 0.7, size: 0.014, seed, color: [1, 0.78, 0.15], dir: new THREE.Vector3(0, -1, 0) });
}

// fireball: lumpy orange blobs plus a soft glow; set(k) 0..1 grows and fades
export function fireball(seed = 4) {
  const r = rng(seed);
  const g = new THREE.Group();
  const parts = [];
  const cols = [0xff4a12, 0xff7a1e, 0xffa22e, 0xffd25a];
  for (let i = 0; i < 14; i++) {
    const geo = new THREE.IcosahedronGeometry(1, 2);
    const p = geo.attributes.position;
    for (let v = 0; v < p.count; v++) { const k = 0.8 + r() * 0.35; p.setXYZ(v, p.getX(v) * k, p.getY(v) * k, p.getZ(v) * k); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[i % 4], transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }));
    const off = new THREE.Vector3(r() - 0.5, (r() - 0.5) * 0.7, r() - 0.5).multiplyScalar(0.045);
    parts.push({ m, off, sz: 0.012 + r() * 0.012, ph: r() * 6, inner: i % 4 === 3 });
    m.renderOrder = 7; g.add(m);
  }
  const glow = glowSprite(0xff8a30, 0.1); g.add(glow);
  const light = new THREE.PointLight(0xff7a2a, 0, 0.8); g.add(light);
  g.set = (k, t = 0) => {
    const grow = Math.min(1, k * 3.5), fade = k < 0.3 ? 1 : Math.max(0, 1 - (k - 0.3) / 0.7);
    for (const p of parts) {
      p.m.position.copy(p.off).multiplyScalar(0.3 + grow * 0.9);
      p.m.scale.setScalar(p.sz * (0.2 + grow) * (p.inner ? 0.8 : 1) * (1 + 0.1 * Math.sin(t * 11 + p.ph)));
      p.m.rotation.set(t * 0.7 + p.ph, t * 0.5, 0);
      p.m.material.opacity = 0.85 * fade;
    }
    glow.scale.setScalar(0.08 + 0.06 * grow); glow.material.opacity = 0.5 * fade * grow;
    light.intensity = 1.2 * fade * grow;
    g.visible = fade * grow > 0.001;
  };
  g.set(0);
  return g;
}

// electric pulse travelling along a curve
export function pulse(path, color = 0x8dffc0) {
  const g = new THREE.Group();
  const heads = [];
  for (let i = 0; i < 5; i++) { const s = glowSprite(color, 0.05); heads.push(s); g.add(s); }
  g.set = (u, op = 1) => {
    heads.forEach((s, i) => {
      const uu = u - i * 0.035;
      s.visible = uu >= 0 && uu <= 1 && op > 0;
      if (s.visible) s.position.copy(path.getPointAt(Math.min(1, Math.max(0, uu))));
      s.material.opacity = op * (1 - i * 0.18);
      s.scale.setScalar(0.05 * (1 - i * 0.12));
    });
  };
  g.set(-1, 0);
  return g;
}
