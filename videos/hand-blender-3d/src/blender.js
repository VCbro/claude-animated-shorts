import * as THREE from 'three';
import { textTexture } from './materials.js';
import { EnergyFlow, flowTube, rotationArrow, bladeTrail, VIS_MAGENTA, VIS_AMBER } from './effects.js';

/*
  Reference design (see README): a typical corded 600–1000 W immersion ("stick") blender
  driven by a series-wound UNIVERSAL MOTOR (brushed, runs on AC):
    - 2-pole laminated stator with two field coils
    - wound armature (rotor) with 12 slots + 12-bar commutator
    - 2 carbon brushes in brass holders, spring loaded
    - shaft on two bearings, axial cooling fan
    - speed-control board (switches + triac) behind the two buttons
    - detachable stainless blending shaft: splined coupling, inner drive rod on bushings,
      4-wing S-blade inside a vented bell guard.
  Units: 1 unit ≈ 1 cm. The blender's axis is +Y.
*/

const TAU = Math.PI * 2;

function anchor(parent, x, y, z) {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}

function smoothProfile(pts, n = 80) {
  const spline = new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y)));
  return spline.getPoints(n);
}

function lathe(profile, mat, phiStart = 0, phiLength = TAU, segs = 96) {
  return new THREE.Mesh(new THREE.LatheGeometry(profile, segs, phiStart, phiLength), mat);
}

// Torus lying in XZ around Y, optionally only half (side=+1 => x>=0)
function ring(radius, tube, mat, side = 0) {
  const arc = side === 0 ? TAU : Math.PI;
  const geo = new THREE.TorusGeometry(radius, tube, 12, side === 0 ? 128 : 64, arc);
  geo.rotateX(Math.PI / 2);
  if (side === 1) geo.rotateY(Math.PI / 2);
  if (side === -1) geo.rotateY(-Math.PI / 2);
  return new THREE.Mesh(geo, mat);
}

function cyl(rt, rb, h, mat, segs = 48, open = false) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs, 1, open), mat);
}

function gearShape(rOuter, rInner, teeth) {
  const s = new THREE.Shape();
  for (let i = 0; i <= teeth * 4; i++) {
    const a = (i / (teeth * 4)) * TAU;
    const r = (Math.floor(i / 2) % 2 === 0) ? rOuter : rInner;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  return s;
}

// Extruded shape standing along +Y (shape XY -> world XZ-ish, depth -> +Y)
function extrudeY(shape, depth, mat, opts = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24, ...opts });
  geo.rotateX(-Math.PI / 2); // (x,y,z) -> (x, z, -y)
  return new THREE.Mesh(geo, mat);
}

function statorShape() {
  const s = new THREE.Shape();
  s.absarc(0, 0, 2.2, 0, TAU, false);
  const hole = new THREE.Path();
  const d = THREE.MathUtils.degToRad;
  const P = (a, r) => [Math.cos(d(a)) * r, Math.sin(d(a)) * r];
  const pts = [];
  for (const p of [0, 180]) {
    for (let a = -50; a <= 50; a += 5) pts.push(P(p + a, 1.32));        // pole shoe face
    pts.push(P(p + 50, 1.5), P(p + 30, 1.6), P(p + 30, 1.95));           // shoe tip + pole neck
    for (let a = 30; a <= 150; a += 6) pts.push(P(p + a, 1.95));         // coil window
    pts.push(P(p + 150, 1.6), P(p + 130, 1.5));                           // next neck
  }
  // reorder so the next pole shoe starts at 130 deg (it's -50 relative to 180)
  hole.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) hole.lineTo(...pts[i]);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

function rotorShape(R = 1.2, n = 12, slotW = 0.22, depth = 0.42, holeR = 0.25) {
  const s = new THREE.Shape();
  const half = Math.asin(slotW / 2 / R);
  for (let k = 0; k < n; k++) {
    const c = (k / n) * TAU;
    const a0 = c - half, a1 = c + half;
    const dir = [Math.cos(c), Math.sin(c)];
    const p0 = [Math.cos(a0) * R, Math.sin(a0) * R];
    const p1 = [Math.cos(a1) * R, Math.sin(a1) * R];
    if (k === 0) s.moveTo(...p0);
    s.lineTo(p0[0] - dir[0] * depth, p0[1] - dir[1] * depth);
    s.lineTo(p1[0] - dir[0] * depth, p1[1] - dir[1] * depth);
    s.lineTo(...p1);
    const next = ((k + 1) / n) * TAU - half;
    s.absarc(0, 0, R, a1, next, false);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, holeR, 0, TAU, true);
  s.holes.push(hole);
  return s;
}

// Stack of thin laminations (InstancedMesh) + engineering section colour on the back faces
function laminatedStack(shape, y0, height, mat, sectionMat, slice = 0.13, gap = 0.016) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: slice, bevelEnabled: false, curveSegments: 32 });
  geo.rotateX(-Math.PI / 2);
  const count = Math.floor(height / (slice + gap));
  const g = new THREE.Group();
  const front = new THREE.InstancedMesh(geo, mat, count);
  const back = sectionMat ? new THREE.InstancedMesh(geo, sectionMat, count) : null;
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    m.makeTranslation(0, y0 + i * (slice + gap), 0);
    front.setMatrixAt(i, m);
    if (back) back.setMatrixAt(i, m);
  }
  front.castShadow = true;
  g.add(front);
  if (back) g.add(back);
  return g;
}

function roundedRectLoop(halfW, halfH, rad, steps = 10) {
  // loop in local YZ plane (z = width, y = height)
  const pts = [];
  const corners = [[halfW - rad, halfH - rad, 0], [-(halfW - rad), halfH - rad, Math.PI / 2],
    [-(halfW - rad), -(halfH - rad), Math.PI], [halfW - rad, -(halfH - rad), Math.PI * 1.5]];
  for (const [cz, cy, a0] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * Math.PI / 2;
      pts.push(new THREE.Vector3(0, cy + Math.sin(a) * rad, cz + Math.cos(a) * rad));
    }
  }
  return pts;
}

function wire(points, radius, mat) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.4);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 8, false), mat);
  m.castShadow = true;
  return m;
}

export function buildBlender(M) {
  const root = new THREE.Group();     // world placement / turntable
  const model = new THREE.Group();    // the product
  root.add(model);
  const parts = {};
  const anchors = {};
  const ghost = [];                   // meshes that turn to x-ray in the cut-away scenes
  const part = (name, offset) => {
    const g = new THREE.Group();
    g.userData.explode = new THREE.Vector3(...offset);
    parts[name] = g; model.add(g);
    return g;
  };

  // ---------------- Clipping (cut-away) for the motor ----------------
  const clipPlanes = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 50), new THREE.Plane(new THREE.Vector3(0, 0, -1), 50)];
  const clipMat = (mat) => {
    const c = mat.clone();
    c.clippingPlanes = clipPlanes; c.clipIntersection = true; c.clipShadows = true;
    return c;
  };
  const statorMat = clipMat(M.lamination); statorMat.side = THREE.FrontSide;
  const sectionMat = clipMat(M.section);
  const fieldCoilMat = clipMat(M.copperWinding);
  const frameMat = clipMat(M.frame);

  // ================= 1. OUTER HOUSING (two clam-shell halves) =================
  const lower = smoothProfile([[1.95, 1.6], [2.2, 2.0], [2.45, 2.8], [2.6, 3.6], [2.75, 5], [2.85, 7], [2.88, 9], [2.85, 11], [2.75, 12.4], [2.68, 13.0]], 60);
  const upper = smoothProfile([[2.68, 13.0], [2.58, 14.2], [2.52, 15.5], [2.56, 17], [2.66, 18.5], [2.62, 19.6], [2.35, 20.4], [1.8, 20.95], [1.1, 21.2], [0.8, 21.25]], 60);
  const inner = (prof) => prof.map((p) => new THREE.Vector2(Math.max(0.05, p.x - 0.14), p.y));
  for (const side of [1, -1]) {
    const g = part(side > 0 ? 'housingR' : 'housingL', [side * 8, 0, 0]);
    const phi0 = side > 0 ? 0 : Math.PI;
    const a = lathe(lower, M.brushed, phi0, Math.PI, 64);
    const b = lathe(upper, M.softTouch, phi0, Math.PI, 64);
    const ia = lathe(inner(lower), M.plasticGrey, phi0, Math.PI, 64); ia.material = M.plasticGrey.clone(); ia.material.side = THREE.BackSide;
    const ib = lathe(inner(upper), ia.material, phi0, Math.PI, 64);
    const r1 = ring(2.69, 0.07, M.chrome, side); r1.position.y = 13.0;
    const r2 = ring(2.55, 0.05, M.chrome, side); r2.position.y = 3.3;
    [a, b, ia, ib, r1, r2].forEach((m) => { m.castShadow = true; m.receiveShadow = true; g.add(m); ghost.push(m); });
    // front button panel half (glossy black)
    const panel = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 4.4, 32, 1, true, side > 0 ? 0 : -0.36, 0.36), M.gloss);
    panel.position.y = 16.15; panel.castShadow = true; g.add(panel); ghost.push(panel);
  }
  anchors.housing = anchor(parts.housingR, 2.8, 7.5, 0.8);

  // ================= 5. SPEED CONTROL BUTTONS =================
  const buttons = part('buttons', [0, 2.5, 7]);
  const btnShape = new THREE.Shape();
  const bw = 0.5, bh = 0.62, br = 0.3;
  btnShape.moveTo(-bw + br, -bh); btnShape.lineTo(bw - br, -bh); btnShape.quadraticCurveTo(bw, -bh, bw, -bh + br);
  btnShape.lineTo(bw, bh - br); btnShape.quadraticCurveTo(bw, bh, bw - br, bh); btnShape.lineTo(-bw + br, bh);
  btnShape.quadraticCurveTo(-bw, bh, -bw, bh - br); btnShape.lineTo(-bw, -bh + br); btnShape.quadraticCurveTo(-bw, -bh, -bw + br, -bh);
  const btnGeo = new THREE.ExtrudeGeometry(btnShape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4 });
  [[17.0, 'II'], [15.3, 'I']].forEach(([y, txt]) => {
    const b = new THREE.Mesh(btnGeo, M.button);
    b.position.set(0, y, 2.5); b.castShadow = true; buttons.add(b);
    const bezel = new THREE.Mesh(new THREE.ExtrudeGeometry(btnShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.14, bevelSegments: 2 }), M.chrome);
    bezel.position.set(0, y, 2.43); buttons.add(bezel);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5),
      new THREE.MeshBasicMaterial({ map: textTexture(txt, { w: 128, h: 80, font: '700 54px Montserrat, Arial', color: '#7fe3ff' }), transparent: true }));
    label.position.set(0, y, 2.82); buttons.add(label);
  });
  anchors.buttons = anchor(buttons, 0.4, 17.0, 2.9);

  // ================= POWER CABLE =================
  const cable = part('cable', [0, 6, -7]);
  const relief = lathe(smoothProfile([[0.85, 20.9], [0.82, 21.6], [0.7, 22.4], [0.55, 23.4], [0.42, 24.2]], 40)
    .map((p, i) => new THREE.Vector2(p.x + (i % 6 < 3 ? 0.04 : 0), p.y)), M.rubberCable, 0, TAU, 32);
  relief.castShadow = true; cable.add(relief);
  const cablePts = [[0, 24.0, 0], [0, 25.8, -0.5], [0, 26.6, -2.6], [0, 25.2, -5.2], [0, 18, -7.4], [0, 4, -8.6], [0.5, -14, -9], [1.5, -27, -8.5],
    [2.5, -31.62, -6], [6, -31.62, -2.5], [6, -31.62, 3], [1, -31.62, 6.5], [-5, -31.62, 4], [-6.5, -31.62, -2], [-3, -31.62, -6.5], [3, -31.62, -9]];
  const cableCurve = new THREE.CatmullRomCurve3(cablePts.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.5);
  const cableMesh = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 300, 0.33, 12, false), M.rubberCable);
  cableMesh.castShadow = true; cable.add(cableMesh);
  // Plug at the end of the coiled cable
  const plug = new THREE.Group();
  const plugBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 2.2), M.rubberCable); plug.add(plugBody);
  for (const s of [-0.35, 0.35]) { const pin = cyl(0.1, 0.1, 1.4, M.chrome, 12); pin.rotation.x = Math.PI / 2; pin.position.set(s, 0, 1.7); plug.add(pin); }
  plug.position.set(4.2, -31.4, -9.6); plug.rotation.y = 1.25; plug.castShadow = true; cable.add(plug);
  anchors.cable = anchor(cable, 0, 25.5, -1.5);

  // ================= 4. ELECTRICAL CONNECTIONS (speed board + wiring) =================
  const elec = part('electrical', [8.5, 3, 0]);
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.3, 4.4, 0.1), [M.chip, M.chip, M.chip, M.chip, M.pcb, M.pcb]);
  pcb.position.set(0, 16.2, 1.25); pcb.castShadow = true; elec.add(pcb);
  for (const y of [17.0, 15.3]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.45), M.plasticWhite); sw.position.set(0, y, 1.5); elec.add(sw); }
  const triac = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.6, 0.25), M.chip); triac.position.set(-0.7, 14.5, 1.42); elec.add(triac);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.05), M.chrome); tab.position.set(-0.7, 15.0, 1.32); elec.add(tab);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.45), M.capacitor); cap.position.set(0.45, 18.0, 1.5); elec.add(cap);
  for (let i = 0; i < 3; i++) { const r = cyl(0.08, 0.08, 0.5, M.capacitor, 10); r.rotation.z = Math.PI / 2; r.position.set(0.55, 14.2 + i * 0.3, 1.38); r.material = M.wireBlue; elec.add(r); }
  const wires = [
    [[[0.15, 23.0, 0], [0.18, 20.6, 0.1], [0.3, 19.2, 0.9], [0.3, 18.4, 1.25]], M.wireBrown],
    [[[-0.15, 23.0, 0], [-0.18, 20.6, 0.1], [-0.3, 19.2, 0.9], [-0.3, 18.4, 1.25]], M.wireBlue],
    [[[0.7, 14.0, 1.25], [1.2, 12.8, 1.2], [1.5, 11.2, 0.9], [1.45, 10.15, 0.55]], M.wireEnamel],
    [[[-0.7, 14.0, 1.25], [-1.2, 12.8, 1.2], [-1.5, 11.2, 0.9], [-1.45, 10.15, 0.55]], M.wireEnamel],
    [[[1.62, 10.0, -0.5], [1.75, 10.5, -0.4], [1.62, 10.85, -0.2]], M.wireEnamel],
    [[[-1.62, 10.0, -0.5], [-1.75, 10.5, -0.4], [-1.62, 10.85, -0.2]], M.wireEnamel],
  ];
  wires.forEach(([pts, mat]) => elec.add(wire(pts, 0.075, mat)));
  anchors.electrical = anchor(elec, 1.15, 16.8, 1.3);
  anchors.pcb = anchors.electrical;

  // ================= 2. ELECTRIC MOTOR (universal motor) =================
  const motor = part('motor', [0, 4, 0]);
  // Stator: 2 salient poles, laminated
  const stator = laminatedStack(statorShape(), 6.4, 3.2, statorMat, sectionMat);
  motor.add(stator);
  // Field coils wound around each pole neck
  for (const side of [0, Math.PI]) {
    const coil = new THREE.Group();
    const loop = roundedRectLoop(1.1, 1.85, 0.45);
    const curve = new THREE.CatmullRomCurve3(loop, true);
    for (const [dx, rad] of [[0, 0.2], [0.17, 0.16]]) {
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, rad, 14, true), fieldCoilMat);
      tube.position.x = 1.42 + dx; tube.castShadow = true;
      coil.add(tube);
    }
    coil.position.y = 8.0; coil.rotation.y = side;
    motor.add(coil);
  }
  // Tie bolts + bearing brackets (motor frame)
  for (const z of [-2.05, 2.05]) { const bolt = cyl(0.09, 0.09, 7.6, M.chrome, 12); bolt.position.set(0, 8.15, z); motor.add(bolt); }
  const topBracket = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 4.6), frameMat); topBracket.position.set(0, 12.0, 0); motor.add(topBracket);
  const topBearing = cyl(0.5, 0.5, 0.45, M.bearing, 32); topBearing.position.y = 12.0; motor.add(topBearing);
  const lowShield = ring(2.15, 0.14, frameMat); lowShield.position.y = 4.6; motor.add(lowShield);
  for (let i = 0; i < 3; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 0.3), frameMat);
    const a = i / 3 * TAU + 0.5; spoke.position.set(Math.cos(a) * 1.15, 4.6, -Math.sin(a) * 1.15); spoke.rotation.y = a; motor.add(spoke);
  }
  const lowBearing = cyl(0.5, 0.5, 0.45, M.bearing, 32); lowBearing.position.y = 4.6; motor.add(lowBearing);
  // Brush holders + carbon brushes (on the pole axis, ±X)
  const brushes = new THREE.Group(); motor.add(brushes);
  for (const s of [1, -1]) {
    const holder = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.5), M.brass); holder.position.set(s * 1.2, 10.85, 0);
    const brush = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.36, 0.36), M.graphite); brush.position.set(s * 0.88, 10.85, 0);
    const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(
      Array.from({ length: 40 }, (_, i) => new THREE.Vector3(s * (1.25 + i * 0.012), 10.85 + Math.sin(i * 1.3) * 0.13, Math.cos(i * 1.3) * 0.13))), 80, 0.025, 6), M.chrome);
    brushes.add(holder, brush, spring);
  }
  anchors.motor = anchor(motor, 2.25, 8.6, 0.6);
  anchors.stator = anchor(motor, 1.6, 9.4, 1.35);
  anchors.fieldCoil = anchor(motor, 1.55, 7.0, 1.2);
  anchors.brushes = anchor(motor, -1.25, 11.1, 0);
  anchors.bearing = anchor(motor, 0.45, 12.15, 0);
  anchors.frame = anchor(motor, 0, 12.15, 1.9);

  // Rotor (armature) - spins
  const rotor = new THREE.Group(); motor.add(rotor);
  const armature = laminatedStack(rotorShape(), 6.45, 3.1, M.lamination.clone(), null);
  armature.children[0].material.side = THREE.FrontSide;
  rotor.add(armature);
  for (let k = 0; k < 12; k++) {
    const c = (k / 12) * TAU;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.35, 0.18), M.copper);
    bar.position.set(Math.cos(c) * 0.98, 8.0, -Math.sin(c) * 0.98); bar.rotation.y = c; rotor.add(bar);
  }
  for (const y of [6.2, 9.8]) {
    const endTurn = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.3, 16, 64), M.copperWinding);
    endTurn.rotation.x = Math.PI / 2; endTurn.position.y = y; endTurn.scale.z = 0.8; endTurn.castShadow = true; rotor.add(endTurn);
  }
  // Commutator: 12 copper bars separated by mica
  const comm = new THREE.Group(); comm.position.y = 10.85; rotor.add(comm);
  comm.add(cyl(0.5, 0.5, 0.95, M.mica, 24));
  for (let k = 0; k < 12; k++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.9, 6, 1, false, (k / 12) * TAU + 0.03, TAU / 12 - 0.06), M.copper);
    comm.add(seg);
  }
  // risers from commutator bars to the armature end-turns
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    rotor.add(wire([[Math.cos(a) * 0.5, 10.35, -Math.sin(a) * 0.5], [Math.cos(a + 0.2) * 0.7, 10.1, -Math.sin(a + 0.2) * 0.7], [Math.cos(a + 0.4) * 0.8, 9.95, -Math.sin(a + 0.4) * 0.8]], 0.035, M.copper));
  }
  // Cooling fan (axial/radial impeller under the armature)
  const fan = new THREE.Group(); fan.position.y = 5.55; rotor.add(fan);
  fan.add(cyl(1.75, 1.75, 0.08, M.fan, 48));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.55, 0.06), M.fan);
    blade.position.set(Math.cos(a) * 1.05, -0.3, -Math.sin(a) * 1.05); blade.rotation.y = a + 0.35; fan.add(blade);
  }
  rotor.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  anchors.rotor = anchor(rotor, 0, 8.6, 1.25);
  anchors.armWinding = anchor(rotor, 0, 9.9, 1.05);
  anchors.commutator = anchor(rotor, 0, 10.85, 0.56);
  anchors.fan = anchor(rotor, 0, 5.4, 1.7);

  // ================= 3. MOTOR SHAFT (+ splined drive coupling) =================
  const shaft = part('shaft', [0, -5, 0]);
  const shaftSpin = new THREE.Group(); shaft.add(shaftSpin);
  const sh = cyl(0.24, 0.24, 11.4, M.steel, 24); sh.position.y = 6.7; sh.castShadow = true; shaftSpin.add(sh);
  const socket = extrudeY(gearShape(0.52, 0.44, 10), 1.0, M.steel); socket.position.y = 1.0; shaftSpin.add(socket);
  const collarRing = cyl(0.36, 0.36, 0.3, M.bearing, 24); collarRing.position.y = 2.15; shaftSpin.add(collarRing);
  anchors.shaft = anchor(shaft, 0.24, 3.4, 0);
  anchors.coupling = anchor(shaft, 0.5, 1.5, 0);

  // ================= 6. STAINLESS BLENDING SHAFT =================
  const blendShaft = part('blendShaft', [0, -7, 0]);
  const collar = lathe(smoothProfile([[1.0, 2.6], [1.85, 2.6], [1.88, 1.6], [1.85, 0.6], [1.6, 0.0], [1.3, -0.45], [1.12, -0.95]], 40), M.gloss, 0, TAU, 64);
  collar.material = M.gloss.clone(); collar.material.side = THREE.DoubleSide;
  collar.castShadow = true; blendShaft.add(collar); ghost.push(collar);
  const lock = ring(1.87, 0.06, M.chrome); lock.position.y = 0.75; blendShaft.add(lock); ghost.push(lock);
  const tubeOuter = cyl(1.1, 1.1, 13.6, M.steel, 64, true); tubeOuter.position.y = -7.7; tubeOuter.castShadow = true; blendShaft.add(tubeOuter);
  const innerMat = M.steel.clone(); innerMat.side = THREE.BackSide; innerMat.roughness = 0.22; innerMat.color.set(0x9aa1aa);
  const tubeInner = cyl(0.95, 0.95, 13.6, innerMat, 64, true); tubeInner.position.y = -7.7; blendShaft.add(tubeInner);
  const tubeEnd = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.1, 64), M.steel); tubeEnd.rotation.x = -Math.PI / 2; tubeEnd.position.y = -0.9; blendShaft.add(tubeEnd);
  for (const y of [-1.2, -14.2]) { // the two bushings that support the drive rod
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.5, 48, 1, true), M.bushing); b.material = M.bushing.clone(); b.material.side = THREE.DoubleSide; b.position.y = y; blendShaft.add(b);
    const disc = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.95, 48), b.material); disc.rotation.x = -Math.PI / 2; disc.position.y = y + 0.25; blendShaft.add(disc);
    const disc2 = disc.clone(); disc2.position.y = y - 0.25; blendShaft.add(disc2);
  }
  const rodSpin = new THREE.Group(); blendShaft.add(rodSpin);
  const rod = cyl(0.2, 0.2, 19.6, M.steel, 20); rod.position.y = -7.85; rodSpin.add(rod);
  const pin = extrudeY(gearShape(0.42, 0.34, 10), 0.85, M.steel); pin.position.y = 1.15; rodSpin.add(pin);
  anchors.blendShaft = anchor(blendShaft, 1.1, -6.0, 0);
  anchors.rod = anchor(rodSpin, 0.2, -4.0, 0);
  anchors.bushing = anchor(blendShaft, 0.9, -14.2, 0.3);
  anchors.collar = anchor(blendShaft, 1.85, 1.2, 0.3);

  // ================= 7. PROTECTIVE BLADE GUARD (bell) =================
  const guard = part('guard', [0, -11, 0]);
  const bellR = (y) => { // radius of the bell as a function of height (local)
    const p = [[-14.5, 1.1], [-15.0, 1.25], [-15.6, 1.9], [-16.3, 2.6], [-17.1, 3.05], [-18.0, 3.25], [-18.8, 3.3], [-19.0, 3.35]];
    for (let i = 0; i < p.length - 1; i++) if (y >= p[i + 1][0]) return THREE.MathUtils.mapLinear(y, p[i][0], p[i + 1][0], p[i][1], p[i + 1][1]);
    return 3.35;
  };
  const bellProfile = (y0, y1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const y = y0 + (y1 - y0) * (i / n); return new THREE.Vector2(bellR(y), y); });
  const bellMat = M.steel.clone(); bellMat.side = THREE.DoubleSide;
  bellMat.color.set(0xc6ccd3); bellMat.roughness = 0.24; bellMat.clearcoat = 0; bellMat.envMapIntensity = 1.0;
  const top = lathe(bellProfile(-14.5, -16.0), bellMat); guard.add(top);
  for (let i = 0; i < 4; i++) { // 4 vent windows between 4 ribs
    const seg = lathe(bellProfile(-16.0, -18.0), bellMat, i * TAU / 4 + 0.62, TAU / 4 - 0.62, 24); guard.add(seg);
  }
  const rim = lathe(bellProfile(-18.0, -19.0, 8), bellMat); guard.add(rim);
  const rimRoll = ring(3.36, 0.09, M.steel); rimRoll.position.y = -19.0; guard.add(rimRoll);
  const boss = cyl(0.5, 0.6, 0.9, M.steel, 32); boss.position.y = -15.0; guard.add(boss);
  guard.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  anchors.guard = anchor(guard, 3.0, -17.2, 0.6);
  anchors.vent = anchor(guard, 2.5, -17.0, 1.4);

  // ================= 8. ROTATING BLADES (4-wing S-blade) =================
  const blades = part('blades', [0, -14, 0]);
  const bladeSpin = new THREE.Group(); bladeSpin.position.y = -17.6; blades.add(bladeSpin);
  const wing = new THREE.Shape();
  wing.moveTo(0.25, -0.34);
  wing.quadraticCurveTo(1.4, -0.55, 2.7, 0.18);
  wing.quadraticCurveTo(2.75, 0.32, 2.55, 0.34);
  wing.quadraticCurveTo(1.4, 0.05, 0.25, 0.34);
  wing.lineTo(0.25, -0.34);
  const wingGeo = new THREE.ExtrudeGeometry(wing, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 2, curveSegments: 24 });
  wingGeo.translate(0, 0, -0.025); wingGeo.rotateX(-Math.PI / 2);
  for (let k = 0; k < 4; k++) {
    const pivot = new THREE.Group(); pivot.rotation.y = k * Math.PI / 2;
    const w = new THREE.Mesh(wingGeo, M.blade);
    w.rotation.x = 0.22;                       // pitch (angle of attack)
    w.rotation.z = (k % 2 === 0 ? 1 : -1) * 0.2; // one pair bent up, one pair down
    w.position.y = (k % 2 === 0 ? 0.08 : -0.08);
    w.castShadow = true;
    pivot.add(w); bladeSpin.add(pivot);
  }
  bladeSpin.add(cyl(0.42, 0.42, 0.32, M.steel, 32));
  const nut = cyl(0.33, 0.33, 0.28, M.chrome, 6); nut.position.y = -0.3; bladeSpin.add(nut);
  const trail = bladeTrail(0.45, 2.8); trail.position.y = -17.6; blades.add(trail);
  const rpmArrow = rotationArrow(4.2, { tube: 0.07 }); rpmArrow.position.y = -17.6; blades.add(rpmArrow);
  anchors.blades = anchor(bladeSpin, 2.2, 0.1, 0);
  anchors.bladesStatic = anchor(blades, 2.3, -17.5, 1.0);
  anchors.rpm = anchor(blades, -4.0, -17.6, 1.6);

  // ================= VISUALISATIONS (not physical parts) =================
  const vis = new THREE.Group(); motor.add(vis);
  // Current path: mains -> board -> field coil A -> brush -> commutator/armature -> brush -> field coil B -> board -> mains
  const energyPts = [[0, 24, 0], [0.15, 21.5, 0], [0.25, 19.5, 0.8], [0.3, 18.2, 1.32], [0.3, 16.5, 1.35], [0.55, 14.6, 1.35], [0.9, 13.5, 1.25],
    [1.45, 11.3, 0.9], [1.42, 9.9, 1.1], [1.42, 8, 1.15], [1.42, 6.2, 0.4], [1.42, 6.2, -0.4], [1.42, 8, -1.15], [1.6, 9.9, -0.6], [1.62, 10.85, -0.2],
    [1.0, 10.85, 0], [0.55, 10.85, 0], [0.75, 10.0, 0.4], [0.9, 8.0, 0.7], [0.3, 6.3, 0.9], [-0.3, 6.3, 0.9], [-0.9, 8.0, 0.7], [-0.75, 10.0, 0.4], [-0.55, 10.85, 0],
    [-1.0, 10.85, 0], [-1.62, 10.85, -0.2], [-1.6, 9.9, -0.6], [-1.42, 8, -1.15], [-1.42, 6.2, -0.4], [-1.42, 6.2, 0.4], [-1.42, 8, 1.15], [-1.42, 9.9, 1.1],
    [-1.45, 11.3, 0.9], [-0.9, 13.5, 1.25], [-0.55, 14.6, 1.35], [-0.3, 16.5, 1.35], [-0.3, 18.2, 1.32], [-0.25, 19.5, 0.8], [-0.15, 21.5, 0], [0, 24, 0.01]]
    .map((p) => new THREE.Vector3(...p).sub(new THREE.Vector3(0, 0, 0)));
  // energy path is defined in assembled coordinates; motor group is offset by explode, so attach to model instead
  const energy = new EnergyFlow(energyPts, { color: VIS_AMBER, count: 110 });
  model.add(energy.group);
  // Magnetic field lines across the air gap (pole N at +X, S at -X) and return path through the yoke
  const field = new THREE.Group(); vis.add(field);
  for (const y of [7.1, 8.0, 8.9]) {
    for (const z of [-0.75, -0.25, 0.25, 0.75]) {
      field.add(flowTube([[1.32, y, z], [0.6, y, z * 0.75], [0, y, z * 0.6], [-0.6, y, z * 0.75], [-1.32, y, z]].map((p) => new THREE.Vector3(...p)),
        { radius: 0.025, color: VIS_MAGENTA, dash: 3, speed: 0.8, segments: 40 }));
    }
    for (const s of [1, -1]) {
      const arc = Array.from({ length: 13 }, (_, i) => { const a = Math.PI - (i / 12) * Math.PI; return new THREE.Vector3(Math.cos(a) * 2.07, y, s * Math.sin(a) * 2.07); });
      field.add(flowTube(arc, { radius: 0.025, color: VIS_MAGENTA, dash: 3, speed: 0.8, segments: 60 }));
    }
  }
  const torqueArrow = rotationArrow(1.05, { color: VIS_CYAN_SAFE(), tube: 0.05 });
  torqueArrow.position.y = 11.75; vis.add(torqueArrow);
  anchors.fieldN = anchor(motor, 1.0, 8.0, -0.2);
  anchors.fieldS = anchor(motor, -1.0, 8.0, -0.2);
  anchors.energy = anchor(model, 0.9, 13.5, 1.25);
  anchors.torque = anchor(motor, -1.05, 11.75, 0);

  // Cast/receive shadows broadly
  model.traverse((o) => { if (o.isMesh && o.castShadow === false && !o.material?.isShaderMaterial) o.castShadow = true; });

  return {
    root, model, parts, anchors, ghost, clipPlanes,
    spins: [rotor, shaftSpin, rodSpin, bladeSpin],
    rotor, bladeSpin, trail, rpmArrow, torqueArrow, field, energy, bellR,
  };
}

function VIS_CYAN_SAFE() { return 0x36d6ff; }
