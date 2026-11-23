// "How a bike engine works": a commuter motorcycle on its main stand by a country road at golden
// hour, with a single-cylinder four-stroke engine that can be cut open. All geometry is built here
// from code. Units are metres. The bike faces +x, y is up, the camera side (+z) is the bike's right.
//
// The engine has its own frame (EG): the crank centre is the origin, the cylinder axis is +y,
// the crank axis is z, and the exhaust side is +x. The engine is tilted forward by EN.tilt.
import * as THREE from 'three';

export const EN = {
  pos: new THREE.Vector3(0.03, 0.34, 0), tilt: -0.30,
  r: 0.029, L: 0.105, bore: 0.0285, deck: 0.160,
  camY: 0.262, camBase: 0.013, camLift: 0.0055, camHW: 52.5 * Math.PI / 180,
  // valves: seat centres and axes (pointing up the stem)
  vI: { s: [-0.0125, 0.1745], d: [-Math.sin(0.349), Math.cos(0.349)], rh: 0.0125 },
  vE: { s: [0.0115, 0.1745], d: [Math.sin(0.349), Math.cos(0.349)], rh: 0.0108 },
  // rockers: pivot, follower pad (on the cam), valve pad
  rI: { p: [-0.024, 0.290], f: [-0.002, 0.2775], v: [-0.0416, 0.2574] },
  rE: { p: [0.024, 0.290], f: [0.002, 0.2775], v: [0.0406, 0.2574] },
  plugTip: [0.004, 0.176, 0.006], plugDir: [0.3, 0.7, 0.62],
  // gearbox (engine frame)
  M: [-0.095, 0.03], C: [-0.155, -0.03], rPrim: 0.028, rClutch: 0.0716,
  pairs: [[0.024, 0.0609, -0.058], [0.031, 0.0539, -0.040], [0.038, 0.0469, -0.022], [0.044, 0.0409, -0.004]],
  engaged: 2, rFront: 0.042, rRear: 0.115, chainZ: -0.095,
};
export const BK = { RA: [-0.63, 0.315], FA: [0.68, 0.30], R: 0.30, pivot: [-0.21, 0.375] };

export const pinY = (th) => EN.r * Math.cos(th) + Math.sqrt(EN.L * EN.L - (EN.r * Math.sin(th)) ** 2);
// valve lift (m) for crank angle th (radians), from the same cam profile that is drawn
export const FOLLOW = {
  I: Math.atan2(EN.rI.f[1] - EN.camY, EN.rI.f[0]),
  E: Math.atan2(EN.rE.f[1] - EN.camY, EN.rE.f[0]),
};
export const LOBE = {                         // lobe tip angle on the cam body
  I: FOLLOW.I + (95 / 2) * Math.PI / 180,     // intake fully open at 95 deg crank
  E: FOLLOW.E + (625 / 2) * Math.PI / 180,    // exhaust fully open at 625 deg crank
};
const wrapPi = (a) => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
export function camBump(a) { const d = wrapPi(a); return Math.abs(d) >= EN.camHW ? 0 : Math.cos(Math.PI / 2 * d / EN.camHW) ** 2; }
export const camLiftAt = (which, th) => EN.camLift * camBump(FOLLOW[which] + th / 2 - LOBE[which]);
export const ROCK = 0.0253, VLEV = 0.037 * 0.95;   // rocker arm lengths: cam side, valve side

// ----------------------------------------------------------------------------- helpers
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export function std(color, metalness = 0, roughness = 0.6, o = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, ...o });
}
function mesh(geo, mat, parent, cast = true) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
function lathe(pts, segs = 48, phiStart = 0, phiLength = Math.PI * 2) {
  return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs, phiStart, phiLength);
}
// a cylinder between two points
function rod(a, b, r, mat, parent, segs = 16) {
  const d = b.clone().sub(a), L = d.length();
  const m = mesh(new THREE.CylinderGeometry(r, r, L, segs), mat, parent);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(v3(0, 1, 0), d.normalize());
  return m;
}
function tube(pts, r, mat, parent, segs = 64, closed = false) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => v3(...p)), closed, 'centripetal');
  const m = mesh(new THREE.TubeGeometry(c, segs, r, 14, closed), mat, parent);
  m.userData.curve = c;
  return m;
}
function shapeOf(pts, scale = 1) {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x * scale, y * scale) : s.moveTo(x * scale, y * scale)));
  return s;
}
function extrude(shape, depth, z0 = 0, opt = {}) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24, ...opt });
  g.translate(0, 0, z0);
  return g;
}
export function gearGeo(n, rTip, depth, hole = 0, sharp = false) {
  const m = 2 * rTip / (n + 2), rRoot = rTip - 2.3 * m, p = Math.PI * 2 / n;
  const s = new THREE.Shape();
  for (let j = 0; j < n; j++) {
    const a = j * p;
    const pts = sharp
      ? [[rRoot, a - 0.32 * p], [rTip, a - 0.06 * p], [rTip, a + 0.06 * p], [rRoot, a + 0.32 * p]]
      : [[rRoot, a - 0.27 * p], [rTip, a - 0.12 * p], [rTip, a + 0.12 * p], [rRoot, a + 0.27 * p]];
    pts.forEach(([r, b], i) => (j === 0 && i === 0 ? s.moveTo(r * Math.cos(b), r * Math.sin(b)) : s.lineTo(r * Math.cos(b), r * Math.sin(b))));
  }
  s.closePath();
  if (hole > 0) { const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.12, bevelSize: m * 0.15, bevelSegments: 1, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return g;
}
// loft closed superellipse sections along x
function loft(secs, n = 40, ex = 2.6) {
  const pos = [], idx = [];
  const ring = (s) => {
    const out = [];
    for (let j = 0; j < n; j++) {
      const a = j / n * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      const pz = Math.sign(c) * Math.abs(c) ** (2 / ex), py = Math.sign(sn) * Math.abs(sn) ** (2 / ex);
      out.push([s.x, s.yc + s.h * py, s.w * pz]);
    }
    return out;
  };
  const rings = secs.map(ring);
  rings.forEach((r) => r.forEach((p) => pos.push(...p)));
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < n; j++) {
      const a = i * n + j, b = i * n + (j + 1) % n, c = (i + 1) * n + (j + 1) % n, d = (i + 1) * n + j;
      idx.push(a, d, b, b, d, c);
    }
  // end caps
  for (const [ri, flip] of [[0, true], [rings.length - 1, false]]) {
    const s = secs[ri], ci = pos.length / 3; pos.push(s.x, s.yc, 0);
    for (let j = 0; j < n; j++) {
      const a = ri * n + j, b = ri * n + (j + 1) % n;
      flip ? idx.push(ci, b, a) : idx.push(ci, a, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function smooth(keys, u) {             // Catmull-Rom through evenly spaced keys
  const n = keys.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f), t = f - i;
  const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(n, i + 2)];
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}
function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const rnd = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
// spring: unit height along +y
function springGeo(R, wire, turns) {
  const pts = [];
  for (let i = 0; i <= turns * 24; i++) {
    const a = i / 24 * Math.PI * 2, y = i / (turns * 24);
    pts.push(v3(R * Math.cos(a), y, R * Math.sin(a)));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, wire, 6, false);
}
// closed chain loop around two sprockets in a plane: returns { L, at(s) -> [x, y, angle] }
export function chainLoop(A, ra, B, rb) {
  const dx = B[0] - A[0], dy = B[1] - A[1], D = Math.hypot(dx, dy), phi = Math.atan2(dy, dx);
  const beta = Math.acos((ra - rb) / D);
  const pA = (a) => [A[0] + ra * Math.cos(a), A[1] + ra * Math.sin(a)], pB = (a) => [B[0] + rb * Math.cos(a), B[1] + rb * Math.sin(a)];
  const a1 = phi + beta, a2 = phi - beta;
  const s1 = pA(a1), e1 = pB(a1), s2 = pB(a2), e2 = pA(a2);
  const L1 = Math.hypot(e1[0] - s1[0], e1[1] - s1[1]), LB = rb * 2 * beta, L2 = L1, LA = ra * (2 * Math.PI - 2 * beta);
  const L = L1 + LB + L2 + LA;
  function at(s) {
    s = ((s % L) + L) % L;
    if (s < L1) { const k = s / L1; return [s1[0] + (e1[0] - s1[0]) * k, s1[1] + (e1[1] - s1[1]) * k, Math.atan2(e1[1] - s1[1], e1[0] - s1[0])]; }
    s -= L1;
    if (s < LB) { const a = a1 - s / rb; const p = pB(a); return [p[0], p[1], a - Math.PI / 2]; }
    s -= LB;
    if (s < L2) { const k = s / L2; return [s2[0] + (e2[0] - s2[0]) * k, s2[1] + (e2[1] - s2[1]) * k, Math.atan2(e2[1] - s2[1], e2[0] - s2[0])]; }
    s -= L2;
    const a = a2 - s / ra; const p = pA(a); return [p[0], p[1], a - Math.PI / 2];
  }
  return { L, at };
}

// ----------------------------------------------------------------------------- materials
export const MAT = {
  alu: std('#b9bec4', 0.75, 0.38),
  aluDark: std('#8d939a', 0.7, 0.45),
  cast: std('#a7acb1', 0.6, 0.55),
  finBlack: std('#2a2c30', 0.35, 0.5),
  cut: std('#c2523c', 0.15, 0.55),
  steel: std('#c9ced3', 0.9, 0.28),
  darkSteel: std('#4c5157', 0.85, 0.4),
  chrome: std('#eef2f5', 1, 0.1),
  black: std('#16171a', 0.3, 0.5),
  rubber: std('#151515', 0, 0.88),
  paint: new THREE.MeshPhysicalMaterial({ color: '#b3141c', metalness: 0.35, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 }),
  frame: std('#121314', 0.45, 0.42),
  piston: std('#d3d6da', 0.7, 0.32),
  brass: std('#c79a45', 0.85, 0.35),
  copper: std('#b8673a', 0.85, 0.35),
  ceramic: std('#f2f0ea', 0, 0.35),
};

// ----------------------------------------------------------------------------- world
export function buildWorld() {
  const g = new THREE.Group();
  // sky dome: vertical gradient, warm near the horizon, with a sun glow
  const skyTex = canvasTex(16, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#3f78c4'); gr.addColorStop(0.38, '#86b4e3'); gr.addColorStop(0.47, '#f2d3a6'); gr.addColorStop(0.5, '#f6c48e');
    gr.addColorStop(0.53, '#c9b9a6'); gr.addColorStop(1, '#8a8d7a');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  }, [1, 1]);
  skyTex.wrapS = skyTex.wrapT = THREE.ClampToEdgeWrapping;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 24), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, toneMapped: true }));
  g.add(sky);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(16, 32), new THREE.MeshBasicMaterial({ color: '#fff2d0', fog: false }));
  const sunDir = v3(4, 2.2, 6).normalize();
  sun.position.copy(sunDir).multiplyScalar(380); sun.lookAt(0, 0, 0); g.add(sun);
  const glowTex = canvasTex(256, 256, (c, w) => {
    const gr = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,236,190,0.95)'); gr.addColorStop(0.25, 'rgba(255,200,130,0.4)'); gr.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = gr; c.fillRect(0, 0, w, w);
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false }));
  glow.position.copy(sunDir).multiplyScalar(370); glow.lookAt(0, 0, 0); g.add(glow);

  // ground: grass, a dirt shoulder by the bike, an asphalt road behind it
  const grass = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#5d7a32'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const x = rnd() * w, y = rnd() * h, l = 30 + rnd() * 40;
      c.fillStyle = `hsl(${78 + rnd() * 30},${35 + rnd() * 25}%,${l * 0.6}%)`; c.fillRect(x, y, 2, 3 + rnd() * 4);
    }
  }, [60, 60]);
  const ground = mesh(new THREE.PlaneGeometry(400, 400), std('#ffffff', 0, 0.95, { map: grass }), g, false);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.002;
  const dirt = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#9c8466'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 14000; i++) {
      const x = rnd() * w, y = rnd() * h, s = 1 + rnd() * 3;
      c.fillStyle = `hsl(${28 + rnd() * 14},${18 + rnd() * 20}%,${38 + rnd() * 28}%)`; c.fillRect(x, y, s, s);
    }
  }, [24, 2]);
  const shoulder = mesh(new THREE.PlaneGeometry(120, 5.2), std('#ffffff', 0, 0.97, { map: dirt }), g, false);
  shoulder.rotation.x = -Math.PI / 2; shoulder.position.set(0, 0, 0.9);
  const asphalt = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#4a4b4d'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 30000; i++) {
      const x = rnd() * w, y = rnd() * h, l = 22 + rnd() * 30;
      c.fillStyle = `rgb(${l * 2.2},${l * 2.2},${l * 2.25})`; c.fillRect(x, y, 2, 2);
    }
    c.fillStyle = '#e9e4d6';
    for (let x = 0; x < w; x += 256) c.fillRect(x, h / 2 - 6, 150, 12);   // centre dashes
    c.fillRect(0, 18, w, 9); c.fillRect(0, h - 27, w, 9);                   // edge lines
  }, [12, 1]);
  const road = mesh(new THREE.PlaneGeometry(120, 7), std('#ffffff', 0, 0.82, { map: asphalt }), g, false);
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.001, -5.2);

  // trees, poles and far hills
  const trunkG = new THREE.CylinderGeometry(0.12, 0.18, 2.4, 7); trunkG.translate(0, 1.2, 0);
  const leafG = new THREE.IcosahedronGeometry(1, 1);
  const trees = [];
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? 1 : -1;
    const x = -60 + rnd() * 120, z = side > 0 ? 7 + rnd() * 22 : -11 - rnd() * 24;
    trees.push([x, z, 0.8 + rnd() * 0.7]);
  }
  const trunks = new THREE.InstancedMesh(trunkG, std('#5b4632', 0, 0.9), trees.length);
  const leaves = new THREE.InstancedMesh(leafG, std('#ffffff', 0, 0.85), trees.length * 3);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  trees.forEach(([x, z, s], i) => {
    trunks.setMatrixAt(i, m4.compose(v3(x, 0, z), q, v3(s, s, s)));
    for (let k = 0; k < 3; k++) {
      const r = s * (1.3 + rnd() * 0.6);
      leaves.setMatrixAt(i * 3 + k, m4.compose(v3(x + (rnd() - 0.5) * s * 1.4, s * (2.6 + k * 0.7 + rnd() * 0.4), z + (rnd() - 0.5) * s * 1.4), q, v3(r, r * 0.85, r)));
      leaves.setColorAt(i * 3 + k, col.setHSL(0.24 + rnd() * 0.08, 0.45 + rnd() * 0.2, 0.22 + rnd() * 0.1));
    }
  });
  trunks.castShadow = leaves.castShadow = true;
  g.add(trunks, leaves);
  const poleM = std('#6d6257', 0, 0.85);
  for (let x = -55; x < 60; x += 22) {
    rod(v3(x, 0, -9.4), v3(x, 7.5, -9.4), 0.1, poleM, g, 8);
    rod(v3(x, 7.1, -10.1), v3(x, 7.1, -8.7), 0.05, poleM, g, 6);
  }
  const hillM = std('#7e8f83', 0, 1);
  for (const [z, seed] of [[-110, 1], [120, 2]]) {
    const hg = new THREE.PlaneGeometry(420, 60, 80, 6);
    const p = hg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i) + 30;
      const hgt = 14 + 9 * Math.sin(x * 0.021 + seed) + 6 * Math.sin(x * 0.057 + seed * 3) + 3 * Math.sin(x * 0.13);
      p.setY(i, (y / 60) * hgt);
    }
    hg.computeVertexNormals();
    const h = mesh(hg, hillM, g, false); h.position.set(0, 0, z); if (z > 0) h.rotation.y = Math.PI;
  }
  return { group: g, sunDir };
}

// ----------------------------------------------------------------------------- the engine
export function buildEngine() {
  const EG = new THREE.Group();
  EG.position.copy(EN.pos); EG.rotation.z = EN.tilt;
  const X = { case: [], cover: [], front: [] };
  const back = new THREE.Group(), front = new THREE.Group();
  EG.add(back, front);

  // --- crankcase (one solid, shown as x-ray when the inside matters)
  const caseC = new THREE.CatmullRomCurve3([[0.07, 0.065], [0.035, 0.082], [-0.04, 0.087], [-0.10, 0.10], [-0.16, 0.078], [-0.215, 0.02],
    [-0.225, -0.04], [-0.19, -0.097], [-0.11, -0.108], [-0.03, -0.088], [0.045, -0.068], [0.082, -0.02]].map(([x, y]) => v3(x, y, 0)), true, 'centripetal');
  const caseShape = new THREE.Shape(caseC.getPoints(80).map((p) => new THREE.Vector2(p.x, p.y)));
  const caseMat = MAT.cast.clone(); X.case.push(caseMat);
  mesh(new THREE.ExtrudeGeometry(caseShape, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.008, bevelSegments: 3, curveSegments: 60 }).translate(0, 0, -0.065), caseMat, EG);
  // side covers: clutch (right), magneto (left), sprocket cover
  const coverMat = MAT.alu.clone(); X.cover.push(coverMat);
  const cl = mesh(lathe([[0, 0], [0.083, 0], [0.086, 0.008], [0.084, 0.024], [0.07, 0.034], [0, 0.036]], 56), coverMat, EG);
  cl.rotation.x = Math.PI / 2; cl.position.set(EN.M[0], EN.M[1], 0.072); cl.rotation.z = 0; cl.scale.y = -1;
  const mg = mesh(lathe([[0, 0], [0.078, 0], [0.08, 0.008], [0.077, 0.03], [0.06, 0.042], [0, 0.044]], 56), coverMat, EG);
  mg.rotation.x = -Math.PI / 2; mg.position.set(0, 0, -0.072); mg.scale.y = -1;
  // cover bolts
  const boltG = new THREE.CylinderGeometry(0.0042, 0.0042, 0.005, 6); boltG.rotateX(Math.PI / 2);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2;
    mesh(boltG, MAT.steel, EG).position.set(EN.M[0] + 0.078 * Math.cos(a), EN.M[1] + 0.078 * Math.sin(a), 0.082);
    mesh(boltG, MAT.steel, EG).position.set(0.073 * Math.cos(a), 0.073 * Math.sin(a), -0.082);
  }

  // --- cylinder: a liner and square fins, built as the back half; the front half is a mirror copy
  const R0 = EN.bore, RL = 0.034, FO = 0.058;
  mesh(lathe([[R0, 0.052], [RL, 0.052], [RL, EN.deck], [R0, EN.deck], [R0, 0.052]], 40, Math.PI / 2, Math.PI), MAT.steel, back);
  const finYs = [];
  for (let y = 0.074; y < EN.deck - 0.004; y += 0.0084) finYs.push(y);
  const finShape = new THREE.Shape();
  finShape.moveTo(-FO, 0); finShape.lineTo(-FO, -FO + 0.01); finShape.quadraticCurveTo(-FO, -FO, -FO + 0.01, -FO);
  finShape.lineTo(FO - 0.01, -FO); finShape.quadraticCurveTo(FO, -FO, FO, -FO + 0.01); finShape.lineTo(FO, 0);
  finShape.lineTo(RL - 0.001, 0); finShape.absarc(0, 0, RL - 0.001, 0, -Math.PI, true); finShape.lineTo(-FO, 0);
  const finG = new THREE.ExtrudeGeometry(finShape, { depth: 0.0028, bevelEnabled: false, curveSegments: 24 }); finG.rotateX(Math.PI / 2);
  const finMat = MAT.finBlack.clone();
  for (const y of finYs) mesh(finG, finMat, back).position.y = y + 0.0028;
  // the section face of the cylinder wall and fins (at z = 0)
  function combShape(sgn) {
    const p = [[R0, 0.052], [R0, EN.deck], [RL, EN.deck]];
    for (let i = finYs.length - 1; i >= 0; i--) { const y = finYs[i]; p.push([RL, y + 0.0028], [FO, y + 0.0028], [FO, y], [RL, y]); }
    p.push([RL, 0.052]);
    return shapeOf(p.map(([x, y]) => [sgn * x, y]));
  }
  for (const s of [-1, 1]) { const m = mesh(new THREE.ShapeGeometry(combShape(s)), MAT.cut, back, false); m.position.z = 0.0003; }

  // --- head: section islands (ports and combustion dome carved), a solid back slab, fins, rocker cover
  const mm = (pts) => pts.map(([x, y]) => [x * 0.001, y * 0.001]);
  const HT = 0.222;
  const islands = [
    mm([[-62, 160], [-28.5, 160], [-25, 170], [-40, 183], [-62, 198]]),
    mm([[28.5, 160], [62, 160], [62, 180], [36, 176], [22, 170]]),
    mm([[-62, 216], [-35, 200], [-12, 186], [-1, 178], [2, 178], [12, 184], [36, 192], [62, 196], [62, 222], [-62, 222]]),
  ];
  const headMat = MAT.alu.clone();
  for (const isl of islands) mesh(extrude(shapeOf(isl), 0.03, -0.03), [MAT.cut, headMat], back);
  mesh(extrude(shapeOf(mm([[-62, 160], [62, 160], [62, 222], [-62, 222]])), 0.032, -0.062), headMat, back);
  const hfin = new THREE.Shape();
  hfin.moveTo(-0.072, 0); hfin.lineTo(-0.072, -0.072); hfin.lineTo(0.072, -0.072); hfin.lineTo(0.072, 0);
  hfin.lineTo(0.062, 0); hfin.lineTo(0.062, -0.062); hfin.lineTo(-0.062, -0.062); hfin.lineTo(-0.062, 0);
  const hfinG = new THREE.ExtrudeGeometry(hfin, { depth: 0.0028, bevelEnabled: false }); hfinG.rotateX(Math.PI / 2);
  for (let y = 0.166; y < HT - 0.003; y += 0.0084) mesh(hfinG, headMat, back).position.y = y + 0.0028;
  // rocker cover: a hollow shell (arch ring + back plate)
  const arch = (o) => {
    const s = new THREE.Shape();
    s.moveTo(-0.058 + o, HT); s.lineTo(-0.058 + o, 0.27 - o * 0.3); s.quadraticCurveTo(-0.058 + o, 0.30 - o, -0.03, 0.30 - o);
    s.lineTo(0.03, 0.30 - o); s.quadraticCurveTo(0.058 - o, 0.30 - o, 0.058 - o, 0.27 - o * 0.3); s.lineTo(0.058 - o, HT);
    return s;
  };
  const ringS = arch(0); const inner = arch(0.0045);
  const innerPts = inner.getPoints(24).reverse();
  innerPts.forEach((p) => ringS.lineTo(p.x, p.y)); ringS.closePath();
  const coverHeadMat = MAT.alu.clone();
  mesh(extrude(ringS, 0.054, -0.054), [MAT.cut, coverHeadMat], back);
  mesh(extrude(arch(0), 0.004, -0.058), coverHeadMat, back);
  // gasket line
  mesh(new THREE.BoxGeometry(0.124, 0.0016, 0.062).translate(0, EN.deck, -0.031), MAT.darkSteel, back);

  // front half: mirror copies with their own materials so they can fade
  const fmats = new Map();
  back.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const cl = mats.map((m) => { if (!fmats.has(m)) { const c = m.clone(); c.side = THREE.DoubleSide; fmats.set(m, c); } return fmats.get(m); });
    const c = new THREE.Mesh(o.geometry, Array.isArray(o.material) ? cl : cl[0]);
    c.position.copy(o.position); c.rotation.copy(o.rotation); c.scale.copy(o.scale); c.castShadow = true; c.receiveShadow = true;
    front.add(c);
  });
  front.scale.z = -1;
  for (const m of fmats.values()) X.front.push(m);
  back.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) m.side = THREE.DoubleSide; });
  const heat = [finMat, fmats.get(finMat), headMat, fmats.get(headMat)];

  // --- crankshaft
  const crank = new THREE.Group(); EG.add(crank);
  const web = new THREE.Shape();
  const RW = 0.052, a0 = 200 * Math.PI / 180, a1 = 340 * Math.PI / 180;
  web.moveTo(RW * Math.cos(a0), RW * Math.sin(a0)); web.absarc(0, 0, RW, a0, a1, false);
  web.lineTo(0.019, EN.r); web.absarc(0, EN.r, 0.019, 0, Math.PI, false); web.closePath();
  const webG = new THREE.ExtrudeGeometry(web, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 40 });
  const webMat = MAT.darkSteel.clone();
  const webs = [mesh(webG, webMat, crank), mesh(webG, webMat, crank)];
  webs[0].position.z = 0.008; webs[1].position.z = -0.021;
  const pin = mesh(new THREE.CylinderGeometry(0.0115, 0.0115, 0.018, 24).rotateX(Math.PI / 2), MAT.steel, crank); pin.position.y = EN.r;
  mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 24).rotateX(Math.PI / 2), MAT.steel, crank);
  const prim = mesh(gearGeo(22, EN.rPrim, 0.012, 0.012), MAT.steel, crank); prim.position.z = 0.058;
  const csp = mesh(gearGeo(14, 0.0125, 0.006, 0.006, true), MAT.darkSteel, crank); csp.position.z = -0.045;
  // magneto flywheel (a heavy steel cup with magnets) on the left end
  const fw = mesh(lathe([[0.012, 0], [0.066, 0], [0.068, 0.004], [0.068, 0.03], [0.062, 0.03], [0.062, 0.006], [0.012, 0.006]], 56), MAT.darkSteel, crank);
  fw.rotation.x = -Math.PI / 2; fw.position.z = -0.062;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    const mgt = mesh(new THREE.BoxGeometry(0.018, 0.006, 0.022), MAT.black, crank);
    mgt.position.set(0.058 * Math.cos(a), 0.058 * Math.sin(a), -0.08); mgt.rotation.z = a + Math.PI / 2;
  }

  // --- connecting rod: one plate with the big end and small end
  const conrod = new THREE.Group(); EG.add(conrod);
  const R1 = 0.02, R2 = 0.011, Lr = EN.L;
  const ang = Math.asin((R1 - R2) / Lr);
  const rs = new THREE.Shape();
  rs.moveTo(R1 * Math.cos(-ang), R1 * Math.sin(-ang));
  rs.lineTo(R2 * Math.cos(-ang), Lr + R2 * Math.sin(-ang));
  rs.absarc(0, Lr, R2, -ang, Math.PI + ang, false);
  rs.lineTo(-R1 * Math.cos(-ang), R1 * Math.sin(-ang));
  rs.absarc(0, 0, R1, Math.PI + ang, Math.PI * 2 - ang, false);
  const h1 = new THREE.Path(); h1.absarc(0, 0, 0.0122, 0, Math.PI * 2, true);
  const h2 = new THREE.Path(); h2.absarc(0, Lr, 0.0072, 0, Math.PI * 2, true);
  rs.holes.push(h1, h2);
  const rodMat = MAT.steel.clone();
  mesh(new THREE.ExtrudeGeometry(rs, { depth: 0.011, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.001, bevelSegments: 2, curveSegments: 32 }).translate(0, 0, -0.0055), rodMat, conrod);
  // I-beam groove
  const gr = mesh(new THREE.BoxGeometry(0.006, Lr - 0.05, 0.002), MAT.darkSteel, conrod); gr.position.set(0, Lr / 2 + 0.004, 0.0062);
  for (const s of [-1, 1]) { const b = mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.016, 6), MAT.darkSteel, conrod); b.position.set(s * 0.0165, 0.004, 0); }
  // big-end bearing ring
  const brg = mesh(new THREE.TorusGeometry(0.0121, 0.0012, 8, 32), MAT.brass, conrod); brg.position.z = 0.0058;

  // --- piston with rings and pin
  const piston = new THREE.Group(); EG.add(piston);
  const pistonMat = MAT.piston.clone();
  mesh(lathe([[0, 0.0226], [0.012, 0.0224], [0.024, 0.0214], [0.0279, 0.0198], [0.0282, 0.0185], [0.0282, -0.026], [0.0255, -0.0265], [0, -0.0265]], 48), pistonMat, piston);
  for (const y of [0.0165, 0.0125, 0.0085]) { const t = mesh(new THREE.TorusGeometry(0.0283, 0.00075, 6, 48), MAT.darkSteel, piston); t.rotation.x = Math.PI / 2; t.position.y = y; }
  const ppin = mesh(new THREE.CylinderGeometry(0.0072, 0.0072, 0.0566, 20).rotateX(Math.PI / 2), MAT.steel, piston);
  const crown = mesh(new THREE.CircleGeometry(0.0232, 40), std('#6e6458', 0.4, 0.6), piston, false);
  crown.rotation.x = -Math.PI / 2; crown.position.y = 0.0227;

  // --- valves, springs, retainers
  const vmesh = (rh) => lathe([[0, 0], [rh, 0], [rh, 0.0014], [0.006, 0.006], [0.0032, 0.011], [0.0029, 0.016], [0.0029, 0.088], [0, 0.088]], 32);
  function valveSet(V, mat) {
    const g = new THREE.Group(); EG.add(g);
    const d = v3(V.d[0], V.d[1], 0);
    g.position.set(V.s[0], V.s[1], 0);
    g.quaternion.setFromUnitVectors(v3(0, 1, 0), d);
    const valve = mesh(vmesh(V.rh), mat, g);
    const spr = mesh(springGeo(0.0085, 0.00115, 6), MAT.steel, g);
    const ret = mesh(lathe([[0.003, 0], [0.0105, 0.0015], [0.0105, 0.003], [0.003, 0.004]], 24), MAT.darkSteel, g);
    const seat = mesh(new THREE.TorusGeometry(V.rh - 0.0004, 0.0009, 6, 32), MAT.darkSteel, g); seat.rotation.x = Math.PI / 2; seat.position.y = 0.0007;
    return { g, valve, spr, ret };
  }
  const valveI = valveSet(EN.vI, std('#c4c8cc', 0.85, 0.3));
  const valveE = valveSet(EN.vE, std('#9b8f84', 0.75, 0.4));

  // --- camshaft (two lobes) and the cam sprocket
  const cam = new THREE.Group(); cam.position.set(0, EN.camY, 0); EG.add(cam);
  mesh(new THREE.CylinderGeometry(0.0062, 0.0062, 0.1, 20).rotateX(Math.PI / 2), MAT.steel, cam).position.z = -0.012;
  function lobeGeo(tip) {
    const s = new THREE.Shape();
    for (let i = 0; i <= 96; i++) {
      const a = i / 96 * Math.PI * 2, r = EN.camBase + EN.camLift * camBump(a - tip);
      i ? s.lineTo(r * Math.cos(a), r * Math.sin(a)) : s.moveTo(r * Math.cos(a), r * Math.sin(a));
    }
    return new THREE.ExtrudeGeometry(s, { depth: 0.009, bevelEnabled: true, bevelThickness: 0.0006, bevelSize: 0.0006, bevelSegments: 1 });
  }
  const lobeMat = std('#d9dde1', 0.9, 0.22);
  mesh(lobeGeo(LOBE.I), lobeMat, cam).position.z = -0.0135;
  mesh(lobeGeo(LOBE.E), lobeMat, cam).position.z = 0.0045;
  const camSp = mesh(gearGeo(28, 0.025, 0.006, 0.006, true), MAT.darkSteel, cam); camSp.position.z = -0.045;
  for (let i = 0; i < 4; i++) { const h = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.008, 12).rotateX(Math.PI / 2), MAT.black, cam); h.position.set(0.0135 * Math.cos(i * 1.57 + 0.78), 0.0135 * Math.sin(i * 1.57 + 0.78), -0.0445); }

  // --- rockers: pivoted levers, cam pad on one end, valve pad on the other
  function rocker(R, z) {
    const g = new THREE.Group(); g.position.set(R.p[0], R.p[1], z); EG.add(g);
    const m = std('#aeb3b8', 0.85, 0.3);
    for (const e of [R.f, R.v]) {
      const dx = e[0] - R.p[0], dy = e[1] - R.p[1], L = Math.hypot(dx, dy);
      const arm = mesh(new THREE.BoxGeometry(L, 0.006, 0.008), m, g);
      arm.position.set(dx / 2, dy / 2, 0); arm.rotation.z = Math.atan2(dy, dx);
      const pad = mesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.009, 14).rotateX(Math.PI / 2), MAT.steel, g); pad.position.set(dx, dy, 0);
    }
    mesh(new THREE.CylinderGeometry(0.0052, 0.0052, 0.01, 18).rotateX(Math.PI / 2), MAT.darkSteel, g);
    const shaft = mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.05, 10).rotateX(Math.PI / 2), MAT.steel, EG);
    shaft.position.set(R.p[0], R.p[1], -0.025);
    return g;
  }
  const rockI = rocker(EN.rI, -0.009), rockE = rocker(EN.rE, 0.009);

  // --- cam chain
  const camLoop = chainLoop([0, 0], 0.0125, [0, EN.camY], 0.025);
  const nCam = Math.round(camLoop.L / 0.00635);
  const camChain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0072, 0.0028, 0.006), MAT.darkSteel, nCam);
  camChain.position.z = -0.045; EG.add(camChain); camChain.castShadow = true;

  // --- spark plug, entering the head from the right side
  const plug = new THREE.Group(); plug.position.set(...EN.plugTip); EG.add(plug);
  plug.quaternion.setFromUnitVectors(v3(0, 1, 0), v3(...EN.plugDir).normalize());
  mesh(lathe([[0, -0.002], [0.0012, -0.002], [0.0012, 0.004], [0.006, 0.004], [0.007, 0.022], [0.0105, 0.022], [0.0105, 0.034], [0.006, 0.034], [0.0062, 0.046], [0, 0.046]], 6 * 4), MAT.steel, plug);
  mesh(lathe([[0, 0.034], [0.0062, 0.034], [0.0056, 0.07], [0.004, 0.072], [0, 0.072]], 28), MAT.ceramic, plug);
  mesh(lathe([[0, 0.066], [0.0085, 0.066], [0.0092, 0.1], [0.006, 0.112], [0, 0.112]], 24), std('#1d1d1f', 0, 0.55), plug);
  const lead = tube([[0, 0.11, 0], [0.002, 0.15, -0.01], [-0.02, 0.2, -0.06], [-0.07, 0.24, -0.12]], 0.0035, std('#111', 0, 0.6), plug, 24);
  const spark = mesh(new THREE.SphereGeometry(0.0032, 12, 10), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, toneMapped: false }), plug, false);
  spark.position.y = -0.0035;

  // --- gearbox: primary drive, clutch, two shafts with gear pairs, output sprocket
  const mainS = new THREE.Group(); mainS.position.set(EN.M[0], EN.M[1], 0); EG.add(mainS);
  const ctrS = new THREE.Group(); ctrS.position.set(EN.C[0], EN.C[1], 0); EG.add(ctrS);
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.17, 16).rotateX(Math.PI / 2), MAT.steel, mainS).position.z = 0.0;
  mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.16, 16).rotateX(Math.PI / 2), MAT.steel, ctrS).position.z = -0.03;
  const gearMat = std('#cdd2d6', 0.9, 0.28);
  const clutchG = mesh(gearGeo(56, EN.rClutch, 0.01, 0.015), gearMat, mainS); clutchG.position.z = 0.058;
  const basket = mesh(lathe([[0.02, 0], [0.066, 0], [0.066, 0.026], [0.062, 0.026], [0.062, 0.004], [0.02, 0.004]], 48), MAT.aluDark, mainS);
  basket.rotation.x = Math.PI / 2; basket.position.z = 0.09; basket.scale.y = -1;
  for (let i = 0; i < 7; i++) {
    const p = mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.0022, 40).rotateX(Math.PI / 2), i % 2 ? MAT.copper : MAT.steel, mainS);
    p.position.z = 0.068 + i * 0.0032;
  }
  const mainGears = [], ctrGears = [];
  EN.pairs.forEach(([rm, rc, z]) => {
    const a = mesh(gearGeo(Math.round(rm * 900), rm, 0.011, 0.008), gearMat, mainS); a.position.z = z; mainGears.push(a);
    const b = mesh(gearGeo(Math.round(rc * 900), rc, 0.011, 0.009), gearMat, EG); b.position.set(EN.C[0], EN.C[1], z); ctrGears.push(b);
  });
  const outSp = mesh(gearGeo(14, EN.rFront, 0.008, 0.009, true), MAT.darkSteel, ctrS); outSp.position.z = EN.chainZ;

  // --- intake: manifold and carburettor at the back of the head
  const intake = new THREE.Group(); EG.add(intake);
  rod(v3(-0.062, 0.207, 0), v3(-0.098, 0.211, 0), 0.014, MAT.black, intake, 20);
  const carb = rod(v3(-0.098, 0.211, 0), v3(-0.148, 0.215, 0), 0.019, MAT.cast, intake, 24);
  rod(v3(-0.122, 0.213, 0), v3(-0.122, 0.262, 0), 0.016, MAT.alu, intake, 20);
  mesh(new THREE.SphereGeometry(0.02, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), MAT.alu, intake).position.set(-0.122, 0.262, 0);
  rod(v3(-0.122, 0.21, 0), v3(-0.122, 0.168, 0), 0.02, MAT.alu, intake, 20);
  rod(v3(-0.148, 0.215, 0), v3(-0.19, 0.222, 0), 0.02, MAT.rubber, intake, 20);
  const fuelLine = tube([[-0.118, 0.27, 0.018], [-0.1, 0.32, 0.03], [-0.04, 0.40, 0.02]], 0.0032, std('#3a3a3a', 0, 0.5), intake, 20);

  // header attaches at the exhaust port on the front of the head
  const portE = v3(0.062, 0.188, 0), portI = v3(-0.062, 0.207, 0);

  // kick-start lever and gear lever
  const kick = new THREE.Group(); kick.position.set(-0.13, 0.0, 0.11); EG.add(kick);
  rod(v3(0, 0, 0), v3(-0.07, -0.13, 0.01), 0.0065, MAT.chrome, kick, 12);
  rod(v3(-0.07, -0.13, 0.01), v3(-0.07, -0.13, 0.06), 0.008, MAT.rubber, kick, 12);

  EG.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return {
    EG, back, front, X, heat, crank, conrod, piston, valveI, valveE, cam, rockI, rockE, camChain, camLoop, plug, spark, lead,
    mainS, ctrS, clutchG, mainGears, ctrGears, outSp, webs, webMat, rodMat, pistonMat, gearMat, portE, portI, carb,
    headMat, finMat, coverHeadMat,
  };
}

// ----------------------------------------------------------------------------- the motorcycle
export function buildBike(E) {
  const g = new THREE.Group();
  const toW = (x, y, z = 0) => v3(x, y, z).applyMatrix4(new THREE.Matrix4().compose(EN.pos, new THREE.Quaternion().setFromAxisAngle(v3(0, 0, 1), EN.tilt), v3(1, 1, 1)));

  // --- wheels
  const treadTex = canvasTex(1024, 128, (c, w, h) => {
    c.fillStyle = '#808080'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#202020';
    for (let i = 0; i < 64; i++) {
      const x = i / 64 * w;
      c.save(); c.translate(x, h / 2);
      c.beginPath(); c.moveTo(-3, -40); c.lineTo(5, -40); c.lineTo(-2, 0); c.lineTo(5, 40); c.lineTo(-3, 40); c.lineTo(-10, 0); c.closePath(); c.fill();
      c.fillRect(2, -10, 9, 4);
      c.restore();
    }
    c.fillRect(0, 0, w, 14); c.fillRect(0, h - 14, w, 14);
  }, [1, 1], false);
  const tyreMat = std('#1a1a1a', 0, 0.86, { bumpMap: treadTex, bumpScale: 3 });
  function wheel(pos, rear) {
    const w = new THREE.Group(); w.position.set(pos[0], pos[1], 0); g.add(w);
    const spin = new THREE.Group(); w.add(spin);
    const tyre = mesh(lathe([[0.231, -0.036], [0.247, -0.046], [0.27, -0.047], [0.29, -0.036], [0.3, -0.016], [0.3, 0.016], [0.29, 0.036], [0.27, 0.047], [0.247, 0.046], [0.231, 0.036]], 96), tyreMat, spin);
    tyre.rotation.x = Math.PI / 2;
    const rim = mesh(lathe([[0.231, -0.034], [0.222, -0.034], [0.212, -0.026], [0.21, 0], [0.212, 0.026], [0.222, 0.034], [0.231, 0.034]], 72), MAT.black, spin);
    rim.rotation.x = Math.PI / 2;
    const lip = mesh(new THREE.TorusGeometry(0.2305, 0.0028, 6, 72), MAT.steel, spin); lip.position.z = 0.034;
    const lip2 = mesh(new THREE.TorusGeometry(0.2305, 0.0028, 6, 72), MAT.steel, spin); lip2.position.z = -0.034;
    // five split spokes
    const sp = new THREE.Shape(); sp.moveTo(0.05, -0.016); sp.lineTo(0.212, -0.009); sp.lineTo(0.212, 0.009); sp.lineTo(0.05, 0.016); sp.closePath();
    const spG = new THREE.ExtrudeGeometry(sp, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 }); spG.translate(0, 0, -0.008);
    for (let i = 0; i < 10; i++) { const s = mesh(spG, MAT.black, spin); s.rotation.z = (Math.floor(i / 2) / 5) * Math.PI * 2 + (i % 2 ? 0.16 : -0.16); }
    const hub = mesh(lathe([[0.012, -0.07], [0.05, -0.06], [0.055, -0.03], [0.055, 0.03], [0.05, 0.06], [0.012, 0.07]], 40), MAT.alu, spin); hub.rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.24, 14).rotateX(Math.PI / 2), MAT.steel, w);
    if (rear) {
      const drum = mesh(lathe([[0.03, 0], [0.085, 0], [0.087, 0.03], [0.03, 0.034]], 48), MAT.alu, w); drum.rotation.x = Math.PI / 2; drum.position.z = 0.062; drum.scale.y = -1;
      const sprk = mesh(gearGeo(42, EN.rRear, 0.005, 0.05, true), MAT.steel, spin); sprk.position.z = EN.chainZ;
    } else {
      const disc = new THREE.Shape(); disc.absarc(0, 0, 0.12, 0, Math.PI * 2, false);
      const hole = new THREE.Path(); hole.absarc(0, 0, 0.075, 0, Math.PI * 2, true); disc.holes.push(hole);
      for (let i = 0; i < 18; i++) { const h = new THREE.Path(); const a = i / 18 * Math.PI * 2; h.absarc(0.1 * Math.cos(a), 0.1 * Math.sin(a), 0.0045, 0, Math.PI * 2, true); disc.holes.push(h); }
      const d = mesh(new THREE.ExtrudeGeometry(disc, { depth: 0.004, bevelEnabled: false, curveSegments: 48 }), std('#b7bcc1', 1, 0.3), spin); d.position.z = -0.068;
      const cal = mesh(new THREE.BoxGeometry(0.05, 0.075, 0.03), MAT.black, w); cal.position.set(-0.085, 0.07, -0.07); cal.rotation.z = 0.7;
    }
    return { w, spin };
  }
  const rear = wheel(BK.RA, true), front = wheel(BK.FA, false);

  // --- front end: fork, yokes, headlight, bars, mirrors, speedo, mudguard
  const fdir = v3(-Math.sin(0.454), Math.cos(0.454), 0);
  const FA = v3(BK.FA[0], BK.FA[1], 0);
  for (const z of [-0.08, 0.08]) {
    const a = FA.clone().setZ(z);
    rod(a, a.clone().addScaledVector(fdir, 0.3), 0.023, MAT.alu, g, 20);
    rod(a.clone().addScaledVector(fdir, 0.26), a.clone().addScaledVector(fdir, 0.64), 0.0175, MAT.chrome, g, 20);
    const gaiter = rod(a.clone().addScaledVector(fdir, 0.28), a.clone().addScaledVector(fdir, 0.36), 0.021, MAT.rubber, g, 16);
  }
  const yokeB = FA.clone().addScaledVector(fdir, 0.5), yokeT = FA.clone().addScaledVector(fdir, 0.63);
  for (const y of [yokeB, yokeT]) { const m = mesh(new THREE.BoxGeometry(0.06, 0.022, 0.21), MAT.black, g); m.position.copy(y); m.rotation.z = 0.454; }
  rod(yokeB.clone().addScaledVector(fdir, -0.02), yokeT.clone().addScaledVector(fdir, 0.03), 0.026, MAT.frame, g, 16);   // head tube
  const lamp = new THREE.Group(); lamp.position.copy(yokeB).add(v3(0.105, -0.01, 0)); g.add(lamp);
  const bowl = mesh(lathe([[0, -0.07], [0.05, -0.065], [0.08, -0.035], [0.088, 0], [0.09, 0.006], [0, 0.006]], 40), MAT.black, lamp); bowl.rotation.z = -Math.PI / 2;
  const rimL = mesh(new THREE.TorusGeometry(0.087, 0.006, 10, 48), MAT.chrome, lamp); rimL.rotation.y = Math.PI / 2; rimL.position.x = 0.006;
  const lens = mesh(new THREE.SphereGeometry(0.09, 32, 16, 0, Math.PI * 2, 0, 0.5), new THREE.MeshPhysicalMaterial({ color: '#fff8e8', emissive: '#ffe9b8', emissiveIntensity: 0.6, roughness: 0.05, transmission: 0, metalness: 0 }), lamp);
  lens.rotation.z = -Math.PI / 2; lens.position.x = -0.075;
  const cowl = mesh(new THREE.SphereGeometry(0.115, 32, 16, 0, Math.PI, 0, Math.PI / 2), MAT.paint, lamp); cowl.rotation.set(0, Math.PI / 2, -0.5); cowl.scale.set(1, 0.7, 1); cowl.position.set(-0.02, 0.03, 0);
  for (const s of [-1, 1]) { const ind = mesh(new THREE.SphereGeometry(0.022, 14, 10), std('#ffa21a', 0.1, 0.3, { emissive: '#7a3d00' }), g); ind.position.copy(yokeB).add(v3(0.06, -0.02, s * 0.15)); ind.scale.set(1.5, 0.8, 0.8); rod(yokeB.clone().add(v3(0.02, -0.02, s * 0.06)), ind.position, 0.006, MAT.black, g); }
  const speedo = new THREE.Group(); speedo.position.copy(yokeT).add(v3(0.04, 0.05, 0)); g.add(speedo);
  mesh(lathe([[0, -0.03], [0.06, -0.022], [0.065, 0.0], [0.06, 0.008], [0, 0.008]], 36), MAT.black, speedo);
  const dial = mesh(new THREE.CircleGeometry(0.055, 40), std('#ffffff', 0, 0.4, { map: canvasTex(256, 256, (c, w) => {
    c.fillStyle = '#101418'; c.fillRect(0, 0, w, w); c.strokeStyle = '#e8edf2'; c.lineWidth = 6;
    for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.8 + 1.4 * i / 12); c.beginPath(); c.moveTo(128 + 100 * Math.cos(a), 128 + 100 * Math.sin(a)); c.lineTo(128 + 84 * Math.cos(a), 128 + 84 * Math.sin(a)); c.stroke(); }
    c.strokeStyle = '#ff5533'; c.lineWidth = 7; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + 80 * Math.cos(3.6), 128 + 80 * Math.sin(3.6)); c.stroke();
  }) }), speedo, false);
  dial.rotation.x = -Math.PI / 2; dial.rotation.z = Math.PI / 2; dial.position.y = 0.0085; speedo.rotation.z = 0.5;
  const barC = yokeT.clone().add(v3(-0.01, 0.025, 0));
  for (const s of [-1, 1]) {
    tube([[barC.x, barC.y, 0], [barC.x - 0.02, barC.y + 0.03, s * 0.15], [barC.x - 0.07, barC.y + 0.05, s * 0.29], [barC.x - 0.08, barC.y + 0.052, s * 0.37]], 0.011, MAT.chrome, g, 24);
    rod(v3(barC.x - 0.075, barC.y + 0.051, s * 0.30), v3(barC.x - 0.082, barC.y + 0.053, s * 0.4), 0.016, MAT.rubber, g, 16);
    const lever = tube([[barC.x - 0.05, barC.y + 0.05, s * 0.25], [barC.x - 0.0, barC.y + 0.045, s * 0.3], [barC.x + 0.005, barC.y + 0.04, s * 0.37]], 0.005, MAT.alu, g, 12);
    const stalk = tube([[barC.x - 0.04, barC.y + 0.045, s * 0.22], [barC.x - 0.05, barC.y + 0.14, s * 0.25], [barC.x - 0.06, barC.y + 0.24, s * 0.28]], 0.005, MAT.black, g, 16);
    const mir = mesh(new THREE.SphereGeometry(0.055, 24, 14), MAT.black, g); mir.position.set(barC.x - 0.065, barC.y + 0.27, s * 0.29); mir.scale.set(0.35, 0.65, 1);
    const glass = mesh(new THREE.CircleGeometry(0.05, 24), MAT.chrome, g); glass.position.set(barC.x - 0.085, barC.y + 0.27, s * 0.29); glass.rotation.y = -Math.PI / 2; glass.scale.set(1, 0.62, 1);
  }
  const mg = mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.11, 32, 1, true, Math.PI - 0.75, 1.75), MAT.paint, g);
  mg.rotation.x = Math.PI / 2; mg.position.set(BK.FA[0], BK.FA[1], 0);

  // --- frame tubes
  const head = yokeB.clone().addScaledVector(fdir, 0.06);
  tube([[head.x - 0.02, head.y + 0.04, 0], [0.25, 0.775, 0], [0.02, 0.715, 0], [-0.13, 0.67, 0], [-0.2, 0.52, 0], [-0.205, 0.42, 0]], 0.022, MAT.frame, g);
  tube([[head.x, head.y - 0.03, 0], [0.34, 0.6, 0], [0.26, 0.42, 0], [0.17, 0.29, 0]], 0.021, MAT.frame, g);
  for (const s of [-1, 1]) {
    tube([[-0.13, 0.69, s * 0.03], [-0.35, 0.735, s * 0.085], [-0.6, 0.77, s * 0.085], [-0.74, 0.79, s * 0.07]], 0.014, MAT.frame, g);
    tube([[-0.21, 0.42, s * 0.06], [-0.33, 0.58, s * 0.085], [-0.45, 0.74, s * 0.085]], 0.013, MAT.frame, g);
  }
  // engine mounts
  for (const p of [[0.17, 0.29], [-0.205, 0.42]]) { const m = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 12).rotateX(Math.PI / 2), MAT.darkSteel, g); m.position.set(p[0], p[1], 0); }

  // --- swingarm, shocks, chain
  const RA = v3(BK.RA[0], BK.RA[1], 0), PV = v3(BK.pivot[0], BK.pivot[1], 0);
  for (const s of [-1, 1]) {
    const a = PV.clone().setZ(s * 0.075), b = RA.clone().setZ(s * 0.105);
    const d = b.clone().sub(a), L = d.length();
    const arm = mesh(new THREE.BoxGeometry(L, 0.04, 0.022), MAT.frame, g);
    arm.position.copy(a).addScaledVector(d, 0.5); arm.quaternion.setFromUnitVectors(v3(1, 0, 0), d.normalize());
    // shock absorber: chrome spring over a damper
    const lo = RA.clone().add(v3(0.06, 0.035, s * 0.12)), hi = v3(-0.5, 0.765, s * 0.105);
    const sd = hi.clone().sub(lo), SL = sd.length();
    rod(lo, lo.clone().addScaledVector(sd, 0.55), 0.016, MAT.black, g, 16);
    rod(lo.clone().addScaledVector(sd, 0.45), hi, 0.012, MAT.chrome, g, 16);
    const spr = mesh(springGeo(0.022, 0.0035, 9), std('#c8202a', 0.4, 0.4), g);
    spr.position.copy(lo).addScaledVector(sd, 0.12); spr.quaternion.setFromUnitVectors(v3(0, 1, 0), sd.clone().normalize()); spr.scale.y = SL * 0.72;
    for (const e of [lo, hi]) { const ey = mesh(new THREE.TorusGeometry(0.013, 0.006, 8, 20), MAT.chrome, g); ey.position.copy(e); }
  }
  mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.17, 14).rotateX(Math.PI / 2), MAT.frame, g).position.copy(PV);
  const sprW = toW(EN.C[0], EN.C[1], EN.chainZ);
  const chain = chainLoop([sprW.x, sprW.y], EN.rFront, [BK.RA[0], BK.RA[1]], EN.rRear);
  const nLinks = Math.round(chain.L / 0.0127);
  const linkG = new THREE.BoxGeometry(0.0142, 0.0068, 0.0028);
  const plates = new THREE.InstancedMesh(linkG, MAT.darkSteel, nLinks * 2);
  const rollers = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0034, 0.0034, 0.0075, 8).rotateX(Math.PI / 2), MAT.steel, nLinks);
  plates.castShadow = rollers.castShadow = true;
  g.add(plates, rollers);

  // --- tank, seat, side panels, tail
  const tk = { yt: [0.8, 0.865, 0.925, 0.955, 0.94, 0.875], yb: [0.735, 0.72, 0.712, 0.722, 0.745, 0.79], w: [0.1, 0.152, 0.17, 0.168, 0.145, 0.07] };
  const tsecs = [];
  for (let i = 0; i <= 28; i++) {
    const u = i / 28, yt = smooth(tk.yt, u), yb = smooth(tk.yb, u);
    tsecs.push({ x: -0.1 + 0.44 * u, yc: (yt + yb) / 2, h: (yt - yb) / 2, w: smooth(tk.w, u) });
  }
  const tank = mesh(loft(tsecs, 48, 2.7), MAT.paint, g);
  const cap = mesh(new THREE.CylinderGeometry(0.035, 0.038, 0.012, 32), MAT.chrome, g); cap.position.set(0.17, 0.955, 0); cap.rotation.z = 0.08;
  for (const s of [-1, 1]) {
    const pad = mesh(new THREE.SphereGeometry(0.06, 24, 16), MAT.rubber, g); pad.position.set(0.0, 0.79, s * 0.15); pad.scale.set(1.3, 0.75, 0.22);
    const stripe = mesh(new THREE.SphereGeometry(0.1, 32, 16), std('#f2f2f2', 0.2, 0.35), g); stripe.position.set(0.17, 0.84, s * 0.158); stripe.scale.set(1.35, 0.12, 0.08); stripe.rotation.z = 0.12;
  }
  const sk = { yt: [0.82, 0.86, 0.872, 0.868, 0.85, 0.82], yb: [0.765, 0.755, 0.752, 0.752, 0.752, 0.762], w: [0.085, 0.13, 0.145, 0.145, 0.135, 0.11] };
  const ssecs = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, yt = smooth(sk.yt, u), yb = smooth(sk.yb, u);
    ssecs.push({ x: -0.68 + 0.6 * u, yc: (yt + yb) / 2, h: (yt - yb) / 2, w: smooth(sk.w, u) });
  }
  const seatTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { c.fillStyle = rnd() > 0.5 ? '#8a8a8a' : '#767676'; c.fillRect(rnd() * w, rnd() * h, 2, 2); } }, [6, 6], false);
  mesh(loft(ssecs, 40, 3.2), std('#1b1b1d', 0, 0.62, { bumpMap: seatTex, bumpScale: 0.6 }), g);
  for (const s of [-1, 1]) {
    const sp = shapeOf([[-0.08, 0.72], [-0.36, 0.745], [-0.42, 0.64], [-0.3, 0.55], [-0.12, 0.56], [-0.06, 0.64]]);
    const panel = mesh(new THREE.ExtrudeGeometry(sp, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 3 }), MAT.paint, g);
    panel.position.z = s * 0.115 - 0.005;
    const tail = shapeOf([[-0.45, 0.745], [-0.78, 0.79], [-0.79, 0.75], [-0.48, 0.70]]);
    const tp = mesh(new THREE.ExtrudeGeometry(tail, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.005, bevelSegments: 3 }), MAT.paint, g);
    tp.position.z = s * 0.1 - 0.004;
    const rail = tube([[-0.42, 0.79, s * 0.12], [-0.58, 0.81, s * 0.12], [-0.7, 0.81, s * 0.09], [-0.74, 0.8, 0]], 0.009, MAT.chrome, g, 24);
  }
  const tl = mesh(new THREE.BoxGeometry(0.05, 0.05, 0.13), std('#d0141c', 0.1, 0.25, { emissive: '#7a0008', emissiveIntensity: 1 }), g); tl.position.set(-0.8, 0.77, 0);
  const plate = mesh(new THREE.BoxGeometry(0.006, 0.1, 0.18), std('#f4f4ef', 0, 0.5), g); plate.position.set(-0.86, 0.64, 0); plate.rotation.z = 0.15;
  const plateRim = mesh(new THREE.BoxGeometry(0.004, 0.11, 0.19), MAT.black, g); plateRim.position.set(-0.857, 0.64, 0); plateRim.rotation.z = 0.15;
  const rmg = mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.12, 32, 1, true, Math.PI - 0.15, 1.5), MAT.black, g);
  rmg.rotation.x = Math.PI / 2; rmg.position.set(BK.RA[0], BK.RA[1], 0);
  for (const s of [-1, 1]) { const ind = mesh(new THREE.SphereGeometry(0.02, 14, 10), std('#ffa21a', 0.1, 0.3), g); ind.position.set(-0.78, 0.74, s * 0.15); ind.scale.set(1.5, 0.8, 0.8); }

  // --- exhaust: header from the port, under the engine, to the silencer on the right
  const port = toW(E.portE.x, E.portE.y, 0);
  const hdr = [[port.x, port.y, 0.0], [port.x + 0.04, port.y - 0.015, 0.012], [0.225, 0.43, 0.05], [0.215, 0.33, 0.085], [0.15, 0.24, 0.105], [0.0, 0.215, 0.125], [-0.18, 0.25, 0.15], [-0.3, 0.3, 0.165]];
  const header = tube(hdr, 0.017, MAT.chrome, g, 80);
  const sA = v3(-0.3, 0.3, 0.165), sB = v3(-0.86, 0.43, 0.165);
  const sd = sB.clone().sub(sA), SL = sd.length();
  const sil = mesh(lathe([[0.018, 0], [0.045, 0.06], [0.052, 0.12], [0.052, SL - 0.06], [0.044, SL - 0.01], [0.026, SL], [0.016, SL + 0.03], [0.012, SL + 0.03]], 40), std('#2a2b2e', 0.75, 0.32), g);
  sil.position.copy(sA); sil.quaternion.setFromUnitVectors(v3(0, 1, 0), sd.clone().normalize());
  const guard = mesh(new THREE.CylinderGeometry(0.058, 0.058, SL * 0.55, 32, 1, true, -0.4, 2.6), MAT.chrome, g);
  guard.position.copy(sA).addScaledVector(sd, 0.45); guard.quaternion.setFromUnitVectors(v3(0, 1, 0), sd.clone().normalize());
  const tipW = sA.clone().addScaledVector(sd.clone().normalize(), SL + 0.03);
  const shield = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 24, 1, true, 0, 2.4), std('#1d1e20', 0.6, 0.5), g);
  shield.position.set(0.21, 0.36, 0.09); shield.rotation.z = -0.25;

  // --- air filter box, battery box, footpegs, stand, brake pedal
  const airbox = mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), MAT.black, g); airbox.position.set(-0.32, 0.6, 0);
  const inTail = toW(-0.19, 0.222, 0);
  tube([[inTail.x, inTail.y, 0], [inTail.x - 0.05, inTail.y + 0.03, 0], [-0.26, 0.58, 0]], 0.02, MAT.rubber, g, 16);
  for (const s of [-1, 1]) {
    rod(v3(-0.04, 0.29, s * 0.09), v3(-0.04, 0.29, s * 0.25), 0.011, MAT.darkSteel, g, 10);
    rod(v3(-0.04, 0.29, s * 0.19), v3(-0.04, 0.29, s * 0.26), 0.016, MAT.rubber, g, 12);
    rod(v3(-0.17, 0.26, s * 0.08), v3(-0.25, 0.0, s * 0.15), 0.011, MAT.frame, g, 10);
    rod(v3(-0.30, 0.004, s * 0.15), v3(-0.2, 0.004, s * 0.15), 0.012, MAT.frame, g, 10);
    rod(v3(-0.05, 0.0, s * 0.03), v3(-0.05, 0.0, s * 0.03), 0.001, MAT.frame, g, 4);
  }
  rod(v3(-0.17, 0.26, -0.08), v3(-0.17, 0.26, 0.08), 0.012, MAT.frame, g, 10);
  tube([[0.0, 0.31, 0.12], [0.08, 0.27, 0.13], [0.14, 0.25, 0.14]], 0.007, MAT.darkSteel, g, 12);
  tube([[0.0, 0.31, -0.12], [0.08, 0.31, -0.13], [0.12, 0.33, -0.13]], 0.006, MAT.darkSteel, g, 12);

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { group: g, rear, front, chain, plates, rollers, nLinks, header: header.userData.curve, sA, sB, tipW, tank };
}
