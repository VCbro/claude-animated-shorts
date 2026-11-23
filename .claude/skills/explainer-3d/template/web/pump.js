// A procedural monoblock water pump ("water motor"): induction motor + centrifugal pump on one
// shaft, plus the pipes, the sump, the house and the roof tank. Built from lathes, extrusions and
// tubes (exploded-view / threejs-scene skills): no model files.
//
// Axes: the shaft is world X (motor at -x, pump at +x). Looking from +x toward the pump inlet,
// screen right is u = -z and up is v = y. 2D shapes below are drawn in (u, v) and extruded along +x.
import * as THREE from 'three';

export const DIM = {
  Ri: 0.105,            // impeller tip radius
  rEye: 0.032,          // impeller eye radius
  R0: 0.118, R1: 0.178, // volute radius at the tongue and at the throat
  wall: 0.012,
  H: 0.23,              // top of the discharge throat
  x0: 0.05, D: 0.07,    // volute casing back face and depth
  ductZ: 0.148,         // world z of the discharge centre ((R0 + R1) / 2)
  ductX: 0.085,
  groundY: -0.23,
};
DIM.R = (b) => DIM.R0 + (DIM.R1 - DIM.R0) * b / (Math.PI * 2);   // volute radius at clockwise angle b from the tongue

const mat = (o) => new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.2, ...o });
const PAINT = { color: '#1f74b5', roughness: 0.38, metalness: 0.15 };
const STEEL = { color: '#c3c8ce', roughness: 0.3, metalness: 0.9 };
const COPPER = { color: '#d07a3a', roughness: 0.35, metalness: 0.85 };

function latheX(points, segs = 64) {
  const g = new THREE.LatheGeometry(points.map(([r, x]) => new THREE.Vector2(r, x)), segs);
  g.rotateZ(-Math.PI / 2);
  return g;
}
const mesh = (g, m, shadow = true) => { const o = new THREE.Mesh(g, m); o.castShadow = shadow; o.receiveShadow = true; return o; };
const aroundX = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a);
function ring(geometry, material, n, place) {
  const im = new THREE.InstancedMesh(geometry, material, n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < n; i++) { q.identity(); s.set(1, 1, 1); place(i, p, q, s); im.setMatrixAt(i, m4.compose(p, q, s)); }
  im.castShadow = im.receiveShadow = true;
  return im;
}
// an extrusion of a (u, v) shape along +x, starting at x
function extrudeX(shape, depth, x, m, segs = 64) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segs, steps: 1 });
  g.computeVertexNormals();
  const o = mesh(g, m);
  o.rotation.y = Math.PI / 2;      // local x -> world -z (u), local z -> world +x
  o.position.x = x;
  return o;
}

// ----------------------------------------------------------------------------- volute outlines
function voluteOuter() {
  const { R, wall: t, R0, R1, H } = DIM;
  const s = new THREE.Shape();
  s.moveTo(-R1 - t, H); s.lineTo(-R1 - t, 0);
  for (let i = 0; i <= 160; i++) {
    const b = Math.PI * 2 * (1 - i / 160), a = Math.PI - b, r = R(b) + t;
    const u = r * Math.cos(a), v = r * Math.sin(a);
    if (a > Math.PI / 2 && u < -R0 + t) break;            // reached the tongue side of the throat
    s.lineTo(u, v);
  }
  s.lineTo(-R0 + t, H); s.closePath();
  return s;
}
function voluteHole() {
  const { R, R0, R1, H } = DIM;
  const p = new THREE.Path();
  p.moveTo(-R1, H - 0.012); p.lineTo(-R1, 0);
  for (let i = 1; i <= 160; i++) { const b = Math.PI * 2 * (1 - i / 160), a = Math.PI - b, r = R(b); p.lineTo(r * Math.cos(a), r * Math.sin(a)); }
  p.lineTo(-R0, H - 0.012); p.closePath();
  return p;
}

// ----------------------------------------------------------------------------- the machine
export function buildPump() {
  const root = new THREE.Group();
  const parts = {};
  const part = (name, opts = {}) => { const g = new THREE.Group(); g.name = name; Object.assign(g.userData, opts); root.add(g); parts[name] = g; return g; };
  const xrayMats = [];   // materials of the motor's outer shells (fade to glass)

  // motor housing: shell, fins, feet, terminal box
  const housing = part('housing', { shell: true });
  const hMat = mat(PAINT); xrayMats.push(hMat);
  housing.add(mesh(latheX([[0.105, -0.36], [0.115, -0.36], [0.115, -0.02], [0.105, -0.02], [0.105, -0.36]]), hMat));
  housing.add(ring(new THREE.BoxGeometry(0.31, 0.016, 0.006), hMat, 28, (i, p, q) => {
    const a = (i / 28) * Math.PI * 2; if (Math.cos(a) < -0.8 || Math.cos(a) > 0.93) { p.set(0, 99, 0); return; }
    q.copy(aroundX(a)); p.set(-0.19, Math.cos(a) * 0.122, Math.sin(a) * 0.122);
  }));
  const tbox = mesh(new THREE.BoxGeometry(0.09, 0.05, 0.08), hMat); tbox.position.set(-0.17, 0.135, 0); housing.add(tbox);
  const lidMat = mat({ ...PAINT, color: '#175d93' }); xrayMats.push(lidMat);
  const tlid = mesh(new THREE.BoxGeometry(0.098, 0.01, 0.088), lidMat); tlid.position.set(-0.17, 0.163, 0); housing.add(tlid);
  const footMat = mat({ ...PAINT, color: '#185a8c' }); xrayMats.push(footMat);
  for (const z of [-0.075, 0.075]) { const f = mesh(new THREE.BoxGeometry(0.26, 0.13, 0.04), footMat); f.position.set(-0.19, -0.165, z); housing.add(f); }
  const plate = mesh(new THREE.BoxGeometry(0.3, 0.012, 0.22), footMat); plate.position.set(-0.19, DIM.groundY + 0.006, 0); housing.add(plate);
  // end bell between motor and pump
  housing.add(mesh(latheX([[0.03, -0.02], [0.112, -0.02], [0.09, 0.02], [0.06, 0.04], [0.03, 0.04], [0.03, -0.02]]), hMat));

  // fan cover with grille
  const cover = part('fanCover', { shell: true });
  const cvMat = mat({ ...PAINT, color: '#1a6aa6' }); xrayMats.push(cvMat);
  cover.add(mesh(latheX([[0.117, -0.36], [0.119, -0.36], [0.119, -0.43], [0.1, -0.445], [0.098, -0.44], [0.115, -0.428], [0.117, -0.36]]), cvMat));
  const grill = mat({ color: '#0f2a3f', roughness: 0.6 }); xrayMats.push(grill);
  for (const r of [0.025, 0.05, 0.075]) { const g = mesh(new THREE.TorusGeometry(r, 0.003, 6, 40), grill); g.rotation.y = Math.PI / 2; g.position.x = -0.443; cover.add(g); }

  // stator core (ghosts with the housing) and copper coils, each with its own material so they can glow in turn
  const stator = part('stator', { shell: true });
  const coreMat = mat({ color: '#6c737b', roughness: 0.55, metalness: 0.6 }); xrayMats.push(coreMat);
  stator.add(mesh(latheX([[0.07, -0.31], [0.104, -0.31], [0.104, -0.07], [0.07, -0.07], [0.07, -0.31]]), coreMat));
  const coils = part('coils');
  const coilList = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const m = mat({ ...COPPER, emissive: '#000000' });
    const c = new THREE.Group();
    for (const x of [-0.318, -0.062]) {
      const tor = mesh(new THREE.TorusGeometry(0.017, 0.0065, 8, 18), m);
      tor.position.set(x, Math.cos(a) * 0.087, Math.sin(a) * 0.087);
      tor.quaternion.copy(aroundX(a)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2));
      c.add(tor);
    }
    for (const da of [-0.12, 0.12]) {
      const bar = mesh(new THREE.BoxGeometry(0.256, 0.01, 0.01), m);
      bar.position.set(-0.19, Math.cos(a + da) * 0.087, Math.sin(a + da) * 0.087);
      bar.quaternion.copy(aroundX(a + da));
      c.add(bar);
    }
    coils.add(c);
    coilList.push({ angle: a, mat: m });
  }

  // rotor, shaft and impeller turn together
  const spin = part('spin');
  const rotor = new THREE.Group(); spin.add(rotor);
  rotor.add(mesh(latheX([[0.001, -0.3], [0.064, -0.3], [0.064, -0.08], [0.001, -0.08]]), mat({ color: '#7d848c', roughness: 0.45, metalness: 0.8 })));
  rotor.add(ring(new THREE.BoxGeometry(0.22, 0.007, 0.011), mat({ color: '#dfe3e6', roughness: 0.35, metalness: 0.85 }), 18, (i, p, q) => {
    const a = (i / 18) * Math.PI * 2; q.copy(aroundX(a)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.14));
    p.set(-0.19, Math.cos(a) * 0.065, Math.sin(a) * 0.065);
  }));
  const shaftMat = mat({ ...STEEL, emissive: '#000000' });
  const shaft = mesh(latheX([[0.001, -0.43], [0.014, -0.43], [0.014, 0.06], [0.012, 0.062], [0.012, 0.1], [0.001, 0.1]], 32), shaftMat);
  spin.add(shaft);
  // cooling fan
  const fanMat = mat({ color: '#1d2228', roughness: 0.6, metalness: 0.1 }); xrayMats.push(fanMat);
  spin.add(ring(new THREE.BoxGeometry(0.004, 0.07, 0.028), fanMat, 9, (i, p, q) => {
    const a = (i / 9) * Math.PI * 2; q.copy(aroundX(a)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.4));
    p.set(-0.4, Math.cos(a) * 0.06, Math.sin(a) * 0.06);
  }));
  // impeller: back shroud, hub, six backward-curved vanes
  const brass = mat({ color: '#d9a640', roughness: 0.3, metalness: 0.85, emissive: '#000000' });
  const impeller = new THREE.Group(); spin.add(impeller);
  impeller.add(mesh(latheX([[0.001, 0.055], [DIM.Ri, 0.055], [DIM.Ri, 0.061], [0.04, 0.064], [0.001, 0.064]]), brass));
  impeller.add(mesh(latheX([[0.001, 0.06], [0.022, 0.06], [0.022, 0.09], [0.016, 0.104], [0.006, 0.109], [0.001, 0.109]], 32), brass));
  const VANES = 6, K = 1.05, rIn = 0.026;
  for (let k = 0; k < VANES; k++) {
    const base = (k / VANES) * Math.PI * 2;
    const c = (r) => base + K * (r - rIn) / (DIM.Ri - rIn);
    const sh = new THREE.Shape(), back = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const r = rIn + (DIM.Ri - 0.002 - rIn) * i / n, a = c(r), th = 0.0045;
      // perpendicular offset in angle: th / r
      const a1 = a + th / r, a2 = a - th / r;
      if (i === 0) sh.moveTo(r * Math.cos(a1), r * Math.sin(a1)); else sh.lineTo(r * Math.cos(a1), r * Math.sin(a1));
      back.push([r * Math.cos(a2), r * Math.sin(a2)]);
    }
    for (let i = back.length - 1; i >= 0; i--) sh.lineTo(back[i][0], back[i][1]);
    sh.closePath();
    impeller.add(extrudeX(sh, 0.036, 0.06, brass, 4));
  }

  // pump: back plate, volute casing (shell), front cover with suction nozzle (shell)
  const casing = part('casing', { shell: true });
  const castMat = mat({ ...PAINT, color: '#1b67a2', side: THREE.DoubleSide });
  const backPlate = extrudeX(voluteOuter(), 0.012, DIM.x0 - 0.012, castMat);
  parts.backPlate = backPlate;
  root.add(backPlate);   // the back plate stays on the motor when the casing lifts
  const vs = voluteOuter(); vs.holes.push(voluteHole());
  casing.add(extrudeX(vs, DIM.D, DIM.x0, castMat));
  // throat flange on top of the casing
  const fl = mesh(new THREE.BoxGeometry(DIM.D + 0.03, 0.014, DIM.R1 - DIM.R0 + 0.05), castMat);
  fl.position.set(DIM.ductX, DIM.H + 0.007, DIM.ductZ); casing.add(fl);
  const neck = mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.05, 32), castMat); neck.position.set(DIM.ductX, DIM.H + 0.035, DIM.ductZ); casing.add(neck);
  // casing foot
  const cf = mesh(new THREE.BoxGeometry(0.06, 0.05, 0.16), castMat); cf.position.set(DIM.ductX, DIM.groundY + 0.025, 0.02); casing.add(cf);

  const front = part('frontCover', { shell: true });
  const fcMat = mat({ ...PAINT, color: '#2380c4', transparent: false });
  const fs = voluteOuter(); const eye = new THREE.Path(); eye.absarc(0, 0, 0.04, 0, Math.PI * 2, true); fs.holes.push(eye);
  front.add(extrudeX(fs, 0.012, DIM.x0 + DIM.D, fcMat));
  front.add(mesh(latheX([[0.04, 0.13], [0.05, 0.13], [0.05, 0.2], [0.064, 0.2], [0.064, 0.215], [0.04, 0.215], [0.04, 0.13]]), fcMat));
  // bolts round the cover
  front.add(ring(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 6).rotateZ(Math.PI / 2), mat(STEEL), 8, (i, p) => {
    const b = (i / 8) * Math.PI * 2 + 0.3, a = Math.PI - b, r = DIM.R(b) + 0.004;
    p.set(DIM.x0 + DIM.D + 0.016, r * Math.sin(a), -r * Math.cos(a));
  }));

  root.traverse((o) => { if (o.isMesh) o.userData.baseMat = o.material; });
  return { root, parts, coilList, impeller, rotor, spin, shaftMat, brass, xrayMats, fcMat, castMat };
}

// ----------------------------------------------------------------------------- plumbing + surroundings
export function buildSite() {
  const site = new THREE.Group();
  const { ductX, ductZ, H, groundY } = DIM;

  // centre lines (also used by the flow particles)
  const suction = new THREE.CurvePath();          // from the sump to the pump eye
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  suction.add(new THREE.LineCurve3(v3(0.62, -0.2, 0), v3(0.62, -0.08, 0)));
  suction.add(new THREE.QuadraticBezierCurve3(v3(0.62, -0.08, 0), v3(0.62, 0, 0), v3(0.54, 0, 0)));
  suction.add(new THREE.LineCurve3(v3(0.54, 0, 0), v3(0.215, 0, 0)));
  const delivery = new THREE.CurvePath();         // from the casing throat to the tank
  const topY = 2.95, tankZ = -0.85;
  delivery.add(new THREE.LineCurve3(v3(ductX, H + 0.06, ductZ), v3(ductX, topY - 0.12, ductZ)));
  delivery.add(new THREE.QuadraticBezierCurve3(v3(ductX, topY - 0.12, ductZ), v3(ductX, topY, ductZ), v3(ductX, topY, ductZ - 0.12)));
  delivery.add(new THREE.LineCurve3(v3(ductX, topY, ductZ - 0.12), v3(ductX, topY, tankZ + 0.12)));
  delivery.add(new THREE.QuadraticBezierCurve3(v3(ductX, topY, tankZ + 0.12), v3(ductX, topY, tankZ), v3(ductX, topY - 0.12, tankZ)));
  delivery.add(new THREE.LineCurve3(v3(ductX, topY - 0.12, tankZ), v3(ductX, 2.78, tankZ)));

  const pvc = (o = {}) => new THREE.MeshStandardMaterial({ color: '#e9eef2', roughness: 0.25, metalness: 0, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide, ...o });
  const sucMat = pvc(), delMat = pvc();
  const tube = (curve, r, m, n = 200) => { const o = new THREE.Mesh(new THREE.TubeGeometry(curve, n, r, 24, false), m); o.renderOrder = 2; return o; };
  const sucPipe = tube(suction, 0.034, sucMat); site.add(sucPipe);
  const delPipe = tube(delivery, 0.034, delMat, 400); site.add(delPipe);
  // couplings at the pump so the pipes read as attached
  const coupl = new THREE.MeshStandardMaterial({ color: '#d7dde2', roughness: 0.4 });
  const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 28), coupl); c1.position.set(ductX, H + 0.075, ductZ); site.add(c1);
  const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 28).rotateZ(Math.PI / 2), coupl); c2.position.set(0.235, 0, 0);
  const sucGroup = new THREE.Group(); sucGroup.add(sucPipe, c2); site.add(sucGroup);

  // ground with a soft edge
  const gc = document.createElement('canvas'); gc.width = gc.height = 256;
  const gx = gc.getContext('2d'); const grd = gx.createRadialGradient(128, 128, 30, 128, 128, 128);
  grd.addColorStop(0, '#fff'); grd.addColorStop(0.65, '#fff'); grd.addColorStop(1, '#000'); gx.fillStyle = grd; gx.fillRect(0, 0, 256, 256);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), new THREE.MeshStandardMaterial({ color: '#33465a', roughness: 0.95, alphaMap: new THREE.CanvasTexture(gc), transparent: true, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, groundY, -0.4); ground.receiveShadow = true; ground.renderOrder = -1; site.add(ground);
  const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.38 }));
  shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = groundY + 0.001; shadowFloor.receiveShadow = true; site.add(shadowFloor);
  // concrete pad under the pump
  const concrete = new THREE.MeshStandardMaterial({ color: '#8d98a3', roughness: 0.9 });
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.42), concrete); pad.position.set(-0.12, groundY - 0.012, 0.02); pad.receiveShadow = true; site.add(pad);

  // sump with water
  const sump = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#7f8a94', roughness: 0.9, side: THREE.DoubleSide }));
  sump.position.set(0.62, groundY + 0.07, 0); sump.castShadow = sump.receiveShadow = true; site.add(sump);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 40), concrete); rim.rotation.x = Math.PI / 2; rim.position.set(0.62, groundY + 0.14, 0); site.add(rim);
  const sumpWater = new THREE.Mesh(new THREE.CircleGeometry(0.168, 40), new THREE.MeshStandardMaterial({ color: '#1e8fd6', roughness: 0.15, metalness: 0.1, emissive: '#0b4d80', emissiveIntensity: 0.6 }));
  sumpWater.rotation.x = -Math.PI / 2; sumpWater.position.set(0.62, groundY + 0.11, 0); site.add(sumpWater);

  // house: a simple cream block with windows, and the roof slab the tank stands on
  const wc = document.createElement('canvas'); wc.width = 512; wc.height = 512;
  const w = wc.getContext('2d');
  w.fillStyle = '#e9dcc0'; w.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { w.fillStyle = `rgba(${120 + Math.random() * 60},${100 + Math.random() * 40},70,${Math.random() * 0.05})`; w.fillRect(Math.random() * 512, Math.random() * 512, 3, 3); }
  const win = (x, y, ww, hh) => { w.fillStyle = '#6b5235'; w.fillRect(x - 8, y - 8, ww + 16, hh + 16); w.fillStyle = '#20384f'; w.fillRect(x, y, ww, hh); w.fillStyle = '#6b5235'; w.fillRect(x + ww / 2 - 4, y, 8, hh); w.fillRect(x, y + hh / 2 - 4, ww, 8); };
  win(70, 70, 110, 120); win(330, 70, 110, 120); win(330, 300, 110, 120);
  w.fillStyle = '#7a4a2a'; w.fillRect(80, 290, 110, 222);  // door
  const tex = new THREE.CanvasTexture(wc); tex.colorSpace = THREE.SRGBColorSpace;
  const wallMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.92 });
  const plainWall = new THREE.MeshStandardMaterial({ color: '#d9cbae', roughness: 0.92 });
  const house = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.43, 1.3), [plainWall, plainWall, plainWall, plainWall, wallMat, plainWall]);
  house.position.set(-0.2, groundY + 1.215, -1.0); house.castShadow = house.receiveShadow = true; site.add(house);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.08, 1.42), new THREE.MeshStandardMaterial({ color: '#b9ab92', roughness: 0.9 }));
  roof.position.set(-0.2, 2.24, -1.0); roof.castShadow = roof.receiveShadow = true; site.add(roof);

  // roof tank: ribbed plastic, cut open on the camera side to show the water level
  const tankMat = new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.55, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  const prof = [];
  for (let i = 0; i <= 12; i++) { const y = i / 12 * 0.55; prof.push(new THREE.Vector2(0.36 + (i % 2 ? 0.012 : 0), y)); }
  prof.push(new THREE.Vector2(0.3, 0.6), new THREE.Vector2(0.09, 0.62), new THREE.Vector2(0.09, 0.66), new THREE.Vector2(0.0, 0.66));
  const tank = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), tankMat); tank.position.set(ductX, 2.28, tankZ); tank.renderOrder = 3; site.add(tank);
  const tankWater = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 40), new THREE.MeshStandardMaterial({ color: '#2c9ce8', roughness: 0.2, emissive: '#0c5da0', emissiveIntensity: 0.7 }));
  tankWater.position.set(ductX, 2.28, tankZ); site.add(tankWater);

  // power cable from the wall switch to the terminal box
  const cable = new THREE.CurvePath();
  cable.add(new THREE.CubicBezierCurve3(v3(-0.55, 0.9, -0.345), v3(-0.55, 0.5, -0.34), v3(-0.17, 0.5, -0.1), v3(-0.17, 0.17, -0.02)));
  const cableMesh = new THREE.Mesh(new THREE.TubeGeometry(cable, 80, 0.008, 8, false), new THREE.MeshStandardMaterial({ color: '#15181c', roughness: 0.6 }));
  cableMesh.castShadow = true; site.add(cableMesh);
  const swBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.025), new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.5 }));
  swBox.position.set(-0.55, 0.96, -0.338); site.add(swBox);
  const toggle = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.02), new THREE.MeshStandardMaterial({ color: '#d8392b', roughness: 0.4, emissive: '#000000' }));
  toggle.position.set(-0.55, 0.96, -0.32); site.add(toggle);

  const houseG = new THREE.Group(); houseG.add(house, roof, tank, tankWater, swBox, toggle); site.add(houseG);
  return { site, suction, delivery, cable, sucGroup, sucMat, delMat, tankWater, toggle, house: houseG, tank };
}
